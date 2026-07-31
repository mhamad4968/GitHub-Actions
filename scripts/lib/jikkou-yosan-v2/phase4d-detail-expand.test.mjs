import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTUAL_COST_CATEGORY_KEYS,
  createActualsMatrixModel,
  pivotActualRows,
} from "./actuals-matrix.mjs";
import { actualRecordKey, compactRowKeyHash } from "./keys.mjs";
import { LOCK_STATES } from "./lock.mjs";
import {
  app3RecordsToActualRows,
  app3RowToRecord,
} from "./save-model.mjs";

// 2026-07-29-ver02-actual-detail-expand: 内訳№親＝合計表示のみ、＋展開で
// 明細行に月別消化・最終予算額を入力。親＝子の合計、子が空のセルはレガ
// シー（旧・親単位）値をそのまま表示するフォールバック。

const BLOCK_A = Object.freeze({
  stableBlockId: "blk-a",
  status: "active",
  costCategory: "施工",
  workTypeCode: "K-1",
  workTypeName: "けた橋",
  blockNo: 1,
  total: "1000",
});

const DETAIL_A1 = Object.freeze({
  rowKey: "row-abc1def2ghi3jkl4",
  name1: "材料費",
  name2: "鉄筋",
  name3: "D13",
  unit: "㎡",
  quantity: "10",
  unitPrice: "80",
  amount: "800",
});
const DETAIL_A2 = Object.freeze({
  rowKey: "row-mno5pqr6stu7vwx8",
  name1: "材料費",
  name2: "鉄筋",
  name3: "D16",
  unit: "㎡",
  quantity: "5",
  unitPrice: "40",
  amount: "200",
});

function editableModel(overrides = {}) {
  return createActualsMatrixModel({
    lockState: LOCK_STATES.EDITABLE,
    startMonth: "2026-02",
    ...overrides,
  });
}

test("catalog: 施工/保安 unchanged; ACTUAL cost keys are still 2", () => {
  assert.deepEqual(ACTUAL_COST_CATEGORY_KEYS, ["施工", "保安"]);
});

test("actualRecordKey: legacy variant unchanged; detail variant ≤64 chars", () => {
  const projectId = "prj-1234567890abcdef";
  const stableBlockId = "blk-abcdef0123456789";
  const legacyMonthly = actualRecordKey({
    projectId,
    stableBlockId,
    costCategoryKey: "施工",
    recordKind: "monthly_consumption",
    targetMonth: "2026-02",
  });
  assert.equal(legacyMonthly, "prj-1234567890abcdef|blk-abcdef0123456789|施工|monthly|2026-02");
  assert.ok(legacyMonthly.length <= 64);

  const legacyFinal = actualRecordKey({
    projectId,
    stableBlockId,
    costCategoryKey: "施工",
    recordKind: "final_budget",
  });
  assert.equal(legacyFinal, "prj-1234567890abcdef|blk-abcdef0123456789|施工|final");

  // Detail variant: compact m/f + YY-MM + r<8hex>. Length must stay ≤64
  // even with a maximum-length rowKey (row- + 32 UUID chars).
  const bigRowKey = `row-${"a".repeat(32)}`;
  const detailMonthly = actualRecordKey({
    projectId,
    stableBlockId,
    costCategoryKey: "保安",
    recordKind: "monthly_consumption",
    targetMonth: "2026-02",
    rowKey: bigRowKey,
  });
  assert.ok(
    detailMonthly.length <= 64,
    `detail monthly key must be ≤64: ${detailMonthly.length} chars — ${detailMonthly}`,
  );
  // The compact 8-hex hash of the rowKey appears prefixed by `r`.
  const hash = compactRowKeyHash(bigRowKey);
  assert.match(hash, /^[0-9a-f]{8}$/);
  assert.ok(detailMonthly.endsWith(`|r${hash}`));
  // detail_row_key hash is deterministic (same input → same output).
  assert.equal(compactRowKeyHash(bigRowKey), hash);
  // Different rows produce different hashes (collision defended by prefix).
  assert.notEqual(
    compactRowKeyHash(DETAIL_A1.rowKey),
    compactRowKeyHash(DETAIL_A2.rowKey),
  );

  const detailFinal = actualRecordKey({
    projectId,
    stableBlockId,
    costCategoryKey: "施工",
    recordKind: "final_budget",
    rowKey: DETAIL_A1.rowKey,
  });
  assert.ok(detailFinal.length <= 64);
  assert.match(detailFinal, /\|f\|r[0-9a-f]{8}$/);
});

test("pivot: detail_row_key routes actual rows to child grain", () => {
  const model = editableModel({
    actualRows: [
      {
        record_kind: "monthly_consumption",
        stable_block_id: "blk-a",
        cost_category_key: "施工",
        detail_row_key: DETAIL_A1.rowKey,
        target_month: "2026-02-01",
        amount: "300",
      },
      {
        record_kind: "monthly_consumption",
        stable_block_id: "blk-a",
        cost_category_key: "施工",
        detail_row_key: DETAIL_A2.rowKey,
        target_month: "2026-02-01",
        amount: "100",
      },
      {
        record_kind: "final_budget",
        stable_block_id: "blk-a",
        cost_category_key: "施工",
        detail_row_key: DETAIL_A1.rowKey,
        amount: "850",
      },
    ],
  });
  const detailMap = new Map([["blk-a", [DETAIL_A1, DETAIL_A2]]]);
  const [row] = model.matrixRows([BLOCK_A], { detailRowsByBlockId: detailMap });
  assert.equal(row.hasChildren, true);
  assert.equal(row.children.length, 2);
  // Per-detail currentBudget uses detailRowAmount (数量×単価, integer-yen rounded).
  assert.equal(row.children[0].currentBudget, "800");
  assert.equal(row.children[1].currentBudget, "200");
  // Per-detail actual sums the child's monthly entries.
  assert.equal(row.children[0].actual, "300");
  assert.equal(row.children[1].actual, "100");
  // Parent aggregates children: 2026-02 sum = 300 + 100 = 400.
  assert.equal(row.monthly["2026-02"], "400");
  assert.equal(row.actual, "400");
  // Final: 明細は常に数量×単価（800+200）。App758 final_budget 手入力は無視。
  assert.equal(row.finalBudget, "1000");
  assert.equal(row.finalBudgetFromChildren, true);
});

test("parent falls back to legacy block-level cell when no child has a value", () => {
  const model = editableModel({
    actualRows: [
      {
        record_kind: "monthly_consumption",
        stable_block_id: "blk-a",
        cost_category_key: "施工",
        target_month: "2026-02-01",
        amount: "500",
      },
    ],
  });
  const detailMap = new Map([["blk-a", [DETAIL_A1, DETAIL_A2]]]);
  const [row] = model.matrixRows([BLOCK_A], { detailRowsByBlockId: detailMap });
  assert.equal(row.monthly["2026-02"], "500");
  assert.equal(row.actual, "500");
  // Children exist but hold no value → their cells are null (empty inputs).
  for (const child of row.children) {
    assert.equal(child.monthly["2026-02"], null);
  }
});

test("child overrides legacy for the cells where a child value exists", () => {
  const model = editableModel({
    actualRows: [
      // legacy block-level: 2026-02 = 500
      {
        record_kind: "monthly_consumption",
        stable_block_id: "blk-a",
        cost_category_key: "施工",
        target_month: "2026-02-01",
        amount: "500",
      },
      // child 1: 2026-02 = 300 (should override legacy for this cell only)
      {
        record_kind: "monthly_consumption",
        stable_block_id: "blk-a",
        cost_category_key: "施工",
        detail_row_key: DETAIL_A1.rowKey,
        target_month: "2026-02-01",
        amount: "300",
      },
      // legacy block-level: 2026-03 = 200 (no child value for this month)
      {
        record_kind: "monthly_consumption",
        stable_block_id: "blk-a",
        cost_category_key: "施工",
        target_month: "2026-03-01",
        amount: "200",
      },
    ],
  });
  const detailMap = new Map([["blk-a", [DETAIL_A1, DETAIL_A2]]]);
  const [row] = model.matrixRows([BLOCK_A], { detailRowsByBlockId: detailMap });
  // 2026-02: child sum (300) wins over legacy 500.
  assert.equal(row.monthly["2026-02"], "300");
  // 2026-03: no child value → legacy 200 shows on parent.
  assert.equal(row.monthly["2026-03"], "200");
  // Child monthly exists → parent final switches to child-sum mode
  // (effective finals: 800 + 200 defaults), not leftover legacy final.
  assert.equal(row.finalBudgetFromChildren, true);
  assert.equal(row.finalBudget, "1000");
});

test("parent final uses child effective finals when any child has monthly", () => {
  const model = editableModel({
    actualRows: [
      {
        record_kind: "final_budget",
        stable_block_id: "blk-a",
        cost_category_key: "施工",
        amount: "9999",
      },
      {
        record_kind: "monthly_consumption",
        stable_block_id: "blk-a",
        cost_category_key: "施工",
        detail_row_key: DETAIL_A1.rowKey,
        target_month: "2026-02-01",
        amount: "10",
      },
    ],
  });
  const detailMap = new Map([["blk-a", [DETAIL_A1, DETAIL_A2]]]);
  const [row] = model.matrixRows([BLOCK_A], { detailRowsByBlockId: detailMap });
  assert.equal(row.finalBudgetFromChildren, true);
  assert.equal(row.finalBudget, "1000");
  assert.notEqual(row.finalBudget, "9999");
});

test("updateActualRow({rowKey}) writes to the detail entry only", () => {
  const model = editableModel();
  model.updateActualRow(
    "blk-a",
    "施工",
    { "2026-02": "120", finalBudget: "800" },
    { rowKey: DETAIL_A1.rowKey },
  );
  const detailMap = new Map([["blk-a", [DETAIL_A1, DETAIL_A2]]]);
  const [row] = model.matrixRows([BLOCK_A], { detailRowsByBlockId: detailMap });
  assert.equal(row.children[0].monthly["2026-02"], "120");
  // 実行予算は数量×単価の自動（手入力 finalBudget は明細では無視）
  assert.equal(row.children[0].finalBudget, "800");
  assert.equal(row.children[0].finalBudgetManual, false);
  // Second child untouched.
  assert.equal(row.children[1].monthly["2026-02"], null);
  // Parent = child sum (120 + null); parent value = 120.
  assert.equal(row.monthly["2026-02"], "120");
});

test("toApp3Records: detail rows emit detail-variant key + detail_row_key field", () => {
  const model = editableModel();
  model.updateActualRow(
    "blk-a",
    "施工",
    { "2026-02": "120", finalBudget: "900" },
    { rowKey: DETAIL_A1.rowKey },
  );
  const records = model.toApp3Records({ projectId: "prj-1234567890abcdef" });
  assert.equal(records.length, 2);
  for (const record of records) {
    assert.ok(record.actual_record_key.length <= 64);
    assert.equal(record.detail_row_key, DETAIL_A1.rowKey);
    assert.match(record.actual_record_key, /\|r[0-9a-f]{8}$/);
  }
  const monthly = records.find((record) => record.record_kind === "monthly_consumption");
  assert.match(monthly.actual_record_key, /\|m\|26-02\|r[0-9a-f]{8}$/);
  const finalRecord = records.find((record) => record.record_kind === "final_budget");
  assert.match(finalRecord.actual_record_key, /\|f\|r[0-9a-f]{8}$/);

  // Legacy block-level writes still emit the unchanged 60-char format.
  const legacyModel = editableModel();
  legacyModel.updateActualRow("blk-a", "施工", { "2026-02": "500" });
  const legacyRecords = legacyModel.toApp3Records({
    projectId: "prj-1234567890abcdef",
  });
  assert.equal(legacyRecords.length, 1);
  assert.equal(legacyRecords[0].detail_row_key, undefined);
  assert.match(legacyRecords[0].actual_record_key, /\|monthly\|2026-02$/);
});

test("app3RowToRecord: emits detail_row_key field only for detail-variant rows", () => {
  const model = editableModel();
  model.updateActualRow(
    "blk-a",
    "施工",
    { "2026-02": "120" },
    { rowKey: DETAIL_A1.rowKey },
  );
  const [row] = model.toApp3Records({ projectId: "prj-1234567890abcdef" });
  const record = app3RowToRecord(row, {
    projectId: "prj-1234567890abcdef",
    projectBusinessKey: "P100|A",
  });
  assert.equal(record.detail_row_key.value, DETAIL_A1.rowKey);
  assert.equal(record.actual_record_key.value.length <= 64, true);

  const legacyModel = editableModel();
  legacyModel.updateActualRow("blk-a", "施工", { "2026-02": "500" });
  const [legacyRow] = legacyModel.toApp3Records({
    projectId: "prj-1234567890abcdef",
  });
  const legacyRecord = app3RowToRecord(legacyRow, {
    projectId: "prj-1234567890abcdef",
    projectBusinessKey: "P100|A",
  });
  assert.equal(legacyRecord.detail_row_key, undefined);
});

test("round-trip: app3RecordsToActualRows preserves detail_row_key", () => {
  const model = editableModel();
  model.updateActualRow(
    "blk-a",
    "施工",
    { "2026-02": "300", finalBudget: "800" },
    { rowKey: DETAIL_A1.rowKey },
  );
  model.updateActualRow(
    "blk-a",
    "施工",
    { "2026-02": "100" },
    { rowKey: DETAIL_A2.rowKey },
  );
  const written = model.toApp3Records({ projectId: "prj-1234567890abcdef" });
  // Simulate what kintone returns: field { value }.
  const asKintone = written.map((row) => {
    const wrapped = {};
    for (const [key, value] of Object.entries(row)) {
      wrapped[key] = { value: String(value ?? "") };
    }
    return wrapped;
  });
  const parsed = app3RecordsToActualRows(asKintone);
  const reloaded = editableModel({ actualRows: parsed });
  const detailMap = new Map([["blk-a", [DETAIL_A1, DETAIL_A2]]]);
  const [row] = reloaded.matrixRows([BLOCK_A], { detailRowsByBlockId: detailMap });
  assert.equal(row.children[0].monthly["2026-02"], "300");
  assert.equal(row.children[0].finalBudget, "800");
  assert.equal(row.children[1].monthly["2026-02"], "100");
  assert.equal(row.actual, "400");
});

test("pivot: same block + cost + month collision across legacy and detail rows is allowed", () => {
  // Legacy (no rowKey) + detail (with rowKey) are distinct entries — their
  // actual_record_keys are distinct so the App3 unique constraint holds.
  const pivot = pivotActualRows([
    {
      record_kind: "monthly_consumption",
      stable_block_id: "blk-a",
      cost_category_key: "施工",
      target_month: "2026-02-01",
      amount: "500",
    },
    {
      record_kind: "monthly_consumption",
      stable_block_id: "blk-a",
      cost_category_key: "施工",
      detail_row_key: DETAIL_A1.rowKey,
      target_month: "2026-02-01",
      amount: "300",
    },
  ]);
  assert.equal(pivot.size, 2);
  assert.ok(pivot.has("blk-a|施工|"));
  assert.ok(pivot.has(`blk-a|施工|${DETAIL_A1.rowKey}`));
});

test("sectionTotals: 施工計 aggregates parent rows (child-summed when children active)", () => {
  const model = editableModel();
  model.updateActualRow(
    "blk-a",
    "施工",
    { "2026-02": "300" },
    { rowKey: DETAIL_A1.rowKey },
  );
  model.updateActualRow(
    "blk-a",
    "施工",
    { "2026-02": "100" },
    { rowKey: DETAIL_A2.rowKey },
  );
  const detailMap = new Map([["blk-a", [DETAIL_A1, DETAIL_A2]]]);
  const totals = model.sectionTotals([BLOCK_A], { detailRowsByBlockId: detailMap });
  assert.equal(totals["施工"].actual, "400");
  assert.equal(totals["施工"].monthly["2026-02"], "400");
});
