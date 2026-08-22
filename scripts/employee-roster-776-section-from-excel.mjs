#!/usr/bin/env node
/**
 * 夜③: Excel 部／室 → 776 section_name（並び list_sort は変更しない）
 * - DROP_DOWN に無い選択肢は追加してから書込
 * - emp_id 不触
 * - 既定 dry-run。--apply で書込
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
  return all;
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
  const excelRows = readExcel(excelPath);
  const client = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_BASE_URL,
    auth: {
      username: process.env.KINTONE_USERNAME,
      password: process.env.KINTONE_PASSWORD,
    },
  });

  const form = await client.app.getFormFields({ app: '776' });
  const field = form.properties.section_name;
  if (!field || field.type !== 'DROP_DOWN') {
    throw new Error('776 section_name is not DROP_DOWN');
  }
  const existingOpts = new Set(Object.keys(field.options || {}));
  const excelSections = [
    ...new Set(excelRows.map((e) => e.section_name).filter(Boolean)),
  ].sort();
  const toAdd = excelSections.filter((s) => !existingOpts.has(s));

  const rows776 = await fetchAll(client, '776', [
    '$id',
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
        if (normName(cleanTitle(cell(r, 'job_title'))) !== normName(ex.titleClean)) return false;
        return true;
      }
      return role === '本務';
    });
    if (ex.isConcurrent) return cands[0] || null;
    const byMail = cands.filter(
      (r) => ex.mail && normMail(cell(r, 'mail')) === normMail(ex.mail),
    );
    if (byMail.length === 1) return byMail[0];
    const byNo = cands.filter((r) => ex.employee_no && cell(r, 'employee_no') === ex.employee_no);
    if (byNo.length === 1) return byNo[0];
    if (cands.length === 1) return cands[0];
    return null;
  };

  const updates = [];
  const unmatched = [];
  for (const ex of excelRows) {
    const hit = find776(ex);
    if (!hit) {
      unmatched.push(ex);
      continue;
    }
    used.add(cell(hit, '$id'));
    const cur = cell(hit, 'section_name') || '';
    const want = ex.section_name || '';
    if (cur !== want) {
      updates.push({
        id: cell(hit, '$id'),
        name: ex.user_name,
        from: cur,
        to: want,
        role: cell(hit, 'row_role'),
        list_sort: cell(hit, 'list_sort'),
      });
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summary = {
    at: new Date().toISOString(),
    apply: APPLY,
    excelPath,
    excelSections,
    optionsToAdd: toAdd,
    updateCount: updates.length,
    unmatched: unmatched.length,
    updatesSample: updates.slice(0, 40),
  };
  const outPath = path.join(OUT_DIR, `section-from-excel-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        excelPath,
        optionsToAdd: toAdd,
        updateCount: updates.length,
        unmatched: unmatched.length,
        filledExcel: excelRows.filter((e) => e.section_name).length,
      },
      null,
      2,
    ),
  );
  console.log(`json=${outPath}`);

  if (!APPLY) {
    console.log('[section-excel] DRY-RUN. Re-run with --apply.');
    return;
  }

  if (toAdd.length) {
    const nextOpts = { ...(field.options || {}) };
    let maxIndex = Math.max(
      0,
      ...Object.values(nextOpts).map((o) => Number(o.index) || 0),
    );
    for (const label of toAdd) {
      maxIndex += 1;
      nextOpts[label] = { label, index: String(maxIndex) };
    }
    await client.app.updateFormFields({
      app: '776',
      properties: {
        section_name: {
          type: 'DROP_DOWN',
          code: 'section_name',
          label: field.label || '部／室',
          noLabel: field.noLabel,
          required: field.required,
          options: nextOpts,
          defaultValue: field.defaultValue || '',
        },
      },
    });
    await client.app.deployApp({ apps: [{ app: '776' }] });
    console.log('[776] section_name options added:', toAdd.join(', '));
    // wait deploy
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const st = await client.app.getDeployStatus({ apps: ['776'] });
      const s = st.apps?.[0]?.status;
      console.log('[776] deploy status', s);
      if (s === 'SUCCESS') break;
      if (s === 'FAIL' || s === 'CANCEL') throw new Error(`deploy failed: ${s}`);
    }
  }

  for (const batch of chunk(updates, 100)) {
    await client.record.updateRecords({
      app: '776',
      records: batch.map((u) => ({
        id: u.id,
        record: { section_name: { value: u.to } },
      })),
    });
    console.log(`[776] section_name updated ${batch.length}`);
  }
  console.log(`[section-excel] DONE updates=${updates.length}`);
}

main().catch((e) => {
  console.error('[section-excel] FAIL', e);
  process.exit(1);
});
