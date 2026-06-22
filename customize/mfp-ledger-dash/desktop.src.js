(function () {
  "use strict";

  /** 複合機管理台帳 — 719/734 型 Excel 風一覧 + REST CRUD + 印刷 + xlsx */
  var BUILD = "2026-06-22-mfp-ledger-dash-v1";
  var APP_DB = 741;
  var PAGE_SIZE = 100;

  var FC = {
    sort_no: "sort_no",
    location_name: "location_name",
    manufacturer: "manufacturer",
    model_name: "model_name",
    connection_type: "connection_type",
    ip_address: "ip_address",
    ip_prefix: "ip_prefix",
    admin_id: "admin_id",
    admin_password: "admin_password",
    machine_no: "machine_no",
    introduced_date: "introduced_date",
    install_location: "install_location",
    contract_holder: "contract_holder",
    lease_contract_no: "lease_contract_no",
    note: "note",
    registered_date: "registered_date",
    updated_date: "updated_date",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.sort_no,
    FC.location_name,
    FC.manufacturer,
    FC.model_name,
    FC.connection_type,
    FC.ip_address,
    FC.ip_prefix,
    FC.admin_id,
    FC.admin_password,
    FC.machine_no,
    FC.introduced_date,
    FC.install_location,
    FC.contract_holder,
    FC.lease_contract_no,
    FC.note,
    FC.registered_date,
    FC.updated_date,
  ];

  var LIST_COLUMNS = [
    { key: "location_name", label: "拠点" },
    { key: "manufacturer", label: "メーカー" },
    { key: "model_name", label: "型番" },
    { key: "connection_type", label: "接続方式" },
    { key: "ip_address", label: "IPアドレス" },
    { key: "ip_prefix", label: "プレフィックス" },
    { key: "introduced_date", label: "導入年月日" },
  ];

  var DETAIL_LABELS = [
    { key: "machine_no", label: "機械番号" },
    { key: "admin_id", label: "管理者ID" },
    { key: "admin_password", label: "管理者PW" },
    { key: "install_location", label: "設置場所", multiline: true },
    { key: "contract_holder", label: "契約名義" },
    { key: "lease_contract_no", label: "リース契約番号" },
    { key: "note", label: "メモ", multiline: true },
    { key: "registered_date", label: "登録日" },
    { key: "updated_date", label: "更新日" },
  ];

  var PRINT_ALL_FIELDS = [
    { key: "location_name", label: "拠点" },
    { key: "manufacturer", label: "メーカー" },
    { key: "model_name", label: "型番" },
    { key: "connection_type", label: "接続方式" },
    { key: "ip_address", label: "IPアドレス" },
    { key: "ip_prefix", label: "プレフィックス" },
    { key: "machine_no", label: "機械番号" },
    { key: "admin_id", label: "管理者ID" },
    { key: "admin_password", label: "管理者PW" },
    { key: "introduced_date", label: "導入年月日" },
    { key: "install_location", label: "設置場所" },
    { key: "contract_holder", label: "契約名義" },
    { key: "lease_contract_no", label: "リース契約番号" },
    { key: "note", label: "メモ" },
  ];

  var state = {
    records: [],
    search: "",
    locationFilter: "",
    loading: false,
    sortKey: "sort_no",
    sortDir: "asc",
  };

  function locationOptions() {
    if (typeof MFP_LOCATION_MASTER !== "undefined" && MFP_LOCATION_MASTER.locations) {
      return MFP_LOCATION_MASTER.locations
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
      location_name: val(rec, FC.location_name),
      manufacturer: val(rec, FC.manufacturer),
      model_name: val(rec, FC.model_name),
      connection_type: val(rec, FC.connection_type),
      ip_address: val(rec, FC.ip_address),
      ip_prefix: val(rec, FC.ip_prefix),
      admin_id: val(rec, FC.admin_id),
      admin_password: val(rec, FC.admin_password),
      machine_no: val(rec, FC.machine_no),
      introduced_date: val(rec, FC.introduced_date),
      install_location: val(rec, FC.install_location),
      contract_holder: val(rec, FC.contract_holder),
      lease_contract_no: val(rec, FC.lease_contract_no),
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
        code === FC.machine_no ||
        code === FC.admin_id ||
        code === FC.admin_password ||
        code === FC.ip_prefix ||
        code === FC.note ||
        code === FC.install_location ||
        code === FC.contract_holder ||
        code === FC.lease_contract_no ||
        code === FC.introduced_date
      ) {
        o[code] = { value: v || "" };
      }
    }
    set(FC.sort_no, row.sort_no);
    set(FC.location_name, row.location_name);
    set(FC.manufacturer, row.manufacturer);
    set(FC.model_name, row.model_name);
    set(FC.connection_type, row.connection_type);
    set(FC.ip_address, row.ip_address);
    set(FC.ip_prefix, row.ip_prefix);
    set(FC.admin_id, row.admin_id);
    set(FC.admin_password, row.admin_password);
    set(FC.machine_no, row.machine_no);
    set(FC.introduced_date, row.introduced_date);
    set(FC.install_location, row.install_location);
    set(FC.contract_holder, row.contract_holder);
    set(FC.lease_contract_no, row.lease_contract_no);
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
    if (document.getElementById("mfpl-dash-css")) return;
    var st = document.createElement("style");
    st.id = "mfpl-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".mfpl-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".mfpl-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".mfpl-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;padding:10px 14px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;}" +
      ".mfpl-filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;}" +
      ".mfpl-chip{border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;}" +
      ".mfpl-chip-active{background:#1e40af;color:#fff;border-color:#1e40af;}" +
      ".mfpl-table-wrap{overflow:auto;max-height:calc(100vh - 300px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".mfpl-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1100px;}" +
      ".mfpl-table th,.mfpl-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle;}" +
      ".mfpl-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;}" +
      ".mfpl-actions button{margin:0 2px;padding:2px 6px;font-size:11px;}" +
      ".mfpl-none{color:#64748b;font-style:italic;}" +
      ".mfpl-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".mfpl-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:640px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".mfpl-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".mfpl-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".mfpl-modal input,.mfpl-modal textarea,.mfpl-modal select{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".mfpl-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      "#mfpl-print-portal{display:none;}" +
      "@media print{#mfpl-print-portal{display:block!important;position:absolute;left:0;top:0;width:100%;}body *{visibility:hidden!important;}#mfpl-print-portal,#mfpl-print-portal *{visibility:visible!important;}.mfpl-root{display:none!important;}}";
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
      row.location_name +
      " " +
      row.manufacturer +
      " " +
      row.model_name +
      " " +
      row.connection_type +
      " " +
      row.ip_address +
      " " +
      row.machine_no +
      " " +
      row.note;
    return hay.toLowerCase().indexOf(q) >= 0;
  }

  function filteredRecords() {
    var q = state.search.trim().toLowerCase();
    var loc = state.locationFilter;
    var rows = state.records.filter(function (r) {
      if (loc && r.location_name !== loc) return false;
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
    var el = document.getElementById("mfpl-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "mfpl-modal-root";
    bg.className = "mfpl-modal-bg";
    var box = document.createElement("div");
    box.className = "mfpl-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "mfpl-modal-actions";
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

  function locationSelectHtml(selected) {
    var opts = ['<option value="">— 選択 —</option>'];
    locationOptions().forEach(function (name) {
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
    return '<select id="mfpl-f-loc">' + opts.join("") + "</select>";
  }

  function formFieldsHtml(row, isNew) {
    var r = row || {};
    var conn = r.connection_type || "ネットワーク接続";
    return (
      '<label>並び順<input type="number" id="mfpl-f-sort" value="' +
      esc(r.sort_no || String(nextSortNo())) +
      '"></label>' +
      "<label>拠点名" +
      locationSelectHtml(r.location_name || "") +
      "</label>" +
      '<label>メーカー<input type="text" id="mfpl-f-mfr" value="' +
      esc(r.manufacturer || "") +
      '"></label>' +
      '<label>型番<input type="text" id="mfpl-f-model" value="' +
      esc(r.model_name || "") +
      '"></label>' +
      '<label>接続方式<select id="mfpl-f-conn"><option value="ネットワーク接続"' +
      (conn === "ネットワーク接続" ? " selected" : "") +
      '>ネットワーク接続</option><option value="USB接続"' +
      (conn === "USB接続" ? " selected" : "") +
      ">USB接続</option></select></label>" +
      '<label>IPアドレス<input type="text" id="mfpl-f-ip" value="' +
      esc(r.ip_address || "") +
      '"></label>' +
      '<label>プレフィックス<input type="text" id="mfpl-f-prefix" value="' +
      esc(r.ip_prefix || "") +
      '"></label>' +
      '<label>機械番号<input type="text" id="mfpl-f-machine" value="' +
      esc(r.machine_no || "") +
      '"></label>' +
      '<label>管理者ID<input type="text" id="mfpl-f-aid" value="' +
      esc(r.admin_id || "") +
      '"></label>' +
      '<label>管理者PW<input type="text" id="mfpl-f-apw" value="' +
      esc(r.admin_password || "") +
      '"></label>' +
      '<label>導入年月日<input type="date" id="mfpl-f-intro" value="' +
      esc(r.introduced_date || "") +
      '"></label>' +
      '<label>設置場所<textarea id="mfpl-f-install" rows="3">' +
      esc(r.install_location || "") +
      "</textarea></label>" +
      '<label>契約名義<input type="text" id="mfpl-f-contract" value="' +
      esc(r.contract_holder || "") +
      '"></label>' +
      '<label>リース契約番号<input type="text" id="mfpl-f-lease" value="' +
      esc(r.lease_contract_no || "") +
      '"></label>' +
      '<label>メモ<textarea id="mfpl-f-note" rows="3">' +
      esc(r.note || "") +
      "</textarea></label>" +
      (isNew
        ? ""
        : '<label>登録日<input type="date" id="mfpl-f-reg" value="' + esc(r.registered_date || "") + '"></label>')
    );
  }

  function readForm(row, isNew) {
    var conn = document.getElementById("mfpl-f-conn").value.trim();
    var o = {
      sort_no: document.getElementById("mfpl-f-sort").value.trim(),
      location_name: document.getElementById("mfpl-f-loc").value.trim(),
      manufacturer: document.getElementById("mfpl-f-mfr").value.trim(),
      model_name: document.getElementById("mfpl-f-model").value.trim(),
      connection_type: conn,
      ip_address: document.getElementById("mfpl-f-ip").value.trim(),
      ip_prefix: document.getElementById("mfpl-f-prefix").value.trim(),
      machine_no: document.getElementById("mfpl-f-machine").value.trim(),
      admin_id: document.getElementById("mfpl-f-aid").value.trim(),
      admin_password: document.getElementById("mfpl-f-apw").value.trim(),
      introduced_date: document.getElementById("mfpl-f-intro").value.trim(),
      install_location: document.getElementById("mfpl-f-install").value.trim(),
      contract_holder: document.getElementById("mfpl-f-contract").value.trim(),
      lease_contract_no: document.getElementById("mfpl-f-lease").value.trim(),
      note: document.getElementById("mfpl-f-note").value.trim(),
      updated_date: todayJstYmd(),
    };
    if (isNew) o.registered_date = todayJstYmd();
    else {
      o.registered_date = document.getElementById("mfpl-f-reg").value.trim() || row.registered_date;
      o.id = row.id;
      o.revision = row.revision;
    }
    if (!o.location_name) throw new Error("拠点名は必須です");
    if (!o.manufacturer) throw new Error("メーカーは必須です");
    if (!o.model_name) throw new Error("型番は必須です");
    if (!o.connection_type) throw new Error("接続方式は必須です");
    if (o.connection_type === "ネットワーク接続" && !o.ip_address) {
      throw new Error("ネットワーク接続の場合、IPアドレスは必須です");
    }
    return o;
  }

  function openNewModal() {
    openModal("新規複合機", formFieldsHtml(null, true), [
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
    openModal("編集 — " + row.model_name, formFieldsHtml(row, false), [
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
    openModal(
      "削除確認",
      "<p>「" + esc(row.location_name) + " / " + esc(row.model_name) + "」を削除します。よろしいですか？</p>",
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
    if (!t) return '<span class="mfpl-none">—</span>';
    return esc(t);
  }

  function renderFilterChips() {
    var el = document.getElementById("mfpl-filters");
    if (!el) return;
    var locs = locationOptions();
    var used = {};
    state.records.forEach(function (r) {
      if (r.location_name) used[r.location_name] = true;
    });
    var html = '<button type="button" class="mfpl-chip' + (!state.locationFilter ? " mfpl-chip-active" : "") + '" data-loc="">すべて</button>';
    locs.forEach(function (name) {
      if (!used[name]) return;
      html +=
        '<button type="button" class="mfpl-chip' +
        (state.locationFilter === name ? " mfpl-chip-active" : "") +
        '" data-loc="' +
        esc(name) +
        '">' +
        esc(name) +
        "</button>";
    });
    el.innerHTML = html;
    el.querySelectorAll(".mfpl-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.locationFilter = btn.getAttribute("data-loc") || "";
        renderTable();
      });
    });
  }

  function renderTable() {
    var wrap = document.getElementById("mfpl-table-wrap");
    if (!wrap) return;
    if (state.loading) {
      wrap.innerHTML = "<p>読込中…</p>";
      return;
    }
    var rows = filteredRecords();
    var thead =
      "<tr><th>操作</th>" +
      LIST_COLUMNS.map(function (c) {
        return "<th>" + esc(c.label) + "</th>";
      }).join("") +
      "</tr>";
    var tbody = rows
      .map(function (row) {
        return (
          "<tr data-id=\"" +
          esc(row.id) +
          '"><td class="mfpl-actions">' +
          '<button type="button" class="mfpl-btn-edit">編集</button> ' +
          '<button type="button" class="mfpl-btn-del">削除</button>' +
          "</td>" +
          LIST_COLUMNS.map(function (c) {
            return "<td>" + displayCell(row[c.key]) + "</td>";
          }).join("") +
          "</tr>"
        );
      })
      .join("");
    wrap.innerHTML =
      '<table class="mfpl-table"><thead>' + thead + "</thead><tbody>" + (tbody || '<tr><td colspan="8">該当なし</td></tr>') + "</tbody></table>";
    wrap.querySelectorAll(".mfpl-btn-edit").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.closest("tr").getAttribute("data-id");
        var row = state.records.find(function (r) {
          return r.id === id;
        });
        if (row) openEditModal(row);
      });
    });
    wrap.querySelectorAll(".mfpl-btn-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.closest("tr").getAttribute("data-id");
        var row = state.records.find(function (r) {
          return r.id === id;
        });
        if (row) openDeleteModal(row);
      });
    });
    renderFilterChips();
    var meta = document.getElementById("mfpl-count");
    if (meta) meta.textContent = "表示 " + rows.length + " / 全 " + state.records.length + " 台";
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
    return String(row[key] || "").trim() || "—";
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
      '<div class="mfplpr-page">' +
      "<h1>" +
      esc(title) +
      "</h1>" +
      '<p class="mfplpr-meta">出力日: ' +
      esc(todayJstYmd()) +
      "　BUILD: " +
      esc(BUILD) +
      "</p>" +
      '<table class="mfplpr-table"><thead><tr>' +
      head +
      "</tr></thead><tbody>" +
      body +
      "</tbody></table></div>"
    );
  }

  function printStylesheet() {
    return (
      ".mfplpr-page{font-family:Meiryo,Segoe UI,sans-serif;padding:12px;}" +
      ".mfplpr-page h1{font-size:16pt;margin:0 0 8px;}" +
      ".mfplpr-meta{font-size:10pt;color:#475569;margin:0 0 12px;}" +
      ".mfplpr-table{border-collapse:collapse;width:100%;font-size:9pt;}" +
      ".mfplpr-table th,.mfplpr-table td{border:1px solid #334155;padding:4px 5px;vertical-align:top;word-break:break-all;}" +
      ".mfplpr-table th{background:#e2e8f0;}" +
      "@media print{@page{size:A4 landscape;margin:8mm;}}"
    );
  }

  function runPrint(html) {
    var portal = document.getElementById("mfpl-print-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "mfpl-print-portal";
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
    runPrint(buildPrintTableHtml(rows, "複合機管理台帳 — 一覧", false));
  }

  function openLocationPrintModal() {
    var locs = locationOptions().filter(function (name) {
      return state.records.some(function (r) {
        return r.location_name === name;
      });
    });
    var opts = locs.map(function (n) {
      return '<option value="' + esc(n) + '">' + esc(n) + "</option>";
    });
    openModal(
      "拠点指定印刷（業者提供用）",
      '<label>拠点<select id="mfpl-print-loc">' + opts.join("") + "</select></label>" +
        '<p style="font-size:12px;color:#64748b;">全項目（管理者PW含む）を印刷します。</p>',
      [
        { label: "キャンセル" },
        {
          label: "印刷",
          primary: true,
          onClick: function (close) {
            var loc = document.getElementById("mfpl-print-loc").value;
            var rows = state.records
              .filter(function (r) {
                return r.location_name === loc;
              })
              .sort(function (a, b) {
                return Number(a.sort_no) - Number(b.sort_no);
              });
            if (!rows.length) {
              alert("該当データがありません");
              return;
            }
            close();
            runPrint(buildPrintTableHtml(rows, "複合機一覧 — " + loc + "（業者提供用）", true));
          },
        },
      ],
    );
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
    XLSX.writeFile(wb, "複合機管理台帳_" + todayJstYmd().replace(/-/g, "") + ".xlsx", { bookType: "xlsx" });
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
      '<div class="mfpl-root">' +
      '<div class="mfpl-meta">' +
      '<span id="mfpl-count">—</span>' +
      '<button type="button" id="mfpl-new" class="kintoneplugin-button-dialog-ok" style="margin-left:auto">新規登録</button>' +
      "</div>" +
      '<div class="mfpl-toolbar">' +
      '<input type="search" id="mfpl-search" placeholder="キーワード検索" style="min-width:220px;padding:6px;">' +
      '<button type="button" id="mfpl-print-list" class="kintoneplugin-button-normal">一覧印刷</button>' +
      '<button type="button" id="mfpl-print-loc" class="kintoneplugin-button-normal">拠点指定印刷</button>' +
      '<button type="button" id="mfpl-xlsx" class="kintoneplugin-button-normal">Excel出力</button>' +
      '<span style="font-size:11px;color:#64748b;margin-left:8px">BUILD ' +
      esc(BUILD) +
      "</span>" +
      "</div>" +
      '<div id="mfpl-filters" class="mfpl-filters"></div>' +
      '<div id="mfpl-table-wrap" class="mfpl-table-wrap"></div>' +
      "</div>";

    document.getElementById("mfpl-new").addEventListener("click", openNewModal);
    document.getElementById("mfpl-print-list").addEventListener("click", printList);
    document.getElementById("mfpl-print-loc").addEventListener("click", openLocationPrintModal);
    document.getElementById("mfpl-xlsx").addEventListener("click", exportXlsx);
    document.getElementById("mfpl-search").addEventListener("input", function (ev) {
      state.search = ev.target.value;
      renderTable();
    });
  }

  kintone.events.on("app.record.index.show", function (event) {
    if (!APP_DB) {
      alert("APP_DB 未設定 — deploy 前に mfp-ledger:sync-db-id を実行してください");
      return event;
    }
    injectCss();
    var host = resolveMountHost();
    if (!host || document.getElementById("mfpl-root-mounted")) return event;
    host.innerHTML = "";
    buildUi(host);
    host.id = "mfpl-root-mounted";
    reloadRecords();
    return event;
  });
})();
