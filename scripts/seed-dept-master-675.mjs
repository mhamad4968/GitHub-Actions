/**
 * アプリ 675 に所属候補レコードを一括投入する（674 モーダル用）。
 *
 * 前提: アプリ 675 を作成済みで、フィールド `dept_name`・`group_name`（SINGLE_LINE_TEXT）が存在すること。
 *
 *   npm run pc-ledger:675:seed-records
 *   npm run pc-ledger:675:seed-records -- --dry-run
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = 675;
const dryRun = process.argv.includes('--dry-run');

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

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const jsonPath = join(here, 'data', 'pc-ledger-dept-master-seed-records.json');
  const raw = await readFile(jsonPath, 'utf8');
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows) || !rows.length) throw new Error('empty seed');

  const records = rows.map(function (r) {
    return {
      dept_name: { value: String(r.dept_name || '').trim() },
      group_name: { value: String(r.group_name || '').trim() },
    };
  });

  const body = { app: String(APP), records: records };
  if (dryRun) {
    console.log('[dry-run] would POST', records.length, 'records to app', APP);
    return;
  }

  const url = new URL(`${baseUrl}/k/v1/records.json`);
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(text);
    throw new Error(`POST records failed: ${res.status}`);
  }
  const j = JSON.parse(text);
  console.log('OK: inserted', j.ids && j.ids.length, 'records. ids:', (j.ids || []).slice(0, 5).join(','), '...');
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
