#!/usr/bin/env node
/** SheetJS + dash source → desktop.js for kintone deploy (lint は desktop.src.js) */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'jr-ipad-dash');

const xlsxVersion = JSON.parse(
  readFileSync(path.join(root, 'node_modules/xlsx/package.json'), 'utf8'),
).version;
const xlsx = readFileSync(path.join(root, 'node_modules/xlsx/dist/xlsx.full.min.js'), 'utf8');
const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
const banner =
  '/* kintone-ai-lab bundle: SheetJS ' +
  xlsxVersion +
  ' + customize/jr-ipad-dash/desktop.src.js */\n';
writeFileSync(path.join(dir, 'desktop.js'), banner + xlsx + '\n' + src, 'utf8');
console.log('bundled customize/jr-ipad-dash/desktop.js');

const lint = spawnSync('npm', ['run', 'lint:customize', '--silent'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (lint.status !== 0) {
  console.error('[jr-ipad:bundle-dash] lint:customize NG — desktop.src.js を修正して再実行');
  process.exit(1);
}
console.log('[jr-ipad:bundle-dash] lint:customize OK');
