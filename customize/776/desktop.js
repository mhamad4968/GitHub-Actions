(function () {
  "use strict";

  /**
   * 776 社員名簿
 * BUILD: 2026-08-22-776-reorder-range-put（並び替え: 変化範囲だけ list_sort PUT）
 * BUILD: 2026-08-22-776-agg-kanetsu-seko-under-koji（集計: 関越支店施工部を工事部の直下へ）
 * BUILD: 2026-08-22-776-e1-title-filter（役職チップ: すべて／役職者／一般・Excel/集計も同条件）
 * BUILD: 2026-08-22-776-p1-title-over-kenmu（兼務行でも役職色が勝つ・列ずれ補正）
 * BUILD: 2026-08-22-776-p1-title-rank-fix（常務・監査役を役職者に・役職列ヘッダ照合で部長漏れ修正）
 * BUILD: 2026-08-22-776-p1-read-title-rank（P1: 集計二重表示整理・兼務色トーン・役職ランク強調）
 * BUILD: 2026-08-22-776-p0-toolbar-pullup2（①上余白をさらに詰める・帯間隔縮小）
 * BUILD: 2026-08-22-776-p0-toolbar-pullup（①上余白を負マージン＋親連鎖で確実に詰める）
 * BUILD: 2026-08-22-776-export-section-col（Excel/印刷に部／室列）
 * BUILD: 2026-08-22-776-list-sort-label-hyojijun（一覧並び→表示順・条件文言）
 * BUILD: 2026-08-22-776-p0-toolbar-tight-top（①絞り込み上の余白を詰める）
 * BUILD: 2026-08-22-776-p0-toolbar-frames（P0: 絞込／状況／操作を枠分け・人数を状況帯へ）
 * BUILD: 2026-08-22-776-agg-total-col（集計表に本務＋兼務の合計列）
 * BUILD: 2026-08-22-776-fix-query-and（絞り込み＋$id in の and 欠落で GAIA_IL08 を修正）
 * BUILD: 2026-08-22-776-agg-fix-tekko-dup（鉄構支店二重表示を解消）
 * BUILD: 2026-08-22-776-agg-order-shinkansen（新幹線準備室をメンテ技術部下へ）
 * BUILD: 2026-08-22-776-agg-honmu-kenmu（集計表を本務／兼務2列＋部署順）
 * BUILD: 2026-08-22-776-agg-excel-labels（集計表部署をExcel表記寄せ・reform分割）
 * BUILD: 2026-08-22-776-pager-dock（一覧下＋画面下追従のページ送り）
 * BUILD: 2026-08-22-776-pager-list-sort（ページ送りを list_sort 範囲へ・query 不一致ループ回避）
 * BUILD: 2026-08-22-776-sort-after-save（並び適用を保存成功後へ・revision衝突回避）
 * BUILD: 2026-08-22-776-section-assign（部／室フィールド＋部追加モーダル＋保存時並び）
 * BUILD: 2026-08-22-776-pager-id-slice（ページ送りを$id分割方式に修正）
 * BUILD: 2026-08-22-776-pager-thin-border（名簿ページ送り＋左帯1px）
 * BUILD: 2026-08-22-776-kenmu-color-v4（兼務左帯を細線化）
 * BUILD: 2026-08-22-776-kenmu-color-v3（兼務色を全行同一・部署ストライプ非適用）
 * BUILD: 2026-08-22-776-kenmu-color-v2（兼務行: 背景強化＋左帯＋文字色）
 * BUILD: 2026-08-22-776-kenmu-color-reorder-scroll（兼務行色／部署末尾／再読込スクロール）
 * BUILD: 2026-08-21-776-reform-dept-order（reform所属順: 統括→札幌→首都圏）
 * BUILD: 2026-08-21-776-agg-th-larger（集計表ヘッダ文字を大きく）
 * BUILD: 2026-08-21-776-agg-col-mid2（集計表の列幅をさらに少し広く）
 * BUILD: 2026-08-21-776-agg-col-mid（集計表の列幅を中庸に）
 * BUILD: 2026-08-21-776-agg-col-fixed（集計表の列幅を固定・部署を抑制）
   */
  var BUILD = "2026-08-22-776-reorder-range-put";
  var ID_CACHE_KEY = "jbis776-idcache-v3";
  var WRAP_ID = "jbis-776-index-toolbar";
  var REORDER_ID = "jbis-776-index-reorder";
  var AGG_ID = "jbis-776-index-agg";
  var ORG_POP_ID = "jbis-776-org-popover";
  var PAGER_ID = "jbis-776-roster-pager";
  var PAGER_BOTTOM_ID = "jbis-776-roster-pager-bottom";
  var PAGER_FIXED_ID = "jbis-776-roster-pager-fixed";
  var PAGER_PAD_STYLE_ID = "jbis-776-pager-pad-style";
  var SECTION_MODAL_ID = "jbis-776-section-modal";
  var SORT_MODAL_ID = "jbis-776-sort-insert-modal";
  var FC_SECTION = "section_name";
  var SECTION_OPTIONS = [
    "管理部",
    "施工部",
    "工事部",
    "安全部",
    "システム推進室",
    "橋りょうリペア部",
    "施工支援部",
    "工事支援部",
  ];
  var DEPT_SEP_STYLE_ID = "jbis-776-dept-sep-style";
  var STORAGE_KEY = "jbis776-index-state-v1";
  var UI_OPEN_KEY = "jbis776-ui-open-v1";
  var SCROLL_AFTER_REORDER_KEY = "jbis776-scroll-after-reorder-v1";
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

  /** BEGIN DEPT_MASTER_680 — synced from scripts/data/employee-roster-776-dept-master.json */
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
    { dept_name: "リフォーム事業統括部", group_name: "reform" },
    { dept_name: "札幌支店", group_name: "reform" },
    { dept_name: "首都圏支店", group_name: "reform" },
    { dept_name: "鉄構支店", group_name: "tekko" },
    { dept_name: "湾岸工事所", group_name: "wangan" },
    { dept_name: "ブリッジニアプラス", group_name: "bnp" },
    { dept_name: "鎌ヶ谷作業所", group_name: "bnp" },
  ];
  /** END DEPT_MASTER_680 */

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
    { code: "section_name", label: "部／室" },
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
    return {
      cat: "all",
      titleRank: "all",
      kw: "",
      depts: [],
      groups: [],
      page: 1,
      pageSize: 40,
    };
  }

  function loadState() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var o = JSON.parse(raw);
      var pageSize = Number(o.pageSize);
      if (!isFinite(pageSize) || pageSize < 10) pageSize = 40;
      if (pageSize > 100) pageSize = 100;
      var page = Number(o.page);
      if (!isFinite(page) || page < 1) page = 1;
      return {
        cat: o.cat === "seishain" || o.cat === "junshain" || o.cat === "all" ? o.cat : "all",
        titleRank:
          o.titleRank === "lead" || o.titleRank === "member" ? o.titleRank : "all",
        kw: String(o.kw || ""),
        depts: Array.isArray(o.depts) ? o.depts.map(String) : [],
        groups: Array.isArray(o.groups) ? o.groups.map(String) : [],
        page: page,
        pageSize: pageSize,
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

  function filterFingerprint(st) {
    return JSON.stringify({
      cat: st.cat || "all",
      titleRank: st.titleRank || "all",
      kw: String(st.kw || "").trim(),
      depts: (st.depts || []).slice().sort(),
      groups: (st.groups || []).slice().sort(),
    });
  }

  function buildWhere(st) {
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
    return parts.length ? parts.join(" and ") + " " : "";
  }

  function buildQuery(st) {
    return buildWhere(st) + "order by list_sort asc, レコード番号 asc";
  }

  function normalizeQuery(q) {
    return String(q || "")
      .replace(/\+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** order by の有無・空白差で navigate ループしないよう比較を緩める */
  function stripOrderBy(q) {
    return normalizeQuery(String(q || "").replace(/\s*order\s+by\s+.+$/i, ""));
  }

  function queriesEquivalent(a, b) {
    var na = normalizeQuery(a);
    var nb = normalizeQuery(b);
    if (na === nb) return true;
    if (stripOrderBy(a) === stripOrderBy(b)) return true;
    var idRe = /\$id\s+in\s*\(([^)]*)\)/i;
    var ma = String(a || "").match(idRe);
    var mb = String(b || "").match(idRe);
    if (ma && mb) {
      var fa = ma[1].replace(/[\s"]/g, "");
      var fb = mb[1].replace(/[\s"]/g, "");
      if (fa && fa === fb) return true;
    }
    var rangeRe = /list_sort\s*>=\s*"?(\d+)"?\s*and\s*list_sort\s*<=\s*"?(\d+)"?/i;
    var ra = String(a || "").match(rangeRe);
    var rb = String(b || "").match(rangeRe);
    if (ra && rb && ra[1] === rb[1] && ra[2] === rb[2]) {
      return stripOrderBy(a).replace(rangeRe, "") === stripOrderBy(b).replace(rangeRe, "");
    }
    return false;
  }

  function fetchFilteredIds(st) {
    var fp = filterFingerprint(st);
    try {
      var cached = JSON.parse(sessionStorage.getItem(ID_CACHE_KEY) || "null");
      if (cached && cached.fp === fp && cached.build === BUILD && Array.isArray(cached.ids)) {
        return Promise.resolve(cached.ids.map(String));
      }
    } catch (eCache) {
      /* noop */
    }
    try {
      sessionStorage.removeItem("jbis776-idcache-v1");
      sessionStorage.removeItem("jbis776-idcache-v2");
    } catch (eOld) {
      /* noop */
    }

    var app = getAppId();
    var all = [];
    var where = buildWhere(st);
    function page(offset) {
      return kintone
        .api(kintone.api.url("/k/v1/records.json", true), "GET", {
          app: app,
          query: where + "order by list_sort asc, レコード番号 asc limit 500 offset " + offset,
          fields: ["$id", "list_sort", "job_title"],
        })
        .then(function (resp) {
          var rows = resp.records || [];
          for (var i = 0; i < rows.length; i++) {
            all.push({
              id: String(rows[i].$id.value),
              sort: Number(rows[i].list_sort && rows[i].list_sort.value),
              title: rows[i].job_title && rows[i].job_title.value,
            });
          }
          if (rows.length < 500) return all;
          return page(offset + 500);
        });
    }
    return page(0).then(function (rows) {
      var filtered = rows;
      if (st.titleRank === "lead" || st.titleRank === "member") {
        filtered = rows.filter(function (r) {
          return titleRank776(r.title) === st.titleRank;
        });
      }
      var ids = filtered.map(function (r) {
        return r.id;
      });
      var sorts = filtered.map(function (r) {
        return r.sort;
      });
      try {
        sessionStorage.setItem(
          ID_CACHE_KEY,
          JSON.stringify({ fp: fp, build: BUILD, ids: ids, sorts: sorts, t: Date.now() }),
        );
      } catch (eSave) {
        /* noop */
      }
      return ids;
    });
  }

  function fetchFilteredSortMeta(st) {
    var fp = filterFingerprint(st);
    try {
      var cached = JSON.parse(sessionStorage.getItem(ID_CACHE_KEY) || "null");
      if (
        cached &&
        cached.fp === fp &&
        cached.build === BUILD &&
        Array.isArray(cached.ids) &&
        Array.isArray(cached.sorts) &&
        cached.sorts.length === cached.ids.length
      ) {
        return Promise.resolve({ ids: cached.ids.map(String), sorts: cached.sorts.map(Number) });
      }
    } catch (eCache) {
      /* noop */
    }
    return fetchFilteredIds(st).then(function (ids) {
      try {
        var cached2 = JSON.parse(sessionStorage.getItem(ID_CACHE_KEY) || "null");
        if (cached2 && Array.isArray(cached2.sorts) && cached2.sorts.length === ids.length) {
          return { ids: ids, sorts: cached2.sorts.map(Number) };
        }
      } catch (e2) {
        /* noop */
      }
      return { ids: ids, sorts: ids.map(function () {
        return NaN;
      }) };
    });
  }

  function buildPagedQueryFromIds(ids, page, pageSize, st, sorts) {
    var list = ids || [];
    var total = list.length;
    var ps = pageSize > 0 ? pageSize : 40;
    var maxPage = Math.max(1, Math.ceil(total / ps) || 1);
    var p = page > 0 ? page : 1;
    if (p > maxPage) p = maxPage;
    var start = (p - 1) * ps;
    var slice = list.slice(start, start + ps);
    var where = buildWhere(st || {});
    var rankActive =
      st && (st.titleRank === "lead" || st.titleRank === "member");
    var query;
    if (!slice.length) {
      // where は末尾スペースのみ（and 無し）→ $id 前に and 必須（欠落だと GAIA_IL08）
      query = where ? where + 'and $id = "0"' : '$id = "0"';
    } else if (!where && !rankActive) {
      // 絞り込みなし: list_sort 連続番号で範囲指定（URL短・一覧で安定）
      var sortSlice = (sorts || []).slice(start, start + ps).filter(function (n) {
        return isFinite(n);
      });
      var lo;
      var hi;
      if (sortSlice.length === slice.length) {
        lo = Math.min.apply(null, sortSlice);
        hi = Math.max.apply(null, sortSlice);
      } else {
        lo = start + 1;
        hi = start + slice.length;
      }
      query = "list_sort >= " + lo + " and list_sort <= " + hi;
    } else {
      // 絞り込みあり or 役職のみ: 該当 $id だけ（order by はビュー側 list_sort に任せる）
      var idClause =
        "$id in (" +
        slice
          .map(function (id) {
            return '"' + id + '"';
          })
          .join(",") +
        ")";
      query = where ? where + "and " + idClause : idClause;
    }
    return {
      query: query,
      page: p,
      maxPage: maxPage,
      total: total,
      from: slice.length ? start + 1 : 0,
      to: slice.length ? start + slice.length : 0,
      shown: slice.length,
    };
  }

  function goRosterPage(st, page) {
    var next = {
      cat: st.cat,
      titleRank: st.titleRank || "all",
      kw: st.kw,
      depts: st.depts,
      groups: st.groups,
      page: page > 0 ? page : 1,
      pageSize: st.pageSize || 40,
    };
    saveState(next);
    return fetchFilteredSortMeta(next).then(function (meta) {
      var built = buildPagedQueryFromIds(
        meta.ids,
        next.page,
        next.pageSize || 40,
        next,
        meta.sorts,
      );
      next.page = built.page;
      saveState(next);
      navigate(built.query);
      return built;
    });
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
    st.page = 1;
    try {
      sessionStorage.removeItem("jbis776-idcache-v1");
      sessionStorage.removeItem("jbis776-idcache-v2");
      sessionStorage.removeItem(ID_CACHE_KEY);
    } catch (e) {
      /* noop */
    }
    saveState(st);
    goRosterPage(st, 1).catch(function (err) {
      console.warn("[jbis 776 page]", err);
      navigate(buildQuery(st));
    });
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
            "section_name",
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
    /* 部署区切り＝薄線／交互＝ごく薄い緑／兼務＝薄いオレンジ左線（主張しすぎない） */
    style.textContent =
      ".jbis-776-dept-sep > td," +
      ".jbis-776-dept-sep > th{" +
      "border-top:1px solid #c4b5fd !important;}" +
      ".jbis-776-dept-alt > td," +
      ".jbis-776-dept-alt > th{" +
      "background-color:#f8faf8 !important;}" +
      ".jbis-776-kenmu > td," +
      ".jbis-776-kenmu > th," +
      ".jbis-776-kenmu.jbis-776-dept-alt > td," +
      ".jbis-776-kenmu.jbis-776-dept-alt > th{" +
      "background-color:#fff7ed !important;" +
      "color:#9a3412 !important;" +
      "box-shadow:inset 2px 0 0 #fb923c;}" +
      ".jbis-776-kenmu a," +
      ".jbis-776-kenmu a:link," +
      ".jbis-776-kenmu a:visited{" +
      "color:#9a3412 !important;}" +
      /* 役職ランク: 兼務オレンジより詳細度を上げて必ず勝たせる */
      "td.jbis-776-title-lead," +
      ".jbis-776-kenmu > td.jbis-776-title-lead," +
      ".jbis-776-kenmu.jbis-776-dept-alt > td.jbis-776-title-lead," +
      ".jbis-776-dept-alt > td.jbis-776-title-lead{" +
      "font-weight:800!important;color:#1e3a8a!important;" +
      "background-color:#eef2ff!important;}" +
      "td.jbis-776-title-member," +
      ".jbis-776-kenmu > td.jbis-776-title-member," +
      ".jbis-776-kenmu.jbis-776-dept-alt > td.jbis-776-title-member," +
      ".jbis-776-dept-alt > td.jbis-776-title-member{" +
      "font-weight:500!important;color:#64748b!important;" +
      "background-color:transparent!important;}" +
      ".jbis-776-scroll-flash > td," +
      ".jbis-776-scroll-flash > th{" +
      "outline:2px solid #ea580c !important;" +
      "outline-offset:-2px;" +
      "animation:jbis776Flash 1.6s ease-in-out 2;}" +
      "@keyframes jbis776Flash{0%,100%{background-color:inherit;}50%{background-color:#fed7aa !important;}}";
  }

  /** 役職チップ用: records 配列を titleRank776 で絞る（人数・Excel・印刷・集計と ID 経路で共用） */
  function filterRecordsByTitleRank776(recs, titleRank) {
    if (titleRank !== "lead" && titleRank !== "member") return recs || [];
    return (recs || []).filter(function (r) {
      var t = r && r.job_title && r.job_title.value;
      return titleRank776(t) === titleRank;
    });
  }

  /** 役職文字列 → lead（役職者） / member（部員等） / other */
  function titleRank776(title) {
    var t = String(title || "").trim();
    if (!t) return "other";
    // 役職者を先に判定（「○○部員」以外の部長・室長等を取りこぼさない）
    if (
      /社長|副社長|専務|常務|執行役員|取締役|監査役|相談役|理事|役員|顧問/.test(t) ||
      /支店長|副支店長|部長|副部長|室長|副室長|所長|副所長|統括|本部長|工事本部長/.test(t) ||
      /課長|主任|係長|マネージャー|次長/.test(t)
    ) {
      return "lead";
    }
    if (/部員|室員|所員|一般|スタッフ/.test(t)) return "member";
    return "other";
  }

  /** 一覧ヘッダから「役職」列の td インデックスを返す（見つからなければ -1） */
  function findJobTitleColIndex776(sampleTr) {
    var table =
      (sampleTr && sampleTr.closest && sampleTr.closest("table")) ||
      document.querySelector(
        ".recordlist-gaia, .gaia-argoui-app-index-table, .ocean-ui-app-index-table",
      );
    if (!table) return -1;
    var ths = table.querySelectorAll("thead th");
    if (!ths.length) ths = table.querySelectorAll("tr th");
    var idx = -1;
    for (var h = 0; h < ths.length; h++) {
      var lab = String(ths[h].textContent || "")
        .replace(/\s|\u3000/g, "")
        .trim();
      if (lab === "役職") {
        idx = h;
        break;
      }
    }
    if (idx < 0) return -1;
    // thead にチェック列が無く tbody 先頭がチェックのとき、列が1つずれる
    var tr = sampleTr;
    if (!tr) {
      var bodyRows = table.querySelectorAll("tbody tr");
      for (var r = 0; r < bodyRows.length; r++) {
        if (!bodyRows[r].querySelector("th")) {
          tr = bodyRows[r];
          break;
        }
      }
    }
    if (tr) {
      var firstTd = tr.querySelector("td");
      var firstTh = ths[0];
      var bodyHasCb =
        !!(firstTd && firstTd.querySelector('input[type="checkbox"]'));
      var headHasCb =
        !!(firstTh && firstTh.querySelector('input[type="checkbox"]'));
      if (bodyHasCb && !headHasCb) idx += 1;
    }
    return idx;
  }

  function applyTitleRankStyles(records) {
    ensureDeptSepStyle();
    var trs = listIndexRows();
    if (!trs || !trs.length || !records || !records.length) return;
    var byId = {};
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var id = r && r.$id && r.$id.value != null ? String(r.$id.value) : "";
      if (!id) continue;
      byId[id] = cell(r, "job_title");
    }
    var sampleTr = null;
    for (var s = 0; s < trs.length; s++) {
      if (!trs[s].querySelector("th")) {
        sampleTr = trs[s];
        break;
      }
    }
    var colIdx = findJobTitleColIndex776(sampleTr);
    var dataIdx = 0;
    for (var ti = 0; ti < trs.length; ti++) {
      var tr = trs[ti];
      if (tr.querySelector("th")) continue;
      var rid = tr.getAttribute("data-jbis-rid") || recordIdFromIndexTr(tr);
      if (!rid && dataIdx < records.length) {
        rid =
          records[dataIdx].$id && records[dataIdx].$id.value != null
            ? String(records[dataIdx].$id.value)
            : "";
      }
      var title =
        rid && byId[rid] != null
          ? byId[rid]
          : dataIdx < records.length
            ? cell(records[dataIdx], "job_title")
            : "";
      dataIdx += 1;
      var tds = tr.querySelectorAll("td");
      for (var c = 0; c < tds.length; c++) {
        tds[c].classList.remove("jbis-776-title-lead", "jbis-776-title-member");
      }
      var targetTd = colIdx >= 0 && colIdx < tds.length ? tds[colIdx] : null;
      // 列ずれ時の保険: レコードの役職文字と一致するセル
      if (!targetTd || (title && String(targetTd.textContent || "").replace(/\s|\u3000/g, "") !== String(title).replace(/\s|\u3000/g, ""))) {
        var titleNorm = String(title || "").replace(/\s|\u3000/g, "");
        if (titleNorm) {
          for (var c2 = 0; c2 < tds.length; c2++) {
            var tv = String(tds[c2].textContent || "")
              .replace(/\s|\u3000/g, "")
              .trim();
            if (tv === titleNorm) {
              targetTd = tds[c2];
              break;
            }
          }
        }
      }
      // それでも無ければセル自身の文言でランク判定
      if (!targetTd) {
        for (var c3 = 0; c3 < tds.length; c3++) {
          var rankCell = titleRank776(tds[c3].textContent);
          if (rankCell === "lead" || rankCell === "member") {
            // 氏名列を誤爆しないよう短い役職らしいセル優先
            var tlen = String(tds[c3].textContent || "").trim().length;
            if (tlen > 0 && tlen <= 12) {
              targetTd = tds[c3];
              title = tds[c3].textContent;
              break;
            }
          }
        }
      }
      if (!targetTd) continue;
      var rank = titleRank776(title || targetTd.textContent);
      if (rank === "lead") targetTd.classList.add("jbis-776-title-lead");
      else if (rank === "member") targetTd.classList.add("jbis-776-title-member");
    }
  }

  function listIndexRows() {
    var selectors = [
      ".recordlist-gaia tbody tr",
      ".gaia-argoui-app-index-table tbody tr",
      "table.recordlist-gaia tbody tr",
      ".ocean-ui-app-index-table tbody tr",
    ];
    for (var s = 0; s < selectors.length; s++) {
      var found = document.querySelectorAll(selectors[s]);
      if (found && found.length) return found;
    }
    return null;
  }

  function recordIdFromIndexTr(tr) {
    if (!tr) return "";
    var a = tr.querySelector('a[href*="record="]');
    if (!a) return "";
    var m = String(a.getAttribute("href") || "").match(/record=(\d+)/);
    return m ? m[1] : "";
  }

  function applyKenmuRowColors(records) {
    ensureDeptSepStyle();
    var trs = listIndexRows();
    if (!trs || !trs.length) return;
    var roleById = {};
    if (records && records.length) {
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        var id = r && r.$id && r.$id.value != null ? String(r.$id.value) : "";
        if (!id) continue;
        roleById[id] = cell(r, "row_role");
      }
    }
    var needFetch = [];
    var dataIdx = 0;
    for (var ti = 0; ti < trs.length; ti++) {
      var tr = trs[ti];
      if (tr.querySelector("th")) continue;
      var rid = recordIdFromIndexTr(tr);
      if (!rid && records && dataIdx < records.length) {
        rid =
          records[dataIdx].$id && records[dataIdx].$id.value != null
            ? String(records[dataIdx].$id.value)
            : "";
      }
      dataIdx += 1;
      if (!rid) continue;
      tr.setAttribute("data-jbis-rid", rid);
      if (roleById[rid] == null || roleById[rid] === "") {
        needFetch.push(rid);
      } else if (roleById[rid] === "兼務") {
        tr.classList.add("jbis-776-kenmu");
      } else {
        tr.classList.remove("jbis-776-kenmu");
      }
    }
    if (!needFetch.length) return;
    var uniq = [];
    var seen = {};
    for (var n = 0; n < needFetch.length; n++) {
      if (seen[needFetch[n]]) continue;
      seen[needFetch[n]] = true;
      uniq.push(needFetch[n]);
    }
    var chunks = [];
    for (var c = 0; c < uniq.length; c += 100) {
      chunks.push(uniq.slice(c, c + 100));
    }
    var chain = Promise.resolve({});
    chunks.forEach(function (ids) {
      chain = chain.then(function (acc) {
        var q =
          "$id in (" +
          ids
            .map(function (id) {
              return '"' + id + '"';
            })
            .join(",") +
          ") limit 100";
        return kintone
          .api(kintone.api.url("/k/v1/records.json", true), "GET", {
            app: getAppId(),
            query: q,
            fields: ["$id", "row_role"],
          })
          .then(function (resp) {
            var rows = resp.records || [];
            for (var i = 0; i < rows.length; i++) {
              acc[String(rows[i].$id.value)] = cell(rows[i], "row_role");
            }
            return acc;
          });
      });
    });
    chain
      .then(function (acc) {
        var trs2 = listIndexRows();
        if (!trs2) return;
        for (var i = 0; i < trs2.length; i++) {
          var tr2 = trs2[i];
          var id2 = tr2.getAttribute("data-jbis-rid") || recordIdFromIndexTr(tr2);
          if (!id2) continue;
          if (acc[id2] === "兼務") tr2.classList.add("jbis-776-kenmu");
          else tr2.classList.remove("jbis-776-kenmu");
        }
      })
      .catch(function (e) {
        console.warn("[jbis 776 kenmu color]", e);
      });
  }

  function rememberScrollAfterReorder(payload) {
    try {
      sessionStorage.setItem(
        SCROLL_AFTER_REORDER_KEY,
        JSON.stringify({
          id: String(payload.id || ""),
          name: String(payload.name || ""),
          at: payload.at || null,
          t: Date.now(),
          triedKw: false,
        }),
      );
    } catch (e) {
      /* noop */
    }
  }

  function consumeScrollAfterReorder(st) {
    var raw;
    try {
      raw = sessionStorage.getItem(SCROLL_AFTER_REORDER_KEY);
    } catch (e) {
      return;
    }
    if (!raw) return;
    var info = null;
    try {
      info = JSON.parse(raw);
    } catch (e2) {
      try {
        sessionStorage.removeItem(SCROLL_AFTER_REORDER_KEY);
      } catch (e3) {
        /* noop */
      }
      return;
    }
    if (!info || !info.id || Date.now() - Number(info.t || 0) > 120000) {
      try {
        sessionStorage.removeItem(SCROLL_AFTER_REORDER_KEY);
      } catch (e4) {
        /* noop */
      }
      return;
    }

    function clearKey() {
      try {
        sessionStorage.removeItem(SCROLL_AFTER_REORDER_KEY);
      } catch (e5) {
        /* noop */
      }
    }

    function tryScroll(attempt) {
      var trs = listIndexRows();
      var target = null;
      if (trs) {
        for (var i = 0; i < trs.length; i++) {
          var id = trs[i].getAttribute("data-jbis-rid") || recordIdFromIndexTr(trs[i]);
          if (String(id) === String(info.id)) {
            target = trs[i];
            break;
          }
        }
      }
      if (target) {
        target.classList.add("jbis-776-scroll-flash");
        try {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (eScroll) {
          target.scrollIntoView(true);
        }
        clearKey();
        return;
      }
      if (attempt < 8) {
        setTimeout(function () {
          tryScroll(attempt + 1);
        }, 200);
        return;
      }
      // 別ページにある場合: 氏名で1回だけ絞り込み再読込
      if (!info.triedKw && info.name && st) {
        info.triedKw = true;
        try {
          sessionStorage.setItem(SCROLL_AFTER_REORDER_KEY, JSON.stringify(info));
        } catch (e6) {
          /* noop */
        }
        st.kw = String(info.name).replace(/\s|\u3000/g, "");
        applyAndReload(st);
        return;
      }
      clearKey();
    }

    setTimeout(function () {
      tryScroll(0);
    }, 150);
  }

  function applyIndexDeptSeparators(records) {
    if (!records || !records.length) return;
    ensureDeptSepStyle();
    var trs = listIndexRows();
    if (!trs || !trs.length) return;

    var prevDept = null;
    var blockIdx = -1;
    var dataIdx = 0;
    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      tr.classList.remove("jbis-776-dept-sep", "jbis-776-dept-alt", "jbis-776-kenmu");
      if (tr.querySelector("th")) continue;
      if (dataIdx >= records.length) break;
      var rid =
        records[dataIdx].$id && records[dataIdx].$id.value != null
          ? String(records[dataIdx].$id.value)
          : "";
      if (rid) tr.setAttribute("data-jbis-rid", rid);
      var dept = cell(records[dataIdx], "dept_name");
      if (dept !== prevDept) {
        if (prevDept != null) tr.classList.add("jbis-776-dept-sep");
        blockIdx += 1;
        prevDept = dept;
      }
      if (blockIdx % 2 === 1) tr.classList.add("jbis-776-dept-alt");
      dataIdx += 1;
    }
    applyKenmuRowColors(records);
    applyTitleRankStyles(records);
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
          fields: ["$id", "list_sort"],
        })
        .then(function (resp) {
          var rows = resp.records || [];
          for (var i = 0; i < rows.length; i++) {
            all.push({
              id: String(rows[i].$id.value),
              sort: Number(rows[i].list_sort && rows[i].list_sort.value),
            });
          }
          if (rows.length < 500) return all;
          return page(offset + 500);
        });
    }
    return page(0).then(function (rows) {
      var ids = rows.map(function (r) {
        return r.id;
      });
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
      return applyListSortOrder776(app, rows, ids).then(function () {
        return { total: ids.length, at: insertAt + 1 };
      });
    });
  }

  /** 基準の人と同じ部署ブロックの末尾へ（「下に置く」が部署内末尾にならない問題の修正） */
  function placeMoverAtDeptEnd(moverId, anchorId) {
    var app = getAppId();
    var all = [];
    function page(offset) {
      return kintone
        .api(kintone.api.url("/k/v1/records.json", true), "GET", {
          app: app,
          query: "order by list_sort asc, レコード番号 asc limit 500 offset " + offset,
          fields: ["$id", "dept_name", "list_sort"],
        })
        .then(function (resp) {
          var rows = resp.records || [];
          for (var i = 0; i < rows.length; i++) {
            all.push({
              id: String(rows[i].$id.value),
              dept: cell(rows[i], "dept_name"),
              sort: Number(rows[i].list_sort && rows[i].list_sort.value),
            });
          }
          if (rows.length < 500) return all;
          return page(offset + 500);
        });
    }
    return page(0).then(function (rows) {
      var ids = rows.map(function (r) {
        return r.id;
      });
      var from = ids.indexOf(String(moverId));
      var anchor = ids.indexOf(String(anchorId));
      if (from < 0) return Promise.reject(new Error("動かす人が一覧にありません"));
      if (anchor < 0) return Promise.reject(new Error("基準の人が一覧にありません"));
      var dept = rows[anchor].dept;
      if (!dept) return Promise.reject(new Error("基準の人の部署名が空です"));

      ids.splice(from, 1);
      // 削除後の「その部署の最後の index」を探す
      var lastDept = -1;
      for (var i = 0; i < ids.length; i++) {
        var row = null;
        for (var j = 0; j < rows.length; j++) {
          if (rows[j].id === ids[i]) {
            row = rows[j];
            break;
          }
        }
        if (row && row.dept === dept) lastDept = i;
      }
      var insertAt = lastDept < 0 ? ids.length : lastDept + 1;
      if (insertAt < 0) insertAt = 0;
      if (insertAt > ids.length) insertAt = ids.length;
      ids.splice(insertAt, 0, String(moverId));
      return applyListSortOrder776(app, rows, ids).then(function () {
        return { total: ids.length, at: insertAt + 1, dept: dept };
      });
    });
  }

  /**
   * 新しい id 順に list_sort を合わせる。変化したインデックス範囲だけ PUT（全件 1..N 書き直しを避ける）。
   * beforeRows: [{id, sort}, ...] 旧順。afterIds: 新順の id 配列。
   */
  function applyListSortOrder776(app, beforeRows, afterIds) {
    var oldIndex = {};
    var oldSort = {};
    for (var i = 0; i < beforeRows.length; i++) {
      oldIndex[beforeRows[i].id] = i;
      oldSort[beforeRows[i].id] = beforeRows[i].sort;
    }
    var lo = Infinity;
    var hi = -1;
    for (var j = 0; j < afterIds.length; j++) {
      var id = afterIds[j];
      var oi = oldIndex[id];
      if (oi == null || oi !== j) {
        if (oi != null) {
          lo = Math.min(lo, j, oi);
          hi = Math.max(hi, j, oi);
        } else {
          lo = Math.min(lo, j);
          hi = Math.max(hi, j);
        }
      }
    }
    if (lo === Infinity) return Promise.resolve({ updated: 0 });

    // 範囲外がほぼ 1..N なら範囲内も index+1 で足りる。隙間がある場合は範囲の前後値から連番を振る
    var updates = [];
    var useDense = true;
    for (var c = 0; c < beforeRows.length; c++) {
      var s = beforeRows[c].sort;
      if (!isFinite(s) || Math.round(s) !== s || s !== c + 1) {
        useDense = false;
        break;
      }
    }

    if (useDense) {
      for (var k = lo; k <= hi; k++) {
        var wantD = String(k + 1);
        var prevD = oldSort[afterIds[k]];
        if (String(prevD) === wantD) continue;
        updates.push({
          id: afterIds[k],
          record: { list_sort: { value: wantD } },
        });
      }
    } else {
      var start =
        lo > 0 && isFinite(oldSort[afterIds[lo - 1]])
          ? Math.floor(oldSort[afterIds[lo - 1]]) + 1
          : 1;
      var endNeighbor =
        hi + 1 < afterIds.length && isFinite(oldSort[afterIds[hi + 1]])
          ? Math.floor(oldSort[afterIds[hi + 1]])
          : null;
      var need = hi - lo + 1;
      if (endNeighbor != null && start + need > endNeighbor) {
        // 隙間不足 → 当該位置から末尾まで連番（全件より狭いことが多い）
        hi = afterIds.length - 1;
        start =
          lo > 0 && isFinite(oldSort[afterIds[lo - 1]])
            ? Math.floor(oldSort[afterIds[lo - 1]]) + 1
            : 1;
      }
      for (var m = lo; m <= hi; m++) {
        var wantG = String(start + (m - lo));
        var prevG = oldSort[afterIds[m]];
        if (String(prevG) === wantG) continue;
        updates.push({
          id: afterIds[m],
          record: { list_sort: { value: wantG } },
        });
      }
    }

    return putListSortUpdates776(app, updates).then(function () {
      return { updated: updates.length };
    });
  }

  function putListSortUpdates776(app, updates) {
    if (!updates || !updates.length) return Promise.resolve();
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
    return chain;
  }

  /** 全件 1..N（値が変わった行だけ PUT）。部署ブロック差し替え等で使用 */
  function renumberListSortIds(app, ids) {
    var updates = ids.map(function (id, i) {
      return { id: id, record: { list_sort: { value: String(i + 1) } } };
    });
    // 旧値不明のため全件 PUT になり得るが、バッチは共通化
    return putListSortUpdates776(app, updates);
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
    if (st.titleRank === "lead") bits.push("役職者");
    else if (st.titleRank === "member") bits.push("一般");
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
    if (st.titleRank === "lead") parts.push("役職: 役職者");
    else if (st.titleRank === "member") parts.push("役職: 一般");
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
    parts.push("並び: 表示順↑");
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
    var titleLabel =
      st.titleRank === "lead"
        ? "役職者"
        : st.titleRank === "member"
          ? "一般"
          : "すべて";
    lines.push("役職: " + titleLabel);
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
   * Excel「集計表」の部署列寄せ
   * 例: 東北支店+管理部 → 東北支店管理部 / 仙台営業所 → 東北支店仙台営業所
   */
  function excelStyleAggDeptLabel(groupCode, deptName, sectionName) {
    var d = String(deptName || "").trim() || "(未設定)";
    var s = String(sectionName || "").trim();
    if (/支店.+(部|室)/.test(d) || (/営業所$/.test(d) && /支店/.test(d))) {
      return d;
    }
    if (s) {
      // 部／室が部署名と同名／既に含まれる場合は連結しない（例: 鉄構支店＋鉄構支店）
      if (s === d || d.indexOf(s) >= 0) return d;
      if (/支店$/.test(d) || d === "リフォーム事業統括部") {
        return d + s;
      }
      return d + s;
    }
    if (/営業所$|作業所$/.test(d)) {
      if (groupCode === "tohoku") return "東北支店" + d;
      if (groupCode === "kan-etsu") return "関越支店" + d;
      if (groupCode === "tokyo") return "東京支店" + d;
      if (groupCode === "tokai") return "東海支店" + d;
      if (groupCode === "tekko") return "鉄構支店" + d;
    }
    if (d === "人事研修部付出向者") return "人事研修部付出向";
    return d;
  }

  /** reform は Excel 同様に統括／首都圏／札幌へ分割表示 */
  function aggHubKey(groupCode, deptName) {
    if (groupCode !== "reform") return groupCode;
    var d = String(deptName || "");
    if (d.indexOf("札幌") === 0) return "reform-sapporo";
    if (d.indexOf("首都圏") === 0) return "reform-shutoken";
    return "reform-head";
  }

  var AGG_HUB_LABEL = {
    honsya: "本社",
    tohoku: "東北支店",
    "kan-etsu": "関越支店",
    tokyo: "東京支店",
    tokai: "東海支店",
    "reform-head": "リフォーム事業統括部",
    "reform-shutoken": "首都圏支店",
    "reform-sapporo": "札幌支店",
    reform: "リフォーム事業統括部",
    tekko: "鉄構支店",
    wangan: "湾岸工事所",
    bnp: "ブリッジニアプラス",
  };

  var AGG_HUB_ORDER = [
    "honsya",
    "tohoku",
    "kan-etsu",
    "tokyo",
    "tokai",
    "reform-head",
    "reform-shutoken",
    "reform-sapporo",
    "tekko",
    "wangan",
    "bnp",
  ];

  /** 浜田指定の部署表示順（Excel風ラベル） */
  var AGG_LABEL_ORDER = [
    "役員室",
    "顧問室",
    "総務部",
    "経理部",
    "経営企画部",
    "システム推進室",
    "人事研修部",
    "人事研修部付出向",
    "人事研修部付出向者",
    "安全推進部",
    "施工推進部",
    "メンテナンス技術部",
    "メンテナンス技術部新幹線大規模改修工事準備室",
    "塗装技術部",
    "品質管理部",
    "東北支店",
    "東北支店管理部",
    "東北支店安全部",
    "東北支店秋田営業所",
    "東北支店盛岡営業所",
    "東北支店仙台営業所",
    "東北支店工事部",
    "東北支店技術部",
    "関越支店",
    "関越支店管理部",
    "関越支店安全部",
    "関越支店工事部",
    "関越支店施工部",
    "関越支店新潟営業所",
    "関越支店長野営業所",
    "関越支店高崎営業所",
    "東京支店",
    "東京支店施工支援部",
    "東京支店安全部",
    "東京支店施工部",
    "東京支店橋りょうリペア部",
    "東京支店水戸営業所",
    "東京支店千葉営業所",
    "東海支店",
    "東海支店管理部",
    "東海支店安全部",
    "東海支店工事部",
    "東海支店東京営業所",
    "東海支店静岡営業所",
    "東海支店名古屋営業所",
    "東海支店関西営業所",
    "リフォーム事業統括部",
    "首都圏支店",
    "首都圏支店工事支援部",
    "首都圏支店安全部",
    "首都圏支店第一工事部",
    "首都圏支店第二工事部",
    "首都圏支店第三工事部",
    "札幌支店",
    "札幌支店工事支援部",
    "札幌支店安全部",
    "札幌支店工事部",
    "鉄構支店",
    "鉄構支店管理部",
    "鉄構支店安全部",
    "鉄構支店工事部",
    "湾岸工事所",
    "ブリッジニアプラス",
    "鎌ヶ谷作業所",
  ];

  function aggLabelSortIndex(label) {
    var i = AGG_LABEL_ORDER.indexOf(label);
    if (i >= 0) return i;
    return 9000 + label.charCodeAt(0);
  }

  /**
   * 集計表: 拠点 / 部署 / 本務 / 兼務 / 合計（合計＝本務＋兼務・拠点ブロック最終行＋総合計）
   * 本務・兼務とも部署ラベル内で source_595_id DISTINCT（合計は列加算＝延べ）
   */
  function buildAggTableModel(records) {
    var byHub = {};
    var seenPrimary = {};
    var seenKenmu = {};
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var role = (r.row_role && r.row_role.value) || "";
      var sid = String((r.source_595_id && r.source_595_id.value) || "");
      if (!sid) continue;
      var g = String((r.group_name && r.group_name.value) || "").trim() || "(未設定)";
      var d = String((r.dept_name && r.dept_name.value) || "").trim() || "(未設定)";
      var sec = String((r.section_name && r.section_name.value) || "").trim();
      var hubKey = aggHubKey(g, d);
      var label = excelStyleAggDeptLabel(g, d, sec);
      if (!byHub[hubKey]) byHub[hubKey] = {};
      if (!byHub[hubKey][label]) byHub[hubKey][label] = { primary: {}, kenmu: {} };
      var cell = byHub[hubKey][label];
      if (role === "本務") {
        cell.primary[sid] = true;
        seenPrimary[sid] = true;
      } else if (role === "兼務") {
        cell.kenmu[sid] = true;
        seenKenmu[sid] = true;
      }
    }

    var hubKeys = AGG_HUB_ORDER.slice();
    Object.keys(byHub).forEach(function (h) {
      if (hubKeys.indexOf(h) === -1) hubKeys.push(h);
    });

    var rows = [];
    var grandPrimary = 0;
    var grandKenmu = 0;
    hubKeys.forEach(function (h) {
      var deptMap = byHub[h];
      if (!deptMap) return;
      var depts = Object.keys(deptMap).sort(function (a, b) {
        return aggLabelSortIndex(a) - aggLabelSortIndex(b);
      });
      var subP = 0;
      var subK = 0;
      depts.forEach(function (d) {
        var p = Object.keys(deptMap[d].primary).length;
        var k = Object.keys(deptMap[d].kenmu).length;
        subP += p;
        subK += k;
      });
      grandPrimary += subP;
      grandKenmu += subK;
      var hubLabel = AGG_HUB_LABEL[h] || h;
      depts.forEach(function (d, di) {
        var p = Object.keys(deptMap[d].primary).length;
        var k = Object.keys(deptMap[d].kenmu).length;
        rows.push({
          hub: di === 0 ? hubLabel : "",
          dept: d,
          primary: p,
          kenmu: k,
          total: p + k,
          isSubtotal: false,
        });
      });
      rows.push({
        hub: "",
        dept: "合計",
        primary: subP,
        kenmu: subK,
        total: subP + subK,
        isSubtotal: true,
      });
    });
    return {
      rows: rows,
      grandPrimary: grandPrimary,
      grandKenmu: grandKenmu,
      grandTotal: grandPrimary + grandKenmu,
      peoplePrimary: Object.keys(seenPrimary).length,
      peopleKenmu: Object.keys(seenKenmu).length,
    };
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
    titleSub.textContent = "本務／兼務／合計（合計＝本務＋兼務）";
    titleRow.appendChild(title);
    titleRow.appendChild(titleSub);
    box.appendChild(titleRow);

    var meta = document.createElement("div");
    meta.style.cssText =
      "display:flex;flex-direction:column;gap:4px;padding:8px 10px;" +
      "background:#f8fafc;border:1px solid #e8ecf4;border-radius:8px;font-size:12px;color:#334155;";
    var metaCount = document.createElement("div");
    metaCount.style.cssText = "font-weight:800;color:#0f172a;font-size:13px;";
    metaCount.textContent = "件数取得中…";
    meta.appendChild(metaCount);
    var metaHint = document.createElement("div");
    metaHint.style.cssText = "color:#94a3b8;font-size:11px;";
    metaHint.textContent =
      "上部「② いまの条件・件数」の絞り込みで集計（条件の再掲はしません）。合計＝本務＋兼務（延べ）。";
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
          "該当 " +
          recs.length +
          "件 ｜ 本務 " +
          model.peoplePrimary +
          "人 ｜ 兼務（延べ） " +
          model.grandKenmu +
          " ｜ 表の本務計 " +
          model.grandPrimary +
          " ／ 兼務計 " +
          model.grandKenmu +
          " ／ 合計 " +
          model.grandTotal;
        host.innerHTML = "";
        /* 列幅: 拠点 11em / 部署 22em / 本務・兼務・合計 4.5em */
        var AGG_W_HUB = "11em";
        var AGG_W_DEPT = "22em";
        var AGG_W_CNT = "4.5em";
        var table = document.createElement("table");
        table.style.cssText =
          "border-collapse:separate;border-spacing:0;" +
          "width:calc(" +
          AGG_W_HUB +
          " + " +
          AGG_W_DEPT +
          " + " +
          AGG_W_CNT +
          " + " +
          AGG_W_CNT +
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
          { label: "本務", w: AGG_W_CNT, align: "right" },
          { label: "兼務", w: AGG_W_CNT, align: "right" },
          { label: "合計", w: AGG_W_CNT, align: "right" },
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
          var vals = [row.hub, row.dept, row.primary, row.kenmu, row.total];
          vals.forEach(function (v, vi) {
            var td = document.createElement("td");
            var text = v === "" || v == null ? "" : String(v);
            td.textContent = text;
            if (vi === 1 && text) td.title = text;
            var colW =
              vi === 0 ? AGG_W_HUB : vi === 1 ? AGG_W_DEPT : AGG_W_CNT;
            var base =
              "width:" +
              colW +
              ";max-width:" +
              colW +
              ";box-sizing:border-box;padding:6px 8px;" +
              "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" +
              (vi >= 2 ? "text-align:right;" : "text-align:left;");
            if (row.isSubtotal) {
              td.style.cssText =
                base +
                "border-top:1.5px solid #c4b5fd;border-bottom:1px solid #bbf7d0;" +
                "background:#f0fdf4;font-weight:800;color:#166534;" +
                (vi >= 2 ? "font-size:14px;" : "");
            } else if (isHubStart) {
              td.style.cssText =
                base +
                "border-top:1px solid #e9e5ff;background:" +
                (vi === 0 ? "#faf8ff" : "#fff") +
                ";" +
                (vi === 0
                  ? "font-weight:800;color:#4c1d95;border-left:3px solid #a78bfa;"
                  : "border-left:none;color:#0f172a;") +
                (vi >= 2 ? "font-weight:700;" : "");
            } else {
              td.style.cssText =
                base +
                "border-top:1px solid #f1f5f9;background:#fff;color:#334155;" +
                (vi === 0 ? "border-left:3px solid transparent;" : "") +
                (vi >= 2 ? "font-weight:600;" : "");
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
        function mkFootTd(n) {
          var td = document.createElement("td");
          td.textContent = String(n);
          td.style.cssText =
            "padding:8px;text-align:right;font-weight:800;font-size:15px;" +
            "background:linear-gradient(90deg,#ede9fe,#ecfdf5);color:#14532d;" +
            "border-top:2px solid #a78bfa;white-space:nowrap;width:" +
            AGG_W_CNT +
            ";";
          return td;
        }
        fr.appendChild(tdL);
        fr.appendChild(mkFootTd(model.grandPrimary));
        fr.appendChild(mkFootTd(model.grandKenmu));
        fr.appendChild(mkFootTd(model.grandTotal));
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

  function formatRosterPageLabel(built) {
    if (!built) return "表示 —";
    var tot = built.total;
    var totText = isFinite(tot) ? String(tot) : "…";
    if (!built.shown) return "表示 — / " + totText + " 件";
    return (
      "表示 " +
      built.from +
      "–" +
      built.to +
      " / " +
      totText +
      " 件（" +
      built.page +
      "/" +
      built.maxPage +
      "ページ）"
    );
  }

  function createRosterPagerBar(st, built, barId) {
    var bar = document.createElement("div");
    bar.id = barId || PAGER_ID;
    bar.style.cssText =
      "display:flex;flex-wrap:wrap;gap:8px;align-items:center;" +
      "margin:0;padding:8px 10px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;";

    var BTN =
      "box-sizing:border-box;height:30px;padding:0 12px;border-radius:6px;" +
      "font-size:12px;font-weight:700;cursor:pointer;" +
      "display:inline-flex;align-items:center;justify-content:center;" +
      "border:1px solid #94a3b8;background:#fff;color:#0f172a;";

    var page = (built && built.page) || st.page || 1;
    var maxPage = (built && built.maxPage) || 1;

    var labelEl = document.createElement("span");
    labelEl.style.cssText = "font-size:12px;font-weight:700;color:#334155;margin-left:4px;";
    labelEl.textContent = formatRosterPageLabel(built);

    function mk(label, targetPage, primary, disabled) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.disabled = !!disabled;
      b.style.cssText =
        BTN +
        (primary ? "border-color:#0f766e;background:#0f766e;color:#fff;" : "") +
        (disabled ? "opacity:0.45;cursor:not-allowed;" : "");
      if (!disabled) {
        b.addEventListener("click", function () {
          labelEl.textContent = "移動中…";
          var fixedLabel = document.querySelector(
            "#" + PAGER_FIXED_ID + " [data-jbis-pager-label]",
          );
          if (fixedLabel) fixedLabel.textContent = "移動中…";
          goRosterPage(st, targetPage).catch(function (err) {
            console.warn("[jbis 776 pager]", err);
            labelEl.textContent = "ページ移動に失敗しました";
            labelEl.style.color = "#b91c1c";
          });
        });
      }
      return b;
    }

    labelEl.setAttribute("data-jbis-pager-label", "1");
    bar.appendChild(mk("先頭", 1, false, page <= 1));
    bar.appendChild(mk("前のページ", page - 1, false, page <= 1));
    bar.appendChild(mk("次のページ", page + 1, true, page >= maxPage));
    bar.appendChild(mk("末尾", maxPage, false, page >= maxPage));
    bar.appendChild(labelEl);
    return bar;
  }

  function removeElById(id) {
    var el = document.getElementById(id);
    if (el && el._jbisIo) {
      try {
        el._jbisIo.disconnect();
      } catch (eDisc) {
        /* noop */
      }
    }
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function ensurePagerBottomPad(on) {
    var st = document.getElementById(PAGER_PAD_STYLE_ID);
    if (!on) {
      if (st && st.parentNode) st.parentNode.removeChild(st);
      return;
    }
    if (!st) {
      st = document.createElement("style");
      st.id = PAGER_PAD_STYLE_ID;
      document.head.appendChild(st);
    }
    st.textContent =
      "body{padding-bottom:58px !important;}" +
      ".gaia-argoui-app-index-pager,.ocean-ui-plugin-pager{margin-bottom:52px;}";
  }

  function findRosterListAnchor() {
    return (
      document.querySelector(".recordlist-gaia") ||
      document.querySelector(".gaia-argoui-app-index-table") ||
      document.querySelector(".gaia-argoui-app-index") ||
      document.querySelector("#appmenu-index") ||
      null
    );
  }

  function mountRosterPager(wrap, st, built) {
    removeElById(PAGER_ID);
    if (!wrap) return;
    var bar = createRosterPagerBar(st, built, PAGER_ID);
    wrap.appendChild(bar);
  }

  /** 一覧表の直下（スクロール末尾でも操作できる）＋画面下固定追従 */
  function mountRosterPagerExtras(st, built) {
    removeElById(PAGER_BOTTOM_ID);
    removeElById(PAGER_FIXED_ID);
    var maxPage = (built && built.maxPage) || 1;
    if (maxPage <= 1) {
      ensurePagerBottomPad(false);
      return;
    }

    var anchor = findRosterListAnchor();
    if (anchor && anchor.parentNode) {
      var bottom = createRosterPagerBar(st, built, PAGER_BOTTOM_ID);
      bottom.style.margin = "12px 0 16px";
      if (anchor.nextSibling) {
        anchor.parentNode.insertBefore(bottom, anchor.nextSibling);
      } else {
        anchor.parentNode.appendChild(bottom);
      }
    }

    var dock = document.createElement("div");
    dock.id = PAGER_FIXED_ID;
    dock.setAttribute("role", "navigation");
    dock.setAttribute("aria-label", "ページ送り（画面下）");
    dock.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;z-index:10050;" +
      "box-sizing:border-box;padding:8px 12px;" +
      "background:rgba(255,255,255,.97);border-top:1px solid #94a3b8;" +
      "box-shadow:0 -4px 16px rgba(15,23,42,.12);";
    var inner = createRosterPagerBar(st, built, PAGER_FIXED_ID + "-inner");
    inner.style.margin = "0 auto";
    inner.style.maxWidth = "1100px";
    inner.style.border = "none";
    inner.style.background = "transparent";
    dock.appendChild(inner);
    document.body.appendChild(dock);
    ensurePagerBottomPad(true);

    // 上部ツールバーのページ送りが見えているときは固定バーを薄く（操作はどちらも可）
    var topBar = document.getElementById(PAGER_ID);
    if (topBar && typeof IntersectionObserver === "function") {
      try {
        var io = new IntersectionObserver(
          function (entries) {
            var e0 = entries && entries[0];
            if (!e0) return;
            dock.style.opacity = e0.isIntersecting ? "0.35" : "1";
            dock.style.pointerEvents = e0.isIntersecting ? "none" : "auto";
          },
          { root: null, threshold: 0.2 },
        );
        io.observe(topBar);
        dock._jbisIo = io;
      } catch (eIo) {
        /* noop */
      }
    }
  }

  function closeSectionModal() {
    var el = document.getElementById(SECTION_MODAL_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function fetchRosterMembersByGroup(groupCode) {
    var g = String(groupCode || "").trim();
    if (!g) return Promise.resolve([]);
    var app = getAppId();
    var all = [];
    function page(offset) {
      return kintone
        .api(kintone.api.url("/k/v1/records.json", true), "GET", {
          app: app,
          query:
            'group_name = "' +
            escapeForQuery(g) +
            '" order by list_sort asc, レコード番号 asc limit 500 offset ' +
            offset,
          fields: [
            "$id",
            "user_name",
            "dept_name",
            "job_title",
            "row_role",
            "section_name",
            "list_sort",
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

  function putSectionNameForIds(ids, sectionValue) {
    if (!ids || !ids.length) return Promise.resolve();
    var app = getAppId();
    var updates = ids.map(function (id) {
      return {
        id: String(id),
        record: { section_name: { value: sectionValue || "" } },
      };
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
    return chain;
  }

  function openSectionAssignModal() {
    closeSectionModal();
    var overlay = document.createElement("div");
    overlay.id = SECTION_MODAL_ID;
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.45);" +
      "display:flex;align-items:center;justify-content:center;padding:16px;";

    var panel = document.createElement("div");
    panel.style.cssText =
      "width:min(720px,100%);max-height:90vh;overflow:auto;background:#fff;" +
      "border-radius:10px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.25);";

    var h = document.createElement("div");
    h.style.cssText = "font-size:16px;font-weight:800;color:#0f172a;margin:0 0 8px;";
    h.textContent = "部／室の設定";
    panel.appendChild(h);

    var note = document.createElement("div");
    note.style.cssText = "font-size:12px;color:#64748b;margin:0 0 12px;line-height:1.5;";
    note.textContent =
      "所属グループの名簿から対象を選び、部／室を付けます（1人でも複数でも可）。並びは変更しません。並びは一覧の「並び替え」か、個別編集の保存時に設定してください。";
    panel.appendChild(note);

    var form = document.createElement("div");
    form.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:10px;";

    function mkLabel(text, el) {
      var wrap = document.createElement("label");
      wrap.style.cssText = "display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:#334155;";
      wrap.appendChild(document.createTextNode(text));
      wrap.appendChild(el);
      return wrap;
    }

    var secSel = document.createElement("select");
    secSel.style.cssText = "height:32px;min-width:180px;border:1px solid #94a3b8;border-radius:6px;padding:0 8px;";
    var opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "（未設定＝クリア）";
    secSel.appendChild(opt0);
    for (var si = 0; si < SECTION_OPTIONS.length; si++) {
      var o = document.createElement("option");
      o.value = SECTION_OPTIONS[si];
      o.textContent = SECTION_OPTIONS[si];
      secSel.appendChild(o);
    }

    var groupSel = document.createElement("select");
    groupSel.style.cssText = "height:32px;min-width:200px;border:1px solid #94a3b8;border-radius:6px;padding:0 8px;";
    var g0 = document.createElement("option");
    g0.value = "";
    g0.textContent = "所属グループを選択";
    groupSel.appendChild(g0);
    Object.keys(GROUP_LABEL).forEach(function (code) {
      var go = document.createElement("option");
      go.value = code;
      go.textContent = GROUP_LABEL[code] + "（" + code + "）";
      groupSel.appendChild(go);
    });

    form.appendChild(mkLabel("部／室", secSel));
    form.appendChild(mkLabel("所属グループ", groupSel));
    panel.appendChild(form);

    var listWrap = document.createElement("div");
    listWrap.style.cssText =
      "border:1px solid #e2e8f0;border-radius:8px;max-height:360px;overflow:auto;padding:8px;background:#f8fafc;";
    listWrap.textContent = "所属グループを選ぶと名簿が出ます。";
    panel.appendChild(listWrap);

    var status = document.createElement("div");
    status.style.cssText = "margin:10px 0 0;font-size:12px;color:#64748b;min-height:1.2em;";
    panel.appendChild(status);

    var actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;justify-content:flex-end;margin-top:12px;";
    var btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "閉じる";
    btnCancel.style.cssText =
      "height:32px;padding:0 14px;border-radius:6px;border:1px solid #94a3b8;background:#fff;font-weight:700;cursor:pointer;";
    var btnApply = document.createElement("button");
    btnApply.type = "button";
    btnApply.textContent = "選択した人に反映";
    btnApply.style.cssText =
      "height:32px;padding:0 14px;border-radius:6px;border:none;background:#0f766e;color:#fff;font-weight:700;cursor:pointer;";
    actions.appendChild(btnCancel);
    actions.appendChild(btnApply);
    panel.appendChild(actions);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    btnCancel.addEventListener("click", closeSectionModal);
    overlay.addEventListener("click", function (ev) {
      if (ev.target === overlay) closeSectionModal();
    });

    var currentRows = [];

    function renderList(rows) {
      currentRows = rows || [];
      listWrap.innerHTML = "";
      if (!currentRows.length) {
        listWrap.textContent = "該当する名簿がありません。";
        return;
      }
      var head = document.createElement("div");
      head.style.cssText = "display:flex;gap:8px;align-items:center;margin-bottom:8px;";
      var all = document.createElement("button");
      all.type = "button";
      all.textContent = "全選択";
      all.style.cssText =
        "height:28px;padding:0 10px;border-radius:6px;border:1px solid #94a3b8;background:#fff;font-size:12px;font-weight:700;cursor:pointer;";
      var none = document.createElement("button");
      none.type = "button";
      none.textContent = "全解除";
      none.style.cssText = all.style.cssText;
      head.appendChild(all);
      head.appendChild(none);
      listWrap.appendChild(head);

      for (var i = 0; i < currentRows.length; i++) {
        var r = currentRows[i];
        var id = String(r.$id.value);
        var lab = document.createElement("label");
        lab.style.cssText =
          "display:flex;gap:8px;align-items:flex-start;padding:6px 4px;border-bottom:1px solid #e2e8f0;" +
          "font-size:13px;color:#0f172a;cursor:pointer;";
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = id;
        cb.setAttribute("data-jbis-sec-id", id);
        var span = document.createElement("span");
        var sec = cell(r, "section_name") || "—";
        span.innerHTML =
          "<strong>" +
          escapeHtml(cell(r, "user_name")) +
          "</strong>　" +
          escapeHtml(cell(r, "dept_name")) +
          " / " +
          escapeHtml(cell(r, "job_title") || "—") +
          "　[" +
          escapeHtml(cell(r, "row_role") || "") +
          "]　現: " +
          escapeHtml(sec);
        lab.appendChild(cb);
        lab.appendChild(span);
        listWrap.appendChild(lab);
      }

      all.addEventListener("click", function () {
        var boxes = listWrap.querySelectorAll("input[type=checkbox]");
        for (var bi = 0; bi < boxes.length; bi++) boxes[bi].checked = true;
      });
      none.addEventListener("click", function () {
        var boxes2 = listWrap.querySelectorAll("input[type=checkbox]");
        for (var bj = 0; bj < boxes2.length; bj++) boxes2[bj].checked = false;
      });
    }

    groupSel.addEventListener("change", function () {
      var g = groupSel.value;
      if (!g) {
        listWrap.textContent = "所属グループを選ぶと名簿が出ます。";
        return;
      }
      listWrap.textContent = "読込中…";
      fetchRosterMembersByGroup(g)
        .then(renderList)
        .catch(function (err) {
          console.warn("[jbis 776 section]", err);
          listWrap.textContent = "名簿の取得に失敗しました。";
        });
    });

    btnApply.addEventListener("click", function () {
      var boxes = listWrap.querySelectorAll("input[type=checkbox]:checked");
      var ids = [];
      for (var i = 0; i < boxes.length; i++) ids.push(boxes[i].value);
      if (!ids.length) {
        status.textContent = "対象を1人以上選んでください。";
        status.style.color = "#b45309";
        return;
      }
      var sec = secSel.value;
      btnApply.disabled = true;
      status.textContent = "反映中…";
      status.style.color = "#64748b";
      putSectionNameForIds(ids, sec)
        .then(function () {
          status.textContent =
            ids.length + "件に「" + (sec || "未設定") + "」を反映しました。並びは変えていません。";
          status.style.color = "#047857";
          btnApply.disabled = false;
          if (groupSel.value) {
            return fetchRosterMembersByGroup(groupSel.value).then(renderList);
          }
        })
        .catch(function (err) {
          console.warn("[jbis 776 section put]", err);
          status.textContent = "反映失敗: " + ((err && err.message) || "権限を確認");
          status.style.color = "#b91c1c";
          btnApply.disabled = false;
        });
    });
  }

  function closeSortModal() {
    var el = document.getElementById(SORT_MODAL_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function fetchDeptPeers776(dept, selfId) {
    var d = String(dept || "").trim();
    if (!d) return Promise.resolve([]);
    var app = getAppId();
    return kintone
      .api(kintone.api.url("/k/v1/records.json", true), "GET", {
        app: app,
        query:
          'dept_name = "' +
          escapeForQuery(d) +
          '" order by list_sort asc, レコード番号 asc limit 500',
        fields: ["$id", "user_name", "job_title", "row_role", "list_sort", "section_name"],
      })
      .then(function (resp) {
        var rows = resp.records || [];
        return rows.filter(function (r) {
          return String(r.$id.value) !== String(selfId || "");
        });
      });
  }

  function openRelativeSortPicker776(dept, peers) {
    return new Promise(function (resolve, reject) {
      closeSortModal();
      var overlay = document.createElement("div");
      overlay.id = SORT_MODAL_ID;
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);" +
        "display:flex;align-items:center;justify-content:center;padding:16px;";
      var panel = document.createElement("div");
      panel.style.cssText =
        "width:min(560px,100%);max-height:90vh;overflow:auto;background:#fff;" +
        "border-radius:10px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.25);";
      var h = document.createElement("div");
      h.style.cssText = "font-size:16px;font-weight:800;margin:0 0 8px;";
      h.textContent = "一覧の並び位置";
      panel.appendChild(h);
      var note = document.createElement("div");
      note.style.cssText = "font-size:12px;color:#64748b;margin:0 0 10px;";
      note.textContent = "部署「" + dept + "」内で、誰の前／後ろに置くかを選んでください。";
      panel.appendChild(note);

      var placeSel = document.createElement("select");
      placeSel.style.cssText =
        "width:100%;height:34px;border:1px solid #94a3b8;border-radius:6px;margin-bottom:10px;padding:0 8px;";
      [
        { v: "end", t: "部署の末尾" },
        { v: "start", t: "部署の先頭" },
      ].forEach(function (x) {
        var o = document.createElement("option");
        o.value = x.v;
        o.textContent = x.t;
        placeSel.appendChild(o);
      });
      for (var i = 0; i < peers.length; i++) {
        var p = peers[i];
        var oAbove = document.createElement("option");
        oAbove.value = "above:" + p.$id.value;
        oAbove.textContent =
          "「" +
          cell(p, "user_name") +
          "」の前（" +
          (cell(p, "job_title") || cell(p, "row_role") || "") +
          "）";
        placeSel.appendChild(oAbove);
        var oBelow = document.createElement("option");
        oBelow.value = "below:" + p.$id.value;
        oBelow.textContent =
          "「" +
          cell(p, "user_name") +
          "」の後ろ（" +
          (cell(p, "job_title") || cell(p, "row_role") || "") +
          "）";
        placeSel.appendChild(oBelow);
      }
      panel.appendChild(placeSel);

      var actions = document.createElement("div");
      actions.style.cssText = "display:flex;gap:8px;justify-content:flex-end;margin-top:12px;";
      var btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.textContent = "キャンセル";
      btnCancel.style.cssText =
        "height:32px;padding:0 14px;border-radius:6px;border:1px solid #94a3b8;background:#fff;font-weight:700;cursor:pointer;";
      var btnOk = document.createElement("button");
      btnOk.type = "button";
      btnOk.textContent = "この位置で保存";
      btnOk.style.cssText =
        "height:32px;padding:0 14px;border-radius:6px;border:none;background:#0f766e;color:#fff;font-weight:700;cursor:pointer;";
      actions.appendChild(btnCancel);
      actions.appendChild(btnOk);
      panel.appendChild(actions);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      function done(val) {
        closeSortModal();
        resolve(val);
      }
      btnCancel.addEventListener("click", function () {
        reject({ cancelled: true });
        closeSortModal();
      });
      overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay) {
          reject({ cancelled: true });
          closeSortModal();
        }
      });
      btnOk.addEventListener("click", function () {
        done(placeSel.value || "end");
      });
    });
  }

  function applyChosenSort776(selfId, dept, choice) {
    var app = getAppId();
    return fetchDeptPeers776(dept, null).then(function (allInDept) {
      var ids = allInDept.map(function (r) {
        return String(r.$id.value);
      });
      // self がまだ部署クエリに含まれない新規の場合もある
      if (ids.indexOf(String(selfId)) < 0) ids.push(String(selfId));
      ids = ids.filter(function (id, idx, arr) {
        return arr.indexOf(id) === idx;
      });
      // 現順から self を外して挿入
      var without = ids.filter(function (id) {
        return id !== String(selfId);
      });
      var next = without.slice();
      if (choice === "start") {
        next.unshift(String(selfId));
      } else if (choice === "end") {
        next.push(String(selfId));
      } else if (String(choice).indexOf("above:") === 0) {
        var aid = String(choice).slice(6);
        var ai = next.indexOf(aid);
        if (ai < 0) next.push(String(selfId));
        else next.splice(ai, 0, String(selfId));
      } else if (String(choice).indexOf("below:") === 0) {
        var bid = String(choice).slice(6);
        var bi = next.indexOf(bid);
        if (bi < 0) next.push(String(selfId));
        else next.splice(bi + 1, 0, String(selfId));
      } else {
        next.push(String(selfId));
      }
      // 部署外の全件順を維持しつつ、部署ブロックを差し替え
      return fetchAllIdsOrdered776().then(function (beforeRows) {
        var allIds = beforeRows.map(function (r) {
          return r.id;
        });
        var inDept = {};
        for (var i = 0; i < next.length; i++) inDept[next[i]] = true;
        var rebuilt = [];
        var inserted = false;
        for (var j = 0; j < allIds.length; j++) {
          var id = allIds[j];
          if (inDept[id]) {
            if (!inserted) {
              for (var k = 0; k < next.length; k++) rebuilt.push(next[k]);
              inserted = true;
            }
            continue;
          }
          rebuilt.push(id);
        }
        if (!inserted) {
          for (var m = 0; m < next.length; m++) rebuilt.push(next[m]);
        }
        return applyListSortOrder776(app, beforeRows, rebuilt).then(function () {
          var at = rebuilt.indexOf(String(selfId));
          return { at: at >= 0 ? at + 1 : rebuilt.length, total: rebuilt.length };
        });
      });
    });
  }

  function fetchAllIdsOrdered776() {
    var app = getAppId();
    var all = [];
    function page(offset) {
      return kintone
        .api(kintone.api.url("/k/v1/records.json", true), "GET", {
          app: app,
          query: "order by list_sort asc, レコード番号 asc limit 500 offset " + offset,
          fields: ["$id", "list_sort"],
        })
        .then(function (resp) {
          var rows = resp.records || [];
          for (var i = 0; i < rows.length; i++) {
            all.push({
              id: String(rows[i].$id.value),
              sort: Number(rows[i].list_sort && rows[i].list_sort.value),
            });
          }
          if (rows.length < 500) return all;
          return page(offset + 500);
        });
    }
    return page(0);
  }

  function applyListSortOnSubmit776(event) {
    var rec = event.record;
    if (!rec) return event;
    var dept = cell(rec, "dept_name").trim();
    var section = cell(rec, FC_SECTION).trim();
    var selfId = rec.$id && rec.$id.value != null ? String(rec.$id.value) : "";
    var isCreate = !selfId;
    var orig = window.__jbis776EditOrig || null;
    var deptChanged = !orig || String(orig.dept || "") !== dept;
    var sectionChanged = !orig || String(orig.section || "") !== section;
    if (!isCreate && !deptChanged && !sectionChanged) {
      return event;
    }
    if (!dept) {
      window.alert("部署名を先に入力してください。");
      return false;
    }
    // 並びの REST 更新は submit 中にやると revision 衝突する → 選択だけ保持し success 後に適用
    return fetchDeptPeers776(dept, selfId)
      .then(function (peers) {
        return openRelativeSortPicker776(dept, peers).then(function (choice) {
          window.__jbis776PendingSort = {
            id: selfId || null,
            dept: dept,
            choice: choice,
          };
          return event;
        });
      })
      .catch(function (err) {
        if (err && err.cancelled) return false;
        console.warn("[jbis 776 sort submit]", err);
        window.alert("並び位置の設定に失敗しました: " + ((err && err.message) || ""));
        return false;
      });
  }

  function runPendingSortAfterSave776(event) {
    var pending = window.__jbis776PendingSort;
    window.__jbis776PendingSort = null;
    if (!pending || !pending.choice) return event;
    var rid =
      pending.id ||
      (event.recordId != null ? String(event.recordId) : "") ||
      (event.record && event.record.$id && event.record.$id.value != null
        ? String(event.record.$id.value)
        : "");
    if (!rid) return event;
    return applyChosenSort776(rid, pending.dept, pending.choice)
      .then(function () {
        return event;
      })
      .catch(function (err) {
        console.warn("[jbis 776 sort after save]", err);
        window.alert(
          "レコードは保存されましたが、並び位置の反映に失敗しました。一覧の「並び替え」で調整してください。"
        );
        return event;
      });
  }

  function mountToolbar(space, st, built) {
    var old = document.getElementById(WRAP_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    closeOrgPopover();

    /* ①の上の空き: ヘッダスペース〜祖先の余白を潰し、ツールバーを上へ引き寄せる */
    function tightenHeaderGap776(spaceEl) {
      var el = spaceEl;
      for (var i = 0; i < 8 && el && el.style; i++) {
        el.style.marginTop = "0";
        el.style.paddingTop = "0";
        el.style.minHeight = "0";
        if (i === 0) {
          el.style.marginBottom = "0";
          el.style.paddingBottom = "2px";
        }
        el = el.parentElement;
      }
      try {
        var hsCssId = "jbis-776-header-space-tight";
        var css =
          /* kintone 一覧ヘッダ〜ヘッダメニューの下余白 */
          ".gaia-argoui-app-toolbar{padding-bottom:0!important;margin-bottom:0!important;}" +
          ".gaia-argoui-app-toolbar .gaia-argoui-app-menu{margin-bottom:0!important;}" +
          ".contents-actionmenu-gaia," +
          ".ocean-ui-plugin-headerMenu," +
          ".ocean-ui-plugin-headerMenu-content," +
          ".gaia-argoui-app-showindex-toolbar-spacer," +
          "#header-space-element," +
          "#header-menu-space{" +
          "margin-top:0!important;padding-top:0!important;min-height:0!important;}" +
          /* ツールバー本体をタイトルバー直下へ */
          "#" +
          WRAP_ID +
          "{margin-top:-28px!important;position:relative;z-index:2;}";
        var hsCss = document.getElementById(hsCssId);
        if (!hsCss) {
          hsCss = document.createElement("style");
          hsCss.id = hsCssId;
          document.head.appendChild(hsCss);
        }
        hsCss.textContent = css;
      } catch (eCss) {
        /* noop */
      }
    }
    tightenHeaderGap776(space);

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

    function mkBand(title, borderColor, bg, opts) {
      var o = opts || {};
      var pad = o.tightTop ? "2px 8px 6px" : "6px 10px 8px";
      var band = document.createElement("section");
      band.setAttribute("aria-label", title);
      band.style.cssText =
        "margin:0;padding:" +
        pad +
        ";border:1.5px solid " +
        borderColor +
        ";border-radius:8px;background:" +
        bg +
        ";box-sizing:border-box;display:flex;flex-direction:column;gap:" +
        (o.tightTop ? "4px" : "6px") +
        ";";
      if (!o.inlineTitle) {
        var lab = document.createElement("div");
        lab.textContent = title;
        lab.style.cssText =
          "font-size:11px;font-weight:800;letter-spacing:0.06em;color:#475569;" +
          "text-transform:none;line-height:1;margin:0;";
        band.appendChild(lab);
      }
      return band;
    }

    var wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.style.cssText =
      "margin:-28px 0 4px;padding:0;border:none;background:transparent;" +
      "display:flex;flex-direction:column;gap:4px;box-sizing:border-box;";

    /* —— 帯1: 絞り込み（見出しをチップと同じ行にして枠内上を詰める） —— */
    var bandFilter = mkBand("① 絞り込み", "#94a3b8", "#f8fafc", {
      tightTop: true,
      inlineTitle: true,
    });
    var chipRow = document.createElement("div");
    chipRow.style.cssText =
      "display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;";
    var filterTitle = document.createElement("span");
    filterTitle.textContent = "① 絞り込み";
    filterTitle.style.cssText =
      "font-size:11px;font-weight:800;letter-spacing:0.06em;color:#475569;margin-right:4px;";
    chipRow.appendChild(filterTitle);

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
    bandFilter.appendChild(chipRow);

    var titleChipRow = document.createElement("div");
    titleChipRow.style.cssText =
      "display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;margin-top:2px;";
    var titleLabel = document.createElement("span");
    titleLabel.textContent = "役職";
    titleLabel.style.cssText =
      "font-size:11px;font-weight:800;letter-spacing:0.06em;color:#475569;margin-right:4px;";
    titleChipRow.appendChild(titleLabel);

    function mkTitleChip(text, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      var rank = st.titleRank || "all";
      b.setAttribute("aria-pressed", rank === value ? "true" : "false");
      var on = rank === value;
      b.style.cssText =
        "box-sizing:border-box;height:28px;padding:0 12px;border-radius:999px;" +
        "font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;" +
        "border:1px solid " +
        (on ? "#0d9488" : "#94a3b8") +
        ";background:" +
        (on ? "#0d9488" : "#fff") +
        ";color:" +
        (on ? "#fff" : "#0f172a") +
        ";";
      b.addEventListener("click", function () {
        st.titleRank = value;
        applyAndReload(st);
      });
      return b;
    }
    titleChipRow.appendChild(mkTitleChip("すべて", "all"));
    titleChipRow.appendChild(mkTitleChip("役職者", "lead"));
    titleChipRow.appendChild(mkTitleChip("一般", "member"));
    bandFilter.appendChild(titleChipRow);

    var filterRow = document.createElement("div");
    filterRow.style.cssText =
      "display:flex;flex-wrap:wrap;gap:8px;align-items:center;";

    var kwInput = document.createElement("input");
    kwInput.type = "search";
    kwInput.placeholder = "氏名 / 部署 / メール / 社員番号";
    kwInput.value = st.kw || "";
    kwInput.style.cssText =
      "box-sizing:border-box;height:32px;min-width:220px;flex:1;max-width:420px;" +
      "padding:0 10px;border:1px solid #94a3b8;border-radius:6px;font-size:13px;background:#fff;";
    filterRow.appendChild(kwInput);

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
    filterRow.appendChild(btnGo);

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
    filterRow.appendChild(btnOrg);

    var btnClr = document.createElement("button");
    btnClr.type = "button";
    btnClr.textContent = "条件クリア";
    btnClr.setAttribute("aria-label", "検索条件をすべてクリア");
    btnClr.style.cssText = BTN_CLR;
    btnClr.addEventListener("click", function () {
      applyAndReload(defaultState());
    });
    filterRow.appendChild(btnClr);
    bandFilter.appendChild(filterRow);
    wrap.appendChild(bandFilter);

    /* —— 帯2: 状況（いまの条件＋件数＋人数） —— */
    var bandStatus = mkBand("② いまの条件・件数", "#a78bfa", "#faf8ff");
    var summaryRow = document.createElement("div");
    summaryRow.style.cssText =
      "display:flex;flex-wrap:wrap;gap:8px;align-items:stretch;";

    var activeSummary = document.createElement("div");
    activeSummary.setAttribute("aria-live", "polite");
    activeSummary.style.cssText =
      "flex:1;min-width:200px;margin:0;padding:10px 12px;border-radius:8px;" +
      "border:1px solid #c4b5fd;background:#fff;" +
      "font-size:13px;font-weight:700;color:#0f172a;line-height:1.5;";
    activeSummary.textContent = activeConditionLine(st);

    var matchCountEl = document.createElement("div");
    matchCountEl.setAttribute("aria-live", "polite");
    matchCountEl.style.cssText =
      "flex:0 0 auto;margin:0;padding:10px 14px;border-radius:8px;" +
      "border:1px solid #c4b5fd;background:#fff;" +
      "font-size:14px;font-weight:800;color:#0f172a;line-height:1.5;white-space:nowrap;" +
      "display:flex;align-items:center;";
    matchCountEl.textContent = "該当件数: …";

    var peopleEl = document.createElement("div");
    peopleEl.setAttribute("aria-live", "polite");
    peopleEl.style.cssText =
      "flex:0 0 auto;margin:0;padding:10px 14px;border-radius:8px;" +
      "border:1px solid #86efac;background:#f0fdf4;" +
      "font-size:14px;font-weight:800;color:#14532d;line-height:1.5;white-space:nowrap;" +
      "display:flex;align-items:center;";
    peopleEl.textContent = "人数（本務）…";

    summaryRow.appendChild(activeSummary);
    summaryRow.appendChild(matchCountEl);
    summaryRow.appendChild(peopleEl);
    bandStatus.appendChild(summaryRow);

    var conf = document.createElement("div");
    conf.style.cssText = "color:#991b1b;font-size:11px;font-weight:600;";
    conf.textContent = "【機密】Excel・印刷は社内管理目的";
    bandStatus.appendChild(conf);
    wrap.appendChild(bandStatus);

    /* —— 帯3: 副操作 —— */
    var bandActions = mkBand("③ 操作（部追加・並び・集計・出力）", "#7dd3fc", "#f0f9ff");
    var actionRow = document.createElement("div");
    actionRow.style.cssText =
      "display:flex;flex-wrap:wrap;gap:8px;align-items:center;";

    var btnSection = document.createElement("button");
    btnSection.type = "button";
    btnSection.textContent = "部追加";
    btnSection.setAttribute("aria-label", "部／室を個別・一括で設定");
    btnSection.style.cssText = BTN_SEC;
    btnSection.addEventListener("click", function () {
      openSectionAssignModal();
    });
    actionRow.appendChild(btnSection);

    var btnReorder = document.createElement("button");
    btnReorder.type = "button";
    btnReorder.textContent = "並び替え";
    btnReorder.style.cssText = BTN_SEC;
    actionRow.appendChild(btnReorder);

    var btnAgg = document.createElement("button");
    btnAgg.type = "button";
    btnAgg.textContent = "集計表";
    btnAgg.style.cssText = BTN_SEC;
    actionRow.appendChild(btnAgg);

    var btnExcel = document.createElement("button");
    btnExcel.type = "button";
    btnExcel.textContent = "Excel";
    btnExcel.style.cssText = BTN_SKY;
    actionRow.appendChild(btnExcel);

    var btnPrint = document.createElement("button");
    btnPrint.type = "button";
    btnPrint.textContent = "印刷";
    btnPrint.style.cssText = BTN_PRI;
    actionRow.appendChild(btnPrint);

    var buildEl = document.createElement("span");
    buildEl.style.cssText =
      "margin-left:auto;color:#94a3b8;font-size:11px;align-self:center;";
    buildEl.textContent = BUILD;
    actionRow.appendChild(buildEl);
    bandActions.appendChild(actionRow);
    wrap.appendChild(bandActions);

    mountRosterPager(wrap, st, built || null);
    mountRosterPagerExtras(st, built || null);

    if (space.firstChild) space.insertBefore(wrap, space.firstChild);
    else space.appendChild(wrap);

    var uiOpen = loadUiOpen();
    var queryBase = buildQuery(st);
    var recordsP = fetchRecordsByQuery(queryBase).then(function (recs) {
      return filterRecordsByTitleRank776(recs, st.titleRank);
    });

    if (st.titleRank === "lead" || st.titleRank === "member") {
      fetchFilteredIds(st)
        .then(function (ids) {
          matchCountEl.textContent = "該当件数: " + ids.length + "件";
        })
        .catch(function (err) {
          console.warn("[jbis 776 match count title]", err);
          matchCountEl.textContent = "該当件数: —";
        });
    } else {
      fetchMatchCount(queryBase)
        .then(function (n) {
          matchCountEl.textContent = "該当件数: " + n + "件";
        })
        .catch(function (err) {
          console.warn("[jbis 776 match count]", err);
          matchCountEl.textContent = "該当件数: —";
        });
    }

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
        peopleEl.style.borderColor = "#fca5a5";
        peopleEl.style.background = "#fef2f2";
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
    title.textContent = "並び替え（名前検索 → 基準の上／下／部署末尾）";
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

    function selectedLabel(sel) {
      var opt = sel.options[sel.selectedIndex];
      if (!opt || !opt.value) return "";
      var t = String(opt.textContent || "");
      var slash = t.indexOf("／");
      return slash >= 0 ? t.slice(0, slash).trim() : t.trim();
    }

    function mkAction(text, place, tone) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      var bg = tone === "amber" ? "#c2410c" : "#0f766e";
      var bd = tone === "amber" ? "#9a3412" : "#0f766e";
      b.style.cssText =
        "padding:7px 14px;font-size:13px;border:1px solid " +
        bd +
        ";border-radius:6px;background:" +
        bg +
        ";color:#fff;cursor:pointer;font-weight:600;";
      b.addEventListener("click", function () {
        runPlace(place);
      });
      return b;
    }
    var btnAbove = mkAction("基準の上に置く", "above");
    var btnBelow = mkAction("基準の下に置く", "below");
    var btnDeptEnd = mkAction("基準の部署の末尾へ", "dept-end", "amber");
    actions.appendChild(btnAbove);
    actions.appendChild(btnBelow);
    actions.appendChild(btnDeptEnd);
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
      btnDeptEnd.disabled = true;
      var moverName = selectedLabel(mover.sel);
      var job =
        place === "dept-end"
          ? placeMoverAtDeptEnd(m, a)
          : placeMoverRelative(m, a, place);
      job
        .then(function (res) {
          var msg =
            place === "dept-end"
              ? "完了（" + (res.dept || "部署") + " 末尾・順 " + res.at + "）。再読込…"
              : "完了（順 " + res.at + "）。再読込…";
          status.textContent = msg;
          status.style.color = "#047857";
          rememberScrollAfterReorder({ id: m, name: moverName, at: res.at });
          setTimeout(function () {
            try {
              sessionStorage.removeItem("jbis776-idcache-v1");
              sessionStorage.removeItem("jbis776-idcache-v2");
              sessionStorage.removeItem(ID_CACHE_KEY);
            } catch (eCache) {
              /* noop */
            }
            fetchFilteredSortMeta(st)
              .then(function (meta) {
                var idx = meta.ids.indexOf(String(m));
                var ps = st.pageSize || 40;
                var page = idx >= 0 ? Math.floor(idx / ps) + 1 : st.page || 1;
                return goRosterPage(st, page);
              })
              .catch(function (err) {
                console.warn("[jbis 776 reorder reload]", err);
                navigate(buildQuery(st));
              });
          }, 350);
        })
        .catch(function (err) {
          console.warn("[jbis 776 reorder]", err);
          status.textContent =
            "並び替え失敗: " + ((err && err.message) || "権限を確認");
          status.style.color = "#b91c1c";
          btnAbove.disabled = false;
          btnBelow.disabled = false;
          btnDeptEnd.disabled = false;
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
      // event.size は「今画面に出ている件数」であり自前 pageSize と混同するとページ送りがずれるため同期しない
      if (!st.pageSize || st.pageSize < 10) {
        st.pageSize = 40;
        saveState(st);
      }

      var curQ = "";
      try {
        curQ = new URL(window.location.href).searchParams.get("query") || "";
      } catch (eUrl) {
        curQ = "";
      }

      // 自前ページ送り: 無フィルタは list_sort 範囲、フィルタ時は $id 分割
      fetchFilteredSortMeta(st)
        .then(function (meta) {
          var built = buildPagedQueryFromIds(
            meta.ids,
            st.page || 1,
            st.pageSize || 40,
            st,
            meta.sorts,
          );
          if (st.page !== built.page) {
            st.page = built.page;
            saveState(st);
          }
          if (!queriesEquivalent(curQ, built.query)) {
            navigate(built.query);
            return;
          }
          var tb = mountToolbar(space, st, built);
          mountReorder(space, st, tb.uiOpen);
          mountAggPanel(space, st, tb.uiOpen, tb.recordsP);
          applyIndexDeptSeparators(event.records);
          consumeScrollAfterReorder(st);
          // 一覧DOM生成後に下ページ送りを再配置
          setTimeout(function () {
            mountRosterPagerExtras(st, built);
          }, 0);
          setTimeout(function () {
            applyIndexDeptSeparators(event.records);
          }, 0);
          setTimeout(function () {
            applyIndexDeptSeparators(event.records);
          }, 300);
        })
        .catch(function (err) {
          console.warn("[jbis 776 page sync]", err);
          var tb2 = mountToolbar(space, st, null);
          mountReorder(space, st, tb2.uiOpen);
          mountAggPanel(space, st, tb2.uiOpen, tb2.recordsP);
          applyIndexDeptSeparators(event.records);
        });
    } catch (e) {
      console.warn("[jbis 776 index]", e);
    }
    return event;
  });

  kintone.events.on(["app.record.create.show", "app.record.edit.show"], function (event) {
    try {
      window.__jbis776EditOrig = {
        dept: cell(event.record, "dept_name").trim(),
        section: cell(event.record, FC_SECTION).trim(),
      };
      if (event.type.indexOf("create") >= 0) {
        window.__jbis776EditOrig = { dept: "", section: "" };
      }
    } catch (eShow) {
      window.__jbis776EditOrig = { dept: "", section: "" };
    }
    return event;
  });

  kintone.events.on(
    ["app.record.create.submit", "app.record.edit.submit"],
    function (event) {
      return applyListSortOnSubmit776(event);
    }
  );

  kintone.events.on(
    ["app.record.create.submit.success", "app.record.edit.submit.success"],
    function (event) {
      return runPendingSortAfterSave776(event);
    }
  );
})();
