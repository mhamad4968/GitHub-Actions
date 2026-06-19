/**
 * 所属候補マスタ（既定アプリ 680）にレコードを一括投入する（674 モーダル用）。
 *
 * 前提: `create-pc-ledger-dept-master-app.mjs` 済み、フィールド `dept_name`・`group_name`・任意 `sort_no` が存在すること。
 *
 *   PC_LEDGER_DEPT_MASTER_APP=680 npm run pc-ledger:dept-master:seed-records
 *   npm run pc-ledger:675:seed-records
 *   npm run pc-ledger:675:seed-records -- --dry-run
 *   npm run pc-ledger:dept-master:seed-records -- --merge  （680 に無い行のみ追加）
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = Number(process.env.PC_LEDGER_DEPT_MASTER_APP || 680);
const dryRun = process.argv.includes('--dry-run');
const mergeOnly = process.argv.includes('--merge');

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

function pairKey(dept, grp) {
  return String(dept || '').trim() + '\0' + String(grp || '').trim();
}

async function fetchExistingDeptMasterPairs(appId) {
  const out = new Set();
  const limit = 500;
  let offset = 0;
  while (true) {
    const q = new URL(`${baseUrl}/k/v1/records.json`);
    q.searchParams.set('app', String(appId));
    q.searchParams.set('query', `order by $id asc limit ${limit} offset ${offset}`);
    q.searchParams.set('fields[0]', 'dept_name');
    q.searchParams.set('fields[1]', 'group_name');
    const res = await fetch(q, { headers: authHeaders });
    const text = await res.text();
    if (!res.ok) {
      console.error(text);
      throw new Error(`GET records failed: ${res.status}`);
    }
    const j = JSON.parse(text);
    const batch = j.records || [];
    for (let i = 0; i < batch.length; i++) {
      const r = batch[i];
      const dept = (r.dept_name && r.dept_name.value) || '';
      const grp = (r.group_name && r.group_name.value) || '';
      out.add(pairKey(dept, grp));
    }
    if (batch.length < limit) break;
    offset += limit;
  }
  return out;
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const jsonPath = join(here, 'data', 'pc-ledger-dept-master-seed-records.json');
  const raw = await readFile(jsonPath, 'utf8');
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows) || !rows.length) throw new Error('empty seed');

  let records = rows.map(function (r) {
    return {
      dept_name: { value: String(r.dept_name || '').trim() },
      group_name: { value: String(r.group_name || '').trim() },
    };
  });

  if (mergeOnly) {
    const existing = await fetchExistingDeptMasterPairs(APP);
    records = records.filter(function (r) {
      return !existing.has(pairKey(r.dept_name.value, r.group_name.value));
    });
    if (!records.length) {
      console.log('[merge] OK: no new rows for app', APP);
      return;
    }
    console.log('[merge] will insert', records.length, 'new row(s) into app', APP);
  }

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
