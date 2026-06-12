(function () {
  'use strict';

  /** 新⑤ 713 — 年次レコード画面はガイド(699)へ誘導 */
  var BUILD = '2026-06-13-bi-annual-redirect-guide';

  kintone.events.on(['app.record.detail.show', 'app.record.edit.show'], function (event) {
    if (window.BiAnnualPanel && window.BiAnnualPanel.mountRecordRedirect) {
      return window.BiAnnualPanel.mountRecordRedirect(event);
    }
    return event;
  });
})();
