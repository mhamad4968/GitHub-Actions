#!/usr/bin/env node
/**
 * Cross-platform mcp-local-rag ingest (Windows morning-prep / TSB-029 対策).
 * Replaces hardcoded WSL npx paths in package.json.
 *
 * Usage: node scripts/rag-ingest-path.mjs [.rag/extra-docs/|docs/]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB_PATH = path.join(REPO_ROOT, '.rag/lancedb');
const CACHE_DIR = path.join(REPO_ROOT, '.rag/models');
const target = process.argv[2] || '.rag/extra-docs/';

function resolveNpx() {
  if (process.platform === 'win32') {
    return 'npx';
  }
  const sh = path.join(REPO_ROOT, 'scripts/print-nvm-node-bin.sh');
  const r = spawnSync('bash', [sh], { cwd: REPO_ROOT, encoding: 'utf8' });
  if (r.status === 0) {
    const bin = r.stdout.trim();
    const npx = path.join(bin, 'npx');
    if (fs.existsSync(npx)) return npx;
  }
  return 'npx';
}

const npx = resolveNpx();
const args = [
  '--yes',
  'mcp-local-rag',
  '--db-path',
  DB_PATH,
  '--cache-dir',
  CACHE_DIR,
  'ingest',
  target,
];

console.log(`[rag-ingest-path] ${npx} mcp-local-rag ingest ${target}`);
const r = spawnSync(npx, args, {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, DB_PATH, CACHE_DIR },
});

if (r.error) {
  console.error(`[rag-ingest-path] ❌ ${r.error.message}`);
  process.exit(1);
}
process.exit(r.status === null ? 1 : r.status);
