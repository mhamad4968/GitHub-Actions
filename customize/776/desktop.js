(function () {
  "use strict";

  /**
   * 776 社員名簿
 * BUILD: 2026-08-21-776-agg-th-larger（集計表ヘッダ文字を大きく）
 * BUILD: 2026-08-21-776-agg-col-mid2（集計表の列幅をさらに少し広く）
 * BUILD: 2026-08-21-776-agg-col-mid（集計表の列幅を中庸に）
 * BUILD: 2026-08-21-776-agg-col-fixed（集計表の列幅を固定・部署を抑制）
 * BUILD: 2026-08-21-776-toolbar-align（ツールバー高さ・PC台帳レイアウト揃え）
   */
  var BUILD = "2026-08-21-776-agg-th-larger";
  var WRAP_ID = "jbis-776-index-toolbar";
  var REORDER_ID = "jbis-776-index-reorder";
  var AGG_ID = "jbis-776-index-agg";
  var ORG_POP_ID = "jbis-776-org-popover";
  var DEPT_SEP_STYLE_ID = "jbis-776-dept-sep-style";
  var STORAGE_KEY = "jbis776-index-state-v1";
  var UI_OPEN_KEY = "jbis776-ui-open-v1";
  var CAT_SEISHAIN = "正社員";
  var CAT_JUNSHAIN = "準社員";
  var APP_ID = null;

  /** group_name コード → 集計表の拠点表示（Excel 集計表準拠） */
  var GROUP_LABEL = {
    honsya: "本社",
    tohoku: "東北支店",
    "kan-etsu": "関越支店",
    tokyo: "東京支店",
    tokai: "東海支店",
    reform: "リフォーム事業統括部",
    tekko: "鉄構支店",
    wangan: "湾岸工事所",
    bnp: "ブリッジニアプラス",
  };

  /** 680 並び（scripts/data/pc-ledger-dept-master-seed-records.json と同期） */
  var DEPT_MASTER_680 = [
    { dept_name: "役員室", group_name: "honsya" },
    { dept_name: "顧問室", group_name: "honsya" },
    { dept_name: "総務部", group_name: "honsya" },
    { dept_name: "経理部", group_name: "honsya" },
    { dept_name: "経営企画部", group_name: "honsya" },
    { dept_name: "システム推進室", group_name: "honsya" },
    { dept_name: "人事研修部", group_name: "honsya" },
    { dept_name: "人事研修部付出向者", group_name: "honsya" },
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
    { dept_name: "東海支店", group_name: "tokai" },
    { dept_name: "東京営業所", group_name: "tokai" },
    { dept_name: "静岡営業所", group_name: "tokai" },
    { dept_name: "名古屋営業所", group_name: "tokai" },
    { dept_name: "関西営業所", group_name: "tokai" },
    { dept_name: "札幌支店", group_name: "reform" },
    { dept_name: "リフォーム事業統括部", group_name: "reform" },
    { dept_name: "鉄構支店", group_name: "tekko" },
    { dept_name: "首都圏支店", group_name: "reform" },
    { dept_name: "湾岸工事所", group_name: "wangan" },
    { dept_name: "ブリッジニアプラス", group_name: "bnp" },
    { dept_name: "鎌ヶ谷作業所", group_name: "bnp" },
  ];

  var GROUP_ORDER = [
    "honsya",
    "tohoku",
    "kan-etsu",
    "tokyo",
    "tokai",
    "reform",
    "tekko",
    "wangan",
    "bnp",
  ];

  var EXPORT_COLS = [
    { code: "employee_no", label: "社員番号" },
    { code: "group_name", label: "部署グループ" },
    { code: "dept_name", label: "部署名" },
    { code: "user_name", label: "社員名" },
    { code: "job_title", label: "役職" },
    { code: "mail", label: "メールアドレス" },
  ];

  function escapeForQuery(s) {
    return String(s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function getHeaderSpace() {
    return (
      (typeof kintone !== "undefined" &&
        kintone.app &&
        kintone.app.getHeaderSpaceElement &&
        kintone.app.getHeaderSpaceElement()) ||
      null
    );
  }

  function getAppId() {
    if (APP_ID != null) return APP_ID;
    try {
      APP_ID = kintone.app.getId();
    } catch (e) {
      APP_ID = 776;
    }
    return APP_ID;
  }

  function defaultState() {
    return { cat: "all", kw: "", depts: [], groups: [] };
  }

  function loadState() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var o = JSON.parse(raw);
      return {
        cat: o.cat === "seishain" || o.cat === "junshain" || o.cat === "all" ? o.cat : "all",
        kw: String(o.kw || ""),
        depts: Array.isArray(o.depts) ? o.depts.map(String) : [],
        groups: Array.isArray(o.groups) ? o.groups.map(String) : [],
      };
    } catch (e) {
      return defaultState();
    }
  }

  function saveState(st) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(st));
    } catch (e) {
      /* noop */
    }
  }

  function buildQuery(st) {
    var parts = [];
    if (st.cat === "seishain") {
      parts.push('employment_category in ("' + escapeForQuery(CAT_SEISHAIN) + '")');
    } else if (st.cat === "junshain") {
      parts.push('employment_category in ("' + escapeForQuery(CAT_JUNSHAIN) + '")');
    }
    if (st.depts && st.depts.length) {
      parts.push(
        "dept_name in (" +
          st.depts
            .map(function (d) {
              return '"' + escapeForQuery(d) + '"';
            })
            .join(",") +
          ")",
      );
    }
    if (st.groups && st.groups.length) {
      parts.push(
        "group_name in (" +
          st.groups
            .map(function (g) {
              return '"' + escapeForQuery(g) + '"';
            })
            .join(",") +
          ")",
      );
    }
    var kw = String(st.kw || "").trim();
    if (kw) {
      var e = escapeForQuery(kw);
      parts.push(
        '(user_name like "' +
          e +
          '" or dept_name like "' +
          e +
          '" or mail like "' +
          e +
          '" or employee_no like "' +
          e +
          '")',
      );
    }
    var where = parts.length ? parts.join(" and ") + " " : "";
    return where + "order by list_sort asc, レコード番号 asc";
  }

  function navigate(queryStr) {
    var u;
    try {
      u = new URL(window.location.href);
    } catch (e) {
      return;
    }
    var q = String(queryStr || "").trim();
    if (q) {
      u.searchParams.set("query", q);
      u.searchParams.delete("q");
    } else {
      u.searchParams.delete("query");
      u.searchParams.delete("q");
    }
    try {
      window.location.replace(u.toString());
    } catch (eNav) {
      window.location.href = u.toString();
    }
  }

  function applyAndReload(st) {
    saveState(st);
    navigate(buildQuery(st));
  }

  function fetchRecordsByQuery(queryBase) {
    var app = getAppId();
    var all = [];
    function page(offset) {
      return kintone
        .api(kintone.api.url("/k/v1/records.json", true), "GET", {
          app: app,
          query: queryBase + " limit 500 offset " + offset,
          fields: [
            "$id",
            "list_sort",
            "employee_no",
            "group_name",
            "dept_name",
            "user_name",
            "job_title",
            "mail",
            "row_role",
            "source_595_id",
            "employment_category",
          ],
        })
        .then(function (resp) {
          var rows = resp.records || [];
          all = all.concat(rows);
          if (rows.length < 500) return all;
          return page(offset + 500);
        });
    }
    return page(0);
  }

  function countPeople(records) {
    var seen = {};
    var n = 0;
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if ((r.row_role && r.row_role.value) !== "本務") continue;
      var sid = String((r.source_595_id && r.source_595_id.value) || "");
      if (!sid || seen[sid]) continue;
      seen[sid] = true;
      n += 1;
    }
    return n;
  }

  function formatNow() {
    var d = new Date();
    function p(n) {
      return (n < 10 ? "0" : "") + n;
    }
    return (
      d.getFullYear() +
      "-" +
      p(d.getMonth() + 1) +
      "-" +
      p(d.getDate()) +
      " " +
      p(d.getHours()) +
      ":" +
      p(d.getMinutes())
    );
  }

  function cell(r, code) {
    return r[code] && r[code].value != null ? String(r[code].value) : "";
  }

  function exportCsv(records) {
    var lines = [];
    lines.push(EXPORT_COLS.map(function (c) {
      return c.label;
    }).join(","));
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      lines.push(
        EXPORT_COLS.map(function (c) {
          var v = cell(r, c.code).replace(/"/g, '""');
          return '"' + v + '"';
        }).join(","),
      );
    }
    lines.push("");
    lines.push('"【機密】本リストは社内管理目的です。取扱い・廃棄に注意してください。"');
    lines.push('"出力日時","' + formatNow() + '"');
    var bom = "\uFEFF";
    var blob = new Blob([bom + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "社員名簿_" + formatNow().replace(/[: ]/g, "") + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function printList(records) {
    var w = window.open("", "_blank");
    if (!w) {
      window.alert("ポップアップがブロックされました。許可してから再度お試しください。");
      return;
    }
    var prevDept = null;
    var blockIdx = -1;
    var rowsHtml = records
      .map(function (r) {
        var dept = cell(r, "dept_name");
        var cls = [];
        if (dept !== prevDept) {
          blockIdx += 1;
          if (prevDept != null) cls.push("dept-sep");
          prevDept = dept;
        }
        if (blockIdx % 2 === 1) cls.push("dept-alt");
        return (
          '<tr class="' +
          cls.join(" ") +
          '">' +
          EXPORT_COLS.map(function (c) {
            return "<td>" + escapeHtml(cell(r, c.code)) + "</td>";
          }).join("") +
          "</tr>"
        );
      })
      .join("");
    var head = EXPORT_COLS.map(function (c) {
      return "<th>" + escapeHtml(c.label) + "</th>";
    }).join("");
    w.document.write(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>社員名簿</title>" +
        "<style>body{font-family:sans-serif;font-size:12px;}" +
        "table{border-collapse:collapse;width:100%;}" +
        "th,td{border:1px solid #94a3b8;padding:4px 6px;}" +
        "th{background:#e2e8f0;border:1px solid #334155;}" +
        "tr.dept-sep td{border-top:1.5px solid #c4b5fd;}" +
        "tr.dept-alt td{background:#f0fdf4;}" +
        ".note{margin:12px 0;color:#991b1b;font-weight:700;}" +
        "@media print{button{display:none}}</style></head><body>" +
        "<h1>社員名簿</h1>" +
        "<p class='note'>【機密】本リストは社内管理目的です。取扱い・廃棄に注意してください。</p>" +
        "<p>出力日時: " +
        escapeHtml(formatNow()) +
        " ／ 行数 " +
        records.length +
        " ／ 人数(本務) " +
        countPeople(records) +
        "</p>" +
        "<table><thead><tr>" +
        head +
        "</tr></thead><tbody>" +
        rowsHtml +
        "</tbody></table>" +
        "<script>window.onload=function(){window.print();}</" +
        "script>" +
        "</body></html>",
    );
    w.document.close();
  }

  /** 一覧画面: 部署が変わる行に太い上罫線＋ブロック交互背景 */
  function ensureDeptSepStyle() {
    var style = document.getElementById(DEPT_SEP_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = DEPT_SEP_STYLE_ID;
      document.head.appendChild(style);
    }
    /* 薄紫の区切り線＋薄緑の交互背景 */
    style.textContent =
      ".jbis-776-dept-sep > td," +
      ".jbis-776-dept-sep > th{" +
      "border-top:1.5px solid #c4b5fd !important;" +
      "box-shadow:inset 0 1px 0 rgba(196,181,253,0.45);}" +
      ".jbis-776-dept-alt > td," +
      ".jbis-776-dept-alt > th{" +
      "background-color:#f0fdf4 !important;}";
  }

  function applyIndexDeptSeparators(records) {
    if (!records || !records.length) return;
    ensureDeptSepStyle();
    var selectors = [
      ".recordlist-gaia tbody tr",
      ".gaia-argoui-app-index-table tbody tr",
      "table.recordlist-gaia tbody tr",
      ".ocean-ui-app-index-table tbody tr",
    ];
    var trs = null;
    for (var s = 0; s < selectors.length; s++) {
      var found = document.querySelectorAll(selectors[s]);
      if (found && found.length) {
        trs = found;
        break;
      }
    }
    if (!trs || !trs.length) return;

    var prevDept = null;
    var blockIdx = -1;
    var dataIdx = 0;
    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      tr.classList.remove("jbis-776-dept-sep", "jbis-776-dept-alt");
      if (tr.querySelector("th")) continue;
      if (dataIdx >= records.length) break;
      var dept = cell(records[dataIdx], "dept_name");
      if (dept !== prevDept) {
        if (prevDept != null) tr.classList.add("jbis-776-dept-sep");
        blockIdx += 1;
        prevDept = dept;
      }
      if (blockIdx % 2 === 1) tr.classList.add("jbis-776-dept-alt");
      dataIdx += 1;
    }
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function labelOfHit(r) {
    return (
      cell(r, "user_name") +
      "／" +
      cell(r, "dept_name") +
      "／" +
      cell(r, "job_title") +
      "（" +
      cell(r, "row_role") +
      "・順" +
      cell(r, "list_sort") +
      "）"
    );
  }

  function searchByName(name) {
    var q = String(name || "").trim();
    if (!q) return Promise.resolve([]);
    return kintone
      .api(kintone.api.url("/k/v1/records.json", true), "GET", {
        app: getAppId(),
        query:
          'user_name like "' +
          escapeForQuery(q) +
          '" order by list_sort asc, レコード番号 asc limit 50',
        fields: [
          "$id",
          "user_name",
          "dept_name",
          "job_title",
          "row_role",
          "list_sort",
          "group_name",
        ],
      })
      .then(function (resp) {
        return resp.records || [];
      });
  }

  function placeMoverRelative(moverId, anchorId, place) {
    var app = getAppId();
    var all = [];
    function page(offset) {
      return kintone
        .api(kintone.api.url("/k/v1/records.json", true), "GET", {
          app: app,
          query: "order by list_sort asc, レコード番号 asc limit 500 offset " + offset,
          fields: ["$id"],
        })
        .then(function (resp) {
          var rows = resp.records || [];
          for (var i = 0; i < rows.length; i++) {
            all.push(String(rows[i].$id.value));
          }
          if (rows.length < 500) return all;
          return page(offset + 500);
        });
    }
    return page(0).then(function (ids) {
      var from = ids.indexOf(String(moverId));
      var anchor = ids.indexOf(String(anchorId));
      if (from < 0) return Promise.reject(new Error("動かす人が一覧にありません"));
      if (anchor < 0) return Promise.reject(new Error("基準の人が一覧にありません"));
      ids.splice(from, 1);
      if (from < anchor) anchor -= 1;
      var insertAt = place === "above" ? anchor : anchor + 1;
      if (insertAt < 0) insertAt = 0;
      if (insertAt > ids.length) insertAt = ids.length;
      ids.splice(insertAt, 0, String(moverId));
      var updates = ids.map(function (id, i) {
        return { id: id, record: { list_sort: { value: String(i + 1) } } };
      });
      var chain = Promise.resolve();
      for (var b = 0; b < updates.length; b += 100) {
        (function (batch) {
          chain = chain.then(function () {
            return kintone.api(kintone.api.url("/k/v1/records.json", true), "PUT", {
              app: app,
              records: batch,
            });
          });
        })(updates.slice(b, b + 100));
      }
      return chain.then(function () {
        return { total: ids.length, at: insertAt + 1 };
      });
    });
  }

  function fillSelect(sel, records, emptyLabel) {
    sel.innerHTML = "";
    var opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = emptyLabel || "候補を選択";
    sel.appendChild(opt0);
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var opt = document.createElement("option");
      opt.value = String(r.$id.value);
      opt.textContent = labelOfHit(r);
      sel.appendChild(opt);
    }
  }

  function uniqueGroups() {
    var seen = {};
    var out = [];
    for (var i = 0; i < GROUP_ORDER.length; i++) {
      var g = GROUP_ORDER[i];
      if (!seen[g]) {
        seen[g] = true;
        out.push(g);
      }
    }
    for (var j = 0; j < DEPT_MASTER_680.length; j++) {
      var gg = DEPT_MASTER_680[j].group_name;
      if (gg && !seen[gg]) {
        seen[gg] = true;
        out.push(gg);
      }
    }
    return out;
  }

  function loadUiOpen() {
    try {
      var o = JSON.parse(sessionStorage.getItem(UI_OPEN_KEY) || "{}");
      return { reorder: !!o.reorder, agg: !!o.agg };
    } catch (e) {
      return { reorder: false, agg: false };
    }
  }

  function saveUiOpen(o) {
    try {
      sessionStorage.setItem(UI_OPEN_KEY, JSON.stringify(o));
    } catch (e) {
      /* noop */
    }
  }

  function closeOrgPopover() {
    var el = document.getElementById(ORG_POP_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function openOrgPopover(anchorBtn, st, onApplied) {
    closeOrgPopover();
    var pop = document.createElement("div");
    pop.id = ORG_POP_ID;
    var rect = anchorBtn.getBoundingClientRect();
    pop.style.cssText =
      "position:fixed;z-index:10050;width:min(440px,92vw);max-height:min(70vh,520px);overflow:auto;" +
      "border:1px solid #94a3b8;border-radius:10px;background:#fff;" +
      "box-shadow:0 16px 40px rgba(15,23,42,.22);padding:12px;" +
      "left:" +
      Math.max(8, Math.min(rect.left, window.innerWidth - 460)) +
      "px;top:" +
      (rect.bottom + 6) +
      "px;";

    var head = document.createElement("div");
    head.style.cssText =
      "display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;";
    var title = document.createElement("div");
    title.style.cssText = "flex:1;font-size:13px;font-weight:800;color:#0f172a;";
    title.textContent = "所属・部署グループ";
    var btnClr = document.createElement("button");
    btnClr.type = "button";
    btnClr.textContent = "選択解除";
    btnClr.style.cssText =
      "padding:4px 10px;border-radius:6px;border:1px solid #94a3b8;background:#fff;font-size:12px;font-weight:700;cursor:pointer;";
    head.appendChild(title);
    head.appendChild(btnClr);
    pop.appendChild(head);

    var hint = document.createElement("div");
    hint.style.cssText = "font-size:11px;color:#64748b;margin-bottom:8px;line-height:1.45;";
    hint.textContent = "グループ／所属にレ点 →「この条件で絞り込み」。未選択＝条件なし。";
    pop.appendChild(hint);

    var filterInp = document.createElement("input");
    filterInp.type = "search";
    filterInp.placeholder = "候補を絞り込み…";
    filterInp.style.cssText =
      "width:100%;box-sizing:border-box;margin-bottom:8px;padding:6px 8px;border:1px solid #94a3b8;border-radius:6px;font-size:13px;";
    pop.appendChild(filterInp);

    var groupHost = document.createElement("div");
    groupHost.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;";
    pop.appendChild(groupHost);

    var deptHost = document.createElement("div");
    deptHost.style.cssText =
      "display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px 8px;" +
      "max-height:220px;overflow:auto;padding:4px 2px;margin-bottom:10px;";
    pop.appendChild(deptHost);

    var selectedDepts = {};
    var selectedGroups = {};
    (st.depts || []).forEach(function (d) {
      selectedDepts[d] = true;
    });
    (st.groups || []).forEach(function (g) {
      selectedGroups[g] = true;
    });

    function render() {
      var q = String(filterInp.value || "").trim().toLowerCase();
      groupHost.innerHTML = "";
      uniqueGroups().forEach(function (g) {
        if (q && g.toLowerCase().indexOf(q) === -1) return;
        var lab = document.createElement("label");
        lab.style.cssText =
          "display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #cbd5e1;" +
          "border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;background:" +
          (selectedGroups[g] ? "#ecfdf5" : "#fff") +
          ";";
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!selectedGroups[g];
        cb.addEventListener("change", function () {
          if (cb.checked) selectedGroups[g] = true;
          else delete selectedGroups[g];
          render();
        });
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(g));
        groupHost.appendChild(lab);
      });

      deptHost.innerHTML = "";
      DEPT_MASTER_680.forEach(function (row) {
        var d = row.dept_name;
        if (
          q &&
          d.toLowerCase().indexOf(q) === -1 &&
          String(row.group_name || "")
            .toLowerCase()
            .indexOf(q) === -1
        ) {
          return;
        }
        var lab = document.createElement("label");
        lab.style.cssText =
          "display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;";
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!selectedDepts[d];
        cb.addEventListener("change", function () {
          if (cb.checked) selectedDepts[d] = true;
          else delete selectedDepts[d];
        });
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(d));
        deptHost.appendChild(lab);
      });
    }
    filterInp.addEventListener("input", render);
    btnClr.addEventListener("click", function () {
      selectedDepts = {};
      selectedGroups = {};
      render();
    });
    render();

    var foot = document.createElement("div");
    foot.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;";
    var btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "閉じる";
    btnCancel.style.cssText =
      "padding:6px 12px;border:1px solid #94a3b8;border-radius:6px;background:#fff;cursor:pointer;font-weight:700;";
    btnCancel.addEventListener("click", closeOrgPopover);
    var btnOk = document.createElement("button");
    btnOk.type = "button";
    btnOk.textContent = "この条件で絞り込み";
    btnOk.style.cssText =
      "padding:6px 14px;border:none;border-radius:6px;background:#0f766e;color:#fff;cursor:pointer;font-weight:700;";
    btnOk.addEventListener("click", function () {
      st.depts = Object.keys(selectedDepts);
      st.groups = Object.keys(selectedGroups);
      closeOrgPopover();
      onApplied();
    });
    foot.appendChild(btnCancel);
    foot.appendChild(btnOk);
    pop.appendChild(foot);
    document.body.appendChild(pop);
  }

  function filterSummary(st) {
    var bits = [];
    if (st.kw) bits.push("キーワードあり");
    if (st.depts && st.depts.length) bits.push("所属" + st.depts.length);
    if (st.groups && st.groups.length) bits.push("グループ" + st.groups.length);
    if (st.cat === "seishain") bits.push("正社員");
    if (st.cat === "junshain") bits.push("準社員");
    return bits.length ? bits.join("・") : "条件なし（全件）";
  }

  /** PC台帳型: いまの条件の部品 */
  function buildActiveConditionParts(st) {
    var parts = [];
    var kw = String(st.kw || "").trim();
    if (kw) parts.push("キーワード「" + kw + "」");
    if (st.cat === "seishain") parts.push("雇用区分: 正社員");
    else if (st.cat === "junshain") parts.push("雇用区分: 準社員");
    else parts.push("雇用区分: すべて");
    if (st.depts && st.depts.length) {
      parts.push("所属: " + st.depts.join("・"));
    }
    if (st.groups && st.groups.length) {
      parts.push(
        "部署グループ: " +
          st.groups
            .map(function (g) {
              return GROUP_LABEL[g] || g;
            })
            .join("・"),
      );
    }
    parts.push("並び: 名簿順（list_sort↑）");
    return parts;
  }

  function activeConditionLine(st) {
    return "いまの条件: " + buildActiveConditionParts(st).join(" ／ ");
  }

  function fetchMatchCount(queryBase) {
    var app = getAppId();
    var where = String(queryBase || "")
      .replace(/\s*order by[\s\S]*$/i, "")
      .trim();
    var q = (where ? where + " " : "") + "limit 1";
    return kintone
      .api(kintone.api.url("/k/v1/records.json", true), "GET", {
        app: app,
        query: q,
        totalCount: true,
        fields: ["$id"],
      })
      .then(function (res) {
        return Number(res && res.totalCount != null ? res.totalCount : 0);
      });
  }

  /** 集計表ヘッダ用：件数＋具体条件 */
  function filterDetailLines(st) {
    var catLabel =
      st.cat === "seishain"
        ? "正社員"
        : st.cat === "junshain"
          ? "準社員"
          : "すべて（正社員・準社員）";
    var lines = [];
    lines.push("雇用区分: " + catLabel);
    if (st.kw && String(st.kw).trim()) {
      lines.push("キーワード: 「" + String(st.kw).trim() + "」");
    } else {
      lines.push("キーワード: （なし）");
    }
    if (st.depts && st.depts.length) {
      lines.push("所属: " + st.depts.join("、"));
    } else {
      lines.push("所属: （指定なし）");
    }
    if (st.groups && st.groups.length) {
      lines.push(
        "部署グループ: " +
          st.groups
            .map(function (g) {
              return GROUP_LABEL[g] || g;
            })
            .join("、"),
      );
    } else {
      lines.push("部署グループ: （指定なし）");
    }
    return lines;
  }

  /**
   * 集計表: 拠点 / 部署 / 在籍数（拠点合計はブロック最終行）
   * 本務のみ・人ベース（source_595_id DISTINCT）
   */
  function buildAggTableModel(records) {
    var byGroupDept = {};
    var seenPerson = {};
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if ((r.row_role && r.row_role.value) !== "本務") continue;
      var sid = String((r.source_595_id && r.source_595_id.value) || "");
      if (!sid || seenPerson[sid]) continue;
      seenPerson[sid] = true;
      var g = String((r.group_name && r.group_name.value) || "").trim() || "(未設定)";
      var d = String((r.dept_name && r.dept_name.value) || "").trim() || "(未設定)";
      if (!byGroupDept[g]) byGroupDept[g] = {};
      byGroupDept[g][d] = (byGroupDept[g][d] || 0) + 1;
    }

    var deptOrder = {};
    DEPT_MASTER_680.forEach(function (row, idx) {
      deptOrder[row.group_name + "\0" + row.dept_name] = idx;
    });

    var groupKeys = GROUP_ORDER.slice();
    Object.keys(byGroupDept).forEach(function (g) {
      if (groupKeys.indexOf(g) === -1) groupKeys.push(g);
    });

    var rows = [];
    var grand = 0;
    groupKeys.forEach(function (g) {
      var deptMap = byGroupDept[g];
      if (!deptMap) return;
      var depts = Object.keys(deptMap).sort(function (a, b) {
        var ia = deptOrder[g + "\0" + a];
        var ib = deptOrder[g + "\0" + b];
        if (ia == null && ib == null) return a.localeCompare(b, "ja");
        if (ia == null) return 1;
        if (ib == null) return -1;
        return ia - ib;
      });
      var subtotal = 0;
      depts.forEach(function (d) {
        subtotal += deptMap[d];
      });
      grand += subtotal;
      var hubLabel = GROUP_LABEL[g] || g;
      depts.forEach(function (d, di) {
        rows.push({
          hub: di === 0 ? hubLabel : "",
          dept: d,
          count: deptMap[d],
          isSubtotal: false,
        });
      });
      // 拠点ブロック最終行に合計（部署列は「合計」のみ＝幅を食わない）
      rows.push({
        hub: "",
        dept: "合計",
        count: subtotal,
        isSubtotal: true,
      });
    });
    return { rows: rows, grand: grand, people: Object.keys(seenPerson).length };
  }

  function mountAggPanel(space, st, uiOpen, recordsPromise) {
    var old = document.getElementById(AGG_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var box = document.createElement("div");
    box.id = AGG_ID;
    box.style.cssText =
      "margin:0 0 12px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:12px;" +
      "background:linear-gradient(180deg,#fafbff 0%,#ffffff 48px);" +
      "box-shadow:0 1px 2px rgba(15,23,42,0.04);" +
      "flex-direction:column;gap:10px;box-sizing:border-box;" +
      (uiOpen && uiOpen.agg ? "display:flex;" : "display:none;");

    var titleRow = document.createElement("div");
    titleRow.style.cssText =
      "display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;";
    var title = document.createElement("div");
    title.style.cssText =
      "font-weight:800;color:#0f172a;font-size:15px;letter-spacing:0.02em;" +
      "border-left:3px solid #a78bfa;padding-left:10px;";
    title.textContent = "部署の人数集計表";
    var titleSub = document.createElement("div");
    titleSub.style.cssText = "font-size:11px;color:#64748b;font-weight:600;";
    titleSub.textContent = "本務・人ベース";
    titleRow.appendChild(title);
    titleRow.appendChild(titleSub);
    box.appendChild(titleRow);

    var meta = document.createElement("div");
    meta.style.cssText =
      "display:flex;flex-direction:column;gap:6px;padding:10px 12px;" +
      "background:#f8fafc;border:1px solid #e8ecf4;border-radius:8px;font-size:12px;color:#334155;";
    var metaCount = document.createElement("div");
    metaCount.style.cssText = "font-weight:800;color:#0f172a;font-size:13px;";
    metaCount.textContent = "件数取得中…";
    meta.appendChild(metaCount);
    var metaCond = document.createElement("div");
    metaCond.style.cssText =
      "display:flex;flex-wrap:wrap;gap:6px 10px;line-height:1.4;color:#475569;";
    filterDetailLines(st).forEach(function (line) {
      var chip = document.createElement("span");
      chip.textContent = line;
      chip.style.cssText =
        "display:inline-block;padding:3px 8px;border-radius:999px;" +
        "background:#fff;border:1px solid #e2e8f0;font-size:11px;color:#475569;";
      metaCond.appendChild(chip);
    });
    meta.appendChild(metaCond);
    var metaHint = document.createElement("div");
    metaHint.style.cssText = "color:#94a3b8;font-size:11px;";
    metaHint.textContent =
      "いまの絞り込み条件で集計。拠点＝部署グループ／在籍数＝本務人数。";
    meta.appendChild(metaHint);
    box.appendChild(meta);

    var host = document.createElement("div");
    host.style.cssText =
      "overflow:auto;max-height:min(60vh,560px);border:1px solid #e2e8f0;" +
      "border-radius:10px;background:#fff;";
    host.textContent = "集計中…";
    box.appendChild(host);

    var toolbar = document.getElementById(WRAP_ID);
    var after = document.getElementById(REORDER_ID) || toolbar;
    if (after && after.parentNode === space) {
      if (after.nextSibling) space.insertBefore(box, after.nextSibling);
      else space.appendChild(box);
    } else {
      space.appendChild(box);
    }

    recordsPromise
      .then(function (recs) {
        var model = buildAggTableModel(recs);
        metaCount.textContent =
          activeConditionLine(st) +
          " ｜ 該当件数: " +
          recs.length +
          "件 ｜ 人数（本務） " +
          countPeople(recs) +
          "人 ｜ 総合計 " +
          model.grand;
        host.innerHTML = "";
        /* 列幅: 拠点 12em / 部署 22em / 在籍 5em */
        var AGG_W_HUB = "12em";
        var AGG_W_DEPT = "22em";
        var AGG_W_CNT = "5em";
        var table = document.createElement("table");
        table.style.cssText =
          "border-collapse:separate;border-spacing:0;" +
          "width:calc(" +
          AGG_W_HUB +
          " + " +
          AGG_W_DEPT +
          " + " +
          AGG_W_CNT +
          ");" +
          "max-width:100%;table-layout:fixed;font-size:13px;" +
          "font-variant-numeric:tabular-nums;";
        var thead = document.createElement("thead");
        var hr = document.createElement("tr");
        var heads = [
          { label: "拠点", w: AGG_W_HUB, align: "left" },
          { label: "部署", w: AGG_W_DEPT, align: "left" },
          { label: "在籍数", w: AGG_W_CNT, align: "right" },
        ];
        heads.forEach(function (h) {
          var th = document.createElement("th");
          th.textContent = h.label;
          th.style.cssText =
            "position:sticky;top:0;z-index:1;width:" +
            h.w +
            ";max-width:" +
            h.w +
            ";box-sizing:border-box;padding:10px 8px;font-size:14px;font-weight:800;" +
            "letter-spacing:0.04em;color:#5b21b6;background:#f5f3ff;" +
            "border-bottom:1.5px solid #c4b5fd;white-space:nowrap;text-align:" +
            h.align +
            ";";
          hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);
        var tbody = document.createElement("tbody");
        model.rows.forEach(function (row) {
          var tr = document.createElement("tr");
          var isHubStart = !row.isSubtotal && !!row.hub;
          [row.hub, row.dept, row.count].forEach(function (v, vi) {
            var td = document.createElement("td");
            var text = v === "" || v == null ? "" : String(v);
            td.textContent = text;
            if (vi === 1 && text) td.title = text;
            var colW = vi === 0 ? AGG_W_HUB : vi === 1 ? AGG_W_DEPT : AGG_W_CNT;
            var base =
              "width:" +
              colW +
              ";max-width:" +
              colW +
              ";box-sizing:border-box;padding:6px 8px;" +
              "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" +
              (vi === 2 ? "text-align:right;" : "text-align:left;");
            if (row.isSubtotal) {
              td.style.cssText =
                base +
                "border-top:1.5px solid #c4b5fd;border-bottom:1px solid #bbf7d0;" +
                "background:#f0fdf4;font-weight:800;color:#166534;" +
                (vi === 2 ? "font-size:14px;" : "");
            } else if (isHubStart) {
              td.style.cssText =
                base +
                "border-top:1px solid #e9e5ff;background:" +
                (vi === 0 ? "#faf8ff" : "#fff") +
                ";" +
                (vi === 0
                  ? "font-weight:800;color:#4c1d95;border-left:3px solid #a78bfa;"
                  : "border-left:none;color:#0f172a;") +
                (vi === 2 ? "font-weight:700;" : "");
            } else {
              td.style.cssText =
                base +
                "border-top:1px solid #f1f5f9;background:#fff;color:#334155;" +
                (vi === 0 ? "border-left:3px solid transparent;" : "") +
                (vi === 2 ? "font-weight:600;" : "");
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        var tfoot = document.createElement("tfoot");
        var fr = document.createElement("tr");
        var tdL = document.createElement("td");
        tdL.colSpan = 2;
        tdL.textContent = "総合計";
        tdL.style.cssText =
          "padding:8px;font-weight:800;letter-spacing:0.04em;" +
          "background:linear-gradient(90deg,#ede9fe,#ecfdf5);color:#1e1b4b;" +
          "border-top:2px solid #a78bfa;white-space:nowrap;";
        var tdC = document.createElement("td");
        tdC.textContent = String(model.grand);
        tdC.style.cssText =
          "padding:8px;text-align:right;font-weight:800;font-size:15px;" +
          "background:linear-gradient(90deg,#ede9fe,#ecfdf5);color:#14532d;" +
          "border-top:2px solid #a78bfa;white-space:nowrap;width:" +
          AGG_W_CNT +
          ";";
        fr.appendChild(tdL);
        fr.appendChild(tdC);
        tfoot.appendChild(fr);
        table.appendChild(tfoot);
        host.appendChild(table);
      })
      .catch(function (err) {
        console.warn("[jbis 776 agg]", err);
        metaCount.textContent = "件数の取得に失敗しました";
        metaCount.style.color = "#b91c1c";
        host.textContent = "集計の取得に失敗しました";
        host.style.color = "#b91c1c";
      });
  }

  function mountToolbar(space, st) {
    var old = document.getElementById(WRAP_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    closeOrgPopover();

    /* PC台帳（674）準拠の共通ボタン高さ */
    var BTN =
      "box-sizing:border-box;height:32px;padding:0 12px;border-radius:6px;" +
      "font-size:12px;font-weight:700;cursor:pointer;" +
      "display:inline-flex;align-items:center;justify-content:center;line-height:1;";
    var BTN_SEC = BTN + "border:1px solid #94a3b8;background:#fff;color:#0f172a;";
    var BTN_PRI = BTN + "border:none;background:#0f766e;color:#fff;";
    var BTN_SKY = BTN + "border:none;background:#0369a1;color:#fff;";
    var BTN_CLR =
      BTN +
      "border:2px solid #c2410c;background:#fff7ed;color:#9a3412;font-weight:800;" +
      "box-shadow:0 1px 0 rgba(194,65,12,.15);padding:0 14px;";

    var wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.style.cssText =
      "margin:0 0 10px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;" +
      "display:flex;flex-direction:column;gap:8px;box-sizing:border-box;";

    var chipRow = document.createElement("div");
    chipRow.style.cssText =
      "display:flex;flex-wrap:wrap;gap:8px;align-items:center;";

    function mkChip(text, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      b.setAttribute("aria-pressed", st.cat === value ? "true" : "false");
      var on = st.cat === value;
      b.style.cssText =
        "box-sizing:border-box;height:28px;padding:0 12px;border-radius:999px;" +
        "font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;" +
        "border:1px solid " +
        (on ? "#7c3aed" : "#94a3b8") +
        ";background:" +
        (on ? "#7c3aed" : "#fff") +
        ";color:" +
        (on ? "#fff" : "#0f172a") +
        ";";
      b.addEventListener("click", function () {
        st.cat = value;
        applyAndReload(st);
      });
      return b;
    }
    chipRow.appendChild(mkChip("正社員", "seishain"));
    chipRow.appendChild(mkChip("準社員", "junshain"));
    chipRow.appendChild(mkChip("すべて", "all"));
    wrap.appendChild(chipRow);

    var row = document.createElement("div");
    row.style.cssText =
      "display:flex;flex-wrap:wrap;gap:8px;align-items:center;";

    var kwInput = document.createElement("input");
    kwInput.type = "search";
    kwInput.placeholder = "氏名 / 部署 / メール / 社員番号";
    kwInput.value = st.kw || "";
    kwInput.style.cssText =
      "box-sizing:border-box;height:32px;min-width:220px;flex:1;max-width:420px;" +
      "padding:0 10px;border:1px solid #94a3b8;border-radius:6px;font-size:13px;background:#fff;";
    row.appendChild(kwInput);

    var btnGo = document.createElement("button");
    btnGo.type = "button";
    btnGo.textContent = "絞り込み";
    btnGo.style.cssText = BTN_PRI + "padding:0 14px;";
    function runSearch() {
      st.kw = kwInput.value;
      applyAndReload(st);
    }
    btnGo.addEventListener("click", runSearch);
    kwInput.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        runSearch();
      }
    });
    row.appendChild(btnGo);

    var btnOrg = document.createElement("button");
    btnOrg.type = "button";
    btnOrg.setAttribute("aria-label", "所属で絞り込み");
    btnOrg.setAttribute("aria-haspopup", "dialog");
    function syncOrgBtn() {
      var n = (st.depts ? st.depts.length : 0) + (st.groups ? st.groups.length : 0);
      btnOrg.textContent = n ? "所属（" + n + "）" : "所属";
      btnOrg.setAttribute("aria-pressed", n ? "true" : "false");
      btnOrg.style.background = n ? "#ede9fe" : "#fff";
      btnOrg.style.borderColor = n ? "#7c3aed" : "#94a3b8";
      btnOrg.style.color = n ? "#4c1d95" : "#0f172a";
    }
    btnOrg.style.cssText = BTN_SEC;
    syncOrgBtn();
    btnOrg.addEventListener("click", function () {
      if (document.getElementById(ORG_POP_ID)) {
        closeOrgPopover();
        return;
      }
      openOrgPopover(btnOrg, st, function () {
        syncOrgBtn();
        applyAndReload(st);
      });
    });
    row.appendChild(btnOrg);

    var btnReorder = document.createElement("button");
    btnReorder.type = "button";
    btnReorder.textContent = "並び替え";
    btnReorder.style.cssText = BTN_SEC;
    row.appendChild(btnReorder);

    var btnAgg = document.createElement("button");
    btnAgg.type = "button";
    btnAgg.textContent = "集計表";
    btnAgg.style.cssText = BTN_SEC;
    row.appendChild(btnAgg);

    var btnExcel = document.createElement("button");
    btnExcel.type = "button";
    btnExcel.textContent = "Excel";
    btnExcel.style.cssText = BTN_SKY;
    var btnPrint = document.createElement("button");
    btnPrint.type = "button";
    btnPrint.textContent = "印刷";
    btnPrint.style.cssText = BTN_PRI;
    var btnClr = document.createElement("button");
    btnClr.type = "button";
    btnClr.textContent = "条件クリア";
    btnClr.setAttribute("aria-label", "検索条件をすべてクリア");
    btnClr.style.cssText = BTN_CLR;
    btnClr.addEventListener("click", function () {
      applyAndReload(defaultState());
    });
    row.appendChild(btnExcel);
    row.appendChild(btnPrint);
    row.appendChild(btnClr);

    var buildEl = document.createElement("span");
    buildEl.style.cssText =
      "margin-left:auto;color:#94a3b8;font-size:11px;align-self:center;";
    buildEl.textContent = BUILD;
    row.appendChild(buildEl);
    wrap.appendChild(row);

    /* PC台帳型: いまの条件 ＋ 該当件数 */
    var summaryRow = document.createElement("div");
    summaryRow.style.cssText =
      "display:flex;flex-wrap:wrap;gap:8px 12px;align-items:stretch;";
    var activeSummary = document.createElement("div");
    activeSummary.setAttribute("aria-live", "polite");
    activeSummary.style.cssText =
      "flex:1;min-width:220px;margin:0;padding:10px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;" +
      "font-size:13px;font-weight:700;color:#0f172a;line-height:1.5;";
    activeSummary.textContent = activeConditionLine(st);
    var matchCountEl = document.createElement("div");
    matchCountEl.setAttribute("aria-live", "polite");
    matchCountEl.style.cssText =
      "flex:0 0 auto;margin:0;padding:10px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;" +
      "font-size:14px;font-weight:800;color:#0f172a;line-height:1.5;white-space:nowrap;";
    matchCountEl.textContent = "該当件数: …";
    summaryRow.appendChild(activeSummary);
    summaryRow.appendChild(matchCountEl);
    wrap.appendChild(summaryRow);

    var sub = document.createElement("div");
    sub.style.cssText =
      "display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:12px;color:#334155;";
    var peopleEl = document.createElement("span");
    peopleEl.style.cssText = "font-weight:700;color:#475569;";
    peopleEl.textContent = "人数（本務）…";
    var conf = document.createElement("span");
    conf.style.cssText = "color:#991b1b;font-size:11px;";
    conf.textContent = "【機密】Excel・印刷は社内管理目的";
    sub.appendChild(peopleEl);
    sub.appendChild(conf);
    wrap.appendChild(sub);

    if (space.firstChild) space.insertBefore(wrap, space.firstChild);
    else space.appendChild(wrap);

    var uiOpen = loadUiOpen();
    var queryBase = buildQuery(st);
    var recordsP = fetchRecordsByQuery(queryBase);

    fetchMatchCount(queryBase)
      .then(function (n) {
        matchCountEl.textContent = "該当件数: " + n + "件";
      })
      .catch(function (err) {
        console.warn("[jbis 776 match count]", err);
        matchCountEl.textContent = "該当件数: —";
      });

    recordsP
      .then(function (recs) {
        peopleEl.textContent = "人数（本務） " + countPeople(recs) + "人";
        btnExcel.onclick = function () {
          exportCsv(recs);
        };
        btnPrint.onclick = function () {
          printList(recs);
        };
      })
      .catch(function (err) {
        console.warn("[jbis 776 count]", err);
        peopleEl.textContent = "人数（本務） —";
        peopleEl.style.color = "#b91c1c";
      });

    btnReorder.addEventListener("click", function () {
      uiOpen.reorder = !uiOpen.reorder;
      saveUiOpen(uiOpen);
      var box = document.getElementById(REORDER_ID);
      if (box) box.style.display = uiOpen.reorder ? "flex" : "none";
      btnReorder.style.background = uiOpen.reorder ? "#fef3c7" : "#fff";
    });
    if (uiOpen.reorder) btnReorder.style.background = "#fef3c7";

    btnAgg.addEventListener("click", function () {
      uiOpen.agg = !uiOpen.agg;
      saveUiOpen(uiOpen);
      var box = document.getElementById(AGG_ID);
      if (box) box.style.display = uiOpen.agg ? "flex" : "none";
      btnAgg.style.background = uiOpen.agg ? "#e0f2fe" : "#fff";
    });
    if (uiOpen.agg) btnAgg.style.background = "#e0f2fe";

    return { btnReorder: btnReorder, btnAgg: btnAgg, uiOpen: uiOpen, recordsP: recordsP };
  }

  function mountReorder(space, st, uiOpen) {
    var old = document.getElementById(REORDER_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var box = document.createElement("div");
    box.id = REORDER_ID;
    box.style.cssText =
      "margin:0 0 12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;" +
      "flex-direction:column;gap:8px;box-sizing:border-box;" +
      (uiOpen && uiOpen.reorder ? "display:flex;" : "display:none;");

    var title = document.createElement("div");
    title.style.cssText = "font-weight:700;color:#0f172a;font-size:13px;";
    title.textContent = "並び替え（名前検索 → 基準の上／下）";
    box.appendChild(title);

    function mkRow(labelText) {
      var row = document.createElement("div");
      row.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:6px;";
      var lab = document.createElement("span");
      lab.style.cssText = "min-width:4.5em;font-size:12px;color:#475569;font-weight:600;";
      lab.textContent = labelText;
      row.appendChild(lab);
      var input = document.createElement("input");
      input.type = "search";
      input.placeholder = "氏名の一部";
      input.style.cssText =
        "width:140px;padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;";
      row.appendChild(input);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "検索";
      btn.style.cssText =
        "padding:5px 12px;font-size:12px;border:1px solid #94a3b8;border-radius:6px;background:#f1f5f9;cursor:pointer;";
      row.appendChild(btn);
      var sel = document.createElement("select");
      sel.style.cssText =
        "min-width:280px;max-width:100%;flex:1;padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;";
      fillSelect(sel, [], "未検索");
      row.appendChild(sel);
      return { row: row, input: input, btn: btn, sel: sel };
    }

    var mover = mkRow("動かす人");
    var anchor = mkRow("基準の人");
    box.appendChild(mover.row);
    box.appendChild(anchor.row);

    var actions = document.createElement("div");
    actions.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;align-items:center;";
    var status = document.createElement("span");
    status.style.cssText = "font-size:12px;color:#64748b;";
    status.textContent = "必要なときだけ開いて使います";

    function mkAction(text, place) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      b.style.cssText =
        "padding:7px 14px;font-size:13px;border:1px solid #0f766e;border-radius:6px;background:#0f766e;color:#fff;cursor:pointer;font-weight:600;";
      b.addEventListener("click", function () {
        runPlace(place);
      });
      return b;
    }
    var btnAbove = mkAction("基準の上に置く", "above");
    var btnBelow = mkAction("基準の下に置く", "below");
    actions.appendChild(btnAbove);
    actions.appendChild(btnBelow);
    actions.appendChild(status);
    box.appendChild(actions);

    function wireSearch(ui) {
      function run() {
        status.textContent = "検索中…";
        status.style.color = "#64748b";
        searchByName(ui.input.value)
          .then(function (recs) {
            fillSelect(ui.sel, recs, recs.length ? "候補から選択" : "ヒットなし");
            status.textContent = recs.length ? "候補 " + recs.length + " 件" : "ヒットなし";
          })
          .catch(function () {
            status.textContent = "検索失敗";
            status.style.color = "#b91c1c";
          });
      }
      ui.btn.addEventListener("click", run);
      ui.input.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          run();
        }
      });
    }
    wireSearch(mover);
    wireSearch(anchor);

    function selectedId(sel) {
      var opt = sel.options[sel.selectedIndex];
      return opt && opt.value ? opt.value : "";
    }

    function runPlace(place) {
      var m = selectedId(mover.sel);
      var a = selectedId(anchor.sel);
      if (!m || !a || m === a) {
        status.textContent = "動かす人・基準の人を別々に選んでください";
        status.style.color = "#b91c1c";
        return;
      }
      status.textContent = "更新中…";
      status.style.color = "#64748b";
      btnAbove.disabled = true;
      btnBelow.disabled = true;
      placeMoverRelative(m, a, place)
        .then(function (res) {
          status.textContent = "完了（順 " + res.at + "）。再読込…";
          status.style.color = "#047857";
          setTimeout(function () {
            navigate(buildQuery(st));
          }, 400);
        })
        .catch(function (err) {
          console.warn("[jbis 776 reorder]", err);
          status.textContent = "並び替え失敗（権限を確認）";
          status.style.color = "#b91c1c";
          btnAbove.disabled = false;
          btnBelow.disabled = false;
        });
    }

    var toolbar = document.getElementById(WRAP_ID);
    if (toolbar && toolbar.parentNode === space) {
      if (toolbar.nextSibling) space.insertBefore(box, toolbar.nextSibling);
      else space.appendChild(box);
    } else {
      space.appendChild(box);
    }
  }

  kintone.events.on("app.record.index.show", function (event) {
    try {
      var space = getHeaderSpace();
      if (!space) return event;
      var st = loadState();
      var wantQ = buildQuery(st);
      var curQ = "";
      try {
        curQ = new URL(window.location.href).searchParams.get("query") || "";
      } catch (eUrl) {
        curQ = "";
      }
      var needNav =
        String(curQ).replace(/\s+/g, " ").trim() !==
        String(wantQ).replace(/\s+/g, " ").trim();
      if (
        needNav &&
        (st.cat !== "all" || st.kw || (st.depts && st.depts.length) || (st.groups && st.groups.length))
      ) {
        navigate(wantQ);
        return event;
      }
      var tb = mountToolbar(space, st);
      mountReorder(space, st, tb.uiOpen);
      mountAggPanel(space, st, tb.uiOpen, tb.recordsP);
      applyIndexDeptSeparators(event.records);
      setTimeout(function () {
        applyIndexDeptSeparators(event.records);
      }, 0);
      setTimeout(function () {
        applyIndexDeptSeparators(event.records);
      }, 300);
    } catch (e) {
      console.warn("[jbis 776 index]", e);
    }
    return event;
  });
})();
