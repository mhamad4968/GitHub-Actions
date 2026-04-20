/**
 * 運用ガイドアプリ — 一覧画面の先頭に HTML ガイドを表示
 * 本文はレコード guide_body_html（sync スクリプトが docs/ops-guide から投入）
 */
(function () {
  'use strict';

  var TAB_ORDER = ['hub', 'pc', 'personal', 'shared', 'employee', 'lifecycle'];
  var TAB_LABELS = {
    hub: 'トップ',
    pc: 'PC台帳',
    personal: '個人アカウント',
    shared: '共有',
    employee: '社員マスタ',
    lifecycle: '異動・退職・買替',
  };

  var htmlMap = null;

  window.__JBIS_OPS_GUIDE_NAV__ = function (slug) {
    window.__JBIS_OPS_GUIDE_ACTIVE_SLUG__ = slug || 'hub';
    renderIframe();
  };

  window.addEventListener('message', function (ev) {
    if (ev.data && ev.data.type === 'jbis-ops-guide-nav' && ev.data.slug) {
      window.__JBIS_OPS_GUIDE_NAV__(ev.data.slug);
    }
    // iframe 内 HTML が自分の scrollHeight を通知してきたら、iframe を自動リサイズ
    // ※ 縮小は禁止（最低 1500px は確保）。成長のみ許可することで、計測タイミングが早い場合でも
    //   初期高さを下回って真っ白になる事故を防ぐ
    if (ev.data && ev.data.type === 'jbis-ops-guide-iframe-resize' && typeof ev.data.height === 'number') {
      var iframe = qs('#jbis-ops-guide-iframe');
      if (iframe) {
        var requested = Math.ceil(ev.data.height) + 24;
        var current = iframe.offsetHeight || 1500;
        var h = Math.max(1500, current, Math.min(requested, 12000));
        iframe.style.height = h + 'px';
        var wrap = iframe.parentElement;
        if (wrap) wrap.style.height = h + 'px';
      }
    }
  });

  function qs(sel) {
    return document.querySelector(sel);
  }

  function findRecordListEl() {
    return (
      qs('.recordlist-gaia') ||
      qs('[class*="recordlist-gaia"]') ||
      qs('[class*="recordlist"]')
    );
  }

  function hideRecordList() {
    var list = findRecordListEl();
    if (list) list.style.display = 'none';
    var hdr = qs('.recordlist-header-gaia');
    if (hdr) hdr.style.display = 'none';
  }

  function showRecordList() {
    var list = findRecordListEl();
    if (list) list.style.display = '';
    var hdr = qs('.recordlist-header-gaia');
    if (hdr) hdr.style.display = '';
  }

  function renderIframe() {
    var iframe = qs('#jbis-ops-guide-iframe');
    if (!iframe || !htmlMap) return;
    var slug = window.__JBIS_OPS_GUIDE_ACTIVE_SLUG__ || 'hub';
    var entry = htmlMap[slug];
    if (!entry || !entry.html) {
      iframe.removeAttribute('src');
      iframe.srcdoc = '<body style="font-family:sans-serif;padding:24px">\u3053\u306e\u30ac\u30a4\u30c9\u306e HTML \u304c\u307e\u3060\u540c\u671f\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002\u7ba1\u7406\u8005\u306b npm run ops-guide:publish \u306e\u5b9f\u884c\u3092\u4f9d\u983c\u3057\u3066\u304f\u3060\u3055\u3044\u3002</body>';
      return;
    }
    iframe.removeAttribute('src');
    iframe.srcdoc = entry.html;
    iframe.setAttribute('title', entry.title || '\u904b\u7528\u30ac\u30a4\u30c9');

    document.querySelectorAll('[data-ops-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-ops-tab') === slug;
      btn.style.background = on ? '#3b82f6' : 'rgba(255,255,255,.12)';
      btn.style.fontWeight = on ? '800' : '600';
    });
  }

  function buildTabs(bar) {
    TAB_ORDER.forEach(function (slug) {
      if (!htmlMap[slug] || !htmlMap[slug].html) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-ops-tab', slug);
      b.textContent = TAB_LABELS[slug] || slug;
      b.style.cssText =
        'padding:8px 14px;font-size:13px;border:none;border-radius:8px;color:#fff;' +
        'cursor:pointer;background:rgba(255,255,255,.12);font-weight:600;transition:background .15s;';
      b.addEventListener('click', function () {
        window.__JBIS_OPS_GUIDE_NAV__(slug);
      });
      bar.appendChild(b);
    });

    var listBtn = document.createElement('button');
    listBtn.type = 'button';
    listBtn.id = 'jbis-ops-guide-toggle-list';
    listBtn.textContent = '一覧を表示';
    listBtn.style.cssText =
      'margin-left:auto;padding:8px 16px;font-size:12px;border-radius:8px;border:none;' +
      'background:#f59e0b;color:#111;font-weight:800;cursor:pointer;';
    listBtn.addEventListener('click', function () {
      var hidden = listBtn.getAttribute('data-list-hidden') === '1';
      if (hidden) {
        showRecordList();
        listBtn.setAttribute('data-list-hidden', '0');
        listBtn.textContent = '一覧を隠す';
      } else {
        hideRecordList();
        listBtn.setAttribute('data-list-hidden', '1');
        listBtn.textContent = '一覧を表示';
      }
    });
    bar.appendChild(listBtn);
  }

  // 主要アプリへのワンクリック遷移メニュー（iframe外＝Kintone DOMに直接配置するためクリッピングしない）
  var QUICK_LINKS = [
    { emoji: '💻', label: 'PC管理台帳', url: 'https://jbis-kintone.cybozu.com/k/594/' },
    { emoji: '🔑', label: 'アカウント台帳', url: 'https://jbis-kintone.cybozu.com/k/627/' },
    { emoji: '👤', label: '社員マスタ', url: 'https://jbis-kintone.cybozu.com/k/595/' },
    { emoji: '🏢', label: '共有採番', url: 'https://jbis-kintone.cybozu.com/k/667/' },
    { emoji: '🎰', label: '個人採番', url: 'https://jbis-kintone.cybozu.com/k/626/' },
    { emoji: '📋', label: 'エラーログ', url: 'https://jbis-kintone.cybozu.com/k/656/' },
  ];
  var DASHBOARD_LINKS = [
    { emoji: '📊', label: 'PC↔アカウント相関ダッシュボード', url: 'https://jbis-kintone.cybozu.com/k/594/?view=13459660' },
    { emoji: '🪪', label: 'WindowsID重複ダッシュボード', url: 'https://jbis-kintone.cybozu.com/k/627/?view=13459662' },
    { emoji: '📧', label: 'M365管理台帳', url: 'https://jbis-kintone.cybozu.com/k/627/?view=13459663' },
    { emoji: '⚠', label: 'Office5台超過アカウント', url: 'https://jbis-kintone.cybozu.com/k/627/?view=13459688' },
  ];

  function buildQuickLinkBar() {
    var bar = document.createElement('div');
    bar.id = 'jbis-ops-quick-link-bar';
    bar.style.cssText =
      'background:#0f172a;color:#fff;padding:10px 14px;border-radius:10px 10px 0 0;' +
      'display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;font-size:13px;line-height:1.6;';
    var lbl = document.createElement('span');
    lbl.textContent = '📌 主要メニュー：';
    lbl.style.cssText = 'color:#fbbf24;font-weight:800;letter-spacing:.04em;flex-shrink:0;';
    bar.appendChild(lbl);
    QUICK_LINKS.forEach(function (it) {
      var a = document.createElement('a');
      a.href = it.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = it.emoji + ' ' + it.label;
      a.style.cssText =
        'color:#fff;text-decoration:underline;text-underline-offset:3px;font-weight:700;' +
        'padding:2px 4px;border-radius:4px;transition:.15s;white-space:nowrap;';
      a.addEventListener('mouseenter', function () { a.style.background = 'rgba(251,191,36,.25)'; a.style.color = '#fde68a'; });
      a.addEventListener('mouseleave', function () { a.style.background = 'transparent'; a.style.color = '#fff'; });
      bar.appendChild(a);
    });
    return bar;
  }

  function buildDashboardBar() {
    var bar = document.createElement('div');
    bar.id = 'jbis-ops-dashboard-bar';
    bar.style.cssText =
      'background:#1e293b;color:#fff;padding:8px 14px;' +
      'display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;font-size:12px;line-height:1.6;border-bottom:2px solid #fbbf24;';
    var lbl = document.createElement('span');
    lbl.textContent = '📊 データ品質ダッシュボード：';
    lbl.style.cssText = 'color:#93c5fd;font-weight:800;flex-shrink:0;';
    bar.appendChild(lbl);
    DASHBOARD_LINKS.forEach(function (it) {
      var a = document.createElement('a');
      a.href = it.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = it.emoji + ' ' + it.label;
      a.style.cssText =
        'color:#fde68a;text-decoration:underline;text-underline-offset:3px;font-weight:700;' +
        'padding:2px 4px;border-radius:4px;transition:.15s;white-space:nowrap;';
      a.addEventListener('mouseenter', function () { a.style.background = 'rgba(251,191,36,.25)'; });
      a.addEventListener('mouseleave', function () { a.style.background = 'transparent'; });
      bar.appendChild(a);
    });
    return bar;
  }

  function injectShell() {
    if (qs('#jbis-ops-guide-shell')) return qs('#jbis-ops-guide-shell');

    var shell = document.createElement('div');
    shell.id = 'jbis-ops-guide-shell';
    // 2026-04-20 v7: kintone のグローバルヘッダー(黄+灰 計 ~120px)で
    //   shell 上端が常に隠れる問題を、measured top-padding で物理的に押し下げて解決。
    //   shell 自身の border-radius は外側で隠れるため不要。背景 transparent で kintone と整合。
    shell.style.cssText =
      'margin:0 0 16px 0;background:transparent;' +
      'box-shadow:0 4px 20px rgba(0,0,0,.1);';

    // 1) tabs / 2) QuickLink / 3) Dashboard / 4) hint / 5) iframe の順
    //    QuickLink を spacer 兼 1 行目とすると、青タブが上にあるよりこの順の方が
    //    新規ユーザーは「外部リンク → 自分が見たいガイドへ」の動線で迷わない。

    // ① 主要アプリへの文字リンクメニュー（最上段。最初の数十pxは kintone ヘッダーで隠れても可）
    shell.appendChild(buildQuickLinkBar());
    // ② データ品質ダッシュボードへの文字リンク（旧「Windows ID 重複 / 紐付けなしチェック」）
    shell.appendChild(buildDashboardBar());

    // ③ ガイド切り替えタブ
    var bar = document.createElement('div');
    bar.id = 'jbis-ops-guide-tabs';
    bar.style.cssText =
      'display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;background:#1e3a5f;align-items:center;';
    shell.appendChild(bar);

    var hint = document.createElement('div');
    hint.style.cssText =
      'padding:6px 12px;font-size:11px;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;';
    hint.textContent =
      '※ 画面の内容は Kintone レコードと同期されています。ガイド本文の更新は運用側の自動デプロイ（ops-guide:publish）で反映されます。';
    shell.appendChild(hint);

    // ④ ガイド本文iframe（最低 1500px、コンテンツが長ければ postMessage で更に拡張）
    var iframeWrap = document.createElement('div');
    iframeWrap.style.cssText = 'position:relative;height:1500px;background:#fff;transition:height .25s ease;';
    var iframe = document.createElement('iframe');
    iframe.id = 'jbis-ops-guide-iframe';
    iframe.setAttribute('title', '運用ガイド');
    iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'
    );
    // 自動リサイズが間に合わない場合のフォールバックとして iframe 自身にもスクロールを許可
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#fff;';
    iframeWrap.appendChild(iframe);
    shell.appendChild(iframeWrap);

    var host = qs('.contents-bodygaia') || qs('.ocean-ui-plugin-kintone-layout') || document.body;
    host.insertBefore(shell, host.firstChild);

    // 2026-04-20 v7: kintone のグローバルヘッダーで shell 上端が隠れる問題を物理補正。
    //   getBoundingClientRect().top を計測し、ヘッダー(動的取得)の高さより上にあれば
    //   marginTop で押し下げる。SPA 遷移後の DOM 変動にも追従するため複数タイミングで実行。
    function adjustShellOffset() {
      var s = qs('#jbis-ops-guide-shell');
      if (!s) return;
      // kintone ヘッダーの実高さを取れたら使う、ダメなら 100px 既定
      var hdr = qs('.gaia-header') || qs('.gaia-header-banner-gaia') || qs('header');
      var hdrH = (hdr && hdr.offsetHeight) ? hdr.offsetHeight : 100;
      var rect = s.getBoundingClientRect();
      // shell 上端が viewport 最上 (ヘッダー直下) より上にあれば押し下げる
      if (rect.top < hdrH + 4) {
        s.style.marginTop = (hdrH - rect.top + 8) + 'px';
      }
    }
    setTimeout(adjustShellOffset, 50);
    setTimeout(adjustShellOffset, 300);
    setTimeout(adjustShellOffset, 1000);

    return shell;
  }

  function loadHtmlMap() {
    return new Promise(function (resolve, reject) {
      kintone.api(
        kintone.api.url('/k/v1/records.json', true),
        'GET',
        {
          app: kintone.app.getId(),
          query: 'limit 100',
          fields: ['guide_slug', 'guide_title', 'guide_body_html'],
        },
        function (resp) {
          var map = {};
          (resp.records || []).forEach(function (r) {
            var slug = (r.guide_slug && r.guide_slug.value) || '';
            map[slug] = {
              title: (r.guide_title && r.guide_title.value) || slug,
              html: (r.guide_body_html && r.guide_body_html.value) || '',
            };
          });
          resolve(map);
        },
        function (err) {
          reject(err);
        }
      );
    });
  }

  kintone.events.on('app.record.index.show', function () {
    if (qs('#jbis-ops-guide-shell')) return;

    loadHtmlMap()
      .then(function (map) {
        htmlMap = map;
        injectShell();
        buildTabs(qs('#jbis-ops-guide-tabs'));
        window.__JBIS_OPS_GUIDE_ACTIVE_SLUG__ = 'hub';
        if (!htmlMap.hub) {
          var first = null;
          for (var i = 0; i < TAB_ORDER.length; i++) {
            if (htmlMap[TAB_ORDER[i]]) {
              first = TAB_ORDER[i];
              break;
            }
          }
          if (first) window.__JBIS_OPS_GUIDE_ACTIVE_SLUG__ = first;
        }
        renderIframe();
        hideRecordList();
        var tb = qs('#jbis-ops-guide-toggle-list');
        if (tb) {
          tb.setAttribute('data-list-hidden', '1');
          tb.textContent = '一覧を表示';
        }
      })
      .catch(function (e) {
        console.error('[ops-guide]', e);
      });
  });
})();
