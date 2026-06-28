#!/usr/bin/env node
/** Sync APP_DB in desktop.src.js from nas-ledger-app-ids.json */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = JSON.parse(readFileSync(path.join(root, 'scripts/data/nas-ledger-app-ids.json'), 'utf8'));
const dbAppId = ids.dbAppId;
if (!dbAppId) {
  console.error('[nas-ledger:sync-db-id] dbAppId missing in nas-ledger-app-ids.json');
  process.exit(1);
}

const srcPath = path.join(root, 'customize/nas-ledger-dash/desktop.src.js');
let src = readFileSync(srcPath, 'utf8');
const next = src.replace(/var APP_DB = \d+;/, `var APP_DB = ${dbAppId};`);
if (next === src && !src.includes(`var APP_DB = ${dbAppId};`)) {
  const next2 = src.replace(/var APP_DB = null;/, `var APP_DB = ${dbAppId};`);
  if (next2 === src) {
    console.error('[nas-ledger:sync-db-id] APP_DB line not found');
    process.exit(1);
  }
  writeFileSync(srcPath, next2, 'utf8');
  console.log(`[nas-ledger:sync-db-id] APP_DB=${dbAppId}`);
  process.exit(0);
}
if (next !== src) writeFileSync(srcPath, next, 'utf8');
console.log(`[nas-ledger:sync-db-id] OK APP_DB=${dbAppId}`);
