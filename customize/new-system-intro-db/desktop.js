(function () {
  "use strict";

  var BUILD = "2026-06-10-new-system-intro-db-block-ui";

  kintone.events.on(
    [
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
    ],
    function (event) {
      event.error =
        "このアプリ（新規システム導入ヒアリング用DB）からの追加・保存・削除はできません。" +
        "操作は「新規システム導入ヒアリング記録」（ダッシュ）から行ってください。";
      return event;
    },
  );
})();
