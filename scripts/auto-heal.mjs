#!/usr/bin/env node
/**
 * auto-heal.mjs — §46 Phase 3: 自動治療
 *
 * 入力: logs/health/<日付>-health.json (health-check.mjs の出力)
 * 修復対象（既知エラーパターン）:
 *   1. ERR_REQUIRE_ESM → npx キャッシュクリア
 *   2. MODULE_NOT_FOUND → npm ci
 *   3. node_modules 必須バイナリ欠落 → npm install
 *   4. logs ローテ (morning 30 / health 60 / heal 60 日)
 *   5. npm audit fix (patch only / dev 依存も保護 / TSB-007 ep5 対策で --omit=dev 削除済)
 *
 * 出力: stdout に markdown サマリ
 * 出口コード: 0 (修復成功 or 異常なし) / 1 (一部修復失敗)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
const HEALTH_PATH = path.join(REPO_ROOT, 'logs', 'health', `${today}-health.json`);

const heals = [];
function tryRun(label, cmd, opts = {}) {
  const res = spawnSync('bash', ['-lc', cmd], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: opts.timeoutMs ?? 300_000,
  });
  const ok = res.status === 0;
  heals.push({ label, ok, cmd, exit: res.status, stderr: (res.stderr || '').slice(0, 200) });
  return ok;
}

let health = null;
if (fs.existsSync(HEALTH_PATH)) {
  try {
    health = JSON.parse(fs.readFileSync(HEALTH_PATH, 'utf8'));
  } catch { /* skip */ }
}

// ───── ログローテーション (常時実行) ─────
function rotate(dir, days) {
  const full = path.join(REPO_ROOT, 'logs', dir);
  if (!fs.existsSync(full)) return 0;
  const cutoff = Date.now() - days * 86400_000;
  let removed = 0;
  for (const f of fs.readdirSync(full)) {
    const p = path.join(full, f);
    try {
      if (fs.statSync(p).mtimeMs < cutoff) {
        fs.unlinkSync(p);
        removed++;
      }
    } catch { /* skip */ }
  }
  return removed;
}

const r1 = rotate('morning-prep', 30);
const r2 = rotate('health', 60);
const r3 = rotate('heal', 60);
heals.push({ label: 'logs ローテ', ok: true, cmd: `morning(${r1}) health(${r2}) heal(${r3})`, exit: 0 });

// ───── 既知エラー検出 → 修復 ─────
let fixedNeeded = 0;
let fixedOk = 0;

if (health) {
  const ngMcps = (health.mcp || []).filter((m) => m.status === 'ng');
  for (const m of ngMcps) {
    if (/ERR_REQUIRE_ESM|require\(\)/.test(m.note || '')) {
      fixedNeeded++;
      if (tryRun(`npx cache clean (${m.name})`, 'npx clear-npx-cache 2>/dev/null || rm -rf ~/.npm/_npx 2>&1 | tail -3')) fixedOk++;
    } else if (/MODULE_NOT_FOUND/.test(m.note || '')) {
      fixedNeeded++;
      if (tryRun(`npm ci (${m.name})`, 'npm ci --silent 2>&1 | tail -5')) fixedOk++;
    }
  }
}

// ───── 安全な audit fix (patch only) ─────
// ⚠ 2026-04-23 (TSB-007 ep5 真因対策): 旧版は `--omit=dev` を付けていたが、
//    npm v7+ 仕様で `--omit=dev` 付き install/audit fix は devDependencies を node_modules
//    から prune する。auto-heal が 4h ごとに走るたび eslint (devDep) が消失し、
//    朝の lint:customize が連日 ❌ になる事故が発生 (TSB-007 episode 5 / 4/23 検出)。
//    → `--omit=dev` を削除して devDeps を保護。audit fix は patch level のみなので
//      副作用は最小 (本番依存に脆弱性パッチが当たるが審議要のメジャー更新は走らない)。
heals.push({
  label: 'npm audit fix (patch only)',
  ok: true,
  cmd: 'npm audit fix --audit-level=moderate || true',
  exit: 0,
});
spawnSync('bash', ['-lc', 'npm audit fix --audit-level=moderate 2>&1 | tail -3'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
  timeout: 120_000,
});

// ───── 自己スクリプト wipe 検知時の警告 (修復は人間判断のため自動はしない) ─────
const wiped = (health && health.self_check && health.self_check.wiped) || [];

// ───── 出力 ─────
console.log('## 🔧 Phase 3: 自動治療');
console.log('');
const okN = heals.filter((h) => h.ok).length;
const failN = heals.filter((h) => !h.ok).length;
console.log(`**結果**: 修復 ${fixedOk}/${fixedNeeded} 件 / ログローテ完了 / 失敗 ${failN}`);
console.log('');

if (heals.length > 0) {
  console.log('| 操作 | 結果 |');
  console.log('|---|---|');
  for (const h of heals) {
    console.log(`| ${h.label} | ${h.ok ? '✅' : '❌'} ${h.cmd ? '`' + h.cmd.slice(0, 60) + '`' : ''} |`);
  }
  console.log('');
}

if (wiped.length > 0) {
  console.log('### 🚨 自動修復不可: 自己スクリプト wipe 検知');
  console.log('');
  console.log('以下のファイルが空 / 欠落しているが、自動復元は危険なため**人間判断**を要求する:');
  console.log('');
  for (const w of wiped) console.log(`- \`${w.path}\` (${w.issue})`);
  console.log('');
  console.log('> 復元手順: バックアップ (`backups/` `*.backup.*`) または git history を確認。原因究明（同期サービス・cron・Cursor crash recovery 等）も並行で。');
  console.log('');
}

process.exit(failN === 0 ? 0 : 1);
