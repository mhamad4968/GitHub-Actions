(function () {
  "use strict";
  var BUILD = "2026-05-04-679-yojitsu-quick-manual-page";
  var MANUAL_HTML = "<div class=\"y679-manual-root\" style=\"font-size:14px;line-height:1.45;color:#1c3a26;max-width:920px;margin:0 auto;padding:8px 4px 24px;\"><style type=\"text/css\">.y679-manual-root table{border-collapse:collapse;width:100%;max-width:720px;background:#fff;border:1px solid #c5d8c9;font-size:13px;margin:8px 0;}.y679-manual-root th,.y679-manual-root td{border:1px solid #dee8e0;padding:8px 10px;vertical-align:top;text-align:left;}.y679-manual-root th{background:#e8f2ea;font-weight:600;color:#1a4030;}.y679-manual-root h1{font-size:1.25rem;margin:0 0 12px;color:#0f3a22;}.y679-manual-root h2{font-size:1.05rem;margin:22px 0 8px;color:#164a30;border-bottom:1px solid #b9d6bd;padding-bottom:4px;}.y679-manual-root a{color:#1f6e3f;font-weight:600;text-decoration:none;}.y679-manual-root a:hover{text-decoration:underline;}.y679-manual-root .lead{margin:0 0 14px;font-size:13px;color:#3e514a;}.y679-manual-root ul{margin:8px 0 0 1.1em;padding:0;}.y679-manual-root footer{margin-top:28px;font-size:12px;color:#5b6d62;}</style><h1>部署予実（予算・実績）クイックマニュアル</h1>\n  <p class=\"lead\">日常の数字は <strong>kintone のみ</strong>（Excel に戻さない）。表の見方・操作は <strong>678 ダッシュ</strong>、新しい明細行の本登録は <strong>677 入力</strong>。</p>\n\n  <div class=\"links\">\n    <a href=\"https://jbis-kintone.cybozu.com/k/678/\">678 ダッシュ</a>\n    ·\n    <a href=\"https://jbis-kintone.cybozu.com/k/677/\">677 入力</a>\n    ·\n    <a href=\"https://jbis-kintone.cybozu.com/k/#/space/54/thread/58\">スペース本件スレッド</a>\n  </div>\n\n  <h2>1. 2つのアプリ</h2>\n  <table>\n    <thead>\n      <tr><th>役割</th><th>アプリ</th><th>いつ</th></tr>\n    </thead>\n    <tbody>\n      <tr><td>一覧・月次・支払・予算修正の多く</td><td><a href=\"https://jbis-kintone.cybozu.com/k/678/\">678</a></td><td>毎日ここから</td></tr>\n      <tr><td>明細の新規・必須項目の本登録</td><td><a href=\"https://jbis-kintone.cybozu.com/k/677/\">677</a></td><td>新しい行を作るとき</td></tr>\n    </tbody>\n  </table>\n\n  <h2>2. 用語（1行）</h2>\n  <table>\n    <thead><tr><th>用語</th><th>意味</th></tr></thead>\n    <tbody>\n      <tr><td>予算</td><td>その月で使っていい計画額</td></tr>\n      <tr><td>実績</td><td>実際に払った（確定した）金額。月は <strong>支払日の月</strong></td></tr>\n      <tr><td>消費率</td><td>自動。手入力しない</td></tr>\n      <tr><td>予算修正</td><td>月の枠を後から直す欄</td></tr>\n    </tbody>\n  </table>\n\n  <h2>3. いつもやること</h2>\n  <ul>\n    <li>678 を開く → 見ている <strong>入力月</strong> が合っているか確認</li>\n    <li>自分の担当行だけ触る</li>\n  </ul>\n\n  <h2>4. よくある作業</h2>\n  <table>\n    <thead><tr><th>作業</th><th>手順</th></tr></thead>\n    <tbody>\n      <tr><td>支払・実績を足す</td><td>678 で行を選ぶ → 実績セルからモーダル → 保存まで</td></tr>\n      <tr><td>新しい明細行</td><td>677 で新規 → 必須を埋めて保存 → 678 に反映</td></tr>\n      <tr><td>会社名がリストにない</td><td>677 で登録・室長に相談</td></tr>\n      <tr><td>固定費の「はい／いいえ」</td><td>はい＝翌月〜4月同額（既定）／いいえ＝今月のみ</td></tr>\n    </tbody>\n  </table>\n\n  <h2>5. 会社名を変える（2通り）</h2>\n  <table>\n    <thead><tr><th>状況</th><th>手順</th></tr></thead>\n    <tbody>\n      <tr>\n        <td>集合先が FBJ・その他・各社などの行</td>\n        <td>678 で <strong>入力月</strong> を選ぶ → その月の <strong>実績</strong>セルを開く → 会社を選んで保存（677 に反映）。集合先の「その他」と <strong>費用種別</strong>は別。</td>\n      </tr>\n      <tr>\n        <td>確定取引先が入っている行</td>\n        <td><a href=\"https://jbis-kintone.cybozu.com/k/677/\">677</a> で該当レコードを開き会社欄を編集（678 一覧からは触れない）</td>\n      </tr>\n    </tbody>\n  </table>\n\n  <h2>6. やってはいけないこと</h2>\n  <ul>\n    <li>Excel に数字を書いて戻す</li>\n    <li>権限がないのに他人の行・一括削除を触る</li>\n  </ul>\n\n  <h2>7. 困ったら</h2>\n  <p class=\"lead\" style=\"margin:0\">エラー文をメモ → 何をしようとしたか一言 → 室長またはシステム推進室へ。</p>\n\n  <footer>本番の掲載: kintone 専用アプリ <a href=\"https://jbis-kintone.cybozu.com/k/679/\">679 クイックマニュアル</a>（本ページと同一内容）。リポ正本: <code>yojitsu-quick-manual.md</code>。679 の customize 再生成はリポの <code>scripts/sync-yojitsu-679-manual-desktop.mjs</code> を参照。</footer></div>";

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

  function mount() {
    if (document.querySelector("[data-y679-manual-shell]")) return;
    injectCss();
    var host =
      document.querySelector(".ocean-ui-app-index-body") ||
      document.querySelector("#recordlist-gaia") ||
      document.querySelector(".recordlist-gaia") ||
      document.body;
    if (!host) return;
    var origin = typeof location !== "undefined" && location.origin ? location.origin : "";
    var shell = document.createElement("div");
    shell.setAttribute("data-y679-manual-shell", "1");
    shell.style.padding = "12px 16px";
    shell.style.background = "#f4f7f5";
    shell.style.borderTop = "1px solid #dee5e0";
    var nav =
      '<div style="margin-bottom:10px;font-size:12px;color:#355a42;">' +
      '<strong>部署予実クイックマニュアル</strong> · ' +
      '<a href="' +
      origin +
      '/k/679/">679 トップ</a> · ' +
      '<a href="' +
      origin +
      '/k/678/">678 ダッシュ</a> · ' +
      '<a href="' +
      origin +
      '/k/677/">677 入力</a>' +
      "</div>";
    shell.innerHTML = nav + MANUAL_HTML;
    host.insertBefore(shell, host.firstChild);
  }

  kintone.events.on("app.record.index.show", function (e) {
    try {
      mount();
    } catch (err) {
      console.error("[679 manual]", err);
    }
    return e;
  });
})();
