(function () {
  "use strict";

  /**
   * JRE-C_Hubアカウント管理台帳用DB — 強ロック（2026-08-21）
   * - 画面からの新規・編集・保存・削除・プロセス進行を拒否（admin含む）
   * - 日常は無人。不具合時のみ AI が REST／スクリプトで更新（本 customize は UI イベントのみ）
   * - 正の操作入口は App 747 台帳
   */
  var BUILD = "2026-08-21-jre-chub-account-db-block-v2-strong";

  var BLOCK_SUBMIT = [
    "app.record.create.submit",
    "app.record.edit.submit",
    "app.record.index.edit.submit",
    "app.record.detail.delete.submit",
    "app.record.index.delete.submit",
    "app.record.detail.process.proceed",
    "mobile.app.record.create.submit",
    "mobile.app.record.edit.submit",
    "mobile.app.record.detail.delete.submit",
    "mobile.app.record.detail.process.proceed",
  ];

  var BLOCK_OPEN = [
    "app.record.create.show",
    "app.record.edit.show",
    "app.record.index.edit.show",
    "mobile.app.record.create.show",
    "mobile.app.record.edit.show",
  ];

  function blockMessage() {
    return (
      "このアプリ（JRE-C_Hubアカウント管理台帳用DB）は画面から操作できません（管理者も不可）。" +
      "登録・修正・利用終了／再開は「JRE-C_Hubアカウント台帳」から行ってください。" +
      "（不具合対応時の REST／スクリプトは対象外。）"
    );
  }

  function disableAllFields(event) {
    var rec = event.record || {};
    Object.keys(rec).forEach(function (code) {
      if (rec[code] && typeof rec[code] === "object") {
        rec[code].disabled = true;
      }
    });
  }

  function hideMutationUi() {
    var cssId = "jca-db-strong-lock-css";
    if (document.getElementById(cssId)) return;
    var st = document.createElement("style");
    st.id = cssId;
    st.textContent =
      ".gaia-argoui-app-menu-add," +
      ".gaia-argoui-app-toolbar-menu-add," +
      ".gaia-argoui-app-menu-edit," +
      ".gaia-argoui-app-menu-remove," +
      ".recordlist-edit-gaia," +
      ".recordlist-remove-gaia," +
      ".gaia-argoui-app-toolbar .gaia-argoui-app-menu," +
      "button.gaia-ui-actionmenu-save," +
      "button.gaia-ui-actionmenu-cancel," +
      ".gaia-argoui-app-edit," +
      ".gaia-argoui-app-remove{display:none!important;}";
    document.head.appendChild(st);
  }

  kintone.events.on(BLOCK_SUBMIT, function (event) {
    event.error = blockMessage();
    return event;
  });

  kintone.events.on(BLOCK_OPEN, function (event) {
    event.error = blockMessage();
    try {
      var appId = kintone.app.getId();
      var hash = location.hash || "";
      if (hash.indexOf("edit") >= 0 || hash.indexOf("show") >= 0 || /\/edit\b/.test(location.pathname)) {
        setTimeout(function () {
          location.href = "/k/" + appId + "/";
        }, 50);
      }
    } catch (e) {
      console.warn(BUILD, e);
    }
    return event;
  });

  kintone.events.on(
    [
      "app.record.detail.show",
      "app.record.index.show",
      "mobile.app.record.detail.show",
      "mobile.app.record.index.show",
    ],
    function (event) {
      hideMutationUi();
      if (event && event.record) disableAllFields(event);
      return event;
    }
  );
})();
