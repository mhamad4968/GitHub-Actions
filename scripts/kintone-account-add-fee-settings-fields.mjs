#!/usr/bin/env node
/**
 * Kintoneアカウント DB 752 — 契約数・月額設定レコード用フィールド追加（734 型）
 *   npm run kintone-account:add-fee-settings-fields
 */
import { execSync } from 'node:child_process';
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/kintone-account-kintone.mjs';

const NEW_FIELDS = {
  record_kind: {
    type: 'SINGLE_LINE_TEXT',
    code: 'record_kind',
    label: 'レコード種別',
  },
  snapshot_month: {
    type: 'SINGLE_LINE_TEXT',
    code: 'snapshot_month',
    label: '設定対象月',
  },
  contract_total: {
    type: 'NUMBER',
    code: 'contract_total',
    label: '総契約数',
  },
  unit_price_monthly: {
    type: 'NUMBER',
    code: 'unit_price_monthly',
    label: '1アカウント月額',
  },
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  execSync('node scripts/generate-kintone-account-db-fields.mjs', { stdio: 'inherit' });
  console.log('[kintone-account:add-fee-settings-fields] kintone-account-db-fields.json regenerated');

  const appId = loadAppIds().dbAppId;
  if (!appId) {
    console.error('dbAppId missing — run kintone-account:setup first');
    process.exit(1);
  }

  if (dryRun) {
    console.log(JSON.stringify({ appId, properties: NEW_FIELDS }, null, 2));
    return;
  }

  const { baseUrl, headers } = getKintoneConfig();
  const res = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties: NEW_FIELDS }),
  });
  console.log(`kintone fields revision=${res.revision}`);
  await deployApp(baseUrl, headers, appId, res.revision);
  console.log(`deploy OK app=${appId}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
