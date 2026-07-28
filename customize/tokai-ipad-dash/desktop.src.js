(function () {
  "use strict";

  /** 東海支店 iPad 管理台帳 — DB(769) REST CRUD + 595/674 同期 + A4 印刷 + Excel 出力 */
  var BUILD = "2026-07-28-tokai-ipad-dash-v3-list-intro-date";

  var APP_DB = 769;
  var APP_EMP_MASTER = 595;
  var APP_PC_LEDGER = 674;
  var PAGE_SIZE = 100;

  /** 同期中継エンドポイント (tokai は 595/674 へ直接アクセス不可) */
  var SYNC_RELAY_URL = "http://127.0.0.1:17969";

  var LOCATIONS = ["東海支店", "東京営業所", "静岡営業所", "名古屋営業所", "関西営業所"];

  var STATUS_ACTIVE = "有効";
  var STATUS_DISPOSED = "廃棄";
  var STATUS_VALUES = [STATUS_ACTIVE, STATUS_DISPOSED];

  var FC = {
    location: "location",
    user_name: "user_name",
    device_name: "device_name",
    rental_start_date: "rental_start_date",
    model: "model",
    phone_number: "phone_number",
    imei: "imei",
    iccid: "iccid",
    apple_serial: "apple_serial",
    shared_passcode: "shared_passcode",
    m365_id: "m365_id",
    m365_pw: "m365_pw",
    vpn_id: "vpn_id",
    vpn_pw: "vpn_pw",
    status: "status",
    employee_record_id: "employee_record_id",
    pc_ledger_record_id: "pc_ledger_record_id",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.location,
    FC.user_name,
    FC.device_name,
    FC.rental_start_date,
    FC.model,
    FC.phone_number,
    FC.imei,
    FC.iccid,
    FC.apple_serial,
    FC.shared_passcode,
    FC.m365_id,
    FC.m365_pw,
    FC.vpn_id,
    FC.vpn_pw,
    FC.status,
    FC.employee_record_id,
    FC.pc_ledger_record_id,
  ];

  /** 一覧列（PW 系は列非表示。ユーザー印刷 / Excel には含める） */
  var LIST_COLUMNS = [
    { key: "status", label: "状態" },
    { key: "location", label: "拠点" },
    { key: "user_name", label: "利用者" },
    { key: "device_name", label: "端末名" },
    { key: "phone_number", label: "電話番号" },
    { key: "model", label: "機種" },
    { key: "rental_start_date", label: "導入日" },
    { key: "shared_passcode", label: "共有パスコード" },
    { key: "m365_id", label: "M365 ID" },
    { key: "m365_pw", label: "M365 PW" },
    { key: "vpn_id", label: "VPN ID" },
    { key: "vpn_pw", label: "VPN PW" },
  ];

  /** Excel/印刷は PW も含む — SPEC §9, §14 */
  var EXPORT_COLUMNS = [
    { key: "status", label: "状態" },
    { key: "location", label: "拠点" },
    { key: "user_name", label: "利用者" },
    { key: "device_name", label: "端末名" },
    { key: "rental_start_date", label: "導入日" },
    { key: "model", label: "機種" },
    { key: "phone_number", label: "電話番号" },
    { key: "imei", label: "IMEI" },
    { key: "iccid", label: "ICCID" },
    { key: "apple_serial", label: "Apple シリアル" },
    { key: "shared_passcode", label: "共有パスコード" },
    { key: "m365_id", label: "M365 ID" },
    { key: "m365_pw", label: "M365 PW" },
    { key: "vpn_id", label: "VPN ID" },
    { key: "vpn_pw", label: "VPN PW" },
  ];

  var state = {
    records: [],
    search: "",
    filterLocation: "",
    lifecycleFilter: "active",
    loading: false,
    isEditor: false,
    canDirectMaster: false,
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
      location: val(rec, FC.location),
      user_name: val(rec, FC.user_name),
      device_name: val(rec, FC.device_name),
      rental_start_date: val(rec, FC.rental_start_date),
      model: val(rec, FC.model),
      phone_number: val(rec, FC.phone_number),
      imei: val(rec, FC.imei),
      iccid: val(rec, FC.iccid),
      apple_serial: val(rec, FC.apple_serial),
      shared_passcode: val(rec, FC.shared_passcode),
      m365_id: val(rec, FC.m365_id),
      m365_pw: val(rec, FC.m365_pw),
      vpn_id: val(rec, FC.vpn_id),
      vpn_pw: val(rec, FC.vpn_pw),
      status: val(rec, FC.status) || STATUS_ACTIVE,
      employee_record_id: val(rec, FC.employee_record_id),
      pc_ledger_record_id: val(rec, FC.pc_ledger_record_id),
    };
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

  function loginUserCode() {
    try {
      var u = kintone.getLoginUser && kintone.getLoginUser();
      return u && u.code ? String(u.code) : "";
    } catch (e) {
      console.warn(BUILD, e);
      return "";
    }
  }

  /** tokai + admin + システム管理者は編集可 */
  function canEdit() {
    if (isSystemAdmin()) return true;
    var code = loginUserCode();
    return code === "tokai" || code === "admin";
  }

  /** admin/システム管理者は 595/674 に kintone.api で直接アクセス可（tokai は不可） */
  function canDirectMasterAccess() {
    if (isSystemAdmin()) return true;
    return loginUserCode() === "admin";
  }

  function toKintoneRecord(row, opts) {
    opts = opts || {};
    var includeSyncFields = opts.includeSyncFields !== false;
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
      else {
        o[code] = { value: "" };
      }
    }
    set(FC.location, row.location);
    set(FC.user_name, row.user_name);
    set(FC.device_name, row.device_name);
    set(FC.rental_start_date, row.rental_start_date);
    set(FC.model, row.model);
    set(FC.phone_number, row.phone_number);
    set(FC.imei, row.imei);
    set(FC.iccid, row.iccid);
    set(FC.apple_serial, row.apple_serial);
    set(FC.shared_passcode, row.shared_passcode);
    set(FC.status, row.status || STATUS_ACTIVE);
    if (includeSyncFields) {
      set(FC.m365_id, row.m365_id);
      set(FC.m365_pw, row.m365_pw);
      set(FC.vpn_id, row.vpn_id);
      set(FC.vpn_pw, row.vpn_pw);
      if (row.employee_record_id != null && row.employee_record_id !== "") {
        o[FC.employee_record_id] = { value: String(row.employee_record_id) };
      } else {
        o[FC.employee_record_id] = { value: "" };
      }
      if (row.pc_ledger_record_id != null && row.pc_ledger_record_id !== "") {
        o[FC.pc_ledger_record_id] = { value: String(row.pc_ledger_record_id) };
      } else {
        o[FC.pc_ledger_record_id] = { value: "" };
      }
    }
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

  function formatKintoneApiError(e) {
    if (!e) return "不明なエラー";
    if (e.errors && typeof e.errors === "object") {
      var parts = [];
      Object.keys(e.errors).forEach(function (k) {
        var msg = e.errors[k] && e.errors[k].messages ? e.errors[k].messages.join(" / ") : "";
        parts.push(k + ": " + msg);
      });
      if (parts.length) return parts.join("; ");
    }
    return e.message || String(e);
  }

  function escapeQueryValue(s) {
    return String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
  }

  function fetchAllRecords() {
    var all = [];
    var offset = 0;
    function page() {
      var query =
        "order by location asc, device_name asc limit " + PAGE_SIZE + " offset " + offset;
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

  function parseTokaiSeq(name) {
    var m = /^tokai(\d+)$/i.exec(String(name || "").trim());
    return m ? Number(m[1]) : null;
  }

  /** 廃棄含む全端末名の max seq + 1 (padding は最大 2 桁 or 既存に合わせる) */
  function nextTokaiDeviceName(records) {
    var max = 0;
    var pad = 2;
    records.forEach(function (r) {
      var m = /^tokai(\d+)$/i.exec(String(r.device_name || "").trim());
      if (m) {
        var n = Number(m[1]);
        if (n > max) max = n;
        if (m[1].length > pad) pad = m[1].length;
      }
    });
    var next = max + 1;
    var str = String(next);
    while (str.length < pad) str = "0" + str;
    return "tokai" + str;
  }

  function checkDuplicates(row, excludeId) {
    var device = String(row.device_name || "").trim();
    for (var i = 0; i < state.records.length; i++) {
      var r = state.records[i];
      if (excludeId && r.id === excludeId) continue;
      if (device && String(r.device_name || "").trim() === device) {
        throw new Error("端末名「" + device + "」は既に登録されています");
      }
    }
  }

  function validateRow(row) {
    if (!String(row.location || "").trim()) throw new Error("拠点は必須です");
    if (!String(row.user_name || "").trim()) throw new Error("利用者は必須です");
    if (!String(row.device_name || "").trim()) throw new Error("端末名は必須です");
    if (!String(row.status || "").trim()) throw new Error("ステータスは必須です");
    if (LOCATIONS.indexOf(row.location) < 0) throw new Error("拠点が不正です");
    if (STATUS_VALUES.indexOf(row.status) < 0) throw new Error("ステータスが不正です");
  }

  /**
   * 保存時同期: 674 から M365/VPN を取得。
   * MULTI_HIT → 保存中止（浜田相談）。
   * NO_HIT → 確認ダイアログ後、空のまま保存可（PC未所持者あり）。
   */
  function syncCredentialsFromPcLedger(userName) {
    var name = String(userName || "").trim();
    if (!name) {
      return Promise.reject(new Error("利用者が未設定のため 674 同期できません"));
    }
    if (state.canDirectMaster) {
      var q =
        'user_name = "' +
        escapeQueryValue(name) +
        '" order by $id asc limit 20';
      return apiGet("/k/v1/records.json", {
        app: APP_PC_LEDGER,
        query: q,
        fields: ["$id", "user_name", "pc_status", "pc_name", "m365_id", "m365_pw", "vpn_id", "vpn_pw"],
      }).then(function (resp) {
        var rows = resp.records || [];
        return interpretCredentialHits(name, rows);
      });
    }
    return relayPost("/tokai-ipad/sync-credentials", { user_name: name }).then(function (r) {
      if (!r || !r.ok) {
        var code = r && r.code ? r.code : "UNKNOWN";
        if (code === "NO_HIT") {
          return interpretCredentialHits(name, []);
        }
        var msg = r && r.message ? r.message : "同期エラー";
        var err = new Error("674 同期失敗: " + msg + "（" + code + "）");
        err.syncCode = code;
        throw err;
      }
      return {
        m365_id: String(r.m365_id || ""),
        m365_pw: String(r.m365_pw || ""),
        vpn_id: String(r.vpn_id || ""),
        vpn_pw: String(r.vpn_pw || ""),
        pc_ledger_record_id: String(r.pc_ledger_record_id || ""),
      };
    });
  }

  function emptyCredentials() {
    return {
      m365_id: "",
      m365_pw: "",
      vpn_id: "",
      vpn_pw: "",
      pc_ledger_record_id: "",
      syncWarning: "NO_HIT",
    };
  }

  /** 674 pc_status: 廃棄/取消は除外。利用中があれば優先。残り1件のみ自動採用。 */
  function resolvePcLedgerHits(name, rows) {
    var list = rows || [];
    var discardedInactive = 0;
    var active = [];
    var i;
    for (i = 0; i < list.length; i++) {
      var st = val(list[i], "pc_status");
      if (st === "廃棄" || st === "取消") {
        discardedInactive += 1;
        continue;
      }
      active.push(list[i]);
    }
    if (!active.length) {
      return { code: "NO_HIT", discardedInactive: discardedInactive };
    }
    var inUse = [];
    for (i = 0; i < active.length; i++) {
      if (val(active[i], "pc_status") === "利用中") inUse.push(active[i]);
    }
    var preferred = inUse.length ? inUse : active;
    if (preferred.length === 1) {
      return { code: "OK", record: preferred[0], discardedInactive: discardedInactive };
    }
    return { code: "MULTI_HIT", candidates: preferred, discardedInactive: discardedInactive };
  }

  function interpretCredentialHits(name, rows) {
    var resolved = resolvePcLedgerHits(name, rows);
    if (resolved.code === "NO_HIT") {
      if (
        !window.confirm(
          '674(PC台帳) に「' +
            name +
            '」の稼働候補がありません' +
            (resolved.discardedInactive
              ? "（廃棄/取消 " + resolved.discardedInactive + " 件除外）"
              : "") +
            "。\nM365/VPN を空のまま保存しますか？\n（氏名の表記ゆれの場合はキャンセルして修正してください）",
        )
      ) {
        var err0 = new Error("674 同期をキャンセルしました（ヒットなし）");
        err0.syncCode = "NO_HIT_CANCEL";
        throw err0;
      }
      return emptyCredentials();
    }
    if (resolved.code === "MULTI_HIT") {
      var errM = new Error(
        '674(PC台帳) に「' +
          name +
          '」の稼働候補が複数（' +
          resolved.candidates.length +
          ' 件）あります。同姓同名や複数PCは浜田に事前相談してください（自動採用しません）。',
      );
      errM.syncCode = "MULTI_HIT";
      throw errM;
    }
    var r = resolved.record;
    return {
      m365_id: val(r, "m365_id"),
      m365_pw: val(r, "m365_pw"),
      vpn_id: val(r, "vpn_id"),
      vpn_pw: val(r, "vpn_pw"),
      pc_ledger_record_id: val(r, "$id"),
    };
  }

  function relayPost(pathName, body) {
    return fetch(SYNC_RELAY_URL + pathName, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    }).then(function (res) {
      return res.text().then(function (txt) {
        var json;
        try {
          json = txt ? JSON.parse(txt) : {};
        } catch (e) {
          json = { ok: false, code: "BAD_JSON", message: txt.slice(0, 200) };
        }
        if (!res.ok && json && json.ok !== true) {
          if (!json.code) json.code = "HTTP_" + res.status;
          if (!json.message) json.message = "HTTP " + res.status;
        }
        return json;
      });
    });
  }

  /** 595 検索: admin→直接 / tokai→relay */
  function searchEmployees595(keyword, limit) {
    var k = String(keyword || "").trim();
    if (!k) return Promise.resolve([]);
    var lim = Math.min(Math.max(Number(limit) || 15, 1), 30);
    if (state.canDirectMaster) {
      var q =
        'user_name like "' +
        escapeQueryValue(k) +
        '" and employment_status not in ("退職") order by user_name asc limit ' +
        lim;
      return apiGet("/k/v1/records.json", {
        app: APP_EMP_MASTER,
        query: q,
        fields: ["$id", "user_name", "dept_name", "group_name", "employment_status", "mail"],
      }).then(function (resp) {
        return (resp.records || []).map(function (r) {
          return {
            record_id: val(r, "$id"),
            user_name: val(r, "user_name"),
            dept_name: val(r, "dept_name"),
            group_name: val(r, "group_name"),
            mail: val(r, "mail"),
          };
        });
      });
    }
    return relayPost("/tokai-ipad/search-employees", { keyword: k, limit: lim }).then(function (
      resp,
    ) {
      if (!resp || !resp.ok) {
        var msg = resp && resp.message ? resp.message : "中継エラー";
        throw new Error("595 検索失敗: " + msg);
      }
      return Array.isArray(resp.records) ? resp.records : [];
    });
  }

  /** 検索結果の dept_name / group_name が拠点マスタに一致するかを判定 */
  function locationFromEmployee(emp) {
    var dept = String(emp.dept_name || "").trim();
    var grp = String(emp.group_name || "").trim();
    for (var i = 0; i < LOCATIONS.length; i++) {
      if (dept === LOCATIONS[i] || grp === LOCATIONS[i]) return LOCATIONS[i];
    }
    return "";
  }

  function injectCss() {
    if (document.getElementById("tip-dash-css")) return;
    var st = document.createElement("style");
    st.id = "tip-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".tip-root{font-family:Segoe UI,Meiryo,sans-serif;font-size:15px;padding:8px 12px 24px;max-width:100%;}" +
      ".tip-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px;}" +
      ".tip-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-bottom:12px;padding:18px 22px;" +
      "background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%);border:2px solid #f59e0b;border-radius:12px;" +
      "box-shadow:0 2px 8px rgba(245,158,11,.15);}" +
      ".tip-meta-count{font-size:15px;color:#475569;font-weight:500;white-space:nowrap;}" +
      ".tip-next-slot{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 18px;flex:1;min-width:280px;}" +
      ".tip-next-label{font-size:15px;font-weight:700;color:#b45309;}" +
      ".tip-next-id{font-size:1.55rem;font-weight:700;font-family:Consolas,Monaco,monospace;color:#7c2d12;}" +
      ".tip-meta-actions{margin-left:auto;display:flex;flex-wrap:wrap;gap:8px;align-items:center;}" +
      ".tip-readonly-msg{font-size:14px;color:#64748b;margin-left:auto;}" +
      ".tip-filters{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:8px;}" +
      ".tip-filters input,.tip-filters select{padding:8px 10px;font-size:15px;}" +
      ".tip-filter-clear{white-space:nowrap;}" +
      ".tip-lifecycle-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;}" +
      ".tip-lifecycle-label{font-size:14px;font-weight:600;color:#475569;}" +
      ".tip-lifecycle-btn{padding:8px 18px;font-size:15px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;}" +
      ".tip-lifecycle-btn.active{background:#ea580c;color:#fff;border-color:#ea580c;font-weight:700;}" +
      ".tip-lifecycle-btn:hover:not(.active){background:#fff7ed;}" +
      ".tip-table-wrap{overflow:auto;max-height:calc(100vh - 300px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".tip-table{border-collapse:collapse;width:100%;font-size:14px;min-width:1680px;}" +
      ".tip-table th,.tip-table td{border:1px solid #e2e8f0;padding:6px 8px;vertical-align:middle;line-height:1.45;}" +
      ".tip-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;font-size:14px;}" +
      ".tip-none{color:#64748b;font-style:italic;}" +
      ".tip-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;}" +
      ".tip-badge-active{background:#dcfce7;color:#166534;}" +
      ".tip-badge-disposed{background:#fee2e2;color:#991b1b;}" +
      ".tip-actions button{margin:0 3px;padding:4px 10px;font-size:13px;}" +
      ".tip-hint{font-size:13px;color:#64748b;margin:6px 0;line-height:1.5;}" +
      ".tip-warn{font-size:13px;color:#b45309;margin:4px 0 8px;}" +
      ".tip-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".tip-modal{background:#fff;border-radius:8px;padding:18px 20px;max-width:640px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);font-size:15px;}" +
      ".tip-modal h3{margin:0 0 14px;font-size:18px;}" +
      ".tip-modal label{display:block;margin:10px 0;font-size:15px;}" +
      ".tip-modal input,.tip-modal select,.tip-modal textarea{width:100%;box-sizing:border-box;padding:8px;font-size:15px;margin-top:4px;}" +
      ".tip-modal input[readonly],.tip-modal input.tip-readonly{background:#f1f5f9;color:#475569;cursor:not-allowed;}" +
      ".tip-modal-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      ".tip-modal-danger{margin-right:auto;color:#b91c1c;}" +
      ".tip-user-row{display:flex;gap:8px;align-items:center;}" +
      ".tip-user-row input{flex:1;}" +
      ".tip-user-row button{white-space:nowrap;}" +
      ".tip-sync-section{margin:10px 0;padding:10px 12px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;}" +
      ".tip-sync-section h4{margin:0 0 6px;font-size:14px;color:#475569;}" +
      ".tip-sync-section .tip-hint{margin:0 0 6px;}" +
      ".tip-595-modal{max-width:720px;}" +
      ".tip-595-results{margin-top:10px;max-height:280px;overflow:auto;display:flex;flex-direction:column;gap:6px;}" +
      ".tip-595-pick{text-align:left;white-space:normal;padding:8px 10px;}" +
      ".tip-595-actions{display:flex;gap:8px;margin:8px 0;flex-wrap:wrap;}" +
      ".tip-summary-acc{margin-bottom:14px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;}" +
      ".tip-summary-acc>summary{cursor:pointer;padding:12px 16px;font-size:15px;font-weight:700;color:#334155;user-select:none;}" +
      ".tip-summary-acc[open]>summary{border-bottom:1px solid #e2e8f0;}" +
      ".tip-summary-wrap{overflow:auto;}" +
      ".tip-summary{border-collapse:collapse;width:100%;font-size:14px;min-width:420px;}" +
      ".tip-summary th,.tip-summary td{border:1px solid #e2e8f0;padding:8px 12px;text-align:center;}" +
      ".tip-summary th{background:#f1f5f9;}" +
      ".tip-summary td.tip-loc{text-align:left;font-weight:600;white-space:nowrap;}" +
      ".tip-summary tr.tip-summary-total td{font-weight:700;background:#fff7ed;}" +
      ".tip-summary .tip-n-active{font-weight:700;color:#166534;font-size:16px;}" +
      ".tip-summary-hint{margin:0;padding:8px 16px 12px;font-size:13px;color:#64748b;line-height:1.45;}" +
      ".tip-summary tr.tip-summary-clickable{cursor:pointer;}" +
      ".tip-summary tr.tip-summary-clickable:hover td{background:#ffedd5;}";
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

  function compareRows(a, b) {
    var la = LOCATIONS.indexOf(a.location);
    var lb = LOCATIONS.indexOf(b.location);
    if (la < 0) la = 999;
    if (lb < 0) lb = 999;
    if (la !== lb) return la - lb;
    var sa = parseTokaiSeq(a.device_name);
    var sb = parseTokaiSeq(b.device_name);
    if (sa != null && sb != null && sa !== sb) return sa - sb;
    return String(a.device_name || "").localeCompare(String(b.device_name || ""), "ja");
  }

  function normalizeSearchText(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\u3000/g, " ")
      .replace(/\s+/g, " ");
  }

  function filteredRecords() {
    var q = normalizeSearchText(state.search);
    var tokens = q ? q.split(" ").filter(function (t) { return t.length > 0; }) : [];
    var rows = state.records.filter(function (r) {
      if (state.lifecycleFilter === "active" && r.status === STATUS_DISPOSED) return false;
      if (state.lifecycleFilter === "disposed" && r.status !== STATUS_DISPOSED) return false;
      if (state.filterLocation && r.location !== state.filterLocation) return false;
      if (!tokens.length) return true;
      var hay = normalizeSearchText(
        [
          r.device_name,
          r.user_name,
          r.location,
          r.phone_number,
          r.model,
          r.imei,
          r.iccid,
          r.apple_serial,
          r.m365_id,
          r.vpn_id,
        ].join(" "),
      );
      return tokens.every(function (t) { return hay.indexOf(t) >= 0; });
    });
    rows.sort(compareRows);
    return rows;
  }

  function setLifecycleFilter(mode) {
    if (mode !== "active" && mode !== "disposed") return;
    if (state.lifecycleFilter === mode) return;
    state.lifecycleFilter = mode;
    var root = document.getElementById("tip-root");
    if (root) {
      root.querySelectorAll(".tip-lifecycle-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-lifecycle") === mode);
      });
    }
    renderTable();
  }

  function clearFilters() {
    state.search = "";
    state.filterLocation = "";
    state.lifecycleFilter = "active";
    var search = document.getElementById("tip-search");
    var locSel = document.getElementById("tip-filter-location");
    if (search) search.value = "";
    if (locSel) locSel.value = "";
    var root = document.getElementById("tip-root");
    if (root) {
      root.querySelectorAll(".tip-lifecycle-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-lifecycle") === "active");
      });
    }
    renderTable();
  }

  function closeModal(id) {
    var el = document.getElementById(id || "tip-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons, opts) {
    opts = opts || {};
    var rootId = opts.rootId || "tip-modal-root";
    var extraClass = opts.extraClass || "";
    closeModal(rootId);
    var bg = document.createElement("div");
    bg.id = rootId;
    bg.className = "tip-modal-bg";
    var box = document.createElement("div");
    box.className = "tip-modal " + extraClass;
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "tip-modal-actions";
    buttons.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      if (b.danger) btn.className = "tip-modal-danger kintoneplugin-button-normal";
      else btn.className = b.primary ? "kintoneplugin-button-dialog-ok" : "kintoneplugin-button-normal";
      btn.addEventListener("click", function () {
        if (b.onClick) b.onClick(function () { closeModal(rootId); });
        else closeModal(rootId);
      });
      actions.appendChild(btn);
    });
    box.appendChild(actions);
    bg.appendChild(box);
    bg.addEventListener("click", function (ev) {
      if (ev.target === bg) closeModal(rootId);
    });
    document.body.appendChild(bg);
    return box;
  }

  function locationOptionsHtml(selected) {
    return (
      '<option value="">—</option>' +
      LOCATIONS.map(function (l) {
        return (
          '<option value="' +
          esc(l) +
          '"' +
          (selected === l ? " selected" : "") +
          ">" +
          esc(l) +
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

  function formFieldsHtml(row) {
    var r = row || {};
    return (
      '<form id="tip-form" autocomplete="off">' +
      '<label>拠点<select id="tip-f-location">' +
      locationOptionsHtml(r.location) +
      "</select></label>" +
      '<label>利用者<div class="tip-user-row">' +
      '<input type="text" id="tip-f-user-name" value="' +
      esc(r.user_name || "") +
      '" autocomplete="off">' +
      '<button type="button" id="tip-f-user-search" class="kintoneplugin-button-normal">595 検索</button>' +
      "</div></label>" +
      '<input type="hidden" id="tip-f-employee-record-id" value="' +
      esc(r.employee_record_id || "") +
      '">' +
      '<label>端末名<input type="text" id="tip-f-device" value="' +
      esc(r.device_name || "") +
      '" readonly class="tip-readonly"></label>' +
      '<label>導入日<input type="date" id="tip-f-rental-start" value="' +
      esc(r.rental_start_date || "") +
      '"></label>' +
      '<label>機種<input type="text" id="tip-f-model" value="' +
      esc(r.model || "") +
      '"></label>' +
      '<label>端末認識電話番号<input type="text" id="tip-f-phone" value="' +
      esc(r.phone_number || "") +
      '"></label>' +
      '<label>IMEI<input type="text" id="tip-f-imei" value="' +
      esc(r.imei || "") +
      '"></label>' +
      '<label>ICCID<input type="text" id="tip-f-iccid" value="' +
      esc(r.iccid || "") +
      '"></label>' +
      '<label>Apple シリアル番号<input type="text" id="tip-f-apple-serial" value="' +
      esc(r.apple_serial || "") +
      '"></label>' +
      '<label>共有パスコード<input type="text" id="tip-f-shared-passcode" value="' +
      esc(r.shared_passcode || "") +
      '" autocomplete="off"></label>' +
      '<label>ステータス<select id="tip-f-status">' +
      statusOptionsHtml(r.status || STATUS_ACTIVE) +
      "</select></label>" +
      '<section class="tip-sync-section">' +
      '<h4>M365 / VPN（保存時に PC 台帳 674 から同期・手入力不可）</h4>' +
      '<p class="tip-hint">利用者名で 674 を検索します。0 件／複数件ヒットは保存できません（浜田相談）。</p>' +
      '<label>M365 ID<input type="text" id="tip-f-m365-id" value="' +
      esc(r.m365_id || "") +
      '" readonly class="tip-readonly"></label>' +
      '<label>M365 PW<input type="text" id="tip-f-m365-pw" value="' +
      esc(r.m365_pw || "") +
      '" readonly class="tip-readonly"></label>' +
      '<label>VPN ID<input type="text" id="tip-f-vpn-id" value="' +
      esc(r.vpn_id || "") +
      '" readonly class="tip-readonly"></label>' +
      '<label>VPN PW<input type="text" id="tip-f-vpn-pw" value="' +
      esc(r.vpn_pw || "") +
      '" readonly class="tip-readonly"></label>' +
      "</section>" +
      "</form>"
    );
  }

  function readFormRow(existing) {
    var isNew = !existing || !existing.id;
    var row = {
      location: document.getElementById("tip-f-location").value.trim(),
      user_name: document.getElementById("tip-f-user-name").value.trim(),
      device_name: document.getElementById("tip-f-device").value.trim(),
      rental_start_date: document.getElementById("tip-f-rental-start").value.trim(),
      model: document.getElementById("tip-f-model").value.trim(),
      phone_number: document.getElementById("tip-f-phone").value.trim(),
      imei: document.getElementById("tip-f-imei").value.trim(),
      iccid: document.getElementById("tip-f-iccid").value.trim(),
      apple_serial: document.getElementById("tip-f-apple-serial").value.trim(),
      shared_passcode: document.getElementById("tip-f-shared-passcode").value.trim(),
      status: document.getElementById("tip-f-status").value.trim(),
      employee_record_id: document.getElementById("tip-f-employee-record-id").value.trim(),
      m365_id: document.getElementById("tip-f-m365-id").value.trim(),
      m365_pw: document.getElementById("tip-f-m365-pw").value.trim(),
      vpn_id: document.getElementById("tip-f-vpn-id").value.trim(),
      vpn_pw: document.getElementById("tip-f-vpn-pw").value.trim(),
    };
    if (!isNew) {
      row.id = existing.id;
      row.revision = existing.revision;
      row.pc_ledger_record_id = existing.pc_ledger_record_id || "";
    } else {
      row.pc_ledger_record_id = "";
    }
    validateRow(row);
    checkDuplicates(row, isNew ? null : row.id);
    return row;
  }

  function apply595PickToForm(emp) {
    var nameEl = document.getElementById("tip-f-user-name");
    var empIdEl = document.getElementById("tip-f-employee-record-id");
    var locEl = document.getElementById("tip-f-location");
    if (!nameEl || !empIdEl) return;
    nameEl.value = String(emp.user_name || "").trim();
    empIdEl.value = String(emp.record_id || "").trim();
    var loc = locationFromEmployee(emp);
    if (loc && locEl) locEl.value = loc;
  }

  function open595SearchModal(onPick) {
    if (!canEdit()) return;
    var body =
      '<label>検索キーワード（氏名の一部）<input type="search" id="tip-595-q" placeholder="氏名の一部"></label>' +
      '<div class="tip-595-actions">' +
      '<button type="button" id="tip-595-run" class="kintoneplugin-button-dialog-ok">検索</button>' +
      '<button type="button" id="tip-595-clear" class="kintoneplugin-button-normal">クリア</button>' +
      "</div>" +
      '<div id="tip-595-results" class="tip-595-results"></div>';
    openModal("社員名検索（595）", body, [{ label: "閉じる" }], {
      rootId: "tip-595-modal-root",
      extraClass: "tip-595-modal",
    });
    var qEl = document.getElementById("tip-595-q");
    var box = document.getElementById("tip-595-results");
    function renderResults(rows) {
      if (!rows.length) {
        box.innerHTML = '<p class="tip-hint">該当なし</p>';
        return;
      }
      box.innerHTML = rows
        .map(function (r, i) {
          var name = String(r.user_name || "").trim();
          var grp = String(r.group_name || "").trim();
          var dept = String(r.dept_name || "").trim();
          var mail = String(r.mail || "").trim();
          return (
            '<button type="button" class="tip-595-pick kintoneplugin-button-normal" data-i="' +
            i +
            '">' +
            esc(name || "—") +
            " ／ " +
            esc(grp || "—") +
            " ／ " +
            esc(dept || "—") +
            (mail ? " ／ " + esc(mail) : "") +
            "</button>"
          );
        })
        .join("");
      box.querySelectorAll(".tip-595-pick").forEach(function (btn) {
        btn.onclick = function () {
          var idx = Number(btn.getAttribute("data-i"));
          if (rows[idx]) {
            onPick(rows[idx]);
            closeModal("tip-595-modal-root");
          }
        };
      });
    }
    function runSearch() {
      var kw = qEl.value.trim();
      if (!kw) {
        alert("検索キーワードを入力してください");
        return;
      }
      box.innerHTML = '<p class="tip-hint">検索中…</p>';
      searchEmployees595(kw, 25)
        .then(renderResults)
        .catch(function (e) {
          box.innerHTML = '<p class="tip-warn">' + esc(e.message || String(e)) + "</p>";
        });
    }
    document.getElementById("tip-595-run").onclick = runSearch;
    document.getElementById("tip-595-clear").onclick = function () {
      qEl.value = "";
      box.innerHTML = "";
      qEl.focus();
    };
    qEl.onkeydown = function (e) {
      if (e.key === "Enter") runSearch();
    };
    setTimeout(function () { qEl.focus(); }, 0);
  }

  function saveEditModal(row, isCreate, close) {
    var updated;
    try {
      updated = readFormRow(isCreate ? null : row);
    } catch (e) {
      alert(e.message || e);
      return;
    }
    // 保存前に 674 同期を実行（利用者名基準）。エラー時は保存中止。
    syncCredentialsFromPcLedger(updated.user_name)
      .then(function (cred) {
        updated.m365_id = cred.m365_id;
        updated.m365_pw = cred.m365_pw;
        updated.vpn_id = cred.vpn_id;
        updated.vpn_pw = cred.vpn_pw;
        updated.pc_ledger_record_id = cred.pc_ledger_record_id || updated.pc_ledger_record_id || "";
        var save = isCreate
          ? apiPost("/k/v1/record.json", {
              app: APP_DB,
              record: toKintoneRecord(updated, { includeSyncFields: true }),
            })
          : apiPut("/k/v1/record.json", {
              app: APP_DB,
              id: Number(updated.id),
              revision: Number(updated.revision),
              record: toKintoneRecord(updated, { includeSyncFields: true }),
            });
        return save;
      })
      .then(function () {
        close();
        return reloadRecords();
      })
      .then(function () {
        alert(isCreate ? "登録しました" : "保存しました");
      })
      .catch(function (e) {
        var msg = e && e.message ? e.message : formatKintoneApiError(e);
        alert("保存失敗: " + msg);
      });
  }

  function openEditModal(row, opts) {
    if (!canEdit()) return;
    opts = opts || {};
    var isCreate = !!opts.createMode;
    var buttons = [
      { label: "キャンセル" },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          saveEditModal(row, isCreate, close);
        },
      },
    ];
    if (row && row.id && !isCreate && row.status !== STATUS_DISPOSED) {
      buttons.unshift({
        label: "廃棄にする",
        danger: true,
        onClick: function () {
          disposeRecord(row);
        },
      });
    } else if (row && row.id && !isCreate && row.status === STATUS_DISPOSED) {
      buttons.unshift({
        label: "有効に戻す",
        onClick: function () {
          revertDispose(row);
        },
      });
    }
    var title = isCreate ? "新規端末を登録 — " + (row.device_name || "") : "編集 — " + (row.device_name || "");
    openModal(title, formFieldsHtml(row), buttons, { rootId: "tip-modal-root" });
    var searchBtn = document.getElementById("tip-f-user-search");
    if (searchBtn) {
      searchBtn.onclick = function () {
        open595SearchModal(apply595PickToForm);
      };
    }
  }

  function createNewDevice() {
    if (!canEdit()) return;
    var deviceName = nextTokaiDeviceName(state.records);
    if (!window.confirm("次の端末「" + deviceName + "」を新規作成します。よろしいですか？")) return;
    var draft = {
      device_name: deviceName,
      status: STATUS_ACTIVE,
      location: "",
      user_name: "",
    };
    // Draft POST 前に user_name 必須なので、ドラフト作成せず先に編集モーダルを開いて必須入力させる方式に変更。
    // ただし SPEC は「新規: 次 tokaiNN 表示＋作成」なので、端末名だけ確定した空レコードを画面上に持たせる。
    openEditModal(draft, { createMode: true });
  }

  function disposeRecord(row) {
    if (!canEdit() || !row || !row.id) return;
    if (row.status === STATUS_DISPOSED) return;
    var msg =
      "端末: " +
      (row.device_name || "") +
      "\n利用者: " +
      (row.user_name || "—") +
      "\n\nこの端末を「廃棄」に切り替えます（レコードは残す・端末名は欠番）。よろしいですか？";
    if (!window.confirm(msg)) return;
    apiPut("/k/v1/record.json", {
      app: APP_DB,
      id: Number(row.id),
      revision: Number(row.revision),
      record: { status: { value: STATUS_DISPOSED } },
    })
      .then(function () {
        closeModal();
        return reloadRecords();
      })
      .then(function () {
        alert("廃棄に切り替えました");
      })
      .catch(function (e) {
        alert("廃棄失敗: " + formatKintoneApiError(e));
      });
  }

  function revertDispose(row) {
    if (!canEdit() || !row || !row.id) return;
    if (row.status !== STATUS_DISPOSED) return;
    var msg =
      "端末: " +
      (row.device_name || "") +
      "\n\nこの端末を「有効」に戻します。よろしいですか？";
    if (!window.confirm(msg)) return;
    apiPut("/k/v1/record.json", {
      app: APP_DB,
      id: Number(row.id),
      revision: Number(row.revision),
      record: { status: { value: STATUS_ACTIVE } },
    })
      .then(function () {
        closeModal();
        return reloadRecords();
      })
      .then(function () {
        alert("有効に戻しました");
      })
      .catch(function (e) {
        alert("復帰失敗: " + formatKintoneApiError(e));
      });
  }

  function cellText(text) {
    var t = String(text || "").trim();
    if (!t) return '<span class="tip-none">—</span>';
    return esc(t);
  }

  function statusBadge(status) {
    if (status === STATUS_DISPOSED) {
      return '<span class="tip-badge tip-badge-disposed">' + esc(STATUS_DISPOSED) + "</span>";
    }
    return '<span class="tip-badge tip-badge-active">' + esc(STATUS_ACTIVE) + "</span>";
  }

  function renderTable() {
    var tbody = document.getElementById("tip-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="' + (LIST_COLUMNS.length + 1) + '">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="' + (LIST_COLUMNS.length + 1) + '">該当なし</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (row) {
        var cells = LIST_COLUMNS.map(function (col) {
          if (col.key === "status") return "<td>" + statusBadge(row.status) + "</td>";
          return "<td>" + cellText(row[col.key]) + "</td>";
        }).join("");
        var actionBtns;
        if (state.isEditor) {
          actionBtns =
            '<button type="button" class="tip-btn-edit">修正</button>' +
            '<button type="button" class="tip-btn-user-print">ユーザー印刷</button>' +
            '<button type="button" class="tip-btn-user-xlsx">ユーザーExcel</button>';
          if (row.status !== STATUS_DISPOSED) {
            actionBtns += '<button type="button" class="tip-btn-dispose">廃棄</button>';
          } else {
            actionBtns += '<button type="button" class="tip-btn-revert">有効化</button>';
          }
        } else {
          actionBtns = '<button type="button" class="tip-btn-user-print">ユーザー印刷</button>';
        }
        return "<tr>" + cells + '<td class="tip-actions">' + actionBtns + "</td></tr>";
      })
      .join("");

    rows.forEach(function (row, idx) {
      var tr = tbody.rows[idx];
      if (!tr) return;
      var editB = tr.querySelector(".tip-btn-edit");
      if (editB) editB.addEventListener("click", function () { openEditModal(row); });
      var printB = tr.querySelector(".tip-btn-user-print");
      if (printB) printB.addEventListener("click", function () { openUserPrintWindow(row); });
      var uxB = tr.querySelector(".tip-btn-user-xlsx");
      if (uxB) uxB.addEventListener("click", function () { exportUserXlsx(row); });
      var disB = tr.querySelector(".tip-btn-dispose");
      if (disB) disB.addEventListener("click", function () { disposeRecord(row); });
      var revB = tr.querySelector(".tip-btn-revert");
      if (revB) revB.addEventListener("click", function () { revertDispose(row); });
    });
  }

  function buildSummaryCounts() {
    var grid = {};
    LOCATIONS.forEach(function (loc) {
      grid[loc] = { active: 0, disposed: 0 };
    });
    var unknown = { active: 0, disposed: 0 };
    state.records.forEach(function (r) {
      var loc = String(r.location || "").trim();
      var bucket = grid[loc] || unknown;
      if (r.status === STATUS_DISPOSED) bucket.disposed += 1;
      else bucket.active += 1;
    });
    return { grid: grid, unknown: unknown };
  }

  function renderSummary() {
    var el = document.getElementById("tip-summary-tbody");
    if (!el) return;
    var built = buildSummaryCounts();
    var grid = built.grid;
    var unknown = built.unknown;
    var totActive = 0;
    var totDisposed = 0;
    var rowsHtml = LOCATIONS.map(function (loc) {
      var row = grid[loc] || { active: 0, disposed: 0 };
      var total = row.active + row.disposed;
      totActive += row.active;
      totDisposed += row.disposed;
      return (
        '<tr class="tip-summary-clickable" data-location="' +
        esc(loc) +
        '"><td class="tip-loc">' +
        esc(loc) +
        '</td><td class="tip-n-active">' +
        esc(String(row.active)) +
        "</td><td>" +
        esc(String(row.disposed)) +
        "</td><td><strong>" +
        esc(String(total)) +
        "</strong></td></tr>"
      );
    }).join("");
    if (unknown.active + unknown.disposed > 0) {
      rowsHtml +=
        '<tr><td class="tip-loc">（拠点未設定）</td><td class="tip-n-active">' +
        esc(String(unknown.active)) +
        "</td><td>" +
        esc(String(unknown.disposed)) +
        "</td><td><strong>" +
        esc(String(unknown.active + unknown.disposed)) +
        "</strong></td></tr>";
      totActive += unknown.active;
      totDisposed += unknown.disposed;
    }
    rowsHtml +=
      '<tr class="tip-summary-total"><td class="tip-loc">合計</td><td class="tip-n-active">' +
      esc(String(totActive)) +
      "</td><td>" +
      esc(String(totDisposed)) +
      "</td><td><strong>" +
      esc(String(totActive + totDisposed)) +
      "</strong></td></tr>";
    el.innerHTML = rowsHtml;
    el.querySelectorAll("tr.tip-summary-clickable").forEach(function (tr) {
      tr.addEventListener("click", function () {
        var loc = tr.getAttribute("data-location") || "";
        state.filterLocation = loc;
        state.lifecycleFilter = "active";
        var locSel = document.getElementById("tip-filter-location");
        if (locSel) locSel.value = loc;
        var root = document.getElementById("tip-root");
        if (root) {
          root.querySelectorAll(".tip-lifecycle-btn").forEach(function (b) {
            b.classList.toggle("active", b.getAttribute("data-lifecycle") === "active");
          });
        }
        renderTable();
      });
    });
  }

  function updateMeta() {
    var el = document.getElementById("tip-meta");
    if (!el) return;
    var next = nextTokaiDeviceName(state.records);
    var activeCount = 0;
    var disposedCount = 0;
    state.records.forEach(function (r) {
      if (r.status === STATUS_DISPOSED) disposedCount += 1;
      else activeCount += 1;
    });
    var html =
      '<span class="tip-meta-count">全 ' +
      esc(String(state.records.length)) +
      " 台（有効 " +
      esc(String(activeCount)) +
      " 台 / 廃棄 " +
      esc(String(disposedCount)) +
      " 台）</span>" +
      '<div class="tip-next-slot">' +
      '<div><span class="tip-next-label">次の端末名</span> <span class="tip-next-id">' +
      esc(next) +
      "</span></div></div>";
    if (state.isEditor) {
      html +=
        '<div class="tip-meta-actions">' +
        '<button type="button" id="tip-new-device" class="kintoneplugin-button-dialog-ok">新規端末を作成</button>' +
        '<button type="button" id="tip-list-print" class="kintoneplugin-button-normal">一覧印刷</button>' +
        '<button type="button" id="tip-list-xlsx" class="kintoneplugin-button-normal">一覧 Excel</button>' +
        "</div>";
    } else {
      html +=
        '<div class="tip-meta-actions">' +
        '<button type="button" id="tip-list-print" class="kintoneplugin-button-normal">一覧印刷</button>' +
        '<button type="button" id="tip-list-xlsx" class="kintoneplugin-button-normal">一覧 Excel</button>' +
        '<span class="tip-readonly-msg">閲覧のみ（編集は tokai / admin）</span>' +
        "</div>";
    }
    el.innerHTML = html;
    var btn = document.getElementById("tip-new-device");
    if (btn) btn.addEventListener("click", createNewDevice);
    var pBtn = document.getElementById("tip-list-print");
    if (pBtn) pBtn.addEventListener("click", openListPrintWindow);
    var xBtn = document.getElementById("tip-list-xlsx");
    if (xBtn) xBtn.addEventListener("click", exportListXlsx);
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
        alert("読込失敗: " + formatKintoneApiError(e));
      });
  }

  function printVal(raw) {
    var s = String(raw == null ? "" : raw).trim();
    return s || "—";
  }

  function listPrintFilterSummary(rows) {
    var parts = ["全 " + rows.length + " 台"];
    parts.push(state.lifecycleFilter === "disposed" ? "表示=廃棄" : "表示=有効");
    if (state.filterLocation) parts.push("拠点=" + state.filterLocation);
    if (state.search.trim()) parts.push("検索=" + state.search.trim());
    return parts.join(" / ");
  }

  function listPrintStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:12px 14px;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".tipl-header{margin-bottom:10px;text-align:center;}" +
      ".tipl-header h1{margin:0 0 6px;font-size:16pt;font-weight:700;color:#7c2d12;}" +
      ".tipl-meta{margin:0;font-size:10pt;color:#475569;}" +
      ".tipl-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10pt;}" +
      ".tipl-table th,.tipl-table td{border:1px solid #64748b;padding:5px 4px;vertical-align:top;line-height:1.4;word-break:break-word;overflow-wrap:anywhere;}" +
      ".tipl-table th{background:#ffedd5;font-weight:700;}" +
      ".tipl-table tr:nth-child(even) td{background:#fff7ed;}" +
      "@media print{@page{size:A4 landscape;margin:8mm;}body{padding:0;}thead{display:table-header-group;}tr{page-break-inside:avoid;}}"
    );
  }

  function openListPrintWindow() {
    var rows = filteredRecords();
    if (!rows.length) {
      alert("印刷対象がありません");
      return;
    }
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var head =
      "<thead><tr>" +
      EXPORT_COLUMNS.map(function (c) { return "<th>" + esc(c.label) + "</th>"; }).join("") +
      "</tr></thead>";
    var body =
      "<tbody>" +
      rows
        .map(function (r) {
          return (
            "<tr>" +
            EXPORT_COLUMNS.map(function (c) { return "<td>" + esc(printVal(r[c.key])) + "</td>"; }).join("") +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>";
    var html =
      '<header class="tipl-header"><h1>東海支店 iPad 管理台帳 — 一覧</h1>' +
      '<p class="tipl-meta">印刷日: ' +
      esc(todayJstYmd()) +
      " / " +
      esc(listPrintFilterSummary(rows)) +
      "</p></header>" +
      '<table class="tipl-table">' +
      head +
      body +
      "</table>";
    var docHtml =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>東海iPad一覧</title><style>' +
      listPrintStylesheet() +
      "</style></head><body>" +
      html +
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

  function userPrintStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:24px;background:#f8fafc;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".tippr-page{max-width:720px;margin:0 auto;}" +
      ".tippr-header{background:linear-gradient(135deg,#ffedd5 0%,#fff7ed 100%);border:1px solid #fdba74;border-radius:16px;padding:24px 28px 20px;margin-bottom:20px;text-align:center;}" +
      ".tippr-header h1{margin:0;font-size:20pt;font-weight:700;color:#7c2d12;}" +
      ".tippr-header p{margin:6px 0 0;font-size:11pt;color:#9a3412;}" +
      ".tippr-body{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;box-shadow:0 4px 16px rgba(15,23,42,.06);}" +
      ".tippr-row{margin-bottom:14px;}" +
      ".tippr-row:last-child{margin-bottom:0;}" +
      ".tippr-lab{display:block;font-size:11pt;font-weight:700;color:#64748b;margin-bottom:3px;}" +
      ".tippr-val{display:block;font-size:16pt;font-weight:700;line-height:1.35;word-break:break-all;}" +
      "@media print{@page{size:A4 portrait;margin:10mm;}body{padding:0;background:#fff;}.tippr-header{border-radius:0;}.tippr-body{box-shadow:none;}.tippr-header h1{font-size:18pt;}.tippr-val{font-size:14pt;}}"
    );
  }

  function buildUserPrintPageHtml(row) {
    var items = [
      { label: "拠点", value: row.location },
      { label: "利用者", value: row.user_name },
      { label: "端末名", value: row.device_name },
      { label: "導入日", value: row.rental_start_date },
      { label: "機種", value: row.model },
      { label: "電話番号", value: row.phone_number },
      { label: "IMEI", value: row.imei },
      { label: "ICCID", value: row.iccid },
      { label: "Apple シリアル", value: row.apple_serial },
      { label: "共有パスコード", value: row.shared_passcode },
      { label: "M365 ID", value: row.m365_id },
      { label: "M365 PW", value: row.m365_pw },
      { label: "VPN ID", value: row.vpn_id },
      { label: "VPN PW", value: row.vpn_pw },
      { label: "ステータス", value: row.status },
    ];
    var body = items
      .map(function (it) {
        return (
          '<div class="tippr-row"><span class="tippr-lab">' +
          esc(it.label) +
          '</span><span class="tippr-val">' +
          esc(printVal(it.value)) +
          "</span></div>"
        );
      })
      .join("");
    return (
      '<div class="tippr-page">' +
      '<header class="tippr-header"><h1>東海支店 iPad アカウント情報</h1>' +
      '<p>' +
      esc(row.device_name || "") +
      " ／ " +
      esc(row.user_name || "—") +
      "</p></header>" +
      '<div class="tippr-body">' +
      body +
      "</div></div>"
    );
  }

  function openUserPrintWindow(row) {
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var docHtml =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>東海iPad — ' +
      esc(row.device_name || "") +
      "</title><style>" +
      userPrintStylesheet() +
      "</style></head><body>" +
      buildUserPrintPageHtml(row) +
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

  function ensureXlsx() {
    if (typeof XLSX === "undefined" || !XLSX.utils || !XLSX.writeFile) {
      alert("Excel 出力ライブラリが読み込まれていません。ページを再読み込みしてください。");
      return false;
    }
    return true;
  }

  function fileStamp() {
    return todayJstYmd().replace(/-/g, "");
  }

  function exportListXlsx() {
    if (!ensureXlsx()) return;
    var rows = filteredRecords();
    if (!rows.length) {
      alert("出力対象がありません");
      return;
    }
    var header = EXPORT_COLUMNS.map(function (c) { return c.label; });
    var matrix = [header];
    rows.forEach(function (r) {
      matrix.push(
        EXPORT_COLUMNS.map(function (c) {
          return r[c.key] != null ? String(r[c.key]) : "";
        }),
      );
    });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "一覧");
    XLSX.writeFile(wb, "東海iPad一覧_" + fileStamp() + ".xlsx", { bookType: "xlsx" });
  }

  function exportUserXlsx(row) {
    if (!ensureXlsx()) return;
    // ユーザー単位 = 同一 user_name のレコード（1 台なら 1 行）
    var name = String(row.user_name || "").trim();
    if (!name) {
      // 空氏名の端末は自レコードのみ
      var single = [row];
      writeUserWorkbook(single, row.device_name || "no-user");
      return;
    }
    var rows = state.records.filter(function (r) {
      return String(r.user_name || "").trim() === name;
    });
    if (!rows.length) rows = [row];
    writeUserWorkbook(rows, name);
  }

  function writeUserWorkbook(rows, label) {
    var header = EXPORT_COLUMNS.map(function (c) { return c.label; });
    var matrix = [header];
    rows.forEach(function (r) {
      matrix.push(
        EXPORT_COLUMNS.map(function (c) {
          return r[c.key] != null ? String(r[c.key]) : "";
        }),
      );
    });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ユーザー");
    var safe = String(label || "user").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
    XLSX.writeFile(wb, "東海iPad_" + safe + "_" + fileStamp() + ".xlsx", { bookType: "xlsx" });
  }

  function buildShell() {
    if (document.getElementById("tip-root")) return;
    injectCss();
    state.isEditor = canEdit();
    state.canDirectMaster = canDirectMasterAccess();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "tip-root";
    root.className = "tip-root";
    root.innerHTML =
      '<div class="tip-toolbar">' +
      '<strong style="font-size:18px">東海支店 iPad 管理台帳</strong>' +
      '<button type="button" id="tip-reload" class="kintoneplugin-button-normal">再読込</button>' +
      "</div>" +
      '<div id="tip-meta" class="tip-meta"></div>' +
      '<details class="tip-summary-acc" id="tip-summary-acc">' +
      "<summary>拠点別台数（利用＝有効）</summary>" +
      '<div class="tip-summary-wrap"><table class="tip-summary"><thead><tr>' +
      "<th>拠点</th><th>利用中（有効）</th><th>廃棄</th><th>合計</th>" +
      '</tr></thead><tbody id="tip-summary-tbody"></tbody></table></div>' +
      '<p class="tip-summary-hint">行をクリックすると、その拠点の「有効」一覧に絞り込みます。</p>' +
      "</details>" +
      '<div class="tip-filters">' +
      '<input type="search" id="tip-search" placeholder="利用者・端末名・電話・IMEI・機種・M365/VPN ID">' +
      '<select id="tip-filter-location"><option value="">拠点: すべて</option>' +
      LOCATIONS.map(function (l) { return '<option value="' + esc(l) + '">' + esc(l) + "</option>"; }).join("") +
      "</select>" +
      '<button type="button" id="tip-filter-clear" class="kintoneplugin-button-normal tip-filter-clear">クリア</button>' +
      "</div>" +
      '<div class="tip-lifecycle-bar">' +
      '<span class="tip-lifecycle-label">表示:</span>' +
      '<button type="button" class="tip-lifecycle-btn' +
      (state.lifecycleFilter === "active" ? " active" : "") +
      '" data-lifecycle="active">有効</button>' +
      '<button type="button" class="tip-lifecycle-btn' +
      (state.lifecycleFilter === "disposed" ? " active" : "") +
      '" data-lifecycle="disposed">廃棄</button>' +
      "</div>" +
      '<div class="tip-table-wrap"><table class="tip-table"><thead><tr>' +
      LIST_COLUMNS.map(function (c) { return "<th>" + esc(c.label) + "</th>"; }).join("") +
      '<th>操作</th></tr></thead><tbody id="tip-tbody"></tbody></table></div>';
    host.appendChild(root);

    document.getElementById("tip-reload").addEventListener("click", reloadRecords);
    var search = document.getElementById("tip-search");
    search.value = state.search;
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    var locSel = document.getElementById("tip-filter-location");
    locSel.value = state.filterLocation;
    locSel.addEventListener("change", function () {
      state.filterLocation = locSel.value;
      renderTable();
    });
    document.getElementById("tip-filter-clear").addEventListener("click", clearFilters);
    root.querySelectorAll(".tip-lifecycle-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLifecycleFilter(btn.getAttribute("data-lifecycle"));
      });
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
    if (!APP_DB) {
      console.error(BUILD, "APP_DB is not set — run tokai-ipad:sync-dash");
      return ev;
    }
    scheduleMount();
    return ev;
  });
})();
