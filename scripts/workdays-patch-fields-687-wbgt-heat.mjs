#!/usr/bin/env node
/**
 * 687 WBGT 猛暑日参考用フィールド追加
 *   npx dotenv -e .env -e .env.proxy -- node scripts/workdays-patch-fields-687-wbgt-heat.mjs
 *
 * 新規フィールド（特に SUBTABLE）は preview API **POST + revision** 必須。
 * properties 全体の PUT は GAIA_FC01 になる — 正本: scripts/workdays-add-fields-687.mjs
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

async function getPreviewFields() {
  return fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({ app: APP_ID }),
  });
}

async function addFields(properties, revision) {
  const added = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      app: String(APP_ID),
      properties,
      revision,
    }),
  });
  return added.revision;
}

async function main() {
  let previewFields = await getPreviewFields();
  let revision = previewFields.revision;
  const props = previewFields.properties || {};
  let changed = false;

  if (!props.wbgt_data) {
    revision = await addFields(
      {
        wbgt_data: {
          type: 'SUBTABLE',
          code: 'wbgt_data',
          label: 'WBGT月別換算（参考）',
          fields: {
            wbgt_year: { type: 'NUMBER', code: 'wbgt_year', label: '年', required: true, minValue: '2000', maxValue: '2100' },
            wbgt_month: { type: 'NUMBER', code: 'wbgt_month', label: '月', required: true, minValue: '1', maxValue: '12' },
            wbgt_converted_days: {
              type: 'NUMBER',
              code: 'wbgt_converted_days',
              label: '猛暑日換算日数',
              required: false,
              digit: true,
              displayScale: '2',
            },
          },
        },
      },
      revision,
    );
    changed = true;
    console.log('[patch] add wbgt_data subtable');
    previewFields = await getPreviewFields();
    revision = previewFields.revision;
  }

  const toAdd = {};
  if (!props.show_heat_reference) {
    toAdd.show_heat_reference = {
      type: 'CHECK_BOX',
      code: 'show_heat_reference',
      label: '猛暑日行を画面表示',
      options: { 表示: { label: '表示', index: '0' } },
    };
  }
  if (!props.print_heat_reference) {
    toAdd.print_heat_reference = {
      type: 'CHECK_BOX',
      code: 'print_heat_reference',
      label: '猛暑日行を印刷に含める',
      options: { 含める: { label: '含める', index: '0' } },
    };
  }
  if (Object.keys(toAdd).length) {
    revision = await addFields(toAdd, revision);
    changed = true;
    if (toAdd.show_heat_reference) console.log('[patch] add show_heat_reference');
    if (toAdd.print_heat_reference) console.log('[patch] add print_heat_reference');
  }

  if (!changed) {
    console.log('[patch] 687 WBGT fields already present — skip');
    return;
  }

  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: String(APP_ID) }] }),
  });
  await waitDeploy(APP_ID);
  console.log('[patch] 687 WBGT fields deploy SUCCESS');
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
