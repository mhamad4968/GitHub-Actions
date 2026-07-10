/**
 * 688 猛暑日（WBGT）— 参考表示専用（稼働計算コアとは分離）
 * WBGT≥31 の時間数 ÷ 8h → 月別換算日数 → 過去5年平均
 */
import { build5yrMonthlyAverages, pastFiveYearsForEstimate } from './workdays-calc-core.mjs';

export const HEAT_WBGT_THRESHOLD = 31;
export const HEAT_HOURS_PER_DAY = 8;
export const HEAT_REF5YR_KEY = 'heat_ge31_wbgt';

/** @param {string} s */
export function normalizeWbgtDate(s) {
  const raw = String(s || '').trim();
  let m = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(raw);
  if (m) {
    return m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
  }
  m = /^(\d{4})(\d{2})(\d{2})$/.exec(raw.replace(/\D/g, ''));
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  return null;
}

/**
 * 環境省 WBGT CSV（時間別）をパース
 * @param {string} text
 * @returns {Array<{date:string,hour:number,value:number}>}
 */
export function parseCsvWbgtHourly(text) {
  const lines = String(text).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  let start = 0;
  for (let i = 0; i < Math.min(lines.length, 12); i += 1) {
    const line = lines[i].trim();
    if (/日付/.test(line) && /時間|時刻/.test(line)) {
      start = i + 1;
      break;
    }
  }
  const rows = [];
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(/,/).map(function (c) {
      return c.trim().replace(/^"|"$/g, '');
    });
    if (cols.length < 3) continue;
    if (/日付|ダウンロード/i.test(cols[0])) continue;
    const date = normalizeWbgtDate(cols[0]);
    const hourPart = String(cols[1] || '').trim();
    const hourMatch = /^(\d{1,2})/.exec(hourPart);
    const hour = hourMatch ? Number(hourMatch[1]) : NaN;
    const val = parseFloat(String(cols[2]).replace(/[^\d.-]/g, ''));
    if (!date || Number.isNaN(hour) || Number.isNaN(val)) continue;
    rows.push({ date: date, hour: hour, value: val });
  }
  return rows;
}

/**
 * 時間別 WBGT → 年月別換算日数（hours≥threshold の合計 ÷ 8）
 * @param {Array<{date:string,value:number}>} rows
 */
export function aggregateHourlyToMonthlyConvertedDays(rows, threshold = HEAT_WBGT_THRESHOLD, hoursPerDay = HEAT_HOURS_PER_DAY) {
  const hourSums = {};
  (rows || []).forEach(function (row) {
    const val = Number(row.value);
    if (Number.isNaN(val) || val < threshold) return;
    const date = normalizeWbgtDate(row.date);
    if (!date) return;
    const y = date.slice(0, 4);
    const m = Number(date.slice(5, 7));
    if (!hourSums[y]) hourSums[y] = {};
    hourSums[y][m] = (hourSums[y][m] || 0) + 1;
  });
  const counts = {};
  Object.keys(hourSums).forEach(function (y) {
    counts[y] = {};
    for (let m = 1; m <= 12; m += 1) {
      const h = hourSums[y][m] || 0;
      counts[y][m] = h / hoursPerDay;
    }
  });
  return counts;
}

/**
 * @param {{ months?: Array<{m:number,byYear?:Record<string,number>}> }} block
 * @param {Record<string, Record<number, number>>} counts year -> month -> converted days
 */
export function mergeMonthlyConvertedIntoHeatBlock(block, counts) {
  const out = block || { label: '>=31 WBGT', threshold: HEAT_WBGT_THRESHOLD, years: [], months: [] };
  if (!out.months) out.months = [];
  const csvYears = Object.keys(counts).sort();
  for (let m = 1; m <= 12; m += 1) {
    let row = out.months.find(function (r) {
      return r.m === m;
    });
    if (!row) {
      row = { m: m, byYear: {} };
      out.months.push(row);
    }
    if (!row.byYear) row.byYear = {};
    csvYears.forEach(function (y) {
      row.byYear[y] = counts[y] && counts[y][m] != null ? counts[y][m] : 0;
    });
  }
  out.months.sort(function (a, b) {
    return a.m - b.m;
  });
  const yearSet = new Set(out.years || []);
  csvYears.forEach(function (y) {
    yearSet.add(y);
  });
  out.months.forEach(function (row) {
    Object.keys(row.byYear || {}).forEach(function (y) {
      yearSet.add(y);
    });
  });
  out.years = Array.from(yearSet).sort();
  out.months.forEach(function (row) {
    const vals = out.years.map(function (y) {
      return Number(row.byYear[y]) || 0;
    });
    row.avg = vals.length ? vals.reduce(function (s, v) { return s + v; }, 0) / vals.length : 0;
  });
  return out;
}

/**
 * @param {object} ref5yr
 * @param {Array<{date:string,value:number}>} hourlyRows
 */
export function mergeWbgtCsvIntoRef5yr(ref5yr, hourlyRows) {
  const out = JSON.parse(JSON.stringify(ref5yr || {}));
  if (!hourlyRows || !hourlyRows.length) return out;
  const counts = aggregateHourlyToMonthlyConvertedDays(hourlyRows);
  out[HEAT_REF5YR_KEY] = mergeMonthlyConvertedIntoHeatBlock(out[HEAT_REF5YR_KEY], counts);
  out.heatPeriod = derivePeriodFromCounts(counts);
  out.updatedFromCsv = new Date().toISOString().slice(0, 10);
  return out;
}

/** @param {Record<string, Record<number, number>>} counts */
function derivePeriodFromCounts(counts) {
  const years = Object.keys(counts).sort();
  if (!years.length) return '';
  if (years.length === 1) return years[0];
  return years[0] + '〜' + years[years.length - 1];
}

/**
 * 687 保存用: 月別換算日数のフラット行
 * @returns {Array<{year:number,month:number,converted_days:number}>}
 */
export function heatBlockToMonthlyRows(block) {
  const rows = [];
  if (!block || !block.months) return rows;
  block.months.forEach(function (row) {
    Object.keys(row.byYear || {}).forEach(function (y) {
      rows.push({
        year: Number(y),
        month: row.m,
        converted_days: Number(row.byYear[y]) || 0,
      });
    });
  });
  return rows.sort(function (a, b) {
    return a.year !== b.year ? a.year - b.year : a.month - b.month;
  });
}

/**
 * @param {Array<{year:number,month:number,converted_days:number}>} monthlyRows
 */
export function monthlyRowsToHeatBlock(monthlyRows) {
  const counts = {};
  (monthlyRows || []).forEach(function (r) {
    const y = String(r.year);
    if (!counts[y]) counts[y] = {};
    counts[y][r.month] = Number(r.converted_days) || 0;
  });
  return mergeMonthlyConvertedIntoHeatBlock(
    { label: '>=31 WBGT', threshold: HEAT_WBGT_THRESHOLD, years: [], months: [] },
    counts,
  );
}

/** @param {object} ref5yr @param {number} estimateYear */
export function buildHeatReferenceAverages(ref5yr, estimateYear) {
  const block = ref5yr && ref5yr[HEAT_REF5YR_KEY];
  if (!block || !block.months || !block.months.length) return null;
  return build5yrMonthlyAverages(block, estimateYear);
}

/** 年間換算日数の5年平均（画像の 12.53日） */
export function buildHeatAnnualReferenceAvg(ref5yr, estimateYear) {
  const block = ref5yr && ref5yr[HEAT_REF5YR_KEY];
  if (!block || !block.months) return null;
  const years = pastFiveYearsForEstimate(estimateYear).map(String);
  const annual = years.map(function (y) {
    let sum = 0;
    block.months.forEach(function (row) {
      sum += Number(row.byYear && row.byYear[y]) || 0;
    });
    return sum;
  });
  if (!annual.length) return null;
  return annual.reduce(function (s, v) { return s + v; }, 0) / annual.length;
}

// BROWSER_HEAT_START
