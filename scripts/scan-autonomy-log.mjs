#!/usr/bin/env node
/**
 * scan-autonomy-log.mjs — 前日分 logs/autonomy-decisions.log を集計（朝ブリーフィング用 / E2）
 *
 * 使い方:
 *   node scripts/scan-autonomy-log.mjs
 *   node scripts/scan-autonomy-log.mjs --date=2026-04-24
 *
 * 出口コード: 常に 0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const LOG_PATH = path.join(REPO_ROOT, 'logs', 'autonomy-decisions.log');

function isoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const argDate = process.argv.find((a) => a.startsWith('--date='))?.slice('--date='.length);
const targetIso =
  argDate && /^\d{4}-\d{2}-\d{2}$/.test(argDate)
    ? argDate
    : (() => {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return isoDate(y);
      })();

if (!fs.existsSync(LOG_PATH)) {
  console.log('### 🤖 自律判断ログ（前日スキャン）\n\n_(logs/autonomy-decisions.log なし)_\n');
  process.exit(0);
}

const lines = fs.readFileSync(LOG_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
const dayLines = lines.filter((ln) => {
  try {
    const j = JSON.parse(ln);
    const t = j.time || '';
    return t.startsWith(targetIso);
  } catch {
    return false;
  }
});

let emergency = 0;
let safeMode = 0;
let notesSkipped = 0;

for (const ln of dayLines) {
  try {
    const j = JSON.parse(ln);
    const op = String(j.operation || '');
    if (j.emergency === true) emergency += 1;
    if (
      j.safe_mode_entered === true ||
      j.safe_mode === true ||
      j.safe_mode_rule === true ||
      /§55|safe_mode/i.test(op)
    )
      safeMode += 1;
    const note = String(j.notes || j.second_opinion || '');
    if (/skipped|API.?limit|未実行/i.test(note)) notesSkipped += 1;
  } catch {
    /* skip */
  }
}

console.log(`### 🤖 自律判断ログ（${targetIso} / autonomy scan）\n`);
console.log(`- **件数**: ${dayLines.length} 行`);
console.log(`- **emergency:true**: ${emergency} 件`);
console.log(`- **§55 / safe_mode 関連（推定）**: ${safeMode} 件`);
console.log(`- **notes / 旧 second_opinion に skipped 系（推定）**: ${notesSkipped} 件`);
if (emergency >= 3) {
  console.log('\n> 🚨 **emergency が 3 件以上** — R10 §52-6 / §54-5-6 の見直しシグナルとして §44 で確認推奨。\n');
} else {
  console.log('');
}
