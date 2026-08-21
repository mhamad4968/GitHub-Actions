(function () {
  "use strict";

  /**
   * 776 社員名簿
   * BUILD: 2026-08-21-776-index-employment-category（一覧: 正社員/準社員/すべて）
   */
  var BUILD = "2026-08-21-776-index-employment-category";
  var WRAP_ID = "jbis-776-index-cat-filter";
  var STORAGE_KEY = "jbis776-index-cat";
  var CAT_SEISHAIN = "正社員";
  var CAT_JUNSHAIN = "準社員";

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

  function buildQuery(cat) {
    if (cat === "seishain") {
      return 'employment_category in ("' + escapeForQuery(CAT_SEISHAIN) + '") order by employee_no asc, レコード番号 asc';
    }
    if (cat === "junshain") {
      return 'employment_category in ("' + escapeForQuery(CAT_JUNSHAIN) + '") order by employee_no asc, レコード番号 asc';
    }
    return "order by employee_no asc, レコード番号 asc";
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

  function mount() {
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
  }

  kintone.events.on("app.record.index.show", function (event) {
    try {
      mount();
    } catch (e) {
      console.warn("[jbis 776 cat filter]", e);
    }
    return event;
  });
})();
