/**
 * App 682: 指定暦月の record_date カバレッジ（欠日・重複）を REST で集計する（読取のみ）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/user-support-682-audit-calendar-month.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/user-support-682-audit-calendar-month.mjs --year 2026 --month 4
 */
import 'dotenv/config';

const APP = 682;

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

function parseArgs() {
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--year' && argv[i + 1]) {
      year = Number(argv[++i]);
    } else if (argv[i] === '--month' && argv[i + 1]) {
      month = Number(argv[++i]);
    }
  }
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error('Invalid --year / --month');
  }
  return { year, month };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
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

const { year, month } = parseArgs();
let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');

const dim = daysInMonth(year, month);
const from = `${year}-${pad2(month)}-01`;
const to = `${year}-${pad2(month)}-${pad2(dim)}`;

const query = `record_date >= "${from}" and record_date <= "${to}" order by record_date asc limit 500`;

const u = new URL(`${baseUrl}/k/v1/records.json`);
u.searchParams.set('app', String(APP));
u.searchParams.set('query', query);
u.searchParams.set('totalCount', 'true');
u.searchParams.append('fields[0]', 'record_date');
u.searchParams.append('fields[1]', 'day_total');

const headers = buildHeaders();
const data = await fetchJson(u.toString(), headers);
const records = Array.isArray(data.records) ? data.records : [];
const total = data.totalCount != null ? String(data.totalCount) : String(records.length);

/** @type {Map<string, number>} */
const counts = new Map();
for (const rec of records) {
  const raw = rec?.record_date?.value;
  if (raw == null || raw === '') continue;
  const key = String(raw).slice(0, 10);
  counts.set(key, (counts.get(key) || 0) + 1);
}

const expected = [];
for (let d = 1; d <= dim; d++) {
  expected.push(`${year}-${pad2(month)}-${pad2(d)}`);
}

const missing = [];
const dupes = [];
for (const day of expected) {
  const c = counts.get(day) || 0;
  if (c === 0) missing.push(day);
  if (c > 1) dupes.push({ day, count: c });
}

console.log(`[682] calendar audit app=${APP} range=${from}..${to} (JST暦月・SPEC §3 1日1行前提)`);
console.log(`[682] totalCount(API)=${total} recordsFetched=${records.length}`);
console.log(`[682] distinctDays=${counts.size} missingDays=${missing.length} duplicateDates=${dupes.length}`);
if (missing.length) {
  console.log(`[682] MISSING (${missing.length}): ${missing.join(', ')}`);
}
if (dupes.length) {
  console.log(
    `[682] DUPLICATES: ${dupes.map((x) => `${x.day}×${x.count}`).join(', ')}`,
  );
}
if (!missing.length && !dupes.length) {
  console.log('[682] OK: 全日カバー・重複なし（この月の取得範囲内）');
}
