/**
 * 予算アプリ（651）: matching_key 自動、固定／変動に応じた入力制御、月別→budget_amount 同期。
 * 工種ルックアップは 650 の job_code。654 は variable_budget_m** を参照するため 651 に同一フィールドコードが必要。
 *
 * 【迷子にならない運用の型（変動費・都度）】
 * 1) 工種を選ぶ → 費用区分が「変動費」なら「変動費予算（金額）」と「支払予定日」だけでよい（月別12欄は非表示だが保存時に該当月へ自動反映）。実績は固定・変動とも別アプリ（653）で登録。
 * 2) 「未設定」「固定費・変動費」で変動側を使うときは月別12欄も表示（複数月や手調整用）。月別を触るとスポット欄は空に戻る。
 * 3) 会計年度（budget_fy_start）があるとき、支払日はその年度の範囲内にする。
 */
(function () {
  'use strict';

  var SEP = '|';
  var F_MATCHING = 'matching_key';
  var F_JOB = 'job_code';
  var F_JOB_LOOKUP = 'job_lookup';
  var F_COMPANY = 'company_name';
  var F_SUMMARY = 'summary';
  var F_DETAIL = 'summary_detail';
  var F_BUDGET = 'budget_amount';
  var F_COST_LOOKUP = 'cost_type_lookup';
  /** 利用者向け表記（ダッシュボード等と揃える） */
  var LABEL_ACTUAL_APP = '実績アプリ';
  /** 変動費の都度入力（金額＋日付 → 会計月の variable_budget_m** へ1か月分） */
  var F_SPOT_AMT = 'variable_budget_spot_amount';
  var F_SPOT_DATE = 'variable_budget_pay_date';
  /** 会計年度の開始西暦年（5月始まり）。無い場合は日付整合チェックをスキップ */
  var F_BUDGET_FY_START = 'budget_fy_start';

  var BUDGET_MONTH_CODES = [
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

  var VARIABLE_MONTH_CODES = [
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

  var F_LUMP_AMOUNT = 'budget_lump_amount';
  var F_LUMP_MONTH = 'budget_lump_month';
  var LUMP_MONTH_LABEL_TO_SUFFIX = {
    '5月': '05',
    '6月': '06',
    '7月': '07',
    '8月': '08',
    '9月': '09',
    '10月': '10',
    '11月': '11',
    '12月': '12',
    '1月（翌年度）': '01',
    '2月（翌年度）': '02',
    '3月（翌年度）': '03',
    '4月（翌年度）': '04',
  };

  var WARN_EL_ID = 'jbis651-cost-type-unset-warn';
  var VAR_HINT_EL_ID = 'jbis651-variable-mode-hint';

  /** program updates to budget_amount (sum sync) — must not trigger 年額→按分 */
  var applyingBudgetSync = false;
  /** 年額→12ヶ月按分の再入防止 */
  var applyingAnnualSplit = false;

  var jobLookupTimer = null;
  /** スポット→月反映中（月別変更でスポットを消さない誤爆防止） */
  var applyingSpotVar = false;

  function numBudget(v) {
    if (v == null || v === '') {
      return 0;
    }
    var n = Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function hasCostFeatures(rec) {
    return !!(rec && rec[F_COST_LOOKUP] && rec[VARIABLE_MONTH_CODES[0]]);
  }

  function hasSpotFields(rec) {
    return !!(rec && rec[F_SPOT_AMT] && rec[F_SPOT_DATE]);
  }

  function parseKintoneDate(raw) {
    if (raw == null) {
      return null;
    }
    var s = String(raw).trim();
    if (!s) {
      return null;
    }
    var parts = s.split(/[-/T]/);
    if (parts.length >= 3) {
      var y = parseInt(parts[0], 10);
      var mo = parseInt(parts[1], 10) - 1;
      var day = parseInt(parts[2], 10);
      if (Number.isFinite(y) && Number.isFinite(mo) && Number.isFinite(day)) {
        var d = new Date(y, mo, day);
        return isNaN(d.getTime()) ? null : d;
      }
    }
    var t = Date.parse(s);
    return isNaN(t) ? null : new Date(t);
  }

  /** カレンダー日付が属する会計年度の「開始西暦年」（5月〜翌4月） */
  function fiscalYearStartForDate(d) {
    if (!d) {
      return NaN;
    }
    var m = d.getMonth() + 1;
    var y = d.getFullYear();
    return m >= 5 ? y : y - 1;
  }

  /** 5月=0 … 翌年4月=11 */
  function fiscalMonthIndexFromDate(d) {
    if (!d) {
      return -1;
    }
    var m = d.getMonth() + 1;
    if (m >= 5) {
      return m - 5;
    }
    return m + 7;
  }

  function clearSpotVariableFields(rec) {
    if (rec[F_SPOT_AMT]) {
      rec[F_SPOT_AMT].value = '';
    }
    if (rec[F_SPOT_DATE]) {
      rec[F_SPOT_DATE].value = '';
    }
  }

  /**
   * 金額＋日付が揃っていれば variable の1か月へだけ書く。それ以外は何もしない。
   */
  function applySpotVariableToMonths(rec) {
    if (!hasSpotFields(rec)) {
      return;
    }
    var amt = numBudget(rec[F_SPOT_AMT].value);
    var ds = rec[F_SPOT_DATE].value != null ? String(rec[F_SPOT_DATE].value).trim() : '';
    if (amt <= 0 || !ds) {
      return;
    }
    var d = parseKintoneDate(ds);
    if (!d) {
      return;
    }
    var idx = fiscalMonthIndexFromDate(d);
    if (idx < 0 || idx > 11) {
      return;
    }
    applyingSpotVar = true;
    try {
      var i;
      for (i = 0; i < VARIABLE_MONTH_CODES.length; i++) {
        var c = VARIABLE_MONTH_CODES[i];
        if (!rec[c]) {
          continue;
        }
        rec[c].value = '';
      }
      var code = VARIABLE_MONTH_CODES[idx];
      if (rec[code]) {
        rec[code].value = String(Math.round(amt));
      }
    } finally {
      applyingSpotVar = false;
    }
  }

  /** スポット欄の入力だけ不整合ならメッセージ、なければ null */
  function validateSpotVariableInput(rec) {
    if (!hasSpotFields(rec)) {
      return null;
    }
    var amt = numBudget(rec[F_SPOT_AMT].value);
    var ds = rec[F_SPOT_DATE].value != null ? String(rec[F_SPOT_DATE].value).trim() : '';
    if (amt <= 0 && !ds) {
      return null;
    }
    if (amt > 0 && !ds) {
      return '変動費の金額を入れたときは、支払予定日も入力してください。';
    }
    if (amt <= 0 && ds) {
      return '支払予定日を入れたときは、変動費の金額も入力してください。';
    }
    var d = parseKintoneDate(ds);
    if (!d) {
      return '支払予定日の形式が正しくありません。';
    }
    if (rec[F_BUDGET_FY_START] && rec[F_BUDGET_FY_START].value != null && String(rec[F_BUDGET_FY_START].value).trim() !== '') {
      var fy = parseInt(String(rec[F_BUDGET_FY_START].value).trim(), 10);
      if (Number.isFinite(fy) && fiscalYearStartForDate(d) !== fy) {
        return '支払予定日が、この画面で選んだ会計年度の範囲に入っていません。日付か会計年度を見直してください。';
      }
    }
    return null;
  }

  function getCostMode(rec) {
    if (!hasCostFeatures(rec)) {
      return 'legacy';
    }
    var v =
      rec[F_COST_LOOKUP] && rec[F_COST_LOOKUP].value != null
        ? String(rec[F_COST_LOOKUP].value).trim()
        : '';
    if (v === '固定費' || v === '固定') {
      return 'fixed';
    }
    if (v === '変動費' || v === '変動') {
      return 'variable';
    }
    if (v === '固定費・変動費' || v === '固定費･変動費') {
      return 'hybrid';
    }
    return 'unset';
  }

  function sumMonthlyFixed(rec) {
    var t = 0;
    var i;
    for (i = 0; i < BUDGET_MONTH_CODES.length; i++) {
      var code = BUDGET_MONTH_CODES[i];
      if (!rec[code]) {
        continue;
      }
      t += numBudget(rec[code].value);
    }
    return t;
  }

  function sumMonthlyVariable(rec) {
    var t = 0;
    var i;
    for (i = 0; i < VARIABLE_MONTH_CODES.length; i++) {
      var code = VARIABLE_MONTH_CODES[i];
      if (!rec[code]) {
        continue;
      }
      t += numBudget(rec[code].value);
    }
    return t;
  }

  function clearFixedBudgetFields(rec) {
    var i;
    for (i = 0; i < BUDGET_MONTH_CODES.length; i++) {
      var c = BUDGET_MONTH_CODES[i];
      if (rec[c]) {
        rec[c].value = '';
      }
    }
    if (rec[F_LUMP_AMOUNT]) {
      rec[F_LUMP_AMOUNT].value = '';
    }
    if (rec[F_LUMP_MONTH]) {
      rec[F_LUMP_MONTH].value = '';
    }
  }

  function clearVariableBudgetFields(rec) {
    var i;
    for (i = 0; i < VARIABLE_MONTH_CODES.length; i++) {
      var c = VARIABLE_MONTH_CODES[i];
      if (rec[c]) {
        rec[c].value = '';
      }
    }
  }

  function applyModeSideClear(rec) {
    var mode = getCostMode(rec);
    if (mode === 'variable') {
      clearFixedBudgetFields(rec);
    } else if (mode === 'fixed') {
      clearVariableBudgetFields(rec);
      clearSpotVariableFields(rec);
    }
  }

  function applyLumpToMonthly(rec) {
    if (!rec[F_LUMP_AMOUNT] || !rec[F_LUMP_MONTH]) {
      return;
    }
    var lump = numBudget(rec[F_LUMP_AMOUNT].value);
    var mv = rec[F_LUMP_MONTH].value;
    if (mv == null || String(mv).trim() === '') {
      return;
    }
    if (lump <= 0) {
      return;
    }
    var suffix = LUMP_MONTH_LABEL_TO_SUFFIX[String(mv).trim()];
    if (!suffix) {
      return;
    }
    var target = 'budget_m' + suffix;
    var i;
    for (i = 0; i < BUDGET_MONTH_CODES.length; i++) {
      var c = BUDGET_MONTH_CODES[i];
      if (!rec[c]) {
        continue;
      }
      rec[c].value = c === target ? String(Math.round(lump)) : '';
    }
  }

  /**
   * 固定: 年額を 12 で割り、端数は 5 月に加算。年払いはクリア。
   */
  function spreadAnnualToFixedMonths(rec, annual) {
    var n = Math.round(annual);
    if (n <= 0) {
      return;
    }
    applyingAnnualSplit = true;
    try {
      if (rec[F_LUMP_AMOUNT]) {
        rec[F_LUMP_AMOUNT].value = '';
      }
      if (rec[F_LUMP_MONTH]) {
        rec[F_LUMP_MONTH].value = '';
      }
      var base = Math.floor(n / 12);
      var rem = n - base * 12;
      var i;
      for (i = 0; i < BUDGET_MONTH_CODES.length; i++) {
        var c = BUDGET_MONTH_CODES[i];
        if (!rec[c]) {
          continue;
        }
        rec[c].value = String(base);
      }
      var m0 = BUDGET_MONTH_CODES[0];
      if (rec[m0]) {
        rec[m0].value = String(base + rem);
      }
      if (rec[F_BUDGET]) {
        rec[F_BUDGET].value = String(n);
      }
    } finally {
      applyingAnnualSplit = false;
    }
  }

  function onBudgetAmountUserChange(event) {
    if (applyingBudgetSync || applyingAnnualSplit) {
      return event;
    }
    if (!hasCostFeatures(event.record)) {
      return event;
    }
    var md = getCostMode(event.record);
    if (md !== 'fixed') {
      return event;
    }
    var n = numBudget(event.record[F_BUDGET] && event.record[F_BUDGET].value);
    if (n <= 0) {
      return event;
    }
    spreadAnnualToFixedMonths(event.record, n);
    return event;
  }

  function syncBudgetAmountLive(rec) {
    if (!rec[F_BUDGET]) {
      return;
    }
    applyingBudgetSync = true;
    try {
      var mode = getCostMode(rec);
      if (mode === 'legacy') {
        applyLumpToMonthly(rec);
        var sLeg = sumMonthlyFixed(rec);
        rec[F_BUDGET].value = String(Math.round(sLeg));
        return;
      }
      if (mode === 'fixed') {
        applyLumpToMonthly(rec);
        rec[F_BUDGET].value = String(Math.round(sumMonthlyFixed(rec)));
        return;
      }
      if (mode === 'variable') {
        rec[F_BUDGET].value = String(Math.round(sumMonthlyVariable(rec)));
        return;
      }
      if (mode === 'hybrid') {
        var sFh = sumMonthlyFixed(rec);
        var sVh = sumMonthlyVariable(rec);
        if (sFh > 0 && sVh > 0) {
          return;
        }
        if (sVh > 0) {
          rec[F_BUDGET].value = String(Math.round(sVh));
          return;
        }
        applyLumpToMonthly(rec);
        rec[F_BUDGET].value = String(Math.round(sumMonthlyFixed(rec)));
        return;
      }
      var sF = sumMonthlyFixed(rec);
      var sV = sumMonthlyVariable(rec);
      if (sF > 0 && sV > 0) {
        return;
      }
      if (sV > 0) {
        rec[F_BUDGET].value = String(Math.round(sV));
        return;
      }
      applyLumpToMonthly(rec);
      rec[F_BUDGET].value = String(Math.round(sumMonthlyFixed(rec)));
    } finally {
      applyingBudgetSync = false;
    }
  }

  function u32ToHex8(x) {
    return ('00000000' + (x >>> 0).toString(16)).slice(-8);
  }

  function hashCanonicalToMatchingKey(canonical) {
    if (!canonical) {
      return '';
    }
    var i;
    var h1 = 2166136261;
    for (i = 0; i < canonical.length; i++) {
      h1 ^= canonical.charCodeAt(i);
      h1 = Math.imul(h1, 16777619);
    }
    var h2 = 5381;
    for (i = 0; i < canonical.length; i++) {
      h2 = ((h2 << 5) + h2 + canonical.charCodeAt(i)) | 0;
    }
    var h3 = 5381;
    for (i = canonical.length - 1; i >= 0; i--) {
      h3 = ((h3 << 5) + h3 + canonical.charCodeAt(i)) | 0;
    }
    var h4 = 0;
    for (i = 0; i < canonical.length; i++) {
      h4 = (Math.imul(h4, 31) + canonical.charCodeAt(i)) | 0;
    }
    return u32ToHex8(h1) + u32ToHex8(h2) + u32ToHex8(h3) + u32ToHex8(h4);
  }

  function buildMatchingKey(rec) {
    var job = rec[F_JOB] && rec[F_JOB].value != null ? String(rec[F_JOB].value).trim() : '';
    var company = rec[F_COMPANY] && rec[F_COMPANY].value != null ? String(rec[F_COMPANY].value).trim() : '';
    var summary = rec[F_SUMMARY] && rec[F_SUMMARY].value != null ? String(rec[F_SUMMARY].value).trim() : '';
    var detail =
      rec[F_DETAIL] && rec[F_DETAIL].value != null ? String(rec[F_DETAIL].value).trim() : '';
    if (!job || !company || !summary) {
      return '';
    }
    var canonical = job + SEP + company + SEP + summary + SEP + detail;
    return hashCanonicalToMatchingKey(canonical);
  }

  function applyMatchingKeyToRecord(rec) {
    if (!rec[F_MATCHING]) {
      return;
    }
    rec[F_MATCHING].value = buildMatchingKey(rec);
  }

  function applyLegacyBudgetTotal(event) {
    if (!event.record[F_BUDGET]) {
      return event;
    }
    applyLumpToMonthly(event.record);
    var s = sumMonthlyFixed(event.record);
    if (s > 0) {
      event.record[F_BUDGET].value = String(Math.round(s));
    }
    return event;
  }

  function finalizeSubmit(event) {
    var rec = event.record;
    if (!hasCostFeatures(rec)) {
      applyLegacyBudgetTotal(event);
      applyMatchingKeyToRecord(rec);
      return event;
    }

    var spotErr = validateSpotVariableInput(rec);
    if (spotErr) {
      event.error = spotErr;
      return event;
    }
    applySpotVariableToMonths(rec);

    var mode = getCostMode(rec);
    var sF = sumMonthlyFixed(rec);
    var sV = sumMonthlyVariable(rec);

    if (mode === 'variable') {
      if (sV <= 0) {
        event.error =
          '変動費の予算を入れてください。「金額」と「支払予定日」の両方、または月ごとの欄のどちらかに入力してください。';
        return event;
      }
      clearFixedBudgetFields(rec);
      rec[F_BUDGET].value = String(Math.round(sV));
      applyMatchingKeyToRecord(rec);
      return event;
    }

    if (mode === 'fixed') {
      clearVariableBudgetFields(rec);
      clearSpotVariableFields(rec);
      applyLumpToMonthly(rec);
      rec[F_BUDGET].value = String(Math.round(sumMonthlyFixed(rec)));
      applyMatchingKeyToRecord(rec);
      return event;
    }

    if (mode === 'hybrid') {
      if (sF > 0 && sV > 0) {
        event.error =
          '「固定費・変動費」のときは、固定費として入れる欄と変動費として入れる欄の、どちらか一方にだけ金額を入れてください（いま両方に入っています）。';
        return event;
      }
      if (sV > 0) {
        clearFixedBudgetFields(rec);
        rec[F_BUDGET].value = String(Math.round(sV));
        applyMatchingKeyToRecord(rec);
        return event;
      }
      clearVariableBudgetFields(rec);
      clearSpotVariableFields(rec);
      applyLumpToMonthly(rec);
      rec[F_BUDGET].value = String(Math.round(sumMonthlyFixed(rec)));
      applyMatchingKeyToRecord(rec);
      return event;
    }

    if (sF > 0 && sV > 0) {
      event.error =
        '固定費用の欄と変動費用の欄の、どちらか一方にだけ金額を入れてください（いま両方に入っています）。費目の区分は工種マスタで決めてください。';
      return event;
    }

    if (sV > 0) {
      clearFixedBudgetFields(rec);
      rec[F_BUDGET].value = String(Math.round(sV));
      applyMatchingKeyToRecord(rec);
      return event;
    }

    clearVariableBudgetFields(rec);
    clearSpotVariableFields(rec);
    applyLumpToMonthly(rec);
    rec[F_BUDGET].value = String(Math.round(sumMonthlyFixed(rec)));
    applyMatchingKeyToRecord(rec);
    return event;
  }

  function removeUnsetWarn() {
    var el = document.getElementById(WARN_EL_ID);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  function removeVariableModeHint() {
    var h = document.getElementById(VAR_HINT_EL_ID);
    if (h && h.parentNode) {
      h.parentNode.removeChild(h);
    }
  }

  function mountVariableModeHint() {
    removeVariableModeHint();
    var anchor =
      kintone.app.record.getFieldElement(F_SPOT_DATE) ||
      kintone.app.record.getFieldElement(F_SPOT_AMT);
    if (!anchor || !anchor.parentNode) {
      return;
    }
    var box = document.createElement('div');
    box.id = VAR_HINT_EL_ID;
    box.setAttribute(
      'style',
      'margin:8px 0 10px;padding:10px 12px;background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;font-size:13px;color:#0d47a1;max-width:720px;'
    );

    var lead = document.createElement('div');
    lead.style.lineHeight = '1.5';
    lead.textContent =
      'この画面では「当初予算」を登録します。変動費は「金額」と「支払予定日」だけでかまいません（月別の入力欄は出しません）。保存すると、その会計月の予算として記録され、ダッシュボードの該当列に表示されます。固定費・変動費のどちらも、使った金額（実績）は「' +
      LABEL_ACTUAL_APP +
      '」に、支払い・計上の月で登録してください。';
    box.appendChild(lead);

    var details = document.createElement('details');
    details.style.marginTop = '10px';
    details.style.fontSize = '12px';
    details.style.color = '#1565c0';

    var summary = document.createElement('summary');
    summary.style.cursor = 'pointer';
    summary.style.fontWeight = '600';
    summary.style.outline = 'none';
    summary.textContent = '月ごとの変動費の欄が12個あるのはなぜ？（くわしく）';
    details.appendChild(summary);

    var detailBody = document.createElement('div');
    detailBody.style.marginTop = '8px';
    detailBody.style.padding = '8px 10px 8px 14px';
    detailBody.style.borderLeft = '3px solid #90caf9';
    detailBody.style.color = '#37474f';
    detailBody.style.lineHeight = '1.55';
    detailBody.textContent =
      '一覧表で月ごとに予算を並べるため、システムの裏側に「各月の金額」を入れる欄が12個あります（変動費のときはこの画面では隠れています）。上で入れた金額と日付から、保存するときに該当する月の欄へ自動で書き込みます。「未設定」や「固定費・変動費」のときだけ、複数月を一度に直に書きたい場合にその欄が見えます。運用ではこの画面に出ている入力だけ意識していただいて大丈夫です。予算と実績を照らし合わせるには、固定費・変動費を問わず、この予算アプリと「' +
      LABEL_ACTUAL_APP +
      '」の両方に登録が必要です。';
    details.appendChild(detailBody);

    box.appendChild(details);
    anchor.parentNode.insertBefore(box, anchor.nextSibling);
  }

  function mountCostTypeWarn(mode) {
    removeUnsetWarn();
    var anchor = kintone.app.record.getFieldElement(F_COST_LOOKUP);
    if (!anchor || !anchor.parentNode) {
      return;
    }
    var w = document.createElement('div');
    w.id = WARN_EL_ID;
    w.textContent =
      mode === 'hybrid'
        ? '費用区分が「固定費・変動費」です。固定費として使う予算（月ごとの欄・年に1回のまとめ払い・年間から12か月に分ける）と、変動費として使う予算（変動費の月ごとの欄）の、どちらか一方にだけ金額を入れてください。両方に金額があると保存できません。'
        : '費用区分がまだ決まっていません。費目一覧（工種マスタ）で区分を直すか、固定費用の欄と変動費用の欄のどちらか一方にだけ金額を入れてください。両方に金額があると保存できません。';
    w.setAttribute(
      'style',
      'margin:8px 0 12px;padding:10px 12px;background:#fff8e1;border:1px solid #ffcc80;border-radius:4px;font-size:13px;color:#5d4037;max-width:720px;'
    );
    anchor.parentNode.insertBefore(w, anchor.nextSibling);
  }

  function refreshFieldUI(rec) {
    if (!hasCostFeatures(rec)) {
      return;
    }
    if (typeof kintone.app.record.setFieldShown !== 'function') {
      return;
    }
    var mode = getCostMode(rec);
    var showFixed = mode === 'fixed' || mode === 'unset' || mode === 'hybrid';
    var showVar = mode === 'variable' || mode === 'unset' || mode === 'hybrid';
    var i;
    for (i = 0; i < BUDGET_MONTH_CODES.length; i++) {
      kintone.app.record.setFieldShown(BUDGET_MONTH_CODES[i], showFixed);
    }
    kintone.app.record.setFieldShown(F_LUMP_AMOUNT, showFixed);
    kintone.app.record.setFieldShown(F_LUMP_MONTH, showFixed);
    var showVarDetailMonths = showVar && mode !== 'variable';
    for (i = 0; i < VARIABLE_MONTH_CODES.length; i++) {
      kintone.app.record.setFieldShown(VARIABLE_MONTH_CODES[i], showVarDetailMonths);
    }
    if (rec[F_SPOT_AMT]) {
      kintone.app.record.setFieldShown(F_SPOT_AMT, showVar);
    }
    if (rec[F_SPOT_DATE]) {
      kintone.app.record.setFieldShown(F_SPOT_DATE, showVar);
    }

    var disableBudget = mode !== 'fixed';
    if (typeof kintone.app.record.setFieldDisabled === 'function') {
      kintone.app.record.setFieldDisabled(F_BUDGET, disableBudget);
    }

    if (mode === 'unset') {
      mountCostTypeWarn('unset');
      removeVariableModeHint();
    } else if (mode === 'hybrid') {
      mountCostTypeWarn('hybrid');
      removeVariableModeHint();
    } else if (mode === 'variable') {
      removeUnsetWarn();
      mountVariableModeHint();
    } else {
      removeUnsetWarn();
      removeVariableModeHint();
    }
  }

  function scheduleJobLookupFollowup() {
    if (jobLookupTimer) {
      clearTimeout(jobLookupTimer);
    }
    jobLookupTimer = setTimeout(function () {
      jobLookupTimer = null;
      var r = kintone.app.record.get();
      if (!hasCostFeatures(r)) {
        return;
      }
      applyModeSideClear(r);
      syncBudgetAmountLive(r);
      applyMatchingKeyToRecord(r);
      kintone.app.record.set(r);
      refreshFieldUI(r);
    }, 280);
  }

  function pipelineChange(event) {
    if (!hasCostFeatures(event.record)) {
      applyLegacyBudgetTotal(event);
      applyMatchingKeyToRecord(event.record);
      return event;
    }

    var type = event.type;
    if (type.indexOf(F_JOB_LOOKUP) !== -1) {
      scheduleJobLookupFollowup();
      applyMatchingKeyToRecord(event.record);
      return event;
    }

    if (type.indexOf(F_COST_LOOKUP) !== -1) {
      applyModeSideClear(event.record);
    }

    if (type.indexOf(F_BUDGET) !== -1) {
      onBudgetAmountUserChange(event);
    }

    var isVarMonthCh = false;
    for (i = 0; i < VARIABLE_MONTH_CODES.length; i++) {
      if (type.indexOf(VARIABLE_MONTH_CODES[i]) !== -1) {
        isVarMonthCh = true;
        break;
      }
    }
    if (isVarMonthCh && !applyingSpotVar) {
      clearSpotVariableFields(event.record);
    }
    if (
      hasSpotFields(event.record) &&
      (type.indexOf(F_SPOT_AMT) !== -1 || type.indexOf(F_SPOT_DATE) !== -1)
    ) {
      applySpotVariableToMonths(event.record);
    }

    syncBudgetAmountLive(event.record);
    applyMatchingKeyToRecord(event.record);
    refreshFieldUI(event.record);
    return event;
  }

  function pipelineShow(event) {
    if (!hasCostFeatures(event.record)) {
      applyLegacyBudgetTotal(event);
      applyMatchingKeyToRecord(event.record);
      return event;
    }
    if (hasSpotFields(event.record) && !validateSpotVariableInput(event.record)) {
      applySpotVariableToMonths(event.record);
    }
    syncBudgetAmountLive(event.record);
    applyMatchingKeyToRecord(event.record);
    refreshFieldUI(event.record);
    return event;
  }

  var watchFields = [F_JOB, F_COMPANY, F_SUMMARY, F_DETAIL, F_COST_LOOKUP, F_JOB_LOOKUP];
  var i;
  for (i = 0; i < BUDGET_MONTH_CODES.length; i++) {
    watchFields.push(BUDGET_MONTH_CODES[i]);
  }
  for (i = 0; i < VARIABLE_MONTH_CODES.length; i++) {
    watchFields.push(VARIABLE_MONTH_CODES[i]);
  }
  watchFields.push(F_LUMP_AMOUNT, F_LUMP_MONTH, F_BUDGET);
  watchFields.push(F_SPOT_AMT, F_SPOT_DATE, F_BUDGET_FY_START);

  var changeEvents = [];
  for (i = 0; i < watchFields.length; i++) {
    changeEvents.push('app.record.create.change.' + watchFields[i]);
    changeEvents.push('app.record.edit.change.' + watchFields[i]);
  }

  kintone.events.on(changeEvents, pipelineChange);

  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], pipelineShow);

  kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], finalizeSubmit);
})();

/** 予算ポータル一覧ナビ（正本: customize/budget-portal/jbis-budget-nav.js と同期） */
(function () {
  'use strict';

  var JBIS_BUDGET_DASHBOARD_APP_ID = 654;

  var LINKS = [
    { id: JBIS_BUDGET_DASHBOARD_APP_ID, label: 'ダッシュボード', sub: '予算ポータル' },
    { id: 649, label: '請求会社マスタ', sub: '649' },
    { id: 650, label: '工種マスタ', sub: '650' },
    { id: 651, label: '予算', sub: '当初' },
    { id: 652, label: '予算変更', sub: '652' },
    { id: 653, label: '予算実績', sub: '653' },
  ];

  function appHref(appId) {
    return '/k/' + appId + '/';
  }

  function renderNav() {
    var cur = kintone.app.getId();

    var wrap = document.createElement('div');
    wrap.className = 'jbis-budget-nav-wrap';
    wrap.setAttribute(
      'style',
      'margin:0 0 12px 0;padding:10px 12px;background:#f5f7fa;border:1px solid #e3e7ed;border-radius:6px;font-size:13px;'
    );

    var title = document.createElement('div');
    title.textContent = '予算ポータル';
    title.setAttribute('style', 'font-weight:600;margin-bottom:8px;color:#333;');
    wrap.appendChild(title);

    var row = document.createElement('div');
    row.setAttribute('style', 'display:flex;flex-wrap:wrap;align-items:center;gap:8px;');

    var i;
    for (i = 0; i < LINKS.length; i++) {
      var item = LINKS[i];
      var a = document.createElement('a');
      a.href = appHref(item.id);
      a.textContent = item.label;
      var isHere = Number(cur) === Number(item.id);
      a.setAttribute(
        'style',
        'display:inline-block;padding:6px 10px;border-radius:4px;text-decoration:none;border:1px solid ' +
          (isHere ? '#1976d2' : '#c5cae9') +
          ';background:' +
          (isHere ? '#e3f2fd' : '#fff') +
          ';color:' +
          (isHere ? '#0d47a1' : '#3949ab') +
          ';font-weight:' +
          (isHere ? '600' : '400') +
          ';'
      );
      if (isHere) {
        a.setAttribute('aria-current', 'page');
      }
      row.appendChild(a);
    }

    wrap.appendChild(row);
    return wrap;
  }

  function mount() {
    var space = kintone.app.getHeaderSpaceElement();
    if (!space) {
      return;
    }
    if (space.querySelector('.jbis-budget-nav-wrap')) {
      return;
    }
    space.appendChild(renderNav());
  }

  kintone.events.on('app.record.index.show', function (event) {
    mount();
    return event;
  });
})();
