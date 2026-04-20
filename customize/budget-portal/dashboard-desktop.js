/**
 * 予算ダッシュボード（654）一覧:
 * - C 案: 親キー（工種×会社×摘要）※工種は工種マスタのコードで集計。左 5 列 sticky、コード数値順グループ。用途はバックオフィス（システム部門等）の経費。
 * - 会計年度 5 月〜翌年 4 月。当月列ハイライト、過去／未来列はやや抑えた背景。予算の使用率 100% 超は赤＋ツールチップ。
 * - 縦合計行の「消」は（実績合計÷予算合計）で再計算（％の平均ではない）。
 * - 調整・実績セルはホバー／クリックで明細ポップ（予算変更アプリ・実績アプリへ target=_blank）。合計再掲・長いリストはスクロール。
 * - 狭い画面向け: 左列は幅を抑え、工種はコード＋名称1行省略。会社・摘要は ellipsis。
 * - ポップは Esc または「セル＋ポップから十分離れたマウス移動」で閉じる（一覧クリックと干渉しにくい）。
 * - 数千行時は再描画が重くなる可能性あり → まず会社・工種フィルタで件数を絞る。必要なら display 切替や仮想スクロールを検討。
 * - 確認（ルールベース）: 列はクリックでポップ。利用者向け文言は事務担当が読んでも分かる表現に統一。
 * - 会計年度切替・URL ハッシュで UI 状態を保持（開発用。画面文言ではハッシュを説明しない）。
 * - 表示順: 全体一覧（工種×請求会社×摘要の全行＋末尾の全体合計行）を最上段、次に固定費・変動費ブロック（ジャンプリンク付き）。
 * - 651: 固定は budget_m**／年額（月空なら÷12）。変動は variable_budget_m** を優先。マスタ未設定は「月別合計＋年額の両方」で固定ブロックへ。
 * - カード導線は表の下。
 * - 反映確認: 再デプロイ後にブラウザでスーパーリロード（Ctrl+Shift+R 等）。開発者ツール Console に
 *   [jbis-budget-dash] deploy stamp（デプロイ時刻）と ui-copy-version（下の定数）が出れば最新 JS。
 */
(function () {
  'use strict';

  /** 文言・UI変更時はデプロイ前に更新すると、Console でキャッシュ切り分けしやすい */
  var JBIS_DASH_UI_COPY_VERSION = '2026-04-10-byjob-table-compact-sticky';

  var APP_BUDGET = 651;
  var APP_CHANGE = 652;
  var APP_ACTUAL = 653;
  var APP_JOB_MASTER = 650;

  /** 利用者向けの呼称（画面文言は番号ではなく名称に統一） */
  /** 利用者向けアプリ名（URL・API の数値 ID はコード内のみ） */
  var LABEL_BILLING_MASTER = '会社マスタ';
  var LABEL_JOB_MASTER = '工種マスタ';
  var LABEL_BUDGET_APP = '予算アプリ';
  var LABEL_CHANGE_APP = '予算変更アプリ';
  var LABEL_ACTUAL_APP = '実績アプリ';

  /**
   * 表・ツールチップ用の事務向け表現（アプリ名 LABEL_* と区別。「変更」「消化率」が紛れやすい箇所の言い換え）
   */
  var COPY_DASH_FOUR_ROWS = '予算・調整（±）・実績・予算の使用率';
  var COPY_DASH_ROW_ADJUST = '予算の調整（±）';
  var COPY_DASH_ROW_USAGE = '予算の使用率';
  var COPY_DASH_COMPACT_ADJUST = '調整（±）';
  var COPY_DASH_COMPACT_USAGE = '使用率';
  var COPY_TIP_ADJUST_ROW =
    'はじめの予算から増やした・減らした金額です。「' +
    LABEL_CHANGE_APP +
    '」には、なぜ金額を動かしたかの理由も書いておくとあとから分かりやすいです。同じ月に複数あるときは足し合わせて表示します。';
  var COPY_TIP_USAGE_ROW =
    'その月の実績が、調整後の予算に対してどのくらいか（使用率の目安）です。工種によって「よい」「注意」の意味合いは異なります。';
  var COPY_TIP_USAGE_OVER =
    '！予算を使い切りました（超過しています）。「' +
    LABEL_ACTUAL_APP +
    '」と「' +
    LABEL_CHANGE_APP +
    '」の内容をご確認ください。';

  /** 一覧表の基準フォント（px）。sticky 列幅・一部余白は dashSz で連動 */
  var DASH_TABLE_FONT_PX = 14;
  /** 変動費ブロックの表だけやや大きく（固定費ブロックとの差をはっきり） */
  var DASH_TABLE_FONT_VARIABLE_SECTION_PX = 17;
  function dashSz(baseAt11) {
    return Math.max(1, Math.round((baseAt11 * DASH_TABLE_FONT_PX) / 11));
  }

  /** 左 sticky 列幅（px）— 工種・会社・摘要・診断・明細数 */
  var STICKY_W_JOB = dashSz(84);
  var STICKY_W_CO = dashSz(100);
  var STICKY_W_SU = dashSz(130);
  var STICKY_W_DIAG = dashSz(112);
  var STICKY_W_N = dashSz(48);
  var STICKY_TOTAL_W =
    STICKY_W_JOB + STICKY_W_CO + STICKY_W_SU + STICKY_W_DIAG + STICKY_W_N;

  /** AI診断（自動チェック）の閾値 */
  var DIAG_MIN_ANNUAL_YEN = 1000;
  var DIAG_MIN_CUM_PLAN_UNDER = 10000;
  var DIAG_UNDER_ACT_VS_CUMPLAN = 0.1;
  var DIAG_MIN_ELAPSED_FOR_UNDER = 2;
  var DIAG_NET_CHANGE_VS_INITIAL = 0.3;
  var DIAG_ABS_CHANGE_VS_INITIAL = 0.5;

  /** 明細ポップ内の先頭表示件数（超過分はスクロール） */
  var POP_DETAIL_MAX_VISIBLE = 14;
  var POP_LIST_MAX_HEIGHT_PX = 220;
  /** セルからこの px 以上離れたらポップを閉じる（セル・ポップの矩形＋余白） */
  var POP_CLOSE_MOUSE_PAD = 56;

  var F_JOB = 'job_code';
  var F_JOB_NAME = 'job_name';
  var F_COMPANY = 'company_name';
  var F_SUMMARY = 'summary';
  var F_MATCH = 'matching_key';
  var F_BUDGET = 'budget_amount';
  /** 予算アプリ: 会計年度の月別予算（0=5月 … 11=翌年4月）— 固定費・月次按分のベース */
  var BUDGET_MONTH_FIELDS = [
    'budget_m05',
    'budget_m06',
    'budget_m07',
    'budget_m08',
    'budget_m09',
    'budget_m10',
    'budget_m11',
    'budget_m12',
    'budget_m01',
    'budget_m02',
    'budget_m03',
    'budget_m04',
  ];
  /** 変動費用の月別予算（651 に同一コードの数値フィールドを追加）。工種マスタが「変動」の行は原則こちらを使用 */
  var VARIABLE_BUDGET_MONTH_FIELDS = [
    'variable_budget_m05',
    'variable_budget_m06',
    'variable_budget_m07',
    'variable_budget_m08',
    'variable_budget_m09',
    'variable_budget_m10',
    'variable_budget_m11',
    'variable_budget_m12',
    'variable_budget_m01',
    'variable_budget_m02',
    'variable_budget_m03',
    'variable_budget_m04',
  ];
  var F_CHG_MONTH = 'change_month';
  var F_CHG_AMT = 'change_amount';
  var F_CHG_REASON = 'change_reason';
  var F_ACT_DATE = 'actual_date';
  var F_ACT_AMT = 'actual_amount';
  var F_ACT_MEMO = 'actual_memo';
  /** 予算アプリ: 会計年度の開始西暦年（5 月始まりの年）。未入力は「当会計年度のみ表示」扱い */
  var F_BUDGET_FY = 'budget_fy_start';
  /** 工種マスタ: 固定費／変動費（ドロップダウン） */
  var F_COST_TYPE = 'cost_type';

  var MONTH_LABELS = ['5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月'];

  function num(v) {
    if (v == null || v === '') {
      return 0;
    }
    var n = Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function trimStr(v) {
    return v == null ? '' : String(v).trim();
  }

  /** 工種コード（job_code）の並び: 数値として解釈できる場合は数値順、それ以外は文字列 */
  function compareJobCode(a, b) {
    var sa = String(a || '');
    var sb = String(b || '');
    var na = parseInt(sa, 10);
    var nb = parseInt(sb, 10);
    var pureA = String(na) === sa && sa !== '' && !isNaN(na);
    var pureB = String(nb) === sb && sb !== '' && !isNaN(nb);
    if (pureA && pureB) {
      return na - nb;
    }
    return sa.localeCompare(sb, 'ja', { numeric: true });
  }

  function parentKeyFrom651(rec) {
    var job = trimStr(rec[F_JOB] && rec[F_JOB].value);
    var co = trimStr(rec[F_COMPANY] && rec[F_COMPANY].value);
    var sum = trimStr(rec[F_SUMMARY] && rec[F_SUMMARY].value);
    return job + '\t' + co + '\t' + sum;
  }

  function parseYmd(s) {
    if (!s) {
      return null;
    }
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) {
      return null;
    }
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  /** 会計年度の開始年（5 月はじまり＝その暦年） */
  /** 会計年度の開始西暦年: 5〜12月はその年、1〜4月は前年度（例: 2027-04→2026年度、2027-05→2027年度） */
  function fiscalStartYearFromDate(d) {
    if (!d) {
      return null;
    }
    var y = d.getFullYear();
    var mo = d.getMonth() + 1;
    return mo >= 5 ? y : y - 1;
  }

  /** fyStartYear: 5 月が属する暦年。戻り 0..11 ＝ 5月..翌4月。範囲外は -1 */
  function fiscalMonthIndex(iso, fyStartYear) {
    var d = parseYmd(iso);
    if (!d) {
      return -1;
    }
    var fys = fiscalStartYearFromDate(d);
    if (fys !== fyStartYear) {
      return -1;
    }
    var mo = d.getMonth() + 1;
    if (mo >= 5) {
      return mo - 5;
    }
    return mo + 7;
  }

  function currentFiscalStartYear() {
    return fiscalStartYearFromDate(new Date());
  }

  function currentFiscalMonthIndex(fyStartYear) {
    var d = new Date();
    var iso =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');
    return fiscalMonthIndex(iso, fyStartYear);
  }

  function fetchAllRecords(app, fields) {
    var all = [];
    var limit = 500;
    function load(offset) {
      return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
        app: app,
        query: 'order by $id asc limit ' + limit + ' offset ' + offset,
        fields: fields,
        totalCount: false,
      }).then(function (resp) {
        var rows = resp.records || [];
        for (var i = 0; i < rows.length; i++) {
          all.push(rows[i]);
        }
        if (rows.length === limit) {
          return load(offset + limit);
        }
        return all;
      });
    }
    return load(0);
  }

  /** whereClause に日付条件などを渡し、ページングで全件取得 */
  function fetchAllRecordsQuery(app, fields, whereClause) {
    var prefix = whereClause && String(whereClause).trim() ? String(whereClause).trim() : '';
    var all = [];
    var limit = 500;
    function load(offset) {
      var q = (prefix ? prefix + ' ' : '') + 'order by $id asc limit ' + limit + ' offset ' + offset;
      return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
        app: app,
        query: q,
        fields: fields,
        totalCount: false,
      }).then(function (resp) {
        var rows = resp.records || [];
        var ri;
        for (ri = 0; ri < rows.length; ri++) {
          all.push(rows[ri]);
        }
        if (rows.length === limit) {
          return load(offset + limit);
        }
        return all;
      });
    }
    return load(0);
  }

  function buildFyFieldQuery(fieldCode, fyStartYear) {
    var y1 = fyStartYear;
    var y2 = fyStartYear + 1;
    var start = y1 + '-05-01';
    var end = y2 + '-04-30';
    return fieldCode + ' >= "' + start + '" and ' + fieldCode + ' <= "' + end + '"';
  }

  function filterBudgetRecsByFy(recs, fyStartYear, todayFy) {
    var out = [];
    var i;
    for (i = 0; i < recs.length; i++) {
      var r = recs[i];
      var fld = r[F_BUDGET_FY];
      var raw = fld && fld.value != null ? String(fld.value).trim() : '';
      if (raw === '') {
        if (fyStartYear === todayFy) {
          out.push(r);
        }
      } else {
        var v = parseInt(String(raw).replace(/,/g, ''), 10);
        if (Number.isFinite(v) && v === fyStartYear) {
          out.push(r);
        }
      }
    }
    return out;
  }

  function buildCostTypeMap(records) {
    var m = {};
    if (!records) {
      return m;
    }
    var i;
    for (i = 0; i < records.length; i++) {
      var rec = records[i];
      var code = trimStr(rec[F_JOB] && rec[F_JOB].value);
      var ct = trimStr(rec[F_COST_TYPE] && rec[F_COST_TYPE].value);
      if (code) {
        m[code] = ct || '未設定';
      }
    }
    return m;
  }

  function normalizeCostType(raw) {
    var s = trimStr(raw);
    if (!s) {
      return 'unset';
    }
    if (s === '固定費' || s === '固定' || s === 'fixed') {
      return 'fixed';
    }
    if (s === '変動費' || s === '変動' || s === 'variable') {
      return 'variable';
    }
    if (s === '固定費・変動費' || s === '固定費･変動費') {
      return 'hybrid';
    }
    if (s === '未設定' || s === 'unset') {
      return 'unset';
    }
    return 'unset';
  }

  /**
   * 表示中年度に応じた列ハイライト・診断用の累計月。
   * colHighlightMonth: 0..11=当月相当、12=過去年度（列は均等）、-1=未来年度
   */
  function getFiscalViewContext(fyStartYear) {
    var todayFy = currentFiscalStartYear();
    if (fyStartYear === todayFy) {
      var cmi = currentFiscalMonthIndex(fyStartYear);
      return {
        colHighlightMonth: cmi < 0 ? -1 : cmi,
        cumMonthIdx: cmi < 0 ? -1 : cmi,
        elapsedMonths: cmi < 0 ? 0 : cmi + 1,
        isPastClosed: false,
        isFuture: false,
      };
    }
    if (fyStartYear < todayFy) {
      return {
        colHighlightMonth: 12,
        cumMonthIdx: 11,
        elapsedMonths: 12,
        isPastClosed: true,
        isFuture: false,
      };
    }
    return {
      colHighlightMonth: -1,
      cumMonthIdx: -1,
      elapsedMonths: 0,
      isPastClosed: false,
      isFuture: true,
    };
  }

  function isMonthElapsedForView(mx, vc) {
    if (vc.isPastClosed) {
      return true;
    }
    if (vc.isFuture) {
      return false;
    }
    return vc.cumMonthIdx >= 0 && mx <= vc.cumMonthIdx;
  }

  function parseDashHash() {
    var raw =
      typeof location !== 'undefined' && location.hash
        ? String(location.hash).replace(/^#/, '')
        : '';
    var o = { fy: null, cost: 'all', diag: false, mode: 'initial', order: 'fv' };
    if (!raw) {
      return o;
    }
    var parts = raw.split('&');
    var pi;
    for (pi = 0; pi < parts.length; pi++) {
      var pair = parts[pi];
      var ix = pair.indexOf('=');
      var k = ix >= 0 ? decodeURIComponent(pair.slice(0, ix)) : pair;
      var v = ix >= 0 ? decodeURIComponent(pair.slice(ix + 1)) : '';
      if (k === 'fy') {
        var n = parseInt(v, 10);
        if (Number.isFinite(n)) {
          o.fy = n;
        }
      } else if (k === 'cost') {
        if (['all', 'fixed', 'variable', 'hybrid', 'unset'].indexOf(v) >= 0) {
          o.cost = v;
        }
      } else if (k === 'diag') {
        o.diag = v === '1' || v === 'true';
      } else if (k === 'mode') {
        if (v === 'learning' || v === 'initial') {
          o.mode = v;
        }
      } else if (k === 'order') {
        if (v === 'fv' || v === 'vf') {
          o.order = v;
        }
      }
    }
    return o;
  }

  function writeDashHashFragment(fragment) {
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search + '#' + fragment);
    } else if (typeof location !== 'undefined') {
      location.hash = fragment;
    }
  }

  /**
   * 1 件の予算レコードを親へ加算。sectionCost は表ブロック（固定／変動）、masterCat は工種マスタの区分。
   */
  function applyBudgetRecordToParent(parent, br, sectionCost, masterCat) {
    var rowMain = [];
    var ms = 0;
    var mi;
    for (mi = 0; mi < 12; mi++) {
      var fcM = BUDGET_MONTH_FIELDS[mi];
      var pv =
        br[fcM] && br[fcM].value != null && br[fcM].value !== ''
          ? num(br[fcM].value)
          : 0;
      rowMain.push(pv);
      ms += pv;
    }
    var rowVar = [];
    var msv = 0;
    for (mi = 0; mi < 12; mi++) {
      var fcV = VARIABLE_BUDGET_MONTH_FIELDS[mi];
      var pvv =
        br[fcV] && br[fcV].value != null && br[fcV].value !== ''
          ? num(br[fcV].value)
          : 0;
      rowVar.push(pvv);
      msv += pvv;
    }
    var ann = num(br[F_BUDGET] && br[F_BUDGET].value);

    if (sectionCost === 'fixed') {
      if (ms > 0) {
        parent.annualBudget += ms;
        for (mi = 0; mi < 12; mi++) {
          parent.planByMonth[mi] += rowMain[mi];
        }
      } else {
        parent.annualBudget += ann;
        var sh = ann / 12;
        for (mi = 0; mi < 12; mi++) {
          parent.planByMonth[mi] += sh;
        }
      }
      return;
    }

    if (masterCat === 'hybrid') {
      if (sectionCost === 'variable') {
        if (msv > 0) {
          parent.annualBudget += msv;
          for (mi = 0; mi < 12; mi++) {
            parent.planByMonth[mi] += rowVar[mi];
          }
          return;
        }
        if (ann > 0) {
          parent.annualBudget += ann;
          var shy = ann / 12;
          for (mi = 0; mi < 12; mi++) {
            parent.planByMonth[mi] += shy;
          }
        }
        return;
      }
      if (ms > 0) {
        parent.annualBudget += ms;
        for (mi = 0; mi < 12; mi++) {
          parent.planByMonth[mi] += rowMain[mi];
        }
        return;
      }
      parent.annualBudget += ann;
      var shh = ann / 12;
      for (mi = 0; mi < 12; mi++) {
        parent.planByMonth[mi] += shh;
      }
      return;
    }

    if (masterCat === 'variable' && msv > 0) {
      parent.annualBudget += msv;
      for (mi = 0; mi < 12; mi++) {
        parent.planByMonth[mi] += rowVar[mi];
      }
      return;
    }
    if (msv > 0) {
      parent.annualBudget += msv;
      for (mi = 0; mi < 12; mi++) {
        parent.planByMonth[mi] += rowVar[mi];
      }
      return;
    }
    if (ms > 0) {
      parent.annualBudget += ms;
      for (mi = 0; mi < 12; mi++) {
        parent.planByMonth[mi] += rowMain[mi];
      }
      return;
    }
    parent.annualBudget += ann;
  }

  function buildState(fyStartYear, budgetRecs, changeRecs, actualRecs, costTypeMap) {
    var cmap651 = costTypeMap || {};
    var hasCostMap651 = false;
    var ck;
    for (ck in cmap651) {
      if (Object.prototype.hasOwnProperty.call(cmap651, ck)) {
        hasCostMap651 = true;
        break;
      }
    }

    var mkToParent = {};
    var parents = {};

    var byPk = {};
    var i;
    for (i = 0; i < budgetRecs.length; i++) {
      var brG = budgetRecs[i];
      var pkg = parentKeyFrom651(brG);
      if (!byPk[pkg]) {
        byPk[pkg] = [];
      }
      byPk[pkg].push(brG);
    }

    var pk;
    for (pk in byPk) {
      if (!Object.prototype.hasOwnProperty.call(byPk, pk)) {
        continue;
      }
      var recs = byPk[pk];
      var br0 = recs[0];
      var planInit = [];
      var pm0;
      for (pm0 = 0; pm0 < 12; pm0++) {
        planInit.push(0);
      }
      var jobCd651 = trimStr(br0[F_JOB] && br0[F_JOB].value);
      var masterCat = hasCostMap651 ? normalizeCostType(cmap651[jobCd651]) : 'fixed';

      var aggMain = 0;
      var aggVar = 0;
      var aggAnn = 0;
      var ri;
      for (ri = 0; ri < recs.length; ri++) {
        var bx = recs[ri];
        var mx;
        var sm = 0;
        var sv = 0;
        for (mx = 0; mx < 12; mx++) {
          var f1 = BUDGET_MONTH_FIELDS[mx];
          sm +=
            bx[f1] && bx[f1].value != null && bx[f1].value !== ''
              ? num(bx[f1].value)
              : 0;
          var f2 = VARIABLE_BUDGET_MONTH_FIELDS[mx];
          sv +=
            bx[f2] && bx[f2].value != null && bx[f2].value !== ''
              ? num(bx[f2].value)
              : 0;
        }
        aggMain += sm;
        aggVar += sv;
        aggAnn += num(bx[F_BUDGET] && bx[F_BUDGET].value);
      }

      var sectionCost = masterCat;
      if (masterCat === 'unset') {
        sectionCost = aggMain > 0 && aggAnn > 0 ? 'fixed' : 'variable';
      } else if (masterCat === 'hybrid') {
        sectionCost =
          aggVar > 0 ? 'variable' : aggMain > 0 || aggAnn > 0 ? 'fixed' : 'variable';
      }

      parents[pk] = {
        key: pk,
        job: jobCd651,
        jobName: trimStr(br0[F_JOB_NAME] && br0[F_JOB_NAME].value),
        company: trimStr(br0[F_COMPANY] && br0[F_COMPANY].value),
        summary: trimStr(br0[F_SUMMARY] && br0[F_SUMMARY].value),
        annualBudget: 0,
        planByMonth: planInit,
        childKeys: [],
        sectionCost: sectionCost,
        masterCostType: masterCat,
      };

      for (ri = 0; ri < recs.length; ri++) {
        var br = recs[ri];
        var jn = trimStr(br[F_JOB_NAME] && br[F_JOB_NAME].value);
        if (jn && !parents[pk].jobName) {
          parents[pk].jobName = jn;
        }
        applyBudgetRecordToParent(parents[pk], br, sectionCost, masterCat);
        var mk = trimStr(br[F_MATCH] && br[F_MATCH].value);
        if (mk && parents[pk].childKeys.indexOf(mk) === -1) {
          parents[pk].childKeys.push(mk);
        }
        if (mk) {
          mkToParent[mk] = pk;
        }
      }
    }

    var p;
    for (p in parents) {
      if (!Object.prototype.hasOwnProperty.call(parents, p)) {
        continue;
      }
      parents[p].monthly = [];
      var m;
      for (m = 0; m < 12; m++) {
        parents[p].monthly[m] = {
          changeSum: 0,
          changeCount: 0,
          changeReasons: [],
          changeEntries: [],
          actualSum: 0,
          actualCount: 0,
          actualIds: [],
          actualEntries: [],
        };
      }
    }

    for (i = 0; i < changeRecs.length; i++) {
      var cr = changeRecs[i];
      var cmk = trimStr(cr[F_MATCH] && cr[F_MATCH].value);
      var pkc = mkToParent[cmk];
      if (!pkc || !parents[pkc]) {
        continue;
      }
      var cmi = fiscalMonthIndex(cr[F_CHG_MONTH] && cr[F_CHG_MONTH].value, fyStartYear);
      if (cmi < 0 || cmi > 11) {
        continue;
      }
      var cell = parents[pkc].monthly[cmi];
      var camt = num(cr[F_CHG_AMT] && cr[F_CHG_AMT].value);
      cell.changeSum += camt;
      cell.changeCount += 1;
      var reason = trimStr(cr[F_CHG_REASON] && cr[F_CHG_REASON].value);
      var cid = cr.$id && cr.$id.value != null ? String(cr.$id.value) : '';
      cell.changeEntries.push({ id: cid, amount: camt, reason: reason });
      if (reason) {
        cell.changeReasons.push(reason);
      }
    }

    for (i = 0; i < actualRecs.length; i++) {
      var ar = actualRecs[i];
      var amk = trimStr(ar[F_MATCH] && ar[F_MATCH].value);
      var pka = mkToParent[amk];
      if (!pka || !parents[pka]) {
        continue;
      }
      var ami = fiscalMonthIndex(ar[F_ACT_DATE] && ar[F_ACT_DATE].value, fyStartYear);
      if (ami < 0 || ami > 11) {
        continue;
      }
      var acell = parents[pka].monthly[ami];
      var aamt = num(ar[F_ACT_AMT] && ar[F_ACT_AMT].value);
      acell.actualSum += aamt;
      acell.actualCount += 1;
      var rid = ar.$id && ar.$id.value != null ? String(ar.$id.value) : '';
      var memo = trimStr(ar[F_ACT_MEMO] && ar[F_ACT_MEMO].value);
      if (rid) {
        acell.actualIds.push(rid);
      }
      acell.actualEntries.push({ id: rid, amount: aamt, memo: memo });
    }

    return { parents: parents, mkToParent: mkToParent };
  }

  function formatYen(n) {
    if (!n) {
      return '0';
    }
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatPct(n) {
    if (!Number.isFinite(n)) {
      return '—';
    }
    return n.toFixed(1) + '%';
  }

  function monthlyBudgetShare(annual) {
    return annual / 12;
  }

  /** 予算親キーに現れる摘要の一覧（フィルタ用・空は末尾） */
  function uniqueSummariesFromState(st) {
    var u = {};
    var kk;
    for (kk in st.parents) {
      if (!Object.prototype.hasOwnProperty.call(st.parents, kk)) {
        continue;
      }
      u[st.parents[kk].summary] = true;
    }
    var arr = Object.keys(u);
    arr.sort(function (a, b) {
      if (a === b) {
        return 0;
      }
      if (a === '') {
        return 1;
      }
      if (b === '') {
        return -1;
      }
      return a.localeCompare(b, 'ja');
    });
    return arr;
  }

  /** 月 m の計画（予算アプリの月別 ＋ 予算変更の当月合算） */
  function adjustedMonthPlan(pr, m) {
    var base = pr.planByMonth && pr.planByMonth[m] != null ? num(pr.planByMonth[m]) : 0;
    var ch = pr.monthly && pr.monthly[m] ? num(pr.monthly[m].changeSum) : 0;
    return base + ch;
  }

  /** 年度の計画合計（予算変更反映後） */
  function annualAdjustedBudget(pr) {
    var t = 0;
    var mm;
    for (mm = 0; mm < 12; mm++) {
      t += adjustedMonthPlan(pr, mm);
    }
    return t;
  }

  function sumThroughMonth(pr, curMonthIdx, getVal) {
    var t = 0;
    if (curMonthIdx < 0) {
      return 0;
    }
    var maxM = Math.min(curMonthIdx, 11);
    var mm;
    for (mm = 0; mm <= maxM; mm++) {
      t += getVal(pr, mm);
    }
    return t;
  }

  /**
   * 親行（工種×会社×摘要）の参考診断。viewCtx.cumMonthIdx まで累計、elapsedMonths でペース比較。
   * lines は重要度順（工種区分未登録 → ペース超過 → 大きな変更 → 未実施・未入力の確認 → 変更が多い）。
   * 各要素は文字列、または { main, footnote }（脚注は判定目安のみ・小さく表示。ロジック解説の長文は出さない）。
   * @returns {{ over:boolean, under:boolean, netChange:boolean, volatile:boolean, lines:string[], costTypeUnset:boolean }}
   */
  function diagnoseBudgetParent(pr, viewCtx, jobCostCategory) {
    var jcc =
      jobCostCategory === 'fixed' ||
      jobCostCategory === 'variable' ||
      jobCostCategory === 'unset' ||
      jobCostCategory === 'hybrid'
        ? jobCostCategory
        : 'fixed';
    var out = {
      over: false,
      under: false,
      netChange: false,
      volatile: false,
      lines: [],
      costTypeUnset: jcc === 'unset',
    };
    if (!pr || !pr.monthly || !viewCtx) {
      return out;
    }
    var masterLine = '';
    if (jcc === 'unset') {
      masterLine =
        '📌【工種の区分が未登録】この工種は「' +
        LABEL_JOB_MASTER +
        '」で「固定費」か「変動費」がまだ選ばれていません。固定費にすると、月の欄が空いているときは年間予算を12か月に分けて表示します。変動費にすると、金額を入れた月の列にだけ予算と実績を載せます。早めに区分を入れないと、この一覧やお知らせが正しく出ません。';
    }
    var cumIdx = viewCtx.cumMonthIdx;
    var elapsed = viewCtx.elapsedMonths;
    var initialAnnual = num(pr.annualBudget);
    var annualAdj = annualAdjustedBudget(pr);
    if (annualAdj < DIAG_MIN_ANNUAL_YEN && initialAnnual < DIAG_MIN_ANNUAL_YEN) {
      if (masterLine) {
        out.lines.push(masterLine);
      }
      return out;
    }

    var cumAct = 0;
    var cumPlanAdj = 0;
    if (cumIdx >= 0) {
      cumAct = sumThroughMonth(pr, cumIdx, function (p, mm) {
        return p.monthly[mm] ? num(p.monthly[mm].actualSum) : 0;
      });
      cumPlanAdj = sumThroughMonth(pr, cumIdx, function (p, mm) {
        return adjustedMonthPlan(p, mm);
      });
    }

    var expectedLinear = annualAdj * (elapsed / 12);
    var lineOver = '';
    var lineNet = '';
    var lineUnder = '';
    var lineVol = '';

    if (
      cumIdx >= 0 &&
      elapsed >= 1 &&
      annualAdj >= DIAG_MIN_ANNUAL_YEN &&
      cumAct > expectedLinear + 0.5
    ) {
      out.over = true;
      var projected = Math.round(cumAct * (12 / elapsed) - annualAdj);
      lineOver = {
        main:
          '⚠️【予算を超えそうなときのお知らせ】年度の進み方に比べると、いまの実績のペースはやや速いです。このまま続くと、年度末ごろに約 ' +
          formatYen(projected) +
          ' 円足りなくなる可能性があります（支払の前倒し・後ろ倒しがある場合は参考程度です）。内容の見直し、または「' +
          LABEL_CHANGE_APP +
          '」での調整を検討してください。',
        footnote: '（目安：年度の経過月数に対して、これまでの実績の出方が早いとき）',
      };
    }

    var netCh = 0;
    var absCh = 0;
    var mm2;
    for (mm2 = 0; mm2 < 12; mm2++) {
      var c = pr.monthly[mm2] ? num(pr.monthly[mm2].changeSum) : 0;
      netCh += c;
      absCh += Math.abs(c);
    }
    if (initialAnnual >= DIAG_MIN_ANNUAL_YEN && netCh > initialAnnual * DIAG_NET_CHANGE_VS_INITIAL) {
      out.netChange = true;
      lineNet = {
        main:
          '📢【はじめの予算から大きく動いています】「' +
          LABEL_CHANGE_APP +
          '」の合計が、はじめの年間予算の ' +
          Math.round(DIAG_NET_CHANGE_VS_INITIAL * 100) +
          '% を超えています。次の年度の予算を考えるときのために、理由を備考などに残しておくことをおすすめします。',
        footnote:
          '（目安：「' +
          LABEL_CHANGE_APP +
          '」の増減を打ち消し合わせたあとの合計が、はじめの年間予算の ' +
          Math.round(DIAG_NET_CHANGE_VS_INITIAL * 100) +
          '% を超えるとき）',
      };
    }

    if (
      cumIdx >= 0 &&
      elapsed >= DIAG_MIN_ELAPSED_FOR_UNDER &&
      cumPlanAdj >= DIAG_MIN_CUM_PLAN_UNDER &&
      cumAct <= cumPlanAdj * DIAG_UNDER_ACT_VS_CUMPLAN + 0.5
    ) {
      out.under = true;
      var underBody2 =
        jcc === 'variable'
          ? '変動費は、予定に合わせて都度かかるものです。発注や検収の日程の変更がないか、または「' +
            LABEL_ACTUAL_APP +
            '」へすでに入力済みかをご確認ください。'
          : jcc === 'fixed'
            ? '固定費は、主に毎月の支払・計上で実績が載ります。タイミングのずれがないか、または「' +
              LABEL_ACTUAL_APP +
              '」へすでに入力済みかをご確認ください。'
            : '都度の費用と毎月の費用が混ざる場合があります。支払・計上や購入の予定に変更はないか、「' +
              LABEL_ACTUAL_APP +
              '」へすでに入力済みかをご確認ください。';
      lineUnder = {
        main:
          '💡【未実施・未入力の確認】\n' +
          '予算はある一方、ここまでの期間では実績がほとんど載っていません。\n' +
          underBody2,
        footnote:
          '（目安：当月までの予定の合計に対し、実績の合計がおおよそ ' +
          Math.round(DIAG_UNDER_ACT_VS_CUMPLAN * 100) +
          '% 以下のとき）',
      };
    }

    if (initialAnnual >= DIAG_MIN_ANNUAL_YEN && absCh > initialAnnual * DIAG_ABS_CHANGE_VS_INITIAL) {
      out.volatile = true;
      lineVol = {
        main:
          '📋【予算の調整（増減）がとても多いです】増やす・減らすを足し合わせた動きが、はじめの年間予算の ' +
          Math.round(DIAG_ABS_CHANGE_VS_INITIAL * 100) +
          '% を超えるくらいあります。確定した調整だけを登録するか、はじめの見積を見直すとよいかもしれません。',
        footnote:
          '（目安：各月の調整額の大きさをすべて足した合計が、はじめの年間予算の ' +
          Math.round(DIAG_ABS_CHANGE_VS_INITIAL * 100) +
          '% を超えるとき）',
      };
    }

    if (lineOver) {
      out.lines.push(lineOver);
    }
    if (lineNet) {
      out.lines.push(lineNet);
    }
    if (lineUnder) {
      out.lines.push(lineUnder);
    }
    if (lineVol) {
      out.lines.push(lineVol);
    }
    if (masterLine) {
      out.lines.unshift(masterLine);
    }
    return out;
  }

  function countDiagnosisInJobGroups(jobGroups, viewCtx, costTypeMap) {
    var cmapD = costTypeMap || {};
    var s = {
      over: 0,
      under: 0,
      netChange: 0,
      volatile: 0,
      masterUnset: 0,
      /** ペース超過・未実施確認など、黄帯用に数える親行 */
      attentionParents: 0,
      parentsWithAny: 0,
    };
    var g;
    for (g = 0; g < jobGroups.length; g++) {
      var p;
      for (p = 0; p < jobGroups[g].parents.length; p++) {
        var prd = jobGroups[g].parents[p];
        var d = diagnoseBudgetParent(prd, viewCtx, normalizeCostType(cmapD[prd.job]));
        if (d.over) {
          s.over++;
        }
        if (d.under) {
          s.under++;
        }
        if (d.netChange) {
          s.netChange++;
        }
        if (d.volatile) {
          s.volatile++;
        }
        if (d.costTypeUnset) {
          s.masterUnset++;
        }
        if (d.over || d.under || d.netChange || d.volatile) {
          s.attentionParents++;
        }
        if (d.lines.length) {
          s.parentsWithAny++;
        }
      }
    }
    return s;
  }

  /** レコード詳細（別タブ用・同一オリジン） */
  function appRecordShowUrl(appId, recordId) {
    if (!recordId) {
      return '#';
    }
    return '/k/' + appId + '/show#record=' + recordId;
  }

  /** colHighlightMonth: 0..11 通常、12=過去年度（均等）、-1=未来 */
  function monthColumnBackground(mx, colHighlightMonth) {
    if (colHighlightMonth === 12) {
      return '#eceff1';
    }
    if (colHighlightMonth < 0) {
      return '#f5f7fa';
    }
    if (mx < colHighlightMonth) {
      return '#eceff1';
    }
    if (mx > colHighlightMonth) {
      return '#f5f7fa';
    }
    return '#fff9c4';
  }

  function monthCellBackground(mx, colHighlightMonth) {
    if (colHighlightMonth === 12) {
      return '#f5f5f5';
    }
    if (colHighlightMonth < 0) {
      return '#fafafa';
    }
    if (mx < colHighlightMonth) {
      return '#f5f5f5';
    }
    if (mx > colHighlightMonth) {
      return '#fafafa';
    }
    return '#fffde7';
  }

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) {
      var k;
      for (k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          if (k === 'style' && typeof attrs[k] === 'object') {
            var sk;
            for (sk in attrs[k]) {
              e.style[sk] = attrs[k][sk];
            }
          } else if (k === 'className') {
            e.className = attrs[k];
          } else {
            e.setAttribute(k, attrs[k]);
          }
        }
      }
    }
    if (text != null) {
      e.textContent = text;
    }
    return e;
  }

  /** 予算の使用率セル用（背景プログレスバー＋手前に％） */
  function renderDigestPctCell(td, pct) {
    td.style.position = 'relative';
    td.style.padding = dashSz(2) + 'px ' + dashSz(6) + 'px';
    td.style.overflow = 'hidden';
    if (Number.isFinite(pct)) {
      td.title = pct > 100 ? COPY_TIP_USAGE_OVER : COPY_TIP_USAGE_ROW;
    }
    var fillPct = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
    var bar = document.createElement('div');
    bar.style.cssText =
      'position:absolute;left:0;top:0;bottom:0;width:' +
      fillPct +
      '%;background:' +
      (Number.isFinite(pct) && pct > 100 ? '#ffcdd2' : '#c5cae9') +
      ';opacity:.55;z-index:0;pointer-events:none;';
    td.appendChild(bar);
    var txt = el('span', {}, formatPct(pct));
    txt.style.position = 'relative';
    txt.style.zIndex = '1';
    if (Number.isFinite(pct) && pct > 100) {
      txt.style.color = '#b71c1c';
      txt.style.fontWeight = '700';
    }
    td.appendChild(txt);
  }

  var CARDS = [
    { id: 649, title: LABEL_BILLING_MASTER, desc: LABEL_BUDGET_APP + 'で選ぶ会社名のマスタ。' },
    { id: 650, title: LABEL_JOB_MASTER, desc: '工種のコード・名称。固定費／変動費の区分もここで決まります。' },
    {
      id: 651,
      title: LABEL_BUDGET_APP,
      desc:
        '年度はじめの予算（固定費・変動費どちらもここから）。あとからの予算の増減（調整）や実績は、同じ工種・会社・摘要の組み合わせで自動的につながります。',
    },
    {
      id: 652,
      title: LABEL_CHANGE_APP,
      desc: 'どの月に、いくら増やした・減らしたか。なぜ金額を動かしたかの理由もここに残せます。',
    },
    {
      id: 653,
      title: LABEL_ACTUAL_APP,
      desc: '実際の支払・請求の日付・金額・備考。固定費・変動費の工種はすべてここにも登録し、予算と突き合わせます。',
    },
  ];

  function renderCards() {
    var wrap = el('div', { className: 'jbis-budget-dash-cards' });
    wrap.style.marginTop = '20px';
    wrap.style.padding = '16px 18px';
    wrap.style.background = '#fafbfd';
    wrap.style.border = '1px solid #d9e0e8';
    wrap.style.borderRadius = '8px';

    var h = el('h3', {}, '各アプリへ');
    h.style.margin = '0 0 12px 0';
    h.style.fontSize = '15px';
    h.style.color = '#1a237e';
    wrap.appendChild(h);

    var grid = el('div', { className: 'jbis-budget-dash-cardgrid' });
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(220px,1fr))';
    grid.style.gap = '10px';

    var i;
    for (i = 0; i < CARDS.length; i++) {
      var c = CARDS[i];
      var a = el('a', { href: '/k/' + c.id + '/', target: '_blank', rel: 'noopener' }, null);
      a.style.display = 'block';
      a.style.padding = '12px 14px';
      a.style.background = '#fff';
      a.style.border = '1px solid #c5cae9';
      a.style.borderRadius = '6px';
      a.style.textDecoration = 'none';
      a.style.color = '#283593';
      var t = el('div', { className: 't' }, c.title);
      t.style.fontWeight = '600';
      t.style.fontSize = '13px';
      var d = el('div', { className: 'd' }, c.desc);
      d.style.fontSize = '11px';
      d.style.color = '#546e7a';
      d.style.marginTop = '4px';
      a.appendChild(t);
      a.appendChild(d);
      grid.appendChild(a);
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function renderAggregateRoot(dashCtx, yearApi) {
    if (!yearApi) {
      yearApi = {
        initialHash: parseDashHash(),
        onYearChange: function () {
          return Promise.resolve();
        },
      };
    }
    var wrap = el('div', { className: 'jbis-budget-dash-root' });
    wrap.style.margin = '0 0 12px 0';
    wrap.style.padding = '12px 14px';
    wrap.style.background = '#fff';
    wrap.style.border = '1px solid #d9e0e8';
    wrap.style.borderRadius = '8px';
    wrap.style.overflow = 'auto';

    var title = el('h2', {}, '【システム部門・事務経費】予算実績ダッシュボード');
    title.style.margin = '0';
    title.style.fontSize = '17px';
    title.style.color = '#1a237e';

    var helpTip =
      '【この画面の使い方】' +
      '固定費も変動費も、同じ流れです。まず「' +
      LABEL_BUDGET_APP +
      '」に計画（予算）、使ったあと「' +
      LABEL_ACTUAL_APP +
      '」に実際の金額を入れてください。どちらか片方だけだと、この表では「いくら使ったか」との比較ができません。' +
      '表の「予算」行は「' +
      LABEL_BUDGET_APP +
      '」の内容です。固定費は毎月おなじような支払のもの。月の欄が空いているときは、年間の金額を12で割った額が自動で入ります。' +
      '変動費は都度の費用です。「' +
      LABEL_BUDGET_APP +
      '」では金額と支払予定日で入力すると、かかる月の列に載ります。予算の増減（調整）を記録するときは「' +
      LABEL_CHANGE_APP +
      '」を使います（なぜ金額を動かしたかの理由も書けるとあとから分かりやすいです）。' +
      '「実績」行は「' +
      LABEL_ACTUAL_APP +
      '」に入れた金額です（固定費も変動費も同じです）。下線のある数字をクリックすると、内訳が小さな窓で開き、必要なら「' +
      LABEL_CHANGE_APP +
      '」「' +
      LABEL_ACTUAL_APP +
      '」の画面を別のタブで開けます。' +
      '▲のマークは、その月に「' +
      LABEL_CHANGE_APP +
      '」で増減を登録した印です。数字にマウスを置くと、なぜ金額を動かしたかの理由が見えます。' +
      '「⚠️ 確認 ○件」は、あらかじめ決めた条件で気づいてほしいことをまとめたものです。クリックすると文章が開きます。' +
      '左の工種・会社名などは、表を横に動かしても見える位置に留まります。摘要は Ctrl（Mac は Command）を押しながらクリックで、いくつかまとめて選べます。小さな窓は Esc キーでも閉じられます。' +
      '会計年度は、この上の「会計年度」から選べます。';
    var helpMark = el('span', { title: helpTip }, '?');
    helpMark.setAttribute('aria-label', helpTip);
    helpMark.style.cssText =
      'display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;' +
      'border-radius:50%;border:1px solid #90a4ae;background:#fff;color:#37474f;' +
      'font-size:13px;font-weight:700;cursor:help;line-height:1;flex-shrink:0;';

    var titleRow = el('div', { className: 'jbis-budget-dash-title-row' });
    titleRow.style.cssText = 'display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:0 0 6px 0;';
    titleRow.appendChild(title);
    titleRow.appendChild(helpMark);

    var refBar = el('div', { className: 'jbis-budget-dash-refbar' });
    refBar.style.cssText =
      'display:none;font-size:12px;padding:8px 10px;margin:0 0 8px 0;border-radius:6px;border:1px solid #ffe082;background:#fffde7;color:#5d4037;line-height:1.45;';

    function updateRefBar() {
      var tfy = currentFiscalStartYear();
      if (dashCtx.fy !== tfy) {
        refBar.style.display = 'block';
        refBar.textContent =
          '表示中の会計年度は ' +
          dashCtx.fy +
          ' 年度（' +
          dashCtx.fy +
          '年5月〜' +
          (dashCtx.fy + 1) +
          '年4月）です。いまの年度以外を開いているときは、主に見るだけの用途です。数字を直したり新しく登録したりするときは、「' +
          LABEL_BUDGET_APP +
          '」「' +
          LABEL_CHANGE_APP +
          '」「' +
          LABEL_ACTUAL_APP +
          '」の画面から行ってください。';
      } else {
        refBar.style.display = 'none';
      }
    }

    function subTextForFy(fy) {
      return (
        '会計年度（' +
        fy +
        '年5月〜' +
        (fy + 1) +
        '年4月）の、予算と実績を一覧にしています。工種・請求会社・摘要の組み合わせごとに並びます。固定費も変動費も、「予算」と「実績」の両方の行を見ると把握しやすくなります。' +
        'いちばん上は、固定費・変動費をまとめた全体一覧（工種・請求会社・摘要単位）で、表の最後に全体の合計行があります。費用区分で「固定費だけ」等にしても、先頭の一覧は固定・変動の行を欠かさず出します。その下に、絞り込みが効いた固定費・変動費の表があります。' +
        'くわしい使い方はタイトル横の「？」、数字の意味はこの表の下の説明をご覧ください。'
      );
    }

    var sub = el('p', {}, subTextForFy(dashCtx.fy));
    sub.style.margin = '0 0 10px 0';
    sub.style.fontSize = '12px';
    sub.style.color = '#546e7a';
    sub.style.lineHeight = '1.45';

    var filterRow = el('div', { className: 'jbis-budget-dash-filters' });
    filterRow.style.display = 'flex';
    filterRow.style.flexWrap = 'wrap';
    filterRow.style.gap = '10px';
    filterRow.style.marginBottom = '10px';
    filterRow.style.alignItems = 'center';

    var labFy = el('label', {}, '会計年度');
    labFy.style.fontSize = '12px';
    var selFy = el('select', {});
    selFy.style.marginLeft = '6px';
    selFy.style.fontSize = '12px';
    selFy.style.minWidth = '200px';
    var centerFy = currentFiscalStartYear();
    var fi;
    for (fi = 0; fi < 9; fi++) {
      var yOpt = centerFy - fi;
      var optFy = document.createElement('option');
      optFy.value = String(yOpt);
      optFy.textContent = yOpt + '年度（' + yOpt + '年5月〜' + (yOpt + 1) + '年4月）';
      selFy.appendChild(optFy);
    }
    if (!selFy.querySelector('option[value="' + String(dashCtx.fy) + '"]')) {
      var optExtra = document.createElement('option');
      optExtra.value = String(dashCtx.fy);
      optExtra.textContent =
        dashCtx.fy + '年度（' + dashCtx.fy + '年5月〜' + (dashCtx.fy + 1) + '年4月）';
      selFy.insertBefore(optExtra, selFy.firstChild);
    }
    selFy.value = String(dashCtx.fy);
    labFy.appendChild(selFy);

    var labCost = el('label', {}, '費用区分');
    labCost.style.fontSize = '12px';
    var selCost = el('select', {});
    selCost.style.marginLeft = '6px';
    selCost.style.fontSize = '12px';
    var costOpts = [
      ['all', 'すべて'],
      ['fixed', '固定費だけ'],
      ['variable', '変動費だけ'],
      ['hybrid', '固定費と変動費の両方（工種マスタの設定どおり）'],
      ['unset', '区分がまだ決まっていない工種'],
    ];
    var ci;
    for (ci = 0; ci < costOpts.length; ci++) {
      var oc = document.createElement('option');
      oc.value = costOpts[ci][0];
      oc.textContent = costOpts[ci][1];
      selCost.appendChild(oc);
    }
    labCost.appendChild(selCost);

    var labDiagOnly = el('label', {});
    labDiagOnly.style.cssText = 'display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;';
    var chkDiagOnly = el('input', { type: 'checkbox' });
    labDiagOnly.appendChild(chkDiagOnly);
    labDiagOnly.appendChild(document.createTextNode('確認メッセージがある行だけに絞る'));

    var ih = yearApi && yearApi.initialHash ? yearApi.initialHash : parseDashHash();
    selCost.value = ih.cost || 'all';
    chkDiagOnly.checked = !!ih.diag;
    var mode = ih.mode === 'learning' ? 'learning' : 'initial';
    /** 固定費／変動費ブロックの順: vf=変動を先、fv=固定を先（初期は固定を先） */
    var sectionOrder = ih.order === 'vf' ? 'vf' : 'fv';

    var labCo = el('label', {}, '会社');
    labCo.style.fontSize = '12px';
    var inpCo = el('input', { type: 'text', placeholder: '会社名の一部' });
    inpCo.style.marginLeft = '6px';
    inpCo.style.padding = '4px 8px';
    inpCo.style.width = '160px';
    labCo.appendChild(inpCo);

    var labJob = el('label', {}, '工種');
    labJob.style.fontSize = '12px';
    var inpJob = el('input', { type: 'text', placeholder: '工種コードの一部' });
    inpJob.style.marginLeft = '6px';
    inpJob.style.padding = '4px 8px';
    inpJob.style.width = '120px';
    labJob.appendChild(inpJob);

    var modeRow = el('div', { className: 'jbis-budget-dash-modes' });
    modeRow.style.display = 'flex';
    modeRow.style.gap = '8px';
    modeRow.style.marginLeft = 'auto';

    var btnInit = el('button', { type: 'button' }, 'くわしく見る（' + COPY_DASH_FOUR_ROWS + 'の4段）');
    var btnLearn = el('button', { type: 'button' }, 'かんたんに見る（実績と予算の使用率の2段）');
    [btnInit, btnLearn].forEach(function (b) {
      b.style.padding = '6px 10px';
      b.style.fontSize = '12px';
      b.style.cursor = 'pointer';
    });
    modeRow.appendChild(btnInit);
    modeRow.appendChild(btnLearn);

    filterRow.appendChild(labFy);
    filterRow.appendChild(labCost);
    filterRow.appendChild(labDiagOnly);
    filterRow.appendChild(labCo);
    filterRow.appendChild(labJob);
    filterRow.appendChild(modeRow);

    var filterRow2 = el('div', { className: 'jbis-budget-dash-filters-summary' });
    filterRow2.style.cssText =
      'display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;margin-bottom:10px;width:100%;';
    var labSum = el('div', {});
    labSum.style.cssText =
      'display:flex;gap:10px;align-items:flex-start;font-size:12px;flex:1;min-width:200px;max-width:min(720px,100%);';
    var labSumTit = el('span', {}, '摘要');
    labSumTit.style.cssText = 'margin-top:6px;flex-shrink:0;font-weight:600;color:#37474f;';
    var selSumWrap = el('div', {});
    selSumWrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex:1;min-width:180px;';
    var selSum = el('select', { multiple: 'multiple', size: '5' });
    selSum.style.cssText = 'width:100%;font-size:12px;padding:4px;';
    selSum.title =
      'Ctrl（Windows）または Command（Mac）を押しながらクリックで、摘要を複数選べます。何も選ばないときは、すべての摘要を表示します。';
    var sumHint = el(
      'span',
      {},
      '何も選ばない＝摘要はすべて表示。複数選ぶ＝どれかに当てはまる行だけ表示'
    );
    sumHint.style.cssText = 'font-size:11px;color:#78909c;';
    var summaryChoices = uniqueSummariesFromState(dashCtx.state);
    var sq;
    for (sq = 0; sq < summaryChoices.length; sq++) {
      var sval = summaryChoices[sq];
      var opt = document.createElement('option');
      opt.value = sval;
      opt.textContent = sval === '' ? '（摘要未設定）' : sval;
      selSum.appendChild(opt);
    }
    selSumWrap.appendChild(selSum);
    selSumWrap.appendChild(sumHint);
    labSum.appendChild(labSumTit);
    labSum.appendChild(selSumWrap);
    filterRow2.appendChild(labSum);

    var tableHost = el('div', { className: 'jbis-budget-dash-tablehost' });

    var stickyStyleEl = document.getElementById('jbis-budget-dash-sticky-style');
    if (!stickyStyleEl) {
      stickyStyleEl = document.createElement('style');
      stickyStyleEl.id = 'jbis-budget-dash-sticky-style';
      document.head.appendChild(stickyStyleEl);
    }
    var stLeft1 = STICKY_W_JOB;
    var stLeft2 = stLeft1 + STICKY_W_CO;
    var stLeft3 = stLeft2 + STICKY_W_SU;
    var stLeft4 = stLeft3 + STICKY_W_DIAG;
    stickyStyleEl.textContent =
      '.jbis-budget-dash-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-0,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-1,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-2,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-3,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-4{' +
      'position:sticky;box-sizing:border-box;vertical-align:middle;}' +
      '.jbis-dash-ellipsis-cell{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-0{left:0;z-index:8;width:' +
      STICKY_W_JOB +
      'px;min-width:' +
      STICKY_W_JOB +
      'px;max-width:' +
      STICKY_W_JOB +
      'px;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-1{left:' +
      stLeft1 +
      'px;z-index:7;width:' +
      STICKY_W_CO +
      'px;min-width:' +
      STICKY_W_CO +
      'px;max-width:' +
      STICKY_W_CO +
      'px;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-2{left:' +
      stLeft2 +
      'px;z-index:6;width:' +
      STICKY_W_SU +
      'px;min-width:' +
      STICKY_W_SU +
      'px;max-width:' +
      STICKY_W_SU +
      'px;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-3{left:' +
      stLeft3 +
      'px;z-index:5;width:' +
      STICKY_W_DIAG +
      'px;min-width:' +
      STICKY_W_DIAG +
      'px;max-width:' +
      STICKY_W_DIAG +
      'px;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table .jbis-dash-sticky-4{left:' +
      stLeft4 +
      'px;z-index:4;width:' +
      STICKY_W_N +
      'px;min-width:' +
      STICKY_W_N +
      'px;max-width:' +
      STICKY_W_N +
      'px;' +
      'box-shadow:4px 0 10px rgba(0,0,0,.1);}' +
      '.jbis-dash-diag-btn{font:inherit;}' +
      '.jbis-dash-diag-btn:focus-visible{outline:2px solid #1565c0;outline-offset:2px;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table thead .jbis-dash-sticky-0,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table thead .jbis-dash-sticky-1,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table thead .jbis-dash-sticky-2,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table thead .jbis-dash-sticky-3,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table thead .jbis-dash-sticky-4{z-index:12;background:#e8eaf6;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table tbody td.jbis-dash-sticky-0{background:#fff;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table tbody td.jbis-dash-sticky-1,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table tbody td.jbis-dash-sticky-2,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table tbody td.jbis-dash-sticky-3,' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table tbody td.jbis-dash-sticky-4{background:#fafafa;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table-jobgrand .jbis-dash-sticky-jobgrand-count{' +
      'position:sticky;box-sizing:border-box;vertical-align:middle;left:' +
      STICKY_W_JOB +
      'px;z-index:7;width:' +
      STICKY_W_N +
      'px;min-width:' +
      STICKY_W_N +
      'px;max-width:' +
      STICKY_W_N +
      'px;box-shadow:4px 0 10px rgba(0,0,0,.1);}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table-jobgrand thead .jbis-dash-sticky-jobgrand-count{' +
      'z-index:12;background:#e8eaf6;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table-jobgrand tbody td.jbis-dash-sticky-jobgrand-count{' +
      'background:#fafafa;}' +
      '.jbis-budget-dash-scroll .jbis-budget-dash-table tr.jbis-dash-row-grand .jbis-dash-grand-sticky{' +
      'position:sticky;left:0;z-index:13;background:#e8eaf6 !important;' +
      'box-shadow:4px 0 10px rgba(0,0,0,.1);vertical-align:middle;}' +
      'td.jbis-dash-has-detail{cursor:help;text-decoration:underline dotted rgba(84,110,122,.5);text-underline-offset:2px;}' +
      'button.jbis-dash-diag-btn{cursor:pointer;}' +
      '#jbis-budget-dash-hoverpop a{color:#1565c0;}' +
      '.jbis-budget-dash-diag-strip{font-size:' +
      dashSz(12) +
      'px;padding:' +
      dashSz(8) +
      'px ' +
      dashSz(10) +
      'px;margin-bottom:8px;border-radius:6px;border:1px solid #ffcc80;background:#fff8e1;color:#5d4037;line-height:1.45;}';

    wrap.appendChild(titleRow);
    wrap.appendChild(refBar);
    wrap.appendChild(sub);
    wrap.appendChild(filterRow);
    wrap.appendChild(filterRow2);

    var sectionOrderRow = el('div', { className: 'jbis-budget-dash-section-order' });
    sectionOrderRow.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px;font-size:' +
      dashSz(11) +
      'px;color:#546e7a;';
    sectionOrderRow.appendChild(
      document.createTextNode('ページ先頭は全体一覧です。その下の「固定費」「変動費」の表の順: ')
    );
    var btnOrdVf = el('button', { type: 'button' }, '変動費の表を先に');
    var btnOrdFv = el('button', { type: 'button' }, '固定費の表を先に');
    [btnOrdVf, btnOrdFv].forEach(function (b) {
      b.style.cssText =
        'padding:' +
        dashSz(4) +
        'px ' +
        dashSz(8) +
        'px;font-size:' +
        dashSz(11) +
        'px;cursor:pointer;border:1px solid #90a4ae;border-radius:4px;background:#fff;color:#37474f;';
    });
    function syncOrderButtons() {
      var onVf = sectionOrder === 'vf';
      btnOrdVf.style.fontWeight = onVf ? '700' : '400';
      btnOrdVf.style.borderColor = onVf ? '#3949ab' : '#90a4ae';
      btnOrdFv.style.fontWeight = !onVf ? '700' : '400';
      btnOrdFv.style.borderColor = !onVf ? '#3949ab' : '#90a4ae';
    }
    btnOrdVf.onclick = function () {
      sectionOrder = 'vf';
      syncOrderButtons();
      pushUiHash();
      redrawTable();
    };
    btnOrdFv.onclick = function () {
      sectionOrder = 'fv';
      syncOrderButtons();
      pushUiHash();
      redrawTable();
    };
    syncOrderButtons();
    sectionOrderRow.appendChild(btnOrdVf);
    sectionOrderRow.appendChild(btnOrdFv);
    wrap.appendChild(sectionOrderRow);

    wrap.appendChild(tableHost);

    updateRefBar();

    function pushUiHash() {
      var frag =
        'fy=' +
        encodeURIComponent(String(dashCtx.fy)) +
        '&cost=' +
        encodeURIComponent(selCost.value) +
        (chkDiagOnly.checked ? '&diag=1' : '') +
        '&mode=' +
        encodeURIComponent(mode) +
        '&order=' +
        encodeURIComponent(sectionOrder);
      writeDashHashFragment(frag);
    }

    function refreshSummarySelectPreserve() {
      var prevSel = {};
      var so;
      for (so = 0; so < selSum.selectedOptions.length; so++) {
        prevSel[selSum.selectedOptions[so].value] = true;
      }
      selSum.innerHTML = '';
      var summaryChoices2 = uniqueSummariesFromState(dashCtx.state);
      var sq2;
      for (sq2 = 0; sq2 < summaryChoices2.length; sq2++) {
        var sval2 = summaryChoices2[sq2];
        var opt2 = document.createElement('option');
        opt2.value = sval2;
        opt2.textContent = sval2 === '' ? '（摘要未設定）' : sval2;
        if (prevSel[sval2]) {
          opt2.selected = true;
        }
        selSum.appendChild(opt2);
      }
    }

    wrap._jbisRefreshYear = function () {
      sub.textContent = subTextForFy(dashCtx.fy);
      if (!selFy.querySelector('option[value="' + String(dashCtx.fy) + '"]')) {
        var ox = document.createElement('option');
        ox.value = String(dashCtx.fy);
        ox.textContent =
          dashCtx.fy + '年度（' + dashCtx.fy + '年5月〜' + (dashCtx.fy + 1) + '年4月）';
        selFy.insertBefore(ox, selFy.firstChild);
      }
      selFy.value = String(dashCtx.fy);
      updateRefBar();
      refreshSummarySelectPreserve();
      pushUiHash();
      redrawTable();
    };

    selFy.onchange = function () {
      var nf = parseInt(selFy.value, 10);
      if (!Number.isFinite(nf) || nf === dashCtx.fy) {
        return;
      }
      tableHost.innerHTML = '';
      tableHost.appendChild(el('div', { className: 'jbis-budget-dash-mini-loading' }, '年度データを読み込み中…'));
      var lastEl = tableHost.firstChild;
      if (lastEl) {
        lastEl.style.padding = '12px';
        lastEl.style.color = '#455a64';
      }
      yearApi
        .onYearChange(nf)
        .then(function () {
          wrap._jbisRefreshYear();
        })
        .catch(function (e) {
          tableHost.innerHTML = '';
          var er = el(
            'div',
            {},
            '年度の読み込みに失敗しました: ' + (e && e.message ? e.message : String(e))
          );
          er.style.cssText = 'padding:12px;color:#c62828;';
          tableHost.appendChild(er);
          selFy.value = String(dashCtx.fy);
        });
    };

    var hoverPop = document.getElementById('jbis-budget-dash-hoverpop');
    var hoverHideTimer = null;
    if (!hoverPop) {
      hoverPop = document.createElement('div');
      hoverPop.id = 'jbis-budget-dash-hoverpop';
      hoverPop.style.cssText =
        'display:none;position:fixed;z-index:100020;max-width:min(420px,calc(100vw - 24px));padding:' +
        dashSz(10) +
        'px ' +
        dashSz(12) +
        'px;background:#fff;border:1px solid #90a4ae;border-radius:6px;box-shadow:0 4px 18px rgba(0,0,0,.18);font-size:' +
        dashSz(11) +
        'px;line-height:1.45;pointer-events:auto;';
      document.body.appendChild(hoverPop);
      hoverPop.addEventListener('mouseenter', function () {
        if (hoverHideTimer) {
          clearTimeout(hoverHideTimer);
          hoverHideTimer = null;
        }
      });
      hoverPop.addEventListener('mouseleave', function () {
        hoverHideTimer = setTimeout(function () {
          hoverPop.style.display = 'none';
          hoverPop._anchorCell = null;
        }, 200);
      });
    }

    if (!hoverPop._jbisDashListeners) {
      hoverPop._jbisDashListeners = true;
      document.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Escape' && ev.key !== 'Esc') {
          return;
        }
        if (hoverPop.style.display === 'block') {
          hoverPop.style.display = 'none';
          hoverPop._anchorCell = null;
        }
      });
      document.addEventListener(
        'mousemove',
        function (ev) {
          if (hoverPop.style.display !== 'block' || !hoverPop._anchorCell) {
            return;
          }
          var ac = hoverPop._anchorCell;
          if (!ac.getBoundingClientRect) {
            return;
          }
          var ar = ac.getBoundingClientRect();
          var pr = hoverPop.getBoundingClientRect();
          var pad = POP_CLOSE_MOUSE_PAD;
          var x = ev.clientX;
          var y = ev.clientY;
          var minL = Math.min(ar.left, pr.left) - pad;
          var maxR = Math.max(ar.right, pr.right) + pad;
          var minT = Math.min(ar.top, pr.top) - pad;
          var maxB = Math.max(ar.bottom, pr.bottom) + pad;
          var inBand = x >= minL && x <= maxR && y >= minT && y <= maxB;
          if (!inBand) {
            hoverPop.style.display = 'none';
            hoverPop._anchorCell = null;
          }
        },
        true
      );
    }

    function scheduleHideHoverPop() {
      hoverHideTimer = setTimeout(function () {
        hoverPop.style.display = 'none';
        hoverPop._anchorCell = null;
      }, 200);
    }

    function cancelHideHoverPop() {
      if (hoverHideTimer) {
        clearTimeout(hoverHideTimer);
        hoverHideTimer = null;
      }
    }

    function sumEntryAmounts(entries) {
      var s = 0;
      var i;
      for (i = 0; i < entries.length; i++) {
        s += Number(entries[i].amount) || 0;
      }
      return s;
    }

    function fillHoverPopChange(entries, cellSum) {
      hoverPop.innerHTML = '';
      var sumList = sumEntryAmounts(entries);
      var sumLine = el('div', {});
      sumLine.style.cssText =
        'font-size:' +
        dashSz(11) +
        'px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e0e0e0;';
      sumLine.appendChild(
        el('strong', {}, '合計（明細の合算）: ' + formatYen(sumList))
      );
      if (Math.abs(sumList - cellSum) > 0.51) {
        sumLine.appendChild(el('div', {}, '表のセル: ' + formatYen(cellSum) + '（差は端数の可能性）'));
      } else {
        sumLine.appendChild(
          el(
            'div',
            { style: { color: '#2e7d32', fontSize: dashSz(10) + 'px', marginTop: '2px' } },
            '※ セル表示と一致'
          )
        );
      }
      hoverPop.appendChild(sumLine);

      var headCh = el(
        'div',
        {},
        '「' + LABEL_CHANGE_APP + '」（' + COPY_DASH_ROW_ADJUST + '）の明細（' + entries.length + ' 件）'
      );
      if (entries.length > POP_DETAIL_MAX_VISIBLE) {
        headCh.textContent =
          '「' +
          LABEL_CHANGE_APP +
          '」（' +
          COPY_DASH_ROW_ADJUST +
          '）の明細（' +
          entries.length +
          ' 件・スクロールで全件）';
      }
      headCh.style.fontWeight = '600';
      headCh.style.marginBottom = '6px';
      headCh.style.fontSize = dashSz(12) + 'px';
      hoverPop.appendChild(headCh);
      var ul = document.createElement('ul');
      ul.style.cssText =
        'margin:0;padding-left:1.1em;max-height:' +
        dashSz(POP_LIST_MAX_HEIGHT_PX) +
        'px;overflow-y:auto;overflow-x:hidden;';
      var ei;
      for (ei = 0; ei < entries.length; ei++) {
        var ent = entries[ei];
        var li = document.createElement('li');
        li.style.margin = dashSz(3) + 'px 0';
        var txt = formatYen(ent.amount) + (ent.reason ? ' — ' + ent.reason : ' — （理由なし）');
        if (ent.id) {
          var a = el('a', { href: appRecordShowUrl(APP_CHANGE, ent.id), target: '_blank', rel: 'noopener' }, txt);
          li.appendChild(a);
        } else {
          li.textContent = txt;
        }
        ul.appendChild(li);
      }
      hoverPop.appendChild(ul);
    }

    function fillHoverPopActual(entries, cellSum) {
      hoverPop.innerHTML = '';
      var sumList = sumEntryAmounts(entries);
      var sumLine = el('div', {});
      sumLine.style.cssText =
        'font-size:' +
        dashSz(11) +
        'px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e0e0e0;';
      sumLine.appendChild(
        el('strong', {}, '合計（明細の合算）: ' + formatYen(sumList))
      );
      if (Math.abs(sumList - cellSum) > 0.51) {
        sumLine.appendChild(el('div', {}, '表のセル: ' + formatYen(cellSum)));
      } else {
        sumLine.appendChild(
          el(
            'div',
            { style: { color: '#2e7d32', fontSize: dashSz(10) + 'px', marginTop: '2px' } },
            '※ セル表示と一致'
          )
        );
      }
      hoverPop.appendChild(sumLine);

      var head = el('div', {}, LABEL_ACTUAL_APP + 'の明細（' + entries.length + ' 件）');
      head.style.fontWeight = '600';
      head.style.marginBottom = '6px';
      head.style.fontSize = dashSz(12) + 'px';
      if (entries.length > POP_DETAIL_MAX_VISIBLE) {
        head.textContent = LABEL_ACTUAL_APP + 'の明細（' + entries.length + ' 件・下をスクロール）';
      }
      hoverPop.appendChild(head);
      var ul = document.createElement('ul');
      ul.style.cssText =
        'margin:0;padding-left:1.1em;max-height:' +
        dashSz(POP_LIST_MAX_HEIGHT_PX) +
        'px;overflow-y:auto;overflow-x:hidden;';
      var ej;
      for (ej = 0; ej < entries.length; ej++) {
        var en = entries[ej];
        var li2 = document.createElement('li');
        li2.style.margin = dashSz(3) + 'px 0';
        var txt2 = formatYen(en.amount) + (en.memo ? ' — ' + en.memo : '');
        if (en.id) {
          var a2 = el('a', { href: appRecordShowUrl(APP_ACTUAL, en.id), target: '_blank', rel: 'noopener' }, txt2);
          li2.appendChild(a2);
        } else {
          li2.textContent = txt2;
        }
        ul.appendChild(li2);
      }
      hoverPop.appendChild(ul);
    }

    function positionHoverPopNear(anchor) {
      hoverPop.style.display = 'block';
      hoverPop._anchorCell = anchor;
      var r = anchor.getBoundingClientRect();
      var w = hoverPop.offsetWidth || 300;
      var left = r.left;
      if (left + w > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - w - 8);
      }
      hoverPop.style.left = left + 'px';
      var top = r.bottom + 4;
      var h = hoverPop.offsetHeight || 120;
      if (top + h > window.innerHeight - 8) {
        top = Math.max(8, r.top - h - 4);
      }
      hoverPop.style.top = top + 'px';
    }

    function bindHoverPop(td, kindPop, cell, cellSum) {
      var entries = kindPop === 'change' ? cell.changeEntries : cell.actualEntries;
      if (!entries || !entries.length) {
        return;
      }
      function showPop() {
        cancelHideHoverPop();
        if (kindPop === 'change') {
          fillHoverPopChange(entries, cellSum);
        } else {
          fillHoverPopActual(entries, cellSum);
        }
        positionHoverPopNear(td);
      }
      td.onmouseenter = showPop;
      td.onmouseleave = scheduleHideHoverPop;
      td.onclick = function (ev) {
        if (ev) {
          ev.stopPropagation();
        }
        showPop();
      };
    }

    /**
     * 先頭の全体一覧のみ: 実績セルクリックで実績アプリのレコードへ。複数件は確認後に別タブで順に開く。キャンセルで明細ポップ。
     */
    function bindActualCellDirectOpen(td, cell, cellSum) {
      var entries = cell.actualEntries || [];
      if (!entries.length) {
        return;
      }
      var withId = [];
      var wi;
      for (wi = 0; wi < entries.length; wi++) {
        if (entries[wi].id) {
          withId.push(entries[wi]);
        }
      }
      td.style.cursor = 'pointer';
      var sp = td.querySelector('span');
      if (sp) {
        sp.style.textDecoration = 'underline';
        sp.style.textDecorationStyle = 'dotted';
        sp.style.textUnderlineOffset = '2px';
        sp.style.color = '#1565c0';
      }
      td.title =
        'クリックで「' +
        LABEL_ACTUAL_APP +
        '」のレコードを開きます。' +
        (withId.length > 1
          ? '複数件のときは確認のあと、別タブで順に開きます。キャンセルすると明細一覧を表示します。'
          : withId.length === 1
            ? '別タブで開きます。'
            : 'レコードIDのない明細のみのときは、クリックで明細一覧を表示します。');
      td.onmouseenter = null;
      td.onmouseleave = null;
      td.onclick = function (ev) {
        if (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }
        if (!withId.length) {
          cancelHideHoverPop();
          fillHoverPopActual(entries, cellSum);
          positionHoverPopNear(td);
          return;
        }
        if (withId.length === 1) {
          window.open(appRecordShowUrl(APP_ACTUAL, withId[0].id), '_blank', 'noopener,noreferrer');
          return;
        }
        var msg =
          'この月の実績は ' +
          withId.length +
          ' 件のレコードに分かれています。\n\n' +
          '「OK」… すべて別タブで開きます（少しずつ開きます）\n' +
          '「キャンセル」… 一覧を小さな窓で表示し、リンクから個別に開けます';
        if (withId.length > 6) {
          msg +=
            '\n\n※ 件数が多いときは、ブラウザが追加タブをブロックすることがあります。その場合は「キャンセル」から一覧で開いてください。';
        }
        if (window.confirm(msg)) {
          var ii;
          for (ii = 0; ii < withId.length; ii++) {
            (function (idx) {
              window.setTimeout(function () {
                window.open(appRecordShowUrl(APP_ACTUAL, withId[idx].id), '_blank', 'noopener,noreferrer');
              }, 120 * idx);
            })(ii);
          }
        } else {
          cancelHideHoverPop();
          fillHoverPopActual(entries, cellSum);
          positionHoverPopNear(td);
        }
      };
    }

    /** 診断はホバーでは開かず、ボタンクリックのみ（誤操作防止・モバイル向け） */
    function bindDiagnosisButton(btn, lines) {
      if (!lines || !lines.length) {
        return;
      }
      function showDiag(ev) {
        if (ev) {
          ev.stopPropagation();
        }
        cancelHideHoverPop();
        hoverPop.innerHTML = '';
        var lix;
        for (lix = 0; lix < lines.length; lix++) {
          var item = lines[lix];
          var isObj = item && typeof item === 'object' && item.main != null;
          if (isObj) {
            var wrap = el('div');
            wrap.style.marginTop = lix ? '10px' : '0';
            var mainEl = el('div', {}, item.main);
            mainEl.style.fontSize = dashSz(11) + 'px';
            mainEl.style.lineHeight = '1.5';
            mainEl.style.whiteSpace = 'pre-line';
            wrap.appendChild(mainEl);
            if (item.footnote) {
              var fnEl = el('div', {}, item.footnote);
              fnEl.style.fontSize = dashSz(9) + 'px';
              fnEl.style.color = '#757575';
              fnEl.style.marginTop = '6px';
              fnEl.style.lineHeight = '1.4';
              wrap.appendChild(fnEl);
            }
            hoverPop.appendChild(wrap);
          } else {
            var blk = el('div', {}, item);
            blk.style.marginTop = lix ? '10px' : '0';
            blk.style.fontSize = dashSz(11) + 'px';
            blk.style.lineHeight = '1.5';
            blk.style.whiteSpace = 'pre-line';
            hoverPop.appendChild(blk);
          }
        }
        positionHoverPopNear(btn);
      }
      btn.addEventListener('click', showDiag);
      btn.addEventListener('mouseleave', scheduleHideHoverPop);
    }

    /**
     * フィルタ後の親を工種でグループ化（コード数値順・同一工種内は会社→摘要）
     * @param {{ ignoreCostFilter?: boolean }} [options] ignoreCostFilter が true のとき、費用区分（固定のみ等）の絞り込みを外す（先頭の全体一覧用）
     */
    function jobGroupsFiltered(options) {
      options = options || {};
      var ignoreCostFilter = options.ignoreCostFilter === true;
      var vcLocal = dashCtx.viewCtx;
      var cmap = dashCtx.costTypeMap || {};
      var diagMemo = {};
      function diagOf(pr) {
        var dk = pr.key;
        if (!diagMemo[dk]) {
          diagMemo[dk] = diagnoseBudgetParent(pr, vcLocal, normalizeCostType(cmap[pr.job]));
        }
        return diagMemo[dk];
      }
      var qCo = inpCo.value.trim().toLowerCase();
      var qJob = inpJob.value.trim().toLowerCase();
      var cf = selCost.value;
      var list = [];
      var k;
      for (k in dashCtx.state.parents) {
        if (!Object.prototype.hasOwnProperty.call(dashCtx.state.parents, k)) {
          continue;
        }
        var pr = dashCtx.state.parents[k];
        if (qCo && pr.company.toLowerCase().indexOf(qCo) === -1) {
          continue;
        }
        if (qJob && pr.job.toLowerCase().indexOf(qJob) === -1) {
          continue;
        }
        if (!ignoreCostFilter) {
          var jcatMaster = normalizeCostType(cmap[pr.job]);
          var sec = pr.sectionCost === 'fixed' || pr.sectionCost === 'variable' ? pr.sectionCost : 'variable';
          if (cf === 'fixed' && sec !== 'fixed') {
            continue;
          }
          if (cf === 'variable' && sec !== 'variable') {
            continue;
          }
          if (cf === 'unset' && jcatMaster !== 'unset') {
            continue;
          }
          if (cf === 'hybrid' && jcatMaster !== 'hybrid') {
            continue;
          }
        }
        var sumOpts = selSum.selectedOptions;
        if (sumOpts.length > 0) {
          var sumOk = false;
          var sx;
          for (sx = 0; sx < sumOpts.length; sx++) {
            if (sumOpts[sx].value === pr.summary) {
              sumOk = true;
              break;
            }
          }
          if (!sumOk) {
            continue;
          }
        }
        if (chkDiagOnly.checked && diagOf(pr).lines.length === 0) {
          continue;
        }
        list.push(pr);
      }
      list.sort(function (a, b) {
        var da = diagOf(a).lines.length > 0 ? 0 : 1;
        var db = diagOf(b).lines.length > 0 ? 0 : 1;
        if (da !== db) {
          return da - db;
        }
        var cj = compareJobCode(a.job, b.job);
        if (cj !== 0) {
          return cj;
        }
        if (a.company !== b.company) {
          return a.company < b.company ? -1 : 1;
        }
        return a.summary < b.summary ? -1 : a.summary > b.summary ? 1 : 0;
      });
      var byCode = {};
      var order = [];
      var i;
      for (i = 0; i < list.length; i++) {
        var p = list[i];
        var code = p.job;
        if (!byCode[code]) {
          byCode[code] = { code: code, name: p.jobName || '', parents: [] };
          order.push(code);
        }
        byCode[code].parents.push(p);
        if (p.jobName && !byCode[code].name) {
          byCode[code].name = p.jobName;
        }
      }
      order.sort(compareJobCode);
      var out = [];
      for (i = 0; i < order.length; i++) {
        out.push(byCode[order[i]]);
      }
      return out;
    }

    function isVerticallyScrollable(el) {
      if (!el) {
        return false;
      }
      var st = window.getComputedStyle(el);
      var oy = st.overflowY;
      if (oy !== 'auto' && oy !== 'scroll') {
        return false;
      }
      return el.scrollHeight > el.clientHeight + 1;
    }

    /**
     * wrap 内のスクロール＋ kintone 側の外枠スクロールの両方に効かせる。
     * document.getElementById はページ先頭の同名 id を拾うと contains で弾かれて何も起きないため、wrap 内を querySelector する。
     */
    function scrollSectionIntoDashWrap(targetEl) {
      if (!targetEl || !wrap) {
        return;
      }
      var margin = 12;
      var scrollers = [];
      var p = targetEl.parentElement;
      while (p && wrap.contains(p)) {
        if (isVerticallyScrollable(p)) {
          scrollers.push(p);
        }
        if (p === wrap) {
          break;
        }
        p = p.parentElement;
      }
      if (isVerticallyScrollable(wrap) && scrollers.indexOf(wrap) === -1) {
        scrollers.push(wrap);
      }
      var iter;
      for (iter = 0; iter < 12; iter++) {
        var moved = false;
        var si;
        for (si = 0; si < scrollers.length; si++) {
          var s = scrollers[si];
          var tr = targetEl.getBoundingClientRect();
          var sr = s.getBoundingClientRect();
          var wantTop = tr.top - sr.top + s.scrollTop - margin;
          var maxS = Math.max(0, s.scrollHeight - s.clientHeight);
          var clamped = Math.min(maxS, Math.max(0, wantTop));
          if (Math.abs(clamped - s.scrollTop) > 1) {
            s.scrollTop = clamped;
            moved = true;
          }
        }
        if (!moved) {
          break;
        }
      }
      var trWin = targetEl.getBoundingClientRect();
      if (trWin.top < margin || trWin.bottom > window.innerHeight - margin) {
        try {
          window.scrollBy({
            top: trWin.top - margin,
            left: 0,
            behavior: 'smooth',
          });
        } catch (err3) {
          window.scrollBy(0, trWin.top - margin);
        }
      }
    }

    function bindDashSectionJump(anchor, sectionId) {
      anchor.setAttribute('href', '#' + sectionId);
      var jumpHandler = function (e) {
        if (e) {
          e.preventDefault();
          if (e.stopPropagation) {
            e.stopPropagation();
          }
        }
        var tgt = wrap.querySelector ? wrap.querySelector('#' + sectionId) : null;
        if (!tgt && typeof document !== 'undefined' && document.getElementById) {
          var byId = document.getElementById(sectionId);
          if (byId && wrap.contains(byId)) {
            tgt = byId;
          }
        }
        if (!tgt) {
          return;
        }
        scrollSectionIntoDashWrap(tgt);
      };
      anchor.addEventListener('click', jumpHandler, true);
      anchor.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          jumpHandler(e);
        }
      });
    }

    function redrawTable() {
      tableHost.innerHTML = '';
      var hi = dashCtx.viewCtx.colHighlightMonth;
      var vc = dashCtx.viewCtx;
      var jobGroups = jobGroupsFiltered();
      var jobGroupsOverall = jobGroupsFiltered({ ignoreCostFilter: true });
      var cmapPart = dashCtx.costTypeMap || {};
      var fixedGroups = [];
      var variableGroups = [];
      var ixg;
      for (ixg = 0; ixg < jobGroups.length; ixg++) {
        var gpart = jobGroups[ixg];
        var fixedParents = [];
        var variableParents = [];
        var ipx;
        for (ipx = 0; ipx < gpart.parents.length; ipx++) {
          var prx = gpart.parents[ipx];
          var scx =
            prx.sectionCost === 'fixed' || prx.sectionCost === 'variable' ? prx.sectionCost : 'variable';
          if (scx === 'fixed') {
            fixedParents.push(prx);
          } else {
            variableParents.push(prx);
          }
        }
        if (fixedParents.length > 0) {
          fixedGroups.push({
            code: gpart.code,
            name: gpart.name,
            parents: fixedParents,
          });
        }
        if (variableParents.length > 0) {
          variableGroups.push({
            code: gpart.code,
            name: gpart.name,
            parents: variableParents,
          });
        }
      }

      function sumForGroups(groups) {
        var colTotals = [];
        var colPlanTotals = [];
        var cti;
        for (cti = 0; cti < 12; cti++) {
          colTotals[cti] = { change: 0, actual: 0 };
          colPlanTotals[cti] = 0;
        }
        var gAnnualBudget = 0;
        var gRowChange = 0;
        var gRowActual = 0;
        var g2;
        for (g2 = 0; g2 < groups.length; g2++) {
          var g2p;
          for (g2p = 0; g2p < groups[g2].parents.length; g2p++) {
            var pr2 = groups[g2].parents[g2p];
            gAnnualBudget += pr2.annualBudget;
            var mx2;
            for (mx2 = 0; mx2 < 12; mx2++) {
              var ch = pr2.monthly[mx2].changeSum;
              var ac = pr2.monthly[mx2].actualSum;
              colTotals[mx2].change += ch;
              colTotals[mx2].actual += ac;
              gRowChange += ch;
              gRowActual += ac;
              colPlanTotals[mx2] +=
                pr2.planByMonth && pr2.planByMonth[mx2] != null ? pr2.planByMonth[mx2] : 0;
            }
          }
        }
        return {
          colTotals: colTotals,
          colPlanTotals: colPlanTotals,
          gAnnualBudget: gAnnualBudget,
          gRowChange: gRowChange,
          gRowActual: gRowActual,
        };
      }

      function buildTheadLocal() {
        var thead = el('thead');
        var hr0 = el('tr');
        var thJob = el('th', { className: 'jbis-dash-col-job jbis-dash-sticky-0' }, '工種');
        thJob.style.border = '1px solid #ccc';
        thJob.style.padding = dashSz(6) + 'px';
        thJob.title =
          LABEL_JOB_MASTER +
          ' に登録した工種です。コードと名称の一部が出ています。名称の全文はマウスを置くと見えます。左の列は表を横に動かしても見える位置に留まります。';
        hr0.appendChild(thJob);
        var thCo = el('th', { className: 'jbis-dash-sticky-1' }, '会社');
        thCo.style.border = '1px solid #ccc';
        thCo.style.padding = dashSz(6) + 'px';
        hr0.appendChild(thCo);
        var thSu = el('th', { className: 'jbis-dash-sticky-2' }, '摘要');
        thSu.style.border = '1px solid #ccc';
        thSu.style.padding = dashSz(6) + 'px';
        hr0.appendChild(thSu);
        var thDiag = el('th', { className: 'jbis-dash-sticky-3' }, '確認');
        thDiag.style.border = '1px solid #ccc';
        thDiag.style.padding = dashSz(4) + 'px';
        thDiag.style.textAlign = 'center';
        thDiag.title = 'クリックすると、確認したい内容の文章が開きます';
        hr0.appendChild(thDiag);
        var thN = el('th', { className: 'jbis-dash-sticky-4' }, '件数');
        thN.style.border = '1px solid #ccc';
        thN.style.padding = dashSz(6) + 'px';
        hr0.appendChild(thN);
        var mc;
        for (mc = 0; mc < 12; mc++) {
          var th = el('th', {}, MONTH_LABELS[mc]);
          th.style.border = '1px solid #ccc';
          th.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
          th.style.background = monthColumnBackground(mc, hi);
          hr0.appendChild(th);
        }
        var thTot = el('th', {}, '年間合計');
        thTot.style.border = '1px solid #ccc';
        thTot.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
        thTot.style.background = '#ede7f6';
        thTot.style.whiteSpace = 'pre';
        hr0.appendChild(thTot);
        thead.appendChild(hr0);
        return thead;
      }

      /** 工種別合計ブロック専用: 会社・摘要・確認列なし（工種・件数＋月・年間）。 */
      function buildTheadLocalByJobGrand() {
        var thead = el('thead');
        var hr0 = el('tr');
        var thJob = el('th', { className: 'jbis-dash-col-job jbis-dash-sticky-0' }, '工種');
        thJob.style.border = '1px solid #ccc';
        thJob.style.padding = dashSz(6) + 'px';
        thJob.title =
          LABEL_JOB_MASTER +
          ' に登録した工種です。コードと名称の一部が出ています。名称の全文はマウスを置くと見えます。左の列は表を横に動かしても見える位置に留まります。';
        hr0.appendChild(thJob);
        var thN = el('th', { className: 'jbis-dash-sticky-jobgrand-count' }, '件数');
        thN.style.border = '1px solid #ccc';
        thN.style.padding = dashSz(6) + 'px';
        thN.style.textAlign = 'center';
        thN.title = 'この工種の明細行（請求会社×摘要の組み合わせ）の数';
        hr0.appendChild(thN);
        var mc;
        for (mc = 0; mc < 12; mc++) {
          var th = el('th', {}, MONTH_LABELS[mc]);
          th.style.border = '1px solid #ccc';
          th.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
          th.style.background = monthColumnBackground(mc, hi);
          hr0.appendChild(th);
        }
        var thTot = el('th', {}, '年間合計');
        thTot.style.border = '1px solid #ccc';
        thTot.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
        thTot.style.background = '#ede7f6';
        thTot.style.whiteSpace = 'pre';
        hr0.appendChild(thTot);
        thead.appendChild(hr0);
        return thead;
      }

      function appendSubtotalRow(tbody, totals, labelText) {
        var colTotals = totals.colTotals;
        var colPlanTotals = totals.colPlanTotals;
        var gAnnualBudget = totals.gAnnualBudget;
        var gRowChange = totals.gRowChange;
        var gRowActual = totals.gRowActual;
        var trG = el('tr');
        trG.className = 'jbis-dash-row-grand';
        trG.style.fontWeight = '700';
        trG.style.background = '#e8eaf6';
        var tdG = el('td', { colSpan: '5' }, labelText);
        tdG.className = 'jbis-dash-grand-sticky';
        tdG.style.border = '1px solid #ccc';
        tdG.style.padding = dashSz(6) + 'px';
        tdG.style.minWidth = STICKY_TOTAL_W + 'px';
        tdG.style.maxWidth = STICKY_TOTAL_W + 'px';
        trG.appendChild(tdG);
        var gx;
        for (gx = 0; gx < 12; gx++) {
          var tdg = el('td');
          tdg.style.border = '1px solid #ccc';
          tdg.style.padding = dashSz(5) + 'px';
          tdg.style.textAlign = 'right';
          tdg.style.fontSize = dashSz(10) + 'px';
          tdg.style.whiteSpace = 'pre-line';
          tdg.style.background = monthColumnBackground(gx, hi);
          var digCol =
            colPlanTotals[gx] > 0 ? (colTotals[gx].actual / colPlanTotals[gx]) * 100 : NaN;
          tdg.textContent =
            '予算 ' +
            formatYen(colPlanTotals[gx]) +
            '\n' +
            COPY_DASH_COMPACT_ADJUST +
            ' ' +
            formatYen(colTotals[gx].change) +
            '\n実績 ' +
            formatYen(colTotals[gx].actual) +
            '\n' +
            COPY_DASH_COMPACT_USAGE +
            ' ' +
            formatPct(digCol);
          if (Number.isFinite(digCol)) {
            tdg.title = digCol > 100 ? COPY_TIP_USAGE_OVER : COPY_TIP_USAGE_ROW;
          }
          if (Number.isFinite(digCol) && digCol > 100) {
            tdg.style.color = '#b71c1c';
            tdg.style.fontWeight = '700';
          }
          trG.appendChild(tdg);
        }
        var tdGtot = el('td');
        tdGtot.style.border = '1px solid #ccc';
        tdGtot.style.padding = dashSz(5) + 'px';
        tdGtot.style.textAlign = 'right';
        tdGtot.style.fontSize = dashSz(10) + 'px';
        tdGtot.style.whiteSpace = 'pre-line';
        tdGtot.style.background = '#ede7f6';
        var gPlanYear = 0;
        var gpi;
        for (gpi = 0; gpi < 12; gpi++) {
          gPlanYear += colPlanTotals[gpi];
        }
        var gDig = gPlanYear > 0 ? (gRowActual / gPlanYear) * 100 : NaN;
        tdGtot.textContent =
          '予算 ' +
          formatYen(gAnnualBudget) +
          '\n' +
          COPY_DASH_COMPACT_ADJUST +
          ' ' +
          formatYen(gRowChange) +
          '\n実績 ' +
          formatYen(gRowActual) +
          '\n' +
          COPY_DASH_COMPACT_USAGE +
          ' ' +
          formatPct(gDig);
        if (Number.isFinite(gDig)) {
          tdGtot.title = gDig > 100 ? COPY_TIP_USAGE_OVER : COPY_TIP_USAGE_ROW;
        }
        if (Number.isFinite(gDig) && gDig > 100) {
          tdGtot.style.color = '#b71c1c';
          tdGtot.style.fontWeight = '700';
        }
        trG.appendChild(tdGtot);
        tbody.appendChild(trG);
      }

      /**
       * 工種別合計ブロック用。左は工種・件数のみ（会社・摘要・確認列なし）。
       * 4行: 当初予算・調整・実績・使用率（使用率は当初＋その月の調整に対する実績）。
       */
      function appendGrandTotalFourRows(tbody, totals, grp, rowBg) {
        var colTotals = totals.colTotals;
        var colPlanTotals = totals.colPlanTotals;
        var gAnnualBudget = totals.gAnnualBudget;
        var gRowChange = totals.gRowChange;
        var gRowActual = totals.gRowActual;
        var gPlanYear = 0;
        var gpi;
        for (gpi = 0; gpi < 12; gpi++) {
          gPlanYear += colPlanTotals[gpi];
        }
        var adjYear = gPlanYear + gRowChange;
        var gDigYear = adjYear > 0 ? (gRowActual / adjYear) * 100 : NaN;

        var tdLeft = el('td', { rowSpan: '4' });
        tdLeft.className = 'jbis-dash-col-job jbis-dash-sticky-0';
        tdLeft.style.border = '1px solid #ccc';
        tdLeft.style.padding = dashSz(8) + 'px ' + dashSz(6) + 'px';
        tdLeft.style.verticalAlign = 'middle';
        tdLeft.style.background = rowBg;
        var codeEl = el('div', { className: 'jbis-dash-ellipsis-cell' }, grp.code || '—');
        codeEl.style.fontWeight = '700';
        codeEl.style.fontSize = dashSz(12) + 'px';
        tdLeft.appendChild(codeEl);
        var nameEl = el('div', { className: 'jbis-dash-ellipsis-cell' }, grp.name || '—');
        nameEl.style.cssText =
          'font-size:' +
          dashSz(10) +
          'px;color:#546e7a;margin-top:3px;line-height:1.25;max-height:2.5em;';
        tdLeft.appendChild(nameEl);

        var cntParents = grp.parents.length;
        var tdN = el('td', { rowSpan: '4' }, String(cntParents));
        tdN.className = 'jbis-dash-sticky-jobgrand-count';
        tdN.style.border = '1px solid #ccc';
        tdN.style.padding = dashSz(6) + 'px';
        tdN.style.verticalAlign = 'middle';
        tdN.style.textAlign = 'center';
        tdN.title = 'この工種の行（請求会社×摘要の組み合わせ）の数';
        tdN.style.background = rowBg;

        var trB = el('tr');
        trB.className = 'jbis-dash-row-grand jbis-dash-row-budget';
        trB.style.background = rowBg;
        trB.title = '工種別・当初予算';
        trB.appendChild(tdLeft);
        trB.appendChild(tdN);
        var gx;
        for (gx = 0; gx < 12; gx++) {
          var tdb = el('td');
          tdb.style.border = '1px solid #ccc';
          tdb.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
          tdb.style.textAlign = 'right';
          tdb.style.background = monthColumnBackground(gx, hi);
          tdb.textContent = formatYen(colPlanTotals[gx]);
          trB.appendChild(tdb);
        }
        var tdYB = el('td');
        tdYB.style.border = '1px solid #ccc';
        tdYB.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
        tdYB.style.textAlign = 'right';
        tdYB.style.background = '#ede7f6';
        tdYB.textContent = formatYen(gAnnualBudget);
        trB.appendChild(tdYB);
        tbody.appendChild(trB);

        var trC = el('tr');
        trC.className = 'jbis-dash-row-grand jbis-dash-row-change';
        trC.style.background = rowBg;
        trC.title = '工種別・' + COPY_DASH_ROW_ADJUST;
        for (gx = 0; gx < 12; gx++) {
          var tdc = el('td');
          tdc.style.border = '1px solid #ccc';
          tdc.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
          tdc.style.textAlign = 'right';
          tdc.style.background = monthColumnBackground(gx, hi);
          tdc.textContent = formatYen(colTotals[gx].change);
          trC.appendChild(tdc);
        }
        var tdYC = el('td');
        tdYC.style.border = '1px solid #ccc';
        tdYC.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
        tdYC.style.textAlign = 'right';
        tdYC.style.background = '#ede7f6';
        tdYC.textContent = formatYen(gRowChange);
        trC.appendChild(tdYC);
        tbody.appendChild(trC);

        var trA = el('tr');
        trA.className = 'jbis-dash-row-grand jbis-dash-row-actual';
        trA.style.background = rowBg;
        trA.title = '工種別・実績';
        for (gx = 0; gx < 12; gx++) {
          var tda = el('td');
          tda.style.border = '1px solid #ccc';
          tda.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
          tda.style.textAlign = 'right';
          tda.style.background = monthColumnBackground(gx, hi);
          tda.textContent = formatYen(colTotals[gx].actual);
          trA.appendChild(tda);
        }
        var tdYA = el('td');
        tdYA.style.border = '1px solid #ccc';
        tdYA.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
        tdYA.style.textAlign = 'right';
        tdYA.style.background = '#ede7f6';
        tdYA.textContent = formatYen(gRowActual);
        trA.appendChild(tdYA);
        tbody.appendChild(trA);

        var trD = el('tr');
        trD.className = 'jbis-dash-row-grand jbis-dash-row-digest';
        trD.style.background = rowBg;
        trD.title =
          COPY_DASH_ROW_USAGE +
          'の目安（実績÷（当初予算＋調整））。100％を超えたセルは赤表示—マウスを置くと超過の説明が出ます。';
        for (gx = 0; gx < 12; gx++) {
          var adjM = colPlanTotals[gx] + colTotals[gx].change;
          var tdd = el('td');
          tdd.style.border = '1px solid #ccc';
          tdd.style.padding = dashSz(2) + 'px ' + dashSz(6) + 'px';
          tdd.style.textAlign = 'right';
          tdd.style.background = monthColumnBackground(gx, hi);
          var digM = adjM > 0 ? (colTotals[gx].actual / adjM) * 100 : NaN;
          renderDigestPctCell(tdd, digM);
          trD.appendChild(tdd);
        }
        var tdYD = el('td');
        tdYD.style.border = '1px solid #ccc';
        tdYD.style.padding = dashSz(2) + 'px ' + dashSz(6) + 'px';
        tdYD.style.textAlign = 'right';
        tdYD.style.background = '#ede7f6';
        renderDigestPctCell(tdYD, gDigYear);
        trD.appendChild(tdYD);
        tbody.appendChild(trD);
      }

      /** 工種ごとの4行。詳細は下のブロックへ。 */
      function appendGrandTotalByJobRows(tbody, jobGroups, hi) {
        var ji;
        for (ji = 0; ji < jobGroups.length; ji++) {
          var g = jobGroups[ji];
          var tOne = sumForGroups([g]);
          var zebra = ji % 2 === 0 ? '#ffffff' : '#f5f5f5';
          appendGrandTotalFourRows(tbody, tOne, g, zebra);
        }
      }

      function appendBodyRows(tbody, groups, costSection, bodyOpts) {
        bodyOpts = bodyOpts || {};
        var actualOverallDirect = bodyOpts.actualOverallDirect === true;
        var cs = costSection === 'fixed' || costSection === 'variable' ? costSection : 'all';
        var titleBudget =
          cs === 'variable'
            ? 'その月の予算（' +
              LABEL_BUDGET_APP +
              ' の月ごとの欄、または ' +
              LABEL_CHANGE_APP +
              ' で調整したあと）。変動費は年間を12で割って均等にはしません'
            : cs === 'fixed'
              ? 'その月の予算（' +
                LABEL_BUDGET_APP +
                ' の合計。月の欄が空のときだけ、年間を12で割って並べます［固定費］）'
              : 'その月の予算（固定費は月が空なら年間÷12、変動費はかかる月だけ）';
        var titleActual =
          cs === 'variable'
            ? 'その月に使った金額（' +
              LABEL_ACTUAL_APP +
              '）。支払いや計上した月で入力。予算の月とそろえると見比べやすいです'
            : cs === 'fixed'
              ? 'その月に使った金額（' + LABEL_ACTUAL_APP + '）。支払い・計上の月で入力'
              : 'その月に使った金額（' +
                LABEL_ACTUAL_APP +
                '）。変動費は予算と同じ月に入れると分かりやすいです';
        var gi;
        for (gi = 0; gi < groups.length; gi++) {
          var grp = groups[gi];
          var rowsPerParent = mode === 'learning' ? 2 : 4;
          var rowspanJob = rowsPerParent * grp.parents.length;
          var pj;
          for (pj = 0; pj < grp.parents.length; pj++) {
            var pr = grp.parents[pj];
            var shareFallback = monthlyBudgetShare(pr.annualBudget);
            var rowChangeTot = 0;
            var rowActualTot = 0;

            var ri;
            for (ri = 0; ri < rowsPerParent; ri++) {
              var kind = mode === 'learning' ? ri + 2 : ri;
              var tr = el('tr');
              tr.className = 'jbis-dash-row-' + ['budget', 'change', 'actual', 'digest'][kind];
              tr.title = [titleBudget, COPY_TIP_ADJUST_ROW, titleActual, COPY_TIP_USAGE_ROW][kind];

              if (ri === 0 && pj === 0) {
                var tdj = el('td', { rowSpan: String(rowspanJob) });
                tdj.className = 'jbis-dash-col-job jbis-dash-sticky-0';
                tdj.style.border = '1px solid #ccc';
                tdj.style.padding = dashSz(8) + 'px ' + dashSz(6) + 'px';
                tdj.title = grp.name
                  ? grp.name + '（コード ' + (grp.code || '—') + '）'
                  : 'コード ' + (grp.code || '—');
                var codeEl = el('div', { className: 'jbis-dash-ellipsis-cell' }, grp.code || '—');
                codeEl.style.fontWeight = '700';
                codeEl.style.fontSize = dashSz(12) + 'px';
                tdj.appendChild(codeEl);
                var nameEl = el('div', { className: 'jbis-dash-ellipsis-cell' }, grp.name || '—');
                nameEl.style.cssText =
                  'font-size:' +
                  dashSz(10) +
                  'px;color:#546e7a;margin-top:3px;line-height:1.25;max-height:1.25em;';
                tdj.appendChild(nameEl);
                tr.appendChild(tdj);
              }

              if (ri === 0) {
                var tdc = el('td', { rowSpan: String(rowsPerParent), className: 'jbis-dash-sticky-1' });
                tdc.style.border = '1px solid #ccc';
                tdc.style.padding = dashSz(6) + 'px';
                tdc.style.verticalAlign = 'middle';
                tdc.title = pr.company;
                var divCo = el('div', { className: 'jbis-dash-ellipsis-cell' }, pr.company);
                tdc.appendChild(divCo);
                tr.appendChild(tdc);
                var tds = el('td', { rowSpan: String(rowsPerParent), className: 'jbis-dash-sticky-2' });
                tds.style.border = '1px solid #ccc';
                tds.style.padding = dashSz(6) + 'px';
                tds.style.verticalAlign = 'middle';
                tds.title = pr.summary;
                var divSu = el('div', { className: 'jbis-dash-ellipsis-cell' }, pr.summary);
                tds.appendChild(divSu);
                tr.appendChild(tds);
                var diag = diagnoseBudgetParent(pr, vc, normalizeCostType(cmapPart[pr.job]));
                var tdDiag = el('td', { rowSpan: String(rowsPerParent), className: 'jbis-dash-sticky-3' });
                tdDiag.style.border = '1px solid #ccc';
                tdDiag.style.padding = dashSz(4) + 'px ' + dashSz(3) + 'px';
                tdDiag.style.verticalAlign = 'middle';
                tdDiag.style.textAlign = 'center';
                if (diag.lines.length) {
                  var diagBtn = el('button', {
                    type: 'button',
                    className: 'jbis-dash-diag-btn',
                    'aria-label': '確認内容を表示（' + diag.lines.length + ' 件）',
                  });
                  diagBtn.textContent = '⚠️ 確認 ' + diag.lines.length + '件';
                  diagBtn.style.cssText =
                    'width:100%;box-sizing:border-box;padding:' +
                    dashSz(5) +
                    'px ' +
                    dashSz(4) +
                    'px;margin:0;' +
                    'border:1px solid #ffb74d;border-radius:4px;background:#fff3e0;' +
                    'color:#bf360c;font-size:' +
                    dashSz(10) +
                    'px;font-weight:600;line-height:1.2;' +
                    'text-align:center;white-space:normal;word-break:break-all;';
                  tdDiag.appendChild(diagBtn);
                  bindDiagnosisButton(diagBtn, diag.lines);
                } else {
                  var diagEmpty = el('span', {}, '—');
                  diagEmpty.style.color = '#bdbdbd';
                  diagEmpty.style.fontSize = dashSz(12) + 'px';
                  tdDiag.appendChild(diagEmpty);
                }
                tr.appendChild(tdDiag);
                var tdn = el(
                  'td',
                  { rowSpan: String(rowsPerParent), className: 'jbis-dash-sticky-4' },
                  String(pr.childKeys.length)
                );
                tdn.style.border = '1px solid #ccc';
                tdn.style.padding = dashSz(6) + 'px';
                tdn.style.verticalAlign = 'middle';
                tdn.style.textAlign = 'center';
                tdn.title =
                  'この工種・請求会社・摘要の組み合わせに、予算・調整・実績の登録が合わせていくつあるかの目安です';
                tr.appendChild(tdn);
              }

              var mx;
              for (mx = 0; mx < 12; mx++) {
                var cell = pr.monthly[mx];
                var td = el('td');
                td.style.border = '1px solid #ccc';
                td.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
                td.style.textAlign = 'right';
                td.style.background = monthCellBackground(mx, hi);

                if (kind === 0) {
                  var planM =
                    pr.planByMonth && pr.planByMonth[mx] != null ? pr.planByMonth[mx] : shareFallback;
                  td.textContent = formatYen(planM);
                } else if (kind === 1) {
                  var c1 = cell.changeSum;
                  td.style.position = 'relative';
                  td.title = COPY_TIP_ADJUST_ROW;
                  var chgTxt = el('span', {}, formatYen(c1));
                  td.appendChild(chgTxt);
                  if (c1 !== 0) {
                    var chgMark = el(
                      'span',
                      {
                        title:
                          'この月に「' +
                          LABEL_CHANGE_APP +
                          '」で増減の登録があります。理由はアプリで確認できます。',
                      },
                      '▲'
                    );
                    chgMark.style.cssText =
                      'position:absolute;top:1px;right:2px;font-size:' +
                      dashSz(8) +
                      'px;color:#e65100;line-height:1;z-index:1;pointer-events:none;';
                    td.appendChild(chgMark);
                  }
                  if (cell.changeReasons.length) {
                    td.title = cell.changeReasons.join(' / ');
                  }
                  if (cell.changeEntries && cell.changeEntries.length) {
                    bindHoverPop(td, 'change', cell, c1);
                  }
                  rowChangeTot += c1;
                } else if (kind === 2) {
                  var a = cell.actualSum;
                  var cnt = cell.actualCount;
                  td.style.position = 'relative';
                  var planForAlert =
                    pr.planByMonth && pr.planByMonth[mx] != null ? pr.planByMonth[mx] : shareFallback;
                  var monthElapsed = isMonthElapsedForView(mx, vc);
                  if (monthElapsed && planForAlert > 0.5 && a === 0) {
                    td.style.background = '#eceff1';
                    td.style.boxShadow = 'inset 3px 0 0 #90a4ae';
                    td.title =
                      '予算はあるのに、この月の実績がまだ入っていません（' +
                      LABEL_ACTUAL_APP +
                      ' の入力を確認してください）';
                  }
                  var actSpan = el('span', {}, formatYen(a));
                  if (cnt > 0) {
                    actSpan.appendChild(document.createTextNode(' '));
                    var cntSp = el(
                      'span',
                      { style: { fontSize: dashSz(10) + 'px', color: '#666' } },
                      '(' + cnt + '件)'
                    );
                    actSpan.appendChild(cntSp);
                  }
                  td.appendChild(actSpan);
                  if (monthElapsed && planForAlert > 0.5 && a === 0) {
                    var thruLbl = vc.isPastClosed
                      ? '4月（年度末）'
                      : vc.cumMonthIdx >= 0
                        ? MONTH_LABELS[vc.cumMonthIdx]
                        : '—';
                    var actHint = el(
                      'span',
                      { title: '予算はあるのに実績が0（〜' + thruLbl + 'まで・入力の確認）' },
                      '·'
                    );
                    actHint.style.cssText =
                      'position:absolute;top:0;left:2px;font-size:' +
                      dashSz(11) +
                      'px;font-weight:700;color:#78909c;line-height:1;pointer-events:none;';
                    td.appendChild(actHint);
                  }
                  if (cell.actualEntries && cell.actualEntries.length) {
                    if (actualOverallDirect) {
                      bindActualCellDirectOpen(td, cell, a);
                    } else {
                      bindHoverPop(td, 'actual', cell, a);
                    }
                  }
                  rowActualTot += a;
                } else {
                  var planD =
                    pr.planByMonth && pr.planByMonth[mx] != null ? pr.planByMonth[mx] : shareFallback;
                  var pct = planD > 0 ? (cell.actualSum / planD) * 100 : NaN;
                  renderDigestPctCell(td, pct);
                }
                tr.appendChild(td);
              }

              var tdRowTot = el('td');
              tdRowTot.style.border = '1px solid #ccc';
              tdRowTot.style.padding = dashSz(5) + 'px ' + dashSz(8) + 'px';
              tdRowTot.style.textAlign = 'right';
              tdRowTot.style.background = '#f3e5f5';
              if (kind === 0) {
                tdRowTot.textContent = formatYen(pr.annualBudget);
              } else if (kind === 1) {
                tdRowTot.textContent = formatYen(rowChangeTot);
              } else if (kind === 2) {
                tdRowTot.textContent = formatYen(rowActualTot);
              } else {
                var ann = pr.annualBudget;
                var rpct = ann > 0 ? (rowActualTot / ann) * 100 : NaN;
                renderDigestPctCell(tdRowTot, rpct);
              }
              tr.appendChild(tdRowTot);

              tbody.appendChild(tr);
            }
          }
        }

        var totalParents = 0;
        for (gi = 0; gi < groups.length; gi++) {
          totalParents += groups[gi].parents.length;
        }
        if (totalParents === 0) {
          var trE = el('tr');
          var tdE = el(
            'td',
            { colSpan: '18' },
            groups === jobGroups
              ? '表示できる行がありません。「' +
                LABEL_BUDGET_APP +
                '」にデータがあるか、または上の絞り込みが厳しすぎないか確認してください。'
              : 'この区分では行がありません。工種マスタの「固定費・変動費」の設定や、絞り込みを確認してください。'
          );
          tdE.style.padding = dashSz(16) + 'px';
          trE.appendChild(tdE);
          tbody.appendChild(trE);
        }
      }

      function buildSectionTable(groups, subtotalLabel, costSection, tableFontPxOverride) {
        var tbl = el('table', { className: 'jbis-budget-dash-table' });
        tbl.style.borderCollapse = 'separate';
        tbl.style.borderSpacing = '0';
        var tfp =
          tableFontPxOverride != null && Number.isFinite(Number(tableFontPxOverride))
            ? Math.round(Number(tableFontPxOverride))
            : DASH_TABLE_FONT_PX;
        tbl.style.fontSize = tfp + 'px';
        tbl.style.minWidth = Math.round(dashSz(900) * (tfp / DASH_TABLE_FONT_PX)) + 'px';
        tbl.appendChild(buildTheadLocal());
        var tbody = el('tbody');
        appendBodyRows(tbody, groups, costSection);
        var tp = 0;
        var ti;
        for (ti = 0; ti < groups.length; ti++) {
          tp += groups[ti].parents.length;
        }
        if (tp > 0) {
          appendSubtotalRow(tbody, sumForGroups(groups), subtotalLabel);
        }
        tbl.appendChild(tbody);
        return tbl;
      }

      var diagCounts = countDiagnosisInJobGroups(jobGroups, vc, cmapPart);
      if (diagCounts.attentionParents > 0 || diagCounts.masterUnset > 0) {
        var strip = el('div', { className: 'jbis-budget-dash-diag-strip' });
        var stripSegs = [];
        if (diagCounts.attentionParents > 0) {
          stripSegs.push(
            '確認してほしい内容が付いている行が、いま ' + diagCounts.attentionParents + ' 行あります。'
          );
        }
        if (diagCounts.masterUnset > 0) {
          stripSegs.push(
            '「固定費／変動費」がまだ決まっていない工種が ' +
              diagCounts.masterUnset +
              ' 件あります。工種マスタ（' +
              LABEL_JOB_MASTER +
              '）で区分を入れてください。'
          );
        }
        var stripBody = stripSegs.join('');
        if (stripSegs.length === 2) {
          stripBody =
            '確認してほしい内容が付いている行が ' +
            diagCounts.attentionParents +
            ' 行あります。また、「固定費／変動費」が未設定の工種が ' +
              diagCounts.masterUnset +
              ' 件あります。工種マスタ（' +
            LABEL_JOB_MASTER +
            '）の更新をお願いします。';
        }
        strip.textContent = stripBody;
        tableHost.appendChild(strip);
      }

      var scroll = el('div', { className: 'jbis-budget-dash-scroll' });

      var overallParentCount = 0;
      var opc;
      for (opc = 0; opc < jobGroupsOverall.length; opc++) {
        overallParentCount += jobGroupsOverall[opc].parents.length;
      }
      if (overallParentCount === 0) {
        scroll.appendChild(
          buildSectionTable(jobGroupsOverall, '合計（' + COPY_DASH_FOUR_ROWS + '）', 'all')
        );
      } else {
        var allWrap = el('div');
        allWrap.id = 'jbis-dash-section-grand';
        allWrap.style.marginTop = '0';
        allWrap.style.marginBottom = '12px';
        var grandHead = el('div');
        grandHead.style.cssText =
          'font-size:' +
          dashSz(14) +
          'px;font-weight:700;color:#1a237e;margin-bottom:6px;line-height:1.4;';
        grandHead.textContent = '全体一覧（固定費＋変動費・工種・請求会社・摘要単位）';
        var grandSub = el('div');
        grandSub.style.cssText =
          'font-size:' +
          dashSz(11) +
          'px;color:#546e7a;margin-bottom:8px;line-height:1.5;';
        grandSub.textContent =
          '工種・請求会社・摘要の組み合わせごとに、' +
            COPY_DASH_FOUR_ROWS +
            'の4行をすべて出しています。下の「費用区分」で固定費だけ等に絞り込んでも、ここでは固定費・変動費の行を欠かさず一覧します（請求会社・工種・摘要・確認だけに絞る条件はそのまま適用します）。表の最後の行が全体の合計です。工種ごとの集計は下の「工種別の合計」を参照してください。' +
            '【実績行】金額に下線のあるセルはクリックで「' +
            LABEL_ACTUAL_APP +
            '」の該当レコードを別タブで開きます。同じ月に複数レコードがあるときは確認のあと順に開きます（キャンセルで従来どおり明細一覧）。固定費・変動費の表では従来どおりホバー／クリックで明細です。';
        allWrap.appendChild(grandHead);
        allWrap.appendChild(grandSub);
        var tblAll = el('table', { className: 'jbis-budget-dash-table' });
        tblAll.style.borderCollapse = 'separate';
        tblAll.style.borderSpacing = '0';
        tblAll.style.fontSize = DASH_TABLE_FONT_PX + 'px';
        tblAll.style.minWidth = dashSz(900) + 'px';
        tblAll.appendChild(buildTheadLocal());
        var tbAll = el('tbody');
        appendBodyRows(tbAll, jobGroupsOverall, 'all', { actualOverallDirect: true });
        if (overallParentCount > 0) {
          appendSubtotalRow(
            tbAll,
            sumForGroups(jobGroupsOverall),
            '全体の合計（' + COPY_DASH_FOUR_ROWS + '）'
          );
        }
        tblAll.appendChild(tbAll);
        allWrap.appendChild(tblAll);
        scroll.appendChild(allWrap);

        var jump = el('div');
        jump.style.cssText =
          'font-size:' + dashSz(12) + 'px;margin-bottom:10px;line-height:1.6;';
        var aGrand = el('a', { href: '#jbis-dash-section-grand' }, '全体一覧（先頭）へ');
        var aFix = el('a', { href: '#jbis-dash-section-fixed' }, '固定費の表へ');
        var aVar = el('a', { href: '#jbis-dash-section-variable' }, '変動費の表へ');
        var aByJob = el('a', { href: '#jbis-dash-section-grand-by-job' }, '工種別の合計へ');
        aGrand.style.cssText = 'color:#1565c0;margin-right:14px;';
        aFix.style.cssText = 'color:#1565c0;margin-right:14px;';
        aVar.style.cssText = 'color:#1565c0;margin-right:14px;';
        aByJob.style.cssText = 'color:#1565c0;';
        jump.appendChild(aGrand);
        jump.appendChild(aFix);
        jump.appendChild(aVar);
        jump.appendChild(aByJob);
        bindDashSectionJump(aGrand, 'jbis-dash-section-grand');
        bindDashSectionJump(aFix, 'jbis-dash-section-fixed');
        bindDashSectionJump(aVar, 'jbis-dash-section-variable');
        bindDashSectionJump(aByJob, 'jbis-dash-section-grand-by-job');
        scroll.appendChild(jump);

        function sectionBox(id, title, subtitle, styleBox, headOpts) {
          headOpts = headOpts || {};
          var titleBase = headOpts.titleDashBase != null ? headOpts.titleDashBase : 13;
          var subBase = headOpts.subtitleDashBase != null ? headOpts.subtitleDashBase : 11;
          var box = el('div');
          box.id = id;
          box.style.marginBottom = '14px';
          box.style.padding = '10px 10px 8px 10px';
          box.style.borderRadius = '6px';
          var sk;
          for (sk in styleBox) {
            if (Object.prototype.hasOwnProperty.call(styleBox, sk)) {
              box.style[sk] = styleBox[sk];
            }
          }
          var ht = el('div');
          var h3 = el('span', {}, title);
          h3.style.fontWeight = '700';
          h3.style.fontSize = dashSz(titleBase) + 'px';
          h3.style.color = '#1a237e';
          h3.style.lineHeight = '1.35';
          ht.appendChild(h3);
          if (subtitle) {
            var sep = headOpts.subtitleSameLine === false ? '\n' : ' — ';
            var st = el(
              'span',
              {},
              headOpts.subtitleSameLine === false ? subtitle : sep + subtitle
            );
            st.style.fontSize = dashSz(subBase) + 'px';
            st.style.color = '#616161';
            st.style.lineHeight = '1.5';
            if (headOpts.subtitleSameLine === false) {
              st.style.display = 'block';
              st.style.marginTop = dashSz(6) + 'px';
              st.style.whiteSpace = 'pre-wrap';
            }
            ht.appendChild(st);
          }
          ht.style.marginBottom = '8px';
          box.appendChild(ht);
          return box;
        }

        var secVar = sectionBox(
          'jbis-dash-section-variable',
          '変動費ブロック',
          '支払いや請求のタイミングに合わせて見る「スポットの費用」が並びます（毎月同額に自動で割り振ることはしません）。\n\n' +
            '【ここに含まれる工種】\n' +
            '・' +
            LABEL_JOB_MASTER +
            'で「変動費」としたもの\n' +
            '・費用区分が「未設定」のもの（工種マスタを直すまでの間、気づけるようここに出します）\n' +
            '・「固定費・変動費」としたうち、' +
            LABEL_BUDGET_APP +
            ' で変動側の予算を入れているもの（固定側だけのものは固定費ブロックです）\n\n' +
            '【予算の見え方】\n' +
            LABEL_BUDGET_APP +
            ' の「変動費予算（金額と支払予定日）」または「変動費の月別」に入れた金額が、かかる月の列にそのまま表示されます。\n\n' +
            '【実績】固定費と同様、変動費の工種も「' +
            LABEL_ACTUAL_APP +
            '」で支払い・計上の月に実績を登録してください（予算だけだと、使った割合やこの画面のお知らせが正しく出ません）。\n\n' +
            '費用区分は「' +
            LABEL_JOB_MASTER +
            '」で設定してください。',
          { background: '#fff', border: '1px solid #e8eaf6' },
          { titleDashBase: 16, subtitleDashBase: 12, subtitleSameLine: false }
        );
        secVar.appendChild(
          buildSectionTable(
            variableGroups,
            '変動費の合計（' + COPY_DASH_FOUR_ROWS + '）',
            'variable',
            DASH_TABLE_FONT_VARIABLE_SECTION_PX
          )
        );

        var secFix = sectionBox(
          'jbis-dash-section-fixed',
          '固定費',
          '区分「固定費」: 毎月発生するコスト。' +
            LABEL_BUDGET_APP +
            ' では、月額のときは月単位で入力し、年額のときは年額予算と支払予定日の設定が必要です。実績は「' +
            LABEL_ACTUAL_APP +
            '」で支払い・計上の月ごとに登録してください（変動費と同様、予算と実績の両方が必要です）。',
          { background: '#eceff1', border: '1px solid #cfd8dc' }
        );
        secFix.appendChild(
          buildSectionTable(fixedGroups, '固定費の合計（' + COPY_DASH_FOUR_ROWS + '）', 'fixed')
        );

        if (sectionOrder === 'vf') {
          scroll.appendChild(secVar);
          scroll.appendChild(secFix);
        } else {
          scroll.appendChild(secFix);
          scroll.appendChild(secVar);
        }

        var byJobWrap = el('div');
        byJobWrap.id = 'jbis-dash-section-grand-by-job';
        byJobWrap.style.marginTop = '4px';
        byJobWrap.style.marginBottom = '10px';
        var byJobHead = el('div');
        byJobHead.style.cssText =
          'font-size:' +
          dashSz(13) +
          'px;font-weight:700;color:#37474f;margin-bottom:6px;line-height:1.4;';
        byJobHead.textContent =
          '工種別の合計（当初・' + COPY_DASH_COMPACT_ADJUST + '・実績・' + COPY_DASH_COMPACT_USAGE + '）';
        var byJobSub = el('div');
        byJobSub.style.cssText =
          'font-size:' +
          dashSz(11) +
          'px;color:#546e7a;margin-bottom:8px;line-height:1.5;';
        byJobSub.textContent =
          '工種ごとに「' +
            COPY_DASH_FOUR_ROWS +
            '」の4行で集計したものです。先頭の全体一覧と同じ対象（費用区分の絞り込みの影響を受けません）を、請求会社・摘要をまとめずに工種単位で足した集計です。' +
            '表は工種・件数と月別・年間のみです。摘要や会社ごとの内訳が必要なときは先頭の全体一覧をご利用ください。';
        byJobWrap.appendChild(byJobHead);
        byJobWrap.appendChild(byJobSub);
        var tblByJob = el('table', {
          className: 'jbis-budget-dash-table jbis-budget-dash-table-jobgrand',
        });
        tblByJob.style.borderCollapse = 'separate';
        tblByJob.style.borderSpacing = '0';
        tblByJob.style.fontSize = DASH_TABLE_FONT_PX + 'px';
        tblByJob.style.minWidth = dashSz(720) + 'px';
        tblByJob.appendChild(buildTheadLocalByJobGrand());
        var tbByJob = el('tbody');
        appendGrandTotalByJobRows(tbByJob, jobGroupsOverall, hi);
        tblByJob.appendChild(tbByJob);
        byJobWrap.appendChild(tblByJob);
        scroll.appendChild(byJobWrap);
      }

      tableHost.appendChild(scroll);

      var leg = el('div', { className: 'jbis-budget-dash-legend' });
      leg.style.marginTop = '8px';
      leg.style.fontSize = dashSz(11) + 'px';
      leg.style.color = '#616161';
      leg.textContent =
        '【数字の読み方】' +
        '会計年度: 開いたときは、今日の日付に合わせた年度が選ばれています。ほかの年度は上の「会計年度」から選べます。' +
        '各月のうしろの色付きのバーは、その月の予算に対して実績がどのくらいかの目安です。' +
        '右端の「' +
        COPY_DASH_ROW_USAGE +
        '」は、はじめの予算に調整（増減）を足し引きしたあとの年間の予算全体に対して、実績がどのくらいかの目安です。100％を超えたときは赤くなり、セルにマウスを置くと「' +
        COPY_TIP_USAGE_OVER +
        '」の説明が出ます。' +
        '工種の区分が未設定のとき: 「' +
        LABEL_JOB_MASTER +
        '」で固定費・変動費が決まっていない工種は、多くの場合は変動費の表に出ます。月ごとの予算と年間の予算の両方に数字がある行だけ、固定費の表にも出ます。きちんと分けたいときは、マスタで「固定費」か「変動費」を選んでください。' +
        '【画面のしかた】' +
        '上の黄色い帯は、「確認してほしい行」や「区分が未設定の工種」があるときのお知らせです。' +
        '▲は、その月に「' +
        LABEL_CHANGE_APP +
        '」で予算の増減（調整）を登録した印です。下線のある数字をクリックすると内訳が開き、必要なら「' +
        LABEL_CHANGE_APP +
        '」「' +
        LABEL_ACTUAL_APP +
        '」を別のタブで開けます。';
      tableHost.appendChild(leg);
    }

    btnInit.onclick = function () {
      mode = 'initial';
      pushUiHash();
      redrawTable();
    };
    btnLearn.onclick = function () {
      mode = 'learning';
      pushUiHash();
      redrawTable();
    };
    inpCo.oninput = redrawTable;
    inpJob.oninput = redrawTable;
    selSum.onchange = redrawTable;
    selCost.onchange = function () {
      pushUiHash();
      redrawTable();
    };
    chkDiagOnly.onchange = function () {
      pushUiHash();
      redrawTable();
    };

    redrawTable();
    pushUiHash();
    return wrap;
  }

  function mountLoading(space) {
    var d = el('div', { className: 'jbis-budget-dash-loading' });
    d.textContent = '集計データを読み込み中…';
    d.style.padding = '16px';
    d.style.color = '#455a64';
    space.appendChild(d);
    return d;
  }

  function mount() {
    var space = kintone.app.getHeaderSpaceElement();
    if (!space) {
      return;
    }
    if (space.querySelector('.jbis-budget-dash-mounted')) {
      return;
    }
    try {
      console.info('[jbis-budget-dash] ui-copy-version', JBIS_DASH_UI_COPY_VERSION);
    } catch (eLog) {
      void eLog;
    }
    var rootMarker = el('div', { className: 'jbis-budget-dash-mounted' });
    rootMarker.style.display = 'none';
    space.appendChild(rootMarker);

    var loading = mountLoading(space);
    var todayFy = currentFiscalStartYear();
    var initialHash = parseDashHash();

    var fields651 = ['$id', F_JOB, F_JOB_NAME, F_COMPANY, F_SUMMARY, F_MATCH, F_BUDGET, F_BUDGET_FY].concat(
      BUDGET_MONTH_FIELDS,
      VARIABLE_BUDGET_MONTH_FIELDS
    );
    var fields652 = ['$id', F_MATCH, F_CHG_MONTH, F_CHG_AMT, F_CHG_REASON];
    var fields653 = ['$id', F_MATCH, F_ACT_DATE, F_ACT_AMT, F_ACT_MEMO];
    var fields650 = [F_JOB, F_COST_TYPE];

    var budget651Cache = [];
    var costTypeMap = {};
    var dashCtx = {};

    /** #fy 指定時はそれを優先。なければ本日から会計年度（例: 2027-04→2026年度、2027-05→2027年度） */
    function startFyFromHash() {
      var y = initialHash.fy;
      if (y != null && Number.isFinite(y)) {
        return y;
      }
      return todayFy;
    }

    function loadYearData(fy) {
      dashCtx.fy = fy;
      dashCtx.viewCtx = getFiscalViewContext(fy);
      dashCtx.costTypeMap = costTypeMap;
      var br = filterBudgetRecsByFy(budget651Cache, fy, todayFy);
      var w652 = buildFyFieldQuery(F_CHG_MONTH, fy);
      var w653 = buildFyFieldQuery(F_ACT_DATE, fy);
      return Promise.all([
        fetchAllRecordsQuery(APP_CHANGE, fields652, w652),
        fetchAllRecordsQuery(APP_ACTUAL, fields653, w653),
      ]).then(function (arr) {
        dashCtx.state = buildState(fy, br, arr[0], arr[1], costTypeMap);
      });
    }

    Promise.all([
      fetchAllRecords(APP_BUDGET, fields651),
      fetchAllRecords(APP_JOB_MASTER, fields650).catch(function () {
        return [];
      }),
    ])
      .then(function (pack) {
        budget651Cache = pack[0];
        costTypeMap = buildCostTypeMap(pack[1] || []);
        return loadYearData(startFyFromHash());
      })
      .then(function () {
        loading.remove();
        space.appendChild(
          renderAggregateRoot(dashCtx, {
            initialHash: initialHash,
            onYearChange: function (newFy) {
              return loadYearData(newFy);
            },
          })
        );
        space.appendChild(renderCards());
      })
      .catch(function (e) {
        loading.textContent = '読み込みに失敗しました: ' + (e && e.message ? e.message : String(e));
        loading.style.color = '#c62828';
      });
  }

  kintone.events.on('app.record.index.show', function (event) {
    mount();
    return event;
  });
})();
