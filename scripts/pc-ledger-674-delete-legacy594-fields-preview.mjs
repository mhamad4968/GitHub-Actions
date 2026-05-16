#!/usr/bin/env node
/**
 * App 674: `legacy_pc_name_594` / `legacy_record_id_594` を **プレビュー経由で削除**し deploy まで実行。
 * （公式: `DELETE /k/v1/preview/app/form/fields.json` に `app`・`revision`・`fields[n]` を指定。`PUT` で `properties: { code: null }` は **CB_VA01** になるため使わない）
 *
 * **必須の順序（不具合防止）**
 * 1. **先に** `deploy:674` 等で **customize（new-pc-ledger-v1）を本番反映**し、削除後に存在しないフィールド code を参照しないこと。
 * 2. 本スクリプトでフィールド削除 deploy。
 * 3. `npm run pc-ledger:674:layout-internal-group`（フォーム上の `internal_system_meta` 内子フィールドを 3 件に再収容）。
 *
 * **kintone 管理画面で人手確認（リポ外）**
 * - 一覧の「絞り込み」・グラフ・プラグイン等が **削除した code を参照**しているとエラーまたは空表示になる。**該当があれば設定を直す**。
 * - フィールド削除後、当該フィールドに入っていた **レコード上の値は参照できなくなる**（プラットフォーム仕様）。バックアップが必要なら **削除前に CSV エクスポート等**で退避する。
 *
 * **採番（customize）**: JBIS 連番の最大値走査は **`pc_name` のみ**。移行で `pc_name` が空かつ旧名が legacy にしか無かったレコードは、削除後は自動採番に拾われない。**`pc_name` を手修正**するか、取込時点で `pc_name` が入っていることを確認する。
 *
 * 前提: ブラウザ JS（`customize/new-pc-ledger-v1/desktop.js`）から当該フィールド参照を除去済み。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-delete-legacy594-fields-preview.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-delete-legacy594-fields-preview.mjs
 */
import 'dotenv/config';

const APP = 674;
const DELETE_CODES = ['legacy_pc_name_594', 'legacy_record_id_594'];

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
    console.warn(`[674] 一部のみ存在（存在するものだけ削除）: 削除=${toDelete.join(', ')} / 無し=${missing.join(', ')}`);
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
    const st = stRes.ok && stJson.apps?.[0] ? stJson.apps[0].status : null;
    if (st === 'SUCCESS') {
      console.log('[674] deploy SUCCESS（legacy_pc_name_594 / legacy_record_id_594 を削除しました）');
      console.log('次: npm run pc-ledger:674:layout-internal-group（レイアウトを内部グループに再収容）');
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
