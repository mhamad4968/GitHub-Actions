#!/usr/bin/env node
/**
 * リポ `.cursor/mcp.json` の figma / mintlify / colors-fonts を
 * Windows `%USERPROFILE%\.cursor\mcp.json` にマージ（TSB-028 補完）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  mergeRepoMcpOverlays,
  readRepoMcpOverlays,
  REPO_OVERLAY_SERVER_NAMES,
} from './lib/repo-mcp-overlays.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const winMcp =
  process.env.CURSOR_MCP_WINDOWS_JSON ||
  path.join(process.env.USERPROFILE || '', '.cursor', 'mcp.json');

function main() {
  const overlays = readRepoMcpOverlays(root);
  if (Object.keys(overlays).length === 0) {
    console.warn('[apply-repo-mcp-overlays-windows] SKIP: リポ overlay なし');
    process.exit(0);
  }
  if (!fs.existsSync(winMcp)) {
    console.warn('[apply-repo-mcp-overlays-windows] SKIP: Windows mcp.json なし', winMcp);
    process.exit(0);
  }
  const cfg = JSON.parse(fs.readFileSync(winMcp, 'utf8'));
  mergeRepoMcpOverlays(cfg, overlays);
  const bak = `${winMcp}.bak-overlay-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.copyFileSync(winMcp, bak);
  fs.writeFileSync(winMcp, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
  console.log(
    `[apply-repo-mcp-overlays-windows] OK merged: ${REPO_OVERLAY_SERVER_NAMES.filter((n) => overlays[n]).join(', ')}`,
  );
  console.log(`[apply-repo-mcp-overlays-windows] path: ${winMcp} (backup ${bak})`);
}

main();
