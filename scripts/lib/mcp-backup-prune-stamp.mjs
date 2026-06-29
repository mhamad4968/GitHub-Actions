/**
 * mcp.json.bak-* prune の最終実行記録（月次運用確認用）
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function mcpBackupPruneStampPath(repoRoot) {
  return path.join(repoRoot, 'logs', 'mcp-backup-prune-last.json');
}

/**
 * @param {string} repoRoot
 * @param {{ source: string, kept: number, deleted: number, cursorDir: string }} meta
 */
export function writeMcpBackupPruneStamp(repoRoot, meta) {
  const p = mcpBackupPruneStampPath(repoRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const payload = {
    lastRunAt: new Date().toISOString(),
    source: meta.source,
    kept: meta.kept,
    deleted: meta.deleted,
    cursorDir: meta.cursorDir,
  };
  fs.writeFileSync(p, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

/**
 * @param {string} repoRoot
 * @returns {{ lastRunAt: string, ageDays: number } | null}
 */
export function readMcpBackupPruneStamp(repoRoot) {
  const p = mcpBackupPruneStampPath(repoRoot);
  if (!fs.existsSync(p)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!j.lastRunAt) return null;
    const ageMs = Date.now() - new Date(j.lastRunAt).getTime();
    return { ...j, ageDays: ageMs / (24 * 60 * 60 * 1000) };
  } catch {
    return null;
  }
}

/** 月次 + 猶予（日） */
export const MCP_BACKUP_PRUNE_MAX_AGE_DAYS = 35;
