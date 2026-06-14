#!/usr/bin/env node
/** Concat qrcode vendor + dash source → desktop.js for kintone deploy (R36: bundle 後 lint は desktop.src.js) */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'wifi-ssid-dash');
const vendor = readFileSync(path.join(dir, 'qrcode-vendor.js'), 'utf8');
const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
writeFileSync(path.join(dir, 'desktop.js'), `${vendor}\n${src}`, 'utf8');
console.log('bundled customize/wifi-ssid-dash/desktop.js');

const lint = spawnSync('npm', ['run', 'lint:customize', '--silent'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (lint.status !== 0) {
  console.error('[wifi-ssid:bundle-dash] lint:customize NG — desktop.src.js を修正して再実行');
  process.exit(1);
}
console.log('[wifi-ssid:bundle-dash] lint:customize OK');
