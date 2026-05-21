#!/usr/bin/env node
/**
 * タスクC — 方式B（固定4AI）と矛盾するゾンビ記述の静的検査
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { MODE_B_CANONICAL_PATHS, scanRepoForZombies } from './lib/cio-four-ai-governance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function verifyCanonicalPresent() {
  const missing = MODE_B_CANONICAL_PATHS.filter((rel) => !fs.existsSync(path.join(root, rel)));
  return missing;
}

function main() {
  const missingCanon = verifyCanonicalPresent();
  if (missingCanon.length) {
    console.error('[verify-mode-b-zombie-docs] NG missing canonical files:', missingCanon.join(', '));
    process.exit(2);
  }

  const issues = scanRepoForZombies(root);
  if (issues.length === 0) {
    console.log('[verify-mode-b-zombie-docs] OK (no Mode-B zombie patterns in scan set)');
    process.exit(0);
  }

  console.error('[verify-mode-b-zombie-docs] NG zombie / drift detected:', issues.length);
  for (const i of issues) {
    console.error(`  - ${i.relPath} [${i.id}] ${i.hint}`);
  }
  console.error('  修復: npm run cio:prune:mode-b-zombie-docs');
  process.exit(1);
}

main();
