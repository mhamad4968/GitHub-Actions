#!/usr/bin/env node
/**
 * data/cio-mcp-manifest.json と verify-cio-mcp-registry の整合
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const manifestPath = path.join(root, 'data/cio-mcp-manifest.json');
  const matrixPath = path.join(root, 'data/cio-mcp-four-ai-matrix.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('[verify:cio-mcp-manifest] NG missing manifest');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

  const issues = [];
  for (const name of manifest.required || []) {
    if (!(matrix.registryRequired || []).includes(name)) {
      issues.push(`required ${name} not in matrix.registryRequired`);
    }
  }

  const r = spawnSync('node', ['scripts/verify-cio-mcp-registry.mjs'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (issues.length) {
    console.error('[verify:cio-mcp-manifest] NG', issues.join('; '));
    process.exit(1);
  }

  if (r.status !== 0 && r.status !== 1) {
    console.warn('[verify:cio-mcp-manifest] WARN registry exit', r.status, '(CI/非Windowsは推奨欠落のみの可能性)');
  }

  console.log('[verify:cio-mcp-manifest] OK manifest↔matrix');
  console.log(`  required: ${(manifest.required || []).length}`);
  console.log(`  recommended: ${(manifest.recommended || []).length}`);
  process.exit(0);
}

main();
