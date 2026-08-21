#!/usr/bin/env node
/**
 * 595 → 776 本務行同期（初回用）。emp_id は emp_id_ref にコピーのみ。
 * Usage: npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-sync-776.mjs
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_595 = '595';
const APP_776 = '776';

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

async function fetchAll(app, fields, queryBase = '') {
  const all = [];
  let offset = 0;
  for (;;) {
    const q = `${queryBase}${queryBase ? ' ' : ''}order by $id asc limit 500 offset ${offset}`.trim();
    const { records } = await client.record.getRecords({ app, fields, query: q });
    all.push(...records);
    if (records.length < 500) break;
    offset += 500;
  }
  return all;
}

const src = await fetchAll(APP_595, [
  '$id',
  'emp_id',
  'employee_no',
  'user_name',
  'mail',
  'job_title',
  'dept_name',
  'group_name',
  'employment_category',
], 'employee_no != ""');

const existing = await fetchAll(APP_776, ['source_595_id']);
const have = new Set(existing.map((r) => String(r.source_595_id?.value ?? '')));

const toAdd = [];
for (const r of src) {
  const sid = String(r.$id.value);
  if (have.has(sid)) continue;
  toAdd.push({
    source_595_id: { value: r.$id.value },
    emp_id_ref: { value: r.emp_id?.value ?? '' },
    employee_no: { value: r.employee_no?.value ?? '' },
    user_name: { value: r.user_name?.value ?? '' },
    mail: { value: r.mail?.value ?? '' },
    job_title: { value: r.job_title?.value ?? '' },
    employment_category: { value: r.employment_category?.value ?? '' },
    dept_name: { value: r.dept_name?.value ?? '' },
    group_name: { value: r.group_name?.value ?? '' },
    row_role: { value: '本務' },
    is_primary: { value: '本務' },
    match_status: { value: '一致' },
  });
}

console.log(`[sync-776] source595_with_employee_no=${src.length} already=${have.size} toAdd=${toAdd.length}`);

let added = 0;
for (const batch of chunk(toAdd, 100)) {
  await client.record.addRecords({ app: APP_776, records: batch });
  added += batch.length;
  console.log(`[sync-776] added ${added}/${toAdd.length}`);
}

const outDir = path.join(ROOT, 'logs', 'employee-roster');
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(outDir, `sync-776-${stamp}.json`);
fs.writeFileSync(
  out,
  JSON.stringify(
    { at: new Date().toISOString(), source: src.length, added, skippedExisting: have.size },
    null,
    2,
  ),
  'utf8',
);
console.log(`[sync-776] DONE ${out}`);
