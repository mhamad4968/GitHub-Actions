(function () {
  "use strict";

  /**
   * 部署予実 ダッシュアプリ 678
   * BUILD: 2026-05-03-678-dashboard-milestone
   * - 677 明細を kintone.api で一覧（備考 `notes`・定額/変動枠の参照列・閲覧導線）
   * - 表示順（display_order）のみ 677 へ PUT（SPEC §6e・二重入力なし）
   * - 費用種別はクライアント側フィルタ（取得は直近30件のまま §6e 段階導入）
   */

  var APP_INPUT = 677;
  var BUILD = "2026-05-03-678-dashboard-milestone";
  /** 旧 Excel 旧フォーマットの合計行（移行スクリプトで除外済み） */
  var DASHBOARD_NOTE =
    "【備考】旧 Excel「旧フォーマット」の 50 行目は合計（総計）行のため、kintone 677 への初回移行ではレコード化していません。" +
    "明細は 47 件（摘要のある行のみ）。下表の「備考」列は 677 の備考フィールド（移行時の起票・出納セルメモ等）です。";
  /** v1 ダッシュは月次サブテーブル等は未表示。金額・月次の正は 677 のレコード画面で編集（§6e）。 */
  var USAGE_NOTE =
    "【利用上の注意】本画面は閲覧・表示順の更新用です。月次内訳・支払内訳は API で未取得のため表に出ません。" +
    "定額/変動の列はレコード直下の参照値のみです。編集が必要な場合は 677 の該当レコードを開いてください。";
  var FETCH_FIELDS = [
    "$id",
    "$revision",
    "Record_number",
    "work_type_name",
    "work_type_code",
    "cost_category",
    "summary_text",
    "partner_company",
    "learning_fixed_budget",
    "initial_variable_budget",
    "display_order",
    "notes",
  ];
  var QUERY = "order by $id desc limit 30";

  /** kintone.api の reject を画面向けに短く整形 */
  function formatApiError(e, jaPrefix) {
    var code = e && e.code ? String(e.code) : "";
    var msg = e && e.message != null ? String(e.message) : "";
    var id = e && e.id ? String(e.id) : "";
    var parts = [jaPrefix];
    if (code) parts.push("コード:" + code);
    if (id) parts.push("id:" + id);
    if (msg) parts.push(msg.slice(0, 420));
    var hint = "";
    if (msg.indexOf("GAIA") !== -1 || msg.indexOf("permission") !== -1) {
      hint = " ［ヒント: 677 の閲覧・編集権限とログイン状態を確認］";
    }
    if (code === "CB_NO02" || msg.indexOf("CB_NO02") !== -1) {
      hint = " ［ヒント: アプリ ID またはレコード ID が無効］";
    }
    if (code === "CB_VA01" || msg.indexOf("CB_VA01") !== -1 || msg.indexOf("revision") !== -1) {
      hint = " ［ヒント: 他ユーザーが更新した可能性 → 再読み込み］";
    }
    if (code === "GAIA_QU02" || msg.indexOf("limit") !== -1) {
      hint = " ［ヒント: API 回数制限に達した可能性 → しばらく待って再読み込み］";
    }
    return (parts.join(" · ") + hint).trim().slice(0, 920);
  }

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

  function attrEsc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/\n/g, " ");
  }

  function truncateNotes(s, maxLen) {
    var raw = String(s == null ? "" : s).trim();
    if (!raw) return { html: "<span style=\"color:#aaa\">—</span>", title: "" };
    var t = esc(raw);
    if (t.length <= maxLen) return { html: t, title: raw.slice(0, 800) };
    return { html: t.slice(0, maxLen) + "…", title: raw.slice(0, 800) };
  }

  /** cost_category が一致する行のみ（「すべて」はそのまま） */
  function filterRecordsByCostCategory(records, filterKey) {
    if (filterKey === "all") return records.slice();
    var out = [];
    for (var i = 0; i < records.length; i++) {
      if (fieldVal(records[i], "cost_category") === filterKey) out.push(records[i]);
    }
    return out;
  }

  function renderTable(records) {
    var rows = [];
    rows.push(
      "<thead><tr>" +
        "<th>レコード</th><th>工種</th><th>費用種別</th>" +
        "<th>定額/変動(枠)</th>" +
        "<th>摘要</th><th>会社</th>" +
        "<th>備考</th>" +
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
      var noteRaw = fieldVal(r, "notes");
      var notePart = truncateNotes(noteRaw, 120);
      var doVal = esc(fieldVal(r, "display_order"));
      var learn = esc(fieldVal(r, "learning_fixed_budget"));
      var initv = esc(fieldVal(r, "initial_variable_budget"));
      var titleAttr = notePart.title ? " title=\"" + attrEsc(notePart.title) + "\"" : "";
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
          "<td style=\"font-size:12px;color:#333;white-space:nowrap\">" +
          "定:" +
          (learn || "—") +
          "<br/>変:" +
          (initv || "—") +
          "</td>" +
          "<td>" +
          sum +
          "</td>" +
          "<td>" +
          esc(fieldVal(r, "partner_company")) +
          "</td>" +
          "<td style=\"max-width:14em;word-break:break-word;font-size:12px;color:#333\"" +
          titleAttr +
          ">" +
          notePart.html +
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
      rows.push('<tr><td colspan="8" style="color:#666">該当する行がありません（677 にデータが無い・権限外・またはフィルタ条件に一致なし）</td></tr>');
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

    var linksRow = document.createElement("div");
    linksRow.style.marginBottom = "8px";
    linksRow.style.fontSize = "12px";
    linksRow.style.lineHeight = "1.5";
    linksRow.style.color = "#333";
    linksRow.innerHTML =
      "<strong>リンク</strong> · " +
      "<a href=\"" +
      esc(location.origin + "/k/#/space/54/thread/58") +
      "\">スペース本件スレッド</a> · " +
      "<a href=\"" +
      esc(location.origin + "/k/" + kintone.app.getId() + "/") +
      "\">このダッシュ(678) 一覧</a>";
    wrap.appendChild(linksRow);

    var opsRow = document.createElement("div");
    opsRow.style.marginBottom = "8px";
    opsRow.style.fontSize = "12px";
    opsRow.style.padding = "6px 8px";
    opsRow.style.background = "#eef6ff";
    opsRow.style.border = "1px solid #c9daf8";
    opsRow.style.borderRadius = "4px";
    opsRow.style.color = "#1a3d66";
    opsRow.textContent =
      "【運用】表示順の保存は即時 677 に反映されます。他項目の変更は 677 のレコード画面で行い、必要なら本画面の「再読み込み」で最新化してください。";
    wrap.appendChild(opsRow);

    var filterRow = document.createElement("div");
    filterRow.style.marginBottom = "8px";
    filterRow.style.display = "flex";
    filterRow.style.flexWrap = "wrap";
    filterRow.style.alignItems = "center";
    filterRow.style.gap = "6px 8px";
    filterRow.innerHTML =
      "<span style=\"color:#555;font-size:12px\">費用種別（直近30件のうち）:</span>" +
      "<button type=\"button\" class=\"y678-filter\" data-y678-filter=\"all\" style=\"font-size:12px;cursor:pointer\">すべて</button>" +
      "<button type=\"button\" class=\"y678-filter\" data-y678-filter=\"固定費\" style=\"font-size:12px;cursor:pointer\">固定費</button>" +
      "<button type=\"button\" class=\"y678-filter\" data-y678-filter=\"変動費\" style=\"font-size:12px;cursor:pointer\">変動費</button>" +
      "<button type=\"button\" class=\"y678-filter\" data-y678-filter=\"その他\" style=\"font-size:12px;cursor:pointer\">その他</button>";
    wrap.appendChild(filterRow);

    var noteBox = document.createElement("div");
    noteBox.setAttribute("data-y678-dashboard-note", "1");
    noteBox.style.marginBottom = "10px";
    noteBox.style.padding = "8px 10px";
    noteBox.style.background = "#fffbea";
    noteBox.style.border = "1px solid #e8dc9a";
    noteBox.style.borderRadius = "4px";
    noteBox.style.fontSize = "12px";
    noteBox.style.lineHeight = "1.45";
    noteBox.style.color = "#4a4020";
    noteBox.textContent = DASHBOARD_NOTE;
    wrap.appendChild(noteBox);

    var usageBox = document.createElement("div");
    usageBox.setAttribute("data-y678-usage-note", "1");
    usageBox.style.marginBottom = "10px";
    usageBox.style.padding = "8px 10px";
    usageBox.style.background = "#f5f5f5";
    usageBox.style.border = "1px solid #ddd";
    usageBox.style.borderRadius = "4px";
    usageBox.style.fontSize = "12px";
    usageBox.style.lineHeight = "1.45";
    usageBox.style.color = "#333";
    usageBox.textContent = USAGE_NOTE;
    wrap.appendChild(usageBox);

    var status = document.createElement("div");
    status.style.marginBottom = "6px";
    status.style.color = "#555";
    status.textContent = "677 から明細を読み込み中…";
    wrap.appendChild(status);

    var tblHost = document.createElement("div");
    tblHost.style.overflowX = "auto";
    wrap.appendChild(tblHost);

    el.appendChild(wrap);

    var lastRawRecords = [];
    var lastTotalCount = 0;
    var currentCostFilter = "all";

    function setFilterButtonsActive() {
      var btns = filterRow.querySelectorAll(".y678-filter");
      for (var b = 0; b < btns.length; b++) {
        var fk = btns[b].getAttribute("data-y678-filter");
        if (fk === currentCostFilter) {
          btns[b].style.fontWeight = "700";
          btns[b].style.textDecoration = "underline";
        } else {
          btns[b].style.fontWeight = "";
          btns[b].style.textDecoration = "";
        }
      }
    }

    function paintTable(filtered) {
      tblHost.innerHTML = "";
      var t = document.createElement("table");
      t.style.width = "100%";
      t.style.borderCollapse = "collapse";
      t.style.background = "#fff";
      t.innerHTML = renderTable(filtered);
      styleTable(t);
      tblHost.appendChild(t);
    }

    function updateStatusLine() {
      var filtered = filterRecordsByCostCategory(lastRawRecords, currentCostFilter);
      var total = lastTotalCount || lastRawRecords.length;
      var base =
        "入力アプリ 677: 全 " +
        total +
        " 件 · API取得 " +
        lastRawRecords.length +
        " 件（新しい順・最大30）";
      if (currentCostFilter !== "all") {
        base += " · フィルタ後 " + filtered.length + " 件（" + String(currentCostFilter) + "）";
      }
      base += " · 表示順はここから 677 に保存可";
      status.style.color = "#555";
      status.textContent = base;
      setFilterButtonsActive();
    }

    function applyFilterAndRedraw() {
      var filtered = filterRecordsByCostCategory(lastRawRecords, currentCostFilter);
      updateStatusLine();
      paintTable(filtered);
    }

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
          lastRawRecords = list;
          lastTotalCount = resp && typeof resp.totalCount === "number" ? resp.totalCount : list.length;
          applyFilterAndRedraw();
        })
        .catch(function (e) {
          lastRawRecords = [];
          lastTotalCount = 0;
          status.style.color = "#b00020";
          status.textContent = formatApiError(e, "677 の一覧取得に失敗しました。");
        });
    }

    function doneEnable(btn) {
      btn.disabled = false;
    }

    tblHost.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest && ev.target.closest(".y678-display-order-save");
      if (!btn) return;
      var td = btn.closest("td");
      if (!td || !td.getAttribute) return;
      var rid = td.getAttribute("data-y678-id");
      var rev = td.getAttribute("data-y678-rev");
      var inp = td.querySelector(".y678-display-order-input");
      if (!rid || !inp) return;
      if (rev === "") {
        status.style.color = "#b00020";
        status.textContent =
          "レコードのリビジョンが取得できません。再読み込みしてから保存してください。（677 のフィールド取得権限も確認）";
        return;
      }
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
          status.textContent = formatApiError(e, "表示順の保存に失敗しました。");
        })
        .then(
          function () {
            doneEnable(btn);
          },
          function () {
            doneEnable(btn);
          }
        );
    });

    var refreshBtn = head.querySelector("#y678-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        load();
      });
    }

    filterRow.addEventListener("click", function (ev) {
      var fb = ev.target && ev.target.closest && ev.target.closest(".y678-filter");
      if (!fb) return;
      var fk = fb.getAttribute("data-y678-filter");
      if (!fk) return;
      currentCostFilter = fk;
      if (lastRawRecords.length) applyFilterAndRedraw();
      else setFilterButtonsActive();
    });

    load();
  }

  kintone.events.on("app.record.index.show", function () {
    mount();
  });
})();
