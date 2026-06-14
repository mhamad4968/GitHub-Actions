(function () {
  "use strict";

  /** 記憶媒体等台帳DB — save/delete 全面ブロック（Dash REST のみ） */
  var BUILD = "2026-06-14-storage-media-ledger-db-block-ui-mutations";

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
      "このアプリ（記憶媒体等台帳DB）の画面からの追加・保存・削除はできません。" +
      "登録・修正・廃止・削除は「記憶媒体等管理台帳ver.1」から行ってください。" +
      "（閲覧・目視確認のみ本アプリで可。移行スクリプトは REST のため対象外。）"
    );
  }

  kintone.events.on(BLOCK_EVENTS, function (event) {
    event.error = blockMessage();
    return event;
  });
})();
