#!/usr/bin/env node
/**
 * check-proposals.mjs — proposal 事前検証 (4/23 朝 cron 失敗予防)
 *
 * 検査内容:
 *   docs/approved-changes/<日付>/*.proposal.json を読み込み:
 *   - type=string_replace: target ファイル内に old_string が 1 件マッチするか
 *   - type=file_write: target ファイルが既存していないか
 *   - type=run_command: command が ALLOW_COMMANDS に該当するか (簡易チェック)
 *
 * 入力:
 *   - --date=YYYY-MM-DD : 検査対象の日付 (省略時 = 明日 = JST)
 *   - --json : JSON のみ出力
 *
 * 出口コード:
 *   - 0: 全 proposal OK
 *   - 1: 1 件以上の異常
 *   - 2: 構造的問題 (対象ディレクトリ不在 等)
 *
 * 用途: 夕反省で proposal を作成した直後に手動実行 / 朝 cron 実行直前にも自動実行
 *
 * 背景: 2026-04-22 R13 半角→全角 () バグ事件
 *   - a748eef で R13 proposal 作成時、old_string で半角 () を指定 (AGENTS.md は全角 （）)
 *   - 4/23 朝 cron で「old_string 不一致」失敗確定だった
 *   - 並行 Cursor チャットが偶然発見 → 68d1765 で fix
 *   - 4/22 朝 cron でも R9 が同型バグで 1 件失敗
 *   - 本スクリプト導入で同型ミスを「事前検証」で 100% 検知可能化
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');

const args = process.argv.slice(2);
const ARG_JSON = args.includes('--json');
const dateArg = args.find((a) => a.startsWith('--date='));
const targetDate = dateArg
  ? dateArg.slice('--date='.length)
  : (() => {
      // 明日 (JST)
      const t = new Date(Date.now() + 24 * 3600 * 1000);
      const jstStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(t);
      return jstStr;
    })();

const TARGET_DIR = path.join(REPO_ROOT, 'docs', 'approved-changes', targetDate);

function out(msg) { if (!ARG_JSON) console.log(msg); }

// run_command 用 (apply-approved-changes.mjs と同期)
const ALLOW_COMMANDS = [
  'npm run lint',
  'npm run lint:customize',
  'npm audit fix',
  'npm install ',
  'npm update ',
  'npm ci',
  'node scripts/',
  'npx ',
  'cp ',
];

if (!fs.existsSync(TARGET_DIR)) {
  if (ARG_JSON) console.log(JSON.stringify({ status: 'skip', date: targetDate, reason: 'directory not found' }));
  else out(`## 📋 proposal 事前検証: ${targetDate}\n\n_(対象ディレクトリ不在 = 検査対象なし)_`);
  process.exit(0);
}

const files = fs.readdirSync(TARGET_DIR)
  .filter((f) => f.endsWith('.proposal.json'))
  .sort();

if (files.length === 0) {
  if (ARG_JSON) console.log(JSON.stringify({ status: 'skip', date: targetDate, reason: 'no proposals' }));
  else out(`## 📋 proposal 事前検証: ${targetDate}\n\n_(対象 proposal なし)_`);
  process.exit(0);
}

const results = [];

for (const f of files) {
  const id = f.replace(/\.proposal\.json$/, '');
  const fullSrc = path.join(TARGET_DIR, f);

  let proposal;
  try {
    proposal = JSON.parse(fs.readFileSync(fullSrc, 'utf8'));
  } catch (e) {
    results.push({ id, status: 'fail', reason: `JSON parse error: ${e.message}` });
    continue;
  }

  if (proposal.type === 'string_replace') {
    const target = path.join(REPO_ROOT, proposal.target || '');
    if (!fs.existsSync(target)) {
      results.push({ id, status: 'fail', reason: `target ファイル不在: ${proposal.target}` });
      continue;
    }
    const txt = fs.readFileSync(target, 'utf8');
    const occurrences = txt.split(proposal.old_string || '').length - 1;
    if (occurrences === 0) {
      results.push({ id, status: 'fail', reason: `old_string が target に存在しない (R9/R13 同型バグの予兆)` });
    } else if (occurrences > 1 && !proposal.replace_all) {
      results.push({ id, status: 'warn', reason: `old_string が ${occurrences} 件マッチ。replace_all を明示せよ` });
    } else {
      results.push({ id, status: 'ok', reason: `1 件マッチ` });
    }
  } else if (proposal.type === 'file_write') {
    const target = path.join(REPO_ROOT, proposal.target || '');
    if (fs.existsSync(target)) {
      results.push({ id, status: 'fail', reason: `既存ファイル: ${proposal.target} (file_write は新規作成専用)` });
    } else {
      results.push({ id, status: 'ok', reason: `新規作成 OK: ${proposal.target}` });
    }
  } else if (proposal.type === 'run_command') {
    const cmd = String(proposal.command || '');
    const allowed = ALLOW_COMMANDS.some((a) => cmd.includes(a));
    if (!allowed) {
      results.push({ id, status: 'fail', reason: `ALLOW_COMMANDS に該当しない: ${cmd.slice(0, 60)}` });
    } else {
      results.push({ id, status: 'ok', reason: `command OK` });
    }
  } else if (proposal.manual_only || proposal.category === 'K') {
    results.push({ id, status: 'manual', reason: `${proposal.category === 'K' ? 'K カテゴリ' : 'manual_only'} = 自動禁止` });
  } else {
    results.push({ id, status: 'fail', reason: `未対応 type: ${proposal.type}` });
  }
}

const okN = results.filter((r) => r.status === 'ok').length;
const failN = results.filter((r) => r.status === 'fail').length;
const warnN = results.filter((r) => r.status === 'warn').length;
const manualN = results.filter((r) => r.status === 'manual').length;

const summary = {
  date: targetDate,
  total: results.length,
  ok: okN,
  fail: failN,
  warn: warnN,
  manual: manualN,
  status: failN === 0 ? 'ok' : 'ng',
  results,
};

if (ARG_JSON) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(failN === 0 ? 0 : 1);
}

out(`## 📋 proposal 事前検証: ${targetDate}`);
out('');
out(`**${results.length} 件検査**: ✅ ${okN} OK / ❌ ${failN} 異常 / ⚠ ${warnN} 警告 / 📝 ${manualN} 手動`);
out('');
out('| ID | 結果 | 理由 |');
out('|---|---|---|');
for (const r of results) {
  const icon = { ok: '✅', fail: '❌', warn: '⚠', manual: '📝' }[r.status] || '?';
  out(`| ${r.id} | ${icon} | ${r.reason} |`);
}

if (failN > 0) {
  out('');
  out('### 推奨アクション');
  out('');
  out('❌ がある場合、朝 cron で同件数の失敗確定。**今のうちに proposal を修正**して再検証する。');
  out('');
  out('```bash');
  out(`node scripts/check-proposals.mjs --date=${targetDate}`);
  out('```');
  out('');
}

process.exit(failN === 0 ? 0 : 1);
