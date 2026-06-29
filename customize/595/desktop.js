(function () {
  "use strict";

  /**
   * 595 社員マスタ
   * BUILD: 2026-06-19-595-dept-picker-680（新規・編集: 680 所属候補モーダル＋手入力併用）
   * BUILD: 2026-06-17-595-emp-id-auto-assign（新規/未付番保存時に EMP-xxxx 自動採番）
   * BUILD: 2026-06-14-595-storage-media-ledger-mirror
   * BUILD: 2026-05-12-595-no594-rest（旧594への REST・リンク廃止・674同期のみ）
   * BUILD: 2026-05-30-595-retire-674-storage（退職→退職日自動・674保管連動）
   * - 一覧: 所属グループ・所属名・社員名のいずれかに部分一致する検索窓（ヘッダスペース）
   * - 詳細・編集: サブテーブル（674）からレコードへのリンクをヘッダ下に表示
   * - 保存: 在籍=退職かつ退職日空→当日を退職日に設定／**emp_id 空なら EMP-xxxx 自動採番**
   * - 保存成功後: 退職時は 674 を保管＋アカウントクリア＋備考追記／それ以外は 674・714・716 所属ミラー
   * - 新規・編集: 680 所属候補マスタから所属名・所属グループを選ぶモーダル（手入力も可）
   */

  var BUILD = "2026-06-23-595-dept-master-sort-no";

  /** 新・PC台帳 所属候補マスタ（674 共有・JR と共用） */
  var APP_DEPT_MASTER_595 = "680";
  /** 新・PC台帳 ver.1（674） */
  var APP674 = "674";
  /** ソフトウエア台帳 DB（714）— 595 所属ミラー */
  var APP_SOFTWARE_DB = "714";
  /** 記憶媒体等台帳 DB — 595 所属ミラー（作成後に appId を更新） */
  var APP_STORAGE_MEDIA_DB = "716";
  /** M365 管理マスタ（674 退職連動後の usage_count 再計算） */
  var APP671 = "671";

  var FC595_MAIL = "mail";
  var FC595_NAME = "user_name";
  var FC595_DEPT = "dept_name";
  var FC595_GROUP = "group_name";
  var FC595_EMP = "employment_status";
  var FC595_EMP_ID = "emp_id";
  var FC595_RETIRED = "retired_date";

  var FC674_MAIL = "mail";
  var FC674_NAME = "user_name";
  var FC674_DEPT = "dept_name";
  var FC674_GROUP = "group_name";
  var FC674_TYPE = "account_type";
  var FC674_PC_STATUS = "pc_status";
  var FC674_LOGON = "logon_name";
  var FC674_WIN_NAME = "windows_name";
  var FC674_MAIL_PW = "mail_pw";
  var FC674_M365_ID = "m365_id";
  var FC674_M365_PW = "m365_pw";
  var FC674_M365_MASTER = "m365_master_record_id";
  var FC674_M365_KIRIKAE = "M365_kirikae";
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

  /** 595 上の PC 台帳紐づけ（旧594由来の列。リンクは出さず674のみ） */
  var FC595_PC594_SUB = "pc_ledger_list";
  var FC595_PC594_ID = "pc_594_record_id";
  /** 595 上の 新・PC台帳（674） */
  var FC595_PC674_SUB = "pc_ledger_v1_list";
  var FC595_PC674_ID = "pc_674_record_id";

  var LINK_BOX_ID = "jbis-595-pc-ledger-link-box";
  var DEPT_PICKER_WRAP_ID = "jbis-595-dept-picker-wrap";
  var DEPT_MASTER_MODAL_ID_595 = "jbis-595-dept-master-modal";
  var INDEX_SEARCH_WRAP_ID = "jbis-595-index-search-wrap";
  var STORAGE_KEY_595_IDX_KW = "jbis595-index-search-kw";
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

  function fetchAll595RecordsForIndexSearch(appId) {
    var fields = ["$id", FC595_GROUP, FC595_DEPT, FC595_NAME];
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

  function fetch595RecordTotalCount(appId) {
    var url = kintone.api.url("/k/v1/records.json", true);
    return kintone
      .api(url, "GET", {
        app: appId,
        query: "limit 1",
        fields: ["$id"],
        totalCount: true
      })
      .then(function (resp) {
        return resp.totalCount != null ? Number(resp.totalCount) : 0;
      });
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

  /**
   * 一覧を「所属グループ or 所属名 or 社員名」の部分一致で絞り込む。
   * kintone の like は英数字が単語単位のため toh→tohoku にならない → API 全件取得後にブラウザで部分一致し $id in で反映する。
   */
  function navigate595IndexOrSearch(keyword, btnSearch, btnClear) {
    var path = window.location.pathname || "";
    var params = new URLSearchParams(window.location.search || "");
    var kw = String(keyword || "").trim();

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

    if (!kw) {
      try {
        sessionStorage.removeItem(STORAGE_KEY_595_IDX_KW);
      } catch (e0) {
        /* noop */
      }
      params.delete("query");
      var qs = params.toString();
      window.location.href = path + (qs ? "?" + qs : "");
      return;
    }

    var appId = kintone.app.getId();
    setBusy(true);
    fetch595RecordTotalCount(appId)
      .then(function (tc) {
        if (tc > INDEX_SEARCH_FULL_SCAN_MAX_RECORDS) {
          setBusy(false);
          window.alert(
            "社員マスタの件数が " +
              tc +
              " 件あり、一覧検索の全件取得上限（" +
              INDEX_SEARCH_FULL_SCAN_MAX_RECORDS +
              " 件）を超えています。キーワードを長くするか、kintone 一覧の標準絞り込みを利用してください。"
          );
          return null;
        }
        return fetchAll595RecordsForIndexSearch(appId);
      })
      .then(function (records) {
        if (!records) {
          return;
        }
        var lower = kw.toLowerCase();
        var ids = [];
        for (var i = 0; i < records.length; i++) {
          if (record595MatchesSubstring(records[i], lower)) {
            var idCell = records[i].$id;
            var rid = idCell && idCell.value != null ? String(idCell.value).trim() : "";
            if (rid) {
              ids.push(rid);
            }
          }
        }
        var truncated = false;
        if (ids.length > INDEX_SEARCH_MAX_IDS) {
          ids = ids.slice(0, INDEX_SEARCH_MAX_IDS);
          truncated = true;
        }
        var q = build595IdInQuery(ids);
        try {
          sessionStorage.setItem(STORAGE_KEY_595_IDX_KW, kw);
        } catch (e1) {
          /* noop */
        }
        params.set("query", q + " order by レコード番号 asc");
        if (truncated) {
          window.alert(
            "該当が" +
              INDEX_SEARCH_MAX_IDS +
              "件を超えました。先頭" +
              INDEX_SEARCH_MAX_IDS +
              "件のみ表示します。キーワードを具体化してください。"
          );
        }
        window.location.href = path + "?" + params.toString();
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
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 12px;padding:8px 12px;" +
      "background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;";

    var label = document.createElement("span");
    label.style.cssText = "font-weight:600;color:#0f172a;white-space:nowrap;";
    label.textContent = "社員検索";
    wrap.appendChild(label);

    var hint = document.createElement("span");
    hint.style.cssText = "color:#64748b;font-size:12px;";
    hint.textContent =
      "（所属グループ・所属名・社員名のいずれかに部分一致。英数字も途中から一致します）";
    wrap.appendChild(hint);

    var input = document.createElement("input");
    input.type = "search";
    input.setAttribute("autocomplete", "off");
    input.placeholder = "キーワードを入力…";
    input.style.cssText =
      "min-width:200px;max-width:360px;flex:1;padding:6px 10px;border:1px solid #94a3b8;border-radius:4px;";
    wrap.appendChild(input);

    var statusLine = document.createElement("span");
    statusLine.id = "jbis-595-index-search-status";
    statusLine.style.cssText = "color:#64748b;font-size:12px;min-width:140px;";
    wrap.appendChild(statusLine);

    var btnSearch = document.createElement("button");
    btnSearch.type = "button";
    btnSearch.textContent = "検索";
    btnSearch.setAttribute("data-label-search", "検索");
    btnSearch.style.cssText =
      "padding:6px 14px;background:#1d4ed8;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;";
    wrap.appendChild(btnSearch);

    var btnClear = document.createElement("button");
    btnClear.type = "button";
    btnClear.textContent = "条件クリア";
    btnClear.style.cssText =
      "padding:6px 12px;background:#fff;color:#334155;border:1px solid #94a3b8;border-radius:4px;cursor:pointer;";
    wrap.appendChild(btnClear);

    function run() {
      navigate595IndexOrSearch(input.value, btnSearch, btnClear);
    }

    btnSearch.addEventListener("click", run);
    btnClear.addEventListener("click", function () {
      input.value = "";
      navigate595IndexOrSearch("", btnSearch, btnClear);
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
    } catch (eS) {
      /* noop */
    }
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
    } catch (e) {
      console.warn("[jbis 595 dept picker ui]", e);
    }
    return event;
  });

  kintone.events.on(["app.record.index.show", "mobile.app.record.index.show"], function (event) {
    try {
      mount595IndexSearchBox();
    } catch (e) {
      console.warn("[jbis 595 index search]", e);
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
    if (snapshot.winPw) {
      parts.push("Windowsパスワード: " + snapshot.winPw);
    }
    return parts.join(" / ");
  }

  function get674RecordForRetire595(id674) {
    var url = kintone.api.url("/k/v1/record.json", true);
    return kintone
      .api(url, "GET", {
        app: APP674,
        id: String(id674),
      })
      .then(function (resp) {
        return { record: resp.record || null, revision: resp.revision || null };
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

  function collect674TargetIdsForRetire595(record) {
    var fromSub = collectSubtableNumericIds(record, FC595_PC674_SUB, FC595_PC674_ID);
    var mail = scalarFrom595(record, FC595_MAIL).trim();
    return fetch674IdsByMailForRetire595(mail).then(function (fromMail) {
      return uniqueStringIds(fromSub.concat(fromMail));
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
          var st671 = scalar674FromRow(r671, "status").trim();
          if (st671 === "廃止") {
            return Promise.resolve();
          }
          var url671Put = kintone.api.url("/k/v1/record.json", true);
          return kintone.api(url671Put, "PUT", {
            app: APP671,
            id: midStr,
            revision: get671.revision,
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
      if (st === PC_STATUS_STORAGE || st === PC_STATUS_DISPOSED) {
        return { skipped: true, masterId: "" };
      }
      var snapshot = {
        logon: scalar674FromRow(tr, FC674_LOGON).trim(),
        winPw: scalar674FromRow(tr, FC674_MAIL_PW).trim(),
      };
      var masterId = scalar674FromRow(tr, FC674_M365_MASTER).trim();
      var prevNote = scalar674FromRow(tr, FC674_NOTE).trim();
      var stamp = buildRetire674Note595(snapshot, retiredDate, userName);
      var nextNote = prevNote ? prevNote + "\n" + stamp : stamp;
      var urlPut = kintone.api.url("/k/v1/record.json", true);
      return kintone
        .api(urlPut, "PUT", {
          app: APP674,
          id: String(id674),
          revision: rev,
          record: {
            [FC674_PC_STATUS]: { value: PC_STATUS_STORAGE },
            [FC674_WIN_NAME]: { value: "" },
            [FC674_LOGON]: { value: "" },
            [FC674_MAIL_PW]: { value: "" },
            [FC674_M365_ID]: { value: "" },
            [FC674_M365_PW]: { value: "" },
            [FC674_M365_MASTER]: { value: "" },
            [FC674_M365_KIRIKAE]: { value: [] },
            [FC674_NOTE]: { value: nextNote },
          },
        })
        .then(function () {
          return { skipped: false, masterId: masterId };
        });
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
        });
    });
  }

  function recordsNeedingMirror(rows, name, dept, grp, nameCode, deptCode, grpCode) {
    var updates = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var curN = ((r[nameCode] && r[nameCode].value) || "").trim();
      var curD = ((r[deptCode] && r[deptCode].value) || "").trim();
      var curG = ((r[grpCode] && r[grpCode].value) || "").trim();
      if (curN === name.trim() && curD === dept.trim() && curG === grp.trim()) {
        continue;
      }
      var row = {
        id: r.$id.value,
        record: {}
      };
      row.record[nameCode] = { value: name };
      row.record[deptCode] = { value: dept };
      row.record[grpCode] = { value: grp };
      if (r.$revision && r.$revision.value !== undefined && r.$revision.value !== null) {
        row.revision = r.$revision.value;
      }
      updates.push(row);
    }
    return updates;
  }

  function fetch674PersonalTargets(mail, name, dept, grp) {
    if (!mail) {
      return Promise.resolve();
    }
    var offset = 0;
    var limit = 500;
    var urlGet = kintone.api.url("/k/v1/records.json", true);

    function page() {
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
        '") order by $id asc limit ' +
        limit +
        " offset " +
        offset;
      return kintone
        .api(urlGet, "GET", {
          app: APP674,
          query: q,
          fields: ["$id", "$revision", FC674_NAME, FC674_DEPT, FC674_GROUP]
        })
        .then(function (resp) {
          var list = resp.records || [];
          var updates = recordsNeedingMirror(
            list,
            name,
            dept,
            grp,
            FC674_NAME,
            FC674_DEPT,
            FC674_GROUP
          );
          var urlPut = kintone.api.url("/k/v1/records.json", true);
          var parts = chunk(updates, 100);
          return parts
            .reduce(function (chain, part) {
              return chain.then(function () {
                return kintone.api(urlPut, "PUT", { app: APP674, records: part });
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

  function sync674MirrorFrom595(record) {
    var mail = scalarFrom595(record, FC595_MAIL).trim();
    if (!mail) {
      return Promise.resolve();
    }
    var name = scalarFrom595(record, FC595_NAME);
    var dept = scalarFrom595(record, FC595_DEPT);
    var grp = scalarFrom595(record, FC595_GROUP);
    return fetch674PersonalTargets(mail, name, dept, grp);
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

  function run595DownstreamSync(record) {
    var emp = scalarFrom595(record, FC595_EMP).trim();
    if (emp === EMP_RETIRED) {
      return retire674PcsFrom595(record);
    }
    return sync674MirrorFrom595(record).then(function () {
      return syncSoftwareLedgerMirrorFrom595(record).then(function () {
        return syncStorageMediaLedgerMirrorFrom595(record);
      });
    });
  }

  var submitBefore = [
    "app.record.create.submit",
    "app.record.edit.submit",
    "mobile.app.record.create.submit",
    "mobile.app.record.edit.submit",
  ];
  kintone.events.on(submitBefore, applyEmpIdOnSubmit595);

  var ev = [
    "app.record.create.submit.success",
    "app.record.edit.submit.success",
    "mobile.app.record.create.submit.success",
    "mobile.app.record.edit.submit.success"
  ];

  kintone.events.on(ev, function (event) {
    return run595DownstreamSync(event.record)
      .then(function () {
        return event;
      })
      .catch(function (e) {
        console.error("[jbis 595 downstream]", e);
        var msg =
          "社員マスタ保存後の連携（674／714／716）の一部に失敗しました。権限・ネットワークを確認し、必要なら手動で台帳を更新してください。";
        if (e && e.message) {
          msg += "\n" + e.message;
        }
        alert(msg);
        return event;
      });
  });
})();
