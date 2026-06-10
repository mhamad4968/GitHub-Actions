(function () {
  "use strict";

  /** 不適合管理台帳用DB — save/delete 全面ブロック（ダッシュ REST のみ） */
  var BUILD = "2026-06-10-nonconformance-db-block-ui";

  var BLOCK_EVENTS = [
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

  function blockMessage() {
    return (
      "このアプリ（不適合管理台帳用DB）の画面からの追加・保存・削除はできません。" +
      "登録・修正・削除は「不適合管理台帳」（ダッシュ）から行ってください。" +
      "（閲覧・目視確認のみ本アプリで可。）"
    );
  }

  kintone.events.on(BLOCK_EVENTS, function (event) {
    event.error = blockMessage();
    return event;
  });
})();
