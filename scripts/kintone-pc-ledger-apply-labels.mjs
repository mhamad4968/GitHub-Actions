#!/usr/bin/env node
/**
 * 新・PC台帳ver.1 — プレビュー上のフィールド label を日本語に更新し deploy まで行う。
 * Tier B（浜田 GO 必須）。単体: npx dotenv -e .env -e .env.proxy -- node scripts/kintone-pc-ledger-apply-labels.mjs --app=674
 */
import 'dotenv/config';
import { PC_LEDGER_V1_LABELS } from './pc-ledger-v1-labels.mjs';

function requireEnv(k) {
  const v = process.env[k];
  if (!v || !String(v).trim()) throw new Error(`Missing env: ${k}`);
  return String(v);
}

function parseApp(argv) {
  const a = argv.find((x) => x.startsWith('--app='));
  if (!a) throw new Error('Usage: node scripts/kintone-pc-ledger-apply-labels.mjs --app=674');
  return a.slice('--app='.length);
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
  const app = parseApp(process.argv);
  const getHeaders = buildAuthHeaders();

  const getUrl = `${baseUrl}/k/v1/preview/app/form/fields.json?app=${encodeURIComponent(app)}`;
  const getRes = await fetch(getUrl, { headers: getHeaders });
  const getBody = await getRes.text();
  let getJson;
  try {
    getJson = JSON.parse(getBody);
  } catch {
    throw new Error(`GET preview fields: HTTP ${getRes.status} non-JSON: ${getBody.slice(0, 400)}`);
  }
  if (!getRes.ok) throw new Error(`GET preview fields: ${getJson.code} ${getJson.message}`);

  const revision = getJson.revision;
  const properties = { ...getJson.properties };
  let n = 0;
  for (const [code, label] of Object.entries(PC_LEDGER_V1_LABELS)) {
    if (!properties[code]) continue;
    if (properties[code].label === label) continue;
    properties[code] = { ...properties[code], label };
    n++;
  }
  if (n === 0) {
    console.log('[apply-labels] no label changes needed (already Japanese?)');
    return;
  }
  console.log(`[apply-labels] updating ${n} field label(s) on preview app=${app} revision=${revision}`);

  const putRes = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ app: Number(app), revision, properties }),
  });
  const putText = await putRes.text();
  const putJson = JSON.parse(putText);
  if (!putRes.ok) throw new Error(`PUT preview fields: ${putJson.code || putRes.status} ${putJson.message || putText.slice(0, 500)}`);
  const newRev = putJson.revision;
  console.log(`[apply-labels] PUT OK new revision=${newRev}`);

  const depRes = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ apps: [{ app: Number(app), revision: newRev }] }),
  });
  const depText = await depRes.text();
  const depJson = JSON.parse(depText);
  if (!depRes.ok) throw new Error(`deploy: ${depJson.code} ${depJson.message}`);

  for (let i = 0; i < 30; i++) {
    const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    stUrl.searchParams.set('apps[0]', String(app));
    const stRes = await fetch(stUrl, { headers: getHeaders });
    const stJson = await stRes.json();
    const st = stRes.ok && stJson.apps?.[0] ? stJson.apps[0].status : null;
    if (st === 'SUCCESS') {
      console.log('[apply-labels] deploy SUCCESS');
      return;
    }
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy status ${st}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('deploy poll timeout');
}

main().catch((e) => {
  console.error('[apply-labels] fatal:', e.message || e);
  process.exit(1);
});
