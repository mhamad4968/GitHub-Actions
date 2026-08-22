#!/usr/bin/env node
/**
 * 夜①適用: Excel 兼務 → 595 concurrent_posts + 776 兼務行
 * - emp_id 不触
 * - 既定 dry-run。書込は --apply
 * - Excel 新列（所属グループ/部署名/部／室/役職/…）対応
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-apply-kenmu-from-excel.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-apply-kenmu-from-excel.mjs --apply
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
function resolveExcelPath() {
  if (process.env.EMPLOYEE_ROSTER_XLSX) return process.env.EMPLOYEE_ROSTER_XLSX;
  const preferred = path.join(EXCEL_DIR, '社員一覧表.xlsx');
  if (fs.existsSync(preferred)) return preferred;
  const updated = path.join(EXCEL_DIR, '社員一覧表更新.xlsx');
  if (fs.existsSync(updated)) return updated;
  if (!fs.existsSync(EXCEL_DIR)) {
    throw new Error(`Excel dir missing: ${EXCEL_DIR}`);
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
const EXCEL = resolveExcelPath();
const APPLY = process.argv.includes('--apply');
const OUT_DIR = path.join(ROOT, 'logs', 'employee-roster');

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
  const group = idx(/所属グループ|事業所/);
  const dept = idx(/^部署名$/);
  const section = idx(/部[／/]室/);
  const title = idx(/^役職$/);
  const empNo = idx(/社員番号/);
  const name = idx(/社員名/);
  const mail = idx(/メール/);
  if (title < 0 || name < 0) {
    return { group: 1, dept: 2, section: -1, title: 3, empNo: 4, name: 5, mail: 6 };
  }
  return { group, dept, section, title, empNo, name, mail };
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
    const title = String(r[col.title] ?? '').trim();
    const name = String(r[col.name] ?? '').trim();
    if (!name) continue;
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
  return {
    sheetName,
    concurrent: all.filter((r) => r.isConcurrent),
    primary: all.filter((r) => !r.isConcurrent),
  };
}

function cell(r, code) {
  return r?.[code]?.value ?? '';
}

async function fetchAll(client, app, fields, queryBase) {
  const out = [];
  let offset = 0;
  for (;;) {
    const { records } = await client.record.getRecords({
      app,
      fields,
      query: `${queryBase} limit 500 offset ${offset}`,
    });
    out.push(...records);
    if (records.length < 500) break;
    offset += 500;
  }
  return out;
}

function mapDeptTo595Option(excelDept, deptOpts) {
  if (deptOpts.includes(excelDept)) return excelDept;
  let best = null;
  for (const o of deptOpts) {
    if (excelDept.endsWith(o) || o.endsWith(excelDept)) {
      if (!best || o.length > best.length) best = o;
    }
  }
  return best;
}

function stKey(dept, title) {
  return `${normDept(dept)}|${normName(cleanTitle(title))}`;
}

async function main() {
  const excel = readExcel(EXCEL);
  const client = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_BASE_URL,
    auth: {
      username: process.env.KINTONE_USERNAME,
      password: process.env.KINTONE_PASSWORD,
    },
  });

  const form = await client.app.getFormFields({ app: '595' });
  const deptOpts = Object.keys(form.properties.concurrent_posts?.fields?.cp_dept_name?.options || {});
  const titleOpts = Object.keys(form.properties.concurrent_posts?.fields?.cp_title?.options || {});
  const groupOpts = Object.keys(form.properties.concurrent_posts?.fields?.cp_group_name?.options || {});

  const rows776 = await fetchAll(
    client,
    '776',
    [
      '$id',
      'source_595_id',
      'emp_id_ref',
      'employee_no',
      'user_name',
      'mail',
      'dept_name',
      'group_name',
      'section_name',
      'job_title',
      'row_role',
      'list_sort',
      'employment_category',
      'is_primary',
      'match_status',
    ],
    'order by $id asc',
  );
  const conc776 = rows776.filter((r) => cell(r, 'row_role') === '兼務');
  const prim776 = rows776.filter((r) => cell(r, 'row_role') === '本務');

  const byNameMail = new Map();
  const byName = new Map();
  const byNo = new Map();
  for (const p of prim776) {
    const nm = normName(cell(p, 'user_name'));
    const ml = normMail(cell(p, 'mail'));
    if (nm && ml) byNameMail.set(`${nm}|${ml}`, p);
    if (nm) {
      if (!byName.has(nm)) byName.set(nm, []);
      byName.get(nm).push(p);
    }
    const no = cell(p, 'employee_no');
    if (no) byNo.set(no, p);
  }

  function findPrimary(ex) {
    const nm = normName(ex.user_name);
    const ml = normMail(ex.mail);
    if (nm && ml && byNameMail.has(`${nm}|${ml}`)) {
      return { hit: byNameMail.get(`${nm}|${ml}`), how: 'name+mail' };
    }
    if (ex.employee_no && byNo.has(ex.employee_no)) {
      return { hit: byNo.get(ex.employee_no), how: 'employee_no' };
    }
    const cands = byName.get(nm) || [];
    if (cands.length === 1) return { hit: cands[0], how: 'name-only' };
    return { hit: null, how: 'none' };
  }

  const plan = {
    stAppend: [], // {id595, row}
    stUpdateDept: [], // {id595, rowId, from, to, title}
    add776: [],
    update776: [], // {id, fields}
    delete776: [],
    skipped: [],
    errors: [],
  };

  // --- 595 ST ---
  const ids595 = new Set();
  const excelBy595 = new Map(); // id595 -> excel concurrent[]
  for (const ex of excel.concurrent) {
    const { hit } = findPrimary(ex);
    if (!hit) {
      plan.errors.push({ excel: ex, reason: 'no primary 776' });
      continue;
    }
    const id595 = cell(hit, 'source_595_id');
    ids595.add(id595);
    if (!excelBy595.has(id595)) excelBy595.set(id595, []);
    excelBy595.get(id595).push({ ex, hit });
  }

  for (const id595 of ids595) {
    const { record } = await client.record.getRecord({ app: '595', id: id595 });
    const st = record.concurrent_posts?.value || [];
    // multiset: same dept|title may appear twice (e.g. 西川 札幌支店×2 with不同部／室)
    const existingCounts = new Map();
    for (const row of st) {
      const k = stKey(row.value?.cp_dept_name?.value, row.value?.cp_title?.value);
      existingCounts.set(k, (existingCounts.get(k) || 0) + 1);
    }
    const usedCounts = new Map();

    const wanted = excelBy595.get(id595) || [];
    for (const { ex } of wanted) {
      const mappedDept = mapDeptTo595Option(ex.dept, deptOpts);
      if (!mappedDept) {
        plan.errors.push({ excel: ex, reason: `cp_dept_name option missing for ${ex.dept}` });
        continue;
      }
      if (!titleOpts.includes(ex.titleClean)) {
        plan.errors.push({ excel: ex, reason: `cp_title option missing for ${ex.titleClean}` });
        continue;
      }
      if (!groupOpts.includes(ex.site)) {
        plan.errors.push({ excel: ex, reason: `cp_group_name option missing for ${ex.site}` });
        continue;
      }
      const key = stKey(mappedDept, ex.titleClean);
      const have = existingCounts.get(key) || 0;
      const used = usedCounts.get(key) || 0;
      if (used < have) {
        usedCounts.set(key, used + 1);
        plan.skipped.push({
          kind: 'st-exists',
          name: ex.user_name,
          dept: mappedDept,
          title: ex.titleClean,
          section: ex.section_name,
        });
        continue;
      }
      // wrong-dept same title (湯浅/佐藤: 関越支店 → 営業所) — only when this person has one Excel row for that title
      const sameTitleExcelCount = wanted.filter(
        (w) => normName(w.ex.titleClean) === normName(ex.titleClean),
      ).length;
      const sameTitleWrongDept = st.find(
        (row) =>
          normName(cleanTitle(row.value?.cp_title?.value)) === normName(ex.titleClean) &&
          normDept(row.value?.cp_dept_name?.value) !== normDept(mappedDept),
      );
      if (sameTitleWrongDept && sameTitleExcelCount === 1) {
        plan.stUpdateDept.push({
          id595,
          rowId: sameTitleWrongDept.id,
          from: sameTitleWrongDept.value.cp_dept_name.value,
          to: mappedDept,
          group: ex.site,
          title: ex.titleClean,
          name: ex.user_name,
        });
        usedCounts.set(key, used + 1);
        continue;
      }
      plan.stAppend.push({
        id595,
        name: ex.user_name,
        section: ex.section_name,
        row: {
          value: {
            cp_dept_name: { value: mappedDept },
            cp_group_name: { value: ex.site },
            cp_title: { value: ex.titleClean },
            cp_note: { value: ex.section_name ? `部／室:${ex.section_name}` : '' },
          },
        },
      });
      usedCounts.set(key, used + 1);
    }
  }

  // --- 776 ---
  const excelKeysFull = new Set(
    excel.concurrent.map(
      (ex) =>
        `${normName(ex.user_name)}|${normDept(ex.dept)}|${normDept(ex.section_name)}|${normName(ex.titleClean)}`,
    ),
  );

  function deptRelated(excelDept, kDept) {
    if (!excelDept || !kDept) return false;
    if (normDept(excelDept) === normDept(kDept)) return true;
    if (excelDept.includes(kDept) || kDept.includes(excelDept)) return true;
    const mapped = mapDeptTo595Option(excelDept, deptOpts);
    if (mapped && (mapped === kDept || normDept(mapped) === normDept(kDept))) return true;
    return false;
  }

  const claimedExcel = new Set(); // excelRow claimed by update
  for (const r of conc776) {
    const k = `${normName(cell(r, 'user_name'))}|${normDept(cell(r, 'dept_name'))}|${normDept(cell(r, 'section_name'))}|${normName(cleanTitle(cell(r, 'job_title')))}`;
    if (excelKeysFull.has(k)) {
      plan.skipped.push({ kind: '776-exact', id: cell(r, '$id'), name: cell(r, 'user_name') });
      continue;
    }
    // soft: same person + same title + related dept (short↔long) → update
    const softCands = excel.concurrent.filter(
      (ex) =>
        !claimedExcel.has(ex.excelRow) &&
        normName(ex.user_name) === normName(cell(r, 'user_name')) &&
        normName(ex.titleClean) === normName(cleanTitle(cell(r, 'job_title'))) &&
        (deptRelated(ex.dept, cell(r, 'dept_name')) ||
          normDept(ex.section_name) === normDept(cell(r, 'section_name')) ||
          !cell(r, 'section_name')),
    );
    // prefer deptRelated; if multiple (西川), match empty section first then leftover
    let soft =
      softCands.find((ex) => deptRelated(ex.dept, cell(r, 'dept_name'))) || softCands[0] || null;
    if (softCands.length > 1) {
      soft =
        softCands.find(
          (ex) =>
            deptRelated(ex.dept, cell(r, 'dept_name')) &&
            normDept(ex.section_name) === normDept(cell(r, 'section_name')),
        ) ||
        softCands.find((ex) => deptRelated(ex.dept, cell(r, 'dept_name'))) ||
        softCands[0];
    }
    if (soft) {
      claimedExcel.add(soft.excelRow);
      const fields = {};
      if (cell(r, 'dept_name') !== soft.dept) fields.dept_name = { value: soft.dept };
      if ((cell(r, 'section_name') || '') !== soft.section_name) {
        fields.section_name = { value: soft.section_name };
      }
      if (cell(r, 'group_name') !== soft.site) fields.group_name = { value: soft.site };
      if (Object.keys(fields).length) {
        plan.update776.push({ id: cell(r, '$id'), name: soft.user_name, fields, excel: soft });
      } else {
        plan.skipped.push({ kind: '776-ok', id: cell(r, '$id'), name: cell(r, 'user_name') });
      }
    } else {
      plan.delete776.push({
        id: cell(r, '$id'),
        user_name: cell(r, 'user_name'),
        dept_name: cell(r, 'dept_name'),
        job_title: cell(r, 'job_title'),
      });
    }
  }

  for (const ex of excel.concurrent) {
    if (claimedExcel.has(ex.excelRow)) continue;
    const { hit, how } = findPrimary(ex);
    if (!hit) continue;
    const exists = conc776.find(
      (r) =>
        cell(r, 'source_595_id') === cell(hit, 'source_595_id') &&
        normDept(cell(r, 'dept_name')) === normDept(ex.dept) &&
        normDept(cell(r, 'section_name')) === normDept(ex.section_name) &&
        normName(cleanTitle(cell(r, 'job_title'))) === normName(ex.titleClean),
    );
    if (exists) continue;
    plan.add776.push({
      how,
      record: {
        source_595_id: { value: cell(hit, 'source_595_id') },
        emp_id_ref: { value: cell(hit, 'emp_id_ref') },
        employee_no: { value: cell(hit, 'employee_no') || ex.employee_no },
        user_name: { value: cell(hit, 'user_name') || ex.user_name },
        mail: { value: cell(hit, 'mail') || ex.mail },
        employment_category: { value: cell(hit, 'employment_category') },
        job_title: { value: ex.titleClean },
        dept_name: { value: ex.dept },
        group_name: { value: ex.site },
        section_name: { value: ex.section_name },
        row_role: { value: '兼務' },
        is_primary: { value: '兼務' },
        match_status: { value: '一致' },
      },
      excel: ex,
    });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summary = {
    at: new Date().toISOString(),
    apply: APPLY,
    excelConcurrent: excel.concurrent.length,
    planCounts: {
      stAppend: plan.stAppend.length,
      stUpdateDept: plan.stUpdateDept.length,
      add776: plan.add776.length,
      update776: plan.update776.length,
      delete776: plan.delete776.length,
      skipped: plan.skipped.length,
      errors: plan.errors.length,
    },
    plan,
  };
  const outPath = path.join(OUT_DIR, `apply-kenmu-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary.planCounts, null, 2));
  console.log('errors', plan.errors);
  console.log('delete776', plan.delete776);
  console.log('stUpdateDept', plan.stUpdateDept);
  console.log(`json=${outPath}`);

  if (!APPLY) {
    console.log('[apply-kenmu] DRY-RUN only. Re-run with --apply to write.');
    return;
  }

  // Group ST appends by id595
  const appendById = new Map();
  for (const a of plan.stAppend) {
    if (!appendById.has(a.id595)) appendById.set(a.id595, []);
    appendById.get(a.id595).push(a.row);
  }
  for (const [id595, rows] of appendById) {
    const { record } = await client.record.getRecord({ app: '595', id: id595 });
    const st = [...(record.concurrent_posts?.value || []), ...rows];
    await client.record.updateRecord({
      app: '595',
      id: id595,
      record: { concurrent_posts: { value: st } },
    });
    console.log(`[595] append ST id=${id595} +${rows.length}`);
  }

  for (const u of plan.stUpdateDept) {
    const { record } = await client.record.getRecord({ app: '595', id: u.id595 });
    const st = (record.concurrent_posts?.value || []).map((row) => {
      if (String(row.id) !== String(u.rowId)) return row;
      return {
        id: row.id,
        value: {
          ...row.value,
          cp_dept_name: { value: u.to },
          cp_group_name: { value: u.group },
          cp_title: { value: u.title },
        },
      };
    });
    await client.record.updateRecord({
      app: '595',
      id: u.id595,
      record: { concurrent_posts: { value: st } },
    });
    console.log(`[595] update ST id=${u.id595} ${u.from}→${u.to}`);
  }

  if (plan.add776.length) {
    await client.record.addRecords({
      app: '776',
      records: plan.add776.map((x) => x.record),
    });
    console.log(`[776] added ${plan.add776.length}`);
  }

  for (const u of plan.update776) {
    await client.record.updateRecord({ app: '776', id: u.id, record: u.fields });
    console.log(`[776] update id=${u.id}`, Object.keys(u.fields));
  }

  if (plan.delete776.length) {
    await client.record.deleteRecords({
      app: '776',
      ids: plan.delete776.map((d) => d.id),
    });
    console.log(`[776] deleted ${plan.delete776.length}`, plan.delete776.map((d) => d.user_name));
  }

  console.log('[apply-kenmu] DONE');
}

main().catch((e) => {
  console.error('[apply-kenmu] FAIL', e);
  process.exit(1);
});
