/**
 * 予算実績アプリ（653）: 工種コード・請求会社名・摘要・明細から matching_key を 651/652 と同じハッシュ規則で自動設定する。
 * 予算行（lookup_budget）で 651 からコピーしたあとも、手修正があれば保存時にキーが揃う。
 */
(function () {
  'use strict';

  var SEP = '|';
  var F_MATCHING = 'matching_key';
  var F_JOB = 'job_code';
  var F_COMPANY = 'company_name';
  var F_SUMMARY = 'summary';
  var F_DETAIL = 'summary_detail';
  var F_LOOKUP = 'lookup_budget';
  var F_JOB_NAME = 'job_name';

  /**
   * 予算行（lookup_budget）が空のとき、651 からコピーされる欄を空にする。
   * 実績日・実績金額・備考は手入力のため残す。
   * @param {object} rec event.record
   */
  function clearFieldsCopiedFrom651(rec) {
    var codes = [F_JOB_NAME, F_JOB, F_COMPANY, F_SUMMARY, F_DETAIL, F_MATCHING];
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

  function u32ToHex8(x) {
    return ('00000000' + (x >>> 0).toString(16)).slice(-8);
  }

  /** 651/652 と同一（論理キー → 32 hex） */
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

  function buildMatchingKey(rec) {
    var job = rec[F_JOB] && rec[F_JOB].value != null ? String(rec[F_JOB].value).trim() : '';
    var company = rec[F_COMPANY] && rec[F_COMPANY].value != null ? String(rec[F_COMPANY].value).trim() : '';
    var summary = rec[F_SUMMARY] && rec[F_SUMMARY].value != null ? String(rec[F_SUMMARY].value).trim() : '';
    var detail =
      rec[F_DETAIL] && rec[F_DETAIL].value != null ? String(rec[F_DETAIL].value).trim() : '';
    if (!job || !company || !summary) {
      return '';
    }
    return hashCanonicalToMatchingKey(job + SEP + company + SEP + summary + SEP + detail);
  }

  function applyKey(event) {
    var rec = event.record;
    if (isBudgetLookupEmpty(rec)) {
      clearFieldsCopiedFrom651(rec);
    }
    if (!rec[F_MATCHING]) {
      return event;
    }
    rec[F_MATCHING].value = buildMatchingKey(rec);
    return event;
  }

  var watchFields = [F_JOB, F_COMPANY, F_SUMMARY, F_DETAIL, F_LOOKUP];
  var changeEvents = [];
  for (var i = 0; i < watchFields.length; i++) {
    changeEvents.push('app.record.create.change.' + watchFields[i]);
    changeEvents.push('app.record.edit.change.' + watchFields[i]);
  }

  kintone.events.on(changeEvents, function (event) {
    return applyKey(event);
  });

  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function (event) {
    return applyKey(event);
  });

  kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], function (event) {
    return applyKey(event);
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
