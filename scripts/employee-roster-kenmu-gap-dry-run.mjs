#!/usr/bin/env node
/**
 * 夜① dry-run: Excel 兼務行 ↔ 776 兼務行 ↔ 595 concurrent_posts
 * 書込なし。emp_id 不触。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-kenmu-gap-dry-run.mjs
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
  if (!fs.existsSync(EXCEL_DIR)) throw new Error(`Excel dir missing: ${EXCEL_DIR}`);
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
const APP_595 = '595';
const APP_776 = '776';
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

/**
 * 2026-08-22 以降の列:
 *   所属グループ / 部署名 / 部／室 / 役職 / 社員番号 / 社員名 / メール
 * 旧列（事業所 / 部署名 / 役職 / …）もヘッダ検出で吸収。
 */
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
  // fallback: legacy fixed positions
  if (title < 0 || name < 0) {
    return {
      group: 1,
      dept: 2,
      section: -1,
      title: 3,
      empNo: 4,
      name: 5,
      mail: 6,
      legacy: true,
      header: h,
    };
  }
  return { group, dept, section, title, empNo, name, mail, legacy: false, header: h };
}

function readExcel(filePath) {
  const st = fs.statSync(filePath);
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
    const section =
      col.section >= 0 ? String(r[col.section] ?? '').trim() : '';
    all.push({
      excelRow: i + 1,
      site: String(r[col.group] ?? '').trim(),
      dept: String(r[col.dept] ?? '').trim(),
      section_name: section,
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
    mtime: st.mtime.toISOString(),
    size: st.size,
    columns: col,
    all,
    concurrent: all.filter((r) => r.isConcurrent),
    primary: all.filter((r) => !r.isConcurrent),
  };
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

function cell(r, code) {
  return r?.[code]?.value ?? '';
}

async function main() {
  const baseUrl = process.env.KINTONE_BASE_URL;
  if (!baseUrl) throw new Error('KINTONE_BASE_URL required');

  const excel = readExcel(EXCEL);
  const client = new KintoneRestAPIClient({
    baseUrl,
    auth: {
      username: process.env.KINTONE_USERNAME,
      password: process.env.KINTONE_PASSWORD,
    },
  });

  const rows776 = await fetchAll(
    client,
    APP_776,
    [
      '$id',
      'source_595_id',
      'emp_id_ref',
      'employee_no',
      'user_name',
      'mail',
      'dept_name',
      'group_name',
      'job_title',
      'row_role',
      'list_sort',
      'section_name',
    ],
    'order by list_sort asc, $id asc',
  );
  const conc776 = rows776.filter((r) => cell(r, 'row_role') === '兼務');
  const prim776 = rows776.filter((r) => cell(r, 'row_role') === '本務');

  const rows595 = await fetchAll(
    client,
    APP_595,
    [
      '$id',
      'emp_id',
      'employee_no',
      'user_name',
      'mail',
      'dept_name',
      'group_name',
      'job_title',
      'concurrent_posts',
    ],
    'order by $id asc',
  );

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
    return { hit: null, how: 'none', candidates: cands.length };
  }

  const existing776Keys = new Set(
    conc776.map(
      (r) =>
        `${cell(r, 'source_595_id')}|${normDept(cell(r, 'dept_name'))}|${normDept(cell(r, 'section_name'))}|${normName(cleanTitle(cell(r, 'job_title')))}`,
    ),
  );

  const missing776 = [];
  const matched776 = [];
  const unmatchedPrimary = [];
  for (const ex of excel.concurrent) {
    const { hit, how, candidates } = findPrimary(ex);
    if (!hit) {
      unmatchedPrimary.push({ excel: ex, candidates });
      continue;
    }
    const key = `${cell(hit, 'source_595_id')}|${normDept(ex.dept)}|${normDept(ex.section_name)}|${normName(ex.titleClean)}`;
    if (existing776Keys.has(key)) {
      matched776.push({ excel: ex, how, source_595_id: cell(hit, 'source_595_id') });
    } else {
      missing776.push({
        excel: ex,
        how,
        source_595_id: cell(hit, 'source_595_id'),
        emp_id_ref: cell(hit, 'emp_id_ref'),
        proposed: {
          dept_name: ex.dept,
          group_name: ex.site,
          section_name: ex.section_name,
          job_title: ex.titleClean,
          user_name: cell(hit, 'user_name') || ex.user_name,
        },
      });
    }
  }

  // 595 ST gaps: Excel concurrent vs concurrent_posts by name→595 then dept+title
  const by595Name = new Map();
  for (const r of rows595) {
    const n = normName(cell(r, 'user_name'));
    if (!by595Name.has(n)) by595Name.set(n, []);
    by595Name.get(n).push(r);
  }
  const missing595St = [];
  const matched595St = [];
  for (const ex of excel.concurrent) {
    const cands = by595Name.get(normName(ex.user_name)) || [];
    let rec = null;
    if (cands.length === 1) rec = cands[0];
    else if (cands.length > 1) {
      const mailHits = cands.filter((c) => normMail(cell(c, 'mail')) === normMail(ex.mail));
      if (mailHits.length === 1) rec = mailHits[0];
      else if (ex.employee_no) {
        const noHits = cands.filter((c) => cell(c, 'employee_no') === ex.employee_no);
        if (noHits.length === 1) rec = noHits[0];
      }
    }
    if (!rec) {
      missing595St.push({ excel: ex, reason: 'no 595 person' });
      continue;
    }
    const st = rec.concurrent_posts?.value || [];
    const hit = st.find((row) => {
      const d = normDept(row.value?.cp_dept_name?.value);
      const t = normName(
        cleanTitle(row.value?.cp_title?.value ?? row.value?.cp_job_title?.value ?? ''),
      );
      return d === normDept(ex.dept) && (!t || t === normName(ex.titleClean));
    });
    // also match dept-only if title field empty/misnamed
    const hitDeptOnly = st.find(
      (row) => normDept(row.value?.cp_dept_name?.value) === normDept(ex.dept),
    );
    if (hit || hitDeptOnly) {
      matched595St.push({
        excel: ex,
        id595: cell(rec, '$id'),
        how: hit ? 'dept+title' : 'dept-only',
      });
    } else {
      missing595St.push({
        excel: ex,
        id595: cell(rec, '$id'),
        emp_id: cell(rec, 'emp_id'),
        existingSt: st.map((row) => ({
          dept: row.value?.cp_dept_name?.value,
          group: row.value?.cp_group_name?.value,
          title: row.value?.cp_title?.value ?? row.value?.cp_job_title?.value,
        })),
        reason: 'ST row missing',
      });
    }
  }

  // Excel に無い 776 兼務（余剰）
  const excelKeysByPersonDeptTitle = new Set(
    excel.concurrent.map(
      (ex) =>
        `${normName(ex.user_name)}|${normDept(ex.dept)}|${normDept(ex.section_name)}|${normName(ex.titleClean)}`,
    ),
  );
  const extra776 = [];
  for (const r of conc776) {
    const k = `${normName(cell(r, 'user_name'))}|${normDept(cell(r, 'dept_name'))}|${normDept(cell(r, 'section_name'))}|${normName(cleanTitle(cell(r, 'job_title')))}`;
    if (!excelKeysByPersonDeptTitle.has(k)) {
      extra776.push({
        id: cell(r, '$id'),
        user_name: cell(r, 'user_name'),
        dept_name: cell(r, 'dept_name'),
        section_name: cell(r, 'section_name'),
        job_title: cell(r, 'job_title'),
        list_sort: cell(r, 'list_sort'),
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    excel: {
      path: EXCEL,
      mtime: excel.mtime,
      size: excel.size,
      sheetName: excel.sheetName,
      columns: excel.columns,
      allRows: excel.all.length,
      primaryRows: excel.primary.length,
      concurrentRows: excel.concurrent.length,
      sectionFilled: excel.all.filter((r) => r.section_name).length,
    },
    counts: {
      rows776: rows776.length,
      prim776: prim776.length,
      conc776: conc776.length,
      rows595: rows595.length,
      missing776: missing776.length,
      matched776: matched776.length,
      unmatchedPrimary: unmatchedPrimary.length,
      missing595St: missing595St.length,
      matched595St: matched595St.length,
      extra776: extra776.length,
    },
    missing776,
    matched776,
    unmatchedPrimary,
    missing595St,
    extra776,
    sampleConcurrentExcel: excel.concurrent.slice(0, 5),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(OUT_DIR, `kenmu-gap-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  const md = [
    '# 社員名簿 兼務ギャップ dry-run（夜①）',
    '',
    `- 生成: ${report.generatedAt}`,
    `- Excel: \`${EXCEL}\``,
    `- mtime: ${excel.mtime} size=${excel.size}`,
    `- Excel行: 全${excel.all.length}（本務${excel.primary.length} / 兼務${excel.concurrent.length}）`,
    `- 776: 全${rows776.length}（本務${prim776.length} / 兼務${conc776.length}）`,
    `- 595: ${rows595.length}`,
    '',
    `## 結果`,
    `- **776 に無い兼務（追加候補）**: ${missing776.length}`,
    `- **776 既にある**: ${matched776.length}`,
    `- **本務未特定**: ${unmatchedPrimary.length}`,
    `- **595 ST 不足**: ${missing595St.length}`,
    `- **Excelに無い776兼務（余剰候補）**: ${extra776.length}`,
    '',
    '書込なし / emp_id 不触',
    '',
    `JSON: \`${path.relative(ROOT, outPath)}\``,
    '',
  ].join('\n');
  const mdPath = path.join(OUT_DIR, `kenmu-gap-${stamp}.md`);
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log(md);
  if (missing776.length) {
    console.log('--- missing776 (first 20) ---');
    console.log(
      missing776
        .slice(0, 20)
        .map(
          (m) =>
            `${m.excel.user_name} | ${m.excel.dept} | ${m.excel.titleClean} | how=${m.how} | 595=${m.source_595_id}`,
        )
        .join('\n'),
    );
  }
  if (unmatchedPrimary.length) {
    console.log('--- unmatchedPrimary ---');
    console.log(JSON.stringify(unmatchedPrimary, null, 2));
  }
  if (missing595St.length) {
    console.log('--- missing595St (first 20) ---');
    console.log(
      missing595St
        .slice(0, 20)
        .map(
          (m) =>
            `${m.excel.user_name} | ${m.excel.dept} | ${m.excel.title} | reason=${m.reason} | id595=${m.id595 || ''}`,
        )
        .join('\n'),
    );
  }
  console.log(`[kenmu-gap-dry-run] OK json=${outPath}`);
}

main().catch((e) => {
  console.error('[kenmu-gap-dry-run] FAIL', e);
  process.exit(1);
});
