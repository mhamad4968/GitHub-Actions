#!/usr/bin/env node
/** Phase 2 検証 — 新② 社員マスタ */
import { fetchJson, getKintoneConfig, loadAppIds } from './lib/business-improvement-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { employeeAppId: appId, settingsAppId } = loadAppIds();
  if (!appId) throw new Error('employeeAppId missing');

  const q = encodeURIComponent('order by $id asc limit 500');
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${q}&totalCount=true&fields[0]=user_name&fields[1]=dept_name&fields[2]=employment_status`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });

  const active = (j.records || []).filter((r) => r.employment_status?.value === '在籍').length;

  console.log(JSON.stringify({
    employeeAppId: appId,
    settingsAppId,
    totalCount: j.totalCount,
    activeCount: active,
    sample: j.records?.[0]?.user_name?.value ?? null,
  }, null, 2));

  if (Number(j.totalCount) < 200) throw new Error(`expected ~266 from 595, got ${j.totalCount}`);
  console.log('[verify] Phase2 employee master OK');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
