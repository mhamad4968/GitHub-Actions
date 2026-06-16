#!/usr/bin/env node
/** Copy dash source → desktop.js for kintone deploy (lint は desktop.src.js) */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'vpn-account-dash');

// APP_DB を vpn-account-app-ids.json から同期してから bundle
const sync = spawnSync('node', ['scripts/vpn-account-sync-dash-db-id.mjs'], {
  cwd: root,
  encoding: 'utf8',
  shell: false,
});
if (sync.status !== 0) {
  console.error(sync.stdout || sync.stderr);
  process.exit(sync.status || 1);
}

const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
writeFileSync(path.join(dir, 'desktop.js'), src, 'utf8');
console.log('bundled customize/vpn-account-dash/desktop.js');

const lint = spawnSync('npm', ['run', 'lint:customize', '--silent'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (lint.status !== 0) {
  console.error('[vpn-account:bundle-dash] lint:customize NG');
  process.exit(1);
}
console.log('[vpn-account:bundle-dash] lint:customize OK');
