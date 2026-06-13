#!/usr/bin/env node
/**
 * 687 に estimate_year（見積作成年）を追加。着工日・完工日を任意に変更。
 *   npx dotenv -e .env -e .env.proxy -- node scripts/workdays-add-estimate-year-687.mjs
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
  const props = previewFields.properties || {};
  const updates = {};

  if (!props.estimate_year) {
    updates.estimate_year = {
      type: 'NUMBER',
      code: 'estimate_year',
      label: '見積作成年',
      digit: false,
      displayScale: '0',
    };
  }

  const patchOptionalDates = {};
  if (props.start_date) patchOptionalDates.start_date = { ...props.start_date, required: false };
  if (props.end_date) patchOptionalDates.end_date = { ...props.end_date, required: false };

  if (Object.keys(updates).length) {
    await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: String(APP_ID), properties: updates }),
    });
    console.log('Added estimate_year');
  } else {
    console.log('estimate_year already exists');
  }

  if (Object.keys(patchOptionalDates).length) {
    await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: String(APP_ID), properties: patchOptionalDates }),
    });
    console.log('Set start_date/end_date optional');
  }

  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: String(APP_ID) }] }),
  });
  await waitDeploy(APP_ID);
  console.log('687 preview deploy OK — promote to production separately if needed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
