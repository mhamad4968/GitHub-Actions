(function () {
  "use strict";

  /**
   * 部署予実 ダッシュアプリ 678
   * BUILD: 2026-05-02-678-dashboard-display-order-put
   * - 677 明細を kintone.api で一覧（閲覧・導線）
   * - 表示順（display_order）のみ 677 へ PUT（SPEC §6e・段階導入の頻出操作）
   */

  var APP_INPUT = 677;
  var BUILD = "2026-05-02-678-dashboard-display-order-put";
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

  function revisionOf(rec) {
    if (!rec || !rec.$revision || rec.$revision.value == null) return "";
    return String(rec.$revision.value);
  }

  function recordShowHref(id) {
    return location.origin + "/k/" + APP_INPUT + "/show#record=" + encodeURIComponent(String(id)) + "&mode=show";
  }

  function renderTable(records) {
    var rows = [];
    rows.push(
      "<thead><tr>" +
        "<th>レコード</th><th>工種</th><th>費用種別</th><th>摘要</th><th>会社</th>" +
        "<th>表示順</th>" +
        "</tr></thead><tbody>"
    );
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var id = fieldVal(r, "$id");
      var rev = revisionOf(r);
      var wt =
        esc(fieldVal(r, "work_type_name")) +
        (fieldVal(r, "work_type_code") ? " <span style=\"color:#666\">(" + esc(fieldVal(r, "work_type_code")) + ")</span>" : "");
      var sum = esc(fieldVal(r, "summary_text"));
      if (sum.length > 80) sum = sum.slice(0, 80) + "…";
      var doVal = esc(fieldVal(r, "display_order"));
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
          "<td data-y678-id=\"" +
          esc(id) +
          "\" data-y678-rev=\"" +
          esc(rev) +
          "\">" +
          "<input type=\"number\" class=\"y678-display-order-input\" style=\"width:5em;padding:2px 4px\" value=\"" +
          doVal +
          "\" step=\"any\" />" +
          " <button type=\"button\" class=\"y678-display-order-save\" style=\"font-size:12px\">保存</button>" +
          "</td>" +
          "</tr>"
      );
    }
    if (!records.length) {
      rows.push('<tr><td colspan="6" style="color:#666">677 にレコードがありません（または権限外）</td></tr>');
    }
    rows.push("</tbody>");
    return rows.join("");
  }

  function styleTable(t) {
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
  }

  function mount() {
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
      "\">677 で新規</a> · " +
      "<button type=\"button\" id=\"y678-refresh\" style=\"font-size:12px;cursor:pointer\">再読み込み</button>";
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

    function load() {
      status.style.color = "#555";
      status.textContent = "677 から明細を読み込み中…";
      tblHost.innerHTML = "";
      return kintone
        .api(kintone.api.url.get("/k/v1/records.json", true), "GET", {
          app: APP_INPUT,
          query: QUERY,
          fields: FETCH_FIELDS,
          totalCount: true,
        })
        .then(function (resp) {
          var list = (resp && resp.records) || [];
          var total = resp && typeof resp.totalCount === "number" ? resp.totalCount : list.length;
          status.textContent =
            "入力アプリ 677: 全 " + total + " 件 · 表示 " + list.length + " 件（新しい順・最大30）· 表示順はここから 677 に保存可";
          var t = document.createElement("table");
          t.style.width = "100%";
          t.style.borderCollapse = "collapse";
          t.style.background = "#fff";
          t.innerHTML = renderTable(list);
          styleTable(t);
          tblHost.appendChild(t);
        })
        .catch(function (e) {
          status.style.color = "#b00020";
          status.textContent =
            "677 のレコード取得に失敗しました（権限・ログイン・フィールドコードを確認）。 " +
            (e && e.message ? String(e.message) : "");
        });
    }

    tblHost.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest && ev.target.closest(".y678-display-order-save");
      if (!btn) return;
      var td = btn.closest("td");
      if (!td || !td.getAttribute) return;
      var rid = td.getAttribute("data-y678-id");
      var rev = td.getAttribute("data-y678-rev");
      var inp = td.querySelector(".y678-display-order-input");
      if (!rid || rev === "" || !inp) return;
      var raw = inp.value;
      var numVal = raw === "" ? null : Number(raw);
      if (raw !== "" && (typeof numVal !== "number" || isNaN(numVal))) {
        status.style.color = "#b00020";
        status.textContent = "表示順は数値または空欄にしてください。";
        return;
      }
      btn.disabled = true;
      status.style.color = "#555";
      status.textContent = "表示順を保存中…（レコード #" + rid + "）";
      var body = {
        app: APP_INPUT,
        id: rid,
        revision: rev,
        record: {},
      };
      if (raw === "") {
        body.record.display_order = { value: "" };
      } else {
        body.record.display_order = { value: String(numVal) };
      }
      kintone
        .api(kintone.api.url.put("/k/v1/record.json", true), "PUT", body)
        .then(function () {
          status.style.color = "#0a6b0a";
          status.textContent = "表示順を保存しました。一覧を更新します。";
          return load();
        })
        .catch(function (e) {
          status.style.color = "#b00020";
          var msg = e && e.message ? String(e.message) : "";
          if (msg.indexOf("CB_VA01") !== -1 || msg.indexOf("revision") !== -1) {
            status.textContent =
              "保存できませんでした（他で更新された可能性）。再読み込みしてからやり直してください。 " + msg;
          } else {
            status.textContent = "保存に失敗しました。 " + msg;
          }
        })
        .finally(function () {
          btn.disabled = false;
        });
    });

    var refreshBtn = head.querySelector("#y678-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        load();
      });
    }

    load();
  }

  kintone.events.on("app.record.index.show", function () {
    mount();
  });
})();
