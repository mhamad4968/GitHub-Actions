#!/usr/bin/env node
/**
 * handoff-log 末尾ブロックの必須キー欠落を自律修復
 *
 *   npm run cio:handoff:repair-latest
 *   npm run cio:handoff:repair-latest -- --dry-run
 *
 * @see scripts/lib/cio-handoff-template.mjs repairHandoffLatestBlock
 */
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repairHandoffLatestBlock } from './lib/cio-handoff-template.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const rep = repairHandoffLatestBlock(root, { dryRun });
  if (!rep.ok) {
    console.error(`[cio:handoff:repair-latest] NG ${rep.reason || 'unknown'}`);
    process.exit(1);
  }
  if (rep.repaired) {
    console.log(
      `[cio:handoff:repair-latest] OK repaired keys: ${rep.filled.join(', ')}${dryRun ? ' (dry-run)' : ''}`,
    );
  } else {
    console.log('[cio:handoff:repair-latest] OK no repair needed');
  }
  process.exit(0);
}

main();
