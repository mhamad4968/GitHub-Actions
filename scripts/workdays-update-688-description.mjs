#!/usr/bin/env node
/** アプリ 688 の説明文を更新して本番反映 */
import 'dotenv/config';

const APP_ID = Number(process.env.WORKDAYS_DASH_APP_ID || 688);
const DESC = '工事稼働日数計算ツールです。データ入力後保存を押してください。';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '').replace(/\/k$/i, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');
const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  'Content-Type': 'application/json',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`HTTP ${res.status} ${json.code || ''} ${json.message || text}`.trim());
  return json;
}

async function waitDeploy(appNum) {
  const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  stUrl.searchParams.set('apps[0]', String(appNum));
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const status = st.apps?.[0]?.status;
    if (status === 'SUCCESS') return;
    if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy ${status}`);
    await sleep(1000);
  }
  throw new Error('Deploy timed out');
}

const j = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ app: String(APP_ID), name: '工事稼働日数ダッシュ', description: DESC, theme: 'GREEN' }),
});
await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ apps: [{ app: APP_ID, revision: j.revision }] }),
});
await waitDeploy(APP_ID);
console.log(`app ${APP_ID} description updated and deployed`);
