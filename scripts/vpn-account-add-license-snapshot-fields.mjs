#!/usr/bin/env node
/**
 * VPN DB app 733 — 月次ライセンス集計スナップショット用フィールド追加
 *   snapshot_month (YYYY-MM) / snapshot_json (所属別口数 JSON)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  FIELDS_PATH,
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/vpn-account-kintone.mjs';

function patchFieldsJson() {
  const raw = JSON.parse(readFileSync(FIELDS_PATH, 'utf8'));
  raw.properties.snapshot_month = {
    type: 'SINGLE_LINE_TEXT',
    code: 'snapshot_month',
    label: '集計対象月',
    required: false,
    noLabel: false,
    defaultValue: '',
  };
  raw.properties.snapshot_json = {
    type: 'MULTI_LINE_TEXT',
    code: 'snapshot_json',
    label: '集計JSON',
    required: false,
    noLabel: false,
    defaultValue: '',
  };
  writeFileSync(FIELDS_PATH, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  patchFieldsJson();
  console.log('vpn-account-db-fields.json updated (snapshot_month, snapshot_json)');

  const appId = loadAppIds().dbAppId;
  if (!appId) {
    console.error('dbAppId missing — run vpn-account:setup first');
    process.exit(1);
  }

  const properties = {
    snapshot_month: {
      type: 'SINGLE_LINE_TEXT',
      code: 'snapshot_month',
      label: '集計対象月',
    },
    snapshot_json: {
      type: 'MULTI_LINE_TEXT',
      code: 'snapshot_json',
      label: '集計JSON',
    },
  };

  if (dryRun) {
    console.log(JSON.stringify({ appId, properties }, null, 2));
    return;
  }

  const { baseUrl, headers } = getKintoneConfig();
  const res = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  console.log(`kintone fields revision=${res.revision}`);
  await deployApp(baseUrl, headers, appId, res.revision);
  console.log(`deploy OK app=${appId}`);
}

main().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
