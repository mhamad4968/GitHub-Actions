(function () {
  "use strict";

  /**
   * 776 社員名簿
   * BUILD: 2026-08-21-776-phase1-filter-export（キーワード・所属/G複数・件数・Excel/印刷）
   * BUILD: 2026-08-21-776-list-sort-int-1n
   * BUILD: 2026-08-21-776-reorder-by-name
   */
  var BUILD = "2026-08-21-776-phase1-filter-export";
  var WRAP_ID = "jbis-776-index-toolbar";
  var REORDER_ID = "jbis-776-index-reorder";
  var STORAGE_KEY = "jbis776-index-state-v1";
  var CAT_SEISHAIN = "正社員";
  var CAT_JUNSHAIN = "準社員";
  var APP_ID = null;

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
    var rowsHtml = records
      .map(function (r) {
        return (
          "<tr>" +
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
        "th,td{border:1px solid #333;padding:4px 6px;}" +
        "th{background:#f1f5f9;}" +
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
        "<script>window.onload=function(){window.print();}<\/script>" +
        "</body></html>",
    );
    w.document.close();
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

  function mountToolbar(space, st) {
    var old = document.getElementById(WRAP_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.style.cssText =
      "margin:0 0 12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;" +
      "display:flex;flex-direction:column;gap:10px;box-sizing:border-box;";

    // row1: cat chips
    var row1 = document.createElement("div");
    row1.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:8px;";
    var lab1 = document.createElement("span");
    lab1.style.cssText = "font-weight:700;color:#0f172a;";
    lab1.textContent = "雇用区分:";
    row1.appendChild(lab1);

    function mkChip(text, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      b.setAttribute("data-776-cat", value);
      var on = st.cat === value;
      b.style.cssText =
        "padding:6px 14px;font-size:13px;border:1px solid " +
        (on ? "#7c3aed" : "#cbd5e1") +
        ";border-radius:999px;background:" +
        (on ? "#7c3aed" : "#fff") +
        ";color:" +
        (on ? "#fff" : "#334155") +
        ";cursor:pointer;font-weight:" +
        (on ? "700" : "500") +
        ";";
      b.addEventListener("click", function () {
        st.cat = value;
        applyAndReload(st);
      });
      return b;
    }
    row1.appendChild(mkChip("正社員", "seishain"));
    row1.appendChild(mkChip("準社員", "junshain"));
    row1.appendChild(mkChip("すべて", "all"));
    var buildEl = document.createElement("span");
    buildEl.style.cssText = "margin-left:auto;color:#94a3b8;font-size:11px;";
    buildEl.textContent = BUILD;
    row1.appendChild(buildEl);
    wrap.appendChild(row1);

    // row2: keyword
    var row2 = document.createElement("div");
    row2.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:8px;";
    var lab2 = document.createElement("span");
    lab2.style.cssText = "font-weight:700;min-width:5em;font-size:13px;";
    lab2.textContent = "キーワード:";
    row2.appendChild(lab2);
    var kwInput = document.createElement("input");
    kwInput.type = "search";
    kwInput.placeholder = "氏名・部署・メール・社員番号";
    kwInput.value = st.kw || "";
    kwInput.style.cssText =
      "flex:1;min-width:200px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;";
    row2.appendChild(kwInput);
    var kwBtn = document.createElement("button");
    kwBtn.type = "button";
    kwBtn.textContent = "検索";
    kwBtn.style.cssText =
      "padding:6px 14px;border:1px solid #0f766e;border-radius:6px;background:#0f766e;color:#fff;cursor:pointer;font-weight:600;";
    function runKw() {
      st.kw = kwInput.value;
      applyAndReload(st);
    }
    kwBtn.addEventListener("click", runKw);
    kwInput.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        runKw();
      }
    });
    row2.appendChild(kwBtn);
    wrap.appendChild(row2);

    // row3: multi selects
    var row3 = document.createElement("div");
    row3.style.cssText =
      "display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;";

    function mkMulti(label, options, selected, onChange) {
      var box = document.createElement("div");
      box.style.cssText = "flex:1;min-width:220px;";
      var t = document.createElement("div");
      t.style.cssText = "font-weight:700;font-size:13px;margin-bottom:4px;";
      t.textContent = label;
      box.appendChild(t);
      var sel = document.createElement("select");
      sel.multiple = true;
      sel.size = Math.min(8, Math.max(4, options.length));
      sel.style.cssText =
        "width:100%;padding:4px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;";
      var selSet = {};
      for (var i = 0; i < selected.length; i++) selSet[selected[i]] = true;
      for (var j = 0; j < options.length; j++) {
        var opt = document.createElement("option");
        opt.value = options[j];
        opt.textContent = options[j];
        if (selSet[options[j]]) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener("change", function () {
        var vals = [];
        for (var k = 0; k < sel.options.length; k++) {
          if (sel.options[k].selected) vals.push(sel.options[k].value);
        }
        onChange(vals);
      });
      box.appendChild(sel);
      var hint = document.createElement("div");
      hint.style.cssText = "font-size:11px;color:#64748b;margin-top:2px;";
      hint.textContent = "Ctrl/⌘で複数選択";
      box.appendChild(hint);
      return box;
    }

    var deptOpts = DEPT_MASTER_680.map(function (r) {
      return r.dept_name;
    });
    row3.appendChild(
      mkMulti("所属（部署名）", deptOpts, st.depts, function (vals) {
        st.depts = vals;
      }),
    );
    row3.appendChild(
      mkMulti("部署グループ", uniqueGroups(), st.groups, function (vals) {
        st.groups = vals;
      }),
    );
    var applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.textContent = "所属・グループを適用";
    applyBtn.style.cssText =
      "align-self:flex-end;padding:8px 14px;border:1px solid #334155;border-radius:6px;background:#334155;color:#fff;cursor:pointer;font-weight:600;";
    applyBtn.addEventListener("click", function () {
      applyAndReload(st);
    });
    row3.appendChild(applyBtn);
    wrap.appendChild(row3);

    // row4: counts + export
    var row4 = document.createElement("div");
    row4.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:10px;";
    var countEl = document.createElement("span");
    countEl.style.cssText = "font-size:13px;color:#0f172a;font-weight:600;";
    countEl.textContent = "件数を集計中…";
    row4.appendChild(countEl);

    var btnExcel = document.createElement("button");
    btnExcel.type = "button";
    btnExcel.textContent = "Excel出力";
    btnExcel.style.cssText =
      "padding:6px 12px;border:1px solid #0369a1;border-radius:6px;background:#0369a1;color:#fff;cursor:pointer;font-weight:600;";
    var btnPrint = document.createElement("button");
    btnPrint.type = "button";
    btnPrint.textContent = "印刷";
    btnPrint.style.cssText =
      "padding:6px 12px;border:1px solid #0f766e;border-radius:6px;background:#0f766e;color:#fff;cursor:pointer;font-weight:600;";
    var btnClear = document.createElement("button");
    btnClear.type = "button";
    btnClear.textContent = "条件クリア";
    btnClear.style.cssText =
      "padding:6px 12px;border:1px solid #94a3b8;border-radius:6px;background:#fff;cursor:pointer;";
    btnClear.addEventListener("click", function () {
      applyAndReload(defaultState());
    });
    row4.appendChild(btnExcel);
    row4.appendChild(btnPrint);
    row4.appendChild(btnClear);
    wrap.appendChild(row4);

    var conf = document.createElement("div");
    conf.style.cssText = "font-size:11px;color:#991b1b;";
    conf.textContent =
      "【機密】Excel・印刷は社内管理目的です。取扱い・廃棄に注意してください。";
    wrap.appendChild(conf);

    if (space.firstChild) space.insertBefore(wrap, space.firstChild);
    else space.appendChild(wrap);

    var q = buildQuery(st);
    // strip trailing order for fetch helper that appends limit — buildQuery includes order
    fetchRecordsByQuery(q)
      .then(function (recs) {
        var rows = recs.length;
        var people = countPeople(recs);
        countEl.textContent = "行数 " + rows + " ／ 人数（本務） " + people;
        btnExcel.onclick = function () {
          exportCsv(recs);
        };
        btnPrint.onclick = function () {
          printList(recs);
        };
      })
      .catch(function (err) {
        console.warn("[jbis 776 count]", err);
        countEl.textContent = "件数の取得に失敗しました";
        countEl.style.color = "#b91c1c";
      });
  }

  function mountReorder(space, st) {
    var old = document.getElementById(REORDER_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var box = document.createElement("div");
    box.id = REORDER_ID;
    box.style.cssText =
      "margin:0 0 12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;" +
      "display:flex;flex-direction:column;gap:8px;box-sizing:border-box;";

    var title = document.createElement("div");
    title.style.cssText = "font-weight:700;color:#0f172a;font-size:13px;";
    title.textContent = "並び替え（名前検索 → 基準の上／下・表示順は整数1〜）";
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
    var status = document.createElement("span");
    status.style.cssText = "font-size:12px;color:#64748b;";
    status.textContent = "兼務行の差し込み位置などに";
    actions.appendChild(status);
    box.appendChild(actions);

    function wireSearch(ui) {
      function run() {
        status.textContent = "検索中…";
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
      mountToolbar(space, st);
      mountReorder(space, st);
    } catch (e) {
      console.warn("[jbis 776 index]", e);
    }
    return event;
  });
})();
