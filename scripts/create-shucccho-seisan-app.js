import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 1200);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitDeploy(appNum) {
  const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  stUrl.searchParams.set('apps[0]', String(appNum));
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === 'SUCCESS') return;
    if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
    await sleep(1000);
  }
  throw new Error('Deploy status timed out (still PROCESSING).');
}

async function uploadJs(filePath) {
  const buf = await readFile(filePath);
  const form = new FormData();
  form.set('file', new Blob([buf], { type: 'text/javascript' }), filePath.split('/').pop() || 'desktop.js');
  const url = new URL(`${baseUrl}/k/v1/file.json`);
  // multipart のとき Content-Type は自動付与させる（application/json を混ぜない）。
  const fileHeaders = { 'X-Cybozu-Authorization': headers['X-Cybozu-Authorization'] };
  if (headers.Authorization) fileHeaders.Authorization = headers.Authorization;
  const res = await fetch(url, { method: 'POST', headers: fileHeaders, body: form });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 800);
    throw new Error(`Upload failed: HTTP ${res.status} ${msg}`.trim());
  }
  return json.fileKey;
}

const SPACE_ID = 48;
const APP_NAME = '出張精算アプリ';

/** @param {number} spaceId スペース ID */
async function resolveDefaultThreadId(spaceId) {
  const override = process.env.KINTONE_SPACE_DEFAULT_THREAD;
  if (override && /^\d+$/.test(override)) return Number(override);
  const u = new URL(`${baseUrl}/k/v1/space.json`);
  u.searchParams.set('id', String(spaceId));
  const sp = await fetchJson(u, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const dt = sp?.defaultThread;
  if (!dt || String(dt).trim() === '') {
    throw new Error(`space ${spaceId} に defaultThread がありません（マルチスレッド設定を確認）`);
  }
  return Number(dt);
}

const FIELD_DEFS = {
  shimei: {
    type: 'SINGLE_LINE_TEXT',
    code: 'shimei',
    label: '氏名',
    required: false,
    noLabel: false,
  },
  shutchousaki: {
    type: 'SINGLE_LINE_TEXT',
    code: 'shutchousaki',
    label: '出張先',
    required: false,
    noLabel: false,
  },
  kingaku: {
    type: 'NUMBER',
    code: 'kingaku',
    label: '金額',
    required: false,
    noLabel: false,
    digit: true,
    displayScale: '0',
    unit: '円',
    unitPosition: 'AFTER',
  },
  shounin_status: {
    type: 'DROP_DOWN',
    code: 'shounin_status',
    label: '承認ステータス',
    required: false,
    noLabel: false,
    defaultValue: '未承認',
    options: {
      未承認: { label: '未承認', index: '0' },
      承認済み: { label: '承認済み', index: '1' },
    },
  },
};

const jsPath = join(__dirname, '../customize/shucccho-seisan/desktop.js');

console.log(`[create] Base URL: ${baseUrl}`);
const threadId = await resolveDefaultThreadId(SPACE_ID);
console.log(`[create] Using defaultThread=${threadId} for space ${SPACE_ID}`);
console.log(`[create] Creating app "${APP_NAME}" in space ${SPACE_ID}...`);

const addAppUrl = new URL(`${baseUrl}/k/v1/preview/app.json`);
const addAppRes = await fetchJson(addAppUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ name: APP_NAME, space: SPACE_ID, thread: threadId }),
});

const appId = Number(addAppRes.app);
const appIdStr = String(appId);
if (!Number.isFinite(appId) || appId <= 0) {
  throw new Error(`Unexpected add-app response: ${JSON.stringify(addAppRes)}`);
}

console.log(`[create] App created. appId=${appIdStr} revision=${addAppRes.revision}`);

console.log('[create] Adding form fields (preview)...');
const postFieldsUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
const fieldsRes = await fetchJson(postFieldsUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ app: appId, properties: FIELD_DEFS }),
});
let revision = fieldsRes.revision;
console.log(`[create] Fields added. revision=${revision}`);

console.log('[create] Deploying form...');
const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: appId, revision }] }),
});
await waitDeploy(appId);
console.log('[create] Form deploy SUCCESS');

console.log(`[create] Uploading JS: ${jsPath}`);
const fileKey = await uploadJs(jsPath);
console.log(`[create] Uploaded fileKey=${fileKey}`);

const custUrl = new URL(`${baseUrl}/k/v1/preview/app/customize.json`);
const custRes = await fetchJson(custUrl, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    app: appId,
    scope: 'ALL',
    desktop: { js: [{ type: 'FILE', file: { fileKey } }], css: [] },
    mobile: { js: [], css: [] },
  }),
});
revision = custRes.revision;
console.log(`[create] Customize preview updated. revision=${revision}`);

await fetchJson(depUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: appId, revision }] }),
});
await waitDeploy(appId);
console.log('[create] Customize deploy SUCCESS');

const recordUrl = `${baseUrl}/k/${appIdStr}/`;
console.log('');
console.log(`APP_ID=${appIdStr}`);
console.log(`APP_URL=${recordUrl}`);
