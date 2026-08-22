#!/usr/bin/env node
/**
 * 夜④補: Excel 本務行 → 776 本務の dept/title/section/group を合わせる（emp_id 不触）
 * list_sort は変更しない。既定 dry-run / --apply
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
const APPLY = process.argv.includes('--apply');

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

function readPrimary(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n) => /社員一覧|一覧/.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', header: 1 });
  const col = mapExcelHeader(rows[0]);
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = String(r[col.name] ?? '').trim();
    if (!name) continue;
    const title = String(r[col.title] ?? '').trim();
    if (/兼務/.test(title)) continue;
    out.push({
      site: String(r[col.group] ?? '').trim(),
      dept: String(r[col.dept] ?? '').trim(),
      section_name: col.section >= 0 ? String(r[col.section] ?? '').trim() : '',
      titleClean: cleanTitle(title),
      employee_no: String(r[col.empNo] ?? '').trim(),
      user_name: name,
      mail: String(r[col.mail] ?? '')
        .replace(/\u00a0/g, '')
        .trim(),
    });
  }
  return out;
}

function cell(r, code) {
  return r?.[code]?.value ?? '';
}

async function fetchAll(client) {
  const out = [];
  let offset = 0;
  for (;;) {
    const { records } = await client.record.getRecords({
      app: '776',
      fields: [
        '$id',
        'user_name',
        'mail',
        'employee_no',
        'dept_name',
        'group_name',
        'section_name',
        'job_title',
        'row_role',
      ],
      query: `row_role in ("本務") order by $id asc limit 500 offset ${offset}`,
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
  const primaries = readPrimary(excelPath);
  const client = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_BASE_URL,
    auth: {
      username: process.env.KINTONE_USERNAME,
      password: process.env.KINTONE_PASSWORD,
    },
  });
  const rows = await fetchAll(client);
  const used = new Set();
  const updates = [];
  const unmatched = [];

  for (const ex of primaries) {
    const cands = rows.filter(
      (r) => !used.has(cell(r, '$id')) && normName(cell(r, 'user_name')) === normName(ex.user_name),
    );
    const byMail = cands.filter(
      (r) => ex.mail && normMail(cell(r, 'mail')) === normMail(ex.mail),
    );
    const byNo = cands.filter((r) => ex.employee_no && cell(r, 'employee_no') === ex.employee_no);
    const hit = byMail[0] || byNo[0] || (cands.length === 1 ? cands[0] : null);
    if (!hit) {
      unmatched.push(ex);
      continue;
    }
    used.add(cell(hit, '$id'));
    const fields = {};
    if (cell(hit, 'dept_name') !== ex.dept) fields.dept_name = { value: ex.dept };
    if ((cell(hit, 'section_name') || '') !== ex.section_name) {
      fields.section_name = { value: ex.section_name };
    }
    if (cleanTitle(cell(hit, 'job_title')) !== ex.titleClean) {
      fields.job_title = { value: ex.titleClean };
    }
    if (ex.site && cell(hit, 'group_name') !== ex.site) {
      fields.group_name = { value: ex.site };
    }
    if (Object.keys(fields).length) {
      updates.push({
        id: cell(hit, '$id'),
        name: ex.user_name,
        fields,
        from: {
          dept: cell(hit, 'dept_name'),
          title: cell(hit, 'job_title'),
          sec: cell(hit, 'section_name'),
          group: cell(hit, 'group_name'),
        },
        to: ex,
      });
    }
  }

  const outDir = path.join(ROOT, 'logs', 'employee-roster');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(outDir, `primary-align-${stamp}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { at: new Date().toISOString(), apply: APPLY, excelPath, updateCount: updates.length, unmatched: unmatched.length, updates },
      null,
      2,
    ),
    'utf8',
  );
  console.log(JSON.stringify({ updateCount: updates.length, unmatched: unmatched.length, sample: updates.slice(0, 8).map((u) => ({ id: u.id, name: u.name, keys: Object.keys(u.fields), from: u.from, toDept: u.to.dept, toTitle: u.to.titleClean })) }, null, 2));
  console.log('json=', outPath);
  if (!APPLY) {
    console.log('[primary-align] DRY-RUN');
    return;
  }
  for (const batch of chunk(updates, 100)) {
    await client.record.updateRecords({
      app: '776',
      records: batch.map((u) => ({ id: u.id, record: u.fields })),
    });
    console.log('[776] primary aligned', batch.length);
  }
  console.log('[primary-align] DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
