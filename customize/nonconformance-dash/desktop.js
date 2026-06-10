(function () {
  "use strict";

  /** 不適合管理台帳 — 706 REST CRUD */
  var BUILD = "2026-06-10-nonconformance-dash-v1";

  var APP_DB = 706;
  var PAGE_SIZE = 100;

  var CAT_A = "（A）設定ミス";
  var CAT_B = "（B）ルール違反";
  var CAT_C = "（C）運用ミス";

  var FC = {
    mgmt_no: "mgmt_no",
    report_date: "report_date",
    reporter: "reporter",
    category: "category",
    issue_detail: "issue_detail",
    root_cause: "root_cause",
    temp_action: "temp_action",
    permanent_action: "permanent_action",
    completed_date: "completed_date",
    verifier: "verifier",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.mgmt_no,
    FC.report_date,
    FC.reporter,
    FC.category,
    FC.issue_detail,
    FC.root_cause,
    FC.temp_action,
    FC.permanent_action,
    FC.completed_date,
    FC.verifier,
  ];

  var TABLE_COLUMNS = [
    { key: FC.mgmt_no, label: "管理番号", sortable: true },
    { key: FC.report_date, label: "報告日", sortable: true },
    { key: FC.reporter, label: "報告者", sortable: false },
    { key: FC.category, label: "種別", sortable: false },
    { key: FC.issue_detail, label: "ミスの内容", sortable: false, multiline: true },
    { key: FC.root_cause, label: "原因", sortable: false, multiline: true },
    { key: FC.temp_action, label: "暫定策", sortable: false, multiline: true },
    { key: FC.permanent_action, label: "恒久策", sortable: false, multiline: true },
    { key: FC.completed_date, label: "対応完了日", sortable: false },
    { key: FC.verifier, label: "確認者", sortable: false },
  ];

  var state = {
    records: [],
    filter: "all",
    search: "",
    loading: false,
    sortKey: FC.mgmt_no,
    sortDir: "desc",
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

  function val(rec, code) {
    return rec && rec[code] && rec[code].value != null ? String(rec[code].value) : "";
  }

  function flatten(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      mgmt_no: val(rec, FC.mgmt_no),
      report_date: val(rec, FC.report_date),
      reporter: val(rec, FC.reporter),
      category: val(rec, FC.category),
      issue_detail: val(rec, FC.issue_detail),
      root_cause: val(rec, FC.root_cause),
      temp_action: val(rec, FC.temp_action),
      permanent_action: val(rec, FC.permanent_action),
      completed_date: val(rec, FC.completed_date),
      verifier: val(rec, FC.verifier),
    };
  }

  function firstLine(text) {
    var s = String(text || "").split(/\r?\n/)[0].trim();
    if (s.length > 80) return s.slice(0, 80) + "…";
    return s;
  }

  function yearFromReportDate(reportDate) {
    var y = String(reportDate || "").slice(0, 4);
    return /^\d{4}$/.test(y) ? y : "";
  }

  function maxMgmtSeqForYear(year, records) {
    var prefix = year + "-";
    var max = 0;
    records.forEach(function (r) {
      var no = String(r.mgmt_no || "");
      if (no.indexOf(prefix) !== 0) return;
      var nnn = parseInt(no.slice(prefix.length), 10);
      if (Number.isFinite(nnn)) max = Math.max(max, nnn);
    });
    return max;
  }

  function assignMgmtNo(reportDate, records) {
    var yyyy = yearFromReportDate(reportDate);
    if (!yyyy) throw new Error("報告日から年を取得できません");
    var next = maxMgmtSeqForYear(yyyy, records) + 1;
    if (next > 999) {
      throw new Error(
        yyyy + " 年の管理番号が上限（999件）に達しました。推進室へ連絡してください。",
      );
    }
    return yyyy + "-" + String(next).padStart(3, "0");
  }

  function isDuplicateMgmtNoError(err) {
    var msg = err && err.message ? err.message : String(err || "");
    return /unique|重複|duplicate|GAIA_/i.test(msg);
  }

  function toKintoneRecord(row, partial) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
    }
    if (!partial || partial.mgmt_no) set(FC.mgmt_no, row.mgmt_no);
    if (!partial || partial.report_date) set(FC.report_date, row.report_date);
    if (!partial || partial.reporter) set(FC.reporter, row.reporter);
    if (!partial || partial.category) set(FC.category, row.category);
    if (!partial || partial.issue_detail) set(FC.issue_detail, row.issue_detail);
    if (!partial || partial.root_cause) set(FC.root_cause, row.root_cause);
    if (!partial || partial.temp_action) set(FC.temp_action, row.temp_action);
    if (!partial || partial.permanent_action) set(FC.permanent_action, row.permanent_action);
    if (!partial || partial.completed_date) set(FC.completed_date, row.completed_date);
    if (!partial || partial.verifier) set(FC.verifier, row.verifier);
    return o;
  }

  function validateForm(data) {
    if (!data.report_date) return "報告日は必須です";
    if (!data.reporter) return "報告者は必須です";
    if (!data.category) return "種別は必須です";
    if (!data.issue_detail) return "ミスの内容は必須です";
    if (!data.root_cause) return "原因は必須です";
    if (!data.temp_action) return "暫定策は必須です";
    if (!data.permanent_action) return "恒久策は必須です";
    return "";
  }

  function readFormValues(prefix) {
    return {
      report_date: (document.getElementById(prefix + "-report-date") || {}).value || "",
      reporter: (document.getElementById(prefix + "-reporter") || {}).value.trim(),
      category: (document.getElementById(prefix + "-category") || {}).value || "",
      issue_detail: (document.getElementById(prefix + "-issue-detail") || {}).value.trim(),
      root_cause: (document.getElementById(prefix + "-root-cause") || {}).value.trim(),
      temp_action: (document.getElementById(prefix + "-temp-action") || {}).value.trim(),
      permanent_action: (document.getElementById(prefix + "-permanent-action") || {}).value.trim(),
      completed_date: (document.getElementById(prefix + "-completed-date") || {}).value || "",
      verifier: (document.getElementById(prefix + "-verifier") || {}).value.trim(),
    };
  }

  function categoryOptionsHtml(selected) {
    return [CAT_A, CAT_B, CAT_C]
      .map(function (c) {
        return (
          '<option value="' +
          esc(c) +
          '"' +
          (selected === c ? " selected" : "") +
          ">" +
          esc(c) +
          "</option>"
        );
      })
      .join("");
  }

  function formBodyHtml(prefix, row) {
    var isEdit = !!row;
    var mgmtNoBlock = isEdit
      ? '<label>管理番号<input id="' +
        prefix +
        '-mgmt-no" value="' +
        esc(row.mgmt_no) +
        '" readonly style="background:#f1f5f9"></label>'
      : "";
    return (
      mgmtNoBlock +
      '<label>報告日<input type="date" id="' +
      prefix +
      '-report-date" value="' +
      esc(isEdit ? row.report_date : todayJstYmd()) +
      '" required></label>' +
      '<label>報告者<input id="' +
      prefix +
      '-reporter" value="' +
      esc(isEdit ? row.reporter : "") +
      '" required></label>' +
      '<label>種別<select id="' +
      prefix +
      '-category" required>' +
      '<option value="">— 選択 —</option>' +
      categoryOptionsHtml(isEdit ? row.category : "") +
      "</select></label>" +
      '<label>ミスの内容<textarea id="' +
      prefix +
      '-issue-detail" rows="3" required>' +
      esc(isEdit ? row.issue_detail : "") +
      "</textarea></label>" +
      '<label>原因<textarea id="' +
      prefix +
      '-root-cause" rows="3" required>' +
      esc(isEdit ? row.root_cause : "") +
      "</textarea></label>" +
      '<label>暫定策<textarea id="' +
      prefix +
      '-temp-action" rows="3" required>' +
      esc(isEdit ? row.temp_action : "") +
      "</textarea></label>" +
      '<label>恒久策<textarea id="' +
      prefix +
      '-permanent-action" rows="3" required>' +
      esc(isEdit ? row.permanent_action : "") +
      "</textarea></label>" +
      '<label>対応完了日<input type="date" id="' +
      prefix +
      '-completed-date" value="' +
      esc(isEdit ? row.completed_date : "") +
      '"></label>' +
      '<label>確認者<input id="' +
      prefix +
      '-verifier" value="' +
      esc(isEdit ? row.verifier : "") +
      '"></label>'
    );
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

  function fetchAllRecords() {
    var all = [];
    var offset = 0;
    function page() {
      var query = "order by " + FC.mgmt_no + " desc limit " + PAGE_SIZE + " offset " + offset;
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

  function injectCss() {
    if (document.getElementById("ncl-dash-css")) return;
    var st = document.createElement("style");
    st.id = "ncl-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".ncl-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".ncl-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".ncl-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;padding:10px 14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;font-size:13px;}" +
      ".ncl-table-wrap{overflow:auto;max-height:calc(100vh - 280px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".ncl-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1400px;}" +
      ".ncl-table th,.ncl-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:top;}" +
      ".ncl-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;white-space:nowrap;}" +
      ".ncl-table th.ncl-sort{cursor:pointer;user-select:none;}" +
      ".ncl-table td.ncl-multiline{max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}" +
      ".ncl-table tr.incomplete{background:#fffbeb;}" +
      ".ncl-actions button{margin:0 2px;padding:2px 6px;font-size:11px;}" +
      ".ncl-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".ncl-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:560px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".ncl-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".ncl-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".ncl-modal input,.ncl-modal select,.ncl-modal textarea{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".ncl-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}";
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

  function compareSortValues(key, a, b) {
    if (key === FC.mgmt_no) {
      var pa = String(a.mgmt_no || "").split("-");
      var pb = String(b.mgmt_no || "").split("-");
      var ya = parseInt(pa[0], 10) || 0;
      var yb = parseInt(pb[0], 10) || 0;
      if (ya !== yb) return ya - yb;
      return (parseInt(pa[1], 10) || 0) - (parseInt(pb[1], 10) || 0);
    }
    if (key === FC.report_date) {
      return String(a.report_date || "").localeCompare(String(b.report_date || ""));
    }
    return String(a[key] || "").localeCompare(String(b[key] || ""), "ja");
  }

  function passesFilter(row) {
    if (state.filter === "cat_a" && row.category !== CAT_A) return false;
    if (state.filter === "cat_b" && row.category !== CAT_B) return false;
    if (state.filter === "cat_c" && row.category !== CAT_C) return false;
    if (state.filter === "incomplete" && row.completed_date) return false;
    return true;
  }

  function passesSearch(row) {
    var q = state.search.trim().toLowerCase();
    if (!q) return true;
    var hay = (row.mgmt_no + " " + row.reporter + " " + row.issue_detail).toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function filteredRecords() {
    var rows = state.records.filter(function (r) {
      return passesFilter(r) && passesSearch(r);
    });
    rows.sort(function (a, b) {
      var key = state.sortKey || FC.mgmt_no;
      var cmp = compareSortValues(key, a, b);
      return state.sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }

  function closeModal() {
    var el = document.getElementById("ncl-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "ncl-modal-root";
    bg.className = "ncl-modal-bg";
    var box = document.createElement("div");
    box.className = "ncl-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "ncl-modal-actions";
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

  function updateMeta() {
    var el = document.getElementById("ncl-meta");
    if (!el) return;
    var incomplete = state.records.filter(function (r) {
      return !r.completed_date;
    }).length;
    el.innerHTML =
      "<span>全 " +
      esc(String(state.records.length)) +
      " 件</span>" +
      "<span>未完了 " +
      esc(String(incomplete)) +
      " 件</span>";
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
      })
      .catch(function (e) {
        state.loading = false;
        renderTable();
        alert("読込失敗: " + (e.message || e));
      });
  }

  function createRecord(formData, retryOnDuplicate) {
    var mgmtNo;
    try {
      mgmtNo = assignMgmtNo(formData.report_date, state.records);
    } catch (e) {
      return Promise.reject(e);
    }
    var rec = toKintoneRecord({
      mgmt_no: mgmtNo,
      report_date: formData.report_date,
      reporter: formData.reporter,
      category: formData.category,
      issue_detail: formData.issue_detail,
      root_cause: formData.root_cause,
      temp_action: formData.temp_action,
      permanent_action: formData.permanent_action,
      completed_date: formData.completed_date,
      verifier: formData.verifier,
    });
    return apiPost("/k/v1/record.json", { app: APP_DB, record: rec }).catch(function (e) {
      if (retryOnDuplicate && isDuplicateMgmtNoError(e)) {
        return fetchAllRecords().then(function (rows) {
          state.records = rows.map(flatten);
          return createRecord(formData, false);
        });
      }
      return Promise.reject(e);
    });
  }

  function openNewModal() {
    openModal("行を追加", formBodyHtml("ncl-new", null), [
      { label: "キャンセル" },
      {
        label: "登録",
        primary: true,
        onClick: function (close) {
          var formData = readFormValues("ncl-new");
          var err = validateForm(formData);
          if (err) {
            alert(err);
            return;
          }
          createRecord(formData, true)
            .then(function () {
              close();
              reloadRecords();
              alert("登録しました");
            })
            .catch(function (e) {
              alert("登録失敗: " + (e.message || e));
            });
        },
      },
    ]);
  }

  function openEditModal(row) {
    openModal("編集 — " + row.mgmt_no, formBodyHtml("ncl-edit", row), [
      { label: "キャンセル" },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          var formData = readFormValues("ncl-edit");
          var err = validateForm(formData);
          if (err) {
            alert(err);
            return;
          }
          var rec = toKintoneRecord(
            {
              report_date: formData.report_date,
              reporter: formData.reporter,
              category: formData.category,
              issue_detail: formData.issue_detail,
              root_cause: formData.root_cause,
              temp_action: formData.temp_action,
              permanent_action: formData.permanent_action,
              completed_date: formData.completed_date,
              verifier: formData.verifier,
            },
            {
              report_date: 1,
              reporter: 1,
              category: 1,
              issue_detail: 1,
              root_cause: 1,
              temp_action: 1,
              permanent_action: 1,
              completed_date: 1,
              verifier: 1,
            },
          );
          apiPut("/k/v1/record.json", {
            app: APP_DB,
            id: row.id,
            revision: row.revision,
            record: rec,
          })
            .then(function () {
              close();
              reloadRecords();
              alert("保存しました");
            })
            .catch(function (e) {
              alert("保存失敗: " + (e.message || e));
            });
        },
      },
    ]);
  }

  function openDeleteModal(row) {
    openModal(
      "削除確認",
      "<p>管理番号: <strong>" +
        esc(row.mgmt_no) +
        "</strong></p><p>報告者: " +
        esc(row.reporter) +
        "</p><p>このレコードを<strong>削除</strong>します。よろしいですか？</p>",
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

  function renderTable() {
    var tbody = document.getElementById("ncl-tbody");
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
      .map(function (r) {
        var cls = !r.completed_date ? "incomplete" : "";
        var cells = TABLE_COLUMNS.map(function (col) {
          var v = r[col.key] || "";
          if (col.multiline) {
            return (
              '<td class="ncl-multiline" title="' +
              esc(v) +
              '">' +
              esc(firstLine(v)) +
              "</td>"
            );
          }
          return "<td>" + esc(v) + "</td>";
        }).join("");
        return (
          '<tr class="' +
          cls +
          '" data-id="' +
          esc(r.id) +
          '">' +
          cells +
          '<td class="ncl-actions">' +
          '<button type="button" class="ncl-btn-edit">編集</button>' +
          '<button type="button" class="ncl-btn-del">削除</button>' +
          "</td></tr>"
        );
      })
      .join("");

    tbody.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      var row = state.records.find(function (x) {
        return x.id === id;
      });
      if (!row) return;
      tr.querySelector(".ncl-btn-edit").addEventListener("click", function () {
        openEditModal(row);
      });
      tr.querySelector(".ncl-btn-del").addEventListener("click", function () {
        openDeleteModal(row);
      });
    });
  }

  function buildShell() {
    if (document.getElementById("ncl-root")) return;
    injectCss();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "ncl-root";
    root.className = "ncl-root";
    root.innerHTML =
      '<div class="ncl-toolbar">' +
      '<strong style="font-size:16px">不適合管理台帳</strong>' +
      '<button type="button" id="ncl-add" class="kintoneplugin-button-dialog-ok">行を追加</button>' +
      '<button type="button" id="ncl-reload" class="kintoneplugin-button-normal">再読込</button>' +
      '<select id="ncl-filter" style="padding:6px;margin-left:8px">' +
      '<option value="all">すべて</option>' +
      '<option value="cat_a">' +
      esc(CAT_A) +
      "</option>" +
      '<option value="cat_b">' +
      esc(CAT_B) +
      "</option>" +
      '<option value="cat_c">' +
      esc(CAT_C) +
      "</option>" +
      '<option value="incomplete">未完了</option>' +
      "</select>" +
      '<input type="search" id="ncl-search" placeholder="管理番号・報告者・ミスの内容" style="min-width:240px;padding:6px;margin-left:8px">' +
      '<button type="button" id="ncl-clear" class="kintoneplugin-button-normal">クリア</button>' +
      "</div>" +
      '<div id="ncl-meta" class="ncl-meta"></div>' +
      '<div class="ncl-table-wrap"><table class="ncl-table"><thead><tr>' +
      TABLE_COLUMNS.map(function (c) {
        return (
          '<th' +
          (c.sortable ? ' class="ncl-sort" data-sort="' + esc(c.key) + '"' : "") +
          ">" +
          esc(c.label) +
          "</th>"
        );
      }).join("") +
      "<th>操作</th>" +
      '</tr></thead><tbody id="ncl-tbody"></tbody></table></div>';
    host.appendChild(root);

    document.getElementById("ncl-add").addEventListener("click", openNewModal);
    document.getElementById("ncl-reload").addEventListener("click", reloadRecords);
    document.getElementById("ncl-filter").addEventListener("change", function (ev) {
      state.filter = ev.target.value;
      renderTable();
    });
    var search = document.getElementById("ncl-search");
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    document.getElementById("ncl-clear").addEventListener("click", function () {
      state.search = "";
      state.filter = "all";
      search.value = "";
      document.getElementById("ncl-filter").value = "all";
      renderTable();
    });

    root.querySelector(".ncl-table thead").addEventListener("click", function (ev) {
      var th = ev.target.closest("th.ncl-sort");
      if (!th) return;
      var key = th.getAttribute("data-sort");
      if (!key) return;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = key === FC.mgmt_no ? "desc" : "asc";
      }
      renderTable();
    });
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
