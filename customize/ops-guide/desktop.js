/**
 * 運用ガイドアプリ — 一覧画面の先頭に HTML ガイドを表示
 * 本文はレコード guide_body_html（sync スクリプトが docs/ops-guide から投入）
 */
(function () {
  'use strict';

  var TAB_ORDER = ['hub', 'pc', 'personal', 'shared', 'employee'];
  var TAB_LABELS = {
    hub: 'トップ',
    pc: 'PC台帳',
    personal: '個人アカウント',
    shared: '共有',
    employee: '社員マスタ',
  };

  var htmlMap = null;
  var lastBlobUrl = null;

  window.__JBIS_OPS_GUIDE_NAV__ = function (slug) {
    window.__JBIS_OPS_GUIDE_ACTIVE_SLUG__ = slug || 'hub';
    renderIframe();
  };

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

  function revokeBlob() {
    if (lastBlobUrl) {
      try {
        URL.revokeObjectURL(lastBlobUrl);
      } catch (_e) {
        /* noop */
      }
      lastBlobUrl = null;
    }
  }

  function renderIframe() {
    var iframe = qs('#jbis-ops-guide-iframe');
    if (!iframe || !htmlMap) return;
    var slug = window.__JBIS_OPS_GUIDE_ACTIVE_SLUG__ || 'hub';
    var entry = htmlMap[slug];
    if (!entry || !entry.html) {
      iframe.removeAttribute('src');
      iframe.srcdoc = '<body style="font-family:sans-serif;padding:24px">このガイドの HTML がまだ同期されていません。管理者に npm run ops-guide:publish の実行を依頼してください。</body>';
      return;
    }
    revokeBlob();
    var blob = new Blob([entry.html], { type: 'text/html;charset=utf-8' });
    lastBlobUrl = URL.createObjectURL(blob);
    iframe.removeAttribute('srcdoc');
    iframe.src = lastBlobUrl;
    iframe.setAttribute('title', entry.title || '運用ガイド');

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

  function injectShell() {
    if (qs('#jbis-ops-guide-shell')) return qs('#jbis-ops-guide-shell');

    var shell = document.createElement('div');
    shell.id = 'jbis-ops-guide-shell';
    shell.style.cssText =
      'margin:0 0 16px 0;border-radius:12px;overflow:hidden;' +
      'box-shadow:0 4px 20px rgba(0,0,0,.1);background:#fff;';

    var hint = document.createElement('div');
    hint.style.cssText =
      'padding:6px 12px;font-size:11px;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;';
    hint.textContent =
      '※ 画面の内容は Kintone レコードと同期されています。ガイド本文の更新は運用側の自動デプロイ（ops-guide:publish）で反映されます。';
    shell.appendChild(hint);

    var bar = document.createElement('div');
    bar.id = 'jbis-ops-guide-tabs';
    bar.style.cssText =
      'display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;background:#1e3a5f;align-items:center;';
    shell.appendChild(bar);

    var iframeWrap = document.createElement('div');
    iframeWrap.style.cssText = 'position:relative;height:min(78vh,900px);background:#e2e8f0;';
    var iframe = document.createElement('iframe');
    iframe.id = 'jbis-ops-guide-iframe';
    iframe.setAttribute('title', '運用ガイド');
    iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'
    );
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#fff;';
    iframeWrap.appendChild(iframe);
    shell.appendChild(iframeWrap);

    var host = qs('.contents-bodygaia') || qs('.ocean-ui-plugin-kintone-layout') || document.body;
    host.insertBefore(shell, host.firstChild);

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
