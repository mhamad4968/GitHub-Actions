#!/usr/bin/env node
/**
 * One-off: analyze C:\tmp\appleID管理一覧\apple_ID一覧*.xlsx structure (no secrets in output).
 * Run: node scripts/tmp-analyze-apple-id-xlsx.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import xlsx from 'xlsx';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function findXlsx() {
  const base = 'C:\\tmp';
  for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const dir = path.join(base, ent.name);
    for (const f of fs.readdirSync(dir)) {
      if (/apple_ID.*\.xlsx$/i.test(f)) return path.join(dir, f);
    }
  }
  throw new Error('apple_ID xlsx not found under C:\\tmp');
}

function maskCell(header, val) {
  if (val == null || val === '') return null;
  const s = String(val).trim();
  const h = String(header || '').toLowerCase();
  if (/@/.test(s) || h.includes('id') || h.includes('パス') || h.includes('password') || h.includes('icloud')) {
    if (s.length <= 4) return '***';
    return `${s.slice(0, 3)}***${s.slice(-2)}`;
  }
  if (/^\d{2,4}-\d/.test(s) || h.includes('電話') || h.includes('番号')) return '***-****-****';
  return s.length > 50 ? `${s.slice(0, 47)}…` : s;
}

function detectHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const cells = rows[i].map((c) => (c == null ? '' : String(c).trim()));
    const joined = cells.join('|');
    if (/No\.?/.test(joined) && (/登録日/.test(joined) || /Google/.test(joined) || /MDM/.test(joined))) {
      return { index: i, headers: rows[i].map((c) => (c == null ? null : String(c).trim())) };
    }
  }
  return null;
}

function analyzeSheet(name, rows) {
  const nonEmpty = rows.filter((r) => r.some((c) => c != null && String(c).trim() !== ''));
  const hdr = detectHeaderRow(rows);
  let dataRows = 0;
  const colStats = {};
  if (hdr) {
    const headers = hdr.headers.filter(Boolean);
    for (let i = hdr.index + 1; i < rows.length; i++) {
      const row = rows[i];
      const no = row[hdr.headers.findIndex((h) => h && String(h).includes('No'))] ?? row[2];
      if (no == null || String(no).trim() === '') continue;
      if (String(no).trim() === 'No.' || String(no).trim() === 'No') continue;
      dataRows += 1;
      hdr.headers.forEach((h, j) => {
        if (!h) return;
        const v = row[j];
        if (v == null || String(v).trim() === '') return;
        colStats[h] = (colStats[h] || 0) + 1;
      });
    }
  }
  const sample = hdr
    ? rows.slice(hdr.index + 1, hdr.index + 4).map((row) =>
        hdr.headers.slice(0, 12).map((h, j) => maskCell(h, row[j])),
      )
    : nonEmpty.slice(0, 5).map((row) => row.slice(0, 8).map((c) => maskCell('', c)));

  return {
    sheet: name,
    totalRows: rows.length,
    nonEmptyRows: nonEmpty.length,
    headerRowIndex: hdr?.index ?? null,
    headers: hdr?.headers?.filter((h) => h && String(h).trim()) ?? null,
    estimatedDataRows: dataRows,
    columnFillCounts: colStats,
    sampleMasked: sample,
    previewText: hdr ? null : nonEmpty.slice(0, 8).map((r) => r.map((c) => maskCell('', c)).filter(Boolean)),
  };
}

const xlsxPath = findXlsx();
const wb = xlsx.readFile(xlsxPath, { cellDates: true });
const report = {
  file: xlsxPath,
  sizeBytes: fs.statSync(xlsxPath).size,
  sheetNames: wb.SheetNames,
  analyzedAt: new Date().toISOString(),
  sheets: {},
};

for (const sn of wb.SheetNames) {
  const sheet = wb.Sheets[sn];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  report.sheets[sn] = analyzeSheet(sn, rows);
}

const outJson = path.join(root, 'docs', 'plans', 'tmp-apple-id-xlsx-structure.json');
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log('[tmp-analyze-apple-id-xlsx] OK', outJson);
for (const sn of wb.SheetNames) {
  const s = report.sheets[sn];
  console.log(`  ${sn}: dataRows=${s.estimatedDataRows} headers=${s.headers?.slice(0, 6)?.join(', ') ?? '(none)'}`);
}

// icloud 追加集計
const icloudRows = xlsx.utils.sheet_to_json(wb.Sheets['icloud'], { header: 1, defval: null });
let withOk = 0;
let withPerson = 0;
let idOnly = 0;
const devices = {};
let maxNo = 0;
for (let i = 2; i < icloudRows.length; i++) {
  const r = icloudRows[i];
  const no = Number(r[2]);
  if (!no || Number.isNaN(no)) continue;
  maxNo = Math.max(maxNo, no);
  if (r[1] === 'OK') withOk += 1;
  if (r[4] && r[5]) withPerson += 1;
  else idOnly += 1;
  const dev = r[11];
  if (dev) devices[String(dev)] = (devices[String(dev)] || 0) + 1;
}
report.icloudSummary = { maxNo, withOk, withPerson, idOnly, devices, note: '列L(12列目)=端末種別(iPhone/iPad等)・列B=OKステータス' };
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log('[icloud summary]', JSON.stringify(report.icloudSummary));
