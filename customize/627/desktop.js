/**
 * アプリ627（アカウント管理台帳）新規: 595 + **626 アカウント採番**から自動入力。
 * 626 が取得できない／権限がないと、パスワード・logon・windows_name などが空のままになる。
 * 本番: https://jbis-kintone.cybozu.com/k/626/
 */
(function () {
  "use strict";

  var APP595 = "595";
  /** アカウント採番（プール）。627の実体の多くはここ起点 */
  var APP626 = "626";
  /** 626 の M365 パスワード（半角大文字 M・sync595.js と同一） */
  var F626_M365_PW = "M365_pw";
  /** 626 割当済み印（sync595 の SYNC595_626_USED_VALUE 既定と一致） */
  var USED626 = "〇";
  var POOL_QUERY626 =
    'mail = "" and used_count not in ("' +
    USED626 +
    '") order by レコード番号 asc limit 1';
  /** 627.m365_id 用（sync の M365_DOMAIN_SUFFIX 既定） */
  var M365_SUFFIX = "@kensetsutoso01.onmicrosoft.com";

  var pending595Id = null;
  var pending626Id = null;
  /** true のとき保存成功後に 626 に mail / used_count を書く（プール行を取った場合） */
  var pending626NeedsPoolMark = false;
  var pendingMail626 = "";
  /** 二重登録リダイレクト後に詳細で表示するフラグ（URL は #record= になりクエリが落ちることがある） */
  var STORAGE_KEY_627_DUP = "jbis627_dup_notice_v1";

  function escQuery(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function localPart(mail) {
    if (!mail) return "";
    var i = mail.indexOf("@");
    return i > 0 ? mail.slice(0, i) : mail;
  }

  /** sync595 / jbis-account-state と同趣旨（ブラウザ用・ラベルは 有効／退職 固定） */
  function deriveAccountStateFrom595(r595) {
    var active = "有効";
    var retired = "退職";
    var emp = (r595.employment_status && r595.employment_status.value) || "";
    emp = String(emp).trim();
    var rd =
      (r595.retired_date && r595.retired_date.value != null
        ? String(r595.retired_date.value)
        : "") || "";
    rd = String(rd).trim();
    var employmentRetired = emp.indexOf("退職") !== -1;
    return employmentRetired || rd !== "" ? retired : active;
  }

  /**
   * 594 の「アカウント登録」やブックマーク用。mail のみ必須（他キーは無視可）。
   * 例: #jbis_prefill_mail=a%40b.com
   */
  function parsePrefillFromHash() {
    var raw = location.hash ? location.hash.replace(/^#/, "") : "";
    if (!raw) {
      return null;
    }
    var mail = null;
    try {
      var params = new URLSearchParams(raw);
      mail = params.get("jbis_prefill_mail");
    } catch (_e1) {
      /* IE等: 手動フォールバック */
    }
    if (mail == null || mail === "") {
      var map = {};
      raw.split("&").forEach(function (part) {
        var eq = part.indexOf("=");
        if (eq < 0) {
          return;
        }
        var key = part.slice(0, eq);
        var val = part.slice(eq + 1);
        try {
          map[key] = decodeURIComponent(val.replace(/\+/g, " "));
        } catch (_e) {
          map[key] = val;
        }
      });
      mail = map.jbis_prefill_mail || null;
    }
    if (!mail) {
      return null;
    }
    return { jbis_prefill_mail: mail };
  }

  function isMobileEvent(event) {
    return (
      event &&
      event.type &&
      String(event.type).indexOf("mobile.") === 0
    );
  }

  /** get() の戻りを set() に渡す（event 直渡しは未対応環境で UI に乗らないことがある） */
  function getFormHolder(isMobile) {
    if (
      isMobile &&
      kintone.mobile &&
      kintone.mobile.app &&
      kintone.mobile.app.record
    ) {
      return kintone.mobile.app.record.get();
    }
    if (kintone.app && kintone.app.record) {
      return kintone.app.record.get();
    }
    return null;
  }

  function setFormHolder(isMobile, holder) {
    if (!holder) {
      return;
    }
    try {
      if (
        isMobile &&
        kintone.mobile &&
        kintone.mobile.app &&
        kintone.mobile.app.record
      ) {
        kintone.mobile.app.record.set(holder);
      } else if (kintone.app && kintone.app.record) {
        kintone.app.record.set(holder);
      }
    } catch (e) {
      console.warn("[jbis 627] record.set", e);
    }
  }

  /**
   * 595/626 で埋めた値をフォームに反映。
   * - event.record だけでなく kintone.app.record.get() の record を更新し set する
   * - 新 UI では get/set のペアが無いと入力欄に表示されないことがある
   */
  function flushPrefillToCreateForm(event, bundle595, bundle626) {
    var mobile = isMobileEvent(event);
    var holder = getFormHolder(mobile);
    if (!holder || !holder.record) {
      apply627From595626(event.record, bundle595, bundle626);
      console.warn("[jbis 627] record.get() 不可。event.record のみ更新しました。");
      return;
    }
    apply627From595626(holder.record, bundle595, bundle626);
    /* event と holder が別オブジェクトのとき submit 用に両方そろえる */
    if (holder.record !== event.record) {
      apply627From595626(event.record, bundle595, bundle626);
    }
    setFormHolder(mobile, holder);
  }

  function clearHashFromUrl() {
    var path = location.pathname + location.search;
    if (location.hash) {
      history.replaceState(null, "", path);
    }
  }

  function setRec(rec, code, value) {
    if (value === undefined || value === null) {
      value = "";
    }
    if (!rec[code] || !("value" in rec[code])) {
      if (rec && !rec[code]) {
        console.warn(
          "[jbis 627] 627のフォームにフィールドがありません（フィールドコード確認）:",
          code
        );
      }
      return;
    }
    rec[code].value = value;
  }

  /** 同一 mail の 627 が既にあるか（重複登録防止） */
  function fetchExisting627ByMail(mail) {
    var q = 'mail = "' + escQuery(mail) + '" limit 1';
    return kintone.api(kintone.api.url("/k/v1/records.json", true), "GET", {
      app: kintone.app.getId(),
      query: q,
      fields: ["$id", "mail"]
    });
  }

  function fetch595ByMail(mail) {
    var q = 'mail = "' + escQuery(mail) + '" limit 1';
    return kintone.api(kintone.api.url("/k/v1/records.json", true), "GET", {
      app: APP595,
      query: q,
      fields: [
        "$id",
        "mail",
        "user_name",
        "dept_name",
        "group_name",
        "employment_status",
        "retired_date",
        "remarks"
      ]
    });
  }

  function fetch626Fields() {
    return [
      "$id",
      "mail",
      "logon_name",
      "logon_pw",
      "gb_pw",
      "mail_pw",
      F626_M365_PW
    ];
  }

  /** まず mail 紐付け済み626、なければプール1件（sync595 と同趣旨） */
  function fetch626ForMail(mail) {
    var qLinked = 'mail = "' + escQuery(mail) + '" limit 1';
    var url = kintone.api.url("/k/v1/records.json", true);
    var fields = fetch626Fields();
    return kintone.api(url, "GET", {
      app: APP626,
      query: qLinked,
      fields: fields
    }).then(function (resp) {
      if (resp.records && resp.records[0]) {
        return { row: resp.records[0], fromPool: false };
      }
      return kintone.api(url, "GET", {
        app: APP626,
        query: POOL_QUERY626,
        fields: fields
      }).then(function (resp2) {
        if (resp2.records && resp2.records[0]) {
          return { row: resp2.records[0], fromPool: true };
        }
        return { row: null, fromPool: false };
      });
    });
  }

  /** sync595 build627Record と同じ対応（627 フォームに存在するフィールドのみ反映） */
  function apply627From595626(rec, r595, r626) {
    var mail = r595.mail && r595.mail.value;
    if (!mail) {
      return;
    }
    var lp = localPart(mail);
    var logonName = (r626.logon_name && r626.logon_name.value) || "";
    var m365pw = (r626[F626_M365_PW] && r626[F626_M365_PW].value) || "";

    setRec(rec, "mail", mail);
    setRec(rec, "user_name", (r595.user_name && r595.user_name.value) || "");
    setRec(rec, "group_name", (r595.group_name && r595.group_name.value) || "");
    setRec(rec, "dept_name", (r595.dept_name && r595.dept_name.value) || "");
    setRec(
      rec,
      "employment_status",
      (r595.employment_status && r595.employment_status.value) || ""
    );
    setRec(rec, "account_state", deriveAccountStateFrom595(r595));
    setRec(rec, "remarks", (r595.remarks && r595.remarks.value) || "");
    setRec(rec, "logon_name", logonName);
    setRec(rec, "logon_pw", (r626.logon_pw && r626.logon_pw.value) || "");
    setRec(rec, "gb_pw", (r626.gb_pw && r626.gb_pw.value) || "");
    setRec(rec, "mail_pw", (r626.mail_pw && r626.mail_pw.value) || "");
    setRec(rec, "m365_pw", m365pw);
    setRec(rec, "gb_id", lp);
    setRec(rec, "mail_acct", lp);
    setRec(rec, "m365_id", lp + M365_SUFFIX);
    setRec(rec, "windows_name", logonName ? logonName + "+" + lp : lp);
  }

  function onCreateShowWithPrefill(event) {
    var pre = parsePrefillFromHash();
    if (!pre || !pre.jbis_prefill_mail) {
      return event;
    }

    var mail = String(pre.jbis_prefill_mail).trim();
    if (!mail) {
      return event;
    }

    return fetchExisting627ByMail(mail).then(function (respExisting) {
      if (respExisting.records && respExisting.records[0]) {
        var rid = respExisting.records[0].$id.value;
        var appId = kintone.app.getId();
        try {
          sessionStorage.setItem(STORAGE_KEY_627_DUP, "1");
        } catch (_stor) {
          /* Private モード等 */
        }
        clearHashFromUrl();
        /* kintone は詳細が #record= 形式のことが多い。クエリ jbis_dup はSPAで消えるため使わない */
        location.href =
          location.origin +
          "/k/" +
          appId +
          "/show#record=" +
          encodeURIComponent(String(rid));
        return event;
      }
      return fetch595ByMail(mail)
        .then(function (resp595) {
          var r595 = resp595.records && resp595.records[0];
          if (!r595) {
            throw new Error("595_NOT_FOUND");
          }
          var m = (r595.mail && r595.mail.value) || "";
          if (!m || !String(m).trim()) {
            throw new Error("595_MAIL_EMPTY");
          }
          return fetch626ForMail(m).then(function (pair626) {
            return { r595: r595, r626: pair626.row, fromPool: pair626.fromPool };
          });
        })
        .then(function (bundle) {
          if (!bundle.r626) {
            throw new Error("626_NOT_FOUND");
          }
          pending595Id = bundle.r595.$id.value;
          pending626Id = bundle.r626.$id.value;
          pendingMail626 = (bundle.r595.mail && bundle.r595.mail.value) || "";
          var m626 = bundle.r626.mail && bundle.r626.mail.value;
          pending626NeedsPoolMark =
            bundle.fromPool === true ||
            !m626 ||
            String(m626).trim() === "";

          flushPrefillToCreateForm(event, bundle.r595, bundle.r626);
          clearHashFromUrl();
          return event;
        });
    })
      .catch(function (e) {
        var code = e && e.message ? e.message : "";
        if (code === "595_NOT_FOUND") {
          alert(
            "社員マスタ(595)に該当メールがありません。595 にメール登録後にお試しください。"
          );
        } else if (code === "595_MAIL_EMPTY") {
          alert("社員マスタ(595)のメールが空です。");
        } else if (code === "626_NOT_FOUND") {
          alert(
            "アカウント採番（626）からレコードを取得できませんでした。\n" +
              "・626 に「未使用」プール（mail 空・used_count が〇以外）があるか\n" +
              "・この画面を保存するユーザーに 626 の参照権限があるか\n" +
              "を確認してください。\n" +
              "626: https://jbis-kintone.cybozu.com/k/626/"
          );
        } else {
          console.error("[jbis 627 create.show]", e);
          alert(
            "595/626 の取得に失敗しました。アプリ権限・ネットワークを確認してください。"
          );
        }
        clearHashFromUrl();
        pending595Id = null;
        pending626Id = null;
        pending626NeedsPoolMark = false;
        pendingMail626 = "";
        return event;
      });
  }

  /** 手入力新規でも同一 mail の二重登録をブロック */
  function onCreateSubmitDuplicateCheck(event) {
    var mail =
      event.record &&
      event.record.mail &&
      event.record.mail.value != null
        ? String(event.record.mail.value).trim()
        : "";
    if (!mail) {
      return event;
    }
    var q = 'mail = "' + escQuery(mail) + '" limit 1';
    return kintone
      .api(kintone.api.url("/k/v1/records.json", true), "GET", {
        app: kintone.app.getId(),
        query: q,
        fields: ["$id"]
      })
      .then(function (resp) {
        if (resp.records && resp.records[0]) {
          var msg = "すでにアカウントはあります。二重登録はできません。";
          event.error = msg;
          event.errors = event.errors || {};
          event.errors.mail = msg;
        }
        return event;
      });
  }

  kintone.events.on("app.record.create.submit", onCreateSubmitDuplicateCheck);
  if (typeof kintone.mobile !== "undefined") {
    kintone.events.on(
      "mobile.app.record.create.submit",
      onCreateSubmitDuplicateCheck
    );
  }

  /** 二重登録ガードの案内を画面上に出す（alert 単体は kintone / ブラウザで無音になりやすい） */
  function showDuplicateAccountNoticeBanner() {
    var msg =
      "すでにアカウントはあります。同じメールで二重登録はできません。";
    function inject() {
      if (document.getElementById("jbis627-dup-banner")) {
        return true;
      }
      var host =
        (kintone.app &&
          kintone.app.record &&
          kintone.app.record.getHeaderMenuSpaceElement &&
          kintone.app.record.getHeaderMenuSpaceElement()) ||
        document.querySelector(".gaia-argoui-app-toolbar") ||
        document.querySelector(".ocean-ui-app-index-head") ||
        document.body;
      if (!host) {
        return false;
      }
      var el = document.createElement("div");
      el.id = "jbis627-dup-banner";
      el.setAttribute("role", "alert");
      el.setAttribute("tabindex", "0");
      el.style.cssText =
        "margin:8px 12px;padding:14px 18px;background:#fff3cd;border:2px solid #856404;border-radius:6px;color:#533f03;font-size:14px;font-weight:bold;line-height:1.5;box-shadow:0 2px 6px rgba(0,0,0,.12);position:relative;z-index:99999;";
      el.textContent = msg;
      host.insertBefore(el, host.firstChild);
      return true;
    }
    if (!inject()) {
      setTimeout(inject, 200);
      setTimeout(inject, 600);
      setTimeout(inject, 1500);
    }
    setTimeout(function () {
      try {
        window.alert(msg);
      } catch (_a) {
        /* noop */
      }
    }, 500);
  }

  function onDetailShowDupNotice(event) {
    var show = false;
    try {
      if (sessionStorage.getItem(STORAGE_KEY_627_DUP) === "1") {
        sessionStorage.removeItem(STORAGE_KEY_627_DUP);
        show = true;
      }
    } catch (_e) {
      /* noop */
    }
    if (!show) {
      try {
        var qs = new URLSearchParams(window.location.search || "");
        if (qs.get("jbis_dup") === "1") {
          show = true;
          var u = new URL(window.location.href);
          u.searchParams.delete("jbis_dup");
          history.replaceState(
            null,
            "",
            u.pathname + u.search + window.location.hash
          );
        }
      } catch (_e2) {
        /* noop */
      }
    }
    if (show) {
      showDuplicateAccountNoticeBanner();
    }
    return event;
  }

  kintone.events.on("app.record.detail.show", onDetailShowDupNotice);
  if (typeof kintone.mobile !== "undefined") {
    kintone.events.on("mobile.app.record.detail.show", onDetailShowDupNotice);
  }

  kintone.events.on("app.record.create.show", onCreateShowWithPrefill);
  if (typeof kintone.mobile !== "undefined") {
    kintone.events.on("mobile.app.record.create.show", onCreateShowWithPrefill);
  }

  function onCreateSubmitSuccess(event) {
    var rid627 =
      event.recordId != null && event.recordId !== ""
        ? event.recordId
        : event.record &&
          event.record.$id &&
          event.record.$id.value;
    var p595 = pending595Id;
    var p626 = pending626Id;
    var mark626 = pending626NeedsPoolMark;
    var mail626 = pendingMail626;

    pending595Id = null;
    pending626Id = null;
    pending626NeedsPoolMark = false;
    pendingMail626 = "";

    if (!p595 || !p626 || !rid627) {
      return event;
    }

    var url = kintone.api.url("/k/v1/record.json", true);
    var reqs = [];

    reqs.push(
      kintone.api(url, "PUT", {
        app: APP595,
        id: p595,
        record: {
          ledger_record_id: { value: String(rid627) }
        }
      })
    );

    if (mark626 && mail626) {
      reqs.push(
        kintone.api(url, "PUT", {
          app: APP626,
          id: p626,
          record: {
            mail: { value: mail626 },
            used_count: { value: USED626 }
          }
        })
      );
    }

    return kintone.Promise.all(reqs)
      .then(function () {
        return event;
      })
      .catch(function (e) {
        console.error("[jbis 627 submit.success 595/626]", e);
        alert(
          "627 は保存されましたが、595 または 626 の連携更新に失敗しました。レコード番号 " +
            rid627 +
            " と 595/626 を確認してください。"
        );
        return event;
      });
  }

  kintone.events.on("app.record.create.submit.success", onCreateSubmitSuccess);
  if (typeof kintone.mobile !== "undefined") {
    kintone.events.on(
      "mobile.app.record.create.submit.success",
      onCreateSubmitSuccess
    );
  }

  /**
   * 一覧画面のビュー切替・フィルタ周りの見た目を整理（標準UIの class に依存）。
   * 627 専用 JS のため head に注入すれば他アプリへは影響しない。
   */
  function ensure627IndexFilterPolish() {
    if (document.getElementById("jbis-627-index-filter-polish")) {
      return;
    }
    var st = document.createElement("style");
    st.id = "jbis-627-index-filter-polish";
    st.textContent = [
      "/* JBIS: アカウント管理台帳(627) 一覧・フィルタまわり */",
      ".gaia-argoui-app-toolbar {",
      "  flex-wrap: wrap;",
      "  align-items: center;",
      "  gap: 8px 12px;",
      "  padding: 8px 4px 10px;",
      "  box-sizing: border-box;",
      "}",
      ".gaia-argoui-app-toolbar .goog-flat-menu-button {",
      "  border-radius: 3px;",
      "  border: 1px solid #cbd5e1;",
      "  background: #fff;",
      "  min-height: 20px;",
      "  padding: 1px 6px;",
      "  font-size: 11px;",
      "}",
      ".gaia-argoui-app-toolbar .goog-flat-menu-button:hover {",
      "  background: #f1f5f9;",
      "}",
      ".gaia-argoui-app-toolbar .gaia-argoui-select-label,",
      ".gaia-argoui-app-toolbar .gaia-argoui-select-wrp {",
      "  font-size: 12px;",
      "}",
      "/* フィルタ条件が出るブロック */",
      ".gaia-argoui-app-filter {",
      "  margin: 6px 0 8px;",
      "  padding: 8px 12px;",
      "  background: #f8fafc;",
      "  border: 1px solid #e2e8f0;",
      "  border-radius: 8px;",
      "  box-sizing: border-box;",
      "}",
      ".gaia-argoui-app-filter-item,",
      ".gaia-argoui-app-filter-cond-item,",
      ".gaia-argoui-app-filter-name {",
      "  font-size: 11px;",
      "  line-height: 1.4;",
      "}",
      "/* 新一覧（Ocean）: ヘッダ行の折返し・余白 */",
      ".ocean-ui-app-index-head {",
      "  flex-wrap: wrap;",
      "  gap: 8px;",
      "  align-items: center;",
      "  padding: 4px 0 10px;",
      "  box-sizing: border-box;",
      "}",
    ].join("\n");
    document.head.appendChild(st);
  }

  /**
   * カスタムHTMLビュー「アカウント棚卸フィルタ」などの絞り込みボタンを日付入力相当の高さにそろえる。
   * （ビューHTMLはアプリ内にあり class が一定でないため、ラベル文字列で判定する）
   */
  function ensure627AccountInventoryFilterUi() {
    if (document.getElementById("jbis-627-account-inventory-filter-ui")) {
      return;
    }
    var st = document.createElement("style");
    st.id = "jbis-627-account-inventory-filter-ui";
    st.textContent = [
      "/* JBIS 627: カスタム棚卸フィルタの絞り込みボタン */",
      ".jbis-inventory-filter-actions {",
      "  display: flex;",
      "  flex-wrap: wrap;",
      "  gap: 4px 6px;",
      "  align-items: center;",
      "  margin-top: 2px;",
      "  margin-bottom: 6px;",
      "}",
      ".jbis-inventory-filter-btn {",
      "  box-sizing: border-box;",
      "  -webkit-appearance: none;",
      "  appearance: none;",
      "  margin: 0;",
      "  height: 20px;",
      "  padding: 0 6px;",
      "  font-size: 9px;",
      "  line-height: 1.1;",
      "  font-weight: 600;",
      "  border-radius: 3px;",
      "  cursor: pointer;",
      "  white-space: nowrap;",
      "}",
      ".jbis-inventory-filter-btn--primary {",
      "  color: #fff;",
      "  background: #2563eb;",
      "  border: 1px solid #1d4ed8;",
      "}",
      ".jbis-inventory-filter-btn--primary:hover {",
      "  background: #1d4ed8;",
      "}",
      ".jbis-inventory-filter-btn--secondary {",
      "  color: #0f172a;",
      "  background: #fff;",
      "  border: 1px solid #94a3b8;",
      "}",
      ".jbis-inventory-filter-btn--secondary:hover {",
      "  background: #f1f5f9;",
      "}",
    ].join("\n");
    document.head.appendChild(st);
  }

  function labelForInventoryFilterControl(el) {
    if (!el || !el.tagName) {
      return "";
    }
    var tag = el.tagName.toUpperCase();
    if (tag === "INPUT") {
      var t = (el.getAttribute("type") || "").toLowerCase();
      if (t === "button" || t === "submit" || t === "reset") {
        return String(el.value || "")
          .replace(/\s+/g, " ")
          .trim();
      }
      return "";
    }
    return String(el.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function apply627AccountInventoryFilterButtonClasses() {
    var sel =
      "button, input[type='button'], input[type='submit'], input[type='reset']";
    var nodes = document.querySelectorAll(sel);
    var primary = null;
    var secondary = null;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var lab = labelForInventoryFilterControl(el);
      if (lab === "絞り込み") {
        primary = el;
      } else if (lab === "絞り込み解除") {
        secondary = el;
      }
    }
    if (primary) {
      primary.classList.add(
        "jbis-inventory-filter-btn",
        "jbis-inventory-filter-btn--primary"
      );
    }
    if (secondary) {
      secondary.classList.add(
        "jbis-inventory-filter-btn",
        "jbis-inventory-filter-btn--secondary"
      );
    }
    if (
      primary &&
      secondary &&
      primary.parentElement &&
      primary.parentElement === secondary.parentElement
    ) {
      primary.parentElement.classList.add("jbis-inventory-filter-actions");
    }
  }

  function schedule627AccountInventoryFilterUi() {
    var delays = [0, 200, 600, 1200];
    for (var j = 0; j < delays.length; j++) {
      (function (ms) {
        setTimeout(function () {
          try {
            apply627AccountInventoryFilterButtonClasses();
          } catch (e2) {
            console.warn("[jbis 627] inventory filter buttons", e2);
          }
        }, ms);
      })(delays[j]);
    }
  }

  function onIndexShowPolish(event) {
    try {
      ensure627IndexFilterPolish();
      ensure627AccountInventoryFilterUi();
      schedule627AccountInventoryFilterUi();
    } catch (e) {
      console.warn("[jbis 627] index filter polish", e);
    }
    return event;
  }

  kintone.events.on("app.record.index.show", onIndexShowPolish);
  if (typeof kintone.mobile !== "undefined") {
    kintone.events.on("mobile.app.record.index.show", onIndexShowPolish);
  }
})();
