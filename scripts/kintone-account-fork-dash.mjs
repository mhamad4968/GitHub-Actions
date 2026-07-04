#!/usr/bin/env node
/** Fork: jre-cloud-account-dash → kintone-account-dash/desktop.src.js */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = path.join(root, 'customize/jre-cloud-account-dash/desktop.src.js');
const orgsPath = path.join(root, 'scripts/data/kintone-account-orgs.json');
const deptsPath = path.join(root, 'scripts/data/kintone-account-depts-by-org.json');
const outDir = path.join(root, 'customize/kintone-account-dash');
const outPath = path.join(outDir, 'desktop.src.js');

const ORGS = JSON.parse(readFileSync(orgsPath, 'utf8'));
const deptsRaw = JSON.parse(readFileSync(deptsPath, 'utf8'));
const { _comment, ...DEPTS_BY_ORG } = deptsRaw;
const deptSet = new Set();
Object.values(DEPTS_BY_ORG).forEach((arr) => arr.forEach((d) => deptSet.add(d)));
const DEPTS = [...deptSet];

mkdirSync(outDir, { recursive: true });
let s = readFileSync(srcPath, 'utf8');

// Global prefix + branding
s = s.replace(/jca-/g, 'kac-');
s = s.replace(/jcaap-/g, 'kacap-');
s = s.replace(/jcal-/g, 'kacl-');

s = s.replace(
  /\/\*\* JREクラウドアカウント台帳 — DB REST CRUD \+ 月次集計 \+ 一覧出力 \*\//,
  '/** Kintoneアカウント管理台帳 — DB REST CRUD + 月次集計 + 利用費用集計 + 一覧出力 */',
);

s = s.replace(
  /var BUILD = "[^"]+";/,
  'var BUILD = "2026-07-05-kintone-account-dash-v1";',
);
s = s.replace(/var APP_DB = \d+;/, 'var APP_DB = 0;');

s = s.replace(
  /var ORGS = \[[\s\S]*?\];\s*\n\s*var DEPTS = \[[\s\S]*?\];\s*\n\s*var GROUP595_MAP = \{[\s\S]*?\};/,
  `var ORGS = ${JSON.stringify(ORGS, null, 2)};

  var DEPTS_BY_ORG = ${JSON.stringify(DEPTS_BY_ORG, null, 2)};

  var DEPTS = ${JSON.stringify(DEPTS, null, 2)};

  var PAY_SITES = ["本社", "首都圏支店"];

  var ACCOUNT_TYPES = ["特権アカウント", "本社共有", "本社個人", "首都圏支店個人"];

  var PAY_SITE_BY_TYPE = {
    特権アカウント: "本社",
    本社共有: "本社",
    本社個人: "本社",
    首都圏支店個人: "首都圏支店",
  };

  var SETTINGS_LS_KEY = "kintone-account-ledger-settings-v1";

  var DEFAULT_SETTINGS = { contract_total: 77, unit_price_monthly: 1800 };`,
);

s = s.replace(
  /var FC = \{[\s\S]*?\};/,
  `var FC = {
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
  };`,
);

s = s.replace(
  /var API_FIELDS = \[[\s\S]*?\];/,
  `var API_FIELDS = [
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
  ];`,
);

s = s.replace(
  /var LIST_COLUMNS = \[[\s\S]*?\];/,
  `var LIST_COLUMNS = [
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
  ];`,
);

s = s.replace(
  'var LIST_EXPORT_COLUMNS = LIST_COLUMNS.slice(0, 8);',
  'var LIST_EXPORT_COLUMNS = LIST_COLUMNS.slice();',
);

s = s.replace(
  /var state = \{[\s\S]*?\};/,
  `var state = {
    records: [],
    search: "",
    lifecycleFilter: "active",
    loading: false,
    isAdmin: false,
    aggMonths: [],
    aggRows: [],
    aggSummary: "",
    feeAggRows: [],
    feeAggMonths: [],
    settings: loadSettings(),
  };`,
);

// Insert settings helpers after currentJstYear
s = s.replace(
  /  function currentJstYear\(\) \{[\s\S]*?  \}\n\n  \/\*\* 集計既定/,
  `  function currentJstYear() {
    return todayJstYmd().slice(0, 4);
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_LS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return {
          contract_total: Number(parsed.contract_total) || DEFAULT_SETTINGS.contract_total,
          unit_price_monthly: Number(parsed.unit_price_monthly) || DEFAULT_SETTINGS.unit_price_monthly,
        };
      }
    } catch (e) {
      console.warn(BUILD, e);
    }
    return {
      contract_total: DEFAULT_SETTINGS.contract_total,
      unit_price_monthly: DEFAULT_SETTINGS.unit_price_monthly,
    };
  }

  function saveSettings(next) {
    state.settings = {
      contract_total: Math.max(0, Number(next.contract_total) || 0),
      unit_price_monthly: Math.max(0, Number(next.unit_price_monthly) || 0),
    };
    try {
      localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(state.settings));
    } catch (e) {
      console.warn(BUILD, e);
    }
    renderSummaryPanel();
    renderFeeSettingsPanel();
  }

  function currentMonthUsageStats() {
    var ym = currentJstYm();
    var honshaUse = countActiveByPaySiteMonth("本社", ym);
    var shutokenUse = countActiveByPaySiteMonth("首都圏支店", ym);
    var totalActive = countTotalActiveMonth(ym);
    var surplus = Math.max(0, state.settings.contract_total - totalActive);
    return {
      ym: ym,
      honshaUse: honshaUse,
      shutokenUse: shutokenUse,
      totalActive: totalActive,
      surplus: surplus,
      honshaSubtotal: honshaUse + surplus,
      shutokenSubtotal: shutokenUse,
      grandTotal: honshaUse + surplus + shutokenUse,
      monthlyTotal: state.settings.contract_total * state.settings.unit_price_monthly,
    };
  }

  function fmtYen(n) {
    return Number(n || 0).toLocaleString("ja-JP") + " 円";
  }

  /** 集計既定`,
);

s = s.replace(
  /  function flatten\(rec\) \{[\s\S]*?  \}/,
  `  function flatten(rec) {
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
  }`,
);

s = s.replace(
  /  function formatDeptLabel\(org, dept\) \{[\s\S]*?  \}/,
  `  function formatDeptLabel(org, dept) {
    return String(dept || "").trim();
  }`,
);

s = s.replace(
  /  function buildRecordSearchHaystack\(row\) \{[\s\S]*?  \}/,
  `  function buildRecordSearchHaystack(row) {
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
  }`,
);

s = s.replace(
  /  function compareListRows\(a, b\) \{[\s\S]*?  \}/,
  `  function compareListRows(a, b) {
    return String(a.login_id || "").localeCompare(String(b.login_id || ""), "ja");
  }`,
);

s = s.replace(
  /  function isValidJbisEmail\(s\) \{[\s\S]*?  \}\n\n  function normalizeEmail\(s\) \{[\s\S]*?  \}\n\n  function resolveOrgFrom595\(empRow\) \{[\s\S]*?  \}/,
  `  function normalizeLoginId(s) {
    return String(s || "").trim();
  }

  function isTerminatedRow(row) {
    return String(row.status || "").trim() === "終了" || !!String(row.end_date || "").trim();
  }

  function isActiveRow(row) {
    return !isTerminatedRow(row);
  }`,
);

s = s.replace(
  /  function toKintoneRecord\(row\) \{[\s\S]*?  \}/,
  `  function toKintoneRecord(row) {
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
  }`,
);

s = s.replace(
  /var query = "order by user_id asc limit "/,
  'var query = "order by login_id asc limit "',
);

s = s.replace(
  /  function checkDuplicateUserId\(userId, excludeId\) \{[\s\S]*?  \}/,
  `  function checkDuplicateLoginId(loginId, excludeId) {
    var id = normalizeLoginId(loginId);
    for (var i = 0; i < state.records.length; i++) {
      var r = state.records[i];
      if (excludeId && r.id === excludeId) continue;
      if (normalizeLoginId(r.login_id) === id) {
        throw new Error("ログインID「" + loginId + "」は既に登録されています");
      }
    }
  }`,
);

s = s.replace(
  /  function validateRow\(row, isNew\) \{[\s\S]*?  \}/,
  `  function validateRow(row, isNew) {
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
  }`,
);

s = s.replace(
  /  function apply595PickToForm\(empRow\) \{[\s\S]*?  \}/,
  `  function apply595PickToForm(empRow) {
    var displayEl = document.getElementById("kac-f-display-name");
    var loginNameEl = document.getElementById("kac-f-login-name");
    if (!displayEl || !loginNameEl) return;
    var userName = val(empRow, "user_name").trim();
    displayEl.value = userName;
    loginNameEl.value = userName;
    setCreate595Picked(true);
  }`,
);

s = s.replace(
  /  function deptOptionsHtml\(selected\) \{[\s\S]*?  \}/,
  `  function deptOptionsHtml(selected, org) {
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
  }`,
);

s = s.replace(
  /  function readFormRow\(existing\) \{[\s\S]*?  \}/,
  `  function readFormRow(existing) {
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
  }`,
);

s = s.replace(
  /  function formFieldsHtml\(row, isNew\) \{[\s\S]*?  \}/,
  `  function formFieldsHtml(row, isNew) {
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
  }`,
);

s = s.replace(
  /  function wireCreate595Search\(\) \{[\s\S]*?  \}/,
  `  function wireFormDependencies() {
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
  }`,
);

s = s.replace(
  '    if (isCreate) wireCreate595Search();',
  '    if (isCreate) wireCreate595Search();\n    wireFormDependencies();',
);

s = s.replace(
  /          if \(isCreate && !isCreate595Picked\(\)\) \{[\s\S]*?          \}\n          var updated;/,
  '          var updated;',
);

s = s.replace(
  /    var title = isCreate \? "新規作成" : "編集 — " \+ \(row\.user_name \|\| row\.user_id \|\| ""\);/,
  '    var title = isCreate ? "新規作成" : "編集 — " + (row.display_name || row.login_id || "");',
);

s = s.replace(
  /        label: "利用終了（退職）",/,
  '        label: "終了",',
);

s = s.replace(
  /  function retireRecord\(row\) \{[\s\S]*?  \}/,
  `  function retireRecord(row) {
    if (!state.isAdmin || !row || !row.id) return;
    var msg =
      "表示名: " +
      row.display_name +
      "（" +
      row.login_id +
      "）\\n\\n利用終了日を " +
      todayJstYmd() +
      " に設定し、ステータスを「終了」にします（物理削除はしません）。\\n\\nよろしいですか？";
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
  }`,
);

s = s.replace(
  /      if \(state\.lifecycleFilter === "active" && r\.end_date\) return false;\n      if \(state\.lifecycleFilter === "terminated" && !r\.end_date\) return false;/,
  `      if (state.lifecycleFilter === "active" && isTerminatedRow(r)) return false;
      if (state.lifecycleFilter === "terminated" && !isTerminatedRow(r)) return false;`,
);

s = s.replace(
  /      tbody\.innerHTML = '<tr><td colspan="11">読込中…<\/td><\/tr>';/,
  '      tbody.innerHTML = \'<tr><td colspan="12">読込中…</td></tr>\';',
);
s = s.replace(
  /      tbody\.innerHTML = '<tr><td colspan="11">該当なし<\/td><\/tr>';/,
  '      tbody.innerHTML = \'<tr><td colspan="12">該当なし</td></tr>\';',
);

s = s.replace(
  /        var statusBadge = row\.end_date[\s\S]*?'<span class="kac-badge kac-badge-active">稼働<\/span>';/,
  `        var statusBadge =
          isTerminatedRow(row)
            ? '<span class="kac-badge kac-badge-terminated">終了</span>'
            : '<span class="kac-badge kac-badge-active">稼働</span>';`,
);

s = s.replace(
  /            \(!row\.end_date[\s\S]*?'<button type="button" class="kac-btn-retire">利用終了<\/button>'/,
  `            isActiveRow(row)
              ? '<button type="button" class="kac-btn-retire">終了</button>'`,
);

s = s.replace(
  /  function buildAggSummaryText\(sel, months\) \{[\s\S]*?  \}/,
  `  function buildAggSummaryText(sel, months) {
    var parts = ["期間=" + sel.fromYm + "～" + sel.toYm];
    if (sel.orgs.length && sel.orgs.length < ORGS.length) {
      parts.push("所属グループ=" + sel.orgs.join("、"));
    }
    if (sel.depts.length && sel.depts.length < DEPTS.length) {
      parts.push("所属=" + sel.depts.join("、"));
    }
    parts.push("列=" + months.length + " か月");
    return parts.join(" / ");
  }`,
);

s = s.replace(
  /if \(!sel\.orgs\.length\) throw new Error\("所属組織を1つ以上選択してください"\);/,
  'if (!sel.orgs.length) throw new Error("所属グループを1つ以上選択してください");',
);
s = s.replace(
  /if \(!sel\.depts\.length\) throw new Error\("部署を1つ以上選択してください"\);/,
  'if (!sel.depts.length) throw new Error("所属を1つ以上選択してください");',
);

s = s.replace(
  /'-agg-th-org">所属組織</,
  "'-agg-th-org\">所属グループ<",
);
s = s.replace(
  /'-agg-th-dept">部署</,
  "'-agg-th-dept\">所属<",
);

// Fee aggregation functions — insert before buildShell
const feeAggBlock = `
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

  function buildFeeAggTable(sel) {
    var months = enumerateMonths(sel.fromYm, sel.toYm);
    if (!months.length) {
      throw new Error("期間（YYYY-MM）を正しく指定してください");
    }
    var contractTotal = state.settings.contract_total;
    var rows = [];
    function pushRow(paySite, category, counts, kind) {
      rows.push({ paySite: paySite, category: category, counts: counts, kind: kind || "detail" });
    }
    var honshaUse = months.map(function (ym) {
      return countActiveByPaySiteMonth("本社", ym);
    });
    var shutokenUse = months.map(function (ym) {
      return countActiveByPaySiteMonth("首都圏支店", ym);
    });
    var honshaSurplus = months.map(function (ym) {
      return Math.max(0, contractTotal - countTotalActiveMonth(ym));
    });
    var honshaSub = months.map(function (ym, i) {
      return honshaUse[i] + honshaSurplus[i];
    });
    var shutokenSub = shutokenUse.slice();
    var grand = months.map(function (ym, i) {
      return honshaSub[i] + shutokenSub[i];
    });
    pushRow("本社", "利用分", honshaUse);
    pushRow("本社", "余剰分", honshaSurplus);
    pushRow("本社", "小計", honshaSub, "subtotal");
    pushRow("首都圏支店", "利用分", shutokenUse);
    pushRow("首都圏支店", "小計", shutokenSub, "subtotal");
    pushRow("全社", "合計", grand, "grand");
    var summary =
      "期間=" +
      sel.fromYm +
      "～" +
      sel.toYm +
      " / 単価=" +
      fmtYen(state.settings.unit_price_monthly) +
      " / 総契約数=" +
      contractTotal;
    return { months: months, rows: rows, summary: summary };
  }

  function feeRowHtml(row, prefix) {
    var p = prefix || "kac";
    var trCls = p + "-fee-row";
    if (row.kind === "subtotal") trCls += " " + p + "-fee-subtotal";
    if (row.kind === "grand") trCls += " " + p + "-fee-grand";
    return (
      "<tr class=\\"" +
      trCls +
      '\\"><td class="' +
      p +
      '-fee-pay">' +
      esc(row.paySite) +
      '</td><td class="' +
      p +
      '-fee-cat">' +
      esc(row.category) +
      "</td>" +
      aggMonthCellsHtml(row.counts, p) +
      "</tr>"
    );
  }

  function feeTableHeadHtml(months, prefix) {
    var p = prefix || "kac";
    return (
      "<thead><tr><th class=\\"" +
      p +
      '-fee-th-pay">支払箇所</th><th class="' +
      p +
      '-fee-th-cat">区分</th>' +
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
    if (!state.feeAggRows.length || !state.feeAggMonths.length) {
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
    var head = feeTableHeadHtml(state.feeAggMonths, "kac");
    var body =
      "<tbody>" +
      state.feeAggRows
        .map(function (row) {
          return feeRowHtml(row, "kac");
        })
        .join("") +
      "</tbody>";
    var meta = document.getElementById("kac-fee-agg-meta");
    if (meta) {
      meta.innerHTML =
        esc(state.feeAggSummary) +
        ' <span class="kac-hint">（余剰 ID は本社に計上）</span>';
    }
    wrap.innerHTML = '<table class="kac-fee-agg-table">' + head + body + "</table>";
  }

  function renderFeeSettingsPanel() {
    var box = document.getElementById("kac-fee-settings");
    if (!box) return;
    box.innerHTML =
      '<div class="kac-fee-settings-grid">' +
      '<label>1アカウント月額<input type="number" id="kac-fee-unit-price" min="0" step="1" value="' +
      esc(String(state.settings.unit_price_monthly)) +
      '"></label>' +
      '<label>総契約数<input type="number" id="kac-fee-contract-total" min="0" step="1" value="' +
      esc(String(state.settings.contract_total)) +
      '"></label>' +
      '<button type="button" id="kac-fee-settings-save" class="kintoneplugin-button-dialog-ok">設定保存</button>' +
      '<p class="kac-hint">余剰 ID は <strong>本社</strong> に計上されます。</p>' +
      "</div>";
    var saveBtn = document.getElementById("kac-fee-settings-save");
    if (saveBtn) {
      saveBtn.onclick = function () {
        saveSettings({
          unit_price_monthly: document.getElementById("kac-fee-unit-price").value,
          contract_total: document.getElementById("kac-fee-contract-total").value,
        });
        alert("設定を保存しました");
      };
    }
  }

  function renderSummaryPanel() {
    var box = document.getElementById("kac-summary-panel");
    if (!box) return;
    var st = currentMonthUsageStats();
    box.innerHTML =
      '<div class="kac-summary-grid">' +
      '<div class="kac-summary-item"><span class="kac-summary-label">1アカウント月額</span>' +
      '<input type="number" id="kac-summary-unit-price" min="0" step="1" value="' +
      esc(String(state.settings.unit_price_monthly)) +
      '"></div>' +
      '<div class="kac-summary-item"><span class="kac-summary-label">総契約数</span>' +
      '<input type="number" id="kac-summary-contract-total" min="0" step="1" value="' +
      esc(String(state.settings.contract_total)) +
      '"></div>' +
      '<button type="button" id="kac-summary-save" class="kintoneplugin-button-dialog-ok">保存</button>' +
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
      "<br>" +
      "首都圏: 利用 " +
      esc(String(st.shutokenUse)) +
      "</div></div>";
    var saveBtn = document.getElementById("kac-summary-save");
    if (saveBtn) {
      saveBtn.onclick = function () {
        saveSettings({
          unit_price_monthly: document.getElementById("kac-summary-unit-price").value,
          contract_total: document.getElementById("kac-summary-contract-total").value,
        });
        alert("設定を保存しました");
      };
    }
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
      state.feeAggSummary = result.summary;
      renderFeeAggTable();
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
    if (!state.feeAggRows.length) {
      alert("先に集計を実行してください");
      return;
    }
    var header = ["支払箇所", "区分"].concat(state.feeAggMonths);
    var matrix = [header];
    state.feeAggRows.forEach(function (row) {
      matrix.push([row.paySite, row.category].concat(row.counts || []));
    });
    matrix.push([]);
    matrix.push(["単価", state.settings.unit_price_monthly]);
    matrix.push(["総契約数", state.settings.contract_total]);
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "月次利用費用");
    XLSX.writeFile(wb, "Kintoneアカウント月次利用費用_" + todayJstYmd().replace(/-/g, "") + ".xlsx", {
      bookType: "xlsx",
    });
  }

  function openFeeAggPrintWindow() {
    if (!state.feeAggRows.length) {
      alert("先に集計を実行してください");
      return;
    }
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var head = feeTableHeadHtml(state.feeAggMonths, "kacfp");
    var body =
      "<tbody>" +
      state.feeAggRows
        .map(function (row) {
          return feeRowHtml(row, "kacfp");
        })
        .join("") +
      "</tbody>";
    var html =
      '<header class="kacfp-header"><h1>Kintoneアカウント — 月次利用費用集計</h1>' +
      '<p class="kacfp-meta">印刷日: ' +
      esc(todayJstYmd()) +
      " / " +
      esc(state.feeAggSummary) +
      "</p></header>" +
      '<table class="kacfp-table">' +
      head +
      body +
      "</table>";
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
      ".kacfp-table tr.kacfp-fee-subtotal td{background:#dbeafe;font-weight:700;}" +
      ".kacfp-table tr.kacfp-fee-grand td{background:#bbf7d0;font-weight:700;}";
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
`;

s = s.replace('  function buildShell() {', feeAggBlock + '\n  function buildShell() {');

// buildShell HTML updates
s = s.replace(
  '<strong style=\\"font-size:18px\\">JREクラウドアカウント台帳</strong>',
  '<strong style=\\"font-size:18px\\">Kintoneアカウント管理台帳</strong>',
);

s = s.replace(
  '<div id="kac-meta" class="kac-meta"></div>' +
      '\n      \'<details class="kac-agg-acc"',
  '<div id="kac-meta" class="kac-meta"></div>' +
      '\n      \'<div id="kac-summary-panel" class="kac-summary-panel"></div>' +
      '\n      \'<details class="kac-agg-acc"',
);

// Fix the above - need to match actual string in file after replacements
s = s.replace(
  /'<div id="kac-meta" class="kac-meta"><\/div>' \+\n      '<details class="kac-agg-acc"/,
  `'<div id="kac-meta" class="kac-meta"></div>' +
      '<div id="kac-summary-panel" class="kac-summary-panel"></div>' +
      '<details class="kac-agg-acc"`,
);

// Fee accordion after account agg accordion
s = s.replace(
  /'<div id="kac-agg-table-wrap" class="kac-agg-table-wrap"><\/div>' \+\n      "<\/div><\/details>" \+\n      '<div class="kac-filters">'/,
  `'<div id="kac-agg-table-wrap" class="kac-agg-table-wrap"></div>' +
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
      '<div class="kac-filters">'`,
);

// Fix agg accordion labels
s = s.replace(
  '集計条件（期間・所属組織・部署）',
  '集計条件（期間・所属グループ・所属）',
);
s = s.replace(
  '所属組織・部署は必要に応じて絞り込めます',
  '所属グループ・所属は必要に応じて絞り込めます',
);
s = s.replace(
  '<span class="kac-agg-filter-label">所属組織</span>',
  '<span class="kac-agg-filter-label">所属グループ</span>',
);
s = s.replace(
  '<span class="kac-agg-filter-label">部署</span>',
  '<span class="kac-agg-filter-label">所属</span>',
);
s = s.replace(
  'data-lifecycle="terminated">退職・無効</button>',
  'data-lifecycle="terminated">終了</button>',
);
s = s.replace(
  'placeholder="ユーザID / 氏名 / 所属・部署 / 備考（スペース区切りで AND）"',
  'placeholder="ログインID / 表示名 / 所属 / 支払箇所 / 備考（スペース区切りで AND）"',
);

// Wire fee accordion in buildShell end
s = s.replace(
  /    renderAggTable\(\);\n  \}\n\n  function scheduleMount/,
  `    renderSummaryPanel();
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

  function scheduleMount`,
);

// reloadRecords updates
s = s.replace(
  /        updateMeta\(\);\n        if \(isAggAccordionOpen\(\)\) recalcAggOnOpen\(\);/,
  `        updateMeta();
        renderSummaryPanel();
        if (isAggAccordionOpen()) recalcAggOnOpen();
        if (isFeeAccordionOpen()) recalcFeeAggOnOpen();`,
);

// updateMeta active count
s = s.replace(
  /    state\.records\.forEach\(function \(r\) \{\n      if \(!r\.end_date\) activeCount \+= 1;\n    \}\);/,
  `    state.records.forEach(function (r) {
      if (isActiveRow(r)) activeCount += 1;
    });`,
);

// Branding in exports/prints
const reps = [
  ['JREクラウドアカウント — 月次数量集計', 'Kintoneアカウント — 月次数量集計'],
  ['JREクラウドアカウント台帳 — 一覧', 'Kintoneアカウント管理台帳 — 一覧'],
  ['JREクラウド月次集計_', 'Kintoneアカウント月次集計_'],
  ['JREクラウドアカウント一覧_', 'Kintoneアカウント一覧_'],
  ['JRE月次集計', 'Kintone月次集計'],
  ['JREクラウド一覧', 'Kintoneアカウント一覧'],
  ['else if (state.lifecycleFilter === "terminated") parts.push("表示=退職・無効");', 'else if (state.lifecycleFilter === "terminated") parts.push("表示=終了");'],
  ['console.error(BUILD, "APP_DB is not set — run jre-cloud-account:sync-dash-db-id");', 'console.error(BUILD, "APP_DB is not set — run kintone-account:sync-dash-db-id");'],
  ['var header = ["所属組織", "部署"].concat(state.aggMonths);', 'var header = ["所属グループ", "所属"].concat(state.aggMonths);'],
];
for (const [a, b] of reps) {
  s = s.split(a).join(b);
}

// CSS additions for summary and fee panels
s = s.replace(
  '".kac-595-actions{display:flex;gap:8px;margin:8px 0;}";',
  '".kac-595-actions{display:flex;gap:8px;margin:8px 0;}"+' +
    '".kac-summary-panel{margin-bottom:14px;padding:14px 18px;border:2px solid #6366f1;border-radius:10px;background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%);}"+' +
    '".kac-summary-grid{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-end;}"+' +
    '".kac-summary-item{display:flex;flex-direction:column;gap:4px;font-size:14px;}"+' +
    '".kac-summary-label{color:#475569;font-size:13px;}"+' +
    '".kac-summary-breakdown{flex:1 1 100%;font-size:14px;line-height:1.6;}"+' +
    '".kac-fee-settings{margin-bottom:12px;padding:10px 12px;border:1px solid #c7d2fe;border-radius:6px;background:#f8fafc;}"+' +
    '".kac-fee-settings-grid{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:flex-end;}"+' +
    '".kac-fee-agg-acc{margin-bottom:14px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;}"+' +
    '".kac-fee-agg-acc>summary{cursor:pointer;padding:12px 16px;font-size:15px;font-weight:600;color:#334155;user-select:none;}"+' +
    '".kac-fee-agg-body{padding:12px 16px 16px;}"+' +
    '".kac-fee-agg-table{border-collapse:collapse;width:100%;font-size:14px;min-width:640px;}"+' +
    '".kac-fee-agg-table th,.kac-fee-agg-table td{border:1px solid #e2e8f0;padding:6px 8px;text-align:center;}"+' +
    '".kac-fee-agg-table th{background:#f1f5f9;}"+' +
    '".kac-fee-agg-table td.kac-fee-pay,.kac-fee-agg-table td.kac-fee-cat{text-align:left;font-weight:600;}"+' +
    '".kac-fee-agg-table tr.kac-fee-subtotal td{background:#dbeafe;font-weight:700;}"+' +
    '".kac-fee-agg-table tr.kac-fee-grand td{background:#bbf7d0;font-weight:700;}";',
);

writeFileSync(outPath, s, 'utf8');
const lines = s.split('\n').length;
console.log('wrote', outPath, 'lines=', lines);
