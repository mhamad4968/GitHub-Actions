#!/usr/bin/env node
/**
 * 社員名簿 Excel ↔ 595 初期突合 dry-run（書込なし）
 * キー: 氏名 + 所属（部署名）。曖昧は人手リストへ。
 * emp_id は読取のみ（出力に含めるが更新しない）。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-excel-match-dry-run.mjs
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
const OUT_DIR = path.join(ROOT, 'logs', 'employee-roster');

function normName(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[　\s]+/g, '')
    .replace(/[ｰー−–—]/g, '-')
    .trim()
    .toLowerCase();
}

function normDept(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[　\s]+/g, '')
    .trim()
    .toLowerCase();
}

function keyOf(name, dept) {
  return `${normName(name)}|${normDept(dept)}`;
}

function readExcel(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel not found: ${filePath}`);
  }
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n) => /社員一覧|一覧/.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', header: 1 });
  // header row: [#, 事業所, 部署名, 役職, 社員番号, 社員名, メール]
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 6) continue;
    const site = String(r[1] ?? '').trim();
    const dept = String(r[2] ?? '').trim();
    const title = String(r[3] ?? '').trim();
    const empNo = String(r[4] ?? '').trim();
    const name = String(r[5] ?? '').trim();
    const mail = String(r[6] ?? '')
      .replace(/\u00a0/g, '')
      .trim();
    if (!name) continue;
    const isConcurrent = /兼務/.test(title);
    out.push({
      excelRow: i + 1,
      site,
      dept,
      title,
      employee_no: empNo,
      user_name: name,
      mail,
      isConcurrent,
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
    'employment_status',
    'employment_category',
    'job_title',
  ];
  const all = [];
  let offset = 0;
  const limit = 500;
  for (;;) {
    const { records } = await client.record.getRecords({
      app: APP_595,
      fields,
      query: `order by $id asc limit ${limit} offset ${offset}`,
    });
    all.push(...records);
    if (records.length < limit) break;
    offset += limit;
  }
  return all.map((rec) => ({
    id: rec.$id.value,
    emp_id: rec.emp_id?.value ?? '',
    employee_no: rec.employee_no?.value ?? '',
    user_name: rec.user_name?.value ?? '',
    dept_name: rec.dept_name?.value ?? '',
    group_name: rec.group_name?.value ?? '',
    mail: rec.mail?.value ?? '',
    employment_status: rec.employment_status?.value ?? '',
    employment_category: rec.employment_category?.value ?? '',
    job_title: rec.job_title?.value ?? '',
  }));
}

function mainPrimaryRows(excelRows) {
  // 兼務行は同一氏名の本務行にぶら下げる前提。突合キーは本務行のみ。
  return excelRows.filter((r) => !r.isConcurrent);
}

async function main() {
  const baseUrl = process.env.KINTONE_BASE_URL;
  const token =
    process.env.KINTONE_API_TOKEN_595 ||
    process.env.KINTONE_API_TOKEN ||
    process.env.KINTONE_API_TOKEN_ALL;
  if (!baseUrl || !token) {
    throw new Error('KINTONE_BASE_URL / KINTONE_API_TOKEN_595 required');
  }

  const { sheetName, rows: excelAll } = readExcel(EXCEL);
  const excelPrimary = mainPrimaryRows(excelAll);
  const client = new KintoneRestAPIClient({
    baseUrl,
    auth: { apiToken: token },
  });
  const k595 = await fetchAll595(client);

  const byKey = new Map();
  for (const r of k595) {
    const k = keyOf(r.user_name, r.dept_name);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(r);
  }

  const byName = new Map();
  for (const r of k595) {
    const n = normName(r.user_name);
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(r);
  }

  const matched = [];
  const ambiguous = [];
  const unmatched = [];
  const normMail = (s) =>
    String(s ?? '')
      .replace(/\u00a0/g, '')
      .trim()
      .toLowerCase();

  for (const ex of excelPrimary) {
    const k = keyOf(ex.user_name, ex.dept);
    const hits = byKey.get(k) || [];
    if (hits.length === 1) {
      matched.push({ excel: ex, kintone: hits[0], how: 'name+dept' });
      continue;
    }
    if (hits.length > 1) {
      ambiguous.push({ excel: ex, candidates: hits, reason: 'name+dept multiple' });
      continue;
    }
    const nameHits = byName.get(normName(ex.user_name)) || [];
    if (nameHits.length === 1) {
      const cand = nameHits[0];
      const mailOk =
        normMail(ex.mail) &&
        normMail(cand.mail) &&
        normMail(ex.mail) === normMail(cand.mail);
      if (mailOk) {
        // 所属表記ゆれ（例: 出向 vs 出向者）だが氏名一意＋メール一致 → 高信頼
        matched.push({
          excel: ex,
          kintone: cand,
          how: 'name+mail (dept wording drift)',
          deptExcel: ex.dept,
          dept595: cand.dept_name,
        });
      } else {
        ambiguous.push({
          excel: ex,
          candidates: nameHits,
          reason: 'name-only unique (dept/mail confirm)',
        });
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
        ambiguous.push({ excel: ex, candidates: nameHits, reason: 'name multiple' });
      }
      continue;
    }
    unmatched.push({ excel: ex, reason: 'no name hit' });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const report = {
    generatedAt: new Date().toISOString(),
    excelPath: EXCEL,
    sheetName,
    excelAllRows: excelAll.length,
    excelPrimaryRows: excelPrimary.length,
    excelConcurrentRows: excelAll.length - excelPrimary.length,
    k595Count: k595.length,
    matched: matched.length,
    ambiguous: ambiguous.length,
    unmatched: unmatched.length,
    note: 'DRY-RUN only. Does not write emp_id / employee_no / 776.',
    samples: {
      matched: matched.slice(0, 5),
      ambiguous: ambiguous.slice(0, 10),
      unmatched: unmatched.slice(0, 10),
    },
    ambiguousFull: ambiguous,
    unmatchedFull: unmatched,
  };
  const outPath = path.join(OUT_DIR, `match-dry-run-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  const md = [
    '# 社員名簿 Excel↔595 突合 dry-run',
    '',
    `- 生成: ${report.generatedAt}`,
    `- Excel: \`${EXCEL}\` / sheet=${sheetName}`,
    `- Excel行: 全${excelAll.length}（本務${excelPrimary.length} / 兼務扱${excelAll.length - excelPrimary.length}）`,
    `- 595件数: ${k595.length}`,
    `- **一致**: ${matched.length}`,
    `- **曖昧**: ${ambiguous.length}`,
    `- **未ヒット**: ${unmatched.length}`,
    '',
    '## 注意',
    '- **書込なし**（dry-run）',
    '- **emp_id 不触**',
    '- 適用は浜田目視後に別コマンドで実施',
    '',
    `詳細JSON: \`${path.relative(ROOT, outPath)}\``,
    '',
  ].join('\n');
  const mdPath = path.join(OUT_DIR, `match-dry-run-${stamp}.md`);
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log(md);
  console.log(`[employee-roster:match-dry-run] OK json=${outPath}`);
}

main().catch((e) => {
  console.error('[employee-roster:match-dry-run] FAIL', e);
  process.exit(1);
});
