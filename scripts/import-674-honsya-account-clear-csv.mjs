#!/usr/bin/env node
/**
 * export-674-honsya-account-clear-csv.mjs で出したテンプレ（1 行目＝フィールド label）を
 * 手入力した CSV から、674 既存レコードへ PUT 一括反映する。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/import-674-honsya-account-clear-csv.mjs --dry-run /path/to.csv
 *   npx dotenv -e .env -e .env.proxy -- node scripts/import-674-honsya-account-clear-csv.mjs --apply /path/to.csv
 *
 * 先頭列は「レコード番号」または「$id」のラベル（export と同じ）。値は レコード番号 または $id で突合。
 * 対象は group_name = "honsya" の取得行のみ（CSV と突合した行が honsya でない場合はスキップして警告）。
 *
 * 注意: `import 'dotenv/config'` は使わない（他 674 スクリプトと同様）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const APP_674 = 674;
const CHUNK = 100;
const HONSYA_QUERY = 'group_name = "honsya" order by レコード番号 asc';

const SKIP_TYPES = new Set([
  'CALC',
  'CATEGORY',
  'STATUS',
  'FILE',
  'GROUP',
  'SUBTABLE',
  'REFERENCE_TABLE',
  'RECORD_NUMBER',
  'CREATOR',
  'MODIFIER',
  'CREATED_TIME',
  'UPDATED_TIME',
]);

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

function valCell(r, code) {
  const field = r[code];
  if (!field || field.value == null) return '';
  const v = field.value;
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' && x?.code ? x.code : x)).join(',');
  return String(v);
}

function cellToApiValue(type, raw) {
  const s = String(raw ?? '');
  const t = s.trim();
  if (type === 'CHECK_BOX') {
    if (!t) return { value: [] };
    return { value: t.split(',').map((x) => x.trim()).filter(Boolean) };
  }
  if (type === 'NUMBER') {
    if (t === '') return { value: '' };
    return { value: String(t) };
  }
  if (type === 'DATE') {
    if (!t) return { value: null };
    return { value: t };
  }
  if (type === 'DATETIME') {
    if (!t) return { value: null };
    return { value: t };
  }
  if (type === 'MULTI_LINE_TEXT') {
    return { value: s };
  }
  if (type === 'DROP_DOWN' || type === 'RADIO_BUTTON' || type === 'SINGLE_LINE_TEXT' || type === 'LINK') {
    return { value: t };
  }
  if (type === 'LOOKUP') {
    return { value: t };
  }
  if (type === 'GROUP_SELECT') {
    if (!t) return { value: [] };
    return { value: t.split(',').map((x) => x.trim()).filter(Boolean).map((code) => ({ code })) };
  }
  if (type === 'ORGANIZATION_SELECT') {
    if (!t) return { value: [] };
    return { value: t.split(',').map((x) => x.trim()).filter(Boolean).map((code) => ({ code })) };
  }
  if (type === 'USER_SELECT') {
    if (!t) return { value: [] };
    return { value: t.split(',').map((x) => x.trim()).filter(Boolean).map((code) => ({ code })) };
  }
  if (type === 'FILE') return null;
  return { value: t };
}

function labelToCodeMap(properties) {
  const m = new Map();
  for (const [code, def] of Object.entries(properties || {})) {
    if (def.type === 'GROUP') continue;
    const lb = typeof def.label === 'string' ? def.label.trim() : '';
    if (!lb) continue;
    if (m.has(lb) && m.get(lb) !== code) {
      console.warn(`WARN: duplicate label "${lb}" → codes ${m.get(lb)} vs ${code} (using ${code})`);
    }
    m.set(lb, code);
  }
  return m;
}

async function fetchHonsyaRows(fields) {
  const records = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const params = new URLSearchParams();
    params.set('app', String(APP_674));
    params.set('query', `${HONSYA_QUERY} limit ${limit} offset ${offset}`);
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const data = await fetchJson(`${baseUrl}/k/v1/records.json?${params.toString()}`);
    const batch = data.records || [];
    records.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return records;
}

function parseArgs(argv) {
  let dry = false;
  let apply = false;
  let csvPath = '';
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dry-run') {
      dry = true;
      continue;
    }
    if (argv[i] === '--apply') {
      apply = true;
      continue;
    }
    if (!argv[i].startsWith('--') && !csvPath) {
      csvPath = argv[i];
      continue;
    }
  }
  return { dry, apply, csvPath };
}

async function main() {
  const { dry, apply, csvPath: pathArg } = parseArgs(process.argv);
  if ((!dry && !apply) || (dry && apply)) {
    console.error(
      'Usage: npx dotenv -e .env -e .env.proxy -- node scripts/import-674-honsya-account-clear-csv.mjs (--dry-run|--apply) <path/to.csv>',
    );
    process.exit(1);
  }
  const csvPath = path.resolve(pathArg || '');
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath || '(missing path)'}`);
    process.exit(1);
  }

  const logPath = path.join(REPO_ROOT, 'tmp', 'import-674-honsya-account-clear-csv.log.txt');
  const log = (line) => {
    console.log(line);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, line + '\n', 'utf8');
  };
  if (apply) fs.writeFileSync(logPath, `started ${new Date().toISOString()}\n`, 'utf8');

  const form = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json?app=${APP_674}`);
  const properties = form.properties || {};
  const labelMap = labelToCodeMap(properties);

  let raw = fs.readFileSync(csvPath, 'utf8');
  if (raw.startsWith('\uFEFF')) raw = raw.slice(1);
  const lines = raw.split(/\r?\n/).filter((l) => l.length);
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = parseCsvLine(lines[li]);
    if (cells.length !== header.length) {
      throw new Error(`Line ${li + 1}: expected ${header.length} columns, got ${cells.length}`);
    }
    rows.push(cells);
  }

  const codesFromHeader = [];
  for (const h of header) {
    const code = labelMap.get(h);
    codesFromHeader.push(code || null);
  }
  if (!codesFromHeader[0]) {
    throw new Error(`First column header "${header[0]}" did not map to a field code (need レコード番号 or $id label)`);
  }
  const keyCode = codesFromHeader[0];
  if (keyCode !== '$id' && keyCode !== 'レコード番号') {
    throw new Error(`First column must map to $id or レコード番号, got field code: ${keyCode}`);
  }

  const fieldCodesNeeded = new Set(['$id', 'group_name', 'レコード番号']);
  for (let i = 1; i < codesFromHeader.length; i++) {
    const c = codesFromHeader[i];
    if (!c) continue;
    const def = properties[c];
    if (!def || SKIP_TYPES.has(def.type)) continue;
    fieldCodesNeeded.add(c);
  }

  const honsyaRows = await fetchHonsyaRows([...fieldCodesNeeded]);
  const byRn = new Map();
  const byId = new Map();
  for (const r of honsyaRows) {
    const id = valCell(r, '$id').trim();
    const rn = valCell(r, 'レコード番号').trim();
    if (rn) byRn.set(rn, r);
    if (id) byId.set(id, r);
  }

  const updates = [];
  const warnings = [];
  const seenKeys = new Set();

  for (let ri = 0; ri < rows.length; ri++) {
    const cells = rows[ri];
    const lineNo = ri + 2;
    const keyVal = String(cells[0] ?? '').trim();
    if (!keyVal) {
      warnings.push(`line ${lineNo}: empty key, skip`);
      continue;
    }
    if (seenKeys.has(keyVal)) warnings.push(`line ${lineNo}: duplicate key "${keyVal}" in CSV`);
    seenKeys.add(keyVal);

    const rec =
      keyCode === 'レコード番号' ? byRn.get(keyVal) || byId.get(keyVal) : byId.get(keyVal) || byRn.get(keyVal);
    if (!rec) {
      warnings.push(`line ${lineNo}: no honsya row for key="${keyVal}"`);
      continue;
    }
    const g = valCell(rec, 'group_name').trim();
    if (g !== 'honsya') {
      warnings.push(`line ${lineNo}: kintone group_name="${g}" not honsya, skip`);
      continue;
    }
    const csvGroup = (() => {
      const idx = header.findIndex((h) => labelMap.get(h) === 'group_name');
      if (idx < 0) return '';
      return String(cells[idx] ?? '').trim();
    })();
    if (csvGroup && csvGroup !== 'honsya') {
      warnings.push(`line ${lineNo}: CSV group_name="${csvGroup}" not honsya, skip`);
      continue;
    }

    const record = {};
    for (let i = 1; i < header.length; i++) {
      const code = codesFromHeader[i];
      if (!code || code === '$id' || code === 'レコード番号') continue;
      const def = properties[code];
      if (!def || SKIP_TYPES.has(def.type)) continue;
      const v = cellToApiValue(def.type, cells[i]);
      if (v === null) continue;
      record[code] = v;
    }

    if (Object.keys(record).length === 0) {
      warnings.push(`line ${lineNo}: key=${keyVal} no updatable fields from CSV, skip`);
      continue;
    }

    updates.push({ id: valCell(rec, '$id').trim(), record });
  }

  log(`csv=${csvPath} data_rows=${rows.length} matched_updates=${updates.length}`);
  for (const w of warnings) log(`WARN: ${w}`);
  if (warnings.length) log(`warnings_total=${warnings.length}`);

  if (!updates.length) {
    log('Nothing to PUT. Exiting.');
    return;
  }

  if (dry) {
    log('dry-run: no PUT');
    return;
  }

  let done = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const slice = updates.slice(i, i + CHUNK);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      body: JSON.stringify({ app: APP_674, records: slice }),
    });
    done += slice.length;
    log(`PUT ${done}/${updates.length}`);
  }
  log(`done ${new Date().toISOString()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
