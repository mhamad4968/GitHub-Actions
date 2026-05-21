#!/usr/bin/env node
/**
 * 工事稼働日数算出 — プレビュー内容を本番反映（ACL 失敗後の続き用）
 *   npx dotenv -e .env -e .env.proxy -- node scripts/workdays-finish-deploy.mjs [appId]
 */
import 'dotenv/config';

const APP_NAME = '工事稼働日数算出';
const appId = Number(process.argv[2] || process.env.WORKDAYS_APP_ID || 0);

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

async function resolveAppId() {
  if (appId) return appId;
  const found = await fetchJson(`${baseUrl}/k/v1/apps.json`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({ name: APP_NAME }),
  });
  const hit = (found.apps || []).find((a) => a.name === APP_NAME);
  if (!hit) throw new Error(`アプリ "${APP_NAME}" が見つかりません`);
  return Number(hit.appId);
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

async function main() {
  const id = await resolveAppId();
  const prev = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({ app: id }),
  });
  const custom = Object.keys(prev.properties || {}).filter((k) => !k.startsWith('$'));
  console.log(`app=${id} preview revision=${prev.revision} customFields=${custom.length}`);

  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: id, revision: prev.revision }] }),
  });
  await waitDeploy(id);
  console.log(`Deploy SUCCESS → ${baseUrl}/k/${id}/`);
  console.log('ACL: API ユーザーにアプリ管理権限がない場合、管理画面で Everyone を手動設定してください。');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
