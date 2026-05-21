#!/usr/bin/env node
/**
 * Mode B — docs/mcp-status.md ↔ data/cio-mcp-four-ai-matrix.json ↔ mcp-server-use-triggers.mdc
 * ↔ verify-cio-mcp-registry REQUIRED 名の一字ズレ検査
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MATRIX_PATH = 'data/cio-mcp-four-ai-matrix.json';
const MCP_STATUS = 'docs/mcp-status.md';
const TRIGGERS = '.cursor/rules/mcp-server-use-triggers.mdc';
const GENERATE_IMAGE_RULE = '.cursor/rules/cursor-generate-image-assets.mdc';

const IMAGE_MCP_ZOMBIE =
  /(?:dall-?e|stable-?diffusion|midjourney|image-?gen(?:eration)?-?mcp|screenshot-mcp)/i;

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function main() {
  const issues = [];
  const matrix = JSON.parse(read(MATRIX_PATH));
  const status = read(MCP_STATUS);
  const triggers = read(TRIGGERS);

  for (const name of matrix.registryRequired) {
    if (!status.includes(name)) {
      issues.push(`mcp-status.md missing registry name: ${name}`);
    }
    if (!triggers.includes(name) && !triggers.includes(name.replace(/-/g, '_'))) {
      const alt = name === 'duckduckgo-search' ? 'duckduckgo' : null;
      if (!(alt && triggers.includes(alt))) {
        issues.push(`mcp-server-use-triggers.mdc missing trigger hint for: ${name}`);
      }
    }
  }

  if (!status.includes('画像生成 MCP') || !status.includes('見送り')) {
    issues.push('mcp-status.md missing §見送り (image generation MCP deferred)');
  }
  if (!status.includes('cio-mcp-four-ai-matrix.json')) {
    issues.push('mcp-status.md missing pointer to data/cio-mcp-four-ai-matrix.json');
  }
  if (!triggers.includes('§4AI MCP')) {
    issues.push('mcp-server-use-triggers.mdc missing §4AI MCP section');
  }
  if (IMAGE_MCP_ZOMBIE.test(status) && !/見送り|削除済|除去/.test(status)) {
    issues.push('mcp-status.md may list image-gen MCP without deferred marker');
  }

  if (!fs.existsSync(path.join(root, GENERATE_IMAGE_RULE))) {
    issues.push(`missing ${GENERATE_IMAGE_RULE}`);
  }

  const cioAllow = new Set(matrix.roles.cio.mcpAllow);
  for (const name of matrix.registryRequired) {
    if (!cioAllow.has(name)) {
      issues.push(`matrix roles.cio.mcpAllow missing required: ${name}`);
    }
  }

  if (issues.length) {
    console.error('[verify-mcp-four-ai-alignment] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify-mcp-four-ai-alignment] OK (ledger ↔ matrix ↔ triggers aligned)');
  process.exit(0);
}

main();
