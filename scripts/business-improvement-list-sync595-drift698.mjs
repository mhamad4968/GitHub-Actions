#!/usr/bin/env node
/** 595 に無く 698 にのみ存在するキー（drift698Only）を一覧 */
import { getKintoneConfig, loadAppIds, fetchJson } from './lib/business-improvement-kintone.mjs';
import { normalizeEmployeeKey } from './business-improvement-sync-595.mjs';

async function getAllRecords(baseUrl, headers, app, fields) {
  const out = [];
  let offset = 0;
  const limit = 500;
  for (;;) {
    const query = encodeURIComponent(`order by $id asc limit ${limit} offset ${offset}`);
    const params = fields.map((f, i) => `fields[${i}]=${encodeURIComponent(f)}`).join('&');
    const url = `${baseUrl}/k/v1/records.json?app=${app}&query=${query}&${params}`;
    const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const batch = j.records || [];
    out.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return out;
}

const { baseUrl, headers } = getKintoneConfig();
const employeeAppId = loadAppIds().employeeAppId;
const rows595 = await getAllRecords(baseUrl, headers, 595, ['user_name', 'dept_name']);
const rows698 = await getAllRecords(baseUrl, headers, employeeAppId, [
  'user_name',
  'dept_name',
  'group_name',
  'employment_status',
  '$id',
]);

const keys595 = new Set(
  rows595.map((r) => normalizeEmployeeKey(r.user_name?.value, r.dept_name?.value)),
);

const orphans = rows698
  .filter((r) => !keys595.has(normalizeEmployeeKey(r.user_name?.value, r.dept_name?.value)))
  .map((r) => ({
    id: r.$id?.value,
    user_name: r.user_name?.value,
    dept_name: r.dept_name?.value,
    group_name: r.group_name?.value,
    employment_status: r.employment_status?.value,
  }));

console.log(JSON.stringify({ drift698Only: orphans.length, orphans }, null, 2));
