#!/usr/bin/env node
/**
 * 776 list_sort 再計算 + 一覧ビュー（列・並び）設定
 * - 部署順: 680.sort_no（dept_name 一致）
 * - 部署内: 本務=595.sort / 兼務で役職に「部長」→先頭 / その他兼務は後方
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
const APP_680 = 680;
const DEPT_SCALE = 1000000;

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

function personRank(rowRole, jobTitle, sort595) {
  const role = String(rowRole || '');
  if (role === '兼務' && isBuchoTitle(jobTitle)) {
    return 1; // 部署先頭（兼務部長）
  }
  if (role !== '兼務') {
    const s = numOr(sort595, 0);
    if (s > 0) return 1000 + s; // 本務: 595.sort（部長→部員）
    return 900000;
  }
  // その他兼務: 本務の後ろ
  return 950000;
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

const dept680 = await fetchAll(cAll, APP_680, ['dept_name', 'group_name', 'sort_no']);
const deptSortByName = new Map();
for (const r of dept680) {
  const dn = String(r.dept_name?.value || '').trim();
  if (!dn) continue;
  const sn = numOr(r.sort_no?.value, 99990);
  if (!deptSortByName.has(dn) || sn < deptSortByName.get(dn)) {
    deptSortByName.set(dn, sn > 0 ? sn : 99990);
  }
}

const rec595 = await fetchAll(c595, APP_595, ['$id', 'sort']);
const sortBy595 = new Map();
for (const r of rec595) {
  sortBy595.set(String(r.$id.value), r.sort?.value ?? '');
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

const updates = [];
const samples = [];
for (const r of rec776) {
  const dept = String(r.dept_name?.value || '').trim();
  const deptSort = deptSortByName.get(dept) ?? 99990;
  const sid = String(r.source_595_id?.value ?? '');
  const role = r.row_role?.value ?? '本務';
  const title = r.job_title?.value ?? '';
  const pr = personRank(role, title, sortBy595.get(sid));
  const want = deptSort * DEPT_SCALE + pr;
  const cur = numOr(r.list_sort?.value, NaN);
  if (cur === want) continue;
  updates.push({
    id: r.$id.value,
    record: { list_sort: { value: String(want) } },
  });
  if (samples.length < 8) {
    samples.push({
      name: r.user_name?.value,
      dept,
      role,
      title,
      deptSort,
      personRank: pr,
      list_sort: want,
    });
  }
}

console.log(
  JSON.stringify(
    {
      dryRun: DRY,
      dept680: dept680.length,
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
  let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
  baseUrl = baseUrl.replace(/\/k$/, '');
  const user = requireEnv('KINTONE_USERNAME');
  const pass = requireEnv('KINTONE_PASSWORD');
  const headers = {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
    'Content-Type': 'application/json',
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64')}`;
  }
  const { 'Content-Type': _ct, ...headersNoCt } = headers;

  async function fetchJson(url, init) {
    const res = await fetch(url, init);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* noop */
    }
    if (!res.ok) {
      const msg =
        json?.code || json?.message
          ? `${json.code || ''} ${json.message || ''}`.trim()
          : text.slice(0, 800);
      throw new Error(`HTTP ${res.status} ${msg}`.trim());
    }
    return json;
  }

  // rename group_name label → 部署グループ
  await fetchJson(new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`), {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: APP_776,
      properties: {
        group_name: { type: 'SINGLE_LINE_TEXT', label: '部署グループ' },
      },
    }),
  });

  const getUrl = new URL(`${baseUrl}/k/v1/preview/app/views.json`);
  getUrl.searchParams.set('app', String(APP_776));
  const current = await fetchJson(getUrl, { method: 'GET', headers: headersNoCt });
  const merged = { ...(current.views || {}) };
  const viewBody = {
    type: 'LIST',
    name: '社員名簿',
    filterCond: '',
    sort: 'list_sort asc',
    index: '0',
    pager: true,
    device: 'ANY',
    fields: ['employee_no', 'group_name', 'dept_name', 'user_name', 'job_title', 'mail'],
  };
  // keep id if exists
  if (merged['社員名簿']?.id) {
    viewBody.id = merged['社員名簿'].id;
  }
  merged['社員名簿'] = { ...(merged['社員名簿'] || {}), ...viewBody };

  // demote other list views index
  for (const [name, v] of Object.entries(merged)) {
    if (name === '社員名簿') continue;
    if (v && v.type === 'LIST') {
      const idx = Number(v.index);
      if (!Number.isFinite(idx) || idx < 1) v.index = '1';
    }
  }

  const put = await fetchJson(new URL(`${baseUrl}/k/v1/preview/app/views.json`), {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: APP_776, views: merged }),
  });
  console.log(`[776 views] put revision=${put.revision}`);

  await fetchJson(new URL(`${baseUrl}/k/v1/preview/app/deploy.json`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: APP_776, revision: put.revision }] }),
  });

  const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  stUrl.searchParams.set('apps[0]', String(APP_776));
  for (let i = 0; i < 60; i++) {
    const st = await fetchJson(stUrl, { method: 'GET', headers: headersNoCt });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === 'SUCCESS') {
      console.log('[776 views] deploy SUCCESS');
      break;
    }
    if (status === 'FAIL' || status === 'CANCEL') {
      throw new Error(`deploy ${status}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.log('[776 list-sort/view] DONE');
