(function () {
  "use strict";

  /** Apple ID管理台帳 — 693 REST CRUD（678 型） */
  var BUILD = "2026-08-11-694-edit-kind-new-exchange";

  var APP_DB = 693;
  var FIXED_PASSWORD = "Honten00";
  var FIXED_LOCK = "2511";
  var STATUS_ACTIVE = "利用中";
  var STATUS_RETIRED = "廃止";
  var PAGE_SIZE = 100;

  var FC = {
    legacy_no: "legacy_no",
    status: "status",
    registered_date: "registered_date",
    device_exchange_date: "device_exchange_date",
    mdm_name: "mdm_name",
    user_name: "user_name",
    phone_number: "phone_number",
    apple_id: "apple_id",
    password: "password",
    lock_passcode: "lock_passcode",
    device_type: "device_type",
    note: "note",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.legacy_no,
    FC.status,
    FC.registered_date,
    FC.device_exchange_date,
    FC.mdm_name,
    FC.user_name,
    FC.phone_number,
    FC.apple_id,
    FC.password,
    FC.lock_passcode,
    FC.device_type,
    FC.note,
  ];

  var SORT_COLUMNS = [
    { key: "legacy_no", label: "No." },
    { key: "status", label: "状態" },
    { key: "registered_date", label: "登録日" },
    { key: "device_exchange_date", label: "端末交換日" },
    { key: "mdm_name", label: "MDM名" },
    { key: "user_name", label: "氏名" },
    { key: "phone_number", label: "回線" },
    { key: "apple_id", label: "Apple ID" },
    { key: "password", label: "PW" },
    { key: "lock_passcode", label: "ロック" },
    { key: "device_type", label: "端末" },
  ];

  var state = {
    records: [],
    filter: "active",
    search: "",
    loading: false,
    selected: {},
    sortKey: null,
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

  function normalizeMdm(v) {
    return String(v == null ? "" : v).trim();
  }

  function flatten(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      legacy_no: val(rec, FC.legacy_no),
      status: val(rec, FC.status) || STATUS_ACTIVE,
      registered_date: val(rec, FC.registered_date),
      device_exchange_date: val(rec, FC.device_exchange_date),
      mdm_name: val(rec, FC.mdm_name),
      user_name: val(rec, FC.user_name),
      phone_number: val(rec, FC.phone_number),
      apple_id: val(rec, FC.apple_id),
      password: val(rec, FC.password),
      lock_passcode: val(rec, FC.lock_passcode),
      device_type: val(rec, FC.device_type),
      note: val(rec, FC.note),
    };
  }

  function toKintoneRecord(row, partial) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
    }
    if (!partial || partial.legacy_no) set(FC.legacy_no, row.legacy_no);
    if (!partial || partial.status) set(FC.status, row.status);
    if (!partial || partial.registered_date) set(FC.registered_date, row.registered_date);
    if (!partial || partial.device_exchange_date) {
      if (row.device_exchange_date) set(FC.device_exchange_date, row.device_exchange_date);
      else o[FC.device_exchange_date] = { value: null };
    }
    if (!partial || partial.mdm_name) set(FC.mdm_name, row.mdm_name);
    if (!partial || partial.user_name) set(FC.user_name, row.user_name);
    if (!partial || partial.phone_number) set(FC.phone_number, row.phone_number);
    if (!partial || partial.apple_id) set(FC.apple_id, row.apple_id);
    if (!partial || partial.password) set(FC.password, row.password);
    if (!partial || partial.lock_passcode) set(FC.lock_passcode, row.lock_passcode);
    if (!partial || partial.device_type) set(FC.device_type, row.device_type);
    if (!partial || partial.note) set(FC.note, row.note);
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
      var query = "order by legacy_no desc limit " + PAGE_SIZE + " offset " + offset;
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

  var JBIS_START = 39;

  function formatJbis(n) {
    return "jbis." + String(n).padStart(3, "0") + "@icloud.com";
  }

  /** SPEC §6: 039 起点。未割当プール行（氏名空・利用中）を優先。 */
  function nextJbisSlot(records) {
    var best = null;
    records.forEach(function (r) {
      var m = String(r.apple_id).match(/^jbis\.(\d+)@icloud\.com$/i);
      if (!m) return;
      var n = Number(m[1]);
      if (n < JBIS_START) return;
      if (String(r.user_name || "").trim()) return;
      if (r.status !== STATUS_ACTIVE) return;
      if (!best || n < best.n) {
        best = {
          n: n,
          apple_id: r.apple_id,
          id: r.id,
          revision: r.revision,
          isNew: false,
        };
      }
    });
    if (best) return best;
    var used = {};
    records.forEach(function (r) {
      var m = String(r.apple_id).match(/^jbis\.(\d+)@icloud\.com$/i);
      if (m) used[Number(m[1])] = true;
    });
    for (var n = JBIS_START; n <= 999; n++) {
      if (!used[n]) {
        return {
          n: n,
          apple_id: formatJbis(n),
          id: null,
          revision: null,
          isNew: true,
        };
      }
    }
    throw new Error("jbis slot exhausted");
  }

  function nextLegacyNo(records) {
    var max = 0;
    records.forEach(function (r) {
      var n = Number(r.legacy_no);
      if (Number.isFinite(n)) max = Math.max(max, n);
    });
    return max + 1;
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
    if (document.getElementById("aid-dash-css")) return;
    var st = document.createElement("style");
    st.id = "aid-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".aid-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".aid-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".aid-meta-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-bottom:12px;padding:16px 20px;" +
      "background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:2px solid #059669;border-radius:12px;" +
      "box-shadow:0 2px 8px rgba(5,150,105,.15);}" +
      ".aid-meta-count{font-size:13px;color:#475569;font-weight:500;white-space:nowrap;}" +
      ".aid-next-slot{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 14px;flex:1;min-width:280px;}" +
      ".aid-next-label{font-size:15px;font-weight:700;color:#047857;letter-spacing:.04em;}" +
      ".aid-next-id{font-size:1.65rem;font-weight:700;font-family:Consolas,Monaco,'Courier New',monospace;" +
      "color:#064e3b;letter-spacing:.03em;line-height:1.2;}" +
      ".aid-next-note{font-size:14px;font-weight:700;color:#0f766e;background:#fff;padding:4px 10px;border-radius:999px;" +
      "border:1px solid #5eead4;}" +
      ".aid-next-action{margin-left:auto;white-space:nowrap;font-size:14px;padding:8px 18px;}" +
      ".aid-table-wrap{overflow:auto;max-height:calc(100vh - 220px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".aid-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1200px;}" +
      ".aid-table th,.aid-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle;}" +
      ".aid-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;}" +
      ".aid-table th.aid-sort{cursor:pointer;user-select:none;white-space:nowrap;}" +
      ".aid-table th.aid-sort:hover{background:#e2e8f0;}" +
      ".aid-sort-ind{display:inline-block;margin-left:4px;font-size:10px;color:#94a3b8;}" +
      ".aid-table th.aid-sort--active .aid-sort-ind{color:#0369a1;font-weight:700;}" +
      ".aid-table tr.retired{background:#f8fafc;color:#64748b;}" +
      ".aid-table tr.unassigned td.user-name{color:#b45309;}" +
      ".aid-copy{cursor:pointer;font-family:Consolas,Monaco,monospace;font-size:12px;}" +
      ".aid-copy:hover{text-decoration:underline;color:#0369a1;}" +
      ".aid-actions button{margin:0 2px;padding:2px 6px;font-size:11px;}" +
      ".aid-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".aid-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:520px;width:92%;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".aid-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".aid-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".aid-modal input,.aid-modal select,.aid-modal textarea{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".aid-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}";
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
    if (key === "legacy_no") {
      return Number(a.legacy_no || 0) - Number(b.legacy_no || 0);
    }
    if (key === "registered_date" || key === "device_exchange_date") {
      return String(a[key] || "").localeCompare(String(b[key] || ""));
    }
    if (key === "status") {
      var sa = a.status === STATUS_ACTIVE ? 0 : 1;
      var sb = b.status === STATUS_ACTIVE ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return String(a.status || "").localeCompare(String(b.status || ""), "ja");
    }
    return String(a[key] || "").localeCompare(String(b[key] || ""), "ja");
  }

  function filteredRecords() {
    var q = state.search.trim().toLowerCase();
    var rows = state.records.filter(function (r) {
      if (state.filter === "active" && r.status !== STATUS_ACTIVE) return false;
      if (state.filter === "retired" && r.status !== STATUS_RETIRED) return false;
      if (state.filter === "unassigned") {
        if (r.status !== STATUS_ACTIVE) return false;
        if (String(r.user_name || "").trim()) return false;
      }
      if (!q) return true;
      var hay =
        (r.apple_id + " " + r.user_name + " " + r.mdm_name + " " + r.phone_number).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    rows.sort(function (a, b) {
      if (state.sortKey) {
        var cmp = compareSortValues(state.sortKey, a, b);
        return state.sortDir === "asc" ? cmp : -cmp;
      }
      var sa = a.status === STATUS_ACTIVE ? 0 : 1;
      var sb = b.status === STATUS_ACTIVE ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return Number(b.legacy_no) - Number(a.legacy_no);
    });
    return rows;
  }

  function updateSortHeaders() {
    var thead = document.querySelector("#aid-root .aid-table thead");
    if (!thead) return;
    thead.querySelectorAll("th.aid-sort").forEach(function (th) {
      var key = th.getAttribute("data-sort");
      var ind = th.querySelector(".aid-sort-ind");
      th.classList.toggle("aid-sort--active", key === state.sortKey);
      if (ind) {
        if (key === state.sortKey) {
          ind.textContent = state.sortDir === "asc" ? "\u25b2" : "\u25bc";
        } else {
          ind.textContent = "";
        }
      }
    });
  }

  function toggleSort(key) {
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    } else {
      state.sortKey = key;
      state.sortDir =
        key === "legacy_no" || key === "registered_date" || key === "device_exchange_date"
          ? "desc"
          : "asc";
    }
    updateSortHeaders();
    renderTable();
  }

  function closeModal() {
    var el = document.getElementById("aid-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "aid-modal-root";
    bg.className = "aid-modal-bg";
    var box = document.createElement("div");
    box.className = "aid-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "aid-modal-actions";
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

  function warnUserName(name) {
    if (!name || name.indexOf("\u3000") >= 0) return "";
    return '<p style="color:#b45309;font-size:12px;">氏名に全角スペースがありません（例: 山田\u3000太郎）</p>';
  }

  /** SPEC §8.4 + legacy（au.com 等の業務メール含む） */
  function validateAppleId(id) {
    var s = String(id == null ? "" : id).trim();
    if (!s) return "Apple ID は必須です";
    if (/^jbis\.\d{3}@icloud\.com$/i.test(s)) return "";
    if (/^[\w.-]+@icloud\.com$/i.test(s)) return "";
    if (/^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(s)) return "";
    return "形式が不正です（例: jbis.039@icloud.com または name@example.com）";
  }

  function normalizeAppleIdInput(id) {
    return String(id == null ? "" : id).trim();
  }

  function displayPassword(row) {
    return String(row.password || "").trim() || FIXED_PASSWORD;
  }

  function displayLockPass(row) {
    return String(row.lock_passcode || "").trim() || FIXED_LOCK;
  }

  function executeNumbering(slot) {
    if (!slot.isNew) {
      var today = todayJstYmd();
      var existing = state.records.find(function (x) {
        return x.id === slot.id;
      });
      var patch = { registered_date: { value: today } };
      if (!String((existing && existing.password) || "").trim()) patch.password = { value: FIXED_PASSWORD };
      if (!String((existing && existing.lock_passcode) || "").trim()) patch.lock_passcode = { value: FIXED_LOCK };
      return apiPut("/k/v1/record.json", {
        app: APP_DB,
        id: slot.id,
        revision: slot.revision,
        record: patch,
      }).then(function (resp) {
        return reloadRecords().then(function () {
          var row = state.records.find(function (x) {
            return x.id === slot.id;
          });
          if (row) {
            row.revision = String(resp.revision);
            row.registered_date = today;
            openEditModal(row);
          }
          alert("採番: " + slot.apple_id + " — 利用者情報を入力して保存してください。");
        });
      });
    }
    var legacy = String(nextLegacyNo(state.records));
    var rec = toKintoneRecord({
      legacy_no: legacy,
      status: STATUS_ACTIVE,
      registered_date: todayJstYmd(),
      apple_id: slot.apple_id,
      password: FIXED_PASSWORD,
      lock_passcode: FIXED_LOCK,
    });
    return apiPost("/k/v1/record.json", { app: APP_DB, record: rec }).then(function (resp) {
      var newId = resp.id != null ? String(resp.id) : null;
      return reloadRecords().then(function () {
        var row =
          state.records.find(function (x) {
            return newId && x.id === newId;
          }) ||
          state.records.find(function (x) {
            return x.apple_id === slot.apple_id;
          });
        if (row) openEditModal(row);
        alert("採番: " + slot.apple_id + " — 利用者情報を入力して保存してください。");
      });
    });
  }

  function updateMetaBar() {
    var meta = document.getElementById("aid-meta");
    if (!meta) return;
    var slot = nextJbisSlot(state.records);
    var actionLabel = slot.isNew ? "新規作成" : "このIDを割当";
    meta.innerHTML =
      '<span class="aid-meta-count">全 ' +
      esc(String(state.records.length)) +
      " 件</span>" +
      '<div class="aid-next-slot">' +
      '<span class="aid-next-label">次採番</span>' +
      '<span class="aid-next-id">' +
      esc(slot.apple_id) +
      "</span>" +
      '<span class="aid-next-note">' +
      esc(slot.isNew ? "未登録" : "既存行") +
      '</span></div><button type="button" class="aid-next-action kintoneplugin-button-dialog-ok">' +
      esc(actionLabel) +
      "</button>";
  }

  function onNextSlotAction() {
    var slot = nextJbisSlot(state.records);
    var msg = slot.isNew
      ? slot.apple_id + " を新規作成します。よろしいですか？"
      : slot.apple_id + " を割当します（登録日を今日に更新）。よろしいですか？";
    if (!window.confirm(msg)) return;
    executeNumbering(slot).catch(function (e) {
      alert("採番失敗: " + (e.message || e));
    });
  }

  function reloadRecords() {
    state.loading = true;
    renderTable();
    return fetchAllRecords()
      .then(function (rows) {
        state.records = rows.map(flatten);
        state.loading = false;
        renderTable();
        updateMetaBar();
      })
      .catch(function (e) {
        state.loading = false;
        renderTable();
        alert("読込失敗: " + (e.message || e));
      });
  }

  function isEditKindExchange() {
    var el = document.querySelector('input[name="aid-edit-kind"][value="exchange"]');
    return Boolean(el && el.checked);
  }

  /** 新規/交換ラジオに応じて交換日欄の表示・初期値を同期 */
  function syncEditKindUI(opts) {
    var preferToday = opts && opts.preferToday;
    var isExchange = isEditKindExchange();
    var wrap = document.getElementById("aid-edit-exchange-wrap");
    var exchangeEl = document.getElementById("aid-edit-exchange");
    if (wrap) wrap.style.display = isExchange ? "block" : "none";
    if (!exchangeEl) return;
    if (!isExchange) {
      exchangeEl.value = "";
      return;
    }
    if (preferToday && !String(exchangeEl.value || "").trim()) {
      exchangeEl.value = todayJstYmd();
    }
  }

  function wireEditKindRadios() {
    var radios = document.querySelectorAll('input[name="aid-edit-kind"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener("change", function () {
        syncEditKindUI({ preferToday: true });
      });
    }
    syncEditKindUI({ preferToday: false });
  }

  function openEditModal(row) {
    var hasExchange = Boolean(String(row.device_exchange_date || "").trim());
    var box = openModal(
      "編集 — No." + row.legacy_no,
      '<fieldset style="border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;margin:0 0 12px;">' +
        '<legend style="font-size:12px;font-weight:700;color:#334155;padding:0 6px;">登録区分</legend>' +
        '<label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;font-weight:600;">' +
        '<input type="radio" name="aid-edit-kind" value="new"' +
        (hasExchange ? "" : " checked") +
        "> 新規</label>" +
        '<label style="display:inline-flex;align-items:center;gap:6px;font-weight:600;">' +
        '<input type="radio" name="aid-edit-kind" value="exchange"' +
        (hasExchange ? " checked" : "") +
        "> 交換</label>" +
        '<p style="font-size:11px;color:#64748b;margin:8px 0 0;">交換を選ぶと端末交換日の入力が必須になります。新規では交換日を保存しません。</p>' +
        "</fieldset>" +
        '<label>Apple ID<input id="aid-edit-apple-id" value="' +
        esc(row.apple_id) +
        '" autocomplete="off" spellcheck="false"></label>' +
        '<div id="aid-edit-apple-id-warn"></div>' +
        '<p style="font-size:11px;color:#64748b;margin:4px 0 8px;">登録ミス時のみ修正。重複する ID は保存できません。</p>' +
        '<p style="font-size:12px;color:#475569;margin:8px 0 4px;">登録日: <span id="aid-edit-reg-val">' +
        esc(row.registered_date) +
        "</span>（MDM変更時に今日へ自動更新）</p>" +
        '<div id="aid-edit-exchange-wrap" style="display:' +
        (hasExchange ? "block" : "none") +
        ';">' +
        '<label>端末交換日<input type="date" id="aid-edit-exchange" value="' +
        esc(row.device_exchange_date) +
        '"></label>' +
        '<p style="font-size:11px;color:#64748b;margin:4px 0 8px;">端末買い替え時に入力（必須）</p>' +
        "</div>" +
        '<label>MDM名<input id="aid-edit-mdm" value="' +
        esc(row.mdm_name) +
        '"></label>' +
        '<label>氏名<input id="aid-edit-name" value="' +
        esc(row.user_name) +
        '"></label>' +
        '<div id="aid-edit-name-warn"></div>' +
        '<label>回線番号<input id="aid-edit-phone" value="' +
        esc(row.phone_number) +
        '"></label>' +
        '<label>パスワード<input id="aid-edit-password" value="' +
        esc(displayPassword(row)) +
        '" autocomplete="off"></label>' +
        '<label>ロックパス<input id="aid-edit-lock" value="' +
        esc(displayLockPass(row)) +
        '" autocomplete="off"></label>' +
        '<p style="font-size:11px;color:#64748b;margin:4px 0 8px;">未入力で保存すると標準値（' +
        esc(FIXED_PASSWORD) +
        " / " +
        esc(FIXED_LOCK) +
        "）をセットします。</p>" +
        '<label>端末種別<select id="aid-edit-device"><option value="">—</option><option value="iPhone">iPhone</option><option value="iPad">iPad</option><option value="その他">その他</option></select></label>' +
        '<label>メモ<textarea id="aid-edit-note" rows="3">' +
        esc(row.note) +
        "</textarea></label>",
      [
        { label: "キャンセル" },
        {
          label: "保存",
          primary: true,
          onClick: function (close) {
            var appleEl = document.getElementById("aid-edit-apple-id");
            var appleId = appleEl ? normalizeAppleIdInput(appleEl.value) : "";
            var appleErr = validateAppleId(appleId);
            if (appleErr) {
              alert(appleErr);
              return;
            }
            if (appleId !== row.apple_id) {
              if (
                !window.confirm(
                  "Apple ID を変更します。\n\n変更前: " +
                    row.apple_id +
                    "\n変更後: " +
                    appleId +
                    "\n\nよろしいですか？",
                )
              ) {
                return;
              }
            }
            var nameEl = document.getElementById("aid-edit-name");
            var name = nameEl ? nameEl.value.trim() : "";
            if (name && name.indexOf("\u3000") < 0) {
              if (!window.confirm("氏名に全角スペースがありません。このまま保存しますか？")) return;
            }
            var pw = normalizeAppleIdInput((document.getElementById("aid-edit-password") || {}).value);
            var lock = normalizeAppleIdInput((document.getElementById("aid-edit-lock") || {}).value);
            if (!pw) pw = FIXED_PASSWORD;
            if (!lock) lock = FIXED_LOCK;
            var oldMdm = normalizeMdm(row.mdm_name);
            var newMdm = normalizeMdm((document.getElementById("aid-edit-mdm") || {}).value);
            var exchangeEl = document.getElementById("aid-edit-exchange");
            var exchangeRadio = document.querySelector('input[name="aid-edit-kind"][value="exchange"]');
            var registeredDate = row.registered_date;
            var mdmChanged = oldMdm !== newMdm;
            if (mdmChanged) {
              registeredDate = todayJstYmd();
              if (!isEditKindExchange() && exchangeRadio) {
                exchangeRadio.checked = true;
                syncEditKindUI({ preferToday: true });
                window.alert(
                  "MDM名が変更されたため、登録区分を「交換」にし、登録日を " +
                    registeredDate +
                    " に更新します。端末交換日を確認して保存してください。",
                );
              } else {
                window.alert(
                  "MDM名が変更されたため、登録日を " + registeredDate + " に更新します。",
                );
              }
            }
            var kindExchange = isEditKindExchange();
            var exchangeDate = kindExchange && exchangeEl ? String(exchangeEl.value || "").trim() : "";
            if (kindExchange && !exchangeDate) {
              alert("交換の場合は端末交換日を入力してください。");
              if (exchangeEl) exchangeEl.focus();
              return;
            }
            if (!kindExchange) exchangeDate = "";
            var rec = toKintoneRecord(
              {
                apple_id: appleId,
                registered_date: registeredDate,
                device_exchange_date: exchangeDate,
                mdm_name: newMdm,
                user_name: name,
                phone_number: (document.getElementById("aid-edit-phone") || {}).value || "",
                password: pw,
                lock_passcode: lock,
                device_type: (document.getElementById("aid-edit-device") || {}).value || "",
                note: (document.getElementById("aid-edit-note") || {}).value || "",
              },
              {
                apple_id: 1,
                registered_date: mdmChanged ? 1 : 0,
                device_exchange_date: 1,
                mdm_name: 1,
                user_name: 1,
                phone_number: 1,
                password: 1,
                lock_passcode: 1,
                device_type: 1,
                note: 1,
              },
            );
            apiPut("/k/v1/record.json", {
              app: APP_DB,
              id: row.id,
              revision: row.revision,
              record: rec,
            })
              .then(function () {
                close();
                reloadRecords();
                alert("保存しました");
              })
              .catch(function (e) {
                var msg = e.message || String(e);
                if (/unique|重複|duplicate|GAIA_/i.test(msg)) {
                  alert("保存失敗: この Apple ID は既に別の行で使われています。\n" + msg);
                } else {
                  alert("保存失敗: " + msg);
                }
              });
          },
        },
      ],
    );
    var dev = box.querySelector("#aid-edit-device");
    if (dev) dev.value = row.device_type || "";
    wireEditKindRadios();
    var appleInput = box.querySelector("#aid-edit-apple-id");
    var appleWarn = box.querySelector("#aid-edit-apple-id-warn");
    if (appleInput && appleWarn) {
      appleInput.addEventListener("input", function () {
        var err = validateAppleId(normalizeAppleIdInput(appleInput.value));
        appleWarn.innerHTML = err
          ? '<p style="color:#b91c1c;font-size:12px;">' + esc(err) + "</p>"
          : "";
      });
    }
    var nameInput = box.querySelector("#aid-edit-name");
    var warn = box.querySelector("#aid-edit-name-warn");
    if (nameInput && warn) {
      nameInput.addEventListener("input", function () {
        warn.innerHTML = warnUserName(nameInput.value.trim());
      });
    }
  }

  function openRetireModal(row) {
    openModal(
      "廃止確認",
      "<p>Apple ID: <strong>" +
        esc(row.apple_id) +
        "</strong></p><p>氏名: " +
        esc(row.user_name || "（未割当）") +
        "</p><p>ステータスを <strong>廃止</strong> にします（レコードは残します）。</p>",
      [
        { label: "キャンセル" },
        {
          label: "廃止する",
          primary: true,
          onClick: function (close) {
            apiPut("/k/v1/record.json", {
              app: APP_DB,
              id: row.id,
              revision: row.revision,
              record: { status: { value: STATUS_RETIRED } },
            })
              .then(function () {
                close();
                reloadRecords();
                alert("廃止しました");
              })
              .catch(function (e) {
                alert("廃止失敗: " + (e.message || e));
              });
          },
        },
      ],
    );
  }

  function openDeleteModal(row) {
    var extra =
      row.user_name || row.mdm_name
        ? '<p style="color:#b91c1c;font-weight:bold;">利用者情報があります。退職の場合は「廃止」を使ってください。</p>'
        : "";
    openModal(
      "削除確認（誤登録のみ）",
      extra +
        "<p>Apple ID: <strong>" +
        esc(row.apple_id) +
        "</strong></p><p>このレコードを<strong>物理削除</strong>します。</p>",
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

  function splitUserName(name) {
    var s = String(name || "").trim();
    if (!s) return { family: "", given: "" };
    var idx = s.indexOf("\u3000");
    if (idx >= 0) return { family: s.slice(0, idx), given: s.slice(idx + 1) };
    var idxSp = s.indexOf(" ");
    if (idxSp >= 0) return { family: s.slice(0, idxSp), given: s.slice(idxSp + 1) };
    return { family: s, given: "" };
  }

  function deviceWord(deviceType) {
    if (deviceType === "iPad") return "iPad";
    if (deviceType === "iPhone") return "iPhone";
    return "端末";
  }

  function deviceWordLower(deviceType) {
    var w = deviceWord(deviceType);
    return w === "iPhone" ? "iphone" : w;
  }

  function printVal(raw) {
    var s = String(raw == null ? "" : raw).trim();
    return s || "---";
  }

  function buildAidPrintTierHtml(cells, tierIndex) {
    var tierClass = "aidpr-tier aidpr-tier--cols" + cells.length;
    if (tierIndex === 0) tierClass += " aidpr-tier--lead";
    var cellsHtml = cells
      .map(function (c) {
        return (
          '<div class="aidpr-cell"><div class="aidpr-lab">' +
          esc(c.label) +
          '</div><div class="aidpr-val">' +
          esc(printVal(c.value)) +
          "</div></div>"
        );
      })
      .join("");
    return '<div class="' + tierClass + '">' + cellsHtml + "</div>";
  }

  /** 印刷用: 姓+全角スペース+名（保存値 user_name を正規化表示） */
  function formatUserNameForPrint(name) {
    var names = splitUserName(name);
    if (names.family && names.given) return names.family + "\u3000" + names.given;
    return names.family || names.given || "";
  }

  /**
   * 印刷用日付セル: 交換日あり→端末交換日 / なし→端末登録日（新規）
   * SPEC §8.3: device_exchange_date は買い替え時のみ入力
   */
  function printDeviceDateCell(row) {
    var exchange = String(row.device_exchange_date || "").trim();
    if (exchange) return { label: "端末交換日", value: exchange };
    return { label: "端末登録日", value: row.registered_date };
  }

  function buildAidPrintPageHtml(row) {
    var pw = row.password || FIXED_PASSWORD;
    var lock = row.lock_passcode || FIXED_LOCK;
    var devLower = deviceWordLower(row.device_type);
    var devLabel = deviceWord(row.device_type);
    var notices =
      '<ul class="aidpr-bullets">' +
      "<li>■" +
      esc(devLower) +
      "のロック解除パスワード、Apple ID、iCloudメールアドレスです。</li>" +
      "<li>★重要な情報ですのでご自身で保管管理してください。</li>" +
      "<li>【重要】会社の貸与品ですので指紋認証設定など許可なく行うことは禁止です。</li>" +
      "<li>" +
      esc(devLower) +
      "のパスコードは管理しているので変更しないでください。</li>" +
      "</ul>";
    var bodyInner =
      buildAidPrintTierHtml(
        [
          printDeviceDateCell(row),
          { label: "利用者名", value: formatUserNameForPrint(row.user_name) },
        ],
        0,
      ) +
      buildAidPrintTierHtml(
        [
          { label: "回線番号", value: row.phone_number },
          { label: "iCloudメールアドレス", value: row.apple_id },
          { label: "パスワード", value: pw },
        ],
        1,
      ) +
      buildAidPrintTierHtml(
        [
          { label: "Apple ID", value: row.apple_id },
          { label: "パスワード", value: pw },
          { label: "ロックパス", value: lock },
        ],
        2,
      );
    var metaLine =
      (row.legacy_no ? "管理No. " + esc(row.legacy_no) + " · " : "") +
      esc(new Date().toLocaleString("ja-JP"));
    return (
      '<div class="aidpr-page">' +
      '<header class="aidpr-hero">' +
      "<h1>Apple ID 利用者情報</h1>" +
      "<p>業務携帯アカウント（印刷用）。本紙は機密性の高い内容を含みます。</p>" +
      '<span class="aidpr-badge">' +
      esc(devLabel) +
      "</span></header>" +
      '<aside class="aidpr-notice" role="note"><p>アカウント情報の管理は利用者の責任で行ってください。' +
      "印刷物の紛失・置き忘れ・第三者への提示がないよう、適切に保管してください。</p></aside>" +
      notices +
      '<div class="aidpr-card">' +
      bodyInner +
      "</div>" +
      '<p class="aidpr-foot">' +
      metaLine +
      "</p></div>"
    );
  }

  function aidPrintStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      ":root{--hero-bg:#d1fae5;--hero-fg:#134e4a;--hero-border:#a7f3d0;--hero-sub:#365f52;" +
      "--notice-border:#0d9488;--notice-bg:#d1fae5;--notice-fg:#134e4a;" +
      "--badge-bg:#ecfdf5;--badge-border:#86efac;--badge-fg:#166534;" +
      "--card-border:#bbf7d0;--body-bg:#ecfdf5;" +
      "--tier-lead-bg:#f0fdf4;--tier-lead-border:#dcfce7;--tier-even-bg:#f7fef9;" +
      "--shadow-color:rgba(15,118,110,.12);}" +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:28px 20px 40px;background:var(--body-bg);font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".aidpr-page{max-width:880px;margin:0 auto 32px;}" +
      ".aidpr-hero{background:var(--hero-bg);color:var(--hero-fg);padding:26px 28px 22px;border-radius:18px 18px 0 0;border:1px solid var(--hero-border);border-bottom:none;box-shadow:0 10px 28px var(--shadow-color);}" +
      ".aidpr-hero h1{margin:0;font-size:1.35rem;font-weight:700;}" +
      ".aidpr-hero p{margin:10px 0 0;font-size:12px;line-height:1.65;color:var(--hero-sub);}" +
      ".aidpr-badge{display:inline-block;margin-top:12px;padding:4px 12px;border-radius:999px;background:var(--badge-bg);border:1px solid var(--badge-border);color:var(--badge-fg);font-size:11px;font-weight:700;}" +
      ".aidpr-notice{margin:0;padding:14px 18px 16px;border-left:4px solid var(--notice-border);background:var(--notice-bg);border-bottom:1px solid var(--hero-border);}" +
      ".aidpr-notice p{margin:0;font-size:12px;font-weight:600;line-height:1.7;color:var(--notice-fg);}" +
      ".aidpr-bullets{margin:0;padding:14px 18px 10px 32px;background:#fff;border-left:1px solid var(--hero-border);border-right:1px solid var(--hero-border);font-size:12px;line-height:1.75;color:#334155;}" +
      ".aidpr-bullets li{margin:4px 0;}" +
      ".aidpr-card{background:#fff;border-radius:0 0 18px 18px;box-shadow:0 18px 40px rgba(15,23,42,.08);overflow:hidden;border:1px solid var(--card-border);border-top:none;}" +
      ".aidpr-tier{display:grid;gap:0;border-bottom:1px solid #e2e8f0;}" +
      ".aidpr-tier--cols2{grid-template-columns:1fr 1fr;}" +
      ".aidpr-tier--cols3{grid-template-columns:1fr 1fr 1fr;}" +
      ".aidpr-tier:last-child{border-bottom:none;}" +
      ".aidpr-cell{padding:18px 20px 20px;background:#fff;border-right:1px solid #f1f5f9;min-height:92px;}" +
      ".aidpr-cell:last-child{border-right:none;}" +
      ".aidpr-tier:nth-child(even) .aidpr-cell{background:var(--tier-even-bg);}" +
      ".aidpr-tier--lead .aidpr-cell{background:var(--tier-lead-bg);padding:22px;border-right:1px solid var(--tier-lead-border);min-height:108px;}" +
      ".aidpr-tier--lead .aidpr-lab{font-size:12px;font-weight:700;color:#475569;margin-bottom:10px;}" +
      ".aidpr-tier--lead .aidpr-val{font-size:1.35rem;font-weight:700;line-height:1.45;}" +
      ".aidpr-lab{font-size:10px;font-weight:700;color:#64748b;letter-spacing:.08em;margin-bottom:8px;}" +
      ".aidpr-val{font-size:14px;font-weight:600;line-height:1.55;word-break:break-word;font-feature-settings:'tnum';}" +
      ".aidpr-foot{margin-top:22px;text-align:center;font-size:11px;color:#64748b;}" +
      ".aidpr-page-break{page-break-after:always;height:0;}" +
      "@media print{@page{size:A4 portrait;margin:7mm;}" +
      "body{padding:0;background:var(--body-bg);}" +
      ".aidpr-page{max-width:100%;margin:0;page-break-after:always;}" +
      ".aidpr-page:last-child{page-break-after:auto;}" +
      ".aidpr-hero{padding:12px 16px 10px;border-radius:0;box-shadow:none;}" +
      ".aidpr-hero h1{font-size:16pt;}" +
      ".aidpr-hero p{font-size:9.5pt;}" +
      ".aidpr-badge{font-size:9pt;}" +
      ".aidpr-notice p,.aidpr-bullets{font-size:9.5pt;}" +
      ".aidpr-card{box-shadow:none;border-radius:0;}" +
      ".aidpr-tier{break-inside:avoid;page-break-inside:avoid;}" +
      ".aidpr-cell{padding:12px 16px 14px;min-height:0;}" +
      ".aidpr-tier--lead .aidpr-cell{padding:14px 18px 16px;}" +
      ".aidpr-tier--lead .aidpr-val{font-size:15pt;}" +
      ".aidpr-lab{font-size:10pt;}" +
      ".aidpr-val{font-size:12.5pt;}" +
      ".aidpr-foot{font-size:9.5pt;margin-top:12px;}}"
    );
  }

  function openAidPrintWindow(rows) {
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var pages = rows
      .map(function (r, i) {
        return buildAidPrintPageHtml(r) + (i < rows.length - 1 ? '<div class="aidpr-page-break"></div>' : "");
      })
      .join("");
    var docHtml =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      "<title>Apple ID 利用者情報</title><style>" +
      aidPrintStylesheet() +
      "</style></head><body>" +
      pages +
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
    }, 400);
  }

  function printSelected() {
    var ids = Object.keys(state.selected).filter(function (k) {
      return state.selected[k];
    });
    if (!ids.length) {
      alert("印刷する行にチェックを入れてください");
      return;
    }
    var rows = state.records.filter(function (r) {
      return state.selected[r.id];
    });
    if (rows.some(function (r) { return r.status === STATUS_RETIRED; })) {
      if (!window.confirm("廃止済みの行が含まれます。このまま印刷しますか？")) return;
    }
    openAidPrintWindow(rows);
  }

  function renderTable() {
    var tbody = document.getElementById("aid-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="13">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="13">該当なし</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        var cls = r.status === STATUS_RETIRED ? "retired" : "";
        if (!r.user_name && r.status === STATUS_ACTIVE) cls += " unassigned";
        return (
          '<tr class="' +
          cls +
          '" data-id="' +
          esc(r.id) +
          '">' +
          '<td><input type="checkbox" class="aid-check" data-id="' +
          esc(r.id) +
          '"' +
          (state.selected[r.id] ? " checked" : "") +
          "></td>" +
          "<td>" +
          esc(r.legacy_no) +
          "</td>" +
          "<td>" +
          esc(r.status) +
          "</td>" +
          "<td>" +
          esc(r.registered_date) +
          "</td>" +
          "<td>" +
          esc(r.device_exchange_date) +
          "</td>" +
          "<td>" +
          esc(r.mdm_name) +
          "</td>" +
          '<td class="user-name">' +
          esc(r.user_name) +
          "</td>" +
          "<td>" +
          esc(r.phone_number) +
          "</td>" +
          "<td>" +
          esc(r.apple_id) +
          "</td>" +
          '<td><span class="aid-copy" data-copy="' +
          esc(displayPassword(r)) +
          '" title="クリックでコピー">' +
          esc(displayPassword(r)) +
          "</span></td>" +
          '<td><span class="aid-copy" data-copy="' +
          esc(displayLockPass(r)) +
          '" title="クリックでコピー">' +
          esc(displayLockPass(r)) +
          "</span></td>" +
          "<td>" +
          esc(r.device_type) +
          "</td>" +
          '<td class="aid-actions">' +
          '<button type="button" class="aid-btn-edit">編集</button>' +
          (r.status === STATUS_ACTIVE
            ? '<button type="button" class="aid-btn-retire">廃止</button>'
            : "") +
          '<button type="button" class="aid-btn-del">削除</button>' +
          "</td></tr>"
        );
      })
      .join("");

    tbody.querySelectorAll(".aid-check").forEach(function (cb) {
      cb.addEventListener("change", function () {
        state.selected[cb.getAttribute("data-id")] = cb.checked;
      });
    });
    tbody.querySelectorAll(".aid-copy").forEach(function (el) {
      el.addEventListener("click", function () {
        copyText(el.getAttribute("data-copy") || "");
      });
    });
    tbody.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      var row = state.records.find(function (x) {
        return x.id === id;
      });
      if (!row) return;
      tr.querySelector(".aid-btn-edit").addEventListener("click", function () {
        openEditModal(row);
      });
      var retireBtn = tr.querySelector(".aid-btn-retire");
      if (retireBtn) {
        retireBtn.addEventListener("click", function () {
          openRetireModal(row);
        });
      }
      tr.querySelector(".aid-btn-del").addEventListener("click", function () {
        openDeleteModal(row);
      });
    });
    updateSortHeaders();
  }

  function clearFilters() {
    state.search = "";
    state.filter = "active";
    state.sortKey = null;
    state.sortDir = "desc";
    state.selected = {};
    var search = document.getElementById("aid-search");
    if (search) search.value = "";
    var activeRb = document.querySelector('input[name="aid-filter"][value="active"]');
    if (activeRb) activeRb.checked = true;
    updateSortHeaders();
    renderTable();
  }

  function buildShell() {
    if (document.getElementById("aid-root")) return;
    injectCss();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "aid-root";
    root.className = "aid-root";
    root.innerHTML =
      '<div class="aid-toolbar">' +
      "<strong style=\"font-size:16px\">Apple ID管理台帳</strong>" +
      '<button type="button" id="aid-reload" class="kintoneplugin-button-normal">再読込</button>' +
      '<button type="button" id="aid-print" class="kintoneplugin-button-normal">印刷</button>' +
      "</div>" +
      '<div class="aid-toolbar">' +
      '<label><input type="radio" name="aid-filter" value="active"' +
      (state.filter === "active" ? " checked" : "") +
      "> 利用中</label>" +
      '<label><input type="radio" name="aid-filter" value="all"' +
      (state.filter === "all" ? " checked" : "") +
      "> すべて</label>" +
      '<label><input type="radio" name="aid-filter" value="retired"' +
      (state.filter === "retired" ? " checked" : "") +
      "> 廃止</label>" +
      '<label><input type="radio" name="aid-filter" value="unassigned"' +
      (state.filter === "unassigned" ? " checked" : "") +
      "> 未割当</label>" +
      '<input type="search" id="aid-search" placeholder="Apple ID・氏名・MDM・回線" style="min-width:220px;padding:6px;margin-left:8px">' +
      '<button type="button" id="aid-clear" class="kintoneplugin-button-normal">クリア</button>' +
      "</div>" +
      '<div id="aid-meta" class="aid-meta-bar"></div>' +
      '<div class="aid-table-wrap"><table class="aid-table"><thead><tr>' +
      "<th></th>" +
      SORT_COLUMNS.map(function (c) {
        return (
          '<th class="aid-sort" data-sort="' +
          esc(c.key) +
          '">' +
          esc(c.label) +
          '<span class="aid-sort-ind"></span></th>'
        );
      }).join("") +
      "<th>操作</th>" +
      '</tr></thead><tbody id="aid-tbody"></tbody></table></div>';
    host.appendChild(root);

    var metaBar = document.getElementById("aid-meta");
    if (metaBar) {
      metaBar.addEventListener("click", function (ev) {
        if (ev.target.closest(".aid-next-action")) onNextSlotAction();
      });
    }

    var table = root.querySelector(".aid-table");
    if (table) {
      table.querySelector("thead").addEventListener("click", function (ev) {
        var th = ev.target.closest("th.aid-sort");
        if (!th) return;
        var key = th.getAttribute("data-sort");
        if (key) toggleSort(key);
      });
    }

    document.getElementById("aid-reload").addEventListener("click", function () {
      reloadRecords();
    });
    document.getElementById("aid-print").addEventListener("click", printSelected);
    document.querySelectorAll('input[name="aid-filter"]').forEach(function (rb) {
      rb.addEventListener("change", function () {
        if (rb.checked) {
          state.filter = rb.value;
          renderTable();
        }
      });
    });
    var search = document.getElementById("aid-search");
    search.value = state.search;
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    document.getElementById("aid-clear").addEventListener("click", clearFilters);
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
