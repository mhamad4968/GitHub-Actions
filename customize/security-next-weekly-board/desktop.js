(function () {
  'use strict';

  /**
   * Security NEXT 週次掲示板 — 正本 632 を REST 読取
   * npm run deploy:702
   */
  var BUILD = '2026-06-07-sn-weekly-board-v2';

  var STORE_APP_ID =
    typeof window.SN_WEEKLY_STORE_APP === 'number' ? window.SN_WEEKLY_STORE_APP : 632;

  var FC = {
    target_week: 'target_week',
    weekly_trend: 'weekly_trend',
    summary_one_line: 'summary_one_line',
    internal_ref_news_count: 'internal_ref_news_count',
    internal_analysis_run_at: 'internal_analysis_run_at',
  };

  var API_FIELDS = [
    '$id',
    FC.target_week,
    FC.weekly_trend,
    FC.summary_one_line,
    FC.internal_ref_news_count,
    FC.internal_analysis_run_at,
  ];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** kintone RICH_TEXT — 許可タグのみ残す簡易サニタイズ */
  function sanitizeRichHtml(html) {
    var s = String(html || '');
    if (!s.trim()) return '<p class="sn-wk-empty">（本文なし）</p>';
    return s
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  }

  function formatWeekLabel(ymd) {
    if (!ymd) return '（日付不明）';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return ymd;
    return m[1] + '年' + Number(m[2]) + '月' + Number(m[3]) + '日週';
  }

  function fetchAllRecords() {
    return kintone
      .api(kintone.api.url('/k/v1/records.json', true), 'GET', {
        app: STORE_APP_ID,
        query: 'order by ' + FC.target_week + ' desc limit 500',
        fields: API_FIELDS,
      })
      .then(function (resp) {
        return resp.records || [];
      });
  }

  function renderWeekBlock(rec, opts) {
    opts = opts || {};
    var week = (rec[FC.target_week] && rec[FC.target_week].value) || '';
    var oneLine = (rec[FC.summary_one_line] && rec[FC.summary_one_line].value) || '';
    var body = (rec[FC.weekly_trend] && rec[FC.weekly_trend].value) || '';
    var refCount = rec[FC.internal_ref_news_count] && rec[FC.internal_ref_news_count].value;
    var runAt = (rec[FC.internal_analysis_run_at] && rec[FC.internal_analysis_run_at].value) || '';

    var openAttr = opts.open ? ' open' : '';
    var tag = opts.latest ? 'section' : 'details';
    var inner =
      (opts.latest
        ? '<h2 class="sn-wk-latest-title">' + escapeHtml(formatWeekLabel(week)) + '</h2>'
        : '<summary class="sn-wk-summary">' +
          escapeHtml(formatWeekLabel(week)) +
          (oneLine ? ' — ' + escapeHtml(oneLine) : '') +
          '</summary>') +
      (oneLine && opts.latest
        ? '<p class="sn-wk-oneline">' + escapeHtml(oneLine) + '</p>'
        : '') +
      '<div class="sn-wk-body">' +
      sanitizeRichHtml(body) +
      '</div>' +
      '<p class="sn-wk-meta">' +
      (refCount != null && refCount !== '' ? '参照ニュース ' + escapeHtml(String(refCount)) + ' 件' : '') +
      (runAt ? ' · 分析 ' + escapeHtml(String(runAt).slice(0, 19).replace('T', ' ')) : '') +
      '</p>';

    if (tag === 'section') {
      return '<section class="sn-wk-block sn-wk-block--latest">' + inner + '</section>';
    }
    return '<details class="sn-wk-block"' + openAttr + '>' + inner + '</details>';
  }

  function injectNativeHideStyles() {
    if (document.getElementById('sn-weekly-hide-native')) return;
    var style = document.createElement('style');
    style.id = 'sn-weekly-hide-native';
    style.textContent =
      '.gaia-argoui-app-index-recordlist,.gaia-argoui-app-index-norecord,.recordlist-gaia,.recordlist-norecord-gaia,.gaia-argoui-list-norecord,.recordlist-paging-gaia,div[class*="recordlist-norecord"],.gaia-argoui-app-index-paging,.gaia-argoui-app-index-pager,.gaia-argoui-app-index-recordcount,.gaia-argoui-app-recordcount,.gaia-argoui-paging,div[class*="paging-gaia"],div[class*="recordlist-paging"],div[class*="recordcount-gaia"],[class*="recordcount-gaia"],[class*="Recordcount-gaia"],[class*="recordlist-paging"]{display:none !important;}';
    document.head.appendChild(style);
  }

  function injectStyles() {
    if (document.getElementById('sn-weekly-board-style')) return;
    var style = document.createElement('style');
    style.id = 'sn-weekly-board-style';
    style.textContent = [
      '[data-sn-weekly-board]{font-family:"Segoe UI",system-ui,sans-serif;color:#1c1917;max-width:900px;margin:0 auto;padding:0 16px 32px}',
      '[data-sn-weekly-board] *{box-sizing:border-box}',
      '.sn-wk-top{margin:0 -16px 0;padding:20px;background:linear-gradient(135deg,#44403c 0%,#57534e 50%,#78716c 100%);color:#fafaf9;border-radius:0 0 12px 12px}',
      '.sn-wk-top h1{margin:0 0 6px;font-size:1.35rem;font-weight:700}',
      '.sn-wk-top-lead{margin:0;font-size:.9rem;opacity:.92;line-height:1.45}',
      '.sn-wk-list{margin-top:20px}',
      '.sn-wk-block{background:#fff;border:1px solid #e7e5e4;border-radius:10px;padding:16px 20px;margin-bottom:12px}',
      '.sn-wk-block--latest{border-color:#fca5a5;background:linear-gradient(180deg,#fff,#fef2f2)}',
      '.sn-wk-latest-title{margin:0 0 10px;font-size:1.15rem;color:#991b1b}',
      '.sn-wk-summary{cursor:pointer;font-weight:600;font-size:1rem;color:#1c1917;padding:4px 0}',
      '.sn-wk-oneline{margin:0 0 12px;font-size:1.05rem;font-weight:600;color:#44403c;line-height:1.5}',
      '.sn-wk-body{font-size:15px;line-height:1.65;color:#292524}',
      '.sn-wk-body p{margin:0 0 .75em}',
      '.sn-wk-body ul,.sn-wk-body ol{margin:0 0 .75em 1.25em;padding:0}',
      '.sn-wk-body h2,.sn-wk-body h3{font-size:1em;margin:1em 0 .5em}',
      '.sn-wk-meta{margin:12px 0 0;font-size:11px;color:#a8a29e}',
      '.sn-wk-empty{color:#78716c;font-style:italic}',
      '.sn-wk-foot{margin-top:20px;padding-top:12px;border-top:1px solid #e7e5e4;font-size:11px;color:#a8a29e}',
      '.sn-wk-empty-all{padding:32px;text-align:center;color:#78716c;background:#fafaf9;border:1px dashed #d6d3d1;border-radius:8px}',
    ].join('');
    document.head.appendChild(style);
  }

  function buildUi(container) {
    container.innerHTML =
      '<div id="sn-weekly-root" data-sn-weekly-board>' +
      '<header class="sn-wk-top">' +
      '<h1>Security NEXT 週次掲示板</h1>' +
      '<p class="sn-wk-top-lead">毎週金曜日　17：00に要約された記事が掲載されます。</p>' +
      '</header>' +
      '<div id="sn-wk-list" class="sn-wk-list">読込中…</div>' +
      '<footer class="sn-wk-foot">BUILD ' +
      BUILD +
      ' · 正本 ' +
      STORE_APP_ID +
      '</footer></div>';

    injectStyles();

    return fetchAllRecords().then(function (records) {
      var listEl = document.getElementById('sn-wk-list');
      if (!records.length) {
        listEl.innerHTML =
          '<p class="sn-wk-empty-all">週次要約はまだありません。金曜の analyze 実行後に表示されます。</p>';
        return;
      }
      var html = renderWeekBlock(records[0], { latest: true, open: true });
      for (var i = 1; i < records.length; i++) {
        html += renderWeekBlock(records[i]);
      }
      listEl.innerHTML = html;
    });
  }

  kintone.events.on('app.record.index.show', function (event) {
    injectNativeHideStyles();
    var header = kintone.app.getHeaderSpaceElement && kintone.app.getHeaderSpaceElement();
    if (!header) return event;
    if (header.querySelector('[data-sn-weekly-board]')) return event;

    header.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.id = 'sn-weekly-board-wrap';
    header.appendChild(wrap);

    buildUi(wrap).catch(function (err) {
      wrap.innerHTML =
        '<div data-sn-weekly-board><p style="color:#b91c1c;padding:16px">週次要約の取得に失敗しました。正本 ' +
        STORE_APP_ID +
        ' の閲覧権限を確認してください。<br>' +
        escapeHtml(err && err.message ? err.message : String(err)) +
        '</p></div>';
    });
    return event;
  });
})();
