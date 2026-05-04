(function () {
  "use strict";
  var BUILD = "2026-05-04-679-remove-footer-and-css";
  var MANUAL_HTML = "<div class=\"y679-manual-root\" style=\"font-size:14px;line-height:1.45;color:#1c3a26;max-width:920px;margin:0 auto;padding:8px 4px 24px;\"><style type=\"text/css\">.y679-manual-root table{border-collapse:collapse;width:100%;max-width:720px;background:#fff;border:1px solid #c5d8c9;font-size:13px;margin:8px 0;}.y679-manual-root th,.y679-manual-root td{border:1px solid #dee8e0;padding:8px 10px;vertical-align:top;text-align:left;}.y679-manual-root th{background:#e8f2ea;font-weight:600;color:#1a4030;}.y679-manual-root h1{font-size:1.25rem;margin:0 0 12px;color:#0f3a22;}.y679-manual-root h2{font-size:1.05rem;margin:22px 0 8px;color:#164a30;border-bottom:1px solid #b9d6bd;padding-bottom:4px;}.y679-manual-root a{color:#1f6e3f;font-weight:600;text-decoration:none;}.y679-manual-root a:hover{text-decoration:underline;}.y679-manual-root .lead{margin:0 0 14px;font-size:13px;color:#3e514a;}.y679-manual-root ul{margin:8px 0 0 1.1em;padding:0;}</style><h1>システム推進室予実アプリガイド（予算・実績）</h1>\n  <p class=\"lead\">精算や予算の見直しは <strong>システム推進室予実管理システム</strong>。<strong>工種や摘要の追加</strong>や、修正・行の作成が必要なときは <strong>システム推進室予実管理システム入力アプリ</strong> を使います。</p>\n\n  <div class=\"links\">\n    <a href=\"https://jbis-kintone.cybozu.com/k/678/\">システム推進室予実管理システム</a>\n    ·\n    <a href=\"https://jbis-kintone.cybozu.com/k/677/\">システム推進室予実管理システム入力アプリ</a>\n    ·\n    <a href=\"https://jbis-kintone.cybozu.com/k/#/space/54/thread/58\">相談・連絡用スレッド</a>\n  </div>\n\n  <h2>1. 2つの画面の役割</h2>\n  <table>\n    <thead>\n      <tr><th>できること</th><th>開く場所</th><th>いつ使う？</th></tr>\n    </thead>\n    <tbody>\n      <tr><td>一覧で、月ごとの<strong>支払い</strong>や<strong>予算の見直し</strong>ができる</td><td><a href=\"https://jbis-kintone.cybozu.com/k/678/\">システム推進室予実管理システム</a></td><td>精算処理をするとき、または予算見直しをするとき</td></tr>\n      <tr><td><strong>工種や摘要の追加</strong>ができる。</td><td><a href=\"https://jbis-kintone.cybozu.com/k/677/\">システム推進室予実管理システム入力アプリ</a></td><td>修正や追加が必要になったとき</td></tr>\n    </tbody>\n  </table>\n\n  <h2>2. 画面に出てくる言葉（やさしい意味）</h2>\n  <table>\n    <thead><tr><th>言葉</th><th>意味</th></tr></thead>\n    <tbody>\n      <tr><td>予算</td><td>その月に使ってよい、あらかじめ決めた金額</td></tr>\n      <tr><td>実績</td><td>精算処理のデータを<strong>「実績」</strong>のセルに入力します（複数請求書がある場合は<strong>複数回入力できます</strong>）</td></tr>\n      <tr><td>消費率</td><td><strong>予算の消費率</strong>です（使った割合）</td></tr>\n      <tr><td>予算修正</td><td>予算修正を行う必要が出てきたときに入力する欄</td></tr>\n    </tbody>\n  </table>\n\n  <h2>3. いつも意識すること</h2>\n  <p class=\"lead\" style=\"margin:0\">入力忘れや間違いをしないように注意する。</p>\n\n  <h2>4. よくある作業</h2>\n  <table>\n    <thead><tr><th>やりたいこと</th><th>手順（ざっくり）</th></tr></thead>\n    <tbody>\n      <tr><td>請求書追加</td><td>対象行選択→実績のマスを選択→請求情報を入力→保存</td></tr>\n      <tr><td>会社名の追加</td><td><strong>システム推進室予実管理システム入力アプリ</strong> で登録</td></tr>\n      <tr><td>固定費の予算追加</td><td><strong>はい</strong>＝当該月〜翌4月（期末）まで<strong>同額で追加</strong>／<strong>いいえ</strong>＝<strong>当該月のみ</strong></td></tr>\n    </tbody>\n  </table>\n\n  <h2>5. 会社名を変えたいとき（2通り）</h2>\n  <table>\n    <thead><tr><th>状況</th><th>手順</th></tr></thead>\n    <tbody>\n      <tr>\n        <td>支払先が「FBJ」「その他」「各社」などと書いてある行</td>\n        <td><strong>システム推進室予実管理システム</strong> で<strong>操作する月</strong>を選ぶ → その月の<strong>「実績」と書いてあるマス</strong>を押す → 会社名を選ぶか入力して保存。画面に出ている「その他」と、<strong>固定費か変動費か</strong>という種類は別の話なので混同しない</td>\n      </tr>\n      <tr>\n        <td>すでに取引先がはっきり決まっている行</td>\n        <td><a href=\"https://jbis-kintone.cybozu.com/k/677/\">システム推進室予実管理システム入力アプリ</a> の一覧からそのデータを開き、<strong>会社名の欄</strong>を直す（管理システムの表の一覧からは会社名を変えられません）</td>\n      </tr>\n    </tbody>\n  </table>\n\n  <h2>6. 困ったら</h2>\n  <p class=\"lead\" style=\"margin:0\">不明な点は部署内で確認してください（濱田まで）。</p></div>";

  function injectCss() {
    if (document.querySelector("[data-y679-manual-css]")) return;
    var st = document.createElement("style");
    st.setAttribute("data-y679-manual-css", "1");
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.gaia-argoui-app-index-norecord,.recordlist-gaia,.recordlist-norecord-gaia," +
      ".gaia-argoui-list-norecord,.recordlist-paging-gaia,div[class*=\"recordlist-norecord\"]{display:none !important;}" +
      ".gaia-argoui-app-index-paging,.gaia-argoui-app-index-recordcount,.gaia-argoui-app-recordcount,.gaia-argoui-paging," +
      "div[class*=\"paging-gaia\"],div[class*=\"recordlist-paging\"],div[class*=\"recordcount-gaia\"]{display:none !important;}";
    document.head.appendChild(st);
  }

  /**
   * 一覧の recordlist を display:none にしてもガイドが消えないよう、ヘッダー領域 or 一覧ブロックの外へ挿入（678 の resolve と同趣旨）
   * @returns {{ parent: HTMLElement, before: ChildNode|null }|null}
   */
  function resolve679MountHost() {
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

    var oceanHead = document.querySelector(".ocean-ui-app-index-head");
    if (oceanHead) return { parent: oceanHead, before: oceanHead.firstChild };

    var idxHead = document.querySelector(".gaia-argoui-app-index-head");
    if (idxHead) return { parent: idxHead, before: idxHead.firstChild };

    var rl = document.querySelector(".recordlist-gaia");
    if (rl && rl.parentNode) return { parent: rl.parentNode, before: rl };

    var oceanBody = document.querySelector(".ocean-ui-app-index-body");
    if (oceanBody) return { parent: oceanBody, before: oceanBody.firstChild };

    var layout = document.querySelector("#contents-body .layout-gaia");
    if (layout) return { parent: layout, before: layout.firstChild };

    return null;
  }

  function attach679Shell(dest, shell) {
    if (!dest || !dest.parent) return false;
    if (dest.before) dest.parent.insertBefore(shell, dest.before);
    else dest.parent.appendChild(shell);
    return true;
  }

  function mount679Once() {
    if (document.querySelector("[data-y679-manual-shell]")) return true;
    injectCss();
    var dest = resolve679MountHost();
    if (!dest || !dest.parent) {
      var b = document.body;
      if (!b) return false;
      dest = { parent: b, before: b.firstChild };
    }
    var origin = typeof location !== "undefined" && location.origin ? location.origin : "";
    var shell = document.createElement("div");
    shell.setAttribute("data-y679-manual-shell", "1");
    shell.style.padding = "12px 16px";
    shell.style.background = "#f4f7f5";
    shell.style.borderTop = "1px solid #dee5e0";
    var nav =
      '<div style="margin-bottom:10px;font-size:12px;color:#355a42;">' +
      '<strong>システム推進室予実アプリガイド</strong> · ' +
      '<a href="' +
      origin +
      '/k/678/">システム推進室予実管理システム</a> · ' +
      '<a href="' +
      origin +
      '/k/677/">システム推進室予実管理システム入力アプリ</a>' +
      "</div>";
    shell.innerHTML = nav + MANUAL_HTML;
    return attach679Shell(dest, shell);
  }

  function scheduleMount679() {
    [0, 120, 400, 1000, 2200].forEach(function (ms) {
      setTimeout(function () {
        try {
          if (!document.querySelector("[data-y679-manual-shell]")) mount679Once();
        } catch (err) {
          if (typeof console !== "undefined" && console.warn) console.warn("[679 manual]", err);
        }
      }, ms);
    });
  }

  kintone.events.on("app.record.index.show", function (e) {
    scheduleMount679();
    return e;
  });
})();
