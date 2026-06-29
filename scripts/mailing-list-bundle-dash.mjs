#!/usr/bin/env node
/** SheetJS + dept master + dash source → desktop.js */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'mailing-list-dash');

const sync = spawnSync('node', ['scripts/mailing-list-sync-dash-db-id.mjs'], {
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
const deptMaster = readFileSync(path.join(root, 'scripts/data/mailing-list-dept-master.json'), 'utf8');
const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
const banner = `/* kintone-ai-lab bundle: SheetJS ${xlsxVersion} + mailing-list-dash/desktop.src.js — do not edit by hand */\n`;
const deptInject = `/* AUTO:mailing-list-dept-master */\nvar ML_DEPT_MASTER = ${deptMaster.trim()};\n`;
writeFileSync(path.join(dir, 'desktop.js'), banner + xlsx + '\n' + deptInject + src, 'utf8');
console.log('bundled customize/mailing-list-dash/desktop.js');

const lint = spawnSync('npm', ['run', 'lint:customize', '--silent'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (lint.status !== 0) {
  console.error('[mailing-list:bundle-dash] lint:customize NG');
  process.exit(1);
}
console.log('[mailing-list:bundle-dash] lint:customize OK');
