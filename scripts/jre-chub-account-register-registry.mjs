#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIds } from './lib/jre-chub-account-kintone.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { dbAppId, dashAppId } = loadAppIds();
if (!dbAppId || !dashAppId) {
  console.error('dbAppId/dashAppId missing');
  process.exit(1);
}

function run(args) {
  const r = spawnSync('node', ['scripts/register-kintone-customize-registry.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) process.exit(r.status || 1);
}

run(['--dir', 'jre-chub-account-db', '--app', String(dbAppId)]);
run(['--dir', 'jre-chub-account-dash', '--app', String(dashAppId), '--bundle-npm', 'jre-chub:bundle-dash']);
console.log(`registry OK db=${dbAppId} dash=${dashAppId}`);
