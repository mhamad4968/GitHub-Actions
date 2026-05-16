/**
 * 最新ICT情報掲示板（686）— 正本 685 を REST 読取（過去検索・カテゴリ閲覧）
 *
 *   npm run cio:preflight:686 -- --note "…"
 *   npm run deploy:686
 */
(function () {
  'use strict';

  const BUILD = '2026-05-16-686-ict-digest-board-v1';
  const STORE_APP_ID =
    typeof window.ICT_DIGEST_STORE_APP === 'number' ? window.ICT_DIGEST_STORE_APP : 685;

  const FC = {
    title: 'title',
    url: 'url',
    published_at: 'published_at',
    overview: 'overview',
    category: 'category',
  };

  const CATEGORIES = [
    'AI・LLM',
    'インフラ・クラウド',
    '開発トレンド',
    'ITツール・ガジェット',
    'その他',
  ];

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

  function renderCard(rec) {
    var title = (rec[FC.title] && rec[FC.title].value) || '（無題）';
    var pub = (rec[FC.published_at] && rec[FC.published_at].value) || '';
    var cat = recordCategory(rec);
    var overview = (rec[FC.overview] && rec[FC.overview].value) || '';
    var url = recordUrl(rec);
    var ovHtml = overview
      .split('\n')
      .filter(Boolean)
      .map(function (line) {
        return '<div class="ict-ov-line">' + escapeHtml(line) + '</' + 'div>';
      })
      .join('');

    var titleHtml = url
      ? '<a href="' +
        escapeHtml(url) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(title) +
        '</a>'
      : escapeHtml(title);

    return (
      '<article class="ict-card">' +
      '<div class="ict-card-meta"><span class="ict-cat">' +
      escapeHtml(cat) +
      '</span><span class="ict-date">' +
      escapeHtml(pub) +
      '</span></div>' +
      '<h3 class="ict-card-title">' +
      titleHtml +
      '</h3>' +
      '<div class="ict-overview">' +
      ovHtml +
      '</div>' +
      '</article>'
    );
  }

  function injectStyles() {
    if (document.getElementById('ict-digest-board-style')) return;
    var style = document.createElement('style');
    style.id = 'ict-digest-board-style';
    style.textContent =
      '#ict-digest-root{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto 2rem;padding:0 12px}' +
      '#ict-digest-root h2{font-size:1.25rem;margin:1rem 0 .5rem}' +
      '.ict-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}' +
      '.ict-toolbar input,.ict-toolbar select{padding:6px 8px;font-size:14px}' +
      '.ict-hero{background:#f0f7ff;border:1px solid #c5d9f0;border-radius:8px;padding:12px 16px;margin-bottom:16px}' +
      '.ict-card{border:1px solid #ddd;border-radius:8px;padding:12px 16px;margin-bottom:10px;background:#fff}' +
      '.ict-card-meta{font-size:12px;color:#555;margin-bottom:6px}' +
      '.ict-cat{background:#e8eef5;padding:2px 8px;border-radius:4px;margin-right:8px}' +
      '.ict-card-title{font-size:1rem;margin:0 0 8px}' +
      '.ict-card-title a{color:#0366d6;text-decoration:none}' +
      '.ict-overview{font-size:14px;line-height:1.5;color:#333}' +
      '.ict-status{font-size:13px;color:#666;margin:8px 0}' +
      '.ict-pager{margin-top:12px}' +
      '.ict-pager button{margin-right:8px;padding:6px 12px}';
    document.head.appendChild(style);
  }

  function buildUi(container) {
    var today = todayJstYmd();
    var weekAgo = addDaysYmd(today, -7);
    var catOptions = CATEGORIES.map(function (c) {
      return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    }).join('');

    container.innerHTML =
      '<div id="ict-digest-root">' +
      '<p class="ict-status">BUILD ' +
      BUILD +
      ' · 正本アプリ ' +
      STORE_APP_ID +
      '</p>' +
      '<section class="ict-hero"><h2>本日・直近の ICT 情報</h2><div id="ict-hero-list">読込中…</div></section>' +
      '<section><h2>過去の ICT 情報を探す</h2>' +
      '<div class="ict-toolbar">' +
      '<label>カテゴリ <select id="ict-filter-cat"><option value="">すべて</option>' +
      catOptions +
      '</select></label>' +
      '<label>公開日 From <input type="date" id="ict-filter-from" /></label>' +
      '<label>To <input type="date" id="ict-filter-to" /></label>' +
      '<label>キーワード <input type="text" id="ict-filter-kw" placeholder="タイトル・概要" /></label>' +
      '<button type="button" id="ict-btn-search" class="kintoneplugin-button-normal">検索</button>' +
      '</div>' +
      '<div id="ict-list-status" class="ict-status"></div>' +
      '<div id="ict-list"></div>' +
      '<div class="ict-pager"><button type="button" id="ict-btn-prev">前へ</button><button type="button" id="ict-btn-next">次へ</button></div>' +
      '</section></div>';

    container.innerHTML = container.innerHTML.replace(/<\/?motion\.div/gi, function (tag) {
      return tag.replace('motion.', '');
    });

    injectStyles();

    var state = { all: [], page: 0 };

    function applyFilters() {
      var cat = document.getElementById('ict-filter-cat').value;
      var from = document.getElementById('ict-filter-from').value;
      var to = document.getElementById('ict-filter-to').value;
      var kw = document.getElementById('ict-filter-kw').value.trim();
      return state.all.filter(function (rec) {
        if (cat && recordCategory(rec) !== cat) return false;
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
        '該当 ' + filtered.length + ' 件（' + (state.page + 1) + '/' + totalPages + ' ページ）';
      document.getElementById('ict-list').innerHTML = slice.length
        ? slice.map(renderCard).join('')
        : '<p class="ict-status">該当する記事がありません。</p>';
    }

    function renderHero() {
      var todayRecs = state.all.filter(function (r) {
        return r[FC.published_at] && r[FC.published_at].value === today;
      });
      var weekRecs = state.all.filter(function (r) {
        var d = r[FC.published_at] && r[FC.published_at].value;
        return d && d >= weekAgo && d <= today;
      });
      var show = todayRecs.length ? todayRecs : weekRecs.slice(0, 5);
      document.getElementById('ict-hero-list').innerHTML = show.length
        ? show.map(renderCard).join('')
        : '<p class="ict-status">本日・直近7日の記事はまだありません。</p>';
    }

    document.getElementById('ict-btn-search').addEventListener('click', function () {
      state.page = 0;
      renderList();
    });
    document.getElementById('ict-btn-prev').addEventListener('click', function () {
      state.page--;
      renderList();
    });
    document.getElementById('ict-btn-next').addEventListener('click', function () {
      state.page++;
      renderList();
    });

    document.getElementById('ict-list-status').textContent = '正本アプリから読込中…';
    return fetchAllRecords('order by ' + FC.published_at + ' desc').then(function (records) {
      state.all = records;
      renderHero();
      renderList();
    });
  }

  kintone.events.on('app.record.index.show', function (event) {
    var header = kintone.app.getHeaderMenuSpaceElement();
    if (!header) return event;
    var wrap = document.createElement('div');
    wrap.id = 'ict-digest-board-wrap';
    header.appendChild(wrap);
    buildUi(wrap).catch(function (err) {
      wrap.innerHTML =
        '<p style="color:#c00">ICT 情報の取得に失敗しました。正本アプリ ' +
        STORE_APP_ID +
        ' の閲覧権限を確認してください。 ' +
        escapeHtml(err && err.message ? err.message : String(err)) +
        '</p>';
    });
    return event;
  });
})();
