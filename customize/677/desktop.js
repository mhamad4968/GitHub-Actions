(function () {
  "use strict";

  /** 監査・台帳照合用（リポ正本）。掲示板 UI は 678 が主。 */
  var BUILD = "2026-05-15-677-block-all-ui-mutations-dash678-only";

  /**
   * 部署予実 入力アプリ 677
   * BUILD: 2026-05-15-677-block-all-ui-mutations-dash678-only
   * - **2026-05-15 浜田 GO**: 本アプリ（677）の **標準 UI からの追加・保存・削除・プロセス進行（ステータス更新）は受け付けない**（`app.record.*.submit` / `*.delete.submit` / `*.process.proceed` 等で `event.error`。**PC＋モバイル**）。
   *   **入力・更新・削除の正**は **ダッシュボード（678）** からの `kintone.api`／REST のみ。閲覧・677 上のリンクは可。
   * - 新規・編集表示時: `monthly_breakdown` を **5月〜翌年4月の 12 行**に揃える（予算修正空は **0**）— **表示用のみ**（保存はブロック）
   * - `month_utilization` は CALC。サブテーブル行は **全列必須**のため、生成行にも `type: CALC` を置く（値はサーバ側で再計算）
   */

  var FC_MONTHLY = "monthly_breakdown";
  var FC_PAYMENT = "payment_breakdown";
  var FC_FISCAL = "fiscal_month";
  var FC_BUDGET = "month_budget";
  var FC_ACTUAL = "month_actual";
  var FC_REV = "month_budget_revision";
  var FC_UTIL = "month_utilization";
  var FC_PDATE = "payment_date";
  var FC_PAMT = "payment_amount";

  /** `月度` ラベル＝暦月（1〜12）。行順は 5月起点（`shin-format-excel-layout.md`） */
  var FISCAL_ORDER = ["5", "6", "7", "8", "9", "10", "11", "12", "1", "2", "3", "4"];

  function numCell(value) {
    return { type: "NUMBER", value: value === 0 || value === "0" ? "0" : value === "" || value == null ? "" : String(value) };
  }

  function textCell(value) {
    return { type: "SINGLE_LINE_TEXT", value: String(value) };
  }

  /** サブテーブル行に CALC 列が無いと kintone が「month_utilization が不正」と検証する */
  function calcUtilCell() {
    return { type: "CALC", value: "0" };
  }

  function blankRow(label) {
    var v = {};
    v[FC_FISCAL] = textCell(label);
    v[FC_BUDGET] = numCell("");
    v[FC_ACTUAL] = numCell("");
    v[FC_REV] = numCell("0");
    v[FC_UTIL] = calcUtilCell();
    return { value: v };
  }

  function ensureMonthlyUtilizationCell(row) {
    if (!row || !row.value) return;
    var u = row.value[FC_UTIL];
    if (!u || typeof u !== "object" || u.type !== "CALC") {
      row.value[FC_UTIL] = calcUtilCell();
      return;
    }
    if (u.value === undefined || u.value === null || u.value === "") {
      u.value = "0";
    }
  }

  function revisionOrZero(row) {
    if (!row || !row.value || !row.value[FC_REV]) return "0";
    var x = row.value[FC_REV].value;
    if (x === "" || x == null || x === undefined) return "0";
    return String(x);
  }

  function ensureMonthlyBreakdownForRecord(rec) {
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
    for (var t = 0; t < next.length; t++) {
      ensureMonthlyUtilizationCell(next[t]);
    }
    rec[FC_MONTHLY].value = next;
  }

  /** @param {string} s kintone DATE 'YYYY-MM-DD' */
  function parseYmd(s) {
    var p = String(s).trim().split(/[-/]/);
    if (p.length < 3) return null;
    var y = parseInt(p[0], 10);
    var mo = parseInt(p[1], 10) - 1;
    var d = parseInt(p[2], 10);
    if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
    return new Date(y, mo, d);
  }

  /** 支払日（暦月）→ 月度ラベル（'1'〜'12'）で合算し `month_actual` を上書き */
  function rollupPaymentsToMonthly(rec) {
    if (!rec || !rec[FC_MONTHLY] || !rec[FC_PAYMENT]) return;
    if (!Array.isArray(rec[FC_MONTHLY].value) || !Array.isArray(rec[FC_PAYMENT].value)) return;

    var sums = {};
    for (var a = 0; a < FISCAL_ORDER.length; a++) {
      sums[FISCAL_ORDER[a]] = 0;
    }

    var prow = rec[FC_PAYMENT].value;
    for (var i = 0; i < prow.length; i++) {
      var pr = prow[i];
      if (!pr || !pr.value) continue;
      var ds = pr.value[FC_PDATE] && pr.value[FC_PDATE].value;
      if (!ds) continue;
      var dt = parseYmd(ds);
      if (!dt || isNaN(dt.getTime())) continue;
      var calMonth = dt.getMonth() + 1;
      var lab = String(calMonth);
      if (sums[lab] === undefined) continue;

      var raw = pr.value[FC_PAMT] && pr.value[FC_PAMT].value;
      var n = parseFloat(String(raw));
      if (isNaN(n)) n = 0;
      sums[lab] += n;
    }

    var mrows = rec[FC_MONTHLY].value;
    for (var k = 0; k < mrows.length; k++) {
      var mr = mrows[k];
      if (!mr || !mr.value || !mr.value[FC_FISCAL]) continue;
      var fl = String(mr.value[FC_FISCAL].value || "").trim();
      if (sums[fl] === undefined) continue;
      if (!mr.value[FC_ACTUAL]) mr.value[FC_ACTUAL] = { type: "NUMBER", value: "" };
      var t = sums[fl];
      mr.value[FC_ACTUAL].value = t === 0 ? "" : String(t);
    }
  }

  /**
   * 678 ダッシュへ誘導（677 画面での追加・保存・削除・プロセス進行ブロック用）
   * 公式イベント一覧: https://kintone.dev/en/docs/kintone/js-api/events/event-handling/
   */
  var BLOCK677_UI_MUTATION_EVENTS = [
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

  function block677DirectMutationMessage() {
    var dash =
      typeof location !== "undefined" && location.origin
        ? location.origin + "/k/678/"
        : "/k/678/";
    return (
      "このアプリ（677）の画面からの追加・保存・削除・プロセス（ステータス更新）はできません。部署予実の入力・変更・削除はダッシュボード（アプリ 678）から行ってください。 " +
      dash +
      " （閲覧・確認のみは本アプリで可。表示順や実績の変更も 678 の表から行ってください。）"
    );
  }

  kintone.events.on(BLOCK677_UI_MUTATION_EVENTS, function (event) {
    event.error = block677DirectMutationMessage();
    return event;
  });

  kintone.events.on(["app.record.create.show", "app.record.edit.show"], function (event) {
    try {
      ensureMonthlyBreakdownForRecord(event.record);
    } catch (e) {
      console.error("[677] monthly_breakdown normalize", e);
    }
    return event;
  });
})();
