import 'dotenv/config';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
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

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* noop */ }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 800);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

const app = Number(process.argv[2]);
if (!Number.isFinite(app)) {
  console.error('Usage: node scripts/app-views.js <appId> [viewId]');
  process.exit(2);
}

const viewId = process.argv[3] ? Number(process.argv[3]) : null;

const url = new URL(`${baseUrl}/k/v1/app/views.json`);
url.searchParams.set('app', String(app));
const json = await fetchJson(url, { method: 'GET', headers });

const views = json.views || {};
const list = Object.entries(views).map(([name, v]) => ({ name, ...v }));
list.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

if (viewId) {
  const hit = list.find((v) => Number(v.id) === viewId);
  if (!hit) {
    console.log(`[views] app=${app} viewId=${viewId} not found. existing view IDs:`);
    console.log(list.map((v) => v.id).join(', '));
    process.exit(1);
  }
  console.log(JSON.stringify(hit, null, 2));
} else {
  console.log(`[views] app=${app} count=${list.length}`);
  for (const v of list) {
    const q = (v.filterCond || '').replace(/\s+/g, ' ').trim();
    console.log(`- id=${v.id} name=${v.name} type=${v.type || ''} index=${v.index ?? ''}`);
    if (q) console.log(`  filterCond: ${q}`);
    if (v.sort) console.log(`  sort: ${String(v.sort).replace(/\s+/g, ' ').trim()}`);
  }
}

