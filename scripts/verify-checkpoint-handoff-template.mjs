#!/usr/bin/env node
/**
 * checkpoint / handoff テンプレ整合検証
 *
 *   npm run verify:checkpoint-handoff-template
 *   npm run verify:checkpoint-handoff-template -- --strict
 *
 * @see docs/runbooks/checkpoint-handoff-template-v2.md
 */
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateHandoffTemplate } from './lib/cio-handoff-template.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const strict = process.argv.includes('--strict');
  const { ok, issues } = validateHandoffTemplate(root, { strict });

  console.log(`[verify:checkpoint-handoff-template] strict=${strict}`);
  for (const i of issues) {
    if (i.startsWith('WARN')) console.warn(`  ⚠ ${i}`);
    else console.error(`  ✗ ${i}`);
  }

  if (!ok) {
    console.error('[verify:checkpoint-handoff-template] NG');
    console.error('  fix: docs/runbooks/checkpoint-handoff-template-v2.md');
    console.error('  templates: chat-sessions/templates/');
    process.exit(1);
  }
  console.log('[verify:checkpoint-handoff-template] OK');
  process.exit(0);
}

main();
