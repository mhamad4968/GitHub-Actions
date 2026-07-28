#!/usr/bin/env node
/**
 * customize/tokai-ipad-dash/desktop.src.js の APP_DB / SYNC_RELAY_URL 定数を
 * scripts/data/tokai-ipad-app-ids.json と環境変数から確定値でパッチする。
 *
 *   node scripts/tokai-ipad-sync-dash-db-id.mjs
 *   TOKAI_IPAD_SYNC_RELAY_URL=http://127.0.0.1:17969 で相手先を上書き可。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIds } from './lib/tokai-ipad-kintone.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dashSrc = path.join(root, 'customize/tokai-ipad-dash/desktop.src.js');

const { dbAppId } = loadAppIds();
if (!dbAppId) {
  console.error('dbAppId missing in scripts/data/tokai-ipad-app-ids.json');
  process.exit(1);
}

const relayUrl = String(process.env.TOKAI_IPAD_SYNC_RELAY_URL || 'http://127.0.0.1:17969').replace(/\/+$/, '');

let s = readFileSync(dashSrc, 'utf8');

const dbRe = /var APP_DB = \d+;/;
if (!dbRe.test(s)) {
  console.error('APP_DB pattern not found in desktop.src.js');
  process.exit(1);
}
s = s.replace(dbRe, `var APP_DB = ${dbAppId};`);

const relayRe = /var SYNC_RELAY_URL = "[^"]*";/;
if (!relayRe.test(s)) {
  console.error('SYNC_RELAY_URL pattern not found in desktop.src.js');
  process.exit(1);
}
s = s.replace(relayRe, `var SYNC_RELAY_URL = "${relayUrl}";`);

writeFileSync(dashSrc, s, 'utf8');
console.log(`[tokai-ipad:sync-dash] patched APP_DB=${dbAppId} SYNC_RELAY_URL=${relayUrl}`);
