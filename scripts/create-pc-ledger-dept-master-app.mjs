#!/usr/bin/env node
/**
 * 新・PC台帳用「所属候補マスタ」kintone アプリを Space 21 に作成し、フィールド投入 → preview deploy。
 * 任意でシードレコード投入（`--seed`）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/create-pc-ledger-dept-master-app.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/create-pc-ledger-dept-master-app.mjs --seed
 *
 * 環境変数（任意）:
 *   PC_LEDGER_DEPT_MASTER_SPACE_ID … 既定 21
 *   PC_LEDGER_SPACE_21_THREAD_ID   … 既定は space.json の defaultThread、無ければ 23
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_JSON = join(__dirname, 'data', 'pc-ledger-dept-master-seed-records.json');

const APP_NAME = '新・PC台帳 所属候補マスタ';
const SPACE_ID = Number(process.env.PC_LEDGER_DEPT_MASTER_SPACE_ID || 21);
const wantSeed = process.argv.includes('--seed');

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

const FIELD_DEFS = {
  dept_name: {
    type: 'SINGLE_LINE_TEXT',
    code: 'dept_name',
    label: '所属名',
    required: true,
    noLabel: false,
    defaultValue: '',
  },
  group_name: {
    type: 'SINGLE_LINE_TEXT',
    code: 'group_name',
    label: '所属グループ',
    required: true,
    noLabel: false,
    defaultValue: '',
  },
  sort_no: {
    type: 'NUMBER',
    code: 'sort_no',
    label: '並び順',
    required: false,
    noLabel: false,
    digit: true,
    displayScale: '0',
    unique: false,
    defaultValue: '',
    maxValue: '99999',
    minValue: '0',
  },
};

async function main() {
  const threadId = await resolveThreadId(SPACE_ID);
  console.log(`[dept-master] space=${SPACE_ID} thread=${threadId} name="${APP_NAME}"`);

  const found = await fetchJson(new URL(`${baseUrl}/k/v1/apps.json`), {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: APP_NAME }),
  });
  const apps = (found.apps || []).filter((a) => a.name === APP_NAME);
  if (apps.length) {
    const id = apps[0].appId;
    console.log(`[dept-master] 既存アプリあり appId=${id} — 674 の APP_DEPT_MASTER_674 をこの値に合わせてください。`);
    if (wantSeed) await seedRecords(id);
    return;
  }

  const add = await fetchJson(new URL(`${baseUrl}/k/v1/preview/app.json`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: APP_NAME, space: SPACE_ID, thread: threadId }),
  });
  const appId = Number(add.app);
  if (!Number.isFinite(appId) || appId <= 0) throw new Error(JSON.stringify(add));
  console.log(`[dept-master] 作成 app=${appId} revision=${add.revision}`);

  await fetchJson(new URL(`${baseUrl}/k/v1/preview/app/deploy.json`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId }] }),
  });
  await waitDeploy(appId);
  console.log('[dept-master] 空アプリ deploy SUCCESS');

  const fieldsRes = await fetchJson(new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties: FIELD_DEFS }),
  });
  const rev = fieldsRes.revision;
  console.log(`[dept-master] フィールド追加 revision=${rev}`);

  await fetchJson(new URL(`${baseUrl}/k/v1/preview/app/deploy.json`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision: rev }] }),
  });
  await waitDeploy(appId);
  console.log('[dept-master] フォーム deploy SUCCESS');

  console.log('');
  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
  console.log('');
  console.log('次: customize/new-pc-ledger-v1/desktop.js の APP_DEPT_MASTER_674 を上記 APP_ID に変更し npm run deploy:674（既定は 680 に合わせ済み）');
  if (wantSeed) await seedRecords(appId);
}

async function seedRecords(appId) {
  const raw = await readFile(SEED_JSON, 'utf8');
  const rows = JSON.parse(raw);
  const records = rows.map(function (r, idx) {
    return {
      dept_name: { value: String(r.dept_name || '').trim() },
      group_name: { value: String(r.group_name || '').trim() },
      sort_no: { value: String(idx + 1) },
    };
  });
  const body = { app: String(appId), records: records };
  const url = new URL(`${baseUrl}/k/v1/records.json`);
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  const j = JSON.parse(text);
  if (!res.ok) throw new Error(`seed POST ${res.status} ${JSON.stringify(j)}`);
  console.log(`[dept-master] シード投入 ${j.ids && j.ids.length} 件`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
