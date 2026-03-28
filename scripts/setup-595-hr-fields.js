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

const APP_595 = 595;

// Fields to add
const propertiesToAdd = {
  transfer_date: {
    type: 'DATE',
    code: 'transfer_date',
    label: '所属異動日',
    noLabel: false,
  },
  transfer_note: {
    type: 'MULTI_LINE_TEXT',
    code: 'transfer_note',
    label: '所属異動メモ',
    noLabel: false,
  },
  retired_date: {
    type: 'DATE',
    code: 'retired_date',
    label: '退職日',
    noLabel: false,
  },
  retired_note: {
    type: 'MULTI_LINE_TEXT',
    code: 'retired_note',
    label: '退職メモ',
    noLabel: false,
  },
};

// 1) get current fields (preview)
const getUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
getUrl.searchParams.set('app', String(APP_595));
const current = await fetchJson(getUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });

const toCreate = {};
for (const [code, p] of Object.entries(propertiesToAdd)) {
  if (!(current.properties || {})[code]) toCreate[code] = p;
}

let revision = null;
if (Object.keys(toCreate).length) {
  // 2) add fields (preview)
  const postUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
  const created = await fetchJson(postUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: APP_595, properties: toCreate }),
  });
  revision = created.revision;
  console.log(`[595 hr-fields] created fields=${Object.keys(toCreate).join(', ')} revision=${revision}`);
} else {
  console.log('[595 hr-fields] already exists (no changes)');
  process.exit(0);
}

// 3) deploy
const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP_595, revision }] }),
});

// 4) poll
const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
stUrl.searchParams.set('apps[0]', String(APP_595));
for (let i = 0; i < 60; i++) {
  const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
  if (status === 'SUCCESS') {
    console.log('[595 hr-fields] deploy SUCCESS');
    process.exit(0);
  }
  if (status === 'FAIL' || status === 'CANCEL') {
    throw new Error(`Deploy status: ${status}`);
  }
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error('Deploy status timed out (still PROCESSING).');

