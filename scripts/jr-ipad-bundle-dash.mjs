#!/usr/bin/env node
/** Copy dash source → desktop.js for kintone deploy (lint は desktop.src.js) */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'jr-ipad-dash');
const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
writeFileSync(path.join(dir, 'desktop.js'), src, 'utf8');
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
