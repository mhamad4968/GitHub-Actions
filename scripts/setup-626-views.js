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

const APP_626 = 626;
const FC_USED = 'used_count';
const FC_MAIL = 'mail';
const FC_LOGON = 'logon_name';
const USED_MARK = '〇';

const viewsToUpsert = {
  '未使用（採番可能）': {
    type: 'LIST',
    filterCond: `${FC_USED} not in ("${USED_MARK}") and ${FC_MAIL} = "" and ${FC_LOGON} != ""`,
    sort: `${FC_LOGON} asc`,
    pager: true,
    device: 'ANY',
  },
  '割当済み（使用中）': {
    type: 'LIST',
    filterCond: `${FC_USED} in ("${USED_MARK}") and ${FC_MAIL} != ""`,
    sort: `${FC_LOGON} asc`,
    pager: true,
    device: 'ANY',
  },
  '不整合（要確認）': {
    type: 'LIST',
    filterCond: `(${FC_USED} in ("${USED_MARK}") and ${FC_MAIL} = "") or (${FC_USED} not in ("${USED_MARK}") and ${FC_MAIL} != "")`,
    sort: `${FC_LOGON} asc`,
    pager: true,
    device: 'ANY',
  },
};

function normalizeIndex(x) {
  const n = Number(String(x ?? '').trim());
  return Number.isFinite(n) ? n : 0;
}

// 1) get current views (preview)
const getUrl = new URL(`${baseUrl}/k/v1/preview/app/views.json`);
getUrl.searchParams.set('app', String(APP_626));
const { 'Content-Type': _ct, ...headersNoCt } = headers;
const current = await fetchJson(getUrl, { method: 'GET', headers: headersNoCt });

const mergedViews = { ...(current.views || {}) };
const existingMaxIndex = Math.max(
  0,
  ...Object.values(mergedViews).map((v) => normalizeIndex(v?.index))
);
let nextIndex = existingMaxIndex + 1;
for (const [name, v] of Object.entries(viewsToUpsert)) {
  const prev = mergedViews[name];
  mergedViews[name] = {
    ...(prev || {}),
    ...v,
    // Kintone expects index as string in many cases
    index: String(prev?.index ?? nextIndex++),
  };
}

// 2) put views (preview)
const putUrl = new URL(`${baseUrl}/k/v1/preview/app/views.json`);
const updated = await fetchJson(putUrl, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ app: APP_626, views: mergedViews }),
});
console.log(`[626 views] updated revision=${updated.revision}`);

// 3) deploy
const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP_626, revision: updated.revision }] }),
});

// 4) poll
const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
stUrl.searchParams.set('apps[0]', String(APP_626));
for (let i = 0; i < 60; i++) {
  const st = await fetchJson(stUrl, { method: 'GET', headers: headersNoCt });
  const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
  if (status === 'SUCCESS') {
    console.log('[626 views] deploy SUCCESS');
    process.exit(0);
  }
  if (status === 'FAIL' || status === 'CANCEL') {
    throw new Error(`Deploy status: ${status}`);
  }
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error('Deploy status timed out (still PROCESSING).');

