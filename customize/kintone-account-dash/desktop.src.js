(function () {
  "use strict";

  /** Kintoneアカウント管理台帳 — DB REST CRUD + アカウント集計（現時点）+ 月次利用費用 + 一覧出力 */
  var BUILD = "2026-07-05-kintone-account-dash-v19-agg-100rem-list-sort";
  var APP_DB = 752;
  var APP_EMP_MASTER = 595;
  var PAGE_SIZE = 100;

  var ORGS = [
  "本社",
  "東北支店",
  "関越支店",
  "東京支店",
  "東海支店",
  "リフォーム事業統括部",
  "鉄構支店",
  "湾岸工事所",
  "ブリッジニアプラス"
];

  var DEPTS_BY_ORG = {
  "本社": [
    "役員室",
    "総務部",
    "経理部",
    "経営企画部",
    "人事研修部",
    "安全推進部",
    "施工推進部",
    "メンテナンス技術部",
    "塗装技術部",
    "品質管理部"
  ],
  "東北支店": [
    "東北支店",
    "秋田営業所",
    "盛岡営業所",
    "仙台営業所"
  ],
  "関越支店": [
    "関越支店",
    "新潟営業所",
    "長野営業所",
    "高崎営業所"
  ],
  "東京支店": [
    "東京支店",
    "千葉営業所",
    "水戸営業所",
    "鎌ヶ谷事務所"
  ],
  "東海支店": [
    "東海支店",
    "東京営業所",
    "静岡営業所",
    "名古屋営業所",
    "関西営業所"
  ],
  "リフォーム事業統括部": [
    "リフォーム事業統括部",
    "札幌支店",
    "首都圏支店"
  ],
  "鉄構支店": [
    "鉄構支店"
  ],
  "湾岸工事所": [
    "湾岸工事所"
  ],
  "ブリッジニアプラス": [
    "ブリッジニアプラス"
  ]
};

  var DEPTS = [
  "役員室",
  "総務部",
  "経理部",
  "経営企画部",
  "人事研修部",
  "安全推進部",
  "施工推進部",
  "メンテナンス技術部",
  "塗装技術部",
  "品質管理部",
  "東北支店",
  "秋田営業所",
  "盛岡営業所",
  "仙台営業所",
  "関越支店",
  "新潟営業所",
  "長野営業所",
  "高崎営業所",
  "東京支店",
  "千葉営業所",
  "水戸営業所",
  "鎌ヶ谷事務所",
  "東海支店",
  "東京営業所",
  "静岡営業所",
  "名古屋営業所",
  "関西営業所",
  "リフォーム事業統括部",
  "札幌支店",
  "首都圏支店",
  "鉄構支店",
  "湾岸工事所",
  "ブリッジニアプラス"
];

  var PAY_SITES = ["本社", "首都圏支店"];

  var ACCOUNT_TYPES = ["特権アカウント", "本社共有", "本社個人", "首都圏支店個人"];

  var PAY_SITE_BY_TYPE = {
    特権アカウント: "本社",
    本社共有: "本社",
    本社個人: "本社",
    首都圏支店個人: "首都圏支店",
  };

  var SETTINGS_LS_KEY = "kintone-account-ledger-settings-v2";
  var SETTINGS_LS_KEY_V1 = "kintone-account-ledger-settings-v1";

  var DEFAULT_SETTINGS = { contract_total: 77, unit_price_monthly: 1800 };

  var FC = {
    pay_site: "pay_site",
    account_type: "account_type",
    org: "org",
    dept: "dept",
    display_name: "display_name",
    login_name: "login_name",
    login_id: "login_id",
    status: "status",
    start_date: "start_date",
    end_date: "end_date",
    note: "note",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.pay_site,
    FC.account_type,
    FC.org,
    FC.dept,
    FC.display_name,
    FC.login_name,
    FC.login_id,
    FC.status,
    FC.start_date,
    FC.end_date,
    FC.note,
  ];

  var LIST_COLUMNS = [
    { key: "pay_site", label: "支払箇所" },
    { key: "account_type", label: "アカウント種別" },
    { key: "org", label: "所属グループ" },
    { key: "dept", label: "所属" },
    { key: "display_name", label: "表示名" },
    { key: "login_name", label: "ログイン名" },
    { key: "login_id", label: "ログインID" },
    { key: "status", label: "ステータス" },
    { key: "start_date", label: "利用開始日" },
    { key: "end_date", label: "利用終了日" },
  ];

  var LIST_EXPORT_COLUMNS = LIST_COLUMNS.slice();

  var state = {
    records: [],
    search: "",
    lifecycleFilter: "active",
    loading: false,
    isAdmin: false,
    aggMonths: [],
    aggRows: [],
    aggSummary: "",
    feeAggRows: [],
    feeAggSummaryRows: [],
    feeAggDetailRows: [],
    feeAggMonths: [],
    feeSettingsDraft: null,
    feeSettingsDraftPeriod: "",
    settings: loadSettings(),
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

  function currentJstYm() {
    return todayJstYmd().slice(0, 7);
  }

  function currentJstYear() {
    return todayJstYmd().slice(0, 4);
  }

  function normalizeFeeParams(raw) {
    return {
      contract_total: Math.max(0, Number(raw && raw.contract_total) || DEFAULT_SETTINGS.contract_total),
      unit_price_monthly: Math.max(
        0,
        Number(raw && raw.unit_price_monthly) || DEFAULT_SETTINGS.unit_price_monthly,
      ),
    };
  }

  function loadSettings() {
    function parseKey(key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.warn(BUILD, e);
        return null;
      }
    }

    var parsed = parseKey(SETTINGS_LS_KEY);
    if (parsed && parsed.defaults) {
      var monthly = {};
      if (parsed.monthly && typeof parsed.monthly === "object") {
        Object.keys(parsed.monthly).forEach(function (ym) {
          monthly[ym] = normalizeFeeParams(parsed.monthly[ym]);
        });
      }
      return {
        defaults: normalizeFeeParams(parsed.defaults),
        monthly: monthly,
      };
    }

    var legacy = parseKey(SETTINGS_LS_KEY_V1);
    if (legacy && (legacy.contract_total != null || legacy.unit_price_monthly != null)) {
      return {
        defaults: normalizeFeeParams(legacy),
        monthly: {},
      };
    }

    return {
      defaults: normalizeFeeParams(DEFAULT_SETTINGS),
      monthly: {},
    };
  }

  function persistSettings() {
    try {
      localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(state.settings));
    } catch (e) {
      console.warn(BUILD, e);
    }
  }

  function getMonthFeeParams(ym) {
    var m = state.settings.monthly && state.settings.monthly[ym];
    if (m) return normalizeFeeParams(m);
    return normalizeFeeParams(state.settings.defaults);
  }

  function setMonthFeeParams(ym, next) {
    if (!state.settings.monthly) state.settings.monthly = {};
    state.settings.monthly[ym] = normalizeFeeParams(next);
    persistSettings();
  }

  function saveDefaults(next) {
    state.settings.defaults = normalizeFeeParams(next);
    persistSettings();
  }

  function resetFeeSettingsDraft() {
    state.feeSettingsDraft = null;
    state.feeSettingsDraftPeriod = "";
  }

  function ensureFeeSettingsDraft() {
    if (!state.feeSettingsDraft) {
      var monthly = {};
      Object.keys(state.settings.monthly || {}).forEach(function (ym) {
        monthly[ym] = normalizeFeeParams(state.settings.monthly[ym]);
      });
      state.feeSettingsDraft = {
        defaults: normalizeFeeParams(state.settings.defaults),
        monthly: monthly,
      };
    }
    return state.feeSettingsDraft;
  }

  function getMonthFeeParamsDraft(ym) {
    var d = ensureFeeSettingsDraft();
    if (d.monthly[ym]) return normalizeFeeParams(d.monthly[ym]);
    return normalizeFeeParams(d.defaults);
  }

  function fmtYmJa(ym) {
    var p = parseYm(ym);
    if (!p) return String(ym || "");
    return p.y + "年" + p.m + "月";
  }

  function ymFromYearMonth(y, m) {
    var yn = Number(y);
    var mn = Number(m);
    if (!yn || !mn || mn < 1 || mn > 12) return "";
    return yn + "-" + String(mn).padStart(2, "0");
  }

  function defaultBulkFromYm(months) {
    var cur = currentJstYm();
    if (months.indexOf(cur) >= 0) return cur;
    return months.length ? months[0] : cur;
  }

  function applyFeeBulkFromMonth(fromYm, contract, price, months) {
    var d = ensureFeeSettingsDraft();
    var params = normalizeFeeParams({
      contract_total: contract,
      unit_price_monthly: price,
    });
    months.forEach(function (ym) {
      if (ym >= fromYm) {
        d.monthly[ym] = params;
      }
    });
  }

  function commitFeeSettingsFromPanel(months) {
    var d = ensureFeeSettingsDraft();
    state.settings.monthly = {};
    Object.keys(d.monthly).forEach(function (ym) {
      state.settings.monthly[ym] = d.monthly[ym];
    });
    persistSettings();
    resetFeeSettingsDraft();
    renderSummaryPanel();
    renderFeeSettingsPanel();
    recalcFeeAgg({ silent: true });
  }

  function saveMonthlyParamsFromForm(months) {
    commitFeeSettingsFromPanel(months);
  }

  function countActiveByPaySiteMonth(paySite, ym) {
    var n = 0;
    state.records.forEach(function (r) {
      if (String(r.pay_site || "").trim() !== paySite) return;
      if (isActiveAtMonthEnd(r, ym)) n += 1;
    });
    return n;
  }

  function countTotalActiveMonth(ym) {
    var n = 0;
    state.records.forEach(function (r) {
      if (isActiveAtMonthEnd(r, ym)) n += 1;
    });
    return n;
  }

  function currentMonthUsageStats() {
    var ym = currentJstYm();
    var params = getMonthFeeParams(ym);
    var honshaUse = countActiveByPaySiteMonth("本社", ym);
    var shutokenUse = countActiveByPaySiteMonth("首都圏支店", ym);
    var totalActive = countTotalActiveMonth(ym);
    var surplus = Math.max(0, params.contract_total - totalActive);
    var honshaSubtotal = honshaUse + surplus;
    return {
      ym: ym,
      params: params,
      honshaUse: honshaUse,
      shutokenUse: shutokenUse,
      totalActive: totalActive,
      surplus: surplus,
      honshaSubtotal: honshaSubtotal,
      shutokenSubtotal: shutokenUse,
      grandTotal: honshaSubtotal + shutokenUse,
      monthlyTotal: params.contract_total * params.unit_price_monthly,
      honshaFee: honshaSubtotal * params.unit_price_monthly,
      shutokenFee: shutokenUse * params.unit_price_monthly,
    };
  }

  function fmtYen(n) {
    return Number(n || 0).toLocaleString("ja-JP") + " 円";
  }

  function countsToYenPerMonth(counts, months) {
    return (counts || []).map(function (n, i) {
      var p = getMonthFeeParams(months[i]);
      return Number(n) * p.unit_price_monthly;
    });
  }

  /** 集計既定: 当年 1月～12月（JST） */
  function defaultAggYearRange() {
    var y = currentJstYear();
    return { fromYm: y + "-01", toYm: y + "-12" };
  }

  function val(rec, code) {
    return rec && rec[code] && rec[code].value != null ? String(rec[code].value) : "";
  }

  function flatten(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      pay_site: val(rec, FC.pay_site),
      account_type: val(rec, FC.account_type),
      org: val(rec, FC.org),
      dept: val(rec, FC.dept),
      display_name: val(rec, FC.display_name),
      login_name: val(rec, FC.login_name),
      login_id: val(rec, FC.login_id),
      status: val(rec, FC.status),
      start_date: val(rec, FC.start_date),
      end_date: val(rec, FC.end_date),
      note: val(rec, FC.note),
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

  function orgRank(org) {
    var idx = ORGS.indexOf(String(org || "").trim());
    return idx < 0 ? 999 : idx;
  }

  function deptRank(dept) {
    var idx = DEPTS.indexOf(String(dept || "").trim());
    return idx < 0 ? 999 : idx;
  }

  /** 部署「－」かつ所属が××支店 → 表示は所属組織名（例: 東京支店） */
  function formatDeptLabel(org, dept) {
    return String(dept || "").trim();
  }

  function listFieldDisplay(row, key) {
    if (key === "dept") return formatDeptLabel(row.org, row.dept);
    return row[key] != null ? String(row[key]) : "";
  }

  function normalizeSearchText(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\u3000/g, " ")
      .replace(/\s+/g, " ");
  }

  /** 一覧キーワード検索用 — 所属・部署の単独／結合表現を含める */
  function buildRecordSearchHaystack(row) {
    var org = String(row.org || "").trim();
    var dept = String(row.dept || "").trim();
    var parts = [
      row.login_id,
      row.display_name,
      row.login_name,
      row.pay_site,
      row.account_type,
      row.status,
      org,
      dept,
      row.note,
    ];
    if (org && dept) {
      parts.push(org + " " + dept, org + dept, org + " / " + dept, org + "・" + dept, org + "／" + dept);
    }
    return normalizeSearchText(parts.join(" "));
  }

  function recordMatchesSearch(row, query) {
    var hay = buildRecordSearchHaystack(row);
    var tokens = normalizeSearchText(query).split(" ").filter(function (t) {
      return t.length > 0;
    });
    if (!tokens.length) return true;
    return tokens.every(function (token) {
      return hay.indexOf(token) >= 0;
    });
  }

  function deptRankInOrg(org, dept) {
    var list = DEPTS_BY_ORG[String(org || "").trim()] || [];
    var idx = list.indexOf(String(dept || "").trim());
    return idx < 0 ? 999 : idx;
  }

  var REFORM_ORG = "リフォーム事業統括部";
  var HONSHA_ORG = "本社";

  function isPrivilegeAdminRow(row) {
    var login = normalizeLoginId(row.login_id).toLowerCase();
    if (login === "admin") return true;
    return String(row.account_type || "").trim() === "特権アカウント";
  }

  function accountTypeRankForList(row) {
    var org = String(row.org || "").trim();
    var t = String(row.account_type || "").trim();
    if (org === HONSHA_ORG) {
      if (isPrivilegeAdminRow(row)) return 0;
      if (t === "本社個人") return 1;
      if (t === "本社共有") return 2;
      return 3;
    }
    if (isPrivilegeAdminRow(row)) return 0;
    if (t === "本社個人" || t === "首都圏支店個人") return 1;
    if (t === "本社共有") return 2;
    return 3;
  }

  function reformPayGroup(row) {
    if (String(row.org || "").trim() !== REFORM_ORG) return null;
    return String(row.pay_site || "").trim() === "首都圏支店" ? "shutoken" : "honsha";
  }

  function listSectionKey(row) {
    var org = String(row.org || "").trim();
    var group = reformPayGroup(row);
    if (group) return REFORM_ORG + ":" + group;
    return org;
  }

  function listSectionLabel(row) {
    var group = reformPayGroup(row);
    if (group === "honsha") return REFORM_ORG + "（本社分）";
    if (group === "shutoken") return REFORM_ORG + "（首都圏支店分）";
    return String(row.org || "").trim();
  }

  function paySiteRankForList(org, paySite) {
    if (String(org || "").trim() !== REFORM_ORG) return 0;
    var ps = String(paySite || "").trim();
    if (ps === "本社") return 0;
    if (ps === "首都圏支店") return 1;
    return 2;
  }

  /** 一覧 — 所属グループ →（リフォームのみ支払箇所）→ 本社は所属→種別(個人→共有)、他は種別(特権→個人→共有)→所属 → ログインID */
  function compareListRows(a, b) {
    var orgDiff = orgRank(a.org) - orgRank(b.org);
    if (orgDiff !== 0) return orgDiff;
    var payDiff = paySiteRankForList(a.org, a.pay_site) - paySiteRankForList(b.org, b.pay_site);
    if (payDiff !== 0) return payDiff;
    var honshaBlock = String(a.org || "").trim() === HONSHA_ORG;
    if (honshaBlock) {
      var deptDiffH = deptRankInOrg(a.org, a.dept) - deptRankInOrg(b.org, b.dept);
      if (deptDiffH !== 0) return deptDiffH;
      var typeDiffH = accountTypeRankForList(a) - accountTypeRankForList(b);
      if (typeDiffH !== 0) return typeDiffH;
    } else {
      var typeDiff = accountTypeRankForList(a) - accountTypeRankForList(b);
      if (typeDiff !== 0) return typeDiff;
      var deptDiff = deptRankInOrg(a.org, a.dept) - deptRankInOrg(b.org, b.dept);
      if (deptDiff !== 0) return deptDiff;
    }
    return String(a.login_id || "").localeCompare(String(b.login_id || ""), "ja");
  }

  function normalizeLoginId(s) {
    return String(s || "").trim();
  }

  function isTerminatedRow(row) {
    return String(row.status || "").trim() === "終了" || !!String(row.end_date || "").trim();
  }

  function isActiveRow(row) {
    return !isTerminatedRow(row);
  }

  function monthEndYmd(ym) {
    var parts = String(ym || "").split("-");
    if (parts.length !== 2) return "";
    var y = Number(parts[0]);
    var m = Number(parts[1]);
    if (!y || !m || m < 1 || m > 12) return "";
    var last = new Date(y, m, 0).getDate();
    return parts[0] + "-" + parts[1] + "-" + String(last).padStart(2, "0");
  }

  function parseYm(ym) {
    var parts = String(ym || "").split("-");
    if (parts.length !== 2) return null;
    var y = Number(parts[0]);
    var m = Number(parts[1]);
    if (!y || !m || m < 1 || m > 12) return null;
    return { y: y, m: m };
  }

  function enumerateMonths(fromYm, toYm) {
    var from = parseYm(fromYm);
    var to = parseYm(toYm);
    if (!from || !to) return [];
    var curY = from.y;
    var curM = from.m;
    var endY = to.y;
    var endM = to.m;
    if (curY > endY || (curY === endY && curM > endM)) {
      return [];
    }
    var list = [];
    while (curY < endY || (curY === endY && curM <= endM)) {
      list.push(curY + "-" + String(curM).padStart(2, "0"));
      curM += 1;
      if (curM > 12) {
        curM = 1;
        curY += 1;
      }
    }
    return list;
  }

  function isActiveAtMonthEnd(row, ym) {
    var M = monthEndYmd(ym);
    if (!M) return false;
    var start = String(row.start_date || "").trim();
    var end = String(row.end_date || "").trim();
    if (!start || start > M) return false;
    if (!end) return true;
    return end > M;
  }

  function countOrgDeptMonth(org, dept, ym) {
    var n = 0;
    state.records.forEach(function (r) {
      if (r.org !== org || r.dept !== dept) return;
      if (isActiveAtMonthEnd(r, ym)) n += 1;
    });
    return n;
  }

  function countOrgDeptsMonth(org, depts, ym) {
    var deptSet = {};
    depts.forEach(function (d) {
      deptSet[d] = true;
    });
    var n = 0;
    state.records.forEach(function (r) {
      if (r.org !== org || !deptSet[r.dept]) return;
      if (isActiveAtMonthEnd(r, ym)) n += 1;
    });
    return n;
  }

  function countGrandFiltered(orgs, depts, ym) {
    var orgSet = {};
    orgs.forEach(function (o) {
      orgSet[o] = true;
    });
    var deptSet = {};
    depts.forEach(function (d) {
      deptSet[d] = true;
    });
    var n = 0;
    state.records.forEach(function (r) {
      if (!orgSet[r.org] || !deptSet[r.dept]) return;
      if (isActiveAtMonthEnd(r, ym)) n += 1;
    });
    return n;
  }

  function countOrgDeptActive(org, dept) {
    var n = 0;
    state.records.forEach(function (r) {
      if (r.org !== org || r.dept !== dept) return;
      if (isActiveRow(r)) n += 1;
    });
    return n;
  }

  function countOrgDeptsActive(org, depts) {
    var deptSet = {};
    depts.forEach(function (d) {
      deptSet[d] = true;
    });
    var n = 0;
    state.records.forEach(function (r) {
      if (r.org !== org || !deptSet[r.dept]) return;
      if (isActiveRow(r)) n += 1;
    });
    return n;
  }

  function countGrandActiveFiltered(orgs, depts) {
    var orgSet = {};
    orgs.forEach(function (o) {
      orgSet[o] = true;
    });
    var deptSet = {};
    depts.forEach(function (d) {
      deptSet[d] = true;
    });
    var n = 0;
    state.records.forEach(function (r) {
      if (!orgSet[r.org] || !deptSet[r.dept]) return;
      if (isActiveRow(r)) n += 1;
    });
    return n;
  }

  function orderedAggOrgs(selected) {
    var set = {};
    selected.forEach(function (o) {
      set[o] = true;
    });
    return ORGS.filter(function (o) {
      return set[o];
    });
  }

  function orderedAggDepts(selected) {
    var set = {};
    selected.forEach(function (d) {
      set[d] = true;
    });
    return DEPTS.filter(function (d) {
      return set[d];
    });
  }

  function selectedMultiSelectValues(selectEl) {
    if (!selectEl) return [];
    return Array.prototype.slice.call(selectEl.selectedOptions).map(function (o) {
      return o.value;
    });
  }

  function setMultiSelectAll(selectEl, on) {
    if (!selectEl) return;
    Array.prototype.slice.call(selectEl.options).forEach(function (o) {
      o.selected = !!on;
    });
  }

  /** 集計絞込 — コンパクト chip（multi-select より省スペース） */
  function aggChipBarHtml(values, allActive) {
    return values
      .map(function (v) {
        return (
          '<button type="button" class="kac-agg-chip' +
          (allActive ? " active" : "") +
          '" data-value="' +
          esc(v) +
          '">' +
          esc(v) +
          "</button>"
        );
      })
      .join("");
  }

  function selectedAggChipValues(containerEl) {
    if (!containerEl) return [];
    return Array.prototype.slice
      .call(containerEl.querySelectorAll(".kac-agg-chip.active"))
      .map(function (btn) {
        return btn.getAttribute("data-value") || "";
      })
      .filter(function (v) {
        return v;
      });
  }

  function setAggChipsAll(containerEl, on) {
    if (!containerEl) return;
    containerEl.querySelectorAll(".kac-agg-chip").forEach(function (btn) {
      btn.classList.toggle("active", !!on);
    });
  }

  function wireAggChipBar(containerEl) {
    if (!containerEl) return;
    containerEl.querySelectorAll(".kac-agg-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.classList.toggle("active");
      });
    });
  }

  function clearAggConditions() {
    setAggChipsAll(document.getElementById("kac-agg-org"), true);
    setAggChipsAll(document.getElementById("kac-agg-dept"), true);
    recalcAgg();
  }

  function toKintoneRecord(row) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
      else if (code === FC.end_date || code === FC.note) {
        o[code] = { value: v || "" };
      }
    }
    set(FC.pay_site, row.pay_site);
    set(FC.account_type, row.account_type);
    set(FC.org, row.org);
    set(FC.dept, row.dept);
    set(FC.display_name, row.display_name);
    set(FC.login_name, row.login_name);
    set(FC.login_id, row.login_id);
    set(FC.status, row.status);
    set(FC.start_date, row.start_date);
    set(FC.end_date, row.end_date);
    set(FC.note, row.note);
    return o;
  }

  function fetchAllRecords() {
    var all = [];
    var offset = 0;
    function page() {
      var query = "order by login_id asc limit " + PAGE_SIZE + " offset " + offset;
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

  function checkDuplicateLoginId(loginId, excludeId) {
    var id = normalizeLoginId(loginId);
    for (var i = 0; i < state.records.length; i++) {
      var r = state.records[i];
      if (excludeId && r.id === excludeId) continue;
      if (normalizeLoginId(r.login_id) === id) {
        throw new Error("ログインID「" + loginId + "」は既に登録されています");
      }
    }
  }

  function validateRow(row, isNew) {
    var loginId = String(row.login_id || "").trim();
    var displayName = String(row.display_name || "").trim();
    var loginName = String(row.login_name || "").trim();
    var org = String(row.org || "").trim();
    var dept = String(row.dept || "").trim();
    var accountType = String(row.account_type || "").trim();
    var paySite = String(row.pay_site || "").trim();
    var startDate = String(row.start_date || "").trim();
    var endDate = String(row.end_date || "").trim();

    if (!loginId) throw new Error("ログインIDは必須です");
    if (!displayName) throw new Error("表示名は必須です");
    if (!loginName) throw new Error("ログイン名は必須です");
    if (!org) throw new Error("所属グループは必須です");
    if (!dept) throw new Error("所属は必須です");
    if (!accountType) throw new Error("アカウント種別は必須です");
    if (!paySite) throw new Error("支払箇所は必須です");
    if (!startDate) throw new Error("利用開始日は必須です");
    if (endDate && endDate < startDate) {
      throw new Error("利用終了日は利用開始日以降にしてください");
    }
    var allowedDepts = DEPTS_BY_ORG[org] || [];
    if (allowedDepts.indexOf(dept) < 0) {
      throw new Error("所属「" + dept + "」は所属グループ「" + org + "」に存在しません");
    }
    if (isNew) checkDuplicateLoginId(loginId, null);
  }

  function searchEmployees595(keyword, limit) {
    var k = String(keyword || "").trim();
    if (!k) return Promise.resolve([]);
    var lim = Math.min(Math.max(Number(limit) || 12, 1), 25);
    var q =
      'user_name like "' +
      escapeQueryValue(k) +
      '" and employment_status not in ("退職") order by user_name asc limit ' +
      lim;
    return apiGet("/k/v1/records.json", {
      app: APP_EMP_MASTER,
      query: q,
      fields: ["user_name", "dept_name", "group_name", "employment_status", "mail"],
    }).then(function (resp) {
      return resp.records || [];
    });
  }

  function setCreate595Picked(picked) {
    var el = document.getElementById("kac-create-595-picked");
    if (el) el.value = picked ? "1" : "";
  }

  function isCreate595Picked() {
    var el = document.getElementById("kac-create-595-picked");
    return el && el.value === "1";
  }

  function open595SearchModal(onPick) {
    var existing = document.getElementById("kac-595-modal-root");
    if (existing) existing.remove();
    var bg = document.createElement("div");
    bg.id = "kac-595-modal-root";
    bg.className = "kac-modal-bg";
    bg.innerHTML =
      '<div class="kac-modal kac-595-modal" role="dialog">' +
      "<h3>社員名検索（595）</h3>" +
      '<label>検索<input type="search" id="kac-595-q" placeholder="氏名の一部"></label>' +
      '<div class="kac-595-actions">' +
      '<button type="button" id="kac-595-run" class="kintoneplugin-button-normal">検索</button>' +
      '<button type="button" id="kac-595-clear" class="kintoneplugin-button-normal">クリア</button>' +
      '<button type="button" id="kac-595-cancel" class="kintoneplugin-button-normal">キャンセル</button>' +
      "</div>" +
      '<div id="kac-595-results" class="kac-595-results"></div></div>';
    document.body.appendChild(bg);

    function renderResults(rows) {
      var box = document.getElementById("kac-595-results");
      if (!box) return;
      if (!rows.length) {
        box.innerHTML = '<p class="kac-hint">該当なし</p>';
        return;
      }
      box.innerHTML = rows
        .map(function (rec, i) {
          var name = val(rec, "user_name");
          var group = val(rec, "group_name");
          var mail = val(rec, "mail");
          return (
            '<button type="button" class="kac-595-pick kintoneplugin-button-normal" data-i="' +
            i +
            '">' +
            esc(name) +
            " / " +
            esc(group || "—") +
            " / " +
            esc(mail || "—") +
            "</button>"
          );
        })
        .join("");
      box.querySelectorAll(".kac-595-pick").forEach(function (btn) {
        btn.onclick = function () {
          var idx = Number(btn.getAttribute("data-i"));
          if (rows[idx]) {
            onPick(rows[idx]);
            bg.remove();
          }
        };
      });
    }

    function runSearch() {
      var kw = document.getElementById("kac-595-q").value.trim();
      if (!kw) {
        alert("検索キーワードを入力してください");
        return;
      }
      searchEmployees595(kw, 25)
        .then(renderResults)
        .catch(function (e) {
          alert("595 検索失敗: " + formatKintoneApiError(e));
        });
    }

    bg.querySelector("#kac-595-run").onclick = runSearch;
    bg.querySelector("#kac-595-clear").onclick = function () {
      var qEl = document.getElementById("kac-595-q");
      var box = document.getElementById("kac-595-results");
      if (qEl) qEl.value = "";
      if (box) box.innerHTML = "";
      if (qEl) qEl.focus();
    };
    bg.querySelector("#kac-595-cancel").onclick = function () {
      bg.remove();
    };
    bg.querySelector("#kac-595-q").onkeydown = function (e) {
      if (e.key === "Enter") runSearch();
    };
    bg.addEventListener("click", function (ev) {
      if (ev.target === bg) bg.remove();
    });
    setTimeout(function () {
      var q = document.getElementById("kac-595-q");
      if (q) q.focus();
    }, 0);
  }

  function apply595PickToForm(empRow) {
    var displayEl = document.getElementById("kac-f-display-name");
    var loginNameEl = document.getElementById("kac-f-login-name");
    if (!displayEl || !loginNameEl) return;
    var userName = val(empRow, "user_name").trim();
    displayEl.value = userName;
    loginNameEl.value = userName;
    setCreate595Picked(true);
  }

  function orgOptionsHtml(selected) {
    return (
      '<option value="">—</option>' +
      ORGS.map(function (o) {
        return (
          '<option value="' +
          esc(o) +
          '"' +
          (selected === o ? " selected" : "") +
          ">" +
          esc(o) +
          "</option>"
        );
      }).join("")
    );
  }

  function deptOptionsHtml(selected, org) {
    var list = DEPTS_BY_ORG[String(org || "").trim()] || [];
    if (!list.length) {
      return '<option value="">—</option>';
    }
    return list
      .map(function (d) {
        return (
          '<option value="' +
          esc(d) +
          '"' +
          (selected === d ? " selected" : "") +
          ">" +
          esc(d) +
          "</option>"
        );
      })
      .join("");
  }

  function accountTypeOptionsHtml(selected) {
    return (
      '<option value="">—</option>' +
      ACCOUNT_TYPES.map(function (t) {
        return (
          '<option value="' +
          esc(t) +
          '"' +
          (selected === t ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>"
        );
      }).join("")
    );
  }

  function paySiteOptionsHtml(selected) {
    return PAY_SITES.map(function (p) {
      return (
        '<option value="' +
        esc(p) +
        '"' +
        (selected === p ? " selected" : "") +
        ">" +
        esc(p) +
        "</option>"
      );
    }).join("");
  }

  function multiSelectOptionsHtml(values, selectedAll) {
    return values
      .map(function (v) {
        return (
          '<option value="' +
          esc(v) +
          '"' +
          (selectedAll ? " selected" : "") +
          ">" +
          esc(v) +
          "</option>"
        );
      })
      .join("");
  }

  function closeModal() {
    var el = document.getElementById("kac-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "kac-modal-root";
    bg.className = "kac-modal-bg";
    var box = document.createElement("div");
    box.className = "kac-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "kac-modal-actions";
    buttons.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      if (b.danger) btn.className = "kac-modal-retire kintoneplugin-button-normal";
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

  function readFormRow(existing) {
    var isNew = !existing || !existing.id;
    var row = {
      pay_site: document.getElementById("kac-f-pay-site").value.trim(),
      account_type: document.getElementById("kac-f-account-type").value.trim(),
      org: document.getElementById("kac-f-org").value.trim(),
      dept: document.getElementById("kac-f-dept").value.trim(),
      display_name: document.getElementById("kac-f-display-name").value.trim(),
      login_name: document.getElementById("kac-f-login-name").value.trim(),
      login_id: document.getElementById("kac-f-login-id").value.trim(),
      status: document.getElementById("kac-f-status").value.trim() || "使用中",
      start_date: document.getElementById("kac-f-start-date").value.trim(),
      end_date: document.getElementById("kac-f-end-date").value.trim(),
      note: document.getElementById("kac-f-note").value.trim(),
    };
    if (!isNew) {
      row.id = existing.id;
      row.revision = existing.revision;
      row.login_id = existing.login_id;
    }
    validateRow(row, isNew);
    return row;
  }

  function formFieldsHtml(row, isNew) {
    var r = row || {};
    var loginIdAttrs = isNew ? "" : " readonly";
    var statusVal = r.status || (r.end_date ? "終了" : "使用中");
    return (
      (isNew
        ? '<input type="hidden" id="kac-create-595-picked" value="">' +
          '<div class="kac-create-595-step">' +
          '<button type="button" id="kac-create-595-search" class="kintoneplugin-button-normal kac-create-595-btn">社員名検索（595・任意）</button>' +
          "</div>" +
          '<p class="kac-hint">個人アカウントは 595 検索で表示名・ログイン名を自動入力できます（任意）。共有・特権は手入力。</p>'
        : "") +
      '<label>アカウント種別<select id="kac-f-account-type">' +
      accountTypeOptionsHtml(r.account_type) +
      '</select></label>' +
      '<label>支払箇所<select id="kac-f-pay-site">' +
      paySiteOptionsHtml(r.pay_site || PAY_SITE_BY_TYPE[r.account_type] || "本社") +
      '</select></label>' +
      '<label>所属グループ<select id="kac-f-org">' +
      orgOptionsHtml(r.org) +
      '</select></label>' +
      '<label>所属<select id="kac-f-dept">' +
      deptOptionsHtml(r.dept, r.org) +
      '</select></label>' +
      '<p class="kac-hint">所属は Kintone 台帳用マスタです。595 の所属とは異なります。</p>' +
      '<label>表示名<input type="text" id="kac-f-display-name" value="' +
      esc(r.display_name || "") +
      '"></label>' +
      '<label>ログイン名<input type="text" id="kac-f-login-name" value="' +
      esc(r.login_name || "") +
      '"></label>' +
      '<label>ログインID<input type="text" id="kac-f-login-id" value="' +
      esc(r.login_id || "") +
      '"' +
      loginIdAttrs +
      ' autocomplete="off"></label>' +
      '<label>ステータス<select id="kac-f-status">' +
      '<option value="使用中"' +
      (statusVal === "使用中" ? " selected" : "") +
      '>使用中</option>' +
      '<option value="終了"' +
      (statusVal === "終了" ? " selected" : "") +
      '>終了</option>' +
      '</select></label>' +
      '<label>利用開始日<input type="date" id="kac-f-start-date" value="' +
      esc(r.start_date || todayJstYmd()) +
      '"></label>' +
      '<label>利用終了日<input type="date" id="kac-f-end-date" value="' +
      esc(r.end_date || "") +
      '"></label>' +
      '<label>備考<textarea id="kac-f-note" rows="3">' +
      esc(r.note || "") +
      "</textarea></label>"
    );
  }

  function wireFormDependencies() {
    var typeEl = document.getElementById("kac-f-account-type");
    var payEl = document.getElementById("kac-f-pay-site");
    var orgEl = document.getElementById("kac-f-org");
    var deptEl = document.getElementById("kac-f-dept");
    if (typeEl && payEl) {
      typeEl.addEventListener("change", function () {
        var mapped = PAY_SITE_BY_TYPE[typeEl.value.trim()];
        if (mapped) payEl.value = mapped;
      });
    }
    if (orgEl && deptEl) {
      orgEl.addEventListener("change", function () {
        deptEl.innerHTML = deptOptionsHtml("", orgEl.value.trim());
      });
    }
  }

  function wireCreate595Search() {
    var btn = document.getElementById("kac-create-595-search");
    if (!btn) return;
    btn.onclick = function () {
      open595SearchModal(apply595PickToForm);
    };
  }

  function openEditModal(row, opts) {
    if (!state.isAdmin) return;
    opts = opts || {};
    var isCreate = !!opts.createMode;
    var buttons = [
      { label: "キャンセル" },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          var updated;
          try {
            updated = readFormRow(isCreate ? null : row);
          } catch (e) {
            alert(e.message || e);
            return;
          }
          var savePromise = isCreate
            ? apiPost("/k/v1/record.json", {
                app: APP_DB,
                record: toKintoneRecord(updated),
              })
            : apiPut("/k/v1/record.json", {
                app: APP_DB,
                id: Number(updated.id),
                revision: Number(updated.revision),
                record: toKintoneRecord(updated),
              });
          savePromise
            .then(function () {
              close();
              return reloadRecords();
            })
            .then(function () {
              alert(isCreate ? "新規登録しました" : "保存しました");
            })
            .catch(function (e) {
              alert("保存失敗: " + formatKintoneApiError(e));
            });
        },
      },
    ];
    if (row && row.id && !isCreate && isActiveRow(row)) {
      buttons.unshift({
        label: "終了",
        danger: true,
        onClick: function () {
          retireRecord(row);
        },
      });
    }
    var title = isCreate ? "新規作成" : "編集 — " + (row.display_name || row.login_id || "");
    openModal(title, formFieldsHtml(row, isCreate), buttons);
    if (isCreate) wireCreate595Search();
    wireFormDependencies();
  }

  function retireRecord(row) {
    if (!state.isAdmin || !row || !row.id) return;
    var msg =
      "表示名: " +
      row.display_name +
      "（" +
      row.login_id +
      "）\n\n利用終了日を " +
      todayJstYmd() +
      " に設定し、ステータスを「終了」にします（物理削除はしません）。\n\nよろしいですか？";
    if (!window.confirm(msg)) return;
    apiPut("/k/v1/record.json", {
      app: APP_DB,
      id: Number(row.id),
      revision: Number(row.revision),
      record: {
        end_date: { value: todayJstYmd() },
        status: { value: "終了" },
      },
    })
      .then(function () {
        closeModal();
        return reloadRecords();
      })
      .then(function () {
        alert("利用終了処理を完了しました");
      })
      .catch(function (e) {
        alert("終了処理失敗: " + formatKintoneApiError(e));
      });
  }

  function filteredRecords() {
    var q = state.search.trim();
    var rows = state.records.filter(function (r) {
      if (state.lifecycleFilter === "active" && isTerminatedRow(r)) return false;
      if (state.lifecycleFilter === "terminated" && !isTerminatedRow(r)) return false;
      if (!q) return true;
      return recordMatchesSearch(r, q);
    });
    rows.sort(compareListRows);
    return rows;
  }

  function setLifecycleFilter(mode) {
    if (mode !== "active" && mode !== "all" && mode !== "terminated") return;
    state.lifecycleFilter = mode;
    var root = document.getElementById("kac-root");
    if (root) {
      root.querySelectorAll(".kac-lifecycle-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-lifecycle") === mode);
      });
    }
    renderTable();
  }

  function clearListFilters() {
    state.search = "";
    var searchEl = document.getElementById("kac-search");
    if (searchEl) searchEl.value = "";
    setLifecycleFilter("active");
  }

  function cellText(text) {
    var t = String(text || "").trim();
    if (!t) return '<span class="kac-none">—</span>';
    return esc(t);
  }

  function listSectionRowHtml(label) {
    var colSpan = LIST_COLUMNS.length + 2;
    return (
      '<tr class="kac-list-section-row"><td colspan="' +
      colSpan +
      '">' +
      esc(label) +
      "</td></tr>"
    );
  }

  function renderTableRowHtml(row) {
    var statusBadge = isTerminatedRow(row)
      ? '<span class="kac-badge kac-badge-terminated">終了</span>'
      : '<span class="kac-badge kac-badge-active">稼働</span>';
    var actionBtns = "";
    if (state.isAdmin) {
      actionBtns =
        '<button type="button" class="kac-btn-edit">編集</button>' +
        (isActiveRow(row) ? '<button type="button" class="kac-btn-retire">終了</button>' : "");
    }
    return (
      '<tr class="kac-list-data-row" data-login-id="' +
      esc(normalizeLoginId(row.login_id)) +
      '"><td>' +
      statusBadge +
      "</td>" +
      LIST_COLUMNS.map(function (col) {
        return "<td>" + cellText(listFieldDisplay(row, col.key)) + "</td>";
      }).join("") +
      '<td class="kac-actions">' +
      actionBtns +
      "</td></tr>"
    );
  }

  function renderTable() {
    var tbody = document.getElementById("kac-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="12">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="12">該当なし</td></tr>';
      return;
    }
    var htmlParts = [];
    var currentSectionKey = null;
    rows.forEach(function (row) {
      var sectionKey = listSectionKey(row);
      if (sectionKey !== currentSectionKey) {
        htmlParts.push(listSectionRowHtml(listSectionLabel(row)));
        currentSectionKey = sectionKey;
      }
      htmlParts.push(renderTableRowHtml(row));
    });
    tbody.innerHTML = htmlParts.join("");

    tbody.querySelectorAll("tr.kac-list-data-row").forEach(function (tr) {
      var loginId = tr.getAttribute("data-login-id");
      var row = null;
      for (var i = 0; i < rows.length; i++) {
        if (normalizeLoginId(rows[i].login_id) === loginId) {
          row = rows[i];
          break;
        }
      }
      if (!row) return;
      var editB = tr.querySelector(".kac-btn-edit");
      if (editB) {
        editB.addEventListener("click", function () {
          openEditModal(row);
        });
      }
      var retireB = tr.querySelector(".kac-btn-retire");
      if (retireB) {
        retireB.addEventListener("click", function () {
          retireRecord(row);
        });
      }
    });
  }

  function readAggSelections() {
    var orgBox = document.getElementById("kac-agg-org");
    var deptBox = document.getElementById("kac-agg-dept");
    return {
      orgs: selectedAggChipValues(orgBox),
      depts: selectedAggChipValues(deptBox),
    };
  }

  function buildAggSummaryText(sel) {
    var parts = ["現時点稼働数"];
    if (sel.orgs.length && sel.orgs.length < ORGS.length) {
      parts.push("所属グループ=" + sel.orgs.join("、"));
    }
    if (sel.depts.length && sel.depts.length < DEPTS.length) {
      parts.push("所属=" + sel.depts.join("、"));
    }
    return parts.join(" / ");
  }

  function buildAggTable(sel) {
    if (!sel.orgs.length) throw new Error("所属グループを1つ以上選択してください");
    if (!sel.depts.length) throw new Error("所属を1つ以上選択してください");

    var orgList = orderedAggOrgs(sel.orgs);
    var deptList = orderedAggDepts(sel.depts);
    var rows = [];

    orgList.forEach(function (org, blockIdx) {
      var detailRows = [];
      deptList.forEach(function (dept) {
        var n = countOrgDeptActive(org, dept);
        if (n === 0) return;
        detailRows.push({ dept: dept, counts: [n] });
      });

      detailRows.forEach(function (dr, idx) {
        rows.push({
          kind: "detail",
          org: org,
          dept: dr.dept,
          counts: dr.counts,
          orgRowspan: idx === 0 ? detailRows.length + 1 : 0,
          orgGroupStart: idx === 0,
          orgBlockIndex: blockIdx,
        });
      });

      rows.push({
        kind: "subtotal",
        org: org,
        counts: [countOrgDeptsActive(org, deptList)],
        orgGroupEnd: true,
        orgCoveredByRowspan: detailRows.length > 0,
        orgBlockIndex: blockIdx,
      });
    });

    rows.push({
      kind: "grand",
      label: "全社合計",
      counts: [countGrandActiveFiltered(orgList, deptList)],
    });
    return { months: ["件数"], rows: rows, summary: buildAggSummaryText(sel) };
  }

  function aggRowLabelCells(row) {
    if (row.kind === "grand") {
      return { org: "全社", dept: "合計" };
    }
    if (row.kind === "subtotal") {
      return {
        org: row.orgCoveredByRowspan ? "" : row.org,
        dept: "小計",
      };
    }
    return { org: row.org, dept: formatDeptLabel(row.org, row.dept) };
  }

  /** 行内の月次セル — 最大=青・最小=赤（2列以上かつ min≠max のとき） */
  function aggMonthHighlightClasses(counts) {
    if (!counts || counts.length < 2) {
      return counts ? counts.map(function () { return ""; }) : [];
    }
    var nums = counts.map(function (n) {
      return Number(n);
    });
    var max = Math.max.apply(null, nums);
    var min = Math.min.apply(null, nums);
    if (max === min) {
      return nums.map(function () {
        return "";
      });
    }
    return nums.map(function (n) {
      if (n === max) return "max";
      if (n === min) return "min";
      return "";
    });
  }

  /** 全社合計行のみ — 最大=青・最小=赤 */
  function aggMonthCellsHtml(counts, prefix, highlightMinMax) {
    var p = prefix || "jca";
    var hi = highlightMinMax ? aggMonthHighlightClasses(counts) : [];
    return (counts || [])
      .map(function (n, i) {
        var cls = p + "-agg-month-cell";
        if (highlightMinMax && hi[i] === "max") cls += " " + p + "-agg-month-max";
        if (highlightMinMax && hi[i] === "min") cls += " " + p + "-agg-month-min";
        return '<td class="' + cls + '">' + esc(String(n)) + "</td>";
      })
      .join("");
  }

  function aggRowHtml(row, monthCount, prefix) {
    var p = prefix || "jca";
    var labels = aggRowLabelCells(row);
    if (row.kind === "grand") {
      return (
        "<tr class=\"" +
        p +
        "-agg-row " +
        p +
        "-agg-grand\"><td colspan=\"2\" class=\"" +
        p +
        "-agg-label\">全社合計</td>" +
        aggMonthCellsHtml(row.counts, p, true) +
        "</tr>"
      );
    }

    var trCls = p + "-agg-row";
    if (row.kind === "subtotal") trCls += " " + p + "-agg-subtotal";
    if (row.kind === "detail") trCls += " " + p + "-agg-detail";
    if (row.orgGroupStart) trCls += " " + p + "-agg-org-start";
    if (row.orgGroupEnd) trCls += " " + p + "-agg-org-end";
    if (row.orgBlockIndex != null) trCls += " " + p + "-agg-org-block-" + row.orgBlockIndex;

    var orgTd = "";
    if (row.kind === "detail") {
      if (row.orgRowspan > 0) {
        orgTd =
          '<td class="' +
          p +
          '-agg-org-cell" rowspan="' +
          row.orgRowspan +
          '">' +
          esc(labels.org) +
          "</td>";
      }
    } else if (row.kind === "subtotal") {
      if (!row.orgCoveredByRowspan) {
        orgTd = '<td class="' + p + '-agg-org-cell">' + esc(row.org) + "</td>";
      }
    }

    return (
      "<tr class=\"" +
      trCls +
      '">' +
      orgTd +
      '<td class="' +
      p +
      '-agg-dept-cell">' +
      esc(labels.dept) +
      "</td>" +
      aggMonthCellsHtml(row.counts, p) +
      "</tr>"
    );
  }

  function aggTableHeadHtml(months, prefix) {
    var p = prefix || "jca";
    return (
      "<thead><tr><th class=\"" +
      p +
      '-agg-th-org">所属グループ</th><th class="' +
      p +
      '-agg-th-dept">所属</th>' +
      months
        .map(function (ym) {
          return '<th class="' + p + '-agg-th-count">' + esc(ym) + "</th>";
        })
        .join("") +
      "</tr></thead>"
    );
  }

  function isAggAccordionOpen() {
    var acc = document.getElementById("kac-agg-acc");
    return !!(acc && acc.open);
  }

  function renderAggTable() {
    var wrap = document.getElementById("kac-agg-table-wrap");
    if (!wrap) return;
    if (!state.aggRows.length || !state.aggMonths.length) {
      if (state.loading) {
        wrap.innerHTML = '<p class="kac-hint">読込中…</p>';
      } else if (isAggAccordionOpen()) {
        wrap.innerHTML = '<p class="kac-hint">集計を計算しています…</p>';
      } else {
        wrap.innerHTML =
          '<p class="kac-hint">開くと <strong>現時点の稼働数</strong>（所属グループ×所属）を表示します。必要に応じて絞り込めます。</p>';
      }
      return;
    }
    var head = aggTableHeadHtml(state.aggMonths, "jca");
    var body =
      "<tbody>" +
      state.aggRows
        .map(function (row) {
          return aggRowHtml(row, state.aggMonths.length, "jca");
        })
        .join("") +
      "</tbody>";
    var meta = document.getElementById("kac-agg-meta");
    if (meta) {
      meta.textContent = state.aggSummary;
    }
    wrap.innerHTML =
      '<table class="kac-agg-table">' + head + body + "</table>";
  }

  function recalcAgg(opts) {
    var silent = opts && opts.silent;
    if (state.loading) {
      renderAggTable();
      return;
    }
    var sel;
    try {
      sel = readAggSelections();
      var result = buildAggTable(sel);
      state.aggMonths = result.months;
      state.aggRows = result.rows;
      state.aggSummary = result.summary;
      renderAggTable();
    } catch (e) {
      if (!silent) alert(e.message || e);
    }
  }

  function recalcAggOnOpen() {
    if (!isAggAccordionOpen()) return;
    recalcAgg({ silent: true });
  }

  function exportAggXlsx() {
    if (typeof XLSX === "undefined" || !XLSX.utils || !XLSX.writeFile) {
      alert("Excel 出力ライブラリが読み込まれていません。ページを再読み込みしてください。");
      return;
    }
    if (!state.aggRows.length) {
      alert("先に集計を実行してください");
      return;
    }
    var header = ["所属グループ", "所属"].concat(state.aggMonths);
    var matrix = [header];
    state.aggRows.forEach(function (row) {
      if (row.kind === "grand") {
        matrix.push(["全社", "合計"].concat(row.counts || []));
        return;
      }
      var labels = aggRowLabelCells(row);
      matrix.push([labels.org, labels.dept].concat(row.counts || []));
    });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "アカウント集計");
    XLSX.writeFile(wb, "Kintoneアカウント集計_" + todayJstYmd().replace(/-/g, "") + ".xlsx", {
      bookType: "xlsx",
    });
  }

  function aggPrintStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:12px 14px;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".kacap-header{margin-bottom:10px;text-align:center;}" +
      ".kacap-header h1{margin:0 0 6px;font-size:16pt;font-weight:700;color:#1e3a8a;}" +
      ".kacap-meta{margin:0;font-size:10pt;color:#475569;}" +
      ".kacap-table{width:100%;border-collapse:collapse;font-size:10pt;}" +
      ".kacap-table th,.kacap-table td{border:1px solid #64748b;padding:5px 6px;text-align:center;}" +
      ".kacap-table th{background:#dbeafe;}" +
      ".kacap-table td.kacap-org-cell,.kacap-table td.kacap-dept-cell{text-align:left;font-weight:600;white-space:nowrap;}" +
      ".kacap-table tr.kacap-org-start td{border-top:2px solid #64748b;}" +
      ".kacap-table tr.kacap-org-end td{border-bottom:2px solid #94a3b8;}" +
      ".kacap-table tr.kacap-detail td.kacap-dept-cell{font-weight:500;}" +
      ".kacap-table tr.kacap-subtotal td{background:#dbeafe;color:#1e3a8a;font-weight:700;}" +
      ".kacap-table tr.kacap-subtotal td.kacap-dept-cell{font-style:normal;}" +
      ".kacap-table td.kacap-agg-month-max{color:#1d4ed8;font-weight:700;}" +
      ".kacap-table td.kacap-agg-month-min{color:#b91c1c;font-weight:700;}" +
      ".kacap-table tr.kacap-grand td{background:#bbf7d0;color:#14532d;font-weight:700;border-top:2px solid #4ade80;}" +
      ".kacap-table tr.kacap-grand td.kacap-agg-month-max{color:#1d4ed8;}" +
      ".kacap-table tr.kacap-grand td.kacap-agg-month-min{color:#b91c1c;}" +
      "@media print{@page{size:A4 landscape;margin:8mm;}body{padding:0;}thead{display:table-header-group;}tr{page-break-inside:avoid;}}"
    );
  }

  function openAggPrintWindow() {
    if (!state.aggRows.length) {
      alert("先に集計を実行してください");
      return;
    }
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var head = aggTableHeadHtml(state.aggMonths, "jcaap");
    var body =
      "<tbody>" +
      state.aggRows
        .map(function (row) {
          if (row.kind === "grand") {
            return (
              '<tr class="kacap-row kacap-grand"><td colspan="2" class="kacap-org-cell">全社合計</td>' +
              aggMonthCellsHtml(row.counts, "jcaap", true) +
              "</tr>"
            );
          }
          var labels = aggRowLabelCells(row);
          var trCls = "kacap-row";
          if (row.kind === "subtotal") trCls += " kacap-subtotal kacap-org-end";
          if (row.kind === "detail") {
            trCls += " kacap-detail";
            if (row.orgGroupStart) trCls += " kacap-org-start";
          }
          var orgTd = "";
          if (row.kind === "detail") {
            if (row.orgRowspan > 0) {
              orgTd =
                '<td class="kacap-org-cell" rowspan="' +
                row.orgRowspan +
                '">' +
                esc(labels.org) +
                "</td>";
            }
          } else if (row.kind === "subtotal") {
            if (!row.orgCoveredByRowspan) {
              orgTd = '<td class="kacap-org-cell">' + esc(row.org) + "</td>";
            }
          }
          return (
            "<tr class=\"" +
            trCls +
            '">' +
            orgTd +
            '<td class="kacap-dept-cell">' +
            esc(labels.dept) +
            "</td>" +
            aggMonthCellsHtml(row.counts, "jcaap") +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>";
    var html =
      '<header class="kacap-header"><h1>Kintoneアカウント — アカウント集計（現時点）</h1>' +
      '<p class="kacap-meta">印刷日: ' +
      esc(todayJstYmd()) +
      " / " +
      esc(state.aggSummary) +
      "</p></header>" +
      '<table class="kacap-table">' +
      head +
      body +
      "</table>";
    var docHtml =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Kintoneアカウント集計</title><style>' +
      aggPrintStylesheet() +
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

  function listExportFilenameStamp() {
    return todayJstYmd().replace(/-/g, "");
  }

  function listExportFilterSummary(rows) {
    var parts = ["全 " + rows.length + " 件"];
    if (state.lifecycleFilter === "active") parts.push("表示=稼働中");
    else if (state.lifecycleFilter === "terminated") parts.push("表示=終了");
    else parts.push("表示=すべて");
    if (state.search.trim()) parts.push("検索=" + state.search.trim());
    return parts.join(" / ");
  }

  function exportListXlsx(rows) {
    if (typeof XLSX === "undefined" || !XLSX.utils || !XLSX.writeFile) {
      alert("Excel 出力ライブラリが読み込まれていません。ページを再読み込みしてください。");
      return;
    }
    var header = LIST_EXPORT_COLUMNS.map(function (c) {
      return c.label;
    });
    var matrix = [header];
    rows.forEach(function (r) {
      matrix.push(
        LIST_EXPORT_COLUMNS.map(function (c) {
          return listFieldDisplay(r, c.key);
        }),
      );
    });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "一覧");
    XLSX.writeFile(wb, "Kintoneアカウント一覧_" + listExportFilenameStamp() + ".xlsx", {
      bookType: "xlsx",
    });
  }

  function listPrintStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:12px 14px;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".kacl-header{margin-bottom:10px;text-align:center;}" +
      ".kacl-header h1{margin:0 0 6px;font-size:16pt;font-weight:700;color:#1e3a8a;}" +
      ".kacl-meta{margin:0;font-size:10pt;color:#475569;}" +
      ".kacl-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10pt;}" +
      ".kacl-table th,.kacl-table td{border:1px solid #64748b;padding:5px 4px;vertical-align:top;line-height:1.4;word-break:break-word;overflow-wrap:anywhere;}" +
      ".kacl-table th{background:#dbeafe;font-weight:700;}" +
      ".kacl-table tr:nth-child(even) td{background:#f8fafc;}" +
      "@media print{@page{size:A4 landscape;margin:8mm;}body{padding:0;}thead{display:table-header-group;}tr{page-break-inside:avoid;}}"
    );
  }

  function openListPrintWindow(rows, summary) {
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var head =
      "<thead><tr>" +
      LIST_EXPORT_COLUMNS.map(function (c) {
        return "<th>" + esc(c.label) + "</th>";
      }).join("") +
      "</tr></thead>";
    var body =
      "<tbody>" +
      rows
        .map(function (r) {
          return (
            "<tr>" +
            LIST_EXPORT_COLUMNS.map(function (c) {
              var v = listFieldDisplay(r, c.key).trim();
              return "<td>" + esc(v || "—") + "</td>";
            }).join("") +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>";
    var docHtml =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Kintoneアカウント一覧</title><style>' +
      listPrintStylesheet() +
      "</style></head><body>" +
      '<header class="kacl-header"><h1>Kintoneアカウント管理台帳 — 一覧</h1>' +
      '<p class="kacl-meta">印刷日: ' +
      esc(todayJstYmd()) +
      " / " +
      esc(summary) +
      "</p></header>" +
      '<table class="kacl-table">' +
      head +
      body +
      "</table></body></html>";
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

  function runListExport(kind) {
    var rows = filteredRecords();
    if (!rows.length) {
      alert("出力対象がありません");
      return;
    }
    var summary = listExportFilterSummary(rows);
    if (kind === "xlsx") exportListXlsx(rows);
    else openListPrintWindow(rows, summary);
  }

  function updateMeta() {
    var el = document.getElementById("kac-meta");
    if (!el) return;
    var activeCount = 0;
    state.records.forEach(function (r) {
      if (isActiveRow(r)) activeCount += 1;
    });
    var html =
      '<span class="kac-meta-count">全 ' +
      esc(String(state.records.length)) +
      " 件（稼働中 " +
      esc(String(activeCount)) +
      " 件）</span>";
    html +=
      '<div class="kac-meta-actions">' +
      (state.isAdmin
        ? '<button type="button" id="kac-new" class="kintoneplugin-button-dialog-ok">新規作成</button>'
        : "") +
      '<button type="button" id="kac-list-xlsx" class="kintoneplugin-button-normal">一覧 Excel</button>' +
      '<button type="button" id="kac-list-print" class="kintoneplugin-button-normal">一覧印刷</button>' +
      (state.isAdmin
        ? ""
        : '<span class="kac-readonly-msg">閲覧のみ（編集はシステム管理者）</span>') +
      "</div>";
    el.innerHTML = html;
    var newBtn = document.getElementById("kac-new");
    if (newBtn) {
      newBtn.addEventListener("click", function () {
        openEditModal({}, { createMode: true });
      });
    }
    var xlsxBtn = document.getElementById("kac-list-xlsx");
    if (xlsxBtn) xlsxBtn.addEventListener("click", function () {
      runListExport("xlsx");
    });
    var printBtn = document.getElementById("kac-list-print");
    if (printBtn) printBtn.addEventListener("click", function () {
      runListExport("print");
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
        updateMeta();
        renderSummaryPanel();
        if (isAggAccordionOpen()) recalcAggOnOpen();
        if (isFeeAccordionOpen()) recalcFeeAggOnOpen();
      })
      .catch(function (e) {
        state.loading = false;
        renderTable();
        alert("読込失敗: " + formatKintoneApiError(e));
      });
  }

  function buildAggOrgBlockCss(scope, prefix) {
    var palettes = [
      ["#eff6ff", "#dbeafe", "#93c5fd"],
      ["#f0fdf4", "#dcfce7", "#86efac"],
      ["#fefce8", "#fef9c3", "#fde047"],
      ["#fdf4ff", "#fae8ff", "#e879f9"],
      ["#fff7ed", "#ffedd5", "#fdba74"],
      ["#f0fdfa", "#ccfbf1", "#5eead4"],
      ["#fef2f2", "#fee2e2", "#fca5a5"],
      ["#f5f3ff", "#ede9fe", "#c4b5fd"],
      ["#ecfeff", "#cffafe", "#67e8f9"],
    ];
    var out = "";
    palettes.forEach(function (p, i) {
      out +=
        scope +
        " ." +
        prefix +
        "-agg-row." +
        prefix +
        "-agg-detail." +
        prefix +
        "-agg-org-block-" +
        i +
        " td{background:" +
        p[0] +
        ";}";
      out +=
        scope +
        " ." +
        prefix +
        "-agg-row." +
        prefix +
        "-agg-subtotal." +
        prefix +
        "-agg-org-block-" +
        i +
        " td{background:" +
        p[1] +
        ";font-weight:700;border-top:2px solid " +
        p[2] +
        ";color:#334155;}";
    });
    return out;
  }

  function injectCss() {
    if (document.getElementById("kac-dash-css")) return;
    var st = document.createElement("style");
    st.id = "kac-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".kac-root{font-family:Segoe UI,Meiryo,sans-serif;font-size:15px;padding:8px 12px 24px;max-width:100%;}" +
      ".kac-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px;}" +
      ".kac-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-bottom:12px;padding:16px 20px;" +
      "background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:2px solid #10b981;border-radius:12px;" +
      "box-shadow:0 2px 8px rgba(16,185,129,.12);}" +
      ".kac-meta-count{font-size:15px;color:#475569;font-weight:500;}" +
      ".kac-meta-actions{margin-left:auto;display:flex;flex-wrap:wrap;gap:8px;align-items:center;}" +
      ".kac-readonly-msg{font-size:14px;color:#64748b;margin-left:auto;}" +
      ".kac-agg-acc{margin-bottom:14px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;}" +
      ".kac-agg-acc>summary{cursor:pointer;padding:12px 16px;font-size:15px;font-weight:600;color:#334155;user-select:none;}" +
      ".kac-agg-acc[open]>summary{border-bottom:1px solid #e2e8f0;}" +
      ".kac-agg-body{padding:12px 16px 16px;}" +
      ".kac-agg-cond-acc{margin-bottom:12px;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:6px;background:#fffbeb;}" +
      ".kac-agg-cond-acc>summary{cursor:pointer;padding:10px 14px;font-size:14px;font-weight:600;color:#92400e;user-select:none;background:#fffbeb;border-radius:5px 5px 0 0;}" +
      ".kac-agg-cond-acc[open]>summary{border-bottom:1px solid #fde68a;margin-bottom:0;background:#fef3c7;}" +
      ".kac-agg-cond-body{padding:12px 14px 14px;background:#fffbeb;}" +
      ".kac-agg-output-bar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;margin-bottom:10px;}" +
      ".kac-agg-output-bar .kac-hint{margin:0;flex:1;min-width:200px;}" +
      ".kac-agg-output-actions{display:flex;flex-wrap:wrap;gap:8px;}" +
      ".kac-agg-controls{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:flex-end;margin-bottom:12px;}" +
      ".kac-agg-controls label{font-size:14px;display:flex;flex-direction:column;gap:4px;}" +
      ".kac-agg-controls input,.kac-agg-controls select{font-size:15px;padding:6px 8px;}" +
      ".kac-agg-period-row{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:flex-end;margin-bottom:10px;}" +
      ".kac-agg-period-row label{font-size:14px;display:flex;flex-direction:column;gap:4px;}" +
      ".kac-agg-filter-row{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:flex-start;margin-bottom:8px;}" +
      ".kac-agg-filter-label{font-size:13px;font-weight:600;color:#475569;min-width:88px;padding-top:5px;}" +
      ".kac-agg-chips{display:flex;flex-wrap:wrap;gap:4px;flex:1;min-width:200px;}" +
      ".kac-agg-chips-dept{max-height:64px;overflow-y:auto;padding-right:4px;}" +
      ".kac-agg-chip{padding:3px 10px;font-size:12px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;line-height:1.4;}" +
      ".kac-agg-chip.active{background:#059669;color:#fff;border-color:#059669;font-weight:600;}" +
      ".kac-agg-chip:hover:not(.active){background:#f1f5f9;}" +
      ".kac-agg-chip-link{font-size:12px;color:#2563eb;background:none;border:none;cursor:pointer;padding:5px 0 0;white-space:nowrap;text-decoration:underline;}" +
      ".kac-agg-multi{min-width:160px;}" +
      ".kac-agg-actions{display:flex;flex-wrap:wrap;gap:8px;}" +
      ".kac-agg-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:6px;}" +
      ".kac-agg-acc-table-wrap{display:inline-block;width:auto;max-width:100%;vertical-align:top;}" +
      ".kac-agg-acc-table-wrap .kac-agg-table{width:auto;max-width:100rem;min-width:0;font-size:14px;table-layout:auto;}" +
      ".kac-agg-acc-table-wrap .kac-agg-table th,.kac-agg-acc-table-wrap .kac-agg-table td{padding:6px 10px;}" +
      ".kac-agg-acc-table-wrap .kac-agg-table th.kac-agg-th-org,.kac-agg-acc-table-wrap .kac-agg-table td.kac-agg-org-cell{width:9.5rem;max-width:9.5rem;font-size:12px;line-height:1.4;}" +
      ".kac-agg-acc-table-wrap .kac-agg-table th.kac-agg-th-dept,.kac-agg-acc-table-wrap .kac-agg-table td.kac-agg-dept-cell{width:13rem;max-width:13rem;font-size:13px;}" +
      ".kac-agg-acc-table-wrap .kac-agg-table th.kac-agg-th-count,.kac-agg-acc-table-wrap .kac-agg-table td.kac-agg-month-cell{width:5.5rem;min-width:5.5rem;font-size:14px;font-weight:600;}" +
      ".kac-agg-table{border-collapse:collapse;width:100%;font-size:14px;min-width:420px;table-layout:fixed;}" +
      ".kac-agg-table th,.kac-agg-table td{border:1px solid #e2e8f0;padding:6px 8px;text-align:center;}" +
      ".kac-agg-table th{background:#f1f5f9;}" +
      ".kac-agg-table th.kac-agg-th-org,.kac-agg-table td.kac-agg-org-cell{width:6.5em;max-width:6.5em;font-size:12px;line-height:1.35;}" +
      ".kac-agg-table th.kac-agg-th-dept,.kac-agg-table td.kac-agg-dept-cell{width:9em;max-width:9em;font-size:13px;}" +
      ".kac-agg-table th.kac-agg-th-count,.kac-agg-table td.kac-agg-month-cell{width:4.5em;}" +
      ".kac-agg-table td.kac-agg-org-cell,.kac-agg-table td.kac-agg-dept-cell{text-align:left;vertical-align:middle;white-space:normal;word-break:break-all;}" +
      ".kac-agg-table td.kac-agg-org-cell{font-weight:700;background:#fff;}" +
      ".kac-agg-table tr.kac-agg-org-start td{border-top:2px solid #94a3b8;}" +
      ".kac-agg-table tr.kac-agg-org-end td{border-bottom:2px solid #cbd5e1;}" +
      ".kac-agg-table tr.kac-agg-detail td.kac-agg-dept-cell{font-weight:500;}" +
      ".kac-agg-table tr.kac-agg-grand td{background:#bbf7d0;color:#14532d;font-weight:700;border-top:2px solid #4ade80;}" +
      ".kac-agg-table tr.kac-agg-grand td.kac-agg-month-max{color:#1d4ed8;}" +
      ".kac-agg-table tr.kac-agg-grand td.kac-agg-month-min{color:#b91c1c;}" +
      ".kac-agg-legend-max{color:#1d4ed8;font-weight:700;}" +
      ".kac-agg-legend-min{color:#b91c1c;font-weight:700;}" +
      ".kac-filters{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:8px;}" +
      ".kac-filter-label{font-size:14px;font-weight:600;color:#475569;}" +
      ".kac-filters input{padding:8px 10px;font-size:15px;min-width:260px;}" +
      ".kac-lifecycle-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;}" +
      ".kac-lifecycle-label{font-size:14px;font-weight:600;color:#475569;}" +
      ".kac-lifecycle-btn{padding:8px 18px;font-size:15px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;}" +
      ".kac-lifecycle-btn.active{background:#059669;color:#fff;border-color:#059669;font-weight:700;}" +
      ".kac-lifecycle-btn:hover:not(.active){background:#f1f5f9;}" +
      ".kac-table-wrap{overflow:auto;max-height:calc(100vh - 320px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".kac-table{border-collapse:collapse;width:100%;font-size:14px;min-width:1400px;}" +
      ".kac-table th,.kac-table td{border:1px solid #e2e8f0;padding:6px 8px;vertical-align:middle;line-height:1.45;}" +
      ".kac-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;}" +
      ".kac-none{color:#64748b;font-style:italic;}" +
      ".kac-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;}" +
      ".kac-badge-active{background:#dcfce7;color:#166534;}" +
      ".kac-badge-terminated{background:#fee2e2;color:#991b1b;}" +
      ".kac-list-section-row td{background:#eef2ff;color:#4338ca;font-weight:700;font-size:13px;padding:8px 12px;border-top:2px solid #6366f1;text-align:left;}" +
      ".kac-actions button{margin:0 3px;padding:4px 10px;font-size:13px;}" +
      ".kac-hint{font-size:13px;color:#64748b;margin:6px 0;line-height:1.5;}" +
      ".kac-warn{font-size:13px;color:#b45309;margin:4px 0 8px;}" +
      ".kac-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".kac-modal{background:#fff;border-radius:8px;padding:18px 20px;max-width:620px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);font-size:15px;}" +
      ".kac-modal h3{margin:0 0 14px;font-size:18px;}" +
      ".kac-modal label{display:block;margin:10px 0;font-size:15px;}" +
      ".kac-modal input,.kac-modal select,.kac-modal textarea{width:100%;box-sizing:border-box;padding:8px;font-size:15px;margin-top:4px;}" +
      ".kac-modal-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      ".kac-modal-retire{margin-right:auto;color:#b91c1c;}" +
      ".kac-create-595-step{margin:8px 0 12px;}" +
      ".kac-create-595-btn{font-size:15px;padding:10px 18px;}" +
      ".kac-595-results{margin-top:10px;max-height:240px;overflow:auto;display:flex;flex-direction:column;gap:6px;}" +
      ".kac-595-pick{text-align:left;white-space:normal;}" +
      ".kac-595-actions{display:flex;gap:8px;margin:8px 0;}"+".kac-summary-panel{margin-bottom:14px;padding:14px 18px;border:2px solid #6366f1;border-radius:10px;background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%);}"+".kac-summary-grid{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-end;}"+".kac-summary-item{display:flex;flex-direction:column;gap:4px;font-size:14px;}"+".kac-summary-label{color:#475569;font-size:13px;}"+".kac-summary-breakdown{flex:1 1 100%;font-size:14px;line-height:1.6;}"+".kac-fee-settings{margin-bottom:12px;padding:0;border:none;background:transparent;display:flex;flex-direction:column;gap:10px;}"+".kac-fee-panel-block{padding:10px 12px;border:1px solid #c7d2fe;border-radius:6px;background:#f8fafc;}"+".kac-fee-panel-title{margin:0 0 8px;font-size:14px;font-weight:700;color:#4338ca;}"+".kac-fee-bulk-fields{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:flex-end;}"+".kac-fee-bulk-field{display:flex;flex-direction:column;gap:3px;font-size:12px;color:#475569;}"+".kac-fee-bulk-field input{width:5.5em;font-size:14px;padding:5px 7px;}"+".kac-fee-bulk-field select{font-size:14px;padding:5px 7px;min-width:4.5em;}"+".kac-fee-bulk-suffix{font-size:14px;font-weight:600;color:#334155;padding-bottom:7px;}"+".kac-fee-monthly-view .kac-fee-monthly-table-view{width:auto;max-width:24rem;}"+".kac-fee-monthly-table-view td.kac-fee-view-num{text-align:right;font-variant-numeric:tabular-nums;}"+".kac-fee-save-row{margin-top:10px;}"+".kac-fee-settings-grid{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:flex-end;margin-bottom:8px;}"+".kac-fee-settings-label{font-size:13px;font-weight:600;color:#475569;flex:1 1 100%;}"+".kac-fee-monthly-section{margin-top:4px;}"+".kac-fee-monthly-heading{margin:0 0 6px;font-size:13px;font-weight:600;color:#475569;}"+".kac-fee-monthly-wrap{overflow:visible;border:1px solid #e2e8f0;border-radius:6px;}"+".kac-fee-monthly-table{border-collapse:collapse;width:100%;font-size:13px;}"+".kac-fee-monthly-table th,.kac-fee-monthly-table td{border:1px solid #e2e8f0;padding:4px 10px;text-align:center;}"+".kac-fee-monthly-table th{background:#f1f5f9;}"+".kac-fee-monthly-table td:first-child{text-align:left;font-weight:600;white-space:nowrap;}"+".kac-fee-agg-acc{margin-bottom:14px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;}"+".kac-fee-agg-acc>summary{cursor:pointer;padding:12px 16px;font-size:15px;font-weight:600;color:#334155;user-select:none;}"+".kac-fee-agg-body{padding:12px 16px 16px;}"+".kac-fee-agg-table{border-collapse:collapse;width:100%;font-size:13px;min-width:640px;}"+".kac-fee-agg-table th,.kac-fee-agg-table td{border:1px solid #e2e8f0;padding:5px 7px;text-align:center;}"+".kac-fee-agg-table th{background:#f1f5f9;}"+".kac-fee-agg-table th.kac-fee-th-pay,.kac-fee-agg-table td.kac-fee-pay{width:5.5em;}"+".kac-fee-agg-table th.kac-fee-th-cat,.kac-fee-agg-table td.kac-fee-cat{width:4.5em;}"+".kac-fee-agg-table th.kac-fee-th-metric,.kac-fee-agg-table td.kac-fee-metric{width:4em;font-size:12px;}"+".kac-fee-agg-table td.kac-fee-pay,.kac-fee-agg-table td.kac-fee-cat{text-align:left;font-weight:600;}"+".kac-fee-agg-table td.kac-fee-yen{text-align:right;font-size:12px;white-space:nowrap;}"+".kac-fee-agg-table tr.kac-fee-amount td.kac-fee-pay,.kac-fee-agg-table tr.kac-fee-amount td.kac-fee-cat{color:#64748b;font-weight:500;}"+".kac-fee-agg-table tr.kac-fee-subtotal td{background:#dbeafe;font-weight:700;}"+".kac-fee-agg-table tr.kac-fee-subtotal.kac-fee-amount td{background:#eff6ff;}"+".kac-fee-agg-table tr.kac-fee-grand td{background:#bbf7d0;font-weight:700;}"+".kac-fee-agg-table tr.kac-fee-grand.kac-fee-amount td{background:#dcfce7;}"+".kac-fee-recalc-hint{margin:0 0 8px;font-size:12px;line-height:1.45;}"+".kac-fee-summary-wrap{margin-bottom:12px;}"+".kac-fee-summary-table{border-collapse:collapse;width:100%;font-size:14px;min-width:480px;}"+".kac-fee-summary-table th,.kac-fee-summary-table td{border:1px solid #e2e8f0;padding:8px 10px;text-align:center;vertical-align:middle;}"+".kac-fee-summary-table th{background:#dbeafe;}"+".kac-fee-summary-table td.kac-fee-sum-label{text-align:left;font-weight:700;white-space:nowrap;min-width:8em;}"+".kac-fee-summary-table tr.kac-fee-sum-subtotal td{background:#eff6ff;}"+".kac-fee-summary-table tr.kac-fee-sum-grand td{background:#bbf7d0;font-weight:700;border-top:2px solid #4ade80;}"+".kac-fee-summary-table .kac-fee-sum-count{display:block;font-size:15px;font-weight:700;color:#0f172a;}"+".kac-fee-summary-table .kac-fee-sum-yen{display:block;font-size:12px;color:#475569;margin-top:3px;}"+".kac-fee-detail-acc{margin-top:8px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;}"+".kac-fee-detail-acc>summary{cursor:pointer;padding:10px 14px;font-size:14px;font-weight:600;color:#475569;user-select:none;background:#f8fafc;border-radius:6px;}"+".kac-fee-detail-acc[open]>summary{border-bottom:1px solid #e2e8f0;border-radius:6px 6px 0 0;}"+".kac-fee-detail-body{padding:10px 12px 12px;}";
    st.textContent += buildAggOrgBlockCss(".kac-agg-acc-table-wrap", "jca");
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


  function buildFeeAggTable(sel) {
    var months = enumerateMonths(sel.fromYm, sel.toYm);
    if (!months.length) {
      throw new Error("期間（YYYY-MM）を正しく指定してください");
    }
    var detailRows = [];
    function pushFeePair(paySite, category, counts, kind, target) {
      var bucket = target || detailRows;
      bucket.push({
        paySite: paySite,
        category: category,
        metric: "件数",
        values: counts,
        kind: kind || "detail",
      });
      bucket.push({
        paySite: paySite,
        category: category,
        metric: "利用料",
        values: countsToYenPerMonth(counts, months),
        kind: kind || "detail",
        isAmount: true,
      });
    }
    var honshaUse = months.map(function (ym) {
      return countActiveByPaySiteMonth("本社", ym);
    });
    var shutokenUse = months.map(function (ym) {
      return countActiveByPaySiteMonth("首都圏支店", ym);
    });
    var honshaSurplus = months.map(function (ym) {
      var p = getMonthFeeParams(ym);
      return Math.max(0, p.contract_total - countTotalActiveMonth(ym));
    });
    var honshaSub = months.map(function (ym, i) {
      return honshaUse[i] + honshaSurplus[i];
    });
    var shutokenSub = shutokenUse.slice();
    var grand = months.map(function (ym, i) {
      return honshaSub[i] + shutokenSub[i];
    });
    pushFeePair("本社", "利用分", honshaUse, "detail", detailRows);
    pushFeePair("本社", "余剰分", honshaSurplus, "detail", detailRows);
    pushFeePair("首都圏支店", "利用分", shutokenUse, "detail", detailRows);

    function makeSummaryRow(label, counts, kind) {
      return {
        label: label,
        counts: counts,
        amounts: countsToYenPerMonth(counts, months),
        kind: kind,
      };
    }
    var summaryRows = [
      makeSummaryRow("本社", honshaSub, "subtotal"),
      makeSummaryRow("首都圏支店", shutokenSub, "subtotal"),
      makeSummaryRow("全社合計", grand, "grand"),
    ];
    var summary = "期間=" + sel.fromYm + "～" + sel.toYm + " / 契約数・単価=月別設定";
    return {
      months: months,
      summaryRows: summaryRows,
      detailRows: detailRows,
      rows: detailRows,
      summary: summary,
    };
  }

  function feeSummaryLabel(row) {
    if (row.kind === "grand") return row.label;
    return row.label + " 小計";
  }

  function feeSummaryTableHeadHtml(months, prefix) {
    var p = prefix || "kac";
    return (
      "<thead><tr><th class=\"" +
      p +
      '-fee-sum-th-label">項目</th>' +
      months
        .map(function (ym) {
          return "<th>" + esc(ym) + "</th>";
        })
        .join("") +
      "</tr></thead>"
    );
  }

  function feeSummaryRowHtml(row, prefix) {
    var p = prefix || "kac";
    var trCls = p + "-fee-sum-row";
    if (row.kind === "subtotal") trCls += " " + p + "-fee-sum-subtotal";
    if (row.kind === "grand") trCls += " " + p + "-fee-sum-grand";
    var cells = (row.counts || [])
      .map(function (c, i) {
        return (
          '<td class="' +
          p +
          '-fee-sum-cell"><span class="' +
          p +
          '-fee-sum-count">' +
          esc(String(c)) +
          ' 件</span><span class="' +
          p +
          '-fee-sum-yen">' +
          esc(fmtYen(row.amounts[i])) +
          "</span></td>"
        );
      })
      .join("");
    return (
      "<tr class=\"" +
      trCls +
      '"><td class="' +
      p +
      '-fee-sum-label">' +
      esc(feeSummaryLabel(row)) +
      "</td>" +
      cells +
      "</tr>"
    );
  }

  function feeDetailTableHtml(months, detailRows, prefix) {
    if (!detailRows.length) return "";
    var p = prefix || "kac";
    var head = feeTableHeadHtml(months, p);
    var body =
      "<tbody>" +
      detailRows
        .map(function (row) {
          return feeRowHtml(row, p);
        })
        .join("") +
      "</tbody>";
    return '<table class="' + p + '-fee-agg-table">' + head + body + "</table>";
  }

  function formatFeeCellValue(value, row) {
    if (row.isAmount) return fmtYen(value);
    return String(value);
  }

  function feeCellsHtml(row, prefix) {
    var p = prefix || "kac";
    return (row.values || [])
      .map(function (v) {
        return (
          '<td class="' +
          p +
          "-fee-cell" +
          (row.isAmount ? " " + p + "-fee-yen" : "") +
          '">' +
          esc(formatFeeCellValue(v, row)) +
          "</td>"
        );
      })
      .join("");
  }

  function feeRowHtml(row, prefix) {
    var p = prefix || "kac";
    var trCls = p + "-fee-row";
    if (row.kind === "subtotal") trCls += " " + p + "-fee-subtotal";
    if (row.kind === "grand") trCls += " " + p + "-fee-grand";
    if (row.isAmount) trCls += " " + p + "-fee-amount";
    return (
      "<tr class=\"" +
      trCls +
      '"><td class="' +
      p +
      '-fee-pay">' +
      esc(row.paySite) +
      '</td><td class="' +
      p +
      '-fee-cat">' +
      esc(row.category) +
      '</td><td class="' +
      p +
      '-fee-metric">' +
      esc(row.metric) +
      "</td>" +
      feeCellsHtml(row, p) +
      "</tr>"
    );
  }

  function feeTableHeadHtml(months, prefix) {
    var p = prefix || "kac";
    return (
      "<thead><tr><th class=\"" +
      p +
      '-fee-th-pay">支払箇所</th><th class="' +
      p +
      '-fee-th-cat">区分</th><th class="' +
      p +
      '-fee-th-metric">種別</th>' +
      months
        .map(function (ym) {
          return "<th>" + esc(ym) + "</th>";
        })
        .join("") +
      "</tr></thead>"
    );
  }

  function renderFeeAggTable() {
    var wrap = document.getElementById("kac-fee-agg-table-wrap");
    if (!wrap) return;
    if (!state.feeAggSummaryRows.length || !state.feeAggMonths.length) {
      if (state.loading) {
        wrap.innerHTML = '<p class="kac-hint">読込中…</p>';
      } else if (isFeeAccordionOpen()) {
        wrap.innerHTML = '<p class="kac-hint">集計を計算しています…</p>';
      } else {
        wrap.innerHTML =
          '<p class="kac-hint">開くと <strong>当年（' +
          esc(currentJstYear()) +
          "年）1月～12月</strong> の月末利用費用集計を表示します。</p>";
      }
      return;
    }
    var summaryHead = feeSummaryTableHeadHtml(state.feeAggMonths, "kac");
    var summaryBody =
      "<tbody>" +
      state.feeAggSummaryRows
        .map(function (row) {
          return feeSummaryRowHtml(row, "kac");
        })
        .join("") +
      "</tbody>";
    var detailHtml = state.feeAggDetailRows.length
      ? '<details class="kac-fee-detail-acc" id="kac-fee-detail-acc">' +
        "<summary>内訳（利用分・余剰分）</summary>" +
        '<div class="kac-fee-detail-body">' +
        '<p class="kac-hint">本社の利用分・余剰分、首都圏支店の利用分の明細です。</p>' +
        feeDetailTableHtml(state.feeAggMonths, state.feeAggDetailRows, "kac") +
        "</div></details>"
      : "";
    var meta = document.getElementById("kac-fee-agg-meta");
    if (meta) {
      meta.innerHTML =
        esc(state.feeAggSummary) +
        ' <span class="kac-hint">（余剰 ID は本社に計上 / 各月の契約数・単価に従って集計）</span>';
    }
    wrap.innerHTML =
      '<div class="kac-fee-summary-wrap">' +
      '<table class="kac-fee-summary-table">' +
      summaryHead +
      summaryBody +
      "</table></div>" +
      detailHtml;
  }

  function feeSettingsMonths() {
    var sel = readFeeAggSelections();
    try {
      return enumerateMonths(sel.fromYm, sel.toYm);
    } catch (e) {
      return [];
    }
  }

  function renderFeeSettingsPanel() {
    var box = document.getElementById("kac-fee-settings");
    if (!box) return;
    var months = feeSettingsMonths();
    var periodKey = months.join(",");
    if (state.feeSettingsDraftPeriod !== periodKey) {
      resetFeeSettingsDraft();
      state.feeSettingsDraftPeriod = periodKey;
    }
    ensureFeeSettingsDraft();
    var bulkYm = defaultBulkFromYm(months);
    var bulkParts = parseYm(bulkYm) || { y: currentJstYear(), m: 1 };
    var bulkParams = getMonthFeeParamsDraft(bulkYm);
    var monthRows = months
      .map(function (ym) {
        var p = getMonthFeeParamsDraft(ym);
        return (
          "<tr><td>" +
          esc(fmtYmJa(ym)) +
          '</td><td class="kac-fee-view-num">' +
          esc(String(p.contract_total)) +
          '</td><td class="kac-fee-view-num">' +
          esc(Number(p.unit_price_monthly).toLocaleString("ja-JP")) +
          "</td></tr>"
        );
      })
      .join("");
    box.innerHTML =
      (months.length
        ? '<div class="kac-fee-panel-block kac-fee-bulk-panel">' +
          '<p class="kac-fee-panel-title">契約数・月額の改定（指定月以降）</p>' +
          '<div class="kac-fee-bulk-fields">' +
          '<label class="kac-fee-bulk-field">年<input type="number" id="kac-fee-bulk-year" min="2000" max="2100" step="1" value="' +
          esc(String(bulkParts.y)) +
          '"></label>' +
          '<label class="kac-fee-bulk-field">月<select id="kac-fee-bulk-month">' +
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(function (m) {
              return (
                '<option value="' +
                m +
                '"' +
                (m === bulkParts.m ? " selected" : "") +
                ">" +
                m +
                "月</option>"
              );
            })
            .join("") +
          "</select></label>" +
          '<span class="kac-fee-bulk-suffix">以降</span>' +
          '<label class="kac-fee-bulk-field">契約数<input type="number" id="kac-fee-bulk-contract" min="0" step="1" value="' +
          esc(String(bulkParams.contract_total)) +
          '"></label>' +
          '<label class="kac-fee-bulk-field">月額（円）<input type="number" id="kac-fee-bulk-price" min="0" step="1" value="' +
          esc(String(bulkParams.unit_price_monthly)) +
          '"></label>' +
          '<button type="button" id="kac-fee-bulk-apply" class="kintoneplugin-button-dialog-ok">表に反映</button>' +
          "</div>" +
          '<p class="kac-hint">例: 2026年7月以降、契約数80・月額2000円 → 7月～12月が更新。表示期間すべてを同じ値にする場合は、期間の最初の月を指定してください。</p>' +
          "</div>" +
          '<div class="kac-fee-panel-block kac-fee-monthly-view">' +
          '<p class="kac-fee-panel-title">表示期間の月別設定（' +
          esc(String(months.length)) +
          " か月）</p>" +
          '<table class="kac-fee-monthly-table kac-fee-monthly-table-view"><thead><tr><th>月</th><th>総契約数</th><th>1アカウント月額（円）</th></tr></thead><tbody>' +
          monthRows +
          "</tbody></table>" +
          '<div class="kac-fee-save-row">' +
          '<button type="button" id="kac-fee-settings-save" class="kintoneplugin-button-dialog-ok">月別設定を保存</button>' +
          "</div></div>"
        : '<p class="kac-hint">期間（YYYY-MM）を指定してから月別設定を編集できます。</p>');

    var bulkBtn = document.getElementById("kac-fee-bulk-apply");
    if (bulkBtn) {
      bulkBtn.onclick = function () {
        var yEl = document.getElementById("kac-fee-bulk-year");
        var mEl = document.getElementById("kac-fee-bulk-month");
        var cEl = document.getElementById("kac-fee-bulk-contract");
        var pEl = document.getElementById("kac-fee-bulk-price");
        var fromYm = ymFromYearMonth(yEl ? yEl.value : "", mEl ? mEl.value : "");
        if (!fromYm) {
          alert("年・月を正しく指定してください");
          return;
        }
        if (months.indexOf(fromYm) < 0 && fromYm > months[months.length - 1]) {
          alert("指定月が表示期間外です");
          return;
        }
        applyFeeBulkFromMonth(
          fromYm,
          cEl ? cEl.value : bulkParams.contract_total,
          pEl ? pEl.value : bulkParams.unit_price_monthly,
          months,
        );
        renderFeeSettingsPanel();
      };
    }
    var saveBtn = document.getElementById("kac-fee-settings-save");
    if (saveBtn) {
      saveBtn.onclick = function () {
        if (!months.length) {
          alert("期間を指定してください");
          return;
        }
        commitFeeSettingsFromPanel(months);
        alert("月別設定を保存しました");
      };
    }
  }

  function renderSummaryPanel() {
    var box = document.getElementById("kac-summary-panel");
    if (!box) return;
    var st = currentMonthUsageStats();
    box.innerHTML =
      '<div class="kac-summary-grid">' +
      '<div class="kac-summary-item"><span class="kac-summary-label">1アカウント月額（' +
      esc(st.ym) +
      "）</span><strong>" +
      esc(Number(st.params.unit_price_monthly).toLocaleString("ja-JP")) +
      " 円</strong></div>" +
      '<div class="kac-summary-item"><span class="kac-summary-label">総契約数（' +
      esc(st.ym) +
      "）</span><strong>" +
      esc(String(st.params.contract_total)) +
      " 件</strong></div>" +
      '<div class="kac-summary-item"><span class="kac-summary-label">利用数（' +
      esc(st.ym) +
      "）</span><strong>" +
      esc(String(st.totalActive)) +
      "</strong></div>" +
      '<div class="kac-summary-item"><span class="kac-summary-label">余剰（本社配賦）</span><strong>' +
      esc(String(st.surplus)) +
      "</strong></div>" +
      '<div class="kac-summary-item"><span class="kac-summary-label">月額合計</span><strong>' +
      esc(fmtYen(st.monthlyTotal)) +
      "</strong></div>" +
      '<div class="kac-summary-breakdown">' +
      "<strong>支払箇所内訳（" +
      esc(st.ym) +
      "）</strong><br>" +
      "本社: 利用 " +
      esc(String(st.honshaUse)) +
      " + 余剰 " +
      esc(String(st.surplus)) +
      " = " +
      esc(String(st.honshaSubtotal)) +
      " 件（利用料 " +
      esc(fmtYen(st.honshaFee)) +
      "）<br>" +
      "首都圏: 利用 " +
      esc(String(st.shutokenUse)) +
      " 件（利用料 " +
      esc(fmtYen(st.shutokenFee)) +
      "）<br>" +
      "全社合計: " +
      esc(String(st.grandTotal)) +
      " 件 / 請求 " +
      esc(fmtYen(st.monthlyTotal)) +
      '<br><span class="kac-hint">契約数・月額の変更は下の「月次利用費用集計」→ 月別設定で行います。</span></div></div>';
  }

  function readFeeAggSelections() {
    var fromEl = document.getElementById("kac-fee-agg-from");
    var toEl = document.getElementById("kac-fee-agg-to");
    return {
      fromYm: fromEl ? fromEl.value : "",
      toYm: toEl ? toEl.value : "",
    };
  }

  function isFeeAccordionOpen() {
    var acc = document.getElementById("kac-fee-agg-acc");
    return !!(acc && acc.open);
  }

  function recalcFeeAgg(opts) {
    var silent = opts && opts.silent;
    if (state.loading) {
      renderFeeAggTable();
      return;
    }
    try {
      var sel = readFeeAggSelections();
      var result = buildFeeAggTable(sel);
      state.feeAggMonths = result.months;
      state.feeAggRows = result.rows;
      state.feeAggSummaryRows = result.summaryRows;
      state.feeAggDetailRows = result.detailRows;
      state.feeAggSummary = result.summary;
      renderFeeAggTable();
      renderFeeSettingsPanel();
    } catch (e) {
      if (!silent) alert(e.message || e);
    }
  }

  function recalcFeeAggOnOpen() {
    if (!isFeeAccordionOpen()) return;
    recalcFeeAgg({ silent: true });
  }

  function clearFeeAggConditions() {
    var r = defaultAggYearRange();
    var fromEl = document.getElementById("kac-fee-agg-from");
    var toEl = document.getElementById("kac-fee-agg-to");
    if (fromEl) fromEl.value = r.fromYm;
    if (toEl) toEl.value = r.toYm;
    recalcFeeAgg();
  }

  function exportFeeAggXlsx() {
    if (typeof XLSX === "undefined" || !XLSX.utils || !XLSX.writeFile) {
      alert("Excel 出力ライブラリが読み込まれていません。ページを再読み込みしてください。");
      return;
    }
    if (!state.feeAggSummaryRows.length) {
      alert("先に集計を実行してください");
      return;
    }
    var matrix = [];
    matrix.push(["【サマリー】"]);
    matrix.push(["項目"].concat(state.feeAggMonths));
    state.feeAggSummaryRows.forEach(function (row) {
      matrix.push([feeSummaryLabel(row) + "（件数）"].concat(row.counts || []));
      matrix.push([feeSummaryLabel(row) + "（利用料）"].concat(row.amounts || []));
    });
    matrix.push([]);
    matrix.push(["【内訳】"]);
    matrix.push(["支払箇所", "区分", "種別"].concat(state.feeAggMonths));
    state.feeAggDetailRows.forEach(function (row) {
      var cells = (row.values || []).map(function (v) {
        return Number(v);
      });
      matrix.push([row.paySite, row.category, row.metric].concat(cells));
    });
    matrix.push([]);
    matrix.push(["月別設定"]);
    matrix.push(["月", "総契約数", "1アカウント月額"]);
    state.feeAggMonths.forEach(function (ym) {
      var p = getMonthFeeParams(ym);
      matrix.push([ym, p.contract_total, p.unit_price_monthly]);
    });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "月次利用費用");
    XLSX.writeFile(wb, "Kintoneアカウント月次利用費用_" + todayJstYmd().replace(/-/g, "") + ".xlsx", {
      bookType: "xlsx",
    });
  }

  function openFeeAggPrintWindow() {
    if (!state.feeAggSummaryRows.length) {
      alert("先に集計を実行してください");
      return;
    }
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var summaryHead = feeSummaryTableHeadHtml(state.feeAggMonths, "kacfp");
    var summaryBody =
      "<tbody>" +
      state.feeAggSummaryRows
        .map(function (row) {
          return feeSummaryRowHtml(row, "kacfp");
        })
        .join("") +
      "</tbody>";
    var detailTable = feeDetailTableHtml(state.feeAggMonths, state.feeAggDetailRows, "kacfp");
    var html =
      '<header class="kacfp-header"><h1>Kintoneアカウント — 月次利用費用集計</h1>' +
      '<p class="kacfp-meta">印刷日: ' +
      esc(todayJstYmd()) +
      " / " +
      esc(state.feeAggSummary) +
      "</p></header>" +
      '<table class="kacfp-summary-table">' +
      summaryHead +
      summaryBody +
      "</table>" +
      (detailTable
        ? '<h2 class="kacfp-detail-title">内訳（利用分・余剰分）</h2>' + detailTable
        : "");
    var styles =
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:12px 14px;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;}' +
      ".kacfp-header{margin-bottom:10px;text-align:center;}" +
      ".kacfp-header h1{margin:0 0 6px;font-size:16pt;font-weight:700;color:#1e3a8a;}" +
      ".kacfp-meta{margin:0;font-size:10pt;color:#475569;}" +
      ".kacfp-table{width:100%;border-collapse:collapse;font-size:10pt;}" +
      ".kacfp-table th,.kacfp-table td{border:1px solid #64748b;padding:5px 6px;text-align:center;}" +
      ".kacfp-table th{background:#dbeafe;}" +
      ".kacfp-table td.kacfp-fee-pay,.kacfp-table td.kacfp-fee-cat{text-align:left;font-weight:600;}" +
      ".kacfp-table td.kacfp-fee-yen{text-align:right;font-size:9pt;white-space:nowrap;}" +
      ".kacfp-table tr.kacfp-fee-subtotal td{background:#dbeafe;font-weight:700;}" +
      ".kacfp-table tr.kacfp-fee-grand td{background:#bbf7d0;font-weight:700;}" +
      ".kacfp-summary-table{width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:14px;}" +
      ".kacfp-summary-table th,.kacfp-summary-table td{border:1px solid #64748b;padding:6px 8px;text-align:center;vertical-align:middle;}" +
      ".kacfp-summary-table th{background:#dbeafe;}" +
      ".kacfp-summary-table td.kacfp-fee-sum-label{text-align:left;font-weight:700;white-space:nowrap;}" +
      ".kacfp-summary-table tr.kacfp-fee-sum-subtotal td{background:#eff6ff;}" +
      ".kacfp-summary-table tr.kacfp-fee-sum-grand td{background:#bbf7d0;font-weight:700;}" +
      ".kacfp-summary-table .kacfp-fee-sum-count{display:block;font-weight:700;}" +
      ".kacfp-summary-table .kacfp-fee-sum-yen{display:block;font-size:9pt;color:#475569;margin-top:2px;}" +
      ".kacfp-detail-title{margin:16px 0 8px;font-size:12pt;color:#334155;}";
    var docHtml =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Kintone月次利用費用</title><style>' +
      styles +
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

  function buildShell() {
    if (document.getElementById("kac-root")) return;
    injectCss();
    state.isAdmin = isSystemAdmin();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "kac-root";
    root.className = "kac-root";
    var aggRange = defaultAggYearRange();
    root.innerHTML =
      '<div class="kac-toolbar">' +
      "<strong style=\"font-size:18px\">Kintoneアカウント管理台帳</strong>" +
      '<button type="button" id="kac-reload" class="kintoneplugin-button-normal">再読込</button>' +
      "</div>" +
      '<div id="kac-meta" class="kac-meta"></div>' +
      '<div id="kac-summary-panel" class="kac-summary-panel"></div>' +
      '<details class="kac-agg-acc" id="kac-agg-acc">' +
      "<summary>アカウント集計（現時点稼働数）</summary>" +
      '<div class="kac-agg-body">' +
      '<div class="kac-agg-output-bar">' +
      '<p id="kac-agg-meta" class="kac-hint">集計表を読み込み中…</p>' +
      '<div class="kac-agg-output-actions">' +
      '<button type="button" id="kac-agg-xlsx" class="kintoneplugin-button-normal">Excel</button>' +
      '<button type="button" id="kac-agg-print" class="kintoneplugin-button-normal">印刷</button>' +
      "</div></div>" +
      '<details class="kac-agg-cond-acc" id="kac-agg-cond-acc">' +
      "<summary>集計条件（所属グループ・所属）</summary>" +
      '<div class="kac-agg-cond-body">' +
      '<p class="kac-hint">条件を変えたあとは <strong>集計を更新</strong> を押してください。所属グループ・所属はチップをクリックで ON/OFF（緑=対象）。</p>' +
      '<div class="kac-agg-controls">' +
      '<div class="kac-agg-period-row">' +
      '<button type="button" id="kac-agg-recalc" class="kintoneplugin-button-dialog-ok">集計を更新</button>' +
      '<button type="button" id="kac-agg-clear" class="kintoneplugin-button-normal">条件クリア</button>' +
      "</div>" +
      '<div class="kac-agg-filter-row">' +
      '<span class="kac-agg-filter-label">所属グループ</span>' +
      '<div id="kac-agg-org" class="kac-agg-chips">' +
      aggChipBarHtml(ORGS, true) +
      "</div>" +
      '<button type="button" id="kac-agg-all-org" class="kac-agg-chip-link">すべて</button>' +
      "</div>" +
      '<div class="kac-agg-filter-row">' +
      '<span class="kac-agg-filter-label">所属</span>' +
      '<div id="kac-agg-dept" class="kac-agg-chips kac-agg-chips-dept">' +
      aggChipBarHtml(DEPTS, true) +
      "</div>" +
      '<button type="button" id="kac-agg-all-dept" class="kac-agg-chip-link">すべて</button>' +
      "</div></div></div></details>" +
      '<div id="kac-agg-table-wrap" class="kac-agg-table-wrap kac-agg-acc-table-wrap"></div>' +
      "</div></details>" +
      '<details class="kac-fee-agg-acc" id="kac-fee-agg-acc">' +
      "<summary>月次利用費用集計（開くと <strong>" +
      esc(currentJstYear()) +
      "年 1月～12月</strong> を表示）</summary>" +
      '<div class="kac-fee-agg-body">' +
      '<div id="kac-fee-settings" class="kac-fee-settings"></div>' +
      '<div class="kac-agg-output-bar">' +
      '<p id="kac-fee-agg-meta" class="kac-hint">集計表を読み込み中…</p>' +
      '<div class="kac-agg-output-actions">' +
      '<button type="button" id="kac-fee-agg-xlsx" class="kintoneplugin-button-normal">Excel</button>' +
      '<button type="button" id="kac-fee-agg-print" class="kintoneplugin-button-normal">印刷</button>' +
      "</div></div>" +
      '<div class="kac-agg-controls">' +
      '<div class="kac-agg-period-row">' +
      '<label>期間（開始）<input type="month" id="kac-fee-agg-from" value="' +
      esc(aggRange.fromYm) +
      '"></label>' +
      '<label>期間（終了）<input type="month" id="kac-fee-agg-to" value="' +
      esc(aggRange.toYm) +
      '"></label>' +
      '<button type="button" id="kac-fee-agg-year" class="kintoneplugin-button-normal">当年通年</button>' +
      '<button type="button" id="kac-fee-agg-recalc" class="kintoneplugin-button-dialog-ok">集計を更新</button>' +
      '<button type="button" id="kac-fee-agg-clear" class="kintoneplugin-button-normal">条件クリア</button>' +
      "</div></div>" +
      '<div id="kac-fee-agg-table-wrap" class="kac-agg-table-wrap"></div>' +
      "</div></details>" +
      '<div class="kac-filters">' +
      '<span class="kac-filter-label">検索</span>' +
      '<input type="search" id="kac-search" placeholder="ログインID / 表示名 / 所属 / 支払箇所 / 備考（スペース区切りで AND）">' +
      '<button type="button" id="kac-search-clear" class="kintoneplugin-button-normal">クリア</button>' +
      "</div>" +
      '<div class="kac-lifecycle-bar">' +
      '<span class="kac-lifecycle-label">表示:</span>' +
      '<button type="button" class="kac-lifecycle-btn' +
      (state.lifecycleFilter === "active" ? " active" : "") +
      '" data-lifecycle="active">稼働中</button>' +
      '<button type="button" class="kac-lifecycle-btn' +
      (state.lifecycleFilter === "all" ? " active" : "") +
      '" data-lifecycle="all">すべて</button>' +
      '<button type="button" class="kac-lifecycle-btn' +
      (state.lifecycleFilter === "terminated" ? " active" : "") +
      '" data-lifecycle="terminated">終了</button>' +
      "</div>" +
      '<div class="kac-table-wrap"><table class="kac-table"><thead><tr>' +
      "<th>状態</th>" +
      LIST_COLUMNS.map(function (c) {
        return "<th>" + esc(c.label) + "</th>";
      }).join("") +
      "<th>操作</th></tr></thead><tbody id=\"kac-tbody\"></tbody></table></div>";
    host.appendChild(root);

    document.getElementById("kac-reload").addEventListener("click", function () {
      reloadRecords();
    });
    var search = document.getElementById("kac-search");
    search.value = state.search;
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    document.getElementById("kac-search-clear").addEventListener("click", function () {
      clearListFilters();
    });
    root.querySelectorAll(".kac-lifecycle-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLifecycleFilter(btn.getAttribute("data-lifecycle"));
      });
    });
    document.getElementById("kac-agg-all-org").addEventListener("click", function () {
      setAggChipsAll(document.getElementById("kac-agg-org"), true);
    });
    document.getElementById("kac-agg-all-dept").addEventListener("click", function () {
      setAggChipsAll(document.getElementById("kac-agg-dept"), true);
    });
    wireAggChipBar(document.getElementById("kac-agg-org"));
    wireAggChipBar(document.getElementById("kac-agg-dept"));
    document.getElementById("kac-agg-recalc").addEventListener("click", function () {
      recalcAgg();
    });
    document.getElementById("kac-agg-clear").addEventListener("click", function () {
      clearAggConditions();
    });
    document.getElementById("kac-agg-xlsx").addEventListener("click", exportAggXlsx);
    document.getElementById("kac-agg-print").addEventListener("click", openAggPrintWindow);
    var aggAcc = document.getElementById("kac-agg-acc");
    if (aggAcc) {
      aggAcc.addEventListener("toggle", function () {
        if (aggAcc.open) recalcAggOnOpen();
      });
    }
    renderSummaryPanel();
    renderFeeSettingsPanel();
    document.getElementById("kac-fee-agg-year").addEventListener("click", function () {
      var r = defaultAggYearRange();
      var fromEl = document.getElementById("kac-fee-agg-from");
      var toEl = document.getElementById("kac-fee-agg-to");
      if (fromEl) fromEl.value = r.fromYm;
      if (toEl) toEl.value = r.toYm;
      recalcFeeAgg();
    });
    document.getElementById("kac-fee-agg-recalc").addEventListener("click", function () {
      recalcFeeAgg();
    });
    document.getElementById("kac-fee-agg-clear").addEventListener("click", function () {
      clearFeeAggConditions();
    });
    document.getElementById("kac-fee-agg-xlsx").addEventListener("click", exportFeeAggXlsx);
    document.getElementById("kac-fee-agg-print").addEventListener("click", openFeeAggPrintWindow);
    var feeAcc = document.getElementById("kac-fee-agg-acc");
    if (feeAcc) {
      feeAcc.addEventListener("toggle", function () {
        if (feeAcc.open) recalcFeeAggOnOpen();
      });
    }
    renderAggTable();
    renderFeeAggTable();
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
      console.error(BUILD, "APP_DB is not set — run kintone-account:sync-dash-db-id");
      return ev;
    }
    scheduleMount();
    return ev;
  });
})();
