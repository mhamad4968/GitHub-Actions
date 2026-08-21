#!/usr/bin/env node
/**
 * Excel 兼務行 → 776 に row_role=兼務 で追加。氏名+mail → なければ employee_no → 氏名のみ候補。
 * Usage: npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-sync-776-concurrent.mjs
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCEL =
  process.env.EMPLOYEE_ROSTER_XLSX ||
  'C:\\tmp\\社員名簿（正社員・準社員）\\社員一覧表.xlsx';
const APP_776 = '776';

const normName = (s) =>
  String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[　\s]+/g, '')
    .trim()
    .toLowerCase();
const normMail = (s) =>
  String(s ?? '')
    .replace(/\u00a0/g, '')
    .trim()
    .toLowerCase();

const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

const wb = XLSX.readFile(EXCEL);
const sheet = wb.SheetNames.find((n) => n.includes('一覧')) || wb.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' });
const concurrent = [];
for (let i = 1; i < rows.length; i++) {
  const title = String(rows[i][3] ?? '');
  if (!title.includes('兼務')) continue;
  concurrent.push({
    excelRow: i + 1,
    site: String(rows[i][1] ?? '').trim(),
    dept: String(rows[i][2] ?? '').trim(),
    title,
    employee_no: String(rows[i][4] ?? '').trim(),
    user_name: String(rows[i][5] ?? '').trim(),
    mail: String(rows[i][6] ?? '')
      .replace(/\u00a0/g, '')
      .trim(),
  });
}

const primary = [];
let offset = 0;
for (;;) {
  const { records } = await client.record.getRecords({
    app: APP_776,
    fields: [
      '$id',
      'source_595_id',
      'emp_id_ref',
      'employee_no',
      'user_name',
      'mail',
      'employment_category',
      'row_role',
    ],
    query: `row_role in ("本務") order by $id asc limit 500 offset ${offset}`,
  });
  primary.push(...records);
  if (records.length < 500) break;
  offset += 500;
}

const existingConc = [];
offset = 0;
for (;;) {
  const { records } = await client.record.getRecords({
    app: APP_776,
    fields: ['source_595_id', 'dept_name', 'job_title', 'row_role'],
    query: `row_role in ("兼務") order by $id asc limit 500 offset ${offset}`,
  });
  existingConc.push(...records);
  if (records.length < 500) break;
  offset += 500;
}
const existingKey = new Set(
  existingConc.map(
    (r) =>
      `${r.source_595_id?.value}|${r.dept_name?.value}|${r.job_title?.value}`,
  ),
);

function findPrimary(ex) {
  const byMail = primary.filter(
    (p) =>
      normName(p.user_name?.value) === normName(ex.user_name) &&
      normMail(p.mail?.value) &&
      normMail(p.mail?.value) === normMail(ex.mail),
  );
  if (byMail.length === 1) return { hit: byMail[0], how: 'name+mail' };
  if (ex.employee_no) {
    const byNo = primary.filter((p) => (p.employee_no?.value || '') === ex.employee_no);
    if (byNo.length === 1) return { hit: byNo[0], how: 'employee_no' };
  }
  const byName = primary.filter(
    (p) => normName(p.user_name?.value) === normName(ex.user_name),
  );
  if (byName.length === 1) return { hit: byName[0], how: 'name-only' };
  return { hit: null, how: 'none', candidates: byName.length };
}

const toAdd = [];
const skipped = [];
const unmatched = [];
for (const ex of concurrent) {
  const { hit, how, candidates } = findPrimary(ex);
  if (!hit) {
    unmatched.push({ excel: ex, reason: 'no primary', candidates });
    continue;
  }
  const titleClean = ex.title.replace(/[（(]?兼務[）)]?/g, '').trim() || ex.title;
  const key = `${hit.source_595_id.value}|${ex.dept}|${titleClean}`;
  if (existingKey.has(key)) {
    skipped.push({ excel: ex, reason: 'already', how });
    continue;
  }
  toAdd.push({
    source_595_id: { value: hit.source_595_id.value },
    emp_id_ref: { value: hit.emp_id_ref?.value ?? '' },
    employee_no: { value: hit.employee_no?.value || ex.employee_no },
    user_name: { value: hit.user_name?.value || ex.user_name },
    mail: { value: hit.mail?.value || ex.mail },
    employment_category: { value: hit.employment_category?.value ?? '' },
    job_title: { value: titleClean },
    dept_name: { value: ex.dept },
    group_name: { value: ex.site },
    row_role: { value: '兼務' },
    is_primary: { value: '兼務' },
    match_status: { value: '一致' },
    _how: how,
  });
}

console.log(
  JSON.stringify(
    {
      concurrentExcel: concurrent.length,
      primary776: primary.length,
      toAdd: toAdd.length,
      skipped: skipped.length,
      unmatched: unmatched.length,
      how: toAdd.map((r) => r._how),
      unmatched,
    },
    null,
    2,
  ),
);

for (const r of toAdd) delete r._how;
if (toAdd.length) {
  await client.record.addRecords({ app: APP_776, records: toAdd });
}

const outDir = path.join(ROOT, 'logs', 'employee-roster');
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.writeFileSync(
  path.join(outDir, `sync-776-concurrent-${stamp}.json`),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      added: toAdd.length,
      skipped: skipped.length,
      unmatched,
      concurrent,
    },
    null,
    2,
  ),
  'utf8',
);
console.log(`[sync-776-concurrent] DONE added=${toAdd.length}`);
