(function () {
  "use strict";

  /** Kintoneアカウント管理台帳用DB — save/delete 全面ブロック（台帳753 REST のみ） */
  var BUILD = "2026-07-05-kintone-account-db-block-v2-viewonly";

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
      "このアプリ（Kintoneアカウント管理台帳DB）は閲覧専用です。" +
      "画面からの追加・保存・削除はできません。" +
      "登録・修正・終了・契約数/月額の変更は「Kintoneアカウント管理台帳」（753）から行ってください。" +
      "（目視確認のみ本アプリで可。台帳からの REST・移行スクリプトは対象外。）"
    );
  }

  kintone.events.on(BLOCK_EVENTS, function (event) {
    event.error = blockMessage();
    return event;
  });
})();
