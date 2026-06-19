  const APP_DATA = 687;
  const FC = {
    project: 'project_name',
    start: 'start_date',
    end: 'end_date',
    estimate: 'estimate_year',
    obs: 'obs_location',
    obsNote: 'obs_location_note',
    windTh: 'threshold_wind_ms',
    rainTh: 'threshold_rain_mm',
    fiscal: 'holiday_fiscal_year',
    windTbl: 'wind_data',
    windDate: 'wind_obs_date',
    windVal: 'wind_max_ms',
    rainTbl: 'rain_data',
    rainDate: 'rain_obs_date',
    rainVal: 'rain_mm',
    holTbl: 'holiday_manual',
    holMonth: 'hm_month',
    holGw: 'hm_gw',
    holSummer: 'hm_summer',
    holNye: 'hm_nye',
    resScaffold: 'result_scaffold_days',
    resPaint: 'result_paint_days',
    calcAt: 'calculated_at',
    note: 'calc_note',
  };

  const OBS_OPTIONS = ['東京', 'さいたま', '熊谷', '宇都宮', '前橋', '横浜', '千葉', 'その他'];
  const JMA_OBSDL = 'https://www.data.jma.go.jp/risk/obsdl/';
  const SESSION_RECORD_KEY = 'workdays688_last_record_id';

  let state = emptyState();
  let pendingCsvKind = null;
  let activeTab = 'scaffold';

  function emptyHolidayManual() {
    const rows = [];
    for (let m = 1; m <= 12; m += 1) {
      rows.push({ m: m, gw: 0, summer: 0, nye: 0 });
    }
    return rows;
  }

  function emptyState() {
    return {
      recordId: null,
      revision: null,
      dirty: false,
      project_name: '',
      estimate_year: null,
      start_date: '',
      end_date: '',
      obs_location: '',
      obs_location_note: '',
      threshold_wind_ms: 10,
      threshold_rain_mm: 10,
      holiday_fiscal_year: null,
      wind: [],
      rain: [],
      holidayManual: emptyHolidayManual(),
      ref5yr: null,
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

  function readHolidayManualFromKintone(rec) {
    const rows = (rec[FC.holTbl] && rec[FC.holTbl].value) || [];
    const byMonth = {};
    for (let i = 0; i < rows.length; i += 1) {
      const v = rows[i].value || {};
      const m = Number(v[FC.holMonth] && v[FC.holMonth].value);
      if (!m || m < 1 || m > 12) continue;
      byMonth[m] = {
        m: m,
        gw: Number(v[FC.holGw] && v[FC.holGw].value) || 0,
        summer: Number(v[FC.holSummer] && v[FC.holSummer].value) || 0,
        nye: Number(v[FC.holNye] && v[FC.holNye].value) || 0,
      };
    }
    const out = emptyHolidayManual();
    for (let i = 0; i < out.length; i += 1) {
      if (byMonth[out[i].m]) out[i] = byMonth[out[i].m];
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

  function holidayManualToKintone(rows) {
    return rows.map(function (r) {
      return {
        value: {
          [FC.holMonth]: { value: String(r.m) },
          [FC.holGw]: { value: String(r.gw != null ? r.gw : 0) },
          [FC.holSummer]: { value: String(r.summer != null ? r.summer : 0) },
          [FC.holNye]: { value: String(r.nye != null ? r.nye : 0) },
        },
      };
    });
  }

  function stateFromKintone(rec) {
    const s = emptyState();
    s.recordId = rec.$id && rec.$id.value != null ? String(rec.$id.value) : null;
    s.revision = rec.$revision && rec.$revision.value != null ? String(rec.$revision.value) : null;
    s.project_name = String(gv(rec, FC.project));
    const est = gv(rec, FC.estimate);
    const fy = gv(rec, FC.fiscal);
    const start = String(gv(rec, FC.start)).slice(0, 10);
    if (est !== '') s.estimate_year = Number(est);
    else if (fy !== '') s.estimate_year = Number(fy);
    else if (start) s.estimate_year = Number(start.slice(0, 4));
    s.start_date = start;
    s.end_date = String(gv(rec, FC.end)).slice(0, 10);
    s.obs_location = String(gv(rec, FC.obs));
    s.obs_location_note = String(gv(rec, FC.obsNote));
    s.threshold_wind_ms = Number(gv(rec, FC.windTh)) || 10;
    s.threshold_rain_mm = Number(gv(rec, FC.rainTh)) || 10;
    const fyLegacy = gv(rec, FC.fiscal);
    s.holiday_fiscal_year = fyLegacy !== '' ? Number(fyLegacy) : s.estimate_year;
    s.wind = readSubFromKintone(rec, FC.windTbl, FC.windDate, FC.windVal);
    s.rain = readSubFromKintone(rec, FC.rainTbl, FC.rainDate, FC.rainVal);
    s.holidayManual = readHolidayManualFromKintone(rec);
    const rs = gv(rec, FC.resScaffold);
    const rp = gv(rec, FC.resPaint);
    s.result_scaffold_days = rs !== '' ? Number(rs) : null;
    s.result_paint_days = rp !== '' ? Number(rp) : null;
    s.calculated_at = String(gv(rec, FC.calcAt));
    s.dirty = false;
    syncRef5yrFromDaily();
    return s;
  }

  function stateToKintoneRecord(s, includeResults) {
    const rec = {};
    rec[FC.project] = { value: s.project_name };
    if (s.estimate_year != null) {
      rec[FC.estimate] = { value: String(s.estimate_year) };
      rec[FC.fiscal] = { value: String(s.estimate_year) };
      rec[FC.start] = { value: s.estimate_year + '-01-01' };
      rec[FC.end] = { value: s.estimate_year + '-12-31' };
    }
    rec[FC.obs] = { value: s.obs_location };
    rec[FC.obsNote] = { value: s.obs_location_note };
    rec[FC.windTh] = { value: String(s.threshold_wind_ms) };
    rec[FC.rainTh] = { value: String(s.threshold_rain_mm) };
    if (s.holiday_fiscal_year != null && s.estimate_year == null) {
      rec[FC.fiscal] = { value: String(s.holiday_fiscal_year) };
    }
    rec[FC.windTbl] = { value: subToKintone(s.wind, FC.windDate, FC.windVal) };
    rec[FC.rainTbl] = { value: subToKintone(s.rain, FC.rainDate, FC.rainVal) };
    rec[FC.holTbl] = { value: holidayManualToKintone(s.holidayManual) };
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
      fields: [FC.project, FC.estimate, FC.fiscal, FC.start, FC.obs, FC.resScaffold, FC.resPaint, '$id'],
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

  function cloneRef5yr(src) {
    return JSON.parse(JSON.stringify(src || REF5YR));
  }

  function getRef5yr() {
    return state.ref5yr || REF5YR;
  }

  function syncRef5yrFromDaily() {
    state.ref5yr = rebuildRef5yrFromDailyCsv(cloneRef5yr(REF5YR), state.wind, state.rain);
  }

  function decodeCsvArrayBuffer(buf) {
    const encodings = ['shift-jis', 'utf-8'];
    for (let i = 0; i < encodings.length; i += 1) {
      try {
        const text = new TextDecoder(encodings[i]).decode(buf);
        if (/\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(text)) return text;
      } catch (_e) {
        /* noop */
      }
    }
    return new TextDecoder('utf-8').decode(buf);
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
      if (/日付|年月日|date|風速|降雨|降水/i.test(cols[0] + cols[1])) continue;
      const date = normalizeDate(cols[0]);
      const val = parseFloat(String(cols[1]).replace(/[^\d.-]/g, ''));
      if (!date || Number.isNaN(val)) continue;
      rows.push({ date: date, value: val });
    }
    return rows;
  }

  function currentEstimateYear() {
    const el = document.getElementById('wd688-estimate');
    if (el && el.value !== '') return Number(el.value);
    if (state.estimate_year != null) return state.estimate_year;
    return new Date().getFullYear();
  }

  function buildCalcNote(result, warnings) {
    const lines = [
      'BUILD=' + BUILD,
      '見積作成年=' + (result.estimateYear != null ? result.estimateYear : '—'),
      '過去5年=' + (result.pastYears ? result.pastYears.join('・') : '—'),
      '足場=' + result.scaffold.toFixed(2) + ' / 塗装=' + result.paint.toFixed(2),
      '（Excel 20260613準拠・1〜12月・※1=見積作成年の過去5年月平均・祝日=マスタ自動）',
      '',
      '月 | 年 | 暦 | 休 | 風※1 | 雨※1 | ダブ風 | ダブ雨 | 足場 | 塗装 | 不稼働率(足) | 不稼働率(塗)',
    ];
    const windRows = result.monthlyWind || result.monthly || [];
    const rainRows = result.monthlyRain || result.monthly || [];
    for (let i = 0; i < windRows.length; i += 1) {
      const r = windRows[i];
      const rain = rainRows[i] || r;
      lines.push(
        [
          r.m,
          r.calYear,
          r.C,
          r.D,
          r.E,
          rain.W,
          r.G != null ? r.G.toFixed(2) : '',
          rain.J != null ? rain.J.toFixed(2) : '',
          r.N.toFixed(2),
          rain.O.toFixed(2),
          r.H_rate != null ? (r.H_rate * 100).toFixed(2) + '%' : '',
          rain.K_rate != null ? (rain.K_rate * 100).toFixed(2) + '%' : '',
        ].join(' | '),
      );
    }
    if (warnings.length) {
      lines.push('', '【警告】', warnings.join('\n'));
    }
    return lines.join('\n');
  }

  function collectWarnings() {
    const warnings = [];
    if (state.estimate_year == null) warnings.push('見積作成年が未入力です');
    if (!state.obs_location) warnings.push('観測地点が未選択です');
    if (!getRef5yr() || !getRef5yr().wind_ge10_ms) warnings.push('過去5年参照データが読み込めていません');
    return warnings;
  }

  function readHolidayManualFromForm() {
    for (let m = 1; m <= 12; m += 1) {
      const row = state.holidayManual[m - 1];
      const gwEl = document.getElementById('wd688-hm-gw-' + m);
      const suEl = document.getElementById('wd688-hm-summer-' + m);
      const nyEl = document.getElementById('wd688-hm-nye-' + m);
      if (gwEl) row.gw = Number(gwEl.value) || 0;
      if (suEl) row.summer = Number(suEl.value) || 0;
      if (nyEl) row.nye = Number(nyEl.value) || 0;
    }
  }

  function runCalc() {
    readHolidayManualFromForm();
    const estimateYear = currentEstimateYear();
    if (!estimateYear || Number.isNaN(estimateYear)) throw new Error('見積作成年を入力してください');
    const bundle = calcWorkdaysBundleForEstimate({
      estimateYear: estimateYear,
      ref5yr: getRef5yr(),
      holidayManual: state.holidayManual,
    });
    state.lastResult = {
      scaffold: bundle.scaffold,
      paint: bundle.paint,
      monthlyWind: bundle.monthlyWind,
      monthlyRain: bundle.monthlyRain,
      estimateYear: bundle.estimateYear,
      pastYears: bundle.pastYears,
      wind5yr: bundle.wind5yr,
      rain5yr: bundle.rain5yr,
    };
    state.lastWarnings = collectWarnings();
    state.result_scaffold_days = Math.round(bundle.scaffold * 100) / 100;
    state.result_paint_days = Math.round(bundle.paint * 100) / 100;
    state.estimate_year = estimateYear;
    state.holiday_fiscal_year = estimateYear;
    state.dirty = true;
    return state.lastResult;
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
    state.estimate_year = g('wd688-estimate') !== '' ? Number(g('wd688-estimate')) : null;
    state.obs_location = g('wd688-obs');
    state.obs_location_note = g('wd688-obs-note');
    state.threshold_wind_ms = Number(g('wd688-wind-th')) || 10;
    state.threshold_rain_mm = Number(g('wd688-rain-th')) || 10;
    readHolidayManualFromForm();
    markDirty();
  }

  function fillFormFromState() {
    const s = function (id, val) {
      const el = document.getElementById(id);
      if (el) el.value = val != null ? String(val) : '';
    };
    s('wd688-project', state.project_name);
    s('wd688-estimate', state.estimate_year != null ? state.estimate_year : '');
    s('wd688-obs', state.obs_location);
    s('wd688-obs-note', state.obs_location_note);
    s('wd688-wind-th', state.threshold_wind_ms);
    s('wd688-rain-th', state.threshold_rain_mm);
    for (let m = 1; m <= 12; m += 1) {
      const row = state.holidayManual[m - 1];
      s('wd688-hm-gw-' + m, row.gw);
      s('wd688-hm-summer-' + m, row.summer);
      s('wd688-hm-nye-' + m, row.nye);
    }
    renderSummary();
    renderMonthlyTable();
    updateTabButtons();
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

  function monthLabel(m) {
    return m + '月';
  }

  function fmtNum(n, digits) {
    if (n == null || Number.isNaN(n)) return '—';
    return Number(n).toFixed(digits != null ? digits : 2);
  }

  function fmtPct(rate) {
    if (rate == null || Number.isNaN(rate)) return '—';
    return (Number(rate) * 100).toFixed(2) + '%';
  }

  function fmtRainHolidayPct(pct) {
    if (pct == null || Number.isNaN(pct)) return '—';
    return String(Math.round(Number(pct))) + '%';
  }

  function paintPdfMonth(r) {
    return calcRainHolidayRatePdf(r.D, r.W, r.C);
  }

  function paintPdfYear(yt) {
    return calcRainHolidayRatePdf(yt.D, yt.weather, yt.C);
  }

  function windPdfMonth(r) {
    return {
      weatherR: roundWorkdaysPdf1(r.E),
      overlap: roundWorkdaysPdf1(r.G),
      avail: roundWorkdaysPdf1(r.N),
    };
  }

  function windPdfYear(yt) {
    return {
      weatherR: roundWorkdaysPdf1(yt.weather),
      overlap: roundWorkdaysPdf1(yt.overlap),
      avail: roundWorkdaysPdf1(yt.avail),
    };
  }

  function computeYearTotals(rows, isWind) {
    function sum(key) {
      return rows.reduce(function (s, r) {
        return s + (Number(r[key]) || 0);
      }, 0);
    }
    const C = sum('C');
    const D = sum('D');
    const weather = isWind ? sum('E') : sum('W');
    const overlap = C ? (D * weather) / C : 0;
    const avail = C - (D + weather - overlap);
    const rate = avail ? (D + weather - overlap) / avail : 0;
    return {
      weather: weather,
      weekends: sum('weekends'),
      weekdayHol: sum('weekdayHol'),
      gw: sum('gw'),
      summer: sum('summer'),
      nye: sum('nye'),
      D: D,
      overlap: overlap,
      C: C,
      avail: avail,
      rate: rate,
    };
  }

  function renderExcelTransposedTable(rows, mode) {
    const isWind = mode === 'scaffold';
    const yt = computeYearTotals(rows, isWind);
    const weatherLabel = isWind
      ? '風速日数 ※1<br><span class="wd688-sub">(10m/s以上・見積作成年の過去5年月平均)</span>'
      : '降雨日数 ※1<br><span class="wd688-sub">(10mm以上・見積作成年の過去5年月平均)</span>';
    const overlapLabel = isWind
      ? '休日数と風速日数のダブり ※2'
      : '休日数と降雨日数のダブり ※2';

    function cellVal(r, key) {
      return r[key];
    }

    function weatherVal(r) {
      if (isWind) return r.E;
      return paintPdfMonth(r).weatherR;
    }

    function overlapVal(r) {
      if (isWind) return r.G;
      return paintPdfMonth(r).overlap;
    }

    function availVal(r) {
      if (isWind) return r.N;
      return paintPdfMonth(r).avail;
    }

    function rateVal(r) {
      return isWind ? r.H_rate : r.K_rate;
    }

    function fmtYearCell(v, opts) {
      opts = opts || {};
      if (opts.rainPctInt) return fmtRainHolidayPct(v);
      if (opts.pct) return fmtPct(v);
      if (opts.fixed != null) return fmtNum(v, opts.fixed);
      return v;
    }

    const pdfYear = isWind ? null : paintPdfYear(yt);

    let html =
      '<div class="wd688-excel-wrap"><table class="wd688-table wd688-excel-table"><thead><tr>' +
      '<th class="wd688-row-label">月</th>';
    for (let i = 0; i < rows.length; i += 1) {
      html += '<th>' + monthLabel(rows[i].m) + '</th>';
    }
    html +=
      '<th class="wd688-year-col">年<br><span class="wd688-sub">合計</span></th></tr></thead><tbody>';

    function addRow(label, valueFn, opts) {
      opts = opts || {};
      html += '<tr><td class="wd688-row-label">' + label + '</td>';
      for (let i = 0; i < rows.length; i += 1) {
        const r = rows[i];
        if (opts.inputPrefix) {
          html +=
            '<td><input type="number" min="0" step="1" id="wd688-hm-' +
            opts.inputPrefix +
            '-' +
            r.m +
            '" class="wd688-hm-in" value="' +
            cellVal(r, opts.field) +
            '" style="width:52px"></td>';
        } else {
          const v = valueFn(r);
          html +=
            '<td>' +
            (opts.rainPctInt
              ? fmtRainHolidayPct(v)
              : opts.pct
                ? fmtPct(v)
                : opts.fixed != null
                  ? fmtNum(v, opts.fixed)
                  : v) +
            '</td>';
        }
      }
      html += '<td class="wd688-year-col">' + fmtYearCell(opts.yearVal, opts) + '</td>';
      html += '</tr>';
    }

    addRow(weatherLabel, weatherVal, {
      fixed: isWind ? 0 : 1,
      yearVal: isWind ? yt.weather : pdfYear.weatherR,
    });
    html +=
      '<tr><td class="wd688-row-label wd688-indent" colspan="' +
      (rows.length + 2) +
      '">休日数</td></tr>';
    addRow('<span class="wd688-indent2">土　曜・日　曜</span>', function (r) {
      return r.weekends;
    }, { yearVal: yt.weekends });
    addRow('<span class="wd688-indent2">祝　日・祭　日</span>', function (r) {
      return r.weekdayHol;
    }, { yearVal: yt.weekdayHol });
    addRow('<span class="wd688-indent2">年　末　年　始</span>', function (r) {
      return r.nye;
    }, { inputPrefix: 'nye', field: 'nye', yearVal: yt.nye });
    addRow('<span class="wd688-indent2">G　W</span>', function (r) {
      return r.gw;
    }, { inputPrefix: 'gw', field: 'gw', yearVal: yt.gw });
    addRow('<span class="wd688-indent2">夏　休　み</span>', function (r) {
      return r.summer;
    }, { inputPrefix: 'summer', field: 'summer', yearVal: yt.summer });
    addRow('<span class="wd688-indent2">計</span>', function (r) {
      return r.D;
    }, { yearVal: yt.D });
    addRow(overlapLabel, overlapVal, {
      fixed: isWind ? 2 : 1,
      yearVal: isWind ? yt.overlap : pdfYear.overlap,
    });
    addRow('暦　　　　　日', function (r) {
      return r.C;
    }, { yearVal: yt.C });
    addRow('稼　働　可　能　日　数　※3', availVal, {
      fixed: isWind ? 2 : 1,
      yearVal: isWind ? yt.avail : pdfYear.avail,
    });
    addRow('不　稼　働　率　※4', rateVal, { pct: true, yearVal: yt.rate });
    if (!isWind) {
      addRow(
        '雨休率（％）',
        function (r) {
          return paintPdfMonth(r).ratePct;
        },
        { rainPctInt: true, yearVal: pdfYear.ratePct },
      );
    }

    html += '</tbody></table></div>';
    return html;
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function paintReportPrintStylesheet() {
    return (
      '*{box-sizing:border-box;}' +
      'body{margin:0;padding:8mm 10mm;font-family:"Yu Gothic","Meiryo",sans-serif;font-size:10pt;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.wd688pr-title{margin:0 0 8px;padding:8px 12px;background:#1e3a8a;color:#fff;text-align:center;font-size:15pt;font-weight:700;letter-spacing:0.04em;}' +
      '.wd688pr-meta{margin:0 0 8px;font-size:9.5pt;line-height:1.55;}' +
      '.wd688pr-meta table{border-collapse:collapse;width:100%;}' +
      '.wd688pr-meta th,.wd688pr-meta td{border:1px solid #666;padding:3px 8px;text-align:left;}' +
      '.wd688pr-meta th{width:18%;background:#f3f4f6;font-weight:600;}' +
      '.wd688pr-sum{width:100%;border-collapse:collapse;margin:6px 0 8px;font-size:8.5pt;table-layout:fixed;}' +
      '.wd688pr-sum th,.wd688pr-sum td{border:1px solid #333;padding:2px 2px;text-align:center;vertical-align:middle;line-height:1.3;}' +
      '.wd688pr-sum th{background:#d9e2ec;font-weight:600;}' +
      '.wd688pr-sum .wd688pr-lab{text-align:left;padding-left:5px;min-width:10em;font-weight:600;background:#f8fafc;}' +
      '.wd688pr-sum .wd688pr-indent{padding-left:1.2em;font-weight:500;}' +
      '.wd688pr-sum .wd688pr-year{background:#fffbeb;font-weight:700;}' +
      '.wd688pr-notes{margin:4px 0 10px;font-size:8pt;line-height:1.5;color:#222;}' +
      '.wd688pr-notes p{margin:0 0 2px;}' +
      '.wd688pr-cal-section{margin-top:8px;}' +
      '.wd688pr-cal-year{margin:10px 0 4px;font-size:11pt;font-weight:700;}' +
      '.wd688pr-cal-row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 8px;margin-bottom:6px;}' +
      '.wd688pr-cal{border:1px solid #444;padding:3px 4px 4px;min-width:0;}' +
      '.wd688pr-cal-mnum{margin:0 0 2px;text-align:center;font-size:10pt;font-weight:700;}' +
      '.wd688pr-cal-t{width:100%;border-collapse:collapse;font-size:7pt;table-layout:fixed;}' +
      '.wd688pr-cal-t th,.wd688pr-cal-t td{border:1px solid #999;text-align:center;padding:0;line-height:13px;height:13px;}' +
      '.wd688pr-cal-t th{background:#e8eef4;font-weight:600;font-size:6.5pt;}' +
      '.wd688pr-cal-t .wd688pr-d-sat{color:#1d4ed8;}' +
      '.wd688pr-cal-t .wd688pr-d-sun,.wd688pr-cal-t .wd688pr-d-hol{color:#dc2626;font-weight:600;}' +
      '.wd688pr-cal-t .wd688pr-d-rain{background:#dbeafe;}' +
      '.wd688pr-cal-t .wd688pr-d-empty{background:#fafafa;}' +
      '.wd688pr-cal-stats{width:100%;border-collapse:collapse;margin-top:2px;font-size:7.5pt;table-layout:fixed;}' +
      '.wd688pr-cal-stats td{border:1px solid #999;padding:1px 3px;line-height:1.25;vertical-align:middle;}' +
      '.wd688pr-cal-stats .wd688pr-sl{width:68%;text-align:left;white-space:normal;word-break:break-all;}' +
      '.wd688pr-cal-stats .wd688pr-sv{width:32%;text-align:right;font-weight:700;white-space:nowrap;}' +
      '.wd688pr-section{margin-bottom:12px;}' +
      '.wd688pr-tabs{display:flex;flex-wrap:wrap;gap:2px;margin:0 0 6px;font-size:7.5pt;}' +
      '.wd688pr-tabs span{border:1px solid #94a3b8;padding:2px 6px;background:#f1f5f9;border-radius:3px 3px 0 0;}' +
      '.wd688pr-tabs .wd688pr-tab-active{background:#1e3a8a;color:#fff;border-color:#1e3a8a;font-weight:700;}' +
      '.wd688pr-meta-line{margin:0 0 6px;font-size:9pt;}' +
      '.wd688pr-5yr-block{margin:8px 0;}' +
      '.wd688pr-5yr-block h3{margin:0 0 4px;font-size:9pt;font-weight:700;}' +
      '#wd688-print-portal{display:none;}' +
      '@media print{' +
      '@page{size:A4 landscape;margin:7mm;}' +
      'body{padding:0!important;}' +
      'body *{visibility:hidden!important;}' +
      '#wd688-print-portal,#wd688-print-portal *{visibility:visible!important;}' +
      '#wd688-print-portal{display:block!important;position:absolute;left:0;top:0;width:100%;}' +
      '.wd688pr-section{page-break-after:always;}' +
      '.wd688pr-section:last-child{page-break-after:auto;}' +
      '}'
    );
  }

  var WD688_PRINT_TABS = [
    '工事稼働日管理 (塗装)',
    '工事稼働日管理 (足場)',
    '工事稼働日管理 (休日)',
    '過去5年月別降雨日数',
    '過去5年月別風速日数',
  ];

  function sheetTabsHtml(activeTab) {
    var out = '<div class="wd688pr-tabs">';
    for (var i = 0; i < WD688_PRINT_TABS.length; i += 1) {
      var t = WD688_PRINT_TABS[i];
      out +=
        '<span' +
        (t === activeTab ? ' class="wd688pr-tab-active"' : '') +
        '>' +
        escHtml(t) +
        '</span>';
    }
    return out + '</div>';
  }

  function injectPrintPortalCss() {
    if (document.getElementById('wd688-print-portal-css')) return;
    var st = document.createElement('style');
    st.id = 'wd688-print-portal-css';
    st.textContent = paintReportPrintStylesheet();
    document.head.appendChild(st);
  }

  function ensurePrintPortal() {
    var el = document.getElementById('wd688-print-portal');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'wd688-print-portal';
    document.body.appendChild(el);
    return el;
  }

  var WD688_PRINT_AFTERPRINT_BOUND = false;

  function bindPrintPortalCleanup() {
    if (WD688_PRINT_AFTERPRINT_BOUND) return;
    WD688_PRINT_AFTERPRINT_BOUND = true;
    window.addEventListener(
      'afterprint',
      function () {
        var p = document.getElementById('wd688-print-portal');
        if (p) p.innerHTML = '';
      },
      false,
    );
  }

  function buildWindDaySetForYear(year, windRows, threshold) {
    const set = new Set();
    const prefix = String(year) + '-';
    const th = Number(threshold) || 10;
    const rows = windRows || [];
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (!r.date || !r.date.startsWith(prefix)) continue;
      if (Number(r.value) >= th) set.add(r.date);
    }
    return set;
  }

  function buildRainDaySetForYear(year, rainRows, threshold) {
    const set = new Set();
    const prefix = String(year) + '-';
    const th = Number(threshold) || 10;
    const rows = rainRows || [];
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (!r.date || !r.date.startsWith(prefix)) continue;
      if (Number(r.value) >= th) set.add(r.date);
    }
    return set;
  }

  function calendarDayClass(year, month, day, rainSet) {
    const iso = toIso({ y: year, mo: month, d: day });
    const dt = new Date(Date.UTC(year, month - 1, day, 12));
    const dow = dt.getUTCDay();
    const hol = nationalHolidaySet(year);
    const cls = [];
    if (rainSet.has(iso)) cls.push('wd688pr-d-rain');
    if (dow === 0 || hol.has(iso)) cls.push('wd688pr-d-sun');
    else if (dow === 6) cls.push('wd688pr-d-sat');
    if (hol.has(iso) && dow !== 0 && dow !== 6) cls.push('wd688pr-d-hol');
    return cls.join(' ');
  }

  function calStatRow(label, value) {
    return (
      '<tr><td class="wd688pr-sl">' +
      label +
      '</td><td class="wd688pr-sv">' +
      value +
      '</td></tr>'
    );
  }

  function renderMonthCalendarBlock(year, month, row, mode, markSet) {
    const isWind = mode === 'scaffold';
    const wind = isWind ? windPdfMonth(row) : null;
    const pdf = isWind ? null : paintPdfMonth(row);
    const dim = daysInMonth(year, month);
    const firstDow = new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay();
    const holidayTotal = Math.round(Number(row.D) || 0);
    const weatherVal = isWind ? wind.weatherR : pdf.weatherR;
    const overlapVal = isWind ? wind.overlap : pdf.overlap;
    const availVal = isWind ? wind.avail : pdf.avail;
    const rateVal = isWind ? row.H_rate : row.K_rate;
    const nonWork = Math.round((Number(row.D) || 0) + weatherVal - overlapVal);

    let grid = '<table class="wd688pr-cal-t"><thead><tr>';
    ['日', '月', '火', '水', '木', '金', '土'].forEach(function (w) {
      grid += '<th>' + w + '</th>';
    });
    grid += '</tr></thead><tbody><tr>';
    for (let i = 0; i < firstDow; i += 1) {
      grid += '<td class="wd688pr-d-empty"></td>';
    }
    for (let d = 1; d <= dim; d += 1) {
      const pos = (firstDow + d - 1) % 7;
      if (d > 1 && pos === 0) grid += '</tr><tr>';
      const cls = calendarDayClass(year, month, d, markSet);
      grid += '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + d + '</td>';
    }
    const tail = (firstDow + dim) % 7;
    if (tail !== 0) {
      for (let i = tail; i < 7; i += 1) {
        grid += '<td class="wd688pr-d-empty"></td>';
      }
    }
    grid += '</tr></tbody></table>';

    let stats =
      '<table class="wd688pr-cal-stats"><colgroup><col style="width:68%"><col style="width:32%"></colgroup>' +
      calStatRow('暦日', row.C + '日') +
      calStatRow('休日数', holidayTotal + '日');
    if (isWind) {
      stats +=
        calStatRow('風速日数', fmtNum(weatherVal, 1) + '日') +
        calStatRow('休日数と風速日数のダブり日数', fmtNum(overlapVal, 1) + '日') +
        calStatRow('稼働可能日数', fmtNum(availVal, 1) + '日') +
        calStatRow('不稼働率', fmtPct(rateVal)) +
        calStatRow('不稼働日', nonWork + '日');
    } else {
      stats +=
        calStatRow('降雨日数', fmtNum(weatherVal, 1) + '日') +
        calStatRow('休日数と降雨日数のダブり日数', fmtNum(overlapVal, 1) + '日') +
        calStatRow('稼働可能日数', fmtNum(availVal, 1) + '日') +
        calStatRow('不稼働率', fmtPct(rateVal)) +
        calStatRow('雨休率（％）', fmtRainHolidayPct(pdf.ratePct)) +
        calStatRow('不稼働日', nonWork + '日');
    }
    stats += '</table>';

    return (
      '<div class="wd688pr-cal">' +
      '<p class="wd688pr-cal-mnum">' +
      month +
      '</p>' +
      grid +
      stats +
      '</div>'
    );
  }

  function renderCalendarYearSection(year, rows, mode, markSet) {
    let html = '<p class="wd688pr-cal-year">' + year + '年</p>';
    for (let start = 1; start <= 12; start += 3) {
      html += '<div class="wd688pr-cal-row">';
      for (let m = start; m < start + 3; m += 1) {
        const row = rows.find(function (r) {
          return r.m === m;
        });
        if (row) html += renderMonthCalendarBlock(year, m, row, mode, markSet);
      }
      html += '</div>';
    }
    return html;
  }

  function buildPrintSummaryTable(rows, mode, opts) {
    opts = opts || {};
    const isWind = mode === 'scaffold';
    const isHoliday = mode === 'holiday';
    const yt = computeYearTotals(rows, isWind);
    const pdfYear = isWind ? null : paintPdfYear(yt);
    const windYear = isWind ? windPdfYear(yt) : null;
    const rainTh = opts.rainTh != null ? opts.rainTh : 10;
    const windTh = opts.windTh != null ? opts.windTh : 10;

    function monthCells(fn, cellOpts) {
      cellOpts = cellOpts || {};
      let out = '';
      for (let i = 0; i < rows.length; i += 1) {
        const v = fn(rows[i], i);
        if (cellOpts.pct) out += '<td>' + fmtPct(v) + '</td>';
        else if (cellOpts.rainPctInt) out += '<td>' + fmtRainHolidayPct(v) + '</td>';
        else if (cellOpts.fixed != null) out += '<td>' + fmtNum(v, cellOpts.fixed) + '</td>';
        else out += '<td>' + escHtml(v) + '</td>';
      }
      return out;
    }

    function yearCell(v, cellOpts) {
      cellOpts = cellOpts || {};
      if (cellOpts.pct) return '<td class="wd688pr-year">' + fmtPct(v) + '</td>';
      if (cellOpts.rainPctInt) return '<td class="wd688pr-year">' + fmtRainHolidayPct(v) + '</td>';
      if (cellOpts.fixed != null) return '<td class="wd688pr-year">' + fmtNum(v, cellOpts.fixed) + '</td>';
      return '<td class="wd688pr-year">' + escHtml(v) + '</td>';
    }

    function holidayAvail(r) {
      return (Number(r.C) || 0) - (Number(r.D) || 0);
    }

    function holidayRate(r) {
      const avail = holidayAvail(r);
      return avail ? (Number(r.D) || 0) / avail : 0;
    }

    let sum =
      '<table class="wd688pr-sum"><thead><tr>' +
      '<th class="wd688pr-lab">項目</th>';
    for (let i = 0; i < rows.length; i += 1) {
      sum += '<th>' + rows[i].m + '月</th>';
    }
    sum += '<th class="wd688pr-year">年</th></tr></thead><tbody>';

    if (isWind) {
      sum +=
        '<tr><td class="wd688pr-lab">風速日数 ※1<br><span style="font-size:8pt;font-weight:normal">(' +
        windTh +
        'm/s以上・過去5年月平均)</span></td>' +
        monthCells(function (r) {
          return windPdfMonth(r).weatherR;
        }, { fixed: 1 }) +
        yearCell(windYear.weatherR, { fixed: 1 }) +
        '</tr>';
    } else if (isHoliday) {
      sum +=
        '<tr><td class="wd688pr-lab">降雨日数 ※1<br><span style="font-size:8pt;font-weight:normal">(' +
        rainTh +
        'mm以上)</span></td>' +
        monthCells(function () {
          return 0;
        }) +
        yearCell(0) +
        '</tr>';
    } else {
      sum +=
        '<tr><td class="wd688pr-lab">降雨日数 ※1<br><span style="font-size:8pt;font-weight:normal">(' +
        rainTh +
        'mm以上・過去5年月平均)</span></td>' +
        monthCells(function (r) {
          return paintPdfMonth(r).weatherR;
        }, { fixed: 1 }) +
        yearCell(pdfYear.weatherR, { fixed: 1 }) +
        '</tr>';
    }

    sum +=
      '<tr><td class="wd688pr-lab" colspan="' +
      (rows.length + 2) +
      '">休日数</td></tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">土　曜・日　曜</td>' +
      monthCells(function (r) {
        return r.weekends;
      }) +
      yearCell(yt.weekends) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">祝　日・祭　日</td>' +
      monthCells(function (r) {
        return r.weekdayHol;
      }) +
      yearCell(yt.weekdayHol) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">年　末　年　始</td>' +
      monthCells(function (r) {
        return r.nye;
      }) +
      yearCell(yt.nye) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">G　W</td>' +
      monthCells(function (r) {
        return r.gw;
      }) +
      yearCell(yt.gw) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">夏　休　み</td>' +
      monthCells(function (r) {
        return r.summer;
      }) +
      yearCell(yt.summer) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">計</td>' +
      monthCells(function (r) {
        return r.D;
      }) +
      yearCell(yt.D) +
      '</tr>';

    if (isWind) {
      sum +=
        '<tr><td class="wd688pr-lab">休日数と風速日数のダブり ※2</td>' +
        monthCells(function (r) {
          return windPdfMonth(r).overlap;
        }, { fixed: 1 }) +
        yearCell(windYear.overlap, { fixed: 1 }) +
        '</tr>';
    } else if (isHoliday) {
      sum +=
        '<tr><td class="wd688pr-lab">休日数と降雨日数のダブり ※2</td>' +
        monthCells(function () {
          return 0;
        }, { fixed: 1 }) +
        yearCell(0, { fixed: 1 }) +
        '</tr>';
    } else {
      sum +=
        '<tr><td class="wd688pr-lab">休日数と降雨日数のダブり ※2</td>' +
        monthCells(function (r) {
          return paintPdfMonth(r).overlap;
        }, { fixed: 1 }) +
        yearCell(pdfYear.overlap, { fixed: 1 }) +
        '</tr>';
    }

    sum +=
      '<tr><td class="wd688pr-lab">暦　　　　　日</td>' +
      monthCells(function (r) {
        return r.C;
      }) +
      yearCell(yt.C) +
      '</tr>';

    if (isWind) {
      sum +=
        '<tr><td class="wd688pr-lab">稼　働　可　能　日　数　※3</td>' +
        monthCells(function (r) {
          return windPdfMonth(r).avail;
        }, { fixed: 1 }) +
        yearCell(windYear.avail, { fixed: 1 }) +
        '</tr>' +
        '<tr><td class="wd688pr-lab">不　稼　働　率　※4</td>' +
        monthCells(function (r) {
          return r.H_rate;
        }, { pct: true }) +
        yearCell(yt.rate, { pct: true }) +
        '</tr>';
    } else if (isHoliday) {
      sum +=
        '<tr><td class="wd688pr-lab">稼　働　可　能　日　数　※3</td>' +
        monthCells(function (r) {
          return holidayAvail(r);
        }) +
        yearCell(yt.C - yt.D) +
        '</tr>' +
        '<tr><td class="wd688pr-lab">不　稼　働　率　※4</td>' +
        monthCells(function (r) {
          return holidayRate(r);
        }, { pct: true }) +
        yearCell(yt.D && yt.C - yt.D ? yt.D / (yt.C - yt.D) : 0, { pct: true }) +
        '</tr>';
    } else {
      sum +=
        '<tr><td class="wd688pr-lab">稼　働　可　能　日　数　※3</td>' +
        monthCells(function (r) {
          return paintPdfMonth(r).avail;
        }, { fixed: 1 }) +
        yearCell(pdfYear.avail, { fixed: 1 }) +
        '</tr>' +
        '<tr><td class="wd688pr-lab">不　稼　働　率　※4</td>' +
        monthCells(function (r) {
          return r.K_rate;
        }, { pct: true }) +
        yearCell(yt.rate, { pct: true }) +
        '</tr>' +
        '<tr><td class="wd688pr-lab">雨休率（％）</td>' +
        monthCells(function (r) {
          return paintPdfMonth(r).ratePct;
        }, { rainPctInt: true }) +
        yearCell(pdfYear.ratePct, { rainPctInt: true }) +
        '</tr>';
    }

    sum += '</tbody></table>';
    return sum;
  }

  function buildPrintFootnotes(mode, pastLabel, rainTh, windTh) {
    if (mode === 'scaffold') {
      return (
        '<div class="wd688pr-notes">' +
        '<p>※1　風速日数は、見積作成年の過去5年間（' +
        escHtml(pastLabel) +
        '）の月平均日数（' +
        escHtml(windTh) +
        'm/s以上の日数）です。</p>' +
        '<p>※2　休日数と風速日数のダブり＝風速日数×（休日数÷暦日数）</p>' +
        '<p>※3　稼働可能日数＝暦日数－（休日数＋風速日数－ダブり）</p>' +
        '<p>※4　不稼働率＝（休日数＋風速日数－ダブり）÷稼働可能日数</p>' +
        '</div>'
      );
    }
    if (mode === 'holiday') {
      return (
        '<div class="wd688pr-notes">' +
        '<p>※1　上段表は休日数のみ（降雨日数は0）。カレンダー下は月別の降雨・休日内訳です。</p>' +
        '<p>※2　休日数と降雨日数のダブり＝降雨日数×（休日数÷暦日数）</p>' +
        '<p>※3　稼働可能日数＝暦日数－休日数（休日シート上段）</p>' +
        '<p>※4　不稼働率＝休日数÷稼働可能日数（休日シート上段）</p>' +
        '</div>'
      );
    }
    return (
      '<div class="wd688pr-notes">' +
      '<p>※1　降雨日数は、見積作成年の過去5年間（' +
      escHtml(pastLabel) +
      '）の月平均日数（' +
      escHtml(rainTh) +
      'mm以上の日数）です。</p>' +
      '<p>※2　休日数と降雨日数のダブり＝降雨日数×（休日数÷暦日数）</p>' +
      '<p>※3　稼働可能日数＝暦日数－休日数－降雨日数＋ダブり</p>' +
      '<p>※4　不稼働率＝（休日数＋降雨日数－ダブり）÷稼働可能日数</p>' +
      '<p>　　雨休率（％）＝（休日数＋降雨日数－ダブり）÷稼働可能日数（整数％・工期設定資料p.94）</p>' +
      '</div>'
    );
  }

  function buildWorkdaysMgmtPrintSection(config) {
    const rows = sortMonthlyRows(config.rows || []);
    const calYear = config.calYear;
    const mode = config.mode;
    const markSet = config.markSet || new Set();
    const calMode = mode === 'scaffold' ? 'scaffold' : 'paint';

    return (
      '<div class="wd688pr-section">' +
      sheetTabsHtml(config.sheetTab) +
      '<h1 class="wd688pr-title">' +
      escHtml(config.sheetTab) +
      '</h1>' +
      buildPrintSummaryTable(rows, mode, {
        rainTh: config.rainTh,
        windTh: config.windTh,
      }) +
      buildPrintFootnotes(mode, config.pastLabel, config.rainTh, config.windTh) +
      '<section class="wd688pr-cal-section">' +
      renderCalendarYearSection(calYear, rows, calMode, markSet) +
      '</section></div>'
    );
  }

  function renderPrintOne5yrTable(refBlock, title, estimateYear) {
    if (!refBlock || !refBlock.months) {
      return '<p style="color:#888">' + escHtml(title) + ' — データなし</p>';
    }
    const built = build5yrMonthlyAverages(refBlock, estimateYear);
    const years = built.years;
    const months = built.months.slice().sort(function (a, b) {
      return a.m - b.m;
    });

    let html =
      '<div class="wd688pr-5yr-block"><h3>' +
      escHtml(title) +
      '</h3><table class="wd688pr-sum"><thead><tr>' +
      '<th class="wd688pr-lab">月</th>';
    for (let i = 0; i < years.length; i += 1) {
      html += '<th>' + years[i] + '年</th>';
    }
    html += '<th class="wd688pr-year">平均</th></tr></thead><tbody>';

    for (let i = 0; i < months.length; i += 1) {
      const row = months[i];
      html += '<tr><td class="wd688pr-lab">' + monthLabel(row.m) + '</td>';
      for (let j = 0; j < years.length; j += 1) {
        const y = years[j];
        const v = row.byYear && row.byYear[y] != null ? row.byYear[y] : '—';
        html += '<td>' + escHtml(v) + '</td>';
      }
      html += '<td class="wd688pr-year">' + fmtNum(row.avg, 1) + '</td></tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function buildPrint5yrSection(kind, estYear, pastLabel) {
    const ref = getRef5yr();
    const isWind = kind === 'wind';
    const thresholds = isWind ? REF5YR_WIND_THRESHOLDS : REF5YR_RAIN_THRESHOLDS;
    const sheetTab = isWind ? '過去5年月別風速日数' : '過去5年月別降雨日数';

    let html =
      '<div class="wd688pr-section">' +
      sheetTabsHtml(sheetTab) +
      '<h1 class="wd688pr-title">' +
      escHtml(sheetTab) +
      '</h1>' +
      '<p class="wd688pr-meta-line">' +
      escHtml(ref.location || '大宮地区') +
      '　気象庁過去5年データ（見積作成年 ' +
      escHtml(estYear) +
      '年 → ' +
      escHtml(pastLabel) +
      '）</p>';

    for (let i = 0; i < thresholds.length; i += 1) {
      const th = thresholds[i];
      const key = ref5yrBlockKey(isWind ? 'wind' : 'rain', th);
      html += renderPrintOne5yrTable(ref[key], ref5yrBlockTitle(key), estYear);
    }

    html += '</div>';
    return html;
  }

  function buildFullClientReportHtml() {
    const estYear = state.lastResult.estimateYear || currentEstimateYear();
    const pastYears = state.lastResult.pastYears || pastFiveYearsForEstimate(estYear);
    const pastLabel =
      pastYears.length >= 2
        ? pastYears[0] + '年〜' + pastYears[pastYears.length - 1] + '年'
        : pastYears.join('・');
    const rainTh = state.threshold_rain_mm != null ? state.threshold_rain_mm : 10;
    const windTh = state.threshold_wind_ms != null ? state.threshold_wind_ms : 10;
    const calYear = state.holiday_fiscal_year || estYear;
    const rainRows = sortMonthlyRows(state.lastResult.monthlyRain || []);
    const windRows = sortMonthlyRows(state.lastResult.monthlyWind || []);
    const rainSet = buildRainDaySetForYear(calYear, state.rain, rainTh);
    const windSet = buildWindDaySetForYear(calYear, state.wind, windTh);
    const obsNote = state.obs_location_note ? '（' + state.obs_location_note + '）' : '';

    const meta =
      '<div class="wd688pr-meta"><table>' +
      '<tr><th>工事名</th><td>' +
      escHtml(state.project_name || '—') +
      '</td><th>見積作成年</th><td>' +
      escHtml(estYear) +
      '年</td></tr>' +
      '<tr><th>観測地点</th><td colspan="3">' +
      escHtml(state.obs_location || '—') +
      escHtml(obsNote) +
      '　／　足場 稼働可能日数: <strong>' +
      fmtNum(state.result_scaffold_days, 2) +
      ' 日</strong>　／　塗装: <strong>' +
      fmtNum(state.result_paint_days, 2) +
      ' 日</strong></td></tr></table></div>';

    return (
      meta +
      buildWorkdaysMgmtPrintSection({
        sheetTab: '工事稼働日管理 (塗装)',
        rows: rainRows,
        mode: 'paint',
        calYear: calYear,
        markSet: rainSet,
        pastLabel: pastLabel,
        rainTh: rainTh,
        windTh: windTh,
      }) +
      buildWorkdaysMgmtPrintSection({
        sheetTab: '工事稼働日管理 (足場)',
        rows: windRows,
        mode: 'scaffold',
        calYear: calYear,
        markSet: windSet,
        pastLabel: pastLabel,
        rainTh: rainTh,
        windTh: windTh,
      }) +
      buildWorkdaysMgmtPrintSection({
        sheetTab: '工事稼働日管理 (休日)',
        rows: rainRows,
        mode: 'holiday',
        calYear: calYear,
        markSet: rainSet,
        pastLabel: pastLabel,
        rainTh: rainTh,
        windTh: windTh,
      }) +
      buildPrint5yrSection('rain', estYear, pastLabel) +
      buildPrint5yrSection('wind', estYear, pastLabel)
    );
  }

  function buildPaintClientReportHtml() {
    return buildFullClientReportHtml();
  }

  function openPaintClientReportPrint() {
    try {
      readFormIntoState();
      runCalc();
      if (
        !state.lastResult ||
        !state.lastResult.monthlyRain ||
        !state.lastResult.monthlyRain.length ||
        !state.lastResult.monthlyWind ||
        !state.lastResult.monthlyWind.length
      ) {
        alert('算出結果がありません。「再算出」後にお試しください。');
        return;
      }
      var html = buildFullClientReportHtml();
      if (!html || html.indexOf('wd688pr-sum') < 0) {
        throw new Error('報告HTMLの生成に失敗しました');
      }
      injectPrintPortalCss();
      bindPrintPortalCleanup();
      var portal = ensurePrintPortal();
      portal.innerHTML = html;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          try {
            window.print();
          } catch (err) {
            console.warn(BUILD, err);
            alert('印刷を開始できませんでした: ' + (err.message || err));
          }
        });
      });
    } catch (e) {
      alert('印刷の準備に失敗しました: ' + (e.message || e));
      console.error(BUILD, e);
    }
  }

  function sortMonthlyRows(rows) {
    return rows.slice().sort(function (a, b) {
      return a.m - b.m;
    });
  }

  function renderOne5yrTable(refBlock, title, estimateYear) {
    if (!refBlock || !refBlock.months) {
      return '<p style="color:#888">' + title + ' — データなし</p>';
    }
    const built = build5yrMonthlyAverages(refBlock, estimateYear);
    const years = built.years;
    const months = built.months.slice().sort(function (a, b) {
      return a.m - b.m;
    });

    let html =
      '<h4 style="margin:16px 0 8px;font-size:13px;">' +
      title +
      '</h4>' +
      '<div class="wd688-excel-wrap"><table class="wd688-table wd688-excel-table"><thead><tr>' +
      '<th class="wd688-row-label">月</th>';
    for (let i = 0; i < years.length; i += 1) {
      html += '<th>' + years[i] + '年</th>';
    }
    html += '<th class="wd688-year-col">平均</th></tr></thead><tbody>';

    for (let i = 0; i < months.length; i += 1) {
      const row = months[i];
      html += '<tr><td class="wd688-row-label">' + monthLabel(row.m) + '</td>';
      for (let j = 0; j < years.length; j += 1) {
        const y = years[j];
        const v = row.byYear && row.byYear[y] != null ? row.byYear[y] : '—';
        html += '<td>' + v + '</td>';
      }
      html += '<td class="wd688-year-col">' + fmtNum(row.avg, 1) + '</td></tr>';
    }
    html += '</tbody></table></div>';
    if (built.missingYears.length) {
      html +=
        '<p style="color:#b45309;font-size:11px;margin:4px 0 0;">不足年: ' +
        built.missingYears.join(', ') +
        '</p>';
    }
    return html;
  }

  function render5yrReferenceTable(kind) {
    const estimateYear = currentEstimateYear();
    const ref = getRef5yr();
    const isWind = kind === 'wind';
    const thresholds = isWind ? REF5YR_WIND_THRESHOLDS : REF5YR_RAIN_THRESHOLDS;
    const sectionTitle = isWind ? '過去5年月別風速日数' : '過去5年月別降雨日数';
    const period = isWind ? ref.windPeriod : ref.rainPeriod;

    let html =
      '<div style="font-size:13px;line-height:1.6;margin-bottom:10px;">' +
      '<strong>' +
      sectionTitle +
      '</strong>（' +
      ref.location +
      '・見積作成年 <strong>' +
      estimateYear +
      '年</strong> → 対象 <strong>' +
      pastFiveYearsForEstimate(estimateYear).join('・') +
      '年</strong>' +
      (period ? '／登録データ: ' + period : '') +
      '）</div>';
    if (ref.updatedFromCsv) {
      html +=
        '<p style="font-size:12px;color:#047857;margin:0 0 10px;">CSV取込反映日: ' +
        ref.updatedFromCsv +
        '</p>';
    }

    for (let i = 0; i < thresholds.length; i += 1) {
      const th = thresholds[i];
      const key = ref5yrBlockKey(isWind ? 'wind' : 'rain', th);
      html += renderOne5yrTable(ref[key], ref5yrBlockTitle(key), estimateYear);
    }

    html +=
      '<p style="font-size:12px;color:#64748b;margin:12px 0 0;">' +
      '※ 足場・塗装の ※1 には <strong>≧10m/s</strong>・<strong>≧10mm</strong> の平均列を使用。上記は Excel シートと同様の全閾値表です。' +
      ' CSV取込で全表が自動更新されます。' +
      '</p>';
    return html;
  }

  function renderMonthlyTable() {
    const host = document.getElementById('wd688-monthly');
    if (!host) return;

    if (activeTab === 'ref-wind') {
      host.innerHTML = render5yrReferenceTable('wind');
      return;
    }
    if (activeTab === 'ref-rain') {
      host.innerHTML = render5yrReferenceTable('rain');
      return;
    }

    if (!state.lastResult) {
      host.innerHTML =
        '<p style="color:#666">「再算出」で月別内訳を表示します（Excel 20260613 準拠・常に1〜12月）</p>';
      return;
    }

    const estYear = state.lastResult.estimateYear || currentEstimateYear();
    const pastYears = state.lastResult.pastYears ? state.lastResult.pastYears.join('・') : '—';
    let rows;
    if (activeTab === 'scaffold') {
      rows = sortMonthlyRows(state.lastResult.monthlyWind || []);
    } else {
      rows = sortMonthlyRows(state.lastResult.monthlyRain || []);
    }
    if (rows.length !== 12) {
      host.innerHTML = '<p style="color:#c00">月別データが12ヶ月分揃っていません。</p>';
      return;
    }

    let intro =
      '<p style="font-size:12px;color:#555;margin:0 0 8px;">' +
      '見積作成年 <strong>' +
      estYear +
      '年</strong>（休日・暦日基準）／過去5年 <strong>' +
      pastYears +
      '年</strong> の月平均を ※1 に使用。表は1月〜12月固定。GW・夏休み・年末年始はセル内編集可（編集後は再算出）。' +
      '</p>';

    if (activeTab === 'scaffold') {
      host.innerHTML = intro + renderExcelTransposedTable(rows, 'scaffold');
    } else if (activeTab === 'paint' || activeTab === 'holiday') {
      host.innerHTML = intro + renderExcelTransposedTable(rows, 'paint');
    }

    const inputs = host.querySelectorAll('.wd688-hm-in');
    for (let j = 0; j < inputs.length; j += 1) {
      inputs[j].addEventListener('change', markDirty);
    }
  }

  function updateTabButtons() {
    ['scaffold', 'paint', 'holiday', 'ref-wind', 'ref-rain'].forEach(function (tab) {
      const btn = document.getElementById('wd688-tab-' + tab);
      if (!btn) return;
      if (tab === activeTab) {
        btn.classList.add('wd688-tab-active');
      } else {
        btn.classList.remove('wd688-tab-active');
      }
    });
  }

  function switchTab(tab) {
    if (tab === 'holiday') readHolidayManualFromForm();
    activeTab = tab;
    updateTabButtons();
    renderMonthlyTable();
  }

  function refreshProjectSelect(projects, selectedId) {
    const sel = document.getElementById('wd688-project-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">— 案件を選択 —</option>';
    for (let i = 0; i < projects.length; i += 1) {
      const p = projects[i];
      const id = p.$id && p.$id.value;
      const name = gv(p, FC.project) || '（名称なし）';
      let est = gv(p, FC.estimate);
      if (est === '') est = gv(p, FC.fiscal);
      if (est === '') {
        const start = String(gv(p, FC.start)).slice(0, 10);
        if (start) est = start.slice(0, 4);
      }
      const opt = document.createElement('option');
      opt.value = String(id);
      opt.textContent = '#' + id + ' ' + name + (est ? ' (' + est + '年見積)' : '');
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
      try {
        runCalc();
        fillFormFromState();
      } catch (_e2) {
        /* 再算出不可時は保存値のみ表示 */
      }
    });
  }

  function saveTo687() {
    readFormIntoState();
    if (!state.project_name.trim()) throw new Error('工事名を入力してください');
    if (state.estimate_year == null) throw new Error('見積作成年を入力してください');
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
    const year = Number(todayJstYmd().slice(0, 4));
    state = emptyState();
    state.project_name = '新規案件';
    state.estimate_year = year;
    state.threshold_wind_ms = 10;
    state.threshold_rain_mm = 10;
    state.holiday_fiscal_year = year;
    syncRef5yrFromDaily();
    state.dirty = true;
    activeTab = 'scaffold';
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
      '.wd688-excel-wrap{overflow-x:auto;margin:8px 0;}' +
      '.wd688-excel-table .wd688-row-label{text-align:left;min-width:200px;background:#f8fafc;font-weight:600;white-space:nowrap;}' +
      '.wd688-excel-table .wd688-year-col{background:#fffbeb;font-weight:600;}' +
      '.wd688-excel-table .wd688-indent{font-weight:bold;background:#eef2f7;text-align:left;}' +
      '.wd688-sub{font-size:11px;color:#64748b;font-weight:normal;}' +
      '.wd688-indent2{padding-left:1.2em;display:inline-block;}' +
      '.wd688-root{font-family:Segoe UI,Meiryo,sans-serif;max-width:1200px;margin:0 auto;padding:12px;}' +
      '.wd688-tabs{display:flex;gap:4px;margin:12px 0 8px;flex-wrap:wrap;}' +
      '.wd688-tab{padding:8px 18px;cursor:pointer;border:1px solid #94a3b8;border-radius:6px 6px 0 0;background:#f1f5f9;font-size:13px;font-weight:600;}' +
      '.wd688-tab.wd688-tab-active{background:#2563eb;color:#fff;border-color:#2563eb;}';
    document.head.appendChild(st);
  }

  function csvHelpHtml() {
    return (
      '<div style="font-weight:bold;margin-bottom:10px;font-size:14px;">気象データの入手（過去5年・気象庁）</div>' +
      '<p style="margin:0 0 12px;line-height:1.75;">' +
      '※1 の気象日数は、<strong>見積作成年の直前5年間</strong>の日別データから求めた<strong>月別平均日数</strong>です。' +
      '見積作成年を入力すると対象年が決まります（例: <strong>2026年</strong>見積 → <strong>2021・2022・2023・2024・2025年</strong>）。' +
      '算出には組込の参照表（タブ「過去5年(風速)」「過去5年(降雨)」）を使います。下記は打合せ資料との照合・監査用に、気象庁から同じ期間の CSV を取得する手順です。' +
      '</p>' +
      '<p style="margin:0 0 12px;padding:10px 12px;background:#f1f5f9;border-radius:6px;line-height:1.75;font-size:12px;">' +
      '<strong>共通手順（気象庁・過去の気象データダウンロード）</strong><br>' +
      '1. サイトを開く：<a href="' +
      JMA_OBSDL +
      '" target="_blank" rel="noopener">' +
      JMA_OBSDL +
      '</a><br>' +
      '2. <strong>地点</strong> … 案件の観測地点を選択（大宮地区の場合は<strong>埼玉</strong>など近傍の観測所）<br>' +
      '3. <strong>期間</strong> … 見積作成年の <strong>5年前の1月1日</strong> 〜 <strong>昨年の12月31日</strong>（上記例なら 2021/1/1〜2025/12/31）。年ごとに分けて取得しても可<br>' +
      '4. <strong>項目</strong> … 「<strong>日別値</strong>」を選択<br>' +
      '5. 下記の気象要素を選び CSV ダウンロード →「CSV→風速」「CSV→降雨」で取込（<strong>全閾値表が自動更新</strong>・再算出可能）' +
      '</p>' +
      '<p style="margin:0 0 12px;line-height:1.75;">' +
      '<strong>① 風速（足場・※1）</strong><br>' +
      '気象要素：<strong>日最大風速 (m/s)</strong><br>' +
      '数え方：各日の値が <strong>10m/s 以上</strong> の日を1日とカウント → 月ごとに集計 → 5年分の同月平均（小数可）<br>' +
      'CSV形式：<strong>日付・風速の2列</strong>（ヘッダ行は自動スキップ）' +
      '</p>' +
      '<p style="margin:0 0 12px;line-height:1.75;">' +
      '<strong>② 降雨（塗装・休日・※1）</strong><br>' +
      '気象要素：<strong>降水量の日合計 (mm)</strong>（日別値の1日合計＝日降水量。サイトによって「降水量の合計」と表記される場合も同じ項目）<br>' +
      '数え方：各日の値が <strong>10mm 以上</strong> の日を1日とカウント → 月ごとに集計 → 5年分の同月平均<br>' +
      'CSV形式：<strong>日付・降水量の2列</strong>' +
      '</p>' +
      '<p style="margin:0;line-height:1.75;font-size:12px;color:#475569;">' +
      '<strong>過去5年表の見方</strong> … タブ「過去5年(風速)」「過去5年(降雨)」に Excel シートと同じ<strong>全閾値表</strong>（風速: ≧10/15/20/30m/s、降雨: ≧1/10/30/50/70/100mm）を表示します。' +
      ' CSV を取込むと登録済みデータが更新され、見積作成年に応じた5年分の平均列が再計算されます。' +
      '</p>'
    );
  }

  function buildDashboard() {
    const header = kintone.app.getHeaderSpaceElement();
    if (!header) return;
    header.innerHTML = '';
    injectHideListCss();
    injectPrintPortalCss();
    bindPrintPortalCleanup();

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
      '見積作成年・観測地点を入力し「再算出」→「保存」してください。表は常に<strong>1月〜12月</strong>。※1 気象日数は見積作成年の<strong>直前5年間</strong>の月平均です（例: 2026年見積 → 2021〜2025年）。休日は自動＋GW/夏/年末年始は表内で編集できます。' +
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
      '<label>見積作成年<br><input id="wd688-estimate" type="number" min="2000" max="2100" step="1" style="width:100%"></label>' +
      '<label>観測地点<br><select id="wd688-obs" style="width:100%">' +
      obsOpts +
      '</select></label>' +
      '<label>地点備考<br><input id="wd688-obs-note" type="text" style="width:100%"></label>' +
      '<label>風速閾値(m/s)<br><input id="wd688-wind-th" type="number" step="0.1" style="width:100%"></label>' +
      '<label>降雨閾値(mm)<br><input id="wd688-rain-th" type="number" step="0.1" style="width:100%"></label></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0;padding:12px;background:#e8f4fc;border-radius:8px;">' +
      '<div><span style="font-size:12px;color:#555">足場 稼働可能日数</span><br><strong id="wd688-scaffold" style="font-size:22px">—</strong></div>' +
      '<div><span style="font-size:12px;color:#555">塗装 稼働可能日数</span><br><strong id="wd688-paint" style="font-size:22px">—</strong></div>' +
      '<button type="button" id="wd688-calc" class="kintoneplugin-button-dialog-ok">再算出</button>' +
      '<button type="button" id="wd688-save" class="kintoneplugin-button-dialog-ok">保存</button>' +
      '<button type="button" id="wd688-print-paint" class="kintoneplugin-button-normal">施工主報告用印刷</button></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 4px;">' +
      '<span style="font-size:13px;font-weight:bold;color:#334155">気象CSV取込（過去5年表を自動更新）：</span>' +
      '<button type="button" id="wd688-csv-wind" class="kintoneplugin-button-normal">CSV→風速</button>' +
      '<button type="button" id="wd688-csv-rain" class="kintoneplugin-button-normal">CSV→降雨</button></div>' +
      '<div id="wd688-csv-help" style="margin:0 0 14px;padding:12px 14px;background:#fff;border:1px solid #d0d7de;border-radius:8px;font-size:13px;line-height:1.7;color:#1e293b;">' +
      csvHelpHtml() +
      '</div>' +
      '<div class="wd688-tabs">' +
      '<button type="button" class="wd688-tab wd688-tab-active" id="wd688-tab-scaffold">足場</button>' +
      '<button type="button" class="wd688-tab" id="wd688-tab-paint">塗装</button>' +
      '<button type="button" class="wd688-tab" id="wd688-tab-holiday">休日</button>' +
      '<button type="button" class="wd688-tab" id="wd688-tab-ref-wind">過去5年(風速)</button>' +
      '<button type="button" class="wd688-tab" id="wd688-tab-ref-rain">過去5年(降雨)</button></div>' +
      '<div id="wd688-meta" style="font-size:12px;color:#666;margin-bottom:8px"></div>' +
      '<div id="wd688-monthly"></div>' +
      '<input type="file" id="wd688-csv-file" accept=".csv,.txt" style="display:none">';

    header.appendChild(root);

    ['wd688-project', 'wd688-estimate', 'wd688-obs', 'wd688-obs-note', 'wd688-wind-th', 'wd688-rain-th'].forEach(
      function (id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', markDirty);
      },
    );

    document.getElementById('wd688-tab-scaffold').addEventListener('click', function () {
      switchTab('scaffold');
    });
    document.getElementById('wd688-tab-paint').addEventListener('click', function () {
      switchTab('paint');
    });
    document.getElementById('wd688-tab-holiday').addEventListener('click', function () {
      switchTab('holiday');
    });
    document.getElementById('wd688-tab-ref-wind').addEventListener('click', function () {
      switchTab('ref-wind');
    });
    document.getElementById('wd688-tab-ref-rain').addEventListener('click', function () {
      switchTab('ref-rain');
    });

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

    document.getElementById('wd688-print-paint').addEventListener('click', openPaintClientReportPrint);

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

    fileInput.addEventListener('change', function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file || !pendingCsvKind) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const text = decodeCsvArrayBuffer(reader.result);
          const rows = parseCsvTwoColumn(text);
          if (!rows.length) {
            alert('有効なデータ行がありません');
            return;
          }
          readFormIntoState();
          if (pendingCsvKind === 'wind') {
            state.wind = rows;
            state.ref5yr = mergeDailyCsvIntoRef5yr(getRef5yr(), rows, 'wind');
          } else {
            state.rain = rows;
            state.ref5yr = mergeDailyCsvIntoRef5yr(getRef5yr(), rows, 'rain');
          }
          markDirty();
          let msg =
            rows.length +
            ' 行取込みました。過去5年表（全閾値）を更新しました。';
          try {
            runCalc();
            fillFormFromState();
            msg += ' 再算出も完了しました。';
          } catch (calcErr) {
            msg += ' 再算出: ' + (calcErr.message || calcErr);
          }
          if (activeTab === 'ref-wind' || activeTab === 'ref-rain') renderMonthlyTable();
          alert(msg + ' 「保存」で記録に反映されます。');
        } catch (e) {
          alert('CSVエラー: ' + (e.message || e));
        }
        pendingCsvKind = null;
      };
      reader.readAsArrayBuffer(file);
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
