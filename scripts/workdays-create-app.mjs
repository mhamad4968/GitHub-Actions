#!/usr/bin/env node
/**
 * 工事稼働日数算出 — kintone アプリ作成（Space 56 / thread 60）
 * 正本: C:\tmp\稼働日数算出ツール\SPEC-v1.md
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/workdays-create-app.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/workdays-create-app.mjs --dry-run
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const APP_NAME = '工事稼働日数算出';
const SPACE_ID = Number(process.env.WORKDAYS_SPACE_ID || 56);
const THREAD_ID = Number(process.env.WORKDAYS_THREAD_ID || 60);
const FIELDS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'workdays-app-fields.json');

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

async function setEveryoneAcl(appId) {
  const body = {
    app: String(appId),
    rights: [
      {
        entity: { type: 'GROUP', code: 'everyone' },
        appEditable: false,
        recordViewable: true,
        recordAddable: true,
        recordEditable: true,
        recordDeletable: true,
        recordImportable: true,
        recordExportable: true,
      },
    ],
  };
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/acl.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return j.revision;
}

async function setAppDescription(appId) {
  const body = {
    app: String(appId),
    name: APP_NAME,
    description:
      '気象データ（風速・降雨・湿度）と休日から足場・塗装の稼働可能日数を算出します。正本: SPEC-v1（マニュアル準拠）。',
    theme: 'BLUE',
  };
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return j.revision;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const raw = JSON.parse(readFileSync(FIELDS_PATH, 'utf8'));
  const properties = raw.properties;
  if (!properties) throw new Error('workdays-app-fields.json: missing properties');

  const found = await fetchJson(`${baseUrl}/k/v1/apps.json`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({ name: APP_NAME }),
  });
  const existing = (found.apps || []).filter((a) => a.name === APP_NAME);
  if (existing.length) {
    const id = existing[0].appId;
    console.log(`既存アプリ: appId=${id} URL=${baseUrl}/k/${id}/`);
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ name: APP_NAME, space: SPACE_ID, thread: THREAD_ID, fieldCount: Object.keys(properties).length }, null, 2));
    return;
  }

  console.log(`作成開始: "${APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID}`);

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  console.log(`app=${appId} revision=${add.revision}`);

  await deployApp(appId);
  console.log('空アプリ deploy OK');

  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  console.log(`フィールド追加 revision=${fieldsRes.revision}`);

  const settingsRev = await setAppDescription(appId);
  console.log(`説明・テーマ revision=${settingsRev}`);

  let deployRev = settingsRev;
  try {
    const aclRev = await setEveryoneAcl(appId);
    console.log(`ACL Everyone revision=${aclRev}`);
    deployRev = aclRev;
  } catch (e) {
    console.warn(`ACL スキップ: ${e.message || e}`);
    console.warn('管理画面で Everyone（閲覧・追加・編集・削除・インポート・エクスポート）を設定してください。');
  }

  await deployApp(appId, deployRev);
  console.log('');
  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
  console.log(`SPACE=https://jbis-kintone.cybozu.com/k/#/space/${SPACE_ID}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
