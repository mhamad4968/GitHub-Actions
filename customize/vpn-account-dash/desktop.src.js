(function () {
  "use strict";

  /** VPNアカウント管理台帳 — DB REST CRUD + ライセンス集計 + 利用者印刷 */
  var BUILD = "2026-06-16-vpn-account-dash-license-all-depts";
  var APP_DB = 733;

  var VPN_DOMAIN = "@kensetsutoso.fre";
  var RECORD_KIND_SETTING = "設定";
  var LICENSE_UNIT = 550;
  var PAGE_SIZE = 100;

  var DEPT_ORDER = [
    "役員室",
    "総務部",
    "経理部",
    "経営企画部",
    "システム推進室",
    "人事研修部",
    "安全推進部",
    "施工推進部",
    "メンテナンス技術部",
    "塗装技術部",
    "品質管理部",
    "東北支店",
    "秋田営業所",
    "盛岡営業所",
    "仙台営業所",
    "関越支店",
    "関越支店施工部",
    "新潟営業所",
    "長野営業所",
    "高崎営業所",
    "東京支店",
    "東京支店施工部",
    "東京支店橋りょうリペア部",
    "千葉営業所",
    "水戸営業所",
    "鎌ヶ谷事務所",
    "東海支店",
    "東京営業所",
    "静岡営業所",
    "名古屋営業所",
    "関西営業所",
    "札幌支店",
    "鉄構支店",
    "湾岸工事所",
  ];

  var FC = {
    record_kind: "record_kind",
    next_user_num: "next_user_num",
    account_label: "account_label",
    dept: "dept",
    vpn_id: "vpn_id",
    password: "password",
    registered_date: "registered_date",
    note: "note",
  };

  var API_FIELDS = [
    "$id",
    "$revision",
    FC.record_kind,
    FC.next_user_num,
    FC.account_label,
    FC.dept,
    FC.vpn_id,
    FC.password,
    FC.registered_date,
    FC.note,
  ];

  var state = {
    records: [],
    settings: { id: "", revision: "", nextUserNum: 80 },
    search: "",
    loading: false,
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
      account_label: val(rec, FC.account_label),
      dept: val(rec, FC.dept),
      vpn_id: val(rec, FC.vpn_id),
      password: val(rec, FC.password),
      registered_date: val(rec, FC.registered_date),
      note: val(rec, FC.note),
    };
  }

  function genPassword() {
    var n = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
    return "jbis" + n;
  }

  function formatUserVpnId(num) {
    return "user" + String(num).padStart(3, "0") + VPN_DOMAIN;
  }

  function validateManualVpnId(raw) {
    var s = String(raw || "").trim().toLowerCase();
    if (!s) return "VPN ID を入力してください";
    if (s.indexOf("@") < 0) s = s + VPN_DOMAIN;
    if (!/^[a-z0-9]{3,20}@kensetsutoso\.fre$/.test(s)) {
      return "形式が不正です（例: akita001@kensetsutoso.fre）";
    }
    var dup = state.records.some(function (r) {
      return String(r.vpn_id).toLowerCase() === s;
    });
    if (dup) return "この VPN ID は既に登録されています";
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

  function fetchPaged(query) {
    var all = [];
    var offset = 0;
    function page() {
      var q = query + " limit " + PAGE_SIZE + " offset " + offset;
      return apiGet("/k/v1/records.json", {
        app: APP_DB,
        query: q,
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

  function fetchSettings() {
    return apiGet("/k/v1/records.json", {
      app: APP_DB,
      query: 'record_kind in ("' + RECORD_KIND_SETTING + '") limit 1',
      fields: ["$id", "$revision", FC.record_kind, FC.next_user_num],
    }).then(function (resp) {
      var rec = (resp.records || [])[0];
      if (!rec) {
        state.settings = { id: "", revision: "", nextUserNum: 80 };
        return;
      }
      state.settings = {
        id: val(rec, "$id"),
        revision: val(rec, "$revision"),
        nextUserNum: Number(val(rec, FC.next_user_num) || 80),
      };
    });
  }

  function fetchAccounts() {
    return fetchPaged('record_kind not in ("' + RECORD_KIND_SETTING + '") order by registered_date desc').then(
      function (rows) {
        state.records = rows.map(flatten);
      },
    );
  }

  function reloadAll() {
    state.loading = true;
    renderTable();
    return fetchSettings()
      .then(fetchAccounts)
      .then(function () {
        state.loading = false;
        renderLicensePanel();
        updateNextIdBanner();
        renderTable();
      })
      .catch(function (e) {
        state.loading = false;
        renderTable();
        alert("読込失敗: " + (e.message || e));
      });
  }

  function deptRank(name) {
    var i = DEPT_ORDER.indexOf(String(name || "").trim());
    return i >= 0 ? i : 999;
  }

  function licenseBreakdown() {
    var counts = {};
    state.records.forEach(function (r) {
      var d = String(r.dept || "").trim();
      if (!d) return;
      counts[d] = (counts[d] || 0) + 1;
    });
    var rows = DEPT_ORDER.map(function (d) {
      var count = counts[d] || 0;
      return { dept: d, count: count, yen: count * LICENSE_UNIT };
    });
    Object.keys(counts).forEach(function (d) {
      if (DEPT_ORDER.indexOf(d) < 0) {
        rows.push({ dept: d, count: counts[d], yen: counts[d] * LICENSE_UNIT });
      }
    });
    var total = state.records.length;
    return { total: total, totalYen: total * LICENSE_UNIT, rows: rows };
  }

  function renderLicensePanel() {
    var body = document.getElementById("vpn-license-body");
    var sum = document.getElementById("vpn-license-summary-text");
    if (!body) return;
    var b = licenseBreakdown();
    if (sum) {
      sum.textContent =
        "拠点単位ライセンス集計（" +
        LICENSE_UNIT +
        " 円/口） — 合計 " +
        b.total +
        " 口 / " +
        b.totalYen.toLocaleString("ja-JP") +
        " 円";
    }
    var lines = b.rows
      .map(function (r) {
        return (
          "<tr><td>" +
          esc(r.dept) +
          "</td><td class=\"vpn-num\">" +
          esc(String(r.count)) +
          " 口</td><td class=\"vpn-num\">" +
          esc(r.yen.toLocaleString("ja-JP")) +
          " 円</td></tr>"
        );
      })
      .join("");
    body.innerHTML =
      '<table class="vpn-license-table"><thead><tr><th>所属</th><th>口数</th><th>金額</th></tr></thead><tbody>' +
      lines +
      "</tbody></table>";
  }

  function updateNextIdBanner() {
    var el = document.getElementById("vpn-next-id");
    if (!el) return;
    var nextId = formatUserVpnId(state.settings.nextUserNum || 80);
    el.innerHTML =
      '<span class="vpn-next-label">次の VPN ID</span>' +
      '<span class="vpn-next-val">' +
      esc(nextId) +
      "</span>";
  }

  function filteredRecords() {
    var q = state.search.trim().toLowerCase();
    return state.records.filter(function (r) {
      if (!q) return true;
      var hay =
        (r.account_label + " " + r.vpn_id + " " + r.dept + " " + r.note).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
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

  function closeModal() {
    var el = document.getElementById("vpn-modal-root");
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, onSave) {
    closeModal();
    var bg = document.createElement("div");
    bg.id = "vpn-modal-root";
    bg.className = "vpn-modal-bg";
    bg.innerHTML =
      '<div class="vpn-modal" role="dialog">' +
      "<h3>" +
      esc(title) +
      "</h3>" +
      bodyHtml +
      '<div class="vpn-modal-actions">' +
      '<button type="button" class="vpn-btn-cancel">キャンセル</button>' +
      '<button type="button" class="vpn-btn-save kintoneplugin-button-dialog-ok">保存</button>' +
      "</div></div>";
    document.body.appendChild(bg);
    bg.querySelector(".vpn-btn-cancel").onclick = closeModal;
    bg.querySelector(".vpn-btn-save").onclick = function () {
      onSave();
    };
    bg.addEventListener("click", function (e) {
      if (e.target === bg) closeModal();
    });
  }

  function deptOptionsHtml(selected) {
    return DEPT_ORDER.map(function (d) {
      return (
        '<option value="' +
        esc(d) +
        '"' +
        (d === selected ? " selected" : "") +
        ">" +
        esc(d) +
        "</option>"
      );
    }).join("");
  }

  function openCreateModal() {
    var pw = genPassword();
    var body =
      '<label>アカウント名<input id="vpn-create-label" autocomplete="off"></label>' +
      '<div id="vpn-create-label-warn" class="vpn-warn"></div>' +
      '<label>所属<select id="vpn-create-dept">' +
      deptOptionsHtml("") +
      "</select></label>" +
      '<label><input type="checkbox" id="vpn-create-manual"> IDを手動で指定</label>' +
      '<label id="vpn-create-vpn-wrap" style="display:none">VPN ID<input id="vpn-create-vpn" placeholder="akita001' +
      esc(VPN_DOMAIN) +
      '" autocomplete="off"></label>' +
      '<div id="vpn-create-vpn-warn" class="vpn-warn"></div>' +
      '<p class="vpn-hint">自動採番時: <span id="vpn-create-preview">' +
      esc(formatUserVpnId(state.settings.nextUserNum || 80)) +
      "</span></p>" +
      '<label>パスワード（自動）<input id="vpn-create-pw" value="' +
      esc(pw) +
      '" readonly></label>' +
      '<p class="vpn-hint">登録日: ' +
      esc(todayJstYmd()) +
      "（自動）</p>";

    openModal("新規作成", body, function () {
      var label = document.getElementById("vpn-create-label").value.trim();
      var dept = document.getElementById("vpn-create-dept").value;
      var manual = document.getElementById("vpn-create-manual").checked;
      var vpnRaw = document.getElementById("vpn-create-vpn").value.trim();
      var password = document.getElementById("vpn-create-pw").value.trim();

      if (!label) {
        alert("アカウント名を入力してください");
        return;
      }
      if (!dept) {
        alert("所属を選択してください");
        return;
      }
      if (!password) {
        alert("パスワードが空です");
        return;
      }

      var vpnId = "";
      var useCounter = false;
      if (manual) {
        var err = validateManualVpnId(vpnRaw);
        if (err) {
          document.getElementById("vpn-create-vpn-warn").textContent = err;
          return;
        }
        vpnId = vpnRaw.indexOf("@") >= 0 ? vpnRaw.toLowerCase() : vpnRaw.toLowerCase() + VPN_DOMAIN;
      } else {
        if (!state.settings.id) {
          alert("設定レコードがありません。管理者に連絡してください。");
          return;
        }
        vpnId = formatUserVpnId(state.settings.nextUserNum || 80);
        useCounter = true;
      }

      var dup = state.records.some(function (r) {
        return String(r.vpn_id).toLowerCase() === vpnId.toLowerCase();
      });
      if (dup) {
        alert("VPN ID が重複しています: " + vpnId);
        return;
      }

      if (
        !window.confirm(
          "VPN ID: " + vpnId + "\nアカウント名: " + label + "\n\n新規作成します。よろしいですか？",
        )
      ) {
        return;
      }

      var rec = {
        account_label: { value: label },
        dept: { value: dept },
        vpn_id: { value: vpnId },
        password: { value: password },
        registered_date: { value: todayJstYmd() },
      };

      var chain = apiPost("/k/v1/record.json", { app: APP_DB, record: rec });
      if (useCounter) {
        var nextNum = Number(state.settings.nextUserNum || 80) + 1;
        chain = chain.then(function () {
          return apiPut("/k/v1/record.json", {
            app: APP_DB,
            id: state.settings.id,
            revision: state.settings.revision,
            record: { next_user_num: { value: String(nextNum) } },
          });
        });
      }

      chain
        .then(function () {
          closeModal();
          return reloadAll();
        })
        .catch(function (e) {
          alert("作成失敗: " + (e.message || e));
        });
    });

    document.getElementById("vpn-create-manual").onchange = function () {
      var on = this.checked;
      document.getElementById("vpn-create-vpn-wrap").style.display = on ? "block" : "none";
    };
    document.getElementById("vpn-create-label").oninput = function () {
      var w = document.getElementById("vpn-create-label-warn");
      if (this.value && this.value.indexOf("\u3000") < 0) {
        w.textContent = "ヒント: 通常は「姓\u3000名」（全角スペース）";
      } else {
        w.textContent = "";
      }
    };
  }

  function openEditModal(row) {
    var body =
      '<label>アカウント名<input id="vpn-edit-label" value="' +
      esc(row.account_label) +
      '"></label>' +
      '<label>所属<select id="vpn-edit-dept">' +
      deptOptionsHtml(row.dept) +
      "</select></label>" +
      '<label>VPN ID<input value="' +
      esc(row.vpn_id) +
      '" readonly disabled></label>' +
      '<label>パスワード<input id="vpn-edit-pw" value="' +
      esc(row.password) +
      '" autocomplete="off"></label>' +
      '<label>登録日<input type="date" id="vpn-edit-date" value="' +
      esc(row.registered_date) +
      '"></label>' +
      '<label>備考<textarea id="vpn-edit-note" rows="3">' +
      esc(row.note) +
      "</textarea></label>";

    openModal("編集 — " + row.vpn_id, body, function () {
      var label = document.getElementById("vpn-edit-label").value.trim();
      var dept = document.getElementById("vpn-edit-dept").value;
      var password = document.getElementById("vpn-edit-pw").value.trim();
      var regDate = document.getElementById("vpn-edit-date").value;
      var note = document.getElementById("vpn-edit-note").value;

      if (!label || !dept || !password || !regDate) {
        alert("必須項目を入力してください");
        return;
      }
      if (regDate > todayJstYmd()) {
        if (!window.confirm("登録日が未来です。このまま保存しますか？")) return;
      }
      if (password.length < 8) {
        if (!window.confirm("パスワードが8文字未満です。このまま保存しますか？")) return;
      }

      apiPut("/k/v1/record.json", {
        app: APP_DB,
        id: row.id,
        revision: row.revision,
        record: {
          account_label: { value: label },
          dept: { value: dept },
          password: { value: password },
          registered_date: { value: regDate },
          note: { value: note },
        },
      })
        .then(function () {
          closeModal();
          return reloadAll();
        })
        .catch(function (e) {
          alert("保存失敗: " + (e.message || e));
        });
    });
  }

  function deleteRecord(row) {
    var msg =
      "VPN ID: " +
      row.vpn_id +
      "\nアカウント名: " +
      row.account_label +
      "\n所属: " +
      row.dept +
      "\n\n削除後、この VPN ID は再利用できません。\nVPN 接続中の利用者がいる可能性があります。削除前に口頭確認を推奨します。\n\n削除しますか？";
    if (!window.confirm(msg)) return;
    apiDelete("/k/v1/record.json", {
      app: APP_DB,
      ids: [row.id],
      revisions: [row.revision],
    })
      .then(function () {
        return reloadAll();
      })
      .catch(function (e) {
        alert("削除失敗: " + (e.message || e));
      });
  }

  function printNoticeHtml() {
    return (
      '<div class="vpnpr-notice">' +
      "<p><strong>【ご注意】</strong></p>" +
      "<ul>" +
      "<li>本紙はあなた専用の VPN 接続情報です。他の社員に見せたり、写真・コピー・チャット等で共有しないでください。</li>" +
      "<li>紛失した場合は直ちにシステム推進室までご連絡ください。</li>" +
      "<li>パスワードは第三者に教えないでください。</li>" +
      "</ul></div>"
    );
  }

  function openPrintWindow(row) {
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var css =
      "body{font-family:'Noto Sans JP',Meiryo,sans-serif;margin:0;padding:24px;color:#0f172a;}" +
      ".vpnpr-page{max-width:720px;margin:0 auto;}" +
      ".vpnpr-title{font-size:22pt;font-weight:700;margin:0 0 20px;border-bottom:3px solid #16a34a;padding-bottom:8px;}" +
      ".vpnpr-row{margin:16px 0;}" +
      ".vpnpr-lab{font-size:12pt;color:#64748b;font-weight:700;margin-bottom:4px;}" +
      ".vpnpr-val{font-size:20pt;font-weight:700;word-break:break-all;}" +
      ".vpnpr-notice{margin-top:28px;padding:16px;border:2px solid #f59e0b;background:#fffbeb;font-size:11pt;line-height:1.7;}" +
      "@media print{@page{size:A4 portrait;margin:12mm;}body{padding:0;}.vpnpr-val{font-size:18pt;}}";
    var html =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>VPN接続情報</title><style>' +
      css +
      '</style></head><body><div class="vpnpr-page">' +
      '<h1 class="vpnpr-title">VPN 接続情報</h1>' +
      '<div class="vpnpr-row"><div class="vpnpr-lab">アカウント名</div><div class="vpnpr-val">' +
      esc(row.account_label) +
      "</div></div>" +
      '<div class="vpnpr-row"><div class="vpnpr-lab">所属</div><div class="vpnpr-val">' +
      esc(row.dept) +
      "</div></div>" +
      '<div class="vpnpr-row"><div class="vpnpr-lab">VPN ID</div><div class="vpnpr-val">' +
      esc(row.vpn_id) +
      "</div></div>" +
      '<div class="vpnpr-row"><div class="vpnpr-lab">パスワード</div><div class="vpnpr-val">' +
      esc(row.password) +
      "</div></div>" +
      '<div class="vpnpr-row"><div class="vpnpr-lab">登録日</div><div class="vpnpr-val">' +
      esc(row.registered_date) +
      "</div></div>" +
      printNoticeHtml() +
      "</div></body></html>";
    var d = w.document;
    d.open();
    d.write(html);
    d.close();
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
    var tbody = document.getElementById("vpn-tbody");
    if (!tbody) return;
    if (state.loading) {
      tbody.innerHTML = '<tr><td colspan="7">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7">該当なし</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        return (
          "<tr>" +
          "<td>" +
          esc(r.registered_date) +
          "</td>" +
          "<td>" +
          esc(r.account_label) +
          "</td>" +
          "<td>" +
          esc(r.dept) +
          "</td>" +
          "<td><span class=\"vpn-copy\" data-copy=\"" +
          esc(r.vpn_id) +
          '">' +
          esc(r.vpn_id) +
          "</span></td>" +
          "<td><span class=\"vpn-copy\" data-copy=\"" +
          esc(r.password) +
          '">' +
          esc(r.password) +
          "</span></td>" +
          "<td class=\"vpn-note\">" +
          esc(r.note) +
          "</td>" +
          '<td class="vpn-actions">' +
          '<button type="button" class="vpn-edit" data-id="' +
          esc(r.id) +
          '">編集</button>' +
          '<button type="button" class="vpn-del" data-id="' +
          esc(r.id) +
          '">削除</button>' +
          '<button type="button" class="vpn-print" data-id="' +
          esc(r.id) +
          '">印刷</button>' +
          "</td></tr>"
        );
      })
      .join("");

    tbody.querySelectorAll(".vpn-copy").forEach(function (el) {
      el.onclick = function () {
        copyText(el.getAttribute("data-copy") || "");
      };
    });
    tbody.querySelectorAll(".vpn-edit").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-id");
        var row = state.records.find(function (x) {
          return x.id === id;
        });
        if (row) openEditModal(row);
      };
    });
    tbody.querySelectorAll(".vpn-del").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-id");
        var row = state.records.find(function (x) {
          return x.id === id;
        });
        if (row) deleteRecord(row);
      };
    });
    tbody.querySelectorAll(".vpn-print").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-id");
        var row = state.records.find(function (x) {
          return x.id === id;
        });
        if (row) openPrintWindow(row);
      };
    });
  }

  function clearSearch() {
    state.search = "";
    var search = document.getElementById("vpn-search");
    if (search) search.value = "";
    renderTable();
  }

  function injectCss() {
    if (document.getElementById("vpn-dash-css")) return;
    var st = document.createElement("style");
    st.id = "vpn-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".vpn-root{font-family:Segoe UI,Meiryo,sans-serif;font-size:15px;padding:8px 12px 24px;}" +
      ".vpn-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px;}" +
      ".vpn-toolbar input[type=search]{min-width:280px;padding:8px 10px;font-size:15px;}" +
      ".vpn-search-clear{white-space:nowrap;}" +
      ".vpn-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:12px;padding:14px 18px;background:#ecfdf5;border:1px solid #86efac;border-radius:8px;}" +
      ".vpn-next-label{font-size:15px;color:#166534;font-weight:700;}" +
      ".vpn-next-val{font-size:1.65rem;font-weight:700;font-family:Consolas,Monaco,monospace;color:#14532d;margin-left:8px;}" +
      ".vpn-license-acc{margin-bottom:14px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;}" +
      ".vpn-license-acc>summary{cursor:pointer;padding:12px 16px;font-size:15px;font-weight:600;color:#334155;user-select:none;list-style:none;}" +
      ".vpn-license-acc>summary::-webkit-details-marker{display:none;}" +
      ".vpn-license-acc>summary::before{content:'▶ ';font-size:12px;color:#64748b;}" +
      ".vpn-license-acc[open]>summary::before{content:'▼ ';}" +
      ".vpn-license-acc[open]>summary{border-bottom:1px solid #e2e8f0;}" +
      ".vpn-license-body{padding:12px 16px 14px;}" +
      ".vpn-license-table{border-collapse:collapse;width:100%;max-width:720px;font-size:14px;}" +
      ".vpn-license-table th,.vpn-license-table td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;}" +
      ".vpn-license-table th{background:#f1f5f9;}" +
      ".vpn-num{text-align:right;font-variant-numeric:tabular-nums;}" +
      ".vpn-table-wrap{overflow:auto;max-height:calc(100vh - 360px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".vpn-table{border-collapse:collapse;width:100%;font-size:15px;min-width:1080px;}" +
      ".vpn-table th,.vpn-table td{border:1px solid #e2e8f0;padding:6px 8px;vertical-align:middle;line-height:1.45;}" +
      ".vpn-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;font-size:14px;}" +
      ".vpn-copy{cursor:pointer;font-family:Consolas,Monaco,monospace;font-size:14px;}" +
      ".vpn-copy:hover{text-decoration:underline;color:#0369a1;}" +
      ".vpn-note{max-width:220px;white-space:pre-wrap;font-size:13px;color:#475569;}" +
      ".vpn-actions button{margin:0 3px;padding:4px 10px;font-size:14px;}" +
      ".vpn-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".vpn-modal{background:#fff;border-radius:8px;padding:18px 20px;max-width:560px;width:92%;max-height:90vh;overflow:auto;font-size:15px;}" +
      ".vpn-modal h3{margin:0 0 14px;font-size:18px;}" +
      ".vpn-modal label{display:block;margin:10px 0;font-size:15px;}" +
      ".vpn-modal input,.vpn-modal select,.vpn-modal textarea{width:100%;box-sizing:border-box;padding:8px;font-size:15px;margin-top:4px;}" +
      ".vpn-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      ".vpn-hint{font-size:13px;color:#64748b;margin:4px 0;}" +
      ".vpn-warn{font-size:13px;color:#b45309;}";
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

  function mountUi() {
    var host = resolveMountHost();
    if (!host || document.getElementById("vpn-root")) return;
    injectCss();
    var root = document.createElement("div");
    root.id = "vpn-root";
    root.className = "vpn-root";
    root.innerHTML =
      '<div class="vpn-toolbar">' +
      '<button type="button" id="vpn-reload" class="kintoneplugin-button-normal">再読み込み</button>' +
      '<button type="button" id="vpn-create" class="kintoneplugin-button-dialog-ok">新規作成</button>' +
      '<input type="search" id="vpn-search" placeholder="アカウント名 / VPN ID / 所属 / 備考">' +
      '<button type="button" id="vpn-search-clear" class="kintoneplugin-button-normal vpn-search-clear">クリア</button>' +
      "</div>" +
      '<div class="vpn-meta" id="vpn-next-id"></div>' +
      '<details class="vpn-license-acc" id="vpn-license-acc">' +
      '<summary><span id="vpn-license-summary-text">拠点単位ライセンス集計</span></summary>' +
      '<div class="vpn-license-body" id="vpn-license-body"></div>' +
      "</details>" +
      '<div class="vpn-table-wrap"><table class="vpn-table"><thead><tr>' +
      "<th>登録日</th><th>アカウント名</th><th>所属</th><th>VPN ID</th><th>パスワード</th><th>備考</th><th>操作</th>" +
      '</tr></thead><tbody id="vpn-tbody"></tbody></table></div>';
    host.appendChild(root);

    document.getElementById("vpn-reload").onclick = function () {
      reloadAll();
    };
    document.getElementById("vpn-create").onclick = openCreateModal;
    document.getElementById("vpn-search").oninput = function (e) {
      state.search = e.target.value;
      renderTable();
    };
    document.getElementById("vpn-search-clear").onclick = clearSearch;

    reloadAll();
  }

  kintone.events.on("app.record.index.show", function (event) {
    if (!APP_DB) {
      console.error(BUILD, "APP_DB is not set");
      return event;
    }
    setTimeout(mountUi, 0);
    return event;
  });
})();
