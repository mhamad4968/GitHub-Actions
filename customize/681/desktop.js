(function () {
  "use strict";
  /** @type {string} */
  var BUILD = "2026-05-06-681-web-reader-copyfix";

  var FIELDS = ["Record_number", "sort_no", "midashi", "honbun", "gazou_1", "gazou_2", "gazou_3"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
      ".pcqg-root{font-family:'Hiragino Sans','Yu Gothic UI','Meiryo',sans-serif;font-size:15px;line-height:1.65;color:#1e293b;background:linear-gradient(180deg,#f0f6ff 0%,#f8fafc 28%);border-bottom:1px solid #cbd5e1;padding:20px 16px 22px;margin:0 0 16px;}" +
      ".pcqg-inner{max-width:860px;margin:0 auto;}" +
      ".pcqg-title{margin:0 0 6px;font-size:1.35rem;font-weight:700;color:#0f172a;letter-spacing:0.02em;}" +
      ".pcqg-sub{margin:0 0 18px;font-size:0.92rem;color:#475569;}" +
      ".pcqg-cards{display:flex;flex-direction:column;gap:14px;}" +
      ".pcqg-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 18px rgba(15,23,42,0.06);padding:16px 18px 18px;}" +
      ".pcqg-card h2{margin:0 0 10px;font-size:1.08rem;color:#0f4c81;border-left:4px solid #38bdf8;padding-left:10px;line-height:1.35;}" +
      ".pcqg-body{margin:0;color:#334155;white-space:pre-wrap;word-break:break-word;font-size:0.98rem;}" +
      ".pcqg-figs{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;}" +
      ".pcqg-figs img{max-width:100%;height:auto;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;}" +
      ".pcqg-foot{margin:16px 0 0;font-size:0.85rem;color:#64748b;text-align:center;}" +
      ".pcqg-badge{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:0.72rem;font-weight:600;vertical-align:middle;}";
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
    sub.textContent = "事務の方向けの読み物です。下の一覧から、章を開いて直したり、絵を足したりできます。";
    inner.appendChild(h1);
    inner.appendChild(sub);

    var stack = document.createElement("div");
    stack.className = "pcqg-cards";

    records.forEach(function (rec) {
      var sn = rec.sort_no && rec.sort_no.value != null ? String(rec.sort_no.value).trim() : "";
      var title = rec.midashi && rec.midashi.value ? String(rec.midashi.value) : "（無題）";
      var body = rec.honbun && rec.honbun.value ? String(rec.honbun.value) : "";

      var card = document.createElement("article");
      card.className = "pcqg-card";
      var h2 = document.createElement("h2");
      h2.innerHTML = esc(title) + (sn ? '<span class="pcqg-badge">表示順 ' + esc(sn) + "</span>" : "");

      var bd = document.createElement("div");
      bd.className = "pcqg-body";
      bd.textContent = body;

      card.appendChild(h2);
      card.appendChild(bd);

      var imgs = collectImages(rec);
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
      "※ 表示は自動で作っています。文言の正本は各レコードの「見出し」「本文」です。絵は「イラスト・図」の欄に入れてください。";
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
      var shell = buildShell(records.length ? records : []);
      if (err && typeof console !== "undefined" && console.warn) {
        console.warn("[681 pcqg] records fetch", err);
        var warn = document.createElement("p");
        warn.style.cssText = "color:#b45309;font-size:0.9rem;margin:0 0 12px;";
        warn.textContent = "一覧の取得に失敗しました。画面を再読み込みするか、しばらく待ってからもう一度開いてください。";
        shell.querySelector(".pcqg-inner").insertBefore(warn, shell.querySelector(".pcqg-title"));
      }
      if (!records.length && !err) {
        var empty = document.createElement("p");
        empty.style.cssText = "color:#64748b;margin:0 0 12px;";
        empty.textContent = "まだ章がありません。下の一覧から「追加」で章を作れます。";
        shell.querySelector(".pcqg-inner").insertBefore(empty, shell.querySelector(".pcqg-cards"));
      }
      if (dest.before) dest.parent.insertBefore(shell, dest.before);
      else dest.parent.appendChild(shell);
    });
  }

  function scheduleMount() {
    [0, 500, 1200].forEach(function (ms) {
      setTimeout(function () {
        try {
          mountReader();
        } catch (e) {
          if (typeof console !== "undefined" && console.warn) console.warn("[681 pcqg]", e);
        }
      }, ms);
    });
  }

  kintone.events.on("app.record.index.show", function (e) {
    scheduleMount();
    return e;
  });
})();
