(function () {
  "use strict";

  /**
   * 595 社員マスタ
   * BUILD: 2026-04-30-595-index-search-totalcap-loading
   * BUILD: 2026-05-12-595-no594-rest（旧594への REST・リンク廃止・674同期のみ）
   * - 一覧: 所属グループ・所属名・社員名のいずれかに部分一致する検索窓（ヘッダスペース）
   * - 詳細・編集: サブテーブル（新674）とアカウント台帳番号からレコードへのリンクをヘッダ下に表示
   * - 保存成功後: 627／674 所属同期（旧594アプリへの REST は行わない）
   */

  /** アカウント管理台帳（627） */
  var APP627 = "627";
  /** 新・PC台帳 ver.1（674） */
  var APP674 = "674";

  var FC595_MAIL = "mail";
  var FC595_NAME = "user_name";
  var FC595_DEPT = "dept_name";
  var FC595_GROUP = "group_name";
  var FC595_EMP = "employment_status";
  var FC595_LEDGER_ID = "ledger_record_id";
  var FC595_RETIRED = "retired_date";

  var FC627_MAIL = "mail";
  var FC627_NAME = "user_name";
  var FC627_DEPT = "dept_name";
  var FC627_GROUP = "group_name";
  var FC627_EMP = "employment_status";
  var FC627_ACCOUNT_STATE = "account_state";
  var ACCT_ACTIVE = "有効";
  var ACCT_RETIRED = "退職";
  var ACCT_DELETED = "削除";

  var FC674_MAIL = "mail";
  var FC674_NAME = "user_name";
  var FC674_DEPT = "dept_name";
  var FC674_GROUP = "group_name";
  var FC674_TYPE = "account_type";
  var FC674_PC_STATUS = "pc_status";
  var TYPE_PERSONAL = "個人";
  var PC_STATUS_STORAGE = "保管";

  /** 595 上の PC 台帳紐づけ（旧594由来の列。リンクは出さず674のみ） */
  var FC595_PC594_SUB = "pc_ledger_list";
  var FC595_PC594_ID = "pc_594_record_id";
  /** 595 上の 新・PC台帳（674） */
  var FC595_PC674_SUB = "pc_ledger_v1_list";
  var FC595_PC674_ID = "pc_674_record_id";

  var LINK_BOX_ID = "jbis-595-pc-ledger-link-box";
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
    var id627 = scalarFrom595(record, FC595_LEDGER_ID).trim();

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

    var hasAny = ids674.length > 0 || !!id627;

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
    if (id627) {
      addLinkRow("アカウント台帳（627）", APP627, id627);
    }

    if (!hasAny) {
      var empty = document.createElement("div");
      empty.style.cssText = "color:#6c757d;font-size:12px;";
      empty.textContent =
        "「" +
        FC595_PC674_SUB +
        "」に番号が入るか、アカウント台帳番号が入ると、ここにリンクが表示されます。";
      box.appendChild(empty);
    }

    if (space.firstChild) {
      space.insertBefore(box, space.firstChild);
    } else {
      space.appendChild(box);
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

  /** 旧594の note 追記は廃止（594アプリ非使用）。 */
  function appendRetireNoteToPcLedger(record) {
    return Promise.resolve();
  }

  function get627RecordById(id627) {
    var url = kintone.api.url("/k/v1/record.json", true);
    return kintone
      .api(url, "GET", { app: APP627, id: String(id627) })
      .then(function (resp) {
        return resp.record || null;
      })
      .catch(function () {
        return null;
      });
  }

  function get627RecordByMail(mail) {
    if (!mail) {
      return Promise.resolve(null);
    }
    var url = kintone.api.url("/k/v1/records.json", true);
    return kintone
      .api(url, "GET", {
        app: APP627,
        query: FC627_MAIL + ' = "' + escapeForQuery(mail) + '" limit 1',
        fields: ["$id", "$revision", FC627_ACCOUNT_STATE]
      })
      .then(function (resp) {
        var rows = resp.records || [];
        if (!rows.length) {
          return null;
        }
        return rows[0];
      });
  }

  /** @returns {Promise<object|null>} kintone レコード行（$id/$revision 付き） */
  function resolve627RowFor595(record) {
    var mail = scalarFrom595(record, FC595_MAIL).trim();
    var lid = scalarFrom595(record, FC595_LEDGER_ID).trim();
    if (lid) {
      return get627RecordById(lid).then(function (rec) {
        if (rec && rec.$id) {
          return rec;
        }
        if (mail) {
          return get627RecordByMail(mail);
        }
        return null;
      });
    }
    if (mail) {
      return get627RecordByMail(mail);
    }
    return Promise.resolve(null);
  }

  function sync627From595(record) {
    return resolve627RowFor595(record).then(function (row627) {
      if (!row627 || !row627.$id) {
        return;
      }
      var id627 = row627.$id.value;
      var rev627 = row627.$revision ? row627.$revision.value : null;
      return get627RecordById(id627).then(function (fresh) {
        if (!fresh || !fresh.$id) {
          return;
        }
        rev627 = fresh.$revision ? fresh.$revision.value : rev627;
        var curState = String((fresh[FC627_ACCOUNT_STATE] && fresh[FC627_ACCOUNT_STATE].value) || "").trim();

        var name = scalarFrom595(record, FC595_NAME);
        var dept = scalarFrom595(record, FC595_DEPT);
        var grp = scalarFrom595(record, FC595_GROUP);
        var emp = scalarFrom595(record, FC595_EMP).trim();

        var patch = {};
        patch[FC627_NAME] = { value: name };
        patch[FC627_DEPT] = { value: dept };
        patch[FC627_GROUP] = { value: grp };
        if (emp) {
          patch[FC627_EMP] = { value: emp };
        }
        if (curState !== ACCT_DELETED) {
          patch[FC627_ACCOUNT_STATE] = {
            value: emp === "退職" ? ACCT_RETIRED : ACCT_ACTIVE
          };
        }

        var urlPut = kintone.api.url("/k/v1/record.json", true);
        var body = { app: APP627, id: id627, record: patch };
        if (rev627 !== null && rev627 !== undefined && rev627 !== "") {
          body.revision = rev627;
        }
        return kintone.api(urlPut, "PUT", body);
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

  function run595DownstreamSync(record) {
    return appendRetireNoteToPcLedger(record)
      .then(function () {
        return sync627From595(record);
      })
      .then(function () {
        return sync674MirrorFrom595(record);
      });
  }

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
          "社員マスタ保存後の連携（627／674）の一部に失敗しました。権限・ネットワークを確認し、必要なら手動で台帳を更新してください。";
        if (e && e.message) {
          msg += "\n" + e.message;
        }
        alert(msg);
        return event;
      });
  });
})();
