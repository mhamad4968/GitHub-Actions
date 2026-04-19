#!/usr/bin/env node
/**
 * apply-approved-changes.mjs — 夕反省で承認された proposal を朝に自動適用（§44）
 *
 * 入力: docs/approved-changes/<今日の日付>/*.proposal.json
 * 出力: stdout に「## 📋 昨夜承認分の自動実施結果」markdown
 * 副作用: 適用済み proposal は docs/approved-changes/processed/<日付>/ へ移動
 *
 * proposal タイプ:
 *   - run_command: ALLOW_COMMANDS にマッチするコマンドを実行
 *   - string_replace: 既存ファイル内の文字列置換
 *   - file_write: 新規ファイル作成（target が存在しないこと）
 *
 * 安全装置:
 *   - K カテゴリ（kintone API 操作）と manual_only フラグは自動禁止
 *   - DENY_COMMANDS（deploy/purge/reset/clear:*:apply 等）は実行拒否
 *   - 1 日 25 件上限（K と manual_only はカウント外）
 *   - 重複ガード: processed/<日付>/<id> が既存なら skip
 *   - 全ての変更前に target ファイルのタイムスタンプ付きバックアップ
 *
 * 出口コード: 常に 0（朝ブリーフィングを止めない）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const APPROVED_ROOT = path.join(REPO_ROOT, 'docs', 'approved-changes');

const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const TODAY_DIR = path.join(APPROVED_ROOT, today);
const PROCESSED_DIR = path.join(APPROVED_ROOT, 'processed', today);

const MAX_DAILY = 25;
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
const DENY_COMMANDS = [
  'npm run deploy',
  'npm run purge',
  'npm run reset',
  'npm run clear',
  'npm run sync:595',
  'npm run ops-guide:publish',
  'rm -rf ',
  '> ',
  'curl ',
  'wget ',
];

if (!fs.existsSync(TODAY_DIR)) {
  console.log('## 📋 昨夜承認分の自動実施結果');
  console.log('');
  console.log('_(承認済み案件なし)_');
  process.exit(0);
}

fs.mkdirSync(PROCESSED_DIR, { recursive: true });

const files = fs.readdirSync(TODAY_DIR)
  .filter((f) => f.endsWith('.proposal.json'))
  .sort();

if (files.length === 0) {
  console.log('## 📋 昨夜承認分の自動実施結果');
  console.log('');
  console.log('_(承認済み案件なし)_');
  process.exit(0);
}

const results = [];
let countedTotal = 0;

function ok(s) { return { ok: true, msg: s }; }
function ng(s) { return { ok: false, msg: s }; }

function isDenied(cmd) {
  return DENY_COMMANDS.some((d) => cmd.includes(d));
}
function isAllowed(cmd) {
  return ALLOW_COMMANDS.some((a) => cmd.includes(a));
}

function tsBackupSuffix() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

for (const f of files) {
  const id = f.replace(/\.proposal\.json$/, '');
  const fullSrc = path.join(TODAY_DIR, f);
  const fullDst = path.join(PROCESSED_DIR, f);

  // 重複ガード
  if (fs.existsSync(fullDst)) {
    results.push({ id, status: 'skip', note: '既に適用済み（processed に存在）' });
    continue;
  }

  let proposal;
  try {
    proposal = JSON.parse(fs.readFileSync(fullSrc, 'utf8'));
  } catch (e) {
    results.push({ id, status: 'fail', note: `JSON parse error: ${e.message}` });
    continue;
  }

  const cat = proposal.category || '?';
  const isCounted = cat !== 'K' && !proposal.manual_only;

  if (isCounted && countedTotal >= MAX_DAILY) {
    results.push({ id, status: 'skip', note: `日次上限 ${MAX_DAILY} に到達` });
    continue;
  }

  if (cat === 'K' || proposal.manual_only) {
    results.push({
      id,
      status: 'manual',
      note: `${cat === 'K' ? 'K カテゴリ' : 'manual_only'} は自動禁止。手順案内のみ`,
    });
    fs.renameSync(fullSrc, fullDst);
    continue;
  }

  let r;
  if (proposal.type === 'run_command') {
    const cmd = String(proposal.command || '');
    if (isDenied(cmd)) r = ng(`DENY_COMMANDS にマッチ: ${cmd.slice(0, 60)}`);
    else if (!isAllowed(cmd)) r = ng(`ALLOW_COMMANDS に該当しない: ${cmd.slice(0, 60)}`);
    else {
      const res = spawnSync('bash', ['-lc', cmd], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        timeout: 600_000,
      });
      r = res.status === 0
        ? ok(`exit=0 / stdout=${(res.stdout || '').length}B`)
        : ng(`exit=${res.status} / stderr=${(res.stderr || '').slice(0, 200)}`);
    }
  } else if (proposal.type === 'string_replace') {
    const target = path.join(REPO_ROOT, proposal.target);
    if (!fs.existsSync(target)) r = ng(`target なし: ${proposal.target}`);
    else {
      const txt = fs.readFileSync(target, 'utf8');
      if (!txt.includes(proposal.old_string)) r = ng(`old_string 不一致`);
      else {
        const occurrences = txt.split(proposal.old_string).length - 1;
        if (occurrences > 1 && !proposal.replace_all) {
          r = ng(`old_string が ${occurrences} 件マッチ。replace_all を明示せよ`);
        } else {
          fs.copyFileSync(target, `${target}.backup.${tsBackupSuffix()}`);
          const newTxt = proposal.replace_all
            ? txt.split(proposal.old_string).join(proposal.new_string)
            : txt.replace(proposal.old_string, proposal.new_string);
          fs.writeFileSync(target, newTxt, 'utf8');
          r = ok(`置換完了 (${occurrences} 件)`);
        }
      }
    }
  } else if (proposal.type === 'file_write') {
    const target = path.join(REPO_ROOT, proposal.target);
    if (fs.existsSync(target)) r = ng(`既存ファイル: ${proposal.target}`);
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, proposal.content || '', 'utf8');
      r = ok(`新規作成: ${proposal.target}`);
    }
  } else {
    r = ng(`未対応 type: ${proposal.type}`);
  }

  if (r.ok && isCounted) countedTotal++;
  results.push({ id, status: r.ok ? 'ok' : 'fail', note: r.msg });
  fs.renameSync(fullSrc, fullDst);
}

console.log('## 📋 昨夜承認分の自動実施結果');
console.log('');
const okN = results.filter((r) => r.status === 'ok').length;
const failN = results.filter((r) => r.status === 'fail').length;
const skipN = results.filter((r) => r.status === 'skip').length;
const manualN = results.filter((r) => r.status === 'manual').length;
console.log(`**${results.length} 件処理**: ✅ ${okN} 適用 / ❌ ${failN} 失敗 / ⏭ ${skipN} スキップ / 📝 ${manualN} 手動`);
console.log('');
console.log('| ID | 状態 | 備考 |');
console.log('|---|---|---|');
for (const r of results) {
  const icon = { ok: '✅', fail: '❌', skip: '⏭', manual: '📝' }[r.status] || '?';
  console.log(`| ${r.id} | ${icon} | ${r.note} |`);
}

process.exit(0);
