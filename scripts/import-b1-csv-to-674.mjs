#!/usr/bin/env node
/**
 * B-1: 正規化済み取込 CSV → 新・PC台帳（674）へ REST API で一括登録（100 件/リクエスト）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/import-b1-csv-to-674.mjs [path/to.csv]
 *
 * 既定: tmp/b1-import-674-draft-2026-04-30-normalized.csv（リポルート相対）
 *
 * 注意: `import 'dotenv/config'` は入れない。dotenv-cli で .env.proxy を後勝ちにした値が
 * 本番 import で上書きされ 400 になるため。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const APP = 674;
const CHUNK = 100;
const DEFAULT_CSV = path.join(REPO_ROOT, 'tmp', 'b1-import-674-draft-2026-04-30-normalized.csv');

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

function parseCsvLine(line) {
  const cols = [];
  let cur = '';
  let q = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '"') {
      q = !q;
      continue;
    }
    if (!q && c === ',') {
      cols.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  cols.push(cur);
  return cols;
}

/** layout 由来の CSV 列名 → form のプロパティ code */
function headerToFieldCode(h) {
  const t = String(h).trim();
  if (t.startsWith('internal_system_meta.')) return t.slice('internal_system_meta.'.length);
  if (t.startsWith('skysea_system_meta.')) return t.slice('skysea_system_meta.'.length);
  return t;
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
    const err = new Error(`${res.status} ${msg}`);
    err.details = json || text;
    throw err;
  }
  return json;
}

function cellToApiValue(type, raw) {
  const s = String(raw ?? '');
  const t = s.trim();
  if (type === 'CHECK_BOX') {
    if (!t) return { value: [] };
    return { value: t.split(',').map((x) => x.trim()).filter(Boolean) };
  }
  if (type === 'NUMBER') {
    if (t === '') return null;
    return { value: String(t) };
  }
  if (type === 'DATE') {
    if (!t) return null;
    return { value: t };
  }
  if (type === 'DATETIME') {
    if (!t) return null;
    return { value: t };
  }
  if (type === 'MULTI_LINE_TEXT') {
    return { value: s };
  }
  if (type === 'DROP_DOWN' || type === 'RADIO_BUTTON' || type === 'SINGLE_LINE_TEXT' || type === 'LINK') {
    return { value: t };
  }
  if (type === 'FILE') return null;
  return { value: t };
}

function rowToRecord(header, rowCells, typeByCode) {
  const rec = {};
  for (let i = 0; i < header.length; i++) {
    const code = headerToFieldCode(header[i]);
    const typ = typeByCode[code];
    if (!typ) continue;
    const v = cellToApiValue(typ, rowCells[i]);
    if (v === null) continue;
    rec[code] = v;
  }
  return rec;
}

async function main() {
  const csvPath = path.resolve(process.argv[2] || DEFAULT_CSV);
  if (!fs.existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`);

  const form = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json?app=${APP}`);
  const typeByCode = {};
  for (const [code, def] of Object.entries(form.properties || {})) {
    if (def.type === 'GROUP') continue;
    typeByCode[code] = def.type;
  }

  let raw = fs.readFileSync(csvPath, 'utf8');
  if (raw.startsWith('\uFEFF')) raw = raw.slice(1);
  const lines = raw.split(/\r?\n/).filter((l) => l.length);
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const records = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = parseCsvLine(lines[li]);
    if (cells.length !== header.length) {
      throw new Error(`Line ${li + 1}: expected ${header.length} columns, got ${cells.length}`);
    }
    records.push(rowToRecord(header, cells, typeByCode));
  }

  const pre = await fetchJson(
    `${baseUrl}/k/v1/records.json?app=${APP}&query=${encodeURIComponent('limit 1 offset 0')}&totalCount=true`,
  );
  const existing = Number(pre.totalCount);
  if (!Number.isFinite(existing)) throw new Error('could not read totalCount');
  if (existing > 0) {
    throw new Error(
      `app ${APP} already has ${existing} record(s). Refusing bulk import (duplicate risk). Clear app or use another target.`,
    );
  }

  let offset = 0;
  let batch = 0;
  while (offset < records.length) {
    const slice = records.slice(offset, offset + CHUNK);
    const res = await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'POST',
      body: JSON.stringify({ app: APP, records: slice }),
    });
    batch++;
    console.log(
      `POST batch ${batch}: rows ${offset + 1}-${offset + slice.length} → ids ${(res.ids || []).slice(0, 3).join(',')}… (${(res.ids || []).length} ids)`,
    );
    offset += slice.length;
  }

  const post = await fetchJson(
    `${baseUrl}/k/v1/records.json?app=${APP}&query=${encodeURIComponent('limit 1 offset 0')}&totalCount=true`,
  );
  console.log(`Done. app=${APP} totalCount=${post.totalCount} (imported ${records.length} from ${csvPath})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
