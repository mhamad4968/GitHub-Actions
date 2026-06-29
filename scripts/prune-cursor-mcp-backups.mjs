#!/usr/bin/env node
/**
 * Cursor mcp.json.bak-* の世代整理（API キー含有 — 古いバックアップは削除推奨）
 *
 *   npm run mcp:prune-backups           # dry-run
 *   npm run mcp:prune-backups -- --apply
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  defaultCursorDir,
  planMcpJsonBackupPrune,
  pruneMcpJsonBackups,
} from './lib/mcp-json-backup-retention.mjs';
import { writeMcpBackupPruneStamp } from './lib/mcp-backup-prune-stamp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');
const monthlyStamp = process.argv.includes('--monthly-stamp');
const sourceArg = process.argv.find((a) => a.startsWith('--source='));
const source = sourceArg ? sourceArg.slice('--source='.length) : monthlyStamp ? 'scheduled' : 'manual';
const cursorDir = process.env.CURSOR_DIR || defaultCursorDir();

if (!cursorDir) {
  console.error('[mcp:prune-backups] NG: CURSOR_DIR / USERPROFILE missing');
  process.exit(2);
}

const plan = planMcpJsonBackupPrune(cursorDir);
console.log('[mcp:prune-backups] dir:', cursorDir);
console.log('[mcp:prune-backups] keep:', plan.kept.join(', ') || '(none)');
console.log('[mcp:prune-backups] delete:', plan.deleted.length, 'files');

if (!apply) {
  for (const n of plan.deleted) console.log(`  - ${n}`);
  console.log('[mcp:prune-backups] dry-run — pass --apply to delete');
  process.exit(0);
}

pruneMcpJsonBackups(cursorDir, { dryRun: false });
writeMcpBackupPruneStamp(root, {
  source,
  kept: plan.kept.length,
  deleted: plan.deleted.length,
  cursorDir,
});
