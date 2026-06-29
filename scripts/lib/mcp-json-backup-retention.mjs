/**
 * Cursor mcp.json 自動バックアップ（.bak-*）の世代管理。
 * mcp.json は API キー・認証情報を含むため、古い .bak-* は削除推奨。
 */
import fs from 'node:fs';
import path from 'node:path';

/** @typedef {'sync' | 'overlay' | 'manual' | 'other'} BackupKind */

/**
 * @param {string} name
 * @returns {BackupKind}
 */
export function classifyMcpBackupName(name) {
  if (/^mcp\.json\.bak-overlay-/.test(name)) return 'overlay';
  if (/^mcp\.json\.bak-\d{4}-\d{2}-\d{2}T/.test(name)) return 'sync';
  if (/^mcp\.json\.bak[.-]/.test(name)) return 'manual';
  return 'other';
}

/**
 * @param {string} cursorDir  %USERPROFILE%\.cursor 等
 * @param {{ keepPerKind?: Partial<Record<BackupKind, number>> }} opts
 * @returns {{ kept: string[], deleted: string[] }}
 */
export function planMcpJsonBackupPrune(cursorDir, opts = {}) {
  const keepPerKind = {
    sync: 3,
    overlay: 3,
    manual: 1,
    other: 0,
    ...opts.keepPerKind,
  };

  if (!fs.existsSync(cursorDir)) {
    return { kept: [], deleted: [] };
  }

  const entries = fs
    .readdirSync(cursorDir)
    .filter((n) => n.startsWith('mcp.json.bak'))
    .map((name) => {
      const full = path.join(cursorDir, name);
      const st = fs.statSync(full);
      return {
        name,
        full,
        kind: classifyMcpBackupName(name),
        mtimeMs: st.mtimeMs,
      };
    });

  /** @type {Map<BackupKind, typeof entries>} */
  const byKind = new Map();
  for (const e of entries) {
    if (!byKind.has(e.kind)) byKind.set(e.kind, []);
    byKind.get(e.kind).push(e);
  }

  const kept = new Set();
  for (const [kind, list] of byKind) {
    const sorted = [...list].sort((a, b) => b.mtimeMs - a.mtimeMs);
    const limit = keepPerKind[kind] ?? 0;
    for (let i = 0; i < sorted.length && i < limit; i++) {
      kept.add(sorted[i].full);
    }
  }

  const deleted = [];
  for (const e of entries) {
    if (!kept.has(e.full)) deleted.push(e.full);
  }

  return {
    kept: [...kept].map((p) => path.basename(p)),
    deleted: deleted.map((p) => path.basename(p)),
  };
}

/**
 * @param {string} cursorDir
 * @param {{ dryRun?: boolean, logPrefix?: string } & Parameters<typeof planMcpJsonBackupPrune>[1]} opts
 */
export function pruneMcpJsonBackups(cursorDir, opts = {}) {
  const { dryRun = false, logPrefix = '[mcp-backup-retention]', ...planOpts } = opts;
  const plan = planMcpJsonBackupPrune(cursorDir, planOpts);

  if (plan.deleted.length === 0) {
    console.log(`${logPrefix} nothing to prune (kept ${plan.kept.length})`);
    return plan;
  }

  for (const name of plan.deleted) {
    const full = path.join(cursorDir, name);
    if (dryRun) {
      console.log(`${logPrefix} would delete ${name}`);
    } else if (fs.existsSync(full)) {
      fs.unlinkSync(full);
      console.log(`${logPrefix} deleted ${name}`);
    }
  }

  console.log(
    `${logPrefix} done kept=${plan.kept.length} deleted=${plan.deleted.length} dryRun=${dryRun}`,
  );
  return plan;
}

/**
 * Windows Cursor 用 .cursor ディレクトリ
 * @returns {string}
 */
export function defaultCursorDir() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  return home ? path.join(home, '.cursor') : '';
}
