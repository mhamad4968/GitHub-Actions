(function () {
  "use strict";

  /** メールアドレス管理台帳 — 695 REST CRUD */
  var BUILD = "2026-06-21-696-mail-address-ledger-title";

  var APP_DB = 695;
  var MAIL_DOMAIN = "@j-bis.co.jp";
  var STATUS_ACTIVE = "利用中";
  var STATUS_RETIRED = "廃止";
  var USAGE_DEFAULT = "共有メールアドレス";
  var PAGE_SIZE = 100;

  var CONN = {
    smtpServer: "j-bis.co.jp",
    smtpPort: "587",
    popServer: "j-bis.co.jp",
    popPort: "110",
  };

  var FC = {
    legacy_no: "legacy_no",
    usage_type: "usage_type",
    department: "department",
    mailbox_display_name: "mailbox_display_name",
    mail_address: "mail_address",
    mail_account: "mail_account",
    password: "password",
    status: "status",
    registered_date: "registered_date",
    note: "note",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.legacy_no,
    FC.usage_type,
    FC.department,
    FC.mailbox_display_name,
    FC.mail_address,
    FC.mail_account,
    FC.password,
    FC.status,
    FC.registered_date,
    FC.note,
  ];

  var SORT_COLUMNS = [
    { key: "legacy_no", label: "No." },
    { key: "status", label: "状態" },
    { key: "department", label: "利用部署" },
    { key: "mailbox_display_name", label: "共有名" },
    { key: "mail_address", label: "メール" },
    { key: "mail_account", label: "アカウント" },
    { key: "password", label: "PW" },
    { key: "usage_type", label: "種別" },
  ];

  var state = {
    records: [],
    filter: "active",
    search: "",
    loading: false,
    selected: {},
    sortKey: null,
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
      legacy_no: val(rec, FC.legacy_no),
      usage_type: val(rec, FC.usage_type) || USAGE_DEFAULT,
      department: val(rec, FC.department),
      mailbox_display_name: val(rec, FC.mailbox_display_name),
      mail_address: val(rec, FC.mail_address),
      mail_account: val(rec, FC.mail_account),
      password: val(rec, FC.password),
      status: val(rec, FC.status) || STATUS_ACTIVE,
      registered_date: val(rec, FC.registered_date),
      note: val(rec, FC.note),
    };
  }

  function mailAccountFromAddress(addr) {
    var s = String(addr || "").trim().toLowerCase();
    var at = s.indexOf("@");
    if (at <= 0) return "";
    return s.slice(0, at);
  }

  function randomFourDigits() {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      var u = new Uint32Array(1);
      crypto.getRandomValues(u);
      return String(u[0] % 10000).padStart(4, "0");
    }
    return String(1000 + Math.floor(Math.random() * 9000));
  }

  function buildNewPassword() {
    return "sjb" + randomFourDigits() + "1M#";
  }

  function toKintoneRecord(row, partial) {
    var o = {};
    function set(code, v) {
      if (v != null && v !== "") o[code] = { value: v };
    }
    if (!partial || partial.legacy_no) set(FC.legacy_no, row.legacy_no);
    if (!partial || partial.usage_type) set(FC.usage_type, row.usage_type);
    if (!partial || partial.department) set(FC.department, row.department);
    if (!partial || partial.mailbox_display_name) set(FC.mailbox_display_name, row.mailbox_display_name);
    if (!partial || partial.mail_address) set(FC.mail_address, row.mail_address);
    if (!partial || partial.mail_account) set(FC.mail_account, row.mail_account);
    if (!partial || partial.password) set(FC.password, row.password);
    if (!partial || partial.status) set(FC.status, row.status);
    if (!partial || partial.registered_date) set(FC.registered_date, row.registered_date);
    if (!partial || partial.note) set(FC.note, row.note);
    return o;
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
      var query = "order by legacy_no desc limit " + PAGE_SIZE + " offset " + offset;
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

  function nextLegacyNo(records) {
    var max = 0;
    records.forEach(function (r) {
      var n = Number(r.legacy_no);
      if (Number.isFinite(n)) max = Math.max(max, n);
    });
    return max + 1;
  }

  function validateMailAddress(addr) {
    var s = String(addr || "").trim().toLowerCase();
    if (!s) return "メールアドレスは必須です";
    if (s.indexOf(MAIL_DOMAIN) !== s.length - MAIL_DOMAIN.length) {
      return "ドメインは " + MAIL_DOMAIN + " のみ登録できます";
    }
    if (!/^[\w.-]+@j-bis\.co\.jp$/i.test(s)) return "形式が不正です";
    return "";
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        alert("コピーしました");
      });
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      alert("コピーしました");
    } catch (e) {
      alert("コピーに失敗しました");
    }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function injectCss() {
    if (document.getElementById("smd-dash-css")) return;
    var st = document.createElement("style");
    st.id = "smd-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".smd-root{font-family:Segoe UI,Meiryo,sans-serif;padding:8px 12px 24px;max-width:100%;}" +
      ".smd-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}" +
      ".smd-conn{margin-bottom:12px;padding:14px 18px;background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:2px solid #2563eb;border-radius:10px;}" +
      ".smd-conn h4{margin:0 0 8px;font-size:14px;color:#1e40af;}" +
      ".smd-conn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px 16px;font-size:12px;}" +
      ".smd-conn-item strong{color:#334155;}" +
      ".smd-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px;padding:10px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;}" +
      ".smd-table-wrap{overflow:auto;max-height:calc(100vh - 320px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".smd-table{border-collapse:collapse;width:100%;font-size:12px;min-width:1100px;}" +
      ".smd-table th,.smd-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle;}" +
      ".smd-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;}" +
      ".smd-table th.smd-sort{cursor:pointer;user-select:none;}" +
      ".smd-table tr.retired{background:#f8fafc;color:#64748b;}" +
      ".smd-copy{cursor:pointer;font-family:Consolas,Monaco,monospace;font-size:12px;}" +
      ".smd-copy:hover{text-decoration:underline;color:#0369a1;}" +
      ".smd-actions button{margin:0 2px;padding:2px 6px;font-size:11px;}" +
      ".smd-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".smd-modal{background:#fff;border-radius:8px;padding:16px 18px;max-width:540px;width:92%;max-height:90vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.2);}" +
      ".smd-modal h3{margin:0 0 12px;font-size:16px;}" +
      ".smd-modal label{display:block;margin:8px 0;font-size:13px;}" +
      ".smd-modal input,.smd-modal select,.smd-modal textarea{width:100%;box-sizing:border-box;padding:6px;margin-top:4px;}" +
      ".smd-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}";
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
    if (key === "legacy_no") return Number(a.legacy_no || 0) - Number(b.legacy_no || 0);
    if (key === "status") {
      var sa = a.status === STATUS_ACTIVE ? 0 : 1;
      var sb = b.status === STATUS_ACTIVE ? 0 : 1;
      if (sa !== sb) return sa - sb;
    }
    return String(a[key] || "").localeCompare(String(b[key] || ""), "ja");
  }

  function filteredRecords() {
    var q = state.search.trim().toLowerCase();
    var rows = state.records.filter(function (r) {
      if (state.filter === "active" && r.status !== STATUS_ACTIVE) return false;
      if (state.filter === "retired" && r.status !== STATUS_RETIRED) return false;
      if (!q) return true;
      var hay = (
        r.mail_address +
        " " +
        r.mail_account +
        " " +
        r.department +
        " " +
        r.mailbox_display_name
      ).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    rows.sort(function (a, b) {
      if (state.sortKey) {
        var cmp = compareSortValues(state.sortKey, a, b);
        return state.sortDir === "asc" ? cmp : -cmp;
      }
      var sa = a.status === STATUS_ACTIVE ? 0 : 1;
      var sb = b.status === STATUS_ACTIVE ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return Number(b.legacy_no) - Number(a.legacy_no);
    });
    return rows;
  }

  function closeModal() {
    var el = document.getElementById("smd-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, buttons) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "smd-modal-root";
    bg.className = "smd-modal-bg";
    var box = document.createElement("div");
    box.className = "smd-modal";
    box.innerHTML = "<h3>" + esc(title) + "</h3>" + bodyHtml;
    var actions = document.createElement("div");
    actions.className = "smd-modal-actions";
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

  function connectionPanelHtml() {
    return (
      '<div class="smd-conn">' +
      "<h4>接続設定（共通）</h4>" +
      '<div class="smd-conn-grid">' +
      '<div class="smd-conn-item"><strong>送信（SMTP）</strong> ' +
      esc(CONN.smtpServer) +
      " : " +
      esc(CONN.smtpPort) +
      "</div>" +
      '<div class="smd-conn-item"><strong>受信（POP）</strong> ' +
      esc(CONN.popServer) +
      " : " +
      esc(CONN.popPort) +
      "</div>" +
      '<div class="smd-conn-item"><strong>WEBメール</strong> メールアカウント + パスワード</div>' +
      '<div class="smd-conn-item"><strong>Outlook</strong> 上記 + 接続設定</div>' +
      "</div></div>"
    );
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

  function updateMeta() {
    var el = document.getElementById("smd-meta");
    if (!el) return;
    var active = state.records.filter(function (r) {
      return r.status === STATUS_ACTIVE;
    }).length;
    el.innerHTML =
      "<span>全 " +
      esc(String(state.records.length)) +
      " 件（利用中 " +
      esc(String(active)) +
      "）</span>" +
      '<button type="button" id="smd-new" class="kintoneplugin-button-dialog-ok" style="margin-left:auto">新規登録</button>';
    var btn = document.getElementById("smd-new");
    if (btn) btn.addEventListener("click", openNewModal);
  }

  function openNewModal() {
    var pw = buildNewPassword();
    var box = openModal(
      "新規登録",
      '<label>利用種別<select id="smd-new-usage"><option value="共有メールアドレス">共有メールアドレス</option></select></label>' +
        '<label>利用部署<input id="smd-new-dept" required></label>' +
        '<label>共有メールアドレス名<input id="smd-new-name" required></label>' +
        '<label>メールアドレス<input id="smd-new-mail" placeholder="name' +
        esc(MAIL_DOMAIN) +
        '" autocomplete="off"></label>' +
        '<div id="smd-new-mail-warn"></div>' +
        '<p style="font-size:11px;color:#64748b">アカウントはメールアドレスから自動設定されます。</p>' +
        '<label>パスワード<input id="smd-new-pw" value="' +
        esc(pw) +
        '" autocomplete="off"></label>' +
        '<button type="button" id="smd-regen-pw" class="kintoneplugin-button-normal" style="margin-top:4px">PW再生成</button>' +
        '<label>メモ<textarea id="smd-new-note" rows="2"></textarea></label>',
      [
        { label: "キャンセル" },
        {
          label: "登録",
          primary: true,
          onClick: function (close) {
            var dept = (document.getElementById("smd-new-dept") || {}).value.trim();
            var name = (document.getElementById("smd-new-name") || {}).value.trim();
            var mail = String((document.getElementById("smd-new-mail") || {}).value || "")
              .trim()
              .toLowerCase();
            var err = validateMailAddress(mail);
            if (err) {
              alert(err);
              return;
            }
            if (!dept || !name) {
              alert("利用部署と共有メールアドレス名は必須です");
              return;
            }
            var pwVal = (document.getElementById("smd-new-pw") || {}).value.trim() || buildNewPassword();
            var rec = toKintoneRecord({
              legacy_no: String(nextLegacyNo(state.records)),
              usage_type: (document.getElementById("smd-new-usage") || {}).value || USAGE_DEFAULT,
              department: dept,
              mailbox_display_name: name,
              mail_address: mail,
              mail_account: mailAccountFromAddress(mail),
              password: pwVal,
              status: STATUS_ACTIVE,
              registered_date: todayJstYmd(),
              note: (document.getElementById("smd-new-note") || {}).value || "",
            });
            apiPost("/k/v1/record.json", { app: APP_DB, record: rec })
              .then(function () {
                close();
                reloadRecords();
                alert("登録しました");
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
      ],
    );
    var mailInput = box.querySelector("#smd-new-mail");
    var mailWarn = box.querySelector("#smd-new-mail-warn");
    if (mailInput && mailWarn) {
      mailInput.addEventListener("input", function () {
        var e2 = validateMailAddress(mailInput.value.trim().toLowerCase());
        mailWarn.innerHTML = e2
          ? '<p style="color:#b91c1c;font-size:12px">' + esc(e2) + "</p>"
          : "";
      });
    }
    var regen = box.querySelector("#smd-regen-pw");
    if (regen) {
      regen.addEventListener("click", function () {
        var pwEl = document.getElementById("smd-new-pw");
        if (pwEl) pwEl.value = buildNewPassword();
      });
    }
  }

  function openEditModal(row) {
    var box = openModal(
      "編集 — No." + row.legacy_no,
      '<label>利用種別<select id="smd-edit-usage"><option value="共有メールアドレス">共有メールアドレス</option></select></label>' +
        '<label>利用部署<input id="smd-edit-dept" value="' +
        esc(row.department) +
        '"></label>' +
        '<label>共有メールアドレス名<input id="smd-edit-name" value="' +
        esc(row.mailbox_display_name) +
        '"></label>' +
        '<label>メールアドレス<input id="smd-edit-mail" value="' +
        esc(row.mail_address) +
        '" autocomplete="off"></label>' +
        '<div id="smd-edit-mail-warn"></div>' +
        '<label>アカウント（自動）<input id="smd-edit-acct" value="' +
        esc(row.mail_account) +
        '" readonly style="background:#f1f5f9"></label>' +
        '<label>パスワード<input id="smd-edit-pw" value="' +
        esc(row.password) +
        '" autocomplete="off"></label>' +
        '<label>メモ<textarea id="smd-edit-note" rows="2">' +
        esc(row.note) +
        "</textarea></label>",
      [
        { label: "キャンセル" },
        {
          label: "保存",
          primary: true,
          onClick: function (close) {
            var mail = String((document.getElementById("smd-edit-mail") || {}).value || "")
              .trim()
              .toLowerCase();
            var err = validateMailAddress(mail);
            if (err) {
              alert(err);
              return;
            }
            if (mail !== row.mail_address) {
              if (
                !window.confirm(
                  "メールアドレスを変更します。\n\n変更前: " +
                    row.mail_address +
                    "\n変更後: " +
                    mail +
                    "\n\nよろしいですか？",
                )
              ) {
                return;
              }
            }
            var rec = toKintoneRecord(
              {
                usage_type: (document.getElementById("smd-edit-usage") || {}).value || USAGE_DEFAULT,
                department: (document.getElementById("smd-edit-dept") || {}).value.trim(),
                mailbox_display_name: (document.getElementById("smd-edit-name") || {}).value.trim(),
                mail_address: mail,
                mail_account: mailAccountFromAddress(mail),
                password: (document.getElementById("smd-edit-pw") || {}).value.trim(),
                note: (document.getElementById("smd-edit-note") || {}).value || "",
              },
              {
                usage_type: 1,
                department: 1,
                mailbox_display_name: 1,
                mail_address: 1,
                mail_account: 1,
                password: 1,
                note: 1,
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
                var msg = e.message || String(e);
                if (/unique|重複|duplicate|GAIA_/i.test(msg)) {
                  alert("保存失敗: このメールアドレスは既に別の行で使われています。\n" + msg);
                } else {
                  alert("保存失敗: " + msg);
                }
              });
          },
        },
      ],
    );
    var usage = box.querySelector("#smd-edit-usage");
    if (usage) usage.value = row.usage_type || USAGE_DEFAULT;
    var mailInput = box.querySelector("#smd-edit-mail");
    var acctInput = box.querySelector("#smd-edit-acct");
    var mailWarn = box.querySelector("#smd-edit-mail-warn");
    if (mailInput && acctInput) {
      mailInput.addEventListener("input", function () {
        var m = mailInput.value.trim().toLowerCase();
        acctInput.value = mailAccountFromAddress(m);
        if (mailWarn) {
          var e2 = validateMailAddress(m);
          mailWarn.innerHTML = e2
            ? '<p style="color:#b91c1c;font-size:12px">' + esc(e2) + "</p>"
            : "";
        }
      });
    }
  }

  function openRetireModal(row) {
    openModal(
      "廃止確認",
      "<p>メール: <strong>" +
        esc(row.mail_address) +
        "</strong></p><p>部署: " +
        esc(row.department) +
        "</p><p>ステータスを <strong>廃止</strong> にします。</p>",
      [
        { label: "キャンセル" },
        {
          label: "廃止する",
          primary: true,
          onClick: function (close) {
            apiPut("/k/v1/record.json", {
              app: APP_DB,
              id: row.id,
              revision: row.revision,
              record: { status: { value: STATUS_RETIRED } },
            })
              .then(function () {
                close();
                reloadRecords();
                alert("廃止しました");
              })
              .catch(function (e) {
                alert("廃止失敗: " + (e.message || e));
              });
          },
        },
      ],
    );
  }

  function openDeleteModal(row) {
    openModal(
      "削除確認",
      "<p>メール: <strong>" +
        esc(row.mail_address) +
        "</strong></p><p>このレコードを<strong>物理削除</strong>します（誤登録のみ）。</p>",
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

  function smdPrintStylesheet() {
    return (
      "body{margin:0;padding:20px;font-family:Meiryo,sans-serif;font-size:12px;}" +
      ".smdpr-page{max-width:800px;margin:0 auto 24px;page-break-after:always;}" +
      ".smdpr-hero{background:#dbeafe;padding:16px;border-radius:8px;margin-bottom:12px;}" +
      ".smdpr-hero h1{margin:0;font-size:18px;color:#1e3a8a;}" +
      ".smdpr-conn{background:#f0f9ff;border:1px solid #93c5fd;padding:10px 12px;margin-bottom:12px;border-radius:6px;}" +
      ".smdpr-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}" +
      ".smdpr-cell{border:1px solid #e2e8f0;padding:10px;border-radius:4px;}" +
      ".smdpr-lab{font-size:10px;color:#64748b;font-weight:bold;margin-bottom:4px;}" +
      ".smdpr-val{font-size:14px;font-weight:600;word-break:break-all;}" +
      "@media print{.smdpr-page{page-break-after:always;}}"
    );
  }

  function buildPrintPageHtml(row) {
    return (
      '<div class="smdpr-page">' +
      '<div class="smdpr-hero"><h1>共有メールアドレス設定情報</h1>' +
      "<p>No." +
      esc(row.legacy_no) +
      " · " +
      esc(row.department) +
      "</p></div>" +
      '<div class="smdpr-conn"><strong>接続設定（共通）</strong><br>' +
      "SMTP " +
      esc(CONN.smtpServer) +
      ":" +
      esc(CONN.smtpPort) +
      " / POP " +
      esc(CONN.popServer) +
      ":" +
      esc(CONN.popPort) +
      "</div>" +
      '<div class="smdpr-grid">' +
      '<div class="smdpr-cell"><div class="smdpr-lab">共有メールアドレス名</div><div class="smdpr-val">' +
      esc(row.mailbox_display_name) +
      "</div></div>" +
      '<div class="smdpr-cell"><div class="smdpr-lab">利用種別</div><div class="smdpr-val">' +
      esc(row.usage_type) +
      "</div></div>" +
      '<div class="smdpr-cell"><div class="smdpr-lab">メールアドレス</div><div class="smdpr-val">' +
      esc(row.mail_address) +
      "</div></div>" +
      '<div class="smdpr-cell"><div class="smdpr-lab">メールアカウント</div><div class="smdpr-val">' +
      esc(row.mail_account) +
      "</div></div>" +
      '<div class="smdpr-cell" style="grid-column:1/-1"><div class="smdpr-lab">パスワード</div><div class="smdpr-val">' +
      esc(row.password) +
      "</div></div>" +
      "</div></div>"
    );
  }

  function printSelected() {
    var rows = state.records.filter(function (r) {
      return state.selected[r.id];
    });
    if (!rows.length) {
      alert("印刷する行にチェックを入れてください");
      return;
    }
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした");
      return;
    }
    w.opener = null;
    var pages = rows.map(buildPrintPageHtml).join("");
    w.document.write(
      "<!DOCTYPE html><html><head><meta charset=UTF-8><title>共有メール</title><style>" +
        smdPrintStylesheet() +
        "</style></head><body>" +
        pages +
        "</body></html>",
    );
    w.document.close();
    w.focus();
    setTimeout(function () {
      try {
        w.print();
      } catch (e) {
        console.warn(BUILD, e);
      }
    }, 400);
  }

  function renderTable() {
    var tbody = document.getElementById("smd-tbody");
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
        var cls = r.status === STATUS_RETIRED ? "retired" : "";
        return (
          '<tr class="' +
          cls +
          '" data-id="' +
          esc(r.id) +
          '">' +
          '<td><input type="checkbox" class="smd-check" data-id="' +
          esc(r.id) +
          '"' +
          (state.selected[r.id] ? " checked" : "") +
          "></td>" +
          "<td>" +
          esc(r.legacy_no) +
          "</td>" +
          "<td>" +
          esc(r.status) +
          "</td>" +
          "<td>" +
          esc(r.department) +
          "</td>" +
          "<td>" +
          esc(r.mailbox_display_name) +
          "</td>" +
          "<td>" +
          esc(r.mail_address) +
          "</td>" +
          "<td>" +
          esc(r.mail_account) +
          "</td>" +
          '<td><span class="smd-copy" data-copy="' +
          esc(r.password) +
          '">' +
          esc(r.password) +
          "</span></td>" +
          "<td>" +
          esc(r.usage_type) +
          "</td>" +
          '<td class="smd-actions">' +
          '<button type="button" class="smd-btn-edit">編集</button>' +
          (r.status === STATUS_ACTIVE
            ? '<button type="button" class="smd-btn-retire">廃止</button>'
            : "") +
          '<button type="button" class="smd-btn-del">削除</button>' +
          "</td></tr>"
        );
      })
      .join("");

    tbody.querySelectorAll(".smd-check").forEach(function (cb) {
      cb.addEventListener("change", function () {
        state.selected[cb.getAttribute("data-id")] = cb.checked;
      });
    });
    tbody.querySelectorAll(".smd-copy").forEach(function (el) {
      el.addEventListener("click", function () {
        copyText(el.getAttribute("data-copy") || "");
      });
    });
    tbody.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      var row = state.records.find(function (x) {
        return x.id === id;
      });
      if (!row) return;
      tr.querySelector(".smd-btn-edit").addEventListener("click", function () {
        openEditModal(row);
      });
      var rb = tr.querySelector(".smd-btn-retire");
      if (rb) rb.addEventListener("click", function () {
        openRetireModal(row);
      });
      tr.querySelector(".smd-btn-del").addEventListener("click", function () {
        openDeleteModal(row);
      });
    });
  }

  function buildShell() {
    if (document.getElementById("smd-root")) return;
    injectCss();
    var host = resolveMountHost();
    var root = document.createElement("div");
    root.id = "smd-root";
    root.className = "smd-root";
    root.innerHTML =
      '<div class="smd-toolbar">' +
      "<strong style=\"font-size:16px\">メールアドレス管理台帳</strong>" +
      '<button type="button" id="smd-reload" class="kintoneplugin-button-normal">再読込</button>' +
      '<button type="button" id="smd-print" class="kintoneplugin-button-normal">印刷</button>' +
      "</div>" +
      connectionPanelHtml() +
      '<div class="smd-toolbar">' +
      '<label><input type="radio" name="smd-filter" value="active" checked> 利用中</label>' +
      '<label><input type="radio" name="smd-filter" value="all"> すべて</label>' +
      '<label><input type="radio" name="smd-filter" value="retired"> 廃止</label>' +
      '<input type="search" id="smd-search" placeholder="メール・部署・共有名・アカウント" style="min-width:240px;padding:6px;margin-left:8px">' +
      '<button type="button" id="smd-clear" class="kintoneplugin-button-normal">クリア</button>' +
      "</div>" +
      '<div id="smd-meta" class="smd-meta"></div>' +
      '<div class="smd-table-wrap"><table class="smd-table"><thead><tr>' +
      "<th></th>" +
      SORT_COLUMNS.map(function (c) {
        return (
          '<th class="smd-sort" data-sort="' +
          esc(c.key) +
          '">' +
          esc(c.label) +
          "</th>"
        );
      }).join("") +
      "<th>操作</th>" +
      '</tr></thead><tbody id="smd-tbody"></tbody></table></div>';
    host.appendChild(root);

    document.getElementById("smd-reload").addEventListener("click", reloadRecords);
    document.getElementById("smd-print").addEventListener("click", printSelected);
    document.querySelectorAll('input[name="smd-filter"]').forEach(function (rb) {
      rb.addEventListener("change", function () {
        if (rb.checked) {
          state.filter = rb.value;
          renderTable();
        }
      });
    });
    var search = document.getElementById("smd-search");
    search.addEventListener("input", function () {
      state.search = search.value;
      renderTable();
    });
    document.getElementById("smd-clear").addEventListener("click", function () {
      state.search = "";
      state.filter = "active";
      state.selected = {};
      search.value = "";
      var ar = document.querySelector('input[name="smd-filter"][value="active"]');
      if (ar) ar.checked = true;
      renderTable();
    });

    root.querySelector(".smd-table thead").addEventListener("click", function (ev) {
      var th = ev.target.closest("th.smd-sort");
      if (!th) return;
      var key = th.getAttribute("data-sort");
      if (!key) return;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = key === "legacy_no" ? "desc" : "asc";
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
