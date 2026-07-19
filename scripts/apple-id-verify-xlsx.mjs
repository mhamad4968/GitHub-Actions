#!/usr/bin/env node
/**
 * Apple ID — Excel 移行元検証
 *   npm run apple-id:verify-xlsx
 */
import { existsSync } from 'node:fs';
import XLSX from './lib/xlsx-node.mjs';
import { DEFAULT_XLSX } from './lib/apple-id-kintone.mjs';

const SHEET = 'icloud';
const MAX_HEADER_SCAN = 8;

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, MAX_HEADER_SCAN); i++) {
    const headers = (rows[i] || []).map((h) => (h != null ? String(h).trim() : ''));
    if (headers.includes('No.') && headers.includes('アップルID')) return i;
  }
  return -1;
}

function colIndex(headers, name) {
  const i = headers.indexOf(name);
  return i >= 0 ? i : -1;
}

function main() {
  const xlsxPath = process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || DEFAULT_XLSX;
  if (!existsSync(xlsxPath)) {
    console.error(`NG: xlsx not found: ${xlsxPath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  if (!wb.SheetNames.includes(SHEET)) {
    console.error(`NG: sheet "${SHEET}" missing. sheets=${wb.SheetNames.join(', ')}`);
    process.exit(1);
  }

  const ws = wb.Sheets[SHEET];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  const headerRowIndex = findHeaderRow(rows);
  if (headerRowIndex < 0) {
    console.error('NG: header row with No. + アップルID not found in first 8 rows');
    process.exit(1);
  }
  const headers = (rows[headerRowIndex] || []).map((h) => (h != null ? String(h).trim() : ''));
  const required = ['No.', 'アップルID'];
  for (const h of required) {
    if (!headers.includes(h)) {
      console.error(`NG: header "${h}" missing. headers=${headers.join(' | ')}`);
      process.exit(1);
    }
  }

  let dataRows = 0;
  let withUser = 0;
  let withAppleId = 0;
  const idxApple = colIndex(headers, 'アップルID');

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row.length) continue;
    const apple = idxApple >= 0 && row[idxApple] != null ? String(row[idxApple]).trim() : '';
    if (!apple) continue;
    dataRows++;
    withAppleId++;
    const idxFamily = colIndex(headers, '姓');
    const idxGiven = colIndex(headers, '名');
    const f = idxFamily >= 0 && row[idxFamily] ? String(row[idxFamily]).trim() : '';
    const g = idxGiven >= 0 && row[idxGiven] ? String(row[idxGiven]).trim() : '';
    if (f || g) withUser++;
  }

  console.log(`OK: ${xlsxPath}`);
  console.log(`sheet=${SHEET} headerRow=${headerRowIndex + 1} dataRows=${dataRows} apple_id=${withAppleId} nameFilled≈${withUser}`);
  if (dataRows < 1100 || dataRows > 1200) {
    console.warn(`WARN: expected ~1146 rows, got ${dataRows}`);
  }
}

main();
