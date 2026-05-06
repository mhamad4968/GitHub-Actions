#!/usr/bin/env node
/**
 * 681 等の「PC台帳かんたん案内」系アプリの表示名を **PC台帳簡単ガイドライン** に揃える（live GET → preview PUT → deploy）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-quick-guide-set-app-name.mjs
 *
 *   PC_LEDGER_QUICK_GUIDE_APP_ID=681  … 既定 681
 */
import 'dotenv/config';

const APP_ID = Number(process.env.PC_LEDGER_QUICK_GUIDE_APP_ID || 681);
const NEW_NAME = 'PC台帳簡単ガイドライン';

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

async function main() {
  if (!Number.isFinite(APP_ID) || APP_ID <= 0) throw new Error('Invalid PC_LEDGER_QUICK_GUIDE_APP_ID');

  const settingsUrl = new URL(`${baseUrl}/k/v1/app/settings.json`);
  settingsUrl.searchParams.set('app', String(APP_ID));
  const live = await fetchJson(settingsUrl.toString(), {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  if (live.name === NEW_NAME) {
    console.log(`[quick-guide-rename] app=${APP_ID} は既に「${NEW_NAME}」`);
    return;
  }

  console.log(`[quick-guide-rename] app=${APP_ID} 「${live.name}」→「${NEW_NAME}」`);

  const putBody = {
    app: String(APP_ID),
    revision: live.revision,
    name: NEW_NAME,
    description: live.description,
    icon: live.icon,
    theme: live.theme,
    titleField: live.titleField,
    enableThumbnails: live.enableThumbnails,
    enableBulkDeletion: live.enableBulkDeletion,
    enableComments: live.enableComments,
    enableDuplicateRecord: live.enableDuplicateRecord,
    enableInlineRecordEditing: live.enableInlineRecordEditing,
    numberPrecision: live.numberPrecision,
    firstMonthOfFiscalYear: live.firstMonthOfFiscalYear,
  };

  await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(putBody),
  });

  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: APP_ID }] }),
  });
  await waitDeploy(APP_ID);
  console.log(`[quick-guide-rename] deploy SUCCESS → ${baseUrl}/k/${APP_ID}/`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
