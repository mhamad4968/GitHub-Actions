#!/usr/bin/env node
/**
 * B-1 取込用 CSV の日付列を `YYYY/MM/DD` → `YYYY-MM-DD` に正規化（ゼロ埋め）。
 *
 *   node scripts/normalize-b1-import-csv-dates.mjs [入力.csv] [出力.csv省略時=上書き]
 *
 * 既定入力: /mnt/c/tmp/new-pc-ledger/b1-import-674-draft-2026-04-30.csv
 * 上書きが EACCES のときは `tmp/b1-import-674-draft-…-dates-fixed.csv` に退避。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT = '/mnt/c/tmp/new-pc-ledger/b1-import-674-draft-2026-04-30.csv';
const TARGET_COLS = new Set(['purchase_date', 'latest_inventory_date']);

/** `2023/4/17` or `2023/04/17` → `2023-04-17`。既に `YYYY-MM-DD` はそのまま。 */
function normalizeSlashDate(s) {
  const t = String(s ?? '').trim();
  if (!t) return '';
  const m = t.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return t;
  const y = m[1];
  const mo = m[2].padStart(2, '0');
  const d = m[3].padStart(2, '0');
  return `${y}-${mo}-${d}`;
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
  const idxs = [];
  for (let i = 0; i < header.length; i++) {
    if (TARGET_COLS.has(header[i].trim())) idxs.push(i);
  }
  if (!idxs.length) throw new Error(`no target columns in header: ${TARGET_COLS}`);

  let changed = 0;
  const out = [];
  out.push(lines[0]);
  for (let li = 1; li < lines.length; li++) {
    const row = parseCsvLine(lines[li]);
    if (row.length !== header.length) {
      throw new Error(`line ${li + 1}: expected ${header.length} cols, got ${row.length}`);
    }
    for (const i of idxs) {
      const before = row[i];
      const after = normalizeSlashDate(before);
      if (before !== after) {
        row[i] = after;
        changed++;
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
        `b1-import-dates-fixed-${path.basename(inPath).replace(/\.csv$/i, '')}.csv`,
      );
      fs.mkdirSync(path.dirname(fallback), { recursive: true });
      fs.writeFileSync(fallback, body, 'utf8');
      console.warn(`[warn] could not write ${tryPath} (${e.message}) → wrote ${fallback}`);
      console.log(`Wrote ${fallback}`);
    } else throw e;
  }
  console.log(`normalized_cells=${changed} (columns: ${[...TARGET_COLS].join(', ')})`);
}

main();
