(function () {
  "use strict";

  /** JREクラウドアカウント台帳 — DB REST CRUD + 月次集計 + 一覧出力 */
  var BUILD = "2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13";
  var APP_DB = 744;
  var APP_EMP_MASTER = 595;
  var PAGE_SIZE = 100;

  var ORGS = ["本社", "東京支店", "東北支店", "関越支店", "湾岸工事所"];

  var DEPTS = [
    "－",
    "役員室",
    "管理部",
    "安全部",
    "工事部",
    "施工部",
    "施工支援部",
    "メンテナンス技術部",
    "橋りょうリペア部",
    "技術部",
    "仙台営業所",
    "盛岡営業所",
    "秋田営業所",
    "新潟営業所",
    "長野営業所",
    "高崎営業所",
    "千葉営業所",
    "水戸営業所",
  ];

  var GROUP595_MAP = {
    honsha: "本社",
    本社: "本社",
    tokyo: "東京支店",
    東京: "東京支店",
    東京支店: "東京支店",
    tohoku: "東北支店",
    東北: "東北支店",
    東北支店: "東北支店",
    kanetsu: "関越支店",
    関越: "関越支店",
    関越支店: "関越支店",
    wangan: "湾岸工事所",
    湾岸: "湾岸工事所",
    湾岸工事所: "湾岸工事所",
  };

  var FC = {
    user_id: "user_id",
    user_name: "user_name",
    org: "org",
    dept: "dept",
    phone: "phone",
    mail: "mail",
    start_date: "start_date",
    end_date: "end_date",
    note: "note",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.user_id,
    FC.user_name,
    FC.org,
    FC.dept,
    FC.phone,
    FC.mail,
    FC.start_date,
    FC.end_date,
    FC.note,
  ];

  var LIST_COLUMNS = [
    { key: "user_id", label: "ユーザID" },
    { key: "user_name", label: "ユーザ名" },
    { key: "org", label: "所属組織" },
    { key: "dept", label: "部署" },
    { key: "phone", label: "電話番号" },
    { key: "mail", label: "メールアドレス" },
    { key: "start_date", label: "利用開始日" },
    { key: "end_date", label: "利用終了日" },
    { key: "note", label: "備考" },
  ];

  var LIST_EXPORT_COLUMNS = LIST_COLUMNS.slice(0, 8);

  var state = {
    records: [],
    search: "",
    lifecycleFilter: "active",
    loading: false,
    isAdmin: false,
    aggMonths: [],
    aggRows: [],
    aggSummary: "",
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
      user_id: val(rec, FC.user_id),
      user_name: val(rec, FC.user_name),
      org: val(rec, FC.org),
      dept: val(rec, FC.dept),
      phone: val(rec, FC.phone),
      mail: val(rec, FC.mail),
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
    var d = String(dept || "").trim();
    var o = String(org || "").trim();
    if (d === "－" && o.indexOf("支店") >= 0) return o;
    return d;
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
    var deptLabel = formatDeptLabel(org, dept);
    var parts = [
      row.user_id,
      row.user_name,
      org,
      dept,
      deptLabel,
      row.phone,
      row.mail,
      row.note,
    ];
    if (org && dept) {
      parts.push(org + " " + dept);
      parts.push(org + dept);
      parts.push(org + " / " + dept);
      parts.push(org + "・" + dept);
      parts.push(org + "／" + dept);
    }
    if (org && deptLabel && deptLabel !== dept) {
      parts.push(org + " " + deptLabel);
      parts.push(org + deptLabel);
      parts.push(org + " / " + deptLabel);
      parts.push(org + "・" + deptLabel);
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

  function compareListRows(a, b) {
    var oa = orgRank(a.org) - orgRank(b.org);
    if (oa !== 0) return oa;
    var da = deptRank(a.dept) - deptRank(b.dept);
    if (da !== 0) return da;
    return String(a.user_name || "").localeCompare(String(b.user_name || ""), "ja");
  }

  function isValidJbisEmail(s) {
    var v = String(s || "").trim().toLowerCase();
    if (!v) return false;
    return /^[a-z0-9._+-]+@j-bis\.co\.jp$/.test(v);
  }

  function normalizeEmail(s) {
    return String(s || "").trim().toLowerCase();
  }

  function resolveOrgFrom595(empRow) {
    var group = val(empRow, "group_name").trim();
    if (GROUP595_MAP[group]) return GROUP595_MAP[group];
    return "";
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

  function toKintoneRecord(row) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
      else if (code === FC.phone || code === FC.end_date || code === FC.note) {
        o[code] = { value: v || "" };
      }
    }
    set(FC.user_id, row.user_id);
    set(FC.user_name, row.user_name);
    set(FC.org, row.org);
    set(FC.dept, row.dept);
    set(FC.phone, row.phone);
    set(FC.mail, row.mail);
    set(FC.start_date, row.start_date);
    set(FC.end_date, row.end_date);
    set(FC.note, row.note);
    return o;
  }

  function fetchAllRecords() {
    var all = [];
    var offset = 0;
    function page() {
      var query = "order by user_id asc limit " + PAGE_SIZE + " offset " + offset;
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

  function checkDuplicateUserId(userId, excludeId) {
    var id = normalizeEmail(userId);
    for (var i = 0; i < state.records.length; i++) {
      var r = state.records[i];
      if (excludeId && r.id === excludeId) continue;
      if (normalizeEmail(r.user_id) === id) {
        throw new Error("ユーザID「" + userId + "」は既に登録されています");
      }
    }
  }

  function validateRow(row, isNew) {
    var userId = String(row.user_id || "").trim();
    var mail = String(row.mail || "").trim();
    var userName = String(row.user_name || "").trim();
    var org = String(row.org || "").trim();
    var dept = String(row.dept || "").trim();
    var startDate = String(row.start_date || "").trim();
    var endDate = String(row.end_date || "").trim();

    if (!userId) throw new Error("ユーザIDは必須です");
    if (!userName) throw new Error("ユーザ名は必須です");
    if (!org) throw new Error("所属組織は必須です");
    if (!dept) throw new Error("部署は必須です");
    if (!mail) throw new Error("メールアドレスは必須です");
    if (!startDate) throw new Error("利用開始日は必須です");
    if (!isValidJbisEmail(userId)) {
      throw new Error("ユーザIDは @j-bis.co.jp 形式で入力してください");
    }
    if (!isValidJbisEmail(mail)) {
      throw new Error("メールアドレスは @j-bis.co.jp 形式で入力してください");
    }
    if (endDate && endDate < startDate) {
      throw new Error("利用終了日は利用開始日以降にしてください");
    }
    if (isNew) checkDuplicateUserId(userId, null);
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
    var el = document.getElementById("jca-create-595-picked");
    if (el) el.value = picked ? "1" : "";
  }

  function isCreate595Picked() {
    var el = document.getElementById("jca-create-595-picked");
    return el && el.value === "1";
  }

  function open595SearchModal(onPick) {
    var existing = document.getElementById("jca-595-modal-root");
    if (existing) existing.remove();
    var bg = document.createElement("div");
    bg.id = "jca-595-modal-root";
    bg.className = "jca-modal-bg";
    bg.innerHTML =
      '<div class="jca-modal jca-595-modal" role="dialog">' +
      "<h3>社員名検索（595）</h3>" +
      '<label>検索<input type="search" id="jca-595-q" placeholder="氏名の一部"></label>' +
      '<div class="jca-595-actions">' +
      '<button type="button" id="jca-595-run" class="kintoneplugin-button-normal">検索</button>' +
      '<button type="button" id="jca-595-cancel" class="kintoneplugin-button-normal">キャンセル</button>' +
      "</div>" +
      '<div id="jca-595-results" class="jca-595-results"></div></div>';
    document.body.appendChild(bg);

    function renderResults(rows) {
      var box = document.getElementById("jca-595-results");
      if (!box) return;
      if (!rows.length) {
        box.innerHTML = '<p class="jca-hint">該当なし</p>';
        return;
      }
      box.innerHTML = rows
        .map(function (rec, i) {
          var name = val(rec, "user_name");
          var group = val(rec, "group_name");
          var mail = val(rec, "mail");
          return (
            '<button type="button" class="jca-595-pick kintoneplugin-button-normal" data-i="' +
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
      box.querySelectorAll(".jca-595-pick").forEach(function (btn) {
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
      var kw = document.getElementById("jca-595-q").value.trim();
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

    bg.querySelector("#jca-595-run").onclick = runSearch;
    bg.querySelector("#jca-595-cancel").onclick = function () {
      bg.remove();
    };
    bg.querySelector("#jca-595-q").onkeydown = function (e) {
      if (e.key === "Enter") runSearch();
    };
    bg.addEventListener("click", function (ev) {
      if (ev.target === bg) bg.remove();
    });
    setTimeout(function () {
      var q = document.getElementById("jca-595-q");
      if (q) q.focus();
    }, 0);
  }

  function apply595PickToForm(empRow) {
    var nameEl = document.getElementById("jca-f-user-name");
    var mailEl = document.getElementById("jca-f-mail");
    var userIdEl = document.getElementById("jca-f-user-id");
    var orgEl = document.getElementById("jca-f-org");
    var orgWarn = document.getElementById("jca-f-org-warn");
    if (!nameEl || !mailEl || !userIdEl || !orgEl) return;

    var userName = val(empRow, "user_name").trim();
    var mail = val(empRow, "mail").trim();
    if (!mail && userName) {
      mail = "";
    }
    nameEl.value = userName;
    mailEl.value = mail;
    userIdEl.value = mail;
    setCreate595Picked(true);

    var org = resolveOrgFrom595(empRow);
    if (org) {
      orgEl.value = org;
      if (orgWarn) orgWarn.textContent = "";
    } else if (orgWarn) {
      orgWarn.textContent =
        "595の所属「" +
        (val(empRow, "group_name") || val(empRow, "dept_name") || "—") +
        "」は JRE 所属組織に未マッチです。手動で選択してください。";
    }
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

  function deptOptionsHtml(selected) {
    return DEPTS.map(function (d) {
      return (
        '<option value="' +
        esc(d) +
        '"' +
        (selected === d ? " selected" : "") +
        ">" +
        esc(d) +
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
    var el = document.getElementById("jca-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "jca-modal-root";
    bg.className = "jca-modal-bg";
    var box = document.createElement("div");
    box.className = "jca-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "jca-modal-actions";
    buttons.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      if (b.danger) btn.className = "jca-modal-retire kintoneplugin-button-normal";
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
      user_id: document.getElementById("jca-f-user-id").value.trim(),
      user_name: document.getElementById("jca-f-user-name").value.trim(),
      org: document.getElementById("jca-f-org").value.trim(),
      dept: document.getElementById("jca-f-dept").value.trim(),
      phone: document.getElementById("jca-f-phone").value.trim(),
      mail: document.getElementById("jca-f-mail").value.trim(),
      start_date: document.getElementById("jca-f-start-date").value.trim(),
      end_date: document.getElementById("jca-f-end-date").value.trim(),
      note: document.getElementById("jca-f-note").value.trim(),
    };
    if (!isNew) {
      row.id = existing.id;
      row.revision = existing.revision;
      row.user_id = existing.user_id;
    }
    validateRow(row, isNew);
    return row;
  }

  function formFieldsHtml(row, isNew) {
    var r = row || {};
    var userIdAttrs = isNew ? "" : ' readonly';
    return (
      (isNew
        ? '<input type="hidden" id="jca-create-595-picked" value="">' +
          '<div class="jca-create-595-step">' +
          '<button type="button" id="jca-create-595-search" class="kintoneplugin-button-dialog-ok jca-create-595-btn">社員名検索（595）</button>' +
          "</div>" +
          '<p class="jca-hint">社員名検索でユーザ名・メール・ユーザID（メールと同一）を自動入力します。</p>'
        : "") +
      '<label>ユーザID<input type="email" id="jca-f-user-id" value="' +
      esc(r.user_id || "") +
      '"' +
      userIdAttrs +
      ' autocomplete="off"></label>' +
      '<label>ユーザ名<input type="text" id="jca-f-user-name" value="' +
      esc(r.user_name || "") +
      '"></label>' +
      '<label>所属組織<select id="jca-f-org">' +
      orgOptionsHtml(r.org) +
      '</select></label>' +
      '<div id="jca-f-org-warn" class="jca-warn"></div>' +
      '<label>部署<select id="jca-f-dept">' +
      deptOptionsHtml(r.dept || "－") +
      '</select></label>' +
      '<p class="jca-hint">部署は JREクラウド請求用です。595 の所属とは異なります。</p>' +
      '<label>電話番号<input type="text" id="jca-f-phone" value="' +
      esc(r.phone || "") +
      '"></label>' +
      '<label>メールアドレス<input type="email" id="jca-f-mail" value="' +
      esc(r.mail || "") +
      '"></label>' +
      '<label>利用開始日<input type="date" id="jca-f-start-date" value="' +
      esc(r.start_date || todayJstYmd()) +
      '"></label>' +
      '<label>利用終了日<input type="date" id="jca-f-end-date" value="' +
      esc(r.end_date || "") +
      '"></label>' +
      '<label>備考<textarea id="jca-f-note" rows="3">' +
      esc(r.note || "") +
      "</textarea></label>"
    );
  }

  function wireCreate595Search() {
    var btn = document.getElementById("jca-create-595-search");
    if (!btn) return;
    btn.onclick = function () {
      open595SearchModal(apply595PickToForm);
    };
    var mailEl = document.getElementById("jca-f-mail");
    if (mailEl) {
      mailEl.addEventListener("input", function () {
        var userIdEl = document.getElementById("jca-f-user-id");
        if (userIdEl && !userIdEl.readOnly) userIdEl.value = mailEl.value.trim();
      });
    }
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
          if (isCreate && !isCreate595Picked()) {
            alert("先に「社員名検索（595）」で利用者を選択してください。");
            return;
          }
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
    if (row && row.id && !isCreate && !row.end_date) {
      buttons.unshift({
        label: "利用終了（退職）",
        danger: true,
        onClick: function () {
          retireRecord(row);
        },
      });
    }
    var title = isCreate ? "新規作成" : "編集 — " + (row.user_name || row.user_id || "");
    openModal(title, formFieldsHtml(row, isCreate), buttons);
    if (isCreate) wireCreate595Search();
  }

  function retireRecord(row) {
    if (!state.isAdmin || !row || !row.id) return;
    var msg =
      "ユーザ: " +
      row.user_name +
      "（" +
      row.user_id +
      "）\n\n利用終了日を " +
      todayJstYmd() +
      " に設定します（物理削除はしません）。\n\nよろしいですか？";
    if (!window.confirm(msg)) return;
    apiPut("/k/v1/record.json", {
      app: APP_DB,
      id: Number(row.id),
      revision: Number(row.revision),
      record: {
        end_date: { value: todayJstYmd() },
      },
    })
      .then(function () {
        closeModal();
        return reloadRecords();
      })
      .then(function () {
        alert("利用終了日を設定しました");
      })
      .catch(function (e) {
        alert("退職処理失敗: " + formatKintoneApiError(e));
      });
  }

  function filteredRecords() {
    var q = state.search.trim();
    var rows = state.records.filter(function (r) {
      if (state.lifecycleFilter === "active" && r.end_date) return false;
      if (state.lifecycleFilter === "terminated" && !r.end_date) return false;
      if (!q) return true;
      return recordMatchesSearch(r, q);
    });
    rows.sort(compareListRows);
    return rows;
  }

  function setLifecycleFilter(mode) {
    if (mode !== "active" && mode !== "all" && mode !== "terminated") return;
    state.lifecycleFilter = mode;
    var root = document.getElementById("jca-root");
    if (root) {
      root.querySelectorAll(".jca-lifecycle-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-lifecycle") === mode);
      });
    }
    renderTable();
  }

  function cellText(text) {
    var t = String(text || "").trim();
    if (!t) return '<span class="jca-none">—</span>';
    return esc(t);
  }

  function renderTable() {
    var tbody = document.getElementById("jca-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="11">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="11">該当なし</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (row) {
        var statusBadge = row.end_date
          ? '<span class="jca-badge jca-badge-terminated">終了</span>'
          : '<span class="jca-badge jca-badge-active">稼働</span>';
        var actionBtns = "";
        if (state.isAdmin) {
          actionBtns =
            '<button type="button" class="jca-btn-edit">編集</button>' +
            (!row.end_date
              ? '<button type="button" class="jca-btn-retire">利用終了</button>'
              : "");
        }
        return (
          "<tr>" +
          "<td>" +
          statusBadge +
          "</td>" +
          LIST_COLUMNS.map(function (col) {
            return "<td>" + cellText(listFieldDisplay(row, col.key)) + "</td>";
          }).join("") +
          '<td class="jca-actions">' +
          actionBtns +
          "</td></tr>"
        );
      })
      .join("");

    rows.forEach(function (row, idx) {
      var tr = tbody.rows[idx];
      if (!tr) return;
      var editB = tr.querySelector(".jca-btn-edit");
      if (editB) {
        editB.addEventListener("click", function () {
          openEditModal(row);
        });
      }
      var retireB = tr.querySelector(".jca-btn-retire");
      if (retireB) {
        retireB.addEventListener("click", function () {
          retireRecord(row);
        });
      }
    });
  }

  function readAggSelections() {
    var fromEl = document.getElementById("jca-agg-from");
    var toEl = document.getElementById("jca-agg-to");
    var orgSel = document.getElementById("jca-agg-org");
    var deptSel = document.getElementById("jca-agg-dept");
    return {
      fromYm: fromEl ? fromEl.value : "",
      toYm: toEl ? toEl.value : "",
      orgs: selectedMultiSelectValues(orgSel),
      depts: selectedMultiSelectValues(deptSel),
    };
  }

  function buildAggSummaryText(sel, months) {
    var parts = ["期間=" + sel.fromYm + "～" + sel.toYm];
    if (sel.orgs.length && sel.orgs.length < ORGS.length) {
      parts.push("所属組織=" + sel.orgs.join("、"));
    }
    if (sel.depts.length && sel.depts.length < DEPTS.length) {
      parts.push("部署=" + sel.depts.join("、"));
    }
    parts.push("列=" + months.length + " か月");
    return parts.join(" / ");
  }

  function buildAggTable(sel) {
    var months = enumerateMonths(sel.fromYm, sel.toYm);
    if (!months.length) {
      throw new Error("期間（YYYY-MM）を正しく指定してください");
    }
    if (!sel.orgs.length) throw new Error("所属組織を1つ以上選択してください");
    if (!sel.depts.length) throw new Error("部署を1つ以上選択してください");

    var orgList = orderedAggOrgs(sel.orgs);
    var deptList = orderedAggDepts(sel.depts);
    var rows = [];

    orgList.forEach(function (org) {
      var detailRows = [];
      deptList.forEach(function (dept) {
        var counts = months.map(function (ym) {
          return countOrgDeptMonth(org, dept, ym);
        });
        if (counts.every(function (n) {
          return n === 0;
        })) {
          return;
        }
        detailRows.push({ dept: dept, counts: counts });
      });

      detailRows.forEach(function (dr, idx) {
        rows.push({
          kind: "detail",
          org: org,
          dept: dr.dept,
          counts: dr.counts,
          orgRowspan: idx === 0 ? detailRows.length + 1 : 0,
          orgGroupStart: idx === 0,
        });
      });

      var subCounts = months.map(function (ym) {
        return countOrgDeptsMonth(org, deptList, ym);
      });
      rows.push({
        kind: "subtotal",
        org: org,
        counts: subCounts,
        orgGroupEnd: true,
        orgCoveredByRowspan: detailRows.length > 0,
      });
    });

    var grandCounts = months.map(function (ym) {
      return countGrandFiltered(orgList, deptList, ym);
    });
    rows.push({
      kind: "grand",
      label: "全社合計",
      counts: grandCounts,
    });
    return { months: months, rows: rows, summary: buildAggSummaryText(sel, months) };
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
      '-agg-th-org">所属組織</th><th class="' +
      p +
      '-agg-th-dept">部署</th>' +
      months
        .map(function (ym) {
          return "<th>" + esc(ym) + "</th>";
        })
        .join("") +
      "</tr></thead>"
    );
  }

  function isAggAccordionOpen() {
    var acc = document.getElementById("jca-agg-acc");
    return !!(acc && acc.open);
  }

  function renderAggTable() {
    var wrap = document.getElementById("jca-agg-table-wrap");
    if (!wrap) return;
    if (!state.aggRows.length || !state.aggMonths.length) {
      if (state.loading) {
        wrap.innerHTML = '<p class="jca-hint">読込中…</p>';
      } else if (isAggAccordionOpen()) {
        wrap.innerHTML = '<p class="jca-hint">集計を計算しています…</p>';
      } else {
        wrap.innerHTML =
          '<p class="jca-hint">開くと <strong>当年（' +
          esc(currentJstYear()) +
          "年）1月～12月</strong> の月末稼働数を表示します。所属組織・部署は必要に応じて絞り込めます。</p>";
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
    var meta = document.getElementById("jca-agg-meta");
    if (meta) {
      meta.innerHTML =
        esc(state.aggSummary) +
        ' <span class="jca-agg-legend">（<span class="jca-agg-legend-max">全社合計の最大月=青</span>・<span class="jca-agg-legend-min">最小月=赤</span>）</span>';
    }
    wrap.innerHTML =
      '<table class="jca-agg-table">' + head + body + "</table>";
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
    var header = ["所属組織", "部署"].concat(state.aggMonths);
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
    XLSX.utils.book_append_sheet(wb, ws, "月次集計");
    XLSX.writeFile(wb, "JREクラウド月次集計_" + todayJstYmd().replace(/-/g, "") + ".xlsx", {
      bookType: "xlsx",
    });
  }

  function aggPrintStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:12px 14px;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".jcaap-header{margin-bottom:10px;text-align:center;}" +
      ".jcaap-header h1{margin:0 0 6px;font-size:16pt;font-weight:700;color:#1e3a8a;}" +
      ".jcaap-meta{margin:0;font-size:10pt;color:#475569;}" +
      ".jcaap-table{width:100%;border-collapse:collapse;font-size:10pt;}" +
      ".jcaap-table th,.jcaap-table td{border:1px solid #64748b;padding:5px 6px;text-align:center;}" +
      ".jcaap-table th{background:#dbeafe;}" +
      ".jcaap-table td.jcaap-org-cell,.jcaap-table td.jcaap-dept-cell{text-align:left;font-weight:600;white-space:nowrap;}" +
      ".jcaap-table tr.jcaap-org-start td{border-top:2px solid #64748b;}" +
      ".jcaap-table tr.jcaap-org-end td{border-bottom:2px solid #94a3b8;}" +
      ".jcaap-table tr.jcaap-detail td.jcaap-dept-cell{font-weight:500;}" +
      ".jcaap-table tr.jcaap-subtotal td{background:#dbeafe;color:#1e3a8a;font-weight:700;}" +
      ".jcaap-table tr.jcaap-subtotal td.jcaap-dept-cell{font-style:normal;}" +
      ".jcaap-table td.jcaap-agg-month-max{color:#1d4ed8;font-weight:700;}" +
      ".jcaap-table td.jcaap-agg-month-min{color:#b91c1c;font-weight:700;}" +
      ".jcaap-table tr.jcaap-grand td{background:#bbf7d0;color:#14532d;font-weight:700;border-top:2px solid #4ade80;}" +
      ".jcaap-table tr.jcaap-grand td.jcaap-agg-month-max{color:#1d4ed8;}" +
      ".jcaap-table tr.jcaap-grand td.jcaap-agg-month-min{color:#b91c1c;}" +
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
              '<tr class="jcaap-row jcaap-grand"><td colspan="2" class="jcaap-org-cell">全社合計</td>' +
              aggMonthCellsHtml(row.counts, "jcaap", true) +
              "</tr>"
            );
          }
          var labels = aggRowLabelCells(row);
          var trCls = "jcaap-row";
          if (row.kind === "subtotal") trCls += " jcaap-subtotal jcaap-org-end";
          if (row.kind === "detail") {
            trCls += " jcaap-detail";
            if (row.orgGroupStart) trCls += " jcaap-org-start";
          }
          var orgTd = "";
          if (row.kind === "detail") {
            if (row.orgRowspan > 0) {
              orgTd =
                '<td class="jcaap-org-cell" rowspan="' +
                row.orgRowspan +
                '">' +
                esc(labels.org) +
                "</td>";
            }
          } else if (row.kind === "subtotal") {
            if (!row.orgCoveredByRowspan) {
              orgTd = '<td class="jcaap-org-cell">' + esc(row.org) + "</td>";
            }
          }
          return (
            "<tr class=\"" +
            trCls +
            '">' +
            orgTd +
            '<td class="jcaap-dept-cell">' +
            esc(labels.dept) +
            "</td>" +
            aggMonthCellsHtml(row.counts, "jcaap") +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>";
    var html =
      '<header class="jcaap-header"><h1>JREクラウドアカウント — 月次数量集計</h1>' +
      '<p class="jcaap-meta">印刷日: ' +
      esc(todayJstYmd()) +
      " / " +
      esc(state.aggSummary) +
      "</p></header>" +
      '<table class="jcaap-table">' +
      head +
      body +
      "</table>";
    var docHtml =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>JRE月次集計</title><style>' +
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
    else if (state.lifecycleFilter === "terminated") parts.push("表示=退職・無効");
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
    XLSX.writeFile(wb, "JREクラウドアカウント一覧_" + listExportFilenameStamp() + ".xlsx", {
      bookType: "xlsx",
    });
  }

  function listPrintStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:12px 14px;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".jcal-header{margin-bottom:10px;text-align:center;}" +
      ".jcal-header h1{margin:0 0 6px;font-size:16pt;font-weight:700;color:#1e3a8a;}" +
      ".jcal-meta{margin:0;font-size:10pt;color:#475569;}" +
      ".jcal-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10pt;}" +
      ".jcal-table th,.jcal-table td{border:1px solid #64748b;padding:5px 4px;vertical-align:top;line-height:1.4;word-break:break-word;overflow-wrap:anywhere;}" +
      ".jcal-table th{background:#dbeafe;font-weight:700;}" +
      ".jcal-table tr:nth-child(even) td{background:#f8fafc;}" +
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
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>JREクラウド一覧</title><style>' +
      listPrintStylesheet() +
      "</style></head><body>" +
      '<header class="jcal-header"><h1>JREクラウドアカウント台帳 — 一覧</h1>' +
      '<p class="jcal-meta">印刷日: ' +
      esc(todayJstYmd()) +
      " / " +
      esc(summary) +
      "</p></header>" +
      '<table class="jcal-table">' +
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
    var el = document.getElementById("jca-meta");
    if (!el) return;
    var activeCount = 0;
    state.records.forEach(function (r) {
      if (!r.end_date) activeCount += 1;
    });
    var html =
      '<span class="jca-meta-count">全 ' +
      esc(String(state.records.length)) +
      " 件（稼働中 " +
      esc(String(activeCount)) +
      " 件）</span>";
    html +=
      '<div class="jca-meta-actions">' +
      (state.isAdmin
        ? '<button type="button" id="jca-new" class="kintoneplugin-button-dialog-ok">新規作成</button>'
        : "") +
      '<button type="button" id="jca-list-xlsx" class="kintoneplugin-button-normal">一覧 Excel</button>' +
      '<button type="button" id="jca-list-print" class="kintoneplugin-button-normal">一覧印刷</button>' +
      (state.isAdmin
        ? ""
        : '<span class="jca-readonly-msg">閲覧のみ（編集はシステム管理者）</span>') +
      "</div>";
    el.innerHTML = html;
    var newBtn = document.getElementById("jca-new");
    if (newBtn) {
      newBtn.addEventListener("click", function () {
        openEditModal({}, { createMode: true });
      });
    }
    var xlsxBtn = document.getElementById("jca-list-xlsx");
    if (xlsxBtn) xlsxBtn.addEventListener("click", function () {
      runListExport("xlsx");
    });
    var printBtn = document.getElementById("jca-list-print");
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
        if (isAggAccordionOpen()) recalcAggOnOpen();
      })
      .catch(function (e) {
        state.loading = false;
        renderTable();
        alert("読込失敗: " + formatKintoneApiError(e));
      });
  }

  function injectCss() {
    if (document.getElementById("jca-dash-css")) return;
    var st = document.createElement("style");
    st.id = "jca-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".jca-root{font-family:Segoe UI,Meiryo,sans-serif;font-size:15px;padding:8px 12px 24px;max-width:100%;}" +
      ".jca-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px;}" +
      ".jca-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-bottom:12px;padding:16px 20px;" +
      "background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:2px solid #10b981;border-radius:12px;" +
      "box-shadow:0 2px 8px rgba(16,185,129,.12);}" +
      ".jca-meta-count{font-size:15px;color:#475569;font-weight:500;}" +
      ".jca-meta-actions{margin-left:auto;display:flex;flex-wrap:wrap;gap:8px;align-items:center;}" +
      ".jca-readonly-msg{font-size:14px;color:#64748b;margin-left:auto;}" +
      ".jca-agg-acc{margin-bottom:14px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;}" +
      ".jca-agg-acc>summary{cursor:pointer;padding:12px 16px;font-size:15px;font-weight:600;color:#334155;user-select:none;}" +
      ".jca-agg-acc[open]>summary{border-bottom:1px solid #e2e8f0;}" +
      ".jca-agg-body{padding:12px 16px 16px;}" +
      ".jca-agg-cond-acc{margin-bottom:12px;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:6px;background:#fffbeb;}" +
      ".jca-agg-cond-acc>summary{cursor:pointer;padding:10px 14px;font-size:14px;font-weight:600;color:#92400e;user-select:none;background:#fffbeb;border-radius:5px 5px 0 0;}" +
      ".jca-agg-cond-acc[open]>summary{border-bottom:1px solid #fde68a;margin-bottom:0;background:#fef3c7;}" +
      ".jca-agg-cond-body{padding:12px 14px 14px;background:#fffbeb;}" +
      ".jca-agg-output-bar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;margin-bottom:10px;}" +
      ".jca-agg-output-bar .jca-hint{margin:0;flex:1;min-width:200px;}" +
      ".jca-agg-output-actions{display:flex;flex-wrap:wrap;gap:8px;}" +
      ".jca-agg-controls{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:flex-end;margin-bottom:12px;}" +
      ".jca-agg-controls label{font-size:14px;display:flex;flex-direction:column;gap:4px;}" +
      ".jca-agg-controls input,.jca-agg-controls select{font-size:15px;padding:6px 8px;}" +
      ".jca-agg-multi{min-width:160px;}" +
      ".jca-agg-actions{display:flex;flex-wrap:wrap;gap:8px;}" +
      ".jca-agg-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:6px;}" +
      ".jca-agg-table{border-collapse:collapse;width:100%;font-size:14px;min-width:640px;}" +
      ".jca-agg-table th,.jca-agg-table td{border:1px solid #e2e8f0;padding:6px 8px;text-align:center;}" +
      ".jca-agg-table th{background:#f1f5f9;}" +
      ".jca-agg-table th.jca-agg-th-org,.jca-agg-table th.jca-agg-th-dept{min-width:88px;}" +
      ".jca-agg-table td.jca-agg-org-cell,.jca-agg-table td.jca-agg-dept-cell{text-align:left;vertical-align:middle;white-space:nowrap;}" +
      ".jca-agg-table td.jca-agg-org-cell{font-weight:700;background:#fff;}" +
      ".jca-agg-table tr.jca-agg-org-start td{border-top:2px solid #94a3b8;}" +
      ".jca-agg-table tr.jca-agg-org-end td{border-bottom:2px solid #cbd5e1;}" +
      ".jca-agg-table tr.jca-agg-detail td.jca-agg-dept-cell{font-weight:500;}" +
      ".jca-agg-table tr.jca-agg-subtotal td{background:#dbeafe;color:#1e3a8a;font-weight:700;border-top:1px solid #93c5fd;}" +
      ".jca-agg-table tr.jca-agg-subtotal td.jca-agg-dept-cell{letter-spacing:.02em;}" +
      ".jca-agg-table tr.jca-agg-grand td{background:#bbf7d0;color:#14532d;font-weight:700;border-top:2px solid #4ade80;}" +
      ".jca-agg-table tr.jca-agg-grand td.jca-agg-month-max{color:#1d4ed8;}" +
      ".jca-agg-table tr.jca-agg-grand td.jca-agg-month-min{color:#b91c1c;}" +
      ".jca-agg-legend-max{color:#1d4ed8;font-weight:700;}" +
      ".jca-agg-legend-min{color:#b91c1c;font-weight:700;}" +
      ".jca-filters{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:8px;}" +
      ".jca-filters input{padding:8px 10px;font-size:15px;min-width:260px;}" +
      ".jca-lifecycle-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;}" +
      ".jca-lifecycle-label{font-size:14px;font-weight:600;color:#475569;}" +
      ".jca-lifecycle-btn{padding:8px 18px;font-size:15px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;}" +
      ".jca-lifecycle-btn.active{background:#059669;color:#fff;border-color:#059669;font-weight:700;}" +
      ".jca-lifecycle-btn:hover:not(.active){background:#f1f5f9;}" +
      ".jca-table-wrap{overflow:auto;max-height:calc(100vh - 320px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".jca-table{border-collapse:collapse;width:100%;font-size:14px;min-width:1400px;}" +
      ".jca-table th,.jca-table td{border:1px solid #e2e8f0;padding:6px 8px;vertical-align:middle;line-height:1.45;}" +
      ".jca-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;}" +
      ".jca-none{color:#64748b;font-style:italic;}" +
      ".jca-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;}" +
      ".jca-badge-active{background:#dcfce7;color:#166534;}" +
      ".jca-badge-terminated{background:#fee2e2;color:#991b1b;}" +
      ".jca-actions button{margin:0 3px;padding:4px 10px;font-size:13px;}" +
      ".jca-hint{font-size:13px;color:#64748b;margin:6px 0;line-height:1.5;}" +
      ".jca-warn{font-size:13px;color:#b45309;margin:4px 0 8px;}" +
      ".jca-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".jca-modal{background:#fff;border-radius:8px;padding:18px 20px;max-width:620px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);font-size:15px;}" +
      ".jca-modal h3{margin:0 0 14px;font-size:18px;}" +
      ".jca-modal label{display:block;margin:10px 0;font-size:15px;}" +
      ".jca-modal input,.jca-modal select,.jca-modal textarea{width:100%;box-sizing:border-box;padding:8px;font-size:15px;margin-top:4px;}" +
      ".jca-modal-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      ".jca-modal-retire{margin-right:auto;color:#b91c1c;}" +
      ".jca-create-595-step{margin:8px 0 12px;}" +
      ".jca-create-595-btn{font-size:15px;padding:10px 18px;}" +
      ".jca-595-results{margin-top:10px;max-height:240px;overflow:auto;display:flex;flex-direction:column;gap:6px;}" +
      ".jca-595-pick{text-align:left;white-space:normal;}" +
      ".jca-595-actions{display:flex;gap:8px;margin:8px 0;}";
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

  function buildShell() {
    if (document.getElementById("jca-root")) return;
    injectCss();
    state.isAdmin = isSystemAdmin();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "jca-root";
    root.className = "jca-root";
    var aggRange = defaultAggYearRange();
    root.innerHTML =
      '<div class="jca-toolbar">' +
      "<strong style=\"font-size:18px\">JREクラウドアカウント台帳</strong>" +
      '<button type="button" id="jca-reload" class="kintoneplugin-button-normal">再読込</button>' +
      "</div>" +
      '<div id="jca-meta" class="jca-meta"></div>' +
      '<details class="jca-agg-acc" id="jca-agg-acc">' +
      "<summary>月次アカウント数量集計（開くと <strong>" +
      esc(currentJstYear()) +
      "年 1月～12月</strong> を表示）</summary>" +
      '<div class="jca-agg-body">' +
      '<div class="jca-agg-output-bar">' +
      '<p id="jca-agg-meta" class="jca-hint">集計表を読み込み中…</p>' +
      '<div class="jca-agg-output-actions">' +
      '<button type="button" id="jca-agg-xlsx" class="kintoneplugin-button-normal">Excel</button>' +
      '<button type="button" id="jca-agg-print" class="kintoneplugin-button-normal">印刷</button>' +
      "</div></div>" +
      '<details class="jca-agg-cond-acc" id="jca-agg-cond-acc">' +
      "<summary>集計条件（期間・所属組織・部署）</summary>" +
      '<div class="jca-agg-cond-body">' +
      '<p class="jca-hint">条件を変えたあとは <strong>集計を更新</strong> を押してください。既定は当年通年・全所属組織・全部署。</p>' +
      '<div class="jca-agg-controls">' +
      '<label>期間（開始）<input type="month" id="jca-agg-from" value="' +
      esc(aggRange.fromYm) +
      '"></label>' +
      '<label>期間（終了）<input type="month" id="jca-agg-to" value="' +
      esc(aggRange.toYm) +
      '"></label>' +
      '<label>所属組織（複数）<select id="jca-agg-org" class="jca-agg-multi" multiple size="5">' +
      multiSelectOptionsHtml(ORGS, true) +
      "</select></label>" +
      '<label>部署（複数）<select id="jca-agg-dept" class="jca-agg-multi" multiple size="6">' +
      multiSelectOptionsHtml(DEPTS, true) +
      "</select></label>" +
      '<div class="jca-agg-actions">' +
      '<button type="button" id="jca-agg-all-org" class="kintoneplugin-button-normal">所属組織 全選択</button>' +
      '<button type="button" id="jca-agg-all-dept" class="kintoneplugin-button-normal">部署全選択</button>' +
      '<button type="button" id="jca-agg-year" class="kintoneplugin-button-normal">当年通年</button>' +
      '<button type="button" id="jca-agg-recalc" class="kintoneplugin-button-dialog-ok">集計を更新</button>' +
      "</div></div></div></details>" +
      '<div id="jca-agg-table-wrap" class="jca-agg-table-wrap"></div>' +
      "</div></details>" +
      '<div class="jca-filters">' +
      '<input type="search" id="jca-search" placeholder="ユーザID / 氏名 / 所属・部署 / 備考（スペース区切りで AND）">' +
      '<button type="button" id="jca-search-clear" class="kintoneplugin-button-normal">クリア</button>' +
      "</div>" +
      '<div class="jca-lifecycle-bar">' +
      '<span class="jca-lifecycle-label">表示:</span>' +
      '<button type="button" class="jca-lifecycle-btn' +
      (state.lifecycleFilter === "active" ? " active" : "") +
      '" data-lifecycle="active">稼働中</button>' +
      '<button type="button" class="jca-lifecycle-btn' +
      (state.lifecycleFilter === "all" ? " active" : "") +
      '" data-lifecycle="all">すべて</button>' +
      '<button type="button" class="jca-lifecycle-btn' +
      (state.lifecycleFilter === "terminated" ? " active" : "") +
      '" data-lifecycle="terminated">退職・無効</button>' +
      "</div>" +
      '<div class="jca-table-wrap"><table class="jca-table"><thead><tr>' +
      "<th>状態</th>" +
      LIST_COLUMNS.map(function (c) {
        return "<th>" + esc(c.label) + "</th>";
      }).join("") +
      "<th>操作</th></tr></thead><tbody id=\"jca-tbody\"></tbody></table></div>";
    host.appendChild(root);

    document.getElementById("jca-reload").addEventListener("click", function () {
      reloadRecords();
    });
    var search = document.getElementById("jca-search");
    search.value = state.search;
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    document.getElementById("jca-search-clear").addEventListener("click", function () {
      state.search = "";
      search.value = "";
      renderTable();
    });
    root.querySelectorAll(".jca-lifecycle-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLifecycleFilter(btn.getAttribute("data-lifecycle"));
      });
    });
    document.getElementById("jca-agg-all-org").addEventListener("click", function () {
      setMultiSelectAll(document.getElementById("jca-agg-org"), true);
    });
    document.getElementById("jca-agg-all-dept").addEventListener("click", function () {
      setMultiSelectAll(document.getElementById("jca-agg-dept"), true);
    });
    document.getElementById("jca-agg-year").addEventListener("click", function () {
      var r = defaultAggYearRange();
      var fromEl = document.getElementById("jca-agg-from");
      var toEl = document.getElementById("jca-agg-to");
      if (fromEl) fromEl.value = r.fromYm;
      if (toEl) toEl.value = r.toYm;
      recalcAgg();
    });
    document.getElementById("jca-agg-recalc").addEventListener("click", function () {
      recalcAgg();
    });
    document.getElementById("jca-agg-xlsx").addEventListener("click", exportAggXlsx);
    document.getElementById("jca-agg-print").addEventListener("click", openAggPrintWindow);
    var aggAcc = document.getElementById("jca-agg-acc");
    if (aggAcc) {
      aggAcc.addEventListener("toggle", function () {
        if (aggAcc.open) recalcAggOnOpen();
      });
    }
    renderAggTable();
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
      console.error(BUILD, "APP_DB is not set — run jre-cloud-account:sync-dash-db-id");
      return ev;
    }
    scheduleMount();
    return ev;
  });
})();
