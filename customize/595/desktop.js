(function () {
  "use strict";

  /**
   * 595 社員マスタ
   * BUILD: 2026-08-21-595-sync-roster-776-on-save（保存成功: 1人単位で776名簿 upsert）
   * BUILD: 2026-08-21-595-index-employment-category（一覧: 雇用区分 正社員/準社員/その他/すべて）
   * BUILD: 2026-08-19-595-mirror-674-emp-id（674 個人の空 emp_id を 595 から埋める）
   * BUILD: 2026-08-19-595-skip-715-shared-install（715 共有PC行は社員ミラー対象外）
   * BUILD: 2026-08-13-595-sort-insert-list-ui（表示順モーダル: 部署メンバーリスト選択）
   * BUILD: 2026-08-13-595-sort-insert-picker（新規/異動: 表示順挿入モーダル・sort 自動採番）
   * BUILD: 2026-08-13-595-index-match-count（一覧: 該当件数表示・sessionStorage 復元）
   * BUILD: 2026-08-13-595-index-pc-filter-id（PCあり=pc_674_record_id 数字あり。空サブテーブル行はPCなし）
   * BUILD: 2026-08-13-595-index-pc-filter-ui（一覧: PCあり/なし絞込・フィルタUI整理）
   * BUILD: 2026-08-13-595-drop-594-subtable-refs（削除済み594サブテーブル pc_ledger_list / pc_594_record_id 参照を除去）
   * BUILD: 2026-06-30-595-bulk-log-no-dup（一括反映ログは最終行のみ・ステータスは完了表示）
   * BUILD: 2026-06-30-595-bulk-downstream-btn（一覧: 台帳へ一括反映ボタン・CSV取込後用）
   * BUILD: 2026-06-30-595-674-mirror-emp-subtable（674ミラー: mail＋emp_id＋サブテーブル紐づけ）
   * BUILD: 2026-06-17-595-emp-id-auto-assign（新規/未付番保存時に EMP-xxxx 自動採番）
   * BUILD: 2026-06-14-595-storage-media-ledger-mirror
   * BUILD: 2026-05-12-595-no594-rest（旧594への REST・リンク廃止・674同期のみ）
   * BUILD: 2026-05-30-595-retire-674-storage（退職→退職日自動・674保管連動）
   * BUILD: 2026-07-04-595-index-emp-dept-filters（一覧: 在籍/退職・所属/所属グループ絞込）
   * - 一覧: 所属グループ・所属名・社員名のいずれかに部分一致する検索窓（ヘッダスペース）
   * - 詳細・編集: サブテーブル（674）からレコードへのリンクをヘッダ下に表示
   * - 保存: 在籍=退職かつ退職日空→当日を退職日に設定／**emp_id 空なら EMP-xxxx 自動採番**
   * - 保存成功後: 退職時は 674 を保管＋アカウントクリア＋備考追記＋**595 側 PC台帳リンク解除**／それ以外は 674・714・716 所属ミラー
   * - 一覧: 「台帳へ一括反映」— CSV 取込後など 674／714／716 へ所属ミラー（退職者除外）
   * - 新規・編集: 680 所属候補マスタから所属名・所属グループを選ぶモーダル（手入力も可）
   * - 新規/異動保存: 「どこに入れますか？」モーダルで sort を確定（月次 CSV 振り直し不要）
   */

  var BUILD = "2026-08-21-595-sync-roster-776-on-save";

  /** 新・PC台帳 所属候補マスタ（674 共有・JR と共用） */
  var APP_DEPT_MASTER_595 = "680";
  /** 新・PC台帳 ver.1（674） */
  var APP674 = "674";
  /** ソフトウエア台帳 DB（714）— 595 所属ミラー */
  var APP_SOFTWARE_DB = "714";
  /** 記憶媒体等台帳 DB — 595 所属ミラー（作成後に appId を更新） */
  var APP_STORAGE_MEDIA_DB = "716";
  /** 社員名簿（Space48・595投影） */
  var APP_ROSTER_776 = "776";
  /** M365 管理マスタ（674 退職連動後の usage_count 再計算） */
  var APP671 = "671";

  var FC595_MAIL = "mail";
  var FC595_NAME = "user_name";
  var FC595_DEPT = "dept_name";
  var FC595_GROUP = "group_name";
  var FC595_EMP = "employment_status";
  var FC595_CAT = "employment_category";
  var FC595_EMP_NO = "employee_no";
  var FC595_JOB = "job_title";
  var FC595_CONCURRENT = "concurrent_posts";
  var FC595_CP_DEPT = "cp_dept_name";
  var FC595_CP_GROUP = "cp_group_name";
  var FC595_CP_TITLE = "cp_title";
  var FC595_EMP_ID = "emp_id";
  var CAT_SEISHAIN = "正社員";
  var CAT_JUNSHAIN = "準社員";
  var CAT_SONOTA = "その他";
  var ROSTER_SORT_SCALE = 10;
  var FC595_RETIRED = "retired_date";
  var FC595_SORT = "sort";
  /** 業務改善 設定マスタ — 595 台帳一括反映ログ（共通設定行） */
  var APP_SETTINGS_697 = "697";
  var FC697_BULK_LOG = "bulk_downstream_595_log";

  var FC674_MAIL = "mail";
  var FC674_NAME = "user_name";
  var FC674_DEPT = "dept_name";
  var FC674_GROUP = "group_name";
  var FC674_EMP_ID = "emp_id";
  var FC674_TYPE = "account_type";
  var FC674_PC_STATUS = "pc_status";
  var FC674_LOGON = "logon_name";
  var FC674_LOGON_PW = "logon_pw";
  var FC674_WIN_NAME = "windows_name";
  var FC674_MAIL_ACCT = "mail_acct";
  var FC674_MAIL_PW = "mail_pw";
  var FC674_M365_ID = "m365_id";
  var FC674_M365_PW = "m365_pw";
  var FC674_M365_MASTER = "m365_master_record_id";
  var FC674_M365_KIRIKAE = "M365_kirikae";
  var FC674_GB_ID = "gb_id";
  var FC674_GB_PW = "gb_pw";
  var FC674_SB_ID = "sb_id";
  var FC674_SB_PW = "sb_pw";
  var FC674_VPN_ID = "vpn_id";
  var FC674_VPN_PW = "vpn_pw";
  var FC674_SHARED_TERM = "shared_terminal_name";
  var FC674_NOTE = "note";
  var FC_SWL_NAME = "user_name";
  var FC_SWL_DEPT = "dept_name";
  var FC_SWL_GROUP = "group_name";
  var FC_SWL_EMP_ID = "emp_id";
  var FC_SWL_STATUS = "status";
  var SWL_STATUS_ACTIVE = "利用中";
  var TYPE_PERSONAL = "個人";
  var PC_STATUS_STORAGE = "保管";
  var PC_STATUS_DISPOSED = "廃棄";
  var EMP_RETIRED = "退職";
  var EMP_ACTIVE = "在籍";

  /** 595 上の 新・PC台帳（674） */
  var FC595_PC674_SUB = "pc_ledger_v1_list";
  var FC595_PC674_ID = "pc_674_record_id";

  var LINK_BOX_ID = "jbis-595-pc-ledger-link-box";
  var DEPT_PICKER_WRAP_ID = "jbis-595-dept-picker-wrap";
  var DEPT_MASTER_MODAL_ID_595 = "jbis-595-dept-master-modal";
  var SORT_INSERT_MODAL_ID_595 = "jbis-595-sort-insert-modal";
  var INDEX_SEARCH_WRAP_ID = "jbis-595-index-search-wrap";
  var BULK_DOWNSTREAM_WRAP_ID = "jbis-595-bulk-downstream-wrap";
  var BULK_DOWNSTREAM_STATUS_ID = "jbis-595-bulk-downstream-status";
  var BULK_DOWNSTREAM_LASTLOG_ID = "jbis-595-bulk-downstream-lastlog";
  var STORAGE_KEY_595_BULK_LOG = "jbis595-bulk-downstream-last-log";
  var STORAGE_KEY_595_IDX_KW = "jbis595-index-search-kw";
  var STORAGE_KEY_595_IDX_EMP = "jbis595-index-search-emp";
  var STORAGE_KEY_595_IDX_DEPT = "jbis595-index-search-dept";
  var STORAGE_KEY_595_IDX_GROUP = "jbis595-index-search-group";
  var STORAGE_KEY_595_IDX_PC = "jbis595-index-search-pc";
  var STORAGE_KEY_595_IDX_CAT = "jbis595-index-search-cat";
  var STORAGE_KEY_595_IDX_COUNT = "jbis595-index-search-count";
  var INDEX_SEARCH_MAX_IDS = 800;
  /** 一覧クライアント検索で全件取得する上限（超えたら標準絞り込みへ誘導） */
  var INDEX_SEARCH_FULL_SCAN_MAX_RECORDS = 2000;

  function getIndexHeaderSpace595() {
    return (
      (typeof kintone !== "undefined" &&
        kintone.app &&
        kintone.app.getHeaderSpaceElement &&
        kintone.app.getHeaderSpaceElement()) ||
      (typeof kintone !== "undefined" &&
        kintone.mobile &&
        kintone.mobile.app &&
        kintone.mobile.app.getHeaderSpaceElement &&
        kintone.mobile.app.getHeaderSpaceElement()) ||
      null
    );
  }

  function scalar595ForSearch(r, code) {
    var f = r[code];
    if (!f || f.value === undefined || f.value === null) {
      return "";
    }
    return String(f.value);
  }

  function record595MatchesSubstring(r, kwLower) {
    if (!kwLower) {
      return true;
    }
    var g = scalar595ForSearch(r, FC595_GROUP).toLowerCase();
    var d = scalar595ForSearch(r, FC595_DEPT).toLowerCase();
    var n = scalar595ForSearch(r, FC595_NAME).toLowerCase();
    return g.indexOf(kwLower) !== -1 || d.indexOf(kwLower) !== -1 || n.indexOf(kwLower) !== -1;
  }

  /**
   * PCあり = pc_ledger_v1_list に有効な 674 レコードID（数字）がある。
   * 空行だけのサブテーブルは PCなし（出向者などで空行が残ることがある）。
   */
  function record595HasPcLink(r) {
    var f = r[FC595_PC674_SUB];
    if (!f || !Array.isArray(f.value)) {
      return false;
    }
    for (var i = 0; i < f.value.length; i++) {
      var row = f.value[i];
      var cell = row && row.value ? row.value[FC595_PC674_ID] : null;
      if (!cell || cell.value === undefined || cell.value === null) {
        continue;
      }
      var id = String(cell.value).trim();
      if (/^\d+$/.test(id) && id !== "0") {
        return true;
      }
    }
    return false;
  }

  function fetchAll595RecordsForIndexSearch(appId, filterQuery) {
    var fields = ["$id", FC595_GROUP, FC595_DEPT, FC595_NAME, FC595_EMP, FC595_PC674_SUB];
    var all = [];
    var limit = 500;
    var url = kintone.api.url("/k/v1/records.json", true);
    var base = String(filterQuery || "").trim();
    function page(offset) {
      var query =
        (base ? base + " " : "") + "order by $id asc limit " + limit + " offset " + offset;
      return kintone.api(url, "GET", { app: appId, query: query, fields: fields }).then(function (resp) {
        var batch = resp.records || [];
        for (var i = 0; i < batch.length; i++) {
          all.push(batch[i]);
        }
        if (batch.length < limit) {
          return all;
        }
        return page(offset + limit);
      });
    }
    return page(0);
  }

  function fetch595RecordTotalCount(appId, filterQuery) {
    var url = kintone.api.url("/k/v1/records.json", true);
    var q = (String(filterQuery || "").trim() ? String(filterQuery).trim() + " " : "") + "limit 1";
    return kintone
      .api(url, "GET", {
        app: appId,
        query: q,
        fields: ["$id"],
        totalCount: true
      })
      .then(function (resp) {
        return resp.totalCount != null ? Number(resp.totalCount) : 0;
      });
  }

  function build595IndexServerFilterQuery(empFilter, dept, group, catFilter) {
    var parts = [];
    if (empFilter === "active") {
      parts.push('employment_status in ("' + escapeForQuery(EMP_ACTIVE) + '")');
    } else if (empFilter === "retired") {
      parts.push('employment_status in ("' + escapeForQuery(EMP_RETIRED) + '")');
    }
    if (catFilter === "seishain") {
      parts.push('employment_category in ("' + escapeForQuery(CAT_SEISHAIN) + '")');
    } else if (catFilter === "junshain") {
      parts.push('employment_category in ("' + escapeForQuery(CAT_JUNSHAIN) + '")');
    } else if (catFilter === "sonota") {
      parts.push('employment_category in ("' + escapeForQuery(CAT_SONOTA) + '")');
    }
    var d = String(dept || "").trim();
    if (d) {
      parts.push('dept_name = "' + escapeForQuery(d) + '"');
    }
    var g = String(group || "").trim();
    if (g) {
      parts.push('group_name = "' + escapeForQuery(g) + '"');
    }
    return parts.join(" and ");
  }

  function save595IndexFilterSession595(empFilter, dept, group, kw, pcFilter, catFilter) {
    try {
      sessionStorage.setItem(STORAGE_KEY_595_IDX_EMP, String(empFilter || "all"));
      sessionStorage.setItem(STORAGE_KEY_595_IDX_PC, String(pcFilter || "all"));
      sessionStorage.setItem(STORAGE_KEY_595_IDX_CAT, String(catFilter || "all"));
      sessionStorage.setItem(STORAGE_KEY_595_IDX_DEPT, String(dept || ""));
      sessionStorage.setItem(STORAGE_KEY_595_IDX_GROUP, String(group || ""));
      if (kw) {
        sessionStorage.setItem(STORAGE_KEY_595_IDX_KW, kw);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_595_IDX_KW);
      }
    } catch (eSs) {
      /* noop */
    }
  }

  function clear595IndexFilterSession595() {
    try {
      sessionStorage.removeItem(STORAGE_KEY_595_IDX_KW);
      sessionStorage.removeItem(STORAGE_KEY_595_IDX_EMP);
      sessionStorage.removeItem(STORAGE_KEY_595_IDX_PC);
      sessionStorage.removeItem(STORAGE_KEY_595_IDX_CAT);
      sessionStorage.removeItem(STORAGE_KEY_595_IDX_DEPT);
      sessionStorage.removeItem(STORAGE_KEY_595_IDX_GROUP);
      sessionStorage.removeItem(STORAGE_KEY_595_IDX_COUNT);
    } catch (eSs) {
      /* noop */
    }
  }

  /** nOrNull: number → 該当件数:N件＋session保存 / undefined → … / null → —＋session削除 */
  function set595IndexMatchCount595(nOrNull) {
    var el = document.getElementById("jbis-595-index-match-count");
    if (el) {
      if (typeof nOrNull === "number" && isFinite(nOrNull)) {
        el.textContent = "該当件数: " + nOrNull + "件";
      } else if (nOrNull === null) {
        el.textContent = "該当件数: —";
      } else {
        el.textContent = "該当件数: …";
      }
    }
    try {
      if (typeof nOrNull === "number" && isFinite(nOrNull)) {
        sessionStorage.setItem(STORAGE_KEY_595_IDX_COUNT, String(nOrNull));
      } else if (nOrNull === null) {
        sessionStorage.removeItem(STORAGE_KEY_595_IDX_COUNT);
      }
    } catch (eSs) {
      /* noop */
    }
  }

  function emp595FilterLabel595(v) {
    if (v === "active") {
      return "在籍";
    }
    if (v === "retired") {
      return "退職";
    }
    return "すべて";
  }

  function cat595FilterLabel595(v) {
    if (v === "seishain") {
      return "正社員";
    }
    if (v === "junshain") {
      return "準社員";
    }
    if (v === "sonota") {
      return "その他";
    }
    return "雇用すべて";
  }

  function pc595FilterLabel595(v) {
    if (v === "has") {
      return "PCあり";
    }
    if (v === "none") {
      return "PCなし";
    }
    return "PCすべて";
  }

  function update595IndexFilterSummary595() {
    var el = document.getElementById("jbis-595-index-filter-summary");
    var wrap = document.getElementById(INDEX_SEARCH_WRAP_ID);
    if (!el || !wrap) {
      return;
    }
    var empBtn = wrap.querySelector("[data-595-emp-filter].active");
    var catBtn = wrap.querySelector("[data-595-cat-filter].active");
    var pcBtn = wrap.querySelector("[data-595-pc-filter].active");
    var selDept = wrap.querySelector('select[data-595-dept="1"]');
    var selGroup = wrap.querySelector('select[data-595-group="1"]');
    var input = wrap.querySelector('input[type="search"]');
    var emp = empBtn ? empBtn.getAttribute("data-595-emp-filter") || "active" : "active";
    var cat = catBtn ? catBtn.getAttribute("data-595-cat-filter") || "all" : "all";
    var pc = pcBtn ? pcBtn.getAttribute("data-595-pc-filter") || "all" : "all";
    var dept = selDept ? String(selDept.value || "").trim() : "";
    var group = selGroup ? String(selGroup.value || "").trim() : "";
    var kw = input ? String(input.value || "").trim() : "";
    var parts = [emp595FilterLabel595(emp)];
    if (cat === "seishain" || cat === "junshain" || cat === "sonota") {
      parts.push(cat595FilterLabel595(cat));
    }
    if (pc === "has" || pc === "none") {
      parts.push(pc595FilterLabel595(pc));
    }
    if (dept) {
      parts.push("所属:" + dept);
    }
    if (group) {
      parts.push("所属G:" + group);
    }
    if (kw) {
      parts.push("検索:" + kw);
    }
    el.textContent = parts.join(" × ");
  }

  function build595IdInQuery(ids) {
    if (!ids || !ids.length) {
      return '$id in ("0")';
    }
    var parts = [];
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i]).trim();
      if (!id) {
        continue;
      }
      parts.push('"' + escapeForQuery(id) + '"');
    }
    if (!parts.length) {
      return '$id in ("0")';
    }
    return "$id in (" + parts.join(",") + ")";
  }

  function strip595ListFilterParamsFromUrl595(u) {
    u.searchParams.delete("query");
    u.searchParams.delete("q");
    try {
      if (!u.hash) {
        return;
      }
      var hp = new URLSearchParams(u.hash.replace(/^#/, ""));
      hp.delete("query");
      hp.delete("q");
      var rest = hp.toString();
      u.hash = rest ? "#" + rest : "";
    } catch (eHash) {
      /* noop */
    }
  }

  function navigate595IndexList595(queryStr) {
    var u;
    try {
      u = new URL(window.location.href);
    } catch (eUrl) {
      return;
    }
    var q = String(queryStr || "").trim();
    if (q) {
      u.searchParams.set("query", q);
      u.searchParams.delete("q");
    } else {
      strip595ListFilterParamsFromUrl595(u);
    }
    try {
      window.location.replace(u.toString());
    } catch (eNav) {
      window.location.href = u.toString();
    }
  }

  var npl595IndexHydrateTimer = null;
  function request595IndexSearchHydrate595() {
    if (npl595IndexHydrateTimer) {
      clearTimeout(npl595IndexHydrateTimer);
    }
    npl595IndexHydrateTimer = setTimeout(function () {
      npl595IndexHydrateTimer = null;
      try {
        sync595IndexSearchFromKintoneCondition595();
      } catch (eSync) {
        /* noop */
      }
    }, 80);
  }

  /** 実効絞り込みが空なのに URL に query / q が残るとき除去（Ocean SPA の条件クリア対策） */
  function sync595IndexSearchFromKintoneCondition595() {
    var wrap = document.getElementById(INDEX_SEARCH_WRAP_ID);
    if (!wrap) {
      return false;
    }
    var input = wrap.querySelector('input[type="search"]');
    var cond = null;
    try {
      if (kintone.app && typeof kintone.app.getQueryCondition === "function") {
        cond = kintone.app.getQueryCondition();
      } else if (
        kintone.mobile &&
        kintone.mobile.app &&
        typeof kintone.mobile.app.getQueryCondition === "function"
      ) {
        cond = kintone.mobile.app.getQueryCondition();
      }
    } catch (eCond) {
      return false;
    }
    if (cond === null) {
      return false;
    }
    if (String(cond || "").trim()) {
      return false;
    }
    if (input) {
      input.value = "";
    }
    var empBtns = wrap.querySelectorAll("[data-595-emp-filter]");
    empBtns.forEach(function (b) {
      var on = b.getAttribute("data-595-emp-filter") === "active";
      b.classList.toggle("active", on);
      b.style.background = on ? "#059669" : "#fff";
      b.style.color = on ? "#fff" : "";
      b.style.borderColor = on ? "#059669" : "#cbd5e1";
      b.style.fontWeight = on ? "700" : "";
    });
    var pcBtns = wrap.querySelectorAll("[data-595-pc-filter]");
    pcBtns.forEach(function (b) {
      var on = b.getAttribute("data-595-pc-filter") === "all";
      b.classList.toggle("active", on);
      b.style.background = on ? "#1d4ed8" : "#fff";
      b.style.color = on ? "#fff" : "";
      b.style.borderColor = on ? "#1d4ed8" : "#cbd5e1";
      b.style.fontWeight = on ? "700" : "";
    });
    var selDept = wrap.querySelector('select[data-595-dept="1"]');
    var selGroup = wrap.querySelector('select[data-595-group="1"]');
    if (selDept) {
      selDept.value = "";
    }
    if (selGroup) {
      selGroup.value = "";
    }
    update595IndexFilterSummary595();
    set595IndexMatchCount595(null);
    clear595IndexFilterSession595();
    var u;
    try {
      u = new URL(window.location.href);
    } catch (eUrl) {
      return false;
    }
    if (!u.searchParams.has("query") && !u.searchParams.has("q")) {
      return false;
    }
    strip595ListFilterParamsFromUrl595(u);
    try {
      window.location.replace(u.toString());
    } catch (eNav) {
      window.location.href = u.toString();
    }
    return true;
  }

  var npl595NativeClearListen595 = false;
  function ensure595IndexSearchNativeClearListener595() {
    if (npl595NativeClearListen595) {
      return;
    }
    npl595NativeClearListen595 = true;
    document.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || !t.closest) {
          return;
        }
        var el = t.closest('button, a, [role="button"]');
        if (!el) {
          return;
        }
        var blob =
          String(el.textContent || "") +
          " " +
          String(el.getAttribute("aria-label") || "") +
          " " +
          String(el.getAttribute("title") || "");
        var hasClear = blob.indexOf("クリア") !== -1 || /\bclear\b/i.test(blob);
        var hasCondWord =
          blob.indexOf("条件") !== -1 ||
          blob.indexOf("絞り込み") !== -1 ||
          blob.indexOf("フィルタ") !== -1 ||
          /\bfilter\b/i.test(blob);
        if (!hasClear || !hasCondWord) {
          return;
        }
        [120, 400, 900].forEach(function (ms) {
          setTimeout(request595IndexSearchHydrate595, ms);
        });
      },
      true
    );
  }

  var npl595IndexUrlListeners595 = false;
  function ensure595IndexSearchUrlListeners595() {
    if (npl595IndexUrlListeners595) {
      return;
    }
    npl595IndexUrlListeners595 = true;
    window.addEventListener("popstate", request595IndexSearchHydrate595);
    window.addEventListener("hashchange", request595IndexSearchHydrate595);
  }

  /**
   * 一覧を在籍/退職・雇用区分・所属・所属グループ・PC紐づけ・キーワードで絞り込む。
   * キーワード・PCあり/なしは部分一致/サブテーブル判定のため取得後にブラウザ側で判定。
   */
  function navigate595IndexOrSearch(opts, btnSearch, btnClear) {
    var o = opts || {};
    var kw = String(o.keyword || "").trim();
    var empFilter = String(o.empFilter || "all");
    var catFilter = String(o.catFilter || "all");
    var pcFilter = String(o.pcFilter || "all");
    var dept = String(o.dept || "").trim();
    var group = String(o.group || "").trim();
    var filterQuery = build595IndexServerFilterQuery(empFilter, dept, group, catFilter);
    var hasServerFilter = !!filterQuery;
    var needsClient = !!(kw || pcFilter === "has" || pcFilter === "none");

    function setBusy(b) {
      if (btnSearch) {
        btnSearch.disabled = !!b;
        btnSearch.textContent = b ? "検索中…" : btnSearch.getAttribute("data-label-search") || "検索";
      }
      if (btnClear) {
        btnClear.disabled = !!b;
      }
      var st = document.getElementById("jbis-595-index-search-status");
      if (st) {
        st.textContent = b ? "一覧を取得しています…" : "";
      }
    }

    if (!hasServerFilter && !needsClient) {
      set595IndexMatchCount595(null);
      clear595IndexFilterSession595();
      navigate595IndexList595("");
      return;
    }

    if (!needsClient && hasServerFilter) {
      save595IndexFilterSession595(empFilter, dept, group, "", pcFilter, catFilter);
      setBusy(true);
      set595IndexMatchCount595(undefined);
      fetch595RecordTotalCount(kintone.app.getId(), filterQuery)
        .then(function (tc) {
          set595IndexMatchCount595(tc);
          setBusy(false);
          navigate595IndexList595(filterQuery + " order by レコード番号 asc");
        })
        .catch(function (e) {
          setBusy(false);
          set595IndexMatchCount595(null);
          window.alert(
            "件数の取得に失敗しました。" + (e && e.message ? "\n" + e.message : "")
          );
        });
      return;
    }

    var appId = kintone.app.getId();
    setBusy(true);
    fetch595RecordTotalCount(appId, filterQuery)
      .then(function (tc) {
        if (tc > INDEX_SEARCH_FULL_SCAN_MAX_RECORDS) {
          setBusy(false);
          window.alert(
            "該当候補が " +
              tc +
              " 件あり、一覧検索の取得上限（" +
              INDEX_SEARCH_FULL_SCAN_MAX_RECORDS +
              " 件）を超えています。所属・在籍で絞り込むか、キーワードを具体化してください。"
          );
          return null;
        }
        return fetchAll595RecordsForIndexSearch(appId, filterQuery);
      })
      .then(function (records) {
        if (!records) {
          return;
        }
        var lower = kw.toLowerCase();
        var ids = [];
        for (var i = 0; i < records.length; i++) {
          var r = records[i];
          if (kw && !record595MatchesSubstring(r, lower)) {
            continue;
          }
          if (pcFilter === "has" && !record595HasPcLink(r)) {
            continue;
          }
          if (pcFilter === "none" && record595HasPcLink(r)) {
            continue;
          }
          var idCell = r.$id;
          var rid = idCell && idCell.value != null ? String(idCell.value).trim() : "";
          if (rid) {
            ids.push(rid);
          }
        }
        var matchCount = ids.length;
        var truncated = false;
        if (ids.length > INDEX_SEARCH_MAX_IDS) {
          ids = ids.slice(0, INDEX_SEARCH_MAX_IDS);
          truncated = true;
        }
        var q = build595IdInQuery(ids);
        save595IndexFilterSession595(empFilter, dept, group, kw, pcFilter, catFilter);
        set595IndexMatchCount595(matchCount);
        if (truncated) {
          window.alert(
            "該当が" +
              INDEX_SEARCH_MAX_IDS +
              "件を超えました。先頭" +
              INDEX_SEARCH_MAX_IDS +
              "件のみ表示します。条件を具体化してください。"
          );
        }
        setBusy(false);
        navigate595IndexList595(q + " order by レコード番号 asc");
      })
      .catch(function (e) {
        setBusy(false);
        window.alert("検索用データの取得に失敗しました。" + (e && e.message ? "\n" + e.message : ""));
      });
  }

  function mount595IndexSearchBox() {
    if (document.getElementById(INDEX_SEARCH_WRAP_ID)) {
      return;
    }
    var space = getIndexHeaderSpace595();
    if (!space) {
      return;
    }

    var wrap = document.createElement("div");
    wrap.id = INDEX_SEARCH_WRAP_ID;
    wrap.style.cssText =
      "display:flex;flex-direction:column;align-items:stretch;gap:10px;margin:0 0 12px;padding:10px 14px;" +
      "background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;";

    var chipPanelStyle =
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px;width:100%;" +
      "background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;box-sizing:border-box;";

    var rowTitle = document.createElement("div");
    rowTitle.style.cssText =
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;width:100%;";
    var titleLabel = document.createElement("span");
    titleLabel.style.cssText = "font-weight:700;color:#0f172a;font-size:14px;white-space:nowrap;";
    titleLabel.textContent = "絞り込み";
    rowTitle.appendChild(titleLabel);
    var filterSummary = document.createElement("span");
    filterSummary.id = "jbis-595-index-filter-summary";
    filterSummary.style.cssText = "color:#475569;font-size:12px;flex:1;min-width:120px;";
    rowTitle.appendChild(filterSummary);
    var matchCountEl = document.createElement("div");
    matchCountEl.id = "jbis-595-index-match-count";
    matchCountEl.setAttribute("aria-live", "polite");
    matchCountEl.style.cssText =
      "flex:0 0 auto;margin:0;padding:10px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;" +
      "font-size:14px;font-weight:800;color:#0f172a;line-height:1.5;white-space:nowrap;";
    matchCountEl.textContent = "該当件数: …";
    rowTitle.appendChild(matchCountEl);
    wrap.appendChild(rowTitle);

    var empFilterState = "active";
    var catFilterState = "all";
    var pcFilterState = "all";

    function applyEmpChipStyles595(container, value) {
      container.querySelectorAll("[data-595-emp-filter]").forEach(function (btn) {
        var on = btn.getAttribute("data-595-emp-filter") === value;
        btn.classList.toggle("active", on);
        btn.style.background = on ? "#059669" : "#fff";
        btn.style.color = on ? "#fff" : "";
        btn.style.borderColor = on ? "#059669" : "#cbd5e1";
        btn.style.fontWeight = on ? "700" : "";
      });
    }

    function applyCatChipStyles595(container, value) {
      container.querySelectorAll("[data-595-cat-filter]").forEach(function (btn) {
        var on = btn.getAttribute("data-595-cat-filter") === value;
        btn.classList.toggle("active", on);
        btn.style.background = on ? "#7c3aed" : "#fff";
        btn.style.color = on ? "#fff" : "";
        btn.style.borderColor = on ? "#7c3aed" : "#cbd5e1";
        btn.style.fontWeight = on ? "700" : "";
      });
    }

    function applyPcChipStyles595(container, value) {
      container.querySelectorAll("[data-595-pc-filter]").forEach(function (btn) {
        var on = btn.getAttribute("data-595-pc-filter") === value;
        btn.classList.toggle("active", on);
        btn.style.background = on ? "#1d4ed8" : "#fff";
        btn.style.color = on ? "#fff" : "";
        btn.style.borderColor = on ? "#1d4ed8" : "#cbd5e1";
        btn.style.fontWeight = on ? "700" : "";
      });
    }

    var rowEmp = document.createElement("div");
    rowEmp.style.cssText = chipPanelStyle;
    var empLabel = document.createElement("span");
    empLabel.style.cssText = "font-weight:600;color:#475569;white-space:nowrap;";
    empLabel.textContent = "在籍:";
    rowEmp.appendChild(empLabel);

    function mkEmpBtn(label, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.setAttribute("data-595-emp-filter", value);
      b.style.cssText =
        "padding:6px 14px;font-size:13px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;";
      b.addEventListener("click", function () {
        empFilterState = value;
        applyEmpChipStyles595(rowEmp, value);
        update595IndexFilterSummary595();
      });
      return b;
    }
    rowEmp.appendChild(mkEmpBtn("在籍", "active"));
    rowEmp.appendChild(mkEmpBtn("退職", "retired"));
    rowEmp.appendChild(mkEmpBtn("すべて", "all"));
    applyEmpChipStyles595(rowEmp, empFilterState);
    wrap.appendChild(rowEmp);

    var rowCat = document.createElement("div");
    rowCat.style.cssText = chipPanelStyle;
    var catLabel = document.createElement("span");
    catLabel.style.cssText = "font-weight:600;color:#475569;white-space:nowrap;";
    catLabel.textContent = "雇用区分:";
    rowCat.appendChild(catLabel);

    function mkCatBtn(label, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.setAttribute("data-595-cat-filter", value);
      b.style.cssText =
        "padding:6px 14px;font-size:13px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;";
      b.addEventListener("click", function () {
        catFilterState = value;
        applyCatChipStyles595(rowCat, value);
        update595IndexFilterSummary595();
      });
      return b;
    }
    rowCat.appendChild(mkCatBtn("正社員", "seishain"));
    rowCat.appendChild(mkCatBtn("準社員", "junshain"));
    rowCat.appendChild(mkCatBtn("その他", "sonota"));
    rowCat.appendChild(mkCatBtn("すべて", "all"));
    applyCatChipStyles595(rowCat, catFilterState);
    wrap.appendChild(rowCat);

    var rowPcWrap = document.createElement("div");
    rowPcWrap.style.cssText = "display:flex;flex-direction:column;gap:4px;width:100%;";
    var rowPc = document.createElement("div");
    rowPc.style.cssText = chipPanelStyle;
    var pcLabel = document.createElement("span");
    pcLabel.style.cssText = "font-weight:600;color:#475569;white-space:nowrap;";
    pcLabel.textContent = "PC:";
    rowPc.appendChild(pcLabel);

    function mkPcBtn(label, value) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.setAttribute("data-595-pc-filter", value);
      b.style.cssText =
        "padding:6px 14px;font-size:13px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;";
      b.addEventListener("click", function () {
        pcFilterState = value;
        applyPcChipStyles595(rowPc, value);
        update595IndexFilterSummary595();
      });
      return b;
    }
    rowPc.appendChild(mkPcBtn("PCあり", "has"));
    rowPc.appendChild(mkPcBtn("PCなし", "none"));
    rowPc.appendChild(mkPcBtn("すべて", "all"));
    applyPcChipStyles595(rowPc, pcFilterState);
    rowPcWrap.appendChild(rowPc);
    var pcHint = document.createElement("div");
    pcHint.style.cssText = "color:#94a3b8;font-size:11px;padding:0 2px;";
    pcHint.textContent = "674レコードID（pc_674_record_id）の紐づけ有無。空行だけの行はPCなし";
    rowPcWrap.appendChild(pcHint);
    wrap.appendChild(rowPcWrap);

    var rowSelects = document.createElement("div");
    rowSelects.style.cssText =
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px;width:100%;" +
      "background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;box-sizing:border-box;";

    var deptLabel = document.createElement("span");
    deptLabel.style.cssText = "font-weight:600;color:#475569;white-space:nowrap;";
    deptLabel.textContent = "所属:";
    rowSelects.appendChild(deptLabel);

    var selDept = document.createElement("select");
    selDept.setAttribute("data-595-dept", "1");
    selDept.style.cssText =
      "min-width:140px;max-width:220px;padding:5px 8px;border:1px solid #94a3b8;border-radius:4px;background:#fff;";
    var optDept0 = document.createElement("option");
    optDept0.value = "";
    optDept0.textContent = "（すべて）";
    selDept.appendChild(optDept0);
    rowSelects.appendChild(selDept);

    var grpLabel = document.createElement("span");
    grpLabel.style.cssText = "font-weight:600;color:#475569;white-space:nowrap;";
    grpLabel.textContent = "所属グループ:";
    rowSelects.appendChild(grpLabel);

    var selGroup = document.createElement("select");
    selGroup.setAttribute("data-595-group", "1");
    selGroup.style.cssText =
      "min-width:140px;max-width:220px;padding:5px 8px;border:1px solid #94a3b8;border-radius:4px;background:#fff;";
    var optGrp0 = document.createElement("option");
    optGrp0.value = "";
    optGrp0.textContent = "（すべて）";
    selGroup.appendChild(optGrp0);
    rowSelects.appendChild(selGroup);

    wrap.appendChild(rowSelects);

    var deptMasterIndex595 = { depts: [], groupsByDept: {}, allGroups: [] };

    function fillGroupOptions595(deptVal) {
      while (selGroup.options.length > 1) {
        selGroup.remove(1);
      }
      var list =
        deptVal && deptMasterIndex595.groupsByDept[deptVal]
          ? deptMasterIndex595.groupsByDept[deptVal]
          : deptMasterIndex595.allGroups;
      for (var gi = 0; gi < list.length; gi++) {
        var og = document.createElement("option");
        og.value = list[gi];
        og.textContent = list[gi];
        selGroup.appendChild(og);
      }
    }

    function populate595DeptMasterSelects595() {
      fetchDeptMasterRows595().then(function (rows) {
        var deptSeen = {};
        var grpSeen = {};
        deptMasterIndex595.depts = [];
        deptMasterIndex595.groupsByDept = {};
        deptMasterIndex595.allGroups = [];
        for (var i = 0; i < rows.length; i++) {
          var d = String(rows[i].dept_name || "").trim();
          var g = String(rows[i].group_name || "").trim();
          if (d && !deptSeen[d]) {
            deptSeen[d] = true;
            deptMasterIndex595.depts.push(d);
          }
          if (d) {
            if (!deptMasterIndex595.groupsByDept[d]) {
              deptMasterIndex595.groupsByDept[d] = [];
            }
            if (g && deptMasterIndex595.groupsByDept[d].indexOf(g) === -1) {
              deptMasterIndex595.groupsByDept[d].push(g);
            }
          }
          if (g && !grpSeen[g]) {
            grpSeen[g] = true;
            deptMasterIndex595.allGroups.push(g);
          }
        }
        while (selDept.options.length > 1) {
          selDept.remove(1);
        }
        for (var di = 0; di < deptMasterIndex595.depts.length; di++) {
          var od = document.createElement("option");
          od.value = deptMasterIndex595.depts[di];
          od.textContent = deptMasterIndex595.depts[di];
          selDept.appendChild(od);
        }
        fillGroupOptions595(selDept.value);
        try {
          var sd = sessionStorage.getItem(STORAGE_KEY_595_IDX_DEPT);
          var sg = sessionStorage.getItem(STORAGE_KEY_595_IDX_GROUP);
          if (sd) {
            selDept.value = sd;
            fillGroupOptions595(sd);
          }
          if (sg) {
            selGroup.value = sg;
          }
        } catch (eRestore) {
          /* noop */
        }
        update595IndexFilterSummary595();
      });
    }

    selDept.addEventListener("change", function () {
      fillGroupOptions595(selDept.value);
      selGroup.value = "";
      update595IndexFilterSummary595();
    });
    selGroup.addEventListener("change", function () {
      update595IndexFilterSummary595();
    });

    populate595DeptMasterSelects595();

    var rowSearch = document.createElement("div");
    rowSearch.style.cssText =
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px;width:100%;" +
      "background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;box-sizing:border-box;";

    var label = document.createElement("span");
    label.style.cssText = "font-weight:600;color:#0f172a;white-space:nowrap;";
    label.textContent = "社員検索";
    rowSearch.appendChild(label);

    var hint = document.createElement("span");
    hint.style.cssText = "color:#64748b;font-size:12px;";
    hint.textContent =
      "（所属グループ・所属名・社員名のいずれかに部分一致。英数字も途中から一致します）";
    rowSearch.appendChild(hint);

    var input = document.createElement("input");
    input.type = "search";
    input.setAttribute("autocomplete", "off");
    input.placeholder = "キーワードを入力…";
    input.style.cssText =
      "min-width:200px;max-width:360px;flex:1;padding:6px 10px;border:1px solid #94a3b8;border-radius:4px;";
    rowSearch.appendChild(input);

    var statusLine = document.createElement("span");
    statusLine.id = "jbis-595-index-search-status";
    statusLine.style.cssText = "color:#64748b;font-size:12px;min-width:140px;";
    rowSearch.appendChild(statusLine);

    var btnSearch = document.createElement("button");
    btnSearch.type = "button";
    btnSearch.textContent = "検索";
    btnSearch.setAttribute("data-label-search", "検索");
    btnSearch.style.cssText =
      "padding:6px 14px;background:#1d4ed8;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;";
    rowSearch.appendChild(btnSearch);

    var btnClear = document.createElement("button");
    btnClear.type = "button";
    btnClear.textContent = "条件クリア";
    btnClear.style.cssText =
      "padding:6px 12px;background:#fff;color:#334155;border:1px solid #94a3b8;border-radius:4px;cursor:pointer;";
    rowSearch.appendChild(btnClear);

    wrap.appendChild(rowSearch);

    function collectOpts595() {
      return {
        keyword: input.value,
        empFilter: empFilterState,
        catFilter: catFilterState,
        pcFilter: pcFilterState,
        dept: selDept.value,
        group: selGroup.value
      };
    }

    function run() {
      update595IndexFilterSummary595();
      navigate595IndexOrSearch(collectOpts595(), btnSearch, btnClear);
    }

    btnSearch.addEventListener("click", run);
    btnClear.addEventListener("click", function () {
      input.value = "";
      empFilterState = "active";
      catFilterState = "all";
      pcFilterState = "all";
      applyEmpChipStyles595(rowEmp, "active");
      applyCatChipStyles595(rowCat, "all");
      applyPcChipStyles595(rowPc, "all");
      selDept.value = "";
      fillGroupOptions595("");
      selGroup.value = "";
      update595IndexFilterSummary595();
      set595IndexMatchCount595(null);
      navigate595IndexOrSearch(
        { keyword: "", empFilter: "active", catFilter: "all", dept: "", group: "", pcFilter: "all" },
        btnSearch,
        btnClear
      );
    });
    input.addEventListener("input", function () {
      update595IndexFilterSummary595();
    });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        run();
      }
    });

    try {
      var sk = sessionStorage.getItem(STORAGE_KEY_595_IDX_KW);
      if (sk) {
        input.value = sk;
      }
      var se = sessionStorage.getItem(STORAGE_KEY_595_IDX_EMP);
      if (se === "retired" || se === "all" || se === "active") {
        empFilterState = se;
        applyEmpChipStyles595(rowEmp, se);
      }
      var sc = sessionStorage.getItem(STORAGE_KEY_595_IDX_CAT);
      if (sc === "seishain" || sc === "junshain" || sc === "sonota" || sc === "all") {
        catFilterState = sc;
        applyCatChipStyles595(rowCat, sc);
      }
      var sp = sessionStorage.getItem(STORAGE_KEY_595_IDX_PC);
      if (sp === "has" || sp === "none" || sp === "all") {
        pcFilterState = sp;
        applyPcChipStyles595(rowPc, sp);
      }
    } catch (eS) {
      /* noop */
    }
    update595IndexFilterSummary595();
    if (!input.value) {
      var qCond;
      try {
        qCond =
          (typeof kintone !== "undefined" && kintone.app && kintone.app.getQueryCondition && kintone.app.getQueryCondition()) ||
          "";
      } catch (e) {
        qCond = "";
      }
      var likeRe = /group_name\s+like\s+"((?:\\.|[^"\\])*)"/i;
      var m = qCond && likeRe.exec(qCond);
      if (m && m[1]) {
        input.value = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
    }

    if (space.firstChild) {
      space.insertBefore(wrap, space.firstChild);
    } else {
      space.appendChild(wrap);
    }

    try {
      var scCount = sessionStorage.getItem(STORAGE_KEY_595_IDX_COUNT);
      if (scCount !== null && scCount !== "") {
        var nCount = Number(scCount);
        if (isFinite(nCount)) {
          set595IndexMatchCount595(nCount);
        }
      }
    } catch (eCount) {
      /* noop */
    }

    ensure595IndexSearchUrlListeners595();
    ensure595IndexSearchNativeClearListener595();
    request595IndexSearchHydrate595();
  }

  function setBulkDownstreamStatus595(text, isError) {
    var el = document.getElementById(BULK_DOWNSTREAM_STATUS_ID);
    if (!el) {
      return;
    }
    el.textContent = text || "";
    el.style.color = isError ? "#b91c1c" : "#047857";
  }

  function setBulkDownstreamLastLog595(text) {
    var el = document.getElementById(BULK_DOWNSTREAM_LASTLOG_ID);
    if (!el) {
      return;
    }
    var t = String(text || "").trim();
    if (!t) {
      el.textContent = "";
      return;
    }
    if (t.indexOf("未実行") === 0 || t.indexOf("ログ取得失敗") === 0) {
      el.textContent = "最終: " + t;
      el.style.color = "#64748b";
      el.style.fontWeight = "normal";
      return;
    }
    el.style.color = "#065f46";
    el.style.fontWeight = "600";
    el.textContent = "最終: " + t;
  }

  function todayYmdCompact595() {
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    var g = function (t) {
      var p = parts.find(function (x) {
        return x.type === t;
      });
      return p ? p.value : "";
    };
    return g("year") + g("month") + g("day");
  }

  function formatBulkSyncLogLine595(stats) {
    var ok = Math.max(0, stats.processed - stats.skippedRetired - stats.failed);
    var line =
      "データ更新 成功" +
      ok +
      "件 失敗" +
      stats.failed +
      "件 " +
      todayYmdCompact595() +
      "更新";
    if (stats.skippedRetired > 0) {
      line += "（退職スキップ" + stats.skippedRetired + "件）";
    }
    return line;
  }

  function read595BulkSyncLogLocal595() {
    try {
      var s = sessionStorage.getItem(STORAGE_KEY_595_BULK_LOG);
      if (s && String(s).trim()) {
        return String(s).trim();
      }
    } catch (e1) {
      /* noop */
    }
    try {
      var l = localStorage.getItem(STORAGE_KEY_595_BULK_LOG);
      return l && String(l).trim() ? String(l).trim() : "";
    } catch (e2) {
      return "";
    }
  }

  function write595BulkSyncLogLocal595(logText) {
    var v = String(logText || "").trim();
    if (!v) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_595_BULK_LOG, v);
    } catch (e1) {
      /* noop */
    }
    try {
      sessionStorage.setItem(STORAGE_KEY_595_BULK_LOG, v);
    } catch (e2) {
      /* noop */
    }
  }

  function fetch697BulkSyncLogSettings595() {
    var url = kintone.api.url("/k/v1/records.json", true);
    var q = 'record_kind in ("共通設定") order by $id asc limit 1';
    return kintone
      .api(url, "GET", {
        app: APP_SETTINGS_697,
        query: q,
        fields: ["$id", "$revision", FC697_BULK_LOG],
      })
      .then(function (resp) {
        return (resp.records && resp.records[0]) || null;
      });
  }

  function write595BulkSyncLog595(logText) {
    write595BulkSyncLogLocal595(logText);
    return fetch697BulkSyncLogSettings595()
      .then(function (rec) {
        if (!rec) {
          console.warn("[jbis 595 bulk log] 697 共通設定レコードがありません");
          return { ok: false, reason: "no697" };
        }
        var urlPut = kintone.api.url("/k/v1/record.json", true);
        return kintone
          .api(urlPut, "PUT", {
            app: APP_SETTINGS_697,
            id: rec.$id.value,
            revision: rec.$revision.value,
            record: {
              [FC697_BULK_LOG]: { value: logText },
            },
          })
          .then(function () {
            return { ok: true };
          });
      })
      .catch(function (e) {
        console.warn("[jbis 595 bulk log write 697]", e);
        return { ok: false, reason: e && e.message ? e.message : String(e) };
      });
  }

  function refresh595BulkSyncLogDisplay595() {
    return fetch697BulkSyncLogSettings595()
      .then(function (rec) {
        var txt = "";
        if (rec) {
          var f = rec[FC697_BULK_LOG];
          txt = f && f.value != null ? String(f.value).trim() : "";
        }
        if (!txt) {
          txt = read595BulkSyncLogLocal595();
        }
        if (!txt) {
          setBulkDownstreamLastLog595("未実行 — 「台帳へ一括反映」後に表示されます");
          return;
        }
        setBulkDownstreamLastLog595(txt);
      })
      .catch(function (e) {
        console.warn("[jbis 595 bulk log read]", e);
        var txt = read595BulkSyncLogLocal595();
        if (txt) {
          setBulkDownstreamLastLog595(txt);
          return;
        }
        setBulkDownstreamLastLog595("ログ取得失敗 — 一括反映を再実行してください");
      });
  }

  function mount595BulkDownstreamButton() {
    var existing = document.getElementById(BULK_DOWNSTREAM_WRAP_ID);
    if (existing) {
      refresh595BulkSyncLogDisplay595();
      return;
    }
    var space = getIndexHeaderSpace595();
    if (!space) {
      return;
    }

    var wrap = document.createElement("div");
    wrap.id = BULK_DOWNSTREAM_WRAP_ID;
    wrap.style.cssText =
      "display:flex;flex-direction:column;gap:6px;margin:0 0 12px;padding:8px 12px;" +
      "background:#ecfdf5;border:1px solid #6ee7b7;border-radius:6px;font-size:13px;";

    var row1 = document.createElement("div");
    row1.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:8px;width:100%;";

    var label = document.createElement("span");
    label.style.cssText = "font-weight:600;color:#065f46;white-space:nowrap;";
    label.textContent = "台帳連携";
    row1.appendChild(label);

    var hint = document.createElement("span");
    hint.style.cssText = "color:#047857;font-size:12px;";
    hint.textContent =
      "（CSV取込後など — 674／714／716 へ氏名・所属を一括反映。退職者は対象外）";
    row1.appendChild(hint);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "jbis-595-bulk-downstream-btn";
    btn.textContent = "台帳へ一括反映";
    btn.setAttribute("aria-label", "台帳へ一括反映");
    btn.style.cssText =
      "padding:6px 14px;background:#059669;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;";
    btn.addEventListener("click", function () {
      start595BulkDownstreamSync595(btn);
    });
    row1.appendChild(btn);

    var status = document.createElement("span");
    status.id = BULK_DOWNSTREAM_STATUS_ID;
    status.style.cssText = "color:#64748b;font-size:12px;min-width:160px;flex:1;";
    row1.appendChild(status);
    wrap.appendChild(row1);

    var lastLog = document.createElement("div");
    lastLog.id = BULK_DOWNSTREAM_LASTLOG_ID;
    lastLog.style.cssText = "color:#065f46;font-size:12px;font-weight:600;width:100%;";
    wrap.appendChild(lastLog);

    refresh595BulkSyncLogDisplay595();

    var searchWrap = document.getElementById(INDEX_SEARCH_WRAP_ID);
    if (searchWrap && searchWrap.nextSibling) {
      space.insertBefore(wrap, searchWrap.nextSibling);
    } else if (searchWrap) {
      searchWrap.parentNode.insertBefore(wrap, searchWrap.nextSibling);
    } else if (space.firstChild) {
      space.insertBefore(wrap, space.firstChild);
    } else {
      space.appendChild(wrap);
    }
  }

  function uniqueStringIds(arr) {
    var seen = {};
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var k = String(arr[i] || "").trim();
      if (!k || k === "0" || seen[k]) {
        continue;
      }
      seen[k] = true;
      out.push(k);
    }
    return out;
  }

  function collectSubtableNumericIds(record, subCode, cellCode) {
    var f = record[subCode];
    var raw = [];
    if (!f || !Array.isArray(f.value)) {
      return raw;
    }
    for (var i = 0; i < f.value.length; i++) {
      var row = f.value[i];
      var cell = row.value && row.value[cellCode];
      if (!cell || cell.value === undefined || cell.value === null || cell.value === "") {
        continue;
      }
      raw.push(String(cell.value).trim());
    }
    return uniqueStringIds(raw);
  }

  function recordShowHref(appId, recordId) {
    return (
      location.origin +
      "/k/" +
      encodeURIComponent(String(appId)) +
      "/show#record=" +
      encodeURIComponent(String(recordId))
    );
  }

  function removePcLedgerLinkBox595() {
    var el = document.getElementById(LINK_BOX_ID);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  function mountPcLedgerLinkBox595(record) {
    removePcLedgerLinkBox595();

    var ids674 = collectSubtableNumericIds(record, FC595_PC674_SUB, FC595_PC674_ID);

    var space =
      (kintone.app && kintone.app.record && kintone.app.record.getHeaderMenuSpaceElement && kintone.app.record.getHeaderMenuSpaceElement()) ||
      (typeof kintone !== "undefined" &&
        kintone.mobile &&
        kintone.mobile.app &&
        kintone.mobile.app.record &&
        kintone.mobile.app.record.getHeaderMenuSpaceElement &&
        kintone.mobile.app.record.getHeaderMenuSpaceElement()) ||
      null;
    if (!space) {
      return;
    }

    var box = document.createElement("div");
    box.id = LINK_BOX_ID;
    box.style.cssText =
      "margin:6px 0 10px;padding:8px 12px;font-size:13px;line-height:1.5;" +
      "background:#e8f4fd;border:1px solid #9ec5fe;border-radius:6px;color:#052c65;";

    var title = document.createElement("div");
    title.style.cssText = "font-weight:bold;margin-bottom:6px;";
    title.textContent = "PC台帳へのリンク";
    box.appendChild(title);

    var hasAny = ids674.length > 0;

    function addLinkRow(label, appId, rid) {
      var row = document.createElement("div");
      row.style.cssText = "margin:2px 0;";
      var a = document.createElement("a");
      a.href = recordShowHref(appId, rid);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = label + "（レコード #" + rid + "）";
      row.appendChild(a);
      box.appendChild(row);
    }

    for (var b = 0; b < ids674.length; b++) {
      addLinkRow("新・PC台帳（674）", APP674, ids674[b]);
    }

    if (!hasAny) {
      var empty = document.createElement("div");
      empty.style.cssText = "color:#6c757d;font-size:12px;";
      empty.textContent =
        "「" + FC595_PC674_SUB + "」に番号が入ると、ここにリンクが表示されます。";
      box.appendChild(empty);
    }

    if (space.firstChild) {
      space.insertBefore(box, space.firstChild);
    } else {
      space.appendChild(box);
    }
  }

  /** 680 取得失敗時の埋め込み候補（scripts/data/pc-ledger-dept-master-seed-records.json と同期） */
  var DEPT_MASTER_FALLBACK_INLINE_595 =
    "役員室|honsya,顧問室|honsya,顧問|honsya,出向者|honsya,総務部|honsya,経理部|honsya,経営企画部|honsya,人事研修部|honsya,安全推進部|honsya,施工推進部|honsya,メンテナンス技術部|honsya,塗装技術部|honsya,品質管理部|honsya," +
    "東北支店|tohoku,秋田営業所|tohoku,盛岡営業所|tohoku,仙台営業所|tohoku," +
    "関越支店|kan-etsu,新潟営業所|kan-etsu,長野営業所|kan-etsu,高崎営業所|kan-etsu," +
    "東京支店|tokyo,千葉営業所|tokyo,水戸営業所|tokyo,鎌ヶ谷事務所|tokyo," +
    "東海支店|tokai,東京営業所|tokai,静岡営業所|tokai,名古屋営業所|tokai,関西営業所|tokai," +
    "札幌支店|tokyo,首都圏支店|tokyo,リフォーム事業統括部|reform,札幌支店|reform,首都圏支店|reform,鉄構支店|tekko,湾岸工事所|wangan";

  var deptMasterRowsCache595 = null;

  function getRecordHeaderMenuSpace595() {
    return (
      (kintone.app && kintone.app.record && kintone.app.record.getHeaderMenuSpaceElement && kintone.app.record.getHeaderMenuSpaceElement()) ||
      (typeof kintone !== "undefined" &&
        kintone.mobile &&
        kintone.mobile.app &&
        kintone.mobile.app.record &&
        kintone.mobile.app.record.getHeaderMenuSpaceElement &&
        kintone.mobile.app.record.getHeaderMenuSpaceElement()) ||
      null
    );
  }

  function parseDeptMasterFallbackRows595() {
    var out = [];
    var parts = String(DEPT_MASTER_FALLBACK_INLINE_595 || "").split(",");
    for (var i = 0; i < parts.length; i++) {
      var seg = String(parts[i] || "").trim();
      if (!seg) continue;
      var bar = seg.indexOf("|");
      var dept = (bar === -1 ? seg : seg.slice(0, bar)).trim();
      var grp = (bar === -1 ? "" : seg.slice(bar + 1)).trim();
      if (dept) out.push({ dept_name: dept, group_name: grp, sort_no: i + 1 });
    }
    return out;
  }

  function sortDeptMasterRows595(rows) {
    return rows.slice().sort(function (a, b) {
      var sa = Number(a.sort_no);
      var sb = Number(b.sort_no);
      var na = isFinite(sa) && sa > 0 ? sa : 99999;
      var nb = isFinite(sb) && sb > 0 ? sb : 99999;
      if (na !== nb) return na - nb;
      var dc = String(a.dept_name || "").localeCompare(String(b.dept_name || ""), "ja");
      if (dc !== 0) return dc;
      return String(a.group_name || "").localeCompare(String(b.group_name || ""), "ja");
    });
  }

  function fetchDeptMasterRows595() {
    if (deptMasterRowsCache595 && deptMasterRowsCache595.length) {
      return Promise.resolve(deptMasterRowsCache595);
    }
    var app = String(APP_DEPT_MASTER_595 || "").trim();
    if (!app || app === "0") {
      deptMasterRowsCache595 = parseDeptMasterFallbackRows595();
      return Promise.resolve(deptMasterRowsCache595);
    }
    var url = kintone.api.url("/k/v1/records.json", true);
    return kintone
      .api(url, "GET", {
        app: app,
        query: "order by sort_no asc, $id asc limit 500",
        fields: ["dept_name", "group_name", "sort_no"],
      })
      .then(function (resp) {
        var rows = [];
        var recs = resp.records || [];
        for (var i = 0; i < recs.length; i++) {
          var r = recs[i];
          var d = (r.dept_name && r.dept_name.value) || "";
          var g = (r.group_name && r.group_name.value) || "";
          var sn =
            r.sort_no && r.sort_no.value != null && r.sort_no.value !== ""
              ? Number(r.sort_no.value)
              : NaN;
          if (String(d).trim()) {
            rows.push({
              dept_name: String(d).trim(),
              group_name: String(g).trim(),
              sort_no: sn,
            });
          }
        }
        deptMasterRowsCache595 = rows.length
          ? sortDeptMasterRows595(rows)
          : parseDeptMasterFallbackRows595();
        return deptMasterRowsCache595;
      })
      .catch(function (e) {
        console.warn("[jbis 595 dept master fetch]", e);
        deptMasterRowsCache595 = parseDeptMasterFallbackRows595();
        return deptMasterRowsCache595;
      });
  }

  function applyDeptMasterPick595(dept, grp) {
    var holder =
      (kintone.app && kintone.app.record && kintone.app.record.get && kintone.app.record.get()) ||
      (kintone.mobile &&
        kintone.mobile.app &&
        kintone.mobile.app.record &&
        kintone.mobile.app.record.get &&
        kintone.mobile.app.record.get()) ||
      null;
    if (!holder || !holder.record) return;
    if (holder.record[FC595_DEPT]) holder.record[FC595_DEPT].value = dept;
    if (holder.record[FC595_GROUP]) holder.record[FC595_GROUP].value = grp;
    if (kintone.app && kintone.app.record && kintone.app.record.set) {
      kintone.app.record.set(holder);
    } else if (
      kintone.mobile &&
      kintone.mobile.app &&
      kintone.mobile.app.record &&
      kintone.mobile.app.record.set
    ) {
      kintone.mobile.app.record.set(holder);
    }
  }

  function closeDeptMasterModal595() {
    var m = document.getElementById(DEPT_MASTER_MODAL_ID_595);
    if (m) m.style.display = "none";
  }

  function renderDeptMasterResults595(container, rows, kw) {
    container.textContent = "";
    var k = String(kw || "")
      .trim()
      .toLowerCase();
    var filtered = !k
      ? rows.slice()
      : rows.filter(function (r) {
          var a = (r.dept_name + " " + r.group_name).toLowerCase();
          return a.indexOf(k) !== -1;
        });
    if (!filtered.length) {
      var p = document.createElement("p");
      p.style.cssText = "margin:8px 0;color:#6c757d;font-size:13px;line-height:1.5;";
      p.textContent = "該当する行がありません。キーワードを変えるか、一覧をスクロールしてください。";
      container.appendChild(p);
      return;
    }
    for (var i = 0; i < filtered.length; i++) {
      (function (r) {
        var item = document.createElement("button");
        item.type = "button";
        item.style.cssText =
          "display:block;width:100%;text-align:left;padding:10px 12px;margin:0 0 6px;border:1px solid #dee2e6;border-radius:4px;background:#fff;cursor:pointer;font-size:14px;line-height:1.4;";
        item.textContent = r.dept_name + (r.group_name ? "　／　" + r.group_name : "");
        item.addEventListener("mousedown", function (ev) {
          ev.preventDefault();
          applyDeptMasterPick595(r.dept_name, r.group_name);
          closeDeptMasterModal595();
        });
        container.appendChild(item);
      })(filtered[i]);
    }
  }

  function runDeptMasterModalFilter595() {
    var modal = document.getElementById(DEPT_MASTER_MODAL_ID_595);
    if (!modal) return;
    var input = modal.querySelector("[data-jbis595-dept-q]");
    var container = modal.querySelector("[data-jbis595-dept-results]");
    if (!input || !container) return;
    var kw = String(input.value || "").trim();
    fetchDeptMasterRows595().then(function (rows) {
      renderDeptMasterResults595(container, rows, kw);
    });
  }

  function ensureDeptMasterModal595() {
    var backdrop = document.getElementById(DEPT_MASTER_MODAL_ID_595);
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = DEPT_MASTER_MODAL_ID_595;
    backdrop.style.cssText =
      "display:none;position:fixed;inset:0;z-index:100001;align-items:center;justify-content:center;" +
      "padding:16px;box-sizing:border-box;background:rgba(33,37,41,.48);";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeDeptMasterModal595();
    });

    var panel = document.createElement("div");
    panel.style.cssText =
      "background:#fff;border-radius:8px;max-width:560px;width:100%;max-height:88vh;overflow:hidden;display:flex;" +
      "flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.2);";
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    var head = document.createElement("div");
    head.style.cssText = "padding:14px 16px;border-bottom:1px solid #dee2e6;";
    var h = document.createElement("div");
    h.style.cssText = "font-weight:bold;font-size:16px;color:#052c65;";
    h.textContent = "所属候補を選ぶ（680）";
    head.appendChild(h);
    var sub = document.createElement("div");
    sub.style.cssText = "font-size:12px;color:#495057;margin-top:6px;line-height:1.5;";
    sub.textContent =
      "行を押すと「所属名」「所属グループ」に反映されます。680 に無い所属は従来どおり手入力もできます。";
    head.appendChild(sub);

    var body = document.createElement("div");
    body.style.cssText = "padding:12px 16px;flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;";

    var row = document.createElement("div");
    row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;align-items:center;";
    var inp = document.createElement("input");
    inp.type = "text";
    inp.setAttribute("data-jbis595-dept-q", "1");
    inp.placeholder = "所属名・グループの一部で絞り込み";
    inp.style.cssText =
      "flex:1;min-width:160px;padding:8px 10px;font-size:14px;border:1px solid #ced4da;border-radius:4px;box-sizing:border-box;";
    var filterBtn = document.createElement("button");
    filterBtn.type = "button";
    filterBtn.textContent = "絞り込み";
    filterBtn.style.cssText =
      "padding:8px 16px;font-weight:bold;background:#198754;color:#fff;border:none;border-radius:4px;cursor:pointer;";
    filterBtn.addEventListener("click", function () {
      runDeptMasterModalFilter595();
    });
    inp.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        runDeptMasterModalFilter595();
      }
    });
    row.appendChild(inp);
    row.appendChild(filterBtn);
    body.appendChild(row);

    var results = document.createElement("div");
    results.setAttribute("data-jbis595-dept-results", "1");
    results.style.cssText =
      "overflow-y:auto;flex:1;min-height:120px;max-height:46vh;border:1px solid #e9ecef;border-radius:4px;padding:8px;background:#f8f9fa;";
    body.appendChild(results);

    var foot = document.createElement("div");
    foot.style.cssText = "padding:12px 16px;border-top:1px solid #dee2e6;display:flex;justify-content:flex-end;gap:8px;";
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "閉じる";
    closeBtn.style.cssText =
      "padding:6px 14px;border:1px solid #6c757d;background:#fff;border-radius:4px;cursor:pointer;font-size:13px;";
    closeBtn.addEventListener("click", function () {
      closeDeptMasterModal595();
    });
    foot.appendChild(closeBtn);

    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(foot);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    document.addEventListener(
      "keydown",
      function jbis595DeptModalEsc(ev) {
        var m = document.getElementById(DEPT_MASTER_MODAL_ID_595);
        if (!m || m.style.display === "none") return;
        if (ev.key === "Escape") closeDeptMasterModal595();
      },
      true
    );
    return backdrop;
  }

  function openDeptMasterModal595() {
    var holder =
      (kintone.app && kintone.app.record && kintone.app.record.get && kintone.app.record.get()) ||
      null;
    if (!holder || !holder.record) {
      window.alert("フォームの準備ができていません。画面を開き直してからお試しください。");
      return;
    }
    var backdrop = ensureDeptMasterModal595();
    var input = backdrop.querySelector("[data-jbis595-dept-q]");
    var container = backdrop.querySelector("[data-jbis595-dept-results]");
    if (input) input.value = "";
    backdrop.style.display = "flex";
    fetchDeptMasterRows595().then(function (rows) {
      if (container) renderDeptMasterResults595(container, rows, "");
    });
    if (input) {
      try {
        input.focus();
      } catch (ignore) {
        /* focus optional */
      }
    }
  }

  function removeDeptPickerWrap595() {
    var el = document.getElementById(DEPT_PICKER_WRAP_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function mountDeptPickerButton595() {
    removeDeptPickerWrap595();
    var space = getRecordHeaderMenuSpace595();
    if (!space) return;

    var wrap = document.createElement("div");
    wrap.id = DEPT_PICKER_WRAP_ID;
    wrap.style.cssText = "margin:0 0 10px;padding:0;";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "📋 所属候補から選ぶ（680）";
    btn.setAttribute("aria-label", "所属候補から選ぶ（680）");
    btn.style.cssText =
      "padding:8px 14px;font-weight:bold;font-size:13px;background:#0d6efd;color:#fff;border:none;border-radius:6px;cursor:pointer;";
    btn.addEventListener("click", function () {
      openDeptMasterModal595();
    });

    var hint = document.createElement("span");
    hint.style.cssText = "margin-left:10px;font-size:12px;color:#495057;";
    hint.textContent = "所属名・所属グループを一括入力（手入力も可）";

    wrap.appendChild(btn);
    wrap.appendChild(hint);

    if (space.firstChild) {
      space.insertBefore(wrap, space.firstChild);
    } else {
      space.appendChild(wrap);
    }
  }

  var showEvents595 = [
    "app.record.detail.show",
    "app.record.edit.show",
    "mobile.app.record.detail.show",
    "mobile.app.record.edit.show"
  ];
  kintone.events.on(showEvents595, function (event) {
    try {
      mountPcLedgerLinkBox595(event.record);
    } catch (e) {
      console.warn("[jbis 595 pc-ledger links ui]", e);
    }
    return event;
  });

  var formEditEvents595 = [
    "app.record.create.show",
    "app.record.edit.show",
    "mobile.app.record.create.show",
    "mobile.app.record.edit.show",
  ];
  kintone.events.on(formEditEvents595, function (event) {
    try {
      mountDeptPickerButton595();
      var rec = event.record;
      var rid =
        rec && rec.$id && rec.$id.value != null ? String(rec.$id.value).trim() : "";
      if (rid) {
        window.__jbis595EditOrigDept = scalarFrom595(rec, FC595_DEPT).trim();
      } else {
        window.__jbis595EditOrigDept = null;
      }
    } catch (e) {
      console.warn("[jbis 595 dept picker ui]", e);
    }
    return event;
  });

  kintone.events.on(["app.record.index.show", "mobile.app.record.index.show"], function (event) {
    try {
      mount595IndexSearchBox();
      mount595BulkDownstreamButton();
    } catch (e) {
      console.warn("[jbis 595 index ui]", e);
    }
    return event;
  });

  function escapeForQuery(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function scalarFrom595(record, code) {
    var f = record[code];
    if (!f || f.value === undefined || f.value === null) {
      return "";
    }
    if (typeof f.value === "string") {
      return f.value;
    }
    if (Array.isArray(f.value)) {
      return f.value.join("");
    }
    return String(f.value);
  }

  function chunk(arr, size) {
    var out = [];
    for (var i = 0; i < arr.length; i += size) {
      out.push(arr.slice(i, i + size));
    }
    return out;
  }

  function todayYmd595() {
    var d = new Date();
    var p = function (n) {
      return String(n).padStart(2, "0");
    };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function applyRetiredDateOnSubmit595(event) {
    var rec = event.record;
    var emp = scalarFrom595(rec, FC595_EMP).trim();
    if (emp !== EMP_RETIRED) {
      return event;
    }
    var rd = scalarFrom595(rec, FC595_RETIRED).trim();
    if (!rd && rec[FC595_RETIRED]) {
      rec[FC595_RETIRED].value = todayYmd595();
    }
    return event;
  }

  function parseEmpNum595(raw) {
    var m = /^EMP-(\d+)$/.exec(String(raw || "").trim());
    return m ? parseInt(m[1], 10) : 0;
  }

  /** 全件走査で最大 EMP 番号+1（assign-emp-id.mjs と同ロジック・docs/emp-id-js-account-design.md） */
  function fetchNextEmpId595() {
    var maxNum = 0;
    var offset = 0;
    var limit = 500;

    function page() {
      return kintone
        .api(kintone.api.url("/k/v1/records.json", true), "GET", {
          app: kintone.app.getId(),
          query: "order by $id asc limit " + limit + " offset " + offset,
          fields: [FC595_EMP_ID],
        })
        .then(function (resp) {
          var rows = resp.records || [];
          for (var i = 0; i < rows.length; i++) {
            maxNum = Math.max(maxNum, parseEmpNum595(scalarFrom595(rows[i], FC595_EMP_ID)));
          }
          if (rows.length < limit) {
            return "EMP-" + String(maxNum + 1).padStart(4, "0");
          }
          offset += limit;
          return page();
        });
    }

    return page();
  }

  function applyEmpIdOnSubmit595(event) {
    applyRetiredDateOnSubmit595(event);
    var rec = event.record;
    if (!rec[FC595_EMP_ID]) {
      return event;
    }
    if (scalarFrom595(rec, FC595_EMP_ID).trim()) {
      return event;
    }
    return fetchNextEmpId595().then(function (nextId) {
      rec[FC595_EMP_ID].value = nextId;
      return event;
    });
  }

  function isNumericSort595(raw) {
    var s = String(raw || "").trim();
    if (!s) {
      return false;
    }
    var n = Number(s);
    return isFinite(n);
  }

  function isCreateEvent595(event) {
    return String(event.type || "").indexOf("create") !== -1;
  }

  function fetchSortPeers595(dept, excludeId) {
    var url = kintone.api.url("/k/v1/records.json", true);
    var q =
      'employment_status in ("' +
      escapeForQuery(EMP_ACTIVE) +
      '") and dept_name = "' +
      escapeForQuery(dept) +
      '" order by sort asc, $id asc limit 500';
    return kintone
      .api(url, "GET", {
        app: kintone.app.getId(),
        query: q,
        fields: ["$id", FC595_NAME, FC595_SORT, FC595_DEPT, "$revision"],
      })
      .then(function (resp) {
        var rows = resp.records || [];
        if (!excludeId) {
          return rows;
        }
        var ex = String(excludeId).trim();
        return rows.filter(function (r) {
          var id = r.$id && r.$id.value != null ? String(r.$id.value).trim() : "";
          return id !== ex;
        });
      });
  }

  function fetchAllActive595ForSort595() {
    var fields = ["$id", "$revision", FC595_SORT, FC595_DEPT, FC595_NAME, FC595_GROUP];
    var all = [];
    var limit = 500;
    var url = kintone.api.url("/k/v1/records.json", true);
    var base = 'employment_status in ("' + escapeForQuery(EMP_ACTIVE) + '")';

    function page(offset) {
      var query = base + " order by sort asc, $id asc limit " + limit + " offset " + offset;
      return kintone
        .api(url, "GET", { app: kintone.app.getId(), query: query, fields: fields })
        .then(function (resp) {
          var batch = resp.records || [];
          for (var i = 0; i < batch.length; i++) {
            all.push(batch[i]);
          }
          if (batch.length < limit) {
            return all;
          }
          return page(offset + limit);
        });
    }

    return page(0);
  }

  function buildOrderedActive595(allActive, selfId) {
    var list = allActive.slice();
    list.sort(function (a, b) {
      var sa = Number(scalarFrom595(a, FC595_SORT));
      var sb = Number(scalarFrom595(b, FC595_SORT));
      var na = isFinite(sa) && sa > 0 ? sa : 999999;
      var nb = isFinite(sb) && sb > 0 ? sb : 999999;
      if (na !== nb) {
        return na - nb;
      }
      var ia = a.$id && a.$id.value != null ? Number(a.$id.value) : 0;
      var ib = b.$id && b.$id.value != null ? Number(b.$id.value) : 0;
      return ia - ib;
    });
    if (selfId) {
      var ex = String(selfId).trim();
      list = list.filter(function (r) {
        var id = r.$id && r.$id.value != null ? String(r.$id.value).trim() : "";
        return id !== ex;
      });
    }
    return list;
  }

  function getDeptSortNo595(deptMasterRows, dept) {
    var d = String(dept || "").trim();
    for (var i = 0; i < deptMasterRows.length; i++) {
      if (String(deptMasterRows[i].dept_name || "").trim() === d) {
        var sn = Number(deptMasterRows[i].sort_no);
        return isFinite(sn) && sn > 0 ? sn : 99999;
      }
    }
    return null;
  }

  function buildDeptSortNoMap595(deptMasterRows) {
    var map = {};
    for (var i = 0; i < deptMasterRows.length; i++) {
      var dn = String(deptMasterRows[i].dept_name || "").trim();
      if (!dn) {
        continue;
      }
      var sn = Number(deptMasterRows[i].sort_no);
      map[dn] = isFinite(sn) && sn > 0 ? sn : 99999;
    }
    return map;
  }

  function computeInsertAt595(ordered, choice, dept, peers, deptMasterRows) {
    var peerIds = {};
    for (var i = 0; i < peers.length; i++) {
      var pid =
        peers[i].$id && peers[i].$id.value != null ? String(peers[i].$id.value).trim() : "";
      if (pid) {
        peerIds[pid] = true;
      }
    }
    var hasPeers = peers.length > 0;

    if (hasPeers) {
      if (choice.mode === "head") {
        for (var h = 0; h < ordered.length; h++) {
          var hid =
            ordered[h].$id && ordered[h].$id.value != null
              ? String(ordered[h].$id.value).trim()
              : "";
          if (peerIds[hid]) {
            return h;
          }
        }
        return 0;
      }
      if (choice.mode === "after" && choice.afterId) {
        var afterId = String(choice.afterId).trim();
        for (var a = 0; a < ordered.length; a++) {
          var aid =
            ordered[a].$id && ordered[a].$id.value != null
              ? String(ordered[a].$id.value).trim()
              : "";
          if (aid === afterId) {
            return a + 1;
          }
        }
      }
      if (choice.mode === "tail" || choice.mode === "after") {
        var lastIdx = -1;
        for (var l = 0; l < ordered.length; l++) {
          var lid =
            ordered[l].$id && ordered[l].$id.value != null
              ? String(ordered[l].$id.value).trim()
              : "";
          if (peerIds[lid]) {
            lastIdx = l;
          }
        }
        return lastIdx >= 0 ? lastIdx + 1 : ordered.length;
      }
    }

    var targetSortNo = getDeptSortNo595(deptMasterRows, dept);
    if (targetSortNo === null) {
      return ordered.length;
    }
    var deptSortMap = buildDeptSortNoMap595(deptMasterRows);
    var insertAt = 0;
    for (var o = 0; o < ordered.length; o++) {
      var oDept = scalarFrom595(ordered[o], FC595_DEPT).trim();
      var oSortNo = deptSortMap[oDept];
      if (oSortNo != null && oSortNo < targetSortNo) {
        insertAt = o + 1;
      } else if (oSortNo != null && oSortNo >= targetSortNo) {
        break;
      }
    }
    return insertAt;
  }

  function batchPut595SortUpdates595(updates) {
    if (!updates.length) {
      return Promise.resolve();
    }
    var urlPut = kintone.api.url("/k/v1/records.json", true);
    var parts = chunk(updates, 100);
    return parts.reduce(function (chain, part) {
      return chain.then(function () {
        return kintone.api(urlPut, "PUT", { app: kintone.app.getId(), records: part });
      });
    }, Promise.resolve());
  }

  function closeSortInsertModal595() {
    var m = document.getElementById(SORT_INSERT_MODAL_ID_595);
    if (m) {
      m.style.display = "none";
    }
  }

  function ensureSortInsertModal595() {
    var backdrop = document.getElementById(SORT_INSERT_MODAL_ID_595);
    if (backdrop) {
      return backdrop;
    }

    backdrop = document.createElement("div");
    backdrop.id = SORT_INSERT_MODAL_ID_595;
    backdrop.style.cssText =
      "display:none;position:fixed;inset:0;z-index:100002;align-items:center;justify-content:center;" +
      "padding:16px;box-sizing:border-box;background:rgba(33,37,41,.48);";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    var panel = document.createElement("div");
    panel.style.cssText =
      "background:#fff;border-radius:8px;max-width:520px;width:100%;max-height:70vh;overflow:hidden;display:flex;" +
      "flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.2);";
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    var head = document.createElement("div");
    head.style.cssText = "padding:14px 16px;border-bottom:1px solid #dee2e6;flex:0 0 auto;";
    var h = document.createElement("div");
    h.setAttribute("data-jbis595-sort-title", "1");
    h.style.cssText = "font-weight:bold;font-size:16px;color:#052c65;";
    h.textContent = "表示順：どこに入れますか？";
    head.appendChild(h);
    var sub = document.createElement("div");
    sub.setAttribute("data-jbis595-sort-sub", "1");
    sub.style.cssText = "font-size:12px;color:#495057;margin-top:6px;line-height:1.5;";
    head.appendChild(sub);

    var body = document.createElement("div");
    body.style.cssText =
      "padding:12px 16px;flex:1;min-height:0;overflow-y:auto;max-height:calc(70vh - 80px);";
    var btnArea = document.createElement("div");
    btnArea.setAttribute("data-jbis595-sort-buttons", "1");
    body.appendChild(btnArea);

    panel.appendChild(head);
    panel.appendChild(body);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function openSortInsertPicker595(dept, peers) {
    dept = String(dept || "").trim();
    if (!dept) {
      window.alert("所属名を先に入力（または所属候補から選択）してください");
      return Promise.resolve(false);
    }

    return new Promise(function (resolve, reject) {
      var backdrop = ensureSortInsertModal595();
      var subEl = backdrop.querySelector("[data-jbis595-sort-sub]");
      var btnArea = backdrop.querySelector("[data-jbis595-sort-buttons]");
      if (subEl) {
        subEl.textContent =
          "所属「" +
          dept +
          "」の在籍メンバー（上＝表示が先）。入れたい位置の人の「この下に入れる」を押してください。";
      }
      if (!btnArea) {
        reject({ cancelled: true });
        return;
      }
      btnArea.textContent = "";

      function finish(result) {
        closeSortInsertModal595();
        resolve(result);
      }
      function cancel() {
        closeSortInsertModal595();
        reject({ cancelled: true });
      }

      var listWrap = document.createElement("div");
      listWrap.style.cssText =
        "border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;margin:0 0 10px;";

      function mkTopRow() {
        var row = document.createElement("div");
        row.style.cssText =
          "display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;" +
          "background:#f1f5f9;border-bottom:1px solid #e2e8f0;";
        var lab = document.createElement("div");
        lab.style.cssText = "font-size:13px;color:#334155;font-weight:600;";
        lab.textContent = "（所属の一番上）";
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = "一番上に入れる";
        b.style.cssText =
          "flex:0 0 auto;padding:6px 12px;font-size:12px;font-weight:700;border:1px solid #1d4ed8;" +
          "border-radius:6px;background:#1d4ed8;color:#fff;cursor:pointer;white-space:nowrap;";
        b.addEventListener("click", function () {
          finish({ mode: "head" });
        });
        row.appendChild(lab);
        row.appendChild(b);
        return row;
      }

      function mkPeerRow(p, isLast) {
        var pid = p.$id && p.$id.value != null ? String(p.$id.value).trim() : "";
        var pname = scalarFrom595(p, FC595_NAME).trim() || "(名前なし)";
        var psort = scalarFrom595(p, FC595_SORT).trim();
        var row = document.createElement("div");
        row.style.cssText =
          "display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;" +
          (isLast ? "" : "border-bottom:1px solid #e2e8f0;");
        var left = document.createElement("div");
        left.style.cssText = "min-width:0;flex:1;";
        var nameEl = document.createElement("div");
        nameEl.style.cssText = "font-size:14px;font-weight:600;color:#0f172a;";
        nameEl.textContent = pname;
        left.appendChild(nameEl);
        if (psort) {
          var meta = document.createElement("div");
          meta.style.cssText = "font-size:11px;color:#64748b;margin-top:2px;";
          meta.textContent = "現在の表示順: " + psort;
          left.appendChild(meta);
        }
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = isLast ? "この下に入れる（末尾）" : "この下に入れる";
        b.style.cssText =
          "flex:0 0 auto;padding:6px 12px;font-size:12px;font-weight:700;border:1px solid #059669;" +
          "border-radius:6px;background:#fff;color:#047857;cursor:pointer;white-space:nowrap;";
        b.addEventListener("click", function () {
          finish({ mode: "after", afterId: pid });
        });
        row.appendChild(left);
        row.appendChild(b);
        return row;
      }

      if (!peers.length) {
        var empty = document.createElement("div");
        empty.style.cssText =
          "padding:14px 12px;font-size:13px;color:#475569;line-height:1.55;background:#fffbeb;border:1px solid #fde68a;" +
          "border-radius:8px;margin:0 0 10px;";
        empty.textContent =
          "この所属に在籍メンバーはいません。所属マスタ（680）の並び位置へ挿入します。";
        btnArea.appendChild(empty);
        var okEmpty = document.createElement("button");
        okEmpty.type = "button";
        okEmpty.textContent = "この所属の位置に挿入する";
        okEmpty.style.cssText =
          "display:block;width:100%;padding:10px 14px;margin:0 0 8px;border:none;border-radius:6px;" +
          "background:#1d4ed8;color:#fff;font-weight:700;cursor:pointer;font-size:14px;";
        okEmpty.addEventListener("click", function () {
          finish({ mode: "tail" });
        });
        btnArea.appendChild(okEmpty);
      } else {
        listWrap.appendChild(mkTopRow());
        for (var i = 0; i < peers.length; i++) {
          listWrap.appendChild(mkPeerRow(peers[i], i === peers.length - 1));
        }
        btnArea.appendChild(listWrap);
        var hint = document.createElement("div");
        hint.style.cssText = "font-size:11px;color:#94a3b8;margin:0 0 8px;line-height:1.4;";
        hint.textContent = "末尾にしたい場合は、一覧の一番下の人の「この下に入れる（末尾）」を選んでください。";
        btnArea.appendChild(hint);
      }

      var cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.textContent = "キャンセル";
      cancelBtn.style.cssText =
        "display:block;width:100%;padding:8px 16px;margin-top:4px;border:1px solid #94a3b8;" +
        "background:#fff;border-radius:6px;cursor:pointer;font-size:13px;text-align:center;color:#334155;";
      cancelBtn.addEventListener("click", cancel);
      btnArea.appendChild(cancelBtn);

      backdrop.style.display = "flex";
    });
  }

  function applySortRenumber595(event, choice, dept, peers, selfId) {
    return Promise.all([fetchAllActive595ForSort595(), fetchDeptMasterRows595()])
      .then(function (results) {
        var allActive = results[0];
        var deptMasterRows = results[1];
        var ordered = buildOrderedActive595(allActive, selfId);
        var insertAt = computeInsertAt595(ordered, choice, dept, peers, deptMasterRows);
        var newOrder = ordered.slice(0, insertAt).concat([{ __self: true }]).concat(ordered.slice(insertAt));

        var selfSort = null;
        var updates = [];
        for (var i = 0; i < newOrder.length; i++) {
          var newSort = i + 1;
          if (newOrder[i].__self) {
            selfSort = newSort;
            continue;
          }
          var r = newOrder[i];
          var curSort = scalarFrom595(r, FC595_SORT).trim();
          var curNum = Number(curSort);
          if (!isFinite(curNum) || curNum !== newSort) {
            var upd = {
              id: r.$id.value,
              record: {},
            };
            upd.record[FC595_SORT] = { value: String(newSort) };
            if (r.$revision && r.$revision.value !== undefined && r.$revision.value !== null) {
              upd.revision = r.$revision.value;
            }
            updates.push(upd);
          }
        }

        if (!event.record[FC595_SORT]) {
          event.record[FC595_SORT] = { value: "" };
        }
        event.record[FC595_SORT].value = String(selfSort);

        if (!updates.length) {
          return event;
        }
        return batchPut595SortUpdates595(updates)
          .then(function () {
            return event;
          })
          .catch(function (e) {
            window.alert(
              "表示順の更新に失敗しました。" + (e && e.message ? "\n" + e.message : "")
            );
            return false;
          });
      })
      .catch(function (e) {
        window.alert(
          "表示順の取得に失敗しました。" + (e && e.message ? "\n" + e.message : "")
        );
        return false;
      });
  }

  function applySortPositionOnSubmit595(event) {
    var rec = event.record;
    var emp = scalarFrom595(rec, FC595_EMP).trim();
    if (emp === EMP_RETIRED) {
      return event;
    }

    var isCreate = isCreateEvent595(event);
    var dept = scalarFrom595(rec, FC595_DEPT).trim();
    var origDept =
      window.__jbis595EditOrigDept != null ? String(window.__jbis595EditOrigDept).trim() : null;
    var sortVal = scalarFrom595(rec, FC595_SORT).trim();
    var selfId = rec.$id && rec.$id.value != null ? String(rec.$id.value).trim() : "";

    if (!isCreate && origDept !== null && dept === origDept && isNumericSort595(sortVal)) {
      return event;
    }

    if (!dept) {
      window.alert("所属名を先に入力（または所属候補から選択）してください");
      return false;
    }

    return fetchSortPeers595(dept, selfId)
      .then(function (peers) {
        return openSortInsertPicker595(dept, peers).then(function (choice) {
          if (choice === false) {
            return false;
          }
          return applySortRenumber595(event, choice, dept, peers, selfId);
        });
      })
      .catch(function (err) {
        if (err && err.cancelled) {
          return false;
        }
        throw err;
      });
  }

  function scalar674FromRow(r, code) {
    var f = r[code];
    if (!f || f.value === undefined || f.value === null) {
      return "";
    }
    if (Array.isArray(f.value)) {
      return f.value.join("");
    }
    return String(f.value);
  }

  function buildRetire674Note595(snapshot, retiredDate, userName) {
    var parts = [
      "[595退職連動 " + todayYmd595() + "]",
      "旧利用者: " + (userName || "").trim(),
      "退職日: " + (retiredDate || "").trim(),
    ];
    if (snapshot.logon) {
      parts.push("WindowsID: " + snapshot.logon);
    }
    if (snapshot.logonPw) {
      parts.push("WindowsPW: " + snapshot.logonPw);
    }
    if (snapshot.winPw) {
      parts.push("メールPW: " + snapshot.winPw);
    }
    if (snapshot.mail) {
      parts.push("mail: " + snapshot.mail);
    }
    return parts.join(" / ");
  }

  /** 674 保管時に空にするアカウント・利用者項目（PC名・シリアル等の資産情報は残す） */
  function buildRetire674ClearRecord595() {
    var rec = {};
    rec[FC674_PC_STATUS] = { value: PC_STATUS_STORAGE };
    rec[FC674_NAME] = { value: "" };
    rec[FC674_DEPT] = { value: "" };
    rec[FC674_GROUP] = { value: "" };
    rec[FC674_SHARED_TERM] = { value: "" };
    rec[FC674_WIN_NAME] = { value: "" };
    rec[FC674_LOGON] = { value: "" };
    rec[FC674_LOGON_PW] = { value: "" };
    rec[FC674_MAIL] = { value: "" };
    rec[FC674_MAIL_ACCT] = { value: "" };
    rec[FC674_MAIL_PW] = { value: "" };
    rec[FC674_M365_ID] = { value: "" };
    rec[FC674_M365_PW] = { value: "" };
    rec[FC674_M365_MASTER] = { value: "" };
    rec[FC674_M365_KIRIKAE] = { value: [] };
    rec[FC674_GB_ID] = { value: "" };
    rec[FC674_GB_PW] = { value: "" };
    rec[FC674_SB_ID] = { value: "" };
    rec[FC674_SB_PW] = { value: "" };
    rec[FC674_VPN_ID] = { value: "" };
    rec[FC674_VPN_PW] = { value: "" };
    return rec;
  }

  function revisionFromKintoneGetResp595(resp) {
    if (!resp) {
      return null;
    }
    if (resp.revision !== undefined && resp.revision !== null && resp.revision !== "") {
      return String(resp.revision);
    }
    var rec = resp.record;
    if (
      rec &&
      rec.$revision &&
      rec.$revision.value !== undefined &&
      rec.$revision.value !== null
    ) {
      return String(rec.$revision.value);
    }
    return null;
  }

  function get674RecordForRetire595(id674) {
    var url = kintone.api.url("/k/v1/record.json", true);
    return kintone
      .api(url, "GET", {
        app: APP674,
        id: String(id674),
      })
      .then(function (resp) {
        return {
          record: resp.record || null,
          revision: revisionFromKintoneGetResp595(resp),
        };
      });
  }

  function fetch674IdsByMailForRetire595(mail) {
    if (!mail) {
      return Promise.resolve([]);
    }
    var url = kintone.api.url("/k/v1/records.json", true);
    var q =
      FC674_MAIL +
      ' = "' +
      escapeForQuery(mail) +
      '" and ' +
      FC674_PC_STATUS +
      ' not in ("' +
      escapeForQuery(PC_STATUS_STORAGE) +
      '", "' +
      escapeForQuery(PC_STATUS_DISPOSED) +
      '") order by $id asc limit 500';
    return kintone
      .api(url, "GET", {
        app: APP674,
        query: q,
        fields: ["$id"],
      })
      .then(function (resp) {
        var ids = [];
        var rows = resp.records || [];
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].$id && rows[i].$id.value) {
            ids.push(String(rows[i].$id.value));
          }
        }
        return ids;
      });
  }

  function fetch674IdsByUserNameForRetire595(userName) {
    if (!userName) {
      return Promise.resolve([]);
    }
    var url = kintone.api.url("/k/v1/records.json", true);
    var q =
      FC674_NAME +
      ' = "' +
      escapeForQuery(userName) +
      '" and ' +
      FC674_PC_STATUS +
      ' not in ("' +
      escapeForQuery(PC_STATUS_STORAGE) +
      '", "' +
      escapeForQuery(PC_STATUS_DISPOSED) +
      '") order by $id asc limit 500';
    return kintone
      .api(url, "GET", {
        app: APP674,
        query: q,
        fields: ["$id"],
      })
      .then(function (resp) {
        var ids = [];
        var rows = resp.records || [];
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].$id && rows[i].$id.value) {
            ids.push(String(rows[i].$id.value));
          }
        }
        return ids;
      });
  }

  function collect674TargetIdsForRetire595(record) {
    var mail = scalarFrom595(record, FC595_MAIL).trim();
    var userName = scalarFrom595(record, FC595_NAME).trim();
    return collect674MirrorTargetIdsFrom595(record).then(function (mirrorIds) {
      return fetch674IdsByMailForRetire595(mail).then(function (mailIds) {
        return fetch674IdsByUserNameForRetire595(userName).then(function (nameIds) {
          return uniqueStringIds(mirrorIds.concat(mailIds).concat(nameIds));
        });
      });
    });
  }

  function sync671MasterFrom674595(masterRecordId) {
    var midStr = String(masterRecordId || "").trim();
    if (!midStr) {
      return Promise.resolve();
    }
    var urlGet674 = kintone.api.url("/k/v1/records.json", true);
    var q =
      '(account_type in ("共有", "JR端末")) and pc_status not in ("' +
      escapeForQuery(PC_STATUS_DISPOSED) +
      '") and m365_master_record_id = ' +
      midStr +
      " limit 500";
    return kintone
      .api(urlGet674, "GET", {
        app: APP674,
        query: q,
        fields: ["pc_name"],
      })
      .then(function (resp674) {
        var set = Object.create(null);
        var rows = resp674.records || [];
        for (var i = 0; i < rows.length; i++) {
          var p = scalar674FromRow(rows[i], "pc_name").trim();
          if (p) {
            set[p] = true;
          }
        }
        var pcsArr = Object.keys(set).sort();
        var desiredLinked = pcsArr.join(",");
        var desiredUsage = pcsArr.length;
        var desiredStatus = desiredUsage >= 5 ? "満杯" : "利用可";
        var url671Get = kintone.api.url("/k/v1/record.json", true);
        return kintone.api(url671Get, "GET", { app: APP671, id: midStr }).then(function (get671) {
          var r671 = get671.record;
          var rev671 = revisionFromKintoneGetResp595(get671);
          var st671 = scalar674FromRow(r671, "status").trim();
          if (st671 === "廃止" || !rev671) {
            return Promise.resolve();
          }
          var url671Put = kintone.api.url("/k/v1/record.json", true);
          return kintone.api(url671Put, "PUT", {
            app: APP671,
            id: midStr,
            revision: rev671,
            record: {
              linked_pcs: { value: desiredLinked },
              usage_count: { value: String(desiredUsage) },
              status: { value: desiredStatus },
            },
          });
        });
      })
      .catch(function (e) {
        console.warn("[jbis 595 retire 671 sync]", midStr, e);
        return Promise.resolve();
      });
  }

  function sync671MastersFrom674Retire595(mids) {
    var uniq = uniqueStringIds(mids || []);
    return uniq.reduce(function (chain, mid) {
      return chain.then(function () {
        return sync671MasterFrom674595(mid);
      });
    }, Promise.resolve());
  }

  function retireSingle674From595(id674, retiredDate, userName) {
    return get674RecordForRetire595(id674).then(function (payload) {
      var tr = payload.record;
      var rev = payload.revision;
      if (!tr || !tr.$id || !rev) {
        return { skipped: true, masterId: "" };
      }
      var st = scalar674FromRow(tr, FC674_PC_STATUS).trim();
      if (st === PC_STATUS_DISPOSED) {
        return { skipped: true, masterId: "" };
      }
      var snapshot = {
        logon: scalar674FromRow(tr, FC674_LOGON).trim(),
        logonPw: scalar674FromRow(tr, FC674_LOGON_PW).trim(),
        winPw: scalar674FromRow(tr, FC674_MAIL_PW).trim(),
        mail: scalar674FromRow(tr, FC674_MAIL).trim(),
      };
      var masterId = scalar674FromRow(tr, FC674_M365_MASTER).trim();
      var prevNote = scalar674FromRow(tr, FC674_NOTE).trim();
      var stamp = buildRetire674Note595(snapshot, retiredDate, userName);
      var nextNote = prevNote ? prevNote + "\n" + stamp : stamp;
      var putRec = buildRetire674ClearRecord595();
      putRec[FC674_NOTE] = { value: nextNote };
      var urlPut = kintone.api.url("/k/v1/record.json", true);
      return kintone
        .api(urlPut, "PUT", {
          app: APP674,
          id: String(id674),
          revision: rev,
          record: putRec,
        })
        .then(function () {
          return { skipped: false, masterId: masterId };
        });
    });
  }

  function clear595PcLedgerSubtablesOnRetire595(record) {
    var rid =
      record && record.$id && record.$id.value != null
        ? String(record.$id.value).trim()
        : "";
    if (!rid) {
      return Promise.resolve();
    }
    var has674 = collectSubtableNumericIds(record, FC595_PC674_SUB, FC595_PC674_ID).length;
    if (!has674) {
      return Promise.resolve();
    }
    var app595 = kintone.app.getId();
    var urlGet = kintone.api.url("/k/v1/record.json", true);
    var urlPut = kintone.api.url("/k/v1/record.json", true);
    return kintone
      .api(urlGet, "GET", { app: app595, id: rid })
      .then(function (resp) {
        var full = resp.record;
        var rev = revisionFromKintoneGetResp595(resp);
        if (!full || !rev) {
          return;
        }
        var recPatch = {};
        if (collectSubtableNumericIds(full, FC595_PC674_SUB, FC595_PC674_ID).length) {
          recPatch[FC595_PC674_SUB] = { value: [] };
        }
        if (!Object.keys(recPatch).length) {
          return;
        }
        return kintone.api(urlPut, "PUT", {
          app: app595,
          id: rid,
          revision: rev,
          record: recPatch,
        });
      })
      .catch(function (e) {
        console.warn("[jbis 595 retire] clear pc_ledger subtable failed", rid, e);
        throw e;
      });
  }

  function retire674PcsFrom595(record) {
    var emp = scalarFrom595(record, FC595_EMP).trim();
    if (emp !== EMP_RETIRED) {
      return Promise.resolve();
    }
    var userName = scalarFrom595(record, FC595_NAME);
    var retiredDate = scalarFrom595(record, FC595_RETIRED).trim() || todayYmd595();
    return collect674TargetIdsForRetire595(record).then(function (ids) {
      if (!ids.length) {
        console.warn("[jbis 595 retire] no 674 targets", {
          mail: scalarFrom595(record, FC595_MAIL).trim(),
          empId: scalarFrom595(record, FC595_EMP_ID).trim(),
        });
        window.alert(
          "在籍を「退職」に保存しましたが、保管連携対象の PC台帳（674）が見つかりませんでした。\n" +
            "社員メール・EMP-ID・674サブテーブル紐づけをご確認ください。"
        );
        return;
      }
      var masterIds = [];
      return ids
        .reduce(function (chain, id674) {
          return chain.then(function () {
            return retireSingle674From595(id674, retiredDate, userName).then(function (res) {
              if (res && res.masterId) {
                masterIds.push(res.masterId);
              }
            });
          });
        }, Promise.resolve())
        .then(function () {
          return sync671MastersFrom674Retire595(masterIds);
        })
        .then(function () {
          return clear595PcLedgerSubtablesOnRetire595(record);
        });
    });
  }

  function recordsNeedingMirror(rows, name, dept, grp, nameCode, deptCode, grpCode, empId, empCode) {
    var updates = [];
    var empWant = String(empId || "").trim();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var curN = ((r[nameCode] && r[nameCode].value) || "").trim();
      var curD = ((r[deptCode] && r[deptCode].value) || "").trim();
      var curG = ((r[grpCode] && r[grpCode].value) || "").trim();
      var curEmp = empCode ? ((r[empCode] && r[empCode].value) || "").trim() : "";
      var needOrg = !(curN === name.trim() && curD === dept.trim() && curG === grp.trim());
      var needEmp = !!(empCode && empWant && !curEmp);
      if (!needOrg && !needEmp) {
        continue;
      }
      var row = {
        id: r.$id.value,
        record: {}
      };
      if (needOrg) {
        row.record[nameCode] = { value: name };
        row.record[deptCode] = { value: dept };
        row.record[grpCode] = { value: grp };
      }
      if (needEmp) {
        row.record[empCode] = { value: empWant };
      }
      if (r.$revision && r.$revision.value !== undefined && r.$revision.value !== null) {
        row.revision = r.$revision.value;
      }
      updates.push(row);
    }
    return updates;
  }

  function fetch674IdsByMailForMirror595(mail) {
    if (!mail) {
      return Promise.resolve([]);
    }
    var url = kintone.api.url("/k/v1/records.json", true);
    var q =
      FC674_MAIL +
      ' = "' +
      escapeForQuery(mail) +
      '" and ' +
      FC674_TYPE +
      ' in ("' +
      escapeForQuery(TYPE_PERSONAL) +
      '") and ' +
      FC674_PC_STATUS +
      ' not in ("' +
      escapeForQuery(PC_STATUS_STORAGE) +
      '") order by $id asc limit 500';
    return kintone
      .api(url, "GET", {
        app: APP674,
        query: q,
        fields: ["$id"],
      })
      .then(function (resp) {
        var ids = [];
        var rows = resp.records || [];
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].$id && rows[i].$id.value) {
            ids.push(String(rows[i].$id.value));
          }
        }
        return ids;
      });
  }

  function fetch674IdsByEmpIdForMirror595(empId) {
    if (!empId) {
      return Promise.resolve([]);
    }
    var url = kintone.api.url("/k/v1/records.json", true);
    var q =
      FC674_EMP_ID +
      ' = "' +
      escapeForQuery(empId) +
      '" and ' +
      FC674_TYPE +
      ' in ("' +
      escapeForQuery(TYPE_PERSONAL) +
      '") and ' +
      FC674_PC_STATUS +
      ' not in ("' +
      escapeForQuery(PC_STATUS_STORAGE) +
      '") order by $id asc limit 500';
    return kintone
      .api(url, "GET", {
        app: APP674,
        query: q,
        fields: ["$id"],
      })
      .then(function (resp) {
        var ids = [];
        var rows = resp.records || [];
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].$id && rows[i].$id.value) {
            ids.push(String(rows[i].$id.value));
          }
        }
        return ids;
      });
  }

  function collect674MirrorTargetIdsFrom595(record) {
    var fromSub = collectSubtableNumericIds(record, FC595_PC674_SUB, FC595_PC674_ID);
    var mail = scalarFrom595(record, FC595_MAIL).trim();
    var empId = scalarFrom595(record, FC595_EMP_ID).trim();
    return fetch674IdsByMailForMirror595(mail).then(function (fromMail) {
      return fetch674IdsByEmpIdForMirror595(empId).then(function (fromEmp) {
        return uniqueStringIds(fromSub.concat(fromMail).concat(fromEmp));
      });
    });
  }

  function fetch674RowsByIdsForMirror(ids) {
    if (!ids.length) {
      return Promise.resolve([]);
    }
    var urlGet = kintone.api.url("/k/v1/records.json", true);
    var fields = [
      "$id",
      "$revision",
      FC674_TYPE,
      FC674_PC_STATUS,
      FC674_NAME,
      FC674_DEPT,
      FC674_GROUP,
      FC674_EMP_ID,
    ];
    var parts = chunk(ids, 100);
    return parts.reduce(function (chain, part) {
      return chain.then(function (acc) {
        var inList = part.map(function (id) {
          return '"' + escapeForQuery(id) + '"';
        });
        var q = "$id in (" + inList.join(", ") + ") order by $id asc";
        return kintone
          .api(urlGet, "GET", {
            app: APP674,
            query: q,
            fields: fields,
          })
          .then(function (resp) {
            var rows = resp.records || [];
            for (var i = 0; i < rows.length; i++) {
              var r = rows[i];
              var type = scalar674FromRow(r, FC674_TYPE).trim();
              var st = scalar674FromRow(r, FC674_PC_STATUS).trim();
              if (type !== TYPE_PERSONAL || st === PC_STATUS_STORAGE) {
                continue;
              }
              acc.push(r);
            }
            return acc;
          });
      });
    }, Promise.resolve([]));
  }

  function put674MirrorUpdates(updates) {
    if (!updates.length) {
      return Promise.resolve();
    }
    var urlPut = kintone.api.url("/k/v1/records.json", true);
    var parts = chunk(updates, 100);
    return parts.reduce(function (chain, part) {
      return chain.then(function () {
        return kintone.api(urlPut, "PUT", { app: APP674, records: part });
      });
    }, Promise.resolve());
  }

  function fetch674PersonalTargets(mail, name, dept, grp, record) {
    var collectPromise = record
      ? collect674MirrorTargetIdsFrom595(record)
      : fetch674IdsByMailForMirror595(mail);
    return collectPromise.then(function (ids) {
      if (!ids.length) {
        return;
      }
      return fetch674RowsByIdsForMirror(ids).then(function (rows) {
        var empId = record ? scalarFrom595(record, FC595_EMP_ID).trim() : "";
        var updates = recordsNeedingMirror(
          rows,
          name,
          dept,
          grp,
          FC674_NAME,
          FC674_DEPT,
          FC674_GROUP,
          empId,
          FC674_EMP_ID
        );
        return put674MirrorUpdates(updates);
      });
    });
  }

  function sync674MirrorFrom595(record) {
    var mail = scalarFrom595(record, FC595_MAIL).trim();
    var empId = scalarFrom595(record, FC595_EMP_ID).trim();
    var fromSub = collectSubtableNumericIds(record, FC595_PC674_SUB, FC595_PC674_ID);
    if (!mail && !empId && !fromSub.length) {
      return Promise.resolve();
    }
    var name = scalarFrom595(record, FC595_NAME);
    var dept = scalarFrom595(record, FC595_DEPT);
    var grp = scalarFrom595(record, FC595_GROUP);
    return fetch674PersonalTargets(mail, name, dept, grp, record);
  }

  function syncSoftwareLedgerMirrorFrom595(record) {
    var empId = scalarFrom595(record, FC595_EMP_ID).trim();
    if (!empId) {
      return Promise.resolve();
    }
    var name = scalarFrom595(record, FC595_NAME);
    var dept = scalarFrom595(record, FC595_DEPT);
    var grp = scalarFrom595(record, FC595_GROUP);
    return fetchSoftwareLedgerMirrorTargets(empId, name, dept, grp);
  }

  function fetchSoftwareLedgerMirrorTargets(empId, name, dept, grp) {
    var offset = 0;
    var limit = 500;
    var urlGet = kintone.api.url("/k/v1/records.json", true);

    function page() {
      var q =
        FC_SWL_EMP_ID +
        ' = "' +
        escapeForQuery(empId) +
        '" and ' +
        FC_SWL_STATUS +
        ' in ("' +
        escapeForQuery(SWL_STATUS_ACTIVE) +
        '") order by $id asc limit ' +
        limit +
        " offset " +
        offset;
      return kintone
        .api(urlGet, "GET", {
          app: APP_SOFTWARE_DB,
          query: q,
          fields: ["$id", "$revision", FC_SWL_NAME, FC_SWL_DEPT, FC_SWL_GROUP, "install_target"],
        })
        .then(function (resp) {
          var list = (resp.records || []).filter(function (rec) {
            var t = rec.install_target && rec.install_target.value;
            return String(t || "").trim() !== "共有";
          });
          var updates = recordsNeedingMirror(
            list,
            name,
            dept,
            grp,
            FC_SWL_NAME,
            FC_SWL_DEPT,
            FC_SWL_GROUP
          );
          if (!updates.length) {
            if (list.length < limit) {
              return;
            }
            offset += limit;
            return page();
          }
          var urlPut = kintone.api.url("/k/v1/records.json", true);
          var parts = chunk(updates, 100);
          return parts
            .reduce(function (chain, part) {
              return chain.then(function () {
                return kintone.api(urlPut, "PUT", { app: APP_SOFTWARE_DB, records: part });
              });
            }, Promise.resolve())
            .then(function () {
              if (list.length < limit) {
                return;
              }
              offset += limit;
              return page();
            });
        });
    }

    return page();
  }

  function syncStorageMediaLedgerMirrorFrom595(record) {
    var empId = scalarFrom595(record, FC595_EMP_ID).trim();
    if (!empId) {
      return Promise.resolve();
    }
    var name = scalarFrom595(record, FC595_NAME);
    var dept = scalarFrom595(record, FC595_DEPT);
    var grp = scalarFrom595(record, FC595_GROUP);
    return fetchStorageMediaLedgerMirrorTargets(empId, name, dept, grp);
  }

  function fetchStorageMediaLedgerMirrorTargets(empId, name, dept, grp) {
    var offset = 0;
    var limit = 500;
    var urlGet = kintone.api.url("/k/v1/records.json", true);

    function page() {
      var q =
        FC_SWL_EMP_ID +
        ' = "' +
        escapeForQuery(empId) +
        '" and ' +
        FC_SWL_STATUS +
        ' in ("' +
        escapeForQuery(SWL_STATUS_ACTIVE) +
        '") order by $id asc limit ' +
        limit +
        " offset " +
        offset;
      return kintone
        .api(urlGet, "GET", {
          app: APP_STORAGE_MEDIA_DB,
          query: q,
          fields: ["$id", "$revision", FC_SWL_NAME, FC_SWL_DEPT, FC_SWL_GROUP],
        })
        .then(function (resp) {
          var list = resp.records || [];
          var updates = recordsNeedingMirror(
            list,
            name,
            dept,
            grp,
            FC_SWL_NAME,
            FC_SWL_DEPT,
            FC_SWL_GROUP
          );
          if (!updates.length) {
            if (list.length < limit) {
              return;
            }
            offset += limit;
            return page();
          }
          var urlPut = kintone.api.url("/k/v1/records.json", true);
          var parts = chunk(updates, 100);
          return parts
            .reduce(function (chain, part) {
              return chain.then(function () {
                return kintone.api(urlPut, "PUT", { app: APP_STORAGE_MEDIA_DB, records: part });
              });
            }, Promise.resolve())
            .then(function () {
              if (list.length < limit) {
                return;
              }
              offset += limit;
              return page();
            });
        });
    }

    return page();
  }

  function fetchAll595RecordsForBulkDownstreamSync(appId) {
    var fields = [
      "$id",
      FC595_MAIL,
      FC595_NAME,
      FC595_DEPT,
      FC595_GROUP,
      FC595_EMP,
      FC595_EMP_ID,
      FC595_RETIRED,
      FC595_PC674_SUB,
    ];
    var all = [];
    var limit = 500;
    var url = kintone.api.url("/k/v1/records.json", true);

    function page(offset) {
      var query = "order by $id asc limit " + limit + " offset " + offset;
      return kintone.api(url, "GET", { app: appId, query: query, fields: fields }).then(function (resp) {
        var batch = resp.records || [];
        for (var i = 0; i < batch.length; i++) {
          all.push(batch[i]);
        }
        if (batch.length < limit) {
          return all;
        }
        return page(offset + limit);
      });
    }

    return page(0);
  }

  function run595MirrorOnlyFrom595(record) {
    var emp = scalarFrom595(record, FC595_EMP).trim();
    if (emp === EMP_RETIRED) {
      return Promise.resolve({ skipped: true, reason: "retired" });
    }
    return sync674MirrorFrom595(record)
      .then(function () {
        return syncSoftwareLedgerMirrorFrom595(record);
      })
      .then(function () {
        return syncStorageMediaLedgerMirrorFrom595(record);
      })
      .then(function () {
        return { skipped: false };
      });
  }

  function start595BulkDownstreamSync595(btn) {
    if (!btn || btn.disabled) {
      return;
    }
    var ok = window.confirm(
      "595 の現在の氏名・所属を、新PC台帳（674）・ソフトウエア台帳（714）・記憶媒体等台帳（716）へ一括反映します。\n\n" +
        "・CSV 取込後にご利用ください\n" +
        "・退職者は対象外です（個別保存時の退職連携は従来どおり）\n" +
        "・件数により 1〜2 分かかることがあります\n\n" +
        "実行しますか？"
    );
    if (!ok) {
      return;
    }

    var appId = kintone.app.getId();
    btn.disabled = true;
    btn.style.opacity = "0.65";
    btn.style.cursor = "wait";
    setBulkDownstreamStatus595("社員マスタを取得中…", false);

    var stats = { total: 0, processed: 0, skippedRetired: 0, failed: 0, errors: [] };

    fetchAll595RecordsForBulkDownstreamSync(appId)
      .then(function (records) {
        stats.total = records.length;
        return records.reduce(function (chain, rec) {
          return chain.then(function () {
            stats.processed += 1;
            if (stats.processed % 5 === 0 || stats.processed === stats.total) {
              setBulkDownstreamStatus595(
                "反映中… " + stats.processed + " / " + stats.total,
                false
              );
            }
            return run595MirrorOnlyFrom595(rec)
              .then(function (res) {
                if (res && res.skipped) {
                  stats.skippedRetired += 1;
                }
              })
              .catch(function (e) {
                stats.failed += 1;
                var rid = rec.$id && rec.$id.value != null ? String(rec.$id.value) : "?";
                var nm = scalarFrom595(rec, FC595_NAME) || scalarFrom595(rec, FC595_MAIL);
                var msg = (e && e.message) || String(e);
                stats.errors.push("$id=" + rid + " " + nm + ": " + msg);
                if (stats.errors.length > 8) {
                  stats.errors.length = 8;
                }
              });
          });
        }, Promise.resolve());
      })
      .then(function () {
        var logLine = formatBulkSyncLogLine595(stats);
        setBulkDownstreamStatus595(stats.failed > 0 ? "完了（失敗あり）" : "完了", stats.failed > 0);
        setBulkDownstreamLastLog595(logLine);
        return write595BulkSyncLog595(logLine).then(function (wr) {
          var alertMsg = logLine;
          if (wr && wr.ok === false && wr.reason) {
            alertMsg +=
              "\n\n※ 697 へのログ保存に失敗しました（このブラウザには記録済み）: " + wr.reason;
          }
          if (stats.errors.length) {
            alertMsg += "\n\n失敗（先頭 " + stats.errors.length + " 件）:\n" + stats.errors.join("\n");
          }
          window.alert(alertMsg);
        });
      })
      .catch(function (e) {
        console.error("[jbis 595 bulk downstream]", e);
        setBulkDownstreamStatus595("一括反映に失敗しました", true);
        window.alert(
          "一括反映の開始に失敗しました。" + (e && e.message ? "\n" + e.message : "")
        );
      })
      .then(function () {
        btn.disabled = false;
        btn.style.opacity = "";
        btn.style.cursor = "pointer";
      });
  }

  function fetch595RecordForDownstreamSync(recordId) {
    if (!recordId) {
      return Promise.resolve(null);
    }
    return kintone
      .api(kintone.api.url("/k/v1/record.json", true), "GET", {
        app: kintone.app.getId(),
        id: String(recordId),
      })
      .then(function (resp) {
        return resp.record || null;
      });
  }

  function isRosterCategory595(cat) {
    return cat === CAT_SEISHAIN || cat === CAT_JUNSHAIN;
  }

  function isBuchoTitle595(title) {
    return /部長/.test(String(title || ""));
  }

  function fetch776RowsBySource595(sourceId) {
    var url = kintone.api.url("/k/v1/records.json", true);
    return kintone
      .api(url, "GET", {
        app: APP_ROSTER_776,
        query:
          'source_595_id = ' +
          String(sourceId) +
          ' order by $id asc limit 100',
        fields: ["$id", "row_role", "dept_name", "job_title", "list_sort"],
      })
      .then(function (resp) {
        return resp.records || [];
      });
  }

  function delete776Records595(ids) {
    if (!ids || !ids.length) {
      return Promise.resolve();
    }
    return kintone.api(kintone.api.url("/k/v1/records.json", true), "DELETE", {
      app: APP_ROSTER_776,
      ids: ids.map(String),
    });
  }

  function fetchDeptPrimarySortBounds595(dept) {
    var d = String(dept || "").trim();
    if (!d) {
      return Promise.resolve({ min: 999999, max: 999999 });
    }
    var url = kintone.api.url("/k/v1/records.json", true);
    return kintone
      .api(url, "GET", {
        app: kintone.app.getId(),
        query:
          'employment_status in ("' +
          escapeForQuery(EMP_ACTIVE) +
          '") and dept_name = "' +
          escapeForQuery(d) +
          '" and sort != "" order by sort asc limit 500',
        fields: ["$id", FC595_SORT],
      })
      .then(function (resp) {
        var rows = resp.records || [];
        var min = 999999;
        var max = 0;
        for (var i = 0; i < rows.length; i++) {
          var s = Number(scalarFrom595(rows[i], FC595_SORT));
          if (!isFinite(s) || s <= 0) continue;
          if (s < min) min = s;
          if (s > max) max = s;
        }
        if (max === 0) {
          return { min: 999999, max: 999999 };
        }
        return { min: min, max: max };
      });
  }

  function computeRosterListSort595(role, title, ownSort, bounds) {
    var scale = ROSTER_SORT_SCALE;
    if (role === "兼務" && isBuchoTitle595(title)) {
      return bounds.min * scale - 1;
    }
    if (role === "兼務") {
      return bounds.max * scale + 1;
    }
    var s = Number(ownSort);
    if (!isFinite(s) || s <= 0) {
      return 999999 * scale;
    }
    return s * scale;
  }

  function buildRosterPrimaryRecord595(record, listSort) {
    return {
      source_595_id: { value: String(record.$id.value) },
      emp_id_ref: { value: scalarFrom595(record, FC595_EMP_ID) },
      employee_no: { value: scalarFrom595(record, FC595_EMP_NO) },
      user_name: { value: scalarFrom595(record, FC595_NAME) },
      mail: { value: scalarFrom595(record, FC595_MAIL) },
      job_title: { value: scalarFrom595(record, FC595_JOB) },
      employment_category: { value: scalarFrom595(record, FC595_CAT) },
      dept_name: { value: scalarFrom595(record, FC595_DEPT) },
      group_name: { value: scalarFrom595(record, FC595_GROUP) },
      row_role: { value: "本務" },
      is_primary: { value: "本務" },
      match_status: { value: "一致" },
      list_sort: { value: String(listSort) },
    };
  }

  function buildRosterConcurrentRecord595(record, cp, listSort) {
    var v = cp && cp.value ? cp.value : {};
    function cell(code) {
      return v[code] && v[code].value != null ? String(v[code].value) : "";
    }
    return {
      source_595_id: { value: String(record.$id.value) },
      emp_id_ref: { value: scalarFrom595(record, FC595_EMP_ID) },
      employee_no: { value: scalarFrom595(record, FC595_EMP_NO) },
      user_name: { value: scalarFrom595(record, FC595_NAME) },
      mail: { value: scalarFrom595(record, FC595_MAIL) },
      job_title: { value: cell(FC595_CP_TITLE) },
      employment_category: { value: scalarFrom595(record, FC595_CAT) },
      dept_name: { value: cell(FC595_CP_DEPT) },
      group_name: { value: cell(FC595_CP_GROUP) },
      row_role: { value: "兼務" },
      is_primary: { value: "兼務" },
      match_status: { value: "一致" },
      list_sort: { value: String(listSort) },
    };
  }

  /**
   * 595 1人 → 776 upsert（正社員/準社員のみ。以外・退職は776から削除）。
   * list_sort: 本務=595.sort×10 / 兼務部長=部署本務min×10-1。
   * emp_id は emp_id_ref へのコピーのみ。
   */
  function syncRoster776OneFrom595(record) {
    if (!record || !record.$id || record.$id.value == null) {
      return Promise.resolve();
    }
    var sid = String(record.$id.value);
    var cat = scalarFrom595(record, FC595_CAT).trim();
    var emp = scalarFrom595(record, FC595_EMP).trim();
    var keep = isRosterCategory595(cat) && emp !== EMP_RETIRED;

    return fetch776RowsBySource595(sid).then(function (existing) {
      if (!keep) {
        var delIds = existing.map(function (r) {
          return r.$id.value;
        });
        return delete776Records595(delIds);
      }

      var ownSort = Number(scalarFrom595(record, FC595_SORT));
      var primaryDept = scalarFrom595(record, FC595_DEPT).trim();
      var conc = record[FC595_CONCURRENT];
      var cpRows = conc && Array.isArray(conc.value) ? conc.value : [];

      var deptSet = {};
      deptSet[primaryDept] = true;
      for (var i = 0; i < cpRows.length; i++) {
        var cpv = cpRows[i] && cpRows[i].value ? cpRows[i].value : {};
        var cd =
          cpv[FC595_CP_DEPT] && cpv[FC595_CP_DEPT].value != null
            ? String(cpv[FC595_CP_DEPT].value).trim()
            : "";
        if (cd) deptSet[cd] = true;
      }

      var deptList = Object.keys(deptSet).filter(Boolean);
      return Promise.all(deptList.map(fetchDeptPrimarySortBounds595)).then(function (boundsList) {
        var boundsByDept = {};
        for (var bi = 0; bi < deptList.length; bi++) {
          boundsByDept[deptList[bi]] = boundsList[bi];
        }
        var primaryBounds = boundsByDept[primaryDept] || { min: ownSort || 999999, max: ownSort || 999999 };
        var primarySort = computeRosterListSort595("本務", "", ownSort, primaryBounds);

        var desired = [];
        desired.push({
          key: "本務|" + primaryDept,
          record: buildRosterPrimaryRecord595(record, primarySort),
        });
        for (var ci = 0; ci < cpRows.length; ci++) {
          var row = cpRows[ci];
          var rv = row && row.value ? row.value : {};
          var cDept =
            rv[FC595_CP_DEPT] && rv[FC595_CP_DEPT].value != null
              ? String(rv[FC595_CP_DEPT].value).trim()
              : "";
          var cTitle =
            rv[FC595_CP_TITLE] && rv[FC595_CP_TITLE].value != null
              ? String(rv[FC595_CP_TITLE].value).trim()
              : "";
          if (!cDept && !cTitle) continue;
          var bb = boundsByDept[cDept] || { min: 999999, max: 999999 };
          var ls = computeRosterListSort595("兼務", cTitle, ownSort, bb);
          if (!isBuchoTitle595(cTitle)) {
            ls = ls + ci;
          }
          desired.push({
            key: "兼務|" + cDept + "|" + cTitle + "|" + ci,
            record: buildRosterConcurrentRecord595(record, row, ls),
          });
        }

        var primaryExist = null;
        var kenmuExist = [];
        for (var ei = 0; ei < existing.length; ei++) {
          var er = existing[ei];
          if ((er.row_role && er.row_role.value) === "本務") {
            primaryExist = er;
          } else {
            kenmuExist.push(er);
          }
        }

        var ops = [];
        var primaryDesired = desired[0];
        if (primaryExist) {
          ops.push(
            kintone.api(kintone.api.url("/k/v1/record.json", true), "PUT", {
              app: APP_ROSTER_776,
              id: primaryExist.$id.value,
              record: primaryDesired.record,
            })
          );
        } else {
          ops.push(
            kintone.api(kintone.api.url("/k/v1/record.json", true), "POST", {
              app: APP_ROSTER_776,
              record: primaryDesired.record,
            })
          );
        }

        // 兼務は一旦削除して作り直し（行数変動に強い）
        if (kenmuExist.length) {
          ops.push(
            delete776Records595(
              kenmuExist.map(function (r) {
                return r.$id.value;
              })
            )
          );
        }
        return Promise.all(ops).then(function () {
          var toAdd = [];
          for (var di = 1; di < desired.length; di++) {
            toAdd.push(desired[di].record);
          }
          if (!toAdd.length) {
            return;
          }
          return kintone.api(kintone.api.url("/k/v1/records.json", true), "POST", {
            app: APP_ROSTER_776,
            records: toAdd,
          });
        });
      });
    });
  }

  function run595DownstreamSync(record) {
    var emp = scalarFrom595(record, FC595_EMP).trim();
    var chain;
    if (emp === EMP_RETIRED) {
      chain = retire674PcsFrom595(record);
    } else {
      chain = sync674MirrorFrom595(record).then(function () {
        return syncSoftwareLedgerMirrorFrom595(record).then(function () {
          return syncStorageMediaLedgerMirrorFrom595(record);
        });
      });
    }
    return chain.then(function () {
      return syncRoster776OneFrom595(record).catch(function (eRoster) {
        console.error("[jbis 595 roster-776]", eRoster);
        window.alert(
          "社員マスタは保存されましたが、社員名簿（776）への反映に失敗しました。権限を確認し、必要なら再度保存してください。" +
            (eRoster && eRoster.message ? "\n" + eRoster.message : "")
        );
      });
    });
  }

  var submitBefore = [
    "app.record.create.submit",
    "app.record.edit.submit",
    "mobile.app.record.create.submit",
    "mobile.app.record.edit.submit",
  ];
  kintone.events.on(submitBefore, function (event) {
    return Promise.resolve(applyEmpIdOnSubmit595(event)).then(function (ev) {
      if (ev === false) {
        return false;
      }
      return applySortPositionOnSubmit595(ev);
    });
  });

  var ev = [
    "app.record.create.submit.success",
    "app.record.edit.submit.success",
    "mobile.app.record.create.submit.success",
    "mobile.app.record.edit.submit.success"
  ];

  kintone.events.on(ev, function (event) {
    var rid = event.record && event.record.$id && event.record.$id.value;
    return fetch595RecordForDownstreamSync(rid)
      .then(function (fullRec) {
        return run595DownstreamSync(fullRec || event.record);
      })
      .then(function () {
        return event;
      })
      .catch(function (e) {
        console.error("[jbis 595 downstream]", e);
        var msg =
          "社員マスタ保存後の連携（674／714／716／776名簿）の一部に失敗しました。権限・ネットワークを確認し、必要なら手動で更新してください。";
        if (e && e.message) {
          msg += "\n" + e.message;
        }
        alert(msg);
        return event;
      });
  });
})();
