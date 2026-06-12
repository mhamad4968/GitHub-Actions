/**
 * 業務改善 新⑤ 年次集計ロジック（Q-ANN-03 / Q-ANN-09）
 * Node verify と browser customize で同一ルールを共有する。
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEPT_ORDER_PATH = path.join(__dirname, '..', 'data', 'business-improvement-annual-department-order.json');

export const FISCAL_MONTHS = ['carryover', '5', '6', '7', '8', '9', '10', '11', '12', '1', '2', '3', '4'];
export const FISCAL_MONTH_LABELS = {
  carryover: '前年度繰越',
  5: '5月', 6: '6月', 7: '7月', 8: '8月', 9: '9月', 10: '10月', 11: '11月', 12: '12月',
  1: '1月', 2: '2月', 3: '3月', 4: '4月',
};

export function loadDepartmentOrder() {
  return JSON.parse(readFileSync(DEPT_ORDER_PATH, 'utf8'));
}

export function fiscalYearLabel(yearKey) {
  const y = Number(yearKey);
  return `${y}年度（${y}/5/1〜${y + 1}/4/30）`;
}

export function fiscalYearStartISO(yearKey) {
  return `${Number(yearKey)}-05-01`;
}

export function fiscalYearEndISO(yearKey) {
  return `${Number(yearKey) + 1}-04-30`;
}

export function parseISODate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]), iso: `${m[1]}-${m[2]}-${m[3]}` };
}

export function compareISO(a, b) {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 完了日が無い既存レコード向けフォールバック（更新日時の日付部分） */
export function resolveCompletionDate(rec) {
  const direct = rec.完了日?.value || rec.completedDate;
  if (direct) return String(direct).slice(0, 10);
  const updated = rec.更新日時?.value || rec.updatedAt;
  if (updated) return String(updated).slice(0, 10);
  return null;
}

export function isDoneStatus(rec) {
  const st = rec.Status?.value || rec.status || rec.ステータス?.value;
  return st === 'Done' || st === 'done' || st === '完了';
}

export function proposalTypeKey(typeVal) {
  return typeVal === 'アイデア提案' ? 'idea' : 'biz';
}

export function monthBucketForRecord(rec, yearKey) {
  const fyStart = fiscalYearStartISO(yearKey);
  const completed = resolveCompletionDate(rec);
  const submitted = rec.提案日?.value || rec.proposalDate || '';
  if (!completed) return null;
  if (compareISO(completed, fyStart) < 0) return null;
  const fyEnd = fiscalYearEndISO(yearKey);
  if (compareISO(completed, fyEnd) > 0) return null;
  if (submitted && compareISO(submitted, fyStart) < 0) return 'carryover';
  const mo = parseISODate(completed)?.mo;
  if (!mo) return null;
  return String(mo);
}

export function deptSortIndex(dept, order) {
  const name = String(dept || '').trim();
  if (!name) return [3, name];
  const ho = order.headOffice.indexOf(name);
  if (ho >= 0) return [0, ho, name];
  const br = order.branchesAndOffices.indexOf(name);
  if (br >= 0) return [1, br, name];
  return [2, name];
}

export function compareDept(a, b, order) {
  const ia = deptSortIndex(a, order);
  const ib = deptSortIndex(b, order);
  for (let i = 0; i < 3; i += 1) {
    if (ia[i] === ib[i]) continue;
    if (typeof ia[i] === 'string' || typeof ib[i] === 'string') {
      return String(ia[i]).localeCompare(String(ib[i]), 'ja');
    }
    return ia[i] - ib[i];
  }
  return 0;
}

function emptyMonthCounts() {
  const o = {};
  FISCAL_MONTHS.forEach((m) => { o[m] = { biz: 0, idea: 0, recordIds: { biz: [], idea: [] } }; });
  return o;
}

function emptyRankCell() {
  return { count: 0, points: 0, recordIds: [] };
}

function rankKey(rank) {
  const r = String(rank || '').trim().toUpperCase();
  if (r === 'A' || r === 'B' || r === 'C') return r;
  return null;
}

/**
 * @param {object[]} records — 新①レコード（plain value 形式）
 * @param {number|string} yearKey
 * @param {string} closingDateISO — 締処理日 YYYY-MM-DD
 * @param {object} [order] — department order json
 */
export function aggregateAnnual(records, yearKey, closingDateISO, order = loadDepartmentOrder()) {
  const closing = closingDateISO || fiscalYearEndISO(yearKey);
  const included = [];
  const table1 = emptyMonthCounts();
  const employeeMap = new Map();
  const detail = [];

  records.forEach((rec) => {
    if (!isDoneStatus(rec)) return;
    const completed = resolveCompletionDate(rec);
    if (!completed || compareISO(completed, closing) > 0) return;
    const bucket = monthBucketForRecord(rec, yearKey);
    if (!bucket || !FISCAL_MONTHS.includes(bucket)) return;

    const recordId = rec.$id?.value ?? rec.$id ?? rec.recordId;
    const typeVal = rec.提案種別?.value ?? rec.proposalType ?? '';
    const typeKey = proposalTypeKey(typeVal);
    const rank = rankKey(rec.表彰ランク_最終?.value ?? rec.finalRank);
    const points = Number(rec.付与ポイント?.value ?? rec.points ?? 0) || 0;
    const title = rec.提案件名?.value ?? rec.title ?? '';
    const submitDate = rec.提案日?.value ?? rec.proposalDate ?? '';
    const proposers = rec.提案者一覧?.value ?? rec.proposers ?? [];

    table1[bucket][typeKey] += 1;
    table1[bucket].recordIds[typeKey].push(String(recordId));

    included.push({ recordId: String(recordId), bucket, typeKey, rank, points });

    (proposers || []).forEach((row) => {
      const rv = row.value || row;
      const dept = rv.提案者所属?.value ?? rv.dept ?? '';
      const name = rv.提案者名?.value ?? rv.name ?? '';
      if (!name) return;
      const empKey = `${dept}\t${name}`;
      if (!employeeMap.has(empKey)) {
        employeeMap.set(empKey, {
          dept, name, A: emptyRankCell(), B: emptyRankCell(), C: emptyRankCell(), totalPoints: 0,
        });
      }
      const emp = employeeMap.get(empKey);
      if (rank) {
        emp[rank].count += 1;
        emp[rank].points += points;
        emp[rank].recordIds.push(String(recordId));
      }
      emp.totalPoints += points;

      detail.push({
        recordId: String(recordId),
        dept,
        name,
        type: typeVal,
        title,
        submitDate,
        rank: rank || '',
        points,
      });
    });
  });

  detail.sort((a, b) => {
    const d = compareDept(a.dept, b.dept, order);
    if (d !== 0) return d;
    return compareISO(a.submitDate, b.submitDate);
  });

  const table2 = [...employeeMap.values()].sort((a, b) => {
    const d = compareDept(a.dept, b.dept, order);
    if (d !== 0) return d;
    return String(a.name).localeCompare(String(b.name), 'ja');
  });

  const auditCount = records.filter((rec) => {
    if (!isDoneStatus(rec)) return false;
    const completed = resolveCompletionDate(rec);
    return completed && compareISO(completed, closing) <= 0;
  }).length;

  return {
    version: '2026-06-13',
    yearKey: Number(yearKey),
    closingDate: closing,
    generatedAt: new Date().toISOString(),
    counts: {
      aggregated: included.length,
      auditAllDoneByClose: auditCount,
    },
    table1,
    table2,
    detail,
    includedRecordIds: included.map((x) => x.recordId),
  };
}

export function countsMatch(result) {
  return result.counts.aggregated === result.counts.auditAllDoneByClose;
}
