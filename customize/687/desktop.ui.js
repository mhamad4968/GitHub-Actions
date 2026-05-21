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

  const SHOW_EVENTS = ['app.record.create.show', 'app.record.edit.show'];

  function numVal(field) {
    if (!field || field.value === '' || field.value == null) return null;
    const n = Number(field.value);
    return Number.isFinite(n) ? n : null;
  }

  function strVal(field) {
    return field && field.value != null ? String(field.value).trim() : '';
  }

  function readSubtable(record, tbl, dateFc, valFc) {
    const rows = (record[tbl] && record[tbl].value) || [];
    const out = [];
    for (let i = 0; i < rows.length; i += 1) {
      const v = rows[i].value || {};
      const date = strVal(v[dateFc]);
      const n = numVal(v[valFc]);
      if (!date || n == null) continue;
      out.push({ date: date.slice(0, 10), value: n });
    }
    return out;
  }

  function setSubtable(record, tbl, dateFc, valFc, rows) {
    record[tbl].value = rows.map(function (r) {
      const row = { value: {} };
      row.value[dateFc] = { type: 'DATE', value: r.date };
      row.value[valFc] = { type: 'NUMBER', value: String(r.value) };
      return row;
    });
  }

  function normalizeDate(raw) {
    const s = String(raw).trim();
    let m = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/.exec(s);
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
      if (/日付|年月日|date|風速|降雨|降水|湿度|max|mean/i.test(cols[0] + cols[1])) continue;
      const date = normalizeDate(cols[0]);
      const val = parseFloat(String(cols[1]).replace(/[^\d.\-]/g, ''));
      if (!date || Number.isNaN(val)) continue;
      rows.push({ date: date, value: val });
    }
    return rows;
  }

  function csvDateRange(rows) {
    if (!rows.length) return null;
    let min = rows[0].date;
    let max = rows[0].date;
    for (let i = 1; i < rows.length; i += 1) {
      if (rows[i].date < min) min = rows[i].date;
      if (rows[i].date > max) max = rows[i].date;
    }
    return { min: min, max: max };
  }

  function validateThresholds(windTh, rainTh, humTh) {
    if (windTh <= 0 || rainTh <= 0) throw new Error('風速・降雨の閾値は正の数にしてください');
    if (humTh < 0 || humTh > 100) throw new Error('湿度閾値は 0〜100 にしてください');
  }

  function buildCalcNote(result, warnings) {
    const lines = [
      'BUILD=' + BUILD,
      '足場=' + result.scaffold.toFixed(2) + ' / 塗装=' + result.paint.toFixed(2),
      '（塗装=降雨∪湿度の和集合・休日=土日+平日祝日）',
      '',
      '月 | 年 | 暦 | 休 | 風 | 雨湿 | M | 足場N | 塗装O',
    ];
    for (let i = 0; i < result.monthly.length; i += 1) {
      const r = result.monthly[i];
      lines.push(
        [
          r.m,
          r.calYear,
          r.C,
          r.D,
          r.E,
          r.W,
          r.M.toFixed(0),
          r.N.toFixed(2),
          r.O.toFixed(2),
        ].join(' | '),
      );
    }
    if (warnings.length) {
      lines.push('', '【警告】', warnings.join('\n'));
    }
    return lines.join('\n');
  }

  function runCalcOnRecord(record) {
    const start = strVal(record[FC.start]);
    const end = strVal(record[FC.end]);
    if (!start || !end) throw new Error('着工日・完工日を入力してください');

    const windTh = numVal(record[FC.windTh]) ?? 10;
    const rainTh = numVal(record[FC.rainTh]) ?? 10;
    const humTh = numVal(record[FC.humTh]) ?? 85;
    validateThresholds(windTh, rainTh, humTh);

    let fiscal = numVal(record[FC.fiscal]);
    if (fiscal == null) fiscal = inferFiscalYear(start);

    const wind = readSubtable(record, FC.windTbl, FC.windDate, FC.windVal);
    const rain = readSubtable(record, FC.rainTbl, FC.rainDate, FC.rainVal);
    const hum = readSubtable(record, FC.humTbl, FC.humDate, FC.humVal);

    if (!wind.length) throw new Error('風速データがありません（CSV取込またはサブテーブル入力）');
    if (!rain.length) throw new Error('降雨データがありません');
    if (!hum.length) throw new Error('湿度データがありません');

    const warnings = [];
    const wr = csvDateRange(wind);
    const rr = csvDateRange(rain);
    const hr = csvDateRange(hum);
    if (wr && (wr.min > start || wr.max < end)) {
      warnings.push('風速CSVの日付範囲(' + wr.min + '〜' + wr.max + ')が工期を十分カバーしていない可能性があります');
    }
    if (rr && (rr.min > start || rr.max < end)) {
      warnings.push('降雨CSVの日付範囲が工期を十分カバーしていない可能性があります');
    }
    if (hr && (hr.min > start || hr.max < end)) {
      warnings.push('湿度CSVの日付範囲が工期を十分カバーしていない可能性があります');
    }
    const obs = strVal(record[FC.obs]);
    if (!obs) warnings.push('観測地点が未選択です（CSV地点と一致しているか確認してください）');

    const result = calcWorkdays({
      startDate: start,
      endDate: end,
      fiscalYear: fiscal,
      windTh: windTh,
      rainTh: rainTh,
      humTh: humTh,
      wind: wind,
      rain: rain,
      hum: hum,
    });

    record[FC.resScaffold].value = String(Math.round(result.scaffold * 100) / 100);
    record[FC.resPaint].value = String(Math.round(result.paint * 100) / 100);
    record[FC.calcAt].value = new Date().toISOString();
    record[FC.note].value = buildCalcNote(result, warnings);

    if (record[FC.fiscal].value === '' || record[FC.fiscal].value == null) {
      record[FC.fiscal].value = String(fiscal);
    }

    return result;
  }

  function ensureToolbar(event) {
    if (document.getElementById('workdays687-toolbar')) return;

    const header = kintone.app.record.getHeaderMenuSpaceElement();
    if (!header) return;

    const bar = document.createElement('div');
    bar.id = 'workdays687-toolbar';
    bar.style.cssText =
      'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0;padding:8px 12px;background:#e8f4fc;border:1px solid #3498db;border-radius:6px;font-size:13px;';

    const label = document.createElement('span');
    label.textContent = '稼働日数算出';
    label.style.fontWeight = 'bold';
    bar.appendChild(label);

    const buildTag = document.createElement('span');
    buildTag.textContent = BUILD;
    buildTag.style.cssText = 'color:#666;font-size:11px;';
    bar.appendChild(buildTag);

    function mkBtn(text, kind) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.className = 'kintoneplugin-button-dialog-ok';
      b.style.marginRight = '4px';
      b.dataset.kind = kind;
      return b;
    }

    const btnCalc = mkBtn('再算出', 'calc');
    const btnWind = mkBtn('CSV→風速', 'wind');
    const btnRain = mkBtn('CSV→降雨', 'rain');
    const btnHum = mkBtn('CSV→湿度', 'hum');
    bar.appendChild(btnCalc);
    bar.appendChild(btnWind);
    bar.appendChild(btnRain);
    bar.appendChild(btnHum);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.txt,text/csv';
    fileInput.style.display = 'none';
    fileInput.id = 'workdays687-csv-file';
    bar.appendChild(fileInput);

    let pendingKind = null;

    function pickCsv(kind) {
      pendingKind = kind;
      fileInput.value = '';
      fileInput.click();
    }

    btnCalc.addEventListener('click', function () {
      try {
        const rec = kintone.app.record.get();
        runCalcOnRecord(rec.record);
        kintone.app.record.set(rec);
        alert('再算出しました。\n足場: ' + rec.record[FC.resScaffold].value + ' 日\n塗装: ' + rec.record[FC.resPaint].value + ' 日');
      } catch (e) {
        alert('算出エラー: ' + (e.message || e));
      }
    });

    btnWind.addEventListener('click', function () {
      pickCsv('wind');
    });
    btnRain.addEventListener('click', function () {
      pickCsv('rain');
    });
    btnHum.addEventListener('click', function () {
      pickCsv('hum');
    });

    fileInput.addEventListener('change', function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file || !pendingKind) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const rows = parseCsvTwoColumn(reader.result);
          if (!rows.length) {
            alert('有効なデータ行がありません（日付,値 の2列CSVを想定）');
            return;
          }
          const rec = kintone.app.record.get();
          if (pendingKind === 'wind') {
            setSubtable(rec.record, FC.windTbl, FC.windDate, FC.windVal, rows);
          } else if (pendingKind === 'rain') {
            setSubtable(rec.record, FC.rainTbl, FC.rainDate, FC.rainVal, rows);
          } else {
            setSubtable(rec.record, FC.humTbl, FC.humDate, FC.humVal, rows);
          }
          kintone.app.record.set(rec);
          const rg = csvDateRange(rows);
          alert(
            (pendingKind === 'wind' ? '風速' : pendingKind === 'rain' ? '降雨' : '湿度') +
              'データ ' +
              rows.length +
              ' 行を取込みました' +
              (rg ? '\n期間: ' + rg.min + ' 〜 ' + rg.max : ''),
          );
        } catch (e) {
          alert('CSV取込エラー: ' + (e.message || e));
        }
        pendingKind = null;
      };
      reader.readAsText(file, 'UTF-8');
    });

    header.appendChild(bar);
  }

  kintone.events.on(SHOW_EVENTS, function (event) {
    ensureToolbar(event);
    return event;
  });

  kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], function (event) {
    try {
      const start = strVal(event.record[FC.start]);
      const end = strVal(event.record[FC.end]);
      if (start && end) {
        const sp = parseIsoDate(start);
        const ep = parseIsoDate(end);
        if (sp && ep) {
          const s = new Date(Date.UTC(sp.y, sp.mo - 1, sp.d, 12));
          const e = new Date(Date.UTC(ep.y, ep.mo - 1, ep.d, 12));
          if (s > e) {
            event.error = '着工日は完工日以前にしてください';
            return event;
          }
        }
      }
    } catch (_err) {
      /* noop */
    }
    return event;
  });
