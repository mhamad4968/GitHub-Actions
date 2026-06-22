#!/usr/bin/env node
/** SheetJS + location master + dash source → desktop.js */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'mfp-ledger-dash');

const sync = spawnSync('node', ['scripts/mfp-ledger-sync-dash-db-id.mjs'], {
  cwd: root,
  encoding: 'utf8',
  shell: false,
});
if (sync.status !== 0) {
  console.error(sync.stdout || sync.stderr);
  process.exit(sync.status || 1);
}

const xlsxPath = path.join(root, 'node_modules/xlsx/dist/xlsx.full.min.js');
const xlsxVersion = JSON.parse(readFileSync(path.join(root, 'node_modules/xlsx/package.json'), 'utf8')).version;
const xlsx = readFileSync(xlsxPath, 'utf8');
const locMaster = readFileSync(path.join(root, 'scripts/data/jbis-location-sort-master.json'), 'utf8');
const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
const banner =
  '/* kintone-ai-lab bundle: SheetJS ' +
  xlsxVersion +
  ' + mfp-ledger-dash/desktop.src.js — do not edit by hand */\n';
const locInject =
  '/* AUTO:jbis-location-sort-master */\nvar MFP_LOCATION_MASTER = ' +
  locMaster.trim() +
  ';\n';
writeFileSync(path.join(dir, 'desktop.js'), banner + xlsx + '\n' + locInject + src, 'utf8');
console.log('bundled customize/mfp-ledger-dash/desktop.js');

const lint = spawnSync('npm', ['run', 'lint:customize', '--silent'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (lint.status !== 0) {
  console.error('[mfp-ledger:bundle-dash] lint:customize NG');
  process.exit(1);
}
console.log('[mfp-ledger:bundle-dash] lint:customize OK');
