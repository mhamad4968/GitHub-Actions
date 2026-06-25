/**
 * App 683: 6 暦月棒グラフの月合計が REST 単月集計と一致するか検証（読取のみ）。
 *
 *   npm run user683:audit-six-month-chart -- --view-year 2026 --view-month 7
 *   npm run user683:audit-six-month-chart -- --view-year 2026 --view-month 8
 */
import 'dotenv/config';

const APP = 682;

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseArgs() {
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth() + 1;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--view-year' && argv[i + 1]) viewYear = Number(argv[++i]);
    else if (argv[i] === '--view-month' && argv[i + 1]) viewMonth = Number(argv[++i]);
  }
  if (!Number.isFinite(viewYear) || !Number.isFinite(viewMonth) || viewMonth < 1 || viewMonth > 12) {
    throw new Error('Invalid --view-year / --view-month');
  }
  return { viewYear, viewMonth };
}

function addMonthsCal(year, month1to12, delta) {
  const idx = year * 12 + month1to12 - 1 + delta;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

function monthQueryRange(year, month1to12) {
  const dim = new Date(year, month1to12, 0).getDate();
  const from = `${year}-${pad2(month1to12)}-01`;
  const to = `${year}-${pad2(month1to12)}-${pad2(dim)}`;
  return `record_date >= "${from}" and record_date <= "${to}" order by record_date asc`;
}

function sixMonthSlots(viewYear, viewMonth) {
  const slots = [];
  for (let delta = -5; delta <= 0; delta += 1) {
    const s = addMonthsCal(viewYear, viewMonth, delta);
    slots.push({ key: `${s.y}-${pad2(s.m)}`, y: s.y, m: s.m });
  }
  return slots;
}

function buildHeaders() {
  const user = requireEnv('KINTONE_USERNAME');
  const pass = requireEnv('KINTONE_PASSWORD');
  const headers = {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
    const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
    headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
  }
  return headers;
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 400);
    throw new Error(`HTTP ${res.status} ${msg}`);
  }
  return json;
}

async function sumDayTotalInRange(baseUrl, headers, query) {
  const all = [];
  let offset = 0;
  const limit = 500;
  let totalCount = null;
  while (true) {
    const u = new URL(`${baseUrl}/k/v1/records.json`);
    u.searchParams.set('app', String(APP));
    u.searchParams.set('query', query);
    u.searchParams.set('totalCount', 'true');
    u.searchParams.set('limit', String(limit));
    u.searchParams.set('offset', String(offset));
    u.searchParams.append('fields[0]', 'record_date');
    u.searchParams.append('fields[1]', 'day_total');
    const json = await fetchJson(u.toString(), headers);
    const batch = json.records || [];
    if (json.totalCount != null) totalCount = Number(json.totalCount);
    all.push(...batch);
    offset += batch.length;
    if (!batch.length) break;
    if (totalCount != null && offset >= totalCount) break;
    if (batch.length < limit && (totalCount == null || offset >= totalCount)) break;
    if (batch.length === limit) continue;
    if (totalCount != null && offset < totalCount) continue;
    break;
  }
  const byYmd = {};
  for (const rec of all) {
    const ymd = String(rec?.record_date?.value || '').slice(0, 10);
    if (!ymd) continue;
    let n = Number(rec?.day_total?.value ?? 0);
    if (!Number.isFinite(n)) n = 0;
    if (byYmd[ymd] == null || n > byYmd[ymd]) byYmd[ymd] = n;
  }
  let sum = 0;
  for (const ymd of Object.keys(byYmd)) sum += byYmd[ymd];
  return { sum, records: all.length, totalCount: totalCount ?? all.length };
}

/** 旧 683 バグ再現: 6 暦月一括＋100 件でページング打切り */
async function buggyBulkSixMonthSum(baseUrl, headers, viewYear, viewMonth) {
  const start = addMonthsCal(viewYear, viewMonth, -5);
  const from = `${start.y}-${pad2(start.m)}-01`;
  const dimEnd = new Date(viewYear, viewMonth, 0).getDate();
  const to = `${viewYear}-${pad2(viewMonth)}-${pad2(dimEnd)}`;
  const query = `record_date >= "${from}" and record_date <= "${to}" order by record_date asc`;
  const u = new URL(`${baseUrl}/k/v1/records.json`);
  u.searchParams.set('app', String(APP));
  u.searchParams.set('query', query);
  u.searchParams.set('totalCount', 'true');
  u.searchParams.set('limit', '500');
  u.searchParams.set('offset', '0');
  u.searchParams.append('fields[0]', 'record_date');
  u.searchParams.append('fields[1]', 'day_total');
  const json = await fetchJson(u.toString(), headers);
  const records = json.records || [];
  const byYmd = {};
  for (const rec of records) {
    const ymd = String(rec?.record_date?.value || '').slice(0, 10);
    if (!ymd) continue;
    let n = Number(rec?.day_total?.value ?? 0);
    if (!Number.isFinite(n)) n = 0;
    if (byYmd[ymd] == null || n > byYmd[ymd]) byYmd[ymd] = n;
  }
  const sums = {};
  for (const ymd of Object.keys(byYmd)) {
    const ymk = ymd.slice(0, 7);
    sums[ymk] = (sums[ymk] || 0) + byYmd[ymd];
  }
  return { sums, fetched: records.length, totalCount: Number(json.totalCount ?? records.length) };
}

const { viewYear, viewMonth } = parseArgs();
let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');
const headers = buildHeaders();
const slots = sixMonthSlots(viewYear, viewMonth);

console.log(`[683-audit] view=${viewYear}-${pad2(viewMonth)} slots=${slots.map((s) => s.key).join(', ')}`);

const perMonth = {};
for (const slot of slots) {
  const q = monthQueryRange(slot.y, slot.m);
  perMonth[slot.key] = await sumDayTotalInRange(baseUrl, headers, q);
}

const buggy = await buggyBulkSixMonthSum(baseUrl, headers, viewYear, viewMonth);
console.log(
  `[683-audit] buggy bulk fetch: records=${buggy.fetched} totalCount=${buggy.totalCount} (first page only if < totalCount)`,
);

let ng = 0;
for (const slot of slots) {
  const truth = perMonth[slot.key].sum;
  const bulk = buggy.sums[slot.key] ?? 0;
  const ok = truth === bulk;
  if (!ok) ng += 1;
  console.log(
    `[683-audit] ${slot.key}: perMonth=${truth} buggyBulk=${bulk} ${ok ? 'OK' : 'MISMATCH'}`,
  );
}

if (ng) {
  console.warn(
    `[683-audit] WARN ${ng} month(s) differ from buggy single-page bulk (expected before pagination fix)`,
  );
} else {
  console.log('[683-audit] buggy bulk matched per-month (all records fit in one page)');
}
console.log('[683-audit] OK per-month ground truth fetched');
