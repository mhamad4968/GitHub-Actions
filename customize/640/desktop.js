/**
 * 社内FAQDB（640）: ルックアップ「FAQカテゴリ」(category_lookup) → 641 の category_name を
 * ポータル連携用フィールド「カテゴリ」(category) に同期する。
 * fieldMappings が空のルックアップ向け（REST・画面の両方で category 文字列を揃える）。
 */
(function () {
  'use strict';

  var CATEGORY_MASTER_APP = 641;
  var LOOKUP = 'category_lookup';
  var CATEGORY = 'category';
  /** プロキシ・HTML ポータルは record_type = faq を前提に取得する */
  var RECORD_TYPE = 'record_type';
  var RT_FAQ = 'faq';

  kintone.events.on('app.record.create.show', function (event) {
    var rt = event.record[RECORD_TYPE];
    if (rt && (rt.value === '' || rt.value == null)) {
      rt.value = RT_FAQ;
    }
    return event;
  });

  function lookupId(rec) {
    var v = rec[LOOKUP] && rec[LOOKUP].value;
    if (v === '' || v == null) return null;
    var n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function fetchCategoryName(id) {
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
      app: CATEGORY_MASTER_APP,
      id: id,
    });
  }

  function applyNameToRecord(event, name) {
    if (!event.record[CATEGORY]) return event;
    event.record[CATEGORY].value = name || '';
    return event;
  }

  kintone.events.on(
    ['app.record.create.change.' + LOOKUP, 'app.record.edit.change.' + LOOKUP],
    function (event) {
      var id = lookupId(event.record);
      if (!id) {
        return applyNameToRecord(event, '');
      }
      return fetchCategoryName(id)
        .then(function (resp) {
          var nm =
            resp.record &&
            resp.record.category_name &&
            resp.record.category_name.value != null
              ? String(resp.record.category_name.value)
              : '';
          return applyNameToRecord(event, nm);
        })
        .catch(function (err) {
          console.warn('[640 FAQ] category_lookup → category 同期に失敗', err);
          return event;
        });
    },
  );

  kintone.events.on(['app.record.edit.show', 'app.record.create.show'], function (event) {
    var id = lookupId(event.record);
    if (!id) return event;
    return fetchCategoryName(id)
      .then(function (resp) {
        var nm =
          resp.record &&
          resp.record.category_name &&
          resp.record.category_name.value != null
            ? String(resp.record.category_name.value)
            : '';
        return applyNameToRecord(event, nm);
      })
      .catch(function (err) {
        console.warn('[640 FAQ] 初期表示時の category 同期に失敗', err);
        return event;
      });
  });
})();
