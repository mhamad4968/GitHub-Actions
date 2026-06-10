(function () {
  "use strict";

  /** 外部ITサービス導入チェックシート — 708 REST CRUD */
  var BUILD = "2026-06-10-external-it-checksheet-dash-print-a4-v2";

  var APP_DB = 708;
  var PAGE_SIZE = 100;

  var FC = {
    check_date: "check_date",
    checker: "checker",
    service_name: "service_name",
    tool_name: "tool_name",
    purpose: "purpose",
    security_checks: "security_checks",
    item_no: "item_no",
    category: "category",
    check_method: "check_method",
    question: "question",
    result: "result",
    note: "note",
  };

  var RESULT_OPTIONS = ["", "〇", "×", "該当なし"];

  var SECURITY_TEMPLATES = [
    {
      item_no: "①",
      category: "データの暗号化",
      check_method:
        "※確認方法：ホームページに「SSL/TLS通信」「データ暗号化」等の記載があれば「〇」",
      question: "インターネットでの通信や、データが保存される場所は暗号化されているか？",
    },
    {
      item_no: "②",
      category: "アカウントの管理",
      check_method:
        "※確認方法：個人の使い回しではなく、一人ひとりに個別にアカウントを配れる仕様になっているか",
      question: "社員ごとに個別のＩＤ・パスワードが発行でき、適切なパスワードを設定できるか？",
    },
    {
      item_no: "③",
      category: "データのバックアップ",
      check_method: "※提供元もしくは代理店へ確認する",
      question: "定期的にデータのバックアップが取られているか？",
    },
  ];

  var ITEM_NO_ORDER = { "①": 1, "②": 2, "③": 3 };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.check_date,
    FC.checker,
    FC.service_name,
    FC.tool_name,
    FC.purpose,
    FC.security_checks,
  ];

  var TABLE_COLUMNS = [
    { key: FC.check_date, label: "確認日", sortable: true },
    { key: FC.checker, label: "確認者", sortable: false },
    { key: FC.service_name, label: "サービス名", sortable: false, emptyDash: true },
    { key: FC.tool_name, label: "ツール名", sortable: false, emptyDash: true },
    { key: FC.purpose, label: "導入の目的", sortable: false, firstLine: true },
  ];

  var state = {
    records: [],
    search: "",
    loading: false,
    sortKey: FC.check_date,
    sortDir: "desc",
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function todayJstYmd() {
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    var y = "";
    var mo = "";
    var d = "";
    parts.forEach(function (p) {
      if (p.type === "year") y = p.value;
      if (p.type === "month") mo = p.value;
      if (p.type === "day") d = p.value;
    });
    return y + "-" + mo + "-" + d;
  }

  function val(rec, code) {
    return rec && rec[code] && rec[code].value != null ? String(rec[code].value) : "";
  }

  function subVal(rowValue, code) {
    return rowValue && rowValue[code] && rowValue[code].value != null
      ? String(rowValue[code].value)
      : "";
  }

  function sortByItemNo(a, b) {
    var oa = ITEM_NO_ORDER[a.item_no] || 99;
    var ob = ITEM_NO_ORDER[b.item_no] || 99;
    if (oa !== ob) return oa - ob;
    return String(a.item_no || "").localeCompare(String(b.item_no || ""), "ja");
  }

  function parseChecks(rec) {
    var st = rec[FC.security_checks];
    var rows = st && Array.isArray(st.value) ? st.value : [];
    var checks = rows.map(function (row) {
      var v = row.value || {};
      return {
        rowId: row.id != null ? String(row.id) : "",
        item_no: subVal(v, FC.item_no),
        category: subVal(v, FC.category),
        check_method: subVal(v, FC.check_method),
        question: subVal(v, FC.question),
        result: subVal(v, FC.result),
        note: subVal(v, FC.note),
      };
    });
    checks.sort(sortByItemNo);
    return checks;
  }

  function mergeChecksWithTemplates(existingChecks) {
    var byNo = {};
    (existingChecks || []).forEach(function (c) {
      byNo[c.item_no] = c;
    });
    return SECURITY_TEMPLATES.map(function (t) {
      var ex = byNo[t.item_no];
      if (ex) {
        return {
          rowId: ex.rowId || "",
          item_no: ex.item_no || t.item_no,
          category: ex.category || t.category,
          check_method: ex.check_method || t.check_method,
          question: ex.question || t.question,
          result: ex.result || "",
          note: ex.note || "",
        };
      }
      return {
        rowId: "",
        item_no: t.item_no,
        category: t.category,
        check_method: t.check_method,
        question: t.question,
        result: "",
        note: "",
      };
    });
  }

  function seedChecksFromTemplates() {
    return SECURITY_TEMPLATES.map(function (t) {
      return {
        rowId: "",
        item_no: t.item_no,
        category: t.category,
        check_method: t.check_method,
        question: t.question,
        result: "",
        note: "",
      };
    });
  }

  function flatten(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      check_date: val(rec, FC.check_date),
      checker: val(rec, FC.checker),
      service_name: val(rec, FC.service_name),
      tool_name: val(rec, FC.tool_name),
      purpose: val(rec, FC.purpose),
      checks: parseChecks(rec),
    };
  }

  function firstLine(text) {
    var s = String(text || "").split(/\r?\n/)[0].trim();
    if (s.length > 80) return s.slice(0, 80) + "…";
    return s;
  }

  function displayCell(row, col) {
    var v = row[col.key] || "";
    if (col.emptyDash && !v) return "—";
    if (col.firstLine) return firstLine(v);
    return v;
  }

  function validateForm(data) {
    if (!data.check_date) return "確認日は必須です";
    if (!data.checker) return "確認者は必須です";
    if (!data.purpose) return "導入の目的は必須です";
    if (!data.service_name && !data.tool_name) {
      return "サービス名またはツール名のいずれかを入力してください";
    }
    return "";
  }

  function readHeaderValues(prefix) {
    return {
      check_date: (document.getElementById(prefix + "-check-date") || {}).value || "",
      checker: (document.getElementById(prefix + "-checker") || {}).value.trim(),
      service_name: (document.getElementById(prefix + "-service-name") || {}).value.trim(),
      tool_name: (document.getElementById(prefix + "-tool-name") || {}).value.trim(),
      purpose: (document.getElementById(prefix + "-purpose") || {}).value.trim(),
    };
  }

  function readCheckValues(prefix, templateChecks) {
    return templateChecks.map(function (c, i) {
      var resultEl = document.getElementById(prefix + "-check-" + i + "-result");
      var noteEl = document.getElementById(prefix + "-check-" + i + "-note");
      return {
        rowId: c.rowId || "",
        item_no: c.item_no,
        category: c.category,
        check_method: c.check_method,
        question: c.question,
        result: resultEl ? resultEl.value : c.result || "",
        note: noteEl ? noteEl.value.trim() : c.note || "",
      };
    });
  }

  function resultOptionsHtml(selected) {
    return RESULT_OPTIONS.map(function (opt) {
      var label = opt || "— 未選択 —";
      return (
        '<option value="' +
        esc(opt) +
        '"' +
        (selected === opt ? " selected" : "") +
        ">" +
        esc(label) +
        "</option>"
      );
    }).join("");
  }

  function checksSectionHtml(prefix, checks) {
    var blocks = checks
      .map(function (c, i) {
        return (
          '<div class="eitc-check-block" data-index="' +
          i +
          '">' +
          '<div class="eitc-check-heading">' +
          esc(c.item_no) +
          " " +
          esc(c.category) +
          "</div>" +
          '<div class="eitc-check-method">' +
          esc(c.check_method) +
          "</div>" +
          '<div class="eitc-check-question">' +
          esc(c.question) +
          "</div>" +
          '<label>結果<select id="' +
          prefix +
          "-check-" +
          i +
          '-result">' +
          resultOptionsHtml(c.result || "") +
          "</select></label>" +
          '<label>備考<textarea id="' +
          prefix +
          "-check-" +
          i +
          '-note" rows="2">' +
          esc(c.note || "") +
          "</textarea></label>" +
          "</div>"
        );
      })
      .join("");
    return (
      '<div class="eitc-sheet-section">' +
      '<div class="eitc-sheet-title">●セキュリティ確認項目（〇・×・該当なし でチェック）</div>' +
      blocks +
      "</div>"
    );
  }

  function formBodyHtml(prefix, row) {
    var isEdit = !!row;
    var checks = isEdit ? mergeChecksWithTemplates(row.checks) : seedChecksFromTemplates();
    return (
      '<div class="eitc-form-header">' +
      '<label>確認日<input type="date" id="' +
      prefix +
      '-check-date" value="' +
      esc(isEdit ? row.check_date : todayJstYmd()) +
      '" required></label>' +
      '<label>確認者<input id="' +
      prefix +
      '-checker" value="' +
      esc(isEdit ? row.checker : "") +
      '" required></label>' +
      '<label>サービス名<input id="' +
      prefix +
      '-service-name" value="' +
      esc(isEdit ? row.service_name : "") +
      '"></label>' +
      '<label>ツール名<input id="' +
      prefix +
      '-tool-name" value="' +
      esc(isEdit ? row.tool_name : "") +
      '"></label>' +
      '<label>導入の目的<textarea id="' +
      prefix +
      '-purpose" rows="3" required>' +
      esc(isEdit ? row.purpose : "") +
      "</textarea></label>" +
      "</div>" +
      checksSectionHtml(prefix, checks)
    );
  }

  function toKintoneRecord(header, checks) {
    var rec = {};
    function set(code, v) {
      if (v != null && v !== "") rec[code] = { value: v };
    }
    set(FC.check_date, header.check_date);
    set(FC.checker, header.checker);
    set(FC.service_name, header.service_name);
    set(FC.tool_name, header.tool_name);
    set(FC.purpose, header.purpose);
    rec[FC.security_checks] = {
      value: checks.map(function (c) {
        var entry = {
          value: {
            item_no: { value: c.item_no },
            category: { value: c.category },
            check_method: { value: c.check_method },
            question: { value: c.question },
            result: { value: c.result },
            note: { value: c.note },
          },
        };
        if (c.rowId) entry.id = c.rowId;
        return entry;
      }),
    };
    return rec;
  }

  function apiGet(path, params) {
    return kintone.api(kintone.api.url(path, true), "GET", params);
  }
  function apiPost(path, params) {
    return kintone.api(kintone.api.url(path, true), "POST", params);
  }
  function apiPut(path, params) {
    return kintone.api(kintone.api.url(path, true), "PUT", params);
  }
  function apiDelete(path, params) {
    return kintone.api(kintone.api.url(path, true), "DELETE", params);
  }

  function fetchAllRecords() {
    var all = [];
    var offset = 0;
    function page() {
      var query =
        "order by " + FC.check_date + " desc limit " + PAGE_SIZE + " offset " + offset;
      return apiGet("/k/v1/records.json", {
        app: APP_DB,
        query: query,
        fields: API_FIELDS,
      }).then(function (resp) {
        var rows = resp.records || [];
        all = all.concat(rows);
        if (rows.length >= PAGE_SIZE) {
          offset += PAGE_SIZE;
          return page();
        }
        return all;
      });
    }
    return page();
  }

  function injectCss() {
    if (document.getElementById("eitc-dash-css")) return;
    var st = document.createElement("style");
    st.id = "eitc-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".eitc-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".eitc-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".eitc-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;padding:10px 14px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;font-size:13px;}" +
      ".eitc-table-wrap{overflow:auto;max-height:calc(100vh - 240px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".eitc-table{border-collapse:collapse;width:100%;font-size:13px;min-width:900px;}" +
      ".eitc-table th,.eitc-table td{border:1px solid #e2e8f0;padding:6px 8px;vertical-align:top;}" +
      ".eitc-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;white-space:nowrap;}" +
      ".eitc-table th.eitc-sort{cursor:pointer;user-select:none;}" +
      ".eitc-table td.eitc-purpose{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}" +
      ".eitc-actions button{margin:0 2px;padding:2px 8px;font-size:12px;}" +
      ".eitc-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".eitc-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:720px;width:94%;max-height:92vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".eitc-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".eitc-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".eitc-modal input,.eitc-modal select,.eitc-modal textarea{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".eitc-form-header{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;}" +
      ".eitc-form-header label:last-child{grid-column:1/-1;}" +
      ".eitc-sheet-section{margin-top:16px;border-top:2px solid #334155;padding-top:12px;}" +
      ".eitc-sheet-title{font-weight:700;margin-bottom:12px;font-size:14px;}" +
      ".eitc-check-block{margin-bottom:16px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;}" +
      ".eitc-check-heading{font-weight:700;font-size:14px;margin-bottom:6px;}" +
      ".eitc-check-method{font-size:12px;color:#475569;margin-bottom:6px;white-space:pre-wrap;}" +
      ".eitc-check-question{font-size:13px;margin-bottom:8px;}" +
      ".eitc-modal-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:14px;}";
    document.head.appendChild(st);
  }

  function resolveMountHost() {
    return (
      kintone.app.getHeaderSpaceElement() ||
      kintone.app.getHeaderMenuSpaceElement() ||
      document.querySelector(".ocean-ui-app-index-head") ||
      document.body
    );
  }

  function compareSortValues(key, a, b) {
    if (key === FC.check_date) {
      return String(a.check_date || "").localeCompare(String(b.check_date || ""));
    }
    return String(a[key] || "").localeCompare(String(b[key] || ""), "ja");
  }

  function passesSearch(row) {
    var q = state.search.trim().toLowerCase();
    if (!q) return true;
    var hay = (
      row.checker +
      " " +
      row.service_name +
      " " +
      row.tool_name +
      " " +
      row.purpose
    ).toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function filteredRecords() {
    var rows = state.records.filter(passesSearch);
    rows.sort(function (a, b) {
      var key = state.sortKey || FC.check_date;
      var cmp = compareSortValues(key, a, b);
      return state.sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }

  function closeModal() {
    var el = document.getElementById("eitc-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "eitc-modal-root";
    bg.className = "eitc-modal-bg";
    var box = document.createElement("div");
    box.className = "eitc-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "eitc-modal-actions";
    buttons.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      btn.className = b.primary ? "kintoneplugin-button-dialog-ok" : "kintoneplugin-button-normal";
      btn.addEventListener("click", function () {
        if (b.onClick) b.onClick(closeModal);
        else closeModal();
      });
      actions.appendChild(btn);
    });
    box.appendChild(actions);
    bg.appendChild(box);
    bg.addEventListener("click", function (ev) {
      if (ev.target === bg) closeModal();
    });
    document.body.appendChild(bg);
    return box;
  }

  function updateMeta() {
    var el = document.getElementById("eitc-meta");
    if (!el) return;
    el.innerHTML = "<span>全 " + esc(String(state.records.length)) + " 件</span>";
  }

  function reloadRecords() {
    state.loading = true;
    renderTable();
    return fetchAllRecords()
      .then(function (rows) {
        state.records = rows.map(flatten);
        state.loading = false;
        renderTable();
        updateMeta();
      })
      .catch(function (e) {
        state.loading = false;
        renderTable();
        alert("読込失敗: " + (e.message || e));
      });
  }

  function printResultBadge(result) {
    var r = String(result || "").trim();
    var cls = "result-badge result-empty";
    var label = "未選択";
    if (r === "〇") {
      cls = "result-badge result-maru";
      label = "〇";
    } else if (r === "×") {
      cls = "result-badge result-batsu";
      label = "×";
    } else if (r === "該当なし") {
      cls = "result-badge result-na";
      label = "該当なし";
    }
    return '<span class="' + cls + '">' + esc(label) + "</span>";
  }

  function buildPrintHtml(header, checks) {
    var serviceDisplay = header.service_name || "—";
    var toolDisplay = header.tool_name || "—";
    var checkBlocks = checks
      .map(function (c) {
        var noteHtml = c.note
          ? '<span class="note-text">' + esc(c.note) + "</span>"
          : '<span class="note-empty">—</span>';
        return (
          '<section class="item">' +
          '<div class="item-head">' +
          '<span class="item-no">' +
          esc(c.item_no) +
          "</span>" +
          '<span class="item-cat">' +
          esc(c.category) +
          "</span>" +
          "</div>" +
          '<div class="item-body">' +
          '<div class="method">' +
          esc(c.check_method) +
          "</div>" +
          '<div class="question">' +
          esc(c.question) +
          "</div>" +
          '<div class="item-foot">' +
          '<div class="result-wrap"><span class="result-lbl">結果</span>' +
          printResultBadge(c.result) +
          "</div>" +
          '<div class="note-wrap"><span class="note-lbl">備考</span>' +
          noteHtml +
          "</div>" +
          "</div>" +
          "</div></section>"
        );
      })
      .join("");
    return (
      "<!DOCTYPE html><html lang=\"ja\"><head><meta charset=\"utf-8\">" +
      "<title>外部ITサービス導入チェックシート</title>" +
      "<style>" +
      "@page{size:A4 portrait;margin:8mm;}" +
      "*{box-sizing:border-box;}" +
      "body{font-family:Meiryo,'Yu Gothic UI',Segoe UI,sans-serif;font-size:9pt;line-height:1.35;color:#1e293b;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}" +
      ".sheet{max-width:190mm;margin:0 auto;}" +
      ".banner{background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 55%,#3b82f6 100%);color:#fff;padding:9px 12px 8px;border-radius:6px 6px 0 0;text-align:center;box-shadow:0 2px 4px rgba(30,58,138,.15);}" +
      ".banner h1{margin:0;font-size:13.5pt;font-weight:700;letter-spacing:.06em;}" +
      ".banner .sub{margin:3px 0 0;font-size:7.5pt;opacity:.92;}" +
      ".info-box{border:1px solid #93c5fd;border-top:none;border-radius:0 0 4px 4px;background:linear-gradient(180deg,#f8fafc 0%,#fff 100%);padding:7px 9px;margin-bottom:6px;}" +
      ".info-grid{display:grid;grid-template-columns:68px 1fr 68px 1fr;gap:3px 7px;align-items:stretch;}" +
      ".lbl{font-weight:700;color:#475569;font-size:8pt;display:flex;align-items:center;}" +
      ".val{background:#fff;border:1px solid #e2e8f0;border-radius:3px;padding:2px 6px;min-height:20px;font-size:8.5pt;word-break:break-word;}" +
      ".purpose-row{grid-column:1/-1;display:grid;grid-template-columns:68px 1fr;gap:3px 7px;margin-top:2px;}" +
      ".purpose-val{max-height:2.8em;overflow:hidden;white-space:pre-wrap;}" +
      ".section-title{background:linear-gradient(90deg,#eff6ff,#fff);border:1px solid #bfdbfe;border-left:4px solid #2563eb;border-radius:3px;padding:4px 8px;margin:0 0 5px;font-weight:700;font-size:9pt;color:#1e40af;}" +
      ".items{display:flex;flex-direction:column;gap:5px;}" +
      ".item{border:1px solid #cbd5e1;border-radius:4px;overflow:hidden;page-break-inside:avoid;box-shadow:0 1px 2px rgba(15,23,42,.06);}" +
      ".item-head{display:flex;align-items:center;gap:7px;background:linear-gradient(90deg,#dbeafe 0%,#eff6ff 100%);padding:3px 8px;border-bottom:1px solid #bfdbfe;}" +
      ".item-no{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 4px;background:#2563eb;color:#fff;font-weight:700;border-radius:4px;font-size:9pt;}" +
      ".item-cat{font-weight:700;color:#1e3a8a;font-size:9pt;}" +
      ".item-body{padding:5px 8px 6px;font-size:8.5pt;}" +
      ".method{background:#fffbeb;border-left:3px solid #f59e0b;padding:2px 6px;margin-bottom:3px;color:#92400e;font-size:7.5pt;line-height:1.3;}" +
      ".question{font-weight:600;color:#0f172a;margin-bottom:3px;font-size:8.5pt;line-height:1.35;}" +
      ".item-foot{display:flex;gap:10px;align-items:flex-start;border-top:1px dashed #e2e8f0;padding-top:3px;margin-top:2px;}" +
      ".result-wrap,.note-wrap{display:flex;align-items:flex-start;gap:5px;}" +
      ".note-wrap{flex:1;min-width:0;}" +
      ".result-lbl,.note-lbl{font-weight:700;color:#64748b;font-size:7.5pt;white-space:nowrap;padding-top:2px;}" +
      ".result-badge{display:inline-block;min-width:44px;text-align:center;padding:1px 8px;border-radius:999px;font-weight:700;font-size:8.5pt;line-height:1.5;}" +
      ".result-maru{background:#dcfce7;color:#166534;border:1px solid #86efac;}" +
      ".result-batsu{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;}" +
      ".result-na{background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;}" +
      ".result-empty{background:#fff;color:#94a3b8;border:1px dashed #cbd5e1;}" +
      ".note-text{font-size:7.5pt;color:#334155;white-space:pre-wrap;word-break:break-word;line-height:1.3;}" +
      ".note-empty{font-size:7.5pt;color:#94a3b8;}" +
      ".footer{margin-top:5px;padding-top:3px;border-top:1px solid #e2e8f0;text-align:right;font-size:7pt;color:#94a3b8;}" +
      "@media print{html,body{height:100%;} .sheet{page-break-inside:avoid;}}" +
      "</style></head><body>" +
      '<div class="sheet">' +
      '<header class="banner">' +
      "<h1>外部 IT サービス導入チェックシート</h1>" +
      '<p class="sub">セキュリティ確認記録（〇・×・該当なし）</p>' +
      "</header>" +
      '<div class="info-box">' +
      '<div class="info-grid">' +
      '<span class="lbl">確認日</span><span class="val">' +
      esc(header.check_date) +
      "</span>" +
      '<span class="lbl">確認者</span><span class="val">' +
      esc(header.checker) +
      "</span>" +
      '<span class="lbl">サービス名</span><span class="val">' +
      esc(serviceDisplay) +
      "</span>" +
      '<span class="lbl">ツール名</span><span class="val">' +
      esc(toolDisplay) +
      "</span>" +
      "</div>" +
      '<div class="purpose-row"><span class="lbl">導入目的</span><span class="val purpose-val">' +
      esc(header.purpose) +
      "</span></div>" +
      "</div>" +
      '<div class="section-title">● セキュリティ確認項目</div>' +
      '<div class="items">' +
      checkBlocks +
      "</div>" +
      '<div class="footer">株式会社 J-BIS — システム推進室</div>' +
      "</div>" +
      "<script>window.onload=function(){window.print();};<\/script>" +
      "</body></html>"
    );
  }

  function openPrintWindow(prefix, templateChecks) {
    var header = readHeaderValues(prefix);
    var checks = readCheckValues(prefix, templateChecks);
    var html = buildPrintHtml(header, checks);
    var w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      alert("ポップアップがブロックされました。ブラウザの設定を確認してください。");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function openCheckModal(row) {
    var isEdit = !!row;
    var prefix = isEdit ? "eitc-edit" : "eitc-new";
    var templateChecks = isEdit ? mergeChecksWithTemplates(row.checks) : seedChecksFromTemplates();
    var title = isEdit
      ? "チェック表 — " + (row.service_name || row.tool_name || "（名称未設定）")
      : "新規チェック";

    openModal(title, formBodyHtml(prefix, row), [
      { label: "キャンセル" },
      {
        label: "印刷",
        onClick: function () {
          openPrintWindow(prefix, templateChecks);
        },
      },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          var header = readHeaderValues(prefix);
          var checks = readCheckValues(prefix, templateChecks);
          var err = validateForm(header);
          if (err) {
            alert(err);
            return;
          }
          var rec = toKintoneRecord(header, checks);
          var promise = isEdit
            ? apiPut("/k/v1/record.json", {
                app: APP_DB,
                id: row.id,
                revision: row.revision,
                record: rec,
              })
            : apiPost("/k/v1/record.json", { app: APP_DB, record: rec });
          promise
            .then(function () {
              close();
              reloadRecords();
              alert(isEdit ? "保存しました" : "登録しました");
            })
            .catch(function (e) {
              alert((isEdit ? "保存" : "登録") + "失敗: " + (e.message || e));
            });
        },
      },
    ]);
  }

  function openDeleteModal(row) {
    var label = row.service_name || row.tool_name || "（名称未設定）";
    openModal(
      "削除確認",
      "<p>確認日: <strong>" +
        esc(row.check_date) +
        "</strong></p>" +
        "<p>確認者: " +
        esc(row.checker) +
        "</p>" +
        "<p>サービス/ツール: " +
        esc(label) +
        "</p>" +
        "<p>このレコードを<strong>削除</strong>します。よろしいですか？</p>",
      [
        { label: "キャンセル" },
        {
          label: "削除する",
          primary: true,
          onClick: function (close) {
            apiDelete("/k/v1/records.json", { app: APP_DB, ids: [Number(row.id)] })
              .then(function () {
                close();
                reloadRecords();
                alert("削除しました");
              })
              .catch(function (e) {
                alert("削除失敗: " + (e.message || e));
              });
          },
        },
      ],
    );
  }

  function renderTable() {
    var tbody = document.getElementById("eitc-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="6">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6">該当なし</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        var cells = TABLE_COLUMNS.map(function (col) {
          var v = displayCell(r, col);
          var cls = col.key === FC.purpose ? "eitc-purpose" : "";
          var titleAttr = col.firstLine && r[col.key] ? ' title="' + esc(r[col.key]) + '"' : "";
          return (
            '<td class="' + cls + '"' + titleAttr + ">" + esc(v) + "</td>"
          );
        }).join("");
        return (
          '<tr data-id="' +
          esc(r.id) +
          '">' +
          cells +
          '<td class="eitc-actions">' +
          '<button type="button" class="eitc-btn-view">チェック表を見る</button>' +
          '<button type="button" class="eitc-btn-del">削除</button>' +
          "</td></tr>"
        );
      })
      .join("");

    tbody.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      var row = state.records.find(function (x) {
        return x.id === id;
      });
      if (!row) return;
      tr.querySelector(".eitc-btn-view").addEventListener("click", function () {
        openCheckModal(row);
      });
      tr.querySelector(".eitc-btn-del").addEventListener("click", function () {
        openDeleteModal(row);
      });
    });
  }

  function buildShell() {
    if (document.getElementById("eitc-root")) return;
    injectCss();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "eitc-root";
    root.className = "eitc-root";
    root.innerHTML =
      '<div class="eitc-toolbar">' +
      '<strong style="font-size:16px">外部ITサービス導入チェックシート</strong>' +
      '<button type="button" id="eitc-add" class="kintoneplugin-button-dialog-ok">新規チェック</button>' +
      '<button type="button" id="eitc-reload" class="kintoneplugin-button-normal">再読込</button>' +
      '<input type="search" id="eitc-search" placeholder="確認者・サービス名・ツール名・目的" style="min-width:260px;padding:6px;margin-left:8px">' +
      '<button type="button" id="eitc-clear" class="kintoneplugin-button-normal">クリア</button>' +
      "</div>" +
      '<div id="eitc-meta" class="eitc-meta"></div>' +
      '<div class="eitc-table-wrap"><table class="eitc-table"><thead><tr>' +
      TABLE_COLUMNS.map(function (c) {
        return (
          '<th' +
          (c.sortable ? ' class="eitc-sort" data-sort="' + esc(c.key) + '"' : "") +
          ">" +
          esc(c.label) +
          "</th>"
        );
      }).join("") +
      "<th>操作</th>" +
      '</tr></thead><tbody id="eitc-tbody"></tbody></table></div>';
    host.appendChild(root);

    document.getElementById("eitc-add").addEventListener("click", function () {
      openCheckModal(null);
    });
    document.getElementById("eitc-reload").addEventListener("click", reloadRecords);
    var search = document.getElementById("eitc-search");
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    document.getElementById("eitc-clear").addEventListener("click", function () {
      state.search = "";
      search.value = "";
      renderTable();
    });

    root.querySelector(".eitc-table thead").addEventListener("click", function (ev) {
      var th = ev.target.closest("th.eitc-sort");
      if (!th) return;
      var key = th.getAttribute("data-sort");
      if (!key) return;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = key === FC.check_date ? "desc" : "asc";
      }
      renderTable();
    });
  }

  function scheduleMount() {
    [0, 120, 400, 1000].forEach(function (ms) {
      setTimeout(function () {
        buildShell();
        if (ms === 0) reloadRecords();
      }, ms);
    });
  }

  kintone.events.on("app.record.index.show", function (ev) {
    if (typeof console !== "undefined" && console.info) {
      console.info("[external-it-checksheet-dash] BUILD=" + BUILD + " APP_DB=" + APP_DB);
    }
    scheduleMount();
    return ev;
  });
})();
