#!/usr/bin/env node
/**
 * checkpoint-latest.md 凍結ゾーン（preamble）行数検証
 *
 *   npm run verify:checkpoint-freeze-zone
 *   npm run verify:checkpoint-freeze-zone -- --strict
 *   npm run verify:checkpoint-freeze-zone -- --auto-rollup
 *
 * @see docs/runbooks/session-lifecycle-v2.md §5
 */
import process from 'node:process';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readCheckpointPreambleLineCount } from './lib/cio-checkpoint-read.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FREEZE_MAX = 50;
const FREEZE_WARN = 65;

function main() {
  const strict = process.argv.includes('--strict');
  const autoRollup = process.argv.includes('--auto-rollup');
  const lines = readCheckpointPreambleLineCount(root);

  console.log(`[verify:checkpoint-freeze-zone] preamble lines=${lines} max=${FREEZE_MAX} warn=${FREEZE_WARN}`);

  if (lines <= FREEZE_MAX) {
    console.log('[verify:checkpoint-freeze-zone] OK');
    process.exit(0);
  }

  if (lines <= FREEZE_WARN) {
    console.warn(`[verify:checkpoint-freeze-zone] WARN preamble ${lines} > ${FREEZE_MAX} — 次 WAKE で rollup 推奨`);
    if (!strict) {
      process.exit(0);
    }
    console.error('[verify:checkpoint-freeze-zone] NG --strict');
    process.exit(1);
  }

  console.warn(`[verify:checkpoint-freeze-zone] NG preamble ${lines} > ${FREEZE_WARN} — rollup 必須`);

  if (autoRollup) {
    console.log('[verify:checkpoint-freeze-zone] auto-rollup 実行...');
    if (runRollup(root)) {
      const after = readCheckpointPreambleLineCount(root);
      if (after <= FREEZE_WARN) {
        console.log(`[verify:checkpoint-freeze-zone] OK after rollup lines=${after}`);
        process.exit(0);
      }
      console.error(
        `[verify:checkpoint-freeze-zone] NG after rollup lines=${after} > ${FREEZE_WARN} — checkpoint の日付付き履歴見出しを確認`,
      );
      process.exit(1);
    }
    console.error('[verify:checkpoint-freeze-zone] NG rollup 失敗');
    process.exit(2);
  }

  process.exit(strict ? 1 : 0);
}

function runRollup(rootDir) {
  const r = spawnSync(process.execPath, ['scripts/cio-checkpoint-rollup.mjs', '--keep', '3'], {
    cwd: rootDir,
    stdio: 'inherit',
  });
  return r.status === 0;
}

main();
