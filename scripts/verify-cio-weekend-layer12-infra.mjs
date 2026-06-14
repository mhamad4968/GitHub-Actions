#!/usr/bin/env node
/**
 * 第12層 — kintone-schema-mcp + git-history-mcp 整合検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'mcp/lib/mcp-stdio.mjs',
  'mcp/kintone-schema-mcp/index.mjs',
  'mcp/git-history-mcp/index.mjs',
  'scripts/apply-layer12-mcp-servers.mjs',
  'scripts/verify-cio-mcp-layer12-probe.mjs',
];

const SCRIPTS = [
  'apply-layer12-mcp',
  'verify:cio-weekend-layer12-infra',
  'verify:cio-mcp-layer12-probe',
];

const AGENTS_MARKERS = [
  '第12層',
  'kintone-schema-mcp',
  'git-history-mcp',
  'apply-layer12-mcp',
  '§50-3-11',
];

const MCP_NAMES = ['kintone-schema-mcp', 'git-history-mcp'];

function loadMergedMcpNames() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const paths = [path.join(root, '.cursor', 'mcp.json')];
  if (home) paths.push(path.join(home, '.cursor', 'mcp.json'));
  const names = {};
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const [k, v] of Object.entries(j.mcpServers || {})) {
      if (v?.disabled !== true) names[k] = true;
    }
  }
  return names;
}

function main() {
  const issues = [];
  for (const rel of FILES) {
    if (!fs.existsSync(path.join(root, rel))) issues.push(`missing: ${rel}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const s of SCRIPTS) {
    if (!pkg.scripts?.[s]) issues.push(`package.json scripts.${s}`);
  }
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  for (const m of AGENTS_MARKERS) {
    if (!agents.includes(m)) issues.push(`AGENTS.md missing: ${m}`);
  }
  const mcpStatus = fs.readFileSync(path.join(root, 'docs/mcp-status.md'), 'utf8');
  for (const n of MCP_NAMES) {
    if (!mcpStatus.includes(n)) issues.push(`docs/mcp-status.md missing: ${n}`);
  }
  const names = loadMergedMcpNames();
  for (const n of MCP_NAMES) {
    if (!names[n]) issues.push(`mcp registry missing: ${n}`);
  }
  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-cio-weekend-layer12-infra')) {
    issues.push('verify:cio-four-ai-governance に layer12 未連結');
  }

  if (issues.length) {
    console.error('[verify:cio-weekend-layer12-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-weekend-layer12-infra] OK 第12層 2大MCP整合');
  process.exit(0);
}

main();
