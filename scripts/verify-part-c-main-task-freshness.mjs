#!/usr/bin/env node
/**
 * Part C「今やってる主タスク」鮮度 — checkpoint 最終更新との乖離を検知（D-PARTC-01）
 * - ヘッダ日付が checkpoint 最終更新より maxLagDays 以上古い → exit 1
 * - WAKE/ブリーフィングで誤誘導を防ぐ（evening-reflect が checkpoint を載せる恒久対策と対）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SESSION_STARTER_EVENING_UPDATE_REL } from './lib/session-starter-parts.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_LAG_DAYS = 3;

function parseYmd(s) {
  const m = String(s).match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function main() {
  const partC = path.join(REPO_ROOT, SESSION_STARTER_EVENING_UPDATE_REL);
  const cp = path.join(REPO_ROOT, 'chat-sessions', 'checkpoint-latest.md');
  if (!fs.existsSync(partC) || !fs.existsSync(cp)) {
    console.error('[verify:part-c-main-task-freshness] NG missing Part C or checkpoint');
    process.exit(1);
  }
  const partTxt = fs.readFileSync(partC, 'utf8');
  const cpTxt = fs.readFileSync(cp, 'utf8');
  const block = partTxt.match(/【今やってる主タスク[^\n]*】/);
  if (!block) {
    console.error('[verify:part-c-main-task-freshness] NG Part C に主タスクブロック無し');
    process.exit(1);
  }
  const partDay = parseYmd(block[0]);
  const cpLine = cpTxt.match(/\*\*最終更新\*\*:\s*(.+)/);
  const cpDay = cpLine ? parseYmd(cpLine[1]) : null;
  if (!partDay || !cpDay) {
    console.error('[verify:part-c-main-task-freshness] NG 日付パース失敗 part=%s cp=%s', block[0], cpLine?.[1]);
    process.exit(1);
  }
  const lagDays = Math.round((cpDay - partDay) / 86400000);
  if (lagDays > MAX_LAG_DAYS) {
    console.error(
      `[verify:part-c-main-task-freshness] NG Part C 日付が checkpoint より ${lagDays} 日古い（上限 ${MAX_LAG_DAYS}）\n` +
        `  Part C: ${block[0]}\n` +
        `  checkpoint: ${cpLine[1]}\n` +
        `  修復: evening-reflect 実行 または Part C 主タスクを checkpoint に合わせて更新`,
    );
    process.exit(1);
  }
  console.log(
    `[verify:part-c-main-task-freshness] OK lagDays=${lagDays} max=${MAX_LAG_DAYS} part=${block[0].slice(0, 40)}…`,
  );
}

main();
