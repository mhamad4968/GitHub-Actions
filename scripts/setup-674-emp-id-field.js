import 'dotenv/config';

/**
 * 新・PC台帳（674）に社員管理番号フィールドを追加する（595 の emp_id と同一値で紐付け）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/setup-674-emp-id-field.js
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
    throw new Error(`HTTP ${res.status} ${json?.message || text}${detail}`.trim());
  }
  return json;
}

const APP_674 = 674;
const FC_EMP = 'emp_id';

const getUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
getUrl.searchParams.set('app', String(APP_674));
const { 'Content-Type': _ct1, ...headersNoCt } = headers;
const current = await fetchJson(getUrl, { method: 'GET', headers: headersNoCt });

if ((current.properties || {})[FC_EMP]) {
  console.log('[setup674 emp_id] already exists (no changes)');
  process.exit(0);
}

const postUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
const created = await fetchJson(postUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    app: APP_674,
    properties: {
      [FC_EMP]: {
        type: 'SINGLE_LINE_TEXT',
        code: FC_EMP,
        label: '社員管理番号（595）',
        noLabel: false,
        required: false,
        minLength: '',
        maxLength: '64',
        defaultValue: '',
        expression: '',
        hideExpression: false,
        unique: false,
      },
    },
  }),
});
console.log(`[setup674 emp_id] created revision=${created.revision}`);

const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP_674, revision: created.revision }] }),
});

const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
stUrl.searchParams.set('apps[0]', String(APP_674));
for (let i = 0; i < 60; i++) {
  const st = await fetchJson(stUrl, { method: 'GET', headers: headersNoCt });
  const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
  if (status === 'SUCCESS') {
    console.log('[setup674 emp_id] deploy SUCCESS — レイアウトで共有/JR行付近へ移動可 / npm run app:fields 674');
    process.exit(0);
  }
  if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error('Deploy status timed out (still PROCESSING).');
