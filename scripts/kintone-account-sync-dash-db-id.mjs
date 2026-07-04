#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIds } from './lib/kintone-account-kintone.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dashSrc = path.join(root, 'customize/kintone-account-dash/desktop.src.js');
const { dbAppId } = loadAppIds();

if (!dbAppId) {
  console.error('dbAppId missing.');
  process.exit(1);
}

let s = readFileSync(dashSrc, 'utf8');
const re = /var APP_DB = \d+;/;
if (!re.test(s)) {
  console.error('APP_DB pattern not found');
  process.exit(1);
}
s = s.replace(re, `var APP_DB = ${dbAppId};`);
writeFileSync(dashSrc, s, 'utf8');
console.log(`patched APP_DB=${dbAppId}`);
