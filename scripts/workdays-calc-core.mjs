/**
 * 工事稼働日数算出 — 計算コア（Excel 準拠 / Option A / 祝日マスタ）
 * テスト: node scripts/workdays-calc-test.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const __holidayJson = JSON.parse(
  readFileSync(path.join(__root, 'scripts/data/jp-holidays.json'), 'utf8'),
);
/** @type {Record<string, true>} */
const JP_HOLIDAY_YMD = Object.fromEntries(__holidayJson.dates.map((d) => [d, true]));

// BROWSER_CORE_START

/** @param {number} y @param {number} m 1-12 */
export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0, 12)).getUTCDate();
}

/** @param {string} iso YYYY-MM-DD */
export function parseIsoDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

/** @param {{y:number,mo:number,d:number}} p */
export function toIso(p) {
  return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** @param {Date} start @param {Date} end @param {number} y @param {number} m */
export function overlapDays(start, end, y, m) {
  const ms = new Date(Date.UTC(y, m - 1, 1, 12));
  const me = new Date(Date.UTC(y, m - 1, daysInMonth(y, m), 12));
  const s = start > ms ? start : ms;
  const e = end < me ? end : me;
  if (s > e) return 0;
  return Math.round((e - s) / 86400000) + 1;
}

/** @param {number} year */
export function nationalHolidaySet(year) {
  const set = new Set();
  const prefix = `${year}-`;
  for (const iso of Object.keys(JP_HOLIDAY_YMD)) {
    if (iso.startsWith(prefix)) set.add(iso);
  }
  return set;
}

/**
 * Option A: 着工〜完工 ∩ 暦月 の休日内訳（土日・平日祝日）
 * @param {Date} start @param {Date} end @param {number} y @param {number} m
 */
export function holidayBreakdownInRange(start, end, y, m) {
  const hol = nationalHolidaySet(y);
  const dim = daysInMonth(y, m);
  const ms = new Date(Date.UTC(y, m - 1, 1, 12));
  const me = new Date(Date.UTC(y, m - 1, dim, 12));
  const s = start > ms ? start : ms;
  const e = end < me ? end : me;
  let weekends = 0;
  let weekdayHol = 0;
  if (s > e) return { C: 0, weekends: 0, weekdayHol: 0 };
  for (let d = 1; d <= dim; d += 1) {
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    if (dt < s || dt > e) continue;
    const dow = dt.getUTCDay();
    const iso = toIso({ y, mo: m, d });
    if (dow === 0 || dow === 6) weekends += 1;
    else if (hol.has(iso)) weekdayHol += 1;
  }
  const C = overlapDays(start, end, y, m);
  return { C, weekends, weekdayHol };
}

/**
 * 建設年度（4月始まり）の暦月 m (1-12) → 西暦年
 * @param {number} fiscalYear
 * @param {number} m 1-12
 */
export function calendarYearForDashboardMonth(fiscalYear, m) {
  return m >= 4 ? fiscalYear : fiscalYear + 1;
}

/**
 * Option A: 工期範囲内の日のみ ※1 をカウント
 * @param {Array<{date:string,value:number}>} rows
 * @param {Date} start @param {Date} end @param {number} y @param {number} m
 */
export function weatherCountGeInRange(rows, threshold, start, end, y, m) {
  let count = 0;
  for (const { date, value } of rows) {
    if (value == null || Number.isNaN(value)) continue;
    if (value < threshold) continue;
    const p = parseIsoDate(date);
    if (!p || p.y !== y || p.mo !== m) continue;
    const dt = new Date(Date.UTC(p.y, p.mo - 1, p.d, 12));
    if (dt < start || dt > end) continue;
    count += 1;
  }
  return count;
}

/**
 * @param {number} m 1-12
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>|Record<number,{gw?:number,summer?:number,nye?:number}>} manual
 */
export function manualHolidayForMonth(m, manual) {
  if (!manual) return { gw: 0, summer: 0, nye: 0 };
  if (Array.isArray(manual)) {
    const hit = manual.find((r) => r.m === m);
    return {
      gw: hit && hit.gw != null ? Number(hit.gw) || 0 : 0,
      summer: hit && hit.summer != null ? Number(hit.summer) || 0 : 0,
      nye: hit && hit.nye != null ? Number(hit.nye) || 0 : 0,
    };
  }
  const hit = manual[m];
  return {
    gw: hit && hit.gw != null ? Number(hit.gw) || 0 : 0,
    summer: hit && hit.summer != null ? Number(hit.summer) || 0 : 0,
    nye: hit && hit.nye != null ? Number(hit.nye) || 0 : 0,
  };
}

/**
 * Excel ※2–④（Option A: 暦日・休日・※1 はすべて工期範囲内）
 * @param {object} p
 * @param {string} p.startDate
 * @param {string} p.endDate
 * @param {number} p.fiscalYear
 * @param {number} p.windTh
 * @param {number} p.rainTh
 * @param {Array<{date:string,value:number}>} p.wind
 * @param {Array<{date:string,value:number}>} p.rain
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>} [p.holidayManual]
 */
export function calcWorkdays(p) {
  const sp = parseIsoDate(p.startDate);
  const ep = parseIsoDate(p.endDate);
  if (!sp || !ep) throw new Error('着工日・完工日を YYYY-MM-DD で指定してください');
  const start = new Date(Date.UTC(sp.y, sp.mo - 1, sp.d, 12));
  const end = new Date(Date.UTC(ep.y, ep.mo - 1, ep.d, 12));
  if (start > end) throw new Error('着工日は完工日以前にしてください');

  const monthly = [];

  for (let m = 1; m <= 12; m += 1) {
    const calYear = calendarYearForDashboardMonth(p.fiscalYear, m);
    const { C, weekends, weekdayHol } = holidayBreakdownInRange(start, end, calYear, m);
    const man = manualHolidayForMonth(m, p.holidayManual);
    const gw = man.gw;
    const summer = man.summer;
    const nye = man.nye;
    const D = weekends + weekdayHol + gw + summer + nye;

    const E =
      C > 0 ? weatherCountGeInRange(p.wind, p.windTh, start, end, calYear, m) : 0;
    const W =
      C > 0 ? weatherCountGeInRange(p.rain, p.rainTh, start, end, calYear, m) : 0;

    const G = C ? (D * E) / C : 0;
    const I = C - (D + E - G);
    const H_rate = I ? (D + E - G) / I : 0;
    const N = I;

    const J = C ? (D * W) / C : 0;
    const L = C - (D + W - J);
    const K_rate = L ? (D + W - J) / L : 0;
    const O = L;

    monthly.push({
      m,
      calYear,
      C,
      D,
      weekends,
      weekdayHol,
      gw,
      summer,
      nye,
      E,
      W,
      G,
      J,
      N,
      O,
      H_rate,
      K_rate,
      scaffoldAvail: I,
      paintAvail: L,
    });
  }

  const scaffold = monthly.reduce((s, r) => s + r.N, 0);
  const paint = monthly.reduce((s, r) => s + r.O, 0);

  return { scaffold, paint, monthly };
}

export function inferFiscalYear(startDate) {
  const p = parseIsoDate(startDate);
  if (!p) return new Date().getFullYear();
  return p.mo >= 4 ? p.y : p.y - 1;
}

/** ビルド用: 祝日マスタを JS オブジェクトリテラル文字列で返す */
export function jpHolidayYmdForBundle() {
  return JP_HOLIDAY_YMD;
}
