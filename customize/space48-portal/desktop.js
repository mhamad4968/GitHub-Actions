(function () {
  'use strict';

  /**
   * システム推進室ポータル — タブ型リンクハブ
   * npm run deploy:<portalAppId>
   */
  var BUILD = '2026-06-11-space48-portal-v3';

  var TAB_KEY = 'space48-portal-tab';
  var DEFAULT_TAB = 'ops';

  var TAB_LABEL_TO_ID = {
    '業務改善提案': 'bi',
    '台帳': 'ledger',
    '運用': 'ops',
    '情報': 'info',
    'その他': 'other',
    bi: 'bi',
    ledger: 'ledger',
    ops: 'ops',
    info: 'info',
    other: 'other',
  };

  var LINK_TYPE_TO_ID = {
    'アプリ': 'app',
    'スペース': 'space',
    'URL': 'external',
    app: 'app',
    space: 'space',
    external: 'external',
    url: 'external',
  };

  var TABS = [
    { id: 'bi', label: '業務改善提案', accent: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    { id: 'ledger', label: '台帳', accent: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
    { id: 'ops', label: '運用', accent: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
    { id: 'info', label: '情報', accent: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { id: 'other', label: 'その他', accent: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  ];

  var FALLBACK_LINKS = [
    { tab: 'bi', title: '【業務改善提案システム】ご利用ガイド', description: '申請・評価の入口', link_type: 'app', app_id: 699, url: '', sort_no: 10, active: true },
    { tab: 'bi', title: '【業務改善提案システム】提案申請 ver.02', description: '提案の申請・再申請', link_type: 'app', app_id: 700, url: '', sort_no: 20, active: true },
    { tab: 'ledger', title: '社員マスタ', description: 'PC台帳用の社員マスタ', link_type: 'app', app_id: 595, url: '', sort_no: 10, active: true },
    { tab: 'ledger', title: 'PC台帳（新・PC台帳 ver.1）', description: 'PC・端末の台帳', link_type: 'app', app_id: 674, url: '', sort_no: 20, active: true },
    { tab: 'ledger', title: 'Apple ID 及び iCloud メールアドレス一覧', description: 'Apple ID 管理台帳', link_type: 'app', app_id: 694, url: '', sort_no: 30, active: true },
    { tab: 'ledger', title: '共有メールアドレス管理台帳', description: '共有メールの管理', link_type: 'app', app_id: 696, url: '', sort_no: 40, active: true },
    { tab: 'ledger', title: '不適合管理台帳', description: '不適合の記録・印刷', link_type: 'app', app_id: 707, url: '', sort_no: 50, active: true },
    { tab: 'ledger', title: '外部ITサービス導入チェックシート', description: '導入チェック・A4印刷', link_type: 'app', app_id: 709, url: '', sort_no: 60, active: true },
    { tab: 'ledger', title: '新規システム導入ヒアリング記録簿', description: 'ヒアリング記録・印刷', link_type: 'app', app_id: 711, url: '', sort_no: 70, active: true },
    { tab: 'ops', title: 'ユーザサポート件数日次入力', description: '日次の件数入力', link_type: 'app', app_id: 682, url: '', sort_no: 10, active: true },
    { tab: 'ops', title: 'ユーザサポートダッシュボード', description: '月次・グラフ・印刷', link_type: 'app', app_id: 683, url: '', sort_no: 20, active: true },
    { tab: 'info', title: 'Security NEXT ニュース掲示板', description: 'セキュリティニュース', link_type: 'app', app_id: 701, url: '', sort_no: 10, active: true },
    { tab: 'info', title: 'Security NEXT 週次掲示板', description: '週次サマリー', link_type: 'app', app_id: 702, url: '', sort_no: 20, active: true },
    { tab: 'info', title: '最新ICT情報掲示板', description: 'ICT トレンド収集', link_type: 'app', app_id: 686, url: '', sort_no: 30, active: true },
    { tab: 'other', title: 'システム管理スペース', description: 'PC台帳・マスタ等', link_type: 'space', app_id: '', url: 'https://jbis-kintone.cybozu.com/k/#/space/21', sort_no: 10, active: true },
  ];

  var ui = { root: null, links: null, activeTab: DEFAULT_TAB };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function tabMeta(id) {
    for (var i = 0; i < TABS.length; i++) {
      if (TABS[i].id === id) return TABS[i];
    }
    return TABS[0];
  }

  function hideKintoneChrome() {
    var list = document.querySelector('.recordlist-gaia') || document.querySelector('[class*="recordlist"]');
    if (list) list.style.display = 'none';
    var hdr = document.querySelector('.recordlist-header-gaia');
    if (hdr) hdr.style.display = 'none';
    var pager = document.querySelector('.gaia-argoui-app-index-pager');
    if (pager) pager.style.display = 'none';
    var contents = document.querySelector('.contents-gaia');
    if (contents) {
      contents.style.maxWidth = '100%';
      contents.style.overflow = 'visible';
    }
  }

  function findMountHost() {
    return document.querySelector('.contents-bodygaia') ||
      document.querySelector('.contents-gaia') ||
      document.querySelector('#gaia') ||
      document.body;
  }

  function measureTopInset(host) {
    if (!host) return 0;
    var rect = host.getBoundingClientRect();
    var inset = 0;
    ['.gaia-header', '.gaia-argoui-app-toolbar', '.gaia-argoui-app-index-toolbar', '.ocean-ui-app-index-head'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el || !el.getBoundingClientRect) return;
      var box = el.getBoundingClientRect();
      if (box.bottom > 0 && box.top < rect.top + 4) inset = Math.max(inset, Math.ceil(box.bottom - rect.top) + 8);
    });
    if (inset <= 0 && rect.top < 96) inset = Math.ceil(96 - rect.top + 8);
    return inset;
  }

  function adjustOffset(host) {
    if (!host) return;
    var inset = measureTopInset(host);
    host.style.marginTop = inset > 0 ? inset + 'px' : '0';
    host.style.position = 'relative';
    host.style.zIndex = '1';
  }

  function scheduleAdjustOffset(host) {
    adjustOffset(host);
    setTimeout(function () { adjustOffset(host); }, 50);
    setTimeout(function () { adjustOffset(host); }, 300);
    setTimeout(function () { adjustOffset(host); }, 1000);
  }

  function isActiveCheckbox(val) {
    if (!val || !val.length) return false;
    return val.indexOf('有効') >= 0;
  }

  function parseRow(row) {
    var v = row.value || {};
    var rawTab = (v.portal_tab && v.portal_tab.value) || (v.tab && v.tab.value) || '';
    var rawType = (v.link_type && v.link_type.value) || 'app';
    return {
      tab: TAB_LABEL_TO_ID[rawTab] || rawTab,
      title: (v.title && v.title.value) || '',
      description: (v.description && v.description.value) || '',
      link_type: LINK_TYPE_TO_ID[rawType] || rawType || 'app',
      app_id: v.app_id && v.app_id.value != null ? v.app_id.value : '',
      url: (v.link_url && v.link_url.value) || (v.url && v.url.value) || '',
      sort_no: v.sort_no && v.sort_no.value != null ? Number(v.sort_no.value) : 0,
      active: isActiveCheckbox(v.active && v.active.value),
    };
  }

  function normalizeLinks(rows) {
    return (rows || [])
      .map(parseRow)
      .filter(function (r) { return r.active && r.title && r.tab; })
      .sort(function (a, b) {
        if (a.tab !== b.tab) return a.tab < b.tab ? -1 : 1;
        return (a.sort_no || 0) - (b.sort_no || 0);
      });
  }

  function hrefFor(link) {
    if (link.link_type === 'app' && link.app_id) return '/k/' + String(link.app_id) + '/';
    if (link.link_type === 'space' || link.link_type === 'external' || link.link_type === 'url') {
      if (link.url) return link.url;
    }
    if (link.url) return link.url;
    return '#';
  }

  function loadLinksFromApi() {
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: kintone.app.getId(),
      query: 'record_kind in ("共通設定") limit 1',
      fields: ['portal_links'],
    }).then(function (res) {
      var rec = res.records && res.records[0];
      if (!rec || !rec.portal_links || !rec.portal_links.value || !rec.portal_links.value.length) {
        return FALLBACK_LINKS.slice();
      }
      return normalizeLinks(rec.portal_links.value);
    }).catch(function () {
      return FALLBACK_LINKS.slice();
    });
  }

  function readStoredTab() {
    try {
      var t = sessionStorage.getItem(TAB_KEY);
      if (t && tabMeta(t)) return t;
    } catch (e) { /* noop */ }
    return DEFAULT_TAB;
  }

  function storeTab(id) {
    try { sessionStorage.setItem(TAB_KEY, id); } catch (e) { /* noop */ }
  }

  function cardsHtml(tabId, links) {
    var meta = tabMeta(tabId);
    var items = links.filter(function (l) { return l.tab === tabId; });
    if (!items.length) {
      return '<p style="margin:0;color:#64748b">このタブにリンクがありません。設定レコードのサブテーブルを確認してください。</p>';
    }
    var large = tabId === 'bi';
    return '<div style="display:grid;grid-template-columns:' +
      (large ? 'repeat(auto-fit,minmax(280px,1fr))' : 'repeat(auto-fit,minmax(240px,1fr))') +
      ';gap:14px">' +
      items.map(function (link) {
        var href = hrefFor(link);
        var pad = large ? '20px' : '16px';
        return '<div style="background:#fff;border:1px solid ' + meta.border + ';border-radius:12px;padding:' + pad + ';box-shadow:0 1px 3px rgba(15,23,42,0.06)">' +
          '<div style="font-size:' + (large ? '1.05em' : '1em') + ';font-weight:700;color:#0f172a;line-height:1.35">' + esc(link.title) + '</div>' +
          (link.description ? '<div style="margin-top:8px;color:#64748b;font-size:0.9em;line-height:1.45">' + esc(link.description) + '</div>' : '') +
          '<div style="margin-top:14px">' +
          '<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 18px;background:' + meta.accent + ';color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:0.95em">開く</a>' +
          '</div></div>';
      }).join('') +
      '</div>';
  }

  function render() {
    if (!ui.root) return;
    var tabId = ui.activeTab;
    var meta = tabMeta(tabId);
    var tabsHtml = TABS.map(function (t) {
      var on = t.id === tabId;
      return '<button type="button" data-s48-tab="' + esc(t.id) + '" style="margin:0 6px 8px 0;padding:10px 16px;border-radius:999px;border:1px solid ' +
        (on ? t.accent : '#cbd5e1') + ';background:' + (on ? t.accent : '#fff') + ';color:' + (on ? '#fff' : '#334155') +
        ';font-weight:' + (on ? '700' : '500') + ';cursor:pointer;font-size:0.95em">' + esc(t.label) + '</button>';
    }).join('');

    ui.root.innerHTML =
      '<div style="max-width:1100px;margin:0 auto;padding:16px 20px 32px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a">' +
      '<header style="margin-bottom:18px;padding:18px 20px;border-radius:14px;background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 55%,#0ea5e9 100%);color:#fff">' +
      '<h1 style="margin:0;font-size:1.35em;font-weight:700">システム推進室ポータル</h1>' +
      '<p style="margin:8px 0 0;font-size:0.92em;opacity:0.92">各業務アプリへの入口です。リンクの追加は設定レコードの「ポータルリンク」から行えます。</p>' +
      '</header>' +
      '<nav style="margin-bottom:16px" aria-label="ポータルタブ">' + tabsHtml + '</nav>' +
      '<section style="padding:18px;border-radius:12px;background:' + meta.bg + ';border:1px solid ' + meta.border + '">' +
      cardsHtml(tabId, ui.links || FALLBACK_LINKS) +
      '</section>' +
      '<p style="margin:16px 0 0;color:#94a3b8;font-size:0.78em">BUILD ' + esc(BUILD) + '</p>' +
      '</div>';

    ui.root.querySelectorAll('[data-s48-tab]').forEach(function (btn) {
      btn.onclick = function () {
        ui.activeTab = btn.getAttribute('data-s48-tab');
        storeTab(ui.activeTab);
        render();
      };
    });
  }

  function mount() {
    hideKintoneChrome();
    var host = document.getElementById('s48-portal-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 's48-portal-host';
      var mountHost = findMountHost();
      mountHost.insertBefore(host, mountHost.firstChild);
    }
    ui.root = host;
    scheduleAdjustOffset(host);
    ui.activeTab = readStoredTab();
    return loadLinksFromApi().then(function (links) {
      ui.links = links;
      render();
    });
  }

  kintone.events.on(['app.record.index.show', 'mobile.app.record.index.show'], function (event) {
    mount();
    return event;
  });
})();
