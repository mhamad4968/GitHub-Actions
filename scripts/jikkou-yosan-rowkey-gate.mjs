#!/usr/bin/env node
/**
 * B-1 — row_key 保全ゲート（recalcState 前後で identity 列が減らないこと）
 */
import { recalcAll } from './jikkou-yosan-calc-core.mjs';
import { buildSample2623001 } from './jikkou-yosan-sample-2623001.mjs';
import {
  countNonemptyRowKeys,
  ensureRowKeysOnState,
  recalcCostLinesPreserveKeys,
} from './lib/jikkou-yosan-rowkey-guard.mjs';

function main() {
  const state = buildSample2623001();
  ensureRowKeysOnState(state);
  const before = countNonemptyRowKeys(state);
  const beforeKeys = new Map(
    state.cost_lines.map((r, i) => [i, String(r.row_key || '').trim()]),
  );

  recalcCostLinesPreserveKeys(state, recalcAll);

  const after = countNonemptyRowKeys(state);
  const fails = [];

  for (const table of Object.keys(before)) {
    if (after[table] < before[table]) {
      fails.push(`${table}: row_key ${before[table]}→${after[table]}`);
    }
    const rows = state[table];
    if (Array.isArray(rows) && after[table] < rows.length) {
      fails.push(`${table}: ${rows.length}行中 row_key 非空 ${after[table]}件`);
    }
  }

  state.cost_lines.forEach((r, i) => {
    const prev = beforeKeys.get(i);
    const cur = String(r.row_key || '').trim();
    if (prev && !cur) fails.push(`cost_lines[${i}]: row_key 消失 (${prev})`);
  });

  if (fails.length) {
    console.error('[jikkou-yosan:rowkey-gate] FAIL', fails.join('; '));
    process.exit(1);
  }

  console.log('[jikkou-yosan:rowkey-gate] OK', before);
}

main();
