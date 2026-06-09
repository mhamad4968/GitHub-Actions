#!/usr/bin/env node
/** R4 — workdays 計算コアの最小回帰（Option A・月ソート・年合計式） */
import { calcWorkdays } from './workdays-calc-core.mjs';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function sortMonthlyForDisplay(monthly) {
  return monthly
    .filter((r) => r.C > 0)
    .sort((a, b) => (a.calYear !== b.calYear ? a.calYear - b.calYear : a.m - b.m));
}

function computeYearTotals(rows, isWind) {
  const sum = (key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  const C = sum('C');
  const D = sum('D');
  const weather = isWind ? sum('E') : sum('W');
  const overlap = C ? (D * weather) / C : 0;
  const avail = C - (D + weather - overlap);
  const rate = avail ? (D + weather - overlap) / avail : 0;
  return { C, D, weather, overlap, avail, rate };
}

const result = calcWorkdays({
  startDate: '2026-05-15',
  endDate: '2027-03-20',
  fiscalYear: 2026,
  windTh: 10,
  rainTh: 10,
  wind: [{ date: '2026-06-01', value: 12 }],
  rain: [{ date: '2026-06-01', value: 12 }],
  holidayManual: [{ m: 5, gw: 0, summer: 0, nye: 0 }],
});

const rows = sortMonthlyForDisplay(result.monthly);
assert(rows.length >= 2, 'expected at least 2 months in range');
for (let i = 1; i < rows.length; i += 1) {
  const a = rows[i - 1];
  const b = rows[i];
  const ok = a.calYear < b.calYear || (a.calYear === b.calYear && a.m < b.m);
  assert(ok, `month sort broken: ${a.calYear}-${a.m} before ${b.calYear}-${b.m}`);
}

const may = rows.find((r) => r.m === 5 && r.calYear === 2026);
assert(may && may.C === 17, `May 2026 C expected 17 (5/15-5/31), got ${may?.C}`);

const yt = computeYearTotals(rows, true);
const expectedOverlap = yt.C ? (yt.D * yt.weather) / yt.C : 0;
assert(Math.abs(yt.overlap - expectedOverlap) < 1e-9, 'year overlap formula');
const expectedAvail = yt.C - (yt.D + yt.weather - yt.overlap);
assert(Math.abs(yt.avail - expectedAvail) < 1e-9, 'year avail formula');

console.log('[workdays-calc-gate] OK');
