#!/usr/bin/env node
/**
 * 687 に holiday_manual サブテーブルを追加してデプロイ
 *   npx dotenv -e .env -e .env.proxy -- node scripts/workdays-add-fields-687.mjs
 *
 * 新規フィールド追加テンプレ: **POST** `/k/v1/preview/app/form/fields.json` + `revision`。
 * 既存フィールドの properties 全体 PUT や未知 code の PUT は GAIA_FC01。
 */
import 'dotenv/config';

const APP_ID = 687;

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
  for (let i = 0; i < 90; i += 1) {
    const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === 'SUCCESS') return;
    if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
    await sleep(1000);
  }
  throw new Error('Deploy timed out.');
}

async function main() {
  const previewFields = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({ app: APP_ID }),
  });
  if (previewFields.properties?.holiday_manual) {
    console.log('holiday_manual already exists — skip add');
  } else {
    const addBody = {
      app: String(APP_ID),
      properties: {
        holiday_manual: {
          type: 'SUBTABLE',
          code: 'holiday_manual',
          label: '休日手入力(月別)',
          fields: {
            hm_month: { type: 'NUMBER', code: 'hm_month', label: '月(1-12)', digit: false, displayScale: '0' },
            hm_gw: { type: 'NUMBER', code: 'hm_gw', label: 'GW', digit: false, displayScale: '0', defaultValue: '0' },
            hm_summer: { type: 'NUMBER', code: 'hm_summer', label: '夏休み', digit: false, displayScale: '0', defaultValue: '0' },
            hm_nye: { type: 'NUMBER', code: 'hm_nye', label: '年末年始', digit: false, displayScale: '0', defaultValue: '0' },
          },
        },
      },
      revision: previewFields.revision,
    };
    const added = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify(addBody),
    });
    console.log('Added holiday_manual, revision=', added.revision);
  }

  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: String(APP_ID) }] }),
  });
  console.log('Deploying preview → production…');
  await waitDeploy(APP_ID);
  console.log('687 field deploy complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
