#!/usr/bin/env node
/** SheetJS + dash source → desktop.js for kintone deploy (lint は desktop.src.js) */
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

const xlsxPath = path.join(root, 'node_modules/xlsx/dist/xlsx.full.min.js');
const xlsxVersion = JSON.parse(
  readFileSync(path.join(root, 'node_modules/xlsx/package.json'), 'utf8'),
).version;
const xlsx = readFileSync(xlsxPath, 'utf8');
const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
const banner =
  '/* kintone-ai-lab bundle: SheetJS ' +
  xlsxVersion +
  ' + customize/vpn-account-dash/desktop.src.js — do not edit by hand */\n';
writeFileSync(path.join(dir, 'desktop.js'), banner + xlsx + '\n' + src, 'utf8');
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
