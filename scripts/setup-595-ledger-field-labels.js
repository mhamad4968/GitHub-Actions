import 'dotenv/config';

/**
 * 595 の ledger_created / ledger_record_id の「表示名」をアカウント台帳用に揃える（フィールドコードは変更しない）。
 *   npm run setup:595:ledger_field_labels
 */
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
    const detail = json?.errors ? ` errors=${JSON.stringify(json.errors)}` : '';
    throw new Error(`HTTP ${res.status} ${res.statusText} ${json?.code || ''} ${json?.message || text}${detail}`.trim());
  }
  return json;
}

const APP = 595;
const LABEL_CREATED = 'アカウント台帳作成済み';
const LABEL_RECORD_ID = 'アカウント台帳レコード番号';
const FC_CREATED = 'ledger_created';
const FC_RID = 'ledger_record_id';

const { 'Content-Type': _ct, ...headersNoCt } = headers;

const getUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
getUrl.searchParams.set('app', String(APP));
const current = await fetchJson(getUrl, { method: 'GET', headers: headersNoCt });

const lc = (current.properties || {})[FC_CREATED];
const lr = (current.properties || {})[FC_RID];
if (!lc || !lr) {
  throw new Error(`Missing ${FC_CREATED} or ${FC_RID} on app ${APP}`);
}

if (lc.label === LABEL_CREATED && lr.label === LABEL_RECORD_ID) {
  console.log('[setup595 ledger labels] already set — no deploy');
  process.exit(0);
}

lc.label = LABEL_CREATED;
lr.label = LABEL_RECORD_ID;

const putUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
const updated = await fetchJson(putUrl, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    app: APP,
    properties: {
      [FC_CREATED]: lc,
      [FC_RID]: lr,
    },
  }),
});
console.log(`[setup595 ledger labels] preview revision=${updated.revision}`);

const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP, revision: updated.revision }] }),
});

const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
stUrl.searchParams.set('apps[0]', String(APP));
for (let i = 0; i < 60; i++) {
  const st = await fetchJson(stUrl, { method: 'GET', headers: headersNoCt });
  const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
  if (status === 'SUCCESS') {
    console.log('[setup595 ledger labels] deploy SUCCESS');
    process.exit(0);
  }
  if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error('Deploy status timed out (still PROCESSING).');
