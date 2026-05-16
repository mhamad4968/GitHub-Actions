#!/usr/bin/env node
/**
 * App 682（ユーザサポート件数日次）: 午前／午後の「対応内容」複数行テキストを追加し preview deploy まで実行。
 * 件数の自動反映は `customize/682/desktop.js`（保存直前）で行う。新規コードは **POST** で追加（PUT 全置換は不可）。
 *
 *   node --env-file=.env scripts/user-support-682-add-correspondence-fields.mjs --dry-run
 *   node --env-file=.env scripts/user-support-682-add-correspondence-fields.mjs
 */
import 'dotenv/config';

const APP = 682;

const NEW_FIELDS = {
  am_correspondence: {
    type: 'MULTI_LINE_TEXT',
    code: 'am_correspondence',
    label: '午前の対応内容（1行1件・保存時に午前件数へ反映）',
    defaultValue: '',
    required: false,
  },
  pm_correspondence: {
    type: 'MULTI_LINE_TEXT',
    code: 'pm_correspondence',
    label: '午後の対応内容（1行1件・保存時に午後件数へ反映）',
    defaultValue: '',
    required: false,
  },
};

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

  const properties = { ...getJson.properties };

  const missing = {};
  for (const [code, def] of Object.entries(NEW_FIELDS)) {
    if (properties[code]) {
      console.log(`[682] フィールド ${code} は既に存在します。スキップ。`);
    } else {
      missing[code] = def;
    }
  }
  if (Object.keys(missing).length === 0) {
    console.log('[682] 追加対象のフィールドはありません。');
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ app: APP, addCodes: Object.keys(missing) }, null, 2));
    console.error('[682] dry-run: POST していません');
    return;
  }

  /** 新規フィールドは POST でマージ追加（PUT 全置換は GAIA_FC01 になり得る） */
  console.log(`[682] POST preview fields app=${APP} add=${Object.keys(missing).join(',')}`);

  const postRes = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ app: APP, properties: missing }),
  });
  const postText = await postRes.text();
  const postJson = JSON.parse(postText);
  if (!postRes.ok) {
    throw new Error(`POST preview fields: ${postJson.code || postRes.status} ${postJson.message || postText.slice(0, 500)}`);
  }
  const newRev = postJson.revision;
  console.log(`[682] POST OK new revision=${newRev}`);

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
      console.log('[682] deploy SUCCESS（am_correspondence / pm_correspondence 追加）');
      console.log('次: npm run deploy:682 で desktop.js を反映');
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
