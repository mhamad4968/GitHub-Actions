(function () {
  "use strict";

  /**
   * 部署予実 ダッシュアプリ 678
   * BUILD: 2026-05-04-678-manual-app-guide-name
   * - 677 を kintone.api で一覧。左キー列は `shin-format-excel-layout.md` 新フォーマット準拠＋12 月×四つ柱（`monthly_breakdown`）
   * - 一覧の既定 SORT は `display_order asc, $id asc`（SPEC §6e 準拠・2026-05-03 改修）
   * - 新規追加モーダルは「挿入位置」選択（一番下/一番上/○○の上/○○の下）＋中間値計算（floor((prev+next)/2)）
   * - 表示順（display_order）の PUT は 677 へ（SPEC §6e）。インライン編集も可
   * - 677 取得: タイムアウト・描画 try/catch・月次サブテーブル取得失敗時は左ブロックのみにフォールバック
   * - イニシャル費用（変動費）/ 都度費用の集計列: 実績・予算修正＝入力対象月（入力月の入力ボタン・暦月ラベル）
   * - 入力月の入力ボタン: 横スクロール＋都度費用モード。都度ON時はランニングに「入力中」表示を出さず月ボタンは薄表示（クリックで都度解除＋その月へ）。当月列＝薄色、実績・予算修正＝入力スロット色
   * - ナビ「都度費用」: イニシャル集計の都度費用ブロックへジャンプ（太枠は付けず、ボタンは太字＋ aria-pressed のみ）
   * - 一覧ツールバー右の標準「◯ - ◯（◯件中）」重複表示: 全角数字・括弧ゆれ対応＋領域走査＋MutationObserver で非表示
   * - 固定費: 暦月12列の「予算」「消費率」は 677 `monthly_breakdown` を表示。実績・予算修正は入力対象月のみ。変動費行は暦月12列＋ランニング集計＋固定費小計を `---`、都度・変動費小計のみ数値。固定費行は逆（都度・変動費小計は `---`）
   * - 固定費・当月の月次「予算修正」保存時: 翌月〜年度末（4月）へ同一値を反映するか **はい／いいえ**（SPEC §6・既定＝はいフォーカス）
   * - 実績モーダル: 会社が集合先（FBJ・オフィスバスター・その他・他・他のもの・他や各社・各社・宅配の「クロネコヤマト、佐川急便」併記・未設定系等）のとき **datalist で選択可**＋**「会社を新規登録する」**→677 `partner_company` PUT（集合先「その他」と費用種別は別・費用種別は固定／変動のみ想定）
   * - 暦月12列（§6e）: **固定費**＝各月の予算・率は表示、**実績・予算修正**は入力対象月のみクリック可。**変動費**＝暦月の予算・率は `---`、実績・予算修正は**都度費用**集計列（入力対象月）
   */

  /** 明細・月次の正（一覧・新規・編集） */
  var APP_INPUT = 677;
  /** このカスタマイズが載るダッシュ（一覧表）アプリ */
  var APP_DASH = 678;
  /** クイックマニュアル専用アプリ（`window.YOJITSU_QUICK_MANUAL_APP_ID` があれば数値として優先） */
  var YOJITSU_QUICK_MANUAL_APP_ID = 679;
  /** 担当者向け（アプリ ID は出さない） */
  var YOJITSU_LABEL_INPUT_APP = "システム推進室予実管理システム入力アプリ";
  var YOJITSU_LABEL_INPUT_NEW = "システム推進室予実管理システム入力アプリの新規入力";
  var YOJITSU_LABEL_DASH_APP = "システム推進室予実管理システム";
  var YOJITSU_LABEL_MANUAL_APP = "システム推進室予実アプリガイド";
  var BUILD = "2026-05-04-678-manual-app-guide-name";
  /**
   * マニュアル掲載アプリ（システム推進室予実アプリガイド・679）。`window.Y678_QUICK_MANUAL_URL` が非空なら最優先。
   */
  function resolveY678QuickManualUrl() {
    try {
      if (typeof window !== "undefined" && window.Y678_QUICK_MANUAL_URL) {
        var w = String(window.Y678_QUICK_MANUAL_URL).trim();
        if (w) return w;
      }
    } catch (e) {
      void e;
    }
    var mid = YOJITSU_QUICK_MANUAL_APP_ID;
    try {
      if (typeof window !== "undefined" && window.YOJITSU_QUICK_MANUAL_APP_ID != null) {
        var ov = Number(window.YOJITSU_QUICK_MANUAL_APP_ID);
        if (isFinite(ov) && ov > 0) mid = ov;
      }
    } catch (e1) {
      void e1;
    }
    try {
      if (typeof location !== "undefined" && location.origin) {
        return location.origin + "/k/" + mid + "/";
      }
    } catch (e2) {
      void e2;
    }
    return "https://jbis-kintone.cybozu.com/k/" + mid + "/";
  }
  /** 表の空欄・非該当（1 文字のダッシュより `---` で視認性を上げる） */
  var Y678_EMPTY_HTML = "<span class=\"y678-dim\">---</span>";
  /** 月次列を省略（677 API が `monthly_breakdown` を返せない場合のフォールバック） */
  var y678OmitMonthlyCols = false;
  /** 暦月ラベル（677 の `月度` と同一・5月〜翌年4月） */
  var FISCAL_ORDER = ["5", "6", "7", "8", "9", "10", "11", "12", "1", "2", "3", "4"];
  /** ヘッダ表示用 */
  var FISCAL_HEAD = {
    "5": "5月",
    "6": "6月",
    "7": "7月",
    "8": "8月",
    "9": "9月",
    "10": "10月",
    "11": "11月",
    "12": "12月",
    "1": "1月",
    "2": "2月",
    "3": "3月",
    "4": "4月",
  };

  /** 左キー列（工種名称・工種コード・費用種別・支払種別・摘要・会社） */
  var KEY_COL_COUNT = 6;
  /** 月度ブロックの右側に並ぶ集計ブロック（各 4 列：予算/実績/消費率/予算修正） */
  var AGGR_BLOCK_COUNT = 4;
  /** 末尾列（表示順・備考） */
  var TAIL_COL_COUNT = 2;
  var MONTH_COLS = 4;

  var FETCH_FIELDS = [
    "$id",
    "$revision",
    "work_type_name",
    "work_type_code",
    "cost_category",
    "payment_type",
    "summary_text",
    "summary_supplement",
    "partner_company",
    "learning_fixed_budget",
    "initial_variable_budget",
    "monthly_breakdown",
    "payment_breakdown",
    "display_order",
    "notes",
  ];
  /** `monthly_breakdown` なし（API エラー時の再試行用） */
  var FETCH_FIELDS_NO_MONTHLY = FETCH_FIELDS.filter(function (c) {
    return c !== "monthly_breakdown";
  });
  var QUERY = "order by display_order asc, $id asc limit 100";

  function apiWithTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject({
            code: "Y678_TIMEOUT",
            message:
              YOJITSU_LABEL_INPUT_APP +
              " への一覧取得が " +
              ms / 1000 +
              " 秒を超えました。ネットワーク・プロキシ・権限を確認してください。",
          });
        }, ms);
      }),
    ]);
  }

  /**
   * 一覧表示直後は `kintone.api.url` が未注入のことがあるため、短時間ポーリングする。
   * @returns {Promise<void>}
   */
  function whenKintoneApiUrlReady(timeoutMs) {
    return new Promise(function (resolve, reject) {
      var deadline = Date.now() + (timeoutMs || 12000);
      function probe() {
        try {
          if (typeof kintone !== "undefined" && kintone.api && typeof kintone.api.url === "function") {
            resolve();
            return;
          }
        } catch (e) {
          /* noop */
        }
        if (Date.now() >= deadline) {
          var kType = typeof kintone;
          var aType = kintone && typeof kintone.api;
          var uType = kintone && kintone.api && typeof kintone.api.url;
          reject({
            code: "Y678_NOAPI",
            message:
              "kintone.api.url が利用できません（kintone=" +
              kType +
              " api=" +
              aType +
              " url=" +
              uType +
              "）。一覧の再表示・ブラウザ更新を試してください。",
          });
          return;
        }
        setTimeout(probe, 40);
      }
      probe();
    });
  }

  function isRetriable677FieldError(e) {
    var m = e && e.message != null ? String(e.message) : "";
    var c = e && e.code ? String(e.code) : "";
    if (c === "Y678_TIMEOUT") return false;
    if (c === "CB_IL02" || m.indexOf("CB_IL02") !== -1) return true;
    if (m.indexOf("GAIA_IL02") !== -1) return true;
    if (m.indexOf("不正なフィールド") !== -1) return true;
    if (m.indexOf("Invalid field") !== -1) return true;
    return false;
  }

  function formatApiError(e, jaPrefix) {
    var code = e && e.code ? String(e.code) : "";
    var msg = e && e.message != null ? String(e.message) : "";
    var id = e && e.id ? String(e.id) : "";
    var parts = [jaPrefix];
    if (code) parts.push("コード:" + code);
    if (id) parts.push("id:" + id);
    if (msg) parts.push(msg.slice(0, 420));
    var hint = "";
    if (msg.indexOf("GAIA") !== -1 || msg.indexOf("permission") !== -1) {
      hint = " ［ヒント: " + YOJITSU_LABEL_INPUT_APP + " の閲覧・編集権限とログイン状態を確認］";
    }
    if (code === "CB_NO02" || msg.indexOf("CB_NO02") !== -1) {
      hint = " ［ヒント: アプリ ID またはレコード ID が無効］";
    }
    if (code === "CB_VA01" || msg.indexOf("CB_VA01") !== -1 || msg.indexOf("revision") !== -1) {
      hint = " ［ヒント: 他ユーザーが更新した可能性 → 再読み込み］";
    }
    if (code === "GAIA_QU02" || msg.indexOf("limit") !== -1) {
      hint = " ［ヒント: API 回数制限に達した可能性 → しばらく待って再読み込み］";
    }
    if (code === "Y678_TIMEOUT" || msg.indexOf("秒を超えました") !== -1) {
      hint = " ［ヒント: 再読み込み・別ブラウザ・プロキシ設定を確認］";
    }
    return (parts.join(" · ") + hint).trim().slice(0, 920);
  }

  function esc(s) {
    if (s == null || s === "") return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fieldVal(rec, code) {
    if (!rec || !rec[code]) return "";
    var v = rec[code].value;
    return v == null ? "" : v;
  }

  function revisionOf(rec) {
    if (!rec || !rec.$revision || rec.$revision.value == null) return "";
    return String(rec.$revision.value);
  }

  function recordShowHref(id) {
    return location.origin + "/k/" + APP_INPUT + "/show#record=" + encodeURIComponent(String(id)) + "&mode=show";
  }

  function attrEsc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/\n/g, " ");
  }

  /**
   * 表示用に Excel「備考」相当のみを残す（移行時に注入された付帯メモは除外）。
   * - `旧フォーマット移行メモ（…）` を丸ごと除去
   * - `起票セル:` `出納セル:` `都度` 等の行も除去
   * @param {string} s
   * @returns {string}
   */
  function sanitizeExcelNote(s) {
    var raw = String(s == null ? "" : s);
    if (!raw) return "";
    raw = raw.replace(/旧フォーマット移行メモ（[^）]*）/g, "");
    var lines = raw.split(/\r?\n/);
    var keep = [];
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/起票セル|出納セル/.test(ln)) continue;
      if (/^\s*都度\s*[:：].*$/.test(ln)) continue;
      keep.push(ln);
    }
    return keep.join("\n").trim();
  }

  function truncateNotes(s, maxLen) {
    var raw = sanitizeExcelNote(s);
    if (!raw) return { html: "<span class=\"y678-dim\">---</span>", title: "" };
    var t = esc(raw);
    if (t.length <= maxLen) return { html: t, title: raw.slice(0, 800) };
    return { html: t.slice(0, maxLen) + "…", title: raw.slice(0, 800) };
  }

  function subCellVal(rowVal, code) {
    if (!rowVal || !rowVal[code]) return "";
    var v = rowVal[code].value;
    return v == null ? "" : v;
  }

  /** 677 の月度ラベルを FISCAL_ORDER のキー（"5"…"4"）に寄せる */
  function normalizeFiscalMonthLabel(s) {
    var t = String(s == null ? "" : s).trim();
    if (!t) return "";
    if (/^\d+$/.test(t)) return String(parseInt(t, 10));
    return t;
  }

  function toNum(v) {
    if (v === "" || v == null) return 0;
    var n = Number(String(v).replace(/[,\s¥￥]/g, ""));
    return isFinite(n) ? n : 0;
  }

  /** monthly_breakdown の合計（field=month_budget|month_actual|month_budget_revision） */
  function sumMonthly(rec, field) {
    var tbl = (rec && rec.monthly_breakdown && rec.monthly_breakdown.value) || [];
    var s = 0;
    for (var i = 0; i < tbl.length; i++) {
      var v = ((tbl[i].value || {})[field] || {}).value;
      s += toNum(v);
    }
    return s;
  }

  /** 集計 4 ブロックの値を生成 */
  function computeAggregates(rec) {
    var sumB = sumMonthly(rec, "month_budget");
    var sumA = sumMonthly(rec, "month_actual");
    var sumR = sumMonthly(rec, "month_budget_revision");
    var cat = fieldVal(rec, "cost_category");
    var lb = toNum(fieldVal(rec, "learning_fixed_budget"));
    var iv = toNum(fieldVal(rec, "initial_variable_budget"));
    /** 分母 0 のとき実績も 0 なら消費率 0（％表示は別途付与）。実績のみ正のときは null（表示は ---）。 */
    function pct(actual, base) {
      var b = toNum(base);
      var a = toNum(actual);
      if (!b || b === 0) return a <= 0 ? 0 : null;
      return Math.round((a / b) * 100);
    }
    return {
      running: {
        budget: lb,
        actual: sumA,
        util: pct(sumA, lb + sumR),
        revision: sumR,
      },
      initial: {
        budget: iv,
        actual: sumA,
        util: pct(sumA, iv + sumR),
        revision: sumR,
      },
      fixedSubtotal:
        cat === "固定費"
          ? { budget: sumB, actual: sumA, util: pct(sumA, sumB + sumR), revision: sumR }
          : null,
      variableSubtotal:
        cat === "変動費"
          ? { budget: sumB, actual: sumA, util: pct(sumA, iv + sumR), revision: sumR }
          : null,
    };
  }

  /** 月度ラベル → 月次行の表示用マップ */
  function monthlyMapFromRecord(rec) {
    var map = {};
    var tbl = rec && rec.monthly_breakdown && rec.monthly_breakdown.value;
    if (!Array.isArray(tbl)) return map;
    for (var i = 0; i < tbl.length; i++) {
      var row = tbl[i] && tbl[i].value;
      if (!row || !row.fiscal_month) continue;
      var lab = normalizeFiscalMonthLabel(subCellVal(row, "fiscal_month"));
      if (!lab) continue;
      map[lab] = {
        budget: subCellVal(row, "month_budget"),
        actual: subCellVal(row, "month_actual"),
        revision: subCellVal(row, "month_budget_revision"),
        utilization: subCellVal(row, "month_utilization"),
      };
    }
    return map;
  }

  /** 件数表示の表記ゆれ（全角数字・全角括弧・空白）を寄せて比較用に正規化 */
  function normalize678PagingLabelText(s) {
    return String(s || "")
      .replace(/[０-９]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xff10 + 48);
      })
      .replace(/\u3000/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\uFF08/g, "(")
      .replace(/\uFF09/g, ")")
      .trim();
  }

  /**
   * 標準一覧の件数「1 - 20 (47件中)」「0 - 0 (0件中)」等を非表示。
   * ① ツールバー系コンテナ内 ② 画面上部の短文ノード（クラス不明・再描画後）の二段で掛ける。
   */
  function hide678NativeListPagingLabels() {
    var lineRe = /^\d+\s*-\s*\d+\s*\(\s*\d+\s*件中\s*\)$/;
    var tagSel = "div,span,p,li,a,button,label,strong,em,b,i";

    function hideIfLeafMatch(el) {
      if (!el || !el.getAttribute) return;
      if (el.closest && el.closest("[data-yojitsu-678-shell]")) return;
      var tc = normalize678PagingLabelText(el.textContent || "");
      if (tc.length > 96 || !lineRe.test(tc)) return;
      var hasInner = false;
      var kids = el.querySelectorAll(tagSel);
      var j, inner;
      for (j = 0; j < kids.length; j++) {
        if (kids[j] === el) continue;
        inner = normalize678PagingLabelText(kids[j].textContent || "");
        if (inner.length <= 96 && lineRe.test(inner)) {
          hasInner = true;
          break;
        }
      }
      if (hasInner) return;
      el.style.setProperty("display", "none", "important");
    }

    var rootSel =
      ".gaia-argoui-app-index-toolbar, .ocean-ui-app-index-header, " +
      "[class*='index-toolbar'], [class*='IndexToolbar'], " +
      ".contents-body .gaia-argoui-app-toolbar, " +
      ".recordlist-header-gaia, .recordlist-headerbar-gaia, #recordlist-header-gaia, " +
      ".contents-gaia .subtbar-gaia, .contents-gaia .contents-actionbar-gaia, " +
      "[class*='Subtbar'],[class*='subtbar'],[class*='Actionbar'],[class*='actionbar']";
    var roots = document.querySelectorAll(rootSel);
    var uniq = [];
    var r, i, el, nodes;
    for (r = 0; r < roots.length; r++) {
      if (uniq.indexOf(roots[r]) >= 0) continue;
      uniq.push(roots[r]);
    }
    for (r = 0; r < uniq.length; r++) {
      try {
        nodes = uniq[r].querySelectorAll(tagSel);
      } catch (e1) {
        continue;
      }
      for (i = 0; i < nodes.length; i++) {
        hideIfLeafMatch(nodes[i]);
      }
    }

    /* クラス名が取れない／ツールバー外に出る件数テキスト用: 画面上部の狭い矩形のみ */
    var broadRoot =
      document.querySelector("#contents-body") ||
      document.querySelector(".contents-body") ||
      document.querySelector(".contents-gaia") ||
      document.body;
    try {
      nodes = broadRoot.querySelectorAll(tagSel);
    } catch (e3) {
      nodes = [];
    }
    var topMax = 340;
    var wMax = 520;
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      if (!el || !el.getBoundingClientRect) continue;
      if (el.closest && el.closest("[data-yojitsu-678-shell]")) continue;
      var tc2 = normalize678PagingLabelText(el.textContent || "");
      if (!lineRe.test(tc2) || tc2.length > 64) continue;
      var br = el.getBoundingClientRect();
      if (!br || br.width <= 0 || br.height <= 0) continue;
      if (br.top > topMax || br.width > wMax || br.height > 80) continue;
      hideIfLeafMatch(el);
    }
  }

  var y678PagingHideMo = null;
  var y678PagingHideMoTimer = null;
  function ensure678PagingHideMutationObserver() {
    if (y678PagingHideMo || typeof MutationObserver === "undefined") return;
    var root =
      document.querySelector("#contents-body") ||
      document.querySelector(".contents-body") ||
      document.body;
    if (!root) return;
    y678PagingHideMo = new MutationObserver(function () {
      if (!document.querySelector("[data-yojitsu-678-shell]")) return;
      clearTimeout(y678PagingHideMoTimer);
      y678PagingHideMoTimer = setTimeout(function () {
        try {
          hide678NativeListPagingLabels();
        } catch (e4) {
          void e4;
        }
      }, 160);
    });
    try {
      y678PagingHideMo.observe(root, { childList: true, subtree: true });
    } catch (e5) {
      y678PagingHideMo = null;
    }
  }

  function schedule678PagingLabelHide() {
    [0, 50, 150, 400, 900, 2000, 4000].forEach(function (ms) {
      setTimeout(function () {
        try {
          hide678NativeListPagingLabels();
        } catch (e2) {
          void e2;
        }
      }, ms);
    });
  }

  /**
   * 一覧にダッシュを載せる親ノード（UI 世代差で API が異なるため複数候補）
   * @returns {{ parent: HTMLElement, before: HTMLElement|null }|null}
   */
  function resolve678MountHost() {
    var slot = null;
    try {
      if (kintone.app && kintone.app.record && typeof kintone.app.record.getHeaderMenuSpaceElement === "function") {
        slot = kintone.app.record.getHeaderMenuSpaceElement();
      }
    } catch (e0) {
      void e0;
    }
    if (!slot) {
      try {
        if (kintone.app && typeof kintone.app.getHeaderMenuSpaceElement === "function") {
          slot = kintone.app.getHeaderMenuSpaceElement();
        }
      } catch (e1) {
        void e1;
      }
    }
    if (slot) return { parent: slot, before: null };

    try {
      if (kintone.app && typeof kintone.app.getHeaderSpaceElement === "function") {
        var hs = kintone.app.getHeaderSpaceElement();
        if (hs) return { parent: hs, before: null };
      }
    } catch (e2) {
      void e2;
    }

    var ocean = document.querySelector(".ocean-ui-app-index-head");
    if (ocean) return { parent: ocean, before: ocean.firstChild };

    var idxHead = document.querySelector(".gaia-argoui-app-index-head");
    if (idxHead) return { parent: idxHead, before: idxHead.firstChild };

    var rl = document.querySelector(".recordlist-gaia");
    if (rl && rl.parentNode) return { parent: rl.parentNode, before: rl };

    var layout = document.querySelector("#contents-body .layout-gaia");
    if (layout) return { parent: layout, before: layout.firstChild };

    return null;
  }

  function attach678Shell(dest, wrap) {
    if (!dest || !dest.parent) return false;
    if (dest.before) dest.parent.insertBefore(wrap, dest.before);
    else dest.parent.appendChild(wrap);
    return true;
  }

  /** 円表示（カンマ付き・整数化）。空・非数値は `---`（Y678_EMPTY_HTML）。負値は ASCII `-` を ¥ の前に置く。 */
  function formatYen(v) {
    if (v === "" || v == null) return Y678_EMPTY_HTML;
    var s = String(v).replace(/[,\s]/g, "");
    var n = Number(s);
    if (!isFinite(n)) return esc(String(v));
    var i = n >= 0 ? Math.floor(n) : Math.ceil(n);
    var sign = i < 0 ? "-" : "";
    var formatted = Math.abs(i).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return sign + "¥" + formatted;
  }
  function escNumCell(v) {
    return formatYen(v);
  }

  /** ランニング暦月「実績」: 未入力は 0 円として表示（固定費行のみ使用） */
  function formatYenRunningActualFixed(v) {
    if (v === "" || v == null) return formatYen(0);
    return formatYen(v);
  }

  /** 月次「消費率」表示（kintone が数値のみの場合は末尾に % を付与） */
  function formatCellUtilizationDisplay(raw) {
    if (raw === "" || raw == null) return Y678_EMPTY_HTML;
    var t = String(raw).trim();
    if (/%\s*$/.test(t)) return esc(t);
    var n = Number(String(t).replace(/,/g, "").replace(/%/g, ""));
    if (!isFinite(n)) return esc(t);
    return esc(String(n)) + "%";
  }

  /** 集計ブロックの消費率（数値は整数％、null は空欄マーク） */
  function formatAggrUtilDisplay(u) {
    if (u == null) return Y678_EMPTY_HTML;
    return esc(String(u)) + "%";
  }

  function filterRecordsByCostCategory(records, filterKey) {
    if (filterKey === "all") return records.slice();
    var out = [];
    for (var i = 0; i < records.length; i++) {
      if (fieldVal(records[i], "cost_category") === filterKey) out.push(records[i]);
    }
    return out;
  }

  function activeMonthLabels() {
    return y678OmitMonthlyCols ? [] : FISCAL_ORDER;
  }

  /** 今日の暦月（5〜4 月度ラベルと同じ表記："1"〜"12"） */
  function getCurrentMonthLabel() {
    return String(new Date().getMonth() + 1);
  }

  /**
   * 実績・予算修正の対象暦月（入力月の入力ボタンの「5月」…で変更。未設定時はカレンダー当月）。
   * sessionStorage に保持しリロード後も維持。
   */
  var y678InputMonthLabel = "";
  function getInputMonthLabel() {
    var t = normalizeFiscalMonthLabel(y678InputMonthLabel);
    if (t && FISCAL_ORDER.indexOf(t) >= 0) return t;
    return getCurrentMonthLabel();
  }
  function setInputMonthLabel(lab) {
    var n = normalizeFiscalMonthLabel(lab);
    if (!n || FISCAL_ORDER.indexOf(n) < 0) return;
    y678InputMonthLabel = n;
    try {
      sessionStorage.setItem("y678-input-month", n);
    } catch (eIm) {
      void eIm;
    }
  }
  try {
    var _im0 = sessionStorage.getItem("y678-input-month");
    var _n0 = normalizeFiscalMonthLabel(_im0);
    if (_n0 && FISCAL_ORDER.indexOf(_n0) >= 0) y678InputMonthLabel = _n0;
  } catch (eImr) {
    void eImr;
  }

  /**
   * ナビ「都度費用」モード（変動費の実績・予算修正はこの集計列）。月ボタン選択で解除。
   * sessionStorage に保持しリロード後も維持。暦月ヘッダの「入力中」ハイライトは都度時オフ（monthCurUi）。
   */
  var y678FocusTsudo = false;
  try {
    if (sessionStorage.getItem("y678-focus-tsudo") === "1") y678FocusTsudo = true;
  } catch (eTsr) {
    void eTsr;
  }
  function setTsudoFocus(on) {
    y678FocusTsudo = !!on;
    try {
      if (on) sessionStorage.setItem("y678-focus-tsudo", "1");
      else sessionStorage.removeItem("y678-focus-tsudo");
    } catch (eTsw) {
      void eTsw;
    }
  }

  /** 現在のソート状態（左キー 5 列のクリックで切替・null=デフォルト工種コード昇順） */
  var y678Sort = { field: null, dir: null };

  function sortArrowHtml(field) {
    if (y678Sort.field !== field) return "<span class=\"y678-sort-arrow y678-sort-idle\">⇅</span>";
    return y678Sort.dir === "asc"
      ? "<span class=\"y678-sort-arrow y678-sort-active\">▲</span>"
      : "<span class=\"y678-sort-arrow y678-sort-active\">▼</span>";
  }

  /** lastRawRecords をユーザ指定の左キー列でソート（in-memory） */
  function applyKeySort(records) {
    if (!y678Sort.field || !y678Sort.dir) return records;
    var f = y678Sort.field;
    var sign = y678Sort.dir === "desc" ? -1 : 1;
    var copy = records.slice();
    copy.sort(function (a, b) {
      var av = String(fieldVal(a, f) || "").trim();
      var bv = String(fieldVal(b, f) || "").trim();
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      if (f === "work_type_code") {
        var an = Number(av);
        var bn = Number(bv);
        if (isFinite(an) && isFinite(bn) && av !== "" && bv !== "") {
          if (an !== bn) return (an - bn) * sign;
        }
      }
      return av.localeCompare(bv, "ja") * sign;
    });
    return copy;
  }

  function theadHtml() {
    // SPEC §6e + Excel 新フォーマット準拠の 3 段ヘッダ:
    //   r1 = 大区分（ランニング費用（固定費）/ ランニング費用（固定費）集計 / イニシャル費用（変動費）/ 固定費小計 / 変動費小計）
    //   r2 = 中区分（5月..4月 / 集計 / 都度費用 / 集計 / 集計）
    //   r3 = 詳細（予算 / 実績 / 消費率 / 予算修正）× 各ブロック 4 列
    var months = activeMonthLabels();
    var monthCount = months.length;
    var r1 = [];
    var r2 = [];
    var r3 = [];
    var todayM = getCurrentMonthLabel();
    var inputM = getInputMonthLabel();
    /** 都度ナビオン時は暦月の「入力中」枠のみ外す（内部の入力対象月は維持・都度列の集計は同じ月） */
    var monthCurUi = y678FocusTsudo ? null : inputM;

    // === Sticky keys (rowspan=3) — 左固定 6 列 ===
    r1.push(
      "<th rowspan=\"3\" class=\"y678-sk y678-sk1 y678-th-key y678-sortable\" data-y678-sort=\"work_type_name\" title=\"クリックでソート\">工種名称" + sortArrowHtml("work_type_name") + "</th>" +
        "<th rowspan=\"3\" class=\"y678-sk y678-sk2 y678-th-key y678-sortable\" data-y678-sort=\"work_type_code\" title=\"クリックでソート\">工種<br/>コード" + sortArrowHtml("work_type_code") + "</th>" +
        "<th rowspan=\"3\" class=\"y678-sk y678-sk3 y678-th-key y678-sortable\" data-y678-sort=\"cost_category\" title=\"クリックでソート\">費用種別" + sortArrowHtml("cost_category") + "</th>" +
        "<th rowspan=\"3\" class=\"y678-sk y678-sk4 y678-th-key y678-sortable\" data-y678-sort=\"payment_type\" title=\"クリックでソート\">支払<br/>種別" + sortArrowHtml("payment_type") + "</th>" +
        "<th rowspan=\"3\" class=\"y678-sk y678-sk5 y678-th-key y678-sortable\" data-y678-sort=\"summary_text\" title=\"クリックでソート\">摘要" + sortArrowHtml("summary_text") + "</th>" +
        "<th rowspan=\"3\" class=\"y678-sk y678-sk6 y678-th-key y678-sortable\" data-y678-sort=\"partner_company\" title=\"クリックでソート\">会社" + sortArrowHtml("partner_company") + "</th>"
    );

    // === 大区分 r1 ===
    // ランニング費用（固定費） — 12 ヶ月ぶん全体
    r1.push(
      "<th colspan=\"" + (monthCount * MONTH_COLS) + "\" class=\"y678-th-major y678-major-running\">ランニング費用（固定費）</th>"
    );
    // ランニング集計
    r1.push(
      "<th colspan=\"" + MONTH_COLS + "\" class=\"y678-th-major y678-th-aggr y678-aggr-running\">ランニング費用（固定費）集計</th>"
    );
    // イニシャル費用（変動費）
    r1.push(
      "<th colspan=\"" + MONTH_COLS + "\" class=\"y678-th-major y678-th-aggr y678-aggr-initial\">イニシャル費用（変動費）</th>"
    );
    // 固定費小計
    r1.push(
      "<th colspan=\"" + MONTH_COLS + "\" class=\"y678-th-major y678-th-aggr y678-aggr-fixed\">固定費小計</th>"
    );
    // 変動費小計
    r1.push(
      "<th colspan=\"" + MONTH_COLS + "\" class=\"y678-th-major y678-th-aggr y678-aggr-variable\">変動費小計</th>"
    );

    // === Tail (rowspan=3) ===
    r1.push(
      "<th rowspan=\"3\" class=\"y678-th-tail y678-tail-do\">表示順</th>" +
        "<th rowspan=\"3\" class=\"y678-th-tail y678-tail-notes\">備考</th>"
    );

    // === 中区分 r2: 月名 + 集計／都度費用ラベル ===
    for (var m = 0; m < months.length; m++) {
      var lab = months[m];
      var band = m % 2 === 0 ? "y678-m-even" : "y678-m-odd";
      var labN = normalizeFiscalMonthLabel(lab);
      var todayN = normalizeFiscalMonthLabel(todayM);
      var isFiscalToday = labN === todayN;
      var fiscalTodayCls = isFiscalToday ? " y678-fiscal-today-col" : "";
      var isRunningInputMonth = !y678FocusTsudo && monthCurUi != null && labN === normalizeFiscalMonthLabel(monthCurUi);
      var monthTag = "";
      if (isRunningInputMonth) {
        monthTag =
          isFiscalToday
            ? " <span class=\"y678-input-target-tag\">入力中・今月</span>"
            : " <span class=\"y678-input-target-tag\">入力中</span>";
      } else if (isFiscalToday) {
        monthTag = " <span class=\"y678-today-tag\">今月</span>";
      }
      r2.push(
        "<th data-y678-month=\"" +
          esc(lab) +
          "\" colspan=\"" +
          MONTH_COLS +
          "\" class=\"y678-th-month " +
          band +
          fiscalTodayCls +
          "\">" +
          esc(FISCAL_HEAD[lab] || lab + "月") +
          monthTag +
          "</th>"
      );
    }
    // ランニング集計の中区分: "集計"
    r2.push(
      "<th colspan=\"" + MONTH_COLS + "\" class=\"y678-th-mid y678-aggr-running\">集計</th>"
    );
    // イニシャルの中区分: "都度費用"（Excel 新フォーマット行3 と一致・ナビジャンプ用アンカー）
    r2.push(
      "<th colspan=\"" +
        MONTH_COLS +
        "\" class=\"y678-th-mid y678-aggr-initial\" data-y678-jump-anchor=\"tsudo\">都度費用</th>"
    );
    // 固定費小計の中区分: "集計"
    r2.push(
      "<th colspan=\"" + MONTH_COLS + "\" class=\"y678-th-mid y678-aggr-fixed\">集計</th>"
    );
    // 変動費小計の中区分: "集計"
    r2.push(
      "<th colspan=\"" + MONTH_COLS + "\" class=\"y678-th-mid y678-aggr-variable\">集計</th>"
    );

    // === 詳細 r3: 各ブロック 4 列（予算/実績/消費率/予算修正） ===
    for (var n = 0; n < months.length; n++) {
      var lab2 = months[n];
      var band2 = n % 2 === 0 ? "y678-m-even" : "y678-m-odd";
      var ft3 = normalizeFiscalMonthLabel(lab2) === normalizeFiscalMonthLabel(todayM) ? " y678-fiscal-today-col" : "";
      var clsBase = "y678-num y678-th-sub " + band2;
      r3.push(
        "<th class=\"" + clsBase + ft3 + "\">予算</th>" +
          "<th class=\"" + clsBase + ft3 + "\">実績</th>" +
          "<th class=\"" + clsBase + ft3 + "\">消費率<br/><span class=\"y678-sub\">(%)</span></th>" +
          "<th class=\"" + clsBase + ft3 + "\">予算<br/>修正</th>"
      );
    }
    var aggrClasses = ["y678-aggr-running", "y678-aggr-initial", "y678-aggr-fixed", "y678-aggr-variable"];
    for (var g3 = 0; g3 < aggrClasses.length; g3++) {
      var ac = aggrClasses[g3];
      r3.push(
        "<th class=\"y678-num y678-th-sub-aggr " +
          ac +
          "\">予算</th><th class=\"y678-num y678-th-sub-aggr " +
          ac +
          "\">実績</th><th class=\"y678-num y678-th-sub-aggr " +
          ac +
          "\">消費率<br/><span class=\"y678-sub\">(%)</span></th><th class=\"y678-num y678-th-sub-aggr " +
          ac +
          "\">予算<br/>修正</th>"
      );
    }
    return "<thead><tr>" + r1.join("") + "</tr><tr>" + r2.join("") + "</tr><tr>" + r3.join("") + "</tr></thead>";
  }

  function renderTable(records) {
    var months = activeMonthLabels();
    var inputM = getInputMonthLabel();
    var monthCurUi = y678FocusTsudo ? null : inputM;
    var rows = [];
    rows.push(theadHtml());
    rows.push("<tbody>");
    var totalCols = KEY_COL_COUNT + months.length * MONTH_COLS + AGGR_BLOCK_COUNT * MONTH_COLS + TAIL_COL_COUNT;

    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var id = fieldVal(r, "$id");
      var rev = revisionOf(r);
      var costCat = fieldVal(r, "cost_category");
      var mm = monthlyMapFromRecord(r);
      var sum = esc(fieldVal(r, "summary_text"));
      if (sum.length > 56) sum = sum.slice(0, 56) + "…";
      var noteRaw = fieldVal(r, "notes");
      var notePart = truncateNotes(noteRaw, 72);
      var doVal = esc(fieldVal(r, "display_order"));
      var titleAttr = notePart.title ? " title=\"" + attrEsc(notePart.title) + "\"" : "";
      var stripe = i % 2 === 0 ? "y678-row-even" : "y678-row-odd";

      var rowHtml = [];
      var workName = esc(fieldVal(r, "work_type_name"));
      rowHtml.push(
        "<tr class=\"" +
          stripe +
          "\" data-y678-id=\"" +
          esc(id) +
          "\" data-y678-rev=\"" +
          esc(rev) +
          "\">" +
          "<td class=\"y678-sk y678-sk1\"><a href=\"" +
          esc(recordShowHref(id)) +
          "\">" +
          (workName || "<span class=\"y678-dim\">（未入力）</span>") +
          "</a></td>" +
          "<td class=\"y678-sk y678-sk2 y678-code\">" +
          esc(fieldVal(r, "work_type_code")) +
          "</td>" +
          "<td class=\"y678-sk y678-sk3\">" +
          esc(fieldVal(r, "cost_category")) +
          "</td>" +
          "<td class=\"y678-sk y678-sk4\">" +
          (String(fieldVal(r, "payment_type") || "").trim()
            ? esc(fieldVal(r, "payment_type"))
            : Y678_EMPTY_HTML) +
          "</td>" +
          "<td class=\"y678-sk y678-sk5 y678-summary\">" +
          sum +
          "</td>" +
          "<td class=\"y678-sk y678-sk6\">" +
          (String(fieldVal(r, "partner_company") || "").trim()
            ? esc(fieldVal(r, "partner_company"))
            : Y678_EMPTY_HTML) +
          "</td>"
      );

      for (var mi = 0; mi < months.length; mi++) {
        var fl = months[mi];
        var band = mi % 2 === 0 ? "y678-m-even" : "y678-m-odd";
        var flN = normalizeFiscalMonthLabel(fl);
        var isFiscalTodayC = flN === normalizeFiscalMonthLabel(getCurrentMonthLabel());
        var fiscalTodayCls = isFiscalTodayC ? " y678-fiscal-today-col" : "";
        if (costCat === "変動費") {
          rowHtml.push(
            "<td class=\"y678-num " +
              band +
              fiscalTodayCls +
              " y678-na-col\">" +
              Y678_EMPTY_HTML +
              "</td>" +
              "<td class=\"y678-num " +
              band +
              fiscalTodayCls +
              " y678-na-col\">" +
              Y678_EMPTY_HTML +
              "</td>" +
              "<td class=\"y678-num " +
              band +
              fiscalTodayCls +
              " y678-na-col\">" +
              Y678_EMPTY_HTML +
              "</td>" +
              "<td class=\"y678-num " +
              band +
              fiscalTodayCls +
              " y678-na-col\">" +
              Y678_EMPTY_HTML +
              "</td>"
          );
          continue;
        }
        var rowM = mm[fl] || {};
        var util = rowM.utilization;
        var utilStr = formatCellUtilizationDisplay(util);
        var isCurC =
          monthCurUi != null &&
          flN === normalizeFiscalMonthLabel(monthCurUi);
        /** §6e: 固定費＝暦月12列は「入力対象月」列のみ。変動費＝12列参照のみ（都度費用集計列）。入力対象月＝入力月の入力ボタン（既定はカレンダー当月）。 */
        var allowMonthPayment = false;
        var allowMonthRevision = false;
        if (costCat === "固定費") {
          allowMonthPayment = isCurC;
          allowMonthRevision = isCurC;
        } else if (costCat !== "変動費") {
          allowMonthPayment = isCurC;
          allowMonthRevision = isCurC;
        }
        var payTitle = allowMonthPayment
          ? "クリックで支払（実績）を追加（請求書単位は行を分けて複数回保存可）"
          : "上部「入力月の入力ボタン」で入力先の月を選んでから、当該月列の実績セルをクリックしてください";
        var revTitle = allowMonthRevision
          ? "クリックで予算修正を編集（入力対象月の列）"
          : "「入力月の入力ボタン」で入力先の月を選んでから、当該月列の予算修正セルをクリックしてください";
        var payCls =
          "y678-num " +
          band +
          fiscalTodayCls +
          (allowMonthPayment ? " y678-edit-payment y678-input-slot-pay" : "");
        var payData =
          allowMonthPayment
            ? " data-y678-cell=\"payment\" data-y678-month=\"" + esc(fl) + "\""
            : "";
        var revCls =
          "y678-num " +
          band +
          fiscalTodayCls +
          (allowMonthRevision ? " y678-edit y678-input-slot-rev" : "");
        var revData =
          allowMonthRevision
            ? " data-y678-cell=\"month\" data-y678-month=\"" + esc(fl) + "\" data-y678-field=\"month_budget_revision\""
            : "";
        rowHtml.push(
          "<td class=\"y678-num " +
            band +
            fiscalTodayCls +
            "\">" +
            escNumCell(rowM.budget) +
            "</td>" +
            "<td class=\"" +
            attrEsc(payCls) +
            "\"" +
            payData +
            " title=\"" +
            attrEsc(payTitle) +
            "\">" +
            (costCat === "固定費" ? formatYenRunningActualFixed(rowM.actual) : escNumCell(rowM.actual)) +
            "</td>" +
            "<td class=\"y678-num " +
            band +
            fiscalTodayCls +
            "\">" +
            utilStr +
            "</td>" +
            "<td class=\"" +
            attrEsc(revCls) +
            "\"" +
            revData +
            " title=\"" +
            attrEsc(revTitle) +
            "\">" +
            escNumCell(rowM.revision) +
            "</td>"
        );
      }

      var ag = computeAggregates(r);
      function aggrCells(block, blockCls, isEditableBudget, editField, hotMonths, omitBudgetUtil) {
        if (!block) {
          var dim = "<td class=\"y678-num " + blockCls + " y678-aggr-empty\">" + Y678_EMPTY_HTML + "</td>";
          return dim + dim + dim + dim;
        }
        var utilCell = omitBudgetUtil ? Y678_EMPTY_HTML : formatAggrUtilDisplay(block.util);
        var budgetCell = omitBudgetUtil
          ? "<td class=\"y678-num " + blockCls + "\">" + Y678_EMPTY_HTML + "</td>"
          : isEditableBudget
          ? "<td class=\"y678-num " +
            blockCls +
            " y678-edit\" data-y678-cell=\"top\" data-y678-field=\"" +
            editField +
            "\" title=\"クリックで予算を編集\">" +
            formatYen(block.budget) +
            "</td>"
          : "<td class=\"y678-num " + blockCls + "\">" + formatYen(block.budget) + "</td>";
        var actualCell =
          hotMonths && hotMonths.payment
            ? "<td class=\"y678-num " +
              blockCls +
              " y678-edit-payment y678-input-slot-pay\" data-y678-cell=\"payment\" data-y678-month=\"" +
              esc(hotMonths.payment) +
              "\" title=\"クリックで支払（請求額）入力（都度費用・対象月は入力月の入力ボタンで変更）\">" +
              formatYen(block.actual) +
              "</td>"
            : "<td class=\"y678-num " + blockCls + "\">" + formatYen(block.actual) + "</td>";
        var revisionCell =
          hotMonths && hotMonths.revision
            ? "<td class=\"y678-num " +
              blockCls +
              " y678-edit y678-input-slot-rev\" data-y678-cell=\"month\" data-y678-month=\"" +
              esc(hotMonths.revision) +
              "\" data-y678-field=\"month_budget_revision\" title=\"クリックで予算修正（都度費用・対象月は入力月の入力ボタンで変更）\">" +
              formatYen(block.revision) +
              "</td>"
            : "<td class=\"y678-num " + blockCls + "\">" + formatYen(block.revision) + "</td>";
        return budgetCell + actualCell + "<td class=\"y678-num " + blockCls + "\">" + utilCell + "</td>" + revisionCell;
      }

      /** 都度費用（イニシャル集計）のインライン実績・予算修正は「変動費」行のみ（固定費行は暦月の入力対象月列のみ） */
      var initialHotMonths =
        costCat === "変動費" && !y678OmitMonthlyCols && ag.initial
          ? { payment: getInputMonthLabel(), revision: getInputMonthLabel() }
          : null;

      rowHtml.push(
        /** ランニング集計: 変動費行は固定費系のため `---` 4 セル。固定費行は従来表示。 */
        (costCat === "変動費"
          ? aggrCells(null, "y678-aggr-running", false, null, null, true)
          : aggrCells(ag.running, "y678-aggr-running", false, null, null, false)) +
        /** イニシャル／都度: 固定費行は変動費系のため `---`。変動費行は従来。 */
        (costCat === "固定費"
          ? aggrCells(null, "y678-aggr-initial", false, null, null, true)
          : aggrCells(ag.initial, "y678-aggr-initial", false, null, initialHotMonths, false)) +
        (costCat === "変動費"
          ? aggrCells(null, "y678-aggr-fixed", false, null, null, true)
          : aggrCells(ag.fixedSubtotal, "y678-aggr-fixed", false, null, null, false)) +
        (costCat === "固定費"
          ? aggrCells(null, "y678-aggr-variable", false, null, null, true)
          : aggrCells(ag.variableSubtotal, "y678-aggr-variable", false, null, null, false)) +
          "<td class=\"y678-tail-do y678-display-order\" data-y678-do-td=\"1\">" +
          "<input type=\"number\" class=\"y678-display-order-input\" value=\"" +
          doVal +
          "\" step=\"any\" /> " +
          "<button type=\"button\" class=\"y678-display-order-save\">保存</button>" +
          "</td>" +
          "<td class=\"y678-tail-notes y678-notes\"" +
          titleAttr +
          ">" +
          notePart.html +
          "</td>"
      );

      rowHtml.push("</tr>");
      rows.push(rowHtml.join(""));
    }
    if (!records.length) {
      rows.push(
        "<tr><td colspan=\"" +
          totalCols +
          "\" class=\"y678-empty\">該当する行がありません（" +
          YOJITSU_LABEL_INPUT_APP +
          " にデータが無い・権限外・またはフィルタ条件に一致なし）</td></tr>"
      );
    }
    rows.push("</tbody>");
    return rows.join("");
  }

  function injectGridCss(wrap) {
    if (wrap.querySelector("[data-y678-grid-css]")) return;
    var st = document.createElement("style");
    st.setAttribute("data-y678-grid-css", "1");
    st.textContent = [
      ".gaia-argoui-app-index-recordlist,.gaia-argoui-app-index-norecord,.recordlist-gaia,.recordlist-norecord-gaia,.gaia-argoui-list-norecord,.recordlist-paging-gaia,div[class*='recordlist-norecord']{display:none !important;}",
      // kintone ネイティブのページング・件数表示（「0 - 0 （0件中）」等・上下／重複）を完全に隠す（JS で補完）
      ".gaia-argoui-app-index-paging,.gaia-argoui-app-index-recordcount,.gaia-argoui-app-recordcount,.gaia-argoui-paging," +
        "div[class*='paging-gaia'],div[class*='recordlist-paging'],div[class*='recordcount-gaia']," +
        "[class*='recordcount-gaia'],[class*='Recordcount-gaia'],[class*='recordlist-paging']," +
        ".gaia-argoui-app-index-toolbar [class*='pager'],.gaia-argoui-app-index-toolbar [class*='Pager']," +
        ".gaia-argoui-app-index-toolbar [class*='recordcount'],.gaia-argoui-app-index-toolbar [class*='RecordCount']," +
        ".ocean-ui-app-index-header [class*='pager'],.ocean-ui-app-index-header [class*='Pager']," +
        ".ocean-ui-app-index-header [class*='recordcount'],.ocean-ui-app-index-header [class*='RecordCount']," +
        "[class*='index-toolbar'] [class*='recordcount'],[class*='index-toolbar'] [class*='RecordCount']," +
        ".recordlist-header-gaia [class*='recordcount'],.recordlist-headerbar-gaia [class*='recordcount']," +
        ".recordlist-header-gaia [class*='pager'],.recordlist-headerbar-gaia [class*='pager']{display:none !important;}",
      "html,body{overflow-x:auto !important;}",
      "[data-yojitsu-678-shell] .y678-manual-bar{margin:0 0 10px;padding:9px 14px;background:linear-gradient(180deg,#1a5c3a,#0f4a28);border:1px solid #064b24;border-radius:8px;font-size:13px;line-height:1.4;}",
      "[data-yojitsu-678-shell] .y678-manual-bar a{color:#f4fff8;font-weight:700;text-decoration:none;letter-spacing:.02em;}",
      "[data-yojitsu-678-shell] .y678-manual-bar a:hover{text-decoration:underline;color:#fff;}",
      "[data-yojitsu-678-shell] .y678-nav{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin-bottom:8px;padding:6px 8px;background:#eaf4ec;border:1px solid #b9d6bd;border-radius:6px;}",
      "[data-yojitsu-678-shell] .y678-nav-label{font-size:12px;color:#1f4d33;font-weight:600;margin-right:4px;}",
      "[data-yojitsu-678-shell] .y678-nav-btn{font-size:12px;padding:3px 9px;border:1px solid #b9d6bd;background:#fff;color:#1f4d33;border-radius:4px;cursor:pointer;line-height:1.4;}",
      "[data-yojitsu-678-shell] .y678-nav-btn:hover{background:#dfeee2;border-color:#7fb38c;}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-month{background:#c5d2cc;color:#2a3530;border-color:#8fa199;font-weight:500;}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-month:hover{background:#b3c2bb;color:#121a16;border-color:#6f8378;}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-month.y678-nav-month--active{background:linear-gradient(180deg,#198042,#0d5c2e);color:#fff;border-color:#064b24;font-weight:700;box-shadow:0 2px 8px rgba(6,75,36,.38);}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-month.y678-nav-month--active:hover{background:linear-gradient(180deg,#156b38,#085524);color:#fff;border-color:#053d1a;}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-month.y678-nav-month--muted{opacity:.5;color:#3d4a44;background:#cdd8d2;border-color:#97a8a0;}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-tsudo," +
        "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-tsudo.y678-nav-tsudo--inactive{background:#c5d2cc;color:#2a3530;border-color:#8fa199;font-weight:500;opacity:1;}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-tsudo:hover," +
        "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-tsudo.y678-nav-tsudo--inactive:hover{background:#b3c2bb;color:#121a16;border-color:#6f8378;}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-tsudo.y678-nav-tsudo--active{background:linear-gradient(180deg,#198042,#0d5c2e);color:#fff;border-color:#064b24;font-weight:700;box-shadow:0 2px 8px rgba(6,75,36,.38);}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-tsudo.y678-nav-tsudo--active:hover{background:linear-gradient(180deg,#156b38,#085524);color:#fff;border-color:#053d1a;}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-clear{font-size:11.5px;color:#4a5a52;background:#f4f6f5;border-color:#c5d0cc;}",
      "[data-yojitsu-678-shell] .y678-nav-btn.y678-nav-clear:hover{background:#e8eceb;border-color:#9aafaa;}",
      "[data-yojitsu-678-shell] .y678-nav-hint{font-size:10.5px;color:#5e7a64;margin-left:auto;}",
      "[data-yojitsu-678-shell] .y678-tbl-outer{position:relative;width:100%;max-width:100%;box-sizing:border-box;}",
      "[data-yojitsu-678-shell] .y678-tbl-host{position:relative;width:100%;max-width:100%;overflow:visible;box-sizing:border-box;border:1px solid #dee5e0;border-radius:10px;background:#fff;box-shadow:0 2px 6px rgba(40,90,60,.04);}",
      "[data-yojitsu-678-shell] .y678-tbl-host::-webkit-scrollbar{width:14px;height:14px;}",
      "[data-yojitsu-678-shell] .y678-tbl-host::-webkit-scrollbar-track{background:#e8f1ea;border-radius:7px;}",
      "[data-yojitsu-678-shell] .y678-tbl-host::-webkit-scrollbar-thumb{background:#7fb38c;border:2px solid #e8f1ea;border-radius:7px;}",
      "[data-yojitsu-678-shell] .y678-tbl-host::-webkit-scrollbar-thumb:hover{background:#5a9870;}",
      "[data-yojitsu-678-shell] .y678-tbl-host::-webkit-scrollbar-corner{background:#e8f1ea;}",
      "[data-yojitsu-678-shell] .y678-fade-right{position:absolute;top:0;right:0;width:32px;height:100%;pointer-events:none;background:linear-gradient(to right,rgba(255,255,255,0),rgba(40,90,60,0.18));border-top-right-radius:10px;border-bottom-right-radius:10px;transition:opacity .15s;}",
      "[data-yojitsu-678-shell] .y678-grid{font-variant-numeric:tabular-nums;border-collapse:separate;border-spacing:0;font-size:11.5px;line-height:1.25;color:#1c3a26;width:max-content;min-width:100%;}",
      "[data-yojitsu-678-shell] .y678-grid th,[data-yojitsu-678-shell] .y678-grid td{border-right:1px solid #e8efea;border-bottom:1px solid #e8efea;padding:2px 5px;vertical-align:middle;box-sizing:border-box;}",
      "[data-yojitsu-678-shell] .y678-grid thead th{padding:2px 5px;line-height:1.15;}",
      "[data-yojitsu-678-shell] .y678-grid thead .y678-sub{font-size:9px;line-height:1.05;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-num{text-align:right;white-space:nowrap;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sub{font-weight:400;color:#7c8e80;font-size:10px;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-dim{color:#cdd5cf;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-code{color:#5b6d62;letter-spacing:.02em;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-summary{max-width:13em;word-break:break-word;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-notes{max-width:16em;word-break:break-word;font-size:11px;color:#3e514a;white-space:pre-wrap;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-empty{color:#8b9a90;padding:14px;background:#f7fbf8;text-align:center;}",
      "[data-yojitsu-678-shell] .y678-grid thead{position:sticky;top:var(--y678-thead-top,0);z-index:10;}",
      "[data-yojitsu-678-shell] .y678-grid thead tr:first-child th{position:sticky;top:var(--y678-thead-top,0);z-index:11;}",
      "[data-yojitsu-678-shell] .y678-grid thead tr:nth-child(2) th{position:sticky;top:calc(var(--y678-thead-top,0px) + var(--y678-row1-h,32px));z-index:11;}",
      "[data-yojitsu-678-shell] .y678-grid thead tr:nth-child(3) th{position:sticky;top:calc(var(--y678-thead-top,0px) + var(--y678-row1-h,32px) + var(--y678-row2-h,28px));z-index:11;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-major{background:#3f8a5e;color:#fff;font-weight:700;letter-spacing:.04em;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-mid{background:#5fa982;color:#fff;font-weight:600;font-size:10.5px;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-major.y678-aggr-running,[data-yojitsu-678-shell] .y678-grid .y678-th-mid.y678-aggr-running{background:#c9dabe;color:#36471d;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-major.y678-aggr-initial,[data-yojitsu-678-shell] .y678-grid .y678-th-mid.y678-aggr-initial{background:#b8d6c4;color:#1a3d2d;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-major.y678-aggr-fixed,[data-yojitsu-678-shell] .y678-grid .y678-th-mid.y678-aggr-fixed{background:#dab9a3;color:#42271a;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-major.y678-aggr-variable,[data-yojitsu-678-shell] .y678-grid .y678-th-mid.y678-aggr-variable{background:#c4b3d8;color:#2c1f5e;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-major-running{background:#3f8a5e;color:#fff;}",
      "[data-yojitsu-678-shell] .y678-grid thead th{font-weight:600;color:#fff;text-align:center;border-bottom:1px solid #4f8b66;border-right-color:#a3cab6;background:#5fa982;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-key{background:#3f8a5e;color:#fff;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-month.y678-m-even{background:#5fa982;color:#fff;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-month.y678-m-odd{background:#73b896;color:#fff;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-sub{background:#eaf2ec;color:#264a35;font-weight:600;font-size:11.5px;text-align:center !important;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-th-sub.y678-m-odd{background:#f0f6f1;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-tail.y678-tail-do{background:#b6d3c0;color:#1a4030;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-tail.y678-tail-notes{background:#e9d8a3;color:#42330a;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-aggr{font-size:11.5px;letter-spacing:.02em;border-bottom:1px solid #4f8b66;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-aggr.y678-aggr-running{background:#c9dabe;color:#36471d;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-aggr.y678-aggr-initial{background:#b8d6c4;color:#1a3d2d;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-aggr.y678-aggr-fixed{background:#dab9a3;color:#42271a;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-aggr.y678-aggr-variable{background:#c4b3d8;color:#2c1f5e;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-sub-aggr{font-weight:600;font-size:11.5px;text-align:center !important;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-sub-aggr.y678-aggr-running{background:#f0f4dd;color:#3a4d12;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-sub-aggr.y678-aggr-initial{background:#e6f0e9;color:#163a35;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-sub-aggr.y678-aggr-fixed{background:#f5e3d3;color:#4a2912;}",
      "[data-yojitsu-678-shell] .y678-grid thead th.y678-th-sub-aggr.y678-aggr-variable{background:#ebe3f3;color:#2c1c5b;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-aggr-running{background:#fafce8;color:#3a4d12;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-aggr-initial{background:#f3f8f3;color:#16413a;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-aggr-fixed{background:#fcf4ec;color:#4a2912;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-aggr-variable{background:#f5eff9;color:#2c1c5b;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-aggr-running{background:#f3f6dc;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-aggr-initial{background:#ebf2eb;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-aggr-fixed{background:#f7eada;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-aggr-variable{background:#ede4f4;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-aggr-empty{opacity:.6;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-na-col{background:#e6ebea !important;color:#7a8a82;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-na-col{background:#d9e0e3 !important;}",
      "[data-yojitsu-678-shell] .y678-grid thead tr:nth-child(2) th.y678-th-month.y678-fiscal-today-col{background:#ebe3d4 !important;color:#2c2618 !important;}",
      "[data-yojitsu-678-shell] .y678-grid thead tr:nth-child(3) th.y678-fiscal-today-col{background:#f0e9de !important;color:#2a3229 !important;border-right-color:#d8cfc2 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-fiscal-today-col{background:#fbf6eb !important;color:#1c3a26;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-fiscal-today-col{background:#f4ece1 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td.y678-fiscal-today-col{background:#f2e8d8 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd:hover td.y678-fiscal-today-col{background:#eadfd0 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-input-slot-pay{background:#ffefd6 !important;color:#3d2a0a !important;box-shadow:inset 0 0 0 1px rgba(212,140,40,.55);}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-input-slot-rev{background:#dff2e6 !important;color:#0f291d !important;box-shadow:inset 0 0 0 1px rgba(70,140,100,.45);}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-input-slot-pay{background:#ffe8c4 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-input-slot-rev{background:#cfe9db !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td.y678-input-slot-pay{background:#ffd9a8 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td.y678-input-slot-rev{background:#c5e8d4 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-aggr-initial.y678-input-slot-pay{background:#ffefd6 !important;color:#3d2a0a !important;box-shadow:inset 0 0 0 1px rgba(212,140,40,.55);}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-aggr-initial.y678-input-slot-rev{background:#dff2e6 !important;color:#0f291d !important;box-shadow:inset 0 0 0 1px rgba(70,140,100,.45);}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-aggr-initial.y678-input-slot-pay{background:#ffe8c4 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-aggr-initial.y678-input-slot-rev{background:#cfe9db !important;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-input-target-tag{display:inline-block;margin-left:4px;padding:1px 6px;background:#205c3e;color:#f6fffa;font-size:9.5px;font-weight:700;border-radius:3px;letter-spacing:.04em;vertical-align:middle;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-today-tag{display:inline-block;margin-left:4px;padding:1px 6px;background:#e8e4dc;color:#4a4a48;font-size:9px;font-weight:600;border-radius:3px;letter-spacing:.04em;vertical-align:middle;border:1px solid #d0ccc4;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-m-even{background:#f8fbf9;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-m-odd{background:#ffffff;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td{background:#f9fcfa;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-m-even{background:#f3f9f5;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-m-odd{background:#f7faf8;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-tail-do{background:#eef5f0;}",
      "[data-yojitsu-678-shell] .y678-grid tbody td.y678-tail-notes{background:#fcf7e9;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-tail-do{background:#e3eee7;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd td.y678-tail-notes{background:#f5eed3;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td{background:#e8f3ea !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td.y678-fiscal-today-col:not(.y678-input-slot-pay):not(.y678-input-slot-rev){background:#f2e8d8 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td.y678-input-slot-pay{background:#ffd9a8 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td.y678-input-slot-rev{background:#c5e8d4 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td.y678-aggr-initial.y678-input-slot-pay{background:#ffd9a8 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td.y678-aggr-initial.y678-input-slot-rev{background:#c5e8d4 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover td.y678-na-col{background:#d8dfe3 !important;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr:hover .y678-sk{background:#c4d8c8 !important;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sk{position:sticky;z-index:5;}",
      "[data-yojitsu-678-shell] .y678-grid tbody .y678-sk{background:#dee9e0;color:#1f4030;}",
      "[data-yojitsu-678-shell] .y678-grid tbody tr.y678-row-odd .y678-sk{background:#d2e1d6;}",
      "[data-yojitsu-678-shell] .y678-grid thead .y678-sk{z-index:13 !important;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sk1{left:0;width:120px;min-width:120px;max-width:120px;font-weight:700;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sk2{left:120px;width:64px;min-width:64px;max-width:64px;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sk3{left:184px;width:72px;min-width:72px;max-width:72px;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sk4{left:256px;width:60px;min-width:60px;max-width:60px;text-align:center;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sk5{left:316px;width:130px;min-width:130px;max-width:130px;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sk6{left:446px;width:96px;min-width:96px;max-width:96px;border-right:1px solid #b6d3c0;box-shadow:4px 0 6px rgba(40,90,60,.06);}",
      "[data-yojitsu-678-shell] .y678-grid tbody .y678-sk1 a{color:#2f6f4d !important;font-weight:700;}",
      "[data-yojitsu-678-shell] .y678-grid tbody .y678-sk1 a:hover{color:#194a2c !important;text-decoration:underline;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-display-order{min-width:7em;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-display-order-input{width:3.6em;padding:1px 3px;font-size:11px;border:1px solid #b9d2bc;border-radius:3px;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-display-order-save{font-size:10.5px;padding:1px 6px;margin-left:3px;border:1px solid #205c3e;background:#2f7a52;color:#fff;border-radius:3px;cursor:pointer;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-display-order-save:hover{background:#205c3e;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-display-order-save:disabled{background:#a8c0a8;border-color:#a8c0a8;cursor:wait;}",
      "[data-yojitsu-678-shell] .y678-grid a{color:#1f6e3f;text-decoration:none;font-weight:600;}",
      "[data-yojitsu-678-shell] .y678-grid a:hover{text-decoration:underline;color:#0f4a26;}",
      "[data-yojitsu-678-shell] .y678-grid th.y678-sortable{cursor:pointer;user-select:none;}",
      "[data-yojitsu-678-shell] .y678-grid th.y678-sortable:hover{background:#3a8159 !important;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sort-arrow{display:inline-block;margin-left:3px;font-size:9px;letter-spacing:0;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sort-idle{opacity:.45;font-weight:400;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-sort-active{color:#fff7c2;font-weight:700;font-size:11px;text-shadow:0 0 2px rgba(0,0,0,.35);}",
      "[data-yojitsu-678-shell] .y678-actionrow{display:flex;align-items:center;gap:10px;margin-bottom:8px;}",
      "[data-yojitsu-678-shell] .y678-action-add{font-size:13px;font-weight:700;padding:6px 14px;border:1px solid #205c3e;background:linear-gradient(180deg,#3a8c4b,#2f7a52);color:#fff;border-radius:6px;cursor:pointer;box-shadow:0 1px 2px rgba(40,90,60,.2);}",
      "[data-yojitsu-678-shell] .y678-action-add:hover{background:linear-gradient(180deg,#2f7a52,#246340);}",
      "[data-yojitsu-678-shell] .y678-action-hint{font-size:11px;color:#5e7a64;}",
      "[data-yojitsu-678-shell] .y678-grid td.y678-edit{cursor:pointer;}",
      "[data-yojitsu-678-shell] .y678-grid td.y678-edit:hover{outline:2px solid #2f7a52;outline-offset:-2px;}",
      "[data-yojitsu-678-shell] .y678-grid td.y678-editing{padding:0 !important;outline:2px solid #2f7a52;outline-offset:-2px;}",
      "[data-yojitsu-678-shell] .y678-grid td.y678-saving{opacity:.6;}",
      "[data-yojitsu-678-shell] .y678-grid td.y678-edit-payment{cursor:pointer;}",
      "[data-yojitsu-678-shell] .y678-grid td.y678-edit-payment:hover{outline:2px solid #b08400;outline-offset:-2px;background:#fff3c2 !important;}",
      "[data-yojitsu-678-shell] .y678-grid .y678-edit-input{width:100%;height:100%;border:0;padding:6px 6px;font:inherit;background:#fffbe6;color:#1c3a26;text-align:right;outline:none;box-sizing:border-box;}",
      ".y678-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:9999;}",
      ".y678-modal-mask{position:absolute;inset:0;background:rgba(20,40,30,.5);}",
      ".y678-modal-card{position:relative;background:#fff;border:1px solid #b9d6bd;border-radius:10px;box-shadow:0 8px 28px rgba(20,40,30,.25);width:min(640px,92vw);max-height:88vh;overflow:auto;}",
      ".y678-modal-head{padding:12px 18px;background:#205c3e;color:#fff;border-radius:10px 10px 0 0;font-weight:700;font-size:14px;}",
      ".y678-modal-sub{font-weight:400;font-size:12px;color:#cfe5d2;margin-left:6px;}",
      ".y678-modal-body{padding:14px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;color:#1c3a26;}",
      ".y678-modal-body label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:12px;color:#1f4d33;}",
      ".y678-modal-body label.y678-wide{grid-column:1 / span 2;}",
      ".y678-modal-body input,.y678-modal-body select,.y678-modal-body textarea{font:inherit;font-weight:400;padding:6px 8px;border:1px solid #b9d6bd;border-radius:4px;color:#1c3a26;background:#fff;}",
      ".y678-modal-body input:focus,.y678-modal-body select:focus,.y678-modal-body textarea:focus{outline:2px solid #2f7a52;outline-offset:-1px;border-color:#2f7a52;}",
      ".y678-modal-body .req{color:#b00020;}",
      ".y678-modal-status{padding:0 18px 4px;font-size:12px;color:#555;min-height:18px;}",
      ".y678-modal-foot{padding:10px 18px 16px;display:flex;justify-content:flex-end;gap:8px;}",
      ".y678-modal-cancel{font-size:13px;padding:6px 14px;border:1px solid #b9d6bd;background:#fff;color:#1f4d33;border-radius:6px;cursor:pointer;}",
      ".y678-modal-cancel:hover{background:#eaf4ec;}",
      ".y678-modal-save{font-size:13px;font-weight:700;padding:6px 16px;border:1px solid #205c3e;background:#2f7a52;color:#fff;border-radius:6px;cursor:pointer;}",
      ".y678-modal-save:hover{background:#205c3e;}",
      ".y678-modal-save:disabled{background:#a8c0a8;border-color:#a8c0a8;cursor:wait;}",
      ".y678-pay-summary-hint{display:block;font-size:10.5px;color:#5e7a64;font-weight:400;margin:1px 0 4px;}",
      ".y678-pay-link{padding:6px 10px;background:#eaf4ec;border:1px solid #b9d6bd;border-radius:6px;font-size:12px;color:#1f4d33;}",
      ".y678-pay-link a{color:#1f6e3f;font-weight:700;text-decoration:none;}",
      ".y678-pay-link a:hover{text-decoration:underline;color:#0f4a26;}",
      ".y678-pay-partner-newbtn{font-size:12.5px;font-weight:700;padding:7px 14px;border:1px solid #205c3e;background:#e8f4ec;color:#1a4d30;border-radius:6px;cursor:pointer;margin-bottom:4px;}",
      ".y678-pay-partner-newbtn:hover{background:#d4eadc;color:#0f3a22;}",
      ".y678-pay-partner-newbtn:disabled{cursor:default;opacity:.88;}",
      ".y678-modal-body textarea[name='summary_text']{min-height:60px;resize:vertical;}",
      ".y678-modal-body textarea[readonly], .y678-modal-body input[readonly]{background:#f4f5f7;color:#3a4a3f;cursor:not-allowed;border-color:#dde2dd;}",
    ].join("");
    wrap.appendChild(st);
  }

  function styleTable(t) {
    t.className = "y678-grid";
  }

  function mount() {
    if (document.querySelector("[data-yojitsu-678-shell]")) return;

    var dest = resolve678MountHost();
    if (!dest) return;

    var wrap = document.createElement("div");
    wrap.setAttribute("data-yojitsu-678-shell", "1");
    wrap.style.padding = "10px 12px";
    wrap.style.marginBottom = "10px";
    wrap.style.background = "#f4f7f5";
    wrap.style.border = "1px solid #dee5e0";
    wrap.style.borderRadius = "8px";
    wrap.style.fontSize = "13px";
    wrap.style.boxSizing = "border-box";
    wrap.style.maxWidth = "100%";
    injectGridCss(wrap);
    ensure678PagingHideMutationObserver();
    schedule678PagingLabelHide();

    var manualBar = document.createElement("div");
    manualBar.className = "y678-manual-bar";
    manualBar.innerHTML =
      "<a href=\"" +
      esc(resolveY678QuickManualUrl()) +
      "\" target=\"_blank\" rel=\"noopener noreferrer\">📘 " +
      esc(YOJITSU_LABEL_MANUAL_APP) +
      "</a>";
    wrap.appendChild(manualBar);

    var head = document.createElement("div");
    head.style.marginBottom = "8px";
    head.style.display = "flex";
    head.style.flexWrap = "wrap";
    head.style.alignItems = "center";
    head.style.gap = "8px 12px";
    head.style.fontSize = "12px";
    var dashAppId =
      typeof kintone !== "undefined" && kintone.app && typeof kintone.app.getId === "function"
        ? kintone.app.getId()
        : APP_DASH;
    head.innerHTML =
      "<a href=\"" +
      esc(location.origin + "/k/" + dashAppId + "/") +
      "\" style=\"font-weight:700;color:inherit;text-decoration:none\" title=\"" +
      esc(YOJITSU_LABEL_DASH_APP + "・一覧表（この画面）") +
      "\">" +
      esc(YOJITSU_LABEL_DASH_APP) +
      "</a> · " +
      "<a href=\"" +
      esc(location.origin + "/k/" + APP_INPUT + "/") +
      "\" title=\"" +
      esc(YOJITSU_LABEL_INPUT_APP + "・レコード一覧") +
      "\">" +
      esc(YOJITSU_LABEL_INPUT_APP) +
      "</a> · " +
      "<a href=\"" +
      esc(location.origin + "/k/" + APP_INPUT + "/edit") +
      "\" title=\"" +
      esc(YOJITSU_LABEL_INPUT_NEW) +
      "\">" +
      esc(YOJITSU_LABEL_INPUT_NEW) +
      "</a> · " +
      "<button type=\"button\" id=\"y678-refresh\" style=\"font-size:12px;cursor:pointer\" title=\"" +
      esc(YOJITSU_LABEL_INPUT_APP + "の明細を API で取り直して表を再描画") +
      "\">再読み込み</button>";
    wrap.appendChild(head);

    var filterRow = document.createElement("div");
    filterRow.style.marginBottom = "8px";
    filterRow.style.display = "flex";
    filterRow.style.flexWrap = "wrap";
    filterRow.style.alignItems = "center";
    filterRow.style.gap = "6px 8px";
    filterRow.innerHTML =
      "<span style=\"color:#555;font-size:12px\">費用種別:</span>" +
      "<button type=\"button\" class=\"y678-filter\" data-y678-filter=\"all\" style=\"font-size:12px;cursor:pointer\">すべて</button>" +
      "<button type=\"button\" class=\"y678-filter\" data-y678-filter=\"固定費\" style=\"font-size:12px;cursor:pointer\">固定費</button>" +
      "<button type=\"button\" class=\"y678-filter\" data-y678-filter=\"変動費\" style=\"font-size:12px;cursor:pointer\">変動費</button>" +
      "";
    wrap.appendChild(filterRow);

    var actionRow = document.createElement("div");
    actionRow.className = "y678-actionrow";
    actionRow.innerHTML =
      "<button type=\"button\" id=\"y678-add\" class=\"y678-action-add\">＋ 明細を追加</button>";
    wrap.appendChild(actionRow);

    var navRow = document.createElement("div");
    navRow.className = "y678-nav";
    var navParts = [
      "<span class=\"y678-nav-label\">入力月へジャンプ:</span>",
      "<button type=\"button\" data-y678-jump=\"tsudo\" class=\"y678-nav-btn y678-nav-tsudo\" title=\"変動費の実績・予算修正はここ（暦月12列は参照）。ONのときは月ボタンは薄表示（クリックで解除してその月へ切替可）\">都度費用</button>",
      "<button type=\"button\" data-y678-jump-clear=\"1\" class=\"y678-nav-btn y678-nav-clear\" title=\"保存した入力月を解除し都度費用モードをオフ。対象月はカレンダー当月に戻して表を再描画\">選択クリア</button>",
    ];
    for (var jm = 0; jm < FISCAL_ORDER.length; jm++) {
      var jl = FISCAL_ORDER[jm];
      navParts.push(
        "<button type=\"button\" data-y678-jump=\"" +
          esc(jl) +
          "\" class=\"y678-nav-btn y678-nav-month\">" +
          esc(FISCAL_HEAD[jl] || jl + "月") +
          "</button>"
      );
    }
    navParts.push("<span class=\"y678-nav-hint\" title=\"Shift+ホイールで横スクロール\">横スクロール: Shift+ホイール</span>");
    navRow.innerHTML = navParts.join("");
    wrap.appendChild(navRow);

    var status = document.createElement("div");
    status.style.marginBottom = "6px";
    status.style.color = "#555";
    status.textContent = YOJITSU_LABEL_INPUT_APP + " から明細を読み込み中…";
    wrap.appendChild(status);

    var tblHostOuter = document.createElement("div");
    tblHostOuter.className = "y678-tbl-outer";
    var tblHost = document.createElement("div");
    tblHost.className = "y678-tbl-host";
    tblHostOuter.appendChild(tblHost);
    var fadeRight = document.createElement("div");
    fadeRight.className = "y678-fade-right";
    tblHostOuter.appendChild(fadeRight);
    wrap.appendChild(tblHostOuter);

    attach678Shell(dest, wrap);
    schedule678PagingLabelHide();
    setTsudoFocus(y678FocusTsudo);

    var FROZEN_LEFT_PX = 542;
    /** 横スクロールが window ではなく親ラッパー（kintone 一覧の #contents-body 等）で起きている場合がある */
    function isWindowLikeScrollHost(el) {
      return !el || el === document.body || el === document.documentElement;
    }
    function getY678HorizontalScrollHost() {
      if (!tblHost) return document.scrollingElement || document.documentElement;
      var node = tblHost;
      while (node && node !== document.documentElement) {
        try {
          if (node.scrollWidth > node.clientWidth + 2) {
            var ox = window.getComputedStyle(node).overflowX;
            if (ox === "auto" || ox === "scroll" || ox === "overlay" || ox === "hidden") {
              return node;
            }
          }
        } catch (e0) {
          void e0;
        }
        node = node.parentElement;
      }
      return document.scrollingElement || document.documentElement;
    }
    function scrollHostGetLeft(sh) {
      if (isWindowLikeScrollHost(sh)) {
        return window.scrollX || window.pageXOffset || 0;
      }
      return sh.scrollLeft || 0;
    }
    function scrollHostScrollTo(sh, left) {
      var max = Math.max(0, (sh.scrollWidth || 0) - (sh.clientWidth || 0));
      var x = Math.max(0, Math.min(max, left));
      if (isWindowLikeScrollHost(sh)) {
        try {
          window.scrollTo({ left: x, top: window.scrollY, behavior: "smooth" });
        } catch (e1) {
          window.scrollTo(x, window.scrollY);
        }
      } else {
        try {
          sh.scrollTo({ left: x, behavior: "smooth" });
        } catch (e2) {
          sh.scrollLeft = x;
        }
      }
    }
    function scrollHostScrollBy(sh, dx) {
      scrollHostScrollTo(sh, scrollHostGetLeft(sh) + dx);
    }
    var y678FadeScrollHost = null;
    function bindFadeHorizontalScrollHost() {
      var sh = getY678HorizontalScrollHost();
      if (y678FadeScrollHost === sh) return;
      if (y678FadeScrollHost && !isWindowLikeScrollHost(y678FadeScrollHost)) {
        y678FadeScrollHost.removeEventListener("scroll", updateFadeRight);
      }
      y678FadeScrollHost = sh;
      if (!isWindowLikeScrollHost(sh)) {
        sh.addEventListener("scroll", updateFadeRight, { passive: true });
      }
    }
    function jumpHorizontal(key) {
      if (!tblHost) return;
      var sh = getY678HorizontalScrollHost();
      var maxScroll = Math.max(0, (sh.scrollWidth || 0) - (sh.clientWidth || 0));
      if (key === "start") {
        scrollHostScrollTo(sh, 0);
        return;
      }
      if (key === "end") {
        scrollHostScrollTo(sh, maxScroll);
        return;
      }
      var visible = Math.max(200, (sh.clientWidth || window.innerWidth || 1200) - FROZEN_LEFT_PX - 80);
      if (key === "left") {
        scrollHostScrollBy(sh, -visible);
        return;
      }
      if (key === "right") {
        scrollHostScrollBy(sh, visible);
        return;
      }
      if (key === "tsudo") {
        var elTs = tblHost.querySelector("thead [data-y678-jump-anchor=\"tsudo\"]");
        if (!elTs) return;
        var rectT = elTs.getBoundingClientRect();
        var shRectT = sh.getBoundingClientRect();
        var targetT = scrollHostGetLeft(sh) + (rectT.left - shRectT.left) - FROZEN_LEFT_PX - 8;
        scrollHostScrollTo(sh, targetT);
        return;
      }
      var el =
        tblHost.querySelector("thead .y678-th-month[data-y678-month=\"" + key + "\"]") ||
        tblHost.querySelector("[data-y678-month=\"" + key + "\"]");
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var shRect = sh.getBoundingClientRect();
      var target = scrollHostGetLeft(sh) + (rect.left - shRect.left) - FROZEN_LEFT_PX - 8;
      scrollHostScrollTo(sh, target);
    }
    function updateFadeRight() {
      bindFadeHorizontalScrollHost();
      var sh = getY678HorizontalScrollHost();
      var maxLeft = Math.max(0, (sh.scrollWidth || 0) - (sh.clientWidth || 0));
      var cur = scrollHostGetLeft(sh);
      var atRight = cur >= maxLeft - 4;
      fadeRight.style.opacity = atRight || maxLeft <= 0 ? "0" : "1";
    }
    window.addEventListener("scroll", updateFadeRight, { passive: true });
    window.addEventListener("resize", function () {
      updateFadeRight();
      updateStickyTops();
    });

    /* ページスクロール統一: shift+wheel はブラウザ標準が水平スクロールするので追加実装は不要 */

    var lastRawRecords = [];
    var lastTotalCount = 0;
    var currentCostFilter = "all";

    function setFilterButtonsActive() {
      var btns = filterRow.querySelectorAll(".y678-filter");
      for (var b = 0; b < btns.length; b++) {
        var fk = btns[b].getAttribute("data-y678-filter");
        if (fk === currentCostFilter) {
          btns[b].style.fontWeight = "700";
          btns[b].style.textDecoration = "underline";
        } else {
          btns[b].style.fontWeight = "";
          btns[b].style.textDecoration = "";
        }
      }
    }

    function detectKintoneHeaderHeight() {
      var sels = [
        "header.gaia-header-app",
        ".gaia-argoui-app-header",
        ".gaia-header",
        ".ocean-portal-header",
        ".global-navi",
      ];
      var maxH = 0;
      for (var i = 0; i < sels.length; i++) {
        var el = document.querySelector(sels[i]);
        if (el) {
          var rect = el.getBoundingClientRect();
          var pos = window.getComputedStyle(el).position;
          if ((pos === "fixed" || pos === "sticky") && rect.height > maxH) {
            maxH = rect.height;
          }
        }
      }
      return Math.ceil(maxH);
    }

    function updateStickyTops() {
      var thead = tblHost.querySelector(".y678-grid thead");
      if (!thead) return;
      var rows = thead.querySelectorAll("tr");
      if (rows.length === 0) return;
      // 3 段ヘッダの r1 / r2 高さを CSS 変数に流す（r3 は最下段なので不要）
      if (rows[0]) {
        var h1 = Math.ceil(rows[0].getBoundingClientRect().height);
        if (isFinite(h1) && h1 > 0) tblHost.style.setProperty("--y678-row1-h", h1 + "px");
      }
      if (rows[1]) {
        var h2 = Math.ceil(rows[1].getBoundingClientRect().height);
        if (isFinite(h2) && h2 > 0) tblHost.style.setProperty("--y678-row2-h", h2 + "px");
      }
      var headerH = detectKintoneHeaderHeight();
      tblHost.style.setProperty("--y678-thead-top", headerH + "px");
    }

    function fitWrapToViewport() {
      try {
        var available =
          (document.documentElement && document.documentElement.clientWidth) ||
          window.innerWidth ||
          1200;
        var w = Math.max(320, available - 24);
        wrap.style.width = w + "px";
        wrap.style.maxWidth = w + "px";
      } catch (e) {
        /* noop */
      }
    }
    fitWrapToViewport();

    /** ページスクロール統一に伴い tblHost の max-height は使わない（後方互換のため no-op） */
    function fitTblHostHeight() {
      tblHost.style.maxHeight = "";
    }
    fitTblHostHeight();
    window.addEventListener("resize", function () {
      fitWrapToViewport();
      fitTblHostHeight();
      updateFadeRight();
      updateStickyTops();
    });

    function paintTable(filtered) {
      tblHost.innerHTML = "";
      var t = document.createElement("table");
      t.style.minWidth = "max-content";
      t.innerHTML = renderTable(filtered);
      styleTable(t);
      tblHost.appendChild(t);
      setTimeout(function () {
        hide678NativeListPagingLabels();
        bindFadeHorizontalScrollHost();
        updateFadeRight();
        updateStickyTops();
        fitTblHostHeight();
      }, 0);
    }

    function updateStatusLine() {
      // 説明文は非表示（クイックマニュアルへ集約・dashboard はチャート/表に集中）
      status.style.display = "none";
      status.textContent = "";
      setFilterButtonsActive();
    }

    function syncMonthJumpNavActive() {
      if (!navRow) return;
      var im = getInputMonthLabel();
      /** 都度費用フォーカス中は月ボタンの見た目上の選択のみ解除（入力対象月の内部値は維持） */
      var tsudoOn = y678FocusTsudo;
      var btns = navRow.querySelectorAll("button.y678-nav-month[data-y678-jump]");
      for (var bi = 0; bi < btns.length; bi++) {
        var btnm = btns[bi];
        var bk = btnm.getAttribute("data-y678-jump");
        var on = !tsudoOn && normalizeFiscalMonthLabel(bk) === normalizeFiscalMonthLabel(im);
        btnm.classList.toggle("y678-nav-month--active", on);
        btnm.classList.toggle("y678-nav-month--muted", tsudoOn);
        btnm.setAttribute("aria-pressed", on ? "true" : "false");
        btnm.title = tsudoOn
          ? "都度費用モード中: クリックで解除し、この月をランニングの入力先にします"
          : "";
      }
    }

    function syncTsudoNavButton() {
      if (!navRow) return;
      var tb = navRow.querySelector("button.y678-nav-tsudo[data-y678-jump=\"tsudo\"]");
      if (!tb) return;
      var on = y678FocusTsudo;
      tb.classList.toggle("y678-nav-tsudo--active", on);
      tb.classList.toggle("y678-nav-tsudo--inactive", !on);
      tb.setAttribute("aria-pressed", on ? "true" : "false");
    }

    function applyFilterAndRedraw() {
      try {
        var filtered = filterRecordsByCostCategory(lastRawRecords, currentCostFilter);
        filtered = applyKeySort(filtered);
        updateStatusLine();
        paintTable(filtered);
        syncMonthJumpNavActive();
        syncTsudoNavButton();
        if (y678OmitMonthlyCols) {
          status.textContent =
            status.textContent +
            " ［月次列: " +
            YOJITSU_LABEL_INPUT_APP +
            " の API で取得できず省略。" +
            YOJITSU_LABEL_INPUT_APP +
            " のレコード画面で月次を確認してください。］";
        }
      } catch (err) {
        status.style.color = "#b00020";
        status.textContent =
          "表の描画に失敗しました: " + (err && err.message ? String(err.message).slice(0, 220) : String(err));
        if (typeof console !== "undefined" && console.error) console.error("[678] render", err);
      }
    }

    /** 入力月の session 保存と都度モードを捨て、既定（カレンダー当月・暦月ハイライト）に戻す */
    function clearInputJumpSelection() {
      y678InputMonthLabel = "";
      try {
        sessionStorage.removeItem("y678-input-month");
      } catch (eClr) {
        void eClr;
      }
      setTsudoFocus(false);
      applyFilterAndRedraw();
      var toScroll = getInputMonthLabel();
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(function () {
          jumpHorizontal(toScroll);
        });
      } else {
        setTimeout(function () {
          jumpHorizontal(toScroll);
        }, 0);
      }
    }

    navRow.addEventListener("click", function (e) {
      /** ボタン内テキスト直撃時は target が Text ノードになり closest が無いブラウザがある */
      var raw = e.target;
      var el = raw && raw.nodeType === 1 ? raw : raw && raw.parentElement;
      if (!el || typeof el.closest !== "function") return;
      var clr = el.closest("button[data-y678-jump-clear]");
      if (clr && navRow.contains(clr)) {
        clearInputJumpSelection();
        return;
      }
      var b = el.closest("button[data-y678-jump]");
      if (!b || !navRow.contains(b)) return;
      var jk = b.getAttribute("data-y678-jump") || "";
      if (jk === "tsudo") {
        setTsudoFocus(true);
        applyFilterAndRedraw();
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(function () {
            jumpHorizontal("tsudo");
          });
        } else {
          setTimeout(function () {
            jumpHorizontal("tsudo");
          }, 0);
        }
        return;
      }
      var nj = normalizeFiscalMonthLabel(jk);
      if (nj && FISCAL_ORDER.indexOf(nj) >= 0) {
        setTsudoFocus(false);
        setInputMonthLabel(nj);
        applyFilterAndRedraw();
        var monthKey = nj;
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(function () {
            jumpHorizontal(monthKey);
          });
        } else {
          setTimeout(function () {
            jumpHorizontal(monthKey);
          }, 0);
        }
      } else {
        if (y678FocusTsudo) {
          setTsudoFocus(false);
          applyFilterAndRedraw();
        }
        jumpHorizontal(jk);
      }
    });

    function fetch677Records(fields) {
      return kintone.api(kintone.api.url("/k/v1/records.json", true), "GET", {
        app: APP_INPUT,
        query: QUERY,
        fields: fields,
        totalCount: false,
      });
    }

    function load() {
      status.style.color = "#555";
      status.textContent = YOJITSU_LABEL_INPUT_APP + " から明細を読み込み中…";
      tblHost.innerHTML = "";
      y678OmitMonthlyCols = false;
      var timeoutMs = 70000;

      function attempt(fields) {
        return apiWithTimeout(fetch677Records(fields), timeoutMs).then(function (resp) {
          var list = (resp && resp.records) || [];
          lastRawRecords = list;
          lastTotalCount = list.length;
          applyFilterAndRedraw();
        });
      }

      return whenKintoneApiUrlReady(12000)
        .then(function () {
          return attempt(FETCH_FIELDS)
            .catch(function (e) {
              if (!y678OmitMonthlyCols && isRetriable677FieldError(e)) {
                y678OmitMonthlyCols = true;
                return attempt(FETCH_FIELDS_NO_MONTHLY);
              }
              return Promise.reject(e);
            });
        })
        .catch(function (e) {
          lastRawRecords = [];
          lastTotalCount = 0;
          status.style.color = "#b00020";
          status.textContent = formatApiError(e, YOJITSU_LABEL_INPUT_APP + " の一覧取得に失敗しました。");
        });
    }

    function doneEnable(btn) {
      btn.disabled = false;
    }

    function findRawRecord(rid) {
      for (var i = 0; i < lastRawRecords.length; i++) {
        var r = lastRawRecords[i];
        if (r && r.$id && String(r.$id.value) === String(rid)) return r;
      }
      return null;
    }

    /** 暦月ラベル（正規化済）の直後から FISCAL_ORDER 末尾までの月ラベル一覧 */
    function followingMonthLabelsAfter(monthLabel) {
      var lab = normalizeFiscalMonthLabel(monthLabel);
      var idx = -1;
      for (var i = 0; i < FISCAL_ORDER.length; i++) {
        if (FISCAL_ORDER[i] === lab) {
          idx = i;
          break;
        }
      }
      if (idx < 0) return [];
      return FISCAL_ORDER.slice(idx + 1);
    }

    /**
     * 複数月の `month_budget_revision` を同一値に更新（他フィールド・行 id は維持）。
     * @param {string[]} targetNormMonths 正規化済みの月度ラベル（例 ["8","9","10"]）
     */
    function buildMonthlyTablePutMultiRevision(rec, targetNormMonths, newValue) {
      var want = {};
      for (var t = 0; t < targetNormMonths.length; t++) want[targetNormMonths[t]] = true;
      var src = (rec.monthly_breakdown && rec.monthly_breakdown.value) || [];
      var out = [];
      var seen = {};
      for (var i = 0; i < src.length; i++) {
        var row = src[i] || {};
        var v = row.value || {};
        var cellVal = (v.fiscal_month || {}).value;
        var nl = normalizeFiscalMonthLabel(cellVal);
        var copy = {
          value: {
            fiscal_month: { value: cellVal == null ? "" : cellVal },
            month_budget: { value: ((v.month_budget || {}).value) || "" },
            month_actual: { value: ((v.month_actual || {}).value) || "" },
            month_budget_revision: { value: ((v.month_budget_revision || {}).value) || "" },
          },
        };
        if (row.id) copy.id = row.id;
        if (want[nl]) copy.value.month_budget_revision = { value: newValue };
        if (nl) seen[nl] = true;
        out.push(copy);
      }
      for (var fi = 0; fi < FISCAL_ORDER.length; fi++) {
        var mlab = FISCAL_ORDER[fi];
        if (want[mlab] && !seen[mlab]) {
          out.push({
            value: {
              fiscal_month: { value: mlab },
              month_budget: { value: "" },
              month_actual: { value: "" },
              month_budget_revision: { value: newValue },
            },
          });
        }
      }
      return out;
    }

    function buildMonthlyTablePut(rec, monthLabel, field, newValue) {
      var src = (rec.monthly_breakdown && rec.monthly_breakdown.value) || [];
      var out = [];
      var found = false;
      for (var i = 0; i < src.length; i++) {
        var row = src[i] || {};
        var v = row.value || {};
        var cellVal = (v.fiscal_month || {}).value;
        var copy = {
          value: {
            fiscal_month: { value: cellVal == null ? "" : cellVal },
            month_budget: { value: ((v.month_budget || {}).value) || "" },
            month_actual: { value: ((v.month_actual || {}).value) || "" },
            month_budget_revision: { value: ((v.month_budget_revision || {}).value) || "" },
          },
        };
        if (row.id) copy.id = row.id;
        if (normalizeFiscalMonthLabel(cellVal) === normalizeFiscalMonthLabel(monthLabel)) {
          copy.value[field] = { value: newValue };
          found = true;
        }
        out.push(copy);
      }
      if (!found) {
        var nrow = {
          value: {
            fiscal_month: { value: monthLabel },
            month_budget: { value: "" },
            month_actual: { value: "" },
            month_budget_revision: { value: "" },
          },
        };
        nrow.value[field] = { value: newValue };
        out.push(nrow);
      }
      return out;
    }

    /** 確認モーダル用の金額短文（HTML なし） */
    function formatYenPlainForDialog(nStr) {
      if (nStr === "") return "（空欄）";
      var n = Number(nStr);
      if (!isFinite(n)) return String(nStr);
      var i = n >= 0 ? Math.floor(n) : Math.ceil(n);
      var sign = i < 0 ? "-" : "";
      return sign + "¥" + String(Math.abs(i)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function restoreMonthRevisionCellDisplay(td, rec, monthLabel) {
      var mm = monthlyMapFromRecord(rec);
      var lab = normalizeFiscalMonthLabel(monthLabel);
      var rowM = mm[lab] || {};
      td.innerHTML = escNumCell(rowM.revision);
    }

    var revisionSpreadModal = null;
    var revisionSpreadOnKey = null;

    function ensureRevisionSpreadModal() {
      if (revisionSpreadModal) return revisionSpreadModal;
      revisionSpreadModal = document.createElement("div");
      revisionSpreadModal.className = "y678-modal y678-revision-spread-modal";
      revisionSpreadModal.style.display = "none";
      revisionSpreadModal.innerHTML = [
        "<div class=\"y678-modal-mask\" data-y678-revision-spread-dismiss=\"1\"></div>",
        "<div class=\"y678-modal-card\" role=\"dialog\" aria-modal=\"true\" style=\"width:min(520px,94vw)\">",
        "<div class=\"y678-modal-head\">予算修正の反映範囲</div>",
        "<div class=\"y678-modal-body\" style=\"grid-template-columns:1fr;display:block;padding-bottom:8px\">",
        "<p class=\"y678-revision-spread-msg\" style=\"margin:0 0 12px;line-height:1.55;font-size:13px;color:#1c3a26\"></p>",
        "<p style=\"margin:0;font-size:12px;color:#5e7a64\">はい＝翌月から当年度末（4月）まで<strong>同じ数値</strong>を書き込みます（フォーカス既定・SPEC §6）。いいえ＝入力対象月の行のみ。マスククリック・Esc＝保存せず閉じます。</p>",
        "</div>",
        "<div class=\"y678-modal-foot\" style=\"justify-content:center;gap:12px;flex-wrap:wrap\">",
        "<button type=\"button\" class=\"y678-modal-save y678-revision-spread-yes\">はい</button>",
        "<button type=\"button\" class=\"y678-modal-cancel y678-revision-spread-no\">いいえ</button>",
        "</div>",
        "</div>",
      ].join("");
      document.body.appendChild(revisionSpreadModal);
      return revisionSpreadModal;
    }

    function openRevisionSpreadDialog(amountDisplayText, onYes, onNo) {
      var el = ensureRevisionSpreadModal();
      var msg = el.querySelector(".y678-revision-spread-msg");
      var yesBtn = el.querySelector(".y678-revision-spread-yes");
      var noBtn = el.querySelector(".y678-revision-spread-no");
      var mask = el.querySelector(".y678-modal-mask");
      msg.textContent =
        "入力対象月（ランニング・固定費）の予算修正として入力した値（" +
        amountDisplayText +
        "）を、翌月〜当年度末（4月）の月次行にも同じ数値で反映しますか？";
      function closeOnly() {
        el.style.display = "none";
        if (revisionSpreadOnKey) {
          document.removeEventListener("keydown", revisionSpreadOnKey, true);
          revisionSpreadOnKey = null;
        }
        mask.onclick = null;
        yesBtn.onclick = null;
        noBtn.onclick = null;
      }
      revisionSpreadOnKey = function (ev) {
        if (ev.key === "Escape") {
          ev.preventDefault();
          closeOnly();
        }
      };
      document.addEventListener("keydown", revisionSpreadOnKey, true);
      mask.onclick = function () {
        closeOnly();
      };
      yesBtn.onclick = function () {
        closeOnly();
        onYes();
      };
      noBtn.onclick = function () {
        closeOnly();
        onNo();
      };
      el.style.display = "flex";
      setTimeout(function () {
        yesBtn.focus();
      }, 30);
    }

    function executeCellPut(td, rid, rev, recordFragment, statusDetail) {
      var body = { app: APP_INPUT, id: rid, revision: rev, record: recordFragment };
      if (td) td.classList.add("y678-saving");
      status.style.color = "#555";
      status.textContent = "保存中…" + (statusDetail || "");
      whenKintoneApiUrlReady(8000)
        .then(function () {
          return kintone.api(kintone.api.url("/k/v1/record.json", true), "PUT", body);
        })
        .then(function () {
          status.style.color = "#0a6b0a";
          status.textContent = "保存しました。再読込中…";
          return load();
        })
        .catch(function (e) {
          status.style.color = "#b00020";
          status.textContent = formatApiError(e, "セル編集の保存に失敗しました。");
          if (td) td.classList.remove("y678-saving");
        });
    }

    function commitCellEdit(td, rawValue) {
      var tr = td.closest("tr");
      if (!tr) return;
      var rid = tr.getAttribute("data-y678-id");
      var rev = tr.getAttribute("data-y678-rev");
      if (!rid) return;
      var cellKind = td.getAttribute("data-y678-cell");
      var field = td.getAttribute("data-y678-field");
      var monthLabel = td.getAttribute("data-y678-month") || "";

      var trimmed = String(rawValue || "").replace(/[,\s¥￥]/g, "");
      if (trimmed !== "") {
        var n = Number(trimmed);
        if (!isFinite(n)) {
          status.style.color = "#b00020";
          status.textContent = "数値で入力してください（カンマ・¥・空白は自動で除去）。";
          return;
        }
      }
      var sendValue = trimmed; // 空文字または数値文字列
      var rec = findRawRecord(rid);
      if (!rec) {
        status.style.color = "#b00020";
        status.textContent = "対象レコードがメモリに見つかりません。再読み込みしてください。";
        return;
      }

      var normMonth = normalizeFiscalMonthLabel(monthLabel);
      var curNorm = normalizeFiscalMonthLabel(getInputMonthLabel());
      var fut = followingMonthLabelsAfter(monthLabel);
      var askSpread =
        cellKind === "month" &&
        field === "month_budget_revision" &&
        fieldVal(rec, "cost_category") === "固定費" &&
        normMonth === curNorm &&
        fut.length > 0;

      if (askSpread) {
        restoreMonthRevisionCellDisplay(td, rec, monthLabel);
        var amtText = formatYenPlainForDialog(sendValue);
        openRevisionSpreadDialog(amtText, function onSpreadYes() {
          var tblSpread = buildMonthlyTablePutMultiRevision(rec, [normMonth].concat(fut), sendValue);
          executeCellPut(
            td,
            rid,
            rev,
            { monthly_breakdown: { value: tblSpread } },
            "（レコード #" + rid + " · 予算修正を翌月〜4月にも反映）"
          );
        }, function onSpreadNo() {
          var tblOne = buildMonthlyTablePut(rec, monthLabel, field, sendValue);
          executeCellPut(
            td,
            rid,
            rev,
            { monthly_breakdown: { value: tblOne } },
            "（レコード #" + rid + " · 予算修正は入力対象月のみ）"
          );
        });
        return;
      }

      var recordFragment = {};
      if (cellKind === "month") {
        recordFragment.monthly_breakdown = {
          value: buildMonthlyTablePut(rec, monthLabel, field, sendValue),
        };
      } else {
        recordFragment[field] = { value: sendValue };
      }
      executeCellPut(
        td,
        rid,
        rev,
        recordFragment,
        "（レコード #" + rid + " / " + (cellKind === "month" ? monthLabel + "月 " : "") + field + "）"
      );
    }

    function startCellEdit(td) {
      if (td.classList.contains("y678-editing")) return;
      td.classList.add("y678-editing");
      var orig = td.innerHTML;
      var rawText = td.textContent.replace(/[¥￥,\s]/g, "");
      var inp = document.createElement("input");
      inp.type = "number";
      inp.step = "1";
      inp.className = "y678-edit-input";
      inp.value = /^-?\d+(\.\d+)?$/.test(rawText) ? String(Math.trunc(Number(rawText))) : "";
      td.innerHTML = "";
      td.appendChild(inp);
      inp.focus();
      inp.select();
      var done = false;
      function cancel() {
        if (done) return;
        done = true;
        td.classList.remove("y678-editing");
        td.innerHTML = orig;
      }
      function save() {
        if (done) return;
        done = true;
        td.classList.remove("y678-editing");
        commitCellEdit(td, inp.value);
      }
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          save();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      });
      inp.addEventListener("blur", function () {
        setTimeout(save, 0);
      });
    }

    tblHost.addEventListener("click", function (ev) {
      var sortTh = ev.target && ev.target.closest && ev.target.closest("th[data-y678-sort]");
      if (sortTh && tblHost.contains(sortTh)) {
        ev.preventDefault();
        var f = sortTh.getAttribute("data-y678-sort");
        if (y678Sort.field !== f) {
          y678Sort.field = f;
          y678Sort.dir = "asc";
        } else if (y678Sort.dir === "asc") {
          y678Sort.dir = "desc";
        } else {
          y678Sort.field = null;
          y678Sort.dir = null;
        }
        applyFilterAndRedraw();
        return;
      }
      var paymentTd = ev.target && ev.target.closest && ev.target.closest(".y678-edit-payment");
      if (paymentTd && tblHost.contains(paymentTd)) {
        ev.preventDefault();
        var ptr = paymentTd.closest("tr");
        var prid = ptr ? ptr.getAttribute("data-y678-id") : null;
        var pmonth = paymentTd.getAttribute("data-y678-month");
        if (prid) openPaymentModal(prid, pmonth);
        return;
      }
      var editTd = ev.target && ev.target.closest && ev.target.closest(".y678-edit");
      if (editTd && tblHost.contains(editTd) && !editTd.classList.contains("y678-editing")) {
        ev.preventDefault();
        startCellEdit(editTd);
        return;
      }
      var btn = ev.target && ev.target.closest && ev.target.closest(".y678-display-order-save");
      if (!btn) return;
      var tr = btn.closest("tr");
      if (!tr || !tr.getAttribute) return;
      var rid = tr.getAttribute("data-y678-id");
      var rev = tr.getAttribute("data-y678-rev");
      var inp = tr.querySelector(".y678-display-order-input");
      if (!rid || !inp) return;
      if (rev === "") {
        status.style.color = "#b00020";
        status.textContent =
          "レコードのリビジョンが取得できません。再読み込みしてから保存してください。（" +
          YOJITSU_LABEL_INPUT_APP +
          " のフィールド取得権限も確認）";
        return;
      }
      var raw = inp.value;
      var numVal = raw === "" ? null : Number(raw);
      if (raw !== "" && (typeof numVal !== "number" || isNaN(numVal))) {
        status.style.color = "#b00020";
        status.textContent = "表示順は数値または空欄にしてください。";
        return;
      }
      btn.disabled = true;
      status.style.color = "#555";
      status.textContent = "表示順を保存中…（レコード #" + rid + "）";
      var body = {
        app: APP_INPUT,
        id: rid,
        revision: rev,
        record: {},
      };
      if (raw === "") {
        body.record.display_order = { value: "" };
      } else {
        body.record.display_order = { value: String(numVal) };
      }
      whenKintoneApiUrlReady(8000)
        .then(function () {
          return kintone.api(kintone.api.url("/k/v1/record.json", true), "PUT", body);
        })
        .then(function () {
          status.style.color = "#0a6b0a";
          status.textContent = "表示順を保存しました。一覧を更新します。";
          return load();
        })
        .catch(function (e) {
          status.style.color = "#b00020";
          status.textContent = formatApiError(e, "表示順の保存に失敗しました。");
        })
        .then(
          function () {
            doneEnable(btn);
          },
          function () {
            doneEnable(btn);
          }
        );
    });

    var refreshBtn = head.querySelector("#y678-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        load();
      });
    }

    function buildEmptyMonthlyTable() {
      var arr = [];
      for (var i = 0; i < FISCAL_ORDER.length; i++) {
        arr.push({
          value: {
            fiscal_month: { value: FISCAL_ORDER[i] },
            month_budget: { value: "" },
            month_actual: { value: "" },
            month_budget_revision: { value: "0" },
          },
        });
      }
      return arr;
    }

    /** display_order 採番の既定ステップ（migration の 100 刻みと整合） */
    var DISPLAY_ORDER_STEP = 100;

    /** lastRawRecords を display_order 昇順に並べたコピーを返す（DeepSeek (a) 対策で必ず Number 化） */
    function getSortedRecordsByDisplayOrder() {
      var arr = [];
      for (var i = 0; i < lastRawRecords.length; i++) arr.push(lastRawRecords[i]);
      arr.sort(function (a, b) {
        var da = Number((a.display_order || {}).value || 0) || 0;
        var db = Number((b.display_order || {}).value || 0) || 0;
        if (da !== db) return da - db;
        var ia = Number((a.$id || {}).value || 0) || 0;
        var ib = Number((b.$id || {}).value || 0) || 0;
        return ia - ib;
      });
      return arr;
    }

    /** 既存最大 display_order + STEP（一番下に追加用） */
    function nextDisplayOrder() {
      var max = 0;
      for (var i = 0; i < lastRawRecords.length; i++) {
        var v = (lastRawRecords[i].display_order || {}).value;
        if (v != null && v !== "" && isFinite(Number(v))) {
          var n = Number(v);
          if (n > max) max = n;
        }
      }
      return max + DISPLAY_ORDER_STEP;
    }

    /**
     * モーダルでの「挿入位置」指定から保存する display_order を計算する。
     * @param {"bottom"|"top"|"after"|"before"} mode
     * @param {string|number} targetId  mode=after/before のときの基準レコード $id
     * @returns {{ value: number|null, conflict: boolean, message: string }}
     *   conflict=true は隣接行と display_order の差が 1 で中間値が取れない状態。
     *   その場合は呼び出し側で再採番を促す（v1 では再採番スクリプトの再実行を案内）。
     */
    function computeInsertDisplayOrder(mode, targetId) {
      var sorted = getSortedRecordsByDisplayOrder();
      if (sorted.length === 0) {
        return { value: DISPLAY_ORDER_STEP, conflict: false, message: "初回追加: " + DISPLAY_ORDER_STEP };
      }
      function doVal(r) {
        return Number((r.display_order || {}).value || 0) || 0;
      }
      if (mode === "bottom") {
        var last = sorted[sorted.length - 1];
        return { value: doVal(last) + DISPLAY_ORDER_STEP, conflict: false, message: "一番下: " + (doVal(last) + DISPLAY_ORDER_STEP) };
      }
      if (mode === "top") {
        var first = sorted[0];
        var firstDo = doVal(first);
        if (firstDo >= 2) {
          return { value: Math.floor(firstDo / 2), conflict: false, message: "一番上: " + Math.floor(firstDo / 2) };
        }
        return { value: null, conflict: true, message: "一番上に追加するには再採番が必要です（先頭行の display_order=" + firstDo + "）" };
      }
      // after / before: targetId 検索
      var idx = -1;
      var tid = String(targetId || "");
      for (var i = 0; i < sorted.length; i++) {
        if (String((sorted[i].$id || {}).value) === tid) {
          idx = i;
          break;
        }
      }
      if (idx === -1) {
        return { value: null, conflict: false, message: "基準行が見つかりません（targetId=" + tid + "）" };
      }
      if (mode === "after") {
        var cur = doVal(sorted[idx]);
        var next = idx + 1 < sorted.length ? doVal(sorted[idx + 1]) : cur + DISPLAY_ORDER_STEP * 2;
        if (next - cur >= 2) {
          return { value: Math.floor((cur + next) / 2), conflict: false, message: "id=" + tid + " の下: " + Math.floor((cur + next) / 2) };
        }
        return { value: null, conflict: true, message: "id=" + tid + " の下は隣接行（" + next + "）と隙間がなく、再採番が必要です" };
      }
      if (mode === "before") {
        var c2 = doVal(sorted[idx]);
        var prev = idx - 1 >= 0 ? doVal(sorted[idx - 1]) : 0;
        if (c2 - prev >= 2) {
          return { value: Math.floor((prev + c2) / 2), conflict: false, message: "id=" + tid + " の上: " + Math.floor((prev + c2) / 2) };
        }
        return { value: null, conflict: true, message: "id=" + tid + " の上は隣接行（" + prev + "）と隙間がなく、再採番が必要です" };
      }
      return { value: null, conflict: false, message: "不明なモード: " + mode };
    }

    /** ドロップダウン用ラベル: "工種名称 / 摘要先頭40字 (id=N)" */
    function formatRecordOption(rec) {
      var id = (rec.$id || {}).value || "";
      var wn = (rec.work_type_name || {}).value || "";
      var st = ((rec.summary_text || {}).value || "").slice(0, 40);
      return wn + " / " + st + " (id=" + id + ")";
    }

    var modalEl = null;
    function ensureModal() {
      if (modalEl) return modalEl;
      modalEl = document.createElement("div");
      modalEl.className = "y678-modal";
      modalEl.style.display = "none";
      modalEl.innerHTML = [
        "<div class=\"y678-modal-mask\" data-y678-modal-close=\"1\"></div>",
        "<div class=\"y678-modal-card\" role=\"dialog\" aria-modal=\"true\">",
        "<div class=\"y678-modal-head\">＋ 新規明細を追加 <span class=\"y678-modal-sub\">（" +
          YOJITSU_LABEL_INPUT_APP +
          " にレコードを作成）</span></div>",
        "<div class=\"y678-modal-body\">",
        "<label>工種名称 <span class=\"req\">*</span><input type=\"text\" name=\"work_type_name\" maxlength=\"255\" required /></label>",
        "<label>工種コード<input type=\"text\" name=\"work_type_code\" maxlength=\"255\" /></label>",
        "<label>費用種別 <span class=\"req\">*</span><select name=\"cost_category\" required><option value=\"\">（選択してください）</option><option value=\"固定費\">固定費</option><option value=\"変動費\">変動費</option></select></label>",
        "<label>支払種別 <span class=\"req\">*</span><select name=\"payment_type\" required><option value=\"\">（選択してください）</option><option value=\"月額\">月額</option><option value=\"年額\">年額</option><option value=\"都度\">都度</option></select><span class=\"y678-modal-sub\" style=\"display:block;margin-top:2px;font-weight:normal\">支払種別は <strong>月額</strong>（毎月定額）・<strong>年額</strong>（年に一度の計上）・<strong>都度</strong>（変動費の都度支払）のいずれか。費用種別に連動: 変動費→都度、固定費の既定は月額（年１セルだけの契約は年額へ変更）</span></label>",
        "<label class=\"y678-wide\">摘要 <span class=\"req\">*</span><input type=\"text\" name=\"summary_text\" maxlength=\"500\" required /></label>",
        "<label>会社<input type=\"text\" name=\"partner_company\" maxlength=\"255\" /></label>",
        "<label>ランニング（定額）<input type=\"number\" name=\"learning_fixed_budget\" step=\"1\" min=\"0\" /></label>",
        "<label>イニシャル（変動）<input type=\"number\" name=\"initial_variable_budget\" step=\"1\" min=\"0\" /></label>",
        "<label class=\"y678-wide\">挿入位置 <span class=\"req\">*</span>",
        "<select name=\"insert_mode\">",
        "<option value=\"bottom\">一番下に追加（既定）</option>",
        "<option value=\"top\">一番上に追加</option>",
        "<option value=\"after\">下記行の【下】に追加</option>",
        "<option value=\"before\">下記行の【上】に追加</option>",
        "</select></label>",
        "<label class=\"y678-wide y678-insert-target-wrap\" style=\"display:none\">基準行 <span class=\"y678-insert-target-hint\">（工種名称 / 摘要 で探してください）</span>",
        "<select name=\"insert_target_id\"></select></label>",
        "<div class=\"y678-insert-preview\" style=\"grid-column:1 / -1; padding:6px 10px; background:#f3f7f4; border:1px solid #cfe1d4; border-radius:4px; color:#2f6f4d; font-size:12px;\">→ 表示順は自動計算されます</div>",
        "<label class=\"y678-wide\">備考<textarea name=\"notes\" rows=\"2\" maxlength=\"10000\"></textarea></label>",
        "</div>",
        "<div class=\"y678-modal-status\"></div>",
        "<div class=\"y678-modal-foot\">",
        "<button type=\"button\" class=\"y678-modal-cancel\" data-y678-modal-close=\"1\">キャンセル</button>",
        "<button type=\"button\" class=\"y678-modal-save\">保存して追加</button>",
        "</div>",
        "</div>",
      ].join("");
      document.body.appendChild(modalEl);

      modalEl.addEventListener("click", function (e) {
        if (e.target && e.target.getAttribute && e.target.getAttribute("data-y678-modal-close") === "1") {
          closeModal();
        }
      });
      var saveBtn = modalEl.querySelector(".y678-modal-save");
      saveBtn.addEventListener("click", submitNewRecord);
      modalEl.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeModal();
      });
      if (modalEl.dataset.paymentTypeSyncAttached !== "1") {
        modalEl.dataset.paymentTypeSyncAttached = "1";
        var ccSel = modalEl.querySelector("select[name='cost_category']");
        if (ccSel) {
          ccSel.addEventListener("change", function () {
            var catEl = modalEl.querySelector("select[name='cost_category']");
            var payEl = modalEl.querySelector("select[name='payment_type']");
            if (!catEl || !payEl) return;
            var c = catEl.value;
            if (c === "変動費") payEl.value = "都度";
            else if (c === "固定費") {
              if (payEl.value === "都度" || payEl.value === "") payEl.value = "月額";
            } else {
              payEl.value = "";
            }
          });
        }
      }
      return modalEl;
    }

    function refreshInsertPreview() {
      if (!modalEl) return;
      var modeEl = modalEl.querySelector("select[name='insert_mode']");
      var tgtEl = modalEl.querySelector("select[name='insert_target_id']");
      var tgtWrap = modalEl.querySelector(".y678-insert-target-wrap");
      var preview = modalEl.querySelector(".y678-insert-preview");
      if (!modeEl || !preview) return;
      var mode = modeEl.value;
      var needTarget = mode === "after" || mode === "before";
      if (tgtWrap) tgtWrap.style.display = needTarget ? "" : "none";
      var targetId = needTarget && tgtEl ? tgtEl.value : "";
      var r = computeInsertDisplayOrder(mode, targetId);
      if (r.conflict) {
        preview.style.background = "#fff3cd";
        preview.style.borderColor = "#ffd966";
        preview.style.color = "#7a5800";
        preview.textContent = "⚠ " + r.message + "（このまま保存できません）";
      } else if (r.value == null) {
        preview.style.background = "#fde2e2";
        preview.style.borderColor = "#f0a3a3";
        preview.style.color = "#a02020";
        preview.textContent = "✗ " + r.message;
      } else {
        preview.style.background = "#f3f7f4";
        preview.style.borderColor = "#cfe1d4";
        preview.style.color = "#2f6f4d";
        preview.textContent = "→ 保存後の display_order = " + r.value + "（" + r.message + "）";
      }
    }

    function populateInsertTargetOptions() {
      if (!modalEl) return;
      var sel = modalEl.querySelector("select[name='insert_target_id']");
      if (!sel) return;
      var sorted = getSortedRecordsByDisplayOrder();
      var html = "";
      for (var i = 0; i < sorted.length; i++) {
        var rec = sorted[i];
        var id = (rec.$id || {}).value || "";
        html += "<option value=\"" + esc(id) + "\">" + esc(formatRecordOption(rec)) + "</option>";
      }
      sel.innerHTML = html;
    }

    function attachInsertHandlers() {
      if (!modalEl || modalEl.dataset.insertHandlersAttached === "1") return;
      var modeEl = modalEl.querySelector("select[name='insert_mode']");
      var tgtEl = modalEl.querySelector("select[name='insert_target_id']");
      if (modeEl) modeEl.addEventListener("change", refreshInsertPreview);
      if (tgtEl) tgtEl.addEventListener("change", refreshInsertPreview);
      modalEl.dataset.insertHandlersAttached = "1";
    }

    function openModal() {
      ensureModal();
      modalEl.style.display = "flex";
      modalEl.querySelector(".y678-modal-status").textContent = "";
      modalEl.querySelector(".y678-modal-status").style.color = "#555";
      var form = modalEl.querySelector(".y678-modal-body");
      var inputs = form.querySelectorAll("input,select,textarea");
      for (var i = 0; i < inputs.length; i++) inputs[i].value = "";
      var modeEl = modalEl.querySelector("select[name='insert_mode']");
      if (modeEl) modeEl.value = "bottom";
      populateInsertTargetOptions();
      attachInsertHandlers();
      refreshInsertPreview();
      var first = modalEl.querySelector("input[name='work_type_name']");
      if (first) first.focus();
    }

    function closeModal() {
      if (!modalEl) return;
      modalEl.style.display = "none";
    }

    function submitNewRecord() {
      var statusEl = modalEl.querySelector(".y678-modal-status");
      var saveBtn = modalEl.querySelector(".y678-modal-save");
      function val(name) {
        var el = modalEl.querySelector("[name='" + name + "']");
        return el ? String(el.value || "").trim() : "";
      }
      var work = val("work_type_name");
      var summary = val("summary_text");
      var costCat = val("cost_category");
      if (!work) {
        statusEl.style.color = "#b00020";
        statusEl.textContent = "「工種名称」は必須です。";
        return;
      }
      if (!summary) {
        statusEl.style.color = "#b00020";
        statusEl.textContent = "「摘要」は必須です。";
        return;
      }
      if (costCat !== "固定費" && costCat !== "変動費") {
        statusEl.style.color = "#b00020";
        statusEl.textContent = "「費用種別」は 固定費 または 変動費 を選択してください。";
        return;
      }
      var payType = val("payment_type");
      if (costCat === "変動費") payType = "都度";
      else if (costCat === "固定費") {
        if (!payType || payType === "都度") payType = "月額";
      }
      var paySelSync = modalEl.querySelector("select[name='payment_type']");
      if (paySelSync) paySelSync.value = payType;
      if (payType !== "月額" && payType !== "年額" && payType !== "都度") {
        statusEl.style.color = "#b00020";
        statusEl.textContent = "「支払種別」は 月額 / 年額 / 都度 から選択してください。";
        return;
      }
      var insertMode = val("insert_mode") || "bottom";
      var insertTargetId = val("insert_target_id");
      var doRes = computeInsertDisplayOrder(insertMode, insertTargetId);
      if (doRes.conflict) {
        statusEl.style.color = "#b00020";
        statusEl.textContent =
          "挿入位置エラー: " +
          doRes.message +
          "／" +
          YOJITSU_LABEL_INPUT_APP +
          " の display_order を再採番（管理者向け: scripts/yojitsu-677-reset-display-order.mjs --apply）後に再試行してください。";
        return;
      }
      if (doRes.value == null) {
        statusEl.style.color = "#b00020";
        statusEl.textContent = "挿入位置エラー: " + doRes.message;
        return;
      }
      function numCell(v) {
        var t = String(v || "").replace(/[,\s¥￥]/g, "");
        if (t === "") return { value: "" };
        return { value: String(Math.trunc(Number(t))) };
      }
      var rec = {
        work_type_name: { value: work.slice(0, 255) },
        work_type_code: { value: val("work_type_code").slice(0, 255) },
        cost_category: { value: costCat },
        payment_type: { value: payType },
        summary_text: { value: summary.slice(0, 10000) },
        partner_company: { value: val("partner_company").slice(0, 255) },
        learning_fixed_budget: numCell(val("learning_fixed_budget")),
        initial_variable_budget: numCell(val("initial_variable_budget")),
        display_order: { value: String(doRes.value) },
        notes: { value: val("notes").slice(0, 10000) },
        monthly_breakdown: { value: buildEmptyMonthlyTable() },
      };
      saveBtn.disabled = true;
      statusEl.style.color = "#555";
      statusEl.textContent = YOJITSU_LABEL_INPUT_APP + " にレコードを作成中…";
      whenKintoneApiUrlReady(8000)
        .then(function () {
          return kintone.api(kintone.api.url("/k/v1/record.json", true), "POST", { app: APP_INPUT, record: rec });
        })
        .then(function (resp) {
          statusEl.style.color = "#0a6b0a";
          statusEl.textContent = "作成しました（id=" + (resp && resp.id ? resp.id : "?") + "）。一覧を更新します。";
          setTimeout(closeModal, 600);
          return load();
        })
        .catch(function (e) {
          statusEl.style.color = "#b00020";
          statusEl.textContent = formatApiError(e, "明細の追加に失敗しました。");
        })
        .then(
          function () {
            saveBtn.disabled = false;
          },
          function () {
            saveBtn.disabled = false;
          }
        );
    }

    var addBtn = actionRow.querySelector("#y678-add");
    if (addBtn) addBtn.addEventListener("click", openModal);

    /* ===== 実績入力モーダル（payment_breakdown 行追加 + 月次実績ロールアップ） ===== */
    function defaultPaymentDate(monthLabel) {
      var today = new Date();
      var ny = today.getFullYear();
      if (!monthLabel) {
        return ny + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
      }
      var m = parseInt(monthLabel, 10);
      if (!isFinite(m) || m < 1 || m > 12) return today.toISOString().slice(0, 10);
      var thisMonth = today.getMonth() + 1;
      var year = today.getFullYear();
      if (thisMonth >= 5) {
        if (m < 5) year = year + 1;
      } else {
        if (m >= 5) year = year - 1;
      }
      return year + "-" + ("0" + m).slice(-2) + "-01";
    }

    function rollupActualByMonth(paymentRows) {
      var sums = {};
      for (var i = 0; i < paymentRows.length; i++) {
        var v = (paymentRows[i] || {}).value || {};
        var d = ((v.payment_date || {}).value) || "";
        var amt = toNum((v.payment_amount || {}).value);
        if (!d) continue;
        var m = d.match(/^\d+-(\d{2})-/);
        if (!m) continue;
        var lab = String(parseInt(m[1], 10));
        sums[lab] = (sums[lab] || 0) + amt;
      }
      return sums;
    }

    function buildMonthlyTableForPayments(rec, sums) {
      var src = (rec.monthly_breakdown && rec.monthly_breakdown.value) || [];
      var seen = {};
      var out = [];
      for (var i = 0; i < src.length; i++) {
        var row = src[i] || {};
        var v = row.value || {};
        var lab = normalizeFiscalMonthLabel((v.fiscal_month || {}).value);
        seen[lab] = true;
        var actualVal = sums[lab] != null ? String(sums[lab]) : ((v.month_actual || {}).value || "");
        var copy = {
          value: {
            fiscal_month: { value: lab },
            month_budget: { value: ((v.month_budget || {}).value) || "" },
            month_actual: { value: actualVal },
            month_budget_revision: { value: ((v.month_budget_revision || {}).value) || "" },
          },
        };
        if (row.id) copy.id = row.id;
        out.push(copy);
      }
      for (var lab2 in sums) {
        if (seen[lab2]) continue;
        out.push({
          value: {
            fiscal_month: { value: lab2 },
            month_budget: { value: "" },
            month_actual: { value: String(sums[lab2]) },
            month_budget_revision: { value: "0" },
          },
        });
      }
      return out;
    }

    function normalizePartnerCompanyLabel(s) {
      return String(s || "")
        .trim()
        .replace(/[\u3000\s]+/g, " ")
        .trim();
    }

    /**
     * 677 の会社ドロップダウン想定の集合先・プレースホルダ（datalist と「新規登録」導線の共通正）。
     * 表記ゆれ（中点・全角空白）は比較時に無視する。
     */
    var PARTNER_DROPDOWN_PRESETS = [
      "FBJ",
      "オフィスバスター",
      "オフィス・バスター",
      "クロネコヤマト",
      "佐川急便",
      "クロネコヤマト、佐川急便",
      "その他",
      "他",
      "他のもの",
      "他や各社",
      "各社",
      "他社",
      "（未設定）",
      "購入先未定",
      "未設定",
      "未定",
    ];

    function partnerCompanyNormKey(s) {
      var t = normalizePartnerCompanyLabel(s);
      try {
        if (t && String.prototype.normalize) t = String(t).normalize("NFKC");
      } catch (eNfk) {
        void eNfk;
      }
      return String(t || "")
        .toLowerCase()
        .replace(/[\s\u3000・.]/g, "")
        .replace(/[（）()]/g, "");
    }

    var PARTNER_AGGREGATE_KEY = {};
    (function fillPartnerAggregateKeys() {
      for (var pi = 0; pi < PARTNER_DROPDOWN_PRESETS.length; pi++) {
        var k = partnerCompanyNormKey(PARTNER_DROPDOWN_PRESETS[pi]);
        if (k) PARTNER_AGGREGATE_KEY[k] = true;
      }
      PARTNER_AGGREGATE_KEY["fbj"] = true;
      PARTNER_AGGREGATE_KEY["tbd"] = true;
    })();

    /**
     * 「会社を新規登録する」・候補 select・datalist・会社欄直接編集を出す条件（集合先・未確定・会社欄の「その他」等）。
     * 費用種別は固定費／変動費のみを想定し、費用種別「その他」ではここを開かない（会社の集合先「その他」と別物）。
     * 677 の表記ゆれ（全角英字・括弧付き）も拾う。
     */
    function showPartnerNewRegisterButton(rec) {
      var p = normalizePartnerCompanyLabel(fieldVal(rec, "partner_company"));
      if (!p) return true;
      var nk = partnerCompanyNormKey(p);
      if (PARTNER_AGGREGATE_KEY[nk]) return true;
      if (/（未設定）|購入先未定/.test(p)) return true;
      if (p === "未設定" || p === "未定" || /^TBD$/i.test(p)) return true;
      if (nk.indexOf("fbj") !== -1 && nk.length <= 16) return true;
      if (/オフィス/.test(p) && (/バスター/i.test(p) || /buster/i.test(nk))) return true;
      if (/^他($|の|や)|^他のもの|^他や各社/.test(p) || /^他の[^、]{1,12}$/.test(p)) return true;
      if (/^その他([（(]|$)/.test(p)) return true;
      if (/^各社($|[（(])/.test(p)) return true;
      return false;
    }

    var payModal = null;
    function ensurePaymentModal() {
      if (payModal) return payModal;
      var partnerDlParts = ["<datalist id=\"y678-partner-datalist\">"];
      for (var _di = 0; _di < PARTNER_DROPDOWN_PRESETS.length; _di++) {
        partnerDlParts.push("<option value=\"" + attrEsc(PARTNER_DROPDOWN_PRESETS[_di]) + "\"></option>");
      }
      partnerDlParts.push("</datalist>");
      var partnerDatalistHtml = partnerDlParts.join("");
      payModal = document.createElement("div");
      payModal.className = "y678-modal";
      payModal.style.display = "none";
      payModal.innerHTML = [
        "<div class=\"y678-modal-mask\" data-y678-modal-close=\"1\"></div>",
        "<div class=\"y678-modal-card\" role=\"dialog\" aria-modal=\"true\">",
        "<div class=\"y678-modal-head\">実績入力 <span class=\"y678-modal-sub\">（" +
          YOJITSU_LABEL_INPUT_APP +
          " の支払内訳に 1 行追加 → 月次実績を再集計。請求書単位は行を分けて複数回保存可）</span></div>",
        "<div class=\"y678-modal-body\">",
        partnerDatalistHtml,
        "<div class=\"y678-wide y678-pay-existing-wrap\"></div>",
        "<label>支払日 <span class=\"req\">*</span><input type=\"date\" name=\"payment_date\" required /></label>",
        "<label>金額 <span class=\"req\">*</span><input type=\"number\" name=\"payment_amount\" step=\"1\" min=\"0\" required /></label>",
        "<label class=\"y678-wide\">摘要 <span class=\"y678-pay-summary-hint\">（編集不可・親レコードの摘要・修正は " +
          YOJITSU_LABEL_INPUT_APP +
          " で）</span><textarea name=\"summary_text\" rows=\"2\" readonly></textarea></label>",
        "<label class=\"y678-wide\">摘要（補足）<span class=\"y678-pay-summary-hint\">（追加情報を書く欄。" +
          YOJITSU_LABEL_INPUT_APP +
          " の「摘要（補足）」に上書き保存）</span><textarea name=\"summary_supplement\" rows=\"3\" maxlength=\"10000\"></textarea></label>",
        "<label class=\"y678-wide\">会社<span class=\"y678-pay-partner-hint y678-pay-summary-hint\"></span>" +
          "<select class=\"y678-pay-partner-preset\" aria-label=\"会社の候補から選択\" style=\"display:none\"></select>" +
          "<input type=\"text\" name=\"partner_company\" maxlength=\"255\" readonly /></label>",
        "<div class=\"y678-wide y678-pay-partner-new-wrap\" style=\"display:none;grid-column:1 / -1;margin-top:-4px\">",
        "<button type=\"button\" class=\"y678-pay-partner-newbtn\">会社を新規登録する</button>",
        "</div>",
        "<div class=\"y678-wide y678-pay-link\" data-y678-pay-parentlink></div>",
        "<label>枠種別<select name=\"budget_bucket\"><option value=\"\">（未選択）</option><option value=\"ランニング費用（定額費）\">ランニング費用（定額費）</option><option value=\"イニシャル費用（変動費）\">イニシャル費用（変動費）</option></select></label>",
        "<label>請求書番号<input type=\"text\" name=\"invoice_number\" maxlength=\"255\" /></label>",
        "<label class=\"y678-wide\">メモ<textarea name=\"payment_memo\" rows=\"2\" maxlength=\"10000\"></textarea></label>",
        "</div>",
        "<div class=\"y678-modal-status\"></div>",
        "<div class=\"y678-modal-foot\">",
        "<button type=\"button\" class=\"y678-modal-cancel\" data-y678-modal-close=\"1\">キャンセル</button>",
        "<button type=\"button\" class=\"y678-modal-save y678-pay-save\">支払を追加</button>",
        "</div>",
        "</div>",
      ].join("");
      document.body.appendChild(payModal);
      payModal.addEventListener("click", function (e) {
        if (e.target && e.target.getAttribute && e.target.getAttribute("data-y678-modal-close") === "1") {
          closePaymentModal();
        }
      });
      payModal.querySelector(".y678-pay-save").addEventListener("click", submitPayment);
      payModal.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closePaymentModal();
      });
      var presetPartnerSel = payModal.querySelector(".y678-pay-partner-preset");
      if (presetPartnerSel && !presetPartnerSel.getAttribute("data-y678-bound")) {
        presetPartnerSel.setAttribute("data-y678-bound", "1");
        presetPartnerSel.addEventListener("change", function () {
          var v = presetPartnerSel.value;
          if (!v) return;
          var pcIn = payModal.querySelector("[name='partner_company']");
          if (!pcIn) return;
          pcIn.value = v;
          try {
            pcIn.focus();
          } catch (ePf) {
            void ePf;
          }
        });
      }
      var newPartnerBtn = payModal.querySelector(".y678-pay-partner-newbtn");
      if (newPartnerBtn) {
        newPartnerBtn.addEventListener("click", function () {
          var pcEl = payModal.querySelector("[name='partner_company']");
          var hint = payModal.querySelector(".y678-pay-partner-hint");
          if (!pcEl) return;
          payModal.setAttribute("data-y678-partner-unlocked", "1");
          pcEl.removeAttribute("readonly");
          pcEl.removeAttribute("title");
          pcEl.focus();
          pcEl.select();
          if (hint) {
            hint.style.display = "block";
            hint.textContent =
              "正式名称を入力し「支払を追加」で保存すると、親レコード（" +
              YOJITSU_LABEL_INPUT_APP +
              "）の会社欄が更新されます。";
          }
          newPartnerBtn.disabled = true;
          newPartnerBtn.textContent = "会社欄を編集できます（保存で " + YOJITSU_LABEL_INPUT_APP + " に反映）";
        });
      }
      return payModal;
    }

    function closePaymentModal() {
      if (!payModal) return;
      payModal.style.display = "none";
      payModal.removeAttribute("data-y678-rid");
      payModal.removeAttribute("data-y678-partner-unlocked");
      var pcReset = payModal.querySelector("[name='partner_company']");
      if (pcReset) {
        pcReset.setAttribute("readonly", "readonly");
        pcReset.removeAttribute("list");
        pcReset.removeAttribute("placeholder");
      }
      var presetReset = payModal.querySelector(".y678-pay-partner-preset");
      if (presetReset) {
        presetReset.style.display = "none";
        presetReset.innerHTML = "";
      }
      var nb = payModal.querySelector(".y678-pay-partner-newbtn");
      if (nb) {
        nb.disabled = false;
        nb.textContent = "会社を新規登録する";
      }
    }

    function openPaymentModal(rid, monthLabel) {
      var rec = findRawRecord(rid);
      if (!rec) {
        status.style.color = "#b00020";
        status.textContent = "対象レコードが見つかりません。再読み込みしてください。";
        return;
      }
      ensurePaymentModal();
      payModal.style.display = "flex";
      payModal.setAttribute("data-y678-rid", String(rid));
      var st = payModal.querySelector(".y678-modal-status");
      st.textContent = "";
      st.style.color = "#555";
      var qs = function (n) { return payModal.querySelector("[name='" + n + "']"); };
      qs("payment_date").value = defaultPaymentDate(monthLabel);
      qs("payment_amount").value = "";
      qs("summary_text").value = fieldVal(rec, "summary_text") || "";
      qs("summary_supplement").value = fieldVal(rec, "summary_supplement") || "";
      payModal.removeAttribute("data-y678-partner-unlocked");
      var pcEl = qs("partner_company");
      pcEl.value = fieldVal(rec, "partner_company") || "";
      var showNew = showPartnerNewRegisterButton(rec);
      var presetW = payModal.querySelector(".y678-pay-partner-preset");
      if (showNew) {
        pcEl.removeAttribute("readonly");
        pcEl.setAttribute("list", "y678-partner-datalist");
        pcEl.setAttribute(
          "placeholder",
          "上の候補で選ぶか、ここに直接入力（宅配は表に「クロネコヤマト、佐川急便」併記／実績で片方に確定／FBJ 等）"
        );
        pcEl.setAttribute(
          "title",
          "上の一覧で選ぶか入力。" +
            YOJITSU_LABEL_INPUT_APP +
            " の会社がドロップダウンのときは、選択肢に無い文字列は保存エラーになります。「会社を新規登録する」で入力欄にフォーカスできます。"
        );
        if (presetW) {
          var curPc = normalizePartnerCompanyLabel(fieldVal(rec, "partner_company") || "");
          var optParts = [
            "<option value=\"\">--- 候補から選ぶ（宅配：クロネコヤマト、佐川急便／各社／FBJ・その他ほか） ---</option>",
          ];
          for (var pi = 0; pi < PARTNER_DROPDOWN_PRESETS.length; pi++) {
            var labp = PARTNER_DROPDOWN_PRESETS[pi];
            optParts.push("<option value=\"" + attrEsc(labp) + "\">" + esc(labp) + "</option>");
          }
          var seenCur = false;
          if (curPc) {
            for (var pj = 0; pj < PARTNER_DROPDOWN_PRESETS.length; pj++) {
              if (partnerCompanyNormKey(PARTNER_DROPDOWN_PRESETS[pj]) === partnerCompanyNormKey(curPc)) {
                seenCur = true;
                break;
              }
            }
            if (!seenCur) {
              optParts.push(
                "<option value=\"" +
                  attrEsc(curPc) +
                  "\">現在の値: " +
                  esc(curPc) +
                  "</option>"
              );
            }
          }
          presetW.innerHTML = optParts.join("");
          presetW.style.display = "block";
          presetW.disabled = false;
          if (curPc) {
            for (var oi = 0; oi < presetW.options.length; oi++) {
              var opv = presetW.options[oi].value;
              if (opv && partnerCompanyNormKey(opv) === partnerCompanyNormKey(curPc)) {
                presetW.selectedIndex = oi;
                break;
              }
            }
          } else {
            presetW.selectedIndex = 0;
          }
        }
      } else {
        pcEl.setAttribute("readonly", "readonly");
        pcEl.removeAttribute("list");
        pcEl.removeAttribute("placeholder");
        pcEl.setAttribute("title", "確定取引先は親レコード（" + YOJITSU_LABEL_INPUT_APP + "）で変更してください");
        if (presetW) {
          presetW.style.display = "none";
          presetW.innerHTML = "";
        }
      }
      var pcHint = payModal.querySelector(".y678-pay-partner-hint");
      var newWrap = payModal.querySelector(".y678-pay-partner-new-wrap");
      var newBtn = payModal.querySelector(".y678-pay-partner-newbtn");
      if (newWrap) newWrap.style.display = showNew ? "block" : "none";
      if (newBtn) {
        newBtn.disabled = false;
        newBtn.textContent = "会社を新規登録する";
      }
      if (pcHint) {
        if (showNew) {
          pcHint.style.display = "block";
          var wnHint = String(fieldVal(rec, "work_type_name") || "");
          var sumHint = String(fieldVal(rec, "summary_text") || "");
          var ht =
            "集合先・プレースホルダ行では、**上の一覧**で FBJ・オフィスバスター等を選ぶか、下の欄に入力し「支払を追加」で " +
            YOJITSU_LABEL_INPUT_APP +
            " に保存します（" +
            YOJITSU_LABEL_INPUT_APP +
            " の会社がドロップダウンのときは **選択肢と完全一致** が必要です）。「会社を新規登録する」は入力欄へのフォーカス用です。";
          if (/宅配/.test(wnHint) || /宅配/.test(sumHint)) {
            ht +=
              " **宅配便**は一覧に **クロネコヤマト、佐川急便** と併記しています。実績保存のときは **クロネコヤマト** か **佐川急便** のいずれか一方に差し替えてください。";
          }
          pcHint.textContent = ht;
        } else {
          pcHint.style.display = "none";
          pcHint.textContent = "";
        }
      }
      qs("budget_bucket").value = "";
      qs("invoice_number").value = "";
      qs("payment_memo").value = "";
      var pcount = ((rec.payment_breakdown || {}).value || []).length;
      var linkBox = payModal.querySelector("[data-y678-pay-parentlink]");
      if (linkBox) {
        linkBox.innerHTML =
          "<a href=\"" +
          esc(recordShowHref(rid)) +
          "\" target=\"_blank\" rel=\"noopener\">親レコード（" +
          esc(YOJITSU_LABEL_INPUT_APP) +
          "・#" +
          esc(rid) +
          "）を新規タブで開く ↗</a>" +
          "  <span class=\"y678-pay-summary-hint\">既存支払行 " +
          pcount +
          " 件</span>";
      }
      var existWrap = payModal.querySelector(".y678-pay-existing-wrap");
      if (existWrap) {
        var prow = (rec.payment_breakdown && rec.payment_breakdown.value) || [];
        if (!prow.length) {
          existWrap.innerHTML =
            "<p class=\"y678-pay-summary-hint\" style=\"margin:0 0 8px\">既存の支払内訳：<strong>0 件</strong>（請求書が別なら行を分けて追加）</p>";
        } else {
          var tb = [
            "<p style=\"margin:0 0 6px;font-weight:600\">既存の支払内訳（" + prow.length + " 件）</p>",
            "<table class=\"y678-pay-existing-tbl\" style=\"width:100%;font-size:12px;border-collapse:collapse;margin-bottom:8px\">",
            "<thead><tr><th style=\"text-align:left;border:1px solid #cfd8d2;padding:4px 6px\">支払日</th>",
            "<th style=\"text-align:right;border:1px solid #cfd8d2;padding:4px 6px\">金額</th>",
            "<th style=\"text-align:left;border:1px solid #cfd8d2;padding:4px 6px\">請求書番号</th>",
            "<th style=\"text-align:left;border:1px solid #cfd8d2;padding:4px 6px\">枠種別</th></tr></thead><tbody>",
          ];
          for (var px = 0; px < prow.length; px++) {
            var pv = (prow[px] || {}).value || {};
            var pd = esc(String(((pv.payment_date || {}).value) || ""));
            var pa = esc(String(((pv.payment_amount || {}).value) || ""));
            var inv = esc(String(((pv.invoice_number || {}).value) || ""));
            var bk = esc(String(((pv.budget_bucket || {}).value) || ""));
            tb.push(
              "<tr><td style=\"border:1px solid #e8efea;padding:4px 6px\">" +
                pd +
                "</td><td style=\"border:1px solid #e8efea;padding:4px 6px;text-align:right\">" +
                pa +
                "</td><td style=\"border:1px solid #e8efea;padding:4px 6px\">" +
                inv +
                "</td><td style=\"border:1px solid #e8efea;padding:4px 6px\">" +
                bk +
                "</td></tr>"
            );
          }
          tb.push("</tbody></table>");
          existWrap.innerHTML = tb.join("");
        }
      }
      setTimeout(function () { qs("payment_amount").focus(); }, 0);
    }

    function submitPayment() {
      var rid = payModal.getAttribute("data-y678-rid");
      if (!rid) return;
      var rec = findRawRecord(rid);
      if (!rec) return;
      var st = payModal.querySelector(".y678-modal-status");
      var saveBtn = payModal.querySelector(".y678-pay-save");
      var qs = function (n) { return payModal.querySelector("[name='" + n + "']"); };
      var pdate = qs("payment_date").value.trim();
      var pamtRaw = qs("payment_amount").value.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(pdate)) {
        st.style.color = "#b00020";
        st.textContent = "支払日は YYYY-MM-DD 形式で入力してください。";
        return;
      }
      var pamtN = Number(String(pamtRaw).replace(/[,\s¥￥]/g, ""));
      if (!isFinite(pamtN) || pamtN < 0) {
        st.style.color = "#b00020";
        st.textContent = "金額は 0 以上の数値で入力してください。";
        return;
      }
      var pamt = String(Math.trunc(pamtN));
      var bucket = qs("budget_bucket").value;
      var invoice = qs("invoice_number").value.trim().slice(0, 255);
      var memo = qs("payment_memo").value.trim().slice(0, 10000);
      var newSupplement = qs("summary_supplement").value.slice(0, 10000);
      var origSupplement = String(fieldVal(rec, "summary_supplement") || "");
      var supplementChanged = newSupplement !== origSupplement;

      var existing = (rec.payment_breakdown && rec.payment_breakdown.value) || [];
      var newRows = [];
      for (var i = 0; i < existing.length; i++) {
        var row = existing[i] || {};
        var v = row.value || {};
        var copy = {
          value: {
            payment_date: { value: ((v.payment_date || {}).value) || "" },
            payment_amount: { value: ((v.payment_amount || {}).value) || "" },
            budget_bucket: { value: ((v.budget_bucket || {}).value) || "" },
            invoice_number: { value: ((v.invoice_number || {}).value) || "" },
            payment_memo: { value: ((v.payment_memo || {}).value) || "" },
          },
        };
        if (row.id) copy.id = row.id;
        newRows.push(copy);
      }
      newRows.push({
        value: {
          payment_date: { value: pdate },
          payment_amount: { value: pamt },
          budget_bucket: { value: bucket },
          invoice_number: { value: invoice },
          payment_memo: { value: memo },
        },
      });

      var sums = rollupActualByMonth(newRows);
      var newMonthly = buildMonthlyTableForPayments(rec, sums);

      var pcField = qs("partner_company");
      var origPc = String(fieldVal(rec, "partner_company") || "").trim();
      var newPc = String((pcField && pcField.value) || "").trim().slice(0, 255);
      var partnerUnlocked = payModal.getAttribute("data-y678-partner-unlocked") === "1";
      var allowPartnerAggregateEdit = showPartnerNewRegisterButton(rec);
      var partnerUpdate = !!(pcField && newPc !== origPc && (partnerUnlocked || allowPartnerAggregateEdit));

      var body = {
        app: APP_INPUT,
        id: rid,
        revision: rec.$revision ? rec.$revision.value : null,
        record: {
          payment_breakdown: { value: newRows },
          monthly_breakdown: { value: newMonthly },
        },
      };
      if (supplementChanged) body.record.summary_supplement = { value: newSupplement };
      if (partnerUpdate) body.record.partner_company = { value: newPc };
      saveBtn.disabled = true;
      st.style.color = "#555";
      st.textContent =
        YOJITSU_LABEL_INPUT_APP + " に支払を追加し、月次実績を再集計中…" +
        (supplementChanged ? "（摘要(補足)も更新）" : "") +
        (partnerUpdate ? "（会社名も更新）" : "");
      whenKintoneApiUrlReady(8000)
        .then(function () {
          return kintone.api(kintone.api.url("/k/v1/record.json", true), "PUT", body);
        })
        .then(function () {
          st.style.color = "#0a6b0a";
          st.textContent = "保存しました（" + pdate + " / ¥" + pamt + "）。一覧を更新します。";
          setTimeout(closePaymentModal, 600);
          return load();
        })
        .catch(function (e) {
          st.style.color = "#b00020";
          st.textContent = formatApiError(e, "実績の保存に失敗しました。");
        })
        .then(
          function () { saveBtn.disabled = false; },
          function () { saveBtn.disabled = false; }
        );
    }

    filterRow.addEventListener("click", function (ev) {
      var fb = ev.target && ev.target.closest && ev.target.closest(".y678-filter");
      if (!fb) return;
      var fk = fb.getAttribute("data-y678-filter");
      if (!fk) return;
      currentCostFilter = fk;
      if (lastRawRecords.length) applyFilterAndRedraw();
      else setFilterButtonsActive();
    });

    load();
  }

  function scheduleMount678() {
    [0, 120, 400, 1000, 2200].forEach(function (ms) {
      setTimeout(function () {
        try {
          if (!document.querySelector("[data-yojitsu-678-shell]")) mount();
        } catch (err) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("[678]", err);
          }
        }
      }, ms);
    });
  }

  kintone.events.on("app.record.index.show", function () {
    ensure678PagingHideMutationObserver();
    scheduleMount678();
    schedule678PagingLabelHide();
  });
})();
