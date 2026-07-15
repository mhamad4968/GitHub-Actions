/**
 * リポ `.cursor/mcp.json` のワークスペース専用 MCP（figma / colors-fonts / repo-tree 等）を
 * Windows 正本へマージするための正規化ヘルパ。
 *
 * ⚠ mintlify は DEL-1（2026-07-11 · 浜田追認 2026-07-15）済み — REPO_OVERLAY に戻さない（△10）。
 */
import fs from 'node:fs';
import path from 'node:path';

/** リポ側のみ定義し、WSL→Win sync 後にも載せるサーバ名 */
export const REPO_OVERLAY_SERVER_NAMES = [
  'figma',
  'colors-fonts',
  'repo-tree',
  'eslint-mcp',
  'context7',
  'kintone-schema-mcp',
  'git-history-mcp',
];

/**
 * colors-fonts の WSL 絶対 npx パスをクロスプラットフォーム `npx` に正規化。
 * @param {string} name
 * @param {Record<string, unknown>} srv
 */
export function normalizeOverlayServer(name, srv) {
  if (name !== 'colors-fonts' || !srv || typeof srv !== 'object') return srv;
  const cmd = String(srv.command || '');
  if (cmd.includes('/home/') || cmd.includes('.nvm')) {
    return {
      command: 'npx',
      args: ['-y', '@colorsandfonts/mcp@1.1.0'],
      ...(srv.env && typeof srv.env === 'object' ? { env: srv.env } : {}),
    };
  }
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
