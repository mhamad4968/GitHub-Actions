#!/usr/bin/env node
/**
 * 拡張案3 — デッドコード週末パージ（Kimi×Composer 職分）
 */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  archiveDeadCode,
  scanDeadCode,
  weekendCommitPush,
} from './lib/cio-dead-code-purge.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const apply = process.argv.includes('--apply');
  const weekendCommit = process.argv.includes('--weekend-commit');
  const scanOnly = process.argv.includes('--scan');
  const hits = scanDeadCode(root, { includeCustomize: false });

  if (scanOnly) {
    console.log('[cio:dead-code-purge] scan', hits.length, 'candidates');
    for (const h of hits.slice(0, 30)) console.log(`  - ${h.file} :: ${h.fn}`);
    process.exit(0);
  }

  const moved = archiveDeadCode(root, hits, { apply });
  console.log(`[cio:dead-code-purge] ${apply ? 'archived' : 'dry-run'}`, moved.length);
  for (const m of moved.slice(0, 20)) {
    console.log(`  ${m.from} → ${m.to} [${m.fns.join(', ')}]`);
  }

  if (apply && weekendCommit && moved.length) {
    weekendCommitPush(root, moved);
    console.log('[cio:dead-code-purge] committed [WEEKEND-DEAD-CODE-PURGE]');
  }
  process.exit(0);
}

main();
