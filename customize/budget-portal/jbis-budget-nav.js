/**
 * 予算連携: 一覧のヘッダーにダッシュボード・各アプリへのリンクを出す。
 * 649・650 はこのファイルをそのままデプロイ（deploy:649 / deploy:650）。
 * 651・652・653 は desktop.js 末尾の同一ブロックと同期すること（定数 JBIS_BUDGET_DASHBOARD_APP_ID）。
 */
(function () {
  'use strict';

  /** 予算ダッシュボードアプリ ID（create-budget-dashboard-app.js が作成後に一括置換可） */
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
