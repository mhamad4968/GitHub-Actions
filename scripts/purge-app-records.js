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
  'Content-Type': 'application/json',
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

async function getIds(app, offset) {
  const params = new URLSearchParams();
  params.set('app', String(app));
  params.set('query', `order by $id asc limit 500 offset ${offset}`);
  params.set('fields[0]', '$id');
  const url = new URL(`${baseUrl}/k/v1/records.json?${params.toString()}`);
  const { 'Content-Type': _ct, ...headersNoCt } = headers;
  const json = await fetchJson(url, { method: 'GET', headers: headersNoCt });
  return (json.records || []).map((r) => Number(r.$id.value)).filter(Number.isFinite);
}

async function deleteIds(app, ids) {
  if (!ids.length) return;
  const url = new URL(`${baseUrl}/k/v1/records.json`);
  // Some environments block DELETE; use POST + X-HTTP-Method-Override: DELETE
  const h = { ...headers, 'X-HTTP-Method-Override': 'DELETE' };
  await fetchJson(url, { method: 'POST', headers: h, body: JSON.stringify({ app, ids }) });
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const app = Number(process.argv[2]);
if (!Number.isFinite(app)) {
  console.error('Usage: node scripts/purge-app-records.js <appId>');
  process.exit(2);
}

console.log(`[purge] start app=${app}`);
let offset = 0;
let total = 0;
for (;;) {
  const ids = await getIds(app, offset);
  if (!ids.length) break;

  // Deleting changes offsets; always restart from offset 0
  for (const part of chunk(ids, 100)) {
    await deleteIds(app, part);
    total += part.length;
    console.log(`[purge] deleted ${part.length}, total=${total}`);
  }
  offset = 0;
}

console.log(`[purge] done app=${app} total=${total}`);

