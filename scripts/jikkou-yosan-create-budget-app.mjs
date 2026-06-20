#!/usr/bin/env node
/** 実行予算書作成支援ツール　ver.01 — kintone アプリ作成 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_NAME = '実行予算書作成支援ツール　ver.01';
const SPACE_ID = Number(process.env.JIKKOU_YOSAN_SPACE_ID || 56);
const THREAD_ID = Number(process.env.JIKKOU_YOSAN_THREAD_ID || 60);
const FIELDS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'jikkou-yosan-budget-fields.json');

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
  if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 1200)}`);
  return json;
}

async function waitDeploy(appNum) {
  const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  stUrl.searchParams.set('apps[0]', String(appNum));
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const status = st.apps?.[0]?.status;
    if (status === 'SUCCESS') return;
    if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
    await sleep(1000);
  }
  throw new Error('Deploy timed out.');
}

async function deployApp(appId, revision) {
  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision: revision != null ? revision : undefined }] }),
  });
  await waitDeploy(appId);
}

async function main() {
  const raw = JSON.parse(readFileSync(FIELDS_PATH, 'utf8'));
  const properties = raw.properties;

  const found = await fetchJson(`${baseUrl}/k/v1/apps.json`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({ name: APP_NAME }),
  });
  const existing = (found.apps || []).filter((a) => a.name === APP_NAME);
  if (existing.length) {
    console.log(`既存: appId=${existing[0].appId} JIKKOU_YOSAN_BUDGET_APP_ID=${existing[0].appId}`);
    return;
  }

  console.log(`作成: ${APP_NAME}`);
  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  await deployApp(appId);

  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });

  await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(appId),
      name: APP_NAME,
      description: '実行予算書 ver.01 — 総括表・詳細表 Excel 風 UI。リストマスタ参照。',
      theme: 'BLUE',
    }),
  });

  try {
    await fetchJson(`${baseUrl}/k/v1/preview/app/acl.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: String(appId),
        rights: [
          {
            entity: { type: 'GROUP', code: 'everyone' },
            appEditable: false,
            recordViewable: true,
            recordAddable: true,
            recordEditable: true,
            recordDeletable: true,
            recordImportable: false,
            recordExportable: true,
          },
        ],
      }),
    });
  } catch (e) {
    console.warn('ACL skip:', e.message);
  }

  await deployApp(appId, fieldsRes.revision);
  console.log(`JIKKOU_YOSAN_BUDGET_APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
