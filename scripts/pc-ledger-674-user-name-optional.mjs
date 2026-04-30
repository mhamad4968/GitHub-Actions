#!/usr/bin/env node
/**
 * App 674: `user_name`（利用者名）の **required を false** にし、プレビュー deploy まで実行。
 * 仕様: `docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.1a（個人×保管で空 import 可）。
 * Tier B（浜田 GO 後のみ実行）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-user-name-optional.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-user-name-optional.mjs
 */
import 'dotenv/config';

const APP = 674;
const FIELD = 'user_name';

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
  if (!def || def.type !== 'SINGLE_LINE_TEXT') {
    throw new Error(`674: field ${FIELD} not found or not SINGLE_LINE_TEXT`);
  }
  if (!def.required) {
    console.log(`[674] ${FIELD}.required は既に false。何もしません。`);
    return;
  }

  properties[FIELD] = { ...def, required: false };

  if (dryRun) {
    console.log(JSON.stringify({ app: APP, revision, patch: { [FIELD]: { required: false, label: def.label } } }, null, 2));
    console.error('[674] dry-run: PUT していません');
    return;
  }

  console.log(`[674] PUT preview user_name.required=false app=${APP} revision=${revision}`);

  const putRes = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ app: APP, revision, properties }),
  });
  const putText = await putRes.text();
  const putJson = JSON.parse(putText);
  if (!putRes.ok) throw new Error(`PUT preview fields: ${putJson.code || putRes.status} ${putJson.message || putText.slice(0, 500)}`);
  const newRev = putJson.revision;
  console.log(`[674] PUT OK new revision=${newRev}`);

  const depRes = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ apps: [{ app: APP, revision: newRev }] }),
  });
  const depJson = await depRes.json();
  if (!depRes.ok) throw new Error(`deploy: ${depJson.code} ${depJson.message}`);

  for (let i = 0; i < 90; i++) {
    const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    stUrl.searchParams.set('apps[0]', String(APP));
    const stRes = await fetch(stUrl, { headers: getHeaders });
    const stJson = await stRes.json();
    const st = stRes.ok && stJson.apps?.[0] ? stJson.apps[0].status : null;
    if (st === 'SUCCESS') {
      console.log('[674] deploy SUCCESS (user_name は必須ではなくなりました)');
      return;
    }
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy status ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('deploy timeout');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
