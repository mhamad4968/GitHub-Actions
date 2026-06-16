#!/usr/bin/env node
/**
 * VPN DB app 733 — 所属ドロップダウンを vpn-account-depts.json で更新
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FIELDS_PATH,
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  loadDeptList,
} from './lib/vpn-account-kintone.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildDeptOptions(depts) {
  const options = {};
  depts.forEach((d, i) => {
    options[d] = { label: d, index: String(i) };
  });
  return options;
}

function regenerateFieldsJson(depts) {
  const raw = JSON.parse(readFileSync(FIELDS_PATH, 'utf8'));
  raw.properties.dept.options = buildDeptOptions(depts);
  writeFileSync(FIELDS_PATH, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const depts = loadDeptList();
  regenerateFieldsJson(depts);
  console.log(`depts=${depts.length} fields json updated`);

  const appId = loadAppIds().dbAppId;
  if (!appId) {
    console.error('dbAppId missing');
    process.exit(1);
  }

  if (dryRun) {
    console.log(JSON.stringify({ appId, depts }, null, 2));
    return;
  }

  const { baseUrl, headers } = getKintoneConfig();
  const res = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: appId,
      properties: {
        dept: {
          type: 'DROP_DOWN',
          code: 'dept',
          label: '所属',
          options: buildDeptOptions(depts),
        },
      },
    }),
  });
  console.log(`kintone dept field revision=${res.revision}`);
  await deployApp(baseUrl, headers, appId, res.revision);
  console.log(`deploy OK app=${appId}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
