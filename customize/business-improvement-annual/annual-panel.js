window.BiAnnualPanel = (function () {
  'use strict';

  /** 業務改善 ver.02 — 年次集計パネル（699ガイド / 713 共用） */
  var PANEL_BUILD = '2026-06-13-bi-annual-no-backdrop-close';

  var FONT_KEY = 'bi-proposal-font-size';
  var SPACE_ID = 'bi_annual_ui';

  var F = {
    yearKey: '年度キー',
    closed: '締め済み',
    closingDate: '締処理日',
    aggregatedAt: '集計実行日時',
    executor: '実行者',
    aggCount: '集計件数',
    auditCount: '検算_提案完了件数',
    resultJson: '集計結果JSON',
  };

  var HIDE_FIELDS = [
    F.yearKey, F.closed, F.closingDate, F.aggregatedAt, F.executor,
    F.aggCount, F.auditCount, F.resultJson,
  ];

  var PF = {
    type: '提案種別', date: '提案日', completed: '完了日', title: '提案件名',
    rank: '表彰ランク_最終', points: '付与ポイント', proposers: '提案者一覧',
    status: 'Status', updated: '更新日時', propDept: '提案者所属', propName: '提案者名',
  };

  var FETCH_FIELDS = [
    '$id', PF.type, PF.date, PF.completed, PF.title, PF.rank, PF.points,
    PF.proposers, PF.status, PF.updated, '作成日時',
  ];

  var FISCAL_MONTHS = ['carryover', '5', '6', '7', '8', '9', '10', '11', '12', '1', '2', '3', '4'];
  var FISCAL_MONTH_LABELS = {
    carryover: '前年度繰越', 5: '5月', 6: '6月', 7: '7月', 8: '8月', 9: '9月',
    10: '10月', 11: '11月', 12: '12月', 1: '1月', 2: '2月', 3: '3月', 4: '4月',
  };

  var DEPT_ORDER = {
    headOffice: [
      '総務部', '経理部', '経営企画部', '人事研修部', '安全推進部', '施工推進部',
      'メンテナンス技術部', '塗装技術部', '品質管理部',
    ],
    branchesAndOffices: [
      '東北支店', '秋田営業所', '盛岡営業所', '仙台営業所', '関越支店', '新潟営業所',
      '長野営業所', '高崎営業所', '東京支店', '水戸営業所', '千葉営業所', '東海支店',
      '東京営業所', '静岡営業所', '名古屋営業所', '関西営業所', '札幌支店', '首都圏支店',
      '鉄構支店', '湾岸工事所',
    ],
  };

  var ACCENT = '#166534';
  var ACCENT_DARK = '#15803d';
  var CARD_BG = '#fff';
  var GRADIENT = 'linear-gradient(135deg,#ecfdf5 0%,#d1fae5 45%,#f0fdf4 100%)';

  var ui = {
    root: null, record: null, recordId: null, locked: false, tab: 't1',
    result: null, busy: false, drill: null,
    mode: 'record', annualAppId: null, proposalAppId: 700, yearList: [], overlayEl: null,
    passphraseGuard: null, lastFetchedRaw: null, doneStatusKeys: null,
  };

  function runWithPassphrase(next) {
    if (typeof ui.passphraseGuard === 'function') {
      ui.passphraseGuard(next);
      return;
    }
    next();
  }

  function getAnnualAppId() {
    return ui.annualAppId || (typeof kintone !== 'undefined' && kintone.app && kintone.app.getId()) || 0;
  }

  function getProposalAppId() {
    return ui.proposalAppId || 700;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function val(rec, code) {
    if (!rec) return '';
    var f = rec[code];
    return f && f.value != null ? f.value : '';
  }

  function emptyAnnualRecord(yearKey) {
    var y = yearKey != null ? yearKey : currentFiscalYearKey();
    return {
      年度キー: { value: String(y) },
      締処理日: { value: todayISO() },
      締め済み: { value: [] },
      集計実行日時: { value: '' },
      実行者: { value: '' },
      集計件数: { value: '' },
      検算_提案完了件数: { value: '' },
      集計結果JSON: { value: '' },
    };
  }

  function fontKey() {
    var v = localStorage.getItem(FONT_KEY);
    if (v === 'xlarge') return 'xlarge';
    if (v === 'large') return 'large';
    return 'standard';
  }

  function fontPx() {
    var k = fontKey();
    if (k === 'xlarge') return '23px';
    if (k === 'large') return '18px';
    return '16px';
  }

  function fontBtnBg(key) {
    return fontKey() === key ? '#bbf7d0' : '#fff';
  }

  function fontToggleHtml() {
    return '<div><span style="margin-right:6px">文字サイズ：</span>' +
      '<button type="button" data-bi-font="standard" style="padding:5px 10px;margin-right:4px;border:1px solid #86efac;border-radius:6px;cursor:pointer;background:' +
      fontBtnBg('standard') + '">標準</button>' +
      '<button type="button" data-bi-font="large" style="padding:5px 10px;margin-right:4px;border:1px solid #86efac;border-radius:6px;cursor:pointer;background:' +
      fontBtnBg('large') + '">大</button>' +
      '<button type="button" data-bi-font="xlarge" style="padding:5px 10px;border:1px solid #86efac;border-radius:6px;cursor:pointer;background:' +
      fontBtnBg('xlarge') + '">特大</button></div>';
  }

  function hideFields() {
    HIDE_FIELDS.forEach(function (code) {
      try { kintone.app.record.setFieldShown(code, false); } catch (e) { /* noop */ }
    });
  }

  function fiscalYearLabel(yearKey) {
    var y = Number(yearKey);
    return y + '年度（' + y + '/5/1〜' + (y + 1) + '/4/30）';
  }

  function fiscalYearStartISO(yearKey) { return Number(yearKey) + '-05-01'; }
  function fiscalYearEndISO(yearKey) { return (Number(yearKey) + 1) + '-04-30'; }

  function todayISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  /** 集計基準日＝集計実行日（本日）。締処理日フィールドに保存する。 */
  function aggregateAsOfDate() {
    return todayISO();
  }

  function parseISODate(s) {
    if (!s) return null;
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]), iso: m[1] + '-' + m[2] + '-' + m[3] };
  }

  function compareISO(a, b) {
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  }

  function recordStatusValue(rec) {
    return val(rec, PF.status) || val(rec, 'Status') || val(rec, 'ステータス');
  }

  function isDoneStatus(rec) {
    var st = recordStatusValue(rec);
    if (!st) return false;
    var keys = ui.doneStatusKeys;
    if (keys && keys.length) return keys.indexOf(st) >= 0;
    return st === 'Done' || st === 'done' || st === '完了';
  }

  function resolveCompletionDate(rec) {
    var direct = val(rec, PF.completed);
    if (direct) return String(direct).slice(0, 10);
    var updated = val(rec, PF.updated);
    if (updated) return String(updated).slice(0, 10);
    var created = val(rec, '作成日時');
    if (created) return String(created).slice(0, 10);
    if (isDoneStatus(rec)) {
      var submitted = val(rec, PF.date);
      if (submitted) return String(submitted).slice(0, 10);
    }
    return null;
  }

  function isInFiscalYearCompletion(completed, yearKey) {
    if (!completed || yearKey == null || yearKey === '') return false;
    var fyStart = fiscalYearStartISO(yearKey);
    var fyEnd = fiscalYearEndISO(yearKey);
    return compareISO(completed, fyStart) >= 0 && compareISO(completed, fyEnd) <= 0;
  }

  function fiscalYearKeyForCompletion(completed) {
    if (!completed) return null;
    var mo = parseISODate(completed);
    if (!mo) return null;
    return mo.mo >= 5 ? mo.y : mo.y - 1;
  }

  function proposalTypeKey(typeVal) {
    return typeVal === 'アイデア提案' ? 'idea' : 'biz';
  }

  function monthBucketForRecord(rec, yearKey) {
    var fyStart = fiscalYearStartISO(yearKey);
    var completed = resolveCompletionDate(rec);
    var submitted = val(rec, PF.date);
    if (!completed) return null;
    if (compareISO(completed, fyStart) < 0) return null;
    if (compareISO(completed, fiscalYearEndISO(yearKey)) > 0) return null;
    if (submitted && compareISO(submitted, fyStart) < 0) return 'carryover';
    var mo = parseISODate(completed);
    return mo ? String(mo.mo) : null;
  }

  function deptSortIndex(dept, order) {
    var name = String(dept || '').trim();
    if (!name) return [3, name];
    var ho = order.headOffice.indexOf(name);
    if (ho >= 0) return [0, ho, name];
    var br = order.branchesAndOffices.indexOf(name);
    if (br >= 0) return [1, br, name];
    return [2, name];
  }

  function compareDept(a, b, order) {
    var ia = deptSortIndex(a, order);
    var ib = deptSortIndex(b, order);
    for (var i = 0; i < 3; i += 1) {
      if (ia[i] === ib[i]) continue;
      if (typeof ia[i] === 'string' || typeof ib[i] === 'string') {
        return String(ia[i]).localeCompare(String(ib[i]), 'ja');
      }
      return ia[i] - ib[i];
    }
    return 0;
  }

  function emptyMonthCounts() {
    var o = {};
    FISCAL_MONTHS.forEach(function (m) {
      o[m] = { biz: 0, idea: 0, recordIds: { biz: [], idea: [] } };
    });
    return o;
  }

  function emptyRankCell() {
    return { count: 0, points: 0, recordIds: [] };
  }

  function rankKey(rank) {
    var r = String(rank || '').trim().toUpperCase();
    return r === 'A' || r === 'B' || r === 'C' ? r : null;
  }

  function aggregateAnnual(records, yearKey, closingDateISO) {
    var closing = closingDateISO || aggregateAsOfDate();
    var included = [];
    var table1 = emptyMonthCounts();
    var employeeMap = {};
    var detail = [];
    var diag = {
      fetched: records.length,
      doneStatus: 0,
      hasCompletion: 0,
      inFiscalYear: 0,
      byAsOf: 0,
      bucketed: 0,
    };

    records.forEach(function (rec) {
      if (!isDoneStatus(rec)) return;
      diag.doneStatus += 1;
      var completed = resolveCompletionDate(rec);
      if (!completed) return;
      diag.hasCompletion += 1;
      if (!isInFiscalYearCompletion(completed, yearKey)) return;
      diag.inFiscalYear += 1;
      if (compareISO(completed, closing) > 0) return;
      diag.byAsOf += 1;
      var bucket = monthBucketForRecord(rec, yearKey);
      if (!bucket || FISCAL_MONTHS.indexOf(bucket) < 0) return;
      diag.bucketed += 1;

      var recordId = String(val(rec, '$id') || rec.$id && rec.$id.value || '');
      var typeVal = val(rec, PF.type);
      var typeKey = proposalTypeKey(typeVal);
      var rank = rankKey(val(rec, PF.rank));
      var points = Number(val(rec, PF.points)) || 0;
      var title = val(rec, PF.title);
      var submitDate = val(rec, PF.date);
      var proposers = val(rec, PF.proposers) || [];

      table1[bucket][typeKey] += 1;
      table1[bucket].recordIds[typeKey].push(recordId);
      included.push({ recordId: recordId, bucket: bucket, typeKey: typeKey, rank: rank, points: points });

      proposers.forEach(function (row) {
        var rv = row.value || row;
        var dept = rv[PF.propDept] && rv[PF.propDept].value != null ? rv[PF.propDept].value : (rv.dept || '');
        var name = rv[PF.propName] && rv[PF.propName].value != null ? rv[PF.propName].value : (rv.name || '');
        if (!name) return;
        var empKey = dept + '\t' + name;
        if (!employeeMap[empKey]) {
          employeeMap[empKey] = {
            dept: dept, name: name,
            A: emptyRankCell(), B: emptyRankCell(), C: emptyRankCell(), totalPoints: 0,
          };
        }
        var emp = employeeMap[empKey];
        if (rank) {
          emp[rank].count += 1;
          emp[rank].points += points;
          emp[rank].recordIds.push(recordId);
        }
        emp.totalPoints += points;
        detail.push({
          recordId: recordId, dept: dept, name: name, type: typeVal, title: title,
          submitDate: submitDate, rank: rank || '', points: points,
        });
      });
    });

    detail.sort(function (a, b) {
      var d = compareDept(a.dept, b.dept, DEPT_ORDER);
      return d !== 0 ? d : compareISO(a.submitDate, b.submitDate);
    });

    var table2 = Object.keys(employeeMap).map(function (k) { return employeeMap[k]; });
    table2.sort(function (a, b) {
      var d = compareDept(a.dept, b.dept, DEPT_ORDER);
      return d !== 0 ? d : String(a.name).localeCompare(String(b.name), 'ja');
    });

    var auditCount = records.filter(function (rec) {
      if (!isDoneStatus(rec)) return false;
      var c = resolveCompletionDate(rec);
      if (!c) return false;
      if (compareISO(c, closing) > 0) return false;
      return isInFiscalYearCompletion(c, yearKey);
    }).length;

    return {
      version: '2026-06-13',
      yearKey: Number(yearKey),
      closingDate: closing,
      generatedAt: new Date().toISOString(),
      counts: {
        aggregated: included.length,
        auditAllDoneByClose: auditCount,
        diagnostic: diag,
      },
      table1: table1,
      table2: table2,
      detail: detail,
      includedRecordIds: included.map(function (x) { return x.recordId; }),
    };
  }

  function isClosed(rec) {
    var v = val(rec, F.closed);
    return Array.isArray(v) && (v.indexOf('年度締め完了') >= 0 || v.indexOf('closed') >= 0);
  }

  function proposalUrl(recordId) {
    return '/k/' + getProposalAppId() + '/show#record=' + recordId;
  }

  function closeModal() {
    var m = document.getElementById('bi-annual-modal');
    if (m) m.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var wrap = document.createElement('div');
    wrap.id = 'bi-annual-modal';
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10001;display:flex;align-items:center;justify-content:center;padding:16px';
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:12px;max-width:520px;width:100%;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,.2)">' +
      '<h3 style="margin:0 0 12px;color:' + ACCENT + '">' + esc(title) + '</h3>' +
      '<div style="margin-bottom:16px;line-height:1.6">' + bodyHtml + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end">' + buttons + '</div></div>';
    document.body.appendChild(wrap);
    return wrap;
  }

  function getDoneStatusKeys() {
    if (ui.doneStatusKeys) return Promise.resolve(ui.doneStatusKeys);
    return kintone.api(kintone.api.url('/k/v1/app/status.json', true), 'GET', {
      app: getProposalAppId(),
    }).then(function (res) {
      var states = res.states || {};
      var keys = Object.keys(states);
      var doneKeys = keys.filter(function (k) {
        return k === 'Done' || k === 'done' || k === '完了';
      });
      if (!doneKeys.length) {
        var hasOutgoing = {};
        (res.actions || []).forEach(function (a) { hasOutgoing[a.from] = true; });
        doneKeys = keys.filter(function (k) { return !hasOutgoing[k]; });
      }
      ui.doneStatusKeys = doneKeys.length ? doneKeys : ['Done'];
      return ui.doneStatusKeys;
    }).catch(function () {
      ui.doneStatusKeys = ['Done', 'done'];
      return ui.doneStatusKeys;
    });
  }

  function buildDoneRecordsQuery(offset, doneKeys) {
    var quoted = doneKeys.map(function (k) {
      return '"' + String(k).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }).join(', ');
    return 'Status in (' + quoted + ') order by $id asc limit 500 offset ' + offset;
  }

  function fetchAllDoneRecords() {
    var all = [];
    var offset = 0;
    return getDoneStatusKeys().then(function (doneKeys) {
      function page() {
        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: getProposalAppId(),
          query: buildDoneRecordsQuery(offset, doneKeys),
          fields: FETCH_FIELDS,
        }).then(function (res) {
          var rows = res.records || [];
          all = all.concat(rows);
          if (rows.length === 500) {
            offset += 500;
            return page();
          }
          ui.lastFetchedRaw = all.length;
          return all;
        });
      }
      return page();
    });
  }

  function saveAggregation(result) {
    var now = new Date().toISOString();
    var user = (kintone.getLoginUser() && kintone.getLoginUser().name) || '';
    var body = {
      app: getAnnualAppId(),
      id: ui.recordId,
      record: {},
    };
    body.record[F.resultJson] = { value: JSON.stringify(result) };
    body.record[F.aggCount] = { value: String(result.counts.aggregated) };
    body.record[F.auditCount] = { value: String(result.counts.auditAllDoneByClose) };
    body.record[F.aggregatedAt] = { value: now };
    body.record[F.executor] = { value: user };
    body.record[F.closingDate] = { value: result.closingDate };
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', body).then(function () {
      ui.record[F.resultJson].value = JSON.stringify(result);
      ui.record[F.aggCount].value = String(result.counts.aggregated);
      ui.record[F.auditCount].value = String(result.counts.auditAllDoneByClose);
      ui.record[F.aggregatedAt].value = now;
      ui.record[F.executor].value = user;
      ui.record[F.closingDate].value = result.closingDate;
      ui.result = result;
    });
  }

  function runAggregate() {
    if (ui.locked || ui.busy) return;
    if (!ui.recordId) {
      openModal('集計できません', '<p>先に<strong>設定を保存</strong>して年度レコードを確定してください。</p>',
        '<button type="button" id="bi-ann-ok" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">OK</button>');
      document.getElementById('bi-ann-ok').onclick = closeModal;
      return;
    }
    var yearKey = val(ui.record, F.yearKey);
    if (!yearKey) {
      openModal('集計できません', '<p>年度キーが未設定です。</p>',
        '<button type="button" id="bi-ann-ok" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">OK</button>');
      document.getElementById('bi-ann-ok').onclick = closeModal;
      return;
    }
    runWithPassphrase(function () {
      var closing = aggregateAsOfDate();
      ui.record[F.closingDate] = { value: closing };
      openModal('集計実行',
        '<p>' + esc(fiscalYearLabel(yearKey)) + ' の集計を実行します。</p>' +
        '<p style="margin:10px 0 0">集計基準日（本日）: <strong>' + esc(closing) + '</strong><br>' +
        '<span style="font-size:0.92em;color:#475569">この日時点で<strong>完了</strong>した案件のみ集計します。未完了は翌年度へ繰越です。</span></p>',
        '<button type="button" id="bi-ann-cancel" style="padding:8px 14px;background:#fff;color:#334155;border:1px solid #cbd5e1;border-radius:8px;cursor:pointer">キャンセル</button>' +
        '<button type="button" id="bi-ann-run" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">実行</button>');
      document.getElementById('bi-ann-cancel').onclick = closeModal;
      document.getElementById('bi-ann-run').onclick = function () {
        closeModal();
        ui.busy = true;
        render();
        fetchAllDoneRecords().then(function (records) {
          var result = aggregateAnnual(records, yearKey, closing);
          return saveAggregation(result);
        }).then(function () {
          ui.busy = false;
          render();
        }).catch(function (err) {
          ui.busy = false;
          render();
          openModal('エラー', '<p>' + esc(err.message || String(err)) + '</p>',
            '<button type="button" id="bi-ann-err" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">OK</button>');
          document.getElementById('bi-ann-err').onclick = closeModal;
        });
      };
    });
  }

  function runCloseYear() {
    if (ui.locked || ui.busy) return;
    openModal('年度締め', '<p>この年度を締めますか？<br><strong>締め後は再集計できません。</strong></p>',
      '<button type="button" id="bi-ann-cy-cancel" style="padding:8px 14px;background:#fff;color:#334155;border:1px solid #cbd5e1;border-radius:8px;cursor:pointer">キャンセル</button>' +
      '<button type="button" id="bi-ann-cy-yes" style="padding:8px 14px;background:#b91c1c;color:#fff;border:0;border-radius:8px;cursor:pointer">年度締め</button>');
    document.getElementById('bi-ann-cy-cancel').onclick = closeModal;
    document.getElementById('bi-ann-cy-yes').onclick = function () {
      closeModal();
      ui.busy = true;
      render();
      kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
        app: getAnnualAppId(),
        id: ui.recordId,
        record: { 締め済み: { value: ['年度締め完了'] } },
      }).then(function () {
        ui.record[F.closed].value = ['年度締め完了'];
        ui.locked = true;
        ui.busy = false;
        render();
      }).catch(function (err) {
        ui.busy = false;
        render();
        openModal('エラー', '<p>' + esc(err.message || String(err)) + '</p>',
          '<button type="button" id="bi-ann-cy-err" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">OK</button>');
        document.getElementById('bi-ann-cy-err').onclick = closeModal;
      });
    };
  }

  function loadResultFromRecord(rec) {
    var raw = val(rec, F.resultJson);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function countCell(n, clickable, dataAttrs) {
    var attrs = dataAttrs || '';
    var style = 'text-align:center;padding:6px 4px;border:1px solid #d1fae5;';
    if (clickable && n >= 1) {
      style += 'color:' + ACCENT_DARK + ';text-decoration:underline;cursor:pointer;font-weight:600;';
    }
    return '<td' + attrs + ' style="' + style + '">' + esc(String(n)) + '</td>';
  }

  function table1Html(result) {
    if (!result) return '<p style="color:#64748b">集計結果がありません。集計を実行してください。</p>';
    var t1 = result.table1;
    var hdr1 = '<tr><th rowspan="2" style="background:#ecfdf5;border:1px solid #86efac;padding:8px">月</th>';
    FISCAL_MONTHS.forEach(function (m) {
      hdr1 += '<th colspan="2" style="background:#ecfdf5;border:1px solid #86efac;padding:8px;text-align:center">' +
        esc(FISCAL_MONTH_LABELS[m]) + '</th>';
    });
    hdr1 += '</tr><tr>';
    FISCAL_MONTHS.forEach(function () {
      hdr1 += '<th style="background:#f0fdf4;border:1px solid #86efac;padding:6px;font-size:0.9em">業務改善</th>' +
        '<th style="background:#f0fdf4;border:1px solid #86efac;padding:6px;font-size:0.9em">アイデア</th>';
    });
    hdr1 += '</tr>';
    var row = '<tr><th style="background:#f0fdf4;border:1px solid #86efac;padding:8px">件数</th>';
    FISCAL_MONTHS.forEach(function (m) {
      ['biz', 'idea'].forEach(function (tk) {
        var n = t1[m][tk];
        var click = n >= 1;
        row += countCell(n, click, click ? ' data-bi-drill="t1" data-bi-month="' + esc(m) + '" data-bi-type="' + tk + '"' : '');
      });
    });
    row += '</tr>';
    return '<div class="bi-annual-print-table-wrap" style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:0.95em;background:' + CARD_BG + '">' +
      hdr1 + row + '</table></div>';
  }

  function table2Html(result) {
    if (!result || !result.table2.length) {
      return '<p style="color:#64748b">集計結果がありません。</p>';
    }
    var hdr = '<tr><th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">所属</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">氏名</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">A評価</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">A-pt</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">B評価</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">B-pt</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">C評価</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">C-pt</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">合計-pt</th></tr>';
    var body = result.table2.map(function (emp, idx) {
      var ranks = ['A', 'B', 'C'];
      var cells = '<td style="border:1px solid #d1fae5;padding:6px">' + esc(emp.dept) + '</td>' +
        '<td style="border:1px solid #d1fae5;padding:6px">' + esc(emp.name) + '</td>';
      ranks.forEach(function (r) {
        var c = emp[r].count;
        var click = c >= 1;
        cells += countCell(c, click, click ? ' data-bi-drill="t2" data-bi-emp="' + idx + '" data-bi-rank="' + r + '"' : '');
        cells += '<td style="text-align:right;border:1px solid #d1fae5;padding:6px">' + esc(String(emp[r].points)) + '</td>';
      });
      cells += '<td style="text-align:right;border:1px solid #d1fae5;padding:6px;font-weight:600">' + esc(String(emp.totalPoints)) + '</td>';
      return '<tr>' + cells + '</tr>';
    }).join('');
    return '<div class="bi-annual-print-table-wrap" style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:0.95em;background:' + CARD_BG + '">' +
      hdr + body + '</table></div>';
  }

  function detailHtml(result) {
    if (!result || !result.detail.length) {
      return '<p style="color:#64748b">明細がありません。</p>';
    }
    var hdr = '<tr><th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">所属</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">氏名</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">種別</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">件名</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">提案日</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">ランク</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">pt</th></tr>';
    var body = result.detail.map(function (d, i) {
      return '<tr data-bi-drill="detail" data-bi-detail="' + i + '" style="cursor:pointer">' +
        '<td style="border:1px solid #d1fae5;padding:6px">' + esc(d.dept) + '</td>' +
        '<td style="border:1px solid #d1fae5;padding:6px">' + esc(d.name) + '</td>' +
        '<td style="border:1px solid #d1fae5;padding:6px">' + esc(d.type) + '</td>' +
        '<td style="border:1px solid #d1fae5;padding:6px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(d.title) + '">' + esc(d.title) + '</td>' +
        '<td style="border:1px solid #d1fae5;padding:6px">' + esc(d.submitDate) + '</td>' +
        '<td style="border:1px solid #d1fae5;padding:6px;text-align:center">' + esc(d.rank) + '</td>' +
        '<td style="border:1px solid #d1fae5;padding:6px;text-align:right">' + esc(String(d.points)) + '</td></tr>';
    }).join('');
    return '<div class="bi-annual-print-table-wrap" style="overflow-x:auto;max-height:480px;overflow-y:auto"><table style="border-collapse:collapse;width:100%;font-size:0.95em;background:' + CARD_BG + '">' +
      hdr + body + '</table></div>';
  }

  function reconciliationHtml(result) {
    if (!result) return '';
    var agg = result.counts.aggregated;
    var audit = result.counts.auditAllDoneByClose;
    var match = agg === audit;
    var color = match ? '#15803d' : '#b91c1c';
    var bg = match ? '#dcfce7' : '#fee2e2';
    var hint = '';
    if (agg === 0 && audit === 0) {
      var d = result.counts.diagnostic || {};
      var suggestYear = fiscalYearKeyForCompletion(aggregateAsOfDate());
      hint = '<p style="margin:8px 0 0;font-size:0.9em;color:#475569;line-height:1.55">' +
        '内訳: 取得 <strong>' + esc(String(d.fetched != null ? d.fetched : ui.lastFetchedRaw || 0)) + '</strong>件' +
        ' → 完了Status <strong>' + esc(String(d.doneStatus != null ? d.doneStatus : '—')) + '</strong>件' +
        ' → 完了日あり <strong>' + esc(String(d.hasCompletion != null ? d.hasCompletion : '—')) + '</strong>件' +
        ' → 当年度内 <strong>' + esc(String(d.inFiscalYear != null ? d.inFiscalYear : '—')) + '</strong>件' +
        ' → 基準日以前 <strong>' + esc(String(d.byAsOf != null ? d.byAsOf : '—')) + '</strong>件。<br>' +
        '選択中: <strong>' + esc(String(result.yearKey)) + '年度</strong>（' + esc(fiscalYearLabel(result.yearKey)) + '）。' +
        (suggestYear && String(suggestYear) !== String(result.yearKey)
          ? '本日基準のおすすめ年度は <strong>' + esc(String(suggestYear)) + '年度</strong> です。'
          : '') +
        ' 未完了は翌年度繰越です。' +
        '</p>';
    }
    return '<div style="margin:12px 0;padding:12px 14px;background:' + bg + ';border:2px solid ' + color + ';border-radius:10px">' +
      '<strong style="color:' + color + '">検算パネル</strong> — ' +
      '集計件数: <strong>' + esc(String(agg)) + '</strong> ／ 検算（新①完了件数）: <strong>' + esc(String(audit)) + '</strong> ' +
      (match ? '✓ 一致' : '✗ 不一致（要確認）') + hint + '</div>';
  }

  function drillRecords(kind, params) {
    if (!ui.result) return [];
    if (kind === 't1') {
      var m = params.month;
      var tk = params.type;
      var ids = ui.result.table1[m].recordIds[tk] || [];
      return ids.map(function (id) {
        var d = ui.result.detail.find(function (x) { return x.recordId === id; });
        return { recordId: id, title: d ? d.title : '', type: d ? d.type : '', submitDate: d ? d.submitDate : '' };
      });
    }
    if (kind === 't2') {
      var emp = ui.result.table2[params.emp];
      if (!emp) return [];
      var rk = params.rank;
      return (emp[rk].recordIds || []).map(function (id) {
        var d = ui.result.detail.find(function (x) { return x.recordId === id && x.name === emp.name; });
        return { recordId: id, title: d ? d.title : '', type: d ? d.type : '', submitDate: d ? d.submitDate : '', rank: rk };
      });
    }
    if (kind === 'detail') {
      var row = ui.result.detail[params.idx];
      return row ? [row] : [];
    }
    return [];
  }

  function showDrillPanel(title, rows) {
    if (!rows.length) return;
    var list = rows.map(function (r, i) {
      return '<tr data-bi-open="' + esc(r.recordId) + '" style="cursor:pointer">' +
        '<td style="border:1px solid #d1fae5;padding:8px">' + esc(r.title || '—') + '</td>' +
        '<td style="border:1px solid #d1fae5;padding:8px">' + esc(r.type || '') + '</td>' +
        '<td style="border:1px solid #d1fae5;padding:8px">' + esc(r.submitDate || '') + '</td>' +
        (r.rank ? '<td style="border:1px solid #d1fae5;padding:8px">' + esc(r.rank) + '</td>' : '') +
        '</tr>';
    }).join('');
    var rankCol = rows[0] && rows[0].rank ? '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">ランク</th>' : '';
    openModal(title,
      '<div style="max-height:360px;overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:0.95em">' +
      '<tr><th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">件名</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">種別</th>' +
      '<th style="background:#ecfdf5;border:1px solid #86efac;padding:8px">提案日</th>' + rankCol + '</tr>' + list +
      '</table><p style="margin:10px 0 0;color:#64748b;font-size:0.88em">行をクリックすると新①レコードを開きます。</p></div>',
      '<button type="button" id="bi-ann-drill-close" style="padding:8px 14px;background:#fff;color:#334155;border:1px solid #cbd5e1;border-radius:8px;cursor:pointer">閉じる</button>');
    document.getElementById('bi-ann-drill-close').onclick = closeModal;
    var modal = document.getElementById('bi-annual-modal');
    if (modal) {
      modal.querySelectorAll('[data-bi-open]').forEach(function (tr) {
        tr.onclick = function () {
          window.open(proposalUrl(tr.getAttribute('data-bi-open')), '_blank');
        };
      });
    }
  }

  function exportCsv(result) {
    if (!result) return;
    var lines = ['表2,所属,氏名,A評価,A-pt,B評価,B-pt,C評価,C-pt,合計-pt'];
    result.table2.forEach(function (e) {
      lines.push(['表2', e.dept, e.name, e.A.count, e.A.points, e.B.count, e.B.points, e.C.count, e.C.points, e.totalPoints].join(','));
    });
    lines.push('');
    lines.push('明細,所属,氏名,種別,件名,提案日,ランク,pt');
    result.detail.forEach(function (d) {
      lines.push(['明細', d.dept, d.name, d.type, '"' + String(d.title).replace(/"/g, '""') + '"', d.submitDate, d.rank, d.points].join(','));
    });
    var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'annual-' + result.yearKey + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportXlsx(result) {
    if (!result || typeof XLSX === 'undefined') {
      openModal('エラー', '<p>XLSX ライブラリが読み込まれていません。</p>',
        '<button type="button" id="bi-x-ok" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">OK</button>');
      document.getElementById('bi-x-ok').onclick = closeModal;
      return;
    }
    var wb = XLSX.utils.book_new();
    var t2rows = [['所属', '氏名', 'A評価', 'A-pt', 'B評価', 'B-pt', 'C評価', 'C-pt', '合計-pt']];
    result.table2.forEach(function (e) {
      t2rows.push([e.dept, e.name, e.A.count, e.A.points, e.B.count, e.B.points, e.C.count, e.C.points, e.totalPoints]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(t2rows), '表2');
    var drows = [['所属', '氏名', '種別', '件名', '提案日', 'ランク', 'pt']];
    result.detail.forEach(function (d) {
      drows.push([d.dept, d.name, d.type, d.title, d.submitDate, d.rank, d.points]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(drows), '明細');
    XLSX.writeFile(wb, 'annual-' + result.yearKey + '.xlsx');
  }

  function ensurePrintStylesheet() {
    if (document.getElementById('bi-annual-print-style')) return;
    var style = document.createElement('style');
    style.id = 'bi-annual-print-style';
    style.textContent =
      '@media print {' +
      '@page { size: A4 portrait; margin: 10mm; }' +
      'html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; height: auto !important; }' +
      'body > *:not(#bi-annual-overlay) { display: none !important; }' +
      '#bi-annual-overlay { position: static !important; inset: auto !important; background: #fff !important; ' +
      'padding: 0 !important; margin: 0 !important; overflow: visible !important; z-index: 1 !important; }' +
      '#bi-annual-overlay > div { max-width: none !important; margin: 0 !important; }' +
      '#bi-annual-overlay-close { display: none !important; }' +
      '#bi-annual-overlay-host { width: 190mm !important; height: 277mm !important; overflow: hidden !important; margin: 0 !important; }' +
      '.bi-annual-no-print { display: none !important; }' +
      '.bi-annual-print-only { display: block !important; }' +
      '#bi-annual-print { background: #fff !important; box-shadow: none !important; border-radius: 0 !important; ' +
      'padding: 0 !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
      '#bi-annual-print table { border-collapse: collapse !important; width: 100% !important; }' +
      '#bi-annual-print th, #bi-annual-print td { padding: 2px 3px !important; font-size: 8pt !important; }' +
      '#bi-annual-print h2 { font-size: 14pt !important; }' +
      '#bi-annual-print .bi-annual-print-table-wrap { max-height: none !important; overflow: visible !important; }' +
      '}';
    document.head.appendChild(style);
  }

  function exportPdf() {
    ensurePrintStylesheet();
    var el = document.getElementById('bi-annual-print');
    if (!el) {
      window.print();
      return;
    }
    var overlay = document.getElementById('bi-annual-overlay');
    if (overlay) overlay.classList.add('bi-annual-print-mode');

    function cleanup() {
      el.style.transform = '';
      el.style.transformOrigin = '';
      el.style.width = '';
      if (overlay) overlay.classList.remove('bi-annual-print-mode');
      window.onafterprint = null;
    }

    function fitAndPrint() {
      var pageW = 716;
      var pageH = 1047;
      var w = el.scrollWidth || el.offsetWidth;
      var h = el.scrollHeight || el.offsetHeight;
      var scale = Math.min(1, pageW / w, pageH / h);
      scale = Math.floor(scale * 1000) / 1000;
      el.style.transformOrigin = 'top left';
      el.style.transform = 'scale(' + scale + ')';
      el.style.width = w + 'px';
      window.onafterprint = cleanup;
      window.print();
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(fitAndPrint);
    });
  }

  function currentFiscalYearKey() {
    var d = new Date();
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    return m >= 5 ? y : y - 1;
  }

  function fetchAnnualYearRecords() {
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: getAnnualAppId(),
      query: 'order by 年度キー desc limit 100',
      fields: ['$id', F.yearKey, F.closingDate, F.closed, F.aggregatedAt, F.executor, F.aggCount, F.auditCount, F.resultJson],
    }).then(function (res) {
      ui.yearList = res.records || [];
      return ui.yearList;
    });
  }

  function assignInitialYearRecord(list) {
    var cur = String(currentFiscalYearKey());
    var match = list.find(function (r) { return String(val(r, F.yearKey)) === cur; });
    if (match) {
      assignRecord(match);
      return;
    }
    ui.record = emptyAnnualRecord(currentFiscalYearKey());
    ui.recordId = null;
    ui.locked = false;
    ui.result = null;
  }

  function assignRecord(rec) {
    ui.record = rec;
    ui.recordId = String(val(rec, '$id') || (rec.$id && rec.$id.value) || '');
    ui.locked = isClosed(rec);
    ui.result = loadResultFromRecord(rec);
  }

  function createYearRecord(yearKey) {
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
      app: getAnnualAppId(),
      record: {
        年度キー: { value: String(yearKey) },
        締処理日: { value: todayISO() },
      },
    }).then(function (res) {
      return kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
        app: getAnnualAppId(),
        id: res.id,
      }).then(function (got) {
        var rec = got.record;
        ui.yearList.unshift(rec);
        assignRecord(rec);
        return rec;
      });
    });
  }

  function saveGuideSettings() {
    if (ui.locked || ui.busy || !ui.root) return Promise.resolve();
    var sel = ui.root.querySelector('#bi-ann-year-select');
    if (!sel) return Promise.resolve();
    var yearKey = sel.value;
    var closing = aggregateAsOfDate();
    if (!yearKey) {
      openModal('設定エラー', '<p>年度を選択してください。</p>',
        '<button type="button" id="bi-ann-set-err" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">OK</button>');
      document.getElementById('bi-ann-set-err').onclick = closeModal;
      return Promise.resolve();
    }
    ui.busy = true;
    render();
    var rec = ui.yearList.find(function (r) { return String(val(r, F.yearKey)) === String(yearKey); });
    function afterAssign() {
      return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
        app: getAnnualAppId(),
        id: ui.recordId,
        record: { 締処理日: { value: closing } },
      }).then(function () {
        ui.record[F.closingDate] = { value: closing };
        ui.busy = false;
        render();
      });
    }
    if (rec) {
      assignRecord(rec);
      return afterAssign();
    }
    return createYearRecord(yearKey).then(afterAssign).catch(function (err) {
      ui.busy = false;
      render();
      openModal('エラー', '<p>' + esc(err.message || String(err)) + '</p>',
        '<button type="button" id="bi-ann-set-fail" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">OK</button>');
      document.getElementById('bi-ann-set-fail').onclick = closeModal;
    });
  }

  function guideSettingsHtml(rec) {
    if (ui.mode !== 'guide' || ui.locked) return '';
    var yk = val(rec, F.yearKey);
    var asOf = aggregateAsOfDate();
    var opts = ui.yearList.map(function (r) {
      var y = val(r, F.yearKey);
      return '<option value="' + esc(String(y)) + '"' + (String(y) === String(yk) ? ' selected' : '') + '>' +
        esc(fiscalYearLabel(y)) + (isClosed(r) ? '（締め済）' : '') + '</option>';
    }).join('');
    var cur = currentFiscalYearKey();
    var hasCur = ui.yearList.some(function (r) { return String(val(r, F.yearKey)) === String(cur); });
    if (!hasCur) {
      opts = '<option value="' + cur + '">' + esc(fiscalYearLabel(cur)) + '（新規）</option>' + opts;
    }
    return '<div class="bi-annual-no-print" style="margin-bottom:14px;padding:12px 14px;background:rgba(255,255,255,.85);border:1px solid #86efac;border-radius:10px">' +
      '<strong style="color:' + ACCENT + '">年度設定</strong>' +
      '<p style="margin:8px 0 0;font-size:0.88em;color:#475569;line-height:1.55">' +
      '集計対象期間は <strong>5/1〜翌4/30</strong>。集計基準日（本日）時点で<strong>完了</strong>した案件のみ含めます。' +
      '未完了は翌年度へ繰越です。</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:10px">' +
      '<label style="display:flex;align-items:center;gap:6px">年度<select id="bi-ann-year-select" style="padding:6px 8px;border:1px solid #86efac;border-radius:6px">' +
      opts + '</select></label>' +
      '<span style="padding:6px 10px;background:#ecfdf5;border:1px solid #86efac;border-radius:6px;font-size:0.95em">' +
      '集計基準日: <strong>' + esc(asOf) + '</strong>（本日・集計実行日に自動設定）</span>' +
      '<button type="button" id="bi-ann-save-settings" style="padding:8px 14px;background:#fff;color:' + ACCENT + ';border:2px solid ' + ACCENT_DARK + ';border-radius:8px;cursor:pointer;font-weight:600">設定を保存</button>' +
      '</div></div>';
  }

  function closeOverlay() {
    if (ui.overlayEl) {
      ui.overlayEl.remove();
      ui.overlayEl = null;
    }
    ui.root = null;
    ui.mode = 'record';
    ui.record = null;
    ui.recordId = null;
    ui.result = null;
    ui.locked = false;
  }

  function openOverlay(config) {
    config = config || {};
    if (ui.overlayEl && document.body.contains(ui.overlayEl)) {
      return Promise.resolve();
    }
    closeOverlay();
    ui.mode = 'guide';
    ui.annualAppId = config.annualAppId;
    ui.proposalAppId = config.proposalAppId || 700;
    ui.passphraseGuard = config.passphraseGuard || null;
    ui.tab = 't1';
    ui.busy = true;
    ui.record = null;
    ui.recordId = null;
    ui.result = null;
    ui.locked = false;
    ui.yearList = [];
    ui.doneStatusKeys = null;
    ui.lastFetchedRaw = null;
    if (!getAnnualAppId()) {
      openModal('設定エラー', '<p>年次アプリ ID が未設定です。</p>',
        '<button type="button" id="bi-ann-no-app" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">OK</button>');
      document.getElementById('bi-ann-no-app').onclick = closeModal;
      return Promise.resolve();
    }
    var overlay = document.createElement('div');
    overlay.id = 'bi-annual-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:10000;overflow:auto;padding:20px 16px 32px';
    overlay.innerHTML =
      '<div style="max-width:1100px;margin:0 auto;position:relative">' +
      '<button type="button" id="bi-annual-overlay-close" style="position:sticky;top:0;float:right;z-index:2;padding:8px 14px;background:#fff;border:1px solid #cbd5e1;border-radius:8px;cursor:pointer;font-weight:600">閉じる</button>' +
      '<div id="bi-annual-overlay-host" style="clear:both"></div></div>';
    document.body.appendChild(overlay);
    ui.overlayEl = overlay;
    ui.root = overlay.querySelector('#bi-annual-overlay-host');
    overlay.querySelector('#bi-annual-overlay-close').onclick = closeOverlay;
    ui.root.innerHTML =
      '<div style="padding:24px;text-align:center;color:#166534;font-size:1.05em;background:' + GRADIENT + ';border-radius:14px">年次データを読み込んでいます…<br><span style="font-size:0.82em;color:#64748b">' + esc(PANEL_BUILD) + '</span></div>';
    return fetchAnnualYearRecords().then(function (list) {
      assignInitialYearRecord(list);
    }).then(function () {
      ui.busy = false;
      safeRender();
    }).catch(function (err) {
      ui.busy = false;
      if (!ui.record) {
        ui.record = emptyAnnualRecord(currentFiscalYearKey());
      }
      safeRender();
      openModal('エラー', '<p>年次データの読み込みに失敗しました。<br>' + esc(err.message || String(err)) + '</p>',
        '<button type="button" id="bi-ann-load-err" style="padding:8px 14px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer">OK</button>');
      document.getElementById('bi-ann-load-err').onclick = closeModal;
    });
  }

  function safeRender() {
    try {
      render();
    } catch (err) {
      if (ui.root) {
        ui.root.innerHTML =
          '<div style="padding:20px;background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;color:#991b1b">' +
          '<p style="margin:0 0 8px;font-weight:700">年次パネルの表示に失敗しました</p>' +
          '<p style="margin:0;font-size:0.92em">' + esc(err.message || String(err)) + '</p></div>';
      }
      console.error('[BiAnnualPanel]', err);
    }
  }

  function tabBtn(id, label) {
    var on = ui.tab === id;
    return '<button type="button" data-bi-tab="' + id + '" style="padding:10px 18px;margin-right:6px;border-radius:8px 8px 0 0;border:1px solid #86efac;border-bottom:' +
      (on ? '2px solid ' + CARD_BG : '1px solid #86efac') + ';background:' + (on ? CARD_BG : '#ecfdf5') + ';color:' + ACCENT + ';font-weight:' +
      (on ? '700' : '500') + ';cursor:pointer">' + esc(label) + '</button>';
  }

  function render() {
    if (!ui.root) return;
    if (ui.busy && !ui.record) {
      ui.root.innerHTML =
        '<div style="padding:24px;text-align:center;color:#166534;font-size:1.05em;background:' + GRADIENT + ';border-radius:14px">年次データを読み込んでいます…</div>';
      return;
    }
    var rec = ui.record || emptyAnnualRecord(currentFiscalYearKey());
    var yearKey = val(rec, F.yearKey);
    var fs = fontPx();
    var closedBadge = ui.locked
      ? '<span style="display:inline-block;padding:4px 10px;background:#dcfce7;color:' + ACCENT + ';border-radius:999px;font-size:0.88em;font-weight:700;margin-left:8px">年度締め済み</span>'
      : '';
    var meta = '';
    if (val(rec, F.aggregatedAt)) {
      meta = '<p style="margin:6px 0 0;color:#475569;font-size:0.92em">最終集計: ' + esc(val(rec, F.aggregatedAt)) +
        ' / 実行者: ' + esc(val(rec, F.executor)) + '</p>';
    }
    var actions = '';
    if (!ui.locked) {
      actions =
        '<button type="button" id="bi-ann-aggregate" style="padding:10px 18px;background:' + ACCENT_DARK + ';color:#fff;border:0;border-radius:8px;cursor:pointer;font-weight:600;margin-right:8px"' +
        (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? '処理中…' : '集計実行') + '</button>' +
        '<button type="button" id="bi-ann-close-year" style="padding:10px 18px;background:#fff;color:#b91c1c;border:2px solid #fca5a5;border-radius:8px;cursor:pointer;font-weight:600"' +
        (ui.busy ? ' disabled' : '') + '>年度締め</button>';
    }
    var exports = ui.result
      ? '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">' +
        '<button type="button" data-bi-export="csv" style="padding:8px 14px;background:#fff;border:1px solid #86efac;border-radius:8px;cursor:pointer">CSV</button>' +
        '<button type="button" data-bi-export="xlsx" style="padding:8px 14px;background:#fff;border:1px solid #86efac;border-radius:8px;cursor:pointer">xlsx</button>' +
        '<button type="button" data-bi-export="pdf" style="padding:8px 14px;background:#fff;border:1px solid #86efac;border-radius:8px;cursor:pointer">PDF</button></div>'
      : '';

    var tabLabel = ui.tab === 't1' ? '表1' : ui.tab === 't2' ? '表2' : '明細';
    var tabContent = ui.tab === 't1' ? table1Html(ui.result)
      : ui.tab === 't2' ? table2Html(ui.result) : detailHtml(ui.result);

    ui.root.innerHTML =
      '<div id="bi-annual-print" style="font-size:' + fs + ';font-family:inherit;color:#1c1917;background:' + GRADIENT + ';border-radius:14px;padding:18px 20px 22px;box-shadow:0 4px 16px rgba(22,101,52,.12)">' +
      '<div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px">' +
      '<div><h2 style="margin:0;color:' + ACCENT + ';font-size:1.25em">業務改善 — 年次ポイント集計' + closedBadge + '</h2>' +
      '<p style="margin:6px 0 0;color:#365314">' + esc(yearKey ? fiscalYearLabel(yearKey) : '年度未設定') +
      (val(rec, F.closingDate) ? ' ／ 集計基準日: ' + esc(val(rec, F.closingDate)) : ' ／ 集計基準日: ' + esc(aggregateAsOfDate()) + '（本日）') + '</p>' + meta + '</div>' +
      '<div class="bi-annual-no-print" style="text-align:right">' + fontToggleHtml() + '</div></div>' +
      guideSettingsHtml(rec) +
      '<div class="bi-annual-no-print" style="margin-bottom:12px">' + actions + exports + '</div>' +
      '<div class="bi-annual-no-print">' + reconciliationHtml(ui.result) + '</div>' +
      '<div class="bi-annual-no-print" style="margin-top:14px">' + tabBtn('t1', '表1') + tabBtn('t2', '表2') + tabBtn('detail', '明細') + '</div>' +
      '<p class="bi-annual-print-only" style="display:none;margin:10px 0 6px;font-weight:700;color:' + ACCENT + '">' + esc(tabLabel) + '</p>' +
      '<div class="bi-annual-print-table-wrap" style="background:' + CARD_BG + ';border:1px solid #86efac;border-radius:0 10px 10px 10px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.04)">' +
      tabContent + '</div>' +
      '<p class="bi-annual-no-print" style="margin:12px 0 0;color:#94a3b8;font-size:0.8em">PANEL ' + esc(PANEL_BUILD) + '</p></div>';

    bindUi();
  }

  function bindUi() {
    if (!ui.root) return;
    ui.root.querySelectorAll('[data-bi-font]').forEach(function (btn) {
      btn.onclick = function () {
        localStorage.setItem(FONT_KEY, btn.getAttribute('data-bi-font'));
        render();
      };
    });
    ui.root.querySelectorAll('[data-bi-tab]').forEach(function (btn) {
      btn.onclick = function () {
        ui.tab = btn.getAttribute('data-bi-tab');
        render();
      };
    });
    var saveSet = document.getElementById('bi-ann-save-settings');
    if (saveSet) saveSet.onclick = function () { saveGuideSettings(); };
    var yearSel = document.getElementById('bi-ann-year-select');
    if (yearSel) yearSel.onchange = function () {
      var y = yearSel.value;
      var rec = ui.yearList.find(function (r) { return String(val(r, F.yearKey)) === String(y); });
      if (rec) {
        assignRecord(rec);
        render();
      } else {
        ui.record = emptyAnnualRecord(y);
        ui.recordId = null;
        ui.locked = false;
        ui.result = null;
        render();
      }
    };
    var agg = document.getElementById('bi-ann-aggregate');
    if (agg) agg.onclick = runAggregate;
    var cy = document.getElementById('bi-ann-close-year');
    if (cy) cy.onclick = runCloseYear;
    ui.root.querySelectorAll('[data-bi-export]').forEach(function (btn) {
      btn.onclick = function () {
        var kind = btn.getAttribute('data-bi-export');
        if (kind === 'csv') exportCsv(ui.result);
        else if (kind === 'xlsx') exportXlsx(ui.result);
        else if (kind === 'pdf') exportPdf();
      };
    });
    ui.root.querySelectorAll('[data-bi-drill]').forEach(function (el) {
      el.onclick = function (e) {
        e.stopPropagation();
        var kind = el.getAttribute('data-bi-drill');
        if (kind === 't1') {
          showDrillPanel(FISCAL_MONTH_LABELS[el.getAttribute('data-bi-month')] + ' — ' +
            (el.getAttribute('data-bi-type') === 'idea' ? 'アイデア' : '業務改善'),
            drillRecords('t1', { month: el.getAttribute('data-bi-month'), type: el.getAttribute('data-bi-type') }));
        } else if (kind === 't2') {
          var emp = ui.result.table2[Number(el.getAttribute('data-bi-emp'))];
          showDrillPanel((emp ? emp.name : '') + ' — ' + el.getAttribute('data-bi-rank'),
            drillRecords('t2', { emp: Number(el.getAttribute('data-bi-emp')), rank: el.getAttribute('data-bi-rank') }));
        } else if (kind === 'detail') {
          var row = drillRecords('detail', { idx: Number(el.getAttribute('data-bi-detail')) })[0];
          if (row) window.open(proposalUrl(row.recordId), '_blank');
        }
      };
    });
  }

  function mountHost() {
    var el = kintone.app.record.getSpaceElement(SPACE_ID);
    if (el) return el;
    var form = document.querySelector('.record-edit-gaia') || document.querySelector('.record-detail-gaia') || document.querySelector('.layout-gaia');
    if (!form) return null;
    var host = document.getElementById('bi-annual-fallback');
    if (!host) {
      host = document.createElement('div');
      host.id = 'bi-annual-fallback';
      form.insertBefore(host, form.firstChild);
    }
    return host;
  }

  function onShow(event) {
    hideFields();
    var host = mountHost();
    if (!host) return event;
    ui.mode = 'record';
    ui.annualAppId = getAnnualAppId();
    ui.root = host;
    assignRecord(event.record);
    ui.recordId = event.recordId || ui.recordId;
    ui.busy = false;
    host.innerHTML = '<div style="padding:16px;background:#ecfdf5;border:1px solid #86efac;border-radius:12px;color:#166534">' +
      '<p style="margin:0 0 8px;font-weight:700">年次ポイント集計の操作場所</p>' +
      '<p style="margin:0;line-height:1.6">集計・設定は <strong>【業務改善提案システム】ご利用ガイド</strong> の「年次ポイント集計」から行ってください（admin のみ表示）。</p></div>';
    return event;
  }

  return {
    PANEL_BUILD: PANEL_BUILD,
    openOverlay: openOverlay,
    closeOverlay: closeOverlay,
    mountRecordRedirect: onShow,
  };
})();
