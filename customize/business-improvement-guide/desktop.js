(function () {

  'use strict';



  /** 業務改善 ver.02 — ご利用ガイド */

  var BUILD = '2026-06-07-bi-guide-v13b-eval-banner-only';



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

  /** Q60 章別背景 — はじめに(薄黄) / 申請編 / 評価編 / その他 */
  var GUIDE_THEMES = {
    intro: {
      grad: 'linear-gradient(180deg,#fffef5 0%,#fef9e7 45%,#fef3c7 100%)',
      cardBg: 'rgba(255,255,255,0.92)',
      cardBorder: '#fde68a',
      navBg: 'rgba(255,255,255,0.78)',
      navBorder: '#fcd34d',
      tableHead: '#fef9c3',
      heading: '#92400e',
      subActiveBg: '#ca8a04',
      subIdleBg: 'rgba(255,255,255,0.88)',
    },
    apply: {
      grad: 'linear-gradient(180deg,#f5f9ff 0%,#e8f2fb 100%)',
      cardBg: 'rgba(255,255,255,0.92)',
      cardBorder: '#bfdbfe',
      navBg: 'rgba(255,255,255,0.78)',
      navBorder: '#bfdbfe',
      tableHead: '#e0effe',
      heading: '#1e3a8a',
      subActiveBg: '#2563eb',
      subIdleBg: 'rgba(255,255,255,0.85)',
    },
    eval: {
      grad: 'linear-gradient(180deg,#faf7f3 0%,#f0ebe4 100%)',
      cardBg: 'rgba(255,255,255,0.92)',
      cardBorder: '#e7d5c4',
      navBg: 'rgba(255,255,255,0.78)',
      navBorder: '#e7d5c4',
      tableHead: '#f0ebe4',
      heading: '#78350f',
      subActiveBg: '#92400e',
      subIdleBg: 'rgba(255,255,255,0.85)',
    },
    other: {
      grad: 'linear-gradient(180deg,#f4faf6 0%,#e6f2ea 100%)',
      cardBg: 'rgba(255,255,255,0.92)',
      cardBorder: '#c6e6d0',
      navBg: 'rgba(255,255,255,0.78)',
      navBorder: '#b8dcc4',
      tableHead: '#e6f2ea',
      heading: '#166534',
      subActiveBg: '#15803d',
      subIdleBg: 'rgba(255,255,255,0.85)',
    },
  };

  function guideTheme() {
    return GUIDE_THEMES[state.section] || GUIDE_THEMES.intro;
  }

  function applyGuidePageTheme(host) {
    var t = guideTheme();
    host.style.boxSizing = 'border-box';
    host.style.width = '100%';
    host.style.minHeight = '100vh';
    host.style.background = t.grad;
    host.style.padding = '0 0 48px';
    host.style.transition = 'background 0.35s ease';
  }

  function injectGuideThemeStyles() {
    if (document.getElementById('bi-guide-theme-style')) return;
    var style = document.createElement('style');
    style.id = 'bi-guide-theme-style';
    style.textContent =
      '.contents-gaia,.contents-bodygaia{background:transparent!important}' +
      '#gaia .layout-gaia{background:transparent!important}' +
      '#bi-guide-root .bi-nav-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}' +
      '#bi-guide-root .bi-nav-wrap{position:relative}' +
      '#bi-guide-root .bi-nav-top{padding:10px 18px;border-radius:8px;border:1px solid transparent;cursor:pointer;font-size:1.05em;font-weight:700;background:transparent;white-space:nowrap;font-family:inherit;line-height:1.4}' +
      '#bi-guide-root .bi-nav-drop{position:absolute;top:calc(100% + 6px);left:0;min-width:240px;padding:6px;border-radius:10px;box-shadow:0 8px 24px rgba(15,23,42,.14);z-index:100;flex-direction:column;gap:2px}' +
      '#bi-guide-root .bi-nav-sub{text-align:left;padding:10px 14px;border-radius:6px;border:none;cursor:pointer;font-size:1em;width:100%;font-family:inherit;line-height:1.4}' +
      '#bi-guide-root .bi-nav-sub:hover{filter:brightness(0.97)}';
    document.head.appendChild(style);
  }

  var state = {

    isEvaluator: false,

    showPending: false,

    loginCode: '',

    section: 'intro',

    sub: 'system',

    openNav: null,

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

    var thBg = guideTheme().tableHead;

    var head =

      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:520px">' +

      '<thead><tr style="background:' + thBg + ';text-align:left">' +

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

      guideH3('申請した一覧', guideTheme().heading, '📝', '#dbeafe') +

      listTableHtml(state.myList, 'view') + '</div>';

    if (state.showPending) {

      html +=

        '<div style="margin-bottom:28px">' +

        guideH3(
          '未評価一覧' + (state.pendingList.length ? '（' + state.pendingList.length + '件）' : ''),
          '#78350f',
          '⏳',
          '#f5ebe0'
        ) +

        listTableHtml(state.pendingList, 'eval') + '</div>';

    }

    return html;

  }



  function navItems() {

    var items = [

      {
        id: 'intro',
        label: 'はじめに',
        subs: [
          { id: 'system', label: 'システムの説明' },
          { id: 'login', label: 'ログインについて' },
          { id: 'flow', label: '申請〜完了の流れ' },
          { id: 'lists', label: '一覧の見方' },
        ],
      },

      {
        id: 'apply',
        label: '申請編',
        subs: [
          { id: 'fields', label: '入力項目' },
          { id: 'attach', label: '添付ファイル' },
          { id: 'submit', label: '申請ボタンの注意' },
        ],
      },

    ];

    if (state.isEvaluator) {

      items.push({
        id: 'eval',
        label: '評価編',
        subs: [
          { id: 'fields', label: '評価の入力項目' },
          { id: 'flow', label: 'メールと評価の流れ' },
        ],
      });

    }

    items.push({ id: 'other', label: 'その他', subs: [{ id: 'empty', label: '（準備中）' }] });

    return items;

  }



  function buildNavHtml(nav) {

    return (

      '<div class="bi-nav-bar">' +

      nav

        .map(function (item) {

          var itemTheme = GUIDE_THEMES[item.id] || GUIDE_THEMES.other;

          var isActive = state.section === item.id;

          var isOpen = state.openNav === item.id;

          var topBg = isOpen

            ? itemTheme.subIdleBg

            : isActive

              ? 'rgba(255,255,255,0.55)'

              : 'transparent';

          var topBorder = isActive || isOpen ? itemTheme.navBorder : 'transparent';

          var subs = item.subs

            .map(function (s) {

              var on = isActive && state.sub === s.id;

              return (

                '<button type="button" class="bi-nav-sub" data-bi-sub="' +

                esc(item.id + ':' + s.id) +

                '" style="background:' +

                (on ? itemTheme.subActiveBg : 'transparent') +

                ';color:' +

                (on ? '#fff' : '#1e293b') +

                '">' +

                esc(s.label) +

                '</button>'

              );

            })

            .join('');

          return (

            '<div class="bi-nav-wrap" data-bi-nav-wrap="' +

            esc(item.id) +

            '">' +

            '<button type="button" class="bi-nav-top" data-bi-nav-toggle="' +

            esc(item.id) +

            '" style="color:' +

            itemTheme.heading +

            ';border-color:' +

            topBorder +

            ';background:' +

            topBg +

            '">' +

            esc(item.label) +

            ' <span aria-hidden="true" style="font-size:0.72em;opacity:0.75;margin-left:2px">' +

            (isOpen ? '▲' : '▼') +

            '</span></button>' +

            '<div class="bi-nav-drop" style="display:' +

            (isOpen ? 'flex' : 'none') +

            ';background:' +

            itemTheme.cardBg +

            ';border:1px solid ' +

            itemTheme.navBorder +

            '">' +

            subs +

            '</div></div>'

          );

        })

        .join('') +

      '</div>'

    );

  }



  function loginStatusBannerHtml() {
    var box =
      'border-radius:12px;padding:14px 18px;margin-bottom:16px;box-shadow:0 1px 4px rgba(15,23,42,.06)';
    if (state.isEvaluator) {
      var body = '提案を出すから提案出来ます。';
      if (state.pendingList.length > 0) {
        body += ' また未評価一覧に未評価の案件がある場合は評価がそのままできます。';
      }
      return (
        '<div style="background:#faf7f3;border:2px solid #e7d5c4;' +
        box +
        '">' +
        '<strong style="color:#78350f">評価者用のアカウントでログインしています。</strong><br>' +
        '<span style="font-size:0.95em;color:#44403c">' +
        body +
        '</span></div>'
      );
    }
    return (
      '<div style="background:#eff6ff;border:2px solid #bfdbfe;' +
      box +
      '">' +
      '<strong style="color:#1e3a8a">共有アカウントでログインしています。</strong><br>' +
      '<span style="font-size:0.95em;color:#334155">「提案を出す」から提案出来ます。</span></div>'
    );
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



  function guideMark(emoji, bg) {
    return (
      '<span aria-hidden="true" style="display:inline-block;min-width:1.75em;height:1.75em;line-height:1.75em;text-align:center;border-radius:8px;background:' +
      (bg || '#fef3c7') +
      ';margin-right:8px;font-size:1.05em;vertical-align:-0.12em">' +
      emoji +
      '</span>'
    );
  }

  function guideH2(text, color, emoji, markBg) {
    return (
      '<h2 style="margin:0 0 12px;font-size:1.25em;color:' +
      color +
      '">' +
      guideMark(emoji, markBg) +
      text +
      '</h2>'
    );
  }

  function guideH3(text, color, emoji, markBg) {
    return (
      '<h3 style="margin:0 0 12px;font-size:1.15em;color:' +
      color +
      '">' +
      guideMark(emoji, markBg) +
      text +
      '</h3>'
    );
  }

  function guideLabel(title, suffix, emoji, markBg, marginBottom) {
    return (
      '<p style="margin:0 0 ' +
      (marginBottom || '10px') +
      ';line-height:1.6">' +
      guideMark(emoji, markBg) +
      '<strong>' +
      title +
      '</strong>' +
      (suffix
        ? '<span style="font-weight:400;color:#57534e">' + suffix + '</span>'
        : '') +
      '</p>'
    );
  }

  function guideTopic(label, emoji, markBg, bodyHtml) {
    return (
      '<p style="margin:14px 0 0;line-height:1.65">' +
      guideMark(emoji, markBg) +
      '<strong>' +
      label +
      '</strong><br>' +
      bodyHtml +
      '</p>'
    );
  }

  function guideBodyNote() {
    return (
      '<p style="color:#78716c;margin:16px 0 0;font-size:0.92em">' +
      '文字が小さく感じるときは、ページ右上の <strong>「大」</strong> を選んでください。</p>'
    );
  }

  function introSectionHtml() {
    var th = guideTheme().heading;
    var mark = '#fef3c7';
    var markSoft = '#fef9c3';
    var box =
      'background:rgba(255,255,255,0.72);border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:14px 0';
    var note = guideBodyNote();

    if (state.sub === 'system') {
      return (
        guideH2('システムの説明', th, '📘', mark) +
        '<p>業務改善提案システムとは、社員が日々の仕事で見つけたアイデア（業務改善・アイデア提案）を、' +
        '<strong>提出から採用・評価までを、スムーズに行うためのシステム</strong>です。</p>' +
        '<div style="' + box + '">' +
        guideLabel('提案の種類', '', '💡', markSoft, '10px') +
        '<ul style="margin:0;padding-left:1.4em">' +
        '<li><strong>業務改善提案</strong> — 業務の効率化・品質向上など、具体的な改善内容</li>' +
        '<li><strong>アイデア提案</strong> — 新しい発想・工夫など、総合的なアイデア</li>' +
        '</ul></div>' +
        guideTopic(
          '誰が申請できるか',
          '👥',
          mark,
          '個人でも、複数人での<strong>グループ提案</strong>でも申請できます。グループの場合は、代表者が入力します。'
        ) +
        guideTopic(
          '審査・評価について',
          '📊',
          mark,
          '評価は部長 → 支店長（必要な場合）→ 人事研修部長（必要な場合）の順で進みます。' +
            '各組織の審査の進め方（都度・月次まとめ等）は、各組織の運用に従ってください。'
        ) +
        guideTopic(
          '結果の確認',
          '🔍',
          mark,
          '提出した提案の状態や評価結果は、このガイド画面や提案一覧から確認できます。'
        ) +
        note
      );
    }

    if (state.sub === 'login') {
      return (
        guideH2('ログインについて', th, '🔑', mark) +
        '<p>ログイン方法は、申請と評価・承認で異なりますので注意してください。</p>' +
        '<div style="' + box + '">' +
        '<table style="width:100%;border-collapse:collapse;font-size:0.98em">' +
        '<thead><tr style="background:#fef9c3;text-align:left">' +
        '<th style="padding:10px 12px;border-bottom:1px solid #fde68a">操作</th>' +
        '<th style="padding:10px 12px;border-bottom:1px solid #fde68a">ログイン</th></tr></thead>' +
        '<tbody>' +
        '<tr><td style="padding:10px 12px;border-bottom:1px solid #fde68a;vertical-align:top"><strong>提案を申請する</strong></td>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #fde68a">各組織の<strong>共有ID</strong><br>' +
        '<span style="color:#78716c;font-size:0.92em">例：本社（各部署）、支店の共有アカウント</span></td></tr>' +
        '<tr><td style="padding:10px 12px;vertical-align:top"><strong>評価・承認する</strong></td>' +
        '<td style="padding:10px 12px"><strong>個人アカウント</strong>（部長・支店長・人事部長など）</td></tr>' +
        '</tbody></table></div>' +
        guideTopic(
          '評価者の方へ',
          '👤',
          mark,
          '部長・支店長など、評価の担当者も提案を出す場合があります。そのときは<strong>申請するときだけ共有IDに切り替え</strong>、' +
            '評価するときは<strong>個人IDに戻して</strong>操作してください。'
        ) +
        '<p style="color:#78716c;font-size:0.92em;margin-top:14px">' +
        guideMark('💬', markSoft) +
        '共有IDは kintone 画面上部のログイン名で確認できます。不明な場合はシステム推進室までお問い合わせください。</p>' +
        note
      );
    }

    if (state.sub === 'flow') {
      return (
        guideH2('申請〜完了の流れ', th, '🔁', mark) +
        '<p>1件の提案は、おおむね次の順番で処理されます。</p>' +
        '<ol style="margin:12px 0;padding-left:1.5em;line-height:1.8">' +
        '<li><strong>申請</strong> — 共有IDでログインし、提案内容を入力して申請</li>' +
        '<li><strong>上司承認中</strong> — 部長（上司）が評価・承認</li>' +
        '<li><strong>支店長承認中</strong> — 評価結果に応じて、支店長の承認が必要な場合</li>' +
        '<li><strong>人事研修部長承認中</strong> — 本店表彰（A評価）に該当する場合</li>' +
        '<li><strong>完了</strong> — すべての承認が終わると完了</li>' +
        '</ol>' +
        '<div style="' + box + '">' +
        guideLabel('【評価ポイント付与について】', '', '🏅', markSoft, '8px') +
        '<ul style="margin:0;padding-left:1.4em;line-height:1.75">' +
        '<li>ランクAは確定次第、<strong>即日付与</strong>します。</li>' +
        '<li>ランクBとCに関しては<strong>年度末にまとめて付与</strong>します。</li>' +
        '</ul></div>' +
        guideTopic(
          '差戻しがあった場合',
          '↩️',
          mark,
          '評価者から内容の修正を求められたときは、ステータスが<strong>申請者修正待ち</strong>になります。' +
            '申請内容を直して<strong>再申請</strong>すると、再度部長評価から進みます（提案日は初回のままです）。'
        ) +
        guideTopic(
          '通知',
          '✉️',
          mark,
          '申請・承認の各段階で、担当者にメール通知されます。未承認が残る場合、一定期間ごとにリマインドメールも送られます。'
        ) +
        '<p style="color:#78716c;font-size:0.92em;margin-top:14px">' +
        guideMark('📖', markSoft) +
        '詳しい操作手順は <strong>申請編</strong>・<strong>評価編</strong> を参照してください。</p>' +
        note
      );
    }

    if (state.sub === 'lists') {
      return (
        guideH2('一覧の見方', th, '📑', mark) +
        '<p>このガイド画面の下には、ログイン中のアカウントに関係する一覧が表示されます。</p>' +
        '<div style="' + box + '">' +
        guideLabel('申請した一覧', '（全員）', '📝', '#dbeafe', '10px') +
        '<p style="margin:0 0 14px;padding-left:2.5em">共有IDで提出した提案が一覧表示されます。' +
        '各行の <strong>提案書を見る</strong> から内容を確認できます。' +
        '差戻し中の提案はステータスが <strong>申請者修正待ち</strong> と表示されます。</p>' +
        guideLabel('未評価一覧', '（評価者のみ・該当があるとき）', '⏳', '#f5ebe0', '10px') +
        '<p style="margin:0;padding-left:2.5em">評価者がログインした際に、まだ評価が済んでいないものがリストで表示されます。' +
        '評価者は未評価の提案があったら速やかに対応をしてください。' +
        '各行の <strong>評価する</strong> から評価画面が開きます。</p></div>' +
        guideLabel('ステータスの読み方（主なもの）', '', '🏷️', markSoft, '8px') +
        '<ul style="margin:8px 0;padding-left:1.4em;line-height:1.75">' +
        '<li><strong>未処理</strong> — 入力中（まだ申請していない）</li>' +
        '<li><strong>上司承認中</strong> — 部長評価待ち</li>' +
        '<li><strong>支店長承認中</strong> / <strong>人事研修部長承認中</strong> — 上位承認待ち</li>' +
        '<li><strong>申請者修正待ち</strong> — 差戻し。内容を修正して再申請</li>' +
        '<li><strong>完了</strong> — 承認がすべて終了</li>' +
        '</ul>' +
        '<p style="color:#78716c;font-size:0.92em;margin-top:14px">' +
        guideMark('🔄', markSoft) +
        '一覧はガイド画面を開くたびに最新の状態を読み込みます。</p>' +
        note
      );
    }

    return '<p style="color:#666">左のボタンから項目を選んでください。</p>';
  }

  function sectionHtml() {

    var th = guideTheme().heading;

    var draft =
      '<p style="color:#666;margin-top:12px">操作手順・スクリーンショットは順次追加します（申請編：6/8予定、評価編：6/9予定）。</p>';

    if (state.section === 'intro') {
      return introSectionHtml();
    }

    if (state.section === 'apply') {

      if (state.sub === 'fields') {

        return guideH2('申請編 — 入力項目', th, '✏️', '#dbeafe') + '<p>提案申請画面で入力する項目の説明です。</p>' + draft;

      }

      if (state.sub === 'attach') {

        return guideH2('申請編 — 添付ファイル', th, '📎', '#dbeafe') + '<p>資料がある場合は、添付ファイル欄から追加します。</p>' + draft;

      }

      if (state.sub === 'submit') {

        return (
          guideH2('申請編 — 申請ボタンの注意', th, '✅', '#dbeafe') +
          '<p><strong>入力しただけでは申請は完了しません。</strong>内容を確認したうえで、必ず画面の<strong>「申請」</strong>ボタンを押してください。</p>' +
          draft
        );

      }

    }

    if (state.section === 'eval') {

      if (state.sub === 'fields') {

        return guideH2('評価編 — 評価の入力項目', th, '📋', '#f5ebe0') + '<p>評価画面で入力・選択する項目の説明です。</p>' + draft;

      }

      if (state.sub === 'flow') {

        return guideH2('評価編 — メールと評価の流れ', th, '✉️', '#f5ebe0') +
          '<p>申請が提出されると、担当評価者にメール通知されます。評価待ち一覧から案件を開き、承認または差戻しを行います。</p>' + draft;

      }

    }

    if (state.section === 'other') {

      return guideH2('その他', th, '📌', '#dcfce7') +
        '<p>現在、掲載する項目はありません。運用開始後、よくある質問などを順次追加します。</p>';

    }

    return '<p style="color:#666">表示する内容を選択してください。</p>';

  }



  function render(root) {

    applyFontSize(root);

    applyGuidePageTheme(root);

    var t = guideTheme();

    var nav = navItems();

    var navHtml = buildNavHtml(nav);



    var applyHref = proposalEditUrl() || '#';

    var cardStyle =

      'background:' + t.cardBg + ';border:1px solid ' + t.cardBorder +

      ';border-radius:12px;box-shadow:0 2px 12px rgba(15,23,42,.06)';

    root.innerHTML =

      '<div id="bi-guide-root" style="font-family:\'Segoe UI\',Meiryo,sans-serif;line-height:1.6;padding:16px 20px 24px;max-width:960px;margin:0 auto;color:#333">' +

      '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px">' +

      '<h1 style="margin:0;font-size:1.5em;color:#0f172a">【業務改善提案システム】ご利用ガイド</h1>' +

      '<div><span style="margin-right:8px;color:#475569">文字サイズ：</span>' +

      '<button type="button" data-bi-font="standard" style="padding:6px 12px;margin-right:4px;border-radius:6px;border:1px solid #cbd5e1;background:rgba(255,255,255,0.9);cursor:pointer">標準</button>' +

      '<button type="button" data-bi-font="large" style="padding:6px 12px;border-radius:6px;border:1px solid #cbd5e1;background:rgba(255,255,255,0.9);cursor:pointer">大</button></div></div>' +

      '<nav style="' + cardStyle + ';padding:12px 16px;margin-bottom:16px;background:' + t.navBg + ';position:relative;overflow:visible;z-index:20">' +

      navHtml +

      '</nav>' +

      applyDoneBannerHtml() +

      loginStatusBannerHtml() +

      '<div style="margin-bottom:20px">' +

      '<a href="' + esc(applyHref) + '" id="bi-btn-apply" style="display:inline-block;padding:14px 28px;margin:8px 12px 8px 0;background:#1d4ed8;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:1.05em;box-shadow:0 2px 8px rgba(29,78,216,.25)">提案を出す</a>' +

      '</div>' +

      '<div id="bi-guide-body" style="' + cardStyle + ';padding:20px 24px;margin-bottom:20px;min-height:120px">' +

      sectionHtml() +

      '</div>' +

      '<div id="bi-guide-lists" style="' + cardStyle + ';padding:20px 24px">' +

      listsSectionHtml() +

      '</div>' +

      '</div>';



    root.querySelectorAll('[data-bi-font]').forEach(function (btn) {

      btn.addEventListener('click', function () {

        localStorage.setItem(FONT_KEY, btn.getAttribute('data-bi-font'));

        render(root);

      });

    });

    root.querySelectorAll('[data-bi-nav-toggle]').forEach(function (btn) {

      btn.addEventListener('click', function (ev) {

        ev.stopPropagation();

        var id = btn.getAttribute('data-bi-nav-toggle');

        state.openNav = state.openNav === id ? null : id;

        render(root);

      });

    });

    root.querySelectorAll('[data-bi-sub]').forEach(function (btn) {

      btn.addEventListener('click', function (ev) {

        ev.stopPropagation();

        var p = btn.getAttribute('data-bi-sub').split(':');

        state.section = p[0];

        state.sub = p[1];

        state.openNav = null;

        render(root);

      });

    });

    if (!root._biNavOutsideBound) {

      root._biNavOutsideBound = true;

      document.addEventListener('click', function (ev) {

        if (!state.openNav) return;

        if (ev.target.closest && ev.target.closest('[data-bi-nav-wrap]')) return;

        state.openNav = null;

        render(root);

      });

    }



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

    injectGuideThemeStyles();

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


