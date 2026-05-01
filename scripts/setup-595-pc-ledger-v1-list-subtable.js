import 'dotenv/config';

/**
 * 595 に 新・PC台帳（674）複数台対応のサブテーブルを追加する。
 * - 親: pc_ledger_v1_list
 * - 子: pc_674_record_id（NUMBER・674 のレコード番号 / $id）
 * 既存の pc_ledger_list（594）・ledger_record_id（627）は変更しない。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/setup-595-pc-ledger-v1-list-subtable.js
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

const APP_595 = 595;
const FC_TABLE = 'pc_ledger_v1_list';

const getUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
getUrl.searchParams.set('app', String(APP_595));
const { 'Content-Type': _ct1, ...headersNoCt } = headers;
const current = await fetchJson(getUrl, { method: 'GET', headers: headersNoCt });

if ((current.properties || {})[FC_TABLE]) {
  console.log('[setup595 pc_ledger_v1] already exists (no changes)');
  process.exit(0);
}

const postUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
const created = await fetchJson(postUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    app: APP_595,
    properties: {
      [FC_TABLE]: {
        type: 'SUBTABLE',
        code: FC_TABLE,
        label: '新PC台帳(674)紐づけ',
        noLabel: false,
        fields: {
          pc_674_record_id: {
            type: 'NUMBER',
            code: 'pc_674_record_id',
            label: '新PC台帳レコード番号',
            noLabel: false,
            required: false,
            defaultValue: '',
            displayScale: '',
            unit: '',
            unitPosition: 'BEFORE',
          },
        },
      },
    },
  }),
});
console.log(`[setup595 pc_ledger_v1] created revision=${created.revision}`);

const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP_595, revision: created.revision }] }),
});

const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
stUrl.searchParams.set('apps[0]', String(APP_595));
for (let i = 0; i < 60; i++) {
  const st = await fetchJson(stUrl, { method: 'GET', headers: headersNoCt });
  const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
  if (status === 'SUCCESS') {
    console.log('[setup595 pc_ledger_v1] deploy SUCCESS — run: npm run app:fields 595');
    process.exit(0);
  }
  if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error('Deploy status timed out (still PROCESSING).');
