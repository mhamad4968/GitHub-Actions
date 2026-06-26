(function () {
  "use strict";

  /** JREクラウドアカウント管理台帳用DB — save/delete 全面ブロック */
  var BUILD = "2026-06-26-jre-cloud-account-db-block-v1";

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
      "このアプリ（JREクラウドアカウント管理台帳用DB）の画面からの追加・保存・削除はできません。" +
      "登録・修正・退職処理は「JREクラウドアカウント台帳」から行ってください。";
    return event;
  });
})();
