(function () {
  'use strict';

  /**
   * Security NEXT ニュース掲示板 — 正本 631 を REST 読取（脆弱性/CVE は表示除外）
   * npm run deploy:701
   */
  var BUILD = '2026-06-08-sn-news-board-v4-digest-labels';

  var STORE_APP_ID =
    typeof window.SN_NEWS_STORE_APP === 'number' ? window.SN_NEWS_STORE_APP : 631;

  var FC = {
    title: 'title',
    article_url: 'article_url',
    published_date: 'published_date',
    summary: 'summary',
    digest: 'digest',
    match_keywords_display: 'match_keywords_display',
    internal_source: 'internal_source',
    internal_severity_tier: 'internal_severity_tier',
  };

  var API_FIELDS = [
    '$id',
    FC.title,
    FC.article_url,
    FC.published_date,
    FC.summary,
    FC.digest,
    FC.match_keywords_display,
    FC.internal_source,
    FC.internal_severity_tier,
  ];

  /** collect.ts INCIDENT_KEYWORDS と同期（掲示板表示優先判定） */
  var INCIDENT_KEYWORDS = [
    '漏洩',
    '不正アクセス',
    '流出',
    '被害',
    'ランサム',
    'ウイルス',
    '乗っ取り',
    '紛失',
    '誤送信',
    '誤廃棄',
    'インシデント',
    '緊急',
    '悪用',
    '悪用確認',
    'ゼロデイ',
    '攻撃',
    'ddos',
    '侵害',
    'システム障害',
    '情報流出',
    'フィッシング',
    '所在不明',
    '個人情報',
  ];

  /** collect.ts EXCLUSION_KEYWORDS と同期 */
  var VULN_EXCLUSION_KEYWORDS = ['パッチ', '更新プログラム', '脆弱性対策', 'アドバイザリ'];

  var PAGE_SIZE = 30;

  function todayJstYmd() {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    var y = parts.find(function (p) {
      return p.type === 'year';
    }).value;
    var mo = parts.find(function (p) {
      return p.type === 'month';
    }).value;
    var d = parts.find(function (p) {
      return p.type === 'day';
    }).value;
    return y + '-' + mo + '-' + d;
  }

  function addDaysYmd(ymd, delta) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return ymd;
    var utc =
      Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0) + delta * 86400000;
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(utc));
    return (
      parts.find(function (p) {
        return p.type === 'year';
      }).value +
      '-' +
      parts.find(function (p) {
        return p.type === 'month';
      }).value +
      '-' +
      parts.find(function (p) {
        return p.type === 'day';
      }).value
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function recordBlob(rec) {
    var t = (rec[FC.title] && rec[FC.title].value) || '';
    var s = (rec[FC.summary] && rec[FC.summary].value) || '';
    return (t + '\n' + s).toLowerCase();
  }

  function hasIncidentKeyword(rec) {
    var blob = recordBlob(rec);
    return INCIDENT_KEYWORDS.some(function (kw) {
      return blob.indexOf(kw.toLowerCase()) >= 0;
    });
  }

  /** 掲示板表示可否（docs/plans/2026-06-07-security-next-board-spec.md §2） */
  function isBoardVisible(rec) {
    var src = rec[FC.internal_source] && rec[FC.internal_source].value;
    if (src === 'nvd') return false;

    if (hasIncidentKeyword(rec)) return true;

    var title = (rec[FC.title] && rec[FC.title].value) || '';
    if (/CVE-\d{4}-\d+/i.test(title)) return false;
    if (/セキュリティアップデート/.test(title)) return false;
    if (/脆弱性.*(修正|公開|パッチ|対策|アップデート)/.test(title)) return false;
    if (/(修正|公開|パッチ).*脆弱性/.test(title)) return false;

    var blob = recordBlob(rec);
    if (
      VULN_EXCLUSION_KEYWORDS.some(function (kw) {
        return blob.indexOf(kw.toLowerCase()) >= 0;
      })
    ) {
      return false;
    }
    if (title.indexOf('脆弱性') >= 0) return false;

    return true;
  }

  function fetchAllRecords(query) {
    var limit = 500;
    var offset = 0;
    var all = [];

    function page() {
      return kintone
        .api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: STORE_APP_ID,
          query: query + ' limit ' + limit + ' offset ' + offset,
          fields: API_FIELDS,
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

  function matchesKeyword(rec, kw) {
    if (!kw) return true;
    var t = (rec[FC.title] && rec[FC.title].value) || '';
    var s = (rec[FC.summary] && rec[FC.summary].value) || '';
    var d = (rec[FC.digest] && rec[FC.digest].value) || '';
    return (t + '\n' + s + '\n' + d).toLowerCase().indexOf(kw.toLowerCase()) >= 0;
  }

  function inDateRange(rec, fromYmd, toYmd) {
    var d = rec[FC.published_date] && rec[FC.published_date].value;
    if (!d) return false;
    if (fromYmd && d < fromYmd) return false;
    if (toYmd && d > toYmd) return false;
    return true;
  }

  function formatSummaryHtml(text) {
    return String(text || '')
      .split('\n')
      .filter(Boolean)
      .map(function (line) {
        return '<p class="sn-ov-line">' + escapeHtml(line) + '</p>';
      })
      .join('');
  }

  /** 要約見出し: 旧 `事象:` 形式と新 `【事象】` 形式の両方を掲示板用に統一 */
  function normalizeDigestLabelLine(line) {
    if (/^事象:\s*/.test(line)) return line.replace(/^事象:\s*/, '【事象】 ');
    if (/^脆弱性関連:\s*/.test(line)) return line.replace(/^脆弱性関連:\s*/, '【脆弱性関連】 ');
    if (/^修正・対策:\s*/.test(line)) return line.replace(/^修正・対策:\s*/, '【修正・対策】 ');
    if (/^見解:\s*/.test(line)) return line.replace(/^見解:\s*/, '【見解】 ');
    return line;
  }

  function formatDigestHtml(text) {
    return String(text || '')
      .split('\n')
      .filter(Boolean)
      .map(function (line) {
        var normalized = normalizeDigestLabelLine(line);
        var cls =
          /^【[^】]+】/.test(normalized) || /:$/.test(normalized.slice(0, 20))
            ? 'sn-dg-line sn-dg-line--label'
            : 'sn-dg-line';
        return '<p class="' + cls + '">' + escapeHtml(normalized) + '</p>';
      })
      .join('');
  }

  function renderCard(rec, opts) {
    opts = opts || {};
    var title = (rec[FC.title] && rec[FC.title].value) || '（無題）';
    var pub = (rec[FC.published_date] && rec[FC.published_date].value) || '';
    var summary = (rec[FC.summary] && rec[FC.summary].value) || '';
    var digest = (rec[FC.digest] && rec[FC.digest].value) || '';
    var url = (rec[FC.article_url] && rec[FC.article_url].value) || '';
    var kws = (rec[FC.match_keywords_display] && rec[FC.match_keywords_display].value) || '';
    var tier = (rec[FC.internal_severity_tier] && rec[FC.internal_severity_tier].value) || '';
    var src = (rec[FC.internal_source] && rec[FC.internal_source].value) || '';

    var titleHtml = url
      ? '<a class="sn-card-link" href="' +
        escapeHtml(url) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(title) +
        '</a>'
      : escapeHtml(title);

    var badges = '';
    if (tier === 'exception') {
      badges += '<span class="sn-badge sn-badge--exc">重大</span>';
    }
    if (src === 'rss') {
      badges += '<span class="sn-badge sn-badge--rss">Security NEXT</span>';
    }
    if (kws) {
      kws.split(/[,、]/).slice(0, 3).forEach(function (k) {
        var t = k.trim();
        if (t) badges += '<span class="sn-badge sn-badge--kw">' + escapeHtml(t) + '</span>';
      });
    }

    var digestBlock = '';
    if (digest && digest !== summary) {
      digestBlock =
        '<details class="sn-digest-fold"><summary>要約を読む</summary><div class="sn-digest">' +
        formatDigestHtml(digest) +
        '</div></details>';
    }

    return (
      '<article class="sn-card' +
      (opts.hero ? ' sn-card--hero' : '') +
      '">' +
      '<div class="sn-card-head">' +
      badges +
      '<time class="sn-date" datetime="' +
      escapeHtml(pub) +
      '">' +
      escapeHtml(pub) +
      '</time>' +
      '</div>' +
      '<h3 class="sn-card-title">' +
      titleHtml +
      '</h3>' +
      (summary ? '<div class="sn-summary">' + formatSummaryHtml(summary) + '</div>' : '') +
      digestBlock +
      '</article>'
    );
  }

  function injectNativeHideStyles() {
    if (document.getElementById('sn-news-hide-native')) return;
    var style = document.createElement('style');
    style.id = 'sn-news-hide-native';
    style.textContent =
      '.gaia-argoui-app-index-recordlist,.gaia-argoui-app-index-norecord,.recordlist-gaia,.recordlist-norecord-gaia,.gaia-argoui-list-norecord,.recordlist-paging-gaia,div[class*="recordlist-norecord"],.gaia-argoui-app-index-paging,.gaia-argoui-app-index-pager,.gaia-argoui-app-index-recordcount,.gaia-argoui-app-recordcount,.gaia-argoui-paging,div[class*="paging-gaia"],div[class*="recordlist-paging"],div[class*="recordcount-gaia"],[class*="recordcount-gaia"],[class*="Recordcount-gaia"],[class*="recordlist-paging"]{display:none !important;}';
    document.head.appendChild(style);
  }

  function injectStyles() {
    if (document.getElementById('sn-news-board-style')) return;
    var style = document.createElement('style');
    style.id = 'sn-news-board-style';
    style.textContent = [
      '[data-sn-news-board]{font-family:"Segoe UI",system-ui,sans-serif;color:#1c1917;max-width:1100px;margin:0 auto;padding:0 16px 32px}',
      '[data-sn-news-board] *{box-sizing:border-box}',
      '.sn-top{margin:0 -16px 0;padding:20px 20px 18px;background:linear-gradient(135deg,#7f1d1d 0%,#b91c1c 55%,#dc2626 100%);color:#fef2f2;border-radius:0 0 12px 12px;box-shadow:0 4px 14px rgba(185,28,28,.3)}',
      '.sn-top h1{margin:0 0 6px;font-size:1.35rem;font-weight:700}',
      '.sn-top-lead{margin:0;font-size:.9rem;opacity:.95;line-height:1.45}',
      '.sn-search-panel{position:sticky;top:0;z-index:5;margin:16px 0 20px;padding:14px 16px;background:#fff;border:1px solid #e7e5e4;border-radius:10px;box-shadow:0 2px 12px rgba(28,25,23,.06)}',
      '.sn-search-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}',
      '.sn-search-row--main{margin-bottom:10px}',
      '.sn-field{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.sn-field--grow{flex:1 1 220px}',
      '.sn-field label{font-size:11px;font-weight:600;color:#78716c;text-transform:uppercase;letter-spacing:.04em}',
      '.sn-field input{width:100%;padding:8px 10px;font-size:14px;border:1px solid #d6d3d1;border-radius:6px;background:#fafaf9}',
      '.sn-btn-search{padding:9px 20px;font-size:14px;font-weight:600;color:#fff;background:linear-gradient(180deg,#dc2626,#b91c1c);border:none;border-radius:6px;cursor:pointer}',
      '.sn-btn-ghost{padding:8px 14px;font-size:13px;color:#57534e;background:#f5f5f4;border:1px solid #e7e5e4;border-radius:6px;cursor:pointer}',
      '.sn-section{margin-bottom:24px}',
      '.sn-section-title{margin:0 0 12px;font-size:1.05rem;font-weight:700;display:flex;align-items:center;gap:8px}',
      '.sn-section-title::before{content:"";display:inline-block;width:4px;height:1.1em;background:#dc2626;border-radius:2px}',
      '.sn-hero-panel{padding:14px 16px;background:linear-gradient(180deg,#fef2f2,#fee2e2);border:1px solid #fecaca;border-radius:10px}',
      '.sn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}',
      '.sn-card{background:#fff;border:1px solid #e7e5e4;border-radius:10px;padding:14px 16px}',
      '.sn-card--hero{border-color:#fca5a5}',
      '.sn-card-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:8px}',
      '.sn-badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;line-height:1.4}',
      '.sn-badge--exc{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}',
      '.sn-badge--rss{background:#1e293b;color:#f8fafc}',
      '.sn-badge--kw{background:#ffedd5;color:#9a3412}',
      '.sn-date{font-size:12px;color:#78716c;margin-left:auto}',
      '.sn-card-title{margin:0 0 8px;font-size:1rem;line-height:1.4;font-weight:600}',
      '.sn-card-link{color:#b91c1c;text-decoration:none}',
      '.sn-card-link:hover{text-decoration:underline}',
      '.sn-summary,.sn-digest{font-size:13px;line-height:1.55;color:#44403c}',
      '.sn-ov-line,.sn-dg-line{margin:0 0 4px}',
      '.sn-dg-line--label{font-weight:600;color:#1c1917}',
      '.sn-digest-fold{margin-top:8px;font-size:13px}',
      '.sn-digest-fold summary{cursor:pointer;color:#b91c1c;font-weight:600}',
      '.sn-status{font-size:13px;color:#78716c;margin:0 0 10px}',
      '.sn-empty{padding:24px;text-align:center;color:#78716c;background:#fafaf9;border-radius:8px;border:1px dashed #d6d3d1}',
      '.sn-pager{display:flex;gap:8px;margin-top:14px}',
      '.sn-pager button{padding:7px 14px;font-size:13px;border:1px solid #d6d3d1;background:#fff;border-radius:6px;cursor:pointer}',
      '.sn-pager button:disabled{opacity:.45;cursor:not-allowed}',
      '.sn-foot{margin-top:20px;padding-top:12px;border-top:1px solid #e7e5e4;font-size:11px;color:#a8a29e}',
    ].join('');
    document.head.appendChild(style);
  }

  function buildUi(container) {
    var today = todayJstYmd();
    var weekAgo = addDaysYmd(today, -7);

    container.innerHTML =
      '<div id="sn-news-root" data-sn-news-board>' +
      '<header class="sn-top">' +
      '<h1>Security NEXT ニュース掲示板</h1>' +
      '<p class="sn-top-lead">セキュリティインシデント・事件報道が毎日8：00に掲載されます。（1日最大3件を自動収集）</p>' +
      '</header>' +
      '<div class="sn-search-panel">' +
      '<div class="sn-search-row sn-search-row--main">' +
      '<div class="sn-field sn-field--grow"><label for="sn-filter-kw">キーワード</label>' +
      '<input type="search" id="sn-filter-kw" placeholder="タイトル・概要で検索…" autocomplete="off" /></div>' +
      '<button type="button" id="sn-btn-search" class="sn-btn-search">検索</button>' +
      '<button type="button" id="sn-btn-reset" class="sn-btn-ghost">クリア</button>' +
      '</div>' +
      '<div class="sn-search-row">' +
      '<div class="sn-field"><label for="sn-filter-from">公開日 From</label><input type="date" id="sn-filter-from" /></div>' +
      '<div class="sn-field"><label for="sn-filter-to">To</label><input type="date" id="sn-filter-to" /></div>' +
      '</div></div>' +
      '<section class="sn-section"><h2 class="sn-section-title">直近の注目</h2>' +
      '<div class="sn-hero-panel"><div id="sn-hero-list" class="sn-grid">読込中…</div></div></section>' +
      '<section class="sn-section"><h2 class="sn-section-title">記事一覧</h2>' +
      '<div id="sn-list-status" class="sn-status"></div>' +
      '<div id="sn-list" class="sn-grid"></div>' +
      '<div class="sn-pager"><button type="button" id="sn-btn-prev">前へ</button>' +
      '<button type="button" id="sn-btn-next">次へ</button></div></section>' +
      '<footer class="sn-foot">BUILD ' +
      BUILD +
      ' · 正本 ' +
      STORE_APP_ID +
      '</footer></div>';

    injectStyles();

    var state = { all: [], page: 0, excluded: 0 };

    function applyFilters() {
      var from = document.getElementById('sn-filter-from').value;
      var to = document.getElementById('sn-filter-to').value;
      var kw = document.getElementById('sn-filter-kw').value.trim();
      return state.all.filter(function (rec) {
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
      document.getElementById('sn-list-status').textContent =
        '表示 ' +
        filtered.length +
        ' 件（掲示板対象外 ' +
        state.excluded +
        ' 件を除外） · ' +
        (state.page + 1) +
        ' / ' +
        totalPages +
        ' ページ';
      document.getElementById('sn-list').innerHTML = slice.length
        ? slice.map(renderCard).join('')
        : '<p class="sn-empty">該当する記事がありません。</p>';
      document.getElementById('sn-btn-prev').disabled = state.page <= 0;
      document.getElementById('sn-btn-next').disabled = state.page >= totalPages - 1;
    }

    function renderHero() {
      var filtered = applyFilters();
      var todayRecs = filtered.filter(function (r) {
        return r[FC.published_date] && r[FC.published_date].value === today;
      });
      var weekRecs = filtered.filter(function (r) {
        var d = r[FC.published_date] && r[FC.published_date].value;
        return d && d >= weekAgo && d <= today;
      });
      var show = todayRecs.length ? todayRecs : weekRecs.slice(0, 6);
      document.getElementById('sn-hero-list').innerHTML = show.length
        ? show
            .map(function (r) {
              return renderCard(r, { hero: true });
            })
            .join('')
        : '<p class="sn-empty">直近 7 日の掲示対象記事はまだありません。</p>';
    }

    function runSearch() {
      state.page = 0;
      renderHero();
      renderList();
    }

    document.getElementById('sn-btn-search').addEventListener('click', runSearch);
    document.getElementById('sn-btn-reset').addEventListener('click', function () {
      document.getElementById('sn-filter-from').value = '';
      document.getElementById('sn-filter-to').value = '';
      document.getElementById('sn-filter-kw').value = '';
      runSearch();
    });
    document.getElementById('sn-filter-kw').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') runSearch();
    });
    document.getElementById('sn-btn-prev').addEventListener('click', function () {
      state.page--;
      renderList();
    });
    document.getElementById('sn-btn-next').addEventListener('click', function () {
      state.page++;
      renderList();
    });

    return fetchAllRecords('order by ' + FC.published_date + ' desc').then(function (records) {
      var visible = [];
      var excluded = 0;
      records.forEach(function (rec) {
        if (isBoardVisible(rec)) visible.push(rec);
        else excluded++;
      });
      state.all = visible;
      state.excluded = excluded;
      renderHero();
      renderList();
    });
  }

  kintone.events.on('app.record.index.show', function (event) {
    injectNativeHideStyles();
    var header = kintone.app.getHeaderSpaceElement && kintone.app.getHeaderSpaceElement();
    if (!header) return event;
    if (header.querySelector('[data-sn-news-board]')) return event;

    header.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.id = 'sn-news-board-wrap';
    header.appendChild(wrap);

    buildUi(wrap).catch(function (err) {
      wrap.innerHTML =
        '<div data-sn-news-board><p style="color:#b91c1c;padding:16px">ニュースの取得に失敗しました。正本 ' +
        STORE_APP_ID +
        ' の閲覧権限を確認してください。<br>' +
        escapeHtml(err && err.message ? err.message : String(err)) +
        '</p></div>';
    });
    return event;
  });
})();
