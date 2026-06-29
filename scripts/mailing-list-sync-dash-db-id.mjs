#!/usr/bin/env node
/** Sync APP_DB in mailing-list-dash/desktop.src.js from mailing-list-app-ids.json */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIds } from './lib/mailing-list-kintone.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = path.join(root, 'customize', 'mailing-list-dash', 'desktop.src.js');
const { dbAppId } = loadAppIds();
if (!dbAppId) {
  console.error('[mailing-list-sync-dash-db-id] dbAppId missing');
  process.exit(1);
}
let src = readFileSync(srcPath, 'utf8');
const target = `var APP_DB = ${dbAppId};`;
if (src.includes(target)) {
  console.log(`[mailing-list-sync-dash-db-id] APP_DB=${dbAppId} (unchanged)`);
  process.exit(0);
}
const next = src.replace(/var APP_DB = \d+;/, target);
if (next === src) {
  console.error('[mailing-list-sync-dash-db-id] APP_DB line not found');
  process.exit(1);
}
writeFileSync(srcPath, next, 'utf8');
console.log(`[mailing-list-sync-dash-db-id] APP_DB=${dbAppId}`);
