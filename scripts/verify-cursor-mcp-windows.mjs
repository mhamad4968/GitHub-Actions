#!/usr/bin/env node
/**
 * Windows Cursor 用 C:\\Users\\...\\.cursor\\mcp.json の機械検証（TSB-028）。
 * WSL から /mnt/c/... を読む。パスが無ければ SKIP exit 0。
 */
import fs from 'node:fs';
import path from 'node:path';

function defaultWinMcpPath() {
  if (process.env.CURSOR_MCP_WINDOWS_JSON) return process.env.CURSOR_MCP_WINDOWS_JSON;
  if (process.platform === 'win32' && process.env.USERPROFILE) {
    return path.join(process.env.USERPROFILE, '.cursor', 'mcp.json');
  }
  return '/mnt/c/Users/mhamada202408224/.cursor/mcp.json';
}

const winMcp = defaultWinMcpPath();

function fail(msg) {
  console.error('[verify-cursor-mcp-windows] NG:', msg);
  process.exit(2);
}

if (!fs.existsSync(winMcp)) {
  console.log('[verify-cursor-mcp-windows] SKIP (path missing):', winMcp);
  process.exit(0);
}

let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(winMcp, 'utf8'));
} catch (e) {
  fail(`invalid JSON: ${e.message}`);
}

const servers = cfg.mcpServers || {};
const names = [
  'kintone-space',
  'markdownify',
  'kimi',
  'deepseek',
  'openrouter',
  'rag',
  'kintone-dev',
];

for (const n of names) {
  if (!servers[n]) fail(`missing mcpServers.${n}`);
}

const fsSrv = servers.filesystem;
if (fsSrv) {
  if (fsSrv.command !== 'npx') {
    fail(`filesystem.command must be "npx" (got ${JSON.stringify(fsSrv.command)})`);
  }
  if (!Array.isArray(fsSrv.args) || fsSrv.args[0] !== '-y') {
    fail('filesystem.args must start with ["-y", ...]');
  }
  if (!String(fsSrv.args[1] || '').includes('server-filesystem')) {
    fail('filesystem.args[1] must be @modelcontextprotocol/server-filesystem');
  }
  for (const p of fsSrv.args.slice(2)) {
    if (typeof p !== 'string') fail('filesystem path args must be strings');
    if (p.startsWith('/') || p.startsWith('\\')) {
      fail(`filesystem path must be Windows drive path, not: ${p.slice(0, 40)}...`);
    }
    if (!/^[A-Za-z]:\\\\/.test(p) && !/^C:\\\\/.test(p)) {
      fail(`filesystem path must look like C:\\\\... got: ${p.slice(0, 60)}`);
    }
  }
}

for (const [name, srv] of Object.entries(servers)) {
  if (srv && srv.command === '-y') {
    fail(`forbidden command "-y" on server ${name} (filesystem regression)`);
  }
}

/** DEL-1/DEL-2 再注入防止（2026-07-15 · mcp 統廃合 △10）
 * 文言は連結で組み立てる（verify:mcp-deleted-refs の quoted-name 検査に誤検出しない） */
const FORBIDDEN_REINJECT = [`mint${'lify'}`, `cyber${'-news'}`];
for (const forbidden of FORBIDDEN_REINJECT) {
  if (servers[forbidden]) {
    fail(`deleted MCP reappeared: ${forbidden} (DEL 済サーバの再追加禁止 · verify:mcp-deleted-refs)`);
  }
}

function argsJoin(srv) {
  return (srv.args || []).join(' ');
}

const ks = servers['kintone-space'];
const ksJoin = argsJoin(ks);
if (!ksJoin.includes('bash') || !ksJoin.includes('-lc')) {
  fail('kintone-space must use wsl bash -lc so env reaches node');
}
if (!ksJoin.includes('KINTONE_PASSWORD') && !(ks.env && ks.env.KINTONE_PASSWORD)) {
  fail('kintone-space must export KINTONE_PASSWORD in -lc or set env.KINTONE_PASSWORD');
}

const md = servers.markdownify;
const mdJoin = argsJoin(md);
if (!mdJoin.includes('bash') || !mdJoin.includes('-lc')) {
  fail('markdownify must run via wsl bash -lc');
}
// TSB-029: npx @iflow-mcp/markdownify-mcp は tarball の preinstall 欠落で stdio 即死しうる — env -i + node …/dist/index.js を正とする
if (!mdJoin.includes('env -i') || !mdJoin.includes('dist/index.js')) {
  fail(
    'markdownify must use TSB-029 node direct launch (env -i …/dist/index.js), not npx @iflow-mcp/markdownify-mcp',
  );
}
if (/\bnpx\b.*@iflow-mcp\/markdownify-mcp/.test(mdJoin)) {
  fail('markdownify must not use npx @iflow-mcp/markdownify-mcp (TSB-029 preinstall trap)');
}

for (const overlay of ['figma', 'colors-fonts']) {
  if (!servers[overlay]) {
    console.warn(`[verify-cursor-mcp-windows] WARN: missing overlay ${overlay} (npm run mcp:apply-repo-overlays-windows)`);
  }
}

console.log('[verify-cursor-mcp-windows] OK', winMcp);
