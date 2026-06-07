#!/usr/bin/env node
/**
 * Security NEXT 掲示板 2 件 — 空アプリ作成（Space 48）
 *
 *   npm run setup:security-next-board-apps
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IDS_PATH = join(__dirname, 'data/security-next-board-app-ids.json');

const APPS = [
  {
    key: 'newsBoardAppId',
    name: 'Security NEXT ニュース掲示板',
    description:
      'Security NEXT インシデントニュースの閲覧用掲示板です。正本はアプリ631（CVE・パッチ告知は掲示板では非表示）。',
    theme: 'RED',
  },
  {
    key: 'weeklyBoardAppId',
    name: 'Security NEXT 週次掲示板',
    description: 'Security NEXT 週次要約の閲覧用掲示板です。正本はアプリ632。',
    theme: 'RED',
  },
];

const SPACE_ID = Number(process.env.SECURITY_NEXT_BOARD_SPACE_ID || 48);
const STORE_NEWS = Number(process.env.KINTONE_APP_ID || 631);
const STORE_WEEKLY = Number(process.env.KINTONE_REPORT_APP_ID || 632);

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    throw new Error(`HTTP ${res.status} ${msg}`.trim());
  }
  return json;
}

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
  throw new Error('Deploy timed out.');
}

async function deployApp(appId, revision) {
  const body = revision != null ? { apps: [{ app: appId, revision }] } : { apps: [{ app: appId }] };
  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  await waitDeploy(appId);
}

async function resolveDefaultThreadId(spaceId) {
  const override = process.env.KINTONE_SPACE_DEFAULT_THREAD;
  if (override && /^\d+$/.test(override)) return Number(override);
  const u = new URL(`${baseUrl}/k/v1/space.json`);
  u.searchParams.set('id', String(spaceId));
  const sp = await fetchJson(u, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const dt = sp?.defaultThread;
  if (!dt || String(dt).trim() === '') {
    throw new Error(`Space ${spaceId} has no defaultThread`);
  }
  return Number(dt);
}

async function findAppByName(name) {
  const found = await fetchJson(`${baseUrl}/k/v1/apps.json`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({ name }),
  });
  return (found.apps || []).find((a) => a.name === name) || null;
}

async function createShellApp(def, threadId) {
  const existing = await findAppByName(def.name);
  if (existing) {
    console.log(`[skip] 既存: "${def.name}" appId=${existing.appId}`);
    return Number(existing.appId);
  }

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: def.name, space: SPACE_ID, thread: threadId }),
  });
  const appId = Number(add.app);
  console.log(`[create] "${def.name}" appId=${appId}`);

  await deployApp(appId);

  const settingsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(appId),
      name: def.name,
      description: def.description,
      theme: def.theme,
    }),
  });
  await deployApp(appId, settingsRes.revision);
  console.log(`[create] deploy OK appId=${appId} URL=${baseUrl}/k/${appId}/`);
  return appId;
}

async function main() {
  const threadId = await resolveDefaultThreadId(SPACE_ID);
  console.log(`Space ${SPACE_ID} thread=${threadId} storeNews=${STORE_NEWS} storeWeekly=${STORE_WEEKLY}`);

  const ids = {
    spaceId: SPACE_ID,
    threadId,
    newsStoreAppId: STORE_NEWS,
    weeklyStoreAppId: STORE_WEEKLY,
  };

  for (const def of APPS) {
    ids[def.key] = await createShellApp(def, threadId);
  }

  writeFileSync(IDS_PATH, JSON.stringify(ids, null, 2) + '\n', 'utf8');
  console.log('');
  console.log('Wrote', IDS_PATH);
  console.log(JSON.stringify(ids, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
