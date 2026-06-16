#!/usr/bin/env node
import {
  RECORD_KIND_SETTING,
  NEXT_USER_NUM_START,
  fetchJson,
  formatDateYmd,
  getKintoneConfig,
  loadAppIds,
  recordCount,
} from './lib/vpn-account-kintone.mjs';

const { baseUrl, headers } = getKintoneConfig();
const appId = loadAppIds().dbAppId;
const total = await recordCount(baseUrl, headers, appId);
console.log('total', total);

const q = encodeURIComponent(`record_kind in ("${RECORD_KIND_SETTING}") limit 1`);
const j = await fetchJson(`${baseUrl}/k/v1/records.json?app=${appId}&query=${q}`, {
  method: 'GET',
  headers: { ...headers, 'Content-Type': undefined },
});
if ((j.records || []).length) {
  console.log('settings exists');
  process.exit(0);
}

const rec = {
  record_kind: { value: RECORD_KIND_SETTING },
  next_user_num: { value: String(NEXT_USER_NUM_START) },
  account_label: { value: '（システム設定）' },
  dept: { value: 'システム推進室' },
  vpn_id: { value: '__vpn_settings__@kensetsutoso.fre' },
  password: { value: 'N/A' },
  registered_date: { value: formatDateYmd(new Date()) },
};
const res = await fetchJson(`${baseUrl}/k/v1/record.json`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ app: appId, record: rec }),
});
console.log('settings posted id=', res.id);
