#!/usr/bin/env node
/**
 * 部門マスタ Excel → kintone 所属候補マスタ（既定 App 680）へ同期投入。
 *
 * 正本 Excel: C:\tmp\部門マスタ\部門マスタ.xlsx（浜田 GO 2026-06-23）
 * 列: 並び / 拠点エリア / 所属グループ / 部門名 / 備考
 * → 680: sort_no / group_name / dept_name（拠点・備考は 680 未収録）
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/import-dept-master-from-xlsx.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/import-dept-master-from-xlsx.mjs
 *   npm run pc-ledger:dept-master:import-xlsx
 *   npm run pc-ledger:dept-master:import-xlsx -- --dry-run
 */
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = Number(process.env.PC_LEDGER_DEPT_MASTER_APP || 680);
const XLSX_PATH =
  process.env.DEPT_MASTER_XLSX || 'C:\\tmp\\部門マスタ\\部門マスタ.xlsx';
const SEED_JSON = join(__dirname, 'data', 'pc-ledger-dept-master-seed-records.json');
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
  const ba = `Basic ${Buffer.from(
    `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
    'utf8',
  ).toString('base64')}`;
  authHeaders.Authorization = ba;
  jsonHeaders.Authorization = ba;
}

function pairKey(dept, grp) {
  return `${String(dept || '').trim()}\0${String(grp || '').trim()}`;
}

function readExcelRows(path) {
  const wb = XLSX.readFile(path);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!raw.length) throw new Error('Excel empty');

  const first = raw[0];
  const keys = Object.keys(first);
  const isHeaderRow =
    String(first[keys[0]] || '').includes('並び') ||
    String(first[keys[3]] || '').includes('部門');

  const body = isHeaderRow ? raw.slice(1) : raw;
  const rows = body
    .map((r) => {
      const vals = keys.map((k) => r[k]);
      const sortRaw = vals[0];
      const sort_no = Number(sortRaw);
      if (!Number.isFinite(sort_no) || sort_no <= 0) return null;
      return {
        sort_no,
        area: String(vals[1] || '').trim(),
        group_name: String(vals[2] || '').trim(),
        dept_name: String(vals[3] || '').trim(),
        note: String(vals[4] || '').trim(),
      };
    })
    .filter(Boolean);

  if (!rows.length) throw new Error('no data rows in Excel');
  return rows;
}

async function fetchExistingRecords(appId) {
  const map = new Map();
  const limit = 500;
  let offset = 0;
  while (true) {
    const q = new URL(`${baseUrl}/k/v1/records.json`);
    q.searchParams.set('app', String(appId));
    q.searchParams.set('query', `order by sort_no asc limit ${limit} offset ${offset}`);
    q.searchParams.set('fields[0]', '$id');
    q.searchParams.set('fields[1]', 'dept_name');
    q.searchParams.set('fields[2]', 'group_name');
    q.searchParams.set('fields[3]', 'sort_no');
    const res = await fetch(q, { headers: authHeaders });
    const text = await res.text();
    if (!res.ok) {
      console.error(text);
      throw new Error(`GET records failed: ${res.status}`);
    }
    const j = JSON.parse(text);
    const batch = j.records || [];
    for (const r of batch) {
      const dept = (r.dept_name && r.dept_name.value) || '';
      const grp = (r.group_name && r.group_name.value) || '';
      map.set(pairKey(dept, grp), {
        id: r.$id.value,
        dept_name: dept,
        group_name: grp,
        sort_no: r.sort_no && r.sort_no.value != null ? String(r.sort_no.value) : '',
      });
    }
    if (batch.length < limit) break;
    offset += limit;
  }
  return map;
}

async function postRecords(appId, records) {
  if (!records.length) return [];
  const url = new URL(`${baseUrl}/k/v1/records.json`);
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ app: String(appId), records }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(text);
    throw new Error(`POST records failed: ${res.status}`);
  }
  const j = JSON.parse(text);
  return j.ids || [];
}

async function putRecords(appId, records) {
  if (!records.length) return;
  const url = new URL(`${baseUrl}/k/v1/records.json`);
  const res = await fetch(url, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ app: String(appId), records }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(text);
    throw new Error(`PUT records failed: ${res.status}`);
  }
}

function toKintoneRecord(row) {
  return {
    dept_name: { value: row.dept_name },
    group_name: { value: row.group_name },
    sort_no: { value: String(row.sort_no) },
  };
}

async function main() {
  const excelRows = readExcelRows(XLSX_PATH);
  console.log(`[import-dept-master] Excel rows=${excelRows.length} path=${XLSX_PATH}`);

  const existing = await fetchExistingRecords(APP);
  console.log(`[import-dept-master] app ${APP} existing=${existing.size}`);

  const toInsert = [];
  const toUpdate = [];
  const excelKeys = new Set();

  for (const row of excelRows) {
    const key = pairKey(row.dept_name, row.group_name);
    excelKeys.add(key);
    const hit = existing.get(key);
    if (!hit) {
      toInsert.push(toKintoneRecord(row));
      continue;
    }
    if (hit.sort_no !== String(row.sort_no)) {
      toUpdate.push({
        id: hit.id,
        record: toKintoneRecord(row),
      });
    }
  }

  const orphan = [];
  for (const [key, rec] of existing) {
    if (!excelKeys.has(key)) orphan.push(rec);
  }

  console.log(`[import-dept-master] insert=${toInsert.length} update=${toUpdate.length} orphan=${orphan.length}`);
  if (orphan.length) {
    console.log('[import-dept-master] orphan (680 only, not deleted):');
    for (const o of orphan) {
      console.log(`  - id=${o.id} ${o.group_name}/${o.dept_name}`);
    }
  }

  if (dryRun) {
    console.log('[import-dept-master] dry-run OK — no kintone write');
    return;
  }

  if (toInsert.length) {
    const ids = await postRecords(APP, toInsert);
    console.log(`[import-dept-master] inserted ${ids.length}`);
  }
  if (toUpdate.length) {
    await putRecords(
      APP,
      toUpdate.map((u) => ({ id: u.id, record: u.record })),
    );
    console.log(`[import-dept-master] updated ${toUpdate.length}`);
  }

  const seedJson = excelRows.map((r) => ({
    dept_name: r.dept_name,
    group_name: r.group_name,
    sort_no: r.sort_no,
  }));
  writeFileSync(SEED_JSON, `${JSON.stringify(seedJson, null, 2)}\n`, 'utf8');
  console.log(`[import-dept-master] seed JSON refreshed → ${SEED_JSON}`);
  console.log('[import-dept-master] OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
