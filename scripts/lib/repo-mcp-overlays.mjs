/**
 * リポ `.cursor/mcp.json` のワークスペース専用 MCP（repo-tree / eslint-mcp 等）を
 * Windows 正本へマージするための正規化ヘルパ。
 *
 * ⚠ mintlify は DEL-1（2026-07-11）済み。
 * ⚠ figma / colors-fonts / shadcn-ui / accessibility-scanner は DEL-3（2026-08-08 浜田GO）済み — REPO_OVERLAY に戻さない。
 */
import fs from 'node:fs';
import path from 'node:path';

/** リポ側のみ定義し、WSL→Win sync 後にも載せるサーバ名 */
export const REPO_OVERLAY_SERVER_NAMES = [
  'repo-tree',
  'eslint-mcp',
  'context7',
  'kintone-schema-mcp',
  'git-history-mcp',
];

/**
 * @param {string} name
 * @param {Record<string, unknown>} srv
 */
export function normalizeOverlayServer(name, srv) {
  return srv;
}

/**
 * @param {string} repoRoot
 * @returns {Record<string, object>}
 */
export function readRepoMcpOverlays(repoRoot) {
  const p = path.join(repoRoot, '.cursor', 'mcp.json');
  if (!fs.existsSync(p)) return {};
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const out = {};
  for (const name of REPO_OVERLAY_SERVER_NAMES) {
    const srv = j.mcpServers?.[name];
    if (srv && typeof srv === 'object') {
      out[name] = normalizeOverlayServer(name, srv);
    }
  }
  return out;
}

/**
 * @param {{ mcpServers?: Record<string, object> }} windowsCfg
 * @param {Record<string, object>} overlays
 */
export function mergeRepoMcpOverlays(windowsCfg, overlays) {
  if (!windowsCfg.mcpServers) windowsCfg.mcpServers = {};
  for (const [name, srv] of Object.entries(overlays)) {
    windowsCfg.mcpServers[name] = srv;
  }
  return windowsCfg;
}
