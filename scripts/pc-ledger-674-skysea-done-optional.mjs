#!/usr/bin/env node
/**
 * App 674: skysea_manual_done をフォーム必須解除し、default も空にする。
 * 個人のみ customize で未了補完。共有/JR/サーバーNAS/その他は対象外（空可）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-skysea-done-optional.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-skysea-done-optional.mjs
 */
import 'dotenv/config';

const APP = 674;
const FIELD = 'skysea_manual_done';

function requireEnv(k) {
  const v = process.env[k];
  if (!v || !String(v).trim()) throw new Error(`Missing env: ${k}`);
  return String(v).trim();
}

function buildAuthHeaders() {
  const user = requireEnv('KINTONE_USERNAME');
  const pass = requireEnv('KINTONE_PASSWORD');
  const headers = {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64')}`;
  }
  return headers;
}

function jsonHeaders() {
  return { ...buildAuthHeaders(), 'Content-Type': 'application/json' };
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');

async function waitDeploy(getHeaders) {
  for (let i = 0; i < 90; i++) {
    const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    stUrl.searchParams.set('apps[0]', String(APP));
    const stRes = await fetch(stUrl, { headers: getHeaders });
    const stJson = await stRes.json();
    const st = stRes.ok && stJson.apps?.[0] ? stJson.apps[0].status : null;
    if (st === 'SUCCESS') return;
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy status ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('deploy timeout');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const getHeaders = buildAuthHeaders();

  const getUrl = `${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`;
  const getRes = await fetch(getUrl, { headers: getHeaders });
  const getJson = await getRes.json();
  if (!getRes.ok) throw new Error(`GET preview fields: ${getJson.code} ${getJson.message}`);

  const revision = getJson.revision;
  const properties = { ...getJson.properties };
  const def = properties[FIELD];
  if (!def || def.type !== 'DROP_DOWN') {
    throw new Error(`674: field ${FIELD} not found or not DROP_DOWN`);
  }

  const needRequired = !!def.required;
  const needDefault = String(def.defaultValue || '') !== '';
  if (!needRequired && !needDefault) {
    console.log(`[674] ${FIELD} は既に required=false / default空。何もしません。`);
    return;
  }

  properties[FIELD] = {
    ...def,
    required: false,
    defaultValue: '',
  };

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          app: APP,
          revision,
          patch: {
            [FIELD]: {
              required: false,
              defaultValue: '',
              label: def.label,
              was: { required: def.required, defaultValue: def.defaultValue },
            },
          },
        },
        null,
        2,
      ),
    );
    console.error('[674] dry-run: PUT していません');
    return;
  }

  console.log(
    `[674] PUT preview ${FIELD} required=false default="" app=${APP} revision=${revision}`,
  );

  const putRes = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers: jsonHeaders(),
    // kintone PUT fields: 変更フィールドのみ送る（全 properties だと巨大・危険）
    body: JSON.stringify({
      app: APP,
      revision,
      properties: { [FIELD]: properties[FIELD] },
    }),
  });
  const putText = await putRes.text();
  const putJson = JSON.parse(putText);
  if (!putRes.ok) {
    throw new Error(
      `PUT preview fields: ${putJson.code || putRes.status} ${putJson.message || putText.slice(0, 500)}`,
    );
  }
  const newRev = putJson.revision;
  console.log(`[674] PUT OK new revision=${newRev}`);

  const depRes = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ apps: [{ app: APP, revision: newRev }] }),
  });
  const depJson = await depRes.json();
  if (!depRes.ok) throw new Error(`deploy: ${depJson.code} ${depJson.message}`);

  await waitDeploy(getHeaders);
  console.log(
    '[674] deploy SUCCESS — skysea_manual_done はフォーム必須ではない（個人は customize で未了補完）',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
