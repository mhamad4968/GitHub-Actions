(function () {
  "use strict";

  /**
   * 部署予実 ダッシュアプリ 678（骨格）
   * BUILD: 2026-05-02-678-dashboard-shell
   * - 一覧ヘッダにプレースホルダ（677 入力・API 連携は後続）
   * - `SPEC.md` §6b・§6e（担当の主画面）
   */

  var APP_INPUT = 677;
  var BUILD = "2026-05-02-678-dashboard-shell";

  kintone.events.on("app.record.index.show", function () {
    var el = kintone.app.getHeaderMenuSpaceElement();
    if (!el || el.querySelector("[data-yojitsu-678-shell]")) return;
    var d = document.createElement("div");
    d.setAttribute("data-yojitsu-678-shell", "1");
    d.textContent =
      "部署予実ダッシュ（" +
      BUILD +
      "） — 明細入力はアプリ " +
      APP_INPUT +
      " / 集計ウィジェット・677 API は次段で実装";
    d.style.padding = "8px 12px";
    d.style.marginBottom = "8px";
    d.style.background = "#f3f3f3";
    d.style.borderRadius = "4px";
    d.style.fontSize = "13px";
    el.appendChild(d);
  });
})();
