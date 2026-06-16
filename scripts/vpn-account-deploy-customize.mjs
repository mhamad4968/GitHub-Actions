#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIds } from './lib/vpn-account-kintone.mjs';

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
  'customize/vpn-account-db/desktop.js',
]);

run('npm', ['run', 'vpn-account:bundle-dash']);
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
  'customize/vpn-account-dash/desktop.js',
]);

console.log(`deploy OK db=${dbAppId} dash=${dashAppId}`);
