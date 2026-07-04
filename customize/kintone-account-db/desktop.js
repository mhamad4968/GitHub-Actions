(function () {
  "use strict";

  /** Kintoneアカウント管理台帳用DB — save/delete 全面ブロック */
  var BUILD = "2026-07-05-kintone-account-db-block-v1";

  var BLOCK_EVENTS = [
    "app.record.create.submit",
    "app.record.edit.submit",
    "app.record.index.edit.submit",
    "app.record.detail.delete.submit",
    "app.record.index.delete.submit",
    "mobile.app.record.create.submit",
    "mobile.app.record.edit.submit",
    "mobile.app.record.detail.delete.submit",
  ];

  kintone.events.on(BLOCK_EVENTS, function (event) {
    event.error =
      "このアプリ（Kintoneアカウント管理台帳DB）の画面からの追加・保存・削除はできません。" +
      "登録・修正・終了処理は「Kintoneアカウント管理台帳」から行ってください。";
    return event;
  });
})();
