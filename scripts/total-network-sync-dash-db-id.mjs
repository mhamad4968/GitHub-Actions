#!/usr/bin/env node
/** Patch APP_DB in total-network-dash/desktop.src.js from total-network-app-ids.json */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIds } from './lib/total-network-kintone.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dashSrc = path.join(root, 'customize/total-network-dash/desktop.src.js');
const { dbAppId, dashAppId } = loadAppIds();

if (!dbAppId || !dashAppId) {
  console.error('dbAppId/dashAppId missing. Run total-network:create-db && total-network:create-dash first.');
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
