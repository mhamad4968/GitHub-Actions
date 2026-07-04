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
import { validateHandoffTemplate, repairHandoffLatestBlock, repairCheckpointBootstrapBlock } from './lib/cio-handoff-template.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const strict = process.argv.includes('--strict');
  const noRepair = process.argv.includes('--no-auto-repair');

  if (!noRepair) {
    const bootRep = repairCheckpointBootstrapBlock(root);
    if (bootRep.repaired) {
      console.log(
        `[verify:checkpoint-handoff-template] auto-repair: checkpoint ${bootRep.filled.join(', ')}`,
      );
    } else if (bootRep.reason) {
      console.warn(`[verify:checkpoint-handoff-template] checkpoint auto-repair skip: ${bootRep.reason}`);
    }
    const rep = repairHandoffLatestBlock(root);
    if (rep.repaired) {
      console.log(
        `[verify:checkpoint-handoff-template] auto-repair: filled ${rep.filled.join(', ')}`,
      );
    } else if (rep.reason) {
      console.warn(`[verify:checkpoint-handoff-template] auto-repair skip: ${rep.reason}`);
    }
  }

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
