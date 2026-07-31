import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ACTUAL_COST_CATEGORY_KEYS,
  ACTUAL_EDITABLE_KINDS,
  ACTUAL_READ_ONLY_FIELDS,
  ACTUAL_RECORD_KINDS,
  ACTUAL_SOURCE_KIND,
  ACTUAL_WRITE_CHANNEL,
  createActualsMatrixModel,
  monthRange,
  monthStartDate,
  normalizeMonth,
  pivotActualRows,
} from "./actuals-matrix.mjs";
import { LOCK_STATES } from "./lock.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function protected736Digest() {
  const hash = createHash("sha256");
  for (const name of ["desktop.js", "desktop.reorder.js", "desktop.ui.js"]) {
    hash.update(name);
    hash.update(read(`customize/736/${name}`));
  }
  return hash.digest("hex");
}

const BLOCK_A = Object.freeze({
  stableBlockId: "blk-a",
  status: "active",
  costCategory: "施工",
  workTypeCode: "K-1",
  workTypeName: "けた橋",
  blockNo: 1,
  total: "100",
});
const BLOCK_B = Object.freeze({
  stableBlockId: "blk-b",
  status: "active",
  costCategory: "保安",
  workTypeCode: "H-1",
  workTypeName: "交通誘導",
  blockNo: 2,
  total: "500",
});
const BLOCK_RETIRED = Object.freeze({
  stableBlockId: "blk-r",
  status: "retired",
  costCategory: "施工",
  workTypeCode: "K-9",
  workTypeName: "旧工種",
  blockNo: null,
  total: "99999",
});

function editableModel(overrides = {}) {
  return createActualsMatrixModel({
    lockState: LOCK_STATES.EDITABLE,
    startMonth: "2026-02",
    ...overrides,
  });
}

test("catalogs match schema §5 / field catalog §3 (Y4/Y10)", () => {
  assert.deepEqual(ACTUAL_COST_CATEGORY_KEYS, ["施工", "保安"]);
  assert.deepEqual(ACTUAL_RECORD_KINDS, ["monthly_consumption", "final_budget"]);
  assert.equal(ACTUAL_SOURCE_KIND, "手入力");
  assert.equal(ACTUAL_WRITE_CHANNEL, "app1_custom_ui");
  assert.deepEqual(ACTUAL_EDITABLE_KINDS, ["monthly", "finalBudget"]);
  for (const field of ["currentBudget", "workTypeName", "consumptionRatio"]) {
    assert.ok(ACTUAL_READ_ONLY_FIELDS.includes(field));
  }
});

test("month range follows Excel: start month + 1-month steps, default 12 (Y5/Y6)", () => {
  assert.deepEqual(monthRange("2026-02"), [
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
    "2026-11",
    "2026-12",
    "2027-01",
  ]);
  // P-30/P-37: App3 stores 月初日; both spellings normalize to YYYY-MM.
  assert.deepEqual(monthRange("2026-11-01", 3), ["2026-11", "2026-12", "2027-01"]);
  assert.equal(normalizeMonth("2026-02-01"), "2026-02");
  assert.equal(monthStartDate("2026-02"), "2026-02-01");
  assert.throws(() => monthRange("2026/02"), /YYYY-MM/);
  assert.throws(() => monthRange("2026-13"), /YYYY-MM/);
  assert.throws(() => monthRange("2026-02", 0), /positive safe integer/);
});

test("pivot round-trip: vertical App3 rows → wide matrix → App3 write records", () => {
  const model = editableModel();
  model.setMonthlyAmount("blk-a", "施工", "2026-02", "40");
  model.setMonthlyAmount("blk-a", "施工", "2026-03-01", "80");
  model.setFinalBudget("blk-a", "施工", "120");
  const records = model.toApp3Records({ projectId: "prj-1" });
  assert.equal(records.length, 3);
  assert.deepEqual(
    records.map((record) => record.actual_record_key),
    [
      "prj-1|blk-a|施工|monthly|2026-02",
      "prj-1|blk-a|施工|monthly|2026-03",
      "prj-1|blk-a|施工|final",
    ],
  );
  assert.deepEqual(
    records.map((record) => record.target_month ?? null),
    ["2026-02-01", "2026-03-01", null],
  );
  for (const record of records) {
    assert.equal(record.source_kind, "手入力");
    assert.equal(record.write_channel, "app1_custom_ui");
    // §3.2: computed values are never stored on App3.
    for (const forbidden of [
      "current_budget",
      "remaining_budget",
      "consumption_ratio",
      "future_required",
    ]) {
      assert.equal(forbidden in record, false);
    }
  }

  // Feeding the write shape back in reproduces the same matrix.
  const reloaded = editableModel({ actualRows: records });
  const [row] = reloaded.matrixRows([BLOCK_A]);
  assert.equal(row.monthly["2026-02"], "40");
  assert.equal(row.monthly["2026-03"], "80");
  assert.equal(row.actual, "120");
  assert.equal(row.finalBudget, "120");
  assert.equal(row.finalBudgetManual, true);
  // Preloaded rows are not dirty — nothing is re-written unmodified.
  assert.deepEqual(reloaded.toApp3Records({ projectId: "prj-1" }), []);

  // Data months outside the configured range stay visible.
  const shifted = editableModel({ startMonth: "2027-01", monthCount: 2, actualRows: records });
  assert.deepEqual(shifted.months(), ["2026-02", "2026-03", "2027-01", "2027-02"]);
});

test("metrics follow §9.0b 案B: 実績/残予算/今後必要額/消化率 via calc.actualMetrics", () => {
  const model = editableModel();
  model.setMonthlyAmount("blk-a", "施工", "2026-02", "70");
  model.setMonthlyAmount("blk-a", "施工", "2026-03", "50");

  // Numeric example from the spec: current 100, actual 120, final still 100.
  let [row] = model.matrixRows([BLOCK_A]);
  assert.equal(row.currentBudget, "100");
  assert.equal(row.actual, "120");
  assert.equal(row.finalBudget, "100"); // default = 現行予算 (initial)
  assert.equal(row.finalBudgetManual, false);
  assert.equal(row.futureRequired, "20"); // max(0, 実績−最終)
  assert.equal(row.remainingBudget, "-20"); // 現行−実績
  assert.equal(row.consumptionRatio, "1.2"); // 120.0%

  // Raising 最終予算額 zeroes 今後必要額; 消化率/残予算 stay current-based.
  model.setFinalBudget("blk-a", "施工", "120");
  [row] = model.matrixRows([BLOCK_A]);
  assert.equal(row.finalBudget, "120");
  assert.equal(row.futureRequired, "0");
  assert.equal(row.remainingBudget, "-20");
  assert.equal(row.consumptionRatio, "1.2");

  // Zero budget → 消化率 not applicable (「—」, never numeric 0). §15.7.
  const zeroRow = model
    .matrixRows([{ ...BLOCK_A, stableBlockId: "blk-z", total: "0" }])
    .at(0);
  assert.equal(zeroRow.consumptionRatio, null);

  // 施工計/保安計 aggregate per column (Y7 partial scope in 4d).
  model.setMonthlyAmount("blk-b", "保安", "2026-02", "10");
  const totals = model.sectionTotals([BLOCK_A, BLOCK_B]);
  assert.equal(totals["施工"].actual, "120");
  assert.equal(totals["施工"].monthly["2026-02"], "70");
  assert.equal(totals["保安"].currentBudget, "500");
  assert.equal(totals["保安"].actual, "10");
  assert.equal(totals["保安"].consumptionRatio, "0.02");
});

test("Y9 (M2): BC率＝現行予算÷①・EC率＝最終予算額÷① via calc.ratio, ①=0 → 0", () => {
  const model = editableModel();
  // Without contract context ① is unknown → rates stay null (「－」).
  let [row] = model.matrixRows([BLOCK_A]);
  assert.equal(row.bcRate, null);
  assert.equal(row.ecRate, null);

  // ① = 2000: BC = 100÷2000, EC defaults to BC while 最終＝現行.
  [row] = model.matrixRows([BLOCK_A], { contractTotal1: "2000" });
  assert.equal(row.bcRate, "0.05");
  assert.equal(row.ecRate, "0.05");

  // Raising 最終予算額 moves EC率 only; BC率 stays budget-based.
  model.setFinalBudget("blk-a", "施工", "120");
  [row] = model.matrixRows([BLOCK_A], { contractTotal1: "2000" });
  assert.equal(row.bcRate, "0.05");
  assert.equal(row.ecRate, "0.06");

  // Q12/D-47: ①=0 → rate 0 (not 「－」, unlike 消化率's zero-budget rule).
  [row] = model.matrixRows([BLOCK_A], { contractTotal1: "0" });
  assert.equal(row.bcRate, "0");
  assert.equal(row.ecRate, "0");

  // Retired blocks carry 現行予算 0 → BC率 0 (P-39).
  const [retired] = model.matrixRows([BLOCK_RETIRED], { contractTotal1: "2000" });
  assert.equal(retired.bcRate, "0");

  // 施工計/保安計 carry the same section-level rates (Y7/Y9).
  const totals = model.sectionTotals([BLOCK_A, BLOCK_B], {
    contractTotal1: "2000",
  });
  assert.equal(totals["施工"].bcRate, "0.05");
  assert.equal(totals["施工"].ecRate, "0.06");
  assert.equal(totals["保安"].bcRate, "0.25");
  assert.equal(totals["保安"].ecRate, "0.25");
  // Rates are 表示のみ on the 予実 tab (Y10).
  for (const field of ["bcRate", "ecRate"]) {
    assert.ok(ACTUAL_READ_ONLY_FIELDS.includes(field));
    assert.throws(
      () => model.updateActualRow("blk-a", "施工", { [field]: "1" }),
      /read-only on the 予実 tab \(Y10\)/,
    );
  }
});

test("Y7: ⑧⑨ aggregate rows — budget includes salary, consumption excludes salary", () => {
  const model = editableModel();
  model.setMonthlyAmount("blk-a", "施工", "2026-02", "40");
  model.setMonthlyAmount("blk-b", "保安", "2026-02", "10");
  const totals = model.sectionTotals([BLOCK_A, BLOCK_B], { contractTotal1: "2000" });
  const grand8 = model.grandCost8Totals(totals, "300", "2000");
  assert.equal(grand8.currentBudget, "900");
  assert.equal(grand8.actual, "50");
  assert.equal(grand8.monthly["2026-02"], "50");
  assert.equal(grand8.bcRate, "0.45");
  const profit9 = model.profit9Totals(grand8, "2000");
  assert.equal(profit9.currentBudget, "1100");
  assert.equal(profit9.actual, "1950");
  assert.equal(profit9.bcRate, "0.55");
});

test("Y9: budget attribute columns flow from projection lines into matrix rows", () => {
  const model = editableModel();
  const attrs = new Map([
    [
      "blk-a",
      {
        summary_line_type: "材料費",
        summary_tax_rate: "0.1",
        summary_unit: "式",
        summary_qty: "1",
        summary_unit_price: "100",
        summary_amount_excl_tax: "100",
        summary_calc_basis: "見積",
        summary_note: "備考A",
      },
    ],
  ]);
  const [row] = model.matrixRows([BLOCK_A], {
    contractTotal1: "2000",
    budgetAttrsByBlockId: attrs,
  });
  assert.equal(row.budgetLineType, "材料費");
  assert.equal(row.budgetTaxRate, "0.1");
  assert.equal(row.budgetUnit, "式");
  assert.equal(row.budgetQty, "1");
  assert.equal(row.budgetCalcBasis, "見積");
  assert.equal(row.budgetNote, "備考A");
});

test("mutations are gated by editActuals, not editBudget (③ vs ①②)", () => {
  // budget_locked (版確定・最新版): budget frozen, actuals still editable.
  const budgetLocked = createActualsMatrixModel({
    lockState: LOCK_STATES.BUDGET_LOCKED,
    startMonth: "2026-02",
  });
  assert.equal(budgetLocked.allowedOperations.editBudget, false);
  assert.equal(budgetLocked.allowedOperations.editActuals, true);
  budgetLocked.setMonthlyAmount("blk-a", "施工", "2026-02", "5");
  budgetLocked.setFinalBudget("blk-a", "施工", "105");
  assert.equal(budgetLocked.matrixRows([BLOCK_A])[0].actual, "5");

  // full_locked (旧版): every actual mutation is rejected.
  const fullLocked = createActualsMatrixModel({
    lockState: LOCK_STATES.FULL_LOCKED,
    startMonth: "2026-02",
  });
  const locked = /actuals are locked/;
  assert.throws(() => fullLocked.setMonthlyAmount("blk-a", "施工", "2026-02", "5"), locked);
  assert.throws(() => fullLocked.setFinalBudget("blk-a", "施工", "105"), locked);
  assert.throws(
    () => fullLocked.updateActualRow("blk-a", "施工", { "2026-02": "5" }),
    locked,
  );
  // Display stays readable while locked.
  assert.equal(fullLocked.matrixRows([BLOCK_A])[0].currentBudget, "100");
});

test("Y10: budget attributes are read-only on the 予実 tab; amounts are integer yen", () => {
  const model = editableModel();
  for (const field of [
    "currentBudget",
    "workTypeName",
    "quantity",
    "unitPrice",
    "actual",
    "remainingBudget",
    "consumptionRatio",
  ]) {
    assert.throws(
      () => model.updateActualRow("blk-a", "施工", { [field]: "1" }),
      /read-only on the 予実 tab \(Y10\)/,
    );
  }
  // The patch route accepts exactly the 予実入力列: months + finalBudget.
  model.updateActualRow("blk-a", "施工", { "2026-02": "30", finalBudget: "130" });
  const [row] = model.matrixRows([BLOCK_A]);
  assert.equal(row.monthly["2026-02"], "30");
  assert.equal(row.finalBudget, "130");
  assert.throws(
    () => model.setMonthlyAmount("blk-a", "施工", "2026-02", "1.5"),
    /integer yen/,
  );
  assert.throws(
    () => model.setFinalBudget("blk-a", "施工", "12,000"),
    /integer yen/,
  );
  // Clearing a cell reverts it locally and drops the pending write.
  model.setMonthlyAmount("blk-a", "施工", "2026-02", "");
  assert.equal(model.matrixRows([BLOCK_A])[0].monthly["2026-02"], null);
  assert.deepEqual(
    model
      .toApp3Records({ projectId: "prj-1" })
      .map((record) => record.record_kind),
    ["final_budget"],
  );

  // Half-yen block totals (e.g. migrated footers) round to integer yen for 現行予算.
  const [halfYenRow] = model.matrixRows([
    { ...BLOCK_A, total: "58017951.5" },
  ]);
  assert.equal(halfYenRow.currentBudget, "58017952");
});

test("Y4: salary never enters the actuals matrix", () => {
  const model = editableModel();
  // Blocks outside 施工/保安 (e.g. a 区分-less block) are held back.
  const rows = model.matrixRows([
    BLOCK_A,
    { ...BLOCK_B, stableBlockId: "blk-s", costCategory: "給与" },
    { ...BLOCK_B, stableBlockId: "blk-n", costCategory: null },
  ]);
  assert.deepEqual(rows.map((row) => row.stableBlockId), ["blk-a"]);
  // App3 rows carrying a salary category are corrupt data → pivot aborts.
  assert.throws(
    () =>
      pivotActualRows([
        {
          record_kind: "monthly_consumption",
          stable_block_id: "blk-s",
          cost_category_key: "給与",
          target_month: "2026-02-01",
          amount: "1",
        },
      ]),
    /施工 or 保安/,
  );
  assert.throws(
    () => model.setMonthlyAmount("blk-s", "給与", "2026-02", "1"),
    /施工 or 保安/,
  );
});

test("P-39: retired blocks stay visible with 現行予算 0 but months stay editable", () => {
  const model = editableModel({
    actualRows: [
      {
        record_kind: "monthly_consumption",
        stable_block_id: "blk-r",
        cost_category_key: "施工",
        target_month: "2026-02-01",
        amount: "60",
      },
    ],
  });
  let [row] = model.matrixRows([BLOCK_RETIRED]);
  assert.equal(row.status, "retired");
  assert.equal(row.currentBudget, "0"); // P-39: retired contributes 0 budget
  assert.equal(row.actual, "60");
  assert.equal(row.finalBudget, "0"); // default = current = 0
  assert.equal(row.futureRequired, "60");
  assert.equal(row.consumptionRatio, null); // budget 0 → 「—」

  // Actuals continuity: the retired row still accepts monthly/final input.
  model.setMonthlyAmount("blk-r", "施工", "2026-03", "40");
  model.setFinalBudget("blk-r", "施工", "100");
  [row] = model.matrixRows([BLOCK_RETIRED]);
  assert.equal(row.actual, "100");
  assert.equal(row.finalBudget, "100");
  assert.equal(row.futureRequired, "0");
});

test("pivot rejects duplicates and malformed vertical rows (unique actual_record_key)", () => {
  const monthly = {
    record_kind: "monthly_consumption",
    stable_block_id: "blk-a",
    cost_category_key: "施工",
    target_month: "2026-02-01",
    amount: "1",
  };
  assert.throws(() => pivotActualRows([monthly, { ...monthly }]), /duplicate monthly/);
  const final = {
    record_kind: "final_budget",
    stable_block_id: "blk-a",
    cost_category_key: "施工",
    amount: "1",
  };
  assert.throws(() => pivotActualRows([final, { ...final }]), /duplicate final_budget/);
  assert.throws(
    () => pivotActualRows([{ ...monthly, record_kind: "daily" }]),
    /record_kind/,
  );
  assert.throws(() => pivotActualRows([{ ...monthly, amount: "" }]), /amount is required/);
  // kintone-style { value } wrappers are unwrapped.
  const wrapped = pivotActualRows([
    {
      record_kind: { value: "monthly_consumption" },
      stable_block_id: { value: "blk-a" },
      cost_category_key: { value: "施工" },
      target_month: { value: "2026-02-01" },
      amount: { value: "9" },
    },
  ]);
  // 2026-07-29-ver02-actual-detail-expand: pivot key now includes rowKey
  // as a trailing segment (empty for legacy block-level rows).
  assert.equal(wrapped.get("blk-a|施工|").monthly.get("2026-02"), "9");
});

test("App 1 actual tab renders the jy2-* 予実 matrix wired to editActuals", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /jy2-actual-table/);
  assert.match(source, /jy2-actual-scroll/);
  assert.match(source, /jy2RenderActualPane/);
  assert.match(source, /createActualsMatrixModel/);
  assert.match(source, /refreshActuals\(\)/);
  assert.match(source, /allowedOperations\.editActuals/);
  assert.match(source, /th\("システム工種"/);
  assert.match(source, /th\("予算との差"/);
  assert.match(source, /th\("原価累計金額"/);
  assert.match(source, /jy2ActualBudgetDiffDisplay/);
  assert.match(source, /jy2ActualAppendGroupValueCols/);
  assert.doesNotMatch(source, /th\("現行予算"/);
  assert.doesNotMatch(source, /th\("今後必要額"/);
  assert.doesNotMatch(source, /th\("残予算"/);
  assert.match(source, /jy2ActualHead/);
  assert.match(source, /colSpan:\s*2/);
  assert.doesNotMatch(source, /th\("実績"/);
  assert.doesNotMatch(source, /消費率（現予算）/);
  assert.doesNotMatch(source, /消費率（最終予算）/);
  assert.doesNotMatch(source, /th\("消費率"\)/);
  assert.doesNotMatch(source, /th\("対①率"\)/);
  assert.doesNotMatch(source, /"BC率"/);
  assert.doesNotMatch(source, /"EC率"/);
  // ① is read live from the 総括 contract lines (model still computes rates; UI hides them).
  assert.match(source, /contractTotal1/);
  assert.doesNotMatch(source, /row\.bcRate/);
  assert.doesNotMatch(source, /row\.ecRate/);
  // Y10 note + Y4 exclusion are stated on the pane.
  assert.match(source, /給与手当は対象外/);
  // 2026-07-29-ver02-actual-detail-expand: parent-only display + child rows;
  // Phase2c-c-excel-flat で費目開閉トグルは廃止（Excel常時階層）。
  assert.match(source, /jy2ActualChildRow/);
  assert.match(source, /jy2-actual-child-row/);
  assert.match(source, /detailRowsByBlockId/);
  assert.match(source, /rowKey: child\.rowKey/);
  assert.match(source, /2026-07-29-ver02-actual-detail-expand/);
  // 内訳 mutations refresh the 予実 current budgets too.
  assert.match(source, /refreshSummary\(true\);\s*refreshActuals\(\);/);
  assert.doesNotMatch(source, /className\s*=\s*["']jy-/);
  // Phase2b (2026-07-31): 月次「数量｜金額」の 2 列 UI・実行予算額（暫定）改称・
  // セッション数量 Map・qty→ROUND(単価×qty) 自動計算ヘルパを束ねに保持。
  assert.match(source, /jy2ActualMonthQtyState/);
  assert.match(source, /jy2RoundYenQtyTimesPrice/);
  assert.match(source, /__jy2ActualMonthQty/);
  assert.match(source, /th\("実行予算額"/);
  // 月次ヘッダ: top は colSpan:2 の月ラベル・bottom は 数量 / 金額 ペア。
  assert.match(source, /jy2MonthLabel\(month\), \{ colSpan: 2 \}/);
  assert.match(source, /th\("数量"\)/);
  assert.match(source, /th\("金額"\)/);
  assert.match(source, /jy2-actual-month-qty/);
  // qty override 時に金額を自動計算し amount のみ書き戻す（App758 に qty は保存しない）。
  assert.match(
    source,
    /jy2RoundYenQtyTimesPrice\(trimmed,\s*liveUnitPrice\(\)\)/,
  );
  // Phase2c-c-three-cols: Excel 原価管理明細列（固定＋操作＋単価）。
  assert.match(source, /@JY_V2_BUILD 2026-08-01-ver02-actual-month-qty-sum/);
  assert.match(source, /jy2ActualSumMonthQty/);
  assert.match(source, /structureRerenderPending/);
  assert.match(source, /onDetailFieldChanged/);
  assert.match(source, /scheduleActualRerender/);
  assert.match(source, /fieldOnly:\s*true/);
  assert.match(source, /flushDetailIfDirty/);
  assert.match(source, /liveUnitPrice/);
  assert.match(source, /jy2-actual-detail-pm-btn/);
  assert.match(source, /jy2-actual-child-qty-input/);
  assert.match(source, /jy2-actual-auto-budget/);
  assert.match(source, /JY2_ACTUAL_FREEZE_COLS = 5/);
  assert.match(source, /th\("費目"/);
  assert.match(source, /th\("種別（補助）"/);
  assert.match(source, /th\("詳細"/);
  assert.match(source, /th\("操作"/);
  assert.doesNotMatch(source, /th\("費目・種別・詳細"/);
  assert.doesNotMatch(source, /th\("費目→種別→詳細"/);
  const actualHeadMatch = source.match(
    /function jy2ActualHead[\s\S]*?return thead;\s*\}/,
  );
  assert.ok(actualHeadMatch, "jy2ActualHead body must be present");
  assert.doesNotMatch(actualHeadMatch[0], /内訳№/);
  assert.doesNotMatch(actualHeadMatch[0], /th\("区分"/);
  assert.match(source, /jy2-freeze-3/);
  assert.match(source, /jy2-freeze-4/);
  assert.match(source, /codeLabel\.title = String\(row\.workTypeName\)/);
  // Excel寄せ: 詳細列は手入力セル（└ツリー記号なし・freeze3 overflow visible）
  assert.match(source, /jy2MarkFreeze\(nameCell, 3\)/);
  assert.match(source, /jy2MarkFreeze\(opsCell, 4\)/);
  assert.doesNotMatch(source, /└ /);
  assert.doesNotMatch(source, /jy2-actual-child-indent/);
  assert.match(source, /詳細列はツリー記号なし/);
  assert.match(source, /jy2-freeze-3\{[^"]*overflow:visible/);
  // Phase2c-c-excel-row-ops: 詳細行の＋／削除
  assert.match(source, /jy2ActualChildHasStoredAmounts/);
  assert.match(source, /jy2-actual-child-delete-btn/);
  assert.match(source, /jy2-actual-child-add-btn/);
  assert.match(source, /removeDetailRow\(\s*parent\.stableBlockId,\s*child\.rowKey/);
  assert.match(source, /commitDetailField/);
  // Phase2c-c-excel-unit-price + 計画数量: 単価・数量手入力 → 実行予算自動
  assert.match(source, /jy2-actual-child-unit-price-input/);
  assert.match(source, /commitDetailField\(\{\s*unitPrice: value\s*\}\)/);
  assert.match(source, /commitDetailField\(\{\s*quantity: value\s*\}\)/);
  const childRowMatch = source.match(
    /function jy2ActualChildRow[\s\S]*?return tr;\s*\}/,
  );
  assert.ok(childRowMatch, "jy2ActualChildRow body must be present");
  assert.match(
    childRowMatch[0],
    /childDetailModel\.updateDetailRow\(parent\.stableBlockId, child\.rowKey, \{\s*name3: jy2ToFullWidthKana\(value\),/,
  );
  assert.match(childRowMatch[0], /revealDetailKey\(child\.rowKey\)/);
  assert.match(childRowMatch[0], /onDetailChanged\(\)/);
  assert.match(childRowMatch[0], /nameLabel\.textContent = name3Resolved \|\| ["']－["']/);
  assert.match(source, /操作列（＋／－）/);
  assert.match(source, /jy2ActualHimokuGroupRow/);
  assert.match(source, /jy2-actual-himoku-group-row/);
  assert.match(source, /dataset\.virtual\s*=\s*["']himoku-group["']/);
  assert.match(source, /費目合計（表示専用・入力不可）/);
  // Phase2c-c-excel-flat: 親行＝工種｜既定費目同一行。種別・詳細は常時表示（開閉なし）
  assert.match(source, /jy2ActualPrimaryHimokuLabel/);
  assert.match(source, /jy2-actual-parent-himoku/);
  assert.match(source, /himokuLabel !== primaryHimokuLabel/);
  assert.match(source, /Excelどおり種別・詳細を常時表示/);
  assert.match(source, /その下に種別・詳細を常時表示/);
  assert.doesNotMatch(source, /種別行を開く/);
  assert.doesNotMatch(
    source,
    /himokuExpandState\.isExpanded\(row\.stableBlockId, himokuLabel\)/,
  );
  assert.doesNotMatch(
    source,
    /typeExpandState\.isExpanded\(\s*row\.stableBlockId,\s*himokuLabel,\s*typeLabel/,
  );
  assert.doesNotMatch(source, /詳細行を開く/);
  // Phase2c-c: 種別枠（＋詳細行は撤去・空種別は操作列＋／詳細クイック入力）
  assert.match(source, /jy2ActualTypeGroupRow/);
  assert.match(source, /jy2-actual-type-group-row/);
  assert.match(source, /dataset\.virtual\s*=\s*["']type-group["']/);
  assert.doesNotMatch(source, /textContent = ["']＋詳細行["']/);
  assert.doesNotMatch(source, /jy2-actual-type-add-detail-btn/);
  assert.match(source, /jy2-actual-type-ops-add-btn/);
  assert.match(source, /jy2ActualInsertDetailNear/);
  assert.match(source, /種別合計（表示専用・入力不可）/);
  // Phase2c-c-excel-flat-detail: 詳細行を表示し name3 手入力（旧 hide 廃止）
  assert.match(source, /jy2ActualCostDetailVisibility/);
  assert.match(source, /shouldShow:\s*\(\)\s*=>\s*true/);
  assert.match(source, /detailQuickAdd/);
  assert.match(source, /操作列＋／－のみ/);
  assert.doesNotMatch(source, /内訳の品名カタログは隠し/);
  // Phase2c-c-template-types: コード表種別を空枠でも出す
  assert.match(source, /typesByHimokuMap/);
  assert.match(source, /templateTypes/);
  assert.match(source, /jy2HimokuChoicesForEntry/);
  // Excel寄せ: 費目横「＋種別行」は撤去済み（コメント履歴に残る文言は許容）
  assert.doesNotMatch(source, /jy2-actual-himoku-add-type-btn/);
  assert.doesNotMatch(source, /この費目の下に種別用の明細行を追加/);
  assert.match(source, /jy2-actual-detail-add-notice/);
  // helper 領域（InsertNear〜SumField）に detailModel の内訳書込 API を含める。
  const helperMatch = source.match(
    /function jy2ActualInsertDetailNear[\s\S]*?function jy2ActualSumField/,
  );
  assert.ok(helperMatch, "jy2ActualInsertDetailNear..SumField body must be present");
  // 予実（App758）側の書込 API を helper 内で呼ばないこと（保険）。
  assert.doesNotMatch(helperMatch[0], /actualsModel\.update/);
  assert.doesNotMatch(helperMatch[0], /commit\(/);
  // helper 内で detailModel.addDetailRow / updateDetailRow / moveDetailRow を用いる。
  assert.match(helperMatch[0], /detailModel\.addDetailRow/);
  assert.match(helperMatch[0], /detailModel\.updateDetailRow/);
  assert.match(helperMatch[0], /detailModel\.moveDetailRow/);
  // jy2RenderActualPane 側の pane フックと shell 側 refreshActuals 配線を検査。
  assert.match(source, /onDetailStructureChanged/);
  assert.match(source, /onDetailStructureAdded/);
  // shell からは detailModel と onDetailStructureChanged を pane 描画に渡す。
  assert.match(
    source,
    /refreshActuals\s*=\s*\(\)\s*=>\s*\{[\s\S]*?detailModel,[\s\S]*?onDetailStructureChanged,[\s\S]*?\};/,
  );
});

// Phase2c-b-a (2026-07-31): addDetailRow → updateDetailRow → moveDetailRow の
// 反復で「同一費目内の末尾直後」へ新規行を寄せる並び替えロジックのユニット
// 相当。detailModel の実装（U23 の +1/-1 swap）で目標位置に到達することを担保。
test("Phase2c-b addDetailRow + updateDetailRow + moveDetailRow lands new row after group last", async () => {
  const detailModule = await import("./detail-block-model.mjs");
  const { LOCK_STATES: LOCK_STATES_LOCAL } = await import("./lock.mjs");
  const model = detailModule.createDetailBlockModel({
    lockState: LOCK_STATES_LOCAL.EDITABLE,
  });
  const blockId = model.addBlock();
  const [row0] = model.snapshot().blocks[0].detailRows;
  model.updateDetailRow(blockId, row0.rowKey, { name1: "材料費", name2: "鉄筋" });
  const row1Key = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, row1Key, { name1: "材料費", name2: "鋼材" });
  const row2Key = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, row2Key, { name1: "労務費", name2: "型枠工" });
  // Snapshot the target block; last row in 材料費 group is row1Key (index 1).
  const before = model.snapshot().blocks[0].detailRows;
  const anchorIndex = before.findIndex((row) => row.rowKey === row1Key);
  assert.equal(anchorIndex, 1);
  const newKey = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, newKey, { name1: "材料費" });
  const rowsAfterAdd = model.snapshot().blocks[0].detailRows;
  assert.equal(rowsAfterAdd[rowsAfterAdd.length - 1].rowKey, newKey);
  const targetIndex = anchorIndex + 1;
  let safety = rowsAfterAdd.length + 1;
  while (safety > 0) {
    safety -= 1;
    const currentRows = model.snapshot().blocks[0].detailRows;
    const currentIndex = currentRows.findIndex((row) => row.rowKey === newKey);
    if (currentIndex === targetIndex) break;
    const offset = currentIndex > targetIndex ? -1 : 1;
    model.moveDetailRow(blockId, newKey, offset);
  }
  const finalRows = model.snapshot().blocks[0].detailRows;
  const finalIndex = finalRows.findIndex((row) => row.rowKey === newKey);
  assert.equal(finalIndex, targetIndex);
  // 材料費グループ末尾直後（＝労務費グループの直前）に新規行が入ること。
  assert.equal(finalRows[finalIndex].name1, "材料費");
  assert.equal(finalRows[finalIndex + 1].rowKey, row2Key);
  assert.equal(finalRows[finalIndex + 1].name1, "労務費");
});

test("phase 4d sources never target customize/736 / App 735/736 / kintone REST", () => {
  {
    const source = read("scripts/lib/jikkou-yosan-v2/actuals-matrix.mjs");
    assert.doesNotMatch(source, /customize\/736/);
    assert.doesNotMatch(source, /\b73[56]\b/);
    assert.doesNotMatch(source, /kintone\.api|bulkRequest/);
  }
  // C-2b: the UI saves only through the executor (no raw record writes).
  const uiSource = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.doesNotMatch(uiSource, /customize\/736/);
  assert.doesNotMatch(uiSource, /\b73[56]\b/);
  // P-29 may GET /k/v1/records.json; forbid single-record REST writes only.
  assert.doesNotMatch(uiSource, /kintone\.api\((["'])\/k\/v1\/record\.json/);
  assert.doesNotMatch(
    read("scripts/lib/jikkou-yosan-v2/actuals-matrix.mjs"),
    /kintone\.mjs/,
  );
});

test("rebuild bundles actuals-matrix before the UI, 736 untouched", () => {
  const state = JSON.parse(read("scripts/data/jikkou-yosan-v2-app-ids.json"));
  for (const key of ["app1", "app2", "app3"]) {
    const appId = state.apps[key].appId;
    assert.ok(appId === null || (Number.isSafeInteger(appId) && appId > 0), key);
    assert.ok(appId !== 735 && appId !== 736, `${key}: appId must never be 735/736`);
  }
  const before736 = protected736Digest();
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "jy2-phase4d-"));
  const tempBundle = path.join(tempDirectory, "desktop.js");
  try {
    execFileSync(
      process.execPath,
      [path.join(root, "scripts/jikkou-yosan-v2-build-desktop.mjs")],
      {
        cwd: root,
        stdio: "pipe",
        env: { ...process.env, JIKKOU_YOSAN_V2_OUTPUT: tempBundle },
      },
    );
    const bundle = readFileSync(tempBundle, "utf8");
    for (const marker of ["APP1", "APP2", "APP3"]) {
      const m = bundle.match(new RegExp(`/\\* @JY_V2_${marker} \\*/ (null|\\d+)`));
      assert.ok(m, `${marker} marker must be present`);
      assert.ok(m[1] !== "735" && m[1] !== "736", `${marker} must never be 735/736`);
    }
    for (const symbol of [
      "createActualsMatrixModel",
      "pivotActualRows",
      "monthRange",
      "ACTUAL_COST_CATEGORY_KEYS",
      "jy2RenderActualPane",
      "jy2ActualRow",
      // 2026-07-29-ver02-actual-detail-expand: child row must be bundled.
      "jy2ActualChildRow",
      "jy2ActualExpandState",
      // Phase2c-c-excel-flat: 費目/種別開閉は廃止。種別枠＋費目枠は常時。
      "jy2ActualTypeGroupRow",
      "jy2ActualPrimaryHimokuLabel",
      // Phase2c-a (2026-07-31): 表示専用の費目視覚グループ行も bundled。
      "jy2ActualHimokuGroupRow",
    ]) {
      assert.match(bundle, new RegExp(symbol));
    }
    assert.doesNotMatch(bundle, /kintone\.mjs/);
    assert.doesNotMatch(bundle, /APP[123]_ID\s*=\s*(?:735|736)\b/);
    // Module lands before the UI shell source (build order).
    assert.ok(
      bundle.indexOf("function createActualsMatrixModel") <
        bundle.indexOf("function jy2RenderShell"),
    );
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
  assert.equal(protected736Digest(), before736);
});
