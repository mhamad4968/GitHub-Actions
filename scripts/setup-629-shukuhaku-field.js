/**
 * 629 出張精算に「宿泊費」数値フィールド（コード shukuhaku）を追加しデプロイする。
 * 既に存在する場合はスキップする。
 */
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
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 800);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

const APP = 629;
const CODE = 'shukuhaku';

const fieldDef = {
  type: 'NUMBER',
  code: CODE,
  label: '宿泊費',
  required: false,
  noLabel: false,
  digit: true,
  displayScale: '0',
  unit: '円',
  unitPosition: 'AFTER',
};

const getUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
getUrl.searchParams.set('app', String(APP));
const current = await fetchJson(getUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });

if ((current.properties || {})[CODE]) {
  console.log(`[629 shukuhaku] フィールド ${CODE} は既にあります。デプロイのみスキップします。`);
  process.exit(0);
}

const postUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
const created = await fetchJson(postUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ app: APP, properties: { [CODE]: fieldDef } }),
});
const revision = created.revision;
console.log(`[629 shukuhaku] 追加しました revision=${revision}`);

const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP, revision }] }),
});

const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
stUrl.searchParams.set('apps[0]', String(APP));
for (let i = 0; i < 60; i++) {
  const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
  if (status === 'SUCCESS') {
    console.log('[629 shukuhaku] deploy SUCCESS');
    process.exit(0);
  }
  if (status === 'FAIL' || status === 'CANCEL') {
    throw new Error(`Deploy status: ${status}`);
  }
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error('Deploy status timed out (still PROCESSING).');
