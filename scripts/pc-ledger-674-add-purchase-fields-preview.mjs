/**
 * App 674: 購入金額・購入先（プルダウン＋手入力）フィールドをプレビューへ POST し deploy まで実行。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-add-purchase-fields-preview.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-add-purchase-fields-preview.mjs
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const APP = 674;
const FIELD_CODES = ['purchase_amount', 'purchase_vendor', 'purchase_vendor_other'];
const FRAGMENT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'data',
  'pc-ledger-674-add-purchase-fields.json',
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
  const missing = FIELD_CODES.filter((code) => !cur.properties?.[code]);
  if (!missing.length) {
    console.log('674: 購入金額・購入先フィールドは既に存在。POST スキップ。');
    return;
  }

  const toAdd = {};
  for (const code of missing) {
    if (!properties[code]) throw new Error(`${FRAGMENT_PATH}: missing ${code}`);
    toAdd[code] = properties[code];
  }

  if (dryRun) {
    console.log(JSON.stringify({ app: APP, properties: toAdd }, null, 2));
    console.error('[674] dry-run: POST していません');
    return;
  }

  const rev = await postPreviewFields(toAdd);
  await deployPreview(rev);
  await waitDeploy();
  console.log(`[674] deploy SUCCESS (購入フィールド追加: ${missing.join(', ')})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
