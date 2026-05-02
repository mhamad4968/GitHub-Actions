(function () {
  "use strict";

  /**
   * 部署予実 ダッシュアプリ 678
   * BUILD: 2026-05-02-678-dashboard-677-read
   * - 一覧ヘッダ: 677 明細の直近レコードを kintone.api で取得して表表示（閲覧・導線）
   * - 書き込みは次段（SPEC §6e・段階導入）
   */

  var APP_INPUT = 677;
  var BUILD = "2026-05-02-678-dashboard-677-read";
  /** @type {string[]} 677 本番フォームに存在するフィールドコードのみ */
  var FETCH_FIELDS = [
    "$id",
    "Record_number",
    "work_type_name",
    "work_type_code",
    "cost_category",
    "summary_text",
    "partner_company",
    "display_order",
  ];
  var QUERY = "order by $id desc limit 30";

  function esc(s) {
    if (s == null || s === "") return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fieldVal(rec, code) {
    if (!rec || !rec[code]) return "";
    var v = rec[code].value;
    return v == null ? "" : v;
  }

  function recordShowHref(id) {
    return location.origin + "/k/" + APP_INPUT + "/show#record=" + encodeURIComponent(String(id)) + "&mode=show";
  }

  function renderTable(records) {
    var rows = [];
    rows.push(
      "<thead><tr>" +
        "<th>レコード</th><th>工種</th><th>費用種別</th><th>摘要</th><th>会社</th>" +
        "</tr></thead><tbody>"
    );
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var id = fieldVal(r, "$id");
      var wt =
        esc(fieldVal(r, "work_type_name")) +
        (fieldVal(r, "work_type_code") ? " <span style=\"color:#666\">(" + esc(fieldVal(r, "work_type_code")) + ")</span>" : "");
      var sum = esc(fieldVal(r, "summary_text"));
      if (sum.length > 80) sum = sum.slice(0, 80) + "…";
      rows.push(
        "<tr>" +
          "<td><a href=\"" +
          esc(recordShowHref(id)) +
          "\">#" +
          esc(fieldVal(r, "Record_number") || id) +
          "</a></td>" +
          "<td>" +
          wt +
          "</td>" +
          "<td>" +
          esc(fieldVal(r, "cost_category")) +
          "</td>" +
          "<td>" +
          sum +
          "</td>" +
          "<td>" +
          esc(fieldVal(r, "partner_company")) +
          "</td>" +
          "</tr>"
      );
    }
    if (!records.length) {
      rows.push('<tr><td colspan="5" style="color:#666">677 にレコードがありません（または権限外）</td></tr>');
    }
    rows.push("</tbody>");
    return rows.join("");
  }

  function mount(root) {
    var el = kintone.app.getHeaderMenuSpaceElement();
    if (!el || el.querySelector("[data-yojitsu-678-shell]")) return;

    var wrap = document.createElement("div");
    wrap.setAttribute("data-yojitsu-678-shell", "1");
    wrap.style.padding = "10px 12px";
    wrap.style.marginBottom = "10px";
    wrap.style.background = "#f7f9fc";
    wrap.style.border = "1px solid #e3e7ef";
    wrap.style.borderRadius = "6px";
    wrap.style.fontSize = "13px";

    var head = document.createElement("div");
    head.style.marginBottom = "8px";
    head.style.display = "flex";
    head.style.flexWrap = "wrap";
    head.style.alignItems = "center";
    head.style.gap = "8px 12px";
    head.innerHTML =
      "<strong>部署予実ダッシュ</strong> <span style=\"color:#666\">" +
      esc(BUILD) +
      "</span> · " +
      "<a href=\"" +
      esc(location.origin + "/k/" + APP_INPUT + "/") +
      "\">677 一覧</a> · " +
      "<a href=\"" +
      esc(location.origin + "/k/" + APP_INPUT + "/edit") +
      "\">677 で新規</a>";
    wrap.appendChild(head);

    var status = document.createElement("div");
    status.style.marginBottom = "6px";
    status.style.color = "#555";
    status.textContent = "677 から明細を読み込み中…";
    wrap.appendChild(status);

    var tblHost = document.createElement("div");
    tblHost.style.overflowX = "auto";
    wrap.appendChild(tblHost);

    el.appendChild(wrap);

    kintone
      .api(kintone.api.url.get("/k/v1/records.json", true), "GET", {
        app: APP_INPUT,
        query: QUERY,
        fields: FETCH_FIELDS,
        totalCount: true,
      })
      .then(function (resp) {
        var list = (resp && resp.records) || [];
        var total = resp && typeof resp.totalCount === "number" ? resp.totalCount : list.length;
        status.textContent = "入力アプリ 677: 全 " + total + " 件 · 表示 " + list.length + " 件（新しい順・最大30）";
        var t = document.createElement("table");
        t.style.width = "100%";
        t.style.borderCollapse = "collapse";
        t.style.background = "#fff";
        t.innerHTML = renderTable(list);
        var thtd = t.querySelectorAll("th,td");
        for (var j = 0; j < thtd.length; j++) {
          thtd[j].style.border = "1px solid #ddd";
          thtd[j].style.padding = "6px 8px";
          thtd[j].style.textAlign = "left";
          thtd[j].style.verticalAlign = "top";
        }
        var ths = t.querySelectorAll("th");
        for (var k = 0; k < ths.length; k++) {
          ths[k].style.background = "#eef1f6";
          ths[k].style.fontWeight = "600";
        }
        tblHost.appendChild(t);
      })
      .catch(function (e) {
        status.style.color = "#b00020";
        status.textContent =
          "677 のレコード取得に失敗しました（権限・ログイン・フィールドコードを確認）。 " +
          (e && e.message ? String(e.message) : "");
      });
  }

  kintone.events.on("app.record.index.show", function () {
    mount();
  });
})();
