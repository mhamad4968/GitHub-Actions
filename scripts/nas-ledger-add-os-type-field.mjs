#!/usr/bin/env node
/**
 * NAS管理台帳DB (748): OS種類フィールドを preview へ POST し deploy。
 *
 *   npm run nas-ledger:add-os-type-field:dry-run
 *   npm run nas-ledger:add-os-type-field
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

const FIELD_CODE = 'os_type';
const FRAGMENT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'data',
  'nas-ledger-add-os-type-field.json',
);

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId: appId } = loadAppIds();
  if (!appId) throw new Error('dbAppId missing');

  const raw = JSON.parse(readFileSync(FRAGMENT_PATH, 'utf8'));
  const prop = raw.properties?.[FIELD_CODE];
  if (!prop) throw new Error(`${FRAGMENT_PATH}: missing ${FIELD_CODE}`);

  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  if (cur.properties?.[FIELD_CODE]) {
    console.log(`[nas-ledger] app=${appId} ${FIELD_CODE} already exists — skip POST`);
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ app: appId, properties: { [FIELD_CODE]: prop } }, null, 2));
    console.log('[dry-run] OK — no POST');
    return;
  }

  const posted = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties: { [FIELD_CODE]: prop } }),
  });
  await deployApp(baseUrl, headers, appId, posted.revision);
  console.log(`[nas-ledger] SUCCESS app=${appId} added: ${FIELD_CODE}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
