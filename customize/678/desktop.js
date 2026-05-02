(function () {
  "use strict";

  /**
   * 部署予実 ダッシュアプリ 678
   * BUILD: 2026-05-04-678-api-url-fix
   * - 677 を kintone.api で一覧。左キー列は `shin-format-excel-layout.md` 新フォーマット準拠＋12 月×四つ柱（`monthly_breakdown`）
   * - 表示順（display_order）のみ 677 へ PUT（SPEC §6e）
   * - 677 取得: タイムアウト・描画 try/catch・月次サブテーブル取得失敗時は左ブロックのみにフォールバック
   */

  var APP_INPUT = 677;
  var BUILD = "2026-05-04-678-api-url-fix";
  /** 月次列を省略（677 API が `monthly_breakdown` を返せない場合のフォールバック） */
  var y678OmitMonthlyCols = false;
  /** 暦月ラベル（677 の `月度` と同一・5月〜翌年4月） */
  var FISCAL_ORDER = ["5", "6", "7", "8", "9", "10", "11", "12", "1", "2", "3", "4"];
  /** ヘッダ表示用 */
  var FISCAL_HEAD = {
    "5": "5月",
    "6": "6月",
    "7": "7月",
    "8": "8月",
    "9": "9月",
    "10": "10月",
    "11": "11月",
    "12": "12月",
    "1": "1月",
    "2": "2月",
    "3": "3月",
    "4": "4月",
  };

  var KEY_COL_COUNT = 10;
  var MONTH_COLS = 4;

  var DASHBOARD_NOTE =
    "【備考】旧 Excel「旧フォーマット」の 50 行目は合計（総計）行のため、kintone 677 への初回移行ではレコード化していません。" +
    "明細は 47 件（摘要のある行のみ）。下表の「備考」列は 677 の備考フィールド（移行時の起票・出納セルメモ等）です。";
  var USAGE_NOTE =
    "【利用上の注意】月次の数値は 677 の「月次内訳」サブテーブルを表示しています（閲覧中心）。編集・支払内訳の追加は 677 のレコード画面から行い、保存後に本画面を再読み込みしてください。" +
    "消費率は 677 の計算フィールド値を表示しています。";

  var FETCH_FIELDS = [
    "$id",
    "$revision",
    "work_type_name",
    "work_type_code",
    "cost_category",
    "summary_text",
    "partner_company",
    "learning_fixed_budget",
    "initial_variable_budget",
    "monthly_breakdown",
    "display_order",
    "notes",
  ];
  /** `monthly_breakdown` なし（API エラー時の再試行用） */
  var FETCH_FIELDS_NO_MONTHLY = FETCH_FIELDS.filter(function (c) {
    return c !== "monthly_breakdown";
  });
  var QUERY = "order by $id desc limit 100";

  function apiWithTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject({ code: "Y678_TIMEOUT", message: "677 への一覧取得が " + ms / 1000 + " 秒を超えました。ネットワーク・プロキシ・権限を確認してください。" });
        }, ms);
      }),
    ]);
  }

  function isRetriable677FieldError(e) {
    var m = e && e.message != null ? String(e.message) : "";
    var c = e && e.code ? String(e.code) : "";
    if (c === "Y678_TIMEOUT") return false;
    if (c === "CB_IL02" || m.indexOf("CB_IL02") !== -1) return true;
    if (m.indexOf("GAIA_IL02") !== -1) return true;
    if (m.indexOf("不正なフィールド") !== -1) return true;
    if (m.indexOf("Invalid field") !== -1) return true;
    return false;
  }

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
    if (code === "Y678_TIMEOUT" || msg.indexOf("秒を超えました") !== -1) {
      hint = " ［ヒント: 再読み込み・別ブラウザ・プロキシ設定を確認］";
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

  function subCellVal(rowVal, code) {
    if (!rowVal || !rowVal[code]) return "";
    var v = rowVal[code].value;
    return v == null ? "" : v;
  }

  /** 677 の月度ラベルを FISCAL_ORDER のキー（"5"…"4"）に寄せる */
  function normalizeFiscalMonthLabel(s) {
    var t = String(s == null ? "" : s).trim();
    if (!t) return "";
    if (/^\d+$/.test(t)) return String(parseInt(t, 10));
    return t;
  }

  /** 月度ラベル → 月次行の表示用マップ */
  function monthlyMapFromRecord(rec) {
    var map = {};
    var tbl = rec && rec.monthly_breakdown && rec.monthly_breakdown.value;
    if (!Array.isArray(tbl)) return map;
    for (var i = 0; i < tbl.length; i++) {
      var row = tbl[i] && tbl[i].value;
      if (!row || !row.fiscal_month) continue;
      var lab = normalizeFiscalMonthLabel(subCellVal(row, "fiscal_month"));
      if (!lab) continue;
      map[lab] = {
        budget: subCellVal(row, "month_budget"),
        actual: subCellVal(row, "month_actual"),
        revision: subCellVal(row, "month_budget_revision"),
        utilization: subCellVal(row, "month_utilization"),
      };
    }
    return map;
  }

  /**
   * 一覧にダッシュを載せる親ノード（UI 世代差で API が異なるため複数候補）
   * @returns {{ parent: HTMLElement, before: HTMLElement|null }|null}
   */
  function resolve678MountHost() {
    var slot = null;
    try {
      if (kintone.app && kintone.app.record && typeof kintone.app.record.getHeaderMenuSpaceElement === "function") {
        slot = kintone.app.record.getHeaderMenuSpaceElement();
      }
    } catch (e0) {}
    if (!slot) {
      try {
        if (kintone.app && typeof kintone.app.getHeaderMenuSpaceElement === "function") {
          slot = kintone.app.getHeaderMenuSpaceElement();
        }
      } catch (e1) {}
    }
    if (slot) return { parent: slot, before: null };

    try {
      if (kintone.app && typeof kintone.app.getHeaderSpaceElement === "function") {
        var hs = kintone.app.getHeaderSpaceElement();
        if (hs) return { parent: hs, before: null };
      }
    } catch (e2) {}

    var ocean = document.querySelector(".ocean-ui-app-index-head");
    if (ocean) return { parent: ocean, before: ocean.firstChild };

    var idxHead = document.querySelector(".gaia-argoui-app-index-head");
    if (idxHead) return { parent: idxHead, before: idxHead.firstChild };

    var rl = document.querySelector(".recordlist-gaia");
    if (rl && rl.parentNode) return { parent: rl.parentNode, before: rl };

    var layout = document.querySelector("#contents-body .layout-gaia");
    if (layout) return { parent: layout, before: layout.firstChild };

    return null;
  }

  function attach678Shell(dest, wrap) {
    if (!dest || !dest.parent) return false;
    if (dest.before) dest.parent.insertBefore(wrap, dest.before);
    else dest.parent.appendChild(wrap);
    return true;
  }

  function escNumCell(v) {
    if (v === "" || v == null) return "<span style=\"color:#bbb\">—</span>";
    return esc(String(v));
  }

  function filterRecordsByCostCategory(records, filterKey) {
    if (filterKey === "all") return records.slice();
    var out = [];
    for (var i = 0; i < records.length; i++) {
      if (fieldVal(records[i], "cost_category") === filterKey) out.push(records[i]);
    }
    return out;
  }

  function activeMonthLabels() {
    return y678OmitMonthlyCols ? [] : FISCAL_ORDER;
  }

  function theadHtml() {
    var months = activeMonthLabels();
    var r1 = [];
    var r2 = [];
    r1.push(
      "<th colspan=\"" +
        KEY_COL_COUNT +
        "\" class=\"y678-th-block y678-sk-head\" style=\"text-align:center;background:#e8eef9;border-bottom:2px solid #c5d0eb\">明細（677）</th>"
    );
    for (var m = 0; m < months.length; m++) {
      var lab = months[m];
      var band = m % 2 === 0 ? "y678-m-even" : "y678-m-odd";
      r1.push(
        "<th colspan=\"" +
          MONTH_COLS +
          "\" class=\"y678-th-block " +
          band +
          "\" style=\"text-align:center;font-size:11px;background:#f0f4ff;border-bottom:2px solid #c5d0eb\">" +
          esc(FISCAL_HEAD[lab] || lab + "月") +
          "</th>"
      );
    }
    r2.push(
      "<th class=\"y678-sk y678-sk1\">レコード</th>" +
        "<th class=\"y678-sk y678-sk2\">工種名称</th>" +
        "<th class=\"y678-sk y678-sk3\">工種コード</th>" +
        "<th class=\"y678-sk y678-sk4\">費用種別</th>" +
        "<th class=\"y678-sk y678-sk5\">摘要</th>" +
        "<th class=\"y678-sk y678-sk6\">会社</th>" +
        "<th class=\"y678-sk y678-sk7 y678-num\">ラーニング<br/>（定額）</th>" +
        "<th class=\"y678-sk y678-sk8 y678-num\">イニシャル<br/>（変動）</th>" +
        "<th class=\"y678-sk y678-sk9\">備考</th>" +
        "<th class=\"y678-sk y678-sk10\">表示順</th>"
    );
    for (var n = 0; n < months.length; n++) {
      var band2 = n % 2 === 0 ? "y678-m-even" : "y678-m-odd";
      r2.push(
        "<th class=\"y678-num " +
          band2 +
          "\">予算</th><th class=\"y678-num " +
          band2 +
          "\">実績</th><th class=\"y678-num " +
          band2 +
          "\">消費率<br/><span style=\"font-weight:400;color:#555\">(%)</span></th><th class=\"y678-num " +
          band2 +
          "\">予算<br/>修正</th>"
      );
    }
    return "<thead><tr>" + r1.join("") + "</tr><tr>" + r2.join("") + "</tr></thead>";
  }

  function renderTable(records) {
    var months = activeMonthLabels();
    var rows = [];
    rows.push(theadHtml());
    rows.push("<tbody>");
    var totalCols = KEY_COL_COUNT + months.length * MONTH_COLS;

    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var id = fieldVal(r, "$id");
      var rev = revisionOf(r);
      var mm = monthlyMapFromRecord(r);
      var sum = esc(fieldVal(r, "summary_text"));
      if (sum.length > 56) sum = sum.slice(0, 56) + "…";
      var noteRaw = fieldVal(r, "notes");
      var notePart = truncateNotes(noteRaw, 72);
      var doVal = esc(fieldVal(r, "display_order"));
      var learn = esc(fieldVal(r, "learning_fixed_budget"));
      var initv = esc(fieldVal(r, "initial_variable_budget"));
      var titleAttr = notePart.title ? " title=\"" + attrEsc(notePart.title) + "\"" : "";

      var rowHtml = [];
      rowHtml.push(
        "<tr data-y678-id=\"" +
          esc(id) +
          "\" data-y678-rev=\"" +
          esc(rev) +
          "\">" +
          "<td class=\"y678-sk y678-sk1\"><a href=\"" +
          esc(recordShowHref(id)) +
          "\">#" +
          esc(id) +
          "</a></td>" +
          "<td class=\"y678-sk y678-sk2\">" +
          esc(fieldVal(r, "work_type_name")) +
          "</td>" +
          "<td class=\"y678-sk y678-sk3\" style=\"color:#444\">" +
          esc(fieldVal(r, "work_type_code")) +
          "</td>" +
          "<td class=\"y678-sk y678-sk4\">" +
          esc(fieldVal(r, "cost_category")) +
          "</td>" +
          "<td class=\"y678-sk y678-sk5\" style=\"max-width:11em;word-break:break-word\">" +
          sum +
          "</td>" +
          "<td class=\"y678-sk y678-sk6\">" +
          esc(fieldVal(r, "partner_company")) +
          "</td>" +
          "<td class=\"y678-sk y678-sk7 y678-num\">" +
          (learn || "—") +
          "</td>" +
          "<td class=\"y678-sk y678-sk8 y678-num\">" +
          (initv || "—") +
          "</td>" +
          "<td class=\"y678-sk y678-sk9\" style=\"max-width:9em;word-break:break-word;font-size:11px;color:#333\"" +
          titleAttr +
          ">" +
          notePart.html +
          "</td>" +
          "<td class=\"y678-sk y678-sk10\" data-y678-do-td=\"1\">" +
          "<input type=\"number\" class=\"y678-display-order-input\" style=\"width:4.2em;padding:2px 4px;font-size:12px\" value=\"" +
          doVal +
          "\" step=\"any\" /> " +
          "<button type=\"button\" class=\"y678-display-order-save\" style=\"font-size:11px;padding:2px 6px\">保存</button>" +
          "</td>"
      );

      for (var mi = 0; mi < months.length; mi++) {
        var fl = months[mi];
        var band = mi % 2 === 0 ? "y678-m-even" : "y678-m-odd";
        var rowM = mm[fl] || {};
        var util = rowM.utilization;
        var utilStr = util === "" || util == null ? "—" : esc(String(util));
        rowHtml.push(
          "<td class=\"y678-num " +
            band +
            "\">" +
            escNumCell(rowM.budget) +
            "</td>" +
            "<td class=\"y678-num " +
            band +
            "\">" +
            escNumCell(rowM.actual) +
            "</td>" +
            "<td class=\"y678-num " +
            band +
            "\">" +
            utilStr +
            "</td>" +
            "<td class=\"y678-num " +
            band +
            "\">" +
            escNumCell(rowM.revision) +
            "</td>"
        );
      }
      rowHtml.push("</tr>");
      rows.push(rowHtml.join(""));
    }
    if (!records.length) {
      rows.push(
        "<tr><td colspan=\"" +
          totalCols +
          "\" style=\"color:#666;padding:10px\">該当する行がありません（677 にデータが無い・権限外・またはフィルタ条件に一致なし）</td></tr>"
      );
    }
    rows.push("</tbody>");
    return rows.join("");
  }

  function injectGridCss(wrap) {
    if (wrap.querySelector("[data-y678-grid-css]")) return;
    var st = document.createElement("style");
    st.setAttribute("data-y678-grid-css", "1");
    st.textContent =
      "[data-yojitsu-678-shell] .y678-grid{font-variant-numeric:tabular-nums;border-collapse:separate;border-spacing:0;font-size:12px;}" +
      "[data-yojitsu-678-shell] .y678-grid th,[data-yojitsu-678-shell] .y678-grid td{border:1px solid #d8dde8;padding:5px 6px;vertical-align:top;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-num{text-align:right;white-space:nowrap;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-m-even{background:#fafbff;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-m-odd{background:#ffffff;}" +
      "[data-yojitsu-678-shell] .y678-grid thead th{font-weight:600;color:#1a2744;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk-head{position:sticky;left:0;z-index:5;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk{position:sticky;background:#f4f7fc;box-shadow:2px 0 5px rgba(20,40,80,.08);z-index:3;}" +
      "[data-yojitsu-678-shell] .y678-grid thead .y678-sk{background:#e8eef9;z-index:4;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk1{left:0;min-width:3.2em;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk2{left:3.6em;min-width:7.5em;max-width:9em;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk3{left:12.2em;min-width:4em;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk4{left:16.8em;min-width:4.5em;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk5{left:21.8em;min-width:8em;max-width:11em;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk6{left:30.2em;min-width:5em;max-width:7em;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk7{left:36.2em;min-width:4.5em;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk8{left:41.4em;min-width:4.5em;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk9{left:46.6em;min-width:6em;max-width:9em;}" +
      "[data-yojitsu-678-shell] .y678-grid .y678-sk10{left:53.2em;min-width:6.5em;}" +
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td{background:#f7fbff;}" +
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover .y678-sk{background:#eef4fc;}" +
      "[data-yojitsu-678-shell] .y678-grid a{color:#0b57d0;}";
    wrap.appendChild(st);
  }

  function styleTable(t) {
    t.className = "y678-grid";
  }

  function mount() {
    if (document.querySelector("[data-yojitsu-678-shell]")) return;

    var dest = resolve678MountHost();
    if (!dest) return;

    var wrap = document.createElement("div");
    wrap.setAttribute("data-yojitsu-678-shell", "1");
    wrap.style.padding = "10px 12px";
    wrap.style.marginBottom = "10px";
    wrap.style.background = "#f7f9fc";
    wrap.style.border = "1px solid #e3e7ef";
    wrap.style.borderRadius = "6px";
    wrap.style.fontSize = "13px";
    injectGridCss(wrap);

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
      "【運用】表示順の保存のみ本画面から 677 に反映されます。月次・支払内訳の編集は 677 のレコード画面で行ってください。";
    wrap.appendChild(opsRow);

    var dash678ListHint = document.createElement("div");
    dash678ListHint.style.fontSize = "11px";
    dash678ListHint.style.color = "#666";
    dash678ListHint.style.marginBottom = "6px";
    dash678ListHint.style.lineHeight = "1.45";
    dash678ListHint.textContent =
      "※ 678 本体のレコード一覧に「データがありません」と出るのは想定内です（ダッシュ用に 678 に明細を持たない構成）。下のステータス行が「読み込み中」のままならブラウザ更新するか、開発者向けにコンソールのネットワーク／エラーを確認してください。";
    wrap.appendChild(dash678ListHint);

    var filterRow = document.createElement("div");
    filterRow.style.marginBottom = "8px";
    filterRow.style.display = "flex";
    filterRow.style.flexWrap = "wrap";
    filterRow.style.alignItems = "center";
    filterRow.style.gap = "6px 8px";
    filterRow.innerHTML =
      "<span style=\"color:#555;font-size:12px\">費用種別（API取得件数のうち）:</span>" +
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
    tblHost.style.maxWidth = "100%";
    tblHost.style.borderRadius = "6px";
    tblHost.style.border = "1px solid #dde4f0";
    tblHost.style.background = "#fff";
    wrap.appendChild(tblHost);

    attach678Shell(dest, wrap);

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
      t.style.minWidth = "max-content";
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
        " 件（新しい順・最大100）";
      if (currentCostFilter !== "all") {
        base += " · フィルタ後 " + filtered.length + " 件（" + String(currentCostFilter) + "）";
      }
      base += " · 左列は横スクロール時に固定 · 表示順のみここから保存可";
      status.style.color = "#555";
      status.textContent = base;
      setFilterButtonsActive();
    }

    function applyFilterAndRedraw() {
      try {
        var filtered = filterRecordsByCostCategory(lastRawRecords, currentCostFilter);
        updateStatusLine();
        paintTable(filtered);
        if (y678OmitMonthlyCols) {
          status.textContent =
            status.textContent + " ［月次列: 677 API で取得できず省略。677 のレコード画面で月次を確認してください。］";
        }
      } catch (err) {
        status.style.color = "#b00020";
        status.textContent =
          "表の描画に失敗しました: " + (err && err.message ? String(err.message).slice(0, 220) : String(err));
        if (typeof console !== "undefined" && console.error) console.error("[678] render", err);
      }
    }

    function fetch677Records(fields) {
      if (!kintone || !kintone.api || typeof kintone.api.url !== "function") {
        return Promise.reject({ code: "Y678_NOAPI", message: "kintone.api.url が利用できません。" });
      }
      return kintone.api(kintone.api.url("/k/v1/records.json", true), "GET", {
        app: APP_INPUT,
        query: QUERY,
        fields: fields,
        totalCount: false,
      });
    }

    function load() {
      status.style.color = "#555";
      status.textContent = "677 から明細を読み込み中…";
      tblHost.innerHTML = "";
      y678OmitMonthlyCols = false;
      var timeoutMs = 70000;

      function attempt(fields) {
        return apiWithTimeout(fetch677Records(fields), timeoutMs).then(function (resp) {
          var list = (resp && resp.records) || [];
          lastRawRecords = list;
          lastTotalCount = list.length;
          applyFilterAndRedraw();
        });
      }

      return attempt(FETCH_FIELDS)
        .catch(function (e) {
          if (!y678OmitMonthlyCols && isRetriable677FieldError(e)) {
            y678OmitMonthlyCols = true;
            return attempt(FETCH_FIELDS_NO_MONTHLY);
          }
          return Promise.reject(e);
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
      var tr = btn.closest("tr");
      if (!tr || !tr.getAttribute) return;
      var rid = tr.getAttribute("data-y678-id");
      var rev = tr.getAttribute("data-y678-rev");
      var inp = tr.querySelector(".y678-display-order-input");
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
        .api(kintone.api.url("/k/v1/record.json", true), "PUT", body)
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

  function scheduleMount678() {
    [0, 120, 400, 1000, 2200].forEach(function (ms) {
      setTimeout(function () {
        try {
          if (!document.querySelector("[data-yojitsu-678-shell]")) mount();
        } catch (err) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("[678]", err);
          }
        }
      }, ms);
    });
  }

  kintone.events.on("app.record.index.show", function () {
    scheduleMount678();
  });
})();
