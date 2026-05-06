(function () {
  "use strict";
  /** @type {string} */
  var BUILD = "2026-05-06-681-hide-sort-badge";

  var FIELDS = ["$id", "Record_number", "sort_no", "midashi", "honbun", "gazou_1", "gazou_2", "gazou_3"];

  /** 見出しに応じた章アイコン（SVG・data URL のみ・外部取得なし） */
  var SVG_BY_TOPIC = {
    list:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="12" y="16" width="48" height="40" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="2"/><path d="M16 26h40M16 36h40M16 46h28" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/><rect x="46" y="42" width="10" height="6" rx="1" fill="#cbd5e1"/></svg>',
    employee:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><circle cx="26" cy="28" r="10" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/><path d="M14 52c4-12 24-12 28 0" fill="none" stroke="#1d4ed8" stroke-width="2"/><circle cx="46" cy="28" r="10" fill="#dcfce7" stroke="#166534" stroke-width="2"/><path d="M34 52c4-12 24-12 28 0" fill="none" stroke="#166534" stroke-width="2"/></svg>',
    transfer:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><path d="M18 38h36" stroke="#b45309" stroke-width="3" stroke-linecap="round"/><path d="M46 30l8 8-8 8" fill="none" stroke="#b45309" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="22" cy="24" r="8" fill="#fef3c7" stroke="#ca8a04" stroke-width="2"/><circle cx="50" cy="52" r="8" fill="#e0f2fe" stroke="#0369a1" stroke-width="2"/></svg>',
    replace:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="10" y="18" width="26" height="20" rx="3" fill="#f1f5f9" stroke="#475569" stroke-width="2"/><rect x="36" y="34" width="26" height="20" rx="3" fill="#e0f2fe" stroke="#0369a1" stroke-width="2"/><path d="M28 28 L44 40" stroke="#64748b" stroke-width="2" stroke-linecap="round"/></svg>',
    storage:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><path d="M16 28 L36 18 L56 28 V52 H16 Z" fill="#ede9fe" stroke="#5b21b6" stroke-width="2"/><rect x="22" y="36" width="28" height="16" fill="#c4b5fd" stroke="#5b21b6" stroke-width="2"/><path d="M28 36V28M44 36V28" stroke="#5b21b6" stroke-width="2"/></svg>',
    search:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><circle cx="28" cy="28" r="15" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/><line x1="38" y1="38" x2="56" y2="56" stroke="#0369a1" stroke-width="5" stroke-linecap="round"/></svg>',
    register:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="16" y="12" width="40" height="48" rx="6" fill="#fff" stroke="#166534" stroke-width="3"/><path d="M24 24h24M24 34h18M24 44h22" stroke="#166534" stroke-width="2.5" stroke-linecap="round"/><path d="M46 50l8 8" stroke="#15803d" stroke-width="3" stroke-linecap="round"/></svg>',
    assist:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="14" y="18" width="44" height="36" rx="8" fill="#ede9fe" stroke="#5b21b6" stroke-width="3"/><path d="M28 36h16M36 28v16" stroke="#5b21b6" stroke-width="3" stroke-linecap="round"/><circle cx="52" cy="22" r="8" fill="#fbbf24" stroke="#b45309" stroke-width="2"/></svg>',
    trouble:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><circle cx="36" cy="34" r="18" fill="#fef9c3" stroke="#ca8a04" stroke-width="3"/><path d="M30 28c0-4 4-7 8-6 5 1 6 6 3 9-2 2-2 2-2 4" fill="none" stroke="#854d0e" stroke-width="2.5" stroke-linecap="round"/><circle cx="36" cy="46" r="2.2" fill="#854d0e"/><path d="M20 58c8-6 44-6 52 0" fill="none" stroke="#ca8a04" stroke-width="3" stroke-linecap="round"/></svg>',
  };

  /** 上記に当てはまらない章用（SVG を data URL のみで埋め込み） */
  var SVG_THUMBS = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="14" y="10" width="44" height="52" rx="8" fill="#e0f2fe" stroke="#0369a1" stroke-width="3"/><path d="M22 26h28M22 38h22" stroke="#0369a1" stroke-width="3" stroke-linecap="round"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><circle cx="36" cy="36" r="22" fill="#fef9c3" stroke="#ca8a04" stroke-width="3"/><path d="M36 22v14l10 6" stroke="#854d0e" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="16" y="18" width="40" height="36" rx="6" fill="#dcfce7" stroke="#166534" stroke-width="3"/><path d="M24 30h24M24 40h18" stroke="#166534" stroke-width="3" stroke-linecap="round"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="20" y="16" width="32" height="40" rx="4" fill="#ede9fe" stroke="#5b21b6" stroke-width="3"/><circle cx="36" cy="32" r="6" fill="#5b21b6"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="12" y="20" width="48" height="32" rx="6" fill="#fee2e2" stroke="#b91c1c" stroke-width="3"/><circle cx="28" cy="36" r="6" fill="#b91c1c"/><circle cx="44" cy="36" r="6" fill="#b91c1c"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><path d="M20 48 L36 20 L52 48 Z" fill="#cffafe" stroke="#0e7490" stroke-width="3"/><rect x="30" y="36" width="12" height="14" rx="2" fill="#0e7490"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="18" y="22" width="36" height="28" rx="6" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/><path d="M26 34h20M26 42h14" stroke="#1d4ed8" stroke-width="3" stroke-linecap="round"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect x="20" y="18" width="32" height="36" rx="4" fill="#fef3c7" stroke="#b45309" stroke-width="3"/><path d="M28 30 L44 38 M44 30 L28 38" stroke="#b45309" stroke-width="3" stroke-linecap="round"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><circle cx="36" cy="32" r="14" fill="#ecfccb" stroke="#3f6212" stroke-width="3"/><path d="M22 52c6-10 44-10 50 0" fill="none" stroke="#3f6212" stroke-width="3" stroke-linecap="round"/></svg>',
  ];

  function svgDataUrl(svgMarkup) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup);
  }

  function midashiNorm(rec) {
    var m = rec.midashi && rec.midashi.value != null ? String(rec.midashi.value).trim() : "";
    return m.replace(/[？?]/g, "");
  }

  function svgMarkupForRecord(rec, loopIdx) {
    var n = midashiNorm(rec);
    if (n.indexOf("リスト一覧") !== -1) return SVG_BY_TOPIC.list;
    if (n.indexOf("社員マスタ") !== -1) return SVG_BY_TOPIC.employee;
    if (n.indexOf("異動") !== -1 || n.indexOf("退職") !== -1) return SVG_BY_TOPIC.transfer;
    if (n.indexOf("買替") !== -1 || n.indexOf("買い替え") !== -1) return SVG_BY_TOPIC.replace;
    if (n.indexOf("保管") !== -1) return SVG_BY_TOPIC.storage;
    if (n.indexOf("検索") !== -1) return SVG_BY_TOPIC.search;
    if (n.indexOf("登録") !== -1 || n.indexOf("PC台帳") !== -1) return SVG_BY_TOPIC.register;
    if (n.indexOf("入力支援") !== -1) return SVG_BY_TOPIC.assist;
    if (n.indexOf("困った") !== -1) return SVG_BY_TOPIC.trouble;
    var sn = parseInt(String((rec.sort_no && rec.sort_no.value) || "").trim(), 10);
    var ix = Number.isFinite(sn) && sn >= 1 ? sn - 1 : loopIdx;
    return SVG_THUMBS[ix % SVG_THUMBS.length];
  }

  function thumbDataUrlForRecord(rec, loopIdx) {
    return svgDataUrl(svgMarkupForRecord(rec, loopIdx));
  }

  function fileSrc(fileKey) {
    return kintone.api.url("/k/v1/file.json", true) + "?fileKey=" + encodeURIComponent(fileKey);
  }

  function collectImages(rec) {
    var out = [];
    ["gazou_1", "gazou_2", "gazou_3"].forEach(function (code) {
      var cell = rec[code];
      if (!cell || !cell.value || !cell.value.length) return;
      cell.value.forEach(function (f) {
        if (f && f.fileKey) out.push(f);
      });
    });
    return out;
  }

  function recordId(rec) {
    var idCell = rec.$id;
    if (idCell && idCell.value != null && String(idCell.value).trim() !== "") return String(idCell.value).trim();
    return "";
  }

  function truncLabel(s, maxLen) {
    var t = String(s || "").trim();
    if (!t) return "（無題）";
    if (t.length <= maxLen) return t;
    return t.slice(0, maxLen - 1) + "…";
  }

  /** 自部署内運用向け：全体向けの「読み方」「いつから」系メタ章はリーダーに出さない */
  function isMetaChapter(rec) {
    var m = rec.midashi && rec.midashi.value != null ? String(rec.midashi.value).trim() : "";
    if (!m) return false;
    var n = m.replace(/[？?]/g, "");
    if (n.indexOf("このガイドの読み方") !== -1) return true;
    if (n.indexOf("いつから使う") !== -1) return true;
    return false;
  }

  function filterVisibleRecords(records) {
    return (records || []).filter(function (r) {
      return !isMetaChapter(r);
    });
  }

  function resolveMountHost() {
    var slot = null;
    try {
      if (kintone.app && typeof kintone.app.getHeaderMenuSpaceElement === "function") {
        slot = kintone.app.getHeaderMenuSpaceElement();
      }
    } catch (e0) {
      void e0;
    }
    if (slot) return { parent: slot, before: null };
    try {
      if (kintone.app && typeof kintone.app.getHeaderSpaceElement === "function") {
        var hs = kintone.app.getHeaderSpaceElement();
        if (hs) return { parent: hs, before: null };
      }
    } catch (e1) {
      void e1;
    }
    var rl = document.querySelector(".recordlist-gaia");
    if (rl && rl.parentNode) return { parent: rl.parentNode, before: rl };
    var oceanBody = document.querySelector(".ocean-ui-app-index-body");
    if (oceanBody) return { parent: oceanBody, before: oceanBody.firstChild };
    var layout = document.querySelector("#contents-body .layout-gaia");
    if (layout) return { parent: layout, before: layout.firstChild };
    return null;
  }

  function injectGlobalCssOnce() {
    if (document.querySelector("[data-pcqg-css]")) return;
    var st = document.createElement("style");
    st.setAttribute("data-pcqg-css", "1");
    st.textContent =
      "body:not(.pcqg-list-visible) .gaia-argoui-app-index-recordlist,body:not(.pcqg-list-visible) .gaia-argoui-app-index-norecord,body:not(.pcqg-list-visible) .recordlist-gaia,body:not(.pcqg-list-visible) .recordlist-norecord-gaia," +
      "body:not(.pcqg-list-visible) .gaia-argoui-list-norecord,body:not(.pcqg-list-visible) .recordlist-paging-gaia,body:not(.pcqg-list-visible) div[class*=\"recordlist-norecord\"]{display:none !important;}" +
      "body:not(.pcqg-list-visible) .gaia-argoui-app-index-paging,body:not(.pcqg-list-visible) .gaia-argoui-app-index-recordcount,body:not(.pcqg-list-visible) .gaia-argoui-app-recordcount,body:not(.pcqg-list-visible) .gaia-argoui-paging," +
      "body:not(.pcqg-list-visible) div[class*=\"paging-gaia\"],body:not(.pcqg-list-visible) div[class*=\"recordlist-paging\"],body:not(.pcqg-list-visible) div[class*=\"recordcount-gaia\"]{display:none !important;}" +
      "body.pcqg-list-visible .gaia-argoui-app-index-recordlist,body.pcqg-list-visible .gaia-argoui-app-index-norecord,body.pcqg-list-visible .recordlist-gaia,body.pcqg-list-visible .recordlist-norecord-gaia," +
      "body.pcqg-list-visible .gaia-argoui-list-norecord,body.pcqg-list-visible .recordlist-paging-gaia,body.pcqg-list-visible div[class*=\"recordlist-norecord\"]{display:revert !important;}" +
      "body.pcqg-list-visible .gaia-argoui-app-index-paging,body.pcqg-list-visible .gaia-argoui-app-index-recordcount,body.pcqg-list-visible .gaia-argoui-app-recordcount,body.pcqg-list-visible .gaia-argoui-paging," +
      "body.pcqg-list-visible div[class*=\"paging-gaia\"],body.pcqg-list-visible div[class*=\"recordlist-paging\"],body.pcqg-list-visible div[class*=\"recordcount-gaia\"]{display:revert !important;}" +
      ".pcqg-root{font-family:'Hiragino Sans','Yu Gothic UI','Meiryo',sans-serif;font-size:15px;line-height:1.65;color:#1e293b;background:linear-gradient(180deg,#f0f6ff 0%,#f8fafc 28%);border-bottom:1px solid #cbd5e1;padding:20px 12px 22px;margin:0 0 16px;}" +
      ".pcqg-inner{max-width:1180px;margin:0 auto;padding:0 6px;}" +
      ".pcqg-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 10px;}" +
      ".pcqg-list-toggle{cursor:pointer;font:inherit;padding:8px 14px;border-radius:999px;border:1px solid #0ea5e9;background:#fff;color:#0369a1;font-weight:600;}" +
      ".pcqg-list-toggle:hover{background:#e0f2fe;}" +
      ".pcqg-toc{display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;padding:8px 6px 12px;margin:0 0 14px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;position:sticky;top:0;z-index:30;" +
      "background:linear-gradient(180deg,rgba(248,250,252,0.98),rgba(240,246,255,0.95));border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 2px 10px rgba(15,23,42,0.06);}" +
      ".pcqg-toc a{flex:0 0 auto;scroll-snap-align:start;padding:8px 14px;border-radius:999px;background:#fff;border:1px solid #bae6fd;color:#0369a1;font-size:0.82rem;font-weight:600;text-decoration:none;white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis;}" +
      ".pcqg-toc a:hover{background:#e0f2fe;}" +
      ".pcqg-title{margin:0 0 6px;font-size:1.35rem;font-weight:700;color:#0f172a;letter-spacing:0.02em;}" +
      ".pcqg-sub{margin:0 0 18px;font-size:0.92rem;color:#475569;}" +
      ".pcqg-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;align-items:stretch;}" +
      ".pcqg-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 18px rgba(15,23,42,0.06);padding:16px 18px 18px;scroll-margin-top:108px;display:flex;flex-direction:column;}" +
      ".pcqg-card h2{margin:0 0 10px;font-size:1.05rem;color:#0f4c81;border-left:4px solid #38bdf8;padding-left:10px;line-height:1.35;}" +
      ".pcqg-body{margin:0;color:#334155;white-space:pre-wrap;word-break:break-word;font-size:0.96rem;flex:1 1 auto;}" +
      ".pcqg-auto-ill{margin:6px 0 10px;text-align:center;flex:0 0 auto;}" +
      ".pcqg-auto-ill img{width:76px;height:76px;object-fit:contain;}" +
      ".pcqg-card.has-files .pcqg-auto-ill img{width:64px;height:64px;opacity:0.92;}" +
      ".pcqg-figs{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;}" +
      ".pcqg-figs img{max-width:100%;height:auto;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;}" +
      ".pcqg-foot{margin:18px 0 0;font-size:0.85rem;color:#64748b;text-align:center;}";
    document.head.appendChild(st);
  }

  function removeOldShell() {
    var prev = document.querySelector("[data-pcqg-shell]");
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
  }

  function buildShell(records) {
    var inner = document.createElement("div");
    inner.className = "pcqg-inner";

    var h1 = document.createElement("h1");
    h1.className = "pcqg-title";
    h1.textContent = "PC台帳簡単ガイドライン";
    var sub = document.createElement("p");
    sub.className = "pcqg-sub";
    sub.textContent =
      "目次か一覧の検索で章を探せます。各章の小さな絵は見出しに合わせたイメージです。写真や詳しい図は「イラスト・図」欄、追加・修正は「一覧を表示（編集・追加）」から。";
    inner.appendChild(h1);
    inner.appendChild(sub);

    var tb = document.createElement("div");
    tb.className = "pcqg-toolbar";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pcqg-list-toggle";
    btn.setAttribute("aria-pressed", "false");
    function syncToggleLabel() {
      var on = document.body.classList.contains("pcqg-list-visible");
      btn.textContent = on ? "一覧を隠す（読み物モード）" : "一覧を表示（編集・追加）";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    syncToggleLabel();
    btn.addEventListener("click", function () {
      document.body.classList.toggle("pcqg-list-visible");
      syncToggleLabel();
    });
    tb.appendChild(btn);
    inner.appendChild(tb);

    if (records.length) {
      var nav = document.createElement("nav");
      nav.className = "pcqg-toc";
      nav.setAttribute("aria-label", "ページ内目次");
      records.forEach(function (rec) {
        var rid = recordId(rec);
        if (!rid) return;
        var title = rec.midashi && rec.midashi.value ? String(rec.midashi.value) : "（無題）";
        var a = document.createElement("a");
        a.href = "#pcqg-" + rid;
        a.textContent = truncLabel(title, 16);
        nav.appendChild(a);
      });
      inner.appendChild(nav);
    }

    var stack = document.createElement("div");
    stack.className = "pcqg-cards pcqg-cards-grid";

    records.forEach(function (rec, idx) {
      var title = rec.midashi && rec.midashi.value ? String(rec.midashi.value) : "（無題）";
      var body = rec.honbun && rec.honbun.value ? String(rec.honbun.value) : "";
      var rid = recordId(rec);
      var anchor = rid ? "pcqg-" + rid : "pcqg-idx-" + String(idx);

      var card = document.createElement("article");
      card.className = "pcqg-card";
      card.id = anchor;

      var h2 = document.createElement("h2");
      h2.textContent = title;

      var imgs = collectImages(rec);
      if (imgs.length) card.classList.add("has-files");

      card.appendChild(h2);

      var au = document.createElement("div");
      au.className = "pcqg-auto-ill";
      var sim = document.createElement("img");
      sim.alt = "";
      sim.setAttribute("role", "presentation");
      sim.loading = "lazy";
      sim.src = thumbDataUrlForRecord(rec, idx);
      au.appendChild(sim);
      card.appendChild(au);

      var bd = document.createElement("div");
      bd.className = "pcqg-body";
      bd.textContent = body;
      card.appendChild(bd);

      if (imgs.length) {
        var fig = document.createElement("div");
        fig.className = "pcqg-figs";
        imgs.forEach(function (f) {
          var im = document.createElement("img");
          im.alt = f.name ? String(f.name) : "図";
          im.loading = "lazy";
          im.src = fileSrc(f.fileKey);
          fig.appendChild(im);
        });
        card.appendChild(fig);
      }

      stack.appendChild(card);
    });

    inner.appendChild(stack);

    var foot = document.createElement("p");
    foot.className = "pcqg-foot";
    foot.textContent =
      "※ 各章の上の小さな絵は見出しに合わせたあしらいです。写真や詳しい図は「イラスト・図（1〜3）」に入れると、その下に大きく表示されます。文言の正本は「見出し」「本文」です。";
    inner.appendChild(foot);

    var root = document.createElement("div");
    root.className = "pcqg-root";
    root.setAttribute("data-pcqg-shell", "1");
    root.setAttribute("data-pcqg-build", BUILD);
    root.appendChild(inner);
    return root;
  }

  function fetchRecords(cb) {
    var app = kintone.app.getId();
    var params = {
      app: app,
      query: "order by sort_no asc",
      fields: FIELDS,
      totalCount: true,
      limit: 500,
    };
    kintone.api(kintone.api.url("/k/v1/records.json", true), "GET", params, function (resp) {
      cb(null, resp.records || []);
    }, function (err) {
      cb(err, []);
    });
  }

  function mountReader() {
    removeOldShell();
    injectGlobalCssOnce();
    fetchRecords(function (err, records) {
      var dest = resolveMountHost();
      if (!dest || !dest.parent) return;
      var visible = filterVisibleRecords(records);
      var shell = buildShell(visible.length ? visible : []);
      if (err && typeof console !== "undefined" && console.warn) {
        console.warn("[681 pcqg] records fetch", err);
        var warn = document.createElement("p");
        warn.style.cssText = "color:#b45309;font-size:0.9rem;margin:0 0 12px;";
        warn.textContent = "一覧の取得に失敗しました。画面を再読み込みするか、しばらく待ってからもう一度開いてください。";
        shell.querySelector(".pcqg-inner").insertBefore(warn, shell.querySelector(".pcqg-title"));
      }
      if (!visible.length && !err) {
        var empty = document.createElement("p");
        empty.style.cssText = "color:#64748b;margin:0 0 12px;";
        empty.textContent = "まだ章がありません。「一覧を表示（編集・追加）」を押してから「追加」で章を作れます。";
        shell.querySelector(".pcqg-inner").insertBefore(empty, shell.querySelector(".pcqg-cards"));
      }
      if (dest.before) dest.parent.insertBefore(shell, dest.before);
      else dest.parent.appendChild(shell);
    });
  }

  var pcqgMountTimer = null;
  function scheduleMount() {
    if (pcqgMountTimer) clearTimeout(pcqgMountTimer);
    pcqgMountTimer = setTimeout(function () {
      pcqgMountTimer = null;
      try {
        mountReader();
      } catch (e) {
        if (typeof console !== "undefined" && console.warn) console.warn("[681 pcqg]", e);
      }
    }, 350);
  }

  kintone.events.on("app.record.index.show", function (e) {
    scheduleMount();
    return e;
  });
})();
