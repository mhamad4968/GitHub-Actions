(function () {
  "use strict";

  /** 新規システム導入ヒアリング記録 — 710 REST CRUD */
  var BUILD = "2026-06-10-new-system-intro-dash-print-a4-v2";

  var APP_DB = 710;
  var PAGE_SIZE = 100;

  var FC = {
    hearing_date: "hearing_date",
    recorder: "recorder",
    applicant: "applicant",
    usage_dept: "usage_dept",
    service_name: "service_name",
    tool_name: "tool_name",
    intro_background: "intro_background",
    issue_to_solve: "issue_to_solve",
    func_requirements: "func_requirements",
    budget_estimate: "budget_estimate",
    crit_dx: "crit_dx",
    crit_dx_note: "crit_dx_note",
    crit_productivity: "crit_productivity",
    crit_productivity_note: "crit_productivity_note",
    crit_cost: "crit_cost",
    crit_cost_note: "crit_cost_note",
    confirm_no_solo: "confirm_no_solo",
    confirm_joint: "confirm_joint",
    ops_owner: "ops_owner",
  };

  var CRIT_OPTIONS = ["", "該当", "非該当"];
  var YESNO_OPTIONS = ["", "はい", "いいえ"];

  var CRIT_SPECS = [
    {
      valueKey: FC.crit_dx,
      noteKey: FC.crit_dx_note,
      label: "データ化とデータ（情報）利活用（DXの推進）",
      desc:
        "これまでの紙やExcelでの運用から電子化し、会社全体でデータの検索・共有・二次利用ができること。",
    },
    {
      valueKey: FC.crit_productivity,
      noteKey: FC.crit_productivity_note,
      label: "作業効率・生産性の向上",
      desc:
        "システム導入により各組織の業務効率化・省力化や生産性向上、費用対効果が見込めること。",
    },
    {
      valueKey: FC.crit_cost,
      noteKey: FC.crit_cost_note,
      label: "コストダウン・費用対効果",
      desc:
        "二重投資や未利用ツールによるコスト増大を避け、導入費・運営費に見合う効果が見込めること。",
    },
  ];

  var CONFIRM_SPECS = [
    {
      key: FC.confirm_no_solo,
      type: "yesno",
      label: "個別での独断導入はしない",
      desc:
        "支店独自の判断でシステムを契約・導入することは固く禁じます。必ず全社統一のプロセス（システム推進室への相談）を通してください。",
    },
    {
      key: FC.confirm_joint,
      type: "yesno",
      label: "利用部署とシステム推進室の「共同プロジェクト」として進める",
      desc:
        "システムの初期設定や社内への展開は利用部署がリードし、システム推進室は技術的なサポート役として伴走します。",
    },
    {
      key: FC.ops_owner,
      type: "text",
      label: "導入後の運用・アカウント管理担当",
      desc:
        "実際のシステム運用やメンバーの利用アカウント管理は、各支店・部署が中心となって行います。",
    },
  ];

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.hearing_date,
    FC.recorder,
    FC.applicant,
    FC.usage_dept,
    FC.service_name,
    FC.tool_name,
    FC.intro_background,
    FC.issue_to_solve,
    FC.func_requirements,
    FC.budget_estimate,
    FC.crit_dx,
    FC.crit_dx_note,
    FC.crit_productivity,
    FC.crit_productivity_note,
    FC.crit_cost,
    FC.crit_cost_note,
    FC.confirm_no_solo,
    FC.confirm_joint,
    FC.ops_owner,
  ];

  var TABLE_COLUMNS = [
    { key: FC.hearing_date, label: "ヒアリング日", sortable: true },
    { key: FC.recorder, label: "記録者", sortable: false },
    { key: FC.applicant, label: "申請者", sortable: false },
    { key: FC.service_name, label: "サービス名", sortable: false, emptyDash: true },
    { key: FC.tool_name, label: "ツール名", sortable: false, emptyDash: true },
    { key: FC.usage_dept, label: "利用部署", sortable: false },
  ];

  var state = {
    records: [],
    search: "",
    loading: false,
    sortKey: FC.hearing_date,
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

  function flatten(rec) {
    var row = {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
    };
    API_FIELDS.forEach(function (code) {
      if (code.indexOf("$") === 0) return;
      row[code] = val(rec, code);
    });
    return row;
  }

  function displayCell(row, col) {
    var v = row[col.key] || "";
    if (col.emptyDash && !v) return "—";
    return v;
  }

  function fieldEl(prefix, code) {
    return document.getElementById(prefix + "-" + code);
  }

  function readFormValues(prefix) {
    var data = {};
    API_FIELDS.forEach(function (code) {
      if (code.indexOf("$") === 0) return;
      var el = fieldEl(prefix, code);
      if (!el) {
        data[code] = "";
        return;
      }
      data[code] =
        el.tagName === "SELECT" || el.tagName === "TEXTAREA" || el.tagName === "INPUT"
          ? String(el.value || "").trim()
          : "";
      if (el.type === "date") data[code] = el.value || "";
    });
    var dateEl = fieldEl(prefix, FC.hearing_date);
    if (dateEl && dateEl.type === "date") data[FC.hearing_date] = dateEl.value || "";
    return data;
  }

  function validateForm(data) {
    if (!data.hearing_date) return "ヒアリング日は必須です";
    if (!data.recorder) return "記録者は必須です";
    if (!data.applicant) return "申請者は必須です";
    if (!data.usage_dept) return "利用部署は必須です";
    if (!data.intro_background) return "導入経緯は必須です";
    if (!data.issue_to_solve) return "解決したい課題は必須です";
    if (!data.func_requirements) return "必要な機能・要件は必須です";
    if (!data.crit_dx) return "導入要件（DX）は必須です";
    if (!data.crit_productivity) return "導入要件（生産性）は必須です";
    if (!data.crit_cost) return "導入要件（コスト）は必須です";
    if (!data.confirm_no_solo) return "確認（独断導入でない）は必須です";
    if (!data.confirm_joint) return "確認（共同プロジェクト）は必須です";
    if (!data.service_name && !data.tool_name) {
      return "サービス名またはツール名のいずれかを入力してください";
    }
    return "";
  }

  function optionsHtml(options, selected) {
    return options
      .map(function (opt) {
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
      })
      .join("");
  }

  function critSectionHtml(prefix, row) {
    var isEdit = !!row;
    var blocks = CRIT_SPECS.map(function (spec, i) {
      var v = isEdit ? row[spec.valueKey] || "" : "";
      var n = isEdit ? row[spec.noteKey] || "" : "";
      return (
        '<div class="nsid-crit-block">' +
        '<div class="nsid-crit-label">' +
        esc(spec.label) +
        "</div>" +
        '<div class="nsid-crit-desc">' +
        esc(spec.desc) +
        "</div>" +
        '<label>該当/非該当<select id="' +
        prefix +
        "-" +
        spec.valueKey +
        '">' +
        optionsHtml(CRIT_OPTIONS, v) +
        "</select></label>" +
        '<label>説明・補足<textarea id="' +
        prefix +
        "-" +
        spec.noteKey +
        '" rows="2">' +
        esc(n) +
        "</textarea></label>" +
        "</div>"
      );
    }).join("");
    return (
      '<div class="nsid-form-section">' +
      '<div class="nsid-section-title">2. 導入要件 §4（3項目）</div>' +
      blocks +
      "</div>"
    );
  }

  function confirmSectionHtml(prefix, row) {
    var isEdit = !!row;
    var blocks = CONFIRM_SPECS.map(function (spec) {
      if (spec.type === "yesno") {
        var v = isEdit ? row[spec.key] || "" : "";
        return (
          '<div class="nsid-confirm-block">' +
          '<div class="nsid-confirm-label">' +
          esc(spec.label) +
          "</div>" +
          '<div class="nsid-confirm-desc">' +
          esc(spec.desc) +
          "</div>" +
          '<label>回答<select id="' +
          prefix +
          "-" +
          spec.key +
          '">' +
          optionsHtml(YESNO_OPTIONS, v) +
          "</select></label>" +
          "</div>"
        );
      }
      var ov = isEdit ? row[spec.key] || "" : "";
      return (
        '<div class="nsid-confirm-block">' +
        '<div class="nsid-confirm-label">' +
        esc(spec.label) +
        "</div>" +
        '<div class="nsid-confirm-desc">' +
        esc(spec.desc) +
        "</div>" +
        '<label>担当者<input id="' +
        prefix +
        "-" +
        spec.key +
        '" value="' +
        esc(ov) +
        '"></label>' +
        "</div>"
      );
    }).join("");
    return (
      '<div class="nsid-form-section">' +
      '<div class="nsid-section-title">3. 導入時確認 §6</div>' +
      blocks +
      "</div>"
    );
  }

  function formBodyHtml(prefix, row) {
    var isEdit = !!row;
    return (
      '<div class="nsid-form-section">' +
      '<div class="nsid-section-title">1. ヒアリング基本</div>' +
      '<div class="nsid-form-grid">' +
      '<label>ヒアリング日<input type="date" id="' +
      prefix +
      "-" +
      FC.hearing_date +
      '" value="' +
      esc(isEdit ? row.hearing_date : todayJstYmd()) +
      '" required></label>' +
      '<label>記録者<input id="' +
      prefix +
      "-" +
      FC.recorder +
      '" value="' +
      esc(isEdit ? row.recorder : "") +
      '" required></label>' +
      '<label>申請者<input id="' +
      prefix +
      "-" +
      FC.applicant +
      '" value="' +
      esc(isEdit ? row.applicant : "") +
      '" required></label>' +
      '<label>利用部署<input id="' +
      prefix +
      "-" +
      FC.usage_dept +
      '" value="' +
      esc(isEdit ? row.usage_dept : "") +
      '" required></label>' +
      '<label>サービス名<input id="' +
      prefix +
      "-" +
      FC.service_name +
      '" value="' +
      esc(isEdit ? row.service_name : "") +
      '"></label>' +
      '<label>ツール名<input id="' +
      prefix +
      "-" +
      FC.tool_name +
      '" value="' +
      esc(isEdit ? row.tool_name : "") +
      '"></label>' +
      '<label class="nsid-full">導入経緯<textarea id="' +
      prefix +
      "-" +
      FC.intro_background +
      '" rows="3" required>' +
      esc(isEdit ? row.intro_background : "") +
      "</textarea></label>" +
      '<label class="nsid-full">解決したい課題<textarea id="' +
      prefix +
      "-" +
      FC.issue_to_solve +
      '" rows="3" required>' +
      esc(isEdit ? row.issue_to_solve : "") +
      "</textarea></label>" +
      '<label class="nsid-full">必要な機能・要件<textarea id="' +
      prefix +
      "-" +
      FC.func_requirements +
      '" rows="3" required>' +
      esc(isEdit ? row.func_requirements : "") +
      "</textarea></label>" +
      '<label class="nsid-full">予算（概算）<input id="' +
      prefix +
      "-" +
      FC.budget_estimate +
      '" value="' +
      esc(isEdit ? row.budget_estimate : "") +
      '"></label>' +
      "</div></div>" +
      critSectionHtml(prefix, row) +
      confirmSectionHtml(prefix, row)
    );
  }

  function toKintoneRecord(data) {
    var rec = {};
    API_FIELDS.forEach(function (code) {
      if (code.indexOf("$") === 0) return;
      var v = data[code];
      if (v != null && v !== "") rec[code] = { value: v };
    });
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
        "order by " + FC.hearing_date + " desc limit " + PAGE_SIZE + " offset " + offset;
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
    if (document.getElementById("nsid-dash-css")) return;
    var st = document.createElement("style");
    st.id = "nsid-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".nsid-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".nsid-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".nsid-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;padding:10px 14px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;font-size:13px;}" +
      ".nsid-table-wrap{overflow:auto;max-height:calc(100vh - 240px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".nsid-table{border-collapse:collapse;width:100%;font-size:13px;min-width:960px;}" +
      ".nsid-table th,.nsid-table td{border:1px solid #e2e8f0;padding:6px 8px;vertical-align:top;}" +
      ".nsid-table th{background:#f0fdf4;position:sticky;top:0;z-index:1;white-space:nowrap;}" +
      ".nsid-table th.nsid-sort{cursor:pointer;user-select:none;}" +
      ".nsid-actions button{margin:0 2px;padding:2px 8px;font-size:12px;}" +
      ".nsid-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".nsid-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:760px;width:94%;max-height:92vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".nsid-modal h3{margin:0 0 12px;font-size:16px;color:#065f46;}" +
      ".nsid-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".nsid-modal input,.nsid-modal select,.nsid-modal textarea{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".nsid-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;}" +
      ".nsid-form-grid .nsid-full{grid-column:1/-1;}" +
      ".nsid-form-section{margin-top:16px;border-top:2px solid #059669;padding-top:12px;}" +
      ".nsid-section-title{font-weight:700;margin-bottom:12px;font-size:14px;color:#047857;}" +
      ".nsid-crit-block,.nsid-confirm-block{margin-bottom:14px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;}" +
      ".nsid-crit-label,.nsid-confirm-label{font-weight:700;font-size:13px;margin-bottom:4px;color:#065f46;}" +
      ".nsid-crit-desc,.nsid-confirm-desc{font-size:12px;color:#475569;margin-bottom:8px;white-space:pre-wrap;}" +
      ".nsid-modal-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:14px;}";
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
    if (key === FC.hearing_date) {
      return String(a.hearing_date || "").localeCompare(String(b.hearing_date || ""));
    }
    return String(a[key] || "").localeCompare(String(b[key] || ""), "ja");
  }

  function passesSearch(row) {
    var q = state.search.trim().toLowerCase();
    if (!q) return true;
    var hay = (
      row.recorder +
      " " +
      row.applicant +
      " " +
      row.usage_dept +
      " " +
      row.service_name +
      " " +
      row.tool_name +
      " " +
      row.intro_background +
      " " +
      row.issue_to_solve
    ).toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function filteredRecords() {
    var rows = state.records.filter(passesSearch);
    rows.sort(function (a, b) {
      var key = state.sortKey || FC.hearing_date;
      var cmp = compareSortValues(key, a, b);
      return state.sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }

  function closeModal() {
    var el = document.getElementById("nsid-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "nsid-modal-root";
    bg.className = "nsid-modal-bg";
    var box = document.createElement("div");
    box.className = "nsid-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "nsid-modal-actions";
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
    var el = document.getElementById("nsid-meta");
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

  function printBadge(value, kind) {
    var v = String(value || "").trim();
    var cls = "badge badge-empty";
    var label = "未選択";
    if (kind === "crit") {
      if (v === "該当") {
        cls = "badge badge-yes";
        label = "該当";
      } else if (v === "非該当") {
        cls = "badge badge-no";
        label = "非該当";
      }
    } else if (kind === "yesno") {
      if (v === "はい") {
        cls = "badge badge-yes";
        label = "はい";
      } else if (v === "いいえ") {
        cls = "badge badge-no";
        label = "いいえ";
      }
    } else if (v) {
      cls = "badge badge-text";
      label = v;
    }
    return '<span class="' + cls + '">' + esc(label) + "</span>";
  }

  function buildPrintHtml(form) {
    var serviceDisplay = form.service_name || "—";
    var toolDisplay = form.tool_name || "—";
    var critRows = CRIT_SPECS.map(function (spec) {
      var v = form[spec.valueKey] || "";
      var n = form[spec.noteKey] || "";
      return (
        "<tr>" +
        '<td class="td-label">' +
        esc(spec.label) +
        "</td>" +
        '<td class="td-val">' +
        printBadge(v, "crit") +
        "</td>" +
        '<td class="td-note">' +
        (n ? esc(n) : '<span class="muted">—</span>') +
        "</td></tr>"
      );
    }).join("");
    var confirmRows =
      '<tr><td class="td-label">' +
      esc(CONFIRM_SPECS[0].label) +
      '</td><td class="td-val">' +
      printBadge(form.confirm_no_solo, "yesno") +
      '</td><td class="td-note">' +
      esc(CONFIRM_SPECS[0].desc) +
      "</td></tr>" +
      '<tr><td class="td-label">' +
      esc(CONFIRM_SPECS[1].label) +
      '</td><td class="td-val">' +
      printBadge(form.confirm_joint, "yesno") +
      '</td><td class="td-note">' +
      esc(CONFIRM_SPECS[1].desc) +
      "</td></tr>" +
      '<tr><td class="td-label">' +
      esc(CONFIRM_SPECS[2].label) +
      '</td><td class="td-val">' +
      (form.ops_owner
        ? esc(form.ops_owner)
        : '<span class="muted">—</span>') +
      '</td><td class="td-note">' +
      esc(CONFIRM_SPECS[2].desc) +
      "</td></tr>";
    return (
      "<!DOCTYPE html><html lang=\"ja\"><head><meta charset=\"utf-8\">" +
      "<title>新規システム導入ヒアリング記録</title>" +
      "<style>" +
      "@page{size:A4 portrait;margin:10mm;}" +
      "*{box-sizing:border-box;}" +
      "body{font-family:Meiryo,'Yu Gothic UI',Segoe UI,sans-serif;font-size:9pt;line-height:1.4;color:#1e293b;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}" +
      ".page{max-width:190mm;margin:0 auto;padding:0;}" +
      ".page1{page-break-after:always;}" +
      ".banner{background:linear-gradient(135deg,#065f46 0%,#059669 55%,#10b981 100%);color:#fff;padding:10px 14px 9px;border-radius:6px 6px 0 0;text-align:center;}" +
      ".banner h1{margin:0;font-size:14pt;font-weight:700;letter-spacing:.04em;}" +
      ".banner .sub{margin:4px 0 0;font-size:7.5pt;opacity:.92;}" +
      ".info-box{border:1px solid #6ee7b7;border-top:none;border-radius:0 0 4px 4px;background:linear-gradient(180deg,#f0fdf4 0%,#fff 100%);padding:8px 10px;margin-bottom:8px;}" +
      ".info-grid{display:grid;grid-template-columns:72px 1fr 72px 1fr;gap:4px 8px;align-items:stretch;}" +
      ".lbl{font-weight:700;color:#475569;font-size:8pt;display:flex;align-items:center;}" +
      ".val{background:#fff;border:1px solid #e2e8f0;border-radius:3px;padding:3px 6px;min-height:22px;font-size:8.5pt;word-break:break-word;white-space:pre-wrap;}" +
      ".full-row{grid-column:1/-1;display:grid;grid-template-columns:72px 1fr;gap:4px 8px;margin-top:2px;}" +
      ".section-title{background:linear-gradient(90deg,#ecfdf5,#fff);border:1px solid #a7f3d0;border-left:4px solid #059669;border-radius:3px;padding:4px 8px;margin:0 0 6px;font-weight:700;font-size:9pt;color:#047857;}" +
      ".print-table{width:100%;border-collapse:collapse;font-size:8pt;margin-bottom:8px;}" +
      ".print-table th,.print-table td{border:1px solid #cbd5e1;padding:4px 6px;vertical-align:top;}" +
      ".print-table th{background:#ecfdf5;color:#065f46;font-weight:700;text-align:left;}" +
      ".td-label{font-weight:600;color:#0f172a;width:34%;}" +
      ".td-val{width:14%;text-align:center;}" +
      ".td-note{color:#334155;white-space:pre-wrap;word-break:break-word;}" +
      ".badge{display:inline-block;min-width:44px;text-align:center;padding:1px 8px;border-radius:999px;font-weight:700;font-size:8pt;line-height:1.5;}" +
      ".badge-yes{background:#dcfce7;color:#166534;border:1px solid #86efac;}" +
      ".badge-no{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;}" +
      ".badge-empty{background:#fff;color:#94a3b8;border:1px dashed #cbd5e1;}" +
      ".badge-text{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-weight:600;border-radius:4px;min-width:0;padding:2px 6px;}" +
      ".muted{color:#94a3b8;font-size:8pt;}" +
      ".footer{margin-top:10px;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8pt;color:#64748b;}" +
      "@media print{html,body{height:100%;}.page1{page-break-after:always;}.page2{page-break-inside:avoid;}}" +
      "</style></head><body>" +
      '<div class="page page1">' +
      '<header class="banner">' +
      "<h1>新規システム導入ヒアリング記録</h1>" +
      '<p class="sub">ヒアリング基本情報（稟議添付用）</p>' +
      "</header>" +
      '<div class="info-box">' +
      '<div class="info-grid">' +
      '<span class="lbl">ヒアリング日</span><span class="val">' +
      esc(form.hearing_date) +
      "</span>" +
      '<span class="lbl">記録者</span><span class="val">' +
      esc(form.recorder) +
      "</span>" +
      '<span class="lbl">申請者</span><span class="val">' +
      esc(form.applicant) +
      "</span>" +
      '<span class="lbl">利用部署</span><span class="val">' +
      esc(form.usage_dept) +
      "</span>" +
      '<span class="lbl">サービス名</span><span class="val">' +
      esc(serviceDisplay) +
      "</span>" +
      '<span class="lbl">ツール名</span><span class="val">' +
      esc(toolDisplay) +
      "</span>" +
      "</div>" +
      '<div class="full-row"><span class="lbl">導入経緯</span><span class="val">' +
      esc(form.intro_background) +
      "</span></div>" +
      '<div class="full-row"><span class="lbl">解決課題</span><span class="val">' +
      esc(form.issue_to_solve) +
      "</span></div>" +
      '<div class="full-row"><span class="lbl">機能・要件</span><span class="val">' +
      esc(form.func_requirements) +
      "</span></div>" +
      '<div class="full-row"><span class="lbl">予算概算</span><span class="val">' +
      esc(form.budget_estimate || "—") +
      "</span></div>" +
      "</div></div>" +
      '<div class="page page2">' +
      '<div class="section-title">§4 新規システム導入の基本ルール（3項目）</div>' +
      '<table class="print-table"><thead><tr><th>項目</th><th>該当</th><th>説明・補足</th></tr></thead><tbody>' +
      critRows +
      "</tbody></table>" +
      '<div class="section-title">§6 導入にあたっての注意点</div>' +
      '<table class="print-table"><thead><tr><th>確認項目</th><th>回答/担当</th><th>ガイドライン</th></tr></thead><tbody>' +
      confirmRows +
      "</tbody></table>" +
      '<div class="footer">' +
      "<span>株式会社 J-BIS — システム推進室</span>" +
      "<span>記録者: " +
      esc(form.recorder) +
      "　ヒアリング日: " +
      esc(form.hearing_date) +
      "</span></div></div>" +
      "<script>window.onload=function(){window.print();};</scr" + "ipt>" +
      "</body></html>"
    );
  }

  function openPrintIframe(form) {
    var html = buildPrintHtml(form);
    var iframe = document.getElementById("nsid-print-frame");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "nsid-print-frame";
      iframe.setAttribute("aria-hidden", "true");
      iframe.title = "print";
      iframe.style.cssText =
        "position:fixed;width:0;height:0;border:0;left:0;top:0;opacity:0;pointer-events:none;";
      document.body.appendChild(iframe);
    }
    var w = iframe.contentWindow;
    var d = w.document;
    d.open();
    d.write(html);
    d.close();
  }

  function openHearingModal(row) {
    var isEdit = !!row;
    var prefix = isEdit ? "nsid-edit" : "nsid-new";
    var title = isEdit
      ? "ヒアリング記録 — " + (row.service_name || row.tool_name || "（名称未設定）")
      : "新規ヒアリング";

    openModal(title, formBodyHtml(prefix, row), [
      { label: "キャンセル" },
      {
        label: "印刷",
        onClick: function () {
          var data = readFormValues(prefix);
          openPrintIframe(data);
        },
      },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          var data = readFormValues(prefix);
          var err = validateForm(data);
          if (err) {
            alert(err);
            return;
          }
          var rec = toKintoneRecord(data);
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
      "<p>ヒアリング日: <strong>" +
        esc(row.hearing_date) +
        "</strong></p>" +
        "<p>記録者: " +
        esc(row.recorder) +
        "</p>" +
        "<p>申請者: " +
        esc(row.applicant) +
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
    var tbody = document.getElementById("nsid-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="7">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7">該当なし</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        var cells = TABLE_COLUMNS.map(function (col) {
          return "<td>" + esc(displayCell(r, col)) + "</td>";
        }).join("");
        return (
          '<tr data-id="' +
          esc(r.id) +
          '">' +
          cells +
          '<td class="nsid-actions">' +
          '<button type="button" class="nsid-btn-view">表示・編集</button>' +
          '<button type="button" class="nsid-btn-del">削除</button>' +
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
      tr.querySelector(".nsid-btn-view").addEventListener("click", function () {
        openHearingModal(row);
      });
      tr.querySelector(".nsid-btn-del").addEventListener("click", function () {
        openDeleteModal(row);
      });
    });
  }

  function buildShell() {
    if (document.getElementById("nsid-root")) return;
    injectCss();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "nsid-root";
    root.className = "nsid-root";
    root.innerHTML =
      '<div class="nsid-toolbar">' +
      '<strong style="font-size:16px;color:#065f46">新規システム導入ヒアリング記録</strong>' +
      '<button type="button" id="nsid-add" class="kintoneplugin-button-dialog-ok">新規</button>' +
      '<button type="button" id="nsid-reload" class="kintoneplugin-button-normal">再読込</button>' +
      '<input type="search" id="nsid-search" placeholder="記録者・申請者・部署・サービス名・ツール名" style="min-width:280px;padding:6px;margin-left:8px">' +
      '<button type="button" id="nsid-clear" class="kintoneplugin-button-normal">クリア</button>' +
      "</div>" +
      '<div id="nsid-meta" class="nsid-meta"></div>' +
      '<div class="nsid-table-wrap"><table class="nsid-table"><thead><tr>' +
      TABLE_COLUMNS.map(function (c) {
        return (
          '<th' +
          (c.sortable ? ' class="nsid-sort" data-sort="' + esc(c.key) + '"' : "") +
          ">" +
          esc(c.label) +
          "</th>"
        );
      }).join("") +
      "<th>操作</th>" +
      '</tr></thead><tbody id="nsid-tbody"></tbody></table></div>';
    host.appendChild(root);

    document.getElementById("nsid-add").addEventListener("click", function () {
      openHearingModal(null);
    });
    document.getElementById("nsid-reload").addEventListener("click", reloadRecords);
    var search = document.getElementById("nsid-search");
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    document.getElementById("nsid-clear").addEventListener("click", function () {
      state.search = "";
      search.value = "";
      renderTable();
    });

    root.querySelector(".nsid-table thead").addEventListener("click", function (ev) {
      var th = ev.target.closest("th.nsid-sort");
      if (!th) return;
      var key = th.getAttribute("data-sort");
      if (!key) return;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = key === FC.hearing_date ? "desc" : "asc";
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
      console.info("[new-system-intro-dash] BUILD=" + BUILD + " APP_DB=" + APP_DB);
    }
    scheduleMount();
    return ev;
  });
})();
