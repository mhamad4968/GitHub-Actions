(function () {
  "use strict";

  /** JRシステム用iPad管理台帳 ver.1 — DB REST CRUD + 部署×ステータス集計 + A4印刷 */
  var BUILD = "2026-06-15-jr-ipad-dash-v1";

  var APP_DB = 720;
  var FIXED_APPLE_PW = "Honten00";
  var PAGE_SIZE = 100;

  var FC = {
    sort_no: "sort_no",
    status: "status",
    mgmt_dept: "mgmt_dept",
    device_name: "device_name",
    phone_number: "phone_number",
    apple_id: "apple_id",
    apple_pw: "apple_pw",
    loan_company: "loan_company",
    loan_person: "loan_person",
    model: "model",
    purchase_date: "purchase_date",
    purchase_vendor: "purchase_vendor",
    note: "note",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.sort_no,
    FC.status,
    FC.mgmt_dept,
    FC.device_name,
    FC.phone_number,
    FC.apple_id,
    FC.apple_pw,
    FC.loan_company,
    FC.loan_person,
    FC.model,
    FC.purchase_date,
    FC.purchase_vendor,
    FC.note,
  ];

  var STATUS_VALUES = ["待機", "貸出中", "確認中", "故障", "廃棄"];

  var SUMMARY_COLUMNS = ["貸出中", "待機", "故障", "確認中", "廃棄"];

  var PURCHASE_VENDORS = ["au", "ドコモ", "ソフトバンク"];

  /** §8 — Wi-Fi 718/719 同名・同順（sort 1〜22） */
  var MGMT_DEPTS = [
    { sort_no: 1, name: "本社" },
    { sort_no: 2, name: "東北支店" },
    { sort_no: 3, name: "秋田営業所" },
    { sort_no: 4, name: "盛岡営業所" },
    { sort_no: 5, name: "仙台営業所" },
    { sort_no: 6, name: "関越支店" },
    { sort_no: 7, name: "新潟営業所" },
    { sort_no: 8, name: "長野営業所" },
    { sort_no: 9, name: "高崎営業所" },
    { sort_no: 10, name: "東京支店" },
    { sort_no: 11, name: "千葉営業所" },
    { sort_no: 12, name: "水戸営業所" },
    { sort_no: 13, name: "鎌ヶ谷事務所" },
    { sort_no: 14, name: "東海支店" },
    { sort_no: 15, name: "東京営業所" },
    { sort_no: 16, name: "静岡営業所" },
    { sort_no: 17, name: "名古屋営業所" },
    { sort_no: 18, name: "関西営業所" },
    { sort_no: 19, name: "札幌支店" },
    { sort_no: 20, name: "首都圏支店" },
    { sort_no: 21, name: "鉄構支店" },
    { sort_no: 22, name: "湾岸工事所" },
  ];

  var LIST_COLUMNS = [
    { key: "status", label: "ステータス" },
    { key: "mgmt_dept", label: "管理部署" },
    { key: "device_name", label: "端末名" },
    { key: "phone_number", label: "電話番号" },
    { key: "apple_id", label: "Apple ID" },
    { key: "apple_pw", label: "Apple PW" },
    { key: "loan_company", label: "貸出先会社" },
    { key: "loan_person", label: "貸出先氏名" },
    { key: "model", label: "モデル" },
    { key: "purchase_date", label: "購入日" },
    { key: "purchase_vendor", label: "購入先" },
    { key: "note", label: "備考" },
  ];

  var state = {
    records: [],
    search: "",
    filterStatus: "",
    filterDept: "",
    loading: false,
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
      status: val(rec, FC.status),
      mgmt_dept: val(rec, FC.mgmt_dept),
      device_name: val(rec, FC.device_name),
      phone_number: val(rec, FC.phone_number),
      apple_id: val(rec, FC.apple_id),
      apple_pw: val(rec, FC.apple_pw),
      loan_company: val(rec, FC.loan_company),
      loan_person: val(rec, FC.loan_person),
      model: val(rec, FC.model),
      purchase_date: val(rec, FC.purchase_date),
      purchase_vendor: val(rec, FC.purchase_vendor),
      note: val(rec, FC.note),
    };
  }

  function sortNoForDept(deptName) {
    var name = String(deptName || "").trim();
    for (var i = 0; i < MGMT_DEPTS.length; i++) {
      if (MGMT_DEPTS[i].name === name) return MGMT_DEPTS[i].sort_no;
    }
    return null;
  }

  function normalizePhoneInput(s) {
    return String(s == null ? "" : s)
      .normalize("NFKC")
      .replace(/\s+/g, "");
  }

  function phoneDigits(s) {
    return normalizePhoneInput(s).replace(/\D/g, "");
  }

  function normalizeModel(s) {
    return String(s == null ? "" : s).normalize("NFKC").trim();
  }

  function distinctModels() {
    var seen = {};
    var list = [];
    state.records.forEach(function (r) {
      var raw = String(r.model || "").trim();
      if (!raw) return;
      var key = normalizeModel(raw);
      if (!key || seen[key]) return;
      seen[key] = true;
      list.push(raw);
    });
    list.sort(function (a, b) {
      return normalizeModel(a).localeCompare(normalizeModel(b), "ja");
    });
    return list;
  }

  function canonicalModel(input) {
    var norm = normalizeModel(input);
    if (!norm) return "";
    var models = distinctModels();
    for (var i = 0; i < models.length; i++) {
      if (normalizeModel(models[i]) === norm) return models[i];
    }
    return norm;
  }

  function formatJbisDevice(n) {
    return "JBIS" + String(n).padStart(3, "0");
  }

  function formatJrAppleId(n) {
    return "jb" + String(n).padStart(3, "0") + "m@icloud.com";
  }

  function nextJbisDevice(records) {
    var max = 0;
    records.forEach(function (r) {
      var m = String(r.device_name || "").match(/^JBIS(\d{3})$/i);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return formatJbisDevice(max + 1);
  }

  function nextJrAppleId(records) {
    var max = 0;
    records.forEach(function (r) {
      var m = String(r.apple_id || "").match(/^jb(\d{3})m@icloud\.com$/i);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return formatJrAppleId(max + 1);
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
      else if (
        code === FC.loan_company ||
        code === FC.loan_person ||
        code === FC.note ||
        code === FC.sort_no
      ) {
        o[code] = { value: v || "" };
      }
    }
    set(FC.sort_no, row.sort_no);
    set(FC.status, row.status);
    set(FC.mgmt_dept, row.mgmt_dept);
    set(FC.device_name, row.device_name);
    set(FC.phone_number, row.phone_number);
    set(FC.apple_id, row.apple_id);
    set(FC.apple_pw, row.apple_pw);
    set(FC.loan_company, row.loan_company);
    set(FC.loan_person, row.loan_person);
    set(FC.model, row.model);
    set(FC.purchase_date, row.purchase_date);
    set(FC.purchase_vendor, row.purchase_vendor);
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
      var query = "order by sort_no asc, device_name asc limit " + PAGE_SIZE + " offset " + offset;
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

  function validateRequired(row) {
    if (!String(row.mgmt_dept || "").trim()) throw new Error("管理部署は必須です");
    if (!String(row.device_name || "").trim()) throw new Error("端末名は必須です");
    if (!String(row.phone_number || "").trim()) throw new Error("電話番号は必須です");
    if (!String(row.apple_id || "").trim()) throw new Error("Apple ID は必須です");
    if (!String(row.apple_pw || "").trim()) throw new Error("Apple PW は必須です");
    if (!String(row.model || "").trim()) throw new Error("モデルは必須です");
    if (!String(row.purchase_date || "").trim()) throw new Error("購入日は必須です");
    if (!String(row.purchase_vendor || "").trim()) throw new Error("購入先は必須です");
    if (!String(row.status || "").trim()) throw new Error("ステータスは必須です");
  }

  function checkDuplicates(row, excludeId) {
    var device = String(row.device_name || "").trim();
    var digits = phoneDigits(row.phone_number);
    for (var i = 0; i < state.records.length; i++) {
      var r = state.records[i];
      if (excludeId && r.id === excludeId) continue;
      if (device && String(r.device_name || "").trim() === device) {
        throw new Error("端末名「" + device + "」は既に登録されています");
      }
      if (digits && phoneDigits(r.phone_number) === digits) {
        throw new Error("電話番号（数字のみ照合）が既に登録されています");
      }
    }
  }

  function prepareRowFromForm(row, isNew) {
    var dept = document.getElementById("jip-f-dept").value.trim();
    var sortNo = sortNoForDept(dept);
    if (sortNo == null) throw new Error("管理部署が不正です");
    var phone = normalizePhoneInput(document.getElementById("jip-f-phone").value);
    var model = canonicalModel(document.getElementById("jip-f-model").value);
    var o = {
      sort_no: String(sortNo),
      status: document.getElementById("jip-f-status").value.trim(),
      mgmt_dept: dept,
      device_name: document.getElementById("jip-f-device").value.trim(),
      phone_number: phone,
      apple_id: document.getElementById("jip-f-apple-id").value.trim(),
      apple_pw: document.getElementById("jip-f-apple-pw").value.trim(),
      loan_company: document.getElementById("jip-f-loan-co").value.trim(),
      loan_person: document.getElementById("jip-f-loan-person").value.trim(),
      model: model,
      purchase_date: document.getElementById("jip-f-purchase-date").value.trim(),
      purchase_vendor: document.getElementById("jip-f-purchase-vendor").value.trim(),
      note: document.getElementById("jip-f-note").value.trim(),
    };
    validateRequired(o);
    checkDuplicates(o, isNew ? null : row.id);
    if (!isNew) {
      o.id = row.id;
      o.revision = row.revision;
    }
    return o;
  }

  function injectCss() {
    if (document.getElementById("jip-dash-css")) return;
    var st = document.createElement("style");
    st.id = "jip-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".jip-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".jip-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".jip-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-bottom:12px;padding:16px 20px;" +
      "background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:2px solid #3b82f6;border-radius:12px;" +
      "box-shadow:0 2px 8px rgba(59,130,246,.15);}" +
      ".jip-meta-count{font-size:13px;color:#475569;font-weight:500;white-space:nowrap;}" +
      ".jip-next-slot{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px;flex:1;min-width:280px;}" +
      ".jip-next-label{font-size:13px;font-weight:700;color:#1d4ed8;}" +
      ".jip-next-id{font-size:1.35rem;font-weight:700;font-family:Consolas,Monaco,monospace;color:#1e3a8a;}" +
      ".jip-next-action{margin-left:auto;white-space:nowrap;font-size:14px;padding:8px 18px;}" +
      ".jip-readonly-msg{font-size:12px;color:#64748b;margin-left:auto;}" +
      ".jip-summary-wrap{margin-bottom:14px;overflow:auto;border:1px solid #cbd5e1;border-radius:6px;}" +
      ".jip-summary{border-collapse:collapse;width:100%;font-size:12px;min-width:640px;}" +
      ".jip-summary th,.jip-summary td{border:1px solid #e2e8f0;padding:4px 8px;text-align:center;}" +
      ".jip-summary th{background:#f1f5f9;}" +
      ".jip-summary td.jip-dept{text-align:left;font-weight:600;white-space:nowrap;}" +
      ".jip-summary tr.jip-summary-total td{font-weight:700;background:#f8fafc;}" +
      ".jip-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".jip-filters input,.jip-filters select{padding:6px;font-size:13px;}" +
      ".jip-table-wrap{overflow:auto;max-height:calc(100vh - 420px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".jip-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1400px;}" +
      ".jip-table th,.jip-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle;}" +
      ".jip-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;}" +
      ".jip-none{color:#64748b;font-style:italic;}" +
      ".jip-actions button{margin:0 2px;padding:2px 6px;font-size:11px;}" +
      ".jip-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".jip-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:560px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".jip-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".jip-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".jip-modal input,.jip-modal select,.jip-modal textarea{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".jip-modal-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      ".jip-modal-delete{margin-right:auto;}";
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

  function compareDefaultSort(a, b) {
    var sa = Number(a.sort_no || 0);
    var sb = Number(b.sort_no || 0);
    if (sa !== sb) return sa - sb;
    return String(a.device_name || "").localeCompare(String(b.device_name || ""), "ja");
  }

  function filteredRecords() {
    var q = state.search.trim().toLowerCase();
    var rows = state.records.filter(function (r) {
      if (state.filterStatus && r.status !== state.filterStatus) return false;
      if (state.filterDept && r.mgmt_dept !== state.filterDept) return false;
      if (!q) return true;
      var hay = [
        r.device_name,
        r.phone_number,
        r.apple_id,
        r.loan_company,
        r.loan_person,
        r.model,
        r.note,
      ]
        .join(" ")
        .toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    rows.sort(compareDefaultSort);
    return rows;
  }

  function buildSummaryCounts() {
    var grid = {};
    MGMT_DEPTS.forEach(function (d) {
      grid[d.name] = {};
      SUMMARY_COLUMNS.forEach(function (st) {
        grid[d.name][st] = 0;
      });
    });
    state.records.forEach(function (r) {
      var dept = String(r.mgmt_dept || "").trim();
      var st = String(r.status || "").trim();
      if (!grid[dept]) return;
      if (grid[dept][st] != null) grid[dept][st] += 1;
    });
    return grid;
  }

  function renderSummary() {
    var el = document.getElementById("jip-summary-tbody");
    if (!el) return;
    var grid = buildSummaryCounts();
    var colTotals = {};
    SUMMARY_COLUMNS.forEach(function (st) {
      colTotals[st] = 0;
    });
    var grand = 0;
    el.innerHTML = MGMT_DEPTS.map(function (d) {
      var row = grid[d.name] || {};
      var rowTotal = 0;
      var cells = SUMMARY_COLUMNS.map(function (st) {
        var n = row[st] || 0;
        rowTotal += n;
        colTotals[st] += n;
        return "<td>" + esc(String(n)) + "</td>";
      }).join("");
      grand += rowTotal;
      return (
        "<tr><td class=\"jip-dept\">" +
        esc(d.name) +
        "</td>" +
        cells +
        "<td><strong>" +
        esc(String(rowTotal)) +
        "</strong></td></tr>"
      );
    }).join("");
    var totalCells = SUMMARY_COLUMNS.map(function (st) {
      return "<td><strong>" + esc(String(colTotals[st])) + "</strong></td>";
    }).join("");
    el.innerHTML +=
      '<tr class="jip-summary-total"><td class="jip-dept">合計</td>' +
      totalCells +
      "<td><strong>" +
      esc(String(grand)) +
      "</strong></td></tr>";
  }

  function closeModal() {
    var el = document.getElementById("jip-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "jip-modal-root";
    bg.className = "jip-modal-bg";
    var box = document.createElement("div");
    box.className = "jip-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "jip-modal-actions";
    buttons.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      if (b.danger) btn.className = "jip-modal-delete kintoneplugin-button-normal";
      else btn.className = b.primary ? "kintoneplugin-button-dialog-ok" : "kintoneplugin-button-normal";
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

  function deptOptionsHtml(selected) {
    return (
      '<option value="">—</option>' +
      MGMT_DEPTS.map(function (d) {
        return (
          '<option value="' +
          esc(d.name) +
          '"' +
          (selected === d.name ? " selected" : "") +
          ">" +
          esc(d.name) +
          "</option>"
        );
      }).join("")
    );
  }

  function statusOptionsHtml(selected) {
    return STATUS_VALUES.map(function (s) {
      return (
        '<option value="' +
        esc(s) +
        '"' +
        (selected === s ? " selected" : "") +
        ">" +
        esc(s) +
        "</option>"
      );
    }).join("");
  }

  function vendorOptionsHtml(selected) {
    return PURCHASE_VENDORS.map(function (v) {
      return (
        '<option value="' +
        esc(v) +
        '"' +
        (selected === v ? " selected" : "") +
        ">" +
        esc(v) +
        "</option>"
      );
    }).join("");
  }

  function modelDatalistHtml() {
    return distinctModels()
      .map(function (m) {
        return "<option value=\"" + esc(m) + "\"></option>";
      })
      .join("");
  }

  function formFieldsHtml(row) {
    var r = row || {};
    return (
      '<datalist id="jip-model-list">' +
      modelDatalistHtml() +
      "</datalist>" +
      '<label>ステータス<select id="jip-f-status">' +
      statusOptionsHtml(r.status || "待機") +
      "</select></label>" +
      '<label>管理部署<select id="jip-f-dept">' +
      deptOptionsHtml(r.mgmt_dept) +
      "</select></label>" +
      '<label>端末名<input type="text" id="jip-f-device" value="' +
      esc(r.device_name || "") +
      '"></label>' +
      '<label>電話番号<input type="text" id="jip-f-phone" value="' +
      esc(r.phone_number || "") +
      '"></label>' +
      '<label>Apple ID<input type="text" id="jip-f-apple-id" value="' +
      esc(r.apple_id || "") +
      '" autocomplete="off"></label>' +
      '<label>Apple PW<input type="text" id="jip-f-apple-pw" value="' +
      esc(r.apple_pw || "") +
      '" autocomplete="off"></label>' +
      '<label>貸出先会社<input type="text" id="jip-f-loan-co" value="' +
      esc(r.loan_company || "") +
      '"></label>' +
      '<label>貸出先氏名<input type="text" id="jip-f-loan-person" value="' +
      esc(r.loan_person || "") +
      '"></label>' +
      '<label>モデル<input type="text" id="jip-f-model" list="jip-model-list" value="' +
      esc(r.model || "") +
      '"></label>' +
      '<label>購入日<input type="date" id="jip-f-purchase-date" value="' +
      esc(r.purchase_date || "") +
      '"></label>' +
      '<label>購入先<select id="jip-f-purchase-vendor">' +
      vendorOptionsHtml(r.purchase_vendor || "au") +
      "</select></label>" +
      '<label>備考<textarea id="jip-f-note" rows="3">' +
      esc(r.note || "") +
      "</textarea></label>"
    );
  }

  function openEditModal(row) {
    if (!state.isAdmin) return;
    var buttons = [
      { label: "キャンセル" },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          var updated;
          try {
            updated = prepareRowFromForm(row, false);
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
              alert("保存しました");
            })
            .catch(function (e) {
              alert("保存失敗: " + (e.message || e));
            });
        },
      },
    ];
    if (row.id) {
      buttons.unshift({
        label: "削除",
        danger: true,
        onClick: function () {
          openDeleteConfirm(row);
        },
      });
    }
    openModal("編集 — " + (row.device_name || ""), formFieldsHtml(row), buttons);
  }

  function openDeleteConfirm(row) {
    openModal(
      "削除確認",
      "<p>端末「<strong>" +
        esc(row.device_name) +
        "</strong>」を削除します。よろしいですか？</p>",
      [
        { label: "キャンセル" },
        {
          label: "削除する",
          primary: true,
          onClick: function (close) {
            apiDelete("/k/v1/records.json", { app: APP_DB, ids: [Number(row.id)] })
              .then(function () {
                close();
                closeModal();
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

  function createNewDevice() {
    if (!state.isAdmin) return;
    var deviceName = nextJbisDevice(state.records);
    var appleId = nextJrAppleId(state.records);
    if (!window.confirm(deviceName + " / " + appleId + " を新規作成します。よろしいですか？")) return;
    var rec = toKintoneRecord({
      device_name: deviceName,
      apple_id: appleId,
      apple_pw: FIXED_APPLE_PW,
      status: "待機",
      purchase_date: todayJstYmd(),
      purchase_vendor: "au",
    });
    apiPost("/k/v1/record.json", { app: APP_DB, record: rec })
      .then(function (resp) {
        var newId = resp.id != null ? String(resp.id) : null;
        return reloadRecords().then(function () {
          var row =
            state.records.find(function (x) {
              return newId && x.id === newId;
            }) ||
            state.records.find(function (x) {
              return x.device_name === deviceName;
            });
          if (row) openEditModal(row);
          alert("新規端末を作成しました。必須項目を入力して保存してください。");
        });
      })
      .catch(function (e) {
        alert("作成失敗: " + (e.message || e));
      });
  }

  function updateMeta() {
    var el = document.getElementById("jip-meta");
    if (!el) return;
    var nextDevice = nextJbisDevice(state.records);
    var nextApple = nextJrAppleId(state.records);
    var html =
      '<span class="jip-meta-count">全 ' +
      esc(String(state.records.length)) +
      " 台</span>" +
      '<div class="jip-next-slot">' +
      '<div><span class="jip-next-label">次の端末名</span> <span class="jip-next-id">' +
      esc(nextDevice) +
      "</span></div>" +
      '<div><span class="jip-next-label">次の Apple ID</span> <span class="jip-next-id">' +
      esc(nextApple) +
      "</span></div></div>";
    if (state.isAdmin) {
      html +=
        '<button type="button" id="jip-new-device" class="jip-next-action kintoneplugin-button-dialog-ok">新規端末を作成</button>';
    } else {
      html += '<span class="jip-readonly-msg">閲覧のみ（編集はシステム管理者）</span>';
    }
    el.innerHTML = html;
    var btn = document.getElementById("jip-new-device");
    if (btn) btn.addEventListener("click", createNewDevice);
  }

  function reloadRecords() {
    state.loading = true;
    renderTable();
    return fetchAllRecords()
      .then(function (rows) {
        state.records = rows.map(flatten);
        state.loading = false;
        renderSummary();
        renderTable();
        updateMeta();
      })
      .catch(function (e) {
        state.loading = false;
        renderTable();
        alert("読込失敗: " + (e.message || e));
      });
  }

  function cellText(text) {
    var t = String(text || "").trim();
    if (!t) return '<span class="jip-none">—</span>';
    return esc(t);
  }

  function printVal(raw) {
    var s = String(raw == null ? "" : raw).trim();
    return s || "—";
  }

  function buildPrintPageHtml(row) {
    var rows = [
      { label: "端末名", value: row.device_name },
      { label: "管理部署", value: row.mgmt_dept },
      { label: "電話番号", value: row.phone_number },
      { label: "Apple ID", value: row.apple_id },
      { label: "Apple PW", value: row.apple_pw },
    ];
    var body = rows
      .map(function (item) {
        return (
          '<div class="jippr-row"><span class="jippr-lab">' +
          esc(item.label) +
          '</span><span class="jippr-val">' +
          esc(printVal(item.value)) +
          "</span></div>"
        );
      })
      .join("");
    return (
      '<div class="jippr-page">' +
      '<header class="jippr-header"><h1>JRシステム用 iPad アカウント情報</h1></header>' +
      '<div class="jippr-body">' +
      body +
      "</div></div>"
    );
  }

  function printStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:24px;background:#f8fafc;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".jippr-page{max-width:720px;margin:0 auto;}" +
      ".jippr-header{background:linear-gradient(135deg,#dbeafe 0%,#eff6ff 100%);border:1px solid #cbd5e1;border-radius:16px;padding:28px 32px 24px;margin-bottom:24px;text-align:center;}" +
      ".jippr-header h1{margin:0;font-size:20pt;font-weight:700;color:#1e3a8a;}" +
      ".jippr-body{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px 28px;box-shadow:0 4px 16px rgba(15,23,42,.06);}" +
      ".jippr-row{margin-bottom:18px;}" +
      ".jippr-row:last-child{margin-bottom:0;}" +
      ".jippr-lab{display:block;font-size:12pt;font-weight:700;color:#64748b;margin-bottom:6px;}" +
      ".jippr-val{display:block;font-size:18pt;font-weight:700;line-height:1.4;word-break:break-all;}" +
      "@media print{@page{size:A4 portrait;margin:10mm;}" +
      "body{padding:0;background:#fff;}" +
      ".jippr-header{border-radius:0;}" +
      ".jippr-body{box-shadow:none;}" +
      ".jippr-header h1{font-size:18pt;}" +
      ".jippr-val{font-size:16pt;}}"
    );
  }

  function openPrintWindow(row) {
    if (!state.isAdmin) return;
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var page = buildPrintPageHtml(row);
    var docHtml =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      "<title>JR iPad — " +
      esc(row.device_name) +
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
    setTimeout(function () {
      try {
        w.print();
      } catch (e) {
        console.warn(BUILD, e);
      }
    }, 300);
  }

  function renderTable() {
    var tbody = document.getElementById("jip-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="14">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="14">該当なし</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (row) {
        var actionBtns = "";
        if (state.isAdmin) {
          actionBtns =
            '<button type="button" class="jip-btn-edit">修正</button>' +
            '<button type="button" class="jip-btn-print">印刷</button>';
        }
        return (
          "<tr>" +
          LIST_COLUMNS.map(function (col) {
            return "<td>" + cellText(row[col.key]) + "</td>";
          }).join("") +
          '<td class="jip-actions">' +
          actionBtns +
          "</td></tr>"
        );
      })
      .join("");

    rows.forEach(function (row, idx) {
      var tr = tbody.rows[idx];
      if (!tr) return;
      var editB = tr.querySelector(".jip-btn-edit");
      if (editB) {
        editB.addEventListener("click", function () {
          openEditModal(row);
        });
      }
      var printB = tr.querySelector(".jip-btn-print");
      if (printB) {
        printB.addEventListener("click", function () {
          openPrintWindow(row);
        });
      }
    });
  }

  function buildShell() {
    if (document.getElementById("jip-root")) return;
    injectCss();
    state.isAdmin = isSystemAdmin();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "jip-root";
    root.className = "jip-root";
    root.innerHTML =
      '<div class="jip-toolbar">' +
      "<strong style=\"font-size:16px\">JRシステム用 iPad 管理台帳</strong>" +
      '<button type="button" id="jip-reload" class="kintoneplugin-button-normal">再読込</button>' +
      "</div>" +
      '<div id="jip-meta" class="jip-meta"></div>' +
      '<div class="jip-summary-wrap"><table class="jip-summary"><thead><tr>' +
      '<th>管理部署</th>' +
      SUMMARY_COLUMNS.map(function (c) {
        return "<th>" + esc(c) + "</th>";
      }).join("") +
      "<th>合計</th></tr></thead><tbody id=\"jip-summary-tbody\"></tbody></table></div>" +
      '<div class="jip-filters">' +
      '<input type="search" id="jip-search" placeholder="端末名・電話・Apple ID・貸出先・モデル・備考" style="min-width:260px">' +
      '<select id="jip-filter-status"><option value="">ステータス: すべて</option>' +
      STATUS_VALUES.map(function (s) {
        return '<option value="' + esc(s) + '">' + esc(s) + "</option>";
      }).join("") +
      "</select>" +
      '<select id="jip-filter-dept"><option value="">管理部署: すべて</option>' +
      MGMT_DEPTS.map(function (d) {
        return '<option value="' + esc(d.name) + '">' + esc(d.name) + "</option>";
      }).join("") +
      "</select></div>" +
      '<div class="jip-table-wrap"><table class="jip-table"><thead><tr>' +
      LIST_COLUMNS.map(function (c) {
        return "<th>" + esc(c.label) + "</th>";
      }).join("") +
      "<th>操作</th></tr></thead><tbody id=\"jip-tbody\"></tbody></table></div>";
    host.appendChild(root);

    document.getElementById("jip-reload").addEventListener("click", function () {
      reloadRecords();
    });
    var search = document.getElementById("jip-search");
    search.value = state.search;
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    var statusSel = document.getElementById("jip-filter-status");
    statusSel.value = state.filterStatus;
    statusSel.addEventListener("change", function () {
      state.filterStatus = statusSel.value;
      renderTable();
    });
    var deptSel = document.getElementById("jip-filter-dept");
    deptSel.value = state.filterDept;
    deptSel.addEventListener("change", function () {
      state.filterDept = deptSel.value;
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
