/**
 * FAQ カテゴリマスタ（641）: 階層（親／子／孫）に応じた入力チェックと、
 * 「カテゴリ名」(category_name) の自動組み立て（640 のルックアップ・ポータル表示用）。
 */
(function () {
  'use strict';

  var LEVEL = { 親: '親', 子: '子', 孫: '孫' };
  var F = {
    level: 'level_type',
    parent: 'parent_cat_0',
    child: 'child_cat',
    grandchild: 'grandchild_cat',
    name: 'category_name',
  };

  function val(rec, code) {
    var f = rec[code];
    if (!f || f.value == null) return '';
    return String(f.value).trim();
  }

  function buildCategoryName(rec) {
    var level = val(rec, F.level) || LEVEL.親;
    var p = val(rec, F.parent);
    var c = val(rec, F.child);
    var g = val(rec, F.grandchild);
    if (level === LEVEL.親) return p;
    if (level === LEVEL.子) return [p, c].filter(Boolean).join(' > ');
    if (level === LEVEL.孫) return [p, c, g].filter(Boolean).join(' > ');
    return [p, c, g].filter(Boolean).join(' > ');
  }

  function validate(rec) {
    var level = val(rec, F.level) || LEVEL.親;
    var p = val(rec, F.parent);
    var c = val(rec, F.child);
    var g = val(rec, F.grandchild);
    if (level === LEVEL.親) {
      if (!p) {
        return { ok: false, msg: '階層が「親」のときは「カテゴリ（親）」を入力してください。' };
      }
      return { ok: true };
    }
    if (level === LEVEL.子) {
      if (!p || !c) {
        return {
          ok: false,
          msg: '階層が「子」のときは「カテゴリ（親）」と「カテゴリ（子）」を入力してください。',
        };
      }
      return { ok: true };
    }
    if (level === LEVEL.孫) {
      if (!p || !c || !g) {
        return {
          ok: false,
          msg: '階層が「孫」のときは親・子・孫のカテゴリをすべて入力してください。',
        };
      }
      return { ok: true };
    }
    return { ok: true };
  }

  kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], function (event) {
    var v = validate(event.record);
    if (!v.ok) {
      event.error = v.msg;
      return event;
    }
    if (event.record[F.name]) {
      event.record[F.name].value = buildCategoryName(event.record);
    }
    return event;
  });
})();
