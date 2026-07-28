#!/usr/bin/env node
/**
 * 東海支店 iPad 台帳 — customize path registry へ DB(769) / Dash(770) を登録。
 * 既存の tokai-ipad-db エントリは温存し、tokai-ipad-dash をバンドル型で追加登録する。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIds } from './lib/tokai-ipad-kintone.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { dbAppId, dashAppId } = loadAppIds();

if (!dbAppId || !dashAppId) {
  console.error('dbAppId / dashAppId missing in scripts/data/tokai-ipad-app-ids.json');
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

run(['--dir', 'tokai-ipad-db', '--app', String(dbAppId)]);
run(['--dir', 'tokai-ipad-dash', '--app', String(dashAppId), '--bundle-npm', 'tokai-ipad:bundle-dash']);
console.log(`registry OK db=${dbAppId} dash=${dashAppId}`);
