#!/usr/bin/env node
/**
 * 社員名簿: Excel突合 → 595 apply（emp_id / employment_category 不触）
 * 続けて 776 へ本務行を投影（MCPではなく REST。776 は KINTONE_API_TOKEN_776 or guest 不可時は --skip-776）
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-apply-595.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-apply-595.mjs --apply
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-apply-595.mjs --apply --skip-776
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXCEL =
  process.env.EMPLOYEE_ROSTER_XLSX ||
  'C:\\tmp\\社員名簿（正社員・準社員）\\社員一覧表.xlsx';
const APP_595 = '595';
const APP_776 = '776';
const APPLY = process.argv.includes('--apply');
const SKIP_776 = process.argv.includes('--skip-776');
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
const keyOf = (name, dept) => `${normName(name)}|${normDept(dept)}`;

function readExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n) => /社員一覧|一覧/.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', header: 1 });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 6) continue;
    const title = String(r[3] ?? '').trim();
    const name = String(r[5] ?? '').trim();
    if (!name) continue;
    out.push({
      excelRow: i + 1,
      site: String(r[1] ?? '').trim(),
      dept: String(r[2] ?? '').trim(),
      title,
      employee_no: String(r[4] ?? '').trim(),
      user_name: name,
      mail: String(r[6] ?? '')
        .replace(/\u00a0/g, '')
        .trim(),
      isConcurrent: /兼務/.test(title),
    });
  }
  return { sheetName, rows: out };
}

async function fetchAll595(client) {
  const fields = [
    '$id',
    'emp_id',
    'employee_no',
    'user_name',
    'dept_name',
    'group_name',
    'mail',
    'job_title',
    'concurrent_posts',
  ];
  const all = [];
  let offset = 0;
  for (;;) {
    const { records } = await client.record.getRecords({
      app: APP_595,
      fields,
      query: `order by $id asc limit 500 offset ${offset}`,
    });
    all.push(...records);
    if (records.length < 500) break;
    offset += 500;
  }
  return all.map((rec) => ({
    id: rec.$id.value,
    emp_id: rec.emp_id?.value ?? '',
    employee_no: rec.employee_no?.value ?? '',
    user_name: rec.user_name?.value ?? '',
    dept_name: rec.dept_name?.value ?? '',
    group_name: rec.group_name?.value ?? '',
    mail: rec.mail?.value ?? '',
    job_title: rec.job_title?.value ?? '',
    concurrent_posts: rec.concurrent_posts?.value ?? [],
  }));
}

function matchRows(excelAll, k595) {
  const primary = excelAll.filter((r) => !r.isConcurrent);
  const concurrent = excelAll.filter((r) => r.isConcurrent);
  const byKey = new Map();
  const byName = new Map();
  for (const r of k595) {
    const k = keyOf(r.user_name, r.dept_name);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(r);
    const n = normName(r.user_name);
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(r);
  }

  const matched = [];
  const unmatched = [];
  for (const ex of primary) {
    const hits = byKey.get(keyOf(ex.user_name, ex.dept)) || [];
    if (hits.length === 1) {
      matched.push({ excel: ex, kintone: hits[0], how: 'name+dept' });
      continue;
    }
    const nameHits = byName.get(normName(ex.user_name)) || [];
    if (nameHits.length === 1) {
      const cand = nameHits[0];
      if (normMail(ex.mail) && normMail(ex.mail) === normMail(cand.mail)) {
        matched.push({ excel: ex, kintone: cand, how: 'name+mail' });
      } else {
        unmatched.push({ excel: ex, reason: 'name-only mail mismatch' });
      }
      continue;
    }
    if (nameHits.length > 1) {
      const mailHits = nameHits.filter(
        (c) => normMail(ex.mail) && normMail(c.mail) === normMail(ex.mail),
      );
      if (mailHits.length === 1) {
        matched.push({ excel: ex, kintone: mailHits[0], how: 'name-multi+mail' });
      } else {
        unmatched.push({ excel: ex, reason: 'name multiple' });
      }
      continue;
    }
    unmatched.push({ excel: ex, reason: 'no name hit' });
  }

  // 兼務行 → 同一氏名(+mail) の本務マッチへ紐付け
  const concurrentBy595 = new Map();
  for (const ex of concurrent) {
    const nameHits = byName.get(normName(ex.user_name)) || [];
    let target = null;
    if (nameHits.length === 1) target = nameHits[0];
    else if (nameHits.length > 1) {
      const mailHits = nameHits.filter(
        (c) => normMail(ex.mail) && normMail(c.mail) === normMail(ex.mail),
      );
      if (mailHits.length === 1) target = mailHits[0];
    }
    if (!target) continue;
    if (!concurrentBy595.has(target.id)) concurrentBy595.set(target.id, []);
    concurrentBy595.get(target.id).push({
      value: {
        cp_dept_name: { value: ex.dept },
        cp_group_name: { value: ex.site },
        cp_title: { value: ex.title.replace(/[（(]?兼務[）)]?/g, '').trim() || ex.title },
        cp_note: { value: 'excel-import' },
      },
    });
  }

  return { matched, unmatched, concurrentBy595 };
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function main() {
  const baseUrl = process.env.KINTONE_BASE_URL;
  const token595 = process.env.KINTONE_API_TOKEN_595 || process.env.KINTONE_API_TOKEN;
  if (!baseUrl || !token595) throw new Error('KINTONE_BASE_URL / KINTONE_API_TOKEN_595 required');

  const { sheetName, rows: excelAll } = readExcel(EXCEL);
  const client595 = new KintoneRestAPIClient({
    baseUrl,
    auth: { apiToken: token595 },
  });
  const k595 = await fetchAll595(client595);
  const { matched, unmatched, concurrentBy595 } = matchRows(excelAll, k595);

  // employee_no 重複（Excel本務）は警告のみ・両方 apply 可（フィールド unique ではない）
  const noCount = new Map();
  for (const m of matched) {
    const no = m.excel.employee_no;
    if (!no) continue;
    noCount.set(no, (noCount.get(no) || 0) + 1);
  }
  const dupNos = [...noCount.entries()].filter(([, c]) => c > 1).map(([no]) => no);

  const updates = matched.map((m) => {
    const record = {
      employee_no: { value: m.excel.employee_no },
      job_title: { value: m.excel.title },
    };
    // mail が空のときだけ埋める（既存メールは上書きしない）
    if (!normMail(m.kintone.mail) && normMail(m.excel.mail)) {
      record.mail = { value: m.excel.mail };
    }
    const conc = concurrentBy595.get(m.kintone.id);
    if (conc && conc.length) {
      record.concurrent_posts = { value: conc };
    }
    return { id: m.kintone.id, record, meta: m };
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const planPath = path.join(OUT_DIR, `apply-plan-${stamp}.json`);
  const plan = {
    mode: APPLY ? 'APPLY' : 'DRY-RUN',
    generatedAt: new Date().toISOString(),
    sheetName,
    matched: matched.length,
    unmatched: unmatched.length,
    concurrentPeople: concurrentBy595.size,
    dupEmployeeNos: dupNos,
    willNotTouch: ['emp_id', 'employment_category'],
    unmatchedFull: unmatched,
    sampleUpdates: updates.slice(0, 5).map((u) => ({
      id: u.id,
      emp_id_readonly: u.meta.kintone.emp_id,
      employee_no: u.record.employee_no.value,
      job_title: u.record.job_title.value,
      concurrentRows: u.record.concurrent_posts?.value?.length || 0,
    })),
  };
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8');
  console.log(
    `[employee-roster:apply] mode=${plan.mode} matched=${matched.length} unmatched=${unmatched.length} dupNos=${dupNos.join(',') || 'none'}`,
  );
  console.log(`[employee-roster:apply] plan=${planPath}`);
  console.log('[employee-roster:apply] NEVER touch emp_id / employment_category');

  if (!APPLY) {
    console.log('[employee-roster:apply] dry-run only. Re-run with --apply to write.');
    return;
  }

  let updated = 0;
  for (const batch of chunk(updates, 100)) {
    await client595.record.updateRecords({
      app: APP_595,
      records: batch.map((u) => ({ id: u.id, record: u.record })),
    });
    updated += batch.length;
    console.log(`[employee-roster:apply] 595 updated ${updated}/${updates.length}`);
  }

  // 776 投影（本務のみ）。token が無ければ skip
  const token776 = process.env.KINTONE_API_TOKEN_776;
  let synced776 = 0;
  if (SKIP_776) {
    console.log('[employee-roster:apply] skip 776 (--skip-776)');
  } else if (!token776) {
    console.log('[employee-roster:apply] WARN no KINTONE_API_TOKEN_776 — 595 only. Sync 776 via MCP next.');
  } else {
    const client776 = new KintoneRestAPIClient({
      baseUrl,
      auth: { apiToken: token776 },
    });
    // 既存クリアはしない（初回想定）。重複防止で source_595_id 既存を取得
    const existing = new Set();
    let offset = 0;
    for (;;) {
      const { records } = await client776.record.getRecords({
        app: APP_776,
        fields: ['source_595_id'],
        query: `order by $id asc limit 500 offset ${offset}`,
      });
      for (const r of records) existing.add(String(r.source_595_id?.value ?? ''));
      if (records.length < 500) break;
      offset += 500;
    }
    const toAdd = [];
    for (const m of matched) {
      const sid = String(m.kintone.id);
      if (existing.has(sid)) continue;
      toAdd.push({
        source_595_id: { value: m.kintone.id },
        emp_id_ref: { value: m.kintone.emp_id },
        employee_no: { value: m.excel.employee_no },
        user_name: { value: m.excel.user_name },
        mail: { value: m.excel.mail || m.kintone.mail },
        job_title: { value: m.excel.title },
        dept_name: { value: m.kintone.dept_name || m.excel.dept },
        group_name: { value: m.kintone.group_name || m.excel.site },
        row_role: { value: '本務' },
        is_primary: { value: '本務' },
        match_status: { value: '一致' },
      });
    }
    for (const batch of chunk(toAdd, 100)) {
      await client776.record.addRecords({ app: APP_776, records: batch });
      synced776 += batch.length;
      console.log(`[employee-roster:apply] 776 added ${synced776}/${toAdd.length}`);
    }
  }

  const resultPath = path.join(OUT_DIR, `apply-result-${stamp}.json`);
  fs.writeFileSync(
    resultPath,
    JSON.stringify(
      {
        ...plan,
        mode: 'APPLY-DONE',
        updated595: updated,
        synced776,
        unmatched,
        dupEmployeeNos: dupNos,
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`[employee-roster:apply] DONE result=${resultPath}`);
}

main().catch((e) => {
  console.error('[employee-roster:apply] FAIL', e);
  process.exit(1);
});
