/**
 * 最新ICT情報掲示板（686）— 正本 685 を REST 読取（過去検索・カテゴリ閲覧）
 *
 *   npm run cio:preflight:686 -- --note "…"
 *   npm run deploy:686
 */
(function () {
  'use strict';

  const BUILD = '2026-05-19-686-ict-digest-no-ai-llm';
  const STORE_APP_ID =
    typeof window.ICT_DIGEST_STORE_APP === 'number' ? window.ICT_DIGEST_STORE_APP : 685;

  const FC = {
    title: 'title',
    url: 'url',
    published_at: 'published_at',
    overview: 'overview',
    category: 'category',
  };

  /** field-codes.ts ICT_CATEGORIES と同期（6種・AI・LLM は収集対象外） */
  const CATEGORIES = [
    'インフラ・通信・端末',
    '開発トレンド',
    'Box・SaaS・文書管理',
    'DX人材・IT資格・組織',
    'セキュリティ製品・技術',
    'その他',
  ];

  /** 旧17種 → 新7種（685 既存レコード用・field-codes LEGACY_CATEGORY_TO_NEW と同期） */
  const LEGACY_TO_NEW = {
    'Microsoft・Windows': 'インフラ・通信・端末',
    'PC・端末': 'インフラ・通信・端末',
    'サーバー・インフラ': 'インフラ・通信・端末',
    'ネットワーク・通信': 'インフラ・通信・端末',
    'インフラ・クラウド': 'インフラ・通信・端末',
    'セキュリティ・脆弱性': 'セキュリティ製品・技術',
    'プログラム・開発': '開発トレンド',
    '開発トレンド': '開発トレンド',
    'ITツール・ガジェット': '開発トレンド',
    'SaaS・文書管理': 'Box・SaaS・文書管理',
    '資格・リスキリング': 'DX人材・IT資格・組織',
    'DX人材・組織': 'DX人材・IT資格・組織',
    '情シス・IT部門': 'DX人材・IT資格・組織',
    'AI・LLM': 'その他',
    'ITベンダー・DX': 'その他',
    'IPA・政策調査': 'その他',
    その他: 'その他',
  };

  const CAT_CLASS = {
    'インフラ・通信・端末': 'ict-cat--infra',
    '開発トレンド': 'ict-cat--dev',
    'Box・SaaS・文書管理': 'ict-cat--saas',
    'DX人材・IT資格・組織': 'ict-cat--dxhr',
    'セキュリティ製品・技術': 'ict-cat--sec',
    その他: 'ict-cat--other',
  };

  const PAGE_SIZE = 50;

  function todayJstYmd() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find(function (p) {
      return p.type === 'year';
    }).value;
    const mo = parts.find(function (p) {
      return p.type === 'month';
    }).value;
    const d = parts.find(function (p) {
      return p.type === 'day';
    }).value;
    return y + '-' + mo + '-' + d;
  }

  function addDaysYmd(ymd, delta) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return ymd;
    const utc =
      Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0) + delta * 86400000;
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(utc));
    const y = parts.find(function (p) {
      return p.type === 'year';
    }).value;
    const mo = parts.find(function (p) {
      return p.type === 'month';
    }).value;
    const d = parts.find(function (p) {
      return p.type === 'day';
    }).value;
    return y + '-' + mo + '-' + d;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var MSRC_VULN_PAGE_RE =
    /^https?:\/\/msrc\.microsoft\.com\/update-guide\/vulnerability\/(CVE-\d{4}-\d+)\/?$/i;
  var NON_MS_PRODUCT_RE =
    /postgresql|postgres\b|nginx\b|linux\s+kernel|apache\s+http|openssl\b|mariadb|mysql\b|openssh|docker\b|kubernetes|vmware|fortinet|ivanti|wordpress|tomcat\b|jetty|jenkins|gitlab|jira\b/i;

  function nvdDetailUrl(cveId) {
    return 'https://nvd.nist.gov/vuln/detail/' + String(cveId).toUpperCase();
  }

  function shouldPreferNvdOverMsrc(title, overview) {
    return NON_MS_PRODUCT_RE.test(String(title) + '\n' + String(overview));
  }

  /** MSRC 個別 CVE ページは Microsoft 製品のみ。PostgreSQL / NGINX 等は SPA が 404 */
  function resolveArticleUrl(url, title, overview) {
    var u = String(url || '').trim();
    if (!u) return u;
    var m = MSRC_VULN_PAGE_RE.exec(u);
    if (!m) return u;
    if (shouldPreferNvdOverMsrc(title, overview)) {
      return nvdDetailUrl(m[1]);
    }
    return u;
  }

  function linkResolutionNote(url, title, overview) {
    var raw = String(url || '').trim();
    var resolved = resolveArticleUrl(raw, title, overview);
    if (resolved === raw || !MSRC_VULN_PAGE_RE.test(raw)) return '';
    return 'MSRC 個別ページは当該 CVE が掲載されないため NVD を表示しています';
  }

  function fetchAllRecords(query) {
    const limit = 500;
    var offset = 0;
    var all = [];

    function page() {
      return kintone
        .api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: STORE_APP_ID,
          query: query + ' limit ' + limit + ' offset ' + offset,
          fields: [FC.title, FC.url, FC.published_at, FC.overview, FC.category, '$id'],
        })
        .then(function (resp) {
          all = all.concat(resp.records || []);
          if ((resp.records || []).length >= limit) {
            offset += limit;
            return page();
          }
          return all;
        });
    }
    return page();
  }

  function recordUrl(rec) {
    var v = rec[FC.url];
    return v && v.value ? String(v.value) : '';
  }

  function recordCategory(rec) {
    var v = rec[FC.category];
    return v && v.value ? String(v.value) : '';
  }

  /** 表示・フィルタ用（旧カテゴリは新7種へ読み替え） */
  function displayCategory(rec) {
    var raw = recordCategory(rec);
    if (!raw) return '';
    return LEGACY_TO_NEW[raw] || raw;
  }

  function matchesCategoryFilter(rec, filterCat) {
    if (!filterCat) return true;
    return displayCategory(rec) === filterCat;
  }

  function matchesKeyword(rec, kw) {
    if (!kw) return true;
    var t = (rec[FC.title] && rec[FC.title].value) || '';
    var o = (rec[FC.overview] && rec[FC.overview].value) || '';
    return (t + '\n' + o).toLowerCase().indexOf(kw.toLowerCase()) >= 0;
  }

  function inDateRange(rec, fromYmd, toYmd) {
    var d = rec[FC.published_at] && rec[FC.published_at].value;
    if (!d) return false;
    if (fromYmd && d < fromYmd) return false;
    if (toYmd && d > toYmd) return false;
    return true;
  }

  function catClass(cat) {
    return CAT_CLASS[cat] || 'ict-cat--other';
  }

  function renderCard(rec, opts) {
    opts = opts || {};
    var title = (rec[FC.title] && rec[FC.title].value) || '（無題）';
    var pub = (rec[FC.published_at] && rec[FC.published_at].value) || '';
    var cat = displayCategory(rec);
    var overview = (rec[FC.overview] && rec[FC.overview].value) || '';
    var rawUrl = recordUrl(rec);
    var url = resolveArticleUrl(rawUrl, title, overview);
    var linkNote = linkResolutionNote(rawUrl, title, overview);
    var ovHtml = overview
      .split('\n')
      .filter(Boolean)
      .map(function (line) {
        var cls = /^【/.test(line) ? 'ict-ov-line ict-ov-line--label' : 'ict-ov-line';
        return '<p class="' + cls + '">' + escapeHtml(line) + '</p>';
      })
      .join('');

    var titleHtml = url
      ? '<a class="ict-card-link" href="' +
        escapeHtml(url) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(title) +
        '</a>'
      : escapeHtml(title);

    var heroCls = opts.hero ? ' ict-card--hero' : '';

    return (
      '<article class="ict-card' +
      heroCls +
      '">' +
      '<div class="ict-card-head">' +
      '<span class="ict-cat ' +
      catClass(cat) +
      '">' +
      escapeHtml(cat || '未分類') +
      '</span>' +
      '<time class="ict-date" datetime="' +
      escapeHtml(pub) +
      '">' +
      escapeHtml(pub) +
      '</time>' +
      '</div>' +
      '<h3 class="ict-card-title">' +
      titleHtml +
      '</h3>' +
      (linkNote
        ? '<p class="ict-link-note">' + escapeHtml(linkNote) + '</p>'
        : '') +
      (ovHtml ? '<div class="ict-overview">' + ovHtml + '</div>' : '') +
      '</article>'
    );
  }

  function injectNativeHideStyles() {
    if (document.getElementById('ict-digest-hide-native')) return;
    var style = document.createElement('style');
    style.id = 'ict-digest-hide-native';
    style.textContent = [
      '.gaia-argoui-app-index-recordlist,.gaia-argoui-app-index-norecord,.recordlist-gaia,.recordlist-norecord-gaia,.gaia-argoui-list-norecord,.recordlist-paging-gaia,div[class*="recordlist-norecord"]{display:none !important;}',
      '.gaia-argoui-app-index-paging,.gaia-argoui-app-index-pager,.gaia-argoui-app-index-recordcount,.gaia-argoui-app-recordcount,.gaia-argoui-paging,',
      'div[class*="paging-gaia"],div[class*="recordlist-paging"],div[class*="recordcount-gaia"],',
      '[class*="recordcount-gaia"],[class*="Recordcount-gaia"],[class*="recordlist-paging"]{display:none !important;}',
    ].join('');
    document.head.appendChild(style);
  }

  function injectStyles() {
    if (document.getElementById('ict-digest-board-style')) return;
    var style = document.createElement('style');
    style.id = 'ict-digest-board-style';
    style.textContent = [
      '[data-ict-digest-board]{font-family:"Segoe UI",system-ui,sans-serif;color:#0f172a;max-width:1100px;margin:0 auto;padding:0 16px 32px;box-sizing:border-box}',
      '[data-ict-digest-board] *{box-sizing:border-box}',
      '.ict-top{margin:0 -16px 0;padding:20px 20px 18px;background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 55%,#0ea5e9 100%);color:#f8fafc;border-radius:0 0 12px 12px;box-shadow:0 4px 14px rgba(2,132,199,.25)}',
      '.ict-top h1{margin:0 0 6px;font-size:1.35rem;font-weight:700;letter-spacing:.02em}',
      '.ict-top-lead{margin:0;font-size:.9rem;opacity:.92;line-height:1.45}',
      '.ict-top-note{margin:.35rem 0 0;font-size:.82rem;opacity:.85;font-weight:600}',
      '.ict-search-panel{position:sticky;top:0;z-index:5;margin:16px 0 20px;padding:14px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 2px 12px rgba(15,23,42,.06)}',
      '.ict-search-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}',
      '.ict-search-row--main{margin-bottom:10px}',
      '.ict-field{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.ict-field--grow{flex:1 1 220px}',
      '.ict-field label{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em}',
      '.ict-field input,.ict-field select{width:100%;padding:8px 10px;font-size:14px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc}',
      '.ict-field input:focus,.ict-field select:focus{outline:2px solid #38bdf8;border-color:#0ea5e9;background:#fff}',
      '.ict-btn-search{padding:9px 20px;font-size:14px;font-weight:600;color:#fff;background:linear-gradient(180deg,#0284c7,#0369a1);border:none;border-radius:6px;cursor:pointer;white-space:nowrap}',
      '.ict-btn-search:hover{background:linear-gradient(180deg,#0ea5e9,#0284c7)}',
      '.ict-btn-ghost{padding:8px 14px;font-size:13px;color:#475569;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer}',
      '.ict-section{margin-bottom:24px}',
      '.ict-section-title{margin:0 0 12px;font-size:1.05rem;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px}',
      '.ict-section-title::before{content:"";display:inline-block;width:4px;height:1.1em;background:#0ea5e9;border-radius:2px}',
      '.ict-hero-panel{padding:14px 16px;background:linear-gradient(180deg,#f0f9ff,#e0f2fe);border:1px solid #bae6fd;border-radius:10px}',
      '.ict-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}',
      '.ict-card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;transition:box-shadow .15s,border-color .15s}',
      '.ict-card:hover{border-color:#7dd3fc;box-shadow:0 4px 16px rgba(14,165,233,.12)}',
      '.ict-card--hero{border-color:#7dd3fc;background:#fff}',
      '.ict-card-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px}',
      '.ict-cat{font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;line-height:1.3}',
      '.ict-cat--ms{background:#e0e7ff;color:#3730a3}',
      '.ict-cat--pc{background:#fce7f3;color:#9d174d}',
      '.ict-cat--infra{background:#dbeafe;color:#1d4ed8}',
      '.ict-cat--net{background:#cffafe;color:#0e7490}',
      '.ict-cat--sec{background:#fee2e2;color:#b91c1c}',
      '.ict-cat--dev{background:#d1fae5;color:#047857}',
      '.ict-cat--vendor{background:#fef3c7;color:#b45309}',
      '.ict-cat--saas{background:#e0f2fe;color:#0369a1}',
      '.ict-cat--cert{background:#f3e8ff;color:#7e22ce}',
      '.ict-cat--dxhr{background:#ecfccb;color:#3f6212}',
      '.ict-cat--is{background:#fae8ff;color:#86198f}',
      '.ict-cat--ipa{background:#f5f5f4;color:#44403c}',
      '.ict-cat--ai{background:#ede9fe;color:#5b21b6}',
      '.ict-cat--tool{background:#ffedd5;color:#c2410c}',
      '.ict-cat--other{background:#f1f5f9;color:#475569}',
      '.ict-date{font-size:12px;color:#64748b;margin-left:auto}',
      '.ict-card-title{margin:0 0 8px;font-size:1rem;line-height:1.4;font-weight:600}',
      '.ict-card-link{color:#0369a1;text-decoration:none}',
      '.ict-card-link:hover{text-decoration:underline}',
      '.ict-link-note{margin:4px 0 0;font-size:11px;color:#64748b;line-height:1.35}',
      '.ict-overview{font-size:13px;line-height:1.55;color:#334155}',
      '.ict-ov-line{margin:0 0 4px}',
      '.ict-ov-line--label{font-weight:600;color:#0f172a}',
      '.ict-ov-line:last-child{margin-bottom:0}',
      '.ict-status{font-size:13px;color:#64748b;margin:0 0 10px}',
      '.ict-empty{padding:24px;text-align:center;color:#64748b;background:#f8fafc;border-radius:8px;border:1px dashed #cbd5e1}',
      '.ict-pager{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px}',
      '.ict-pager button{padding:7px 14px;font-size:13px;border:1px solid #cbd5e1;background:#fff;border-radius:6px;cursor:pointer}',
      '.ict-pager button:disabled{opacity:.45;cursor:not-allowed}',
      '.ict-foot{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}',
      '@media(max-width:640px){.ict-search-row--filters .ict-field{flex:1 1 100%}.ict-date{margin-left:0}}',
    ].join('');
    document.head.appendChild(style);
  }

  function buildUi(container) {
    var today = todayJstYmd();
    var weekAgo = addDaysYmd(today, -7);
    var catOptions = CATEGORIES.map(function (c) {
      return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    }).join('');

    container.innerHTML =
      '<div id="ict-digest-root" data-ict-digest-board>' +
      '<header class="ict-top">' +
      '<h1>最新 ICT 情報掲示板</h1>' +
      '<p class="ict-top-lead">20以上の RSS を横断し、Gemini が「今日、インフラ・PC 管理で最重要」のニュースを1日最大5件に要約（【事象】【影響】【推奨】）</p>' +
      '<p class="ict-top-note">本日の新着は最大5件まで（厳選）</p>' +
      '</header>' +
      '<div class="ict-search-panel">' +
      '<div class="ict-search-row ict-search-row--main">' +
      '<div class="ict-field ict-field--grow"><label for="ict-filter-kw">キーワード</label>' +
      '<input type="search" id="ict-filter-kw" placeholder="タイトル・概要で検索…" autocomplete="off" /></div>' +
      '<button type="button" id="ict-btn-search" class="ict-btn-search">検索</button>' +
      '<button type="button" id="ict-btn-reset" class="ict-btn-ghost">条件クリア</button>' +
      '</div>' +
      '<div class="ict-search-row ict-search-row--filters">' +
      '<div class="ict-field"><label for="ict-filter-cat">カテゴリ</label>' +
      '<select id="ict-filter-cat"><option value="">すべて</option>' +
      catOptions +
      '</select></div>' +
      '<div class="ict-field"><label for="ict-filter-from">公開日 From</label>' +
      '<input type="date" id="ict-filter-from" /></div>' +
      '<div class="ict-field"><label for="ict-filter-to">To</label>' +
      '<input type="date" id="ict-filter-to" /></div>' +
      '</div>' +
      '</div>' +
      '<section class="ict-section ict-hero-wrap">' +
      '<h2 class="ict-section-title">今日の厳選（最大5件）</h2>' +
      '<div class="ict-hero-panel"><div id="ict-hero-list" class="ict-grid">読込中…</div></div>' +
      '</section>' +
      '<section class="ict-section">' +
      '<h2 class="ict-section-title">記事一覧</h2>' +
      '<div id="ict-list-status" class="ict-status"></div>' +
      '<div id="ict-list" class="ict-grid"></div>' +
      '<div class="ict-pager">' +
      '<button type="button" id="ict-btn-prev">前へ</button>' +
      '<button type="button" id="ict-btn-next">次へ</button>' +
      '</div>' +
      '</section>' +
      '<footer class="ict-foot">BUILD ' +
      BUILD +
      ' · 正本 ' +
      STORE_APP_ID +
      '</footer>' +
      '</div>';

    injectStyles();

    var state = { all: [], page: 0 };

    function applyFilters() {
      var cat = document.getElementById('ict-filter-cat').value;
      var from = document.getElementById('ict-filter-from').value;
      var to = document.getElementById('ict-filter-to').value;
      var kw = document.getElementById('ict-filter-kw').value.trim();
      return state.all.filter(function (rec) {
        if (!matchesCategoryFilter(rec, cat)) return false;
        if (!inDateRange(rec, from || null, to || null)) return false;
        if (!matchesKeyword(rec, kw)) return false;
        return true;
      });
    }

    function renderList() {
      var filtered = applyFilters();
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (state.page >= totalPages) state.page = totalPages - 1;
      if (state.page < 0) state.page = 0;
      var slice = filtered.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE);
      document.getElementById('ict-list-status').textContent =
        '該当 ' + filtered.length + ' 件（' + (state.page + 1) + ' / ' + totalPages + ' ページ）';
      document.getElementById('ict-list').innerHTML = slice.length
        ? slice
            .map(function (r) {
              return renderCard(r);
            })
            .join('')
        : '<p class="ict-empty">該当する記事がありません。検索条件を変えてください。</p>';
      document.getElementById('ict-btn-prev').disabled = state.page <= 0;
      document.getElementById('ict-btn-next').disabled = state.page >= totalPages - 1;
    }

    function renderHero() {
      var filtered = applyFilters();
      var todayRecs = filtered.filter(function (r) {
        return r[FC.published_at] && r[FC.published_at].value === today;
      });
      var weekRecs = filtered.filter(function (r) {
        var d = r[FC.published_at] && r[FC.published_at].value;
        return d && d >= weekAgo && d <= today;
      });
      var show = todayRecs.length ? todayRecs : weekRecs.slice(0, 6);
      document.getElementById('ict-hero-list').innerHTML = show.length
        ? show
            .map(function (r) {
              return renderCard(r, { hero: true });
            })
            .join('')
        : '<p class="ict-empty">本日・直近 7 日の記事はまだありません。</p>';
    }

    function runSearch() {
      state.page = 0;
      renderHero();
      renderList();
    }

    document.getElementById('ict-btn-search').addEventListener('click', runSearch);
    document.getElementById('ict-btn-reset').addEventListener('click', function () {
      document.getElementById('ict-filter-cat').value = '';
      document.getElementById('ict-filter-from').value = '';
      document.getElementById('ict-filter-to').value = '';
      document.getElementById('ict-filter-kw').value = '';
      runSearch();
    });
    document.getElementById('ict-filter-kw').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') runSearch();
    });
    document.getElementById('ict-filter-cat').addEventListener('change', runSearch);
    document.getElementById('ict-btn-prev').addEventListener('click', function () {
      state.page--;
      renderList();
    });
    document.getElementById('ict-btn-next').addEventListener('click', function () {
      state.page++;
      renderList();
    });

    document.getElementById('ict-list-status').textContent = '記事を読込中…';
    return fetchAllRecords('order by ' + FC.published_at + ' desc').then(function (records) {
      state.all = records;
      renderHero();
      renderList();
    });
  }

  kintone.events.on('app.record.index.show', function (event) {
    injectNativeHideStyles();

    var header = kintone.app.getHeaderSpaceElement && kintone.app.getHeaderSpaceElement();
    if (!header) {
      console.warn(BUILD, 'getHeaderSpaceElement is null');
      return event;
    }

    if (header.querySelector('[data-ict-digest-board]')) return event;

    header.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.id = 'ict-digest-board-wrap';
    header.appendChild(wrap);

    buildUi(wrap).catch(function (err) {
      wrap.innerHTML =
        '<div data-ict-digest-board><p style="color:#b91c1c;padding:16px">ICT 情報の取得に失敗しました。正本アプリ ' +
        STORE_APP_ID +
        ' の閲覧権限を確認してください。<br>' +
        escapeHtml(err && err.message ? err.message : String(err)) +
        '</p></div>';
    });
    return event;
  });
})();
