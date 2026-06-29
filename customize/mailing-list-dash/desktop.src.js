(function () {
  "use strict";
  /* global ML_DEPT_MASTER */

  /** メーリングリスト台帳 — 742/696 型 Excel 風一覧 + REST CRUD + 印刷 + xlsx */
  var BUILD = "2026-06-29-mailing-list-dash-clear-btn-v2";
  var LIST_DOMAIN = "@j-bis.co.jp";
  var STATUS_ACTIVE = "有効";
  var STATUS_DELETED = "削除";
  var APP_DB = 750;
  var PAGE_SIZE = 100;
  var MEMBER_PREVIEW_COUNT = 5;

  var FC = {
    sort_no: "sort_no",
    legacy_no: "legacy_no",
    department: "department",
    list_address: "list_address",
    purpose: "purpose",
    members_raw: "members_raw",
    status: "status",
    last_change_memo: "last_change_memo",
    note: "note",
    registered_date: "registered_date",
    updated_date: "updated_date",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.sort_no,
    FC.legacy_no,
    FC.department,
    FC.list_address,
    FC.purpose,
    FC.members_raw,
    FC.status,
    FC.last_change_memo,
    FC.note,
    FC.registered_date,
    FC.updated_date,
  ];

  var SEARCH_FIELDS = ["list_address", "members_raw", "purpose", "department", "note"];

  var PRINT_FIELDS = [
    { key: "legacy_no", label: "管理番号" },
    { key: "department", label: "利用部署" },
    { key: "list_address", label: "メールアドレス" },
    { key: "purpose", label: "利用用途" },
    { key: "members_slash", label: "メンバー" },
    { key: "status", label: "状態" },
    { key: "updated_date", label: "更新日" },
    { key: "last_change_memo", label: "直近変更メモ" },
    { key: "note", label: "備考" },
  ];

  var XLSX_COLUMNS = [
    { key: "legacy_no", label: "管理番号" },
    { key: "department", label: "利用部署" },
    { key: "list_address", label: "メールアドレス" },
    { key: "purpose", label: "利用用途" },
    { key: "members_raw", label: "メンバー" },
  ];

  var state = {
    records: [],
    search: "",
    memberSearch: "",
    statusFilter: STATUS_ACTIVE,
    departmentFilter: "",
    loading: false,
  };

  function deptMasterList() {
    if (typeof ML_DEPT_MASTER !== "undefined" && ML_DEPT_MASTER.departments) {
      return ML_DEPT_MASTER.departments.slice().sort(function (a, b) {
        return Number(a.sort_no) - Number(b.sort_no);
      });
    }
    return [];
  }

  function deptOptions() {
    return deptMasterList().map(function (x) {
      return x.department;
    });
  }

  function deptSortNo(name) {
    var list = deptMasterList();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].department === name) return Number(list[i].sort_no) || 999;
    }
    return 999;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function todayJstYmd() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
  }

  function formatChangeDateJst() {
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
    return y + "." + mo + "." + d;
  }

  function val(rec, code) {
    return rec && rec[code] && rec[code].value != null ? String(rec[code].value) : "";
  }

  function normalizeSearchText(s) {
    try {
      return String(s == null ? "" : s).normalize("NFKC");
    } catch (e) {
      return String(s == null ? "" : s);
    }
  }

  function searchTokens(q) {
    return normalizeSearchText(q)
      .toLowerCase()
      .split(/\s+/)
      .filter(function (t) {
        return !!t;
      });
  }

  function normalizeMembersRaw(raw) {
    var s = String(raw || "")
      .replace(/\r\n/g, "\n")
      .replace(/\n/g, ",")
      .replace(/，/g, ",");
    var parts = s
      .split(",")
      .map(function (x) {
        return x.trim();
      })
      .filter(function (x) {
        return !!x;
      });
    var seen = {};
    var out = [];
    parts.forEach(function (p) {
      var key = p.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      out.push(p);
    });
    return out.join(",");
  }

  function splitMembers(raw) {
    var norm = normalizeMembersRaw(raw);
    if (!norm) return [];
    return norm.split(",").map(function (x) {
      return x.trim();
    }).filter(Boolean);
  }

  function buildChangeMemo(beforeRaw, afterRaw) {
    var beforeList = splitMembers(beforeRaw);
    var afterList = splitMembers(afterRaw);
    var before = {};
    beforeList.forEach(function (x) {
      before[x.toLowerCase()] = true;
    });
    var after = {};
    afterList.forEach(function (x) {
      after[x.toLowerCase()] = true;
    });
    var added = afterList.filter(function (x) {
      return !before[x.toLowerCase()];
    });
    var removed = beforeList.filter(function (x) {
      return !after[x.toLowerCase()];
    });
    if (!added.length && !removed.length) return "";
    var parts = [];
    added.forEach(function (x) {
      parts.push(x + "追加");
    });
    removed.forEach(function (x) {
      parts.push(x + "削除");
    });
    return formatChangeDateJst() + "：" + parts.join("\u3000");
  }

  function memberCount(raw) {
    return splitMembers(raw).length;
  }

  function membersPreview(raw) {
    var list = splitMembers(raw);
    if (!list.length) return { text: "—", count: 0 };
    var shown = list.slice(0, MEMBER_PREVIEW_COUNT);
    var text = shown.join(" / ");
    if (list.length > MEMBER_PREVIEW_COUNT) {
      text += " 他" + (list.length - MEMBER_PREVIEW_COUNT) + "名";
    }
    return { text: text, count: list.length };
  }

  function membersSlash(raw) {
    return splitMembers(raw).join(" / ");
  }

  function flatten(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      sort_no: val(rec, FC.sort_no),
      legacy_no: val(rec, FC.legacy_no),
      department: val(rec, FC.department),
      list_address: val(rec, FC.list_address),
      purpose: val(rec, FC.purpose),
      members_raw: val(rec, FC.members_raw),
      status: val(rec, FC.status) || STATUS_ACTIVE,
      last_change_memo: val(rec, FC.last_change_memo),
      note: val(rec, FC.note),
      registered_date: val(rec, FC.registered_date),
      updated_date: val(rec, FC.updated_date),
    };
  }

  function toKintoneRecord(row) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
      else if (
        code === FC.purpose ||
        code === FC.note ||
        code === FC.last_change_memo ||
        code === FC.purpose
      ) {
        o[code] = { value: v || "" };
      }
    }
    set(FC.sort_no, row.sort_no);
    set(FC.legacy_no, row.legacy_no);
    set(FC.department, row.department);
    set(FC.list_address, row.list_address);
    set(FC.purpose, row.purpose);
    set(FC.members_raw, row.members_raw);
    set(FC.status, row.status);
    set(FC.last_change_memo, row.last_change_memo);
    set(FC.note, row.note);
    set(FC.registered_date, row.registered_date);
    set(FC.updated_date, row.updated_date);
    return o;
  }

  function validateListAddress(addr) {
    var s = String(addr || "").trim();
    if (!s) return "メールアドレスは必須です";
    if (s.indexOf(LIST_DOMAIN) !== s.length - LIST_DOMAIN.length) {
      return "ドメインは " + LIST_DOMAIN + " のみ登録できます";
    }
    return "";
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
      var query = "order by sort_no asc limit " + PAGE_SIZE + " offset " + offset;
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

  function nextLegacyNo() {
    var max = 0;
    state.records.forEach(function (r) {
      var n = Number(r.legacy_no);
      if (Number.isFinite(n)) max = Math.max(max, n);
    });
    return max + 1;
  }

  function computeSortNoForDept(department, excludeId) {
    var block = deptSortNo(department) * 1000;
    var maxIdx = 0;
    state.records.forEach(function (r) {
      if (excludeId && r.id === excludeId) return;
      if (r.department !== department) return;
      var sn = Number(r.sort_no);
      if (!Number.isFinite(sn) || sn <= block || sn >= block + 1000) return;
      maxIdx = Math.max(maxIdx, sn - block);
    });
    return block + maxIdx + 1;
  }

  function recordHaystack(row) {
    return normalizeSearchText(
      SEARCH_FIELDS.map(function (k) {
        return row[k];
      }).join(" "),
    ).toLowerCase();
  }

  function recordMatchesTokens(row, tokens) {
    if (!tokens.length) return true;
    var hay = recordHaystack(row);
    for (var i = 0; i < tokens.length; i++) {
      if (hay.indexOf(tokens[i]) < 0) return false;
    }
    return true;
  }

  function rowMatchesMemberSearch(row, q) {
    if (!q) return true;
    var needle = normalizeSearchText(q).trim().toLowerCase();
    if (!needle) return true;
    var members = splitMembers(row.members_raw);
    for (var i = 0; i < members.length; i++) {
      if (members[i].toLowerCase().indexOf(needle) >= 0) return true;
    }
    return false;
  }

  function filteredRecords() {
    var tokens = searchTokens(state.search);
    var rows = state.records.filter(function (r) {
      if (state.statusFilter && r.status !== state.statusFilter) return false;
      if (state.departmentFilter && r.department !== state.departmentFilter) return false;
      if (!rowMatchesMemberSearch(r, state.memberSearch)) return false;
      return recordMatchesTokens(r, tokens);
    });
    rows.sort(function (a, b) {
      var sa = Number(a.sort_no) || 0;
      var sb = Number(b.sort_no) || 0;
      if (sa !== sb) return sa - sb;
      return String(a.list_address || "").localeCompare(String(b.list_address || ""), "ja");
    });
    return rows;
  }

  function injectCss() {
    if (document.getElementById("mll-dash-css")) return;
    var st = document.createElement("style");
    st.id = "mll-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".mll-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".mll-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".mll-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;padding:10px 14px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;}" +
      ".mll-filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;align-items:center;}" +
      ".mll-filter-label{font-size:12px;color:#475569;min-width:48px;}" +
      ".mll-chip{border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;}" +
      ".mll-chip-active{background:#1e40af;color:#fff;border-color:#1e40af;}" +
      ".mll-search-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;}" +
      ".mll-search-row input[type=search],.mll-search-row select{padding:6px 8px;border:1px solid #94a3b8;border-radius:6px;font-size:12px;}" +
      ".mll-search-row input[type=search]{min-width:220px;flex:1;max-width:360px;}" +
      ".mll-search-row select{max-width:220px;background:#fff;}" +
      ".mll-table-wrap{overflow:auto;max-height:calc(100vh - 380px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".mll-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1100px;}" +
      ".mll-table th,.mll-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle;}" +
      ".mll-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;}" +
      ".mll-col-dept{width:12em;max-width:12em;min-width:12em;white-space:normal;line-height:1.35;}" +
      ".mll-col-addr{font-family:Consolas,Monaco,monospace;font-size:11px;}" +
      ".mll-col-members{max-width:280px;white-space:normal;line-height:1.35;font-size:11px;}" +
      ".mll-col-memo{max-width:220px;white-space:normal;line-height:1.35;font-size:11px;}" +
      ".mll-table tr.deleted{background:#f8fafc;color:#64748b;}" +
      ".mll-actions button{margin:0 2px;padding:2px 6px;font-size:11px;}" +
      ".mll-none{color:#64748b;font-style:italic;}" +
      ".mll-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".mll-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:640px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".mll-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".mll-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".mll-modal input,.mll-modal textarea,.mll-modal select{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".mll-modal .mll-readonly{background:#f1f5f9;}" +
      ".mll-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      "#mll-print-portal{display:none;}" +
      "@media print{#mll-print-portal{display:block!important;position:absolute;left:0;top:0;width:100%;}body *{visibility:hidden!important;}#mll-print-portal,#mll-print-portal *{visibility:visible!important;}.mll-root{display:none!important;}}";
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

  function closeModal() {
    var el = document.getElementById("mll-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "mll-modal-root";
    bg.className = "mll-modal-bg";
    var box = document.createElement("div");
    box.className = "mll-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "mll-modal-actions";
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

  function deptSelectHtml(id, selected) {
    var opts = ['<option value="">— 選択 —</option>'];
    deptOptions().forEach(function (name) {
      opts.push(
        '<option value="' +
          esc(name) +
          '"' +
          (name === selected ? " selected" : "") +
          ">" +
          esc(name) +
          "</option>",
      );
    });
    return '<select id="' + id + '">' + opts.join("") + "</select>";
  }

  function formFieldsHtml(row, isNew) {
    var r = row || {};
    return (
      "<label>利用部署" +
      deptSelectHtml("mll-f-dept", r.department || "") +
      "</label>" +
      '<label>メールアドレス<input type="text" id="mll-f-addr" value="' +
      esc(r.list_address || "") +
      '" placeholder="name' +
      esc(LIST_DOMAIN) +
      '"></label>' +
      '<label>利用用途<input type="text" id="mll-f-purpose" value="' +
      esc(r.purpose || "") +
      '"></label>' +
      '<label>メンバー（カンマ区切り）<textarea id="mll-f-members" rows="8">' +
      esc(r.members_raw || "") +
      "</textarea></label>" +
      '<label>備考<textarea id="mll-f-note" rows="2">' +
      esc(r.note || "") +
      "</textarea></label>" +
      (isNew
        ? ""
        : '<label>作成日<input type="text" id="mll-f-reg" class="mll-readonly" readonly value="' +
          esc(r.registered_date || "") +
          '"></label>' +
          '<label>更新日<input type="text" id="mll-f-upd" class="mll-readonly" readonly value="' +
          esc(r.updated_date || "") +
          '"></label>' +
          '<label>直近変更メモ<input type="text" id="mll-f-memo" class="mll-readonly" readonly value="' +
          esc(r.last_change_memo || "") +
          '"></label>')
    );
  }

  function readForm(row, isNew) {
    var department = document.getElementById("mll-f-dept").value.trim();
    var listAddress = document.getElementById("mll-f-addr").value.trim();
    var purpose = document.getElementById("mll-f-purpose").value.trim();
    var membersRaw = normalizeMembersRaw(document.getElementById("mll-f-members").value);
    var note = document.getElementById("mll-f-note").value.trim();
    var addrErr = validateListAddress(listAddress);
    if (addrErr) throw new Error(addrErr);
    if (!department) throw new Error("利用部署は必須です");
    if (!membersRaw) throw new Error("メンバーは必須です");

    var o = {
      department: department,
      list_address: listAddress,
      purpose: purpose,
      members_raw: membersRaw,
      note: note,
      status: isNew ? STATUS_ACTIVE : row.status || STATUS_ACTIVE,
    };

    if (isNew) {
      o.legacy_no = String(nextLegacyNo());
      o.sort_no = String(computeSortNoForDept(department));
      o.registered_date = todayJstYmd();
      o.updated_date = todayJstYmd();
      o.last_change_memo = "";
    } else {
      o.id = row.id;
      o.revision = row.revision;
      o.legacy_no = row.legacy_no;
      o.registered_date = row.registered_date;
      o.last_change_memo = row.last_change_memo;
      o.updated_date = row.updated_date;
      if (department !== row.department) {
        o.sort_no = String(computeSortNoForDept(department, row.id));
      } else {
        o.sort_no = row.sort_no;
      }
      if (membersRaw !== normalizeMembersRaw(row.members_raw)) {
        o.last_change_memo = buildChangeMemo(row.members_raw, membersRaw);
        o.updated_date = todayJstYmd();
      }
    }
    return o;
  }

  function openNewModal() {
    openModal("新規メーリングリスト", formFieldsHtml(null, true), [
      { label: "キャンセル" },
      {
        label: "登録",
        primary: true,
        onClick: function (close) {
          var row;
          try {
            row = readForm(null, true);
          } catch (e) {
            alert(e.message || e);
            return;
          }
          apiPost("/k/v1/record.json", { app: APP_DB, record: toKintoneRecord(row) })
            .then(function () {
              close();
              reloadRecords();
            })
            .catch(function (e) {
              var msg = e.message || String(e);
              if (/unique|重複|duplicate|GAIA_/i.test(msg)) {
                alert("登録失敗: このメールアドレスは既に登録されています。\n" + msg);
              } else {
                alert("登録失敗: " + msg);
              }
            });
        },
      },
    ]);
  }

  function openEditModal(row) {
    var title = "編集 — " + (row.list_address || row.department);
    openModal(title, formFieldsHtml(row, false), [
      { label: "キャンセル" },
      {
        label: "保存",
        primary: true,
        onClick: function (close) {
          var updated;
          try {
            updated = readForm(row, false);
          } catch (e) {
            alert(e.message || e);
            return;
          }
          apiPut("/k/v1/record.json", {
            app: APP_DB,
            id: Number(updated.id),
            revision: Number(updated.revision),
            record: toKintoneRecord(updated),
          })
            .then(function () {
              close();
              reloadRecords();
            })
            .catch(function (e) {
              var msg = e.message || String(e);
              if (/unique|重複|duplicate|GAIA_/i.test(msg)) {
                alert("保存失敗: このメールアドレスは既に別の行で使われています。\n" + msg);
              } else {
                alert("保存失敗: " + msg);
              }
            });
        },
      },
    ]);
  }

  function openSoftDeleteModal(row) {
    openModal(
      "削除確認（論理削除）",
      "<p>メール: <strong>" +
        esc(row.list_address) +
        "</strong></p><p>部署: " +
        esc(row.department) +
        "</p><p>状態を <strong>削除</strong> にします（レコードは残ります）。</p>",
      [
        { label: "キャンセル" },
        {
          label: "削除する",
          primary: true,
          onClick: function (close) {
            apiPut("/k/v1/record.json", {
              app: APP_DB,
              id: Number(row.id),
              revision: Number(row.revision),
              record: { status: { value: STATUS_DELETED } },
            })
              .then(function () {
                close();
                reloadRecords();
              })
              .catch(function (e) {
                alert("削除失敗: " + (e.message || e));
              });
          },
        },
      ],
    );
  }

  function openHardDeleteModal(row) {
    openModal(
      "物理削除確認",
      "<p>メール: <strong>" +
        esc(row.list_address) +
        "</strong></p><p>部署: " +
        esc(row.department) +
        "</p><p>このレコードを<strong>物理削除</strong>します（誤登録のみ）。</p>",
      [
        { label: "キャンセル" },
        {
          label: "物理削除する",
          primary: true,
          onClick: function (close) {
            apiDelete("/k/v1/records.json", { app: APP_DB, ids: [Number(row.id)] })
              .then(function () {
                close();
                reloadRecords();
              })
              .catch(function (e) {
                alert("物理削除失敗: " + (e.message || e));
              });
          },
        },
      ],
    );
  }

  function displayCell(v) {
    var t = String(v || "").trim();
    if (!t) return '<span class="mll-none">—</span>';
    return esc(t);
  }

  function renderFilterGroup(containerId, label, chips, activeValue, dataAttr) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = '<span class="mll-filter-label">' + esc(label) + "</span>";
    chips.forEach(function (chip) {
      html +=
        '<button type="button" class="mll-chip' +
        (activeValue === chip.value ? " mll-chip-active" : "") +
        '" data-' +
        dataAttr +
        '="' +
        esc(chip.value) +
        '">' +
        esc(chip.label) +
        "</button>";
    });
    el.innerHTML = html;
    el.querySelectorAll(".mll-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.statusFilter = btn.getAttribute("data-" + dataAttr) || "";
        renderTable();
      });
    });
  }

  function renderFilterChips() {
    renderFilterGroup(
      "mll-filters-status",
      "状態",
      [
        { value: "", label: "全数" },
        { value: STATUS_ACTIVE, label: STATUS_ACTIVE },
        { value: STATUS_DELETED, label: STATUS_DELETED },
      ],
      state.statusFilter,
      "status",
    );
  }

  function refreshDeptFilterOptions() {
    var sel = document.getElementById("mll-dept-filter");
    if (!sel) return;
    var cur = state.departmentFilter || "";
    var opts = ['<option value="">すべての部署</option>'];
    deptOptions().forEach(function (d) {
      opts.push(
        '<option value="' +
          esc(d) +
          '"' +
          (d === cur ? " selected" : "") +
          ">" +
          esc(d) +
          "</option>",
      );
    });
    sel.innerHTML = opts.join("");
  }

  function renderTable() {
    var wrap = document.getElementById("mll-table-wrap");
    if (!wrap) return;
    if (state.loading) {
      wrap.innerHTML = "<p>読込中…</p>";
      return;
    }
    var rows = filteredRecords();
    var thead =
      "<tr><th>操作</th>" +
      "<th class=\"mll-col-dept\">利用部署</th>" +
      "<th class=\"mll-col-addr\">メールアドレス</th>" +
      "<th>利用用途</th>" +
      "<th class=\"mll-col-members\">メンバー</th>" +
      "<th>メンバー数</th>" +
      "<th>更新日</th>" +
      "<th class=\"mll-col-memo\">直近変更メモ</th>" +
      "</tr>";
    var tbody = rows
      .map(function (row) {
        var preview = membersPreview(row.members_raw);
        var cls = row.status === STATUS_DELETED ? "deleted" : "";
        return (
          '<tr class="' +
          cls +
          '" data-id="' +
          esc(row.id) +
          '"><td class="mll-actions">' +
          '<button type="button" class="mll-btn-edit">編集</button> ' +
          (row.status === STATUS_ACTIVE
            ? '<button type="button" class="mll-btn-soft-del">削除</button> '
            : "") +
          '<button type="button" class="mll-btn-hard-del">物理削除</button>' +
          "</td>" +
          '<td class="mll-col-dept">' +
          displayCell(row.department) +
          "</td>" +
          '<td class="mll-col-addr">' +
          displayCell(row.list_address) +
          "</td>" +
          "<td>" +
          displayCell(row.purpose) +
          "</td>" +
          '<td class="mll-col-members">' +
          displayCell(preview.text) +
          "</td>" +
          "<td>" +
          esc(String(preview.count)) +
          "</td>" +
          "<td>" +
          displayCell(row.updated_date) +
          "</td>" +
          '<td class="mll-col-memo">' +
          displayCell(row.last_change_memo) +
          "</td></tr>"
        );
      })
      .join("");
    wrap.innerHTML =
      '<table class="mll-table"><thead>' +
      thead +
      "</thead><tbody>" +
      (tbody || '<tr><td colspan="8">該当なし</td></tr>') +
      "</tbody></table>";
    wrap.querySelectorAll(".mll-btn-edit").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.closest("tr").getAttribute("data-id");
        var row = state.records.find(function (r) {
          return r.id === id;
        });
        if (row) openEditModal(row);
      });
    });
    wrap.querySelectorAll(".mll-btn-soft-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.closest("tr").getAttribute("data-id");
        var row = state.records.find(function (r) {
          return r.id === id;
        });
        if (row) openSoftDeleteModal(row);
      });
    });
    wrap.querySelectorAll(".mll-btn-hard-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.closest("tr").getAttribute("data-id");
        var row = state.records.find(function (r) {
          return r.id === id;
        });
        if (row) openHardDeleteModal(row);
      });
    });
    renderFilterChips();
    var meta = document.getElementById("mll-count");
    if (meta) {
      var active = state.records.filter(function (r) {
        return r.status === STATUS_ACTIVE;
      }).length;
      meta.textContent =
        "表示 " + rows.length + " / 全 " + state.records.length + " 件（有効 " + active + "）";
    }
  }

  function reloadRecords() {
    state.loading = true;
    renderTable();
    return fetchAllRecords()
      .then(function (rows) {
        state.records = rows.map(flatten);
        state.loading = false;
        refreshDeptFilterOptions();
        renderTable();
      })
      .catch(function (e) {
        state.loading = false;
        renderTable();
        alert("読込失敗: " + (e.message || e));
      });
  }

  function printFieldValue(row, key) {
    if (key === "members_slash") return membersSlash(row.members_raw) || "—";
    var t = String(row[key] || "").trim();
    if (!t) return "—";
    return t;
  }

  function buildPrintTableHtml(rows, title) {
    var head = PRINT_FIELDS.map(function (f) {
      return "<th>" + esc(f.label) + "</th>";
    }).join("");
    var body = rows
      .map(function (row) {
        return (
          "<tr>" +
          PRINT_FIELDS.map(function (f) {
            return "<td>" + esc(printFieldValue(row, f.key)) + "</td>";
          }).join("") +
          "</tr>"
        );
      })
      .join("");
    var deptNote = state.departmentFilter ? "　部署: " + state.departmentFilter : "";
    return (
      '<div class="mllpr-page">' +
      "<h1>" +
      esc(title) +
      "</h1>" +
      '<p class="mllpr-meta">出力日: ' +
      esc(todayJstYmd()) +
      deptNote +
      "　BUILD: " +
      esc(BUILD) +
      "</p>" +
      '<table class="mllpr-table"><thead><tr>' +
      head +
      "</tr></thead><tbody>" +
      body +
      "</tbody></table></div>"
    );
  }

  function printStylesheet() {
    return (
      ".mllpr-page{font-family:Meiryo,Segoe UI,sans-serif;padding:12px;}" +
      ".mllpr-page h1{font-size:16pt;margin:0 0 8px;}" +
      ".mllpr-meta{font-size:10pt;color:#475569;margin:0 0 12px;}" +
      ".mllpr-table{border-collapse:collapse;width:100%;font-size:9pt;}" +
      ".mllpr-table th,.mllpr-table td{border:1px solid #334155;padding:4px 5px;vertical-align:top;word-break:break-all;}" +
      ".mllpr-table th{background:#e2e8f0;}" +
      "@media print{@page{size:A4 landscape;margin:8mm;}}"
    );
  }

  function runPrint(html) {
    var portal = document.getElementById("mll-print-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "mll-print-portal";
      document.body.appendChild(portal);
    }
    portal.innerHTML = "<style>" + printStylesheet() + "</style>" + html;
    setTimeout(function () {
      window.print();
    }, 200);
  }

  function printList() {
    var rows = filteredRecords();
    if (!rows.length) {
      alert("印刷対象がありません");
      return;
    }
    runPrint(buildPrintTableHtml(rows, "メーリングリスト台帳 — 一覧"));
  }

  function exportListXlsx(rows) {
    if (typeof XLSX === "undefined" || !XLSX.utils || !XLSX.writeFile) {
      alert("xlsx ライブラリが読み込まれていません");
      return;
    }
    var header = XLSX_COLUMNS.map(function (f) {
      return f.label;
    });
    var matrix = [header];
    rows.forEach(function (row) {
      matrix.push(
        XLSX_COLUMNS.map(function (f) {
          var v = row[f.key];
          if (f.key === "members_raw") return normalizeMembersRaw(v);
          return String(v == null ? "" : v).trim() || "";
        }),
      );
    });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "一覧");
    XLSX.writeFile(wb, "メーリングリスト台帳_" + todayJstYmd().replace(/-/g, "") + ".xlsx", {
      bookType: "xlsx",
    });
  }

  function exportXlsx() {
    var rows = filteredRecords();
    if (!rows.length) {
      alert("出力対象がありません");
      return;
    }
    exportListXlsx(rows);
  }

  function clearSearchFilters() {
    state.search = "";
    state.memberSearch = "";
    state.departmentFilter = "";
    state.statusFilter = STATUS_ACTIVE;
    var search = document.getElementById("mll-search");
    if (search) search.value = "";
    var member = document.getElementById("mll-member-search");
    if (member) member.value = "";
    var dept = document.getElementById("mll-dept-filter");
    if (dept) dept.value = "";
    refreshDeptFilterOptions();
    renderTable();
  }

  function buildUi(host) {
    host.innerHTML =
      '<div class="mll-root">' +
      '<div class="mll-meta">' +
      '<span id="mll-count">—</span>' +
      '<button type="button" id="mll-new" class="kintoneplugin-button-dialog-ok" style="margin-left:auto">新規登録</button>' +
      "</div>" +
      '<div class="mll-toolbar">' +
      '<input type="search" id="mll-search" placeholder="キーワード検索（メール・メンバー・用途・部署・備考）空白AND" style="min-width:280px;padding:6px;">' +
      '<input type="search" id="mll-member-search" placeholder="メンバー検索（部分一致）" style="min-width:180px;padding:6px;">' +
      '<select id="mll-dept-filter" aria-label="利用部署で絞り込み"><option value="">すべての部署</option></select>' +
      '<button type="button" id="mll-clear" class="kintoneplugin-button-normal">条件クリア</button>' +
      '<button type="button" id="mll-print-list" class="kintoneplugin-button-normal">一覧印刷</button>' +
      '<button type="button" id="mll-xlsx" class="kintoneplugin-button-normal">Excel出力</button>' +
      '<span style="font-size:11px;color:#64748b;margin-left:8px">BUILD ' +
      esc(BUILD) +
      "</span>" +
      "</div>" +
      '<div id="mll-filters-status" class="mll-filters"></div>' +
      '<div id="mll-table-wrap" class="mll-table-wrap"></div>' +
      "</div>";

    document.getElementById("mll-new").addEventListener("click", openNewModal);
    document.getElementById("mll-clear").addEventListener("click", clearSearchFilters);
    document.getElementById("mll-print-list").addEventListener("click", printList);
    document.getElementById("mll-xlsx").addEventListener("click", exportXlsx);
    document.getElementById("mll-search").addEventListener("input", function (ev) {
      state.search = ev.target.value;
      renderTable();
    });
    document.getElementById("mll-member-search").addEventListener("input", function (ev) {
      state.memberSearch = ev.target.value;
      renderTable();
    });
    document.getElementById("mll-dept-filter").addEventListener("change", function (ev) {
      state.departmentFilter = ev.target.value || "";
      renderTable();
    });
    refreshDeptFilterOptions();
  }

  kintone.events.on("app.record.index.show", function (event) {
    if (!APP_DB) {
      alert("APP_DB 未設定 — deploy 前に mailing-list:sync-db-id を実行してください");
      return event;
    }
    injectCss();
    var host = resolveMountHost();
    if (!host || document.getElementById("mll-root-mounted")) return event;
    host.innerHTML = "";
    buildUi(host);
    host.id = "mll-root-mounted";
    reloadRecords();
    return event;
  });
})();
