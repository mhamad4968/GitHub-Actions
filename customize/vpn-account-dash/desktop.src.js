(function () {
  "use strict";

  /** VPNアカウント台帳 — DB REST CRUD + ライセンス集計 + 利用者印刷 + 月次前回比 + PC台帳連携 */
  var BUILD = "2026-06-20-vpn-595-search-primary";
  var APP_DB = 733;
  var APP_EMP_MASTER = 595;
  var APP_PC_LEDGER = 674;
  var FC674_USER_NAME = "user_name";
  var FC674_PC_NAME = "pc_name";
  var PC674_TYPE_PERSONAL = "個人";
  var PC674_STATUS_STORAGE = "保管";
  var PC674_STATUS_DISPOSED = "廃棄";
  var FC674_VPN_ID = "vpn_id";
  var FC674_VPN_PW = "vpn_pw";

  var VPN_DOMAINS = {
    FRE: "@kensetsutoso.fre",
    DS: "@kensetsutoso.ds.fre",
    BNP: "@bnp001",
  };
  var VPN_DOMAIN_LIST = [VPN_DOMAINS.FRE, VPN_DOMAINS.DS, VPN_DOMAINS.BNP];
  var DEPT_CAPITAL = "首都圏支店";
  var DEPT_BNP = "BNP";
  var NEXT_START = { fre: 80, ds: 36, bnp: 1 };
  var RECORD_KIND_SETTING = "設定";
  var RECORD_KIND_LICENSE_SNAPSHOT = "月次集計";
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
    "首都圏支店",
    "鉄構支店",
    "湾岸工事所",
    "BNP",
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
    vpn_domain: "vpn_domain",
    snapshot_month: "snapshot_month",
    snapshot_json: "snapshot_json",
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
    FC.vpn_domain,
  ];

  var state = {
    records: [],
    settingsByDomain: {},
    licenseSnapshots: [],
    search: "",
    domainFilter: "",
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

  function currentJstYm() {
    return todayJstYmd().slice(0, 7);
  }

  function formatDiffCount(n) {
    if (n == null) return "—";
    if (n > 0) return "+" + n;
    if (n < 0) return String(n);
    return "±0";
  }

  function formatDiffYen(n) {
    if (n == null) return "—";
    var sign = n > 0 ? "+" : n < 0 ? "" : "±";
    if (n === 0) return "±0 円";
    return sign + n.toLocaleString("ja-JP") + " 円";
  }

  function diffClass(n) {
    if (n == null) return "vpn-diff-none";
    if (n > 0) return "vpn-diff-up";
    if (n < 0) return "vpn-diff-down";
    return "vpn-diff-zero";
  }

  function parseSnapshotPayload(raw) {
    if (!raw) return null;
    try {
      var j = JSON.parse(String(raw));
      if (!j || typeof j !== "object") return null;
      return j;
    } catch (e) {
      return null;
    }
  }

  function snapshotVpnIdForMonth(ym) {
    return "__license_snapshot_" + String(ym).replace(/-/g, "") + "__all";
  }

  function domainForDept(dept) {
    var d = String(dept || "").trim();
    if (d === DEPT_CAPITAL) return VPN_DOMAINS.DS;
    if (d === DEPT_BNP) return VPN_DOMAINS.BNP;
    return VPN_DOMAINS.FRE;
  }

  function inferDomainFromVpnId(vpnId) {
    var s = String(vpnId || "").trim().toLowerCase();
    if (s.indexOf("@kensetsutoso.ds.fre") >= 0) return VPN_DOMAINS.DS;
    if (s.indexOf("@bnp001") >= 0) return VPN_DOMAINS.BNP;
    return VPN_DOMAINS.FRE;
  }

  function domainLabel(domain) {
    if (domain === VPN_DOMAINS.DS) return "ds.fre";
    if (domain === VPN_DOMAINS.BNP) return "bnp001";
    return "fre";
  }

  function defaultNextNum(domain) {
    if (domain === VPN_DOMAINS.DS) return NEXT_START.ds;
    if (domain === VPN_DOMAINS.BNP) return NEXT_START.bnp;
    return NEXT_START.fre;
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
      vpn_domain: val(rec, FC.vpn_domain) || inferDomainFromVpnId(val(rec, FC.vpn_id)),
    };
  }

  function genPassword() {
    var n = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
    return "jbis" + n;
  }

  function formatUserVpnId(num, domain) {
    var d = domain || VPN_DOMAINS.FRE;
    var n = Number(num);
    if (d === VPN_DOMAINS.FRE) {
      return "user" + String(n).padStart(3, "0") + d;
    }
    var local = n >= 1 && n <= 9 ? String(n).padStart(2, "0") : String(n);
    return "user" + local + d;
  }

  function validateManualVpnId(raw, domain) {
    var d = domain || VPN_DOMAINS.FRE;
    var s = String(raw || "").trim().toLowerCase();
    if (!s) return "VPN ID を入力してください";
    if (s.indexOf("@") < 0) s = s + d;
    if (d === VPN_DOMAINS.FRE && !/^[a-z0-9]{3,20}@kensetsutoso\.fre$/.test(s)) {
      return "形式が不正です（例: akita001@kensetsutoso.fre）";
    }
    if (d === VPN_DOMAINS.DS && !/^[a-z0-9]{3,20}@kensetsutoso\.ds\.fre$/.test(s)) {
      return "形式が不正です（例: user36@kensetsutoso.ds.fre）";
    }
    if (d === VPN_DOMAINS.BNP && !/^[a-z0-9]{3,20}@bnp001$/.test(s)) {
      return "形式が不正です（例: onishi@bnp001）";
    }
    var dup = state.records.some(function (r) {
      return String(r.vpn_id).toLowerCase() === s;
    });
    if (dup) return "この VPN ID は既に登録されています";
    return "";
  }

  function validateDeptDomain(dept, domain) {
    return domainForDept(dept) === domain;
  }

  function getSettings(domain) {
    return (
      state.settingsByDomain[domain] || {
        id: "",
        revision: "",
        nextUserNum: defaultNextNum(domain),
      }
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

  function escapeQueryValue(s) {
    return String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
  }

  function normalizeUserNameForMatch(s) {
    return String(s || "")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .trim()
      .replace(/\u3000/g, " ")
      .replace(/\s+/g, " ")
      .normalize("NFKC");
  }

  function map595DeptToVpnDept(deptName) {
    var d = String(deptName || "").trim();
    return DEPT_ORDER.indexOf(d) >= 0 ? d : "";
  }

  function resolveVpnDeptFrom595(empRow) {
    var fromDept = map595DeptToVpnDept(val(empRow, "dept_name"));
    if (fromDept) return fromDept;
    return map595DeptToVpnDept(val(empRow, "group_name"));
  }

  function setCreateDeptLocked(locked) {
    var deptEl = document.getElementById("vpn-create-dept");
    if (!deptEl) return;
    deptEl.disabled = !!locked;
  }

  function setCreate595Picked(picked) {
    var el = document.getElementById("vpn-create-595-picked");
    if (el) el.value = picked ? "1" : "";
  }

  function isCreate595Picked() {
    var el = document.getElementById("vpn-create-595-picked");
    return el && el.value === "1";
  }

  function searchEmployees595(keyword, limit) {
    var k = String(keyword || "").trim();
    if (!k) return Promise.resolve([]);
    var lim = Math.min(Math.max(Number(limit) || 12, 1), 25);
    var q =
      'user_name like "' +
      escapeQueryValue(k) +
      '" and employment_status not in ("退職") order by user_name asc limit ' +
      lim;
    return apiGet("/k/v1/records.json", {
      app: APP_EMP_MASTER,
      query: q,
      fields: ["user_name", "dept_name", "group_name", "employment_status"],
    }).then(function (resp) {
      return resp.records || [];
    });
  }

  function fetch674PersonalPcsByUserName(userName) {
    var raw = String(userName || "").trim();
    if (!raw) return Promise.resolve([]);
    var q =
      'user_name = "' +
      escapeQueryValue(raw) +
      '" and account_type in ("' +
      PC674_TYPE_PERSONAL +
      '") and pc_status not in ("' +
      PC674_STATUS_STORAGE +
      '", "' +
      PC674_STATUS_DISPOSED +
      '") order by $id asc limit 100';
    return apiGet("/k/v1/records.json", {
      app: APP_PC_LEDGER,
      query: q,
      fields: ["$id", "$revision", FC674_USER_NAME, FC674_PC_NAME, FC674_VPN_ID, FC674_VPN_PW],
    }).then(function (resp) {
      return resp.records || [];
    });
  }

  function syncVpnToPcLedger(accountLabel, vpnId, vpnPw) {
    return fetch674PersonalPcsByUserName(accountLabel).then(function (rows) {
      if (!rows.length) {
        return { updated: 0, pcNames: [], notFound: true, error: "" };
      }
      var records = rows.map(function (rec) {
        return {
          id: val(rec, "$id"),
          revision: val(rec, "$revision"),
          record: {
            vpn_id: { value: vpnId },
            vpn_pw: { value: vpnPw },
          },
        };
      });
      return apiPut("/k/v1/records.json", {
        app: APP_PC_LEDGER,
        records: records,
      }).then(function () {
        return {
          updated: rows.length,
          pcNames: rows.map(function (r) {
            return val(r, FC674_PC_NAME);
          }),
          notFound: false,
          error: "",
        };
      });
    }).catch(function (e) {
      return {
        updated: 0,
        pcNames: [],
        notFound: false,
        error: e.message || String(e),
      };
    });
  }

  function clearVpnFromPcLedger(accountLabel) {
    return fetch674PersonalPcsByUserName(accountLabel).then(function (rows) {
      if (!rows.length) {
        return { cleared: 0, pcNames: [], notFound: true, error: "" };
      }
      var records = rows.map(function (rec) {
        return {
          id: val(rec, "$id"),
          revision: val(rec, "$revision"),
          record: {
            vpn_id: { value: "" },
            vpn_pw: { value: "" },
          },
        };
      });
      return apiPut("/k/v1/records.json", {
        app: APP_PC_LEDGER,
        records: records,
      }).then(function () {
        return {
          cleared: rows.length,
          pcNames: rows.map(function (r) {
            return val(r, FC674_PC_NAME);
          }),
          notFound: false,
          error: "",
        };
      });
    }).catch(function (e) {
      return {
        cleared: 0,
        pcNames: [],
        notFound: false,
        error: e.message || String(e),
      };
    });
  }

  function formatPcSyncResultMessage(prefix, syncRes, accountLabel) {
    var lines = [prefix];
    if (syncRes.error) {
      lines.push("PC台帳への反映に失敗しました: " + syncRes.error);
      lines.push("VPN台帳の登録は完了しています。PC台帳を確認してください。");
      return lines.join("\n");
    }
    if (syncRes.notFound) {
      lines.push(
        "PC台帳: 利用者名「" +
          accountLabel +
          "」に一致する個人PC（利用中）が見つかりませんでした。",
      );
      lines.push("（PC未登録・保管/廃棄・共有アカウント・名前不一致のいずれか）");
      return lines.join("\n");
    }
    var n = syncRes.updated != null ? syncRes.updated : syncRes.cleared;
    var verb = syncRes.cleared != null ? "クリア" : "反映";
    lines.push("PC台帳 " + n + " 件に VPN 情報を" + verb + "しました。");
    if (syncRes.pcNames && syncRes.pcNames.length) {
      lines.push("対象PC: " + syncRes.pcNames.join("、"));
    }
    return lines.join("\n");
  }

  function open595SearchModal(onPick) {
    var existing = document.getElementById("vpn-595-modal-root");
    if (existing) existing.remove();
    var bg = document.createElement("div");
    bg.id = "vpn-595-modal-root";
    bg.className = "vpn-modal-bg";
    bg.style.zIndex = "10001";
    bg.innerHTML =
      '<div class="vpn-modal" role="dialog">' +
      "<h3>社員名検索（595）</h3>" +
      '<p class="vpn-hint">在籍社員を選ぶと <strong>アカウント名</strong> と <strong>所属</strong> が自動入力されます（PC台帳連携用）。</p>' +
      '<label>検索<input type="search" id="vpn-595-q" placeholder="氏名の一部"></label>' +
      '<div class="vpn-595-actions"><button type="button" id="vpn-595-run" class="kintoneplugin-button-normal">検索</button>' +
      '<button type="button" id="vpn-595-cancel" class="kintoneplugin-button-normal">キャンセル</button></div>' +
      '<div id="vpn-595-results" class="vpn-595-results"></div></div>';
    document.body.appendChild(bg);

    function renderResults(rows) {
      var box = document.getElementById("vpn-595-results");
      if (!box) return;
      if (!rows.length) {
        box.innerHTML = '<p class="vpn-hint">該当なし</p>';
        return;
      }
      box.innerHTML = rows
        .map(function (r, i) {
          var un = val(r, "user_name");
          var dept = val(r, "dept_name");
          var grp = val(r, "group_name");
          return (
            '<button type="button" class="vpn-595-pick kintoneplugin-button-normal" data-i="' +
            i +
            '">' +
            esc(un) +
            (dept ? " — " + esc(dept) : "") +
            (grp ? " / " + esc(grp) : "") +
            "</button>"
          );
        })
        .join("");
      box.querySelectorAll(".vpn-595-pick").forEach(function (btn) {
        btn.onclick = function () {
          var idx = Number(btn.getAttribute("data-i"));
          if (rows[idx]) {
            onPick(rows[idx]);
            bg.remove();
          }
        };
      });
    }

    function runSearch() {
      var kw = document.getElementById("vpn-595-q").value.trim();
      if (!kw) return;
      searchEmployees595(kw, 25).then(renderResults).catch(function (e) {
        alert("595 検索失敗: " + (e.message || e));
      });
    }

    bg.querySelector("#vpn-595-run").onclick = runSearch;
    bg.querySelector("#vpn-595-cancel").onclick = function () {
      bg.remove();
    };
    bg.querySelector("#vpn-595-q").onkeydown = function (e) {
      if (e.key === "Enter") runSearch();
    };
    bg.addEventListener("click", function (e) {
      if (e.target === bg) bg.remove();
    });
    setTimeout(function () {
      var q = document.getElementById("vpn-595-q");
      if (q) q.focus();
    }, 50);
  }

  function apply595PickToCreateForm(empRow) {
    var labelEl = document.getElementById("vpn-create-label");
    var deptEl = document.getElementById("vpn-create-dept");
    var domainEl = document.getElementById("vpn-create-domain");
    var deptWarn = document.getElementById("vpn-create-dept-warn");
    if (!labelEl) return;
    var un = val(empRow, "user_name");
    labelEl.value = un;
    setCreate595Picked(true);
    var dept595Raw = val(empRow, "dept_name");
    var dept = resolveVpnDeptFrom595(empRow);
    if (dept && deptEl) {
      deptEl.value = dept;
      setCreateDeptLocked(true);
      if (deptWarn) deptWarn.textContent = "";
      if (domainEl) {
        var domain = domainForDept(dept);
        domainEl.value = domain;
        var st = getSettings(domain);
        var prev = document.getElementById("vpn-create-preview");
        if (prev) {
          prev.textContent = formatUserVpnId(st.nextUserNum || defaultNextNum(domain), domain);
        }
      }
    } else {
      setCreateDeptLocked(false);
      if (deptWarn) {
        deptWarn.textContent =
          "595の所属「" +
          (dept595Raw || val(empRow, "group_name") || "—") +
          "」はVPN所属リストにありません。所属を手動で選んでください。";
      }
    }
    document.getElementById("vpn-create-label-warn").textContent = "";
  }

  function setCreateLabelManualMode(manual) {
    var labelEl = document.getElementById("vpn-create-label");
    var btn = document.getElementById("vpn-create-595-search");
    var hint = document.getElementById("vpn-create-manual-label-hint");
    if (!labelEl) return;
    labelEl.readOnly = !manual;
    if (btn) btn.style.display = manual ? "none" : "inline-block";
    setCreateDeptLocked(!manual && isCreate595Picked());
    if (!manual) {
      labelEl.value = "";
      setCreate595Picked(false);
      var deptEl = document.getElementById("vpn-create-dept");
      if (deptEl) deptEl.value = "";
      var deptWarn = document.getElementById("vpn-create-dept-warn");
      if (deptWarn) deptWarn.textContent = "";
    } else {
      setCreateDeptLocked(false);
    }
    if (hint) {
      hint.textContent = manual
        ? "手動入力: PC台帳連携は名前が 674 の利用者名と完全一致している必要があります。"
        : "「社員名検索」で利用者を選ぶと、アカウント名と所属が自動入力されます。";
    }
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
      query: 'record_kind in ("' + RECORD_KIND_SETTING + '") limit 10',
      fields: ["$id", "$revision", FC.record_kind, FC.next_user_num, FC.vpn_id, FC.vpn_domain],
    }).then(function (resp) {
      state.settingsByDomain = {};
      (resp.records || []).forEach(function (rec) {
        var domain = val(rec, FC.vpn_domain) || inferDomainFromVpnId(val(rec, FC.vpn_id));
        state.settingsByDomain[domain] = {
          id: val(rec, "$id"),
          revision: val(rec, "$revision"),
          nextUserNum: Number(val(rec, FC.next_user_num) || defaultNextNum(domain)),
        };
      });
    });
  }

  function fetchLicenseSnapshots() {
    return apiGet("/k/v1/records.json", {
      app: APP_DB,
      query:
        'record_kind in ("' +
        RECORD_KIND_LICENSE_SNAPSHOT +
        '") order by snapshot_month desc limit 100',
      fields: ["$id", "$revision", FC.record_kind, FC.snapshot_month, FC.snapshot_json],
    }).then(function (resp) {
      state.licenseSnapshots = (resp.records || [])
        .map(function (rec) {
          return {
            id: val(rec, "$id"),
            revision: val(rec, "$revision"),
            month: val(rec, FC.snapshot_month),
            data: parseSnapshotPayload(val(rec, FC.snapshot_json)),
          };
        })
        .filter(function (s) {
          return /^\d{4}-\d{2}$/.test(s.month);
        })
        .sort(function (a, b) {
          return a.month < b.month ? 1 : a.month > b.month ? -1 : 0;
        });
    });
  }

  function fetchAccounts() {
    return fetchPaged(
      'record_kind not in ("' +
        RECORD_KIND_SETTING +
        '", "' +
        RECORD_KIND_LICENSE_SNAPSHOT +
        '") order by registered_date desc',
    ).then(function (rows) {
      state.records = rows.map(flatten);
    });
  }

  function reloadAll() {
    state.loading = true;
    renderTable();
    return fetchSettings()
      .then(fetchLicenseSnapshots)
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

  function licenseBreakdownByDomain() {
    var counts = {};
    VPN_DOMAIN_LIST.forEach(function (domain) {
      counts[domain] = 0;
    });
    state.records.forEach(function (r) {
      var dom = r.vpn_domain || inferDomainFromVpnId(r.vpn_id);
      counts[dom] = (counts[dom] || 0) + 1;
    });
    var rows = VPN_DOMAIN_LIST.map(function (domain) {
      var count = counts[domain] || 0;
      return {
        domain: domain,
        label: domainLabel(domain),
        count: count,
        yen: count * LICENSE_UNIT,
      };
    });
    var total = state.records.length;
    return { total: total, totalYen: total * LICENSE_UNIT, rows: rows };
  }

  function latestSnapshotForCompare() {
    if (!state.licenseSnapshots.length) return null;
    return state.licenseSnapshots[0];
  }

  function snapshotForMonth(ym) {
    return state.licenseSnapshots.find(function (s) {
      return s.month === ym;
    });
  }

  function buildComparisonRows(current) {
    var prevSnap = latestSnapshotForCompare();
    var prevCounts = {};
    var prevTotal = null;
    if (prevSnap && prevSnap.data) {
      prevTotal = Number(prevSnap.data.total);
      if (isNaN(prevTotal)) prevTotal = null;
      (prevSnap.data.rows || []).forEach(function (r) {
        prevCounts[r.dept] = Number(r.count) || 0;
      });
    }
    var hasPrev = !!prevSnap;
    var rows = current.rows.map(function (r) {
      var prev = hasPrev ? prevCounts[r.dept] || 0 : null;
      var diff = hasPrev ? r.count - prev : null;
      return {
        dept: r.dept,
        count: r.count,
        yen: r.yen,
        prev: prev,
        diff: diff,
        prevYen: hasPrev ? prev * LICENSE_UNIT : null,
        diffYen: hasPrev ? diff * LICENSE_UNIT : null,
      };
    });
    var totalDiff = hasPrev && prevTotal != null ? current.total - prevTotal : null;
    return {
      rows: rows,
      hasPrev: hasPrev,
      prevSnap: prevSnap,
      prevTotal: prevTotal,
      prevTotalYen: hasPrev && prevTotal != null ? prevTotal * LICENSE_UNIT : null,
      totalDiff: totalDiff,
      totalDiffYen: totalDiff != null ? totalDiff * LICENSE_UNIT : null,
    };
  }

  function confirmLicenseSnapshot() {
    var ym = currentJstYm();
    var b = licenseBreakdown();
    var existing = snapshotForMonth(ym);
    var msg =
      "対象月: " +
      ym +
      "\n合計: " +
      b.total +
      " 口 / " +
      b.totalYen.toLocaleString("ja-JP") +
      " 円\n\n" +
      (existing
        ? "この月は既に確定済みです。現在の集計で上書きします。"
        : "請求書照合後、この月の集計を確定します。") +
      "\n\nよろしいですか？";
    if (!window.confirm(msg)) return;

    var payload = {
      total: b.total,
      totalYen: b.totalYen,
      rows: b.rows.map(function (r) {
        return { dept: r.dept, count: r.count };
      }),
      savedAt: new Date().toISOString(),
      build: BUILD,
    };
    var rec = {
      record_kind: { value: RECORD_KIND_LICENSE_SNAPSHOT },
      snapshot_month: { value: ym },
      snapshot_json: { value: JSON.stringify(payload) },
      account_label: { value: "（月次集計 " + ym + "）" },
      dept: { value: "システム推進室" },
      vpn_id: { value: snapshotVpnIdForMonth(ym) },
      password: { value: "N/A" },
      registered_date: { value: todayJstYmd() },
      note: { value: "734 ライセンス集計確定" },
    };

    var chain;
    if (existing && existing.id) {
      chain = apiPut("/k/v1/record.json", {
        app: APP_DB,
        id: existing.id,
        revision: existing.revision,
        record: {
          snapshot_json: rec.snapshot_json,
          registered_date: rec.registered_date,
          note: rec.note,
        },
      });
    } else {
      chain = apiPost("/k/v1/record.json", { app: APP_DB, record: rec });
    }

    chain
      .then(function () {
        alert(ym + " の集計を確定しました。来月以降、前回確定分との比較に使われます。");
        return reloadAll();
      })
      .catch(function (e) {
        alert("確定の保存に失敗しました: " + (e.message || e));
      });
  }

  function renderLicensePanel() {
    var body = document.getElementById("vpn-license-body");
    var sum = document.getElementById("vpn-license-summary-text");
    if (!body) return;
    var b = licenseBreakdown();
    var domainB = licenseBreakdownByDomain();
    var cmp = buildComparisonRows(b);
    var ym = currentJstYm();
    var confirmedThisMonth = snapshotForMonth(ym);

    if (sum) {
      var sumText =
        "拠点単位ライセンス集計（" +
        LICENSE_UNIT +
        " 円/口） — 現在 " +
        b.total +
        " 口 / " +
        b.totalYen.toLocaleString("ja-JP") +
        " 円";
      if (cmp.hasPrev && cmp.prevSnap) {
        sumText +=
          "（前回確定 " +
          cmp.prevSnap.month +
          ": " +
          (cmp.prevTotal != null ? cmp.prevTotal + " 口" : "—") +
          " / 差分 " +
          formatDiffCount(cmp.totalDiff) +
          " 口 / " +
          formatDiffYen(cmp.totalDiffYen) +
          "）";
      } else {
        sumText += "（前回確定データなし — 確定後、次回から比較できます）";
      }
      sum.textContent = sumText;
    }

    var domainLines = domainB.rows
      .map(function (r) {
        return (
          "<tr><td>" +
          esc(r.domain) +
          " <span class=\"vpn-domain-tag\">(" +
          esc(r.label) +
          ')</span></td><td class="vpn-num">' +
          esc(String(r.count)) +
          ' 口</td><td class="vpn-num">' +
          esc(r.yen.toLocaleString("ja-JP")) +
          " 円</td></tr>"
        );
      })
      .join("");

    var lines = cmp.rows
      .map(function (r) {
        return (
          "<tr><td>" +
          esc(r.dept) +
          '</td><td class="vpn-num">' +
          esc(String(r.count)) +
          ' 口</td><td class="vpn-num">' +
          (r.prev == null ? "—" : esc(String(r.prev)) + " 口") +
          '</td><td class="vpn-num ' +
          diffClass(r.diff) +
          '">' +
          esc(formatDiffCount(r.diff)) +
          '</td><td class="vpn-num">' +
          esc(r.yen.toLocaleString("ja-JP")) +
          ' 円</td><td class="vpn-num ' +
          diffClass(r.diffYen) +
          '">' +
          esc(formatDiffYen(r.diffYen)) +
          "</td></tr>"
        );
      })
      .join("");

    var footNote = cmp.hasPrev
      ? '<p class="vpn-license-note">前回確定: <strong>' +
        esc(cmp.prevSnap.month) +
        "</strong> のスナップショットと、現在の稼働アカウント数を比較しています。</p>"
      : '<p class="vpn-license-note">前回確定データがありません。請求書と照合後、「' +
        esc(ym) +
        ' の集計を確定」を押してください。</p>';

    var confirmLabel = ym + " の集計を確定";
    if (confirmedThisMonth) {
      confirmLabel += "（再確定）";
    }

    body.innerHTML =
      footNote +
      '<p class="vpn-license-subhead">ドメイン別内訳</p>' +
      '<table class="vpn-license-table vpn-license-domain-table"><thead><tr><th>ドメイン</th><th>口数</th><th>金額</th></tr></thead><tbody>' +
      domainLines +
      '<tr class="vpn-license-total"><td><strong>合計</strong></td><td class="vpn-num"><strong>' +
      esc(String(domainB.total)) +
      ' 口</strong></td><td class="vpn-num"><strong>' +
      esc(domainB.totalYen.toLocaleString("ja-JP")) +
      ' 円</strong></td></tr></tbody></table>' +
      '<p class="vpn-license-subhead">所属別内訳</p>' +
      '<table class="vpn-license-table"><thead><tr><th>所属</th><th>現在</th><th>前回確定</th><th>差分</th><th>現在金額</th><th>前月比</th></tr></thead><tbody>' +
      lines +
      '<tr class="vpn-license-total"><td><strong>合計</strong></td><td class="vpn-num"><strong>' +
      esc(String(b.total)) +
      ' 口</strong></td><td class="vpn-num"><strong>' +
      (cmp.prevTotal == null ? "—" : esc(String(cmp.prevTotal)) + " 口") +
      '</strong></td><td class="vpn-num ' +
      diffClass(cmp.totalDiff) +
      '"><strong>' +
      esc(formatDiffCount(cmp.totalDiff)) +
      '</strong></td><td class="vpn-num"><strong>' +
      esc(b.totalYen.toLocaleString("ja-JP")) +
      ' 円</strong></td><td class="vpn-num ' +
      diffClass(cmp.totalDiffYen) +
      '"><strong>' +
      esc(formatDiffYen(cmp.totalDiffYen)) +
      '</strong></td></tr></tbody></table>' +
      '<div class="vpn-license-actions"><button type="button" id="vpn-license-confirm" class="kintoneplugin-button-dialog-ok">' +
      esc(confirmLabel) +
      "</button></div>";

    var btn = document.getElementById("vpn-license-confirm");
    if (btn) btn.onclick = confirmLicenseSnapshot;
  }

  function updateNextIdBanner() {
    var el = document.getElementById("vpn-next-id");
    if (!el) return;
    var filter = state.domainFilter;
    if (!filter) {
      el.innerHTML = VPN_DOMAIN_LIST.map(function (domain) {
        var st = getSettings(domain);
        var nextId = formatUserVpnId(st.nextUserNum || defaultNextNum(domain), domain);
        return (
          '<div class="vpn-next-row"><span class="vpn-next-label">' +
          esc(domainLabel(domain)) +
          ' 次の VPN ID</span><span class="vpn-next-val">' +
          esc(nextId) +
          "</span></div>"
        );
      }).join("");
      return;
    }
    var st = getSettings(filter);
    var nextId = formatUserVpnId(st.nextUserNum || defaultNextNum(filter), filter);
    el.innerHTML =
      '<span class="vpn-next-label">' +
      esc(domainLabel(filter)) +
      ' 次の VPN ID</span><span class="vpn-next-val">' +
      esc(nextId) +
      "</span>";
  }

  function filteredRecords() {
    var q = state.search.trim().toLowerCase();
    var df = state.domainFilter;
    return state.records.filter(function (r) {
      if (df && r.vpn_domain !== df) return false;
      if (!q) return true;
      var hay =
        (r.account_label + " " + r.vpn_id + " " + r.dept + " " + r.note + " " + r.vpn_domain).toLowerCase();
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
    var initialDomain = state.domainFilter || VPN_DOMAINS.FRE;
    var initialSettings = getSettings(initialDomain);
    var body =
      '<input type="hidden" id="vpn-create-595-picked" value="">' +
      '<label><input type="checkbox" id="vpn-create-manual-label"> 手動入力（共有アカウント等）</label>' +
      '<p id="vpn-create-manual-label-hint" class="vpn-hint">「社員名検索」で利用者を選ぶと、アカウント名と所属が自動入力されます。</p>' +
      '<div class="vpn-create-595-step">' +
      '<button type="button" id="vpn-create-595-search" class="kintoneplugin-button-dialog-ok vpn-create-595-btn">社員名検索</button>' +
      "</div>" +
      '<label>アカウント名（社員名）<input id="vpn-create-label" readonly autocomplete="off" placeholder="社員名検索で自動入力"></label>' +
      '<div id="vpn-create-label-warn" class="vpn-warn"></div>' +
      '<label>所属<select id="vpn-create-dept">' +
      deptOptionsHtml("") +
      '</select></label>' +
      '<div id="vpn-create-dept-warn" class="vpn-warn"></div>' +
      '<label>VPNドメイン<input id="vpn-create-domain" value="' +
      esc(initialDomain) +
      '" readonly></label>' +
      '<div id="vpn-create-domain-warn" class="vpn-warn"></div>' +
      '<label><input type="checkbox" id="vpn-create-manual"> IDを手動で指定</label>' +
      '<label id="vpn-create-vpn-wrap" style="display:none">VPN ID<input id="vpn-create-vpn" autocomplete="off"></label>' +
      '<div id="vpn-create-vpn-warn" class="vpn-warn"></div>' +
      '<p class="vpn-hint">自動採番時: <span id="vpn-create-preview">' +
      esc(formatUserVpnId(initialSettings.nextUserNum || defaultNextNum(initialDomain), initialDomain)) +
      "</span></p>" +
      '<label>パスワード（自動）<input id="vpn-create-pw" value="' +
      esc(pw) +
      '" readonly></label>' +
      '<p class="vpn-hint">登録日: ' +
      esc(todayJstYmd()) +
      "（自動）</p>";

    openModal("新規作成", body, function () {
      var manualLabel = document.getElementById("vpn-create-manual-label").checked;
      var label = document.getElementById("vpn-create-label").value.trim();
      var dept = document.getElementById("vpn-create-dept").value;
      var domain = document.getElementById("vpn-create-domain").value;
      var manual = document.getElementById("vpn-create-manual").checked;
      var vpnRaw = document.getElementById("vpn-create-vpn").value.trim();
      var password = document.getElementById("vpn-create-pw").value.trim();

      if (!manualLabel && !isCreate595Picked()) {
        alert("先に「社員名検索」で利用者を選択してください。");
        return;
      }
      if (!label) {
        alert("アカウント名を入力してください（社員名検索で自動入力）");
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
      if (!validateDeptDomain(dept, domain)) {
        document.getElementById("vpn-create-domain-warn").textContent =
          "所属または指定しているドメインが違いますので確認してください";
        return;
      }
      document.getElementById("vpn-create-domain-warn").textContent = "";

      var settings = getSettings(domain);
      var vpnId = "";
      var useCounter = false;
      if (manual) {
        var err = validateManualVpnId(vpnRaw, domain);
        if (err) {
          document.getElementById("vpn-create-vpn-warn").textContent = err;
          return;
        }
        vpnId =
          vpnRaw.indexOf("@") >= 0 ? vpnRaw.toLowerCase() : vpnRaw.toLowerCase() + domain;
        if (inferDomainFromVpnId(vpnId) !== domain) {
          document.getElementById("vpn-create-vpn-warn").textContent =
            "所属または指定しているドメインが違いますので確認してください";
          return;
        }
      } else {
        if (!settings.id) {
          alert("設定レコードがありません（" + domain + "）。管理者に連絡してください。");
          return;
        }
        vpnId = formatUserVpnId(settings.nextUserNum || defaultNextNum(domain), domain);
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
        vpn_domain: { value: domain },
        password: { value: password },
        registered_date: { value: todayJstYmd() },
      };

      var chain = apiPost("/k/v1/record.json", { app: APP_DB, record: rec });
      if (useCounter) {
        var nextNum = Number(settings.nextUserNum || defaultNextNum(domain)) + 1;
        chain = chain.then(function () {
          return apiPut("/k/v1/record.json", {
            app: APP_DB,
            id: settings.id,
            revision: settings.revision,
            record: { next_user_num: { value: String(nextNum) } },
          });
        });
      }

      chain
        .then(function () {
          return syncVpnToPcLedger(label, vpnId, password);
        })
        .then(function (syncRes) {
          closeModal();
          alert(formatPcSyncResultMessage("VPN アカウントを作成しました。", syncRes, label));
          return reloadAll();
        })
        .catch(function (e) {
          alert("作成失敗: " + (e.message || e));
        });
    });

    document.getElementById("vpn-create-manual-label").onchange = function () {
      setCreateLabelManualMode(this.checked);
    };
    document.getElementById("vpn-create-595-search").onclick = function () {
      open595SearchModal(apply595PickToCreateForm);
    };
    setCreateDeptLocked(false);
    setTimeout(function () {
      if (
        document.getElementById("vpn-create-manual-label") &&
        !document.getElementById("vpn-create-manual-label").checked
      ) {
        open595SearchModal(apply595PickToCreateForm);
      }
    }, 150);
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
    document.getElementById("vpn-create-dept").onchange = function () {
      var dept = this.value;
      var domain = domainForDept(dept);
      document.getElementById("vpn-create-domain").value = domain;
      var st = getSettings(domain);
      document.getElementById("vpn-create-preview").textContent = formatUserVpnId(
        st.nextUserNum || defaultNextNum(domain),
        domain,
      );
      document.getElementById("vpn-create-domain-warn").textContent = "";
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
      if (!validateDeptDomain(dept, row.vpn_domain)) {
        alert("所属または指定しているドメインが違いますので確認してください");
        return;
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
          return syncVpnToPcLedger(label, row.vpn_id, password);
        })
        .then(function (syncRes) {
          closeModal();
          alert(formatPcSyncResultMessage("保存しました。", syncRes, label));
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
        return clearVpnFromPcLedger(row.account_label);
      })
      .then(function (syncRes) {
        alert(formatPcSyncResultMessage("VPN アカウントを削除しました。", syncRes, row.account_label));
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
      tbody.innerHTML = '<tr><td colspan="8">読込中…</td></tr>';
      return;
    }
    var rows = filteredRecords();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8">該当なし</td></tr>';
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
          "<td>" +
          esc(r.vpn_domain) +
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
      ".vpn-next-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;width:100%;}" +
      ".vpn-next-label{font-size:15px;color:#166534;font-weight:700;}" +
      ".vpn-next-val{font-size:1.65rem;font-weight:700;font-family:Consolas,Monaco,monospace;color:#14532d;margin-left:8px;}" +
      ".vpn-license-acc{margin-bottom:14px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;}" +
      ".vpn-license-acc>summary{cursor:pointer;padding:12px 16px;font-size:15px;font-weight:600;color:#334155;user-select:none;list-style:none;}" +
      ".vpn-license-acc>summary::-webkit-details-marker{display:none;}" +
      ".vpn-license-acc>summary::before{content:'▶ ';font-size:12px;color:#64748b;}" +
      ".vpn-license-acc[open]>summary::before{content:'▼ ';}" +
      ".vpn-license-acc[open]>summary{border-bottom:1px solid #e2e8f0;}" +
      ".vpn-license-body{padding:12px 16px 14px;}" +
      ".vpn-license-table{border-collapse:collapse;width:100%;max-width:960px;font-size:14px;}" +
      ".vpn-license-table th,.vpn-license-table td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;}" +
      ".vpn-license-table th{background:#f1f5f9;}" +
      ".vpn-license-total td{background:#f8fafc;}" +
      ".vpn-license-note{font-size:13px;color:#475569;margin:0 0 10px;line-height:1.5;}" +
      ".vpn-license-subhead{font-size:14px;font-weight:700;color:#334155;margin:14px 0 8px;}" +
      ".vpn-license-domain-table{max-width:640px;margin-bottom:4px;}" +
      ".vpn-domain-tag{font-size:12px;color:#64748b;font-weight:400;}" +
      ".vpn-license-actions{margin-top:12px;}" +
      ".vpn-diff-up{color:#15803d;font-weight:700;}" +
      ".vpn-diff-down{color:#b91c1c;font-weight:700;}" +
      ".vpn-diff-zero{color:#64748b;}" +
      ".vpn-diff-none{color:#94a3b8;}" +
      ".vpn-num{text-align:right;font-variant-numeric:tabular-nums;}" +
      ".vpn-table-wrap{overflow:auto;max-height:calc(100vh - 360px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".vpn-table{border-collapse:collapse;width:100%;font-size:15px;min-width:1180px;}" +
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
      ".vpn-label-row{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;}" +
      ".vpn-label-row label{flex:1;min-width:220px;}" +
      ".vpn-create-595-step{margin:8px 0 14px;}" +
      ".vpn-create-595-btn{font-size:15px;padding:10px 18px;}" +
      ".vpn-595-results{margin-top:10px;max-height:240px;overflow:auto;display:flex;flex-direction:column;gap:6px;}" +
      ".vpn-595-pick{text-align:left;white-space:normal;}" +
      ".vpn-595-actions{display:flex;gap:8px;margin:8px 0;}" +
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
      '<label class="vpn-filter-label">ドメイン<select id="vpn-domain-filter">' +
      '<option value="">すべて</option>' +
      '<option value="' +
      esc(VPN_DOMAINS.FRE) +
      '">@kensetsutoso.fre</option>' +
      '<option value="' +
      esc(VPN_DOMAINS.DS) +
      '">@kensetsutoso.ds.fre</option>' +
      '<option value="' +
      esc(VPN_DOMAINS.BNP) +
      '">@bnp001</option>' +
      "</select></label>" +
      '<input type="search" id="vpn-search" placeholder="アカウント名 / VPN ID / 所属 / 備考">' +
      '<button type="button" id="vpn-search-clear" class="kintoneplugin-button-normal vpn-search-clear">クリア</button>' +
      "</div>" +
      '<div class="vpn-meta" id="vpn-next-id"></div>' +
      '<details class="vpn-license-acc" id="vpn-license-acc">' +
      '<summary><span id="vpn-license-summary-text">拠点単位ライセンス集計</span></summary>' +
      '<div class="vpn-license-body" id="vpn-license-body"></div>' +
      "</details>" +
      '<div class="vpn-table-wrap"><table class="vpn-table"><thead><tr>' +
      "<th>登録日</th><th>アカウント名</th><th>所属</th><th>ドメイン</th><th>VPN ID</th><th>パスワード</th><th>備考</th><th>操作</th>" +
      '</tr></thead><tbody id="vpn-tbody"></tbody></table></div>';
    host.appendChild(root);

    document.getElementById("vpn-reload").onclick = function () {
      reloadAll();
    };
    document.getElementById("vpn-create").onclick = openCreateModal;
    document.getElementById("vpn-domain-filter").onchange = function (e) {
      state.domainFilter = e.target.value;
      updateNextIdBanner();
      renderTable();
    };
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
