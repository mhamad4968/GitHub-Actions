#!/usr/bin/env node
/**
 * App 595: 形骸フィールド `bulk_downstream_sync_log` をプレビュー経由で削除し deploy。
 * 正の一括反映ログは 697 `bulk_downstream_595_log`（R-0630-01）。customize は本フィールドを書かない。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/595-delete-orphan-bulk-downstream-sync-log-preview.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/595-delete-orphan-bulk-downstream-sync-log-preview.mjs
 */
import 'dotenv/config';

const APP = 595;
const DELETE_CODES = ['bulk_downstream_sync_log'];

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
    console.log(`[595] 削除対象フィールドは既に存在しません: ${DELETE_CODES.join(', ')}`);
    return;
  }
  const toDelete = DELETE_CODES.filter((c) => props[c]);

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          app: APP,
          revision,
          delete: toDelete.map((code) => ({
            code,
            type: props[code]?.type,
            label: props[code]?.label,
          })),
          note: 'R-0630-01: log belongs on 697 bulk_downstream_595_log; customize does not write this field',
          method: 'DELETE',
        },
        null,
        2,
      ),
    );
    console.error('[595] dry-run: DELETE していません');
    return;
  }

  const delUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
  delUrl.searchParams.set('app', String(APP));
  delUrl.searchParams.set('revision', String(revision));
  toDelete.forEach((code, i) => {
    delUrl.searchParams.set(`fields[${i}]`, code);
  });

  console.log(`[595] DELETE preview fields app=${APP} revision=${revision} codes=${toDelete.join(',')}`);

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
  console.log(`[595] DELETE OK new revision=${newRev}`);

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
      console.log('[595] deploy SUCCESS（bulk_downstream_sync_log を削除しました）');
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
