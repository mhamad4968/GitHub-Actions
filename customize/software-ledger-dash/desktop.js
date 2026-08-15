(function () {
  "use strict";

  /** ソフトウエア管理台帳ver.1 — REST CRUD（694 型） */
  var APP_DB = 714;
  var APP_EMPLOYEE = 595;
  var APP_DEPT_MASTER = 680;
  var BUILD = "2026-08-15-715-list-dept-2col";

  var DEPT_MASTER_FALLBACK = [
    { dept_name: "役員室", group_name: "honsya" },
    { dept_name: "顧問室", group_name: "honsya" },
    { dept_name: "顧問", group_name: "honsya" },
    { dept_name: "出向者", group_name: "honsya" },
    { dept_name: "総務部", group_name: "honsya" },
    { dept_name: "経理部", group_name: "honsya" },
    { dept_name: "経営企画部", group_name: "honsya" },
    { dept_name: "システム推進室", group_name: "honsya" },
    { dept_name: "人事研修部", group_name: "honsya" },
    { dept_name: "安全推進部", group_name: "honsya" },
    { dept_name: "施工推進部", group_name: "honsya" },
    { dept_name: "メンテナンス技術部", group_name: "honsya" },
    { dept_name: "塗装技術部", group_name: "honsya" },
    { dept_name: "品質管理部", group_name: "honsya" },
    { dept_name: "東北支店", group_name: "tohoku" },
    { dept_name: "秋田営業所", group_name: "tohoku" },
    { dept_name: "盛岡営業所", group_name: "tohoku" },
    { dept_name: "仙台営業所", group_name: "tohoku" },
    { dept_name: "関越支店", group_name: "kan-etsu" },
    { dept_name: "関越支店施工部", group_name: "kan-etsu" },
    { dept_name: "新潟営業所", group_name: "kan-etsu" },
    { dept_name: "長野営業所", group_name: "kan-etsu" },
    { dept_name: "高崎営業所", group_name: "kan-etsu" },
    { dept_name: "東京支店", group_name: "tokyo" },
    { dept_name: "東京支店施工部", group_name: "tokyo" },
    { dept_name: "東京支店橋りょうリペア部", group_name: "tokyo" },
    { dept_name: "千葉営業所", group_name: "tokyo" },
    { dept_name: "水戸営業所", group_name: "tokyo" },
    { dept_name: "鎌ヶ谷事務所", group_name: "tokyo" },
    { dept_name: "東海支店", group_name: "tokai" },
    { dept_name: "東京営業所", group_name: "tokai" },
    { dept_name: "静岡営業所", group_name: "tokai" },
    { dept_name: "名古屋営業所", group_name: "tokai" },
    { dept_name: "関西営業所", group_name: "tokai" },
    { dept_name: "札幌支店", group_name: "tokyo" },
    { dept_name: "首都圏支店", group_name: "tokyo" },
    { dept_name: "リフォーム事業統括部", group_name: "reform" },
    { dept_name: "札幌支店", group_name: "reform" },
    { dept_name: "首都圏支店", group_name: "reform" },
    { dept_name: "鉄構支店", group_name: "tekko" },
    { dept_name: "湾岸工事所", group_name: "wangan" },
  ];

  var deptMasterCache = null;

  var STATUS_ACTIVE = "利用中";
  var STATUS_RETIRED = "廃止";
  var LICENSE_VOLUME = "ボリュームライセンス";
  var PAGE_SIZE = 100;

  var FC = {
    legacy_no: "legacy_no",
    status: "status",
    registered_date: "registered_date",
    purchase_date: "purchase_date",
    license_type: "license_type",
    software_name: "software_name",
    model_number: "model_number",
    id_kind_1: "id_kind_1",
    id_value_1: "id_value_1",
    id_kind_2: "id_kind_2",
    id_value_2: "id_value_2",
    id_kind_3: "id_kind_3",
    id_value_3: "id_value_3",
    emp_id: "emp_id",
    user_name: "user_name",
    dept_name: "dept_name",
    group_name: "group_name",
    note: "note",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.legacy_no,
    FC.status,
    FC.registered_date,
    FC.purchase_date,
    FC.license_type,
    FC.software_name,
    FC.model_number,
    FC.id_kind_1,
    FC.id_value_1,
    FC.id_kind_2,
    FC.id_value_2,
    FC.id_kind_3,
    FC.id_value_3,
    FC.emp_id,
    FC.user_name,
    FC.dept_name,
    FC.group_name,
    FC.note,
  ];

  var ID_KIND_OPTIONS = [
    "シリアル番号",
    "プロダクトID",
    "アカウントID",
    "製造番号",
    "その他",
  ];

  var LICENSE_OPTIONS = ["買い切り", "サブスク", LICENSE_VOLUME];

  var TABLE_COLUMNS = [
    { key: "legacy_no", label: "管理番号", sort: true },
    { key: "status", label: "状態", sort: true },
    { key: "purchase_date", label: "日付", sort: true },
    { key: "license_type", label: "ライセンス", sort: true },
    { key: "software_name", label: "製品", sort: true },
    { key: "ident", label: "ソフトウエアの情報", sort: false },
    { key: "user_name", label: "利用者", sort: true },
    { key: "dept_name", label: "所属", sort: true },
  ];

  var MAIN_PRINT_ID = "swl-main-print";
  var MAIN_PRINT_STYLE_ID = "swl-main-print-style";
  var TABLE_VISUAL_COLS = 9;

  var LIST_TABLE_COLS = [
    { key: "legacy_no", label: "管理番号" },
    { key: "status", label: "状態" },
    { key: "software_name", label: "製品名" },
    { key: "license_type", label: "ライセンス" },
    { key: "ident", label: "ソフトウエアの情報" },
    { key: "emp_id", label: "社員番号" },
    { key: "user_name", label: "氏名" },
    { key: "dept_name", label: "所属名" },
    { key: "group_name", label: "グループ" },
    { key: "purchase_date", label: "購入日" },
  ];

  var EMP595_MODAL_ID = "swl-e595-modal";
  var LIST_MODAL_ID = "swl-list-modal";
  var LIST_PANEL_ID = "swl-list-panel";
  var LIST_LOADING_ID = "swl-list-loading";
  var LIST_PRINT_STYLE_ID = "swl-list-print-style";

  var state = {
    records: [],
    retiredEmpIds: {},
    filter: "active",
    search: "",
    deptFilter: "",
    userFilter: "",
    loading: false,
    sortKey: null,
    sortDir: "desc",
    emp595PickCallback: null,
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeQueryValue(str) {
    return String(str || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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
    var row = {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      legacy_no: val(rec, FC.legacy_no),
      status: val(rec, FC.status) || STATUS_ACTIVE,
      registered_date: val(rec, FC.registered_date),
      purchase_date: val(rec, FC.purchase_date),
      license_type: val(rec, FC.license_type),
      software_name: val(rec, FC.software_name),
      model_number: val(rec, FC.model_number),
      id_kind_1: val(rec, FC.id_kind_1),
      id_value_1: val(rec, FC.id_value_1),
      id_kind_2: val(rec, FC.id_kind_2),
      id_value_2: val(rec, FC.id_value_2),
      id_kind_3: val(rec, FC.id_kind_3),
      id_value_3: val(rec, FC.id_value_3),
      emp_id: val(rec, FC.emp_id),
      user_name: val(rec, FC.user_name),
      dept_name: val(rec, FC.dept_name),
      group_name: val(rec, FC.group_name),
      note: val(rec, FC.note),
    };
    row.ident = formatIdentification(row);
    return row;
  }

  function formatIdentification(row) {
    var parts = [];
    [1, 2, 3].forEach(function (n) {
      var kind = String(row["id_kind_" + n] || "").trim();
      var value = String(row["id_value_" + n] || "").trim();
      if (kind && value) parts.push(kind + ":" + value);
    });
    return parts.join(" / ");
  }

  function toKintoneRecord(row, partial) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
    }
    function clear(code) {
      o[code] = { value: null };
    }
    if (!partial || partial.legacy_no) set(FC.legacy_no, row.legacy_no);
    if (!partial || partial.status) set(FC.status, row.status);
    if (!partial || partial.registered_date) set(FC.registered_date, row.registered_date);
    if (!partial || partial.purchase_date) {
      if (row.purchase_date) set(FC.purchase_date, row.purchase_date);
      else clear(FC.purchase_date);
    }
    if (!partial || partial.license_type) set(FC.license_type, row.license_type);
    if (!partial || partial.software_name) set(FC.software_name, row.software_name);
    if (!partial || partial.model_number) set(FC.model_number, row.model_number);
    [1, 2, 3].forEach(function (n) {
      var kc = "id_kind_" + n;
      var vc = "id_value_" + n;
      if (!partial || partial[kc] || partial[vc]) {
        if (row[kc]) set(FC[kc], row[kc]);
        else clear(FC[kc]);
        if (row[vc]) set(FC[vc], row[vc]);
        else clear(FC[vc]);
      }
    });
    if (!partial || partial.emp_id) set(FC.emp_id, row.emp_id);
    if (!partial || partial.user_name) set(FC.user_name, row.user_name);
    if (!partial || partial.dept_name) set(FC.dept_name, row.dept_name);
    if (!partial || partial.group_name) set(FC.group_name, row.group_name);
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

  function fetchAllDbRecords() {
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

  /** §6.4: 595 退職者 emp_id 一覧 */
  function fetchRetiredEmpIds595() {
    var map = {};
    var offset = 0;
    function page() {
      var query =
        'employment_status in ("退職") order by $id asc limit ' +
        PAGE_SIZE +
        " offset " +
        offset;
      return apiGet("/k/v1/records.json", {
        app: APP_EMPLOYEE,
        query: query,
        fields: ["emp_id"],
      }).then(function (resp) {
        (resp.records || []).forEach(function (r) {
          var id = val(r, "emp_id").trim();
          if (id) map[id] = true;
        });
        if ((resp.records || []).length >= PAGE_SIZE) {
          offset += PAGE_SIZE;
          return page();
        }
        return map;
      });
    }
    return page();
  }

  function isRetiredEmployeeRow(row) {
    var emp = String(row.emp_id || "").trim();
    return emp && state.retiredEmpIds[emp];
  }

  function visibleRecords() {
    return state.records.filter(function (r) {
      return !isRetiredEmployeeRow(r);
    });
  }

  function nextLegacyNo(records) {
    var max = 0;
    records.forEach(function (r) {
      var n = Number(r.legacy_no);
      if (Number.isFinite(n)) max = Math.max(max, n);
    });
    return max + 1;
  }

  function searchEmployees595Contains(keyword, limit) {
    var k = String(keyword || "").trim();
    if (!k) return Promise.resolve([]);
    var lim = Math.min(Math.max(parseInt(String(limit || "12"), 10) || 12, 1), 25);
    var q =
      'user_name like "' +
      escapeQueryValue(k) +
      '" and employment_status not in ("退職") order by user_name asc limit ' +
      lim;
    return apiGet("/k/v1/records.json", {
      app: APP_EMPLOYEE,
      query: q,
      fields: ["user_name", "emp_id", "dept_name", "group_name", "employment_status"],
    }).then(function (resp) {
      return resp.records || [];
    });
  }

  function closeEmp595Modal() {
    var el = document.getElementById(EMP595_MODAL_ID);
    if (el) el.style.display = "none";
    state.emp595PickCallback = null;
  }

  function openEmp595Picker(onPick) {
    state.emp595PickCallback = onPick;
    var backdrop = document.getElementById(EMP595_MODAL_ID);
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = EMP595_MODAL_ID;
      backdrop.className = "swl-e595-bg";
      backdrop.innerHTML =
        '<div class="swl-e595-box">' +
        "<h3>社員検索</h3>" +
        '<p class="swl-e595-sub">退職者は表示されません。行をクリックして選択してください。</p>' +
        '<div class="swl-e595-search-row">' +
        '<input type="text" id="swl-e595-q" placeholder="例: 山田　または　太郎">' +
        '<button type="button" id="swl-e595-go" class="kintoneplugin-button-dialog-ok">検索</button>' +
        "</div>" +
        '<div id="swl-e595-results" class="swl-e595-results"></div>' +
        '<div class="swl-e595-foot">' +
        '<button type="button" id="swl-e595-close" class="kintoneplugin-button-normal">閉じる</button>' +
        "</div></div>";
      backdrop.addEventListener("click", function (ev) {
        if (ev.target === backdrop) closeEmp595Modal();
      });
      document.body.appendChild(backdrop);
      backdrop.querySelector("#swl-e595-close").addEventListener("click", closeEmp595Modal);
      backdrop.querySelector("#swl-e595-go").addEventListener("click", runEmp595Search);
      backdrop.querySelector("#swl-e595-q").addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          runEmp595Search();
        }
      });
    }
    var inp = document.getElementById("swl-e595-q");
    var res = document.getElementById("swl-e595-results");
    if (inp) inp.value = "";
    if (res) res.innerHTML = '<p class="swl-e595-hint">検索語を入力して「検索」を押してください。</p>';
    backdrop.style.display = "flex";
    if (inp) inp.focus();
  }

  function renderEmp595Results(rows) {
    var container = document.getElementById("swl-e595-results");
    if (!container) return;
    container.innerHTML = "";
    if (!rows.length) {
      container.innerHTML =
        '<p class="swl-e595-hint">該当する在籍社員が見つかりません。</p>';
      return;
    }
    rows.forEach(function (row) {
      var un = val(row, "user_name");
      var dept = val(row, "dept_name");
      var grp = val(row, "group_name");
      var emp = val(row, "emp_id");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swl-e595-item";
      btn.textContent =
        un +
        (emp ? "（" + emp + "）" : "（⚠ 社員番号未付番）") +
        (dept ? "　／　" + dept : "") +
        (grp ? "　（" + grp + "）" : "");
      btn.addEventListener("click", function () {
        if (!String(emp || "").trim()) {
          alert(
            "この社員には社員管理番号（emp_id）がありません。\n595 社員マスタで一度「保存」して番号を付与してから、再度社員検索してください。",
          );
          return;
        }
        if (state.emp595PickCallback) {
          state.emp595PickCallback({
            emp_id: emp,
            user_name: un,
            dept_name: dept,
            group_name: grp,
          });
        }
        closeEmp595Modal();
      });
      container.appendChild(btn);
    });
  }

  function runEmp595Search() {
    var inp = document.getElementById("swl-e595-q");
    var container = document.getElementById("swl-e595-results");
    if (!inp || !container) return;
    var kw = String(inp.value || "").trim();
    if (!kw) {
      container.innerHTML = '<p class="swl-e595-hint">検索語を入力してください。</p>';
      return;
    }
    container.innerHTML = '<p class="swl-e595-hint">検索しています…</p>';
    searchEmployees595Contains(kw, 25)
      .then(renderEmp595Results)
      .catch(function (e) {
        container.innerHTML =
          '<p class="swl-e595-err">検索に失敗しました: ' + esc(e.message || e) + "</p>";
      });
  }

  function idKindOptionsHtml(selected) {
    return (
      '<option value="">—</option>' +
      ID_KIND_OPTIONS.map(function (opt) {
        return (
          '<option value="' +
          esc(opt) +
          '"' +
          (opt === selected ? " selected" : "") +
          ">" +
          esc(opt) +
          "</option>"
        );
      }).join("")
    );
  }

  function licenseOptionsHtml(selected) {
    return LICENSE_OPTIONS.map(function (opt) {
      return (
        '<option value="' +
        esc(opt) +
        '"' +
        (opt === selected ? " selected" : "") +
        ">" +
        esc(opt) +
        "</option>"
      );
    }).join("");
  }

  function readIdSlotsFromModal(box) {
    var slots = [];
    [1, 2, 3].forEach(function (n) {
      var kindEl = box.querySelector("#swl-id-kind-" + n);
      var valEl = box.querySelector("#swl-id-value-" + n);
      var rowEl = box.querySelector("#swl-id-slot-" + n);
      if (!rowEl || rowEl.style.display === "none") return;
      slots.push({
        n: n,
        kind: kindEl ? String(kindEl.value || "").trim() : "",
        value: valEl ? String(valEl.value || "").trim() : "",
      });
    });
    return slots;
  }

  function validateIdSlots(slots) {
    if (!slots.length || !slots[0].kind || !slots[0].value) {
      return "ソフトウエアの情報1（種別・値）は必須です";
    }
    for (var i = 1; i < slots.length; i++) {
      var s = slots[i];
      var hasK = !!s.kind;
      var hasV = !!s.value;
      if (hasK !== hasV) {
        return "ソフトウエアの情報" + s.n + "は種別と値をセットで入力してください";
      }
    }
    return "";
  }

  function duplicateKindsInRecord(slots) {
    var kinds = [];
    slots.forEach(function (s) {
      if (s.kind && s.value) kinds.push(s.kind);
    });
    var seen = {};
    var dups = [];
    kinds.forEach(function (k) {
      if (seen[k]) dups.push(k);
      seen[k] = true;
    });
    return dups;
  }

  function buildCrossRecordDupQuery(kind, value, excludeId) {
    var k = escapeQueryValue(kind);
    var v = escapeQueryValue(String(value || "").trim());
    if (!k || !v) return "";
    // DROP_DOWN は kintone クエリで = 不可 → in を使用（CB_IL02）
    var parts = [
      '(id_kind_1 in ("' + k + '") and id_value_1 = "' + v + '")',
      '(id_kind_2 in ("' + k + '") and id_value_2 = "' + v + '")',
      '(id_kind_3 in ("' + k + '") and id_value_3 = "' + v + '")',
    ];
    var q = "(" + parts.join(" or ") + ")";
    if (excludeId) q += " and $id != " + Number(excludeId);
    return q + " limit 1";
  }

  function checkCrossRecordDuplicates(licenseType, slots, excludeId) {
    if (licenseType === LICENSE_VOLUME) return Promise.resolve(false);
    var checks = slots
      .filter(function (s) {
        return s.kind && s.value;
      })
      .map(function (s) {
        var q = buildCrossRecordDupQuery(s.kind, s.value, excludeId);
        if (!q) return Promise.resolve(null);
        return apiGet("/k/v1/records.json", {
          app: APP_DB,
          query: q,
          fields: ["$id"],
        }).then(function (resp) {
          return (resp.records || []).length > 0;
        });
      });
    if (!checks.length) return Promise.resolve(false);
    return Promise.all(checks).then(function (hits) {
      return hits.some(function (h) {
        return h;
      });
    });
  }

  function slotsToRowFields(slots) {
    var row = {
      id_kind_1: "",
      id_value_1: "",
      id_kind_2: "",
      id_value_2: "",
      id_kind_3: "",
      id_value_3: "",
    };
    slots.forEach(function (s) {
      row["id_kind_" + s.n] = s.kind;
      row["id_value_" + s.n] = s.value;
    });
    return row;
  }

  function countVisibleIdSlots(row) {
    var n = 1;
    if (row.id_kind_2 || row.id_value_2) n = 2;
    if (row.id_kind_3 || row.id_value_3) n = 3;
    return n;
  }

  function buildIdSlotsHtml(row, maxVisible) {
    var vis = maxVisible || countVisibleIdSlots(row || {});
    var html = "";
    [1, 2, 3].forEach(function (n) {
      html +=
        '<div id="swl-id-slot-' +
        n +
        '" class="swl-id-slot"' +
        (n > vis ? ' style="display:none"' : "") +
        ">" +
        '<label>ソフトウエアの情報' +
        n +
        " — 種別<select id=\"swl-id-kind-" +
        n +
        '">' +
        idKindOptionsHtml(row ? row["id_kind_" + n] : "") +
        '</select></label><label>ソフトウエアの情報' +
        n +
        " — 値<input id=\"swl-id-value-" +
        n +
        '" value="' +
        esc(row ? row["id_value_" + n] : "") +
        '"></label></div>';
    });
    html +=
      '<button type="button" id="swl-id-add"' +
      (vis >= 3 ? ' style="display:none"' : "") +
      ' class="kintoneplugin-button-normal">ソフトウエアの情報を追加</button>';
    return html;
  }

  function wireIdSlotUi(box) {
    var addBtn = box.querySelector("#swl-id-add");
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        var hidden = null;
        [2, 3].forEach(function (n) {
          var el = box.querySelector("#swl-id-slot-" + n);
          if (el && el.style.display === "none" && !hidden) {
            el.style.display = "";
            hidden = n;
          }
        });
        var slot3 = box.querySelector("#swl-id-slot-3");
        if (slot3 && slot3.style.display !== "none") addBtn.style.display = "none";
      });
    }
  }

  function readEmployeeFromModal(box) {
    return {
      emp_id: (box.querySelector("#swl-emp-id") || {}).value || "",
      user_name: (box.querySelector("#swl-user-name") || {}).value || "",
      dept_name: (box.querySelector("#swl-dept-name") || {}).value || "",
      group_name: (box.querySelector("#swl-group-name") || {}).value || "",
    };
  }

  function setEmployeeInModal(box, emp) {
    var map = [
      ["#swl-emp-id", emp.emp_id],
      ["#swl-user-name", emp.user_name],
      ["#swl-dept-name", emp.dept_name],
      ["#swl-group-name", emp.group_name],
    ];
    map.forEach(function (pair) {
      var el = box.querySelector(pair[0]);
      if (el) el.value = pair[1] || "";
    });
  }

  function employeeFieldsHtml(row) {
    row = row || {};
    return (
      '<div class="swl-emp-block">' +
      '<button type="button" id="swl-pick-595" class="kintoneplugin-button-normal">社員検索</button>' +
      '<input type="hidden" id="swl-emp-id" value="' +
      esc(row.emp_id) +
      '">' +
      '<label>氏名<input id="swl-user-name" value="' +
      esc(row.user_name) +
      '" readonly></label>' +
      '<label>所属名<input id="swl-dept-name" value="' +
      esc(row.dept_name) +
      '" readonly></label>' +
      '<label>所属グループ<input id="swl-group-name" value="' +
      esc(row.group_name) +
      '" readonly></label></div>'
    );
  }

  function wireEmployeePicker(box) {
    var btn = box.querySelector("#swl-pick-595");
    if (btn) {
      btn.addEventListener("click", function () {
        openEmp595Picker(function (emp) {
          setEmployeeInModal(box, emp);
        });
      });
    }
  }

  function saveRecordFromModal(box, row, isNew, close) {
    var licenseEl = box.querySelector("#swl-license-type");
    var licenseType = licenseEl ? licenseEl.value : "";
    if (!licenseType) {
      alert("ライセンス種別は必須です");
      return;
    }
    var softwareName = (box.querySelector("#swl-software-name") || {}).value || "";
    softwareName = softwareName.trim();
    if (!softwareName) {
      alert("製品名は必須です");
      return;
    }
    var slots = readIdSlotsFromModal(box);
    var slotErr = validateIdSlots(slots);
    if (slotErr) {
      alert(slotErr);
      return;
    }
    var dups = duplicateKindsInRecord(slots);
    if (dups.length) {
      if (
        !window.confirm(
          "同一の情報種別（" + dups.join("、") + "）が複数あります。このまま保存しますか？",
        )
      ) {
        return;
      }
    }
    var emp = readEmployeeFromModal(box);
    if (!String(emp.user_name || "").trim()) {
      alert("社員検索で利用者を選択してください");
      return;
    }
    if (!String(emp.emp_id || "").trim()) {
      alert(
        "社員管理番号（emp_id）が空のため保存できません。595 社員マスタで該当社員を保存して番号を付与してから、再度お試しください。",
      );
      return;
    }
    var slotFields = slotsToRowFields(slots);
    var payload = {
      license_type: licenseType,
      software_name: softwareName,
      model_number: ((box.querySelector("#swl-model-number") || {}).value || "").trim(),
      purchase_date: (box.querySelector("#swl-purchase-date") || {}).value || "",
      emp_id: emp.emp_id,
      user_name: emp.user_name,
      dept_name: emp.dept_name,
      group_name: emp.group_name,
      note: (box.querySelector("#swl-note") || {}).value || "",
    };
    Object.keys(slotFields).forEach(function (k) {
      payload[k] = slotFields[k];
    });

    checkCrossRecordDuplicates(licenseType, slots, isNew ? null : row.id)
      .then(function (hasDup) {
        if (hasDup) {
          if (
            !window.confirm(
              "同一のソフトウエア情報（シリアル等）が既に登録されています。登録しますか？",
            )
          ) {
            return Promise.reject(new Error("cancelled"));
          }
        }
        if (isNew) {
          var today = todayJstYmd();
          payload.legacy_no = String(nextLegacyNo(state.records));
          payload.status = STATUS_ACTIVE;
          payload.registered_date = today;
          if (!payload.purchase_date) payload.purchase_date = today;
          return apiPost("/k/v1/record.json", {
            app: APP_DB,
            record: toKintoneRecord(payload),
          });
        }
        if (row.status === STATUS_RETIRED && payload.status === STATUS_ACTIVE) {
          alert("廃止済みレコードを利用中に戻すことはできません");
          return Promise.reject(new Error("cancelled"));
        }
        return apiPut("/k/v1/record.json", {
          app: APP_DB,
          id: row.id,
          revision: row.revision,
          record: toKintoneRecord(payload, {
            license_type: 1,
            software_name: 1,
            model_number: 1,
            purchase_date: 1,
            id_kind_1: 1,
            id_value_1: 1,
            id_kind_2: 1,
            id_value_2: 1,
            id_kind_3: 1,
            id_value_3: 1,
            emp_id: 1,
            user_name: 1,
            dept_name: 1,
            group_name: 1,
            note: 1,
          }),
        });
      })
      .then(function () {
        close();
        reloadRecords();
        alert("保存しました");
      })
      .catch(function (e) {
        if (String(e.message || e) === "cancelled") return;
        var detail = e.message || String(e);
        if (e.errors) {
          try {
            detail += "\n" + JSON.stringify(e.errors);
          } catch (ignore) {
            /* noop */
          }
        }
        alert("保存失敗: " + detail);
      });
  }

  function injectCss() {
    if (document.getElementById("swl-dash-css")) return;
    var st = document.createElement("style");
    st.id = "swl-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".swl-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".swl-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".swl-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;padding:8px 12px;background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;}" +
      ".swl-filter-acc{margin:0 0 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;}" +
      ".swl-filter-sum{cursor:pointer;padding:8px 12px;font-weight:700;background:#f1f5f9;list-style:none;}" +
      ".swl-filter-sum::-webkit-details-marker{display:none;}" +
      ".swl-acc-hint{margin-left:10px;font-weight:400;font-size:12px;color:#475569;}" +
      ".swl-filter-acc-body{padding:10px 12px;}" +
      ".swl-chip-sec{margin:0 0 10px;padding:10px 12px;border-radius:8px;}" +
      ".swl-chip-sec--dept{background:#eff6ff;border:1px solid #93c5fd;}" +
      ".swl-chip-sec--dept .swl-chip-sec-title{color:#1d4ed8;font-size:12px;font-weight:700;margin:0 0 8px;}" +
      ".swl-chip-sec--user{background:#f0fdf4;border:1px solid #86efac;}" +
      ".swl-chip-sec--user .swl-chip-sec-title{color:#15803d;font-size:12px;font-weight:700;margin:0 0 8px;}" +
      ".swl-chip-sec--dept .swl-chip--active{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}" +
      ".swl-chip-sec--user .swl-chip--active{background:#15803d;color:#fff;border-color:#15803d;}" +
      ".swl-chip-sec .swl-chips{margin-bottom:0;}" +
      ".swl-filter-sum:after{content:\"\\25bc\";float:right;font-size:10px;color:#64748b;}" +
      ".swl-filter-acc:not([open]) > .swl-filter-sum:after{content:\"\\25b6\";}" +
      ".swl-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;}" +
      ".swl-chip{padding:4px 10px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;font-size:12px;cursor:pointer;}" +
      ".swl-chip--active{background:#0369a1;color:#fff;border-color:#0369a1;}" +
      ".swl-chip-label{font-size:12px;font-weight:700;color:#475569;margin-right:4px;}" +
      ".swl-chip-hint{font-size:12px;color:#64748b;margin-right:6px;}" +
      ".swl-user-filter-btn{margin-left:4px;padding:4px 10px;font-size:12px;}" +
      ".swl-table-wrap{overflow:auto;max-height:calc(100vh - 300px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".swl-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1100px;}" +
      ".swl-table th,.swl-table td{border:1px solid #e2e8f0;padding:6px 8px;vertical-align:middle;}" +
      ".swl-table th{background:#f1f5f9;position:sticky;top:0;z-index:3;}" +
      ".swl-table tbody tr:nth-child(even){background:#f8fafc;}" +
      ".swl-table th.swl-sort{cursor:pointer;user-select:none;white-space:nowrap;}" +
      ".swl-table th.swl-sort:hover{background:#e2e8f0;}" +
      ".swl-sort-ind{display:inline-block;margin-left:4px;font-size:10px;color:#94a3b8;}" +
      ".swl-table th.swl-sort--active .swl-sort-ind{color:#0369a1;font-weight:700;}" +
      ".swl-table tr.retired{background:#f8fafc;color:#64748b;}" +
      ".swl-user-link{color:#0369a1;cursor:pointer;text-decoration:underline;}" +
      ".swl-ident{font-family:Consolas,Monaco,monospace;font-size:11px;word-break:break-all;}" +
      ".swl-cell-sub{display:block;font-size:11px;color:#64748b;margin-top:2px;}" +
      ".swl-pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;}" +
      ".swl-pill--active{background:#dcfce7;color:#166534;}" +
      ".swl-pill--retired{background:#e2e8f0;color:#475569;}" +
      ".swl-actions{white-space:normal;min-width:168px;}" +
      ".swl-actions button{margin:2px;padding:2px 6px;font-size:11px;}" +
      ".swl-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".swl-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:640px;width:92%;max-height:90vh;overflow:auto;}" +
      ".swl-sec{margin:0 0 12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;}" +
      ".swl-sec-title{font-size:12px;font-weight:700;color:#0f172a;margin:0 0 8px;}" +
      ".swl-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".swl-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".swl-modal input,.swl-modal select,.swl-modal textarea{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".swl-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      ".swl-id-slot{margin:8px 0;padding:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;}" +
      ".swl-emp-block{margin:10px 0;padding:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;}" +
      ".swl-e595-bg{position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.5);display:none;align-items:center;justify-content:center;padding:16px;}" +
      ".swl-e595-box{background:#fff;border-radius:8px;max-width:560px;width:100%;max-height:88vh;overflow:auto;padding:16px 18px;}" +
      ".swl-e595-sub{font-size:12px;color:#64748b;margin:0 0 10px;}" +
      ".swl-e595-search-row{display:flex;gap:8px;margin-bottom:10px;}" +
      ".swl-e595-search-row input{flex:1;padding:8px;}" +
      ".swl-e595-results{max-height:46vh;overflow:auto;border:1px solid #e2e8f0;border-radius:6px;padding:8px;background:#f8fafc;}" +
      ".swl-e595-item{display:block;width:100%;text-align:left;padding:10px;margin:0 0 6px;border:1px solid #dee2e6;border-radius:4px;background:#fff;cursor:pointer;font-size:13px;}" +
      ".swl-e595-item:hover{background:#eff6ff;}" +
      ".swl-e595-hint,.swl-e595-err{font-size:13px;margin:8px 0;color:#64748b;}" +
      ".swl-e595-err{color:#b91c1c;}" +
      ".swl-e595-foot{margin-top:12px;text-align:right;}" +
      ".swl-list-modal-bg{position:fixed;inset:0;z-index:10002;background:rgba(15,23,42,.5);display:none;align-items:center;justify-content:center;padding:16px;}" +
      ".swl-list-modal{background:#fff;border-radius:10px;max-width:820px;width:100%;padding:20px 22px;}" +
      ".swl-list-picks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px;max-height:280px;overflow:auto;margin:0 0 10px;padding:8px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;}" +
      ".swl-list-picks label{display:flex;align-items:flex-start;gap:6px;min-width:0;font-size:12px;font-weight:400;margin:0;cursor:pointer;line-height:1.35;word-break:break-word;overflow-wrap:anywhere;}" +
      ".swl-list-picks input{width:auto;flex:0 0 auto;margin:2px 0 0;}" +
      ".swl-list-pick-bar{display:flex;gap:8px;margin:0 0 6px;}" +
      ".swl-list-loading{position:fixed;inset:0;z-index:10003;background:rgba(15,23,42,.45);display:none;align-items:center;justify-content:center;color:#fff;font-weight:700;}" +
      ".swl-list-panel{position:fixed;inset:0;z-index:10004;background:#f8fafc;display:flex;flex-direction:column;}" +
      ".swl-list-toolbar{flex:0 0 auto;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 16px;background:#f1f5f9;color:#0f172a;border-bottom:1px solid #cbd5e1;}" +
      ".swl-list-toolbar button{color:#0f172a;}" +
      ".swl-list-scroll{flex:1 1 auto;overflow:auto;padding:12px 16px 24px;}" +
      ".swl-list-print-head{display:none;margin-bottom:16px;}" +
      ".swl-list-table{width:100%;border-collapse:collapse;background:#fff;font-size:13px;}" +
      ".swl-list-table th,.swl-list-table td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;vertical-align:top;word-break:break-word;}" +
      ".swl-list-table th{background:#e2e8f0;position:sticky;top:0;}";
    document.head.appendChild(st);
  }

  function ensureListPrintStyles() {
    if (document.getElementById(LIST_PRINT_STYLE_ID)) return;
    var st = document.createElement("style");
    st.id = LIST_PRINT_STYLE_ID;
    st.textContent =
      "@media print{@page{size:landscape;margin:10mm;}" +
      "body *{visibility:hidden!important;}" +
      "#" +
      LIST_PANEL_ID +
      ",#" +
      LIST_PANEL_ID +
      " *{visibility:visible!important;}" +
      "#" +
      LIST_PANEL_ID +
      "{position:absolute!important;left:0!important;top:0!important;width:100%!important;max-height:none!important;background:#fff!important;}" +
      "#" +
      LIST_PANEL_ID +
      " .swl-list-toolbar{display:none!important;}" +
      "#" +
      LIST_PANEL_ID +
      " .swl-list-scroll{overflow:visible!important;max-height:none!important;}" +
      "#" +
      LIST_PANEL_ID +
      " .swl-list-print-head{display:block!important;}}";
    document.head.appendChild(st);
  }

  function ensureMainPrintStyles() {
    if (document.getElementById(MAIN_PRINT_STYLE_ID)) return;
    var st = document.createElement("style");
    st.id = MAIN_PRINT_STYLE_ID;
    st.textContent =
      "#" +
      MAIN_PRINT_ID +
      "{display:none;}" +
      "@media print{" +
      "body.swl-printing-main *{visibility:hidden!important;}" +
      "body.swl-printing-main #" +
      MAIN_PRINT_ID +
      ",body.swl-printing-main #" +
      MAIN_PRINT_ID +
      " *{visibility:visible!important;}" +
      "body.swl-printing-main #" +
      MAIN_PRINT_ID +
      "{display:block!important;position:absolute!important;left:0;top:0;width:100%;background:#fff;}" +
      "@page{size:landscape;margin:10mm;}" +
      "}";
    document.head.appendChild(st);
  }

  function statusPillHtml(status) {
    if (status === STATUS_ACTIVE) {
      return '<span class="swl-pill swl-pill--active">' + esc(STATUS_ACTIVE) + "</span>";
    }
    return '<span class="swl-pill swl-pill--retired">' + esc(STATUS_RETIRED) + "</span>";
  }

  function buildTableRowHtml(r, includeActions, linkUser) {
    var cls = r.status === STATUS_RETIRED ? "retired" : "";
    var dateCell =
      (r.purchase_date ? "購入日：" + esc(r.purchase_date) : "") +
      (r.registered_date
        ? '<span class="swl-cell-sub">登録 ' + esc(r.registered_date) + "</span>"
        : "");
    var productCell =
      "<strong>" +
      esc(r.software_name) +
      "</strong>" +
      (r.model_number
        ? '<span class="swl-cell-sub">バージョン ' + esc(r.model_number) + "</span>"
        : "");
    var userCell;
    if (linkUser) {
      userCell =
        '<span class="swl-user-link" data-user="' +
        esc(r.user_name) +
        '">' +
        esc(r.user_name) +
        "</span>";
    } else {
      userCell = esc(r.user_name);
    }
    var deptCell =
      esc(r.dept_name) +
      (r.group_name ? '<span class="swl-cell-sub">' + esc(r.group_name) + "</span>" : "");
    var html =
      '<tr class="' +
      cls +
      '" data-id="' +
      esc(r.id) +
      '">' +
      "<td>" +
      esc(r.legacy_no) +
      "</td><td>" +
      statusPillHtml(r.status) +
      "</td><td>" +
      dateCell +
      "</td><td>" +
      esc(r.license_type) +
      "</td><td>" +
      productCell +
      '</td><td class="swl-ident">' +
      esc(r.ident) +
      "</td><td>" +
      userCell +
      "</td><td>" +
      deptCell +
      "</td>";
    if (includeActions) {
      html +=
        '<td class="swl-actions">' +
        '<button type="button" class="swl-btn-edit">編集</button>' +
        (r.status === STATUS_ACTIVE
          ? '<button type="button" class="swl-btn-retire">廃止</button>'
          : "") +
        '<button type="button" class="swl-btn-del">削除</button>' +
        '<button type="button" class="swl-btn-user-list">この社員のリスト</button>' +
        "</td>";
    }
    html += "</tr>";
    return html;
  }

  function buildMainPrintFilterText() {
    var parts = [];
    parts.push(
      "フィルタ: " + (state.filter === "active" ? "利用中" : state.filter === "retired" ? "廃止" : state.filter),
    );
    if (state.deptFilter) parts.push("所属: " + state.deptFilter);
    if (state.userFilter) parts.push("利用者: " + state.userFilter);
    if (state.search.trim()) parts.push("検索: " + state.search.trim());
    return parts.join("　");
  }

  function printMainTable() {
    ensureMainPrintStyles();
    var listPanel = document.getElementById(LIST_PANEL_ID);
    var listPrevDisplay = "";
    var listWasHidden = false;
    if (listPanel && listPanel.style.display !== "none") {
      listPrevDisplay = listPanel.style.display;
      listPanel.style.display = "none";
      listWasHidden = true;
    }
    var existing = document.getElementById(MAIN_PRINT_ID);
    if (existing) existing.remove();
    var rows = filteredRecords();
    var el = document.createElement("div");
    el.id = MAIN_PRINT_ID;
    var filterText = buildMainPrintFilterText();
    el.innerHTML =
      '<h1 style="margin:0 0 8px;font-size:18px;">ソフトウエア管理台帳ver.1</h1>' +
      '<p style="margin:0;font-size:13px;">出力日: ' +
      esc(todayJstYmd()) +
      "　件数: " +
      rows.length +
      "件</p>" +
      '<p style="margin:4px 0 12px;font-size:12px;color:#64748b;">' +
      esc(filterText) +
      "</p>" +
      '<table class="swl-table" style="min-width:auto;"><thead><tr>' +
      TABLE_COLUMNS.map(function (c) {
        return "<th>" + esc(c.label) + "</th>";
      }).join("") +
      '</tr></thead><tbody>' +
      (rows.length
        ? rows
            .map(function (r) {
              return buildTableRowHtml(r, false, false);
            })
            .join("")
        : '<tr><td colspan="' + TABLE_COLUMNS.length + '">該当なし</td></tr>') +
      "</tbody></table>";
    document.body.appendChild(el);
    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove("swl-printing-main");
      var printEl = document.getElementById(MAIN_PRINT_ID);
      if (printEl) printEl.remove();
      if (listPanel && listWasHidden) listPanel.style.display = listPrevDisplay || "flex";
    }
    function onAfterPrint() {
      cleanup();
      window.removeEventListener("afterprint", onAfterPrint);
    }
    window.addEventListener("afterprint", onAfterPrint);
    document.body.classList.add("swl-printing-main");
    window.print();
    setTimeout(cleanup, 1000);
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
    if (key === "registered_date" || key === "purchase_date") {
      return String(a[key] || "").localeCompare(String(b[key] || ""));
    }
    if (key === "status") {
      var sa = a.status === STATUS_ACTIVE ? 0 : 1;
      var sb = b.status === STATUS_ACTIVE ? 0 : 1;
      if (sa !== sb) return sa - sb;
    }
    return String(a[key] || "").localeCompare(String(b[key] || ""), "ja");
  }

  function filteredRecords() {
    var q = state.search.trim().toLowerCase();
    var rows = visibleRecords().filter(function (r) {
      if (state.filter === "active" && r.status !== STATUS_ACTIVE) return false;
      if (state.filter === "retired" && r.status !== STATUS_RETIRED) return false;
      if (state.deptFilter && String(r.dept_name || "").indexOf(state.deptFilter) < 0) return false;
      if (state.userFilter && r.user_name !== state.userFilter) return false;
      if (!q) return true;
      var hay = (
        r.software_name +
        " " +
        r.model_number +
        " " +
        r.id_value_1 +
        " " +
        r.id_value_2 +
        " " +
        r.id_value_3 +
        " " +
        r.emp_id +
        " " +
        r.user_name +
        " " +
        r.dept_name +
        " " +
        r.group_name +
        " " +
        r.ident
      ).toLowerCase();
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

  function distinctValues(rows, key) {
    var map = {};
    rows.forEach(function (r) {
      var v = String(r[key] || "").trim();
      if (v) map[v] = true;
    });
    return Object.keys(map).sort(function (a, b) {
      return a.localeCompare(b, "ja");
    });
  }

  function updateAccHint() {
    var el = document.getElementById("swl-acc-hint");
    if (!el) return;
    var parts = [];
    if (state.filter === "retired") {
      parts.push("廃止");
    } else if (state.deptFilter || state.userFilter || state.search.trim()) {
      parts.push("利用中");
    }
    if (state.deptFilter) parts.push("所属:" + esc(state.deptFilter));
    if (state.userFilter) parts.push("利用者:" + esc(state.userFilter));
    if (state.search.trim()) parts.push("検索:" + esc(state.search.trim()));
    el.innerHTML = parts.join("　");
  }

  function renderChips() {
    var deptEl = document.getElementById("swl-dept-chips");
    var userEl = document.getElementById("swl-user-chips");
    if (!deptEl || !userEl) return;
    var base = visibleRecords();
    var depts = distinctValues(base, "dept_name");
    var users = distinctValues(base, "user_name");
    deptEl.innerHTML = depts
      .map(function (d) {
        return (
          '<button type="button" class="swl-chip' +
          (state.deptFilter === d ? " swl-chip--active" : "") +
          '" data-dept="' +
          esc(d) +
          '">' +
          esc(d) +
          "</button>"
        );
      })
      .join("");
    var userHtml = "";
    if (state.userFilter) {
      userHtml +=
        '<button type="button" class="swl-chip swl-chip--active" data-user-clear="1" title="クリックで解除">' +
        esc(state.userFilter) +
        " ×</button>";
    } else {
      userHtml += '<span class="swl-chip-hint">未選択（全員表示）</span>';
    }
    userHtml +=
      '<button type="button" id="swl-user-pick-filter" class="kintoneplugin-button-normal swl-user-filter-btn">社員で絞る</button>';
    if (users.length) {
      userHtml +=
        '<span class="swl-chip-hint">（登録 ' +
        users.length +
        " 名）</span>";
    }
    userEl.innerHTML = userHtml;
    deptEl.querySelectorAll("[data-dept]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-dept");
        state.deptFilter = state.deptFilter === v ? "" : v;
        renderChips();
        renderTable();
      });
    });
    var clearUserBtn = userEl.querySelector("[data-user-clear]");
    if (clearUserBtn) {
      clearUserBtn.addEventListener("click", function () {
        state.userFilter = "";
        renderChips();
        renderTable();
      });
    }
    var pickUserBtn = document.getElementById("swl-user-pick-filter");
    if (pickUserBtn) {
      pickUserBtn.addEventListener("click", function () {
        openEmp595Picker(function (emp) {
          var name = String(emp.user_name || "").trim();
          if (!name) return;
          state.userFilter = name;
          renderChips();
          renderTable();
        });
      });
    }
    updateAccHint();
  }

  function updateSortHeaders() {
    var thead = document.querySelector("#swl-root .swl-table thead");
    if (!thead) return;
    thead.querySelectorAll("th.swl-sort").forEach(function (th) {
      var key = th.getAttribute("data-sort");
      var ind = th.querySelector(".swl-sort-ind");
      th.classList.toggle("swl-sort--active", key === state.sortKey);
      if (ind) {
        if (key === state.sortKey) ind.textContent = state.sortDir === "asc" ? "\u25b2" : "\u25bc";
        else ind.textContent = "";
      }
    });
  }

  function toggleSort(key) {
    if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    else {
      state.sortKey = key;
      state.sortDir =
        key === "legacy_no" || key === "registered_date" || key === "purchase_date"
          ? "desc"
          : "asc";
    }
    updateSortHeaders();
    renderTable();
  }

  function closeModal() {
    var el = document.getElementById("swl-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "swl-modal-root";
    bg.className = "swl-modal-bg";
    var box = document.createElement("div");
    box.className = "swl-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "swl-modal-actions";
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

  function openCreateModal() {
    var today = todayJstYmd();
    var box = openModal(
      "新規登録",
      '<div class="swl-sec"><div class="swl-sec-title">製品</div>' +
        '<label>ライセンス種別<select id="swl-license-type">' +
        licenseOptionsHtml("") +
        '</select></label><label>製品名<input id="swl-software-name"></label>' +
        '<label>バージョン<input id="swl-model-number"></label></div>' +
        '<div class="swl-sec"><div class="swl-sec-title">ソフトウエアの情報</div>' +
        buildIdSlotsHtml(null, 1) +
        "</div>" +
        '<div class="swl-sec"><div class="swl-sec-title">利用者</div>' +
        employeeFieldsHtml(null) +
        "</div>" +
        '<div class="swl-sec"><div class="swl-sec-title">日付・備考</div>' +
        '<label>購入日<input type="date" id="swl-purchase-date" value="' +
        esc(today) +
        '"></label>' +
        '<label>備考<textarea id="swl-note" rows="3"></textarea></label></div>',
      [
        { label: "キャンセル" },
        {
          label: "保存",
          primary: true,
          onClick: function (close) {
            saveRecordFromModal(box, null, true, close);
          },
        },
      ],
    );
    wireIdSlotUi(box);
    wireEmployeePicker(box);
  }

  function openEditModal(row) {
    var statusHtml =
      '<p style="font-size:12px;color:#475569;">状態: <strong>' +
      esc(row.status) +
      "</strong>" +
      (row.status === STATUS_RETIRED ? "（利用中へ戻せません）" : "") +
      "</p>" +
      '<p style="font-size:12px;color:#475569;">登録日: <strong>' +
      esc(row.registered_date) +
      "</strong>（変更不可）</p>";
    var box = openModal(
      "編集 — No." + row.legacy_no,
      '<div class="swl-sec"><div class="swl-sec-title">製品</div>' +
        '<label>ライセンス種別<select id="swl-license-type">' +
        licenseOptionsHtml(row.license_type) +
        '</select></label><label>製品名<input id="swl-software-name" value="' +
        esc(row.software_name) +
        '"></label><label>バージョン<input id="swl-model-number" value="' +
        esc(row.model_number) +
        '"></label></div>' +
        '<div class="swl-sec"><div class="swl-sec-title">ソフトウエアの情報</div>' +
        buildIdSlotsHtml(row) +
        "</div>" +
        '<div class="swl-sec"><div class="swl-sec-title">利用者</div>' +
        employeeFieldsHtml(row) +
        "</div>" +
        '<div class="swl-sec"><div class="swl-sec-title">日付・備考</div>' +
        statusHtml +
        '<label>購入日<input type="date" id="swl-purchase-date" value="' +
        esc(row.purchase_date) +
        '"></label><label>備考<textarea id="swl-note" rows="3">' +
        esc(row.note) +
        "</textarea></label></div>",
      [
        { label: "キャンセル" },
        {
          label: "保存",
          primary: true,
          onClick: function (close) {
            saveRecordFromModal(box, row, false, close);
          },
        },
      ],
    );
    wireIdSlotUi(box);
    wireEmployeePicker(box);
  }

  function openRetireModal(row) {
    openModal(
      "廃止確認",
      "<p>製品名: <strong>" +
        esc(row.software_name) +
        "</strong></p><p>氏名: " +
        esc(row.user_name) +
        "</p><p>ステータスを <strong>廃止</strong> にします（元に戻せません）。</p>",
      [
        { label: "キャンセル" },
        {
          label: "廃止する",
          primary: true,
          onClick: function (close) {
            if (row.status !== STATUS_ACTIVE) {
              alert("利用中のレコードのみ廃止できます");
              return;
            }
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
      "削除確認（誤登録のみ）",
      "<p>製品名: <strong>" +
        esc(row.software_name) +
        "</strong></p><p>管理番号: " +
        esc(row.legacy_no) +
        "</p><p>このレコードを<strong>物理削除</strong>します。</p>",
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

  function filterByUserName(name) {
    state.userFilter = String(name || "").trim();
    renderChips();
    renderTable();
  }

  function reloadRecords() {
    state.loading = true;
    renderTable();
    return fetchRetiredEmpIds595()
      .then(function (retiredMap) {
        state.retiredEmpIds = retiredMap;
        return fetchAllDbRecords();
      })
      .then(function (rows) {
        state.records = rows.map(flatten);
        state.loading = false;
        renderChips();
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
    var el = document.getElementById("swl-meta");
    if (!el) return;
    var vis = visibleRecords();
    var active = vis.filter(function (r) {
      return r.status === STATUS_ACTIVE;
    }).length;
    el.innerHTML =
      "<span>表示 " +
      esc(String(vis.length)) +
      " 件（利用中 " +
      esc(String(active)) +
      "）</span>" +
      '<span style="font-size:11px;color:#64748b;">build ' +
      esc(BUILD) +
      "</span>";
  }

  function renderTable() {
    var tbody = document.getElementById("swl-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="' + TABLE_VISUAL_COLS + '">読込中…</td></tr>';
      updateAccHint();
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="' + TABLE_VISUAL_COLS + '">該当なし</td></tr>';
      updateSortHeaders();
      updateAccHint();
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        return buildTableRowHtml(r, true, true);
      })
      .join("");

    tbody.querySelectorAll(".swl-user-link").forEach(function (el) {
      el.addEventListener("click", function () {
        filterByUserName(el.getAttribute("data-user"));
      });
    });
    tbody.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      var row = state.records.find(function (x) {
        return x.id === id;
      });
      if (!row) return;
      tr.querySelector(".swl-btn-edit").addEventListener("click", function () {
        openEditModal(row);
      });
      var retireBtn = tr.querySelector(".swl-btn-retire");
      if (retireBtn) {
        retireBtn.addEventListener("click", function () {
          openRetireModal(row);
        });
      }
      tr.querySelector(".swl-btn-del").addEventListener("click", function () {
        openDeleteModal(row);
      });
      tr.querySelector(".swl-btn-user-list").addEventListener("click", function () {
        openListCreateModal({
          emp_id: row.emp_id,
          user_name: row.user_name,
        });
      });
    });
    updateSortHeaders();
    updateAccHint();
  }

  function clearFilters() {
    state.search = "";
    state.filter = "active";
    state.deptFilter = "";
    state.userFilter = "";
    state.sortKey = null;
    state.sortDir = "desc";
    var search = document.getElementById("swl-search");
    if (search) search.value = "";
    var activeRb = document.querySelector('input[name="swl-filter"][value="active"]');
    if (activeRb) activeRb.checked = true;
    renderChips();
    updateSortHeaders();
    renderTable();
    updateAccHint();
  }

  function appendListLike(parts, field, raw) {
    var v = String(raw || "").trim();
    if (!v) return;
    parts.push("(" + field + ' like "' + escapeQueryValue(v) + '")');
  }

  function appendListEqualsOr(parts, field, values) {
    if (!values || !values.length) return;
    if (values.length === 1) {
      parts.push(field + ' = "' + escapeQueryValue(values[0]) + '"');
      return;
    }
    var orParts = values.map(function (v) {
      return field + ' = "' + escapeQueryValue(v) + '"';
    });
    parts.push("(" + orParts.join(" or ") + ")");
  }

  function buildListQuery(opts) {
    var parts = [];
    if (opts.includeMain) {
      if (state.deptFilter) appendListLike(parts, FC.dept_name, state.deptFilter);
      if (state.userFilter) parts.push(FC.user_name + ' = "' + escapeQueryValue(state.userFilter) + '"');
      var q = state.search.trim();
      if (q) appendListLike(parts, FC.software_name, q);
    }
    appendListEqualsOr(parts, FC.dept_name, opts.dept_names);
    appendListEqualsOr(parts, FC.group_name, opts.group_names);
    if (opts.emp_id) parts.push(FC.emp_id + ' = "' + escapeQueryValue(opts.emp_id) + '"');
    else appendListLike(parts, FC.user_name, opts.user_name);
    appendListLike(parts, FC.software_name, opts.software_name);
    var statuses = opts.statuses || [];
    if (statuses.length) {
      parts.push(
        FC.status +
          " in (" +
          statuses
            .map(function (s) {
              return '"' + escapeQueryValue(s) + '"';
            })
            .join(", ") +
          ")",
      );
    }
    if (!parts.length) return "";
    return parts.join(" and ");
  }

  function fetchListRecords(queryCond, sortEmp) {
    var all = [];
    var offset = 0;
    var order = sortEmp
      ? " order by " + FC.software_name + " asc, " + FC.legacy_no + " asc"
      : " order by " + FC.dept_name + " asc, " + FC.user_name + " asc, " + FC.legacy_no + " asc";
    function page() {
      var base = String(queryCond || "").trim();
      var q = (base || "$id > 0") + order + " limit 500 offset " + offset;
      return apiGet("/k/v1/records.json", {
        app: APP_DB,
        query: q,
        fields: API_FIELDS,
      }).then(function (resp) {
        var rows = resp.records || [];
        all = all.concat(rows);
        if (rows.length >= 500) {
          offset += 500;
          return page();
        }
        return all;
      });
    }
    return page();
  }

  function showListLoading(show) {
    var el = document.getElementById(LIST_LOADING_ID);
    if (!show) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("div");
      el.id = LIST_LOADING_ID;
      el.className = "swl-list-loading";
      el.textContent = "一覧を取得しています…";
      document.body.appendChild(el);
    }
    el.style.display = "flex";
  }

  function closeListPanel() {
    var p = document.getElementById(LIST_PANEL_ID);
    if (p) p.remove();
    showListLoading(false);
  }

  function renderListPanel(records, summaryText) {
    closeListPanel();
    ensureListPrintStyles();
    var rows = records.map(flatten).filter(function (r) {
      return !isRetiredEmployeeRow(r);
    });
    var panel = document.createElement("div");
    panel.id = LIST_PANEL_ID;
    panel.className = "swl-list-panel";

    var toolbar = document.createElement("div");
    toolbar.className = "swl-list-toolbar";
    var titleWrap = document.createElement("div");
    titleWrap.style.flex = "1";
    var title = document.createElement("div");
    title.style.fontWeight = "700";
    title.textContent = "リスト一覧（" + rows.length + "件）";
    titleWrap.appendChild(title);
    if (summaryText) {
      var sub = document.createElement("div");
      sub.style.fontSize = "12px";
      sub.style.marginTop = "4px";
      sub.textContent = summaryText;
      titleWrap.appendChild(sub);
    }
    var btnPrint = document.createElement("button");
    btnPrint.type = "button";
    btnPrint.textContent = "印刷";
    btnPrint.className = "kintoneplugin-button-dialog-ok";
    btnPrint.addEventListener("click", function () {
      window.print();
    });
    var btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.textContent = "閉じる";
    btnClose.className = "kintoneplugin-button-normal";
    btnClose.addEventListener("click", closeListPanel);
    toolbar.appendChild(titleWrap);
    toolbar.appendChild(btnPrint);
    toolbar.appendChild(btnClose);

    var scroll = document.createElement("div");
    scroll.className = "swl-list-scroll";

    var printHead = document.createElement("div");
    printHead.className = "swl-list-print-head";
    printHead.innerHTML =
      "<h1 style=\"margin:0 0 8px;font-size:18px;\">ソフトウエア管理台帳ver.1 — リスト一覧</h1>" +
      (summaryText ? "<p style=\"margin:0;font-size:13px;\">" + esc(summaryText) + "</p>" : "") +
      '<p style="margin:8px 0 0;font-size:12px;color:#64748b;">出力日: ' +
      esc(todayJstYmd()) +
      "　件数: " +
      rows.length +
      "件</p>";

    var table = document.createElement("table");
    table.className = "swl-list-table";
    var thead = document.createElement("thead");
    var hr = document.createElement("tr");
    LIST_TABLE_COLS.forEach(function (col) {
      var th = document.createElement("th");
      th.textContent = col.label;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    if (!rows.length) {
      var tr0 = document.createElement("tr");
      var td0 = document.createElement("td");
      td0.colSpan = LIST_TABLE_COLS.length;
      td0.textContent = "該当なし";
      tr0.appendChild(td0);
      tbody.appendChild(tr0);
    } else {
      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        LIST_TABLE_COLS.forEach(function (col) {
          var td = document.createElement("td");
          td.textContent = col.key === "ident" ? r.ident : r[col.key] || "";
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    scroll.appendChild(printHead);
    scroll.appendChild(table);
    panel.appendChild(toolbar);
    panel.appendChild(scroll);
    document.body.appendChild(panel);
  }

  function closeListModal() {
    var m = document.getElementById(LIST_MODAL_ID);
    if (m) m.style.display = "none";
  }

  function resetListForm() {
    ["swl-list-user", "swl-list-emp", "swl-list-sw"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = "";
    });
    document.querySelectorAll('input[name="swl-list-dept"]').forEach(function (cb) {
      cb.checked = false;
    });
    document.querySelectorAll('input[name="swl-list-group"]').forEach(function (cb) {
      cb.checked = false;
    });
    var merge = document.getElementById("swl-list-merge");
    if (merge) merge.checked = false;
    document.querySelectorAll('input[name="swl-list-status"]').forEach(function (cb, i) {
      cb.checked = i === 0;
    });
  }

  function sortDeptMasterRows(rows) {
    return rows.slice().sort(function (a, b) {
      var sa = Number(a.sort_no);
      var sb = Number(b.sort_no);
      var na = Number.isFinite(sa) && sa > 0 ? sa : 99999;
      var nb = Number.isFinite(sb) && sb > 0 ? sb : 99999;
      if (na !== nb) return na - nb;
      var dc = String(a.dept_name || "").localeCompare(String(b.dept_name || ""), "ja");
      if (dc !== 0) return dc;
      return String(a.group_name || "").localeCompare(String(b.group_name || ""), "ja");
    });
  }

  function fetchDeptMasterRows() {
    if (deptMasterCache && deptMasterCache.length) {
      return Promise.resolve(deptMasterCache);
    }
    return apiGet("/k/v1/records.json", {
      app: APP_DEPT_MASTER,
      query: "order by sort_no asc, $id asc limit 500",
      fields: ["dept_name", "group_name", "sort_no"],
    })
      .then(function (resp) {
        var rows = [];
        (resp.records || []).forEach(function (r) {
          var d = val(r, "dept_name");
          var g = val(r, "group_name");
          var snRaw = val(r, "sort_no");
          var sn = snRaw !== "" ? Number(snRaw) : NaN;
          if (String(d).trim()) {
            rows.push({
              dept_name: String(d).trim(),
              group_name: String(g).trim(),
              sort_no: sn,
            });
          }
        });
        deptMasterCache = rows.length ? sortDeptMasterRows(rows) : DEPT_MASTER_FALLBACK.slice();
        return deptMasterCache;
      })
      .catch(function (e) {
        console.warn("[SWL-715] dept master fetch failed, using fallback", e);
        deptMasterCache = DEPT_MASTER_FALLBACK.slice();
        return deptMasterCache;
      });
  }

  function countDeptInLedger(name) {
    var n = 0;
    state.records.forEach(function (r) {
      if (String(r.dept_name || "").trim() === name) n++;
    });
    return n;
  }

  function countGroupInLedger(name) {
    var n = 0;
    state.records.forEach(function (r) {
      if (String(r.group_name || "").trim() === name) n++;
    });
    return n;
  }

  function buildListDeptOptions(masterRows) {
    var seen = {};
    var names = [];
    masterRows.forEach(function (row) {
      var name = String(row.dept_name || "").trim();
      if (!name || seen[name]) return;
      seen[name] = true;
      names.push(name);
    });
    var extras = [];
    distinctValues(state.records, "dept_name").forEach(function (d) {
      if (!seen[d]) {
        seen[d] = true;
        extras.push(d);
      }
    });
    extras.sort(function (a, b) {
      return a.localeCompare(b, "ja");
    });
    return names.concat(extras).map(function (name) {
      return { name: name, count: countDeptInLedger(name) };
    });
  }

  function buildListGroupOptions(masterRows) {
    var seen = {};
    var names = [];
    masterRows.forEach(function (row) {
      var name = String(row.group_name || "").trim();
      if (!name || seen[name]) return;
      seen[name] = true;
      names.push(name);
    });
    var extras = [];
    distinctValues(state.records, "group_name").forEach(function (g) {
      if (!seen[g]) {
        seen[g] = true;
        extras.push(g);
      }
    });
    extras.sort(function (a, b) {
      return a.localeCompare(b, "ja");
    });
    return names.concat(extras).map(function (name) {
      return { name: name, count: countGroupInLedger(name) };
    });
  }

  function renderListPickCheckboxes(container, options, inputName) {
    if (!options.length) {
      container.innerHTML =
        '<span style="font-size:12px;color:#64748b;">候補がありません</span>';
      return;
    }
    container.innerHTML = options
      .map(function (opt) {
        var muted = opt.count === 0 ? ' style="opacity:0.55;"' : "";
        return (
          "<label" +
          muted +
          '><input type="checkbox" name="' +
          esc(inputName) +
          '" value="' +
          esc(opt.name) +
          '" data-count="' +
          opt.count +
          '"> ' +
          esc(opt.name) +
          "（" +
          opt.count +
          "）</label>"
        );
      })
      .join("");
  }

  function fillListOrgPicks() {
    var deptBox = document.getElementById("swl-list-dept-picks");
    var groupBox = document.getElementById("swl-list-group-picks");
    if (!deptBox || !groupBox) return;
    deptBox.innerHTML = '<span style="font-size:12px;color:#64748b;">読込中</span>';
    groupBox.innerHTML = '<span style="font-size:12px;color:#64748b;">読込中</span>';
    fetchDeptMasterRows().then(function (masterRows) {
      renderListPickCheckboxes(deptBox, buildListDeptOptions(masterRows), "swl-list-dept");
      renderListPickCheckboxes(groupBox, buildListGroupOptions(masterRows), "swl-list-group");
    });
  }

  function runListQueryFromModal() {
    var deptNames = [];
    document.querySelectorAll('input[name="swl-list-dept"]:checked').forEach(function (cb) {
      deptNames.push(cb.value);
    });
    var groupNames = [];
    document.querySelectorAll('input[name="swl-list-group"]:checked').forEach(function (cb) {
      groupNames.push(cb.value);
    });
    var user = (document.getElementById("swl-list-user") || {}).value || "";
    var emp = (document.getElementById("swl-list-emp") || {}).value || "";
    var sw = (document.getElementById("swl-list-sw") || {}).value || "";
    var merge = (document.getElementById("swl-list-merge") || {}).checked;
    var statuses = [];
    document.querySelectorAll('input[name="swl-list-status"]:checked').forEach(function (cb) {
      statuses.push(cb.value);
    });
    if (!statuses.length) {
      alert("ステータスを1つ以上選んでください");
      return;
    }
    var q = buildListQuery({
      dept_names: deptNames,
      group_names: groupNames,
      user_name: user,
      emp_id: emp,
      software_name: sw,
      statuses: statuses,
      includeMain: merge,
    });
    var sortEmp = !!(String(emp).trim() || String(user).trim());
    var summary =
      "所属: " +
      (deptNames.length ? deptNames.join("・") : "（指定なし）") +
      "　／　グループ: " +
      (groupNames.length ? groupNames.join("・") : "（指定なし）") +
      "　／　社員: " +
      (emp.trim() || user.trim() || "（指定なし）") +
      "　／　ステータス: " +
      statuses.join("・");
    closeListModal();
    showListLoading(true);
    fetchListRecords(q, sortEmp)
      .then(function (recs) {
        showListLoading(false);
        renderListPanel(recs, summary);
      })
      .catch(function (e) {
        showListLoading(false);
        alert("一覧の取得に失敗しました: " + (e.message || e));
      });
  }

  function openListCreateModal(prefill) {
    prefill = prefill || {};
    var backdrop = document.getElementById(LIST_MODAL_ID);
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = LIST_MODAL_ID;
      backdrop.className = "swl-list-modal-bg";
      backdrop.innerHTML =
        '<div class="swl-list-modal">' +
        "<h2 style=\"margin:0 0 12px;font-size:17px;\">リスト一覧を作成</h2>" +
        '<p style="font-size:13px;color:#475569;margin:0 0 14px;">条件に合うレコードを表示し、印刷できます（横向き）。</p>' +
        '<p style="font-size:12px;color:#475569;margin:0 0 6px;">所属を選択（680全件・括弧内は台帳件数）</p>' +
        '<label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">所属名（複数選択可・未選択は指定なし）</label>' +
        '<div class="swl-list-pick-bar">' +
        '<button type="button" id="swl-list-dept-all" class="kintoneplugin-button-normal">全選択</button>' +
        '<button type="button" id="swl-list-dept-none" class="kintoneplugin-button-normal">全解除</button>' +
        '<button type="button" id="swl-list-dept-has" class="kintoneplugin-button-normal">件数ありのみ選択</button>' +
        "</div>" +
        '<div id="swl-list-dept-picks" class="swl-list-picks"></div>' +
        '<label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">所属グループ（複数選択可・未選択は指定なし）</label>' +
        '<div class="swl-list-pick-bar">' +
        '<button type="button" id="swl-list-group-all" class="kintoneplugin-button-normal">全選択</button>' +
        '<button type="button" id="swl-list-group-none" class="kintoneplugin-button-normal">全解除</button>' +
        '<button type="button" id="swl-list-group-has" class="kintoneplugin-button-normal">件数ありのみ選択</button>' +
        "</div>" +
        '<div id="swl-list-group-picks" class="swl-list-picks"></div>' +
        '<label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">利用者名（部分一致）</label>' +
        '<input type="text" id="swl-list-user" style="width:100%;box-sizing:border-box;margin-bottom:10px;padding:8px;">' +
        '<label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">社員番号（完全一致）</label>' +
        '<div style="display:flex;gap:8px;margin-bottom:10px;"><input type="text" id="swl-list-emp" readonly style="flex:1;padding:8px;">' +
        '<button type="button" id="swl-list-pick-595" class="kintoneplugin-button-normal">社員検索</button></div>' +
        '<label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">製品名（部分一致）</label>' +
        '<input type="text" id="swl-list-sw" style="width:100%;box-sizing:border-box;margin-bottom:10px;padding:8px;">' +
        '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">ステータス（1つ以上必須）</div>' +
        '<label style="margin-right:12px;"><input type="checkbox" name="swl-list-status" value="利用中" checked> 利用中</label>' +
        '<label><input type="checkbox" name="swl-list-status" value="廃止"> 廃止</label>' +
        '<label style="display:flex;align-items:center;gap:8px;margin:12px 0;font-size:13px;">' +
        '<input type="checkbox" id="swl-list-merge"> いまの一覧条件も含める</label>' +
        '<div style="display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:16px;">' +
        '<button type="button" id="swl-list-clear" class="kintoneplugin-button-normal">クリア</button>' +
        '<button type="button" id="swl-list-cancel" class="kintoneplugin-button-normal">キャンセル</button>' +
        '<button type="button" id="swl-list-go" class="kintoneplugin-button-dialog-ok">一覧を表示</button>' +
        "</div></div>";
      backdrop.addEventListener("click", function (ev) {
        if (ev.target === backdrop) closeListModal();
      });
      document.body.appendChild(backdrop);
      backdrop.querySelector("#swl-list-cancel").addEventListener("click", closeListModal);
      backdrop.querySelector("#swl-list-clear").addEventListener("click", resetListForm);
      backdrop.querySelector("#swl-list-go").addEventListener("click", runListQueryFromModal);
      backdrop.querySelector("#swl-list-pick-595").addEventListener("click", function () {
        openEmp595Picker(function (emp) {
          var empEl = document.getElementById("swl-list-emp");
          var userEl = document.getElementById("swl-list-user");
          if (empEl) empEl.value = emp.emp_id || "";
          if (userEl) userEl.value = emp.user_name || "";
        });
      });
      backdrop.querySelector("#swl-list-dept-all").addEventListener("click", function () {
        document
          .querySelectorAll('#swl-list-dept-picks input[name="swl-list-dept"]')
          .forEach(function (cb) {
            cb.checked = true;
          });
      });
      backdrop.querySelector("#swl-list-dept-none").addEventListener("click", function () {
        document
          .querySelectorAll('#swl-list-dept-picks input[name="swl-list-dept"]')
          .forEach(function (cb) {
            cb.checked = false;
          });
      });
      backdrop.querySelector("#swl-list-dept-has").addEventListener("click", function () {
        document
          .querySelectorAll('#swl-list-dept-picks input[name="swl-list-dept"]')
          .forEach(function (cb) {
            cb.checked = Number(cb.getAttribute("data-count") || "0") > 0;
          });
      });
      backdrop.querySelector("#swl-list-group-all").addEventListener("click", function () {
        document
          .querySelectorAll('#swl-list-group-picks input[name="swl-list-group"]')
          .forEach(function (cb) {
            cb.checked = true;
          });
      });
      backdrop.querySelector("#swl-list-group-none").addEventListener("click", function () {
        document
          .querySelectorAll('#swl-list-group-picks input[name="swl-list-group"]')
          .forEach(function (cb) {
            cb.checked = false;
          });
      });
      backdrop.querySelector("#swl-list-group-has").addEventListener("click", function () {
        document
          .querySelectorAll('#swl-list-group-picks input[name="swl-list-group"]')
          .forEach(function (cb) {
            cb.checked = Number(cb.getAttribute("data-count") || "0") > 0;
          });
      });
    }
    resetListForm();
    fillListOrgPicks();
    if (prefill.emp_id) {
      var empEl = document.getElementById("swl-list-emp");
      if (empEl) empEl.value = prefill.emp_id;
    }
    if (prefill.user_name) {
      var userEl = document.getElementById("swl-list-user");
      if (userEl) userEl.value = prefill.user_name;
    }
    backdrop.style.display = "flex";
  }

  function buildShell() {
    if (document.getElementById("swl-root")) return;
    injectCss();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "swl-root";
    root.className = "swl-root";
    root.innerHTML =
      '<div class="swl-toolbar">' +
      "<strong style=\"font-size:16px\">ソフトウエア管理台帳ver.1</strong>" +
      '<button type="button" id="swl-reload" class="kintoneplugin-button-normal">再読込</button>' +
      '<button type="button" id="swl-new" class="kintoneplugin-button-dialog-ok">新規登録</button>' +
      '<button type="button" id="swl-list-create" class="kintoneplugin-button-normal">リスト一覧作成</button>' +
      '<button type="button" id="swl-print-main" class="kintoneplugin-button-normal">一覧を印刷</button>' +
      "</div>" +
      '<div id="swl-meta" class="swl-meta"></div>' +
      '<details id="swl-filter-acc" class="swl-filter-acc">' +
      '<summary class="swl-filter-sum">' +
      "<span>絞り込み（利用時には開いてください）</span>" +
      '<span id="swl-acc-hint" class="swl-acc-hint"></span>' +
      "</summary>" +
      '<div class="swl-filter-acc-body">' +
      '<div class="swl-toolbar">' +
      '<label><input type="radio" name="swl-filter" value="active"' +
      (state.filter === "active" ? " checked" : "") +
      "> 利用中</label>" +
      '<label><input type="radio" name="swl-filter" value="retired"> 廃止</label>' +
      '<input type="search" id="swl-search" placeholder="製品名・バージョン・ソフトウエアの情報・氏名・所属…" style="min-width:240px;padding:6px;margin-left:8px">' +
      '<button type="button" id="swl-clear" class="kintoneplugin-button-normal">クリア</button>' +
      "</div>" +
      '<div class="swl-chip-sec swl-chip-sec--dept">' +
      '<div class="swl-chip-sec-title">所属</div>' +
      '<div id="swl-dept-chips" class="swl-chips"></div>' +
      "</div>" +
      '<div class="swl-chip-sec swl-chip-sec--user">' +
      '<div class="swl-chip-sec-title">利用者</div>' +
      '<div id="swl-user-chips" class="swl-chips"></div>' +
      "</div>" +
      "</div>" +
      "</details>" +
      '<div class="swl-table-wrap"><table class="swl-table"><thead><tr>' +
      TABLE_COLUMNS.map(function (c) {
        if (!c.sort) return "<th>" + esc(c.label) + "</th>";
        return (
          '<th class="swl-sort" data-sort="' +
          esc(c.key) +
          '">' +
          esc(c.label) +
          '<span class="swl-sort-ind"></span></th>'
        );
      }).join("") +
      "<th>操作</th>" +
      '</tr></thead><tbody id="swl-tbody"></tbody></table></div>';
    host.appendChild(root);

    var table = root.querySelector(".swl-table");
    if (table) {
      table.querySelector("thead").addEventListener("click", function (ev) {
        var th = ev.target.closest("th.swl-sort");
        if (!th) return;
        var key = th.getAttribute("data-sort");
        if (key) toggleSort(key);
      });
    }

    document.getElementById("swl-reload").addEventListener("click", reloadRecords);
    document.getElementById("swl-new").addEventListener("click", openCreateModal);
    document.getElementById("swl-list-create").addEventListener("click", function () {
      openListCreateModal();
    });
    document.getElementById("swl-print-main").addEventListener("click", printMainTable);
    document.querySelectorAll('input[name="swl-filter"]').forEach(function (rb) {
      rb.addEventListener("change", function () {
        if (rb.checked) {
          state.filter = rb.value;
          renderTable();
        }
      });
    });
    var search = document.getElementById("swl-search");
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    document.getElementById("swl-clear").addEventListener("click", clearFilters);
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
