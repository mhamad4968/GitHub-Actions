#!/usr/bin/env node
/**
 * wipe-guard.mjs — 定期ヘルスチェック + 自動復元
 *
 * 目的:
 *   - 15 分ごとに重要ファイルが空 / 欠落していないか確認
 *   - 検知時は ~/.cursor-emergency-backup/ から自動復元
 *   - 全行動を logs/wipe-guard/<日付>.log に記録
 *
 * 推奨運用:
 *   crontab に以下を追加（行頭は分・時・日・月・曜日）:
 *     [分:0,15,30,45] [時:*] [日:*] [月:*] [曜:*] cd /home/mhamada202408224/kintone-ai-lab && node scripts/wipe-guard.mjs >> logs/wipe-guard/cron.log 2>&1
 *
 * 出口コード:
 *   0: 異常なし
 *   1: 異常検知し復元成功
 *   2: 異常検知し復元失敗（要人間判断）
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const EMERGENCY_BACKUP = path.join(os.homedir(), '.cursor-emergency-backup');
const BACKUPS_ROOT = path.join(REPO_ROOT, 'backups');
const LOG_DIR = path.join(REPO_ROOT, 'logs', 'wipe-guard');
fs.mkdirSync(LOG_DIR, { recursive: true });

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
const LOG = path.join(LOG_DIR, `${today}.log`);

const CRITICAL = [
  'AGENTS.md',
  'CLAUDE.md',
  'WORKFLOW.md',
  'RULES-INDEX.md',
  'kintone-apps.md',
  'scripts/daily-morning-prep.mjs',
  'scripts/health-check.mjs',
  'scripts/auto-heal.mjs',
  'scripts/version-up.mjs',
  'scripts/apply-approved-changes.mjs',
  'scripts/evening-reflect.mjs',
  'scripts/audit-rules.mjs',
  'scripts/scan-plans.mjs',
  'scripts/skysea-recon.mjs',
  'scripts/file-watcher.mjs',
  'scripts/wipe-guard.mjs',
  'scripts/emergency-mirror.mjs',
  'scripts/restore-wiped.mjs',
  'docs/troubleshooting.md',
  'chat-sessions/checkpoint-latest.md',
  'chat-sessions/NEW-SESSION-STARTER.md',
  'chat-sessions/SESSION-SPLIT-REMINDER.md',
  'chat-sessions/SESSION-CLOCK.md',
  'scripts/mandatory-read-gate.mjs',
  'scripts/session-clock.mjs',
];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  fs.appendFileSync(LOG, line + '\n');
  console.log(line);
}

// S4 (2026-04-20): notify.log に集約。朝ブリーフィングで参照される。
// 異常検知 + 復元成功 = [INFO] / 復元失敗 = [ALERT]
const NOTIFY_LOG = path.join(LOG_DIR, 'notify.log');
function notify(level, msg) {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
  try { fs.appendFileSync(NOTIFY_LOG, line + '\n'); } catch (_) { /* noop */ }
}

function findLatestWorkspaceBackup(rel) {
  if (!fs.existsSync(BACKUPS_ROOT)) return null;
  const dirs = fs.readdirSync(BACKUPS_ROOT)
    .filter((d) => /^\d{4}-\d{2}-\d{2}-\d{6}$/.test(d))
    .sort()
    .reverse();
  for (const d of dirs) {
    const candidate = path.join(BACKUPS_ROOT, d, rel);
    if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
      return { source: 'workspace', path: candidate, snapshot: d };
    }
  }
  return null;
}

function findEmergencyMirror(rel) {
  const candidate = path.join(EMERGENCY_BACKUP, rel);
  if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
    return { source: 'emergency-mirror', path: candidate };
  }
  return null;
}

function attemptRestore(rel) {
  // 優先順位: 1) emergency-mirror（最新）, 2) workspace backup（時刻順最新）
  const candidates = [findEmergencyMirror(rel), findLatestWorkspaceBackup(rel)].filter(Boolean);
  if (candidates.length === 0) return { ok: false, reason: '復元元なし' };
  const src = candidates[0];
  const dst = path.join(REPO_ROOT, rel);
  try {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src.path, dst);
    return { ok: true, source: src.source, sourcePath: src.path, snapshot: src.snapshot };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

const issues = [];
for (const rel of CRITICAL) {
  const full = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) {
    issues.push({ rel, issue: 'missing' });
  } else if (fs.statSync(full).size === 0) {
    issues.push({ rel, issue: 'empty (0 bytes)' });
  }
}

if (issues.length === 0) {
  log(`✅ 異常なし (${CRITICAL.length} ファイル健在)`);
  process.exit(0);
}

log(`🚨 異常検知 ${issues.length} 件:`);
for (const i of issues) log(`  - ${i.rel}: ${i.issue}`);
notify('INFO', `異常検知 ${issues.length} 件: ${issues.map((i) => i.rel).join(', ').slice(0, 200)}`);

let restoredOk = 0;
let restoredFail = 0;
for (const i of issues) {
  const r = attemptRestore(i.rel);
  if (r.ok) {
    restoredOk++;
    log(`  ✅ 復元成功: ${i.rel} ← ${r.source}${r.snapshot ? ` (${r.snapshot})` : ''}`);
    notify('INFO', `復元成功: ${i.rel} ← ${r.source}${r.snapshot ? ` (${r.snapshot})` : ''}`);
  } else {
    restoredFail++;
    log(`  ❌ 復元失敗: ${i.rel}: ${r.reason}`);
    notify('ALERT', `復元失敗: ${i.rel}: ${r.reason}`);
  }
}

log(`📊 結果: 復元成功 ${restoredOk} / 失敗 ${restoredFail}`);

if (restoredFail > 0) {
  log('⚠️ 復元失敗ファイルがあります。バックアップ元を確認してください。');
  notify('ALERT', `復元失敗 ${restoredFail} 件 / 成功 ${restoredOk} 件 - 朝のブリーフィングで詳細確認`);
  process.exit(2);
}

process.exit(restoredOk > 0 ? 1 : 0);
