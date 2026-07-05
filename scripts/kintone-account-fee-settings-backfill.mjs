#!/usr/bin/env node
/**
 * Kintoneアカウント DB 752 — 契約数・月額 既定値設定レコード整備
 *   npm run kintone-account:fee-settings-backfill -- --dry-run
 *   npm run kintone-account:fee-settings-backfill -- --apply
 */
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  MIGRATION_START_DATE,
} from './lib/kintone-account-kintone.mjs';

const RECORD_KIND_SETTING = '設定';
const FEE_LOGIN_DEFAULTS = '__kac_fee_defaults__';
const DEFAULT_CONTRACT = 77;
const DEFAULT_PRICE = 1800;

function parseArgs() {
  return {
    dryRun: process.argv.includes('--dry-run'),
    apply: process.argv.includes('--apply'),
  };
}

function settingsRecord() {
  return {
    record_kind: { value: RECORD_KIND_SETTING },
    login_id: { value: FEE_LOGIN_DEFAULTS },
    display_name: { value: '（契約・月額設定）' },
    login_name: { value: 'システム' },
    org: { value: '本社' },
    dept: { value: '役員室' },
    pay_site: { value: '本社' },
    account_type: { value: '特権アカウント' },
    status: { value: '使用中' },
    start_date: { value: MIGRATION_START_DATE },
    contract_total: { value: String(DEFAULT_CONTRACT) },
    unit_price_monthly: { value: String(DEFAULT_PRICE) },
    note: { value: 'システム設定（台帳753から編集）' },
  };
}

async function main() {
  const { dryRun, apply } = parseArgs();
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }

  const appId = loadAppIds().dbAppId;
  if (!appId) {
    console.error('dbAppId missing');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const q = `record_kind in ("${RECORD_KIND_SETTING}") and login_id = "${FEE_LOGIN_DEFAULTS}" limit 1`;
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`;
  const found = await fetchJson(url, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  if ((found.records || []).length) {
    console.log(`[fee-settings-backfill] defaults row exists id=${found.records[0].$id.value}`);
    return;
  }

  if (dryRun) {
    console.log('[fee-settings-backfill] would POST defaults row', settingsRecord());
    return;
  }

  const post = await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, record: settingsRecord() }),
  });
  console.log(`[fee-settings-backfill] created defaults id=${post.id} revision=${post.revision}`);
  await deployApp(baseUrl, headers, appId);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
