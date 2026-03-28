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

const APP = 594;
const TOUCH_FIELD = 'note'; // harmless text field to trigger save/recalc

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    const detail = json?.errors ? ` errors=${JSON.stringify(json.errors)}` : '';
    throw new Error(`HTTP ${res.status} ${res.statusText} ${json?.code || ''} ${json?.message || text}${detail}`.trim());
  }
  return json;
}

async function getIdBatch(offset) {
  const params = new URLSearchParams();
  params.set('app', String(APP));
  params.set('query', `order by $id asc limit 100 offset ${offset}`);
  params.set('fields[0]', '$id');
  params.set('fields[1]', '$revision');
  params.set('fields[2]', TOUCH_FIELD);
  const url = new URL(`${baseUrl}/k/v1/records.json?${params.toString()}`);
  const { 'Content-Type': _ct, ...headersNoCt } = headers;
  const j = await fetchJson(url, { method: 'GET', headers: headersNoCt });
  return j.records || [];
}

async function touchOne(record) {
  const id = record.$id.value;
  const revision = record.$revision.value;
  const cur = record[TOUCH_FIELD]?.value ?? '';
  // Keep same value semantically; append/remove a space marker.
  const touched = String(cur).endsWith(' ') ? String(cur).slice(0, -1) : `${cur} `;

  const url = new URL(`${baseUrl}/k/v1/record.json`);
  await fetchJson(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: APP,
      id,
      revision,
      record: {
        [TOUCH_FIELD]: { value: touched },
      },
    }),
  });
}

let offset = 0;
let ok = 0;
for (;;) {
  const batch = await getIdBatch(offset);
  if (!batch.length) break;
  for (const r of batch) {
    try {
      await touchOne(r);
      ok++;
      if (ok % 25 === 0) console.log(`[recalc594] updated=${ok}`);
    } catch (e) {
      console.error('[recalc594] failed', { id: r.$id?.value, error: String(e) });
    }
  }
  offset += batch.length;
}

console.log(`[recalc594] done updated=${ok}`);

