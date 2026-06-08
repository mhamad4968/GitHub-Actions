#!/usr/bin/env node
/**
 * Apple ID DB（693）に端末交換日フィールドを追加（既存アプリ向け・冪等）
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/apple-id-add-device-exchange-field.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/apple-id-add-device-exchange-field.mjs --dry-run
 */
import { readFileSync } from 'node:fs';
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  FIELDS_PATH,
} from './lib/apple-id-kintone.mjs';

const FIELD_CODE = 'device_exchange_date';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId } = loadAppIds();
  if (!dbAppId) throw new Error('apple-id-app-ids.json: dbAppId missing');

  const defs = JSON.parse(readFileSync(FIELDS_PATH, 'utf8')).properties;
  const prop = defs[FIELD_CODE];
  if (!prop) throw new Error(`missing ${FIELD_CODE} in apple-id-db-fields.json`);

  const form = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${dbAppId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  if (form.properties?.[FIELD_CODE]) {
    console.log(`[apple-id-add-field] OK already exists app=${dbAppId} code=${FIELD_CODE}`);
    return;
  }

  if (dryRun) {
    console.log(`dry-run: would POST ${FIELD_CODE} to app=${dbAppId} revision=${form.revision}`);
    return;
  }

  const res = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: dbAppId, properties: { [FIELD_CODE]: prop } }),
  });
  console.log(`[apple-id-add-field] POST revision=${res.revision}`);

  await deployApp(baseUrl, headers, dbAppId, res.revision);
  console.log(`[apple-id-add-field] deploy OK app=${dbAppId}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
