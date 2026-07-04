#!/usr/bin/env node
/** 698 社員マスタ — source595_id（595 一覧並び用）フィールド追加 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/business-improvement-kintone.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const props = JSON.parse(
  readFileSync(path.join(__dirname, 'data/business-improvement-employee-fields.json'), 'utf8'),
).properties;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const appId = loadAppIds().employeeAppId || 698;

  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  if (cur.properties?.source595_id) {
    console.log('field source595_id: already exists');
    return;
  }
  if (dryRun) {
    console.log(JSON.stringify({ app: appId, add: 'source595_id' }, null, 2));
    return;
  }
  const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties: { source595_id: props.source595_id } }),
  });
  console.log(`field added revision=${put.revision}`);
  await deployApp(baseUrl, headers, appId, put.revision);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
