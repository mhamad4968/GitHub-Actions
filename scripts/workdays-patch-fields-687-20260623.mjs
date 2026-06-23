#!/usr/bin/env node
/**
 * 687 フィールド改修（2026-06-23）: hm_saturday 追加 / obs_location_note 削除
 *   npx dotenv -e .env -e .env.proxy -- node scripts/workdays-patch-fields-687-20260623.mjs
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
  let previewFields = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({ app: APP_ID }),
  });

  const hol = previewFields.properties?.holiday_manual;
  if (!hol) throw new Error('holiday_manual missing on 687');

  if (!hol.fields?.hm_saturday) {
    const addBody = {
      app: String(APP_ID),
      properties: {
        holiday_manual: {
          type: 'SUBTABLE',
          code: 'holiday_manual',
          label: hol.label || '休日手入力(月別)',
          fields: {
            hm_saturday: {
              type: 'NUMBER',
              code: 'hm_saturday',
              label: '土曜',
              digit: false,
              displayScale: '0',
              defaultValue: '0',
            },
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
    console.log('Added holiday_manual.hm_saturday, revision=', added.revision);
    previewFields = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'POST',
      headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
      body: JSON.stringify({ app: APP_ID }),
    });
  } else {
    console.log('hm_saturday already exists — skip add');
  }

  if (previewFields.properties?.obs_location_note) {
    const delBody = {
      app: String(APP_ID),
      fields: ['obs_location_note'],
      revision: previewFields.revision,
    };
    const deleted = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(delBody),
    });
    console.log('Deleted obs_location_note, revision=', deleted.revision);
  } else {
    console.log('obs_location_note already absent — skip delete');
  }

  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: String(APP_ID) }] }),
  });
  console.log('Deploying preview → production…');
  await waitDeploy(APP_ID);
  console.log('687 field patch complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
