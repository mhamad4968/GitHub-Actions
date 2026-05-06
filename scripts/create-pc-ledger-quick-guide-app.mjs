#!/usr/bin/env node
/**
 * 「PC台帳簡単ガイドライン」用 kintone アプリ（Space 21 / 一般向け短文＋図複数）
 * — MCP 不通時の REST 手順に準拠。preview 作成 → フィールド → deploy。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/create-pc-ledger-quick-guide-app.mjs
 *
 * 環境変数（任意）:
 *   PC_LEDGER_QUICK_GUIDE_SPACE_ID … 既定 21
 *   PC_LEDGER_SPACE_21_THREAD_ID   … 既定は space defaultThread、無ければ 23
 */
import 'dotenv/config';

const APP_NAME = 'PC台帳簡単ガイドライン';
/** 旧表示名で作られたアプリを「既存」とみなす（改名後の二重作成防止） */
const LEGACY_APP_NAME = '新しいPC台帳 かんたん案内';
const SPACE_ID = Number(process.env.PC_LEDGER_QUICK_GUIDE_SPACE_ID || 21);

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  'Content-Type': 'application/json',
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 1200);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitDeploy(appNum) {
  const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  stUrl.searchParams.set('apps[0]', String(appNum));
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === 'SUCCESS') return;
    if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
    await sleep(1000);
  }
  throw new Error('Deploy timed out.');
}

async function resolveThreadId(spaceId) {
  const override = process.env.PC_LEDGER_SPACE_21_THREAD_ID || process.env.KINTONE_SPACE_DEFAULT_THREAD;
  if (override && /^\d+$/.test(String(override).trim())) return Number(String(override).trim());
  const u = new URL(`${baseUrl}/k/v1/space.json`);
  u.searchParams.set('id', String(spaceId));
  const sp = await fetchJson(u, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const dt = sp?.defaultThread;
  if (dt != null && String(dt).trim() !== '') return Number(dt);
  return 23;
}

/** 画面上は日本語ラベルのみ。フィールドコードは帳票・API 用（利用者画面では非表示が基本） */
const FIELD_DEFS = {
  sort_no: {
    type: 'NUMBER',
    code: 'sort_no',
    label: '表示順（小さいほど上）',
    required: false,
    noLabel: false,
    digit: true,
    displayScale: '0',
    unique: false,
    defaultValue: '',
    maxValue: '999',
    minValue: '0',
  },
  midashi: {
    type: 'SINGLE_LINE_TEXT',
    code: 'midashi',
    label: '見出し（短く）',
    required: true,
    noLabel: false,
    defaultValue: '',
  },
  honbun: {
    type: 'MULTI_LINE_TEXT',
    code: 'honbun',
    label: '本文（短め）',
    required: false,
    noLabel: false,
    defaultValue: '',
  },
  gazou_1: {
    type: 'FILE',
    code: 'gazou_1',
    label: 'イラスト・図（1）',
    required: false,
    noLabel: false,
    thumbnailSize: '250',
  },
  gazou_2: {
    type: 'FILE',
    code: 'gazou_2',
    label: 'イラスト・図（2）',
    required: false,
    noLabel: false,
    thumbnailSize: '250',
  },
  gazou_3: {
    type: 'FILE',
    code: 'gazou_3',
    label: 'イラスト・図（3）',
    required: false,
    noLabel: false,
    thumbnailSize: '250',
  },
};

async function findExistingByName(name) {
  const found = await fetchJson(new URL(`${baseUrl}/k/v1/apps.json`), {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return (found.apps || []).filter((a) => a.name === name);
}

async function main() {
  const threadId = await resolveThreadId(SPACE_ID);
  console.log(`[quick-guide] space=${SPACE_ID} thread=${threadId} name="${APP_NAME}"`);

  let apps = await findExistingByName(APP_NAME);
  if (!apps.length) apps = await findExistingByName(LEGACY_APP_NAME);
  if (apps.length) {
    const id = apps[0].appId;
    console.log(`[quick-guide] 既存アプリあり appId=${id} — 追加作業は手動で。URL ${baseUrl}/k/${id}/`);
    return;
  }

  const add = await fetchJson(new URL(`${baseUrl}/k/v1/preview/app.json`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: APP_NAME, space: SPACE_ID, thread: threadId }),
  });
  const appId = Number(add.app);
  if (!Number.isFinite(appId) || appId <= 0) throw new Error(JSON.stringify(add));
  console.log(`[quick-guide] 作成 app=${appId} revision=${add.revision}`);

  await fetchJson(new URL(`${baseUrl}/k/v1/preview/app/deploy.json`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId }] }),
  });
  await waitDeploy(appId);
  console.log('[quick-guide] 空アプリ deploy SUCCESS');

  const fieldsRes = await fetchJson(new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties: FIELD_DEFS }),
  });
  const rev = fieldsRes.revision;
  console.log(`[quick-guide] フィールド追加 revision=${rev}`);

  await fetchJson(new URL(`${baseUrl}/k/v1/preview/app/deploy.json`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision: rev }] }),
  });
  await waitDeploy(appId);
  console.log('[quick-guide] フォーム deploy SUCCESS');

  console.log('');
  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
  console.log('');
  console.log('次: kintone-apps.md に行追加・一覧は「表示順」昇順で並べ替え推奨。本文・図はレコード単位で投入。');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
