(function () {
  "use strict";

  var BUILD = "2026-06-21-total-network-dash-v1";
  var APP_DB = 737;
  var PAGE_SIZE = 100;
  var CHECKBOX_CONNECTED = "接続";
  var CHECKBOX_ACTIVE = "有効";
  var STATUS_IN_USE = "使用中";

  var FC = {
    record_type: "record_type",
    sort_no: "sort_no",
    location_name: "location_name",
    total_network_enabled: "total_network_enabled",
    network_address: "network_address",
    subnet_mask: "subnet_mask",
    gateway: "gateway",
    dns_primary: "dns_primary",
    dns_secondary: "dns_secondary",
    ip_count: "ip_count",
    ip_range_start: "ip_range_start",
    ip_range_end: "ip_range_end",
    address: "address",
    note: "note",
    change_history: "change_history",
    site_location_name: "site_location_name",
    ip_address: "ip_address",
    status: "status",
    device_type: "device_type",
    device_type_other: "device_type_other",
    assignment_note: "assignment_note",
    sort_index: "sort_index",
    device_type_code: "device_type_code",
    device_type_label: "device_type_label",
    is_active: "is_active",
  };

  var SITE_FIELDS = [
    "$id", "$revision", FC.record_type, FC.sort_no, FC.location_name,
    FC.total_network_enabled, FC.network_address, FC.subnet_mask, FC.gateway,
    FC.dns_primary, FC.dns_secondary, FC.ip_count, FC.ip_range_start, FC.ip_range_end,
    FC.address, FC.note, FC.change_history,
  ];
  var IP_FIELDS = [
    "$id", "$revision", FC.record_type, FC.site_location_name, FC.ip_address,
    FC.status, FC.device_type, FC.device_type_other, FC.assignment_note, FC.sort_index,
  ];
  var DT_FIELDS = [
    "$id", "$revision", FC.record_type, FC.device_type_code, FC.device_type_label,
    FC.sort_no, FC.is_active,
  ];

  var SITE_TRACK_FIELDS = [
    { key: "total_network_enabled", label: "接続", bool: true },
    { key: "network_address", label: "NWアドレス" },
    { key: "subnet_mask", label: "サブネットマスク" },
    { key: "gateway", label: "ゲートウェイ" },
    { key: "dns_primary", label: "優先DNS" },
    { key: "dns_secondary", label: "代替DNS" },
    { key: "ip_count", label: "IP数" },
    { key: "ip_range_start", label: "範囲開始" },
    { key: "ip_range_end", label: "範囲終了" },
    { key: "address", label: "住所" },
    { key: "note", label: "備考" },
  ];

  var state = {
    sites: [],
    ipRecords: [],
    deviceTypes: [],
    loading: false,
    tab: "list",
    siteFilter: "connected",
    siteSearch: "",
    matrixHighlightIp: null,
    matrixHighlightSite: null,
  };

  /* ───── Utilities ───── */

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
    var y = "", mo = "", d = "";
    parts.forEach(function (p) {
      if (p.type === "year") y = p.value;
      if (p.type === "month") mo = p.value;
      if (p.type === "day") d = p.value;
    });
    return y + "-" + mo + "-" + d;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function loginUser() {
    try {
      return (kintone.getLoginUser() || {}).name || "";
    } catch (e) {
      return "";
    }
  }

  function val(rec, code) {
    return rec && rec[code] && rec[code].value != null ? String(rec[code].value) : "";
  }

  function checkboxOn(rec, code, label) {
    if (!rec || !rec[code] || !Array.isArray(rec[code].value)) return false;
    return rec[code].value.indexOf(label) >= 0;
  }

  /* ───── IP Utilities ───── */

  function ipToLong(ip) {
    var p = String(ip || "").split(".");
    if (p.length !== 4) return 0;
    return (
      (parseInt(p[0], 10) || 0) * 16777216 +
      (parseInt(p[1], 10) || 0) * 65536 +
      (parseInt(p[2], 10) || 0) * 256 +
      (parseInt(p[3], 10) || 0)
    );
  }

  function longToIp(n) {
    return [
      Math.floor(n / 16777216) % 256,
      Math.floor(n / 65536) % 256,
      Math.floor(n / 256) % 256,
      n % 256,
    ].join(".");
  }

  function enumerateIpRange(start, end) {
    var s = ipToLong(start);
    var e = ipToLong(end);
    if (!s || !e || e < s || e - s > 1023) return [];
    var ips = [];
    for (var i = s; i <= e; i++) {
      ips.push(longToIp(i));
    }
    return ips;
  }

  /* ───── Flatten ───── */

  function flattenSite(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      sort_no: val(rec, FC.sort_no),
      location_name: val(rec, FC.location_name),
      total_network_enabled: checkboxOn(rec, FC.total_network_enabled, CHECKBOX_CONNECTED),
      network_address: val(rec, FC.network_address),
      subnet_mask: val(rec, FC.subnet_mask),
      gateway: val(rec, FC.gateway),
      dns_primary: val(rec, FC.dns_primary),
      dns_secondary: val(rec, FC.dns_secondary),
      ip_count: val(rec, FC.ip_count),
      ip_range_start: val(rec, FC.ip_range_start),
      ip_range_end: val(rec, FC.ip_range_end),
      address: val(rec, FC.address),
      note: val(rec, FC.note),
      _changeHistoryRaw: rec[FC.change_history] ? (rec[FC.change_history].value || []) : [],
    };
  }

  function flattenIp(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      site_location_name: val(rec, FC.site_location_name),
      ip_address: val(rec, FC.ip_address),
      status: val(rec, FC.status),
      device_type: val(rec, FC.device_type),
      device_type_other: val(rec, FC.device_type_other),
      assignment_note: val(rec, FC.assignment_note),
      sort_index: val(rec, FC.sort_index),
    };
  }

  function flattenDeviceType(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      device_type_code: val(rec, FC.device_type_code),
      device_type_label: val(rec, FC.device_type_label),
      sort_no: val(rec, FC.sort_no),
      is_active: checkboxOn(rec, FC.is_active, CHECKBOX_ACTIVE),
    };
  }

  /* ───── API Wrappers ───── */

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

  function fetchPaged(query, fields) {
    var all = [];
    var offset = 0;
    function page() {
      var q = query + " limit " + PAGE_SIZE + " offset " + offset;
      return apiGet("/k/v1/records.json", { app: APP_DB, query: q, fields: fields })
        .then(function (resp) {
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

  function fetchSites() {
    return fetchPaged('record_type in ("site") order by sort_no asc', SITE_FIELDS)
      .then(function (rows) { state.sites = rows.map(flattenSite); });
  }

  function fetchIpRecords() {
    return fetchPaged(
      'record_type in ("ip") order by site_location_name asc, sort_index asc',
      IP_FIELDS
    ).then(function (rows) { state.ipRecords = rows.map(flattenIp); });
  }

  function fetchDeviceTypes() {
    return fetchPaged('record_type in ("device_type") order by sort_no asc', DT_FIELDS)
      .then(function (rows) { state.deviceTypes = rows.map(flattenDeviceType); });
  }

  function reloadAll() {
    state.loading = true;
    renderActiveTab();
    return fetchSites()
      .then(fetchIpRecords)
      .then(fetchDeviceTypes)
      .then(function () {
        state.loading = false;
        renderActiveTab();
      })
      .catch(function (e) {
        state.loading = false;
        renderActiveTab();
        alert("読込失敗: " + (e.message || e));
      });
  }

  /* ───── Device Type Helpers ───── */

  function deviceLabel(code, other) {
    if (code === "other" && other) return "その他: " + other;
    var found = null;
    state.deviceTypes.forEach(function (d) {
      if (d.device_type_code === code) found = d;
    });
    return found ? found.device_type_label : (code || "");
  }

  function activeDeviceTypes() {
    return state.deviceTypes
      .filter(function (d) { return d.is_active; })
      .sort(function (a, b) { return Number(a.sort_no) - Number(b.sort_no); });
  }

  function deviceTypeOptionsHtml(selected) {
    return activeDeviceTypes()
      .map(function (d) {
        return (
          '<option value="' +
          esc(d.device_type_code) +
          '"' +
          (d.device_type_code === selected ? " selected" : "") +
          ">" +
          esc(d.device_type_label) +
          "</option>"
        );
      })
      .join("");
  }

  /* ───── CSS ───── */

  function injectCss() {
    if (document.getElementById("tnd-css")) return;
    var st = document.createElement("style");
    st.id = "tnd-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia," +
      ".contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".tnd-root{font-family:Segoe UI,Meiryo,sans-serif;font-size:14px;padding:8px 12px 24px;}" +
      ".tnd-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".tnd-tabs{display:flex;gap:0;margin-bottom:14px;border-bottom:2px solid #cbd5e1;}" +
      ".tnd-tab{padding:8px 18px;cursor:pointer;font-size:14px;font-weight:600;border:1px solid #cbd5e1;" +
      "border-bottom:none;background:#f8fafc;color:#64748b;user-select:none;}" +
      ".tnd-tab.tnd-tab-active{background:#fff;color:#1e40af;border-bottom:2px solid #fff;margin-bottom:-2px;}" +
      ".tnd-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".tnd-table-wrap{overflow:auto;max-height:calc(100vh - 310px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".tnd-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1100px;}" +
      ".tnd-table th,.tnd-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle;}" +
      ".tnd-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;white-space:nowrap;font-size:12px;}" +
      ".tnd-tr-disconnected td{background:#f8fafc;color:#94a3b8;}" +
      ".tnd-actions button{margin:0 2px;padding:2px 7px;font-size:11px;}" +
      ".tnd-matrix-wrap{overflow:auto;max-height:calc(100vh - 280px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".tnd-matrix{border-collapse:collapse;font-size:11px;}" +
      ".tnd-matrix th,.tnd-matrix td{border:1px solid #e2e8f0;padding:3px 4px;text-align:center;" +
      "min-width:78px;max-width:88px;vertical-align:top;}" +
      ".tnd-matrix th{background:#f1f5f9;position:sticky;top:0;z-index:1;font-size:11px;line-height:1.4;}" +
      ".tnd-cell-assigned{background:#dbeafe;cursor:pointer;}" +
      ".tnd-cell-assigned:hover{background:#bfdbfe;}" +
      ".tnd-cell-empty{color:#94a3b8;cursor:pointer;}" +
      ".tnd-cell-empty:hover{background:#f0fdf4;}" +
      ".tnd-cell-highlight{background:#fef9c3;cursor:pointer;}" +
      ".tnd-cell-highlight:hover{background:#fef08a;}" +
      ".tnd-cell-disconnected{background:#f8fafc;color:#cbd5e1;}" +
      ".tnd-suggest-btn{font-size:10px;padding:1px 4px;margin-top:3px;display:block;white-space:nowrap;}" +
      ".tnd-dt-table{border-collapse:collapse;width:100%;max-width:680px;font-size:13px;}" +
      ".tnd-dt-table th,.tnd-dt-table td{border:1px solid #e2e8f0;padding:5px 8px;}" +
      ".tnd-dt-table th{background:#f1f5f9;}" +
      ".tnd-inactive td{color:#94a3b8;}" +
      ".tnd-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;" +
      "display:flex;align-items:center;justify-content:center;}" +
      ".tnd-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:520px;width:92%;" +
      "max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".tnd-modal h3{margin:0 0 12px;font-size:15px;}" +
      ".tnd-modal label{display:block;margin:7px 0;font-size:13px;}" +
      ".tnd-modal input,.tnd-modal select,.tnd-modal textarea{width:100%;box-sizing:border-box;" +
      "padding:6px;font-size:13px;margin-top:3px;}" +
      ".tnd-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;}" +
      ".tnd-hint{font-size:12px;color:#64748b;margin:3px 0;}" +
      ".tnd-warn{font-size:12px;color:#b45309;margin:3px 0;min-height:16px;}";
    document.head.appendChild(st);
  }

  /* ───── Modal Helpers ───── */

  function closeModal() {
    var el = document.getElementById("tnd-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "tnd-modal-root";
    bg.className = "tnd-modal-bg";
    var box = document.createElement("div");
    box.className = "tnd-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var acts = document.createElement("div");
    acts.className = "tnd-modal-actions";
    buttons.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      btn.className = b.primary
        ? "kintoneplugin-button-dialog-ok"
        : "kintoneplugin-button-normal";
      btn.addEventListener("click", function () {
        if (b.onClick) b.onClick(closeModal);
        else closeModal();
      });
      acts.appendChild(btn);
    });
    box.appendChild(acts);
    bg.appendChild(box);
    bg.addEventListener("click", function (ev) {
      if (ev.target === bg) closeModal();
    });
    document.body.appendChild(bg);
    return box;
  }

  /* ───── LIST TAB ───── */

  function filteredSites() {
    var f = state.siteFilter;
    var q = state.siteSearch.trim().toLowerCase();
    return state.sites.filter(function (s) {
      if (f === "connected" && !s.total_network_enabled) return false;
      if (f === "disconnected" && s.total_network_enabled) return false;
      if (q && String(s.location_name || "").toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  function renderListTab() {
    var el = document.getElementById("tnd-list-content");
    if (!el) return;
    if (state.loading) {
      el.innerHTML = "<p>読込中…</p>";
      return;
    }
    var rows = filteredSites();
    var thead =
      "<thead><tr>" +
      "<th>並</th><th>拠点名</th><th>接続</th>" +
      "<th>NWアドレス</th><th>マスク</th><th>GW</th>" +
      "<th>優先DNS</th><th>代替DNS</th><th>IP数</th>" +
      "<th>範囲</th><th>住所</th><th>備考</th><th>操作</th>" +
      "</tr></thead>";
    var tbody =
      "<tbody>" +
      rows
        .map(function (s) {
          var disc = !s.total_network_enabled;
          var trCls = disc ? ' class="tnd-tr-disconnected"' : "";
          var range =
            s.ip_range_start && s.ip_range_end
              ? esc(s.ip_range_start) + "～" + esc(s.ip_range_end)
              : "";
          return (
            "<tr" +
            trCls +
            ">" +
            "<td>" +
            esc(s.sort_no) +
            "</td>" +
            "<td><strong>" +
            esc(s.location_name) +
            "</strong></td>" +
            "<td>" +
            (s.total_network_enabled
              ? "接続"
              : '<span style="color:#94a3b8">未接続</span>') +
            "</td>" +
            "<td>" +
            esc(s.network_address) +
            "</td>" +
            "<td>" +
            esc(s.subnet_mask) +
            "</td>" +
            "<td>" +
            esc(s.gateway) +
            "</td>" +
            "<td>" +
            esc(s.dns_primary) +
            "</td>" +
            "<td>" +
            esc(s.dns_secondary) +
            "</td>" +
            "<td>" +
            esc(s.ip_count) +
            "</td>" +
            '<td style="white-space:nowrap">' +
            range +
            "</td>" +
            '<td style="max-width:130px;font-size:11px;white-space:pre-wrap">' +
            esc(s.address) +
            "</td>" +
            '<td style="max-width:130px;font-size:11px;white-space:pre-wrap">' +
            esc(s.note) +
            "</td>" +
            '<td class="tnd-actions"><button type="button" class="tnd-btn-edit" data-id="' +
            esc(s.id) +
            '">編集</button></td>' +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>";
    el.innerHTML =
      '<div class="tnd-table-wrap"><table class="tnd-table">' +
      thead +
      tbody +
      "</table></div>";
    el.querySelectorAll(".tnd-btn-edit").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var site = null;
        state.sites.forEach(function (s) {
          if (s.id === id) site = s;
        });
        if (site) openEditSiteModal(site);
      });
    });
  }

  function openEditSiteModal(site) {
    var body =
      '<label>接続状況<select id="tnd-f-conn">' +
      '<option value="1"' +
      (site.total_network_enabled ? " selected" : "") +
      ">接続</option>" +
      '<option value="0"' +
      (!site.total_network_enabled ? " selected" : "") +
      ">未接続</option></select></label>" +
      '<label>NWアドレス<input type="text" id="tnd-f-nw" value="' +
      esc(site.network_address) +
      '"></label>' +
      '<label>サブネットマスク<input type="text" id="tnd-f-mask" value="' +
      esc(site.subnet_mask) +
      '"></label>' +
      '<label>ゲートウェイ<input type="text" id="tnd-f-gw" value="' +
      esc(site.gateway) +
      '"></label>' +
      '<label>優先DNS<input type="text" id="tnd-f-dns1" value="' +
      esc(site.dns_primary) +
      '"></label>' +
      '<label>代替DNS<input type="text" id="tnd-f-dns2" value="' +
      esc(site.dns_secondary) +
      '"></label>' +
      '<label>IP数<input type="number" id="tnd-f-ipcount" value="' +
      esc(site.ip_count) +
      '"></label>' +
      '<label>範囲開始<input type="text" id="tnd-f-start" value="' +
      esc(site.ip_range_start) +
      '"></label>' +
      '<label>範囲終了<input type="text" id="tnd-f-end" value="' +
      esc(site.ip_range_end) +
      '"></label>' +
      '<label>住所<textarea id="tnd-f-addr" rows="2">' +
      esc(site.address) +
      "</textarea></label>" +
      '<label>備考<textarea id="tnd-f-note" rows="2">' +
      esc(site.note) +
      "</textarea></label>" +
      '<label><strong>変更理由</strong>（必須）' +
      '<textarea id="tnd-f-reason" rows="2" placeholder="変更理由を入力してください"></textarea></label>' +
      '<div id="tnd-f-warn" class="tnd-warn"></div>';

    openModal("拠点設定編集 — " + site.location_name, body, [
      { label: "キャンセル" },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          var reason = document.getElementById("tnd-f-reason").value.trim();
          if (!reason) {
            document.getElementById("tnd-f-warn").textContent =
              "変更理由は必須です。";
            return;
          }
          var newConn = document.getElementById("tnd-f-conn").value === "1";
          var newVals = {
            total_network_enabled: newConn,
            network_address: document.getElementById("tnd-f-nw").value.trim(),
            subnet_mask: document.getElementById("tnd-f-mask").value.trim(),
            gateway: document.getElementById("tnd-f-gw").value.trim(),
            dns_primary: document.getElementById("tnd-f-dns1").value.trim(),
            dns_secondary: document.getElementById("tnd-f-dns2").value.trim(),
            ip_count: document.getElementById("tnd-f-ipcount").value.trim(),
            ip_range_start: document.getElementById("tnd-f-start").value.trim(),
            ip_range_end: document.getElementById("tnd-f-end").value.trim(),
            address: document.getElementById("tnd-f-addr").value.trim(),
            note: document.getElementById("tnd-f-note").value.trim(),
          };
          var now = nowIso();
          var user = loginUser();
          var newHistoryRows = [];
          SITE_TRACK_FIELDS.forEach(function (f) {
            var oldV = f.bool
              ? site.total_network_enabled ? "接続" : "未接続"
              : String(site[f.key] || "");
            var nv = f.bool
              ? newVals.total_network_enabled ? "接続" : "未接続"
              : String(newVals[f.key] || "");
            if (oldV !== nv) {
              newHistoryRows.push({
                value: {
                  changed_at: { value: now },
                  changed_by: { value: user },
                  field_name: { value: f.label },
                  value_before: { value: oldV },
                  value_after: { value: nv },
                  change_reason: { value: reason },
                },
              });
            }
          });
          if (!newHistoryRows.length) {
            document.getElementById("tnd-f-warn").textContent =
              "変更はありません。";
            return;
          }
          var existingRows = (site._changeHistoryRaw || []).map(function (r) {
            return { id: r.id, value: r.value };
          });
          var ipCountVal =
            newVals.ip_count !== "" ? Number(newVals.ip_count) : "";
          var record = {
            total_network_enabled: {
              value: newVals.total_network_enabled ? [CHECKBOX_CONNECTED] : [],
            },
            network_address: { value: newVals.network_address },
            subnet_mask: { value: newVals.subnet_mask },
            gateway: { value: newVals.gateway },
            dns_primary: { value: newVals.dns_primary },
            dns_secondary: { value: newVals.dns_secondary },
            ip_count: { value: ipCountVal === "" ? null : ipCountVal },
            ip_range_start: { value: newVals.ip_range_start },
            ip_range_end: { value: newVals.ip_range_end },
            address: { value: newVals.address },
            note: { value: newVals.note },
            change_history: { value: existingRows.concat(newHistoryRows) },
          };
          apiPut("/k/v1/record.json", {
            app: APP_DB,
            id: Number(site.id),
            revision: Number(site.revision),
            record: record,
          })
            .then(function () {
              close();
              reloadAll();
            })
            .catch(function (e) {
              alert("保存失敗: " + (e.message || e));
            });
        },
      },
    ]);
  }

  /* ───── IP MATRIX TAB ───── */

  function renderMatrixTab() {
    var el = document.getElementById("tnd-matrix-content");
    if (!el) return;
    if (state.loading) {
      el.innerHTML = "<p>読込中…</p>";
      return;
    }
    var sites = state.sites.slice().sort(function (a, b) {
      return Number(a.sort_no) - Number(b.sort_no);
    });
    var ipMap = {};
    state.ipRecords.forEach(function (r) {
      ipMap[r.ip_address] = r;
    });
    var cols = sites.map(function (s) {
      var ips =
        s.ip_range_start && s.ip_range_end
          ? enumerateIpRange(s.ip_range_start, s.ip_range_end)
          : [];
      return { site: s, ips: ips };
    });
    var maxLen = 0;
    cols.forEach(function (c) {
      if (c.ips.length > maxLen) maxLen = c.ips.length;
    });
    var theadCells = cols
      .map(function (col) {
        var s = col.site;
        var disc = !s.total_network_enabled;
        var thStyle = disc
          ? ' style="background:#f8fafc;color:#94a3b8"'
          : "";
        var sugBtn =
          s.ip_range_start && s.ip_range_end && !disc
            ? '<button type="button" class="tnd-suggest-btn tnd-suggest" data-loc="' +
              esc(s.location_name) +
              '">次のIPを提案</button>'
            : "";
        return "<th" + thStyle + ">" + esc(s.location_name) + sugBtn + "</th>";
      })
      .join("");
    var tbodyRows = [];
    for (var r = 0; r < maxLen; r++) {
      var rowIdx = r;
      var cells = cols
        .map(function (col) {
          var s = col.site;
          var disc = !s.total_network_enabled;
          if (rowIdx >= col.ips.length) {
            return disc
              ? '<td class="tnd-cell-disconnected"></td>'
              : "<td></td>";
          }
          var ip = col.ips[rowIdx];
          var ipRec = ipMap[ip];
          if (disc) {
            return (
              '<td class="tnd-cell-disconnected" style="font-size:10px">' +
              esc(ip) +
              "</td>"
            );
          }
          if (ipRec) {
            var label = deviceLabel(ipRec.device_type, ipRec.device_type_other);
            return (
              '<td class="tnd-cell-assigned" data-ip="' +
              esc(ip) +
              '" data-loc="' +
              esc(s.location_name) +
              '">' +
              '<div style="font-weight:700">' +
              esc(ip) +
              "</div>" +
              "<div>" +
              esc(label) +
              "</div></td>"
            );
          }
          if (
            ip === state.matrixHighlightIp &&
            s.location_name === state.matrixHighlightSite
          ) {
            return (
              '<td class="tnd-cell-highlight" data-ip="' +
              esc(ip) +
              '" data-loc="' +
              esc(s.location_name) +
              '">' +
              "<div>" +
              esc(ip) +
              "</div>" +
              '<div style="color:#92400e;font-size:10px">← 提案</div></td>'
            );
          }
          return (
            '<td class="tnd-cell-empty" data-ip="' +
            esc(ip) +
            '" data-loc="' +
            esc(s.location_name) +
            '"><span style="font-size:10px">' +
            esc(ip) +
            "</span></td>"
          );
        })
        .join("");
      tbodyRows.push("<tr>" + cells + "</tr>");
    }
    if (!maxLen) {
      tbodyRows.push(
        '<tr><td colspan="' + cols.length + '">データなし</td></tr>'
      );
    }
    el.innerHTML =
      '<div class="tnd-matrix-wrap"><table class="tnd-matrix"><thead><tr>' +
      theadCells +
      "</tr></thead><tbody>" +
      tbodyRows.join("") +
      "</tbody></table></div>";

    el.querySelectorAll(".tnd-suggest").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        suggestNextIp(btn.getAttribute("data-loc"));
      });
    });
    el.querySelectorAll(".tnd-cell-assigned").forEach(function (td) {
      td.addEventListener("click", function () {
        var ip = td.getAttribute("data-ip");
        var found = null;
        state.ipRecords.forEach(function (r) {
          if (r.ip_address === ip) found = r;
        });
        if (found) openEditIpModal(found);
      });
    });
    el.querySelectorAll(".tnd-cell-empty, .tnd-cell-highlight").forEach(
      function (td) {
        td.addEventListener("click", function () {
          openAssignIpModal(
            td.getAttribute("data-ip"),
            td.getAttribute("data-loc")
          );
        });
      }
    );
  }

  function suggestNextIp(locationName) {
    var site = null;
    state.sites.forEach(function (s) {
      if (s.location_name === locationName) site = s;
    });
    if (!site || !site.ip_range_start || !site.ip_range_end) return;
    var range = enumerateIpRange(site.ip_range_start, site.ip_range_end);
    var usedMap = {};
    state.ipRecords.forEach(function (r) {
      usedMap[r.ip_address] = true;
    });
    var next = null;
    for (var i = 0; i < range.length; i++) {
      if (!usedMap[range[i]]) {
        next = range[i];
        break;
      }
    }
    if (!next) {
      alert(locationName + " の範囲内に空きIPがありません。");
      return;
    }
    state.matrixHighlightSite = locationName;
    state.matrixHighlightIp = next;
    renderMatrixTab();
    setTimeout(function () {
      var cell = document.querySelector(".tnd-cell-highlight");
      if (cell) cell.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 80);
  }

  function openAssignIpModal(ip, locationName) {
    var dtOpts = deviceTypeOptionsHtml("");
    var body =
      '<p class="tnd-hint">拠点: <strong>' +
      esc(locationName) +
      "</strong> / IP: <strong>" +
      esc(ip) +
      "</strong></p>" +
      '<label>用途<select id="tnd-a-dt">' +
      dtOpts +
      "</select></label>" +
      '<div id="tnd-a-other-wrap" style="display:none">' +
      '<label>その他（用途詳細）<input type="text" id="tnd-a-other" placeholder="用途を入力"></label></div>' +
      '<label>備考<textarea id="tnd-a-note" rows="2"></textarea></label>' +
      '<div id="tnd-a-warn" class="tnd-warn"></div>';

    openModal("IP割当 — " + ip, body, [
      { label: "キャンセル" },
      {
        label: "割当",
        primary: true,
        onClick: function (close) {
          var dtCode = document.getElementById("tnd-a-dt").value;
          var dtOther = document.getElementById("tnd-a-other").value.trim();
          var note = document.getElementById("tnd-a-note").value.trim();
          if (dtCode === "other" && !dtOther) {
            document.getElementById("tnd-a-warn").textContent =
              "その他の場合は用途詳細を入力してください。";
            return;
          }
          var dup = false;
          state.ipRecords.forEach(function (r) {
            if (r.ip_address === ip) dup = true;
          });
          if (dup) {
            document.getElementById("tnd-a-warn").textContent =
              "このIPアドレスは既に割当済みです。";
            return;
          }
          var site = null;
          state.sites.forEach(function (s) {
            if (s.location_name === locationName) site = s;
          });
          var sortIdx = 0;
          if (site && site.ip_range_start) {
            sortIdx = ipToLong(ip) - ipToLong(site.ip_range_start);
          }
          var rec = {
            record_type: { value: "ip" },
            site_location_name: { value: locationName },
            ip_address: { value: ip },
            status: { value: STATUS_IN_USE },
            device_type: { value: dtCode },
            device_type_other: { value: dtOther },
            assignment_note: { value: note },
            sort_index: { value: sortIdx },
          };
          apiPost("/k/v1/record.json", { app: APP_DB, record: rec })
            .then(function () {
              state.matrixHighlightSite = null;
              state.matrixHighlightIp = null;
              close();
              return reloadAll();
            })
            .catch(function (e) {
              alert("割当失敗: " + (e.message || e));
            });
        },
      },
    ]);

    setTimeout(function () {
      var dtSel = document.getElementById("tnd-a-dt");
      if (!dtSel) return;
      dtSel.addEventListener("change", function () {
        var wrap = document.getElementById("tnd-a-other-wrap");
        if (wrap) wrap.style.display = dtSel.value === "other" ? "block" : "none";
      });
    }, 50);
  }

  function openEditIpModal(ipRec) {
    var dtOpts = deviceTypeOptionsHtml(ipRec.device_type);
    var body =
      '<p class="tnd-hint">拠点: <strong>' +
      esc(ipRec.site_location_name) +
      "</strong> / IP: <strong>" +
      esc(ipRec.ip_address) +
      "</strong></p>" +
      '<label>用途<select id="tnd-e-dt">' +
      dtOpts +
      "</select></label>" +
      '<div id="tnd-e-other-wrap"' +
      (ipRec.device_type === "other" ? "" : ' style="display:none"') +
      '><label>その他（用途詳細）' +
      '<input type="text" id="tnd-e-other" value="' +
      esc(ipRec.device_type_other) +
      '"></label></div>' +
      '<label>備考<textarea id="tnd-e-note" rows="2">' +
      esc(ipRec.assignment_note) +
      "</textarea></label>" +
      '<div id="tnd-e-warn" class="tnd-warn"></div>' +
      '<hr style="margin:10px 0;border:none;border-top:1px solid #e2e8f0">' +
      '<button type="button" id="tnd-e-del" class="kintoneplugin-button-normal" ' +
      'style="color:#b91c1c">このIPを削除（解除）</button>';

    openModal("IP編集 — " + ipRec.ip_address, body, [
      { label: "キャンセル" },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          var dtCode = document.getElementById("tnd-e-dt").value;
          var dtOther = document.getElementById("tnd-e-other").value.trim();
          var note = document.getElementById("tnd-e-note").value.trim();
          if (dtCode === "other" && !dtOther) {
            document.getElementById("tnd-e-warn").textContent =
              "その他の場合は用途詳細を入力してください。";
            return;
          }
          apiPut("/k/v1/record.json", {
            app: APP_DB,
            id: Number(ipRec.id),
            revision: Number(ipRec.revision),
            record: {
              device_type: { value: dtCode },
              device_type_other: { value: dtOther },
              assignment_note: { value: note },
            },
          })
            .then(function () {
              close();
              return reloadAll();
            })
            .catch(function (e) {
              alert("保存失敗: " + (e.message || e));
            });
        },
      },
    ]);

    setTimeout(function () {
      var dtSel = document.getElementById("tnd-e-dt");
      if (dtSel) {
        dtSel.addEventListener("change", function () {
          var wrap = document.getElementById("tnd-e-other-wrap");
          if (wrap) wrap.style.display = dtSel.value === "other" ? "block" : "none";
        });
      }
      var delBtn = document.getElementById("tnd-e-del");
      if (delBtn) {
        delBtn.addEventListener("click", function () {
          if (
            !window.confirm(
              ipRec.ip_address + " の割当を削除します。よろしいですか？"
            )
          ) {
            return;
          }
          apiDelete("/k/v1/records.json", {
            app: APP_DB,
            ids: [Number(ipRec.id)],
          })
            .then(function () {
              closeModal();
              return reloadAll();
            })
            .catch(function (e) {
              alert("削除失敗: " + (e.message || e));
            });
        });
      }
    }, 50);
  }

  /* ───── SETTINGS TAB ───── */

  function renderSettingsTab() {
    var el = document.getElementById("tnd-settings-content");
    if (!el) return;
    if (state.loading) {
      el.innerHTML = "<p>読込中…</p>";
      return;
    }
    var rows = state.deviceTypes.slice().sort(function (a, b) {
      return Number(a.sort_no) - Number(b.sort_no);
    });
    var tbody = rows
      .map(function (d) {
        var trCls = !d.is_active ? ' class="tnd-inactive"' : "";
        return (
          "<tr" +
          trCls +
          ">" +
          "<td>" +
          esc(d.sort_no) +
          "</td>" +
          "<td>" +
          esc(d.device_type_code) +
          "</td>" +
          "<td>" +
          esc(d.device_type_label) +
          "</td>" +
          "<td>" +
          (d.is_active ? "有効" : "無効") +
          "</td>" +
          '<td><button type="button" class="tnd-dt-toggle" data-id="' +
          esc(d.id) +
          '" data-rev="' +
          esc(d.revision) +
          '" data-active="' +
          (d.is_active ? "1" : "0") +
          '">' +
          (d.is_active ? "無効にする" : "有効にする") +
          "</button></td></tr>"
        );
      })
      .join("");
    el.innerHTML =
      '<table class="tnd-dt-table"><thead><tr>' +
      "<th>順</th><th>コード</th><th>ラベル</th><th>状態</th><th>操作</th>" +
      "</tr></thead><tbody>" +
      tbody +
      "</tbody></table>" +
      '<div style="margin-top:12px">' +
      '<button type="button" id="tnd-dt-add" class="kintoneplugin-button-dialog-ok">用途を追加</button>' +
      "</div>";

    el.querySelectorAll(".tnd-dt-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var rev = btn.getAttribute("data-rev");
        var active = btn.getAttribute("data-active") === "1";
        apiPut("/k/v1/record.json", {
          app: APP_DB,
          id: Number(id),
          revision: Number(rev),
          record: { is_active: { value: active ? [] : [CHECKBOX_ACTIVE] } },
        })
          .then(function () {
            reloadAll();
          })
          .catch(function (e) {
            alert("更新失敗: " + (e.message || e));
          });
      });
    });

    var addBtn = document.getElementById("tnd-dt-add");
    if (addBtn) addBtn.addEventListener("click", openAddDeviceTypeModal);
  }

  function openAddDeviceTypeModal() {
    var nextSort = 1;
    state.deviceTypes.forEach(function (d) {
      var n = Number(d.sort_no);
      if (n >= nextSort) nextSort = n + 1;
    });
    var body =
      '<label>コード（英小文字・数字・アンダースコア）' +
      '<input type="text" id="tnd-dt-code" placeholder="例: router"></label>' +
      '<label>ラベル（表示名）' +
      '<input type="text" id="tnd-dt-label" placeholder="例: ルーター"></label>' +
      '<label>表示順<input type="number" id="tnd-dt-sort" value="' +
      nextSort +
      '"></label>' +
      '<div id="tnd-dt-warn" class="tnd-warn"></div>';

    openModal("用途マスタ追加", body, [
      { label: "キャンセル" },
      {
        label: "追加",
        primary: true,
        onClick: function (close) {
          var code = document.getElementById("tnd-dt-code").value.trim();
          var label = document.getElementById("tnd-dt-label").value.trim();
          var sort = Number(document.getElementById("tnd-dt-sort").value) || nextSort;
          if (!code || !label) {
            document.getElementById("tnd-dt-warn").textContent =
              "コードとラベルは必須です。";
            return;
          }
          if (!/^[a-z0-9_]+$/.test(code)) {
            document.getElementById("tnd-dt-warn").textContent =
              "コードは英小文字・数字・アンダースコアのみ使用可能です。";
            return;
          }
          var dup = state.deviceTypes.some(function (d) {
            return d.device_type_code === code;
          });
          if (dup) {
            document.getElementById("tnd-dt-warn").textContent =
              "このコードは既に使用されています。";
            return;
          }
          var rec = {
            record_type: { value: "device_type" },
            device_type_code: { value: code },
            device_type_label: { value: label },
            sort_no: { value: sort },
            is_active: { value: [CHECKBOX_ACTIVE] },
          };
          apiPost("/k/v1/record.json", { app: APP_DB, record: rec })
            .then(function () {
              close();
              return reloadAll();
            })
            .catch(function (e) {
              alert("追加失敗: " + (e.message || e));
            });
        },
      },
    ]);
  }

  /* ───── EXCEL EXPORT ───── */

  function exportXlsx() {
    if (typeof XLSX === "undefined" || !XLSX.utils) {
      alert(
        "Excel出力ライブラリが読み込まれていません。ページを再読み込みしてください。"
      );
      return;
    }
    var wb = XLSX.utils.book_new();

    var sortedAll = state.sites
      .slice()
      .sort(function (a, b) { return Number(a.sort_no) - Number(b.sort_no); });
    var connSites = sortedAll.filter(function (s) { return s.total_network_enabled; });

    var listHeader = [
      "並", "拠点名", "接続", "NWアドレス", "マスク", "GW",
      "優先DNS", "代替DNS", "IP数", "範囲開始", "範囲終了", "住所", "備考",
    ];
    var listData = [listHeader].concat(
      connSites.map(function (s) {
        return [
          s.sort_no, s.location_name, "接続",
          s.network_address, s.subnet_mask, s.gateway,
          s.dns_primary, s.dns_secondary, s.ip_count,
          s.ip_range_start, s.ip_range_end, s.address, s.note,
        ];
      })
    );
    var ws1 = XLSX.utils.aoa_to_sheet(listData);
    XLSX.utils.book_append_sheet(wb, ws1, "一覧表");

    var ipMap = {};
    state.ipRecords.forEach(function (r) { ipMap[r.ip_address] = r; });
    var matCols = sortedAll.map(function (s) {
      return {
        site: s,
        ips:
          s.ip_range_start && s.ip_range_end
            ? enumerateIpRange(s.ip_range_start, s.ip_range_end)
            : [],
      };
    });
    var maxLen = 0;
    matCols.forEach(function (c) {
      if (c.ips.length > maxLen) maxLen = c.ips.length;
    });
    var matHeader = sortedAll.map(function (s) { return s.location_name; });
    var matData = [matHeader];
    for (var i = 0; i < maxLen; i++) {
      var rowIdx = i;
      var row = matCols.map(function (col) {
        if (rowIdx >= col.ips.length) return "";
        var ip = col.ips[rowIdx];
        var rec = ipMap[ip];
        return rec ? ip + " [" + deviceLabel(rec.device_type, rec.device_type_other) + "]" : ip;
      });
      matData.push(row);
    }
    var ws2 = XLSX.utils.aoa_to_sheet(matData);
    XLSX.utils.book_append_sheet(wb, ws2, "IPマトリックス");

    var stamp = todayJstYmd().replace(/-/g, "");
    XLSX.writeFile(wb, "トータルネットワーク管理_" + stamp + ".xlsx", {
      bookType: "xlsx",
    });
  }

  /* ───── PRINT ───── */

  function openPrintWin(html) {
    var w = window.open("", "_blank");
    if (!w) {
      alert(
        "別ウィンドウを開けませんでした。ポップアップブロックを解除してください。"
      );
      return;
    }
    w.opener = null;
    var d = w.document;
    d.open();
    d.write(html);
    d.close();
    w.focus();
    setTimeout(function () {
      try {
        w.print();
      } catch (e) {
        console.warn(BUILD, e);
      }
    }, 400);
  }

  function printListWindow() {
    var colDefs = [
      { k: "location_name", l: "拠点名" },
      { k: "network_address", l: "NWアドレス" },
      { k: "subnet_mask", l: "マスク" },
      { k: "gateway", l: "GW" },
      { k: "dns_primary", l: "優先DNS" },
      { k: "dns_secondary", l: "代替DNS" },
      { k: "ip_count", l: "IP数" },
      { k: "ip_range_start", l: "範囲開始" },
      { k: "ip_range_end", l: "範囲終了" },
      { k: "address", l: "住所" },
      { k: "note", l: "備考" },
    ];
    var sites = state.sites
      .filter(function (s) { return s.total_network_enabled; })
      .sort(function (a, b) { return Number(a.sort_no) - Number(b.sort_no); });
    var head =
      "<thead><tr>" +
      colDefs.map(function (c) { return "<th>" + esc(c.l) + "</th>"; }).join("") +
      "</tr></thead>";
    var body =
      "<tbody>" +
      sites
        .map(function (s) {
          return (
            "<tr>" +
            colDefs
              .map(function (c) { return "<td>" + esc(s[c.k] || "") + "</td>"; })
              .join("") +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>";
    var css =
      "*{box-sizing:border-box}" +
      "body{font-family:Meiryo,sans-serif;margin:0;padding:10px;font-size:9pt;" +
      "color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
      "h2{margin:0 0 8px;font-size:12pt}" +
      "table{border-collapse:collapse;width:100%}" +
      "th,td{border:1px solid #64748b;padding:4px 5px;vertical-align:top;word-break:break-all}" +
      "th{background:#dbeafe;font-size:9pt;font-weight:700}" +
      "tr:nth-child(even) td{background:#f8fafc}" +
      "@media print{@page{size:A4 landscape;margin:8mm}}";
    var html =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
      "<title>トータルネットワーク一覧表</title>" +
      "<style>" +
      css +
      "</style></head><body>" +
      "<h2>トータルネットワーク管理台帳 — 一覧表（" +
      esc(todayJstYmd()) +
      "）</h2>" +
      "<table>" +
      head +
      body +
      "</table></body></html>";
    openPrintWin(html);
  }

  function openMatrixPrintSelectModal() {
    var connSites = state.sites
      .filter(function (s) { return s.total_network_enabled; })
      .sort(function (a, b) { return Number(a.sort_no) - Number(b.sort_no); });
    var checks = connSites
      .map(function (s) {
        return (
          '<label style="display:block;font-size:13px">' +
          '<input type="checkbox" class="tnd-print-site" value="' +
          esc(s.location_name) +
          '" checked> ' +
          esc(s.location_name) +
          "</label>"
        );
      })
      .join("");
    var body =
      '<div style="max-height:320px;overflow:auto;border:1px solid #e2e8f0;padding:8px;border-radius:4px">' +
      checks +
      "</div>" +
      '<div style="margin-top:8px;display:flex;gap:8px">' +
      '<button type="button" id="tnd-ps-all" class="kintoneplugin-button-normal">全選択</button>' +
      '<button type="button" id="tnd-ps-none" class="kintoneplugin-button-normal">全解除</button>' +
      "</div>";

    openModal("マトリックス印刷 — 拠点選択", body, [
      { label: "キャンセル" },
      {
        label: "印刷",
        primary: true,
        onClick: function (close) {
          var selected = [];
          document.querySelectorAll(".tnd-print-site:checked").forEach(function (cb) {
            selected.push(cb.value);
          });
          if (!selected.length) {
            alert("拠点を1つ以上選択してください。");
            return;
          }
          close();
          printMatrixWindow(selected);
        },
      },
    ]);

    setTimeout(function () {
      var allBtn = document.getElementById("tnd-ps-all");
      var noneBtn = document.getElementById("tnd-ps-none");
      if (allBtn) {
        allBtn.addEventListener("click", function () {
          document.querySelectorAll(".tnd-print-site").forEach(function (cb) {
            cb.checked = true;
          });
        });
      }
      if (noneBtn) {
        noneBtn.addEventListener("click", function () {
          document.querySelectorAll(".tnd-print-site").forEach(function (cb) {
            cb.checked = false;
          });
        });
      }
    }, 50);
  }

  function printMatrixWindow(selectedLocations) {
    var selSet = {};
    selectedLocations.forEach(function (l) { selSet[l] = true; });
    var sites = state.sites
      .filter(function (s) { return selSet[s.location_name]; })
      .sort(function (a, b) { return Number(a.sort_no) - Number(b.sort_no); });
    var ipMap = {};
    state.ipRecords.forEach(function (r) { ipMap[r.ip_address] = r; });
    var cols = sites.map(function (s) {
      return {
        site: s,
        ips:
          s.ip_range_start && s.ip_range_end
            ? enumerateIpRange(s.ip_range_start, s.ip_range_end)
            : [],
      };
    });
    var maxLen = 0;
    cols.forEach(function (c) {
      if (c.ips.length > maxLen) maxLen = c.ips.length;
    });
    var thead =
      "<thead><tr>" +
      cols
        .map(function (c) { return "<th>" + esc(c.site.location_name) + "</th>"; })
        .join("") +
      "</tr></thead>";
    var trows = "";
    for (var i = 0; i < maxLen; i++) {
      var rowIdx = i;
      var cells = cols
        .map(function (col) {
          if (rowIdx >= col.ips.length) return "<td></td>";
          var ip = col.ips[rowIdx];
          var rec = ipMap[ip];
          if (rec) {
            return (
              '<td style="background:#dbeafe"><strong>' +
              esc(ip) +
              "</strong><br>" +
              esc(deviceLabel(rec.device_type, rec.device_type_other)) +
              "</td>"
            );
          }
          return '<td style="color:#94a3b8;font-size:8pt">' + esc(ip) + "</td>";
        })
        .join("");
      trows += "<tr>" + cells + "</tr>";
    }
    var css =
      "*{box-sizing:border-box}" +
      "body{font-family:Meiryo,sans-serif;margin:0;padding:10px;font-size:9pt;" +
      "color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
      "h2{margin:0 0 8px;font-size:12pt}" +
      "table{border-collapse:collapse}" +
      "th,td{border:1px solid #cbd5e1;padding:3px 5px;vertical-align:top;font-size:9pt;min-width:68px}" +
      "th{background:#f1f5f9;font-weight:700}" +
      "@media print{@page{size:A4 landscape;margin:8mm}}";
    var html =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
      "<title>IPマトリックス</title>" +
      "<style>" +
      css +
      "</style></head><body>" +
      "<h2>トータルネットワーク管理台帳 — IPマトリックス（" +
      esc(todayJstYmd()) +
      "）</h2>" +
      "<table>" +
      thead +
      "<tbody>" +
      trows +
      "</tbody></table></body></html>";
    openPrintWin(html);
  }

  /* ───── TAB ROUTING ───── */

  function renderActiveTab() {
    if (state.tab === "list") renderListTab();
    else if (state.tab === "matrix") renderMatrixTab();
    else if (state.tab === "settings") renderSettingsTab();
  }

  function switchTab(tab) {
    state.tab = tab;
    document.querySelectorAll(".tnd-tab").forEach(function (el) {
      el.classList.toggle("tnd-tab-active", el.getAttribute("data-tab") === tab);
    });
    document.querySelectorAll(".tnd-tab-pane").forEach(function (el) {
      el.style.display = el.getAttribute("data-pane") === tab ? "block" : "none";
    });
    renderActiveTab();
  }

  /* ───── SHELL / MOUNT ───── */

  function resolveMountHost() {
    return (
      kintone.app.getHeaderSpaceElement() ||
      kintone.app.getHeaderMenuSpaceElement() ||
      document.querySelector(".ocean-ui-app-index-head") ||
      document.body
    );
  }

  function buildShell() {
    if (document.getElementById("tnd-root")) return;
    injectCss();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "tnd-root";
    root.className = "tnd-root";
    root.innerHTML =
      '<div class="tnd-toolbar">' +
      '<strong style="font-size:16px">トータルネットワーク管理台帳</strong>' +
      '<button type="button" id="tnd-reload" class="kintoneplugin-button-normal">再読み込み</button>' +
      '<button type="button" id="tnd-excel" class="kintoneplugin-button-normal">Excel出力</button>' +
      '<button type="button" id="tnd-print-list" class="kintoneplugin-button-normal">一覧表を印刷</button>' +
      '<button type="button" id="tnd-print-matrix" class="kintoneplugin-button-normal">マトリックスを印刷</button>' +
      '<span id="tnd-build" style="font-size:11px;color:#94a3b8;margin-left:auto">' +
      esc(BUILD) +
      "</span>" +
      "</div>" +
      '<div class="tnd-tabs">' +
      '<div class="tnd-tab tnd-tab-active" data-tab="list">一覧表</div>' +
      '<div class="tnd-tab" data-tab="matrix">IPマトリックス</div>' +
      '<div class="tnd-tab" data-tab="settings">設定</div>' +
      "</div>" +
      '<div class="tnd-tab-pane" data-pane="list">' +
      '<div class="tnd-filters">' +
      '<button type="button" class="tnd-filter-btn kintoneplugin-button-normal" data-f="connected">接続拠点</button>' +
      '<button type="button" class="tnd-filter-btn kintoneplugin-button-normal" data-f="all">全拠点</button>' +
      '<button type="button" class="tnd-filter-btn kintoneplugin-button-normal" data-f="disconnected">未接続拠点</button>' +
      '<input type="search" id="tnd-site-search" placeholder="拠点名で絞込" style="padding:5px 8px;min-width:200px">' +
      "</div>" +
      '<div id="tnd-list-content"><p>読込中…</p></div>' +
      "</div>" +
      '<div class="tnd-tab-pane" data-pane="matrix" style="display:none">' +
      '<div id="tnd-matrix-content"><p>読込中…</p></div>' +
      "</div>" +
      '<div class="tnd-tab-pane" data-pane="settings" style="display:none">' +
      '<div id="tnd-settings-content"><p>読込中…</p></div>' +
      "</div>";

    host.appendChild(root);

    root.querySelectorAll(".tnd-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchTab(tab.getAttribute("data-tab"));
      });
    });
    root.querySelectorAll(".tnd-filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.siteFilter = btn.getAttribute("data-f");
        renderListTab();
      });
    });
    var searchEl = document.getElementById("tnd-site-search");
    if (searchEl) {
      searchEl.addEventListener("input", function () {
        state.siteSearch = searchEl.value;
        renderListTab();
      });
    }
    document.getElementById("tnd-reload").addEventListener("click", function () {
      reloadAll();
    });
    document.getElementById("tnd-excel").addEventListener("click", function () {
      exportXlsx();
    });
    document.getElementById("tnd-print-list").addEventListener("click", function () {
      printListWindow();
    });
    document.getElementById("tnd-print-matrix").addEventListener("click", function () {
      openMatrixPrintSelectModal();
    });
  }

  function scheduleMount() {
    [0, 120, 400, 1000].forEach(function (ms) {
      setTimeout(function () {
        buildShell();
        if (ms === 0) reloadAll();
      }, ms);
    });
  }

  kintone.events.on("app.record.index.show", function (ev) {
    if (!APP_DB) {
      console.warn(BUILD, "APP_DB is 0 — patch with the correct app ID before deploying.");
    }
    scheduleMount();
    return ev;
  });
})();
