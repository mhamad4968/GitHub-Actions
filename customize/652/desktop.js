/**
 * 予算変更アプリ（652）:
 * - matching_key を工種コード・請求会社名・摘要・明細から再計算（651 と同じ論理キーのハッシュ）。
 * - フィールド prev_amount / delta_amount がある場合、変更月・変更後金額・予算行・突合要素の変更時および画面表示時に直前額・増減を自動計算（保存前に画面へ反映）。
 * - 増減額 delta_amount: 正を青 (#1565c0)、負を赤 (#c62828)、ゼロ・空は既定色（新規・編集・詳細）。
 *
 * 運用メモ: ルックアップのキーは 651 の matching_key（突合キー）推奨。キーが job_lookup のままだと同一工種の別行と誤結合し得る。
 */
(function () {
  'use strict';

  if (!document.getElementById('jbis-652-delta-style')) {
    var st = document.createElement('style');
    st.id = 'jbis-652-delta-style';
    st.textContent =
      '.jbis652-delta-pos input, .jbis652-delta-pos textarea, .jbis652-delta-pos .value-text { color: #1565c0 !important; font-weight: 600 !important; }' +
      '.jbis652-delta-neg input, .jbis652-delta-neg textarea, .jbis652-delta-neg .value-text { color: #c62828 !important; font-weight: 600 !important; }';
    document.head.appendChild(st);
  }

  var APP_BUDGET = 651;
  var APP_CHANGE = 652;

  var SEP = '|';
  var F_MATCHING = 'matching_key';
  /** 651 の job_code と同じ値（突合左段はコード単位） */
  var F_JOB_CODE = 'job_code';
  var F_COMPANY = 'company_name';
  var F_SUMMARY = 'summary';
  var F_DETAIL = 'summary_detail';
  var F_CHANGE_MONTH = 'change_month';
  var F_CHANGE_AMOUNT = 'change_amount';
  var F_PREV = 'prev_amount';
  var F_DELTA = 'delta_amount';
  /** 651 参照ルックアップ（フィールドコードはアプリ設定どおり） */
  var F_LOOKUP = 'ルックアップ';
  var F_JOB_NAME = 'job_name';

  /**
   * 予算行ルックアップが空のとき、651 からコピーされる欄を空にする（残ったまま保存しない）。
   * @param {object} rec event.record
   */
  function clearFieldsCopiedFrom651(rec) {
    var codes = [F_JOB_NAME, F_JOB_CODE, F_COMPANY, F_SUMMARY, F_DETAIL, F_MATCHING];
    var i;
    for (i = 0; i < codes.length; i++) {
      var code = codes[i];
      if (Object.prototype.hasOwnProperty.call(rec, code) && rec[code]) {
        rec[code].value = '';
      }
    }
  }

  function isBudgetLookupEmpty(rec) {
    if (!Object.prototype.hasOwnProperty.call(rec, F_LOOKUP) || !rec[F_LOOKUP]) {
      return false;
    }
    var v = rec[F_LOOKUP].value;
    return v === '' || v == null;
  }

  /**
   * クエリ用にダブルクォートをエスケープする。
   * @param {string} s 値
   * @returns {string}
   */
  function escapeQuery(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function u32ToHex8(x) {
    return ('00000000' + (x >>> 0).toString(16)).slice(-8);
  }

  /** 651/653 と同一（論理キー → 32 hex） */
  function hashCanonicalToMatchingKey(canonical) {
    if (!canonical) {
      return '';
    }
    var i;
    var h1 = 2166136261;
    for (i = 0; i < canonical.length; i++) {
      h1 ^= canonical.charCodeAt(i);
      h1 = Math.imul(h1, 16777619);
    }
    var h2 = 5381;
    for (i = 0; i < canonical.length; i++) {
      h2 = ((h2 << 5) + h2 + canonical.charCodeAt(i)) | 0;
    }
    var h3 = 5381;
    for (i = canonical.length - 1; i >= 0; i--) {
      h3 = ((h3 << 5) + h3 + canonical.charCodeAt(i)) | 0;
    }
    var h4 = 0;
    for (i = 0; i < canonical.length; i++) {
      h4 = (Math.imul(h4, 31) + canonical.charCodeAt(i)) | 0;
    }
    return u32ToHex8(h1) + u32ToHex8(h2) + u32ToHex8(h3) + u32ToHex8(h4);
  }

  /**
   * 652 レコードから突合キーを組み立てる。
   * @param {object} rec event.record
   * @returns {string}
   */
  function buildMatchingKey(rec) {
    var job = rec[F_JOB_CODE] && rec[F_JOB_CODE].value != null ? String(rec[F_JOB_CODE].value).trim() : '';
    var company = rec[F_COMPANY] && rec[F_COMPANY].value != null ? String(rec[F_COMPANY].value).trim() : '';
    var summary = rec[F_SUMMARY] && rec[F_SUMMARY].value != null ? String(rec[F_SUMMARY].value).trim() : '';
    var detail =
      rec[F_DETAIL] && rec[F_DETAIL].value != null ? String(rec[F_DETAIL].value).trim() : '';
    if (!job || !company || !summary) {
      return '';
    }
    return hashCanonicalToMatchingKey(job + SEP + company + SEP + summary + SEP + detail);
  }

  function applyMatchingKey(event) {
    if (event.record[F_MATCHING]) {
      event.record[F_MATCHING].value = buildMatchingKey(event.record);
    }
    return event;
  }

  /**
   * 数値フィールドの値を number にする（空は null）。
   * @param {object} field kintone フィールドオブジェクト
   * @returns {number|null}
   */
  function numField(field) {
    if (!field || field.value === '' || field.value == null) {
      return null;
    }
    var n = Number(field.value);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * 増減額フィールドの表示色（正: 青 / 負: 赤 / ゼロ・空: 既定）。
   */
  function styleDeltaAmountUi() {
    if (typeof kintone === 'undefined' || !kintone.app || !kintone.app.record) {
      return;
    }
    if (typeof kintone.app.record.getFieldElement !== 'function' || typeof kintone.app.record.get !== 'function') {
      return;
    }
    var el = kintone.app.record.getFieldElement(F_DELTA);
    if (!el) {
      return;
    }
    var data = kintone.app.record.get();
    var f = data.record[F_DELTA];
    var raw = f && f.value !== undefined && f.value !== null && f.value !== '' ? String(f.value).trim() : '';
    var n = raw === '' ? null : Number(raw);
    if (!Number.isFinite(n)) {
      n = null;
    }

    var color = '';
    var weight = '';
    if (n != null) {
      if (n > 0) {
        color = '#1565c0';
        weight = '600';
      } else if (n < 0) {
        color = '#c62828';
        weight = '600';
      }
    }

    el.classList.remove('jbis652-delta-pos', 'jbis652-delta-neg');

    var nodes = el.querySelectorAll('input, textarea');
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (color) {
        nodes[i].style.setProperty('color', color, 'important');
        nodes[i].style.setProperty('font-weight', weight, 'important');
      } else {
        nodes[i].style.removeProperty('color');
        nodes[i].style.removeProperty('font-weight');
      }
    }

    var spans = el.querySelectorAll('.value-text, span[class*="value"], div[class*="fieldvalue"]');
    for (i = 0; i < spans.length; i++) {
      if (color) {
        spans[i].style.setProperty('color', color, 'important');
        spans[i].style.setProperty('font-weight', weight, 'important');
      } else {
        spans[i].style.removeProperty('color');
        spans[i].style.removeProperty('font-weight');
      }
    }

    if (n != null && n > 0) {
      el.classList.add('jbis652-delta-pos');
    } else if (n != null && n < 0) {
      el.classList.add('jbis652-delta-neg');
    }
  }

  function scheduleStyleDelta() {
    setTimeout(styleDeltaAmountUi, 0);
  }

  /**
   * runPrevDelta 後に増減額の色を更新する。
   * @param {object} event kintone イベント
   * @returns {Promise<object>}
   */
  function runPrevDeltaThenStyle(event) {
    return runPrevDelta(event).then(function (e) {
      scheduleStyleDelta();
      return e;
    });
  }

  var watchFields = [F_JOB_CODE, F_COMPANY, F_SUMMARY, F_DETAIL, F_LOOKUP, F_CHANGE_MONTH, F_CHANGE_AMOUNT];
  var changeEvents = [];
  for (var i = 0; i < watchFields.length; i++) {
    changeEvents.push('app.record.create.change.' + watchFields[i]);
    changeEvents.push('app.record.edit.change.' + watchFields[i]);
  }

  /**
   * 直前の月次額・増減額を API で求めてレコードに書き込む（Promise を返す）。
   * @param {object} event kintone イベント
   * @returns {Promise<object>}
   */
  function runPrevDelta(event) {
    var rec = event.record;
    if (isBudgetLookupEmpty(rec)) {
      clearFieldsCopiedFrom651(rec);
    }
    applyMatchingKey(event);
    var hasPrev = Object.prototype.hasOwnProperty.call(rec, F_PREV) && rec[F_PREV];
    var hasDelta = Object.prototype.hasOwnProperty.call(rec, F_DELTA) && rec[F_DELTA];
    if (!hasPrev && !hasDelta) {
      return Promise.resolve(event);
    }

    var key = buildMatchingKey(rec);
    var monthVal =
      rec[F_CHANGE_MONTH] && rec[F_CHANGE_MONTH].value != null ? String(rec[F_CHANGE_MONTH].value) : '';
    var newAmt = numField(rec[F_CHANGE_AMOUNT]);
    var excludeId = event.record.$id && event.record.$id.value != null ? String(event.record.$id.value) : undefined;

    if (!key || !monthVal || newAmt == null) {
      if (hasPrev) {
        rec[F_PREV].value = '';
      }
      if (hasDelta) {
        rec[F_DELTA].value = '';
      }
      return Promise.resolve(event);
    }

    return fetchPrevChangeAmount(key, monthVal, excludeId)
      .then(function (prevFromChanges) {
        if (prevFromChanges != null) {
          return { prev: prevFromChanges, src: 'change' };
        }
        return fetchBudgetAmount(key).then(function (b) {
          return { prev: b != null ? b : null, src: 'budget' };
        });
      })
      .then(function (pack) {
        var prev = pack.prev;
        if (prev == null) {
          prev = 0;
        }
        if (hasPrev) {
          rec[F_PREV].value = String(prev);
        }
        if (hasDelta) {
          rec[F_DELTA].value = String(newAmt - prev);
        }
        return event;
      })
      .catch(function (e) {
        console.warn('[652 予算変更] prev/delta 取得に失敗', e);
        return event;
      });
  }

  kintone.events.on(changeEvents, function (event) {
    return runPrevDeltaThenStyle(event);
  });

  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function (event) {
    return runPrevDeltaThenStyle(event);
  });

  kintone.events.on(['app.record.create.change.' + F_DELTA, 'app.record.edit.change.' + F_DELTA], function (event) {
    scheduleStyleDelta();
    return event;
  });

  kintone.events.on('app.record.detail.show', function (event) {
    scheduleStyleDelta();
    return event;
  });

  /**
   * 同一 matching_key で、変更月が基準より前のレコードのうち最大 change_month の change_amount を返す。
   * @param {string} key 突合キー
   * @param {string} monthBefore YYYY-MM-DD（この日付「より前」の変更のみ）
   * @param {string|undefined} excludeId 編集時は自分の $id を除く
   * @returns {Promise<number|null>}
   */
  function fetchPrevChangeAmount(key, monthBefore, excludeId) {
    if (!key || !monthBefore) {
      return Promise.resolve(null);
    }
    var url = kintone.api.url('/k/v1/records.json', true);
    var q = F_MATCHING + ' = "' + escapeQuery(key) + '"';
    return kintone
      .api(url, 'GET', {
        app: APP_CHANGE,
        query: q,
        fields: ['$id', F_CHANGE_MONTH, F_CHANGE_AMOUNT],
        totalCount: false,
      })
      .then(function (resp) {
        var rows = resp.records || [];
        var bestMonth = '';
        var bestAmt = null;
        for (var i = 0; i < rows.length; i++) {
          var rid = rows[i].$id && rows[i].$id.value != null ? String(rows[i].$id.value) : '';
          if (excludeId && rid === String(excludeId)) {
            continue;
          }
          var cm =
            rows[i][F_CHANGE_MONTH] && rows[i][F_CHANGE_MONTH].value != null
              ? String(rows[i][F_CHANGE_MONTH].value)
              : '';
          if (!cm || cm >= monthBefore) {
            continue;
          }
          if (bestMonth === '' || cm > bestMonth) {
            bestMonth = cm;
            bestAmt = numField(rows[i][F_CHANGE_AMOUNT]);
          }
        }
        return bestAmt;
      });
  }

  /**
   * 651 から当初予算額 budget_amount を1件取得する。
   * @param {string} key matching_key
   * @returns {Promise<number|null>}
   */
  function fetchBudgetAmount(key) {
    if (!key) {
      return Promise.resolve(null);
    }
    var url = kintone.api.url('/k/v1/records.json', true);
    var q = F_MATCHING + ' = "' + escapeQuery(key) + '"';
    return kintone
      .api(url, 'GET', {
        app: APP_BUDGET,
        query: q,
        fields: ['budget_amount'],
        totalCount: false,
      })
      .then(function (resp) {
        var rows = resp.records || [];
        if (!rows.length) {
          return null;
        }
        return numField(rows[0].budget_amount);
      });
  }

  kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], function (event) {
    return runPrevDeltaThenStyle(event);
  });
})();

/** 予算ポータル一覧ナビ（正本: customize/budget-portal/jbis-budget-nav.js と同期） */
(function () {
  'use strict';

  var JBIS_BUDGET_DASHBOARD_APP_ID = 654;

  var LINKS = [
    { id: JBIS_BUDGET_DASHBOARD_APP_ID, label: 'ダッシュボード', sub: '予算ポータル' },
    { id: 649, label: '請求会社マスタ', sub: '649' },
    { id: 650, label: '工種マスタ', sub: '650' },
    { id: 651, label: '予算', sub: '当初' },
    { id: 652, label: '予算変更', sub: '652' },
    { id: 653, label: '予算実績', sub: '653' },
  ];

  function appHref(appId) {
    return '/k/' + appId + '/';
  }

  function renderNav() {
    var cur = kintone.app.getId();

    var wrap = document.createElement('div');
    wrap.className = 'jbis-budget-nav-wrap';
    wrap.setAttribute(
      'style',
      'margin:0 0 12px 0;padding:10px 12px;background:#f5f7fa;border:1px solid #e3e7ed;border-radius:6px;font-size:13px;'
    );

    var title = document.createElement('div');
    title.textContent = '予算ポータル';
    title.setAttribute('style', 'font-weight:600;margin-bottom:8px;color:#333;');
    wrap.appendChild(title);

    var row = document.createElement('div');
    row.setAttribute('style', 'display:flex;flex-wrap:wrap;align-items:center;gap:8px;');

    var i;
    for (i = 0; i < LINKS.length; i++) {
      var item = LINKS[i];
      var a = document.createElement('a');
      a.href = appHref(item.id);
      a.textContent = item.label;
      var isHere = Number(cur) === Number(item.id);
      a.setAttribute(
        'style',
        'display:inline-block;padding:6px 10px;border-radius:4px;text-decoration:none;border:1px solid ' +
          (isHere ? '#1976d2' : '#c5cae9') +
          ';background:' +
          (isHere ? '#e3f2fd' : '#fff') +
          ';color:' +
          (isHere ? '#0d47a1' : '#3949ab') +
          ';font-weight:' +
          (isHere ? '600' : '400') +
          ';'
      );
      if (isHere) {
        a.setAttribute('aria-current', 'page');
      }
      row.appendChild(a);
    }

    wrap.appendChild(row);
    return wrap;
  }

  function mount() {
    var space = kintone.app.getHeaderSpaceElement();
    if (!space) {
      return;
    }
    if (space.querySelector('.jbis-budget-nav-wrap')) {
      return;
    }
    space.appendChild(renderNav());
  }

  kintone.events.on('app.record.index.show', function (event) {
    mount();
    return event;
  });
})();
