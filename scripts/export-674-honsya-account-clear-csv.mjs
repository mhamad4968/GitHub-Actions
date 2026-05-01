#!/usr/bin/env node
/**
 * 新・PC台帳（674）の **所属グループが honsya** のレコードのみ取得し、
 * レコード番号＋アカウント系フィールドの CSV を出力する（アカウント列はすべて空＝クリア用テンプレート）。
 * 1 行目の列見出しは **kintone フォームのフィールド名（表示ラベル）**（`GET /k/v1/app/form/fields.json` の `label`）。
 * 手直し後に kintone「ファイルによるレコードの一括更新」へ流す想定。
 *
 * 既定の対象クエリ（--query で上書き可）:
 *   group_name = "honsya" のみ
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/export-674-honsya-account-clear-csv.mjs
 * 既定の出力先: C:\\tmp\\new-pc-ledger\\（WSL: /mnt/c/tmp/new-pc-ledger/）。--out で変更可。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/export-674-honsya-account-clear-csv.mjs --out /path/to/out.csv
 *   npx dotenv -e .env -e .env.proxy -- node scripts/export-674-honsya-account-clear-csv.mjs --query '(dept_name like "本社%") order by レコード番号 asc'
 *
 * 注意: `import 'dotenv/config'` は使わない（他 674 スクリプトと同様）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const APP_674 = 674;
/** Windows `C:\\tmp\\new-pc-ledger`（build-b1-import-csv.mjs と同じ） */
const DEFAULT_OUT_DIR = '/mnt/c/tmp/new-pc-ledger';

/** 674 のアカウント系（種別変更クリア・627 パッチと整合。空で上書き＝クリア） */
const ACCOUNT_FIELD_CODES = [
  'logon_name',
  'logon_pw',
  'windows_name',
  'mail',
  'mail_acct',
  'mail_pw',
  'm365_id',
  'm365_pw',
  'gb_id',
  'gb_pw',
  'sb_id',
  'sb_pw',
  'vpn_id',
  'vpn_pw',
  'm365_master_record_id',
];

/** 編集時の目印（現在値を入れる。一括更新で同値なら実質変更なし） */
const CONTEXT_FIELD_CODES = ['pc_name', 'account_type', 'user_name', 'dept_name', 'group_name'];

const DEFAULT_QUERY = 'group_name = "honsya" order by レコード番号 asc';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const authHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  authHeaders.Authorization =
    'Basic ' +
    Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64');
}

async function fetchJson(url, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const h = { ...authHeaders, ...init.headers };
  if (method !== 'GET' && init.body != null) {
    h['Content-Type'] = h['Content-Type'] || 'application/json';
  }
  const res = await fetch(url, { ...init, headers: h });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.message || json?.code || text.slice(0, 2000);
    throw new Error(`${res.status} ${msg}`);
  }
  return json;
}

function valCell(r, code) {
  const field = r[code];
  if (!field || field.value == null) return '';
  const v = field.value;
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' && x?.code ? x.code : x)).join(',');
  return String(v);
}

function csvEscape(s) {
  const t = String(s ?? '');
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function parseArgs(argv) {
  let outPath = '';
  let query = DEFAULT_QUERY;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--out' && argv[i + 1]) {
      outPath = argv[++i];
      continue;
    }
    if (argv[i] === '--query' && argv[i + 1]) {
      query = argv[++i];
      continue;
    }
  }
  return { outPath, query };
}

async function fetchAll674(query, fields) {
  const records = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const params = new URLSearchParams();
    params.set('app', String(APP_674));
    params.set('query', `${query} limit ${limit} offset ${offset}`);
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const data = await fetchJson(`${baseUrl}/k/v1/records.json?${params.toString()}`);
    const batch = data.records || [];
    records.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return records;
}

function recordNumberForCsv(r) {
  const rn = valCell(r, 'レコード番号').trim();
  if (rn) return rn;
  return valCell(r, '$id').trim();
}

/** form/fields.json の properties からフィールド名（label）を返す。無ければ code のまま */
function fieldLabelFromProperties(properties, code) {
  const p = properties && properties[code];
  const lb = p && typeof p.label === 'string' ? p.label.trim() : '';
  return lb || code;
}

/** レコード番号列のヘッダー（$id / レコード番号 のどちらかに定義がある想定） */
function recordNumberHeaderLabel(properties) {
  const idLb = fieldLabelFromProperties(properties, '$id');
  if (idLb !== '$id') return idLb;
  const rnLb = fieldLabelFromProperties(properties, 'レコード番号');
  if (rnLb !== 'レコード番号') return rnLb;
  return 'レコード番号';
}

async function fetch674FormProperties() {
  const data = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json?app=${APP_674}`);
  return data.properties || {};
}

function todayJstYmd() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

async function main() {
  const { outPath, query } = parseArgs(process.argv);
  const day = todayJstYmd();
  const out =
    outPath ||
    path.join(DEFAULT_OUT_DIR, `674-honsya-account-clear-template-${day}.csv`);

  const fields = [
    '$id',
    'レコード番号',
    ...CONTEXT_FIELD_CODES,
    ...ACCOUNT_FIELD_CODES,
  ];
  const uniqFields = [...new Set(fields)];

  const [rows, formProps] = await Promise.all([fetchAll674(query, uniqFields), fetch674FormProperties()]);
  const rnHeader = recordNumberHeaderLabel(formProps);
  const header = [
    rnHeader,
    ...CONTEXT_FIELD_CODES.map((c) => fieldLabelFromProperties(formProps, c)),
    ...ACCOUNT_FIELD_CODES.map((c) => fieldLabelFromProperties(formProps, c)),
  ];
  const lines = [header.map(csvEscape).join(',')];
  for (const r of rows) {
    const rid = recordNumberForCsv(r);
    const cells = [rid];
    for (const code of CONTEXT_FIELD_CODES) {
      cells.push(valCell(r, code));
    }
    for (const _ of ACCOUNT_FIELD_CODES) {
      cells.push('');
    }
    lines.push(cells.map(csvEscape).join(','));
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, '\uFEFF' + lines.join('\r\n'), 'utf8');
  console.log(`Wrote ${rows.length} rows → ${out}`);
  console.log(`Query: ${query}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
