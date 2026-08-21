#!/usr/bin/env node
/**
 * 776 list_sort 再計算（595.sort 基準）+ 任意でビュー確認
 * - 本務: list_sort = sort * 10（社員マスタと同じ並び）
 * - 兼務・役職に「部長」: その部署の本務 min(sort)*10 - 1（部署先頭）
 * - その他兼務: その部署の本務 max(sort)*10 + 1+i
 * emp_id 不触
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-776-list-sort-and-view.mjs
 *   ... --dry-run
 *   ... --skip-view
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const DRY = process.argv.includes('--dry-run');
const SKIP_VIEW = process.argv.includes('--skip-view');
const APP_776 = 776;
const APP_595 = 595;
const SCALE = 10;

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isBuchoTitle(title) {
  return /部長/.test(String(title || ''));
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
      app: String(app),
      fields,
      query: `order by $id asc limit 500 offset ${offset}`,
    });
    all.push(...records);
    if (records.length < 500) break;
    offset += 500;
  }
  return all;
}

const rec595 = await fetchAll(c595, APP_595, ['$id', 'sort', 'dept_name']);
const sortBy595 = new Map();
const primarySortByDept = new Map(); // dept -> {min,max}
for (const r of rec595) {
  const sid = String(r.$id.value);
  const s = numOr(r.sort?.value, 0);
  sortBy595.set(sid, s);
  const dept = String(r.dept_name?.value || '').trim();
  if (!dept || s <= 0) continue;
  const cur = primarySortByDept.get(dept) || { min: s, max: s };
  cur.min = Math.min(cur.min, s);
  cur.max = Math.max(cur.max, s);
  primarySortByDept.set(dept, cur);
}

const rec776 = await fetchAll(cAll, APP_776, [
  '$id',
  'source_595_id',
  'dept_name',
  'job_title',
  'row_role',
  'list_sort',
  'user_name',
]);

// 兼務「その他」用カウンタ（部署ごと）
const otherKenmuCount = new Map();

const updates = [];
const samples = [];
for (const r of rec776) {
  const dept = String(r.dept_name?.value || '').trim();
  const sid = String(r.source_595_id?.value ?? '');
  const role = r.row_role?.value ?? '本務';
  const title = r.job_title?.value ?? '';
  const ownSort = numOr(sortBy595.get(sid), 0);
  const bounds = primarySortByDept.get(dept) || { min: ownSort || 999999, max: ownSort || 999999 };

  let want;
  if (role === '兼務' && isBuchoTitle(title)) {
    want = bounds.min * SCALE - 1;
  } else if (role === '兼務') {
    const i = otherKenmuCount.get(dept) || 0;
    otherKenmuCount.set(dept, i + 1);
    want = bounds.max * SCALE + 1 + i;
  } else {
    want = (ownSort > 0 ? ownSort : 999999) * SCALE;
  }

  const cur = numOr(r.list_sort?.value, NaN);
  if (cur === want) continue;
  updates.push({
    id: r.$id.value,
    record: { list_sort: { value: String(want) } },
  });
  if (samples.length < 10) {
    samples.push({
      name: r.user_name?.value,
      dept,
      role,
      title,
      ownSort,
      list_sort: want,
    });
  }
}

console.log(
  JSON.stringify(
    {
      dryRun: DRY,
      rec776: rec776.length,
      willUpdate: updates.length,
      samples,
    },
    null,
    2,
  ),
);

if (!DRY && updates.length) {
  let n = 0;
  for (const batch of chunk(updates, 100)) {
    await cAll.record.updateRecords({ app: String(APP_776), records: batch });
    n += batch.length;
    console.log(`[776] list_sort ${n}/${updates.length}`);
  }
}

if (!SKIP_VIEW && !DRY) {
  // ビューは既存「社員名簿」を維持（列・sort=list_sort）。ラベルのみ保険で再PUTしない。
  console.log('[776 views] skip (already configured); use --force-view to rewrite');
}

console.log('[776 list-sort] DONE');
void requireEnv;
