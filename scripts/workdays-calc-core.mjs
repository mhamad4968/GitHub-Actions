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
 * Option A: 着工〜完工 ∩ 暦月 の休日内訳（土曜自動・日曜自動・祝日）
 * 土日が祝日と重なる日は祝日のみ（二重計上しない）
 * @param {Date} start @param {Date} end @param {number} y @param {number} m
 */
export function holidayBreakdownInRange(start, end, y, m) {
  const hol = nationalHolidaySet(y);
  const dim = daysInMonth(y, m);
  const ms = new Date(Date.UTC(y, m - 1, 1, 12));
  const me = new Date(Date.UTC(y, m - 1, dim, 12));
  const s = start > ms ? start : ms;
  const e = end < me ? end : me;
  let saturdaysAuto = 0;
  let sundays = 0;
  let weekdayHol = 0;
  if (s > e) {
    return { C: 0, saturdaysAuto: 0, sundays: 0, weekdayHol: 0, weekends: 0 };
  }
  for (let d = 1; d <= dim; d += 1) {
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    if (dt < s || dt > e) continue;
    const dow = dt.getUTCDay();
    const iso = toIso({ y, mo: m, d });
    if (hol.has(iso)) weekdayHol += 1;
    else if (dow === 6) saturdaysAuto += 1;
    else if (dow === 0) sundays += 1;
  }
  const C = overlapDays(start, end, y, m);
  const weekends = saturdaysAuto + sundays;
  return { C, saturdaysAuto, sundays, weekdayHol, weekends };
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
 * @param {Array<{m:number,saturday?:number,gw?:number,summer?:number,nye?:number}>|Record<number,{saturday?:number,gw?:number,summer?:number,nye?:number}>} manual
 */
export function manualHolidayForMonth(m, manual) {
  if (!manual) return { saturday: null, gw: 0, summer: 0, nye: 0 };
  if (Array.isArray(manual)) {
    const hit = manual.find((r) => r.m === m);
    return {
      saturday: hit && hit.saturday != null ? Number(hit.saturday) || 0 : null,
      gw: hit && hit.gw != null ? Number(hit.gw) || 0 : 0,
      summer: hit && hit.summer != null ? Number(hit.summer) || 0 : 0,
      nye: hit && hit.nye != null ? Number(hit.nye) || 0 : 0,
    };
  }
  const hit = manual[m];
  return {
    saturday: hit && hit.saturday != null ? Number(hit.saturday) || 0 : null,
    gw: hit && hit.gw != null ? Number(hit.gw) || 0 : 0,
    summer: hit && hit.summer != null ? Number(hit.summer) || 0 : 0,
    nye: hit && hit.nye != null ? Number(hit.nye) || 0 : 0,
  };
}

/**
 * 見積作成年の暦月ごとに土曜自動値（祝日でない土曜）を返す
 * @param {number} estimateYear
 */
export function saturdayAutoByMonthForEstimate(estimateYear) {
  const out = [];
  for (let m = 1; m <= 12; m += 1) {
    const calYear = estimateYear;
    const C = daysInMonth(calYear, m);
    const monthStart = new Date(Date.UTC(calYear, m - 1, 1, 12));
    const monthEnd = new Date(Date.UTC(calYear, m - 1, C, 12));
    const { saturdaysAuto } = holidayBreakdownInRange(monthStart, monthEnd, calYear, m);
    out.push({ m, saturday: saturdaysAuto });
  }
  return out;
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
    const { C, saturdaysAuto, sundays, weekdayHol, weekends } = holidayBreakdownInRange(
      start,
      end,
      calYear,
      m,
    );
    const man = manualHolidayForMonth(m, p.holidayManual);
    const saturday = man.saturday != null ? man.saturday : saturdaysAuto;
    const gw = man.gw;
    const summer = man.summer;
    const nye = man.nye;
    const D = saturday + sundays + weekdayHol + gw + summer + nye;

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
      saturday,
      saturdaysAuto,
      sundays,
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

/** 工期設定資料 p.94 — 小数第2位四捨五入・小数第1位止め */
export function roundWorkdaysPdf1(n) {
  if (n == null || Number.isNaN(n)) return 0;
  return Math.round(Number(n) * 10) / 10;
}

/**
 * 工期設定資料 p.94 雨休率（塗装・ダブり補正あり）
 * O = R×H/C, W = C−H−R+O, P% = round((H+R−O)/W×100)
 * @returns {{ weatherR: number, overlap: number, avail: number, rate: number, ratePct: number }}
 */
export function calcRainHolidayRatePdf(D, weather, C) {
  const H = Number(D) || 0;
  const Cn = Number(C) || 0;
  const weatherR = roundWorkdaysPdf1(weather);
  const overlap = Cn ? roundWorkdaysPdf1((weatherR * H) / Cn) : 0;
  const avail = roundWorkdaysPdf1(Cn - H - weatherR + overlap);
  const numerator = H + weatherR - overlap;
  const rate = avail ? numerator / avail : 0;
  const ratePct = Math.round(rate * 100);
  return { weatherR, overlap, avail, rate, ratePct, numerator };
}

/**
 * Excel 20260613 — 工事稼働日管理表（1〜12月・暦日=各月全日・※1=過去5年平均）
 * @param {object} p
 * @param {number} p.calendarYear 休日・暦日の基準年（西暦）
 * @param {Record<number, number>|Array<{m:number}>} p.weatherByMonth 月1〜12の平均日数
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>} [p.holidayManual]
 */
export function calcWorkdaysExcel20260613(p) {
  const calYear = p.calendarYear;
  const weatherByMonth = p.weatherByMonth || {};
  const monthly = [];

  for (let m = 1; m <= 12; m += 1) {
    const C = daysInMonth(calYear, m);
    const monthStart = new Date(Date.UTC(calYear, m - 1, 1, 12));
    const monthEnd = new Date(Date.UTC(calYear, m - 1, C, 12));
    const { saturdaysAuto, sundays, weekdayHol, weekends } = holidayBreakdownInRange(
      monthStart,
      monthEnd,
      calYear,
      m,
    );
    const man = manualHolidayForMonth(m, p.holidayManual);
    const saturday = man.saturday != null ? man.saturday : saturdaysAuto;
    const gw = man.gw;
    const summer = man.summer;
    const nye = man.nye;
    const D = saturday + sundays + weekdayHol + gw + summer + nye;
    const weather =
      typeof weatherByMonth[m] === 'number'
        ? weatherByMonth[m]
        : weatherByMonth[String(m)] != null
          ? Number(weatherByMonth[String(m)])
          : 0;
    const overlap = C ? (D * weather) / C : 0;
    const avail = C - (D + weather - overlap);
    const rate = avail ? (D + weather - overlap) / avail : 0;

    monthly.push({
      m,
      calYear,
      C,
      D,
      saturday,
      saturdaysAuto,
      sundays,
      weekends,
      weekdayHol,
      gw,
      summer,
      nye,
      E: weather,
      W: weather,
      G: overlap,
      J: overlap,
      N: avail,
      O: avail,
      H_rate: rate,
      K_rate: rate,
      scaffoldAvail: avail,
      paintAvail: avail,
    });
  }

  const totalAvail = monthly.reduce((s, r) => s + r.N, 0);
  return { totalAvail, monthly };
}

/**
 * 見積作成年 Y に対する過去5年（Y-5 〜 Y-1）
 * @param {number} estimateYear
 */
export function pastFiveYearsForEstimate(estimateYear) {
  const y = Number(estimateYear);
  if (!Number.isFinite(y)) throw new Error('見積作成年が不正です');
  return [y - 5, y - 4, y - 3, y - 2, y - 1];
}

/**
 * 参照データから見積作成年に対応する5年月平均を構築
 * @param {{ months?: Array<{m:number,byYear?:Record<string,number>}> }} refBlock
 * @param {number} estimateYear
 */
export function build5yrMonthlyAverages(refBlock, estimateYear) {
  const years = pastFiveYearsForEstimate(estimateYear).map(String);
  const monthRows = refBlock && refBlock.months ? refBlock.months : [];
  const byMonth = {};
  monthRows.forEach(function (r) {
    byMonth[r.m] = r;
  });
  const missingYears = new Set();
  const months = [];

  for (let m = 1; m <= 12; m += 1) {
    const src = byMonth[m] || {};
    const byYear = {};
    let sum = 0;
    years.forEach(function (y) {
      const raw = src.byYear && src.byYear[y] != null ? src.byYear[y] : src.byYear && src.byYear[Number(y)];
      if (raw == null || Number.isNaN(Number(raw))) {
        missingYears.add(y);
        return;
      }
      const v = Number(raw);
      byYear[y] = v;
      sum += v;
    });
    const avg = years.length ? sum / years.length : 0;
    months.push({ m, byYear, years: years.slice(), avg });
  }

  return {
    years,
    months,
    missingYears: years.filter(function (y) {
      return missingYears.has(y);
    }),
  };
}

/**
 * @param {object} p
 * @param {number} p.estimateYear 見積作成年（休日・暦日の基準年）
 * @param {object} p.ref5yr REF5YR 相当
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>} [p.holidayManual]
 */
export function calcWorkdaysBundleForEstimate(p) {
  const wind5 = build5yrMonthlyAverages(p.ref5yr.wind_ge10_ms, p.estimateYear);
  const rain5 = build5yrMonthlyAverages(p.ref5yr.rain_ge10_mm, p.estimateYear);
  const missing = Array.from(new Set(wind5.missingYears.concat(rain5.missingYears))).sort();
  if (missing.length) {
    throw new Error(
      '見積作成年 ' +
        p.estimateYear +
        ' の過去5年（' +
        wind5.years.join('・') +
        '）のうち、参照データにない年があります: ' +
        missing.join(', '),
    );
  }
  const bundle = calcWorkdaysBundle20260613({
    calendarYear: p.estimateYear,
    wind5yrMonths: wind5.months,
    rain5yrMonths: rain5.months,
    holidayManual: p.holidayManual,
  });
  return {
    ...bundle,
    estimateYear: p.estimateYear,
    pastYears: wind5.years,
    wind5yr: wind5,
    rain5yr: rain5,
  };
}

/**
 * @param {object} p
 * @param {number} p.calendarYear
 * @param {Array<{m:number,avg:number}>} p.wind5yrMonths
 * @param {Array<{m:number,avg:number}>} p.rain5yrMonths
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>} [p.holidayManual]
 */
export function calcWorkdaysBundle20260613(p) {
  function toMap(rows) {
    const map = {};
    (rows || []).forEach(function (r) {
      map[r.m] = Number(r.avg) || 0;
    });
    return map;
  }
  const windRes = calcWorkdaysExcel20260613({
    calendarYear: p.calendarYear,
    holidayManual: p.holidayManual,
    weatherByMonth: toMap(p.wind5yrMonths),
  });
  const rainRes = calcWorkdaysExcel20260613({
    calendarYear: p.calendarYear,
    holidayManual: p.holidayManual,
    weatherByMonth: toMap(p.rain5yrMonths),
  });
  return {
    scaffold: windRes.totalAvail,
    paint: rainRes.totalAvail,
    monthlyWind: windRes.monthly,
    monthlyRain: rainRes.monthly,
  };
}

export const REF5YR_WIND_THRESHOLDS = [10, 15, 20, 30];
export const REF5YR_RAIN_THRESHOLDS = [1, 10, 30, 50, 70, 100];

/** @param {'wind'|'rain'} kind @param {number} threshold */
export function ref5yrBlockKey(kind, threshold) {
  return kind === 'wind' ? 'wind_ge' + threshold + '_ms' : 'rain_ge' + threshold + '_mm';
}

/** @param {string} key */
export function ref5yrBlockTitle(key) {
  const titles = {
    wind_ge10_ms: '≧10m/s　月別最大風速',
    wind_ge15_ms: '≧15m/s　月別最大風速',
    wind_ge20_ms: '≧20m/s　月別最大風速',
    wind_ge30_ms: '≧30m/s　月別最大風速',
    rain_ge1_mm: '≧1mm　月別降雨量',
    rain_ge10_mm: '≧10mm　月別降雨量',
    rain_ge30_mm: '≧30mm　月別降雨量',
    rain_ge50_mm: '≧50mm　月別降雨量',
    rain_ge70_mm: '≧70mm　月別降雨量',
    rain_ge100_mm: '≧100mm　月別降雨量',
  };
  return titles[key] || key;
}

/**
 * 日別 CSV 行から閾値別・年月別日数を集計
 * @param {Array<{date:string,value:number}>} rows
 * @param {number} threshold
 */
export function aggregateDailyToMonthlyCounts(rows, threshold) {
  const counts = {};
  (rows || []).forEach(function (row) {
    const p = parseIsoDate(row.date);
    if (!p) return;
    const y = String(p.y);
    if (!counts[y]) counts[y] = {};
    if (counts[y][p.mo] == null) counts[y][p.mo] = 0;
  });
  (rows || []).forEach(function (row) {
    const val = Number(row.value);
    if (Number.isNaN(val) || val < threshold) return;
    const p = parseIsoDate(row.date);
    if (!p) return;
    const y = String(p.y);
    if (!counts[y]) counts[y] = {};
    counts[y][p.mo] = (counts[y][p.mo] || 0) + 1;
  });
  return counts;
}

/**
 * @param {{ months?: Array<{m:number,byYear?:Record<string,number>}> }} block
 * @param {Record<string, Record<number, number>>} counts year -> month -> count
 */
export function mergeMonthlyCountsIntoBlock(block, counts) {
  if (!block.months) block.months = [];
  const csvYears = Object.keys(counts).sort();
  for (let m = 1; m <= 12; m += 1) {
    let row = block.months.find(function (r) {
      return r.m === m;
    });
    if (!row) {
      row = { m: m, byYear: {} };
      block.months.push(row);
    }
    if (!row.byYear) row.byYear = {};
    csvYears.forEach(function (y) {
      row.byYear[y] = counts[y] && counts[y][m] != null ? counts[y][m] : 0;
    });
  }
  block.months.sort(function (a, b) {
    return a.m - b.m;
  });
  const yearSet = new Set(block.years || []);
  csvYears.forEach(function (y) {
    yearSet.add(y);
  });
  block.months.forEach(function (row) {
    Object.keys(row.byYear || {}).forEach(function (y) {
      yearSet.add(y);
    });
  });
  block.years = Array.from(yearSet).sort();
  block.months.forEach(function (row) {
    const vals = block.years.map(function (y) {
      return Number(row.byYear[y]) || 0;
    });
    row.avg = vals.length ? vals.reduce(function (s, v) { return s + v; }, 0) / vals.length : 0;
  });
  return block;
}

/**
 * 日別 CSV から REF5YR 全閾値ブロックを更新（既存年は上書き・他年は維持）
 * @param {object} ref5yr
 * @param {Array<{date:string,value:number}>} rows
 * @param {'wind'|'rain'} kind
 */
export function mergeDailyCsvIntoRef5yr(ref5yr, rows, kind) {
  const out = JSON.parse(JSON.stringify(ref5yr || {}));
  const thresholds = kind === 'wind' ? REF5YR_WIND_THRESHOLDS : REF5YR_RAIN_THRESHOLDS;
  thresholds.forEach(function (th) {
    const key = ref5yrBlockKey(kind, th);
    const counts = aggregateDailyToMonthlyCounts(rows, th);
    if (!rows || !rows.length) return;
    if (!out[key]) {
      out[key] = {
        label: kind === 'wind' ? '>=' + th + 'm/s' : '>=' + th + 'mm',
        threshold: th,
        years: [],
        months: [],
      };
    }
    mergeMonthlyCountsIntoBlock(out[key], counts);
  });
  const allYears = new Set();
  thresholds.forEach(function (th) {
    const key = ref5yrBlockKey(kind, th);
    (out[key] && out[key].years ? out[key].years : []).forEach(function (y) {
      allYears.add(y);
    });
  });
  const span = Array.from(allYears).sort();
  if (span.length) {
    const period = span[0] + '〜' + span[span.length - 1];
    if (kind === 'wind') out.windPeriod = period;
    else out.rainPeriod = period;
  }
  out.updatedFromCsv = new Date().toISOString().slice(0, 10);
  return out;
}

/**
 * @param {object} ref5yr
 * @param {Array<{date:string,value:number}>} windRows
 * @param {Array<{date:string,value:number}>} rainRows
 */
export function rebuildRef5yrFromDailyCsv(ref5yr, windRows, rainRows) {
  let out = JSON.parse(JSON.stringify(ref5yr || {}));
  if (windRows && windRows.length) out = mergeDailyCsvIntoRef5yr(out, windRows, 'wind');
  if (rainRows && rainRows.length) out = mergeDailyCsvIntoRef5yr(out, rainRows, 'rain');
  return out;
}

/** ビルド用: 祝日マスタを JS オブジェクトリテラル文字列で返す */
export function jpHolidayYmdForBundle() {
  return JP_HOLIDAY_YMD;
}
