(function () {
  "use strict";

  var BUILD = "2026-07-21-ver02-phase6-app3-readonly-guard";

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
      "このアプリ（実行予算ver02_実績）は直接編集できません。" +
      "正規接点は「実行予算書作成支援ツールver02」のカスタムUIのみです。" +
      "直接保存・削除不可です。"
    );
  }

  kintone.events.on(BLOCK_EVENTS, function (event) {
    void BUILD;
    event.error = blockMessage();
    return event;
  });
})();
