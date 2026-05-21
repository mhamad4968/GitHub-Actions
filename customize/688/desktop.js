/**
 * 工事稼働日数ダッシュ（688）— データ正本アプリ 687 / SPEC-v1 §6.2
 *   npm run deploy:688
 * 計算コア: scripts/workdays-calc-core.mjs
 */
(function () {
  'use strict';

  const BUILD = '2026-05-17-688-workdays-dash-v4-syntax-fix';


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


  const APP_DATA = 687;
  const FC = {
    project: 'project_name',
    start: 'start_date',
    end: 'end_date',
    obs: 'obs_location',
    obsNote: 'obs_location_note',
    windTh: 'threshold_wind_ms',
    rainTh: 'threshold_rain_mm',
    humTh: 'threshold_humidity_pct',
    fiscal: 'holiday_fiscal_year',
    windTbl: 'wind_data',
    windDate: 'wind_obs_date',
    windVal: 'wind_max_ms',
    rainTbl: 'rain_data',
    rainDate: 'rain_obs_date',
    rainVal: 'rain_mm',
    humTbl: 'humidity_data',
    humDate: 'humidity_obs_date',
    humVal: 'humidity_pct',
    resScaffold: 'result_scaffold_days',
    resPaint: 'result_paint_days',
    calcAt: 'calculated_at',
    note: 'calc_note',
  };

  const OBS_OPTIONS = ['東京', 'さいたま', '熊谷', '宇都宮', '前橋', '横浜', '千葉', 'その他'];
  const JMA_WIND = 'https://www.data.jma.go.jp/gmd/risk/obsdl/';
  const JMA_RAIN_HUM = 'https://www.data.jma.go.jp/risk/obsdl/index.php';
  const SESSION_RECORD_KEY = 'workdays688_last_record_id';

  let state = emptyState();
  let pendingCsvKind = null;

  function emptyState() {
    return {
      recordId: null,
      revision: null,
      dirty: false,
      project_name: '',
      start_date: '',
      end_date: '',
      obs_location: '',
      obs_location_note: '',
      threshold_wind_ms: 10,
      threshold_rain_mm: 10,
      threshold_humidity_pct: 85,
      holiday_fiscal_year: null,
      wind: [],
      rain: [],
      hum: [],
      result_scaffold_days: null,
      result_paint_days: null,
      calculated_at: '',
      lastResult: null,
    };
  }

  function gv(rec, code) {
    return rec[code] && rec[code].value != null ? rec[code].value : '';
  }

  function readSubFromKintone(rec, tbl, dateFc, valFc) {
    const rows = (rec[tbl] && rec[tbl].value) || [];
    const out = [];
    for (let i = 0; i < rows.length; i += 1) {
      const v = rows[i].value || {};
      const date = String(v[dateFc] && v[dateFc].value != null ? v[dateFc].value : '').slice(0, 10);
      const n = Number(v[valFc] && v[valFc].value);
      if (!date || Number.isNaN(n)) continue;
      out.push({ date: date, value: n });
    }
    return out;
  }

  function subToKintone(rows, dateFc, valFc) {
    return rows.map(function (r) {
      const row = { value: {} };
      row.value[dateFc] = { value: r.date };
      row.value[valFc] = { value: String(r.value) };
      return row;
    });
  }

  function stateFromKintone(rec) {
    const s = emptyState();
    s.recordId = rec.$id && rec.$id.value != null ? String(rec.$id.value) : null;
    s.revision = rec.$revision && rec.$revision.value != null ? String(rec.$revision.value) : null;
    s.project_name = String(gv(rec, FC.project));
    s.start_date = String(gv(rec, FC.start)).slice(0, 10);
    s.end_date = String(gv(rec, FC.end)).slice(0, 10);
    s.obs_location = String(gv(rec, FC.obs));
    s.obs_location_note = String(gv(rec, FC.obsNote));
    s.threshold_wind_ms = Number(gv(rec, FC.windTh)) || 10;
    s.threshold_rain_mm = Number(gv(rec, FC.rainTh)) || 10;
    s.threshold_humidity_pct = Number(gv(rec, FC.humTh)) || 85;
    const fy = gv(rec, FC.fiscal);
    s.holiday_fiscal_year = fy !== '' ? Number(fy) : null;
    s.wind = readSubFromKintone(rec, FC.windTbl, FC.windDate, FC.windVal);
    s.rain = readSubFromKintone(rec, FC.rainTbl, FC.rainDate, FC.rainVal);
    s.hum = readSubFromKintone(rec, FC.humTbl, FC.humDate, FC.humVal);
    const rs = gv(rec, FC.resScaffold);
    const rp = gv(rec, FC.resPaint);
    s.result_scaffold_days = rs !== '' ? Number(rs) : null;
    s.result_paint_days = rp !== '' ? Number(rp) : null;
    s.calculated_at = String(gv(rec, FC.calcAt));
    s.dirty = false;
    return s;
  }

  function stateToKintoneRecord(s, includeResults) {
    const rec = {};
    rec[FC.project] = { value: s.project_name };
    rec[FC.start] = { value: s.start_date };
    rec[FC.end] = { value: s.end_date };
    rec[FC.obs] = { value: s.obs_location };
    rec[FC.obsNote] = { value: s.obs_location_note };
    rec[FC.windTh] = { value: String(s.threshold_wind_ms) };
    rec[FC.rainTh] = { value: String(s.threshold_rain_mm) };
    rec[FC.humTh] = { value: String(s.threshold_humidity_pct) };
    if (s.holiday_fiscal_year != null) rec[FC.fiscal] = { value: String(s.holiday_fiscal_year) };
    rec[FC.windTbl] = { value: subToKintone(s.wind, FC.windDate, FC.windVal) };
    rec[FC.rainTbl] = { value: subToKintone(s.rain, FC.rainDate, FC.rainVal) };
    rec[FC.humTbl] = { value: subToKintone(s.hum, FC.humDate, FC.humVal) };
    if (includeResults && s.lastResult) {
      rec[FC.resScaffold] = { value: String(Math.round(s.lastResult.scaffold * 100) / 100) };
      rec[FC.resPaint] = { value: String(Math.round(s.lastResult.paint * 100) / 100) };
      rec[FC.calcAt] = { value: new Date().toISOString() };
      rec[FC.note] = { value: buildCalcNote(s.lastResult, s.lastWarnings || []) };
    }
    return rec;
  }

  function apiGetRecord(id) {
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', { app: APP_DATA, id: id });
  }

  function apiPutRecord(id, revision, record) {
    const body = { app: APP_DATA, id: id, record: record };
    if (revision) body.revision = revision;
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', body);
  }

  function apiPostRecord(record) {
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', { app: APP_DATA, record: record });
  }

  function apiListProjects() {
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: APP_DATA,
      query: 'order by $id desc limit 100',
      fields: [FC.project, FC.start, FC.end, FC.obs, FC.resScaffold, FC.resPaint, '$id'],
    });
  }

  function todayJstYmd() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find(function (p) {
      return p.type === 'year';
    }).value;
    const m = parts.find(function (p) {
      return p.type === 'month';
    }).value;
    const d = parts.find(function (p) {
      return p.type === 'day';
    }).value;
    return y + '-' + m + '-' + d;
  }

  function addDaysIso(iso, days) {
    const p = parseIsoDate(iso);
    if (!p) return iso;
    const t = Date.UTC(p.y, p.mo - 1, p.d + days, 12);
    const nd = new Date(t);
    return toIso({ y: nd.getUTCFullYear(), mo: nd.getUTCMonth() + 1, d: nd.getUTCDate() });
  }

  function normalizeDate(raw) {
    const s = String(raw).trim();
    let m = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(s);
    if (m) {
      return m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
    }
    m = /^(\d{4})(\d{2})(\d{2})$/.exec(s.replace(/\D/g, ''));
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    return null;
  }

  function parseCsvTwoColumn(text) {
    const lines = String(text).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
    const rows = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(/[,\t]/).map(function (c) {
        return c.trim().replace(/^"|"$/g, '');
      });
      if (cols.length < 2) continue;
      if (/日付|年月日|date|風速|降雨|降水|湿度/i.test(cols[0] + cols[1])) continue;
      const date = normalizeDate(cols[0]);
      const val = parseFloat(String(cols[1]).replace(/[^\d.-]/g, ''));
      if (!date || Number.isNaN(val)) continue;
      rows.push({ date: date, value: val });
    }
    return rows;
  }

  function buildCalcNote(result, warnings) {
    const lines = [
      'BUILD=' + BUILD,
      '足場=' + result.scaffold.toFixed(2) + ' / 塗装=' + result.paint.toFixed(2),
      '（688ダッシュ保存・塗装=降雨∪湿度）',
      '',
      '月 | 年 | 暦 | 休 | 風 | 雨湿 | M | 足場N | 塗装O',
    ];
    for (let i = 0; i < result.monthly.length; i += 1) {
      const r = result.monthly[i];
      lines.push(
        [r.m, r.calYear, r.C, r.D, r.E, r.W, r.M.toFixed(0), r.N.toFixed(2), r.O.toFixed(2)].join(' | '),
      );
    }
    if (warnings.length) {
      lines.push('', '【警告】', warnings.join('\n'));
    }
    return lines.join('\n');
  }

  function collectWarnings() {
    const warnings = [];
    if (!state.start_date || !state.end_date) return warnings;
    function rangeWarn(rows, label) {
      if (!rows.length) return;
      let min = rows[0].date;
      let max = rows[0].date;
      for (let i = 1; i < rows.length; i += 1) {
        if (rows[i].date < min) min = rows[i].date;
        if (rows[i].date > max) max = rows[i].date;
      }
      if (min > state.start_date || max < state.end_date) {
        warnings.push(
          label + 'の日付範囲(' + min + '〜' + max + ')が工期を十分カバーしていない可能性があります',
        );
      }
    }
    rangeWarn(state.wind, '風速');
    rangeWarn(state.rain, '降雨');
    rangeWarn(state.hum, '湿度');
    if (!state.obs_location) warnings.push('観測地点が未選択です');
    return warnings;
  }

  function runCalc() {
    if (!state.start_date || !state.end_date) throw new Error('着工日・完工日を入力してください');
    const sp = parseIsoDate(state.start_date);
    const ep = parseIsoDate(state.end_date);
    if (!sp || !ep) throw new Error('日付形式が不正です');
    const s = new Date(Date.UTC(sp.y, sp.mo - 1, sp.d, 12));
    const e = new Date(Date.UTC(ep.y, ep.mo - 1, ep.d, 12));
    if (s > e) throw new Error('着工日は完工日以前にしてください');
    if (!state.wind.length || !state.rain.length || !state.hum.length) {
      throw new Error('風速・降雨・湿度のデータを取込んでください');
    }
    if (state.threshold_humidity_pct < 0 || state.threshold_humidity_pct > 100) {
      throw new Error('湿度閾値は 0〜100 にしてください');
    }
    let fiscal = state.holiday_fiscal_year;
    if (fiscal == null) fiscal = inferFiscalYear(state.start_date);

    const result = calcWorkdays({
      startDate: state.start_date,
      endDate: state.end_date,
      fiscalYear: fiscal,
      windTh: state.threshold_wind_ms,
      rainTh: state.threshold_rain_mm,
      humTh: state.threshold_humidity_pct,
      wind: state.wind,
      rain: state.rain,
      hum: state.hum,
    });
    state.lastResult = result;
    state.lastWarnings = collectWarnings();
    state.result_scaffold_days = Math.round(result.scaffold * 100) / 100;
    state.result_paint_days = Math.round(result.paint * 100) / 100;
    state.holiday_fiscal_year = fiscal;
    state.dirty = true;
    return result;
  }

  function markDirty() {
    state.dirty = true;
    updateDirtyBanner();
  }

  function updateDirtyBanner() {
    const el = document.getElementById('wd688-dirty');
    if (!el) return;
    if (state.dirty) {
      el.textContent = '未保存の変更があります。データ入力・再算出のあと「保存」を押してください。';
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }

  function readFormIntoState() {
    const g = function (id) {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };
    state.project_name = g('wd688-project');
    state.start_date = g('wd688-start');
    state.end_date = g('wd688-end');
    state.obs_location = g('wd688-obs');
    state.obs_location_note = g('wd688-obs-note');
    state.threshold_wind_ms = Number(g('wd688-wind-th')) || 10;
    state.threshold_rain_mm = Number(g('wd688-rain-th')) || 10;
    state.threshold_humidity_pct = Number(g('wd688-hum-th')) || 85;
    const fy = g('wd688-fiscal');
    state.holiday_fiscal_year = fy !== '' ? Number(fy) : null;
    markDirty();
  }

  function fillFormFromState() {
    const s = function (id, val) {
      const el = document.getElementById(id);
      if (el) el.value = val != null ? String(val) : '';
    };
    s('wd688-project', state.project_name);
    s('wd688-start', state.start_date);
    s('wd688-end', state.end_date);
    s('wd688-obs', state.obs_location);
    s('wd688-obs-note', state.obs_location_note);
    s('wd688-wind-th', state.threshold_wind_ms);
    s('wd688-rain-th', state.threshold_rain_mm);
    s('wd688-hum-th', state.threshold_humidity_pct);
    s('wd688-fiscal', state.holiday_fiscal_year != null ? state.holiday_fiscal_year : '');
    renderSummary();
    renderMonthlyTable();
    updateDirtyBanner();
  }

  function renderSummary() {
    const sc = document.getElementById('wd688-scaffold');
    const pt = document.getElementById('wd688-paint');
    const meta = document.getElementById('wd688-meta');
    if (sc) {
      sc.textContent =
        state.result_scaffold_days != null ? state.result_scaffold_days.toFixed(2) + ' 日' : '—';
    }
    if (pt) {
      pt.textContent = state.result_paint_days != null ? state.result_paint_days.toFixed(2) + ' 日' : '—';
    }
    if (meta) {
      let t = '';
      if (state.recordId) t += '案件ID: ' + state.recordId;
      if (state.calculated_at) t += ' / 最終算出: ' + state.calculated_at.slice(0, 19).replace('T', ' ');
      meta.textContent = t;
    }
  }

  function renderMonthlyTable() {
    const host = document.getElementById('wd688-monthly');
    if (!host) return;
    if (!state.lastResult) {
      host.innerHTML =
        '<p style="color:#666">「再算出」で月別内訳を表示します（Excel 01_ダッシュボード相当）</p>';
      return;
    }
    const rows = state.lastResult.monthly;
    let html =
      '<table class="wd688-table"><thead><tr>' +
      '<th>月</th><th>年</th><th>暦日</th><th>休日</th><th>風速日</th><th>雨湿</th><th>工期M</th><th>足場N</th><th>塗装O</th>' +
      '</tr></thead><tbody>';
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      html +=
        '<tr><td>' +
        r.m +
        '</td><td>' +
        r.calYear +
        '</td><td>' +
        r.C +
        '</td><td>' +
        r.D +
        '</td><td>' +
        r.E +
        '</td><td>' +
        r.W +
        '</td><td>' +
        r.M.toFixed(0) +
        '</td><td>' +
        r.N.toFixed(2) +
        '</td><td>' +
        r.O.toFixed(2) +
        '</td></tr>';
    }
    html += '</tbody></table>';
    host.innerHTML = html;
  }

  function refreshProjectSelect(projects, selectedId) {
    const sel = document.getElementById('wd688-project-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">— 案件を選択 —</option>';
    for (let i = 0; i < projects.length; i += 1) {
      const p = projects[i];
      const id = p.$id && p.$id.value;
      const name = gv(p, FC.project) || '（名称なし）';
      const start = String(gv(p, FC.start)).slice(0, 10);
      const opt = document.createElement('option');
      opt.value = String(id);
      opt.textContent = '#' + id + ' ' + name + (start ? ' (' + start + '〜)' : '');
      if (String(id) === String(selectedId)) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  function loadRecord(id) {
    if (state.dirty && !window.confirm('未保存の変更があります。案件を切り替えますか？')) {
      return Promise.resolve();
    }
    return apiGetRecord(id).then(function (resp) {
      state = stateFromKintone(resp.record);
      try {
        sessionStorage.setItem(SESSION_RECORD_KEY, String(id));
      } catch (_e) {
        /* noop */
      }
      fillFormFromState();
      if (state.wind.length && state.rain.length && state.hum.length) {
        try {
          runCalc();
          fillFormFromState();
        } catch (_e2) {
          /* 再算出不可時は保存値のみ表示 */
        }
      }
    });
  }

  function saveTo687() {
    readFormIntoState();
    if (!state.project_name.trim()) throw new Error('工事名を入力してください');
    if (!state.start_date || !state.end_date) throw new Error('着工日・完工日を入力してください');
    if (!state.lastResult) runCalc();
    const record = stateToKintoneRecord(state, true);
    if (state.recordId) {
      return apiPutRecord(state.recordId, state.revision, record).then(function (resp) {
        state.revision = resp.revision;
        state.dirty = false;
        state.calculated_at = new Date().toISOString();
        updateDirtyBanner();
        alert('保存しました（案件ID: ' + state.recordId + '）');
        return loadProjectList();
      });
    }
    return apiPostRecord(record).then(function (resp) {
      state.recordId = String(resp.id);
      state.revision = resp.revision;
      state.dirty = false;
      try {
        sessionStorage.setItem(SESSION_RECORD_KEY, state.recordId);
      } catch (_e) {
        /* noop */
      }
      alert('新規案件を作成しました（ID: ' + state.recordId + '）');
      return loadProjectList().then(function () {
        return loadRecord(state.recordId);
      });
    });
  }

  function loadProjectList() {
    return apiListProjects().then(function (resp) {
      refreshProjectSelect(resp.records || [], state.recordId);
    });
  }

  function createNewProject() {
    if (state.dirty && !window.confirm('未保存の変更があります。新規案件を作成しますか？')) return;
    const start = todayJstYmd();
    const end = addDaysIso(start, 364);
    state = emptyState();
    state.project_name = '新規案件';
    state.start_date = start;
    state.end_date = end;
    state.threshold_wind_ms = 10;
    state.threshold_rain_mm = 10;
    state.threshold_humidity_pct = 85;
    state.holiday_fiscal_year = inferFiscalYear(start);
    state.dirty = true;
    fillFormFromState();
    const sel = document.getElementById('wd688-project-select');
    if (sel) sel.value = '';
  }

  function injectHideListCss() {
    if (document.getElementById('wd688-hide-list-css')) return;
    const st = document.createElement('style');
    st.id = 'wd688-hide-list-css';
    st.textContent =
      '.gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia{display:none !important;}' +
      '.wd688-table{border-collapse:collapse;width:100%;font-size:13px;margin:8px 0;}' +
      '.wd688-table th,.wd688-table td{border:1px solid #ccc;padding:4px 8px;text-align:right;}' +
      '.wd688-table th{background:#f0f4f8;text-align:center;}' +
      '.wd688-root{font-family:Segoe UI,Meiryo,sans-serif;max-width:1200px;margin:0 auto;padding:12px;}';
    document.head.appendChild(st);
  }

  function csvHelpHtml() {
    return (
      '<div style="font-weight:bold;margin-bottom:8px;">CSVの入手先（気象庁・過去の気象データダウンロード）</div>' +
      '<p style="margin:0 0 10px;"><strong>① 風速（足場用）</strong><br>サイト：<a href="' +
      JMA_WIND +
      '" target="_blank" rel="noopener">' +
      JMA_WIND +
      '</a><br>選ぶ項目：<strong>日別値</strong> → <strong>日最大風速 (m/s)</strong>。観測地点は案件と同じ地点を選択。CSVは<strong>日付・風速の2列</strong>。「CSV→風速」で取込。</p>' +
      '<p style="margin:0 0 10px;"><strong>② 降雨（塗装用）</strong><br>サイト：<a href="' +
      JMA_RAIN_HUM +
      '" target="_blank" rel="noopener">' +
      JMA_RAIN_HUM +
      '</a><br>選ぶ項目：<strong>日別値</strong> → <strong>降水量の合計 (mm)</strong>（日降水量）。CSVは<strong>日付・降水量の2列</strong>。「CSV→降雨」で取込。</p>' +
      '<p style="margin:0;"><strong>③ 湿度（塗装用）</strong><br>サイト：<a href="' +
      JMA_RAIN_HUM +
      '" target="_blank" rel="noopener">' +
      JMA_RAIN_HUM +
      '</a>（降雨と同じサイト）<br>選ぶ項目：<strong>日別値</strong> → <strong>平均湿度 (%)</strong>。CSVは<strong>日付・湿度の2列</strong>。「CSV→湿度」で取込。</p>'
    );
  }

  function buildDashboard() {
    const header = kintone.app.getHeaderSpaceElement();
    if (!header) return;
    header.innerHTML = '';
    injectHideListCss();

    const root = document.createElement('div');
    root.className = 'wd688-root';
    root.id = 'wd688-root';

    const obsOpts = OBS_OPTIONS.map(function (o) {
      return '<option value="' + o + '">' + o + '</option>';
    }).join('');

    root.innerHTML =
      '<div id="wd688-dirty" style="display:none;padding:10px;background:#fff3cd;border:1px solid #ffc107;border-radius:6px;margin-bottom:10px;font-size:13px;"></div>' +
      '<div style="margin-bottom:12px;padding:12px 14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;line-height:1.65;">' +
      '<strong style="font-size:15px">工事稼働日数計算ツール</strong><br>' +
      'データ入力後、<strong>保存</strong>を押してください。' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;">' +
      '<strong style="font-size:16px">工事稼働日数ダッシュ</strong>' +
      '<span style="font-size:11px;color:#666">' +
      BUILD +
      '</span></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center;">' +
      '<select id="wd688-project-select" style="min-width:280px;padding:6px"></select>' +
      '<button type="button" id="wd688-load" class="kintoneplugin-button-normal">読込</button>' +
      '<button type="button" id="wd688-new" class="kintoneplugin-button-normal">新規案件</button></div>' +
      '<div class="wd688-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:12px;font-size:13px;">' +
      '<label>工事名<br><input id="wd688-project" type="text" style="width:100%"></label>' +
      '<label>着工日<br><input id="wd688-start" type="date" style="width:100%"></label>' +
      '<label>完工日<br><input id="wd688-end" type="date" style="width:100%"></label>' +
      '<label>観測地点<br><select id="wd688-obs" style="width:100%">' +
      obsOpts +
      '</select></label>' +
      '<label>地点備考<br><input id="wd688-obs-note" type="text" style="width:100%"></label>' +
      '<label>風速閾値(m/s)<br><input id="wd688-wind-th" type="number" step="0.1" style="width:100%"></label>' +
      '<label>降雨閾値(mm)<br><input id="wd688-rain-th" type="number" step="0.1" style="width:100%"></label>' +
      '<label>湿度閾値(%)<br><input id="wd688-hum-th" type="number" style="width:100%"></label>' +
      '<label>休日基準年度<br><input id="wd688-fiscal" type="number" placeholder="空=自動" style="width:100%"></label></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0;padding:12px;background:#e8f4fc;border-radius:8px;">' +
      '<div><span style="font-size:12px;color:#555">足場 稼働可能日数</span><br><strong id="wd688-scaffold" style="font-size:22px">—</strong></div>' +
      '<div><span style="font-size:12px;color:#555">塗装 稼働可能日数</span><br><strong id="wd688-paint" style="font-size:22px">—</strong></div>' +
      '<button type="button" id="wd688-calc" class="kintoneplugin-button-dialog-ok">再算出</button>' +
      '<button type="button" id="wd688-save" class="kintoneplugin-button-dialog-ok">保存</button></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 4px;">' +
      '<span style="font-size:13px;font-weight:bold;color:#334155">気象CSV取込：</span>' +
      '<button type="button" id="wd688-csv-wind" class="kintoneplugin-button-normal">CSV→風速</button>' +
      '<button type="button" id="wd688-csv-rain" class="kintoneplugin-button-normal">CSV→降雨</button>' +
      '<button type="button" id="wd688-csv-hum" class="kintoneplugin-button-normal">CSV→湿度</button></div>' +
      '<div id="wd688-csv-help" style="margin:0 0 14px;padding:12px 14px;background:#fff;border:1px solid #d0d7de;border-radius:8px;font-size:13px;line-height:1.7;color:#1e293b;">' +
      csvHelpHtml() +
      '</div>' +
      '<div id="wd688-meta" style="font-size:12px;color:#666;margin-bottom:8px"></div>' +
      '<div id="wd688-monthly"></div>' +
      '<input type="file" id="wd688-csv-file" accept=".csv,.txt" style="display:none">';

    header.appendChild(root);

    ['wd688-project', 'wd688-start', 'wd688-end', 'wd688-obs', 'wd688-obs-note', 'wd688-wind-th', 'wd688-rain-th', 'wd688-hum-th', 'wd688-fiscal'].forEach(
      function (id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', markDirty);
      },
    );

    document.getElementById('wd688-load').addEventListener('click', function () {
      const id = document.getElementById('wd688-project-select').value;
      if (!id) {
        alert('案件を選択してください');
        return;
      }
      loadRecord(id).catch(function (e) {
        alert('読込失敗: ' + (e.message || e));
      });
    });

    document.getElementById('wd688-new').addEventListener('click', createNewProject);

    document.getElementById('wd688-calc').addEventListener('click', function () {
      try {
        readFormIntoState();
        runCalc();
        fillFormFromState();
        alert('再算出しました');
      } catch (e) {
        alert('算出エラー: ' + (e.message || e));
      }
    });

    document.getElementById('wd688-save').addEventListener('click', function () {
      saveTo687().catch(function (e) {
        alert('保存失敗: ' + (e.message || e));
      });
    });

    const fileInput = document.getElementById('wd688-csv-file');
    function pickCsv(kind) {
      pendingCsvKind = kind;
      fileInput.value = '';
      fileInput.click();
    }
    document.getElementById('wd688-csv-wind').addEventListener('click', function () {
      pickCsv('wind');
    });
    document.getElementById('wd688-csv-rain').addEventListener('click', function () {
      pickCsv('rain');
    });
    document.getElementById('wd688-csv-hum').addEventListener('click', function () {
      pickCsv('hum');
    });

    fileInput.addEventListener('change', function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file || !pendingCsvKind) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const rows = parseCsvTwoColumn(reader.result);
          if (!rows.length) {
            alert('有効なデータ行がありません');
            return;
          }
          readFormIntoState();
          if (pendingCsvKind === 'wind') state.wind = rows;
          else if (pendingCsvKind === 'rain') state.rain = rows;
          else state.hum = rows;
          markDirty();
          fillFormFromState();
          alert(rows.length + ' 行取込みました（「保存」で記録に反映されます）');
        } catch (e) {
          alert('CSVエラー: ' + (e.message || e));
        }
        pendingCsvKind = null;
      };
      reader.readAsText(file, 'UTF-8');
    });

    window.addEventListener('beforeunload', function (e) {
      if (!state.dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  function recordIdFromQuery() {
    try {
      const q = new URLSearchParams(window.location.search);
      return q.get('workdays_record') || q.get('record');
    } catch (_e) {
      return null;
    }
  }

  function refresh688Dash() {
    buildDashboard();
    loadProjectList()
      .then(function () {
        let id = recordIdFromQuery();
        if (!id) {
          try {
            id = sessionStorage.getItem(SESSION_RECORD_KEY);
          } catch (_e2) {
            /* noop */
          }
        }
        if (id) return loadRecord(id);
        createNewProject();
        return null;
      })
      .catch(function (e) {
        console.error(BUILD, e);
        alert('初期化エラー: ' + (e.message || e));
      });
  }

  kintone.events.on('app.record.index.show', function (ev) {
    refresh688Dash();
    return ev;
  });

})();
