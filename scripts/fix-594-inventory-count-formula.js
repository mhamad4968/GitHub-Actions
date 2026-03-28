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
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    const detail = json?.errors ? ` errors=${JSON.stringify(json.errors)}` : '';
    throw new Error(`HTTP ${res.status} ${res.statusText} ${json?.code || ''} ${json?.message || text}${detail}`.trim());
  }
  return json;
}

const APP = 594;
const FC_CALC = 'inventory_count';

// 1) Re-write calc expression on preview
const putUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
const updated = await fetchJson(putUrl, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    app: APP,
    properties: {
      [FC_CALC]: {
        type: 'CALC',
        code: FC_CALC,
        label: '棚卸回数',
        noLabel: false,
        required: false,
        expression: 'SUM(count_val)',
        format: 'NUMBER',
        displayScale: '',
        hideExpression: false,
        unit: '',
        unitPosition: 'BEFORE',
      },
    },
  }),
});
console.log(`[fix594] calc formula updated revision=${updated.revision}`);

// 2) Deploy preview to live
const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP, revision: updated.revision }] }),
});

const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
stUrl.searchParams.set('apps[0]', String(APP));
const { 'Content-Type': _ct, ...headersNoCt } = headers;
for (let i = 0; i < 60; i++) {
  const st = await fetchJson(stUrl, { method: 'GET', headers: headersNoCt });
  const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
  if (status === 'SUCCESS') {
    console.log('[fix594] deploy SUCCESS');
    process.exit(0);
  }
  if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error('Deploy status timed out (still PROCESSING).');

