/**
 * 予算ダッシュボード用 kintone アプリを作成し、dashboard-desktop.js をデプロイする。
 * API トークンではアプリ作成不可のため KINTONE_USERNAME / PASSWORD が必要。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/create-budget-dashboard-app.js
 *
 * 環境変数（任意）:
 *   KINTONE_BUDGET_SPACE_ID … 未設定時は KINTONE_FAQ_SPACE_ID / KINTONE_SECURITY_NEXT_SPACE_ID / 48
 *   KINTONE_BUDGET_DASHBOARD_APP_NAME … 既定「予算ダッシュボード」
 *
 * 既にアプリがある場合（.env に KINTONE_BUDGET_DASHBOARD_APP_ID を設定済み）:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/create-budget-dashboard-app.js --deploy-only
 */
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`環境変数がありません: ${key}`);
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
    const head = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : '';
    throw new Error(`HTTP ${res.status} ${res.statusText} ${head || text.slice(0, 800)}`.trim());
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitDeploy(appNum, mode) {
  const path = mode === 'live' ? '/k/v1/app/deploy.json' : '/k/v1/preview/app/deploy.json';
  const stUrl = new URL(`${baseUrl}${path}`);
  stUrl.searchParams.set('apps[0]', String(appNum));
  const headersNoCt = { ...headers, 'Content-Type': undefined };
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(stUrl, { method: 'GET', headers: headersNoCt });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === 'SUCCESS') return;
    if (status === 'FAIL' || status === 'CANCEL') throw new Error(`デプロイ状態: ${status}`);
    await sleep(1000);
  }
  throw new Error('デプロイがタイムアウトしました（PROCESSING のまま）。');
}

async function resolveDefaultThreadId(spaceId) {
  const override = process.env.KINTONE_SPACE_DEFAULT_THREAD;
  if (override && /^\d+$/.test(override)) return Number(override);
  const u = new URL(`${baseUrl}/k/v1/space.json`);
  u.searchParams.set('id', String(spaceId));
  const sp = await fetchJson(u, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const dt = sp?.defaultThread;
  if (!dt || String(dt).trim() === '') {
    throw new Error(`スペース ${spaceId} に defaultThread がありません（マルチスレッドを確認）`);
  }
  return Number(dt);
}

async function uploadJs(filePath) {
  const buf = readFileSync(filePath);
  const form = new FormData();
  form.set('file', new Blob([buf], { type: 'text/javascript' }), filePath.split('/').pop() || 'desktop.js');
  const url = new URL(`${baseUrl}/k/v1/file.json`);
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
    throw new Error(`アップロード失敗: HTTP ${res.status} ${json?.code || ''} ${json?.message || ''}`.trim());
  }
  return json.fileKey;
}

const FIELD_DEFS = {
  dash_note: {
    type: 'SINGLE_LINE_TEXT',
    code: 'dash_note',
    label: 'メモ',
    required: false,
    noLabel: false,
    defaultValue: '',
  },
};

/** ダッシュボードアプリ ID をナビ JS・651/652/653 に書き込む */
function patchDashboardAppIdInRepo(appId) {
  const id = Number(appId);
  if (!Number.isFinite(id) || id <= 0) return;
  const line = `var JBIS_BUDGET_DASHBOARD_APP_ID = ${id};`;
  const re = /var JBIS_BUDGET_DASHBOARD_APP_ID = \d+;/g;
  const paths = [
    join(REPO_ROOT, 'customize/budget-portal/jbis-budget-nav.js'),
    join(REPO_ROOT, 'customize/651/desktop.js'),
    join(REPO_ROOT, 'customize/652/desktop.js'),
    join(REPO_ROOT, 'customize/653/desktop.js'),
  ];
  for (const p of paths) {
    let s = readFileSync(p, 'utf8');
    const next = s.replace(re, line);
    if (next === s) {
      console.log(`[budget-dashboard] ナビのダッシュ ID は既に ${id} です: ${p}`);
      continue;
    }
    writeFileSync(p, next, 'utf8');
    console.log(`[budget-dashboard] 更新: ${p}`);
  }
}

async function deployDashboardJs(appId, mode) {
  const jsPath = join(REPO_ROOT, 'customize/budget-portal/dashboard-desktop.js');
  const fileKey = await uploadJs(jsPath);
  const custPath = mode === 'live' ? '/k/v1/app/customize.json' : '/k/v1/preview/app/customize.json';
  const depPath = mode === 'live' ? '/k/v1/app/deploy.json' : '/k/v1/preview/app/deploy.json';

  const custRes = await fetchJson(new URL(`${baseUrl}${custPath}`), {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: appId,
      scope: 'ALL',
      desktop: { js: [{ type: 'FILE', file: { fileKey } }], css: [] },
      mobile: { js: [], css: [] },
    }),
  });
  const revision = custRes.revision;
  await fetchJson(new URL(`${baseUrl}${depPath}`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision }] }),
  });
  await waitDeploy(appId, mode === 'live' ? 'live' : 'preview');
}

async function main() {
  const deployOnly = process.argv.includes('--deploy-only');
  const existingRaw = process.env.KINTONE_BUDGET_DASHBOARD_APP_ID?.trim();

  if (deployOnly) {
    if (!existingRaw || !/^\d+$/.test(existingRaw)) {
      throw new Error('--deploy-only には .env の KINTONE_BUDGET_DASHBOARD_APP_ID（数値）が必要です');
    }
    const appId = Number(existingRaw);
    console.log(`[budget-dashboard] --deploy-only app=${appId}`);
    try {
      await deployDashboardJs(appId, 'preview');
    } catch (e) {
      console.warn(`[budget-dashboard] preview デプロイ失敗 → live で再試行: ${e}`);
      await deployDashboardJs(appId, 'live');
    }
    console.log(`[budget-dashboard] 完了: ${baseUrl}/k/${appId}/`);
    return;
  }

  const spaceId = Number(
    process.env.KINTONE_BUDGET_SPACE_ID?.trim() ||
      process.env.KINTONE_FAQ_SPACE_ID?.trim() ||
      process.env.KINTONE_SECURITY_NEXT_SPACE_ID?.trim() ||
      '48',
  );
  const appName = process.env.KINTONE_BUDGET_DASHBOARD_APP_NAME?.trim() || '予算ダッシュボード';
  const threadId = await resolveDefaultThreadId(spaceId);

  console.log(`[budget-dashboard] Base: ${baseUrl}`);
  console.log(`[budget-dashboard] スペース ${spaceId} に「${appName}」を作成します…`);

  const addAppUrl = new URL(`${baseUrl}/k/v1/preview/app.json`);
  const addAppRes = await fetchJson(addAppUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: appName, space: spaceId, thread: threadId }),
  });

  const appId = Number(addAppRes.app);
  if (!Number.isFinite(appId) || appId <= 0) {
    throw new Error(`アプリ作成の応答が不正: ${JSON.stringify(addAppRes)}`);
  }
  console.log(`[budget-dashboard] アプリ作成 appId=${appId}`);

  const postFieldsUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
  const fieldsRes = await fetchJson(postFieldsUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties: FIELD_DEFS }),
  });
  let revision = fieldsRes.revision;

  const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  await fetchJson(depUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision }] }),
  });
  await waitDeploy(appId, 'preview');
  console.log('[budget-dashboard] フォームデプロイ済み');

  try {
    await deployDashboardJs(appId, 'preview');
  } catch (e) {
    console.warn(`[budget-dashboard] カスタマイズ preview 失敗 → live: ${e}`);
    await deployDashboardJs(appId, 'live');
  }

  patchDashboardAppIdInRepo(appId);

  console.log('');
  console.log('=== 完了 ===');
  console.log(`アプリ URL: ${baseUrl}/k/${appId}/`);
  console.log('');
  console.log('1. .env に追記: KINTONE_BUDGET_DASHBOARD_APP_ID=' + appId);
  console.log('2. ナビ JS の ID はリポジトリ内をパッチ済み。649〜653 へ deploy:649 / deploy:650 / deploy:651 / deploy:652 / deploy:653 を実行してください。');
  console.log('   npm run deploy:budget:portal （一括）も利用可。');
}

await main();
