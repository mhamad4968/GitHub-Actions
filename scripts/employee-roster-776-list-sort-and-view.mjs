#!/usr/bin/env node
/**
 * 776 兼務行の group_name をマスタコードへ正規化し、list_sort を再計算。
 * - 本社→honsya / 東北支店→tohoku / 札幌・首都圏→reform 等
 * - 兼務「部長」: その部署に本務がいれば先頭、ただし支店は支店長より前に出さない
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const DRY = process.argv.includes('--dry-run');
const APP_776 = '776';
const APP_595 = '595';

/** Excel/兼務の日本語拠点 → 595 group_name コード */
const SITE_LABEL_TO_CODE = {
  本社: 'honsya',
  東北支店: 'tohoku',
  関越支店: 'kan-etsu',
  東京支店: 'tokyo',
  東海支店: 'tokai',
  札幌支店: 'reform',
  首都圏支店: 'reform',
  鉄構支店: 'tekko',
  湾岸工事所: 'wangan',
  リフォーム事業統括部: 'reform',
  リフォーム統括事業部: 'reform',
};

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isBuchoTitle(title) {
  return /部長/.test(String(title || ''));
}

function isShitenchoTitle(title) {
  const t = String(title || '');
  return /支店長/.test(t) && !/副支店長/.test(t);
}

/** 兼務部署名から支店本体名を抽出（例: 札幌支店工事部 → 札幌支店） */
function inferBranchDept(dept) {
  const m = String(dept || '').match(
    /(東北支店|関越支店|東京支店|東海支店|札幌支店|首都圏支店|鉄構支店)/,
  );
  return m ? m[1] : '';
}

function resolveGroupCode(groupRaw, deptRaw) {
  const g = String(groupRaw || '').trim();
  if (SITE_LABEL_TO_CODE[g]) return SITE_LABEL_TO_CODE[g];
  // already a known-style code
  if (/^[a-z][a-z0-9-]*$/i.test(g)) return g;

  const d = String(deptRaw || '');
  if (/東北|秋田|盛岡|仙台/.test(d)) return 'tohoku';
  if (/関越|新潟|長野|高崎/.test(d)) return 'kan-etsu';
  if (/東京支店|千葉営業|水戸営業|鎌ヶ谷/.test(d)) return 'tokyo';
  if (/東海|静岡|名古屋|関西|東京営業/.test(d)) return 'tokai';
  if (/札幌|首都圏|リフォーム/.test(d)) return 'reform';
  if (/鉄構/.test(d)) return 'tekko';
  if (/湾岸/.test(d)) return 'wangan';
  if (
    /本社|役員|顧問|総務|経理|経営企画|人事|安全|施工|メンテ|塗装|品質|出向/.test(d)
  ) {
    return 'honsya';
  }
  return g;
}

function formatListSort(n) {
  if (!Number.isFinite(n)) return '999999';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
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
  'sort',
  'dept_name',
  'group_name',
  'job_title',
]);
const sortBy595 = new Map();
const primarySortByDept = new Map();
const shitenchoSortByDept = new Map();
const shitenchoSortByGroup = new Map();
for (const r of rec595) {
  const sid = String(r.$id.value);
  const s = numOr(r.sort?.value, 0);
  sortBy595.set(sid, s);
  const dept = String(r.dept_name?.value || '').trim();
  const group = resolveGroupCode(r.group_name?.value, dept);
  if (dept && s > 0) {
    const cur = primarySortByDept.get(dept) || { min: s, max: s };
    cur.min = Math.min(cur.min, s);
    cur.max = Math.max(cur.max, s);
    primarySortByDept.set(dept, cur);
  }
  if (s > 0 && isShitenchoTitle(r.job_title?.value)) {
    if (dept) {
      const prev = shitenchoSortByDept.get(dept);
      if (prev == null || s < prev) shitenchoSortByDept.set(dept, s);
    }
    if (group) {
      const prevG = shitenchoSortByGroup.get(group);
      if (prevG == null || s < prevG) shitenchoSortByGroup.set(group, s);
    }
  }
}

const rec776 = await fetchAll(cAll, APP_776, [
  '$id',
  'source_595_id',
  'dept_name',
  'group_name',
  'job_title',
  'row_role',
  'list_sort',
  'user_name',
]);

const otherKenmuCount = new Map();
const afterAnchorCount = new Map();
const updates = [];
const samples = [];

function nextAfterAnchor(key, anchorSort) {
  const i = afterAnchorCount.get(key) || 0;
  afterAnchorCount.set(key, i + 1);
  return anchorSort + 0.1 * (i + 1);
}

for (const r of rec776) {
  const dept = String(r.dept_name?.value || '').trim();
  const sid = String(r.source_595_id?.value ?? '');
  const role = r.row_role?.value ?? '本務';
  const title = r.job_title?.value ?? '';
  const ownSort = numOr(sortBy595.get(sid), 0);
  const curGroup = String(r.group_name?.value || '').trim();
  const wantGroup =
    role === '兼務'
      ? resolveGroupCode(curGroup, dept)
      : curGroup || resolveGroupCode(curGroup, dept);

  let wantSort;
  if (role === '兼務' && isBuchoTitle(title)) {
    const bounds = primarySortByDept.get(dept);
    const branchDept = inferBranchDept(dept);
    const shitencho =
      (branchDept && shitenchoSortByDept.get(branchDept)) ||
      shitenchoSortByGroup.get(wantGroup) ||
      null;
    if (bounds) {
      let candidate = bounds.min - 0.5;
      if (shitencho != null && candidate < shitencho) {
        candidate = nextAfterAnchor(`${wantGroup}|${branchDept || 'g'}`, shitencho);
      }
      wantSort = candidate;
    } else if (shitencho != null) {
      wantSort = nextAfterAnchor(`${wantGroup}|${branchDept || 'g'}`, shitencho);
    } else {
      wantSort = ownSort > 0 ? ownSort + 0.1 : 999999;
    }
  } else if (role === '兼務') {
    const bounds = primarySortByDept.get(dept) || {
      min: ownSort || 999999,
      max: ownSort || 999999,
    };
    const i = otherKenmuCount.get(dept) || 0;
    otherKenmuCount.set(dept, i + 1);
    wantSort = bounds.max + 0.1 * (i + 1);
  } else {
    wantSort = ownSort > 0 ? ownSort : 999999;
  }

  const wantSortStr = formatListSort(wantSort);
  const patch = {};
  if (String(r.list_sort?.value ?? '') !== wantSortStr && numOr(r.list_sort?.value, NaN) !== wantSort) {
    patch.list_sort = { value: wantSortStr };
  }
  if (role === '兼務' && curGroup !== wantGroup && wantGroup) {
    patch.group_name = { value: wantGroup };
  }
  if (!Object.keys(patch).length) continue;

  updates.push({ id: r.$id.value, record: patch });
  if (samples.length < 15) {
    samples.push({
      name: r.user_name?.value,
      role,
      title,
      dept,
      groupFrom: curGroup,
      groupTo: wantGroup,
      list_sort: wantSortStr,
    });
  }
}

console.log(
  JSON.stringify(
    {
      dryRun: DRY,
      willUpdate: updates.length,
      shitenchoByGroup: Object.fromEntries(shitenchoSortByGroup),
      samples,
    },
    null,
    2,
  ),
);

if (!DRY && updates.length) {
  let n = 0;
  for (const batch of chunk(updates, 100)) {
    await cAll.record.updateRecords({ app: APP_776, records: batch });
    n += batch.length;
    console.log(`[776] group+sort ${n}/${updates.length}`);
  }
}
console.log('[776 kenmu group+sort] DONE');
