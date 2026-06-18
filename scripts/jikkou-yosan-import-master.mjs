#!/usr/bin/env node
/**
 * リストマスタ — seed JSON → kintone レコード投入
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-import-master.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-import-master.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-import-master.mjs --app 689
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'jikkou-yosan-master-seed.json');

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

function parseAppId() {
  const i = process.argv.indexOf('--app');
  if (i >= 0 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  const env = process.env.JIKKOU_YOSAN_MASTER_APP_ID;
  if (env) return Number(env);
  throw new Error('Set JIKKOU_YOSAN_MASTER_APP_ID or pass --app <id>');
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '').replace(/\/k$/i, '');
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
    throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 1500)}`.trim());
  }
  return json;
}

const CAT = {
  code_row: 'コード表行',
  order_branch: '発注支社',
  department: '部門',
  girder_type: '桁種別',
  unit: '単位',
  tax_rate: '消費税',
};
const SRC = {
  code_xlsx: 'コード表取込',
  list_xls: 'リスト取込',
  manual: '手入力',
};

function txt(v) {
  if (v == null || v === '') return null;
  return { value: String(v) };
}

function num(v) {
  if (v == null || v === '') return null;
  return { value: String(v) };
}

function assign(f, key, part) {
  if (part) f[key] = part;
}

function recordFromSeed(row) {
  const f = {};
  const catVal = CAT[row.list_category] || row.list_category;
  if (!catVal) throw new Error(`Missing list_category mapping: ${JSON.stringify(row)}`);
  f.list_category = { value: catVal };
  assign(f, 'sort_order', num(row.sort_order));
  assign(f, 'source', { value: SRC[row.source] || row.source || '手入力' });
  f.is_active = { value: ['有効'] };
  if (row.list_category === 'code_row') {
    assign(f, 'item_group', txt(row.item_group));
    assign(f, 'expense_code', txt(row.expense_code));
    assign(f, 'expense_name', txt(row.expense_name));
    assign(f, 'work_type_code', txt(row.work_type_code));
    assign(f, 'work_type_name', txt(row.work_type_name));
    assign(f, 'sub_type_code', txt(row.sub_type_code));
    assign(f, 'sub_type_name', txt(row.sub_type_name));
    assign(f, 'definition', txt(row.definition));
  } else {
    assign(f, 'item_name', txt(row.item_name));
    assign(f, 'item_sub_name', txt(row.item_sub_name));
  }
  return f;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const appId = parseAppId();
  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
  const records = seed.records || [];
  if (!records.length) throw new Error('No records in seed file');

  if (dryRun) {
    console.log(JSON.stringify({ appId, count: records.length, sample: recordFromSeed(records[0]) }, null, 2));
    return;
  }

  const force = process.argv.includes('--force');
  const existing = await fetchJson(`${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent('limit 1')}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  if (existing.totalCount > 0 && !force) {
    console.log(`Skip import: app ${appId} already has ${existing.totalCount} records (use --force)`);
    return;
  }

  const CHUNK = 20;
  let done = 0;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK).map((row) => recordFromSeed(row));
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: appId, records: chunk }),
    });
    done += chunk.length;
    console.log(`Imported ${Math.min(done, records.length)} / ${records.length}`);
  }
  console.log(`Done: ${records.length} records → app ${appId}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
