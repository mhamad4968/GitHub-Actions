#!/usr/bin/env node
/**
 * Windows Cursor 用 C:\\Users\\...\\.cursor\\mcp.json の機械検証（TSB-028）。
 * WSL から /mnt/c/... を読む。パスが無ければ SKIP exit 0。
 */
import fs from 'node:fs';
import path from 'node:path';

const winMcp =
  process.env.CURSOR_MCP_WINDOWS_JSON ||
  '/mnt/c/Users/mhamada202408224/.cursor/mcp.json';

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
  'filesystem',
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

for (const [name, srv] of Object.entries(servers)) {
  if (srv && srv.command === '-y') {
    fail(`forbidden command "-y" on server ${name} (filesystem regression)`);
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
if (!mdJoin.includes('bash') || !mdJoin.includes('-lc') || !mdJoin.includes('markdownify')) {
  fail('markdownify must run via wsl bash -lc + npx markdownify');
}

console.log('[verify-cursor-mcp-windows] OK', winMcp);
