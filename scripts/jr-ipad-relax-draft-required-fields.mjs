#!/usr/bin/env node
/**
 * App 720 — 694 型: 新規採番 POST 時は mgmt_dept / phone_number / model を空可にする。
 * 保存時必須は Dash validateRequired（SPEC §9.1 / Q13）が担保。
 */
import { deployApp, fetchJson, getKintoneConfig } from './lib/jr-ipad-kintone.mjs';

const APP_ID = Number(process.env.JR_IPAD_DB_APP_ID || 720);
const RELAX_CODES = ['mgmt_dept', 'phone_number', 'model'];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP_ID}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const properties = {};
  for (const code of RELAX_CODES) {
    const f = cur.properties[code];
    if (!f) throw new Error(`missing field: ${code}`);
    properties[code] = { ...f, required: false };
  }
  if (dryRun) {
    console.log(JSON.stringify({ app: APP_ID, relax: RELAX_CODES }, null, 2));
    return;
  }
  const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: APP_ID, properties }),
  });
  console.log(`fields PUT revision=${put.revision}`);
  await deployApp(baseUrl, headers, APP_ID, put.revision);
  console.log(`deploy OK app=${APP_ID}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
