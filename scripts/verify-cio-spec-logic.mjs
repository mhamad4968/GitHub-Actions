#!/usr/bin/env node
/**
 * SPEC.md 日本語論理矛盾 Linter（第9層・拡張案2 / DeepSeek 職分）
 * npm run verify:cio-spec-logic
 */
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSpecLogic, printSpecConflicts } from './lib/cio-spec-logic-linter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const specIdx = args.indexOf('--spec');
const specRel = specIdx >= 0 ? args[specIdx + 1] : undefined;

function main() {
  const result = lintSpecLogic(root, specRel);
  if (result.ok) {
    console.log('[verify:cio-spec-logic] OK', result.specPath);
    process.exit(0);
  }
  console.error('[verify:cio-spec-logic] NG', result.issues.length, '件');
  printSpecConflicts(result.issues);
  process.exit(1);
}

main();
