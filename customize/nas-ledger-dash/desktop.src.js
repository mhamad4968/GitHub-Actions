(function () {
  "use strict";
  /* global NAS_ORG_MASTER, NAS_LOCATION_MASTER */

  /** NAS管理台帳 — 742/719 型 Excel 風一覧 + REST CRUD + 印刷 + xlsx */
  var BUILD = "2026-06-28-nas-ledger-dash-v1";
  var STATUS_NONE = "－";
  var EMPTY_MARK = "－";
  var PURCHASE_VENDORS = ["大塚商会", "富士フィルム", "KDDI", "その他"];
  var PURCHASE_VENDOR_OTHER = "その他";
  var APP_DB = 748;
  var PAGE_SIZE = 100;

  var FC = {
    sort_no: "sort_no",
    org_name: "org_name",
    status: "status",
    branch_name: "branch_name",
    hostname: "hostname",
    device_type: "device_type",
    install_place: "install_place",
    ip_address: "ip_address",
    manufacturer: "manufacturer",
    model_name: "model_name",
    serial_no: "serial_no",
    purchase_date: "purchase_date",
    purchase_vendor: "purchase_vendor",
    purchase_vendor_other: "purchase_vendor_other",
    effective_capacity: "effective_capacity",
    raid_level: "raid_level",
    backup_type: "backup_type",
    admin_id: "admin_id",
    admin_password: "admin_password",
    connectivity_check: "connectivity_check",
    note: "note",
    registered_date: "registered_date",
    updated_date: "updated_date",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.sort_no,
    FC.org_name,
    FC.status,
    FC.branch_name,
    FC.hostname,
    FC.device_type,
    FC.install_place,
    FC.ip_address,
    FC.manufacturer,
    FC.model_name,
    FC.serial_no,
    FC.purchase_date,
    FC.purchase_vendor,
    FC.purchase_vendor_other,
    FC.effective_capacity,
    FC.raid_level,
    FC.backup_type,
    FC.admin_id,
    FC.admin_password,
    FC.connectivity_check,
    FC.note,
    FC.registered_date,
    FC.updated_date,
  ];

  var LIST_COLUMNS = [
    { key: "org_name", label: "組織名", cls: "nasl-col-org" },
    { key: "branch_name", label: "拠点名", cls: "nasl-col-branch" },
    { key: "status", label: "状態" },
    { key: "device_type", label: "種別" },
    { key: "install_place", label: "設置先" },
    { key: "ip_address", label: "IP" },
    { key: "manufacturer", label: "メーカー" },
    { key: "model_name", label: "機種名" },
    { key: "effective_capacity", label: "実効容量" },
  ];

  var PRINT_ALL_FIELDS = [
    { key: "org_name", label: "組織名" },
    { key: "branch_name", label: "拠点名" },
    { key: "status", label: "状態" },
    { key: "device_type", label: "種別" },
    { key: "install_place", label: "設置先" },
    { key: "hostname", label: "ホスト名" },
    { key: "ip_address", label: "IPアドレス" },
    { key: "manufacturer", label: "メーカー" },
    { key: "model_name", label: "機種名" },
    { key: "serial_no", label: "シリアル番号" },
    { key: "purchase_date", label: "購入日" },
    { key: "purchase_vendor", label: "購入先" },
    { key: "purchase_vendor_other", label: "購入先（その他）" },
    { key: "effective_capacity", label: "実効容量" },
    { key: "raid_level", label: "RAIDレベル" },
    { key: "backup_type", label: "バックアップ種類" },
    { key: "admin_id", label: "管理者ID" },
    { key: "admin_password", label: "パスワード" },
    { key: "connectivity_check", label: "導通確認" },
    { key: "note", label: "備考" },
    { key: "registered_date", label: "登録日" },
    { key: "updated_date", label: "更新日" },
  ];

  var state = {
    records: [],
    search: "",
    statusFilter: "",
    deviceTypeFilter: "",
    orgFilter: "",
    loading: false,
    sortKey: "sort_no",
    sortDir: "asc",
  };

  function orgOptions() {
    if (typeof NAS_ORG_MASTER !== "undefined" && NAS_ORG_MASTER.organizations) {
      return NAS_ORG_MASTER.organizations
        .slice()
        .sort(function (a, b) {
          return Number(a.sort_no) - Number(b.sort_no);
        })
        .map(function (x) {
          return x.org_name;
        });
    }
    return [];
  }

  function locationOptions() {
    if (typeof NAS_LOCATION_MASTER !== "undefined" && NAS_LOCATION_MASTER.locations) {
      return NAS_LOCATION_MASTER.locations
        .slice()
        .sort(function (a, b) {
          return Number(a.sort_no) - Number(b.sort_no);
        })
        .map(function (x) {
          return x.location_name;
        });
    }
    return [];
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function todayJstYmd() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
  }

  function val(rec, code) {
    return rec && rec[code] && rec[code].value != null ? String(rec[code].value) : "";
  }

  function flatten(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      sort_no: val(rec, FC.sort_no),
      org_name: val(rec, FC.org_name),
      status: val(rec, FC.status) === "-" ? STATUS_NONE : val(rec, FC.status),
      branch_name: val(rec, FC.branch_name),
      hostname: val(rec, FC.hostname),
      device_type: val(rec, FC.device_type),
      install_place: val(rec, FC.install_place),
      ip_address: val(rec, FC.ip_address),
      manufacturer: val(rec, FC.manufacturer),
      model_name: val(rec, FC.model_name),
      serial_no: val(rec, FC.serial_no),
      purchase_date: val(rec, FC.purchase_date),
      purchase_vendor: val(rec, FC.purchase_vendor),
      purchase_vendor_other: val(rec, FC.purchase_vendor_other),
      effective_capacity: val(rec, FC.effective_capacity),
      raid_level: val(rec, FC.raid_level),
      backup_type: val(rec, FC.backup_type),
      admin_id: val(rec, FC.admin_id),
      admin_password: val(rec, FC.admin_password),
      connectivity_check: val(rec, FC.connectivity_check),
      note: val(rec, FC.note),
      registered_date: val(rec, FC.registered_date),
      updated_date: val(rec, FC.updated_date),
    };
  }

  function toKintoneRecord(row) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
      else if (
        code === FC.hostname ||
        code === FC.device_type ||
        code === FC.ip_address ||
        code === FC.manufacturer ||
        code === FC.model_name ||
        code === FC.serial_no ||
        code === FC.purchase_date ||
        code === FC.purchase_vendor ||
        code === FC.purchase_vendor_other ||
        code === FC.effective_capacity ||
        code === FC.raid_level ||
        code === FC.backup_type ||
        code === FC.admin_id ||
        code === FC.admin_password ||
        code === FC.connectivity_check ||
        code === FC.note
      ) {
        o[code] = { value: v || "" };
      }
    }
    set(FC.sort_no, row.sort_no);
    set(FC.org_name, row.org_name);
    set(FC.status, row.status);
    set(FC.branch_name, row.branch_name);
    set(FC.hostname, row.hostname);
    set(FC.device_type, row.device_type);
    set(FC.install_place, row.install_place);
    set(FC.ip_address, row.ip_address);
    set(FC.manufacturer, row.manufacturer);
    set(FC.model_name, row.model_name);
    set(FC.serial_no, row.serial_no);
    set(FC.purchase_date, row.purchase_date);
    set(FC.purchase_vendor, row.purchase_vendor);
    set(FC.purchase_vendor_other, row.purchase_vendor_other);
    set(FC.effective_capacity, row.effective_capacity);
    set(FC.raid_level, row.raid_level);
    set(FC.backup_type, row.backup_type);
    set(FC.admin_id, row.admin_id);
    set(FC.admin_password, row.admin_password);
    set(FC.connectivity_check, row.connectivity_check);
    set(FC.note, row.note);
    set(FC.registered_date, row.registered_date);
    set(FC.updated_date, row.updated_date);
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

  function injectCss() {
    if (document.getElementById("nasl-dash-css")) return;
    var st = document.createElement("style");
    st.id = "nasl-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".nasl-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".nasl-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".nasl-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;padding:10px 14px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;}" +
      ".nasl-filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;align-items:center;}" +
      ".nasl-filter-label{font-size:12px;color:#475569;min-width:48px;}" +
      ".nasl-chip{border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;}" +
      ".nasl-chip-active{background:#1e40af;color:#fff;border-color:#1e40af;}" +
      ".nasl-table-wrap{overflow:auto;max-height:calc(100vh - 360px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".nasl-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1200px;}" +
      ".nasl-table th,.nasl-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle;}" +
      ".nasl-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;}" +
      ".nasl-col-org{width:17em;max-width:17em;min-width:17em;white-space:normal;line-height:1.35;}" +
      ".nasl-col-branch{width:17em;max-width:17em;min-width:17em;white-space:normal;line-height:1.35;}" +
      ".nasl-actions button{margin:0 2px;padding:2px 6px;font-size:11px;}" +
      ".nasl-none{color:#64748b;font-style:italic;}" +
      ".nasl-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".nasl-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:680px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".nasl-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".nasl-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".nasl-modal input,.nasl-modal textarea,.nasl-modal select{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".nasl-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      "#nasl-print-portal{display:none;}" +
      "@media print{#nasl-print-portal{display:block!important;position:absolute;left:0;top:0;width:100%;}body *{visibility:hidden!important;}#nasl-print-portal,#nasl-print-portal *{visibility:visible!important;}.nasl-root{display:none!important;}}";
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

  function rowMatchesKeyword(row, q) {
    if (!q) return true;
    var hay =
      row.org_name +
      " " +
      row.branch_name +
      " " +
      row.ip_address +
      " " +
      row.hostname +
      " " +
      row.model_name +
      " " +
      row.purchase_vendor +
      " " +
      row.purchase_vendor_other +
      " " +
      row.note;
    return hay.toLowerCase().indexOf(q) >= 0;
  }

  function filteredRecords() {
    var q = state.search.trim().toLowerCase();
    var status = state.statusFilter;
    var deviceType = state.deviceTypeFilter;
    var org = state.orgFilter;
    var rows = state.records.filter(function (r) {
      if (status && r.status !== status) return false;
      if (deviceType && r.device_type !== deviceType) return false;
      if (org && r.org_name !== org) return false;
      return rowMatchesKeyword(r, q);
    });
    rows.sort(function (a, b) {
      var key = state.sortKey || "sort_no";
      if (key === "sort_no") return Number(a.sort_no || 0) - Number(b.sort_no || 0);
      return String(a[key] || "").localeCompare(String(b[key] || ""), "ja");
    });
    if (state.sortDir === "desc") rows.reverse();
    return rows;
  }

  function closeModal() {
    var el = document.getElementById("nasl-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "nasl-modal-root";
    bg.className = "nasl-modal-bg";
    var box = document.createElement("div");
    box.className = "nasl-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "nasl-modal-actions";
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

  function nextSortNo() {
    var max = 0;
    state.records.forEach(function (r) {
      var n = Number(r.sort_no);
      if (Number.isFinite(n)) max = Math.max(max, n);
    });
    return max + 1;
  }

  function masterSelectHtml(id, options, selected) {
    var opts = ['<option value="">— 選択 —</option>'];
    options.forEach(function (name) {
      opts.push(
        '<option value="' +
          esc(name) +
          '"' +
          (name === selected ? " selected" : "") +
          ">" +
          esc(name) +
          "</option>",
      );
    });
    return '<select id="' + id + '">' + opts.join("") + "</select>";
  }

  function statusSelectHtml(selected) {
    var values = ["有効", "保管", "廃棄", STATUS_NONE];
    var opts = values.map(function (v) {
      return (
        '<option value="' +
        esc(v) +
        '"' +
        (v === (selected || "有効") ? " selected" : "") +
        ">" +
        esc(v) +
        "</option>"
      );
    });
    return '<select id="nasl-f-status">' + opts.join("") + "</select>";
  }

  function deviceTypeSelectHtml(selected) {
    var values = ["", "本番", "バックアップ"];
    var labels = ["— 空 —", "本番", "バックアップ"];
    var opts = values.map(function (v, i) {
      return (
        '<option value="' +
        esc(v) +
        '"' +
        (v === (selected || "") ? " selected" : "") +
        ">" +
        esc(labels[i]) +
        "</option>"
      );
    });
    return '<select id="nasl-f-dtype">' + opts.join("") + "</select>";
  }

  function resolvePurchaseVendorFields(row) {
    var vendor = String((row && row.purchase_vendor) || "").trim();
    var other = String((row && row.purchase_vendor_other) || "").trim();
    if (vendor && PURCHASE_VENDORS.indexOf(vendor) < 0) {
      if (!other) other = vendor;
      vendor = PURCHASE_VENDOR_OTHER;
    }
    return { vendor: vendor, other: other };
  }

  function purchaseVendorSelectHtml(vendor) {
    var opts = ['<option value="">— 空 —</option>'];
    PURCHASE_VENDORS.forEach(function (v) {
      opts.push(
        '<option value="' +
          esc(v) +
          '"' +
          (v === vendor ? " selected" : "") +
          ">" +
          esc(v) +
          "</option>",
      );
    });
    return '<select id="nasl-f-vendor">' + opts.join("") + "</select>";
  }

  function wirePurchaseVendorToggle(box) {
    var sel = box.querySelector("#nasl-f-vendor");
    var wrap = box.querySelector("#nasl-f-vendor-other-wrap");
    if (!sel || !wrap) return;
    function sync() {
      wrap.style.display = sel.value === PURCHASE_VENDOR_OTHER ? "block" : "none";
    }
    sel.addEventListener("change", sync);
    sync();
  }

  function effectivePurchaseVendor(row) {
    if (row.purchase_vendor === PURCHASE_VENDOR_OTHER) {
      return String(row.purchase_vendor_other || "").trim() || PURCHASE_VENDOR_OTHER;
    }
    return String(row.purchase_vendor || "").trim();
  }

  function formFieldsHtml(row, isNew) {
    var r = row || {};
    var status = r.status || "有効";
    var noteDefault = status === STATUS_NONE && !r.note ? "設備なし" : r.note || "";
    var purchase = resolvePurchaseVendorFields(r);
    var vendorOtherStyle = purchase.vendor === PURCHASE_VENDOR_OTHER ? "block" : "none";
    return (
      '<label>並び順<input type="number" id="nasl-f-sort" value="' +
      esc(r.sort_no || String(nextSortNo())) +
      '"></label>' +
      "<label>組織名" +
      masterSelectHtml("nasl-f-org", orgOptions(), r.org_name || "") +
      "</label>" +
      "<label>状態" +
      statusSelectHtml(status) +
      "</label>" +
      "<label>拠点名" +
      masterSelectHtml("nasl-f-branch", locationOptions(), r.branch_name || "") +
      "</label>" +
      '<label>ホスト名<input type="text" id="nasl-f-host" value="' +
      esc(r.hostname || "") +
      '"></label>' +
      "<label>種別" +
      deviceTypeSelectHtml(r.device_type || "") +
      "</label>" +
      "<label>設置先" +
      masterSelectHtml("nasl-f-install", locationOptions(), r.install_place || "") +
      "</label>" +
      '<label>IPアドレス<input type="text" id="nasl-f-ip" value="' +
      esc(r.ip_address || "") +
      '"></label>' +
      '<label>メーカー<input type="text" id="nasl-f-mfr" value="' +
      esc(r.manufacturer || "") +
      '"></label>' +
      '<label>機種名<input type="text" id="nasl-f-model" value="' +
      esc(r.model_name || "") +
      '"></label>' +
      '<label>シリアル番号<input type="text" id="nasl-f-serial" value="' +
      esc(r.serial_no || "") +
      '"></label>' +
      '<label>購入日<input type="date" id="nasl-f-purchase-date" value="' +
      esc(r.purchase_date || "") +
      '"></label>' +
      "<label>購入先" +
      purchaseVendorSelectHtml(purchase.vendor) +
      "</label>" +
      '<label id="nasl-f-vendor-other-wrap" style="display:' +
      vendorOtherStyle +
      '">購入先（その他）<input type="text" id="nasl-f-vendor-other" value="' +
      esc(purchase.other || "") +
      '"></label>' +
      '<label>実効容量<input type="text" id="nasl-f-cap" value="' +
      esc(r.effective_capacity || "") +
      '"></label>' +
      '<label>RAIDレベル<input type="text" id="nasl-f-raid" value="' +
      esc(r.raid_level || "") +
      '"></label>' +
      '<label>バックアップ種類<input type="text" id="nasl-f-backup" value="' +
      esc(r.backup_type || "") +
      '"></label>' +
      '<label>管理者ID<input type="text" id="nasl-f-aid" value="' +
      esc(r.admin_id || "") +
      '"></label>' +
      '<label>パスワード<input type="text" id="nasl-f-apw" value="' +
      esc(r.admin_password || "") +
      '"></label>' +
      '<label>導通確認<input type="text" id="nasl-f-conn" value="' +
      esc(r.connectivity_check || "") +
      '"></label>' +
      '<label>備考<textarea id="nasl-f-note" rows="3">' +
      esc(noteDefault) +
      "</textarea></label>" +
      (isNew
        ? ""
        : '<label>登録日<input type="date" id="nasl-f-reg" value="' + esc(r.registered_date || "") + '"></label>')
    );
  }

  function readForm(row, isNew) {
    var status = document.getElementById("nasl-f-status").value.trim();
    var o = {
      sort_no: document.getElementById("nasl-f-sort").value.trim(),
      org_name: document.getElementById("nasl-f-org").value.trim(),
      status: status,
      branch_name: document.getElementById("nasl-f-branch").value.trim(),
      hostname: document.getElementById("nasl-f-host").value.trim(),
      device_type: document.getElementById("nasl-f-dtype").value.trim(),
      install_place: document.getElementById("nasl-f-install").value.trim(),
      ip_address: document.getElementById("nasl-f-ip").value.trim(),
      manufacturer: document.getElementById("nasl-f-mfr").value.trim(),
      model_name: document.getElementById("nasl-f-model").value.trim(),
      serial_no: document.getElementById("nasl-f-serial").value.trim(),
      purchase_date: document.getElementById("nasl-f-purchase-date").value.trim(),
      purchase_vendor: document.getElementById("nasl-f-vendor").value.trim(),
      purchase_vendor_other: document.getElementById("nasl-f-vendor-other").value.trim(),
      effective_capacity: document.getElementById("nasl-f-cap").value.trim(),
      raid_level: document.getElementById("nasl-f-raid").value.trim(),
      backup_type: document.getElementById("nasl-f-backup").value.trim(),
      admin_id: document.getElementById("nasl-f-aid").value.trim(),
      admin_password: document.getElementById("nasl-f-apw").value.trim(),
      connectivity_check: document.getElementById("nasl-f-conn").value.trim(),
      note: document.getElementById("nasl-f-note").value.trim(),
      updated_date: todayJstYmd(),
    };
    if (isNew) o.registered_date = todayJstYmd();
    else {
      o.registered_date = document.getElementById("nasl-f-reg").value.trim() || row.registered_date;
      o.id = row.id;
      o.revision = row.revision;
    }

    if (!o.org_name) throw new Error("組織名は必須です");
    if (!o.branch_name) throw new Error("拠点名は必須です");
    if (!o.status) throw new Error("状態は必須です");
    if (!o.install_place) throw new Error("設置先は必須です");

    if (o.purchase_vendor === PURCHASE_VENDOR_OTHER) {
      if (!o.purchase_vendor_other) {
        throw new Error("購入先がその他の場合、購入先（その他）を入力してください");
      }
    } else {
      o.purchase_vendor_other = "";
    }

    if (status === "有効") {
      if (!o.device_type) throw new Error("状態が有効の場合、種別は必須です");
      if (!o.ip_address) throw new Error("状態が有効の場合、IPアドレスは必須です");
      if (!o.admin_id) throw new Error("状態が有効の場合、管理者IDは必須です");
      if (!o.admin_password) throw new Error("状態が有効の場合、パスワードは必須です");
    } else if (status === "保管") {
      if (!o.ip_address) throw new Error("状態が保管の場合、IPアドレスは必須です");
      if (!o.admin_id) throw new Error("状態が保管の場合、管理者IDは必須です");
      if (!o.admin_password) throw new Error("状態が保管の場合、パスワードは必須です");
    } else if (status === STATUS_NONE) {
      if (!o.note) o.note = "設備なし";
      o.device_type = "";
      o.ip_address = "";
      o.admin_id = "";
      o.admin_password = "";
    }

    return o;
  }

  function openNewModal() {
    var box = openModal("新規NAS", formFieldsHtml(null, true), [
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
    wirePurchaseVendorToggle(box);
  }

  function openEditModal(row) {
    var title = "編集 — " + (row.branch_name || row.model_name || row.org_name);
    var box = openModal(title, formFieldsHtml(row, false), [
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
    wirePurchaseVendorToggle(box);
  }

  function openDeleteModal(row) {
    openModal(
      "削除確認",
      "<p>「" +
        esc(row.org_name) +
        " / " +
        esc(row.branch_name) +
        " / " +
        esc(row.model_name || row.status) +
        "」を削除します。よろしいですか？</p>",
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

  function displayCell(v) {
    var t = String(v || "").trim();
    if (!t || t === "-") return '<span class="nasl-none">' + esc(EMPTY_MARK) + "</span>";
    return esc(t);
  }

  function renderFilterGroup(containerId, label, chips, activeValue, dataAttr) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = '<span class="nasl-filter-label">' + esc(label) + "</span>";
    chips.forEach(function (chip) {
      html +=
        '<button type="button" class="nasl-chip' +
        (activeValue === chip.value ? " nasl-chip-active" : "") +
        '" data-' +
        dataAttr +
        '="' +
        esc(chip.value) +
        '">' +
        esc(chip.label) +
        "</button>";
    });
    el.innerHTML = html;
    el.querySelectorAll(".nasl-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-" + dataAttr) || "";
        if (dataAttr === "status") state.statusFilter = v;
        else if (dataAttr === "dtype") state.deviceTypeFilter = v;
        else if (dataAttr === "org") state.orgFilter = v;
        renderTable();
      });
    });
  }

  function renderFilterChips() {
    renderFilterGroup(
      "nasl-filters-status",
      "状態",
      [
        { value: "", label: "全" },
        { value: "有効", label: "有効" },
        { value: "保管", label: "保管" },
        { value: STATUS_NONE, label: STATUS_NONE },
      ],
      state.statusFilter,
      "status",
    );
    renderFilterGroup(
      "nasl-filters-dtype",
      "種別",
      [
        { value: "", label: "全" },
        { value: "本番", label: "本番" },
        { value: "バックアップ", label: "バックアップ" },
      ],
      state.deviceTypeFilter,
      "dtype",
    );
    var orgs = orgOptions();
    var used = {};
    state.records.forEach(function (r) {
      if (r.org_name) used[r.org_name] = true;
    });
    var orgChips = [{ value: "", label: "全" }];
    orgs.forEach(function (name) {
      if (!used[name]) return;
      orgChips.push({ value: name, label: name });
    });
    renderFilterGroup("nasl-filters-org", "組織", orgChips, state.orgFilter, "org");
  }

  function renderTable() {
    var wrap = document.getElementById("nasl-table-wrap");
    if (!wrap) return;
    if (state.loading) {
      wrap.innerHTML = "<p>読込中…</p>";
      return;
    }
    var rows = filteredRecords();
    var colCount = LIST_COLUMNS.length + 1;
    var thead =
      "<tr><th>操作</th>" +
      LIST_COLUMNS.map(function (c) {
        return "<th" + (c.cls ? ' class="' + c.cls + '"' : "") + ">" + esc(c.label) + "</th>";
      }).join("") +
      "</tr>";
    var tbody = rows
      .map(function (row) {
        return (
          '<tr data-id="' +
          esc(row.id) +
          '"><td class="nasl-actions">' +
          '<button type="button" class="nasl-btn-edit">編集</button> ' +
          '<button type="button" class="nasl-btn-del">削除</button>' +
          "</td>" +
          LIST_COLUMNS.map(function (c) {
            return "<td" + (c.cls ? ' class="' + c.cls + '"' : "") + ">" + displayCell(row[c.key]) + "</td>";
          }).join("") +
          "</tr>"
        );
      })
      .join("");
    wrap.innerHTML =
      '<table class="nasl-table"><thead>' +
      thead +
      "</thead><tbody>" +
      (tbody || '<tr><td colspan="' + colCount + '">該当なし</td></tr>') +
      "</tbody></table>";
    wrap.querySelectorAll(".nasl-btn-edit").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.closest("tr").getAttribute("data-id");
        var row = state.records.find(function (r) {
          return r.id === id;
        });
        if (row) openEditModal(row);
      });
    });
    wrap.querySelectorAll(".nasl-btn-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.closest("tr").getAttribute("data-id");
        var row = state.records.find(function (r) {
          return r.id === id;
        });
        if (row) openDeleteModal(row);
      });
    });
    renderFilterChips();
    var meta = document.getElementById("nasl-count");
    if (meta) meta.textContent = "表示 " + rows.length + " / 全 " + state.records.length + " 件";
  }

  function reloadRecords() {
    state.loading = true;
    renderTable();
    return fetchAllRecords()
      .then(function (rows) {
        state.records = rows.map(flatten);
        state.loading = false;
        renderTable();
      })
      .catch(function (e) {
        state.loading = false;
        renderTable();
        alert("読込失敗: " + (e.message || e));
      });
  }

  function printFieldValue(row, key, includePassword) {
    if (key === "admin_password" && !includePassword) return "（一覧印刷のため非表示）";
    if (key === "purchase_vendor") return effectivePurchaseVendor(row) || EMPTY_MARK;
    if (key === "purchase_vendor_other" && row.purchase_vendor !== PURCHASE_VENDOR_OTHER) return EMPTY_MARK;
    var t = String(row[key] || "").trim();
    if (!t || t === "-") return EMPTY_MARK;
    return t;
  }

  function buildPrintTableHtml(rows, title, includePassword) {
    var head = PRINT_ALL_FIELDS.map(function (f) {
      return "<th>" + esc(f.label) + "</th>";
    }).join("");
    var body = rows
      .map(function (row) {
        return (
          "<tr>" +
          PRINT_ALL_FIELDS.map(function (f) {
            return "<td>" + esc(printFieldValue(row, f.key, includePassword)) + "</td>";
          }).join("") +
          "</tr>"
        );
      })
      .join("");
    return (
      '<div class="naslpr-page">' +
      "<h1>" +
      esc(title) +
      "</h1>" +
      '<p class="naslpr-meta">出力日: ' +
      esc(todayJstYmd()) +
      "　BUILD: " +
      esc(BUILD) +
      "</p>" +
      '<table class="naslpr-table"><thead><tr>' +
      head +
      "</tr></thead><tbody>" +
      body +
      "</tbody></table></div>"
    );
  }

  function printStylesheet() {
    return (
      ".naslpr-page{font-family:Meiryo,Segoe UI,sans-serif;padding:12px;}" +
      ".naslpr-page h1{font-size:16pt;margin:0 0 8px;}" +
      ".naslpr-meta{font-size:10pt;color:#475569;margin:0 0 12px;}" +
      ".naslpr-table{border-collapse:collapse;width:100%;font-size:9pt;}" +
      ".naslpr-table th,.naslpr-table td{border:1px solid #334155;padding:4px 5px;vertical-align:top;word-break:break-all;}" +
      ".naslpr-table th{background:#e2e8f0;}" +
      "@media print{@page{size:A4 landscape;margin:8mm;}}"
    );
  }

  function runPrint(html) {
    var portal = document.getElementById("nasl-print-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "nasl-print-portal";
      document.body.appendChild(portal);
    }
    portal.innerHTML = "<style>" + printStylesheet() + "</style>" + html;
    setTimeout(function () {
      window.print();
    }, 200);
  }

  function printList() {
    var rows = filteredRecords();
    if (!rows.length) {
      alert("印刷対象がありません");
      return;
    }
    runPrint(buildPrintTableHtml(rows, "NAS管理台帳 — 一覧", false));
  }

  function exportListXlsx(rows) {
    if (typeof XLSX === "undefined" || !XLSX.utils || !XLSX.writeFile) {
      alert("xlsx ライブラリが読み込まれていません");
      return;
    }
    var header = PRINT_ALL_FIELDS.map(function (f) {
      return f.label;
    });
    var matrix = [header];
    rows.forEach(function (row) {
      matrix.push(
        PRINT_ALL_FIELDS.map(function (f) {
          return printFieldValue(row, f.key, true);
        }),
      );
    });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "一覧");
    XLSX.writeFile(wb, "NAS管理台帳_" + todayJstYmd().replace(/-/g, "") + ".xlsx", { bookType: "xlsx" });
  }

  function exportXlsx() {
    var rows = filteredRecords();
    if (!rows.length) {
      alert("出力対象がありません");
      return;
    }
    exportListXlsx(rows);
  }

  function buildUi(host) {
    host.innerHTML =
      '<div class="nasl-root">' +
      '<div class="nasl-meta">' +
      '<span id="nasl-count">—</span>' +
      '<button type="button" id="nasl-new" class="kintoneplugin-button-dialog-ok" style="margin-left:auto">新規登録</button>' +
      "</div>" +
      '<div class="nasl-toolbar">' +
      '<input type="search" id="nasl-search" placeholder="キーワード検索（組織・拠点・IP・ホスト名・機種名・備考）" style="min-width:280px;padding:6px;">' +
      '<button type="button" id="nasl-print-list" class="kintoneplugin-button-normal">一覧印刷</button>' +
      '<button type="button" id="nasl-xlsx" class="kintoneplugin-button-normal">Excel出力</button>' +
      '<span style="font-size:11px;color:#64748b;margin-left:8px">BUILD ' +
      esc(BUILD) +
      "</span>" +
      "</div>" +
      '<div id="nasl-filters-status" class="nasl-filters"></div>' +
      '<div id="nasl-filters-dtype" class="nasl-filters"></div>' +
      '<div id="nasl-filters-org" class="nasl-filters"></div>' +
      '<div id="nasl-table-wrap" class="nasl-table-wrap"></div>' +
      "</div>";

    document.getElementById("nasl-new").addEventListener("click", openNewModal);
    document.getElementById("nasl-print-list").addEventListener("click", printList);
    document.getElementById("nasl-xlsx").addEventListener("click", exportXlsx);
    document.getElementById("nasl-search").addEventListener("input", function (ev) {
      state.search = ev.target.value;
      renderTable();
    });
  }

  kintone.events.on("app.record.index.show", function (event) {
    if (!APP_DB) {
      alert("APP_DB 未設定 — deploy 前に nas-ledger:sync-db-id を実行してください");
      return event;
    }
    injectCss();
    var host = resolveMountHost();
    if (!host || document.getElementById("nasl-root-mounted")) return event;
    host.innerHTML = "";
    buildUi(host);
    host.id = "nasl-root-mounted";
    reloadRecords();
    return event;
  });
})();
