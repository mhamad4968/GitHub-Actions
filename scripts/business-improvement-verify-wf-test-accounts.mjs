#!/usr/bin/env node
import { getKintoneConfig, fetchJson, loadAppIds } from './lib/business-improvement-kintone.mjs';

const TEST_DEPT = '【WFテスト】開発検証用';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const appId = loadAppIds().settingsAppId;
  const query = encodeURIComponent(`dept_name in ("${TEST_DEPT}", "全社共通設定")`);
  const url =
    `${baseUrl}/k/v1/records.json?app=${appId}&query=${query}` +
    '&fields[0]=dept_name&fields[1]=applicant_login&fields[2]=manager_login&fields[3]=branch_manager_login' +
    '&fields[4]=manager_email&fields[5]=branch_manager_email&fields[6]=hr_director_login&fields[7]=hr_director_email';
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const u = await fetchJson(`${baseUrl}/v1/users.json?codes[]=admin`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  console.log(JSON.stringify({ records697: j.records, adminEmail: u.users?.[0]?.email }, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
