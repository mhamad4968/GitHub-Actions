(function () {
  "use strict";

  /** 社内Wi-Fi管理台帳 ver.1 — 718 REST CRUD + 会議室掲示印刷（QR）+ 一覧印刷・Excel */
  var BUILD = "2026-08-03-wifi-ssid-dash-employee-only-print";
  var PRINT_COMPANY_NAME = "(株）J-BISメンテナンス";
  var EMPLOYEE_ONLY_NOTICE = "社外の方の利用は禁止です。当社社員のみ利用可能です。";

  var APP_DB = 718;
  var EQUIPMENT_NONE = "設備なし";
  var PAGE_SIZE = 100;

  var FC = {
    sort_no: "sort_no",
    location_name: "location_name",
    ssid_1: "ssid_1",
    password_1: "password_1",
    ssid_2: "ssid_2",
    password_2: "password_2",
    registered_date: "registered_date",
    updated_date: "updated_date",
    note: "note",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.sort_no,
    FC.location_name,
    FC.ssid_1,
    FC.password_1,
    FC.ssid_2,
    FC.password_2,
    FC.registered_date,
    FC.updated_date,
    FC.note,
  ];

  var SORT_COLUMNS = [
    { key: "sort_no", label: "並び" },
    { key: "location_name", label: "拠点名" },
    { key: "ssid_1", label: "SSID①" },
    { key: "password_1", label: "PW①" },
    { key: "ssid_2", label: "SSID②" },
    { key: "password_2", label: "PW②" },
    { key: "registered_date", label: "登録日" },
    { key: "updated_date", label: "更新日" },
  ];

  /** 一覧印刷・Excel 出力列（浜田 2026-07-07） */
  var LIST_EXPORT_FIELDS = [
    { key: "location_name", label: "拠点名" },
    { key: "ssid_1", label: "SSID①" },
    { key: "password_1", label: "SSID①のパスワード" },
    { key: "ssid_2", label: "SSID②" },
    { key: "password_2", label: "SSID②のパスワード" },
  ];

  var state = {
    records: [],
    search: "",
    loading: false,
    sortKey: "sort_no",
    sortDir: "asc",
    isAdmin: false,
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
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      sort_no: val(rec, FC.sort_no),
      location_name: val(rec, FC.location_name),
      ssid_1: val(rec, FC.ssid_1),
      password_1: val(rec, FC.password_1),
      ssid_2: val(rec, FC.ssid_2),
      password_2: val(rec, FC.password_2),
      registered_date: val(rec, FC.registered_date),
      updated_date: val(rec, FC.updated_date),
      note: val(rec, FC.note),
    };
  }

  function isEquipmentNone(row) {
    return String(row.ssid_1 || "").trim() === EQUIPMENT_NONE;
  }

  function isSystemAdmin() {
    try {
      if (typeof kintone.isUsersAndSystemAdministrator === "function") {
        return kintone.isUsersAndSystemAdministrator();
      }
    } catch (e) {
      console.warn(BUILD, e);
    }
    return false;
  }

  function toKintoneRecord(row) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
      else if (code === FC.ssid_2 || code === FC.password_2 || code === FC.note) {
        o[code] = { value: v || "" };
      }
    }
    set(FC.sort_no, row.sort_no);
    set(FC.location_name, row.location_name);
    set(FC.ssid_1, row.ssid_1);
    set(FC.password_1, row.password_1);
    set(FC.ssid_2, row.ssid_2);
    set(FC.password_2, row.password_2);
    set(FC.registered_date, row.registered_date);
    set(FC.updated_date, row.updated_date);
    set(FC.note, row.note);
    return o;
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
      var query = "order by sort_no asc limit " + PAGE_SIZE + " offset " + offset;
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

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        alert("コピーしました");
      });
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      alert("コピーしました");
    } catch (e) {
      alert("コピーに失敗しました");
    }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function injectCss() {
    if (document.getElementById("wfs-dash-css")) return;
    var st = document.createElement("style");
    st.id = "wfs-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".wfs-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".wfs-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".wfs-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;padding:10px 14px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;}" +
      ".wfs-table-wrap{overflow:auto;max-height:calc(100vh - 260px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".wfs-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1200px;}" +
      ".wfs-table th,.wfs-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle;}" +
      ".wfs-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;}" +
      ".wfs-table th.wfs-sort{cursor:pointer;user-select:none;}" +
      ".wfs-copy{cursor:pointer;font-family:Consolas,Monaco,monospace;font-size:12px;}" +
      ".wfs-copy:hover{text-decoration:underline;color:#0369a1;}" +
      ".wfs-actions button{margin:0 2px;padding:2px 6px;font-size:11px;}" +
      ".wfs-none{color:#64748b;font-style:italic;}" +
      ".wfs-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".wfs-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:560px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".wfs-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".wfs-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".wfs-modal input,.wfs-modal textarea{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".wfs-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      "#wfs-print-portal{display:none;}" +
      "@media print{#wfs-print-portal{display:block!important;position:absolute;left:0;top:0;width:100%;}body *{visibility:hidden!important;}#wfs-print-portal,#wfs-print-portal *{visibility:visible!important;}.wfs-root{display:none!important;}}";
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
    if (key === "sort_no") return Number(a.sort_no || 0) - Number(b.sort_no || 0);
    return String(a[key] || "").localeCompare(String(b[key] || ""), "ja");
  }

  function filteredRecords() {
    var q = state.search.trim().toLowerCase();
    var rows = state.records.filter(function (r) {
      if (!q) return true;
      return String(r.location_name || "").toLowerCase().indexOf(q) >= 0;
    });
    rows.sort(function (a, b) {
      var key = state.sortKey || "sort_no";
      var cmp = compareSortValues(key, a, b);
      return state.sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }

  /** 一覧印刷・Excel — 検索絞込後 · sort_no 昇順（台帳順） */
  function listExportRows() {
    var q = state.search.trim().toLowerCase();
    return state.records
      .filter(function (r) {
        if (!q) return true;
        return String(r.location_name || "").toLowerCase().indexOf(q) >= 0;
      })
      .sort(function (a, b) {
        return Number(a.sort_no || 0) - Number(b.sort_no || 0);
      });
  }

  function exportFieldValue(row, key) {
    return String(row[key] || "").trim() || "—";
  }

  function buildListExportTableHtml(rows, title) {
    var head = LIST_EXPORT_FIELDS.map(function (f, idx) {
      var cls = "wfspr-list-th";
      if (idx === 0) cls += " wfspr-list-th-loc";
      else if (idx === 1 || idx === 2) cls += " wfspr-list-th-g1";
      else cls += " wfspr-list-th-g2";
      return '<th class="' + cls + '">' + esc(f.label) + "</th>";
    }).join("");
    var body = rows
      .map(function (row, ri) {
        var none = isEquipmentNone(row);
        var trCls = "wfspr-list-tr" + (none ? " wfspr-list-tr-none" : "") + (ri % 2 === 1 ? " wfspr-list-tr-alt" : "");
        return (
          '<tr class="' + trCls + '">' +
          LIST_EXPORT_FIELDS.map(function (f, idx) {
            var tdCls = "wfspr-list-td";
            if (idx === 0) tdCls += " wfspr-list-td-loc";
            else if (idx === 2 || idx === 4) tdCls += " wfspr-list-td-pw";
            else if (idx === 1 || idx === 3) tdCls += " wfspr-list-td-ssid";
            return '<td class="' + tdCls + '">' + esc(exportFieldValue(row, f.key)) + "</td>";
          }).join("") +
          "</tr>"
        );
      })
      .join("");
    return (
      '<div class="wfspr-list-doc">' +
      '<header class="wfspr-list-header">' +
      '<p class="wfspr-list-org">' +
      esc(PRINT_COMPANY_NAME) +
      "</p>" +
      "<h1>" +
      esc(title) +
      "</h1>" +
      '<p class="wfspr-list-meta">出力日: ' +
      esc(todayJstYmd()) +
      "　全 " +
      rows.length +
      " 拠点</p>" +
      "</header>" +
      '<div class="wfspr-list-table-wrap">' +
      '<table class="wfspr-list-table"><thead><tr>' +
      head +
      "</tr></thead><tbody>" +
      body +
      "</tbody></table></div>" +
      '<footer class="wfspr-list-foot">社内限り · パスワードの取扱いに注意してください</footer>' +
      "</div>"
    );
  }

  function listPrintStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:16px;background:#f1f5f9;font-family:"Noto Sans JP",Meiryo,system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".wfspr-list-doc{max-width:100%;margin:0 auto;}" +
      ".wfspr-list-header{background:linear-gradient(135deg,#1d4ed8 0%,#0d9488 100%);color:#fff;border-radius:14px;padding:24px 28px 20px;margin-bottom:14px;text-align:center;box-shadow:0 4px 14px rgba(29,78,216,.25);}" +
      ".wfspr-list-org{margin:0 0 10px;font-size:13pt;font-weight:500;opacity:.92;letter-spacing:.06em;}" +
      ".wfspr-list-header h1{margin:0 0 10px;font-size:22pt;font-weight:700;line-height:1.3;}" +
      ".wfspr-list-meta{margin:0;font-size:12pt;opacity:.9;}" +
      ".wfspr-list-table-wrap{border-radius:12px;overflow:hidden;border:1px solid #cbd5e1;box-shadow:0 2px 12px rgba(15,23,42,.08);background:#fff;}" +
      ".wfspr-list-table{border-collapse:collapse;width:100%;font-size:11.5pt;}" +
      ".wfspr-list-table thead tr{background:linear-gradient(180deg,#1e3a8a 0%,#1e40af 100%);}" +
      ".wfspr-list-th{padding:13px 10px;text-align:left;font-weight:700;color:#fff;border-right:1px solid rgba(255,255,255,.15);vertical-align:middle;font-size:11.5pt;}" +
      ".wfspr-list-th:last-child{border-right:none;}" +
      ".wfspr-list-th-loc{background:#1e3a8a;}" +
      ".wfspr-list-th-g1{background:#2563eb;}" +
      ".wfspr-list-th-g2{background:#0d9488;}" +
      ".wfspr-list-tr{background:#fff;}" +
      ".wfspr-list-tr-alt{background:#f8fafc;}" +
      ".wfspr-list-tr-none{background:#f1f5f9;color:#64748b;}" +
      ".wfspr-list-td{padding:11px 10px;border-bottom:1px solid #e2e8f0;border-right:1px solid #f1f5f9;vertical-align:middle;word-break:break-all;line-height:1.55;}" +
      ".wfspr-list-td:last-child{border-right:none;}" +
      ".wfspr-list-td-loc{font-weight:700;color:#0f172a;min-width:6em;font-size:12pt;}" +
      ".wfspr-list-td-ssid{background:#eff6ff;color:#1e3a8a;font-weight:600;}" +
      ".wfspr-list-td-pw{background:#fffbeb;color:#92400e;font-family:Consolas,\"Courier New\",monospace;font-size:11pt;font-weight:600;}" +
      ".wfspr-list-tr-alt .wfspr-list-td-ssid{background:#dbeafe;}" +
      ".wfspr-list-tr-alt .wfspr-list-td-pw{background:#fef3c7;}" +
      ".wfspr-list-tr-none .wfspr-list-td-ssid,.wfspr-list-tr-none .wfspr-list-td-pw{background:#e2e8f0;color:#64748b;}" +
      ".wfspr-list-foot{margin-top:14px;text-align:center;font-size:11pt;color:#64748b;}" +
      "@media print{@page{size:A4 portrait;margin:7mm 6mm 5mm;}" +
      "body{padding:0;background:#fff;}" +
      ".wfspr-list-header{border-radius:8px;box-shadow:none;padding:22px 24px 18px;}" +
      ".wfspr-list-header h1{font-size:21pt;}" +
      ".wfspr-list-org{font-size:12.5pt;}" +
      ".wfspr-list-meta{font-size:11.5pt;}" +
      ".wfspr-list-table{font-size:12pt;}" +
      ".wfspr-list-th{padding:12px 10px;font-size:12pt;}" +
      ".wfspr-list-td{padding:12px 10px;}" +
      ".wfspr-list-td-loc{font-size:12.5pt;}" +
      ".wfspr-list-td-pw{font-size:11.5pt;}" +
      ".wfspr-list-table-wrap{box-shadow:none;border-radius:6px;}" +
      ".wfspr-list-tr{break-inside:avoid;page-break-inside:avoid;}}"
    );
  }

  function runListPrint(html) {
    var portal = document.getElementById("wfs-print-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "wfs-print-portal";
      document.body.appendChild(portal);
    }
    portal.innerHTML = "<style>" + listPrintStylesheet() + "</style>" + html;
    setTimeout(function () {
      window.print();
    }, 200);
  }

  function printList() {
    var rows = listExportRows();
    if (!rows.length) {
      alert("印刷対象がありません");
      return;
    }
    runListPrint(buildListExportTableHtml(rows, "社内 Wi-Fi 管理台帳 — 一覧"));
  }

  function exportListXlsx(rows) {
    if (typeof XLSX === "undefined" || !XLSX.utils || !XLSX.writeFile) {
      alert("xlsx ライブラリが読み込まれていません");
      return;
    }
    var header = LIST_EXPORT_FIELDS.map(function (f) {
      return f.label;
    });
    var matrix = [header];
    rows.forEach(function (row) {
      matrix.push(
        LIST_EXPORT_FIELDS.map(function (f) {
          var v = exportFieldValue(row, f.key);
          return v === "—" ? "" : v;
        }),
      );
    });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "一覧");
    XLSX.writeFile(wb, "社内WiFi管理台帳_" + todayJstYmd().replace(/-/g, "") + ".xlsx", { bookType: "xlsx" });
  }

  function exportXlsx() {
    var rows = listExportRows();
    if (!rows.length) {
      alert("出力対象がありません");
      return;
    }
    exportListXlsx(rows);
  }

  function closeModal() {
    var el = document.getElementById("wfs-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "wfs-modal-root";
    bg.className = "wfs-modal-bg";
    var box = document.createElement("div");
    box.className = "wfs-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "wfs-modal-actions";
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

  function updateMeta() {
    var el = document.getElementById("wfs-meta");
    if (!el) return;
    var html =
      "<span>全 " +
      esc(String(state.records.length)) +
      " 拠点</span>" +
      (state.isAdmin
        ? '<button type="button" id="wfs-new" class="kintoneplugin-button-dialog-ok" style="margin-left:auto">新規拠点</button>'
        : '<span style="margin-left:auto;font-size:12px;color:#64748b">閲覧のみ（編集はシステム管理者）</span>');
    el.innerHTML = html;
    var btn = document.getElementById("wfs-new");
    if (btn) btn.addEventListener("click", openNewModal);
  }

  function nextSortNo() {
    var max = 0;
    state.records.forEach(function (r) {
      var n = Number(r.sort_no);
      if (Number.isFinite(n)) max = Math.max(max, n);
    });
    return max + 1;
  }

  function formFieldsHtml(row, isNew) {
    var r = row || {};
    return (
      '<label>並び順（sort_no）<input type="number" id="wfs-f-sort" value="' +
      esc(r.sort_no || String(nextSortNo())) +
      '"></label>' +
      '<label>拠点名<input type="text" id="wfs-f-loc" value="' +
      esc(r.location_name || "") +
      '"></label>' +
      '<label>SSID①<input type="text" id="wfs-f-s1" value="' +
      esc(r.ssid_1 || "") +
      '"></label>' +
      '<label>SSIDパスワード①<input type="text" id="wfs-f-p1" value="' +
      esc(r.password_1 || "") +
      '"></label>' +
      '<label>SSID②<input type="text" id="wfs-f-s2" value="' +
      esc(r.ssid_2 || "") +
      '"></label>' +
      '<label>SSIDパスワード②<input type="text" id="wfs-f-p2" value="' +
      esc(r.password_2 || "") +
      '"></label>' +
      (isNew
        ? ""
        : '<label>登録日<input type="date" id="wfs-f-reg" value="' + esc(r.registered_date || "") + '"></label>') +
      '<label>備考<textarea id="wfs-f-note" rows="3">' +
      esc(r.note || "") +
      "</textarea></label>"
    );
  }

  function readForm(row, isNew) {
    var o = {
      sort_no: document.getElementById("wfs-f-sort").value.trim(),
      location_name: document.getElementById("wfs-f-loc").value.trim(),
      ssid_1: document.getElementById("wfs-f-s1").value.trim(),
      password_1: document.getElementById("wfs-f-p1").value.trim(),
      ssid_2: document.getElementById("wfs-f-s2").value.trim(),
      password_2: document.getElementById("wfs-f-p2").value.trim(),
      note: document.getElementById("wfs-f-note").value.trim(),
      updated_date: todayJstYmd(),
    };
    if (isNew) {
      o.registered_date = todayJstYmd();
    } else {
      o.registered_date = document.getElementById("wfs-f-reg").value.trim() || row.registered_date;
      o.id = row.id;
      o.revision = row.revision;
    }
    if (!o.location_name) throw new Error("拠点名は必須です");
    if (!o.ssid_1) throw new Error("SSID①は必須です");
    return o;
  }

  function openNewModal() {
    if (!state.isAdmin) return;
    openModal("新規拠点", formFieldsHtml(null, true), [
      { label: "キャンセル" },
      {
        label: "登録",
        primary: true,
        onClick: function (close) {
          var row;
          try {
            row = readForm(null, true);
          } catch (e) {
            alert(e.message || e);
            return;
          }
          apiPost("/k/v1/record.json", { app: APP_DB, record: toKintoneRecord(row) })
            .then(function () {
              close();
              reloadRecords();
            })
            .catch(function (e) {
              alert("登録失敗: " + (e.message || e));
            });
        },
      },
    ]);
  }

  function openEditModal(row) {
    if (!state.isAdmin) return;
    openModal("編集 — " + row.location_name, formFieldsHtml(row, false), [
      { label: "キャンセル" },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          var updated;
          try {
            updated = readForm(row, false);
          } catch (e) {
            alert(e.message || e);
            return;
          }
          apiPut("/k/v1/record.json", {
            app: APP_DB,
            id: Number(updated.id),
            revision: Number(updated.revision),
            record: toKintoneRecord(updated),
          })
            .then(function () {
              close();
              reloadRecords();
            })
            .catch(function (e) {
              alert("保存失敗: " + (e.message || e));
            });
        },
      },
    ]);
  }

  function openDeleteModal(row) {
    if (!state.isAdmin) return;
    openModal(
      "削除確認",
      "<p>拠点「" + esc(row.location_name) + "」を削除します。よろしいですか？</p>",
      [
        { label: "キャンセル" },
        {
          label: "削除",
          primary: true,
          onClick: function (close) {
            apiDelete("/k/v1/records.json", { app: APP_DB, ids: [Number(row.id)] })
              .then(function () {
                close();
                reloadRecords();
              })
              .catch(function (e) {
                alert("削除失敗: " + (e.message || e));
              });
          },
        },
      ],
    );
  }

  function cellCopyHtml(text) {
    var t = String(text || "").trim();
    if (!t) return '<span class="wfs-none">—</span>';
    return '<span class="wfs-copy" data-copy="' + esc(t) + '" title="クリックでコピー">' + esc(t) + "</span>";
  }

  function wifiQrPayload(ssid, password) {
    function escWifi(s) {
      return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/"/g, '\\"');
    }
    return "WIFI:T:WPA;S:" + escWifi(ssid) + ";P:" + escWifi(password) + ";;";
  }

  function buildSsidCardHtml(label, ssid, password, qrDataUrl) {
    if (!ssid) return "";
    var qrBlock = qrDataUrl
      ? '<div class="wfspr-qr"><img alt="QR" src="' + qrDataUrl + '" /></div>'
      : '<div class="wfspr-qr wfspr-qr-missing"><span class="wfspr-qr-placeholder">QR</span></div>';
    return (
      '<div class="wfspr-card">' +
      '<div class="wfspr-card-head">' +
      esc(label) +
      "</div>" +
      '<div class="wfspr-card-body">' +
      '<div class="wfspr-info">' +
      '<div class="wfspr-row"><span class="wfspr-lab">SSID</span><span class="wfspr-val">' +
      esc(ssid) +
      "</span></div>" +
      '<div class="wfspr-row"><span class="wfspr-lab">パスワード</span><span class="wfspr-val">' +
      esc(password) +
      "</span></div>" +
      "</div>" +
      qrBlock +
      "</div></div>"
    );
  }

  function buildPrintPageHtml(row, qrUrl1, qrUrl2) {
    var cards =
      buildSsidCardHtml("SSID①", row.ssid_1, row.password_1, qrUrl1) +
      (row.ssid_2 ? buildSsidCardHtml("SSID②", row.ssid_2, row.password_2, qrUrl2) : "");
    var noteBlock = row.note
      ? '<div class="wfspr-note"><strong>備考</strong><p>' + esc(row.note) + "</p></div>"
      : "";
    return (
      '<div class="wfspr-page">' +
      '<header class="wfspr-header">' +
      '<p class="wfspr-org">' +
      esc(PRINT_COMPANY_NAME) +
      "</p>" +
      '<p class="wfspr-loc">' +
      esc(row.location_name) +
      "</p>" +
      "<h1>Wi-Fi 接続情報</h1>" +
      '<p class="wfspr-employee-only">' +
      esc(EMPLOYEE_ONLY_NOTICE) +
      "</p></header>" +
      '<div class="wfspr-cards">' +
      cards +
      "</div>" +
      noteBlock +
      '<footer class="wfspr-foot">登録日: ' +
      esc(row.registered_date || "—") +
      "　更新日: " +
      esc(row.updated_date || "—") +
      "</footer></div>"
    );
  }

  function printStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:24px;background:#f8fafc;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".wfspr-page{max-width:720px;margin:0 auto;}" +
      ".wfspr-header{background:linear-gradient(135deg,#dbeafe 0%,#ecfdf5 100%);border:1px solid #cbd5e1;border-radius:16px;padding:28px 32px 24px;margin-bottom:24px;text-align:center;}" +
      ".wfspr-org{margin:0 0 12px;font-size:13pt;font-weight:500;color:#475569;letter-spacing:.04em;}" +
      ".wfspr-loc{margin:0 0 10px;font-size:28pt;font-weight:700;line-height:1.25;}" +
      ".wfspr-header h1{margin:0 0 12px;font-size:20pt;font-weight:700;color:#334155;}" +
      ".wfspr-employee-only{margin:0;padding:12px 18px;background:#fef2f2;border:2px solid #b91c1c;border-radius:10px;color:#9a3412;font-size:14pt;font-weight:700;line-height:1.5;text-align:center;}" +
      ".wfspr-cards{display:flex;flex-direction:column;gap:20px;}" +
      ".wfspr-card{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 4px 16px rgba(15,23,42,.06);break-inside:avoid;page-break-inside:avoid;}" +
      ".wfspr-card-head{background:#f1f5f9;padding:10px 18px;font-size:15pt;font-weight:700;color:#334155;}" +
      ".wfspr-card-body{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 22px;}" +
      ".wfspr-info{flex:1;min-width:0;}" +
      ".wfspr-row{margin-bottom:14px;}" +
      ".wfspr-row:last-child{margin-bottom:0;}" +
      ".wfspr-lab{display:block;font-size:14pt;font-weight:700;color:#64748b;margin-bottom:6px;}" +
      ".wfspr-val{display:block;font-size:20pt;font-weight:700;line-height:1.4;word-break:break-all;}" +
      ".wfspr-qr img{width:45mm;height:45mm;display:block;}" +
      ".wfspr-qr-missing{width:45mm;height:45mm;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:12pt;}" +
      ".wfspr-note{margin-top:20px;padding:14px 18px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-size:11pt;color:#475569;}" +
      ".wfspr-note p{margin:6px 0 0;}" +
      ".wfspr-foot{margin-top:24px;text-align:center;font-size:10pt;color:#64748b;}" +
      "@media print{@page{size:A4 portrait;margin:10mm;}" +
      "body{padding:0;background:#fff;}" +
      ".wfspr-header{border-radius:0;}" +
      ".wfspr-card{box-shadow:none;}" +
      ".wfspr-org{font-size:12pt;}" +
      ".wfspr-loc{font-size:26pt;}" +
      ".wfspr-header h1{font-size:18pt;}" +
      ".wfspr-val{font-size:18pt;}" +
      ".wfspr-qr img{width:48mm;height:48mm;}}"
    );
  }

  function getQrLib() {
    if (typeof QRCode !== "undefined" && QRCode.toDataURL) return QRCode;
    return null;
  }

  function makeQrDataUrl(ssid, password) {
    var lib = getQrLib();
    if (!lib || !ssid || !password) return Promise.resolve("");
    var payload = wifiQrPayload(ssid, password);
    return new Promise(function (resolve) {
      lib.toDataURL(payload, { width: 480, margin: 1, errorCorrectionLevel: "M" }, function (err, url) {
        resolve(!err && url ? url : "");
      });
    });
  }

  function triggerPrintWhenReady(w) {
    var imgs = w.document.querySelectorAll(".wfspr-qr img");
    if (!imgs.length) {
      setTimeout(function () {
        try {
          w.print();
        } catch (e) {
          console.warn(BUILD, e);
        }
      }, 300);
      return;
    }
    var pending = imgs.length;
    function done() {
      pending -= 1;
      if (pending <= 0) {
        setTimeout(function () {
          try {
            w.print();
          } catch (e) {
            console.warn(BUILD, e);
          }
        }, 200);
      }
    }
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete && imgs[i].naturalWidth > 0) done();
      else {
        imgs[i].onload = done;
        imgs[i].onerror = done;
      }
    }
  }

  function openPrintWindow(row) {
    if (isEquipmentNone(row)) return;
    if (!getQrLib()) {
      alert("QR ライブラリが読み込まれていません。ページを再読込してください。");
      return;
    }
    Promise.all([
      makeQrDataUrl(row.ssid_1, row.password_1),
      row.ssid_2 && row.password_2 ? makeQrDataUrl(row.ssid_2, row.password_2) : Promise.resolve(""),
    ])
      .then(function (urls) {
        var w = window.open("", "_blank");
        if (!w) {
          alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
          return;
        }
        w.opener = null;
        var page = buildPrintPageHtml(row, urls[0], urls[1]);
        var docHtml =
          '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          "<title>Wi-Fi 接続情報 — " +
          esc(row.location_name) +
          "</title><style>" +
          printStylesheet() +
          "</style></head><body>" +
          page +
          "</body></html>";
        var d = w.document;
        d.open();
        d.write(docHtml);
        d.close();
        w.focus();
        triggerPrintWhenReady(w);
      })
      .catch(function (e) {
        alert("QR 生成に失敗しました: " + (e.message || e));
      });
  }

  function toggleSort(key) {
    if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    else {
      state.sortKey = key;
      state.sortDir = key === "sort_no" ? "asc" : "asc";
    }
    updateSortHeaders();
    renderTable();
  }

  function updateSortHeaders() {
    document.querySelectorAll(".wfs-table th.wfs-sort").forEach(function (th) {
      var key = th.getAttribute("data-sort");
      var ind = th.querySelector(".wfs-sort-ind");
      if (!ind) return;
      if (key === state.sortKey) ind.textContent = state.sortDir === "asc" ? " ▲" : " ▼";
      else ind.textContent = "";
    });
  }

  function renderTable() {
    var tbody = document.getElementById("wfs-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="10">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="10">該当なし</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (row) {
        var adminBtns = state.isAdmin
          ? '<button type="button" class="wfs-btn-edit">編集</button>' +
            '<button type="button" class="wfs-btn-del">削除</button>'
          : "";
        var printBtn = isEquipmentNone(row)
          ? ""
          : '<button type="button" class="wfs-btn-print">印刷</button>';
        return (
          "<tr>" +
          "<td>" +
          esc(row.sort_no) +
          "</td>" +
          "<td>" +
          esc(row.location_name) +
          "</td>" +
          "<td>" +
          cellCopyHtml(row.ssid_1) +
          "</td>" +
          "<td>" +
          cellCopyHtml(row.password_1) +
          "</td>" +
          "<td>" +
          cellCopyHtml(row.ssid_2) +
          "</td>" +
          "<td>" +
          cellCopyHtml(row.password_2) +
          "</td>" +
          "<td>" +
          esc(row.registered_date) +
          "</td>" +
          "<td>" +
          esc(row.updated_date) +
          "</td>" +
          "<td>" +
          (row.note ? esc(row.note) : '<span class="wfs-none">—</span>') +
          "</td>" +
          '<td class="wfs-actions">' +
          printBtn +
          adminBtns +
          "</td></tr>"
        );
      })
      .join("");

    tbody.querySelectorAll(".wfs-copy").forEach(function (el) {
      el.addEventListener("click", function () {
        copyText(el.getAttribute("data-copy") || "");
      });
    });
    rows.forEach(function (row, idx) {
      var tr = tbody.rows[idx];
      if (!tr) return;
      var printB = tr.querySelector(".wfs-btn-print");
      if (printB) {
        printB.addEventListener("click", function () {
          openPrintWindow(row);
        });
      }
      var editB = tr.querySelector(".wfs-btn-edit");
      if (editB) editB.addEventListener("click", function () {
        openEditModal(row);
      });
      var delB = tr.querySelector(".wfs-btn-del");
      if (delB) delB.addEventListener("click", function () {
        openDeleteModal(row);
      });
    });
    updateSortHeaders();
  }

  function buildShell() {
    if (document.getElementById("wfs-root")) return;
    injectCss();
    state.isAdmin = isSystemAdmin();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "wfs-root";
    root.className = "wfs-root";
    root.innerHTML =
      '<div class="wfs-toolbar">' +
      "<strong style=\"font-size:16px\">社内 Wi-Fi 管理台帳</strong>" +
      '<button type="button" id="wfs-reload" class="kintoneplugin-button-normal">再読込</button>' +
      '<button type="button" id="wfs-print-list" class="kintoneplugin-button-normal">一覧印刷</button>' +
      '<button type="button" id="wfs-xlsx" class="kintoneplugin-button-normal">Excel出力</button>' +
      "</div>" +
      '<div class="wfs-toolbar">' +
      '<input type="search" id="wfs-search" placeholder="拠点名で検索" style="min-width:220px;padding:6px">' +
      "</div>" +
      '<div id="wfs-meta" class="wfs-meta"></div>' +
      '<div class="wfs-table-wrap"><table class="wfs-table"><thead><tr>' +
      SORT_COLUMNS.map(function (c) {
        return (
          '<th class="wfs-sort" data-sort="' +
          esc(c.key) +
          '">' +
          esc(c.label) +
          '<span class="wfs-sort-ind"></span></th>'
        );
      }).join("") +
      "<th>備考</th><th>操作</th>" +
      '</tr></thead><tbody id="wfs-tbody"></tbody></table></div>';
    host.appendChild(root);

    var table = root.querySelector(".wfs-table");
    if (table) {
      table.querySelector("thead").addEventListener("click", function (ev) {
        var th = ev.target.closest("th.wfs-sort");
        if (!th) return;
        var key = th.getAttribute("data-sort");
        if (key) toggleSort(key);
      });
    }

    document.getElementById("wfs-reload").addEventListener("click", function () {
      reloadRecords();
    });
    document.getElementById("wfs-print-list").addEventListener("click", printList);
    document.getElementById("wfs-xlsx").addEventListener("click", exportXlsx);
    var search = document.getElementById("wfs-search");
    search.value = state.search;
    search.addEventListener("input", function () {
      state.search = search.value;
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
    scheduleMount();
    return ev;
  });
})();
