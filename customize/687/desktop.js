/**
 * 工事稼働日数算出（687）— SPEC-v1 準拠
 *   npm run deploy:687
 * 計算コア同期: scripts/workdays-calc-core.mjs（node scripts/workdays-build-desktop.mjs）
 */
(function () {
  'use strict';

  const BUILD = '2026-05-17-687-dash-link-v1';


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

function nthWeekdayOfMonth(y, m, weekday, n) {
  let count = 0;
  for (let d = 1; d <= daysInMonth(y, m); d += 1) {
    const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
    if (dow === weekday) {
      count += 1;
      if (count === n) return d;
    }
  }
  return null;
}

function equinoxDay(y, spring) {
  const base = spring ? 20.8431 : 23.2488;
  return Math.floor(base + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
}

/** 国民の祝日（日付キー YYYY-MM-DD） */
  function nationalHolidaySet(year) {
  const set = new Set();
  const add = (mo, d) => set.add(toIso({ y: year, mo, d }));

  add(1, 1);
  const jan2 = nthWeekdayOfMonth(year, 1, 1, 2);
  if (jan2) add(1, jan2);
  add(2, 11);
  const feb23 = nthWeekdayOfMonth(year, 2, 1, 3);
  if (feb23) add(2, feb23);
  add(3, equinoxDay(year, true));
  add(4, 29);
  add(5, 3);
  add(5, 4);
  add(5, 5);
  const jul3 = nthWeekdayOfMonth(year, 7, 1, 3);
  if (jul3) add(7, jul3);
  add(8, 11);
  const sep3 = nthWeekdayOfMonth(year, 9, 1, 3);
  if (sep3) add(9, sep3);
  add(9, equinoxDay(year, false));
  const oct2 = nthWeekdayOfMonth(year, 10, 1, 2);
  if (oct2) add(10, oct2);
  add(11, 3);
  add(11, 23);

  // 振替休日（日曜の祝日 → 翌日以降で最初の非祝日平日）
  const sorted = [...set].sort();
  for (const iso of sorted) {
    const p = parseIsoDate(iso);
    if (!p) continue;
    const dow = new Date(Date.UTC(p.y, p.mo - 1, p.d, 12)).getUTCDay();
    if (dow !== 0) continue;
    for (let off = 1; off < 8; off += 1) {
      const nd = new Date(Date.UTC(p.y, p.mo - 1, p.d + off, 12));
      const ni = toIso({ y: nd.getUTCFullYear(), mo: nd.getUTCMonth() + 1, d: nd.getUTCDate() });
      if (!set.has(ni)) {
        set.add(ni);
        break;
      }
    }
  }

  return set;
}

/** 暦月の休日計 K = 土日 + 平日祝日（G〜J は 0 想定） */
  function holidayTotalForMonth(y, m) {
  const hol = nationalHolidaySet(y);
  let weekends = 0;
  let weekdayHol = 0;
  const dim = daysInMonth(y, m);
  for (let d = 1; d <= dim; d += 1) {
    const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
    const iso = toIso({ y, mo: m, d });
    if (dow === 0 || dow === 6) weekends += 1;
    else if (hol.has(iso)) weekdayHol += 1;
  }
  return { C: dim, K: weekends + weekdayHol, weekends, weekdayHol };
}

/**
 * 建設年度（4月始まり）の暦月 m (1-12) → 西暦年
 * @param {number} fiscalYear 03!C4
 * @param {number} m 1-12（ダッシュボード暦月）
 */
  function calendarYearForDashboardMonth(fiscalYear, m) {
  return m >= 4 ? fiscalYear : fiscalYear + 1;
}

/** @param {Array<{date:string,value:number}>} rows */
  function monthlyCountGe(rows, threshold) {
  const acc = new Map();
  for (const { date, value } of rows) {
    if (value == null || Number.isNaN(value)) continue;
    if (value < threshold) continue;
    const p = parseIsoDate(date);
    if (!p) continue;
    const key = `${p.y}-${p.mo}`;
    acc.set(key, (acc.get(key) || 0) + 1);
  }
  return acc;
}

/** @param {Array<{date:string,value:number}>} rain @param {Array<{date:string,value:number}>} hum */
  function weatherUnionCount(rain, hum, y, m, rainTh, humTh) {
  const bad = new Set();
  for (const { date, value } of rain) {
    const p = parseIsoDate(date);
    if (!p || p.y !== y || p.mo !== m) continue;
    if (value >= rainTh) bad.add(date);
  }
  for (const { date, value } of hum) {
    const p = parseIsoDate(date);
    if (!p || p.y !== y || p.mo !== m) continue;
    if (value >= humTh) bad.add(date);
  }
  return bad.size;
}

/**
 * @param {object} p
 * @param {string} p.startDate YYYY-MM-DD
 * @param {string} p.endDate
 * @param {number} p.fiscalYear
 * @param {number} p.windTh
 * @param {number} p.rainTh
 * @param {number} p.humTh
 * @param {Array<{date:string,value:number}>} p.wind
 * @param {Array<{date:string,value:number}>} p.rain
 * @param {Array<{date:string,value:number}>} p.hum
 */
  function calcWorkdays(p) {
  const sp = parseIsoDate(p.startDate);
  const ep = parseIsoDate(p.endDate);
  if (!sp || !ep) throw new Error('着工日・完工日を YYYY-MM-DD で指定してください');
  const start = new Date(Date.UTC(sp.y, sp.mo - 1, sp.d, 12));
  const end = new Date(Date.UTC(ep.y, ep.mo - 1, ep.d, 12));
  if (start > end) throw new Error('着工日は完工日以前にしてください');

  const windM = monthlyCountGe(p.wind, p.windTh);
  const monthly = [];

  for (let m = 1; m <= 12; m += 1) {
    const calYear = calendarYearForDashboardMonth(p.fiscalYear, m);
    const { C, K: D } = holidayTotalForMonth(calYear, m);
    const key = `${calYear}-${m}`;
    const E = windM.get(key) || 0;
    const W = weatherUnionCount(p.rain, p.hum, calYear, m, p.rainTh, p.humTh);

    const G = C ? (D * E) / C : 0;
    const I = C - (D + E - G);
    const H_rate = I ? (D + E - G) / I : 0;

    const J = C ? (D * W) / C : 0;
    const L = C - (D + W - J);
    const K_rate = L ? (D + W - J) / L : 0;

    const M = overlapDays(start, end, calYear, m);
    const N = M * (1 - H_rate);
    const O = M * (1 - K_rate);

    monthly.push({ m, calYear, C, D, E, W, M, N, O, H_rate, K_rate });
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
