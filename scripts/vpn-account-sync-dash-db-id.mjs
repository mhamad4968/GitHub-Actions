#!/usr/bin/env node
/** Patch APP_DB in vpn-account-dash/desktop.src.js from vpn-account-app-ids.json */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIds } from './lib/vpn-account-kintone.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dashSrc = path.join(root, 'customize/vpn-account-dash/desktop.src.js');
const { dbAppId, dashAppId } = loadAppIds();

if (!dbAppId || !dashAppId) {
  console.error('dbAppId/dashAppId missing. Run vpn-account:create-db && vpn-account:create-dash first.');
  process.exit(1);
}

let s = readFileSync(dashSrc, 'utf8');
const re = /var APP_DB = \d+;/;
if (!re.test(s)) {
  console.error('APP_DB pattern not found in desktop.src.js');
  process.exit(1);
}
s = s.replace(re, `var APP_DB = ${dbAppId};`);
writeFileSync(dashSrc, s, 'utf8');
console.log(`patched APP_DB=${dbAppId} in desktop.src.js`);
console.log(`dashAppId=${dashAppId}`);
