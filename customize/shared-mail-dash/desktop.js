(function () {
  "use strict";

  /** メールアドレス管理台帳 — 695 REST CRUD */
  var BUILD = "2026-08-16-696-ui-print-polish";

  var APP_DB = 695;
  var MAIL_DOMAIN = "@j-bis.co.jp";
  var STATUS_ACTIVE = "利用中";
  var STATUS_RETIRED = "廃止";
  var USAGE_DEFAULT = "共有メールアドレス";
  var USAGE_TYPES = ["共有メールアドレス", "個人メールアドレス"];
  var DEPT_DATALIST_ID = "smd-dept-list";
  /** R68 正本: scripts/data/vpn-account-depts.json（浜田 2026-06-21 確定・再確認不要） */
  var JBIS_DEPT_FLAT_ORDER = [
    "役員室", "総務部", "経理部", "経営企画部", "システム推進室", "人事研修部", "安全推進部",
    "施工推進部", "メンテナンス技術部", "塗装技術部", "品質管理部", "東北支店", "秋田営業所",
    "盛岡営業所", "仙台営業所", "関越支店", "関越支店施工部", "新潟営業所", "長野営業所",
    "高崎営業所", "東京支店", "東京支店施工部", "東京支店橋りょうリペア部", "千葉営業所",
    "水戸営業所", "鎌ヶ谷事務所", "東海支店", "東京営業所", "静岡営業所", "名古屋営業所",
    "関西営業所", "札幌支店", "首都圏支店", "鉄構支店", "湾岸工事所", "BNP",
  ];
  var SEARCH_DL_ID = "smd-search-datalist";
  var SEARCH_URL_KW = "smd696kw";
  var SEARCH_URL_DEPT = "smd696dept";
  var SEARCH_URL_ST = "smd696st";
  var SEARCH_URL_UT = "smd696ut";
  var SEARCH_HINT_FIELDS = [
    "legacy_no",
    "mail_address",
    "mail_account",
    "department",
    "mailbox_display_name",
    "usage_type",
    "note",
  ];
  var PAGE_SIZE = 100;

  var CONN = {
    smtpServer: "j-bis.co.jp",
    smtpPort: "587",
    popServer: "j-bis.co.jp",
    popPort: "110",
  };

  var FC = {
    legacy_no: "legacy_no",
    usage_type: "usage_type",
    department: "department",
    mailbox_display_name: "mailbox_display_name",
    mail_address: "mail_address",
    mail_account: "mail_account",
    password: "password",
    status: "status",
    registered_date: "registered_date",
    note: "note",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.legacy_no,
    FC.usage_type,
    FC.department,
    FC.mailbox_display_name,
    FC.mail_address,
    FC.mail_account,
    FC.password,
    FC.status,
    FC.registered_date,
    FC.note,
  ];

  var SORT_COLUMNS = [
    { key: "legacy_no", label: "No." },
    { key: "status", label: "状態" },
    { key: "department", label: "利用部署" },
    { key: "mailbox_display_name", label: "表示名" },
    { key: "mail_address", label: "メール" },
    { key: "mail_account", label: "アカウント" },
    { key: "password", label: "PW" },
    { key: "usage_type", label: "種別" },
  ];

  var state = {
    records: [],
    search: "",
    departmentFilter: "",
    statusFilter: { active: true, retired: false },
    usageFilter: { shared: false, personal: false },
    loading: false,
    selected: {},
    sortKey: null,
    sortDir: "desc",
  };

  function displayNameLabel(usageType) {
    return usageType === "個人メールアドレス" ? "表示名" : "共有メールアドレス名";
  }

  function printHeroTitle(usageType) {
    return usageType === "個人メールアドレス"
      ? "メールアドレス設定情報"
      : "共有メールアドレス設定情報";
  }

  function usageSelectHtml(selectId, selected) {
    var html = '<label>利用種別<select id="' + selectId + '">';
    USAGE_TYPES.forEach(function (u) {
      html +=
        '<option value="' +
        esc(u) +
        '"' +
        (selected === u ? " selected" : "") +
        ">" +
        esc(u) +
        "</option>";
    });
    return html + "</select></label>";
  }

  function nameFieldHtml(prefix, value, usageType) {
    return (
      '<label id="' +
      prefix +
      '-name-wrap"><span class="smd-name-lbl">' +
      esc(displayNameLabel(usageType || USAGE_DEFAULT)) +
      '</span><input id="' +
      prefix +
      "-name\" value=\"" +
      esc(value || "") +
      '" required></label>'
    );
  }

  function wireDisplayNameLabel(box, usageSelectId, nameWrapId) {
    var usageEl = box.querySelector("#" + usageSelectId);
    var wrap = box.querySelector("#" + nameWrapId);
    if (!usageEl || !wrap) return;
    var lbl = wrap.querySelector(".smd-name-lbl");
    if (!lbl) return;
    function sync() {
      lbl.textContent = displayNameLabel(usageEl.value);
    }
    usageEl.addEventListener("change", sync);
    sync();
  }

  function departmentSortKey(name) {
    var n = String(name == null ? "" : name).trim();
    if (!n) return [9, ""];
    var exact = JBIS_DEPT_FLAT_ORDER.indexOf(n);
    if (exact >= 0) return [0, exact, ""];
    var i;
    for (i = 0; i < JBIS_DEPT_FLAT_ORDER.length; i++) {
      var base = JBIS_DEPT_FLAT_ORDER[i];
      if (n.indexOf(base + "-") === 0 || n.indexOf(base + "－") === 0) {
        return [0, i, n.slice(base.length + 1)];
      }
    }
    return [2, n];
  }

  function compareDepartmentNames(a, b) {
    var ka = departmentSortKey(a);
    var kb = departmentSortKey(b);
    var len = Math.max(ka.length, kb.length);
    var i;
    for (i = 0; i < len; i++) {
      var va = ka[i] == null ? "" : ka[i];
      var vb = kb[i] == null ? "" : kb[i];
      if (va === vb) continue;
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb), "ja");
    }
    return 0;
  }

  function sortDepartmentNames(list) {
    return list.slice().sort(compareDepartmentNames);
  }

  function collectDepartmentOptions(extraValue) {
    var seen = {};
    var out = [];
    state.records.forEach(function (r) {
      if (r.status !== STATUS_ACTIVE) return;
      var d = String(r.department || "").trim();
      if (!d || seen[d]) return;
      seen[d] = true;
      out.push(d);
    });
    var extra = String(extraValue == null ? "" : extraValue).trim();
    if (extra && !seen[extra]) out.push(extra);
    return sortDepartmentNames(out);
  }

  function departmentDatalistHtml(items) {
    return (
      '<datalist id="' +
      DEPT_DATALIST_ID +
      '">' +
      (items || [])
        .map(function (d) {
          return '<option value="' + esc(d) + '"></option>';
        })
        .join("") +
      "</datalist>"
    );
  }

  function departmentFieldHtml(inputId, value, required) {
    return (
      '<label>利用部署<input id="' +
      inputId +
      '" list="' +
      DEPT_DATALIST_ID +
      '" value="' +
      esc(value || "") +
      '" autocomplete="off"' +
      (required ? " required" : "") +
      "></label>"
    );
  }

  function normalizeSearchText(s) {
    try {
      return String(s == null ? "" : s).normalize("NFKC");
    } catch (e) {
      return String(s == null ? "" : s);
    }
  }

  function searchTokens(q) {
    return normalizeSearchText(q)
      .toLowerCase()
      .split(/\s+/)
      .filter(function (t) {
        return !!t;
      });
  }

  function recordHaystack(row) {
    return normalizeSearchText(
      SEARCH_HINT_FIELDS.map(function (k) {
        return row[k];
      }).join(" "),
    ).toLowerCase();
  }

  function recordMatchesTokens(row, tokens) {
    if (!tokens.length) return true;
    var hay = recordHaystack(row);
    for (var i = 0; i < tokens.length; i++) {
      if (hay.indexOf(tokens[i]) < 0) return false;
    }
    return true;
  }

  function matchesStatusFilter(row) {
    var a = state.statusFilter.active;
    var r = state.statusFilter.retired;
    if (!a && !r) return true;
    if (a && r) return true;
    if (a) return row.status === STATUS_ACTIVE;
    if (r) return row.status === STATUS_RETIRED;
    return true;
  }

  function matchesUsageFilter(row) {
    var s = state.usageFilter.shared;
    var p = state.usageFilter.personal;
    if (!s && !p) return true;
    var ut = row.usage_type || USAGE_DEFAULT;
    if (s && ut === "共有メールアドレス") return true;
    if (p && ut === "個人メールアドレス") return true;
    return false;
  }

  function matchesDepartmentFilter(row) {
    if (!state.departmentFilter) return true;
    return String(row.department || "").trim() === state.departmentFilter;
  }

  function collectAllDepartmentOptions() {
    var seen = {};
    var out = [];
    state.records.forEach(function (r) {
      var d = String(r.department || "").trim();
      if (!d || seen[d]) return;
      seen[d] = true;
      out.push(d);
    });
    return sortDepartmentNames(out);
  }

  function updateSearchDatalist(prefix) {
    var dl = document.getElementById(SEARCH_DL_ID);
    if (!dl) return;
    var p = normalizeSearchText(prefix).trim().toLowerCase();
    dl.innerHTML = "";
    if (!p) return;
    var seen = {};
    var out = [];
    state.records.forEach(function (row) {
      SEARCH_HINT_FIELDS.forEach(function (k) {
        var v = String(row[k] == null ? "" : row[k]).trim();
        if (!v) return;
        if (v.toLowerCase().indexOf(p) < 0) return;
        if (seen[v]) return;
        seen[v] = true;
        out.push(v);
      });
    });
    out.sort(function (a, b) {
      return a.length - b.length || a.localeCompare(b, "ja");
    });
    out.slice(0, 80).forEach(function (v) {
      dl.innerHTML += '<option value="' + esc(v) + '"></option>';
    });
  }

  function encodeStatusFilterBits() {
    var n = 0;
    if (state.statusFilter.active) n |= 1;
    if (state.statusFilter.retired) n |= 2;
    return String(n);
  }

  function decodeStatusFilterBits(raw) {
    var n = parseInt(String(raw || "1"), 10);
    if (isNaN(n)) n = 1;
    return { active: (n & 1) !== 0, retired: (n & 2) !== 0 };
  }

  function encodeUsageFilterBits() {
    var n = 0;
    if (state.usageFilter.shared) n |= 1;
    if (state.usageFilter.personal) n |= 2;
    return String(n);
  }

  function decodeUsageFilterBits(raw) {
    var n = parseInt(String(raw || "0"), 10);
    if (isNaN(n)) n = 0;
    return { shared: (n & 1) !== 0, personal: (n & 2) !== 0 };
  }

  function syncChipUi() {
    document.querySelectorAll(".smd-chip-status").forEach(function (btn) {
      var st = btn.getAttribute("data-status");
      var on =
        (st === STATUS_ACTIVE && state.statusFilter.active) ||
        (st === STATUS_RETIRED && state.statusFilter.retired);
      btn.classList.toggle("on", on);
    });
    document.querySelectorAll(".smd-chip-usage").forEach(function (btn) {
      var ut = btn.getAttribute("data-usage");
      var on =
        (ut === "共有メールアドレス" && state.usageFilter.shared) ||
        (ut === "個人メールアドレス" && state.usageFilter.personal);
      btn.classList.toggle("on", on);
    });
    var deptSel = document.getElementById("smd-dept-filter");
    if (deptSel) deptSel.value = state.departmentFilter || "";
    var search = document.getElementById("smd-search");
    if (search && search.value !== state.search) search.value = state.search;
  }

  function syncSearchUrl() {
    try {
      var u = new URL(location.href);
      var kw = state.search.trim();
      if (kw) u.searchParams.set(SEARCH_URL_KW, kw.slice(0, 200));
      else u.searchParams.delete(SEARCH_URL_KW);
      if (state.departmentFilter) u.searchParams.set(SEARCH_URL_DEPT, state.departmentFilter);
      else u.searchParams.delete(SEARCH_URL_DEPT);
      u.searchParams.set(SEARCH_URL_ST, encodeStatusFilterBits());
      u.searchParams.set(SEARCH_URL_UT, encodeUsageFilterBits());
      history.replaceState(null, "", u.toString());
    } catch (e) {
      /* noop */
    }
  }

  function restoreSearchFromUrl() {
    try {
      var u = new URL(location.href);
      state.search = String(u.searchParams.get(SEARCH_URL_KW) || "");
      state.departmentFilter = String(u.searchParams.get(SEARCH_URL_DEPT) || "").trim();
      state.statusFilter = decodeStatusFilterBits(u.searchParams.get(SEARCH_URL_ST));
      state.usageFilter = decodeUsageFilterBits(u.searchParams.get(SEARCH_URL_UT));
    } catch (e2) {
      /* noop */
    }
    syncChipUi();
  }

  function refreshDeptFilterOptions() {
    var sel = document.getElementById("smd-dept-filter");
    if (!sel) return;
    var cur = state.departmentFilter || "";
    var opts = collectAllDepartmentOptions();
    if (cur && opts.indexOf(cur) < 0) opts.push(cur);
    opts = sortDepartmentNames(opts);
    sel.innerHTML =
      '<option value="">すべての部署</option>' +
      opts
        .map(function (d) {
          return (
            '<option value="' +
            esc(d) +
            '"' +
            (d === cur ? " selected" : "") +
            ">" +
            esc(d) +
            "</option>"
          );
        })
        .join("");
  }

  function updateSearchSummary() {
    var el = document.getElementById("smd-search-summary");
    if (!el) return;
    var shown = filteredRecords().length;
    var bits = [];
    bits.push("表示 " + shown + " 件");
    if (state.search.trim()) bits.push('キーワード「' + state.search.trim() + "」");
    if (state.departmentFilter) bits.push("部署: " + state.departmentFilter);
    if (state.usageFilter.shared || state.usageFilter.personal) {
      var ut = [];
      if (state.usageFilter.shared) ut.push("共有");
      if (state.usageFilter.personal) ut.push("個人");
      bits.push("種別: " + ut.join("・"));
    }
    el.textContent = bits.join(" · ");
  }

  function applySearchAndRender() {
    syncSearchUrl();
    renderTable();
  }

  function clearSearchFilters() {
    state.search = "";
    state.departmentFilter = "";
    state.statusFilter = { active: true, retired: false };
    state.usageFilter = { shared: false, personal: false };
    state.selected = {};
    syncChipUi();
    var search = document.getElementById("smd-search");
    if (search) search.value = "";
    var dl = document.getElementById(SEARCH_DL_ID);
    if (dl) dl.innerHTML = "";
    applySearchAndRender();
  }

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
      legacy_no: val(rec, FC.legacy_no),
      usage_type: val(rec, FC.usage_type) || USAGE_DEFAULT,
      department: val(rec, FC.department),
      mailbox_display_name: val(rec, FC.mailbox_display_name),
      mail_address: val(rec, FC.mail_address),
      mail_account: val(rec, FC.mail_account),
      password: val(rec, FC.password),
      status: val(rec, FC.status) || STATUS_ACTIVE,
      registered_date: val(rec, FC.registered_date),
      note: val(rec, FC.note),
    };
  }

  function mailAccountFromAddress(addr) {
    var s = String(addr || "").trim().toLowerCase();
    var at = s.indexOf("@");
    if (at <= 0) return "";
    return s.slice(0, at);
  }

  function randomFourDigits() {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      var u = new Uint32Array(1);
      crypto.getRandomValues(u);
      return String(u[0] % 10000).padStart(4, "0");
    }
    return String(1000 + Math.floor(Math.random() * 9000));
  }

  function buildNewPassword() {
    return "sjb" + randomFourDigits() + "1M#";
  }

  function toKintoneRecord(row, partial) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
    }
    if (!partial || partial.legacy_no) set(FC.legacy_no, row.legacy_no);
    if (!partial || partial.usage_type) set(FC.usage_type, row.usage_type);
    if (!partial || partial.department) set(FC.department, row.department);
    if (!partial || partial.mailbox_display_name) set(FC.mailbox_display_name, row.mailbox_display_name);
    if (!partial || partial.mail_address) set(FC.mail_address, row.mail_address);
    if (!partial || partial.mail_account) set(FC.mail_account, row.mail_account);
    if (!partial || partial.password) set(FC.password, row.password);
    if (!partial || partial.status) set(FC.status, row.status);
    if (!partial || partial.registered_date) set(FC.registered_date, row.registered_date);
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

  function nextLegacyNo(records) {
    var max = 0;
    records.forEach(function (r) {
      var n = Number(r.legacy_no);
      if (Number.isFinite(n)) max = Math.max(max, n);
    });
    return max + 1;
  }

  function validateMailAddress(addr) {
    var s = String(addr || "").trim().toLowerCase();
    if (!s) return "メールアドレスは必須です";
    if (s.indexOf(MAIL_DOMAIN) !== s.length - MAIL_DOMAIN.length) {
      return "ドメインは " + MAIL_DOMAIN + " のみ登録できます";
    }
    if (!/^[\w.-]+@j-bis\.co\.jp$/i.test(s)) return "形式が不正です";
    return "";
  }

  function copySpanHtml(value) {
    var v = String(value == null ? "" : value);
    return (
      '<span class="smd-copy" data-copy="' +
      esc(v) +
      '" title="クリックでコピー">' +
      esc(v) +
      "</span>"
    );
  }

  function computeRecordCounts() {
    var active = 0;
    var retired = 0;
    var shared = 0;
    var personal = 0;
    state.records.forEach(function (r) {
      if (r.status === STATUS_RETIRED) {
        retired++;
      } else if (r.status === STATUS_ACTIVE) {
        active++;
      }
      var ut = r.usage_type || USAGE_DEFAULT;
      if (ut === "個人メールアドレス") personal++;
      else shared++;
    });
    return { active: active, retired: retired, shared: shared, personal: personal };
  }

  function rowClasses(r) {
    if (r.status === STATUS_RETIRED) return "retired";
    var ut = r.usage_type || USAGE_DEFAULT;
    if (ut === "個人メールアドレス") return "usage-personal";
    return "usage-shared";
  }

  function statusPillHtml(status) {
    if (status === STATUS_RETIRED) {
      return (
        '<span class="smd-status-pill smd-status-pill--retired">' + esc(status) + "</span>"
      );
    }
    return (
      '<span class="smd-status-pill smd-status-pill--active">' + esc(status) + "</span>"
    );
  }

  function metaStatChip(kind, label, count, zeroWhenEmpty) {
    var zeroCls = zeroWhenEmpty && count === 0 ? " smd-meta-stat--zero" : "";
    return (
      '<span class="smd-meta-stat smd-meta-stat--' +
      kind +
      zeroCls +
      '">' +
      '<span class="smd-meta-stat-label">' +
      label +
      "</span>" +
      '<span class="smd-meta-stat-val"><span class="smd-meta-stat-num">' +
      esc(String(count)) +
      '</span><span class="smd-meta-stat-unit">件</span></span></span>'
    );
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
    if (document.getElementById("smd-dash-css")) return;
    var st = document.createElement("style");
    st.id = "smd-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".smd-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".smd-toolbar{display:flex;flex-wrap:wrap;gap:10px 12px;align-items:stretch;margin-bottom:10px;}" +
      ".smd-toolbar-title{font-size:16px;font-weight:700;white-space:nowrap;align-self:center;}" +
      ".smd-toolbar-group{display:flex;flex-direction:column;min-width:0;margin:0;padding:8px 10px;" +
      "border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;}" +
      ".smd-toolbar-group-inner{display:flex;flex:1;flex-wrap:wrap;align-items:center;gap:8px;}" +
      ".smd-toolbar-group legend{font-size:11px;color:#64748b;padding:0 4px;font-weight:600;}" +
      ".smd-toolbar-group--a{background:#f8fafc;}" +
      ".smd-toolbar-group--c{background:#faf5ff;}" +
      ".smd-toolbar-group-inner > button{box-sizing:border-box;height:36px;min-height:36px;padding:0 16px;font-size:13px;line-height:1;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;}" +
      ".smd-search-panel{margin-bottom:12px;padding:10px 12px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;}" +
      ".smd-search-title{font-size:12px;font-weight:700;color:#0f172a;margin-bottom:8px;}" +
      ".smd-search-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;}" +
      ".smd-search-row input[type=search]{box-sizing:border-box;height:36px;min-height:36px;min-width:220px;flex:1;max-width:420px;padding:0 10px;border:1px solid #94a3b8;border-radius:6px;font-size:13px;line-height:1;}" +
      ".smd-search-row select{box-sizing:border-box;height:36px;min-height:36px;padding:0 8px;border:1px solid #94a3b8;border-radius:6px;background:#fff;font-size:12px;max-width:220px;}" +
      ".smd-search-row #smd-clear{box-sizing:border-box;height:36px;min-height:36px;padding:0 16px;font-size:13px;line-height:1;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;}" +
      ".smd-search-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px;}" +
      ".smd-chip-label{font-size:11px;font-weight:700;color:#64748b;margin-right:2px;}" +
      ".smd-chip{padding:4px 10px;border-radius:999px;border:1px solid #94a3b8;background:#fff;font-size:12px;cursor:pointer;}" +
      ".smd-chip.on{background:#0d9488;color:#fff;border-color:#0d9488;font-weight:700;}" +
      ".smd-search-summary{font-size:12px;color:#334155;}" +
      ".smd-conn{margin-bottom:12px;padding:14px 18px;background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:2px solid #2563eb;border-radius:10px;}" +
      ".smd-conn h4{margin:0 0 8px;font-size:14px;color:#1e40af;}" +
      ".smd-conn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px 16px;font-size:12px;}" +
      ".smd-conn-item strong{color:#334155;}" +
      ".smd-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-bottom:12px;padding:16px 20px;" +
      "background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:2px solid #059669;border-radius:12px;" +
      "box-shadow:0 2px 8px rgba(5,150,105,.15);}" +
      ".smd-meta-stat{display:inline-flex;flex-direction:column;align-items:center;padding:6px 12px;" +
      "border-radius:10px;min-width:72px;white-space:nowrap;background:#fff;border:1px solid;" +
      "box-shadow:0 1px 3px rgba(15,23,42,.06);}" +
      ".smd-meta-stat-label{font-size:11px;font-weight:600;line-height:1.2;margin-bottom:2px;}" +
      ".smd-meta-stat-val{display:flex;align-items:baseline;gap:2px;line-height:1;}" +
      ".smd-meta-stat-num{font-size:22px;font-weight:700;font-variant-numeric:tabular-nums;font-feature-settings:'tnum';}" +
      ".smd-meta-stat-unit{font-size:11px;font-weight:600;}" +
      ".smd-meta-stat--all{background:#fff;border-color:#cbd5e1;color:#475569;}" +
      ".smd-meta-stat--all .smd-meta-stat-label{color:#64748b;}" +
      ".smd-meta-stat--active{background:#dcfce7;border-color:#86efac;color:#166534;}" +
      ".smd-meta-stat--active .smd-meta-stat-label{color:#166534;}" +
      ".smd-meta-stat--retired{background:#f1f5f9;border-color:#cbd5e1;color:#64748b;}" +
      ".smd-meta-stat--retired .smd-meta-stat-label{color:#64748b;}" +
      ".smd-meta-stat--shared{background:#eff6ff;border-color:#93c5fd;color:#1d4ed8;}" +
      ".smd-meta-stat--shared .smd-meta-stat-label{color:#1d4ed8;}" +
      ".smd-meta-stat--personal{background:#f5f3ff;border-color:#c4b5fd;color:#6d28d9;}" +
      ".smd-meta-stat--personal .smd-meta-stat-label{color:#6d28d9;}" +
      ".smd-meta-stat--zero{opacity:.55;}" +
      ".smd-table-wrap{overflow:auto;max-height:calc(100vh - 320px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".smd-table{border-collapse:separate;border-spacing:0;width:100%;font-size:12px;min-width:1100px;}" +
      ".smd-table th,.smd-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle;}" +
      ".smd-table th{background:#f1f5f9;position:sticky;top:0;z-index:2;box-shadow:0 1px 0 #e2e8f0;}" +
      ".smd-table th.smd-sort{cursor:pointer;user-select:none;}" +
      ".smd-status-pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap;}" +
      ".smd-status-pill--active{background:#dcfce7;color:#166534;border:1px solid #86efac;}" +
      ".smd-status-pill--retired{background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;}" +
      ".smd-table tr.retired{background:#e2e8f0;color:#64748b;}" +
      ".smd-table tr.usage-shared:not(.retired){background:#eff6ff;}" +
      ".smd-table tr.usage-personal:not(.retired){background:#f5f3ff;}" +
      ".smd-copy{cursor:pointer;font-family:Consolas,Monaco,monospace;font-size:12px;}" +
      ".smd-copy:hover{text-decoration:underline;color:#0369a1;}" +
      ".smd-actions button{margin:0 2px;padding:2px 6px;font-size:11px;}" +
      ".smd-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".smd-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:540px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".smd-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".smd-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".smd-modal input,.smd-modal select,.smd-modal textarea{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".smd-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}";
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
    if (key === "legacy_no") return Number(a.legacy_no || 0) - Number(b.legacy_no || 0);
    if (key === "status") {
      var sa = a.status === STATUS_ACTIVE ? 0 : 1;
      var sb = b.status === STATUS_ACTIVE ? 0 : 1;
      if (sa !== sb) return sa - sb;
    }
    if (key === "department") return compareDepartmentNames(a.department, b.department);
    return String(a[key] || "").localeCompare(String(b[key] || ""), "ja");
  }

  function filteredRecords() {
    var tokens = searchTokens(state.search);
    var rows = state.records.filter(function (r) {
      if (!matchesStatusFilter(r)) return false;
      if (!matchesUsageFilter(r)) return false;
      if (!matchesDepartmentFilter(r)) return false;
      return recordMatchesTokens(r, tokens);
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

  function closeModal() {
    var el = document.getElementById("smd-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "smd-modal-root";
    bg.className = "smd-modal-bg";
    var box = document.createElement("div");
    box.className = "smd-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "smd-modal-actions";
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

  function connectionPanelHtml() {
    return (
      '<div class="smd-conn">' +
      "<h4>接続設定（共通）</h4>" +
      '<div class="smd-conn-grid">' +
      '<div class="smd-conn-item"><strong>送信（SMTP）</strong> ' +
      copySpanHtml(CONN.smtpServer) +
      " : " +
      copySpanHtml(CONN.smtpPort) +
      "</div>" +
      '<div class="smd-conn-item"><strong>受信（POP）</strong> ' +
      copySpanHtml(CONN.popServer) +
      " : " +
      copySpanHtml(CONN.popPort) +
      "</div>" +
      '<div class="smd-conn-item"><strong>WEBメール</strong> メールアカウント + パスワード</div>' +
      '<div class="smd-conn-item"><strong>Outlook</strong> 上記 + 接続設定</div>' +
      "</div></div>"
    );
  }

  function reloadRecords() {
    state.loading = true;
    renderTable();
    return fetchAllRecords()
      .then(function (rows) {
        state.records = rows.map(flatten);
        state.loading = false;
        refreshDeptFilterOptions();
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
    var el = document.getElementById("smd-meta");
    if (!el) return;
    var counts = computeRecordCounts();
    el.innerHTML =
      metaStatChip("all", "全件", state.records.length, false) +
      metaStatChip("active", "利用中", counts.active, true) +
      metaStatChip("retired", "廃止", counts.retired, true) +
      metaStatChip("shared", "共有", counts.shared, true) +
      metaStatChip("personal", "個人", counts.personal, true);
  }

  function openNewModal() {
    var pw = buildNewPassword();
    var deptOptions = collectDepartmentOptions();
    var box = openModal(
      "新規登録",
      usageSelectHtml("smd-new-usage", USAGE_DEFAULT) +
        departmentFieldHtml("smd-new-dept", "", true) +
        nameFieldHtml("smd-new", "", USAGE_DEFAULT) +
        '<label>メールアドレス<input id="smd-new-mail" placeholder="name' +
        esc(MAIL_DOMAIN) +
        '" autocomplete="off"></label>' +
        '<div id="smd-new-mail-warn"></div>' +
        '<p style="font-size:11px;color:#64748b">アカウントはメールアドレスから自動設定されます。</p>' +
        '<label>パスワード<input id="smd-new-pw" value="' +
        esc(pw) +
        '" autocomplete="off"></label>' +
        '<button type="button" id="smd-regen-pw" class="kintoneplugin-button-normal" style="margin-top:4px">PW再生成</button>' +
        '<label>メモ<textarea id="smd-new-note" rows="2"></textarea></label>' +
        departmentDatalistHtml(deptOptions),
      [
        { label: "キャンセル" },
        {
          label: "登録",
          primary: true,
          onClick: function (close) {
            var dept = (document.getElementById("smd-new-dept") || {}).value.trim();
            var name = (document.getElementById("smd-new-name") || {}).value.trim();
            var mail = String((document.getElementById("smd-new-mail") || {}).value || "")
              .trim()
              .toLowerCase();
            var err = validateMailAddress(mail);
            if (err) {
              alert(err);
              return;
            }
            if (!dept || !name) {
              alert("利用部署と表示名は必須です");
              return;
            }
            var pwVal = (document.getElementById("smd-new-pw") || {}).value.trim() || buildNewPassword();
            var rec = toKintoneRecord({
              legacy_no: String(nextLegacyNo(state.records)),
              usage_type: (document.getElementById("smd-new-usage") || {}).value || USAGE_DEFAULT,
              department: dept,
              mailbox_display_name: name,
              mail_address: mail,
              mail_account: mailAccountFromAddress(mail),
              password: pwVal,
              status: STATUS_ACTIVE,
              registered_date: todayJstYmd(),
              note: (document.getElementById("smd-new-note") || {}).value || "",
            });
            apiPost("/k/v1/record.json", { app: APP_DB, record: rec })
              .then(function () {
                close();
                reloadRecords();
                alert("登録しました");
              })
              .catch(function (e) {
                var msg = e.message || String(e);
                if (/unique|重複|duplicate|GAIA_/i.test(msg)) {
                  alert("登録失敗: このメールアドレスは既に登録されています。\n" + msg);
                } else {
                  alert("登録失敗: " + msg);
                }
              });
          },
        },
      ],
    );
    wireDisplayNameLabel(box, "smd-new-usage", "smd-new-name-wrap");
    var mailInput = box.querySelector("#smd-new-mail");
    var mailWarn = box.querySelector("#smd-new-mail-warn");
    if (mailInput && mailWarn) {
      mailInput.addEventListener("input", function () {
        var e2 = validateMailAddress(mailInput.value.trim().toLowerCase());
        mailWarn.innerHTML = e2
          ? '<p style="color:#b91c1c;font-size:12px">' + esc(e2) + "</p>"
          : "";
      });
    }
    var regen = box.querySelector("#smd-regen-pw");
    if (regen) {
      regen.addEventListener("click", function () {
        var pwEl = document.getElementById("smd-new-pw");
        if (pwEl) pwEl.value = buildNewPassword();
      });
    }
  }

  function openEditModal(row) {
    var usage = row.usage_type || USAGE_DEFAULT;
    var deptOptions = collectDepartmentOptions(row.department);
    var box = openModal(
      "編集 — No." + row.legacy_no,
      usageSelectHtml("smd-edit-usage", usage) +
        departmentFieldHtml("smd-edit-dept", row.department, false) +
        nameFieldHtml("smd-edit", row.mailbox_display_name, usage) +
        '<label>メールアドレス<input id="smd-edit-mail" value="' +
        esc(row.mail_address) +
        '" autocomplete="off"></label>' +
        '<div id="smd-edit-mail-warn"></div>' +
        '<label>アカウント（自動）<input id="smd-edit-acct" value="' +
        esc(row.mail_account) +
        '" readonly style="background:#f1f5f9"></label>' +
        '<label>パスワード<input id="smd-edit-pw" value="' +
        esc(row.password) +
        '" autocomplete="off"></label>' +
        '<label>メモ<textarea id="smd-edit-note" rows="2">' +
        esc(row.note) +
        "</textarea></label>" +
        departmentDatalistHtml(deptOptions),
      [
        { label: "キャンセル" },
        {
          label: "保存",
          primary: true,
          onClick: function (close) {
            var mail = String((document.getElementById("smd-edit-mail") || {}).value || "")
              .trim()
              .toLowerCase();
            var err = validateMailAddress(mail);
            if (err) {
              alert(err);
              return;
            }
            if (mail !== row.mail_address) {
              if (
                !window.confirm(
                  "メールアドレスを変更します。\n\n変更前: " +
                    row.mail_address +
                    "\n変更後: " +
                    mail +
                    "\n\nよろしいですか？",
                )
              ) {
                return;
              }
            }
            var rec = toKintoneRecord(
              {
                usage_type: (document.getElementById("smd-edit-usage") || {}).value || USAGE_DEFAULT,
                department: (document.getElementById("smd-edit-dept") || {}).value.trim(),
                mailbox_display_name: (document.getElementById("smd-edit-name") || {}).value.trim(),
                mail_address: mail,
                mail_account: mailAccountFromAddress(mail),
                password: (document.getElementById("smd-edit-pw") || {}).value.trim(),
                note: (document.getElementById("smd-edit-note") || {}).value || "",
              },
              {
                usage_type: 1,
                department: 1,
                mailbox_display_name: 1,
                mail_address: 1,
                mail_account: 1,
                password: 1,
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
                  alert("保存失敗: このメールアドレスは既に別の行で使われています。\n" + msg);
                } else {
                  alert("保存失敗: " + msg);
                }
              });
          },
        },
      ],
    );
    wireDisplayNameLabel(box, "smd-edit-usage", "smd-edit-name-wrap");
    var mailInput = box.querySelector("#smd-edit-mail");
    var acctInput = box.querySelector("#smd-edit-acct");
    var mailWarn = box.querySelector("#smd-edit-mail-warn");
    if (mailInput && acctInput) {
      mailInput.addEventListener("input", function () {
        var m = mailInput.value.trim().toLowerCase();
        acctInput.value = mailAccountFromAddress(m);
        if (mailWarn) {
          var e2 = validateMailAddress(m);
          mailWarn.innerHTML = e2
            ? '<p style="color:#b91c1c;font-size:12px">' + esc(e2) + "</p>"
            : "";
        }
      });
    }
  }

  function openRetireModal(row) {
    openModal(
      "廃止確認",
      "<p>メール: <strong>" +
        esc(row.mail_address) +
        "</strong></p><p>部署: " +
        esc(row.department) +
        "</p><p>ステータスを <strong>廃止</strong> にします。</p>",
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
    openModal(
      "削除確認",
      "<p>メール: <strong>" +
        esc(row.mail_address) +
        "</strong></p><p>このレコードを<strong>物理削除</strong>します（誤登録のみ）。</p>",
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

  function smdPrintStylesheet() {
    return (
      "*{box-sizing:border-box;}" +
      "body{margin:0;padding:20px;font-family:Meiryo,sans-serif;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}" +
      ".smdpr-page{max-width:800px;margin:0 auto 24px;page-break-after:always;}" +
      ".smdpr-hero{background:#dbeafe;padding:16px;border-radius:8px;margin-bottom:12px;}" +
      ".smdpr-hero h1{margin:0;font-size:18px;color:#1e3a8a;}" +
      ".smdpr-notice{margin:10px 0 0;padding:0;background:transparent;border:none;}" +
      ".smdpr-notice p{margin:0;font-size:12px;font-weight:600;line-height:1.65;color:#365f52;}" +
      ".smdpr-conn{background:#f0f9ff;border:1px solid #93c5fd;padding:10px 12px;margin-bottom:12px;border-radius:6px;}" +
      ".smdpr-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}" +
      ".smdpr-cell{border:1px solid #e2e8f0;padding:10px;border-radius:4px;}" +
      ".smdpr-lab{font-size:10px;color:#64748b;font-weight:bold;margin-bottom:4px;}" +
      ".smdpr-val{font-size:14px;font-weight:600;word-break:break-all;}" +
      "@media print{@page{size:A4 portrait;margin:7mm;}" +
      "body{padding:0;}" +
      ".smdpr-page{max-width:100%;margin:0;page-break-after:always;}" +
      ".smdpr-page:last-child{page-break-after:auto;}" +
      ".smdpr-hero{padding:12px 16px 10px;border-radius:0;}" +
      ".smdpr-hero h1{font-size:18pt;}" +
      ".smdpr-notice p{font-size:12pt;}" +
      ".smdpr-lab{font-size:11pt;}" +
      ".smdpr-val{font-size:13.5pt;}" +
      ".smdpr-conn{font-size:12pt;}}"
    );
  }

  function buildPrintPageHtml(row) {
    return (
      '<div class="smdpr-page">' +
      '<div class="smdpr-hero"><h1>' +
      esc(printHeroTitle(row.usage_type)) +
      "</h1>" +
      '<div class="smdpr-notice" role="note"><p>本紙は機密性の高い内容を含みます。</p></div>' +
      "<p>No." +
      esc(row.legacy_no) +
      " · " +
      esc(row.department) +
      "</p></div>" +
      '<div class="smdpr-conn"><strong>接続設定（共通）</strong><br>' +
      "SMTP " +
      esc(CONN.smtpServer) +
      ":" +
      esc(CONN.smtpPort) +
      " / POP " +
      esc(CONN.popServer) +
      ":" +
      esc(CONN.popPort) +
      "</div>" +
      '<div class="smdpr-grid">' +
      '<div class="smdpr-cell"><div class="smdpr-lab">' +
      esc(displayNameLabel(row.usage_type)) +
      '</div><div class="smdpr-val">' +
      esc(row.mailbox_display_name) +
      "</div></div>" +
      '<div class="smdpr-cell"><div class="smdpr-lab">利用種別</div><div class="smdpr-val">' +
      esc(row.usage_type) +
      "</div></div>" +
      '<div class="smdpr-cell"><div class="smdpr-lab">メールアドレス</div><div class="smdpr-val">' +
      esc(row.mail_address) +
      "</div></div>" +
      '<div class="smdpr-cell"><div class="smdpr-lab">メールアカウント</div><div class="smdpr-val">' +
      esc(row.mail_account) +
      "</div></div>" +
      '<div class="smdpr-cell" style="grid-column:1/-1"><div class="smdpr-lab">パスワード</div><div class="smdpr-val">' +
      esc(row.password) +
      "</div></div>" +
      "</div></div>"
    );
  }

  function printSelected() {
    var rows = state.records.filter(function (r) {
      return state.selected[r.id];
    });
    if (!rows.length) {
      alert("印刷する行にチェックを入れてください");
      return;
    }
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした");
      return;
    }
    w.opener = null;
    var pages = rows.map(buildPrintPageHtml).join("");
    w.document.write(
      "<!DOCTYPE html><html><head><meta charset=UTF-8><title>共有メール</title><style>" +
        smdPrintStylesheet() +
        "</style></head><body>" +
        pages +
        "</body></html>",
    );
    w.document.close();
    w.focus();
    setTimeout(function () {
      try {
        w.print();
      } catch (e) {
        console.warn(BUILD, e);
      }
    }, 400);
  }

  function renderTable() {
    var tbody = document.getElementById("smd-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="11">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="11">該当なし（条件を変えるか「条件クリア」）</td></tr>';
      updateSearchSummary();
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        return (
          '<tr class="' +
          rowClasses(r) +
          '" data-id="' +
          esc(r.id) +
          '">' +
          '<td><input type="checkbox" class="smd-check" data-id="' +
          esc(r.id) +
          '"' +
          (state.selected[r.id] ? " checked" : "") +
          "></td>" +
          "<td>" +
          esc(r.legacy_no) +
          "</td>" +
          "<td>" +
          statusPillHtml(r.status) +
          "</td>" +
          "<td>" +
          esc(r.department) +
          "</td>" +
          "<td>" +
          esc(r.mailbox_display_name) +
          "</td>" +
          "<td>" +
          copySpanHtml(r.mail_address) +
          "</td>" +
          "<td>" +
          copySpanHtml(r.mail_account) +
          "</td>" +
          "<td>" +
          copySpanHtml(r.password) +
          "</td>" +
          "<td>" +
          esc(r.usage_type) +
          "</td>" +
          '<td class="smd-actions">' +
          '<button type="button" class="smd-btn-edit">編集</button>' +
          (r.status === STATUS_ACTIVE
            ? '<button type="button" class="smd-btn-retire">廃止</button>'
            : "") +
          '<button type="button" class="smd-btn-del">削除</button>' +
          "</td></tr>"
        );
      })
      .join("");

    tbody.querySelectorAll(".smd-check").forEach(function (cb) {
      cb.addEventListener("change", function () {
        state.selected[cb.getAttribute("data-id")] = cb.checked;
      });
    });
    tbody.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      var row = state.records.find(function (x) {
        return x.id === id;
      });
      if (!row) return;
      tr.querySelector(".smd-btn-edit").addEventListener("click", function () {
        openEditModal(row);
      });
      var rb = tr.querySelector(".smd-btn-retire");
      if (rb) rb.addEventListener("click", function () {
        openRetireModal(row);
      });
      tr.querySelector(".smd-btn-del").addEventListener("click", function () {
        openDeleteModal(row);
      });
    });
    updateSearchSummary();
  }

  function wireSearchPanel() {
    var search = document.getElementById("smd-search");
    if (search) {
      search.addEventListener("input", function () {
        state.search = search.value;
        updateSearchDatalist(state.search);
        applySearchAndRender();
      });
    }
    var deptSel = document.getElementById("smd-dept-filter");
    if (deptSel) {
      deptSel.addEventListener("change", function () {
        state.departmentFilter = deptSel.value || "";
        applySearchAndRender();
      });
    }
    document.querySelectorAll(".smd-chip-status").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var st = btn.getAttribute("data-status");
        if (st === STATUS_ACTIVE) state.statusFilter.active = !state.statusFilter.active;
        if (st === STATUS_RETIRED) state.statusFilter.retired = !state.statusFilter.retired;
        syncChipUi();
        applySearchAndRender();
      });
    });
    document.querySelectorAll(".smd-chip-usage").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ut = btn.getAttribute("data-usage");
        if (ut === "共有メールアドレス") state.usageFilter.shared = !state.usageFilter.shared;
        if (ut === "個人メールアドレス") state.usageFilter.personal = !state.usageFilter.personal;
        syncChipUi();
        applySearchAndRender();
      });
    });
    var clearBtn = document.getElementById("smd-clear");
    if (clearBtn) clearBtn.addEventListener("click", clearSearchFilters);
    restoreSearchFromUrl();
    refreshDeptFilterOptions();
    updateSearchSummary();
  }

  function buildShell() {
    if (document.getElementById("smd-root")) return;
    injectCss();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "smd-root";
    root.className = "smd-root";
    root.innerHTML =
      '<div class="smd-toolbar">' +
      '<span class="smd-toolbar-title">メールアドレス管理台帳</span>' +
      '<fieldset class="smd-toolbar-group smd-toolbar-group--a">' +
      "<legend>再読込・登録</legend>" +
      '<div class="smd-toolbar-group-inner">' +
      '<button type="button" id="smd-reload" class="kintoneplugin-button-normal">再読込</button>' +
      '<button type="button" id="smd-new" class="kintoneplugin-button-dialog-ok">新規登録</button>' +
      "</div></fieldset>" +
      '<fieldset class="smd-toolbar-group smd-toolbar-group--c">' +
      "<legend>印刷</legend>" +
      '<div class="smd-toolbar-group-inner">' +
      '<button type="button" id="smd-print" class="kintoneplugin-button-normal">印刷</button>' +
      "</div></fieldset>" +
      "</div>" +
      connectionPanelHtml() +
      '<div class="smd-search-panel" id="smd-search-panel">' +
      '<div class="smd-search-title">キーワード・種別・状態・部署で絞り込み</div>' +
      '<div class="smd-search-row">' +
      '<input type="search" id="smd-search" list="' +
      SEARCH_DL_ID +
      '" placeholder="メール・部署・表示名・アカウント・No.・メモ（空白区切りでAND）" autocomplete="off">' +
      '<datalist id="' +
      SEARCH_DL_ID +
      '"></datalist>' +
      '<select id="smd-dept-filter" aria-label="利用部署で絞り込み"><option value="">すべての部署</option></select>' +
      '<button type="button" id="smd-clear" class="kintoneplugin-button-normal">条件クリア</button>' +
      "</div>" +
      '<div class="smd-search-chips">' +
      '<span class="smd-chip-label">状態</span>' +
      '<button type="button" class="smd-chip smd-chip-status on" data-status="' +
      esc(STATUS_ACTIVE) +
      '">利用中</button>' +
      '<button type="button" class="smd-chip smd-chip-status" data-status="' +
      esc(STATUS_RETIRED) +
      '">廃止</button>' +
      '<span class="smd-chip-label" style="margin-left:8px">種別</span>' +
      '<button type="button" class="smd-chip smd-chip-usage" data-usage="共有メールアドレス">共有</button>' +
      '<button type="button" class="smd-chip smd-chip-usage" data-usage="個人メールアドレス">個人</button>' +
      "</div>" +
      '<div id="smd-search-summary" class="smd-search-summary"></div>' +
      "</div>" +
      '<div id="smd-meta" class="smd-meta"></div>' +
      '<div class="smd-table-wrap"><table class="smd-table"><thead><tr>' +
      "<th></th>" +
      SORT_COLUMNS.map(function (c) {
        return (
          '<th class="smd-sort" data-sort="' +
          esc(c.key) +
          '">' +
          esc(c.label) +
          "</th>"
        );
      }).join("") +
      "<th>操作</th>" +
      '</tr></thead><tbody id="smd-tbody"></tbody></table></div>';
    host.appendChild(root);

    document.getElementById("smd-reload").addEventListener("click", reloadRecords);
    document.getElementById("smd-new").addEventListener("click", openNewModal);
    document.getElementById("smd-print").addEventListener("click", printSelected);
    root.addEventListener("click", function (ev) {
      var el = ev.target.closest(".smd-copy");
      if (!el || !root.contains(el)) return;
      copyText(el.getAttribute("data-copy") || "");
    });
    wireSearchPanel();

    root.querySelector(".smd-table thead").addEventListener("click", function (ev) {
      var th = ev.target.closest("th.smd-sort");
      if (!th) return;
      var key = th.getAttribute("data-sort");
      if (!key) return;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = key === "legacy_no" ? "desc" : "asc";
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
    scheduleMount();
    return ev;
  });
})();
