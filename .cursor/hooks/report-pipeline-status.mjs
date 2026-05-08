#!/usr/bin/env node
/**
 * 直近の報告パイプライン outcome を表示し exit コードで返す（every-turn-rules-confirm.mdc §1e-3）。
 * 0 = SUCCESS または記録なし / 1 = FAILED_* / 2 = in_progress / 4 = SUPERSEDED
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCurrent } from './report-pipeline-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(root);

const cur = readCurrent();
if (!cur || !cur.outcome) {
  console.log('[report-pipeline-status] 記録なし（または state 未作成）');
  process.exit(0);
}

console.log(JSON.stringify(cur, null, 2));
const o = cur.outcome;
if (o === 'SUCCESS') process.exit(0);
if (o === 'SUPERSEDED') process.exit(4);
if (o === 'in_progress') process.exit(2);
if (String(o).startsWith('FAILED')) process.exit(1);
process.exit(0);
