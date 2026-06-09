/**
 * 工事稼働日数算出（687）— Excel 準拠 / Option A
 *   npm run deploy:687
 * 計算コア: scripts/workdays-calc-core.mjs
 */
(function () {
  'use strict';

  const BUILD = '2026-06-09-687-workdays-excel-v1';

  const JP_HOLIDAY_YMD = {"2024-01-01":true,"2024-01-08":true,"2024-02-11":true,"2024-02-12":true,"2024-02-23":true,"2024-03-20":true,"2024-04-29":true,"2024-05-03":true,"2024-05-04":true,"2024-05-05":true,"2024-05-06":true,"2024-07-15":true,"2024-08-11":true,"2024-08-12":true,"2024-09-16":true,"2024-09-22":true,"2024-09-23":true,"2024-10-14":true,"2024-11-03":true,"2024-11-04":true,"2024-11-23":true,"2025-01-01":true,"2025-01-13":true,"2025-02-11":true,"2025-02-23":true,"2025-02-24":true,"2025-03-20":true,"2025-04-29":true,"2025-05-03":true,"2025-05-04":true,"2025-05-05":true,"2025-05-06":true,"2025-07-21":true,"2025-08-11":true,"2025-09-15":true,"2025-09-23":true,"2025-10-13":true,"2025-11-03":true,"2025-11-23":true,"2025-11-24":true,"2026-01-01":true,"2026-01-12":true,"2026-02-11":true,"2026-02-23":true,"2026-03-20":true,"2026-04-29":true,"2026-05-03":true,"2026-05-04":true,"2026-05-05":true,"2026-05-06":true,"2026-07-20":true,"2026-08-11":true,"2026-09-21":true,"2026-09-22":true,"2026-09-23":true,"2026-10-12":true,"2026-11-03":true,"2026-11-23":true,"2027-01-01":true,"2027-01-11":true,"2027-02-11":true,"2027-02-23":true,"2027-03-21":true,"2027-04-29":true,"2027-05-03":true,"2027-05-04":true,"2027-05-05":true,"2027-07-19":true,"2027-08-11":true,"2027-09-20":true,"2027-09-23":true,"2027-10-11":true,"2027-11-03":true,"2027-11-23":true,"2028-01-01":true,"2028-01-10":true,"2028-02-11":true,"2028-02-23":true,"2028-03-20":true,"2028-04-29":true,"2028-05-03":true,"2028-05-04":true,"2028-05-05":true,"2028-07-17":true,"2028-08-11":true,"2028-09-18":true,"2028-09-22":true,"2028-10-09":true,"2028-11-03":true,"2028-11-23":true,"2029-01-01":true,"2029-01-08":true,"2029-02-11":true,"2029-02-12":true,"2029-02-23":true,"2029-03-20":true,"2029-04-29":true,"2029-04-30":true,"2029-05-03":true,"2029-05-04":true,"2029-05-05":true,"2029-07-16":true,"2029-08-11":true,"2029-09-17":true,"2029-09-23":true,"2029-09-24":true,"2029-10-08":true,"2029-11-03":true,"2029-11-23":true,"2030-01-01":true,"2030-01-14":true,"2030-02-11":true,"2030-02-23":true,"2030-03-20":true,"2030-04-29":true,"2030-05-03":true,"2030-05-04":true,"2030-05-05":true,"2030-05-06":true,"2030-07-15":true,"2030-08-11":true,"2030-09-16":true,"2030-09-23":true,"2030-10-14":true,"2030-11-03":true,"2030-11-04":true,"2030-11-23":true};



/** @param {number} y @param {number} m 1-12 */
  function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0, 12)).getUTCDate();
}

/** @param {string} iso YYYY-MM-DD */
  function parseIsoDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

/** @param {{y:number,mo:number,d:number}} p */
  function toIso(p) {
  return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** @param {Date} start @param {Date} end @param {number} y @param {number} m */
  function overlapDays(start, end, y, m) {
  const ms = new Date(Date.UTC(y, m - 1, 1, 12));
  const me = new Date(Date.UTC(y, m - 1, daysInMonth(y, m), 12));
  const s = start > ms ? start : ms;
  const e = end < me ? end : me;
  if (s > e) return 0;
  return Math.round((e - s) / 86400000) + 1;
}

/** @param {number} year */
  function nationalHolidaySet(year) {
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
  function holidayBreakdownInRange(start, end, y, m) {
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
  function calendarYearForDashboardMonth(fiscalYear, m) {
  return m >= 4 ? fiscalYear : fiscalYear + 1;
}

/**
 * Option A: 工期範囲内の日のみ ※1 をカウント
 * @param {Array<{date:string,value:number}>} rows
 * @param {Date} start @param {Date} end @param {number} y @param {number} m
 */
  function weatherCountGeInRange(rows, threshold, start, end, y, m) {
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
  function manualHolidayForMonth(m, manual) {
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
  function calcWorkdays(p) {
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
    const N = I;

    const J = C ? (D * W) / C : 0;
    const L = C - (D + W - J);
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
      N,
      O,
      scaffoldAvail: I,
      paintAvail: L,
    });
  }

  const scaffold = monthly.reduce((s, r) => s + r.N, 0);
  const paint = monthly.reduce((s, r) => s + r.O, 0);

  return { scaffold, paint, monthly };
}

  function inferFiscalYear(startDate) {
  const p = parseIsoDate(startDate);
  if (!p) return new Date().getFullYear();
  return p.mo >= 4 ? p.y : p.y - 1;
}

/** ビルド用: 祝日マスタを JS オブジェクトリテラル文字列で返す */
  function jpHolidayYmdForBundle() {
  return JP_HOLIDAY_YMD;
}

  const APP_DASH = 688;
  const SHOW_EVENTS = ['app.record.create.show', 'app.record.edit.show', 'app.record.detail.show'];

  function dashUrl(recordId) {
    const base = '/k/' + APP_DASH + '/';
    if (recordId) return base + '?workdays_record=' + encodeURIComponent(String(recordId));
    return base;
  }

  function ensureDashLink(event) {
    if (document.getElementById('workdays687-dash-link')) return;
    const header = kintone.app.record.getHeaderMenuSpaceElement();
    if (!header) return;

    const bar = document.createElement('div');
    bar.id = 'workdays687-dash-link';
    bar.style.cssText =
      'margin:8px 0;padding:12px 16px;background:#e8f4fc;border:1px solid #3498db;border-radius:6px;font-size:14px;';

    const rid =
      event.record && event.record.$id && event.record.$id.value != null
        ? String(event.record.$id.value)
        : null;

    bar.innerHTML =
      '<strong>日常の入力・算出はダッシュボード（アプリ ' +
      APP_DASH +
      '）から行ってください。</strong><br>' +
      '<a href="' +
      dashUrl(rid) +
      '" style="font-weight:bold">→ 工事稼働日数ダッシュを開く</a>' +
      ' <span style="font-size:11px;color:#666">BUILD=' +
      BUILD +
      '</span>';

    header.appendChild(bar);
  }

  kintone.events.on(SHOW_EVENTS, function (event) {
    ensureDashLink(event);
    return event;
  });

})();
