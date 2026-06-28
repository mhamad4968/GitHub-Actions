#!/usr/bin/env node
/**
 * NAS管理台帳DB (748): 購入日・購入先フィールドを preview へ POST し deploy。
 *
 *   npm run nas-ledger:add-purchase-fields:dry-run
 *   npm run nas-ledger:add-purchase-fields
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/nas-ledger-kintone.mjs';

const FIELD_CODES = ['purchase_date', 'purchase_vendor', 'purchase_vendor_other'];
const FRAGMENT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'data',
  'nas-ledger-add-purchase-fields.json',
);

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId: appId } = loadAppIds();
  if (!appId) throw new Error('dbAppId missing');

  const raw = JSON.parse(readFileSync(FRAGMENT_PATH, 'utf8'));
  const properties = raw.properties;
  if (!properties) throw new Error(`${FRAGMENT_PATH}: missing properties`);

  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  const missing = FIELD_CODES.filter((code) => !cur.properties?.[code]);
  if (!missing.length) {
    console.log(`[nas-ledger] app=${appId} purchase fields already exist — skip POST`);
    return;
  }

  const toAdd = {};
  for (const code of missing) {
    if (!properties[code]) throw new Error(`${FRAGMENT_PATH}: missing ${code}`);
    toAdd[code] = properties[code];
  }

  if (dryRun) {
    console.log(JSON.stringify({ app: appId, properties: toAdd }, null, 2));
    console.log('[dry-run] OK — no POST');
    return;
  }

  const posted = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties: toAdd }),
  });
  await deployApp(baseUrl, headers, appId, posted.revision);
  console.log(`[nas-ledger] SUCCESS app=${appId} added: ${missing.join(', ')}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
