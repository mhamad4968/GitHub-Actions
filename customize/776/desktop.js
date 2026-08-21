(function () {
  "use strict";

  /**
   * 776 社員名簿
   * BUILD: 2026-08-21-776-reorder-by-name（名前検索→基準の上/下へ list_sort）
   * BUILD: 2026-08-21-776-index-list-sort-view
   * BUILD: 2026-08-21-776-index-employment-category
   */
  var BUILD = "2026-08-21-776-reorder-by-name";
  var WRAP_ID = "jbis-776-index-cat-filter";
  var REORDER_ID = "jbis-776-index-reorder";
  var STORAGE_KEY = "jbis776-index-cat";
  var CAT_SEISHAIN = "正社員";
  var CAT_JUNSHAIN = "準社員";
  var APP_ID = null;

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

  function buildQuery(cat) {
    var order = "order by list_sort asc, レコード番号 asc";
    if (cat === "seishain") {
      return 'employment_category in ("' + escapeForQuery(CAT_SEISHAIN) + '") ' + order;
    }
    if (cat === "junshain") {
      return 'employment_category in ("' + escapeForQuery(CAT_JUNSHAIN) + '") ' + order;
    }
    return order;
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

  function applyChipStyles(container, value) {
    container.querySelectorAll("[data-776-cat-filter]").forEach(function (btn) {
      var on = btn.getAttribute("data-776-cat-filter") === value;
      btn.classList.toggle("active", on);
      btn.style.background = on ? "#7c3aed" : "#fff";
      btn.style.color = on ? "#fff" : "#334155";
      btn.style.borderColor = on ? "#7c3aed" : "#cbd5e1";
      btn.style.fontWeight = on ? "700" : "500";
    });
  }

  function detectCatFromQuery() {
    var cond = "";
    try {
      if (kintone.app && kintone.app.getQueryCondition) {
        cond = String(kintone.app.getQueryCondition() || "");
      }
    } catch (e) {
      /* query optional */
    }
    if (cond && /employment_category\s+in\s+\(\s*"正社員"\s*\)/i.test(cond)) {
      return "seishain";
    }
    if (cond && /employment_category\s+in\s+\(\s*"準社員"\s*\)/i.test(cond)) {
      return "junshain";
    }
    try {
      var s = sessionStorage.getItem(STORAGE_KEY);
      if (s === "seishain" || s === "junshain" || s === "all") {
        return s;
      }
    } catch (eSs) {
      /* noop */
    }
    return "all";
  }

  function formatListSortValue(n) {
    var x = Number(n);
    if (!isFinite(x)) return "999999";
    var rounded = Math.round(x * 1000) / 1000;
    if (Number.isInteger(rounded)) return String(rounded);
    return String(rounded);
  }

  function labelOfHit(r) {
    var name = (r.user_name && r.user_name.value) || "";
    var dept = (r.dept_name && r.dept_name.value) || "";
    var title = (r.job_title && r.job_title.value) || "";
    var role = (r.row_role && r.row_role.value) || "";
    var ls = (r.list_sort && r.list_sort.value) || "";
    return name + "／" + dept + "／" + title + "（" + role + "・順" + ls + "）";
  }

  function searchByName(name) {
    var q = String(name || "").trim();
    if (!q) {
      return Promise.resolve([]);
    }
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

  function fetchNeighbor(anchorSort, direction, excludeId) {
    var sortN = Number(anchorSort);
    if (!isFinite(sortN)) {
      return Promise.resolve(null);
    }
    var query;
    if (direction === "prev") {
      query =
        "list_sort < " +
        sortN +
        ' and $id != "' +
        escapeForQuery(String(excludeId)) +
        '" order by list_sort desc, レコード番号 desc limit 1';
    } else {
      query =
        "list_sort > " +
        sortN +
        ' and $id != "' +
        escapeForQuery(String(excludeId)) +
        '" order by list_sort asc, レコード番号 asc limit 1';
    }
    return kintone
      .api(kintone.api.url("/k/v1/records.json", true), "GET", {
        app: getAppId(),
        query: query,
        fields: ["$id", "list_sort"],
      })
      .then(function (resp) {
        var rows = resp.records || [];
        return rows.length ? rows[0] : null;
      });
  }

  function computeNewSort(anchorSort, place, moverId) {
    var t = Number(anchorSort);
    if (!isFinite(t)) {
      return Promise.reject(new Error("基準の表示順が不正です"));
    }
    if (place === "above") {
      return fetchNeighbor(t, "prev", moverId).then(function (prev) {
        if (!prev) {
          return t > 1 ? t - 0.5 : t / 2;
        }
        var p = Number(prev.list_sort.value);
        if (!isFinite(p)) return t - 0.5;
        return (p + t) / 2;
      });
    }
    return fetchNeighbor(t, "next", moverId).then(function (next) {
      if (!next) {
        return t + 1;
      }
      var n = Number(next.list_sort.value);
      if (!isFinite(n)) return t + 0.5;
      return (t + n) / 2;
    });
  }

  function putMover(moverId, newSort) {
    return kintone.api(kintone.api.url("/k/v1/record.json", true), "PUT", {
      app: getAppId(),
      id: moverId,
      record: {
        list_sort: { value: formatListSortValue(newSort) },
      },
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
      opt.setAttribute("data-list-sort", String((r.list_sort && r.list_sort.value) || ""));
      sel.appendChild(opt);
    }
  }

  function mountReorder(space) {
    var old = document.getElementById(REORDER_ID);
    if (old && old.parentNode) {
      old.parentNode.removeChild(old);
    }

    var box = document.createElement("div");
    box.id = REORDER_ID;
    box.style.cssText =
      "margin:0 0 12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;" +
      "display:flex;flex-direction:column;gap:8px;box-sizing:border-box;";

    var title = document.createElement("div");
    title.style.cssText = "font-weight:700;color:#0f172a;font-size:13px;";
    title.textContent = "並び替え（名前検索 → 基準の上／下）";
    box.appendChild(title);

    function mkRow(labelText) {
      var row = document.createElement("div");
      row.style.cssText =
        "display:flex;flex-wrap:wrap;align-items:center;gap:6px;";
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
      b.setAttribute("data-place", place);
      b.style.cssText =
        "padding:7px 14px;font-size:13px;border:1px solid #0f766e;border-radius:6px;background:#0f766e;color:#fff;cursor:pointer;font-weight:600;";
      return b;
    }
    var btnAbove = mkAction("基準の上に置く", "above");
    var btnBelow = mkAction("基準の下に置く", "below");
    actions.appendChild(btnAbove);
    actions.appendChild(btnBelow);

    var status = document.createElement("span");
    status.style.cssText = "font-size:12px;color:#64748b;";
    status.textContent = "兼務行の差し込み位置などに使えます";
    actions.appendChild(status);
    box.appendChild(actions);

    function wireSearch(ui) {
      function run() {
        status.textContent = "検索中…";
        status.style.color = "#64748b";
        searchByName(ui.input.value)
          .then(function (recs) {
            fillSelect(
              ui.sel,
              recs,
              recs.length ? "候補 " + recs.length + " 件から選択" : "ヒットなし",
            );
            status.textContent = recs.length
              ? "候補 " + recs.length + " 件"
              : "ヒットなし（スペース有無も試してください）";
          })
          .catch(function (err) {
            console.warn("[jbis 776 reorder search]", err);
            status.textContent = "検索に失敗しました";
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

    function selectedOption(sel) {
      var opt = sel.options[sel.selectedIndex];
      if (!opt || !opt.value) return null;
      return {
        id: opt.value,
        list_sort: opt.getAttribute("data-list-sort") || "",
        label: opt.textContent,
      };
    }

    function runPlace(place) {
      var m = selectedOption(mover.sel);
      var a = selectedOption(anchor.sel);
      if (!m) {
        status.textContent = "動かす人を選択してください";
        status.style.color = "#b91c1c";
        return;
      }
      if (!a) {
        status.textContent = "基準の人を選択してください";
        status.style.color = "#b91c1c";
        return;
      }
      if (m.id === a.id) {
        status.textContent = "動かす人と基準の人は別にしてください";
        status.style.color = "#b91c1c";
        return;
      }
      status.textContent = "更新中…";
      status.style.color = "#64748b";
      btnAbove.disabled = true;
      btnBelow.disabled = true;
      computeNewSort(a.list_sort, place, m.id)
        .then(function (newSort) {
          return putMover(m.id, newSort).then(function () {
            return newSort;
          });
        })
        .then(function (newSort) {
          status.textContent =
            "完了（表示順 " + formatListSortValue(newSort) + "）。再読込します…";
          status.style.color = "#047857";
          var cat = detectCatFromQuery();
          setTimeout(function () {
            navigate(buildQuery(cat));
          }, 400);
        })
        .catch(function (err) {
          console.warn("[jbis 776 reorder]", err);
          status.textContent =
            "並び替えに失敗しました（編集権限を確認してください）";
          status.style.color = "#b91c1c";
          btnAbove.disabled = false;
          btnBelow.disabled = false;
        });
    }

    btnAbove.addEventListener("click", function () {
      runPlace("above");
    });
    btnBelow.addEventListener("click", function () {
      runPlace("below");
    });

    var catWrap = document.getElementById(WRAP_ID);
    if (catWrap && catWrap.parentNode === space) {
      if (catWrap.nextSibling) {
        space.insertBefore(box, catWrap.nextSibling);
      } else {
        space.appendChild(box);
      }
    } else if (space.firstChild) {
      space.insertBefore(box, space.firstChild);
    } else {
      space.appendChild(box);
    }
  }

  function mountCatFilter() {
    var space = getHeaderSpace();
    if (!space) {
      return;
    }
    var old = document.getElementById(WRAP_ID);
    if (old && old.parentNode) {
      old.parentNode.removeChild(old);
    }

    var wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.style.cssText =
      "margin:0 0 12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;" +
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px;box-sizing:border-box;";

    var label = document.createElement("span");
    label.style.cssText = "font-weight:700;color:#0f172a;white-space:nowrap;";
    label.textContent = "雇用区分:";
    wrap.appendChild(label);

    var state = detectCatFromQuery();

    function mkBtn(text, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      b.setAttribute("data-776-cat-filter", value);
      b.style.cssText =
        "padding:6px 14px;font-size:13px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;color:#334155;";
      b.addEventListener("click", function () {
        state = value;
        applyChipStyles(wrap, value);
        try {
          sessionStorage.setItem(STORAGE_KEY, value);
        } catch (eSs) {
          /* noop */
        }
        navigate(buildQuery(value));
      });
      return b;
    }

    wrap.appendChild(mkBtn("正社員", "seishain"));
    wrap.appendChild(mkBtn("準社員", "junshain"));
    wrap.appendChild(mkBtn("すべて", "all"));
    applyChipStyles(wrap, state);

    var hint = document.createElement("span");
    hint.style.cssText = "color:#64748b;font-size:12px;";
    hint.textContent = "（名簿は正社員・準社員。その他は595のみ）";
    wrap.appendChild(hint);

    var buildEl = document.createElement("span");
    buildEl.style.cssText = "margin-left:auto;color:#94a3b8;font-size:11px;";
    buildEl.textContent = BUILD;
    wrap.appendChild(buildEl);

    if (space.firstChild) {
      space.insertBefore(wrap, space.firstChild);
    } else {
      space.appendChild(wrap);
    }

    mountReorder(space);
  }

  kintone.events.on("app.record.index.show", function (event) {
    try {
      mountCatFilter();
    } catch (e) {
      console.warn("[jbis 776 index]", e);
    }
    return event;
  });
})();
