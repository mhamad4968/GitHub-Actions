#!/usr/bin/env node
/**
 * check-node-modules.mjs — §46 Phase 2 サブチェック: node_modules 完全性検証
 *
 * 検査内容:
 * 1. package.json の dependencies / devDependencies の各パッケージが node_modules/<pkg>/package.json として存在するか
 * 2. インストール済みバージョンが package.json の semver 範囲（^ / ~ / >= 等）に収まっているか
 * 3. critical bins (eslint, vite 等) が node_modules/.bin/ に存在するか
 *
 * 出力:
 *   - stdout に markdown サマリ（朝ブリーフィングに埋込み想定）
 *   - --json フラグで JSON のみ
 *
 * 出口コード:
 *   - 0: 異常なし
 *   - 1: 1 件以上の異常（欠損 or バージョン不一致）
 *   - 2: 構造的問題（package.json が読めない等）
 *
 * 背景: TSB-007 episode 3 (2026-04-22 夜 / eslint v9.39.4 ダウングレード後に node_modules/eslint が消失していたが
 *       誰も気付かず lint:customize が再失敗 → health-check.mjs の self_check は scripts/ と AGENTS.md だけ見て
 *       node_modules/ を見ていなかった設計穴の補完）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const ARG_JSON = process.argv.includes('--json');

// 必須 bin 一覧（消えていたら lint:customize / build 等が即死するもの）
const CRITICAL_BINS = ['eslint'];

function out(msg) { if (!ARG_JSON) console.log(msg); }

function parseSemverRange(range) {
  // ^1.2.3 / ~1.2.3 / >=1.2.3 / 1.2.3 を最低限サポート
  // 戻り値: { op: '^'|'~'|'>='|'='|'>'|'<', major, minor, patch }
  const m = String(range).trim().match(/^(\^|~|>=|<=|>|<|=)?(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return {
    op: m[1] || '=',
    major: Number(m[2]), minor: Number(m[3]), patch: Number(m[4]),
  };
}

function parseVersion(v) {
  const m = String(v).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function satisfies(installed, range) {
  if (!installed || !range) return false;
  const cmp = (a, b) => (a.major - b.major) || (a.minor - b.minor) || (a.patch - b.patch);
  switch (range.op) {
    case '^':
      // ^1.2.3 := >=1.2.3 <2.0.0
      return installed.major === range.major && cmp(installed, range) >= 0;
    case '~':
      // ~1.2.3 := >=1.2.3 <1.3.0
      return installed.major === range.major && installed.minor === range.minor && cmp(installed, range) >= 0;
    case '>=': return cmp(installed, range) >= 0;
    case '<=': return cmp(installed, range) <= 0;
    case '>':  return cmp(installed, range) > 0;
    case '<':  return cmp(installed, range) < 0;
    case '=':
    default:   return cmp(installed, range) === 0;
  }
}

// ───── package.json 読込 ─────
const pkgPath = path.join(REPO_ROOT, 'package.json');
if (!fs.existsSync(pkgPath)) {
  if (ARG_JSON) console.log(JSON.stringify({ status: 'fatal', error: 'package.json not found' }));
  else out('## 📦 node_modules 完全性チェック\n\n❌ FATAL: package.json not found');
  process.exit(2);
}

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (e) {
  if (ARG_JSON) console.log(JSON.stringify({ status: 'fatal', error: `parse error: ${e.message}` }));
  else out(`## 📦 node_modules 完全性チェック\n\n❌ FATAL: package.json parse error: ${e.message}`);
  process.exit(2);
}

const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const depResults = [];
let ngCount = 0;

for (const [name, range] of Object.entries(deps)) {
  const pkgJsonPath = path.join(REPO_ROOT, 'node_modules', name, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    depResults.push({ name, range, installed: null, status: 'missing', note: 'node_modules/<pkg>/package.json 不在' });
    ngCount++;
    continue;
  }
  let inner;
  try {
    inner = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  } catch (e) {
    depResults.push({ name, range, installed: null, status: 'corrupt', note: `parse error: ${e.message}` });
    ngCount++;
    continue;
  }
  const installed = inner.version;
  const r = parseSemverRange(range);
  const v = parseVersion(installed);
  if (!r || !v) {
    depResults.push({ name, range, installed, status: 'unparseable', note: '範囲またはバージョンを解釈できず（手動確認）' });
    continue;
  }
  if (!satisfies(v, r)) {
    depResults.push({ name, range, installed, status: 'mismatch', note: `期待: ${range} / 実際: ${installed}` });
    ngCount++;
  } else {
    depResults.push({ name, range, installed, status: 'ok', note: '' });
  }
}

// ───── critical bins ─────
const binResults = [];
for (const bin of CRITICAL_BINS) {
  const binPath = path.join(REPO_ROOT, 'node_modules', '.bin', bin);
  if (!fs.existsSync(binPath)) {
    binResults.push({ bin, status: 'missing' });
    ngCount++;
  } else {
    binResults.push({ bin, status: 'ok' });
  }
}

const result = {
  generated_at: new Date().toISOString(),
  repo_root: REPO_ROOT,
  total_deps: Object.keys(deps).length,
  ng_count: ngCount,
  status: ngCount === 0 ? 'ok' : 'ng',
  recommended_action: ngCount === 0 ? null : 'npm ci',
  deps: depResults,
  bins: binResults,
};

if (ARG_JSON) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(ngCount === 0 ? 0 : 1);
}

// ───── markdown 出力 ─────
out('## 📦 node_modules 完全性チェック');
out('');
out(`**結果**: ${ngCount === 0 ? '✅ 異常なし' : `❌ 異常 ${ngCount} 件`} （依存 ${Object.keys(deps).length} 件 / critical bin ${CRITICAL_BINS.length} 件 検査）`);
out('');

const ngs = depResults.filter((r) => r.status !== 'ok');
if (ngs.length > 0) {
  out('### 依存パッケージ異常');
  out('');
  out('| パッケージ | 期待 | 実際 | 状態 | 備考 |');
  out('|---|---|---|---|---|');
  for (const r of ngs) {
    const icon = { missing: '❌', corrupt: '💥', mismatch: '⚠', unparseable: '❓' }[r.status] || '?';
    out(`| \`${r.name}\` | ${r.range} | ${r.installed || '(なし)'} | ${icon} ${r.status} | ${r.note} |`);
  }
  out('');
}

const binNgs = binResults.filter((r) => r.status !== 'ok');
if (binNgs.length > 0) {
  out('### Critical bin 欠損');
  out('');
  out('| bin | 状態 |');
  out('|---|---|');
  for (const r of binNgs) out(`| \`node_modules/.bin/${r.bin}\` | ❌ ${r.status} |`);
  out('');
}

if (ngCount > 0) {
  out('### 推奨アクション');
  out('');
  out('```bash');
  out('npm ci');
  out('```');
  out('');
  out('> Phase 3 auto-heal で自動実行される予定（AGENTS.md §46 / 改善案 #6 / R16）');
  out('');
}

process.exit(ngCount === 0 ? 0 : 1);
