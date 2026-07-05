#!/usr/bin/env node
/**
 * R736-SPEC-SYNC — 仕様進捗表・checkpoint・kintone-apps の鏡像矛盾（先祖返り検知）
 *
 * Usage:
 *   npm run verify:spec-progress-sync
 *   npm run verify:spec-progress-sync -- --strict   # warn も exit 1
 *
 * ルール追加: data/cio-spec-progress-sync-rules.json
 * 正本: docs/plans/2026-06-18-jikkou-yosan-spec.md §9.2.3
 *       docs/runbooks/session-close-reflection-scope.md
 */
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSpecProgressSyncChecks } from './lib/cio-spec-progress-sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const issues = runSpecProgressSyncChecks(root);
  if (!issues.length) {
    console.log('[verify:spec-progress-sync] OK — 鏡像矛盾なし');
    process.exit(0);
  }
  console.error(`[verify:spec-progress-sync] NG ${issues.length} 件（先祖返り・古い表記）`);
  for (const i of issues) {
    console.error(`  [${i.rule}] ${i.message}`);
    if (i.fix) console.error(`    fix: ${i.fix}`);
  }
  console.error('[verify:spec-progress-sync] ルール追加: data/cio-spec-progress-sync-rules.json');
  process.exit(1);
}

main();
