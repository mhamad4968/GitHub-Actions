#!/usr/bin/env node
/**
 * Apply 第12層 MCP servers to repo + Windows + WSL ~/.cursor/mcp.json
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mergeRepoMcpOverlays, readRepoMcpOverlays } from './lib/repo-mcp-overlays.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoMcpPath = path.join(root, '.cursor', 'mcp.json');
const winHome = process.env.USERPROFILE || os.homedir();
const winMcpPath = path.join(winHome, '.cursor', 'mcp.json');
const wslMcpPath = '/home/mhamada202408224/.cursor/mcp.json';

const REPO_WIN = 'C:\\\\Users\\\\mhamada202408224\\\\kintone-ai-lab';

function serverEntries() {
  return {
    'kintone-schema-mcp': {
      command: 'node',
      args: [`${REPO_WIN}\\\\mcp\\\\kintone-schema-mcp\\\\index.mjs`],
      cwd: REPO_WIN,
      _meta: {
        purpose: 'Live kintone form/views schema via REST (§50-3-11 第12層)',
        layer: 12,
      },
    },
    'git-history-mcp': {
      command: 'node',
      args: [`${REPO_WIN}\\\\mcp\\\\git-history-mcp\\\\index.mjs`],
      cwd: REPO_WIN,
      _meta: {
        purpose: 'Git constitution/commit 4-element history (§50-3-11 第12層)',
        layer: 12,
      },
    },
  };
}

function mergeServers(target) {
  if (!target.mcpServers) target.mcpServers = {};
  for (const [name, srv] of Object.entries(serverEntries())) {
    target.mcpServers[name] = srv;
  }
  return target;
}

function readJson(p, fallback = { mcpServers: {} }) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function patchWslMcp() {
  const r = spawnSync(
    'wsl.exe',
    ['-d', 'Ubuntu', '-e', 'cat', wslMcpPath],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) {
    console.warn('[apply-layer12-mcp] WARN WSL mcp.json unreadable — skip WSL patch');
    return false;
  }
  const cfg = JSON.parse(r.stdout);
  mergeServers(cfg);
  const payload = JSON.stringify(cfg, null, 2);
  const w = spawnSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'bash', '-lc', `cat > ${wslMcpPath}`], {
    input: payload,
    encoding: 'utf8',
  });
  if (w.status !== 0) {
    console.warn('[apply-layer12-mcp] WARN WSL mcp.json write failed');
    return false;
  }
  console.log('[apply-layer12-mcp] OK patched WSL', wslMcpPath);
  return true;
}

function main() {
  const entries = serverEntries();
  const repoCfg = readJson(repoMcpPath);
  mergeServers(repoCfg);
  writeJson(repoMcpPath, repoCfg);
  console.log('[apply-layer12-mcp] OK repo', repoMcpPath);

  const winCfg = readJson(winMcpPath);
  mergeServers(winCfg);
  const overlays = readRepoMcpOverlays(root);
  mergeRepoMcpOverlays(winCfg, overlays);
  writeJson(winMcpPath, winCfg);
  console.log('[apply-layer12-mcp] OK Windows', winMcpPath);

  patchWslMcp();

  const sync = spawnSync(process.execPath, ['scripts/sync-cursor-mcp-windows-from-wsl.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (sync.status !== 0) {
    console.warn('[apply-layer12-mcp] WARN sync exit', sync.status);
  }

  for (const name of Object.keys(entries)) {
    if (!winCfg.mcpServers[name]) {
      console.error('[apply-layer12-mcp] NG missing after merge:', name);
      process.exit(1);
    }
  }
  console.log('[apply-layer12-mcp] OK kintone-schema-mcp + git-history-mcp registered');
}

main();
