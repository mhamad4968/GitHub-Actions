#!/usr/bin/env node
/**
 * 夜②: 776 list_sort を Excel 行順（当社の現行役職順）に合わせる。
 * - emp_id 不触
 * - 既定 dry-run。書込は --apply
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-776-list-sort-from-excel.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-776-list-sort-from-excel.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCEL_DIR =
  process.env.EMPLOYEE_ROSTER_DIR || 'C:\\tmp\\社員名簿（正社員・準社員）';
const APPLY = process.argv.includes('--apply');
const OUT_DIR = path.join(ROOT, 'logs', 'employee-roster');

function resolveExcelPath() {
  if (process.env.EMPLOYEE_ROSTER_XLSX) return process.env.EMPLOYEE_ROSTER_XLSX;
  for (const name of ['社員一覧表.xlsx', '社員一覧表更新.xlsx']) {
    const p = path.join(EXCEL_DIR, name);
    if (fs.existsSync(p)) return p;
  }
  const cands = fs
    .readdirSync(EXCEL_DIR)
    .filter((f) => /\.xlsx$/i.test(f) && !f.startsWith('~$'))
    .map((f) => {
      const full = path.join(EXCEL_DIR, f);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  if (!cands.length) throw new Error(`No xlsx in ${EXCEL_DIR}`);
  return cands[0].full;
}

const normName = (s) =>
  String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[　\s]+/g, '')
    .trim()
    .toLowerCase();
const normDept = (s) =>
  String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[　\s]+/g, '')
    .trim()
    .toLowerCase();
const normMail = (s) =>
  String(s ?? '')
    .replace(/\u00a0/g, '')
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

function readExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n) => /社員一覧|一覧/.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', header: 1 });
  const col = mapExcelHeader(rows[0]);
  const all = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const name = String(r[col.name] ?? '').trim();
    if (!name) continue;
    const title = String(r[col.title] ?? '').trim();
    all.push({
      excelRow: i + 1,
      site: String(r[col.group] ?? '').trim(),
      dept: String(r[col.dept] ?? '').trim(),
      section_name: col.section >= 0 ? String(r[col.section] ?? '').trim() : '',
      title,
      titleClean: cleanTitle(title),
      employee_no: String(r[col.empNo] ?? '').trim(),
      user_name: name,
      mail: String(r[col.mail] ?? '')
        .replace(/\u00a0/g, '')
        .trim(),
      isConcurrent: /兼務/.test(title),
    });
  }
  return { sheetName, all };
}

function cell(r, code) {
  return r?.[code]?.value ?? '';
}

async function fetchAll(client, app, fields) {
  const out = [];
  let offset = 0;
  for (;;) {
    const { records } = await client.record.getRecords({
      app,
      fields,
      query: `order by list_sort asc, $id asc limit 500 offset ${offset}`,
    });
    out.push(...records);
    if (records.length < 500) break;
    offset += 500;
  }
  return out;
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function main() {
  const excelPath = resolveExcelPath();
  const { all: excelRows } = readExcel(excelPath);
  const client = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_BASE_URL,
    auth: {
      username: process.env.KINTONE_USERNAME,
      password: process.env.KINTONE_PASSWORD,
    },
  });

  const rows776 = await fetchAll(client, '776', [
    '$id',
    'source_595_id',
    'employee_no',
    'user_name',
    'mail',
    'dept_name',
    'section_name',
    'job_title',
    'row_role',
    'list_sort',
  ]);

  const used = new Set();
  const find776 = (ex) => {
    const cands = rows776.filter((r) => {
      if (used.has(cell(r, '$id'))) return false;
      if (normName(cell(r, 'user_name')) !== normName(ex.user_name)) return false;
      const role = cell(r, 'row_role');
      if (ex.isConcurrent) {
        if (role !== '兼務') return false;
        if (normDept(cell(r, 'dept_name')) !== normDept(ex.dept)) return false;
        if (normDept(cell(r, 'section_name')) !== normDept(ex.section_name)) return false;
        if (normName(cleanTitle(cell(r, 'job_title'))) !== normName(ex.titleClean)) return false;
        return true;
      }
      if (role !== '本務') return false;
      const ml = normMail(ex.mail);
      if (ml && normMail(cell(r, 'mail')) === ml) return true;
      if (ex.employee_no && cell(r, 'employee_no') === ex.employee_no) return true;
      return true; // name-only fallback (filtered by unused)
    });
    if (!ex.isConcurrent) {
      const byMail = cands.filter(
        (r) => ex.mail && normMail(cell(r, 'mail')) === normMail(ex.mail),
      );
      if (byMail.length === 1) return byMail[0];
      const byNo = cands.filter((r) => ex.employee_no && cell(r, 'employee_no') === ex.employee_no);
      if (byNo.length === 1) return byNo[0];
      if (cands.length === 1) return cands[0];
      return null;
    }
    return cands[0] || null;
  };

  const order = [];
  const unmatchedExcel = [];
  for (const ex of excelRows) {
    const hit = find776(ex);
    if (!hit) {
      unmatchedExcel.push(ex);
      continue;
    }
    used.add(cell(hit, '$id'));
    order.push({ id: cell(hit, '$id'), excel: ex, rec: hit });
  }

  const leftover = rows776.filter((r) => !used.has(cell(r, '$id')));
  for (const r of leftover) {
    order.push({ id: cell(r, '$id'), excel: null, rec: r, leftover: true });
  }

  const updates = [];
  for (let i = 0; i < order.length; i++) {
    const want = String(i + 1);
    const cur = String(cell(order[i].rec, 'list_sort') ?? '');
    if (cur !== want) {
      updates.push({
        id: order[i].id,
        from: cur,
        to: want,
        name: cell(order[i].rec, 'user_name'),
        role: cell(order[i].rec, 'row_role'),
        leftover: !!order[i].leftover,
      });
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summary = {
    at: new Date().toISOString(),
    apply: APPLY,
    excelPath,
    excelRows: excelRows.length,
    rows776: rows776.length,
    matched: used.size,
    unmatchedExcel: unmatchedExcel.map((e) => ({
      row: e.excelRow,
      name: e.user_name,
      dept: e.dept,
      title: e.title,
      kenmu: e.isConcurrent,
    })),
    leftover: leftover.map((r) => ({
      id: cell(r, '$id'),
      name: cell(r, 'user_name'),
      role: cell(r, 'row_role'),
      dept: cell(r, 'dept_name'),
    })),
    updateCount: updates.length,
    updatesSample: updates.slice(0, 30),
  };
  const outPath = path.join(OUT_DIR, `list-sort-excel-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        excelPath,
        excelRows: excelRows.length,
        rows776: rows776.length,
        matched: used.size,
        unmatchedExcel: unmatchedExcel.length,
        leftover: leftover.length,
        updateCount: updates.length,
      },
      null,
      2,
    ),
  );
  if (unmatchedExcel.length) {
    console.log('unmatchedExcel sample', unmatchedExcel.slice(0, 10));
  }
  if (leftover.length) {
    console.log('leftover', leftover.map((r) => `${cell(r, '$id')}:${cell(r, 'user_name')}`));
  }
  console.log(`json=${outPath}`);

  if (!APPLY) {
    console.log('[list-sort-excel] DRY-RUN. Re-run with --apply to write.');
    return;
  }

  for (const batch of chunk(updates, 100)) {
    await client.record.updateRecords({
      app: '776',
      records: batch.map((u) => ({
        id: u.id,
        record: { list_sort: { value: u.to } },
      })),
    });
    console.log(`[776] list_sort updated ${batch.length}`);
  }
  console.log(`[list-sort-excel] DONE updates=${updates.length}`);
}

main().catch((e) => {
  console.error('[list-sort-excel] FAIL', e);
  process.exit(1);
});
