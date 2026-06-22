#!/usr/bin/env node
/** Sync APP_DB in desktop.src.js from mfp-ledger-app-ids.json */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = JSON.parse(readFileSync(path.join(root, 'scripts/data/mfp-ledger-app-ids.json'), 'utf8'));
const dbAppId = ids.dbAppId;
if (!dbAppId) {
  console.error('[mfp-ledger:sync-db-id] dbAppId missing in mfp-ledger-app-ids.json');
  process.exit(1);
}

const srcPath = path.join(root, 'customize/mfp-ledger-dash/desktop.src.js');
let src = readFileSync(srcPath, 'utf8');
const next = src.replace(/var APP_DB = \d+;/, `var APP_DB = ${dbAppId};`);
if (next === src) {
  console.log(`[mfp-ledger:sync-db-id] OK APP_DB=${dbAppId} (unchanged)`);
  process.exit(0);
}
writeFileSync(srcPath, next, 'utf8');
console.log(`[mfp-ledger:sync-db-id] APP_DB=${dbAppId}`);
