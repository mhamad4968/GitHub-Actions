(function () {

  'use strict';



  /** 業務改善 ver.02 — ご利用ガイド */

  var BUILD = '2026-06-07-bi-guide-v5g';



  var BI = {

    settingsAppId: 697,

    employeeAppId: 698,

    proposalAppId: 700,

  };



  var FP = {

    date: '提案日',

    title: '提案件名',

    status: 'Status',

    applicant: '申請者',

    mgr: '部長評価者',

    br: '支店長評価者',

    hr: '人事部長評価者',

  };



  var STATUS_LABEL = {

    Draft: '未処理',

    Mgr: '上司承認中',

    Branch: '支店長承認中',

    Hr: '人事研修部長承認中',

    Done: '完了',

    unprocessed: '未処理',

    manager: '上司承認中',

    branch: '支店長承認中',

    hr: '人事研修部長承認中',

    done: '完了',

    '未処理': '未処理',

    '上司承認中': '上司承認中',

    '支店長承認中': '支店長承認中',

    '人事研修部長承認中': '人事研修部長承認中',

    '完了': '完了',

    applicant_fix: '申請者修正待ち',

    '申請者修正待ち': '申請者修正待ち',

  };



  var FONT_KEY = 'bi-proposal-font-size';

  var state = {

    isEvaluator: false,

    showPending: false,

    loginCode: '',

    section: 'apply',

    sub: 'intro',

    myList: [],

    pendingList: [],

    listsLoading: true,

    proposalWfStates: null,

    proposalWfStatesPromise: null,

  };



  function esc(s) {

    return String(s == null ? '' : s)

      .replace(/&/g, '&amp;')

      .replace(/</g, '&lt;')

      .replace(/>/g, '&gt;')

      .replace(/"/g, '&quot;');

  }



  function basePath() {

    var m = location.pathname.match(/^(\/k\/\d+)/);

    return m ? m[1] : '/k/' + kintone.app.getId();

  }



  function proposalEditUrl() {

    if (!BI.proposalAppId) return null;

    return basePath().replace(/\/\d+$/, '/' + BI.proposalAppId) + '/edit';

  }



  function proposalShowUrl(recordId, edit) {

    return '/k/' + BI.proposalAppId + '/show#record=' + recordId + (edit ? '&mode=edit' : '');

  }



  function statusLabel(st) {

    return STATUS_LABEL[st] || st || '—';

  }



  function fontSizePx() {

    return localStorage.getItem(FONT_KEY) === 'large' ? '18px' : '16px';

  }



  function applyFontSize(root) {

    root.style.fontSize = fontSizePx();

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

    return (

      document.querySelector('.contents-bodygaia') ||

      document.querySelector('.contents-gaia') ||

      document.querySelector('#gaia') ||

      document.body

    );

  }



  function measureTopInset(host) {

    if (!host) return 0;

    var rect = host.getBoundingClientRect();

    var inset = 0;

    var selectors = [

      '.gaia-header',

      '.gaia-header-banner-gaia',

      '.gaia-argoui-app-toolbar',

      '.gaia-argoui-app-index-toolbar',

      '.ocean-ui-app-index-head',

    ];

    selectors.forEach(function (sel) {

      var el = document.querySelector(sel);

      if (!el || !el.getBoundingClientRect) return;

      var box = el.getBoundingClientRect();

      if (box.bottom > 0 && box.top < rect.top + 4) {

        inset = Math.max(inset, Math.ceil(box.bottom - rect.top) + 8);

      }

    });

    if (inset <= 0 && rect.top < 96) {

      inset = Math.ceil(96 - rect.top + 8);

    }

    return inset;

  }



  function adjustGuideOffset(host) {

    if (!host) return;

    var inset = measureTopInset(host);

    host.style.marginTop = inset > 0 ? inset + 'px' : '0';

    host.style.position = 'relative';

    host.style.zIndex = '1';

  }



  function scheduleAdjustGuideOffset(host) {

    adjustGuideOffset(host);

    setTimeout(function () { adjustGuideOffset(host); }, 50);

    setTimeout(function () { adjustGuideOffset(host); }, 300);

    setTimeout(function () { adjustGuideOffset(host); }, 1000);

  }



  function fetchSettingsEvaluators(appId) {

    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {

      app: appId,

      query: 'record_kind in ("所属行", "共通設定") limit 500',

      fields: ['record_kind', 'manager_login', 'branch_manager_login', 'hr_director_login'],

    }).then(function (res) {

      var codes = {};

      (res.records || []).forEach(function (r) {

        if (r.record_kind && r.record_kind.value === '共通設定') {

          var hr = r.hr_director_login && r.hr_director_login.value;

          if (hr) codes[hr] = true;

        } else {

          var m = r.manager_login && r.manager_login.value;

          var b = r.branch_manager_login && r.branch_manager_login.value;

          if (m) codes[m] = true;

          if (b) codes[b] = true;

        }

      });

      return codes;

    });

  }



  function fetchMyProposals() {

    if (!BI.proposalAppId) return kintone.Promise.resolve([]);

    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {

      app: BI.proposalAppId,

      query: FP.applicant + ' in (LOGINUSER()) order by ' + FP.date + ' desc limit 100',

      fields: ['$id', FP.date, FP.title, FP.status],

    }).then(function (res) { return res.records || []; });

  }



  function escQ(s) {

    return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  }



  function evaluatorFieldForWfState(stateKey) {

    if (stateKey === 'Mgr' || stateKey === 'manager' || stateKey === '上司承認中') return FP.mgr;

    if (stateKey === 'Branch' || stateKey === 'branch' || stateKey === '支店長承認中') return FP.br;

    if (stateKey === 'Hr' || stateKey === 'hr' || stateKey === '人事研修部長承認中') return FP.hr;

    return null;

  }



  function fetchProposalWfStates() {

    if (state.proposalWfStates) return kintone.Promise.resolve(state.proposalWfStates);

    if (state.proposalWfStatesPromise) return state.proposalWfStatesPromise;

    if (!BI.proposalAppId) return kintone.Promise.resolve([]);

    state.proposalWfStatesPromise = kintone.api(kintone.api.url('/k/v1/app/status.json', true), 'GET', {

      app: BI.proposalAppId,

    }).then(function (res) {

      state.proposalWfStates = Object.keys(res.states || {});

      return state.proposalWfStates;

    }).catch(function (err) {

      console.warn('[bi-guide] WF states fetch failed, using fallback', err);

      state.proposalWfStates = ['Mgr', 'Branch'];

      return state.proposalWfStates;

    });

    return state.proposalWfStatesPromise;

  }



  function buildPendingQueries(wfStateKeys) {

    var queries = [];

    (wfStateKeys || []).forEach(function (key) {

      var field = evaluatorFieldForWfState(key);

      if (!field) return;

      queries.push(FP.status + ' in ("' + escQ(key) + '") and ' + field + ' in (LOGINUSER())');

    });

    return queries;

  }



  function fetchRecordsQuery(query) {

    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {

      app: BI.proposalAppId,

      query: query,

      fields: ['$id', FP.date, FP.title, FP.status],

    }).then(function (res) { return res.records || []; });

  }



  function mergePendingRows(results) {

    var seen = {};

    var merged = [];

    results.forEach(function (rows) {

      rows.forEach(function (r) {

        var id = r.$id && r.$id.value;

        if (!id || seen[id]) return;

        seen[id] = true;

        merged.push(r);

      });

    });

    merged.sort(function (a, b) {

      var da = (a[FP.date] && a[FP.date].value) || '';

      var db = (b[FP.date] && b[FP.date].value) || '';

      return db.localeCompare(da);

    });

    return merged.slice(0, 100);

  }



  function fetchPendingEvaluations() {

    if (!BI.proposalAppId) return kintone.Promise.resolve([]);

    return fetchProposalWfStates().then(function (wfStateKeys) {

      var attempts = buildPendingQueries(wfStateKeys);

      if (!attempts.length) return [];

      return kintone.Promise.all(attempts.map(function (q) {

        return fetchRecordsQuery(q);

      })).then(mergePendingRows);

    });

  }



  function isApplyStatus(st) {
    return st === 'Draft' || st === '未処理' || st === 'unprocessed' ||
      st === 'applicant_fix' || st === '申請者修正待ち';
  }

  function listTableHtml(rows, kind) {

    if (!rows.length) {

      return '<p style="color:#64748b;margin:0">該当する提案はありません。</p>';

    }

    var head =

      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:520px">' +

      '<thead><tr style="background:#f1f5f9;text-align:left">' +

      '<th style="padding:10px 12px">申請日</th>' +

      '<th style="padding:10px 12px">提案名</th>' +

      '<th style="padding:10px 12px">ステータス</th>' +

      '<th style="padding:10px 12px;text-align:right"></th></tr></thead><tbody>';

    var body = rows.map(function (r) {

      var id = r.$id.value;

      var dt = (r[FP.date] && r[FP.date].value) || '—';

      var title = (r[FP.title] && r[FP.title].value) || '—';

      var stVal = r[FP.status] && r[FP.status].value;
      var st = statusLabel(stVal);
      var useEdit = kind === 'eval' || (kind === 'view' && isApplyStatus(stVal));
      var btn = kind === 'eval'
        ? '<a href="' + esc(proposalShowUrl(id, true)) + '" style="display:inline-block;padding:8px 14px;background:#78350f;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;white-space:nowrap">評価する</a>'
        : '<a href="' + esc(proposalShowUrl(id, useEdit)) + '" style="display:inline-block;padding:8px 14px;background:#1d4ed8;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;white-space:nowrap">提案書を見る</a>';

      return '<tr style="border-bottom:1px solid #e2e8f0">' +

        '<td style="padding:10px 12px;white-space:nowrap">' + esc(dt) + '</td>' +

        '<td style="padding:10px 12px">' + esc(title) + '</td>' +

        '<td style="padding:10px 12px">' + esc(st) + '</td>' +

        '<td style="padding:10px 12px;text-align:right">' + btn + '</td></tr>';

    }).join('');

    return head + body + '</tbody></table></div>';

  }



  function listsSectionHtml() {

    if (state.listsLoading) {

      return '<p style="color:#64748b;margin:0">一覧を読み込み中…</p>';

    }

    var html =

      '<div style="margin-bottom:28px">' +

      '<h3 style="margin:0 0 12px;color:#1e3a8a;font-size:1.15em">申請した一覧</h3>' +

      listTableHtml(state.myList, 'view') + '</div>';

    if (state.showPending) {

      html +=

        '<div style="margin-bottom:28px">' +

        '<h3 style="margin:0 0 12px;color:#78350f;font-size:1.15em">未評価一覧' +
        (state.pendingList.length ? '（' + state.pendingList.length + '件）' : '') + '</h3>' +

        listTableHtml(state.pendingList, 'eval') + '</div>';

    }

    return html;

  }



  function navItems() {

    var items = [

      { id: 'apply', label: '申請編', subs: [{ id: 'intro', label: 'はじめに' }] },

    ];

    if (state.isEvaluator) {

      items.push({ id: 'eval', label: '評価編', subs: [{ id: 'intro', label: 'はじめに' }] });

    }

    items.push({ id: 'other', label: 'その他', subs: [{ id: 'faq', label: 'よくある質問（準備中）' }] });

    return items;

  }



  function applyDoneBannerHtml() {

    try {

      if (!sessionStorage.getItem('bi-apply-done')) return '';

      sessionStorage.removeItem('bi-apply-done');

      return (

        '<div style="background:#dcfce7;border:2px solid #86efac;border-radius:12px;padding:14px 18px;margin-bottom:16px">' +

        '<strong style="color:#166534">申請が完了しました。</strong><br>' +

        '<span style="font-size:0.95em;color:#15803d">下の「申請した一覧」から提出内容を確認できます。</span></div>'

      );

    } catch (e) {

      return '';

    }

  }



  function sectionHtml() {

    if (state.section === 'apply' && state.sub === 'intro') {

      return (

        '<h2 style="margin:0 0 12px;font-size:1.25em">申請編 — はじめに</h2>' +

        '<p>業務改善提案・アイデア提案は、各組織の<strong>共有ID</strong>でログインして申請します。</p>' +

        '<p style="color:#666">操作手順の詳細・スクリーンショットは <strong>6/9〜</strong> 順次追加します（Q-GUIDE-07）。</p>'

      );

    }

    if (state.section === 'eval') {

      return (

        '<h2 style="margin:0 0 12px;font-size:1.25em">評価編 — はじめに</h2>' +

        '<p>評価・承認は<strong>個人アカウント</strong>のまま行います（共有IDのまま評価しない）。</p>' +

        '<p style="color:#666">「未評価一覧」の <strong>評価する</strong> から評価画面を開けます。</p>'

      );

    }

    return (

      '<h2 style="margin:0 0 12px;font-size:1.25em">よくある質問</h2>' +

      '<p>FAQ 本文は <strong>6/9〜</strong> 執筆予定です（Q-GUIDE-06 / Q-GUIDE-08）。</p>'

    );

  }



  function render(root) {

    applyFontSize(root);

    var nav = navItems();

    var navHtml = nav

      .map(function (item) {

        var active = state.section === item.id;

        var subs = item.subs

          .map(function (s) {

            var on = active && state.sub === s.id;

            return (

              '<button type="button" data-bi-sub="' +

              esc(item.id + ':' + s.id) +

              '" style="margin:4px 8px 4px 0;padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:' +

              (on ? '#2563eb' : '#fff') +

              ';color:' +

              (on ? '#fff' : '#111') +

              ';cursor:pointer;font-size:1em">' +

              esc(s.label) +

              '</button>'

            );

          })

          .join('');

        return (

          '<div style="margin-bottom:8px"><strong style="margin-right:8px">' +

          esc(item.label) +

          '</strong>' +

          subs +

          '</div>'

        );

      })

      .join('');



    var applyHref = proposalEditUrl() || '#';

    root.innerHTML =

      '<div id="bi-guide-root" style="font-family:\'Segoe UI\',Meiryo,sans-serif;line-height:1.6;padding:16px 20px 40px;max-width:960px;margin:0 auto">' +

      '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px">' +

      '<h1 style="margin:0;font-size:1.5em">【業務改善提案システム】ご利用ガイド</h1>' +

      '<div><span style="margin-right:8px">文字サイズ：</span>' +

      '<button type="button" data-bi-font="standard" style="padding:6px 12px;margin-right:4px;border-radius:6px;border:1px solid #ccc;cursor:pointer">標準</button>' +

      '<button type="button" data-bi-font="large" style="padding:6px 12px;border-radius:6px;border:1px solid #ccc;cursor:pointer">大</button></div></div>' +

      '<nav style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-bottom:16px">' +

      navHtml +

      '</nav>' +

      applyDoneBannerHtml() +

      '<div style="background:#fff7ed;border:2px solid #fdba74;border-radius:12px;padding:14px 18px;margin-bottom:16px">' +

      '<strong>⚠ 提案申請は各組織の共有IDでログインしてください。</strong><br>' +

      '<span style="font-size:0.95em">評価・承認は個人アカウントのまま行います。</span></div>' +

      '<div style="margin-bottom:20px">' +

      '<a href="' + esc(applyHref) + '" id="bi-btn-apply" style="display:inline-block;padding:14px 28px;margin:8px 12px 8px 0;background:#1d4ed8;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:1.05em">提案を出す</a>' +

      '</div>' +

      '<div id="bi-guide-body" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:20px;min-height:120px">' +

      sectionHtml() +

      '</div>' +

      '<div id="bi-guide-lists" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px">' +

      listsSectionHtml() +

      '</div>' +

      '<p style="margin-top:24px;color:#94a3b8;font-size:0.85em">BUILD ' + esc(BUILD) + '</p></div>';



    root.querySelectorAll('[data-bi-font]').forEach(function (btn) {

      btn.addEventListener('click', function () {

        localStorage.setItem(FONT_KEY, btn.getAttribute('data-bi-font'));

        render(root);

      });

    });

    root.querySelectorAll('[data-bi-sub]').forEach(function (btn) {

      btn.addEventListener('click', function () {

        var p = btn.getAttribute('data-bi-sub').split(':');

        state.section = p[0];

        state.sub = p[1];

        render(root);

      });

    });



    var applyEl = root.querySelector('#bi-btn-apply');

    if (applyEl && !BI.proposalAppId) {

      applyEl.addEventListener('click', function (ev) {

        ev.preventDefault();

        alert('提案申請アプリは Phase 4 で作成予定です。');

      });

    }

    adjustGuideOffset(root);

  }



  function loadLists(host) {

    state.listsLoading = true;

    render(host);

    return fetchMyProposals()

      .then(function (rows) {

        state.myList = rows;

      })

      .catch(function (err) {

        console.error('[bi-guide] my list fetch failed', err);

        state.myList = [];

      })

      .then(function () {

        return fetchPendingEvaluations()

          .then(function (rows) {

            state.pendingList = rows;

          })

          .catch(function (err) {

            console.error('[bi-guide] pending list fetch failed', err);

            state.pendingList = [];

          });

      })

      .then(function () {

        state.showPending = state.isEvaluator || state.pendingList.length > 0;

        state.listsLoading = false;

        render(host);

      });

  }



  function mount() {

    hideKintoneChrome();

    var host = document.getElementById('bi-guide-host');

    if (!host) {

      host = document.createElement('div');

      host.id = 'bi-guide-host';

      var mountHost = findMountHost();

      mountHost.insertBefore(host, mountHost.firstChild);

    }

    scheduleAdjustGuideOffset(host);

    state.loginCode = (kintone.getLoginUser() && kintone.getLoginUser().code) || '';

    fetchSettingsEvaluators(BI.settingsAppId)

      .then(function (codes) {

        state.isEvaluator = !!(state.loginCode && codes[state.loginCode]);

        return loadLists(host);

      })

      .catch(function (err) {

        console.error('[bi-guide]', err);

        state.isEvaluator = false;

        return loadLists(host);

      });

  }



  kintone.events.on(['app.record.index.show', 'mobile.app.record.index.show'], function (event) {

    mount();

    return event;

  });

})();


