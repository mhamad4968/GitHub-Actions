#!/usr/bin/env node
/**
 * 雇用区分一括:
 * - Excel名簿に載った人（employee_no が入っている／突合済）→ 社員
 * - それ以外の595 → その他
 * emp_id は触らない。776 も同期。
 *
 * Usage: npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-set-employment-category.mjs
 *        ... --dry-run
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const DRY = process.argv.includes('--dry-run');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_595 = '595';
const APP_776 = '776';

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const c595 = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: { apiToken: process.env.KINTONE_API_TOKEN_595 },
});
const cAll = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

async function fetchAll(client, app, fields) {
  const all = [];
  let offset = 0;
  for (;;) {
    const { records } = await client.record.getRecords({
      app,
      fields,
      query: `order by $id asc limit 500 offset ${offset}`,
    });
    all.push(...records);
    if (records.length < 500) break;
    offset += 500;
  }
  return all;
}

const rec595 = await fetchAll(c595, APP_595, [
  '$id',
  'emp_id',
  'employee_no',
  'user_name',
  'employment_category',
]);

// 名簿掲載 = employee_no が埋まっている（Excel突合で投入済）
const toShain = [];
const toSonota = [];
for (const r of rec595) {
  const no = String(r.employee_no?.value ?? '').trim();
  const cur = r.employment_category?.value ?? '';
  const target = no ? '社員' : 'その他';
  if (cur === target) continue;
  const row = { id: r.$id.value, emp_id: r.emp_id.value, user_name: r.user_name.value, from: cur, to: target };
  if (target === '社員') toShain.push(row);
  else toSonota.push(row);
}

console.log(
  JSON.stringify(
    {
      dryRun: DRY,
      total595: rec595.length,
      willSet社員: toShain.length,
      willSetその他: toSonota.length,
      sample社員: toShain.slice(0, 3),
      sampleその他: toSonota.slice(0, 3),
    },
    null,
    2,
  ),
);

if (!DRY) {
  const updates = [...toShain, ...toSonota].map((u) => ({
    id: u.id,
    record: { employment_category: { value: u.to } },
  }));
  let n = 0;
  for (const batch of chunk(updates, 100)) {
    await c595.record.updateRecords({ app: APP_595, records: batch });
    n += batch.length;
    console.log(`[595] employment_category updated ${n}/${updates.length}`);
  }

  // 776: source_595_id 経由で同じ区分を反映
  const rec776 = await fetchAll(cAll, APP_776, [
    '$id',
    'source_595_id',
    'employment_category',
    'employee_no',
  ]);
  const catBy595 = new Map();
  for (const r of await fetchAll(c595, APP_595, ['$id', 'employment_category'])) {
    catBy595.set(String(r.$id.value), r.employment_category?.value ?? '');
  }
  const upd776 = [];
  for (const r of rec776) {
    const sid = String(r.source_595_id?.value ?? '');
    const want = catBy595.get(sid) || (String(r.employee_no?.value ?? '').trim() ? '社員' : 'その他');
    if ((r.employment_category?.value ?? '') === want) continue;
    upd776.push({ id: r.$id.value, record: { employment_category: { value: want } } });
  }
  let m = 0;
  for (const batch of chunk(upd776, 100)) {
    await cAll.record.updateRecords({ app: APP_776, records: batch });
    m += batch.length;
    console.log(`[776] employment_category updated ${m}/${upd776.length}`);
  }
}

const outDir = path.join(ROOT, 'logs', 'employee-roster');
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.writeFileSync(
  path.join(outDir, `employment-category-${stamp}.json`),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      dryRun: DRY,
      社員: toShain.length,
      その他: toSonota.length,
      toShain,
      toSonota,
    },
    null,
    2,
  ),
  'utf8',
);
console.log('[employment-category] DONE');
