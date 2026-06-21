#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIds } from './lib/total-network-kintone.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { dbAppId, dashAppId } = loadAppIds();
if (!dbAppId || !dashAppId) {
  console.error('dbAppId/dashAppId missing');
  process.exit(1);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: true, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

run('node', [`scripts/cio-deploy-preflight-guard.mjs`, String(dbAppId)]);
run('npx', [
  'dotenv',
  '-e',
  '.env',
  '-e',
  '.env.proxy',
  '--',
  'node',
  'scripts/deploy-customization.js',
  String(dbAppId),
  'customize/total-network-db/desktop.js',
]);

run('npm', ['run', 'total-network:bundle-dash']);
run('node', [`scripts/cio-deploy-preflight-guard.mjs`, String(dashAppId)]);
run('npx', [
  'dotenv',
  '-e',
  '.env',
  '-e',
  '.env.proxy',
  '--',
  'node',
  'scripts/deploy-customization.js',
  String(dashAppId),
  'customize/total-network-dash/desktop.js',
]);

console.log(`deploy OK db=${dbAppId} dash=${dashAppId}`);
