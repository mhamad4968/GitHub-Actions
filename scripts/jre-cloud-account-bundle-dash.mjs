#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'jre-cloud-account-dash');

const sync = spawnSync('node', ['scripts/jre-cloud-account-sync-dash-db-id.mjs'], {
  cwd: root,
  encoding: 'utf8',
  shell: false,
});
if (sync.status !== 0) {
  console.error(sync.stdout || sync.stderr);
  process.exit(sync.status || 1);
}

const xlsxVersion = JSON.parse(
  readFileSync(path.join(root, 'node_modules/xlsx/package.json'), 'utf8'),
).version;
const xlsx = readFileSync(path.join(root, 'node_modules/xlsx/dist/xlsx.full.min.js'), 'utf8');
const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
const banner =
  '/* kintone-ai-lab bundle: SheetJS ' +
  xlsxVersion +
  ' + customize/jre-cloud-account-dash/desktop.src.js */\n';
writeFileSync(path.join(dir, 'desktop.js'), banner + xlsx + '\n' + src, 'utf8');
console.log('bundled customize/jre-cloud-account-dash/desktop.js');

const lint = spawnSync('npm', ['run', 'lint:customize', '--silent'], { cwd: root, encoding: 'utf8', shell: true });
if (lint.status !== 0) {
  console.error('[jre-cloud:bundle-dash] lint NG');
  process.exit(1);
}
console.log('[jre-cloud:bundle-dash] lint OK');
