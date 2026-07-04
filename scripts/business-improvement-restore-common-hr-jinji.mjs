#!/usr/bin/env node
/** 697 共通設定の人事部長を jinji に戻す */
import { getKintoneConfig, fetchJson, loadAppIds } from './lib/business-improvement-kintone.mjs';

const HR_LOGIN = process.env.BI_HR_DIRECTOR_LOGIN || 'jinji';
const HR_EMAIL = process.env.BI_HR_DIRECTOR_EMAIL || 'arai-s@j-bis.co.jp';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const appId = loadAppIds().settingsAppId;
  const q = encodeURIComponent('record_kind in ("共通設定") limit 1');
  const j = await fetchJson(`${baseUrl}/k/v1/records.json?app=${appId}&query=${q}&fields[0]=$id`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const common = j.records?.[0];
  if (!common) throw new Error('共通設定 not found');
  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(appId),
      id: common.$id.value,
      record: {
        hr_director_login: { value: HR_LOGIN },
        hr_director_email: { value: HR_EMAIL },
      },
    }),
  });
  console.log(JSON.stringify({ ok: true, hr_director_login: HR_LOGIN, hr_director_email: HR_EMAIL }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
