/**
 * App 674: SKYSEAクライアント削除 status/date をプレビューへ POST し deploy。
 * レイアウト配置は `pc-ledger:674:layout-skysea-group` で skysea_system_meta 内へ。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-add-skysea-client-delete-preview.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-add-skysea-client-delete-preview.mjs
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const APP = 674;
const FRAGMENT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'data',
  'pc-ledger-674-add-skysea-client-delete-properties.json',
);

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const authHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
const jsonHeaders = { ...authHeaders, 'Content-Type': 'application/json' };
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  const ba = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
  authHeaders.Authorization = ba;
  jsonHeaders.Authorization = ba;
}

async function getPreviewFields() {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET fields: ${j.code} ${j.message}`);
  return j;
}

async function postPreviewFields(properties) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ app: APP, properties }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`POST fields: ${j.code} ${j.message}`);
  return j.revision;
}

async function deployPreview(revision) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ apps: [{ app: APP, revision }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`deploy: ${j.code} ${j.message}`);
}

async function waitDeploy() {
  for (let i = 0; i < 90; i++) {
    const u = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    u.searchParams.set('apps[0]', String(APP));
    const res = await fetch(u, { headers: authHeaders });
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
  const raw = JSON.parse(readFileSync(FRAGMENT_PATH, 'utf8'));
  const properties = raw.properties;
  if (!properties || typeof properties !== 'object') throw new Error(`${FRAGMENT_PATH}: missing properties`);

  const cur = await getPreviewFields();
  if (cur.properties?.skysea_client_delete_status && cur.properties?.skysea_client_delete_date) {
    console.log('674: skysea_client_delete_* は既に存在。POST スキップ。');
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ app: APP, properties }, null, 2));
    console.error('[674] dry-run: POST していません');
    return;
  }

  const rev = await postPreviewFields(properties);
  await deployPreview(rev);
  await waitDeploy();
  console.log('[674] deploy SUCCESS (skysea_client_delete_* 追加)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
