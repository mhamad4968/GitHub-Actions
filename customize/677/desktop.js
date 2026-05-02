(function () {
  "use strict";

  /**
   * 部署予実 入力アプリ 677
   * BUILD: 2026-05-02-677-monthly-breakdown-12rows
   * - 新規・編集画面表示時: 月次内訳 `monthly_breakdown` を **年度 12 ヶ月（5月〜翌年4月）**で揃える
   * - 既存行は `月度`（fiscal_month）一致で保持（数値・id）。欠け月は補完。予算修正必須のため空は **0**
   * - `month_utilization` は CALC のため触らない
   */

  var FC_MONTHLY = "monthly_breakdown";
  var FC_FISCAL = "fiscal_month";
  var FC_BUDGET = "month_budget";
  var FC_ACTUAL = "month_actual";
  var FC_REV = "month_budget_revision";

  /** 行3 月名と同順（`shin-format-excel-layout.md`・マスタ案） */
  var FISCAL_ORDER = ["5", "6", "7", "8", "9", "10", "11", "12", "1", "2", "3", "4"];

  function numCell(value) {
    return { type: "NUMBER", value: value === 0 || value === "0" ? "0" : value === "" || value == null ? "" : String(value) };
  }

  function textCell(value) {
    return { type: "SINGLE_LINE_TEXT", value: String(value) };
  }

  function blankRow(label) {
    var v = {};
    v[FC_FISCAL] = textCell(label);
    v[FC_BUDGET] = numCell("");
    v[FC_ACTUAL] = numCell("");
    v[FC_REV] = numCell("0");
    return { value: v };
  }

  function revisionOrZero(row) {
    if (!row || !row.value || !row.value[FC_REV]) return "0";
    var x = row.value[FC_REV].value;
    if (x === "" || x == null || x === undefined) return "0";
    return String(x);
  }

  function ensureMonthlyBreakdown(event) {
    var rec = event.record;
    if (!rec || !rec[FC_MONTHLY] || !Array.isArray(rec[FC_MONTHLY].value)) return;

    var rows = rec[FC_MONTHLY].value;
    var byLabel = {};
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!row || !row.value || !row.value[FC_FISCAL]) continue;
      var lab = String(row.value[FC_FISCAL].value || "").trim();
      if (!lab) continue;
      if (byLabel[lab] == null) byLabel[lab] = row;
    }

    var next = [];
    for (var j = 0; j < FISCAL_ORDER.length; j++) {
      var label = FISCAL_ORDER[j];
      var hit = byLabel[label];
      if (hit) {
        if (!hit.value[FC_REV]) hit.value[FC_REV] = numCell("0");
        hit.value[FC_REV].value = revisionOrZero(hit);
        next.push(hit);
      } else {
        next.push(blankRow(label));
      }
    }
    rec[FC_MONTHLY].value = next;
  }

  kintone.events.on(["app.record.create.show", "app.record.edit.show"], function (event) {
    try {
      ensureMonthlyBreakdown(event);
    } catch (e) {
      console.error("[677] monthly_breakdown normalize", e);
    }
    return event;
  });
})();
