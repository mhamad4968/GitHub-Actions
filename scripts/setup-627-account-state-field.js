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

const APP_627 = 627;
const FC_ACCOUNT_STATE = 'account_state';

const fieldDef = {
  type: 'DROP_DOWN',
  code: FC_ACCOUNT_STATE,
  label: 'アカウント状態',
  required: false,
  noLabel: false,
  defaultValue: '有効',
  options: {
    '有効': { label: '有効', index: '0' },
    '退職': { label: '退職', index: '1' },
    '削除': { label: '削除', index: '2' },
  },
};

const getUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
getUrl.searchParams.set('app', String(APP_627));
const current = await fetchJson(getUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });

let revision = null;
if ((current.properties || {})[FC_ACCOUNT_STATE]) {
  // Update existing dropdown labels/options (停止 -> 退職)
  const putUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
  const updated = await fetchJson(putUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: APP_627, properties: { [FC_ACCOUNT_STATE]: fieldDef } }),
  });
  revision = updated.revision;
  console.log(`[627 account_state] updated revision=${revision}`);
} else {
  const postUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
  const created = await fetchJson(postUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: APP_627, properties: { [FC_ACCOUNT_STATE]: fieldDef } }),
  });
  revision = created.revision;
  console.log(`[627 account_state] created revision=${revision}`);
}

const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP_627, revision }] }),
});

const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
stUrl.searchParams.set('apps[0]', String(APP_627));
for (let i = 0; i < 60; i++) {
  const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
  if (status === 'SUCCESS') {
    console.log('[627 account_state] deploy SUCCESS');
    process.exit(0);
  }
  if (status === 'FAIL' || status === 'CANCEL') {
    throw new Error(`Deploy status: ${status}`);
  }
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error('Deploy status timed out (still PROCESSING).');

