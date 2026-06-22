#!/usr/bin/env node
/**
 * 680 所属候補マスタに「子会社（株）ブリッジニアプラス」を merge 追加
 * 正本: docs/plans/2026-06-22-mfp-ledger-kintone-spec.md §6.1
 */
import 'dotenv/config';

const APP = Number(process.env.PC_LEDGER_DEPT_MASTER_APP || 680);
const dryRun = process.argv.includes('--dry-run');
const DEPT = '子会社（株）ブリッジニアプラス';
const GROUP = 'subsidiary';
const SORT_NO = 999;

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');
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
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 500)}`);
  return json;
}

async function existsDept(appId) {
  const q = `dept_name = "${DEPT}" limit 1`;
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}&fields[0]=dept_name`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return (j.records || []).length > 0;
}

async function main() {
  if (dryRun) {
    console.log(JSON.stringify({ app: APP, dept_name: DEPT, group_name: GROUP }, null, 2));
    return;
  }
  if (await existsDept(APP)) {
    console.log(`[mfp-ledger:add-master] OK: already exists in app ${APP}`);
    return;
  }
  await fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      app: APP,
      records: [
        {
          dept_name: { value: DEPT },
          group_name: { value: GROUP },
          sort_no: { value: String(SORT_NO) },
        },
      ],
    }),
  });
  console.log(`[mfp-ledger:add-master] inserted dept="${DEPT}" app=${APP}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
