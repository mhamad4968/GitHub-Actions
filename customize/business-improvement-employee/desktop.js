(function () {
  'use strict';

  /** 業務改善 ver.02 — 社員マスタ698 一覧：595同期ステータスバナー */
  var BUILD = '2026-06-25-bi-employee-sync595-banner-v1';

  var SETTINGS_APP_ID = 697;
  var BANNER_ID = 'bi-employee-sync595-banner';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getHeaderSpace() {
    return (
      (typeof kintone !== 'undefined' &&
        kintone.app &&
        kintone.app.getHeaderSpaceElement &&
        kintone.app.getHeaderSpaceElement()) ||
      (typeof kintone !== 'undefined' &&
        kintone.mobile &&
        kintone.mobile.app &&
        kintone.mobile.app.getHeaderSpaceElement &&
        kintone.mobile.app.getHeaderSpaceElement()) ||
      null
    );
  }

  function parseSyncMeta(raw) {
    if (!raw || !String(raw).trim()) return null;
    try {
      return JSON.parse(String(raw));
    } catch (_e) {
      return null;
    }
  }

  function fmtNum(n) {
    if (n == null || n === '') return '—';
    var x = Number(n);
    return Number.isFinite(x) ? String(x) : esc(n);
  }

  function bannerTheme(meta) {
    if (!meta) {
      return {
        bg: '#fffbeb',
        border: '#fbbf24',
        titleColor: '#92400e',
        bodyColor: '#78350f',
        headline: '595同期情報：未取得',
      };
    }
    if (meta.ok === false) {
      return {
        bg: '#fef2f2',
        border: '#f87171',
        titleColor: '#991b1b',
        bodyColor: '#7f1d1d',
        headline: '595社員マスタ → 社員マスタ（698）同期：失敗',
      };
    }
    return {
      bg: '#ecfdf5',
      border: '#34d399',
      titleColor: '#065f46',
      bodyColor: '#047857',
      headline: '595社員マスタ → 社員マスタ（698）同期：成功',
    };
  }

  function syncBannerHtml(meta) {
    var theme = bannerTheme(meta);
    var box =
      'border-radius:12px;padding:14px 18px;margin:0 0 14px;box-shadow:0 1px 4px rgba(15,23,42,.06);font-size:14px;line-height:1.55';
    var body;

    if (!meta) {
      body =
        '<span style="color:' +
        theme.bodyColor +
        '">697 設定マスタの共通設定に同期メタがまだ記録されていません。' +
        '初回の <strong>595→698 同期</strong> 実行後に、最終同期日時と件数がここに表示されます。</span>';
    } else if (meta.ok === false) {
      body =
        '<span style="color:' +
        theme.bodyColor +
        '">' +
        '<strong>最終試行:</strong> ' +
        esc(meta.atDisplay || meta.at || '—') +
        '<br>' +
        (meta.error
          ? '<strong>エラー:</strong> ' + esc(meta.error) + '<br>'
          : '') +
        '※ 一覧のデータは<strong>前回成功時</strong>のミラーです。管理者は同期スクリプトで再実行してください。</span>';
    } else {
      body =
        '<span style="color:' +
        theme.bodyColor +
        '">' +
        '<strong>最終同期:</strong> ' +
        esc(meta.atDisplay || meta.at || '—') +
        '<br>' +
        '<strong>新規</strong> ' +
        fmtNum(meta.added) +
        ' 件 / <strong>更新</strong> ' +
        fmtNum(meta.updated) +
        ' 件 / <strong>変更なし</strong> ' +
        fmtNum(meta.unchanged) +
        ' 件' +
        '<br>' +
        '<strong>595</strong> ' +
        fmtNum(meta.source595) +
        ' 件 → <strong>ミラー（698）</strong> ' +
        fmtNum(meta.mirrorTotal) +
        ' 件</span>';
    }

    var note =
      '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(15,23,42,.12);font-size:0.88em;color:#475569">' +
      'このアプリは <strong>595 社員マスタの読み取り専用ミラー</strong> です。レコードの手動追加・編集は行わないでください。' +
      '（BUILD: ' +
      esc(BUILD) +
      '）</div>';

    return (
      '<div id="' +
      BANNER_ID +
      '" style="background:' +
      theme.bg +
      ';border:2px solid ' +
      theme.border +
      ';' +
      box +
      '">' +
      '<strong style="color:' +
      theme.titleColor +
      ';font-size:1.05em">' +
      theme.headline +
      '</strong><br>' +
      body +
      note +
      '</div>'
    );
  }

  function mountBanner(meta) {
    var space = getHeaderSpace();
    if (!space) return;
    var existing = document.getElementById(BANNER_ID);
    if (existing) existing.remove();
    var wrap = document.createElement('div');
    wrap.innerHTML = syncBannerHtml(meta);
    var banner = wrap.firstElementChild;
    if (!banner) return;
    if (space.firstChild) {
      space.insertBefore(banner, space.firstChild);
    } else {
      space.appendChild(banner);
    }
  }

  function fetchCommonSyncMeta() {
    return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
      app: SETTINGS_APP_ID,
      query: 'record_kind in ("共通設定") order by $id asc limit 1',
      fields: ['sync595_meta'],
    }).then(function (resp) {
      var rec = (resp.records || [])[0];
      if (!rec) return null;
      return parseSyncMeta(rec.sync595_meta && rec.sync595_meta.value);
    });
  }

  kintone.events.on(['app.record.index.show', 'mobile.app.record.index.show'], function (event) {
    fetchCommonSyncMeta()
      .then(function (meta) {
        mountBanner(meta);
      })
      .catch(function (e) {
        console.warn('[bi-698 sync banner]', e);
        mountBanner(null);
      });
    return event;
  });
})();
