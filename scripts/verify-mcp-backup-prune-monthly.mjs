#!/usr/bin/env node
/**
 * mcp.json.bak-* 月次 prune の実行記録を検査（Windows）
 *   npm run verify:mcp-backup-prune-monthly
 *   npm run verify:mcp-backup-prune-monthly -- --strict  # 超過時 exit 2
 */
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  MCP_BACKUP_PRUNE_MAX_AGE_DAYS,
  readMcpBackupPruneStamp,
} from './lib/mcp-backup-prune-stamp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

if (process.platform !== 'win32') {
  console.log('[verify:mcp-backup-prune-monthly] SKIP (Windows .cursor only)');
  process.exit(0);
}

const stamp = readMcpBackupPruneStamp(root);
if (!stamp) {
  const msg = 'no stamp — run: npm run mcp:prune-backups:install-task (or mcp:prune-backups -- --apply)';
  if (strict) {
    console.error(`[verify:mcp-backup-prune-monthly] NG ${msg}`);
    process.exit(2);
  }
  console.warn(`[verify:mcp-backup-prune-monthly] WARN ${msg}`);
  process.exit(0);
}

const age = Math.floor(stamp.ageDays);
if (stamp.ageDays <= MCP_BACKUP_PRUNE_MAX_AGE_DAYS) {
  console.log(
    `[verify:mcp-backup-prune-monthly] OK last=${stamp.lastRunAt} age=${age}d source=${stamp.source}`,
  );
  process.exit(0);
}

const msg = `stale age=${age}d (max ${MCP_BACKUP_PRUNE_MAX_AGE_DAYS}d) — npm run mcp:prune-backups -- --apply`;
if (strict) {
  console.error(`[verify:mcp-backup-prune-monthly] NG ${msg}`);
  process.exit(2);
}
console.warn(`[verify:mcp-backup-prune-monthly] WARN ${msg}`);
process.exit(0);
