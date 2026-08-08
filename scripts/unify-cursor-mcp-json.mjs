#!/usr/bin/env node
/**
 * mcp.json 三層（WSL 正本 / Windows 生成 / リポ overlay）の監査と一元化。
 * TSB-028: WSL ~/.cursor/mcp.json を正本 → sync → repo overlay マージ。
 *
 *   npm run mcp:unify
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  mergeRepoMcpOverlays,
  readRepoMcpOverlays,
  REPO_OVERLAY_SERVER_NAMES,
} from './lib/repo-mcp-overlays.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoMcpPath = path.join(root, '.cursor', 'mcp.json');
const winMcpPath = path.join(process.env.USERPROFILE || os.homedir(), '.cursor', 'mcp.json');
const wslMcpPath = '/home/mhamada202408224/.cursor/mcp.json';
const REPO_MNT = '/mnt/c/Users/mhamada202408224/kintone-ai-lab';

function loadJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadWslJson() {
  const wslFile = '\\\\wsl.localhost\\Ubuntu\\home\\mhamada202408224\\.cursor\\mcp.json';
  if (fs.existsSync(wslFile)) return loadJson(wslFile);
  const r = spawnSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'cat', wslMcpPath], { encoding: 'utf8' });
  if (r.status !== 0 || !(r.stdout || '').trim()) return null;
  return JSON.parse(r.stdout);
}

function writeWslJson(cfg) {
  const payload = JSON.stringify(cfg, null, 2);
  const w = spawnSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'bash', '-lc', `cat > ${wslMcpPath}`], {
    input: payload,
    encoding: 'utf8',
  });
  return w.status === 0;
}

/** リポ overlay を WSL パス体系向けに正規化 */
function overlayForWsl(name, srv) {
  if (!srv || typeof srv !== 'object') return srv;
  if (name === 'ffmpeg-mcp' || name === 'heygen-mcp' || name === 'kintone-schema-mcp' || name === 'git-history-mcp') {
    const sub = name.replace('-mcp', '').replace('git-history', 'git-history-mcp');
    const rel =
      name === 'git-history-mcp'
        ? 'mcp/git-history-mcp/index.mjs'
        : name === 'kintone-schema-mcp'
          ? 'mcp/kintone-schema-mcp/index.mjs'
          : name === 'ffmpeg-mcp'
            ? 'mcp/ffmpeg-mcp/index.mjs'
            : 'mcp/heygen-mcp/launcher.mjs';
    return {
      command: 'node',
      args: [`${REPO_MNT}/${rel}`],
      cwd: REPO_MNT,
      ...(srv._meta ? { _meta: srv._meta } : {}),
    };
  }
  return { ...srv };
}

function audit(label, keys) {
  console.log(`[mcp:unify] ${label}: ${keys.length} servers`);
}

function diffSets(a, b) {
  return {
    onlyA: a.filter((k) => !b.includes(k)),
    onlyB: b.filter((k) => !a.includes(k)),
  };
}

function patchWslFromRepoOverlays(wslCfg, overlays) {
  if (!wslCfg.mcpServers) wslCfg.mcpServers = {};
  let added = 0;
  for (const name of REPO_OVERLAY_SERVER_NAMES) {
    const srv = overlays[name];
    if (!srv) continue;
    if (!wslCfg.mcpServers[name]) {
      wslCfg.mcpServers[name] = overlayForWsl(name, srv);
      added++;
      console.log(`[mcp:unify] WSL +${name}`);
    }
  }
  return added;
}

function main() {
  const repoCfg = loadJson(repoMcpPath) || { mcpServers: {} };
  const winCfg = loadJson(winMcpPath) || { mcpServers: {} };
  const wslCfg = loadWslJson();
  if (!wslCfg) {
    console.error('[mcp:unify] NG WSL mcp.json unreadable');
    process.exit(2);
  }

  const repoKeys = Object.keys(repoCfg.mcpServers || {}).sort();
  const winKeys = Object.keys(winCfg.mcpServers || {}).sort();
  const wslKeys = Object.keys(wslCfg.mcpServers || {}).sort();

  audit('WSL canonical', wslKeys);
  audit('Windows user', winKeys);
  audit('Repo workspace overlay', repoKeys);

  const overlays = readRepoMcpOverlays(root);
  const missingOnWsl = REPO_OVERLAY_SERVER_NAMES.filter((n) => overlays[n] && !wslCfg.mcpServers?.[n]);
  if (missingOnWsl.length) {
    console.log('[mcp:unify] WSL missing overlays:', missingOnWsl.join(', '));
    const added = patchWslFromRepoOverlays(wslCfg, overlays);
    if (added && writeWslJson(wslCfg)) {
      console.log(`[mcp:unify] OK WSL patched (+${added})`);
    } else if (added) {
      console.error('[mcp:unify] NG WSL write failed');
      process.exit(2);
    }
  } else {
    console.log('[mcp:unify] WSL already has all repo overlays');
  }

  const sync = spawnSync(process.execPath, ['scripts/sync-cursor-mcp-windows-from-wsl.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (sync.status !== 0) {
    console.error('[mcp:unify] NG sync exit', sync.status);
    process.exit(sync.status || 2);
  }

  const apply = spawnSync(process.execPath, ['scripts/apply-repo-mcp-overlays-windows.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (apply.status !== 0) {
    console.error('[mcp:unify] NG overlay apply exit', apply.status);
    process.exit(apply.status || 2);
  }

  const winAfter = loadJson(winMcpPath) || { mcpServers: {} };
  const wslAfter = loadWslJson() || { mcpServers: {} };
  const winAfterKeys = Object.keys(winAfter.mcpServers || {}).sort();
  const wslAfterKeys = Object.keys(wslAfter.mcpServers || {}).sort();

  const { onlyA: wslOnly, onlyB: winOnly } = diffSets(wslAfterKeys, winAfterKeys);
  console.log('[mcp:unify] post-sync Windows count:', winAfterKeys.length);
  console.log('[mcp:unify] post-sync WSL count:', wslAfterKeys.length);

  if (wslOnly.length) {
    console.log('[mcp:unify] WSL-only (WSL Cursor 専用・sync 対象外):', wslOnly.join(', '));
  }
  if (winOnly.length) {
    console.log('[mcp:unify] Windows-only (sync 生成):', winOnly.join(', '));
  }

  const overlayMissingOnWin = REPO_OVERLAY_SERVER_NAMES.filter((n) => overlays[n] && !winAfter.mcpServers?.[n]);
  if (overlayMissingOnWin.length) {
    console.error('[mcp:unify] NG overlays missing on Windows after unify:', overlayMissingOnWin.join(', '));
    process.exit(2);
  }

  console.log('[mcp:unify] OK unified (WSL canonical → Windows + repo overlays)');
}

main();
