(function () {
  "use strict";

  /** VPNアカウント台帳 — DB REST CRUD + ライセンス集計 + 利用者印刷 + 月次前回比 + PC台帳連携 */
  var BUILD = "2026-08-16-license-count-list";
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

  var CONN_ADMIN = {
    fre: {
      domain: VPN_DOMAINS.FRE,
      key: "fre",
      head: "■ @kensetsutoso.fre",
      adminId: "bN98534",
      defaultPassword: "Honten0911",
      gwUrl: "https://gw20.flexrmt.kddi.ne.jp/kensetsutoso_fre",
    },
    ds: {
      domain: VPN_DOMAINS.DS,
      key: "ds",
      head: "■ @kensetsutoso.ds.fre（首都圏）",
      adminId: "Yk94373",
      defaultPassword: "kent25132",
      gwUrl: "https://gw24.flexrmt.kddi.ne.jp/kensetsutoso_ds_fre",
    },
    bnp: {
      domain: VPN_DOMAINS.BNP,
      key: "bnp",
      head: "■ @bnp001 (BNP)",
      adminId: "dr62761",
      defaultPassword: "kent0901",
      gwUrl: "https://gw28.flexrmt.kddi.ne.jp/bnp001",
    },
  };
  var CONN_ADMIN_LIST = [CONN_ADMIN.fre, CONN_ADMIN.ds, CONN_ADMIN.bnp];

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
    licenseDeptViewMode: "all",
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

  function formatSnapshotSavedAt(raw) {
    if (!raw) return "";
    var d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
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
    var storedDomain = val(rec, FC.vpn_domain);
    return {
      id: val(rec, "$id"),
      revision: val(rec, "$revision"),
      account_label: val(rec, FC.account_label),
      dept: val(rec, FC.dept),
      vpn_id: val(rec, FC.vpn_id),
      password: val(rec, FC.password),
      registered_date: val(rec, FC.registered_date),
      note: val(rec, FC.note),
      vpn_domain: storedDomain || inferDomainFromVpnId(val(rec, FC.vpn_id)),
      stored_vpn_domain: storedDomain,
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

  function validateManualVpnId(raw, domain, excludeRecordId) {
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
      if (excludeRecordId != null && String(r.id) === String(excludeRecordId)) return false;
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
        connAdminPassword: "",
        connAdminNote: "",
      }
    );
  }

  function isPlaceholderConnPassword(pw) {
    var s = String(pw || "").trim();
    return !s || s === "N/A";
  }

  function resolveConnAdminPassword(domain) {
    var cfg = CONN_ADMIN.fre;
    CONN_ADMIN_LIST.some(function (item) {
      if (item.domain === domain) {
        cfg = item;
        return true;
      }
      return false;
    });
    var settings = getSettings(domain);
    if (!isPlaceholderConnPassword(settings.connAdminPassword)) {
      return settings.connAdminPassword;
    }
    return cfg.defaultPassword;
  }

  function todayJstYmdSlash() {
    return todayJstYmd().replace(/-/g, "/");
  }

  function parseConnAdminUpdatedYmd(note) {
    var s = String(note || "").trim();
    if (!s) return "";
    var m = s.match(/^(\d{4})[/-](\d{1,2})(?:[/-](\d{1,2}))?$/);
    if (m) {
      return (
        m[1] +
        "/" +
        String(m[2]).padStart(2, "0") +
        "/" +
        String(m[3] || "01").padStart(2, "0")
      );
    }
    m = s.match(/\(?(\d{4})[/-](\d{1,2})(?:[/-](\d{1,2}))?\)?(?:変更|更新)?/);
    if (!m) return "";
    return (
      m[1] +
      "/" +
      String(m[2]).padStart(2, "0") +
      "/" +
      String(m[3] || "01").padStart(2, "0")
    );
  }

  function formatConnAdminUpdatedLabel(domain) {
    var settings = getSettings(domain);
    if (isPlaceholderConnPassword(settings.connAdminPassword)) return "";
    var ymd = parseConnAdminUpdatedYmd(settings.connAdminNote);
    if (!ymd) return "";
    return "(" + ymd + "更新)";
  }

  function connPasswordUpdatedStored() {
    return todayJstYmdSlash();
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
      fields: ["$id", "$revision", FC.record_kind, FC.next_user_num, FC.vpn_id, FC.vpn_domain, FC.password, FC.note],
    }).then(function (resp) {
      state.settingsByDomain = {};
      (resp.records || []).forEach(function (rec) {
        var domain = val(rec, FC.vpn_domain) || inferDomainFromVpnId(val(rec, FC.vpn_id));
        state.settingsByDomain[domain] = {
          id: val(rec, "$id"),
          revision: val(rec, "$revision"),
          nextUserNum: Number(val(rec, FC.next_user_num) || defaultNextNum(domain)),
          connAdminPassword: val(rec, FC.password),
          connAdminNote: val(rec, FC.note),
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
        renderConnInfoPanel();
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
    var currentYm = currentJstYm();
    for (var i = 0; i < state.licenseSnapshots.length; i++) {
      if (state.licenseSnapshots[i].month < currentYm) return state.licenseSnapshots[i];
    }
    return null;
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

  function licenseInconsistencies(b) {
    var emptyDept = 0;
    var unknownDept = 0;
    var unknownDomains = 0;
    state.records.forEach(function (r) {
      var dept = String(r.dept || "").trim();
      var storedDomain = String(r.stored_vpn_domain || "").trim();
      if (!dept) emptyDept += 1;
      else if (DEPT_ORDER.indexOf(dept) < 0) unknownDept += 1;
      if (storedDomain && VPN_DOMAIN_LIST.indexOf(storedDomain) < 0) {
        unknownDomains += 1;
      }
    });
    var deptSum = b.rows.reduce(function (sum, r) {
      return sum + r.count;
    }, 0);
    return {
      emptyDept: emptyDept,
      unknownDept: unknownDept,
      unknownDomains: unknownDomains,
      deptSum: deptSum,
    };
  }

  function licenseAlertHtml(info, total) {
    var items = [];
    if (info.emptyDept) {
      items.push("所属が空欄: " + info.emptyDept + "件（合計には含み、所属別行では除外）");
    }
    if (info.unknownDept) {
      items.push("所属マスター外: " + info.unknownDept + "件");
    }
    if (info.unknownDomains) {
      items.push("未登録または判定不能なドメイン: " + info.unknownDomains + "件");
    }
    if (info.deptSum < total) {
      items.push(
        "所属別口数の合計 " +
          info.deptSum +
          "口は全体 " +
          total +
          "口より少なく、差分は所属空欄によるものです。",
      );
    }
    if (!items.length) return "";
    return (
      '<div class="vpn-license-alert" role="status"><strong>確認事項（集計は続行できます）</strong><ul><li>' +
      items.map(esc).join("</li><li>") +
      "</li></ul></div>"
    );
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
        alert(
          ym +
            " の集計を確定しました。比較は当月未満の最新確定を基準にします（確定直後も自己比較しません）。",
        );
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
    var inconsistencies = licenseInconsistencies(b);
    var viewMode = state.licenseDeptViewMode || "all";

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
          licenseCountLinkHtml("domain", r.domain, r.count) +
          '</td><td class="vpn-num">' +
          esc(r.yen.toLocaleString("ja-JP")) +
          " 円</td></tr>"
        );
      })
      .join("");

    var visibleRows = cmp.rows.filter(function (r) {
      if (viewMode === "positive") return r.count > 0;
      if (viewMode === "changed") return r.diff != null && r.diff !== 0;
      return true;
    });
    var lines = visibleRows
      .map(function (r) {
        return (
          "<tr><td>" +
          esc(r.dept) +
          '</td><td class="vpn-num">' +
          licenseCountLinkHtml("dept", r.dept, r.count) +
          '</td><td class="vpn-num">' +
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
        "</strong> の確定スナップショットと、現在の稼働アカウント数を比較しています。</p>"
      : '<p class="vpn-license-note">前回確定データがありません。請求書と照合後、「' +
        esc(ym) +
        ' の集計を確定」を押してください。</p>';

    var savedAt =
      confirmedThisMonth && confirmedThisMonth.data
        ? formatSnapshotSavedAt(confirmedThisMonth.data.savedAt)
        : "";
    var monthStatusHtml =
      '<div class="vpn-license-status"><div><span class="vpn-license-status-label">対象月</span><strong>' +
      esc(ym) +
      '</strong></div><div><span class="vpn-license-status-label">状態</span><strong>' +
      (confirmedThisMonth ? "確定済" : "未確定") +
      "</strong>" +
      (savedAt ? "（保存: " + esc(savedAt) + " JST）" : "") +
      (confirmedThisMonth
        ? '<span class="vpn-license-status-soft"> 現在の内容で再確定できます（既存確定を上書き）。</span>'
        : "") +
      '</div><div><span class="vpn-license-status-label">比較対象</span><strong>' +
      (cmp.hasPrev && cmp.prevSnap ? esc(cmp.prevSnap.month) + " 前回確定" : "比較対象なし") +
      "</strong></div></div>";
    var viewModeHtml =
      '<div class="vpn-license-view-mode"><span>表示:</span>' +
      '<label><input type="radio" name="vpn-license-dept-view" value="all"' +
      (viewMode === "all" ? " checked" : "") +
      "> 全表示</label>" +
      '<label><input type="radio" name="vpn-license-dept-view" value="positive"' +
      (viewMode === "positive" ? " checked" : "") +
      "> 1口以上</label>" +
      '<label><input type="radio" name="vpn-license-dept-view" value="changed"' +
      (viewMode === "changed" ? " checked" : "") +
      "> 差分ありのみ</label></div>";

    var confirmLabel = ym + " の集計を確定";
    if (confirmedThisMonth) {
      confirmLabel += "（再確定）";
    }

    body.innerHTML =
      monthStatusHtml +
      licenseAlertHtml(inconsistencies, b.total) +
      footNote +
      '<p class="vpn-license-subhead">ドメイン別内訳</p>' +
      '<table class="vpn-license-table vpn-license-domain-table"><thead><tr><th>ドメイン</th><th>口数</th><th>金額</th></tr></thead><tbody>' +
      domainLines +
      '<tr class="vpn-license-total"><td><strong>合計</strong></td><td class="vpn-num"><strong>' +
      licenseCountLinkHtml("all", "", domainB.total) +
      '</strong></td><td class="vpn-num"><strong>' +
      esc(domainB.totalYen.toLocaleString("ja-JP")) +
      ' 円</strong></td></tr></tbody></table>' +
      '<p class="vpn-license-subhead">所属別内訳</p>' +
      viewModeHtml +
      '<table class="vpn-license-table"><thead><tr><th>所属</th><th>現在</th><th>前回確定</th><th>差分</th><th>現在金額</th><th>確定比</th></tr></thead><tbody>' +
      lines +
      '<tr class="vpn-license-total"><td><strong>合計</strong></td><td class="vpn-num"><strong>' +
      licenseCountLinkHtml("all", "", b.total) +
      '</strong></td><td class="vpn-num"><strong>' +
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
    Array.prototype.slice
      .call(body.querySelectorAll(".vpn-license-count-link"))
      .forEach(function (el) {
        el.onclick = function () {
          openLicenseCountModal(el.getAttribute("data-license-filter"), el.getAttribute("data-license-key") || "");
        };
      });
    Array.prototype.slice
      .call(body.querySelectorAll('input[name="vpn-license-dept-view"]'))
      .forEach(function (el) {
        el.onchange = function () {
          if (!el.checked) return;
          state.licenseDeptViewMode = el.value;
          renderLicensePanel();
        };
      });
  }

  function licenseCountLinkHtml(filter, key, count) {
    return (
      '<button type="button" class="vpn-license-count-link" data-license-filter="' +
      esc(filter) +
      '" data-license-key="' +
      esc(key) +
      '">' +
      esc(String(count)) +
      " 口</button>"
    );
  }

  function openLicenseCountModal(filter, key) {
    var rows = state.records.filter(function (r) {
      if (filter === "dept") return String(r.dept || "").trim() === key;
      if (filter === "domain") return r.vpn_domain === key;
      return filter === "all";
    });
    rows = sortListRows(rows);

    var title =
      filter === "dept"
        ? "所属: " + key + "（" + rows.length + "口）"
        : filter === "domain"
          ? "ドメイン: " + key + "（" + rows.length + "口）"
          : "全アカウント（" + rows.length + "口）";
    var rowsHtml = rows
      .map(function (r) {
        return (
          "<tr><td>" +
          esc(r.account_label) +
          "</td><td>" +
          esc(r.dept) +
          "</td><td>" +
          esc(r.vpn_domain) +
          "</td><td>" +
          esc(r.vpn_id) +
          "</td><td>" +
          esc(r.password) +
          "</td></tr>"
        );
      })
      .join("");
    var bodyHtml = rows.length
      ? '<div class="vpn-license-list-wrap"><table class="vpn-license-list-table"><thead><tr><th>アカウント名</th><th>所属</th><th>ドメイン</th><th>VPN ID</th><th>パスワード</th></tr></thead><tbody>' +
        rowsHtml +
        "</tbody></table></div>"
      : '<p class="vpn-license-list-empty">該当するアカウントがありません</p>';

    closeModal();
    var bg = document.createElement("div");
    bg.id = "vpn-modal-root";
    bg.className = "vpn-modal-bg";
    bg.innerHTML =
      '<div class="vpn-modal vpn-license-list-modal" role="dialog" aria-modal="true" aria-label="' +
      esc(title) +
      '"><h3>' +
      esc(title) +
      "</h3>" +
      bodyHtml +
      '<div class="vpn-modal-actions"><button type="button" class="vpn-btn-cancel">閉じる</button></div></div>';
    document.body.appendChild(bg);

    var closeBtn = bg.querySelector(".vpn-btn-cancel");
    closeBtn.onclick = closeModal;
    bg.addEventListener("click", function (e) {
      if (e.target === bg) closeModal();
    });
    bg._vpnKeydownHandler = function (e) {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", bg._vpnKeydownHandler);
    closeBtn.focus();
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

  function updateRecordCountMeta() {
    var el = document.getElementById("vpn-record-counts");
    if (!el) return;
    var filteredCount = filteredRecords().length;
    var active = !!(state.domainFilter || state.search.trim());
    el.innerHTML =
      '<span class="vpn-meta-chip" aria-label="全件数">全件 ' +
      esc(String(state.records.length)) +
      "件</span>" +
      (active
        ? '<span class="vpn-meta-chip" aria-label="表示件数">表示 ' +
          esc(String(filteredCount)) +
          "件</span>"
        : "");
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
    if (!el) return;
    if (el._vpnKeydownHandler) {
      document.removeEventListener("keydown", el._vpnKeydownHandler);
    }
    el.remove();
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
      '<label>VPN ID<input id="vpn-edit-vpn" value="' +
      esc(row.vpn_id) +
      '" autocomplete="off"></label>' +
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
      var vpnRaw = document.getElementById("vpn-edit-vpn").value.trim();
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

      var vpnErr = validateManualVpnId(vpnRaw, row.vpn_domain, row.id);
      if (vpnErr) {
        alert(vpnErr);
        return;
      }
      var vpnId =
        vpnRaw.indexOf("@") >= 0 ? vpnRaw.toLowerCase() : vpnRaw.toLowerCase() + row.vpn_domain;
      if (inferDomainFromVpnId(vpnId) !== row.vpn_domain) {
        alert("所属または指定しているドメインが違いますので確認してください");
        return;
      }

      var vpnIdChanged = vpnId.toLowerCase() !== String(row.vpn_id).toLowerCase();
      if (vpnIdChanged) {
        if (
          !window.confirm(
            "VPN ID を変更します:\n" +
              row.vpn_id +
              " → " +
              vpnId +
              "\n\n備考に履歴を追記し、PC台帳を同期します。よろしいですか？",
          )
        ) {
          return;
        }
        var historyLine =
          "[VPN ID修正] " + todayJstYmd() + " " + row.vpn_id + " → " + vpnId;
        note = note.trim();
        note = note ? note + "\n" + historyLine : historyLine;
      }

      apiPut("/k/v1/record.json", {
        app: APP_DB,
        id: row.id,
        revision: row.revision,
        record: {
          account_label: { value: label },
          dept: { value: dept },
          vpn_id: { value: vpnId },
          password: { value: password },
          registered_date: { value: regDate },
          note: { value: note },
        },
      })
        .then(function () {
          return syncVpnToPcLedger(label, vpnId, password);
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
    apiDelete("/k/v1/records.json", {
      app: APP_DB,
      ids: [Number(row.id)],
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

  var LIST_COLUMNS = [
    { key: "registered_date", label: "登録日" },
    { key: "account_label", label: "アカウント名" },
    { key: "dept", label: "所属" },
    { key: "vpn_domain", label: "ドメイン" },
    { key: "vpn_id", label: "VPN ID" },
    { key: "password", label: "パスワード" },
    { key: "note", label: "備考" },
  ];

  function listExportFilenameStamp() {
    return todayJstYmd().replace(/-/g, "");
  }

  function rowMatchesSearch(row) {
    var q = state.search.trim().toLowerCase();
    if (!q) return true;
    var hay =
      (row.account_label + " " + row.vpn_id + " " + row.dept + " " + row.note + " " + row.vpn_domain).toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function sortListRows(rows) {
    return rows.slice().sort(function (a, b) {
      var da = deptRank(a.dept) - deptRank(b.dept);
      if (da !== 0) return da;
      var la = String(a.account_label || "").localeCompare(String(b.account_label || ""), "ja");
      if (la !== 0) return la;
      return String(a.vpn_id || "").localeCompare(String(b.vpn_id || ""), "ja");
    });
  }

  function filterListRecords(selectedDepts, selectedDomains, applySearch) {
    var deptSet = {};
    selectedDepts.forEach(function (d) {
      deptSet[d] = true;
    });
    var domSet = {};
    selectedDomains.forEach(function (d) {
      domSet[d] = true;
    });
    return state.records.filter(function (r) {
      if (!deptSet[r.dept]) return false;
      if (!domSet[r.vpn_domain]) return false;
      if (applySearch && !rowMatchesSearch(r)) return false;
      return true;
    });
  }

  function readListExportSelections() {
    var deptSel = document.getElementById("vpn-list-dept");
    var depts = deptSel ? selectedMultiSelectValues(deptSel) : [];
    var modeEl = document.getElementById("vpn-list-domain-mode");
    var domainMode = modeEl ? modeEl.value : "all";
    var domains =
      domainMode === "all"
        ? VPN_DOMAIN_LIST.slice()
        : selectedMultiSelectValues(document.getElementById("vpn-list-domain"));
    var applyEl = document.getElementById("vpn-list-apply-search");
    return { depts: depts, domains: domains, applySearch: !!(applyEl && applyEl.checked), domainMode: domainMode };
  }

  function selectedMultiSelectValues(selectEl) {
    if (!selectEl) return [];
    return Array.prototype.slice.call(selectEl.selectedOptions).map(function (o) {
      return o.value;
    });
  }

  function setMultiSelectAll(selectEl, on) {
    if (!selectEl) return;
    Array.prototype.slice.call(selectEl.options).forEach(function (o) {
      o.selected = !!on;
    });
  }

  function setMultiSelectValues(selectEl, values) {
    if (!selectEl) return;
    var set = {};
    values.forEach(function (v) {
      set[v] = true;
    });
    Array.prototype.slice.call(selectEl.options).forEach(function (o) {
      o.selected = !!set[o.value];
    });
  }

  function syncListExportDomainPickUi() {
    var modeEl = document.getElementById("vpn-list-domain-mode");
    var wrap = document.getElementById("vpn-list-domain-pick-wrap");
    if (!modeEl || !wrap) return;
    wrap.style.display = modeEl.value === "pick" ? "block" : "none";
  }

  function buildListFilterSummary(depts, domains, count, applySearch) {
    var parts = ["全 " + count + " 件"];
    if (depts.length && depts.length < DEPT_ORDER.length) {
      parts.push(
        "所属=" +
          (depts.length <= 4 ? depts.join("、") : depts.slice(0, 3).join("、") + " 他" + (depts.length - 3)),
      );
    }
    if (domains.length && domains.length < VPN_DOMAIN_LIST.length) {
      parts.push(
        "ドメイン=" +
          domains
            .map(function (d) {
              return domainLabel(d);
            })
            .join("+"),
      );
    }
    if (applySearch && state.search.trim()) {
      parts.push("検索=" + state.search.trim());
    }
    return parts.join(" / ");
  }

  function exportListXlsx(rows) {
    if (typeof XLSX === "undefined" || !XLSX.utils || !XLSX.writeFile) {
      alert("Excel 出力ライブラリが読み込まれていません。ページを再読み込みしてください。");
      return;
    }
    var header = LIST_COLUMNS.map(function (c) {
      return c.label;
    });
    var matrix = [header];
    rows.forEach(function (r) {
      matrix.push(
        LIST_COLUMNS.map(function (c) {
          return r[c.key] != null ? String(r[c.key]) : "";
        }),
      );
    });
    var ws = XLSX.utils.aoa_to_sheet(matrix);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "一覧");
    XLSX.writeFile(wb, "VPNアカウント一覧_" + listExportFilenameStamp() + ".xlsx", { bookType: "xlsx" });
  }

  function listPrintStylesheet() {
    return (
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");' +
      "*{box-sizing:border-box;}" +
      'body{margin:0;padding:12px 14px;font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      ".vpnl-header{margin-bottom:10px;text-align:center;}" +
      ".vpnl-header h1{margin:0 0 6px;font-size:16pt;font-weight:700;color:#1e3a8a;}" +
      ".vpnl-meta{margin:0;font-size:10pt;color:#475569;}" +
      ".vpnl-confidential{display:none;margin:6px 0 0;font-size:10pt;font-weight:700;color:#991b1b;}" +
      ".vpnl-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10.5pt;}" +
      ".vpnl-table th,.vpnl-table td{border:1px solid #64748b;padding:6px 5px;vertical-align:top;line-height:1.45;word-break:break-word;overflow-wrap:anywhere;}" +
      ".vpnl-table th{background:#dbeafe;font-size:10pt;font-weight:700;}" +
      ".vpnl-table tr:nth-child(even) td{background:#f8fafc;}" +
      "@media print{@page{size:A4 landscape;margin:8mm;}" +
      "body{padding:0;}" +
      ".vpnl-confidential{display:block;}" +
      ".vpnl-table{font-size:10pt;}" +
      "thead{display:table-header-group;}" +
      "tr{page-break-inside:avoid;}}"
    );
  }

  function buildListPrintHtml(rows, summary) {
    var head =
      "<thead><tr>" +
      LIST_COLUMNS.map(function (c) {
        return "<th>" + esc(c.label) + "</th>";
      }).join("") +
      "</tr></thead>";
    var body =
      "<tbody>" +
      rows
        .map(function (r) {
          return (
            "<tr>" +
            LIST_COLUMNS.map(function (c) {
              var v = r[c.key] != null ? String(r[c.key]).trim() : "";
              return "<td>" + esc(v || "—") + "</td>";
            }).join("") +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>";
    return (
      '<header class="vpnl-header"><h1>VPNアカウント台帳 — 一覧（横向き）</h1>' +
      '<p class="vpnl-meta">印刷日: ' +
      esc(todayJstYmd()) +
      " / " +
      esc(summary) +
      '</p><p class="vpnl-confidential">本紙は機密性の高い内容を含みます。</p></header>' +
      '<table class="vpnl-table">' +
      head +
      body +
      "</table>"
    );
  }

  function openListPrintWindow(rows, summary) {
    var w = window.open("", "_blank");
    if (!w) {
      alert("別ウィンドウを開けませんでした。ポップアップブロックを解除してください。");
      return;
    }
    w.opener = null;
    var docHtml =
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
      "<title>VPNアカウント一覧</title><style>" +
      listPrintStylesheet() +
      "</style></head><body>" +
      buildListPrintHtml(rows, summary) +
      "</body></html>";
    var d = w.document;
    d.open();
    d.write(docHtml);
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

  function openListExportModal() {
    closeModal();
    var domainAll = !state.domainFilter;
    var deptOptions = DEPT_ORDER.map(function (d) {
      return '<option value="' + esc(d) + '" selected>' + esc(d) + "</option>";
    }).join("");
    var domainOptions = VPN_DOMAIN_LIST.map(function (d) {
      var sel =
        !domainAll && state.domainFilter === d ? " selected" : domainAll ? " selected" : "";
      return '<option value="' + esc(d) + '"' + sel + ">" + esc(d) + "</option>";
    }).join("");
    var applySearchChecked = state.search.trim() ? " checked" : "";
    var searchHint = state.search.trim() ? esc(state.search.trim()) : "なし";
    var body =
      '<p class="vpn-hint">パスワードは平文で出力されます。取り扱いに注意してください。</p>' +
      '<div class="vpn-list-section"><div class="vpn-list-section-head">所属</div>' +
      '<p class="vpn-hint vpn-list-hint">Ctrl+クリック（Mac: ⌘+クリック）で複数選択。下のボタンで一括選択もできます。</p>' +
      '<div class="vpn-list-actions">' +
      '<button type="button" id="vpn-list-dept-all" class="kintoneplugin-button-normal">全選択</button>' +
      '<button type="button" id="vpn-list-dept-none" class="kintoneplugin-button-normal">全解除</button>' +
      '<button type="button" id="vpn-list-dept-hq" class="kintoneplugin-button-normal">本社</button>' +
      '<button type="button" id="vpn-list-dept-branch" class="kintoneplugin-button-normal">支店・営業所</button>' +
      "</div>" +
      '<select id="vpn-list-dept" class="vpn-list-multi" multiple size="10">' +
      deptOptions +
      "</select></div>" +
      '<div class="vpn-list-section"><div class="vpn-list-section-head">ドメイン</div>' +
      '<label class="vpn-list-domain-mode">範囲<select id="vpn-list-domain-mode">' +
      '<option value="all"' +
      (domainAll ? " selected" : "") +
      ">すべて（3ドメイン）</option>" +
      '<option value="pick"' +
      (domainAll ? "" : " selected") +
      ">個別指定（複数可）</option>" +
      "</select></label>" +
      '<div id="vpn-list-domain-pick-wrap" class="vpn-list-domain-pick-wrap"' +
      (domainAll ? ' style="display:none"' : "") +
      ">" +
      '<p class="vpn-hint vpn-list-hint">出力するドメインを複数選択（Ctrl+クリック）</p>' +
      '<select id="vpn-list-domain" class="vpn-list-multi" multiple size="3">' +
      domainOptions +
      "</select></div></div>" +
      '<label class="vpn-list-apply"><input type="checkbox" id="vpn-list-apply-search"' +
      applySearchChecked +
      "> 現在の検索キーワードも適用（「" +
      searchHint +
      "」）</label>";

    var bg = document.createElement("div");
    bg.id = "vpn-modal-root";
    bg.className = "vpn-modal-bg";
    bg.innerHTML =
      '<div class="vpn-modal vpn-list-modal" role="dialog">' +
      "<h3>リスト出力</h3>" +
      body +
      '<div class="vpn-modal-actions">' +
      '<button type="button" id="vpn-list-cancel" class="kintoneplugin-button-normal">キャンセル</button>' +
      '<button type="button" id="vpn-list-print" class="kintoneplugin-button-normal">印刷</button>' +
      '<button type="button" id="vpn-list-xlsx" class="kintoneplugin-button-dialog-ok">Excel (.xlsx)</button>' +
      "</div></div>";
    document.body.appendChild(bg);

    var deptSel = document.getElementById("vpn-list-dept");
    var DEPT_BATCH_HQ = DEPT_ORDER.slice(0, 11);
    var DEPT_BATCH_BRANCH = DEPT_ORDER.slice(11);

    document.getElementById("vpn-list-dept-all").onclick = function () {
      setMultiSelectAll(deptSel, true);
    };
    document.getElementById("vpn-list-dept-none").onclick = function () {
      setMultiSelectAll(deptSel, false);
    };
    document.getElementById("vpn-list-dept-hq").onclick = function () {
      setMultiSelectValues(deptSel, DEPT_BATCH_HQ);
    };
    document.getElementById("vpn-list-dept-branch").onclick = function () {
      setMultiSelectValues(deptSel, DEPT_BATCH_BRANCH);
    };
    document.getElementById("vpn-list-domain-mode").onchange = syncListExportDomainPickUi;
    document.getElementById("vpn-list-cancel").onclick = closeModal;

    function runExport(kind) {
      var sel = readListExportSelections();
      if (!sel.depts.length) {
        alert("所属を1つ以上選択してください。");
        return;
      }
      if (sel.domainMode === "pick" && !sel.domains.length) {
        alert("ドメインを1つ以上選択してください。");
        return;
      }
      var rows = sortListRows(filterListRecords(sel.depts, sel.domains, sel.applySearch));
      if (!rows.length) {
        alert("条件に該当するアカウントがありません。");
        return;
      }
      var summary = buildListFilterSummary(sel.depts, sel.domains, rows.length, sel.applySearch);
      if (kind === "xlsx") {
        exportListXlsx(rows);
        closeModal();
      } else {
        openListPrintWindow(rows, summary);
        closeModal();
      }
    }
    document.getElementById("vpn-list-xlsx").onclick = function () {
      runExport("xlsx");
    };
    document.getElementById("vpn-list-print").onclick = function () {
      runExport("print");
    };
  }

  function renderTable() {
    var tbody = document.getElementById("vpn-tbody");
    if (!tbody) return;
    updateRecordCountMeta();
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
        var accountLabelHtml = String(r.account_label || "").trim()
          ? '<span class="vpn-copy" data-copy="' +
            esc(r.account_label) +
            '" title="アカウント名をコピー" aria-label="アカウント名をコピー">' +
            esc(r.account_label) +
            "</span>"
          : "";
        return (
          "<tr>" +
          "<td>" +
          esc(r.registered_date) +
          "</td>" +
          "<td>" +
          accountLabelHtml +
          "</td>" +
          "<td>" +
          esc(r.dept) +
          "</td>" +
          '<td><span class="vpn-domain-pill">' +
          esc(r.vpn_domain) +
          "</span></td>" +
          '<td><span class="vpn-copy" data-copy="' +
          esc(r.vpn_id) +
          '" title="VPN IDをコピー" aria-label="VPN IDをコピー">' +
          esc(r.vpn_id) +
          "</span></td>" +
          '<td><span class="vpn-copy" data-copy="' +
          esc(r.password) +
          '" title="パスワードをコピー" aria-label="パスワードをコピー">' +
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

  function connInfoDomainSectionHtml(item) {
    return (
      '<section class="vpn-conn-domain" data-domain="' +
      esc(item.domain) +
      '">' +
      '<p class="vpn-conn-domain-head">' +
      esc(item.head) +
      "</p>" +
      '<div class="vpn-conn-cred">' +
      '<span class="vpn-conn-id">' +
      esc(item.adminId) +
      "</span>" +
      '<label class="vpn-conn-pw-row">パスワード<input type="text" class="vpn-conn-pw-input" id="vpn-conn-pw-' +
      item.key +
      '" data-domain="' +
      esc(item.domain) +
      '" autocomplete="off"><span class="vpn-conn-note" id="vpn-conn-note-' +
      item.key +
      '"></span></label>' +
      "</div>" +
      '<p class="vpn-conn-url-label">※VPNの接続先URL</p>' +
      '<p><a href="' +
      esc(item.gwUrl) +
      '" target="_blank" rel="noopener noreferrer">' +
      esc(item.gwUrl) +
      "</a></p>" +
      "</section>"
    );
  }

  function connInfoAccordionHtml() {
    var sections = CONN_ADMIN_LIST.map(connInfoDomainSectionHtml).join('<hr class="vpn-conn-hr">');
    return (
      '<details class="vpn-license-acc vpn-conn-acc" id="vpn-conn-acc">' +
      "<summary>VPN接続情報（必要時のみ開く）</summary>" +
      '<div class="vpn-license-body vpn-conn-body">' +
      '<p class="vpn-conn-title">VPNアカウント管理画面URL</p>' +
      '<hr class="vpn-conn-hr">' +
      '<p><a href="https://radiusid.kddi.ne.jp/" target="_blank" rel="noopener noreferrer">https://radiusid.kddi.ne.jp/</a></p>' +
      '<hr class="vpn-conn-hr">' +
      sections +
      '<div class="vpn-conn-actions">' +
      '<button type="button" id="vpn-conn-save" class="kintoneplugin-button-dialog-ok">接続パスワードを保存</button>' +
      '<span class="vpn-conn-save-hint">733 設定レコードに保存され、全員共通で反映されます</span>' +
      "</div>" +
      "</div></details>"
    );
  }

  function renderConnInfoPanel() {
    CONN_ADMIN_LIST.forEach(function (item) {
      var pwEl = document.getElementById("vpn-conn-pw-" + item.key);
      var noteEl = document.getElementById("vpn-conn-note-" + item.key);
      if (pwEl) pwEl.value = resolveConnAdminPassword(item.domain);
      if (noteEl) noteEl.textContent = formatConnAdminUpdatedLabel(item.domain);
    });
  }

  function saveConnAdminPasswords() {
    var updates = [];
    for (var i = 0; i < CONN_ADMIN_LIST.length; i++) {
      var item = CONN_ADMIN_LIST[i];
      var pwEl = document.getElementById("vpn-conn-pw-" + item.key);
      if (!pwEl) continue;
      var newPw = String(pwEl.value || "").trim();
      if (!newPw) {
        alert(item.head + " のパスワードを入力してください。");
        return;
      }
      var settings = getSettings(item.domain);
      if (!settings.id) {
        alert("設定レコードがありません（" + item.domain + "）。管理者に連絡してください。");
        return;
      }
      var prevPw = resolveConnAdminPassword(item.domain);
      if (newPw === prevPw) continue;
      updates.push({
        item: item,
        settings: settings,
        password: newPw,
        note: connPasswordUpdatedStored(),
      });
    }
    if (!updates.length) {
      alert("変更はありません。");
      return;
    }
    var btn = document.getElementById("vpn-conn-save");
    if (btn) btn.disabled = true;
    var chain = Promise.resolve();
    updates.forEach(function (u) {
      chain = chain.then(function () {
        return apiPut("/k/v1/record.json", {
          app: APP_DB,
          id: u.settings.id,
          revision: u.settings.revision,
          record: {
            password: { value: u.password },
            note: { value: u.note },
          },
        }).then(function (resp) {
          state.settingsByDomain[u.item.domain] = Object.assign({}, getSettings(u.item.domain), {
            connAdminPassword: u.password,
            connAdminNote: u.note,
            revision: String(resp.revision || ""),
          });
        });
      });
    });
    chain
      .then(function () {
        renderConnInfoPanel();
        alert("接続パスワードを保存しました。");
      })
      .catch(function (e) {
        alert("保存失敗: " + (e.message || e));
      })
      .then(function () {
        if (btn) btn.disabled = false;
      });
  }

  function injectCss() {
    if (document.getElementById("vpn-dash-css")) return;
    var st = document.createElement("style");
    st.id = "vpn-dash-css";
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia,.gaia-argoui-app-index-pager{display:none!important;}" +
      ".vpn-root{font-family:Segoe UI,Meiryo,sans-serif;font-size:15px;padding:8px 12px 24px;}" +
      ".vpn-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch;margin-bottom:12px;}" +
      ".vpn-toolbar-group{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0;padding:6px 10px 8px;border:1px solid #cbd5e1;border-radius:7px;min-width:0;}" +
      ".vpn-toolbar-group legend{padding:0 5px;font-size:12px;font-weight:700;color:#475569;}" +
      ".vpn-toolbar-group label{display:flex;align-items:center;gap:6px;white-space:nowrap;}" +
      ".vpn-toolbar button,.vpn-toolbar input,.vpn-toolbar select{height:36px;box-sizing:border-box;}" +
      ".vpn-toolbar input[type=search]{min-width:280px;padding:7px 10px;font-size:15px;}" +
      ".vpn-toolbar select{padding:6px 8px;font-size:15px;}" +
      ".vpn-search-clear{white-space:nowrap;}" +
      ".vpn-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:12px;padding:14px 18px;background:#ecfdf5;border:1px solid #86efac;border-radius:8px;}" +
      ".vpn-next-id{display:flex;flex:1 1 620px;flex-wrap:wrap;gap:10px 18px;align-items:center;}" +
      ".vpn-record-counts{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}" +
      ".vpn-meta-chip{display:inline-flex;align-items:center;min-height:28px;padding:3px 10px;border:1px solid #86efac;border-radius:999px;background:#fff;color:#166534;font-size:13px;font-weight:700;cursor:default;user-select:text;}" +
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
      ".vpn-license-status{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 10px;padding:10px 12px;border:1px solid #bfdbfe;border-radius:7px;background:#eff6ff;color:#1e3a8a;font-size:13px;}" +
      ".vpn-license-status-label{margin-right:6px;color:#64748b;font-weight:600;}" +
      ".vpn-license-status-soft{color:#475569;}" +
      ".vpn-license-alert{margin:0 0 10px;padding:9px 12px;border:1px solid #fbbf24;border-radius:7px;background:#fffbeb;color:#92400e;font-size:13px;line-height:1.5;}" +
      ".vpn-license-alert ul{margin:4px 0 0;padding-left:20px;}" +
      ".vpn-license-subhead{font-size:14px;font-weight:700;color:#334155;margin:14px 0 8px;}" +
      ".vpn-license-view-mode{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin:0 0 8px;font-size:13px;color:#475569;}" +
      ".vpn-license-view-mode label{white-space:nowrap;cursor:pointer;}" +
      ".vpn-license-domain-table{max-width:640px;margin-bottom:4px;}" +
      ".vpn-domain-tag{font-size:12px;color:#64748b;font-weight:400;}" +
      ".vpn-license-count-link{appearance:none;border:0;background:none;padding:0;color:#0369a1;font:inherit;font-weight:700;cursor:pointer;}" +
      ".vpn-license-count-link:hover,.vpn-license-count-link:focus{text-decoration:underline;}" +
      ".vpn-license-actions{margin-top:12px;}" +
      ".vpn-license-actions button{height:auto;min-height:0;padding:8px 14px;}" +
      ".vpn-conn-body{font-size:17px;line-height:1.65;}" +
      ".vpn-conn-title{font-size:20px;font-weight:700;margin:0 0 10px;color:#0f172a;}" +
      ".vpn-conn-hr{border:none;border-top:1px dashed #cbd5e1;margin:14px 0;}" +
      ".vpn-conn-domain{margin-bottom:6px;}" +
      ".vpn-conn-domain-head{font-weight:700;margin:0 0 8px;font-size:17px;color:#334155;}" +
      ".vpn-conn-cred{font-family:Consolas,Monaco,monospace;font-size:16px;margin:0 0 8px;line-height:1.6;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;}" +
      ".vpn-conn-id{font-weight:600;font-size:17px;}" +
      ".vpn-conn-pw-row{font-family:Segoe UI,Meiryo,sans-serif;font-size:15px;color:#334155;display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0;}" +
      ".vpn-conn-pw-input{font-family:Consolas,Monaco,monospace;font-size:16px;padding:6px 10px;min-width:180px;border:1px solid #cbd5e1;border-radius:4px;}" +
      ".vpn-conn-actions{margin-top:16px;display:flex;flex-wrap:wrap;align-items:center;gap:10px;}" +
      ".vpn-conn-save-hint{font-size:13px;color:#64748b;}" +
      ".vpn-conn-note{font-family:Segoe UI,Meiryo,sans-serif;font-size:14px;color:#64748b;font-weight:400;white-space:nowrap;}" +
      ".vpn-conn-url-label{font-size:15px;color:#475569;margin:10px 0 6px;}" +
      ".vpn-conn-body a{color:#0369a1;word-break:break-all;font-size:17px;}" +
      ".vpn-diff-up{color:#15803d;font-weight:700;}" +
      ".vpn-diff-down{color:#b91c1c;font-weight:700;}" +
      ".vpn-diff-zero{color:#64748b;}" +
      ".vpn-diff-none{color:#94a3b8;}" +
      ".vpn-num{text-align:right;font-variant-numeric:tabular-nums;}" +
      ".vpn-table-wrap{overflow:auto;max-height:calc(100vh - 360px);border:1px solid #cbd5e1;border-radius:6px;}" +
      ".vpn-table{border-collapse:separate;border-spacing:0;width:100%;font-size:15px;min-width:1180px;}" +
      ".vpn-table th,.vpn-table td{border:0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:6px 8px;vertical-align:middle;line-height:1.45;}" +
      ".vpn-table th:last-child,.vpn-table td:last-child{border-right:0;}" +
      ".vpn-table tbody tr:last-child td{border-bottom:0;}" +
      ".vpn-table th{background:#f1f5f9;position:sticky;top:0;z-index:1;font-size:14px;box-shadow:0 2px 4px rgba(15,23,42,.16);}" +
      ".vpn-copy{cursor:pointer;font-family:Consolas,Monaco,monospace;font-size:14px;}" +
      ".vpn-copy:hover{text-decoration:underline;color:#0369a1;}" +
      ".vpn-domain-pill{display:inline-block;padding:2px 8px;border:1px solid #bfdbfe;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:13px;white-space:nowrap;}" +
      ".vpn-note{max-width:220px;white-space:pre-wrap;font-size:13px;color:#475569;}" +
      ".vpn-actions button{height:36px;box-sizing:border-box;margin:0 3px;padding:4px 10px;font-size:14px;}" +
      ".vpn-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;}" +
      ".vpn-modal{background:#fff;border-radius:8px;padding:18px 20px;max-width:560px;width:92%;max-height:90vh;overflow:auto;font-size:15px;}" +
      ".vpn-modal h3{margin:0 0 14px;font-size:18px;}" +
      ".vpn-modal label{display:block;margin:10px 0;font-size:15px;}" +
      ".vpn-modal input,.vpn-modal select,.vpn-modal textarea{width:100%;box-sizing:border-box;padding:8px;font-size:15px;margin-top:4px;}" +
      ".vpn-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}" +
      ".vpn-license-list-modal{max-width:1100px;}" +
      ".vpn-license-list-wrap{overflow:auto;max-height:65vh;border:1px solid #cbd5e1;border-radius:6px;}" +
      ".vpn-license-list-table{border-collapse:collapse;width:100%;min-width:860px;font-size:14px;}" +
      ".vpn-license-list-table th,.vpn-license-list-table td{border-bottom:1px solid #e2e8f0;padding:7px 10px;text-align:left;white-space:nowrap;}" +
      ".vpn-license-list-table th{position:sticky;top:0;background:#f1f5f9;z-index:1;}" +
      ".vpn-license-list-table tbody tr:last-child td{border-bottom:0;}" +
      ".vpn-license-list-table td:nth-child(4),.vpn-license-list-table td:nth-child(5){font-family:Consolas,Monaco,monospace;}" +
      ".vpn-license-list-empty{margin:18px 0;color:#64748b;}" +
      ".vpn-hint{font-size:13px;color:#64748b;margin:4px 0;}" +
      ".vpn-label-row{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;}" +
      ".vpn-label-row label{flex:1;min-width:220px;}" +
      ".vpn-create-595-step{margin:8px 0 14px;}" +
      ".vpn-create-595-btn{font-size:15px;padding:10px 18px;}" +
      ".vpn-595-results{margin-top:10px;max-height:240px;overflow:auto;display:flex;flex-direction:column;gap:6px;}" +
      ".vpn-595-pick{text-align:left;white-space:normal;}" +
      ".vpn-595-actions{display:flex;gap:8px;margin:8px 0;}" +
      ".vpn-warn{font-size:13px;color:#b45309;}" +
      ".vpn-list-modal{max-width:640px;}" +
      ".vpn-list-section{margin:12px 0;}" +
      ".vpn-list-section-head{font-size:14px;font-weight:700;color:#334155;margin-bottom:6px;}" +
      ".vpn-list-hint{margin:0 0 6px!important;}" +
      ".vpn-list-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;}" +
      ".vpn-list-multi{width:100%;box-sizing:border-box;font-size:14px;padding:4px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;}" +
      ".vpn-list-multi option{padding:2px 6px;}" +
      ".vpn-list-domain-mode{display:block;margin-bottom:8px;font-size:14px;}" +
      ".vpn-list-domain-mode select{margin-left:8px;padding:6px 8px;font-size:14px;min-width:220px;}" +
      ".vpn-list-domain-pick-wrap{margin-top:4px;}" +
      ".vpn-list-apply{display:block;margin-top:12px;font-size:14px;}";
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
      '<fieldset class="vpn-toolbar-group"><legend>登録</legend>' +
      '<button type="button" id="vpn-reload" class="kintoneplugin-button-normal">再読み込み</button>' +
      '<button type="button" id="vpn-create" class="kintoneplugin-button-dialog-ok">新規作成</button>' +
      "</fieldset>" +
      '<fieldset class="vpn-toolbar-group"><legend>検索・絞込</legend>' +
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
      "</fieldset>" +
      '<fieldset class="vpn-toolbar-group"><legend>出力</legend>' +
      '<button type="button" id="vpn-list-export" class="kintoneplugin-button-normal">リスト出力</button>' +
      "</fieldset>" +
      "</div>" +
      '<div class="vpn-meta"><div class="vpn-next-id" id="vpn-next-id"></div><div class="vpn-record-counts" id="vpn-record-counts" aria-live="polite"></div></div>' +
      connInfoAccordionHtml() +
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
    document.getElementById("vpn-list-export").onclick = openListExportModal;
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
    document.getElementById("vpn-conn-save").onclick = saveConnAdminPasswords;

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
