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

const APP_626 = 626;
const FC_MAIL = 'mail';
const FC_USED = 'used_count';

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

async function getIdsBatch(offset) {
  const params = new URLSearchParams();
  params.set('app', String(APP_626));
  params.set('query', `order by $id asc limit 100 offset ${offset}`);
  params.set('fields[0]', '$id');
  const url = new URL(`${baseUrl}/k/v1/records.json?${params.toString()}`);
  const { 'Content-Type': _ct, ...headersNoCt } = headers;
  const json = await fetchJson(url, { method: 'GET', headers: headersNoCt });
  const ids = (json.records || []).map((r) => Number(r.$id.value)).filter(Number.isFinite);
  return ids;
}

async function bulkClear(ids) {
  const url = new URL(`${baseUrl}/k/v1/records.json`);
  const records = ids.map((id) => ({
    id,
    record: {
      [FC_MAIL]: { value: '' },
      [FC_USED]: { value: '' },
    }
  }));
  await fetchJson(url, { method: 'PUT', headers, body: JSON.stringify({ app: APP_626, records }) });
}

let offset = 0;
let total = 0;
for (;;) {
  const ids = await getIdsBatch(offset);
  if (!ids.length) break;
  await bulkClear(ids);
  total += ids.length;
  offset += ids.length;
  console.log(`[reset626] cleared ${ids.length}, total=${total}`);
}

console.log(`[reset626] done total=${total}`);

