#!/usr/bin/env node
/** One-shot fork: jre-cloud-account-dash → jre-chub-account-dash/desktop.src.js */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = path.join(root, 'customize/jre-cloud-account-dash/desktop.src.js');
const outDir = path.join(root, 'customize/jre-chub-account-dash');
const outPath = path.join(outDir, 'desktop.src.js');

mkdirSync(outDir, { recursive: true });
let s = readFileSync(srcPath, 'utf8');

s = s.replace(
  /var BUILD = "[^"]+";/,
  'var BUILD = "2026-06-27-jre-chub-account-dash-v1";',
);
s = s.replace(/var APP_DB = \d+;/, 'var APP_DB = 0;');

s = s.replace(
  /var ORGS = \[[\s\S]*?\];/,
  'var ORGS = ["本社", "東京支店", "東北支店", "関越支店"];',
);

s = s.replace(
  /var DEPTS = \[[\s\S]*?\];/,
  `var DEPTS = [
    "－",
    "仙台営業所",
    "千葉営業所",
    "新潟営業所",
    "東京リペア部",
    "東京施工部",
    "水戸営業所",
    "盛岡営業所",
    "秋田営業所",
    "長野営業所",
    "関越施行部",
    "高崎営業所",
  ];

  var PERMS = ["グループ管理者", "承認者", "署名代行者", "署名者", "閲覧者"];

  var AGG_FIXED_FOOTNOTE =
    "【集計の見方】\\n" +
    "・拠点小計・部署行は「レコード数」です。\\n" +
    "・全社合計は「ID（ログインID）のユニーク数」です。\\n" +
    "・同一 ID が複数拠点にある場合、小計の合算が全社合計より大きくなることがあります（イレギュラー）。\\n" +
    "・現在、アカウント棚卸が未完了のため一時的に重複が残っている場合があります。整理後は全社合計と整合します。";`,
);

s = s.replace(
  /var FC = \{[\s\S]*?\};/,
  `var FC = {
    user_id: "user_id",
    user_name: "user_name",
    org: "org",
    dept: "dept",
    mail: "mail",
    permissions: "permissions",
    start_date: "start_date",
    end_date: "end_date",
    note: "note",
  };`,
);

s = s.replace(
  /var API_FIELDS = \[[\s\S]*?\];/,
  `var API_FIELDS = [
    "$id",
    "$revision",
    FC.user_id,
    FC.user_name,
    FC.org,
    FC.dept,
    FC.mail,
    FC.permissions,
    FC.start_date,
    FC.end_date,
    FC.note,
  ];`,
);

s = s.replace(
  /var LIST_COLUMNS = \[[\s\S]*?\];/,
  `var LIST_COLUMNS = [
    { key: "user_id", label: "ID" },
    { key: "user_name", label: "アカウント名" },
    { key: "org", label: "所属グループ" },
    { key: "dept", label: "部門" },
    { key: "mail", label: "メールアドレス" },
    { key: "permissions", label: "権限" },
    { key: "start_date", label: "利用開始日" },
    { key: "end_date", label: "利用終了日" },
    { key: "note", label: "備考" },
  ];`,
);

s = s.replace('var LIST_EXPORT_COLUMNS = LIST_COLUMNS.slice(0, 8);', 'var LIST_EXPORT_COLUMNS = LIST_COLUMNS.slice(0, 8);');

const flattenBlock = `  function parsePermissions(rec) {
    var st = rec && rec[FC.permissions];
    if (!st || !st.value || !Array.isArray(st.value)) return [];
    return st.value
      .map(function (row) {
        return row.value && row.value.perm ? String(row.value.perm.value || "").trim() : "";
      })
      .filter(function (p) {
        return p;
      });
  }

  function flatten(rec) {
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      user_id: val(rec, FC.user_id),
      user_name: val(rec, FC.user_name),
      org: val(rec, FC.org),
      dept: val(rec, FC.dept),
      mail: val(rec, FC.mail),
      permissions: parsePermissions(rec),
      start_date: val(rec, FC.start_date),
      end_date: val(rec, FC.end_date),
      note: val(rec, FC.note),
    };
  }`;

s = s.replace(/  function flatten\(rec\) \{[\s\S]*?  \}/, flattenBlock);

s = s.replace(
  /  function listFieldDisplay\(row, key\) \{[\s\S]*?  \}/,
  `  function listFieldDisplay(row, key) {
    if (key === "dept") return formatDeptLabel(row.org, row.dept);
    if (key === "permissions") return (row.permissions || []).join("、");
    return row[key] != null ? String(row[key]) : "";
  }`,
);

s = s.replace(
  /  function buildRecordSearchHaystack\(row\) \{[\s\S]*?  \}/,
  `  function buildRecordSearchHaystack(row) {
    var org = String(row.org || "").trim();
    var dept = String(row.dept || "").trim();
    var deptLabel = formatDeptLabel(org, dept);
    var permStr = (row.permissions || []).join(" ");
    var parts = [row.user_id, row.user_name, org, dept, deptLabel, permStr, row.mail, row.note];
    if (org && dept) {
      parts.push(org + " " + dept, org + dept, org + " / " + dept, org + "・" + dept, org + "／" + dept);
    }
    if (org && deptLabel && deptLabel !== dept) {
      parts.push(org + " " + deptLabel, org + deptLabel, org + " / " + deptLabel, org + "・" + deptLabel);
    }
    return normalizeSearchText(parts.join(" "));
  }`,
);

s = s.replace(
  /  function isValidJbisEmail\(s\) \{[\s\S]*?  \}/,
  `  function isValidMail(s) {
    var v = String(s || "").trim();
    return v.length > 0 && v.indexOf("@") >= 0;
  }`,
);

s = s.replace(
  /  function normalizeEmail\(s\) \{[\s\S]*?  \}/,
  `  function normalizeUserId(s) {
    return String(s || "").trim();
  }`,
);

s = s.replace(
  /  function countGrandFiltered\(orgs, depts, ym\) \{[\s\S]*?  \}/,
  `  function countGrandFiltered(orgs, depts, ym) {
    var orgSet = {};
    orgs.forEach(function (o) {
      orgSet[o] = true;
    });
    var deptSet = {};
    depts.forEach(function (d) {
      deptSet[d] = true;
    });
    var seen = {};
    state.records.forEach(function (r) {
      if (!orgSet[r.org] || !deptSet[r.dept]) return;
      if (!isActiveAtMonthEnd(r, ym)) return;
      var id = normalizeUserId(r.user_id);
      if (id) seen[id] = true;
    });
    return Object.keys(seen).length;
  }`,
);

s = s.replace(
  /  function toKintoneRecord\(row\) \{[\s\S]*?  \}/,
  `  function toKintoneRecord(row) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
      else if (code === FC.end_date || code === FC.note) {
        o[code] = { value: v || "" };
      }
    }
    set(FC.user_id, row.user_id);
    set(FC.user_name, row.user_name);
    set(FC.org, row.org);
    set(FC.dept, row.dept);
    set(FC.mail, row.mail);
    set(FC.start_date, row.start_date);
    set(FC.end_date, row.end_date);
    set(FC.note, row.note);
    var perms = Array.isArray(row.permissions) ? row.permissions : [];
    o[FC.permissions] = {
      value: perms
        .filter(function (p) {
          return String(p || "").trim();
        })
        .map(function (p) {
          return { value: { perm: { value: String(p).trim() } } };
        }),
    };
    return o;
  }`,
);

s = s.replace(
  /  function checkDuplicateUserId\(userId, excludeId\) \{[\s\S]*?  \}/,
  `  function findActiveByUserId(userId, excludeId) {
    var id = normalizeUserId(userId);
    var out = [];
    for (var i = 0; i < state.records.length; i++) {
      var r = state.records[i];
      if (excludeId && r.id === excludeId) continue;
      if (r.end_date) continue;
      if (normalizeUserId(r.user_id) === id) out.push(r);
    }
    return out;
  }

  function computeMultiBranchDuplicateIds() {
    var byId = {};
    state.records.forEach(function (r) {
      if (r.end_date) return;
      var id = normalizeUserId(r.user_id);
      if (!id) return;
      if (!byId[id]) byId[id] = [];
      byId[id].push(r);
    });
    var dups = {};
    Object.keys(byId).forEach(function (id) {
      if (byId[id].length < 2) return;
      var orgs = {};
      byId[id].forEach(function (r) {
        orgs[r.org] = true;
      });
      if (Object.keys(orgs).length >= 2) dups[id] = byId[id];
    });
    return dups;
  }`,
);

s = s.replace(
  /  function validateRow\(row, isNew\) \{[\s\S]*?  \}/,
  `  function validateRow(row, isNew) {
    var userId = String(row.user_id || "").trim();
    var mail = String(row.mail || "").trim();
    var userName = String(row.user_name || "").trim();
    var org = String(row.org || "").trim();
    var dept = String(row.dept || "").trim();
    var startDate = String(row.start_date || "").trim();
    var endDate = String(row.end_date || "").trim();
    var perms = Array.isArray(row.permissions) ? row.permissions.filter(function (p) { return String(p || "").trim(); }) : [];

    if (!userId) throw new Error("IDは必須です");
    if (!userName) throw new Error("アカウント名は必須です");
    if (!org) throw new Error("所属グループは必須です");
    if (!dept) throw new Error("部門は必須です");
    if (!mail) throw new Error("メールアドレスは必須です");
    if (!startDate) throw new Error("利用開始日は必須です");
    if (!perms.length) throw new Error("権限を1つ以上選択してください");
    var permSet = {};
    perms.forEach(function (p) {
      if (permSet[p]) throw new Error("権限「" + p + "」が重複しています（保存は可能ですが確認してください）");
      permSet[p] = true;
    });
    if (!isValidMail(mail)) {
      throw new Error("メールアドレスに @ を含めてください");
    }
    if (endDate && endDate < startDate) {
      throw new Error("利用終了日は利用開始日以降にしてください");
    }
  }`,
);

s = s.replace(
  /  function apply595PickToForm\(empRow\) \{[\s\S]*?  \}/,
  `  function apply595PickToForm(empRow) {
    var nameEl = document.getElementById("jca-f-user-name");
    var mailEl = document.getElementById("jca-f-mail");
    var orgEl = document.getElementById("jca-f-org");
    var orgWarn = document.getElementById("jca-f-org-warn");
    if (!nameEl || !mailEl || !orgEl) return;

    nameEl.value = val(empRow, "user_name").trim();
    mailEl.value = val(empRow, "mail").trim();
    setCreate595Picked(true);

    var org = resolveOrgFrom595(empRow);
    if (org) {
      orgEl.value = org;
      if (orgWarn) orgWarn.textContent = "";
    } else if (orgWarn) {
      orgWarn.textContent =
        "595の所属「" +
        (val(empRow, "group_name") || val(empRow, "dept_name") || "—") +
        "」は所属グループに未マッチです。手動で選択してください。";
    }
  }`,
);

const permHelpers = `
  function permOptionsHtml(selected) {
    return (
      '<option value="">—</option>' +
      PERMS.map(function (p) {
        return '<option value="' + esc(p) + '"' + (selected === p ? " selected" : "") + ">" + esc(p) + "</option>";
      }).join("")
    );
  }

  function readFormPermissions() {
    var box = document.getElementById("jca-f-perms");
    if (!box) return [];
    var out = [];
    box.querySelectorAll(".jca-perm-row select").forEach(function (sel) {
      var v = sel.value.trim();
      if (v) out.push(v);
    });
    return out;
  }

  function wirePermissionRows() {
    var box = document.getElementById("jca-f-perms");
    if (!box) return;
    box.querySelectorAll(".jca-perm-add").forEach(function (btn) {
      btn.onclick = function () {
        var row = document.createElement("div");
        row.className = "jca-perm-row";
        row.innerHTML =
          '<select class="jca-perm-select">' + permOptionsHtml("") + '</select>' +
          '<button type="button" class="jca-perm-remove kintoneplugin-button-normal">削除</button>';
        box.insertBefore(row, btn);
        wirePermissionRows();
      };
    });
    box.querySelectorAll(".jca-perm-remove").forEach(function (btn) {
      btn.onclick = function () {
        var rows = box.querySelectorAll(".jca-perm-row");
        if (rows.length <= 1) {
          btn.closest(".jca-perm-row").querySelector("select").value = "";
          return;
        }
        btn.closest(".jca-perm-row").remove();
      };
    });
  }

  function permissionsFormHtml(perms) {
    var list = Array.isArray(perms) && perms.length ? perms : [""];
    var rows = list
      .map(function (p) {
        return (
          '<div class="jca-perm-row">' +
          '<select class="jca-perm-select">' +
          permOptionsHtml(p) +
          '</select>' +
          '<button type="button" class="jca-perm-remove kintoneplugin-button-normal">削除</button>' +
          "</div>"
        );
      })
      .join("");
    return (
      '<label>権限<div id="jca-f-perms" class="jca-perms-box">' +
      rows +
      '<button type="button" class="jca-perm-add kintoneplugin-button-normal">権限を追加</button></div></label>'
    );
  }
`;

s = s.replace('  function orgOptionsHtml(selected) {', permHelpers + '\n  function orgOptionsHtml(selected) {');

s = s.replace(
  /  function readFormRow\(existing\) \{[\s\S]*?  \}/,
  `  function readFormRow(existing) {
    var isNew = !existing || !existing.id;
    var row = {
      user_id: document.getElementById("jca-f-user-id").value.trim(),
      user_name: document.getElementById("jca-f-user-name").value.trim(),
      org: document.getElementById("jca-f-org").value.trim(),
      dept: document.getElementById("jca-f-dept").value.trim(),
      mail: document.getElementById("jca-f-mail").value.trim(),
      permissions: readFormPermissions(),
      start_date: document.getElementById("jca-f-start-date").value.trim(),
      end_date: document.getElementById("jca-f-end-date").value.trim(),
      note: document.getElementById("jca-f-note").value.trim(),
    };
    if (!isNew) {
      row.id = existing.id;
      row.revision = existing.revision;
      row.user_id = existing.user_id;
    }
    validateRow(row, isNew);
    return row;
  }`,
);

s = s.replace(
  /  function formFieldsHtml\(row, isNew\) \{[\s\S]*?  \}/,
  `  function formFieldsHtml(row, isNew) {
    var r = row || {};
    var userIdAttrs = isNew ? "" : " readonly";
    return (
      (isNew
        ? '<input type="hidden" id="jca-create-595-picked" value="">' +
          '<div class="jca-create-595-step">' +
          '<button type="button" id="jca-create-595-search" class="kintoneplugin-button-dialog-ok jca-create-595-btn">社員名検索（595）</button>' +
          "</div>" +
          '<p class="jca-hint">社員名検索でアカウント名・メール・所属グループを自動入力します。ID と部門・権限は手入力です。</p>'
        : "") +
      '<label>ID<input type="text" id="jca-f-user-id" value="' +
      esc(r.user_id || "") +
      '"' +
      userIdAttrs +
      ' autocomplete="off"></label>' +
      '<label>アカウント名<input type="text" id="jca-f-user-name" value="' +
      esc(r.user_name || "") +
      '"></label>' +
      '<label>所属グループ<select id="jca-f-org">' +
      orgOptionsHtml(r.org) +
      '</select></label>' +
      '<div id="jca-f-org-warn" class="jca-warn"></div>' +
      '<label>部門<select id="jca-f-dept">' +
      deptOptionsHtml(r.dept || "－") +
      '</select></label>' +
      '<p class="jca-hint">部門は C-Hub 専用マスタです。595 の所属とは異なります。</p>' +
      permissionsFormHtml(r.permissions) +
      '<label>メールアドレス<input type="email" id="jca-f-mail" value="' +
      esc(r.mail || "") +
      '"></label>' +
      '<label>利用開始日<input type="date" id="jca-f-start-date" value="' +
      esc(r.start_date || todayJstYmd()) +
      '"></label>' +
      '<label>利用終了日<input type="date" id="jca-f-end-date" value="' +
      esc(r.end_date || "") +
      '"></label>' +
      '<label>備考<textarea id="jca-f-note" rows="3">' +
      esc(r.note || "") +
      "</textarea></label>"
    );
  }`,
);

s = s.replace(
  /  function wireCreate595Search\(\) \{[\s\S]*?  \}/,
  `  function wireCreate595Search() {
    var btn = document.getElementById("jca-create-595-search");
    if (!btn) return;
    btn.onclick = function () {
      open595SearchModal(apply595PickToForm);
    };
  }`,
);

s = s.replace(
  '    if (isCreate) wireCreate595Search();',
  '    if (isCreate) wireCreate595Search();\n    wirePermissionRows();',
);

s = s.replace(
  /          var updated;\n          try \{\n            updated = readFormRow\(isCreate \? null : row\);\n          \} catch \(e\) \{\n            alert\(e\.message \|\| e\);\n            return;\n          \}\n          var savePromise = isCreate/,
  `          var updated;
          try {
            updated = readFormRow(isCreate ? null : row);
          } catch (e) {
            alert(e.message || e);
            return;
          }
          if (isCreate) {
            var existing = findActiveByUserId(updated.user_id, null);
            if (existing.length) {
              var orgs = existing.map(function (r) { return r.org; }).join("、");
              var ok = window.confirm(
                "同一 ID「" + updated.user_id + "」が既に登録されています（" + orgs + "）。\\n\\nイレギュラー（複数拠点）として登録しますか？"
              );
              if (!ok) return;
            }
          }
          var savePromise = isCreate`,
);

s = s.replace(
  /  function buildAggSummaryText\(sel, months\) \{[\s\S]*?  \}/,
  `  function buildAggSummaryText(sel, months) {
    var parts = ["期間=" + sel.fromYm + "～" + sel.toYm];
    if (sel.orgs.length && sel.orgs.length < ORGS.length) {
      parts.push("所属グループ=" + sel.orgs.join("、"));
    }
    if (sel.depts.length && sel.depts.length < DEPTS.length) {
      parts.push("部門=" + sel.depts.join("、"));
    }
    parts.push("列=" + months.length + " か月");
    return parts.join(" / ");
  }`,
);

const aggDupFn = `
  function buildAggDuplicateNotes(sel, months) {
    var orgSet = {};
    sel.orgs.forEach(function (o) {
      orgSet[o] = true;
    });
    var deptSet = {};
    sel.depts.forEach(function (d) {
      deptSet[d] = true;
    });
    var dupMap = {};
    months.forEach(function (ym) {
      var byId = {};
      state.records.forEach(function (r) {
        if (!orgSet[r.org] || !deptSet[r.dept]) return;
        if (!isActiveAtMonthEnd(r, ym)) return;
        var id = normalizeUserId(r.user_id);
        if (!id) return;
        if (!byId[id]) byId[id] = [];
        byId[id].push(r);
      });
      Object.keys(byId).forEach(function (id) {
        if (byId[id].length < 2) return;
        var orgNames = {};
        byId[id].forEach(function (r) {
          orgNames[r.org] = true;
        });
        if (Object.keys(orgNames).length < 2) return;
        if (!dupMap[id]) {
          dupMap[id] = { name: byId[id][0].user_name, orgs: {} };
        }
        Object.keys(orgNames).forEach(function (o) {
          dupMap[id].orgs[o] = true;
        });
      });
    });
    return dupMap;
  }

  function aggDuplicateFootnoteHtml(dupMap) {
    var ids = Object.keys(dupMap);
    if (!ids.length) return "";
    var lines = ids.map(function (id) {
      var d = dupMap[id];
      var orgList = ORGS.filter(function (o) {
        return d.orgs[o];
      }).join("・");
      return (
        "※ 同一 ID の複数拠点登録: <code>" +
        esc(id) +
        "</code>（" +
        esc(d.name || "—") +
        "）— " +
        esc(orgList) +
        "（全社合計は ID ユニークのため小計合算と一致しない場合あり）"
      );
    });
    return '<div class="jca-agg-dup-notes">' + lines.join("<br>") + "</div>";
  }

  function aggFootnotesHtml(dupMap) {
    return (
      '<details class="jca-agg-footnote-acc" open>' +
      "<summary>集計の見方・備考</summary>" +
      '<pre class="jca-agg-footnote-fixed">' +
      esc(AGG_FIXED_FOOTNOTE) +
      "</pre>" +
      aggDuplicateFootnoteHtml(dupMap) +
      "</details>"
    );
  }
`;

s = s.replace('  function buildAggTable(sel) {', aggDupFn + '\n  function buildAggTable(sel) {');

s = s.replace(
  /    return \{\n      months: months,\n      rows: rows,\n      summary: buildAggSummaryText\(sel, months\),\n    \};/,
  `    return {
      months: months,
      rows: rows,
      summary: buildAggSummaryText(sel, months),
      dupMap: buildAggDuplicateNotes(sel, months),
    };`,
);

s = s.replace(
  /'-agg-th-org">所属組織</,
  "'-agg-th-org\">所属グループ<",
);

s = s.replace(
  /state\.aggSummary = result\.summary;/,
  `state.aggSummary = result.summary;
      state.aggDupMap = result.dupMap || {};`,
);

s = s.replace(
  /    wrap\.innerHTML =\n      '<table class="jca-agg-table">' \+ head \+ body \+ "<\/table>";/,
  `    wrap.innerHTML =
      '<table class="jca-agg-table">' + head + body + "</table>" + aggFootnotesHtml(state.aggDupMap || {});`,
);

s = s.replace(
  /    aggRows: \[\],\n    aggSummary: "",/,
  `    aggRows: [],
    aggSummary: "",
    aggDupMap: {},`,
);

s = s.replace(
  /  function renderTable\(\) \{[\s\S]*?  \}\n\n  function readAggSelections/,
  `  function renderTable() {
    var tbody = document.getElementById("jca-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="11">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    var dupIds = computeMultiBranchDuplicateIds();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="11">該当なし</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (row) {
        var isDup = dupIds[normalizeUserId(row.user_id)];
        var statusBadge = row.end_date
          ? '<span class="jca-badge jca-badge-terminated">終了</span>'
          : '<span class="jca-badge jca-badge-active">稼働</span>';
        if (isDup && !row.end_date) {
          statusBadge += ' <span class="jca-dup-warn" title="同一 ID が複数拠点に登録">⚠</span>';
        }
        var actionBtns = "";
        if (state.isAdmin) {
          actionBtns =
            '<button type="button" class="jca-btn-edit">編集</button>' +
            (!row.end_date ? '<button type="button" class="jca-btn-retire">利用終了</button>' : "");
        }
        var trCls = isDup && !row.end_date ? ' class="jca-dup-row"' : "";
        return (
          "<tr" + trCls + ">" +
          "<td>" + statusBadge + "</td>" +
          LIST_COLUMNS.map(function (col) {
            return "<td>" + cellText(listFieldDisplay(row, col.key)) + "</td>";
          }).join("") +
          '<td class="jca-actions">' + actionBtns + "</td></tr>"
        );
      })
      .join("");

    rows.forEach(function (row, idx) {
      var tr = tbody.rows[idx];
      if (!tr) return;
      var editB = tr.querySelector(".jca-btn-edit");
      if (editB) {
        editB.addEventListener("click", function () {
          openEditModal(row);
        });
      }
      var retireB = tr.querySelector(".jca-btn-retire");
      if (retireB) {
        retireB.addEventListener("click", function () {
          retireRecord(row);
        });
      }
    });
  }

  function readAggSelections`,
);

// Global string replacements
const reps = [
  ['JREクラウドアカウント台帳', 'JRE-C_Hubアカウント台帳'],
  ['JREクラウドアカウント — 月次数量集計', 'JRE-C_Hubアカウント — 月次数量集計'],
  ['JREクラウドアカウント台帳 — 一覧', 'JRE-C_Hubアカウント台帳 — 一覧'],
  ['JREクラウド月次集計_', 'JRE-C_Hub月次集計_'],
  ['JREクラウドアカウント一覧_', 'JRE-C_Hubアカウント一覧_'],
  ['JRE月次集計', 'JRE-C_Hub月次集計'],
  ['JREクラウド一覧', 'JRE-C_Hub一覧'],
  ['集計条件（期間・所属組織・部署）', '集計条件（期間・所属グループ・部門）'],
  ['所属組織・部署は必要に応じて絞り込めます', '所属グループ・部門は必要に応じて絞り込めます'],
  ['既定は当年通年・全所属組織・全部署', '既定は当年通年・全所属グループ・全部門'],
  ['if (!sel.orgs.length) throw new Error("所属組織を1つ以上選択してください");', 'if (!sel.orgs.length) throw new Error("所属グループを1つ以上選択してください");'],
  ['if (!sel.depts.length) throw new Error("部署を1つ以上選択してください");', 'if (!sel.depts.length) throw new Error("部門を1つ以上選択してください");'],
  ['/** JREクラウドアカウント台帳 — DB REST CRUD + 月次集計 + 一覧出力 */', '/** JRE-C_Hubアカウント台帳 — DB REST CRUD + 月次集計 + 一覧出力 */'],
  ['ユーザ: ', 'アカウント: '],
  ['ユーザ名', 'アカウント名'],
];
for (const [a, b] of reps) {
  s = s.split(a).join(b);
}

// CSS additions
s = s.replace(
  '".jca-595-actions{display:flex;gap:8px;margin:8px 0;}";',
  '".jca-595-actions{display:flex;gap:8px;margin:8px 0;}"+' +
    '".jca-perms-box{display:flex;flex-direction:column;gap:6px;margin-top:4px;}"+' +
    '".jca-perm-row{display:flex;gap:8px;align-items:center;}"+' +
    '".jca-perm-row select{flex:1;}"+' +
    '".jca-dup-row td{background:#fef2f2;}"+' +
    '".jca-dup-warn{color:#dc2626;font-weight:700;}"+' +
    '".jca-agg-footnote-acc{margin-top:12px;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;background:#f8fafc;}"+' +
    '".jca-agg-footnote-fixed{white-space:pre-wrap;font-size:13px;color:#475569;margin:8px 0 0;}"+' +
    '".jca-agg-dup-notes{margin-top:10px;font-size:13px;color:#b91c1c;line-height:1.5;}";',
);

// xlsx/print footnotes
s = s.replace(
  /    var ws = XLSX\.utils\.aoa_to_sheet\(matrix\);\n    var wb = XLSX\.utils\.book_new\(\);\n    XLSX\.utils\.book_append_sheet\(wb, ws, "月次集計"\);/,
  `    matrix.push([]);
    matrix.push([AGG_FIXED_FOOTNOTE.replace(/\\n/g, " ")]);
    var dupLines = Object.keys(state.aggDupMap || {}).map(function (id) {
      var d = state.aggDupMap[id];
      var orgList = ORGS.filter(function (o) { return d.orgs[o]; }).join("・");
      return "※ 同一 ID: " + id + "（" + (d.name || "—") + "）— " + orgList;
    });
    dupLines.forEach(function (line) { matrix.push([line]); });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "月次集計");`,
);

s = s.replace(
  /      '<table class="jcaap-table">' \+\n      head \+\n      body \+\n      "<\/table>";/,
  `      '<table class="jcaap-table">' +
      head +
      body +
      "</table>" +
      aggFootnotesHtml(state.aggDupMap || {});`,
);

writeFileSync(outPath, s, 'utf8');
console.log('wrote', outPath, 'bytes=', s.length);
