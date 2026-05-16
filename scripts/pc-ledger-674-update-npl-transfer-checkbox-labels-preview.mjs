/**
 * App 674: `npl_transfer_manual` のラベル・選択肢を「転用」に統一し preview deploy まで実行。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-update-npl-transfer-checkbox-labels-preview.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-update-npl-transfer-checkbox-labels-preview.mjs
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const APP = 674;
const FIELD = 'npl_transfer_manual';
const FRAGMENT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'pc-ledger-674-npl-transfer-manual-label-tenyo.json');

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
    const u = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    u.searchParams.set('apps[0]', String(APP));
    const res = await fetch(u, { headers: getHeaders });
    const j = await res.json();
    const st = res.ok && j.apps?.[0] ? j.apps[0].status : null;
    if (st === 'SUCCESS') return;
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy status ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('deploy timeout');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const getHeaders = buildAuthHeaders();
  const patch = JSON.parse(readFileSync(FRAGMENT, 'utf8')).fieldPatch;
  if (!patch || typeof patch !== 'object') throw new Error(`${FRAGMENT}: missing fieldPatch`);

  const getUrl = `${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`;
  const getRes = await fetch(getUrl, { headers: getHeaders });
  const getJson = await getRes.json();
  if (!getRes.ok) throw new Error(`GET preview fields: ${getJson.code} ${getJson.message}`);

  const revision = getJson.revision;
  const properties = { ...getJson.properties };
  const def = properties[FIELD];
  if (!def || def.type !== 'CHECK_BOX') {
    throw new Error(`674: field ${FIELD} not found or not CHECK_BOX`);
  }

  const nextLabel = String(patch.label || '').trim();
  const nextOpt = patch.options;
  if (!nextLabel || !nextOpt || typeof nextOpt !== 'object') {
    throw new Error('fieldPatch must include label and options');
  }
  const keys = Object.keys(nextOpt);
  if (keys.length !== 1) throw new Error('expected exactly one CHECK_BOX option');
  const onlyKey = keys[0];
  if (onlyKey !== nextOpt[onlyKey].label) throw new Error('CHECK_BOX option key must equal label (kintone API)');

  const already =
    String(def.label || '').trim() === nextLabel &&
    def.options &&
    Object.keys(def.options).length === 1 &&
    def.options[onlyKey] &&
    String(def.options[onlyKey].label || '') === onlyKey;
  if (already) {
    console.log(`[674] ${FIELD} は既に「転用」表記。PUT スキップ。`);
    return;
  }

  properties[FIELD] = {
    ...def,
    label: nextLabel,
    options: nextOpt,
    defaultValue: Array.isArray(def.defaultValue) ? def.defaultValue : [],
  };

  if (dryRun) {
    console.log(JSON.stringify({ app: APP, revision, field: FIELD, label: nextLabel, options: nextOpt }, null, 2));
    console.error('[674] dry-run: PUT していません');
    return;
  }

  console.log(`[674] PUT preview ${FIELD} label/options → 転用 app=${APP} revision=${revision}`);

  const putRes = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ app: APP, revision, properties }),
  });
  const putText = await putRes.text();
  let putJson;
  try {
    putJson = JSON.parse(putText);
  } catch {
    throw new Error(putText.slice(0, 500));
  }
  if (!putRes.ok) throw new Error(`PUT preview fields: ${putJson.code || putRes.status} ${putJson.message || putText.slice(0, 500)}`);
  const newRev = putJson.revision;

  const depRes = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ apps: [{ app: APP, revision: newRev }] }),
  });
  const depJson = await depRes.json();
  if (!depRes.ok) throw new Error(`deploy: ${depJson.code} ${depJson.message}`);

  await waitDeploy(getHeaders);
  console.log('[674] deploy SUCCESS (npl_transfer_manual ラベル・選択肢を「転用」に統一)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
