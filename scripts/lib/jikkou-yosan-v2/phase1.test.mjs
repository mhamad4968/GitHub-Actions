import assert from "node:assert/strict";
import test from "node:test";

import {
  add,
  canonical,
  divideAndRound,
  multiply,
  round,
  subtract,
} from "./decimal.mjs";
import {
  actualMetrics,
  blockTotals,
  contractTotals,
  detailLineAmount,
  displayInteger,
  ratio,
  salaryTotal,
  summaryTotals,
  taxInclusive,
  taxInclusiveTotal,
} from "./calc.mjs";
import {
  actualRecordKey,
  createBudgetVersionId,
  createProjectId,
  createRowKey,
  createStableBlockId,
  detailRecordKey,
  projectBusinessKey,
  seriesGuardKey,
  versionRecordKey,
} from "./keys.mjs";
import {
  LOCK_STATES,
  allowedOperations,
  assertNoUnlockTransition,
  deriveLockState,
} from "./lock.mjs";
import {
  planVersionBulkRequest,
  versionBulkRequestCount,
} from "./planner.mjs";

test("decimal arithmetic is canonical and exact from strings", () => {
  assert.equal(canonical(" +001.2300 "), "1.23");
  assert.equal(add("0.1", "0.2"), "0.3");
  assert.equal(subtract("1", "1.25"), "-0.25");
  assert.equal(multiply("1.5", "101"), "151.5");
  assert.equal(divideAndRound("1", "8", 3), "0.125");
  assert.throws(() => add(0.1, "0.2"), /must be strings/);
});

test("decimal parse accepts thousand separators from migrated kintone values", () => {
  assert.equal(canonical("634,200"), "634200");
  assert.equal(multiply("1", "634,200"), "634200");
  assert.equal(salaryTotal([{ quantity: "1", unitPrice: "634,200" }]), "634200");
});

test("Excel ROUND is half-away-from-zero, including negatives", () => {
  assert.equal(round("100.49"), "100");
  assert.equal(round("100.5"), "101");
  assert.equal(round("-100.49"), "-100");
  assert.equal(round("-100.5"), "-101");
  assert.equal(round("1.25", 1), "1.3");
  assert.equal(round("-1.25", 1), "-1.3");
});

test("contract and salary preserve decimal products and round only for display", () => {
  const contract = contractTotals([
    { section: "施工", quantity: "1", unitPrice: "100.4" },
    { section: "施工", quantity: "1", unitPrice: "100.4" },
    { section: "保安", quantity: "1.5", unitPrice: "101" },
    { section: "保安", quantity: "", unitPrice: "999" },
  ]);
  assert.deepEqual(contract, {
    construction: "200.8",
    safety: "151.5",
    total1: "352.3",
  });
  assert.equal(displayInteger("100.4"), "100");
  assert.equal(displayInteger(contract.construction), "201");
  assert.equal(salaryTotal([{ quantity: "1.5", unitPrice: "101" }]), "151.5");
});

test("detail lines apply integer Excel rounding for normal and percent units", () => {
  assert.equal(detailLineAmount({ quantity: "1.2", unitPrice: "100.2" }), "120");
  assert.equal(detailLineAmount({ quantity: "1", unitPrice: "100.5" }), "101");
  assert.equal(detailLineAmount({ quantity: "-1", unitPrice: "100.5" }), "-101");
  assert.equal(
    detailLineAmount({ quantity: "1.25", unitPrice: "10000", unit: "％" }),
    "125",
  );
  assert.equal(detailLineAmount({ quantity: "", unitPrice: "100" }), null);
});

test("block subtotal and total treat blank manual footers as zero", () => {
  assert.deepEqual(
    blockTotals({
      detailAmounts: ["120", { amount: "101" }],
      overhead: "10",
      insurance: null,
      legalWelfare: "5",
    }),
    { subtotal: "231", total: "236" },
  );
});

test("summary uses active block totals as authority and excludes retired blocks", () => {
  const result = summaryTotals({
    contract: [
      { section: "施工", quantity: "10", unitPrice: "100" },
      { section: "保安", quantity: "2", unitPrice: "100" },
    ],
    blocks: [
      { stableBlockId: "blk-a", costCategory: "施工", status: "active", total: "300" },
      {
        stableBlockId: "blk-b",
        costCategory: "保安",
        status: "active",
        total: "100",
        projectionCache: "999999",
      },
      { stableBlockId: "blk-c", costCategory: "施工", status: "retired", total: "700" },
    ],
    salaryLines: [{ quantity: "1.5", unitPrice: "100" }],
  });
  assert.equal(result.total1, "1200");
  assert.equal(result.costConstruction, "300");
  assert.equal(result.costSafety, "100");
  assert.equal(result.salary, "150");
  assert.equal(result.total8, "550");
  assert.equal(result.profit9, "650");
});

test("tax rounds each line before summing and ratio follows P-42", () => {
  assert.equal(taxInclusive("100.5", "0"), "101");
  assert.equal(taxInclusive("-100.5", "0"), "-101");
  assert.equal(taxInclusive("100", "0.08"), "108");
  assert.equal(taxInclusive("100", "0.1"), "110");
  assert.equal(
    taxInclusiveTotal([
      { amountExclTax: "100.4", taxRate: "0" },
      { amountExclTax: "100.4", taxRate: "0" },
    ]),
    "200",
  );
  assert.equal(ratio("123", "1000"), "0.123");
  assert.equal(ratio("0.5", "1000"), "0.001");
  assert.equal(ratio("-0.5", "1000"), "-0.001");
  assert.equal(ratio("1", "0"), "0");
  assert.equal(ratio("1", "0", { zero: "not_applicable" }), null);
});

test("actual metrics derive actual, remaining, shortage, and zero handling", () => {
  assert.deepEqual(
    actualMetrics({
      monthlyAmounts: ["40", "80"],
      currentBudget: "100",
      finalBudget: "100",
    }),
    {
      actual: "120",
      remainingBudget: "-20",
      futureRequired: "20",
      consumptionRatio: "1.2",
    },
  );
  assert.deepEqual(
    actualMetrics({
      monthlyAmounts: ["5"],
      currentBudget: "0",
      finalBudget: "10",
    }),
    {
      actual: "5",
      remainingBudget: "-5",
      futureRequired: "0",
      consumptionRatio: null,
    },
  );
});

test("key generation is deterministic and stable under injected UUIDs", () => {
  const uuid = () => "00000000-0000-4000-8000-000000000001";
  assert.equal(createProjectId(uuid), "prj-00000000-0000-4000-8000-000000000001");
  assert.equal(createBudgetVersionId(uuid), "bv-00000000-0000-4000-8000-000000000001");
  assert.equal(createStableBlockId(uuid), "blk-00000000-0000-4000-8000-000000000001");
  assert.equal(createRowKey(uuid), "row-00000000-0000-4000-8000-000000000001");
  assert.equal(projectBusinessKey(" 2423101 ", " 2 "), "2423101|2");
  assert.equal(projectBusinessKey("2423101"), "2423101|");
  assert.equal(detailRecordKey("bv-a", "row-a"), "bv-a|row-a");
  assert.equal(versionRecordKey("prj-a", 2), "prj-a|2");
  assert.equal(
    seriesGuardKey({ initial: true, projectBusinessKey: "2423101|2" }),
    "project|2423101|2",
  );
  assert.equal(
    seriesGuardKey({ initial: false, budgetVersionId: "bv-a" }),
    "version|bv-a",
  );
});

test("actual keys distinguish month, final budget, and cost category", () => {
  const common = {
    projectId: "prj-a",
    stableBlockId: "blk-a",
    costCategoryKey: "施工",
  };
  assert.equal(
    actualRecordKey({
      ...common,
      recordKind: "monthly_consumption",
      targetMonth: "2026-07-01",
    }),
    "prj-a|blk-a|施工|monthly|2026-07",
  );
  assert.equal(
    actualRecordKey({ ...common, recordKind: "final_budget" }),
    "prj-a|blk-a|施工|final",
  );
  assert.notEqual(
    actualRecordKey({ ...common, recordKind: "final_budget" }),
    actualRecordKey({
      ...common,
      costCategoryKey: "保安",
      recordKind: "final_budget",
    }),
  );
});

test("projectBusinessKey trim-normalizes segments everywhere it is parsed (M5)", () => {
  // Composition trims each segment (including full-width spaces).
  assert.equal(projectBusinessKey("\u30002423101\u3000", " 2 "), "2423101|2");
  // seriesGuardKey re-parses a composed key and must normalize identically,
  // so padded input can never mint a distinct guard key.
  assert.equal(
    seriesGuardKey({ initial: true, projectBusinessKey: " 2423101 | 2 " }),
    "project|2423101|2",
  );
  assert.equal(
    seriesGuardKey({ initial: true, projectBusinessKey: " 2423101 | 2 " }),
    seriesGuardKey({ initial: true, projectBusinessKey: "2423101|2" }),
  );
  // Branch-less keys keep the trailing delimiter after normalization.
  assert.equal(
    seriesGuardKey({ initial: true, projectBusinessKey: " 2423101 |  " }),
    "project|2423101|",
  );
  // Whitespace-only projectCode is rejected, not silently emptied.
  assert.throws(
    () => seriesGuardKey({ initial: true, projectBusinessKey: "   |2" }),
    /must not be empty/,
  );
});

test("keys reject empty required segments and delimiter injection", () => {
  assert.throws(() => projectBusinessKey("", ""), /must not be empty/);
  assert.throws(() => projectBusinessKey("24|23", ""), /must not contain/);
  assert.throws(() => detailRecordKey("bv-a", ""), /must not be empty/);
  assert.throws(
    () =>
      actualRecordKey({
        projectId: "prj-a",
        stableBlockId: "blk-a",
        costCategoryKey: "施工",
        recordKind: "monthly_consumption",
        targetMonth: "2026-13",
      }),
    /targetMonth/,
  );
});

test("lock state derives only from status and newer-version existence", () => {
  assert.equal(
    deriveLockState({ status: "下書き", newerVersionExists: false }),
    LOCK_STATES.EDITABLE,
  );
  assert.equal(
    deriveLockState({ status: "版確定", newerVersionExists: false }),
    LOCK_STATES.BUDGET_LOCKED,
  );
  assert.equal(
    deriveLockState({ status: "下書き", newerVersionExists: true }),
    LOCK_STATES.FULL_LOCKED,
  );
  assert.deepEqual(allowedOperations(LOCK_STATES.EDITABLE), {
    editBudget: true,
    editActuals: true,
    createNextVersion: false,
  });
  assert.deepEqual(allowedOperations(LOCK_STATES.BUDGET_LOCKED), {
    editBudget: false,
    editActuals: true,
    createNextVersion: true,
  });
  assert.deepEqual(allowedOperations(LOCK_STATES.FULL_LOCKED), {
    editBudget: false,
    editActuals: false,
    createNextVersion: false,
  });
});

test("lock transitions never unlock", () => {
  assert.equal(
    assertNoUnlockTransition(LOCK_STATES.EDITABLE, LOCK_STATES.FULL_LOCKED),
    LOCK_STATES.FULL_LOCKED,
  );
  assert.throws(
    () =>
      assertNoUnlockTransition(
        LOCK_STATES.FULL_LOCKED,
        LOCK_STATES.BUDGET_LOCKED,
      ),
    /Unlock transition is forbidden/,
  );
});

test("bulk request planner enforces the 900/901 boundary before API work", () => {
  assert.equal(versionBulkRequestCount(0), 2);
  assert.equal(versionBulkRequestCount(763), 18);
  assert.equal(versionBulkRequestCount(900), 20);
  assert.equal(versionBulkRequestCount(901), 22);
  assert.equal(planVersionBulkRequest(900).requestCount, 20);
  assert.throws(
    () => planVersionBulkRequest(901),
    (error) =>
      error instanceof RangeError &&
      error.rowCount === 901 &&
      error.requestCount === 22,
  );
});
