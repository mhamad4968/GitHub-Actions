#!/usr/bin/env node
/**
 * App USER683_SUMMARY_APP（既定 683）: 週次・月次要約キャッシュ用フィールドを POST 追加し preview deploy まで実行。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/user683-add-summary-cache-fields.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/user683-add-summary-cache-fields.mjs
 *
 * Runbook: docs/runbooks/user683-summary-job.md
 */
import 'dotenv/config';

const APP = Number(process.env.USER683_SUMMARY_APP || 683);

function pad2(n) {
  return String(n).padStart(2, '0');
}

const NEW_FIELDS = {
  user683_dash_ym: {
    type: 'SINGLE_LINE_TEXT',
    code: 'user683_dash_ym',
    label: 'ダッシュ対象暦月（YYYY-MM・ジョブがキーに使用）',
    defaultValue: '',
    required: false,
  },
  user683_week_1: {
    type: 'MULTI_LINE_TEXT',
    code: 'user683_week_1',
    label: '週次要約（第1ブロック）',
    defaultValue: '',
    required: false,
  },
  user683_week_2: {
    type: 'MULTI_LINE_TEXT',
    code: 'user683_week_2',
    label: '週次要約（第2ブロック）',
    defaultValue: '',
    required: false,
  },
  user683_week_3: {
    type: 'MULTI_LINE_TEXT',
    code: 'user683_week_3',
    label: '週次要約（第3ブロック）',
    defaultValue: '',
    required: false,
  },
  user683_week_4: {
    type: 'MULTI_LINE_TEXT',
    code: 'user683_week_4',
    label: '週次要約（第4ブロック）',
    defaultValue: '',
    required: false,
  },
  user683_month: {
    type: 'MULTI_LINE_TEXT',
    code: 'user683_month',
    label: '月次要約',
    defaultValue: '',
    required: false,
  },
};

for (let d = 1; d <= 31; d += 1) {
  const code = `user683_day_${pad2(d)}`;
  NEW_FIELDS[code] = {
    type: 'MULTI_LINE_TEXT',
    code,
    label: `日次要約（${d}日）`,
    defaultValue: '',
    required: false,
  };
  const lockCode = `user683_lock_day_${pad2(d)}`;
  NEW_FIELDS[lockCode] = {
    type: 'CHECK_BOX',
    code: lockCode,
    label: `日次手修正保護（${d}日）`,
    defaultValue: [],
    required: false,
    options: { 手修正済み: { label: '手修正済み', index: '0' } },
  };
}

NEW_FIELDS.user683_week_5 = {
  type: 'MULTI_LINE_TEXT',
  code: 'user683_week_5',
  label: '週次要約（第5ブロック）',
  defaultValue: '',
  required: false,
};

NEW_FIELDS.user683_week_6 = {
  type: 'MULTI_LINE_TEXT',
  code: 'user683_week_6',
  label: '週次要約（第6ブロック）',
  defaultValue: '',
  required: false,
};

for (let w = 1; w <= 6; w += 1) {
  const lockCode = `user683_lock_week_${w}`;
  NEW_FIELDS[lockCode] = {
    type: 'CHECK_BOX',
    code: lockCode,
    label: `週次手修正保護（第${w}週）`,
    defaultValue: [],
    required: false,
    options: { 手修正済み: { label: '手修正済み', index: '0' } },
  };
}

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
      console.log(`[683-cache-fields] フィールド ${code} は既に存在します。スキップ。`);
    } else {
      missing[code] = def;
    }
  }
  if (Object.keys(missing).length === 0) {
    console.log('[683-cache-fields] 追加対象のフィールドはありません。');
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ app: APP, addCodes: Object.keys(missing) }, null, 2));
    console.error('[683-cache-fields] dry-run: POST していません');
    return;
  }

  console.log(`[683-cache-fields] POST preview fields app=${APP} add=${Object.keys(missing).join(',')}`);

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
  console.log(`[683-cache-fields] POST OK new revision=${newRev}`);

  const depRes = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ apps: [{ app: APP, revision: newRev }] }),
  });
  const depJson = await depRes.json();
  if (!depRes.ok) throw new Error(`deploy: ${depJson.code} ${depJson.message}`);

  for (let i = 0; i < 90; i += 1) {
    const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    stUrl.searchParams.set('apps[0]', String(APP));
    const stRes = await fetch(stUrl, { headers: getHeaders });
    const stJson = await stRes.json();
    const st = stRes.ok && stJson.apps && stJson.apps[0] ? stJson.apps[0].status : null;
    if (st === 'SUCCESS') {
      console.log('[683-cache-fields] deploy SUCCESS（要約キャッシュ用フィールド）');
      console.log('次: npm run user683:sync-summaries:dry-run → npm run user683:sync-summaries:apply');
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
