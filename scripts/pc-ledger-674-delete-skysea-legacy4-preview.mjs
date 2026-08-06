#!/usr/bin/env node
/**
 * App 674: 旧 SKYSEA 4 フィールドをプレビュー DELETE → deploy
 *   skysea_status / skysea_checked_at / skysea_install_log / skysea_target_flag
 *
 * **必須の順序**
 * 1. バックアップ: `npm run pc-ledger:674:export-skysea-legacy4-backup`
 * 2. customize から参照除去 → `deploy:674`
 * 3. 本スクリプトで DELETE + deploy
 * 4. `npm run pc-ledger:674:layout-skysea-group`（manual 3 件のみ再収容）
 * 5. 必要なら ACL を manual のみに再 PUT（`pc-ledger:674:skysea-manual-setup -- --skip-bulk`）
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-delete-skysea-legacy4-preview.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-delete-skysea-legacy4-preview.mjs
 */
import 'dotenv/config';

const APP = 674;
const DELETE_CODES = [
  'skysea_status',
  'skysea_checked_at',
  'skysea_install_log',
  'skysea_target_flag',
];

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
  const props = getJson.properties || {};
  const missing = DELETE_CODES.filter((c) => !props[c]);
  if (missing.length === DELETE_CODES.length) {
    console.log(`[674] 削除対象フィールドは既に存在しません: ${DELETE_CODES.join(', ')}`);
    return;
  }
  const toDelete = DELETE_CODES.filter((c) => props[c]);
  if (missing.length) {
    console.warn(
      `[674] 一部のみ存在（存在するものだけ削除）: 削除=${toDelete.join(', ')} / 無し=${missing.join(', ')}`,
    );
  }

  if (dryRun) {
    console.log(JSON.stringify({ app: APP, revision, delete: toDelete, method: 'DELETE' }, null, 2));
    console.error('[674] dry-run: DELETE していません');
    return;
  }

  const delUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
  delUrl.searchParams.set('app', String(APP));
  delUrl.searchParams.set('revision', String(revision));
  toDelete.forEach((code, i) => {
    delUrl.searchParams.set(`fields[${i}]`, code);
  });

  console.log(`[674] DELETE preview fields app=${APP} revision=${revision} codes=${toDelete.join(',')}`);

  const delRes = await fetch(delUrl.toString(), {
    method: 'DELETE',
    headers: getHeaders,
  });
  const delText = await delRes.text();
  let delJson;
  try {
    delJson = JSON.parse(delText);
  } catch {
    delJson = null;
  }
  if (!delRes.ok) {
    throw new Error(
      `DELETE preview fields: ${delJson?.code || delRes.status} ${delJson?.message || delText.slice(0, 800)}`,
    );
  }
  const newRev = delJson.revision;
  console.log(`[674] DELETE OK new revision=${newRev}`);

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
    const st = stRes.ok && stJson.apps?.[0] ? stJson.apps?.[0].status : null;
    if (st === 'SUCCESS') {
      console.log(`[674] deploy SUCCESS（削除: ${toDelete.join(', ')}）`);
      console.log('次: npm run pc-ledger:674:layout-skysea-group');
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
