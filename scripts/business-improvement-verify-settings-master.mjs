#!/usr/bin/env node
/** Phase 1 検証 — 新④ 設定マスタ */
import { fetchJson, getKintoneConfig, loadAppIds } from './lib/business-improvement-kintone.mjs';

const WF_TEST_DEPARTMENT = '【WFテスト】開発検証用';
const ADMIN_LOGIN_CODE = 'admin';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { settingsAppId: appId } = loadAppIds();
  if (!appId) throw new Error('settingsAppId missing');

  const q = encodeURIComponent('order by $id asc limit 500');
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${q}&totalCount=true&fields[0]=record_kind&fields[1]=dept_name&fields[2]=applicant_login&fields[3]=manager_login&fields[4]=branch_manager_login&fields[5]=hr_director_login&fields[6]=eval_items`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });

  const org = (j.records || []).filter((r) => r.record_kind?.value === '所属行');
  const productionOrg = org.filter((r) => r.dept_name?.value !== WF_TEST_DEPARTMENT);
  const testOrg = org.filter((r) => r.dept_name?.value === WF_TEST_DEPARTMENT);
  const commonRows = (j.records || []).filter((r) => r.record_kind?.value === '共通設定');
  const common = commonRows[0];
  const testLoginsAreAdmin = testOrg.length === 1 && [
    'applicant_login',
    'manager_login',
    'branch_manager_login',
    'hr_director_login',
  ].every((field) => testOrg[0]?.[field]?.value === ADMIN_LOGIN_CODE);

  console.log(JSON.stringify({
    appId,
    totalCount: j.totalCount,
    productionOrgRows: productionOrg.length,
    testOrgRows: testOrg.length,
    commonRows: commonRows.length,
    testLoginsAreAdmin,
    jinji: common?.hr_director_login?.value ?? null,
    evalItemRows: common?.eval_items?.value?.length ?? 0,
  }, null, 2));

  if (Number(j.totalCount) !== 32) throw new Error(`expected 32 records, got ${j.totalCount}`);
  if (org.length !== 31) throw new Error(`expected 31 org rows, got ${org.length}`);
  if (productionOrg.length !== 30) throw new Error(`expected 30 production org rows, got ${productionOrg.length}`);
  if (testOrg.length !== 1) throw new Error(`expected 1 test org row, got ${testOrg.length}`);
  if (!testLoginsAreAdmin) throw new Error('test row logins must all be admin');
  if (commonRows.length !== 1) throw new Error(`expected 1 common row, got ${commonRows.length}`);
  if (common?.hr_director_login?.value !== 'jinji') throw new Error('jinji mismatch');
  if ((common?.eval_items?.value?.length ?? 0) !== 20) throw new Error('eval_items != 20');
  console.log('[verify] Phase1 settings master OK');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
