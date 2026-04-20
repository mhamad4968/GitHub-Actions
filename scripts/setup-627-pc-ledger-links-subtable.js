import 'dotenv/config';

/**
 * 627 に「1 アカウント・複数 PC（594）」用サブテーブルを追加する。
 * - 親: pc_ledger_links
 * - 子: pc_ledger_link_594_id（NUMBER）※627 トップの pc_594_record_id とコード重複不可のため別名
 * 既に存在する場合は何もしないで終了。
 *
 *   npm run setup:627:pc_ledger_links
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

const APP_627 = 627;
const FC_TABLE = 'pc_ledger_links';

const getUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
getUrl.searchParams.set('app', String(APP_627));
const { 'Content-Type': _ct1, ...headersNoCt } = headers;
const current = await fetchJson(getUrl, { method: 'GET', headers: headersNoCt });

if ((current.properties || {})[FC_TABLE]) {
  console.log('[setup627 pc_ledger_links] already exists (no changes)');
  process.exit(0);
}

const postUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
const created = await fetchJson(postUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    app: APP_627,
    properties: {
      [FC_TABLE]: {
        type: 'SUBTABLE',
        code: FC_TABLE,
        label: 'PC台帳紐づけ（複数）',
        noLabel: false,
        fields: {
          pc_ledger_link_594_id: {
            type: 'NUMBER',
            code: 'pc_ledger_link_594_id',
            label: 'PC台帳レコード番号',
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
console.log(`[setup627 pc_ledger_links] created revision=${created.revision}`);

const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP_627, revision: created.revision }] }),
});

const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
stUrl.searchParams.set('apps[0]', String(APP_627));
for (let i = 0; i < 60; i++) {
  const st = await fetchJson(stUrl, { method: 'GET', headers: headersNoCt });
  const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
  if (status === 'SUCCESS') {
    console.log('[setup627 pc_ledger_links] deploy SUCCESS — run: npm run app:fields 627');
    process.exit(0);
  }
  if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error('Deploy status timed out (still PROCESSING).');
