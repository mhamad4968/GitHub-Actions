#!/usr/bin/env node
/**
 * GHA 無人の定期 kintone REST 操作向け §50-3-8 skip スタンプ（方式B 証跡）。
 * customize/SPEC を触らないジョブ専用。DeepSeek 1 問は不要（スキップ理由を機械記録）。
 *
 * @see docs/runbooks/cio-gha-periodic-5038-stamp.md
 */
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { write5038Stamp } from './lib/cio-four-ai-governance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @type {Record<string, string>} */
const OPERATIONS = {
  '682-graph-monthly':
    'GHA 682-graph-monthly scheduled; REST reports PUT + preview deploy only; no customize/SPEC edit',
};

function main() {
  const opIdx = process.argv.indexOf('--operation');
  const op = opIdx >= 0 ? String(process.argv[opIdx + 1] || '').trim() : '';
  if (!op || !OPERATIONS[op]) {
    console.error('[cio-gha-periodic-5038-stamp] 使い方: node scripts/cio-gha-periodic-5038-stamp.mjs --operation <id>');
    console.error(`  許可 id: ${Object.keys(OPERATIONS).join(', ')}`);
    process.exit(2);
  }

  const skipReason = OPERATIONS[op];
  write5038Stamp(root, {
    mode: 'skip',
    skipReason,
    text: '',
    note: `GHA periodic ops (${op}); cio-gha-periodic-5038-stamp.mjs`,
    ghaOperation: op,
    githubActions: process.env.GITHUB_ACTIONS === 'true',
  });

  console.log(`[cio-gha-periodic-5038-stamp] OK operation=${op}`);
  console.log(`  skipReason: ${skipReason}`);
  process.exit(0);
}

main();
