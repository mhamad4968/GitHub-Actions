#!/usr/bin/env node
/**
 * SheetJS(xlsx) + customize/tokai-ipad-dash/desktop.src.js → desktop.js に結合し、
 * customize 全体の lint:customize を実行する（R36: bundle 後 lint は desktop.src.js 側で行う）。
 *
 * 事前に scripts/tokai-ipad-sync-dash-db-id.mjs で APP_DB / SYNC_RELAY_URL を確定させる。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'tokai-ipad-dash');

const sync = spawnSync('node', ['scripts/tokai-ipad-sync-dash-db-id.mjs'], {
  cwd: root,
  encoding: 'utf8',
  shell: false,
  env: process.env,
});
if (sync.stdout) process.stdout.write(sync.stdout);
if (sync.stderr) process.stderr.write(sync.stderr);
if (sync.status !== 0) {
  console.error('[tokai-ipad:bundle-dash] sync-dash-db-id failed');
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
  ' + customize/tokai-ipad-dash/desktop.src.js — do not edit by hand */\n';
writeFileSync(path.join(dir, 'desktop.js'), banner + xlsx + '\n' + src, 'utf8');
console.log('bundled customize/tokai-ipad-dash/desktop.js');

const lint = spawnSync('npm', ['run', 'lint:customize', '--silent'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (lint.stdout) process.stdout.write(lint.stdout);
if (lint.stderr) process.stderr.write(lint.stderr);
if (lint.status !== 0) {
  console.error('[tokai-ipad:bundle-dash] lint:customize NG — desktop.src.js を修正して再実行');
  process.exit(1);
}
console.log('[tokai-ipad:bundle-dash] lint:customize OK');
