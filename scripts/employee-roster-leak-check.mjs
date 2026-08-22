#!/usr/bin/env node
/**
 * 夜④ 漏れ点検: Excel ↔ 776（本務/兼務・部署・部室・並び）
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCEL_DIR = 'C:\\tmp\\社員名簿（正社員・準社員）';

function resolveExcelPath() {
  for (const name of ['社員一覧表.xlsx', '社員一覧表更新.xlsx']) {
    const p = path.join(EXCEL_DIR, name);
    if (fs.existsSync(p)) return p;
  }
  throw new Error('xlsx missing');
}

const normName = (s) =>
  String(s ?? '')
    .replace(/[　\s]+/g, '')
    .trim()
    .toLowerCase();
const normDept = (s) =>
  String(s ?? '')
    .replace(/[　\s]+/g, '')
    .trim()
    .toLowerCase();
const cleanTitle = (t) =>
  String(t ?? '')
    .replace(/[（(]?兼務[）)]?/g, '')
    .trim();

function mapExcelHeader(headerRow) {
  const h = (headerRow || []).map((c) => String(c ?? '').trim());
  const idx = (re) => h.findIndex((x) => re.test(x));
  return {
    group: idx(/所属グループ|事業所/),
    dept: idx(/^部署名$/),
    section: idx(/部[／/]室/),
    title: idx(/^役職$/),
    empNo: idx(/社員番号/),
    name: idx(/社員名/),
    mail: idx(/メール/),
  };
}

const excelPath = resolveExcelPath();
const wb = XLSX.readFile(excelPath);
const sheetName = wb.SheetNames.find((n) => /社員一覧|一覧/.test(n)) || wb.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', header: 1 });
const col = mapExcelHeader(rows[0]);
const excel = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const name = String(r[col.name] ?? '').trim();
  if (!name) continue;
  const title = String(r[col.title] ?? '').trim();
  excel.push({
    excelRow: i + 1,
    dept: String(r[col.dept] ?? '').trim(),
    section: String(r[col.section] ?? '').trim(),
    title,
    titleClean: cleanTitle(title),
    name,
    mail: String(r[col.mail] ?? '').trim(),
    kenmu: /兼務/.test(title),
  });
}

const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

const all776 = [];
let offset = 0;
for (;;) {
  const { records } = await client.record.getRecords({
    app: '776',
    fields: [
      '$id',
      'user_name',
      'dept_name',
      'section_name',
      'job_title',
      'row_role',
      'list_sort',
      'mail',
    ],
    query: `order by list_sort asc, $id asc limit 500 offset ${offset}`,
  });
  all776.push(...records);
  if (records.length < 500) break;
  offset += 500;
}

const cell = (r, c) => r?.[c]?.value ?? '';
const used = new Set();
const mismatches = [];
for (let i = 0; i < excel.length; i++) {
  const ex = excel[i];
  let hit = null;
  if (ex.kenmu) {
    hit =
      all776.find((r) => {
        if (used.has(cell(r, '$id'))) return false;
        return (
          normName(cell(r, 'user_name')) === normName(ex.name) &&
          cell(r, 'row_role') === '兼務' &&
          normDept(cell(r, 'dept_name')) === normDept(ex.dept) &&
          normDept(cell(r, 'section_name')) === normDept(ex.section) &&
          normName(cleanTitle(cell(r, 'job_title'))) === normName(ex.titleClean)
        );
      }) || null;
  } else {
    const cands = all776.filter(
      (r) =>
        !used.has(cell(r, '$id')) &&
        normName(cell(r, 'user_name')) === normName(ex.name) &&
        cell(r, 'row_role') === '本務',
    );
    const mailEx = String(ex.mail || '')
      .replace(/\u00a0/g, '')
      .trim()
      .toLowerCase();
    const byMail = cands.filter(
      (r) =>
        mailEx &&
        String(cell(r, 'mail') || '')
          .replace(/\u00a0/g, '')
          .trim()
          .toLowerCase() === mailEx,
    );
    hit = byMail[0] || (cands.length === 1 ? cands[0] : null);
  }
  if (!hit) {
    mismatches.push({ kind: 'missing776', excel: ex });
    continue;
  }
  used.add(cell(hit, '$id'));
  const sortWant = String(i + 1);
  const issues = [];
  if (String(cell(hit, 'list_sort')) !== sortWant) issues.push(`sort ${cell(hit, 'list_sort')}≠${sortWant}`);
  if ((cell(hit, 'dept_name') || '') !== ex.dept) issues.push(`dept ${cell(hit, 'dept_name')}≠${ex.dept}`);
  if ((cell(hit, 'section_name') || '') !== ex.section) {
    issues.push(`sec ${cell(hit, 'section_name')}≠${ex.section}`);
  }
  if (normName(cleanTitle(cell(hit, 'job_title'))) !== normName(ex.titleClean)) {
    issues.push(`title ${cell(hit, 'job_title')}≠${ex.titleClean}`);
  }
  if (issues.length) mismatches.push({ kind: 'field', id: cell(hit, '$id'), name: ex.name, issues });
}

const leftover = all776.filter((r) => !used.has(cell(r, '$id')));
const out = {
  at: new Date().toISOString(),
  excelPath,
  excel: excel.length,
  rows776: all776.length,
  mismatches: mismatches.length,
  leftover: leftover.length,
  mismatchSample: mismatches.slice(0, 20),
  leftoverSample: leftover.slice(0, 10).map((r) => ({
    id: cell(r, '$id'),
    name: cell(r, 'user_name'),
    role: cell(r, 'row_role'),
  })),
};
const p = path.join(ROOT, 'logs', 'employee-roster', `leak-check-${Date.now()}.json`);
fs.writeFileSync(p, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify({ ...out, mismatchSample: out.mismatchSample.slice(0, 5) }, null, 2));
console.log('json=', p);
