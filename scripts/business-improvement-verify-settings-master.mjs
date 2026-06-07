#!/usr/bin/env node
/** Phase 1 検証 — 新④ 設定マスタ */
import { fetchJson, getKintoneConfig, loadAppIds } from './lib/business-improvement-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { settingsAppId: appId } = loadAppIds();
  if (!appId) throw new Error('settingsAppId missing');

  const q = encodeURIComponent('order by $id asc limit 500');
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${q}&totalCount=true&fields[0]=record_kind&fields[1]=dept_name&fields[2]=hr_director_login&fields[3]=eval_items`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });

  const org = (j.records || []).filter((r) => r.record_kind?.value === '所属行');
  const common = (j.records || []).find((r) => r.record_kind?.value === '共通設定');

  console.log(JSON.stringify({
    appId,
    totalCount: j.totalCount,
    orgRows: org.length,
    jinji: common?.hr_director_login?.value ?? null,
    evalItemRows: common?.eval_items?.value?.length ?? 0,
    sampleOrg: org[0]?.dept_name?.value ?? null,
  }, null, 2));

  if (Number(j.totalCount) !== 31) throw new Error(`expected 31 records, got ${j.totalCount}`);
  if (org.length !== 30) throw new Error(`expected 30 org rows, got ${org.length}`);
  if (common?.hr_director_login?.value !== 'jinji') throw new Error('jinji mismatch');
  if ((common?.eval_items?.value?.length ?? 0) !== 20) throw new Error('eval_items != 20');
  console.log('[verify] Phase1 settings master OK');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
