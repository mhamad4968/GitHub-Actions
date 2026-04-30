#!/usr/bin/env node
/**
 * B-1 取込用 CSV の整形:
 * - `purchase_date` / `latest_inventory_date`: `YYYY/M/D` → `YYYY-MM-DD`
 * - `serial`: 科学的記数法 → 整数文字列（空はそのまま）
 *
 *   node scripts/normalize-b1-import-csv-dates.mjs [入力.csv] [出力.csv省略時=上書き]
 *
 * 既定入力: /mnt/c/tmp/new-pc-ledger/b1-import-674-draft-2026-04-30.csv
 * 上書きが EACCES のときは `tmp/b1-import-normalized-….csv` に退避。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT = '/mnt/c/tmp/new-pc-ledger/b1-import-674-draft-2026-04-30.csv';
const DATE_COLS = new Set(['purchase_date', 'latest_inventory_date']);
const SERIAL_COL = 'serial';

/** `2023/4/17` → `2023-04-17`。既に `YYYY-MM-DD` はそのまま。 */
function normalizeSlashDate(s) {
  const t = String(s ?? '').trim();
  if (!t) return '';
  const m = t.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return t;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/** `4.25208E+13` 等 → 整数文字列。先頭ゼロは復元しない。 */
function expandScientificToIntegerString(raw) {
  const t = String(raw ?? '').trim().replace(/\s+/g, '');
  if (t === '') return '';
  if (/^[+-]?(?:\d+\.?\d*|\d*\.\d+)[eE][+-]?\d+$/.test(t)) {
    const n = Number(t);
    if (!Number.isFinite(n)) return String(raw ?? '').trim();
    if (Math.abs(n) > Number.MAX_SAFE_INTEGER) return String(raw ?? '').trim();
    const rounded = Math.round(n);
    if (Math.abs(n - rounded) > 1e-9 * Math.max(1, Math.abs(n))) return String(raw ?? '').trim();
    return String(rounded);
  }
  if (/^\d+\.0+$/.test(t)) return t.slice(0, t.indexOf('.'));
  return String(raw ?? '').trim();
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

function csvCell(s) {
  const t = String(s ?? '');
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function main() {
  const inPath = process.argv[2] || DEFAULT;
  const outPathArg = process.argv[3];
  let raw = fs.readFileSync(inPath, 'utf8');
  const bom = raw.startsWith('\uFEFF');
  if (bom) raw = raw.slice(1);
  const lines = raw.split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) throw new Error('empty file');
  const header = parseCsvLine(lines[0]);
  const dateIdxs = [];
  let serialIdx = -1;
  for (let i = 0; i < header.length; i++) {
    const code = header[i].trim();
    if (DATE_COLS.has(code)) dateIdxs.push(i);
    if (code === SERIAL_COL) serialIdx = i;
  }
  if (!dateIdxs.length) throw new Error(`no date columns in header: ${[...DATE_COLS]}`);
  if (serialIdx < 0) throw new Error(`no column "${SERIAL_COL}" in header`);

  let changedDate = 0;
  let changedSerial = 0;
  const out = [];
  out.push(lines[0]);
  for (let li = 1; li < lines.length; li++) {
    const row = parseCsvLine(lines[li]);
    if (row.length !== header.length) {
      throw new Error(`line ${li + 1}: expected ${header.length} cols, got ${row.length}`);
    }
    for (const i of dateIdxs) {
      const before = row[i];
      const after = normalizeSlashDate(before);
      if (before !== after) {
        row[i] = after;
        changedDate++;
      }
    }
    {
      const before = row[serialIdx];
      const after = expandScientificToIntegerString(before);
      if (before !== after) {
        row[serialIdx] = after;
        changedSerial++;
      }
    }
    out.push(row.map(csvCell).join(','));
  }

  const body = (bom ? '\uFEFF' : '') + out.join('\r\n') + '\r\n';
  const tryPath = outPathArg || inPath;
  try {
    fs.mkdirSync(path.dirname(tryPath), { recursive: true });
    fs.writeFileSync(tryPath, body, 'utf8');
    console.log(`Wrote ${tryPath}`);
  } catch (e) {
    if (e?.code === 'EACCES' && !outPathArg) {
      const fallback = path.join(
        REPO_ROOT,
        'tmp',
        `b1-import-normalized-${path.basename(inPath).replace(/\.csv$/i, '')}.csv`,
      );
      fs.mkdirSync(path.dirname(fallback), { recursive: true });
      fs.writeFileSync(fallback, body, 'utf8');
      console.warn(`[warn] could not write ${tryPath} (${e.message}) → wrote ${fallback}`);
      console.log(`Wrote ${fallback}`);
    } else throw e;
  }
  console.log(
    `normalized_date_cells=${changedDate} (${[...DATE_COLS].join(', ')}) / serial_cells=${changedSerial} (${SERIAL_COL})`,
  );
}

main();
