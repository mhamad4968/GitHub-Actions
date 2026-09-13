import assert from "node:assert/strict";
import test from "node:test";

import { LOCK_STATES } from "./lock.mjs";
import { createContractSalaryModel } from "./contract-salary-model.mjs";
import { createDetailBlockModel } from "./detail-block-model.mjs";
import {
  applyAmountDeltaFallbacks,
  buildAmountDeltaIndex,
  compareAmountDelta,
  detailDeltaKey,
  formatSignedYen,
  lookupAmountDelta,
  lookupTotalsDelta,
} from "./amount-delta-model.mjs";

test("new row and unchanged amount both show dash with distinct titles", () => {
  const missing = compareAmountDelta({ amount: "10000", quantity: "1", unitPrice: "10000" }, null);
  assert.equal(missing.kind, "new");
  assert.equal(missing.display, "－");
  assert.equal(missing.title, "前版に無い行");

  const same = compareAmountDelta(
    { amount: "10000", quantity: "2", unitPrice: "5000" },
    { amount: "10000", quantity: "1", unitPrice: "10000" },
  );
  assert.equal(same.kind, "same");
  assert.equal(same.display, "－");
  assert.equal(same.label, "");
  assert.equal(same.title, "変化なし");
});

test("integer yen 0 on totals is dash not plus-zero", () => {
  const rounded = compareAmountDelta({ amount: "100.4" }, { amount: "100" });
  assert.equal(rounded.kind, "same");
  assert.equal(rounded.display, "－");
  assert.equal(formatSignedYen("0.4"), "－");
  assert.equal(formatSignedYen("0"), "－");
  const zeroTotal = lookupTotalsDelta(
    { enabled: true, totals: { costConstruction: "0" } },
    "costConstruction",
    "0",
  );
  assert.equal(zeroTotal.kind, "same");
  assert.equal(zeroTotal.display, "－");
  const roundedTotal = lookupTotalsDelta(
    { enabled: true, totals: { costConstruction: "100.2" } },
    "costConstruction",
    "100",
  );
  assert.equal(roundedTotal.kind, "same");
  const payload = {
    contractLines: [
      {
        rowKey: "c1",
        section: "施工",
        workName: "塗装",
        unit: "式",
        quantity: "1",
        unitPrice: "100000",
      },
    ],
    salaryLines: [],
    blocks: [
      {
        stableBlockId: "blk-a",
        costCategory: "施工",
        workTypeName: "塗装工事",
        detailRows: [
          {
            rowKey: "d1",
            name1: "材料費",
            unit: "式",
            quantity: "1",
            unitPrice: "50000",
          },
        ],
      },
    ],
  };
  const prev = buildAmountDeltaIndex(payload);
  const current = createDetailBlockModel({
    lockState: LOCK_STATES.FULL_LOCKED,
    blocks: payload.blocks,
  });
  const currentTotals = createContractSalaryModel({
    lockState: LOCK_STATES.FULL_LOCKED,
    contractLines: payload.contractLines,
  }).totals(current.projectionBlocks());
  const cost = lookupTotalsDelta(prev, "costConstruction", currentTotals.costConstruction);
  assert.equal(cost.kind, "same");
  assert.equal(cost.display, "－");
  assert.equal(lookupTotalsDelta(prev, "total1", currentTotals.total1).display, "－");
  assert.equal(lookupTotalsDelta(prev, "total8", currentTotals.total8).display, "－");
  assert.equal(lookupTotalsDelta(prev, "profit9", currentTotals.profit9).display, "－");
});

test("qty / price / both labels only when amount changes", () => {
  const qty = compareAmountDelta(
    { amount: "20000", quantity: "2", unitPrice: "10000" },
    { amount: "10000", quantity: "1", unitPrice: "10000" },
  );
  assert.equal(qty.display, "+10000");
  assert.equal(qty.label, "数量変更");

  const price = compareAmountDelta(
    { amount: "12000", quantity: "1", unitPrice: "12000" },
    { amount: "10000", quantity: "1", unitPrice: "10000" },
  );
  assert.equal(price.display, "+2000");
  assert.equal(price.label, "単価変更");

  const both = compareAmountDelta(
    { amount: "48000", quantity: "4", unitPrice: "12000" },
    { amount: "10000", quantity: "1", unitPrice: "10000" },
  );
  assert.equal(both.display, "+38000");
  assert.equal(both.label, "数量・単価");

  const down = compareAmountDelta(
    { amount: "8000", quantity: "1", unitPrice: "8000" },
    { amount: "10000", quantity: "1", unitPrice: "10000" },
  );
  assert.equal(down.display, "-2000");
  assert.equal(formatSignedYen("-12.4"), "-12");
});

test("totals omit qty/price labels and include new plus deleted", () => {
  const prev = buildAmountDeltaIndex({
    contractLines: [
      {
        rowKey: "c1",
        section: "施工",
        workName: "塗装",
        unit: "式",
        quantity: "1",
        unitPrice: "100000",
      },
    ],
    salaryLines: [],
    blocks: [
      {
        stableBlockId: "blk-a",
        costCategory: "施工",
        workTypeName: "塗装工事",
        detailRows: [
          {
            rowKey: "d1",
            name1: "材料費",
            unit: "式",
            quantity: "1",
            unitPrice: "50000",
          },
          {
            rowKey: "d-del",
            name1: "材料費",
            unit: "式",
            quantity: "1",
            unitPrice: "10000",
          },
        ],
      },
    ],
  });
  const current = createDetailBlockModel({
    lockState: LOCK_STATES.FULL_LOCKED,
    blocks: [
      {
        stableBlockId: "blk-a",
        costCategory: "施工",
        workTypeName: "塗装工事",
        detailRows: [
          {
            rowKey: "d1",
            name1: "材料費",
            unit: "式",
            quantity: "1",
            unitPrice: "50000",
          },
          {
            rowKey: "d-new",
            name1: "材料費",
            unit: "式",
            quantity: "1",
            unitPrice: "30000",
          },
        ],
      },
    ],
  });
  const currentSnap = current.snapshot().blocks[0];
  const kept = lookupAmountDelta(
    prev,
    "detail",
    detailDeltaKey("blk-a", "d1"),
    { quantity: "1", unitPrice: "50000", amount: currentSnap.detailRows[0].amount },
  );
  assert.equal(kept.kind, "same");
  const added = lookupAmountDelta(
    prev,
    "detail",
    detailDeltaKey("blk-a", "d-new"),
    { quantity: "1", unitPrice: "30000", amount: "30000" },
  );
  assert.equal(added.kind, "new");
  const currentTotals = createContractSalaryModel({
    lockState: LOCK_STATES.FULL_LOCKED,
    contractLines: [
      {
        rowKey: "c1",
        section: "施工",
        workName: "塗装",
        unit: "式",
        quantity: "1",
        unitPrice: "100000",
      },
    ],
  }).totals(current.projectionBlocks());
  const costDelta = lookupTotalsDelta(prev, "costConstruction", currentTotals.costConstruction);
  assert.equal(costDelta.kind, "delta");
  assert.equal(costDelta.label, "");
  assert.equal(costDelta.display, "+20000");
});

test("lookup returns null when index is hidden", () => {
  assert.equal(lookupAmountDelta(null, "contract", "x", { amount: "1" }), null);
  assert.equal(lookupTotalsDelta({ enabled: false, totals: {} }, "total1", "1"), null);
});

test("empty rebuilt previous uses stored totals and summary_cost_lines", () => {
  const empty = buildAmountDeltaIndex({ contractLines: [], salaryLines: [], blocks: [] });
  assert.equal(lookupTotalsDelta(empty, "construction", "46910000").display, "+46910000");

  const filled = applyAmountDeltaFallbacks(empty, {
    contract_construction_total: { value: "46910000" },
    contract_safety_total: { value: "4856700" },
    contract_total_1: { value: "51766700" },
    salary_total: { value: "1200000" },
    summary_cost_lines: {
      value: [
        {
          value: {
            summary_row_key: { value: "blk-a\t材料費\t\t式\t" },
            summary_stable_block_id: { value: "blk-a" },
            summary_qty: { value: "1" },
            summary_unit_price: { value: "50000" },
            summary_amount_excl_tax: { value: "50000" },
            summary_cost_category: { value: "施工" },
          },
        },
      ],
    },
  });
  assert.equal(lookupTotalsDelta(filled, "construction", "46910000").display, "－");
  assert.equal(lookupTotalsDelta(filled, "safety", "4856700").display, "－");
  assert.equal(lookupTotalsDelta(filled, "total1", "51766700").display, "－");
  assert.equal(lookupTotalsDelta(filled, "salary", "1200000").display, "－");
  assert.equal(lookupTotalsDelta(filled, "costConstruction", "50000").display, "－");
  const line = lookupAmountDelta(
    filled,
    "projection",
    "blk-a\t材料費\t\t式\t",
    { amount: "50000", quantity: "1", unitPrice: "50000" },
    { labels: false },
  );
  assert.equal(line.kind, "same");
});
