#!/usr/bin/env node
/** SheetJS + new-pc-ledger-v1/desktop.js → desktop.bundle.js for kintone deploy */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'new-pc-ledger-v1');

const xlsxPath = path.join(root, 'node_modules/xlsx/dist/xlsx.full.min.js');
const xlsxVersion = JSON.parse(readFileSync(path.join(root, 'node_modules/xlsx/package.json'), 'utf8')).version;
const xlsx = readFileSync(xlsxPath, 'utf8');
const src = readFileSync(path.join(dir, 'desktop.js'), 'utf8');
const banner =
  '/* kintone-ai-lab bundle: SheetJS ' +
  xlsxVersion +
  ' + new-pc-ledger-v1/desktop.js — do not edit by hand */\n';
writeFileSync(path.join(dir, 'desktop.bundle.js'), banner + xlsx + '\n' + src, 'utf8');
console.log('bundled customize/new-pc-ledger-v1/desktop.bundle.js');

const lint = spawnSync('npm', ['run', 'lint:customize', '--silent'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (lint.status !== 0) {
  console.error('[pc-ledger:674:bundle-desktop] lint:customize NG — desktop.js を修正して再実行');
  process.exit(1);
}
console.log('[pc-ledger:674:bundle-desktop] lint:customize OK');
