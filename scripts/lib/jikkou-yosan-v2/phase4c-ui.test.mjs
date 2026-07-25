import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createContractSalaryModel } from "./contract-salary-model.mjs";
import {
  BLOCK_FOOTER_KINDS,
  BLOCK_FOOTER_LABELS,
  BLOCK_STATUSES,
  DETAIL_ROW_KINDS,
  DETAIL_UNITS,
  MANUAL_FOOTER_KINDS,
  createDetailBlockModel,
  detailRowAmount,
} from "./detail-block-model.mjs";
import { LOCK_STATES } from "./lock.mjs";
import { regenerateSummaryCostLines } from "./projection.mjs";

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

function sequentialUuidFactory() {
  let counter = 0;
  return () => `uuid-${++counter}`;
}

function editableModel(overrides = {}) {
  return createDetailBlockModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory: sequentialUuidFactory(),
    ...overrides,
  });
}

test("row_kind / unit / status catalogs match the App2 field catalog (§2, U16)", () => {
  assert.deepEqual(DETAIL_ROW_KINDS, [
    "block_header",
    "detail",
    "overhead",
    "insurance",
    "subtotal",
    "legal_welfare",
    "block_total",
  ]);
  assert.deepEqual(DETAIL_UNITS, [
    "㎡",
    "式",
    "回",
    "人",
    "日",
    "箇月",
    "－",
    "缶",
    "枚",
    "％",
  ]);
  assert.deepEqual(BLOCK_STATUSES, ["active", "retired"]);
  assert.deepEqual(BLOCK_FOOTER_KINDS, [
    "overhead",
    "insurance",
    "subtotal",
    "legal_welfare",
    "block_total",
  ]);
  assert.deepEqual(MANUAL_FOOTER_KINDS, ["overhead", "insurance", "legal_welfare"]);
  assert.equal(BLOCK_FOOTER_LABELS.block_total, "計");
});

test("new block carries the U20 full footer and keys from keys.mjs", () => {
  const model = editableModel();
  const blockId = model.addBlock();
  assert.match(blockId, /^blk-uuid-\d+$/);

  const [block] = model.snapshot().blocks;
  assert.equal(block.stableBlockId, blockId);
  assert.equal(block.status, "active");
  assert.equal(block.blockNo, 1);
  assert.match(block.headerRowKey, /^row-uuid-\d+$/);
  // U8: exactly one empty detail row initially.
  assert.equal(block.detailRows.length, 1);
  assert.match(block.detailRows[0].rowKey, /^row-uuid-\d+$/);
  assert.equal(block.detailRows[0].amount, null);

  // U20 order via App2 rows: header → detail → overhead → insurance →
  // subtotal → legal_welfare → block_total.
  const rows = model.toApp2Rows();
  assert.deepEqual(
    rows.map((row) => row.row_kind),
    [
      "block_header",
      "detail",
      "overhead",
      "insurance",
      "subtotal",
      "legal_welfare",
      "block_total",
    ],
  );
  const rowKeys = rows.map((row) => row.row_key);
  assert.equal(new Set(rowKeys).size, rowKeys.length);
  for (const key of rowKeys) assert.match(key, /^row-uuid-\d+$/);
  // Empty block still totals to 0 (blank manual amounts count as 0).
  assert.equal(rows.at(-1).amount, "0");
});

test("detail amounts follow P-22 ROUND: 数量×単価 and ％=単価×数量÷100 (U18/U19)", () => {
  assert.equal(
    detailRowAmount({ quantity: "2.5", unitPrice: "100.1", unit: "式" }),
    "250",
  );
  assert.equal(
    detailRowAmount({ quantity: "3.3", unitPrice: "202409", unit: "％" }),
    "6679",
  );
  // U7/U11: quantity and unit price must both be present.
  assert.equal(detailRowAmount({ quantity: "3", unitPrice: null, unit: "式" }), null);
  assert.equal(detailRowAmount({ quantity: null, unitPrice: "5", unit: "％" }), null);

  const model = editableModel();
  const blockId = model.addBlock();
  const rowKey = model.snapshot().blocks[0].detailRows[0].rowKey;
  model.updateDetailRow(blockId, rowKey, {
    name1: "塗料",
    unit: "缶",
    quantity: "1639.6",
    unitPrice: "123.45",
  });
  // 202408.62 → ROUND → 202409 (unlike 請負 which keeps the decimal, P-36).
  assert.equal(model.snapshot().blocks[0].detailRows[0].amount, "202409");
  const percentKey = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, percentKey, {
    name1: "諸経費相当",
    unit: "％",
    quantity: "5.5",
    unitPrice: "10001",
  });
  // 10001*5.5/100 = 550.055 → 550
  assert.equal(model.snapshot().blocks[0].detailRows[1].amount, "550");
  assert.throws(
    () => model.updateDetailRow(blockId, rowKey, { unit: "ダース" }),
    /unknown unit/,
  );
});

test("U25 totals: 小計=明細+諸経費+保険料, 計=小計+法定福利費; blank footer = 0 but stays blank", () => {
  const model = editableModel();
  const blockId = model.addBlock();
  const rowKey = model.snapshot().blocks[0].detailRows[0].rowKey;
  model.updateDetailRow(blockId, rowKey, {
    name1: "足場",
    unit: "式",
    quantity: "2",
    unitPrice: "1000",
  });

  // All manual footer amounts blank → count as 0, display stays blank.
  let block = model.snapshot().blocks[0];
  assert.equal(block.footer.overhead.amount, null);
  assert.equal(block.footer.insurance.amount, null);
  assert.equal(block.footer.legal_welfare.amount, null);
  assert.equal(block.footer.subtotal.amount, "2000");
  assert.equal(block.footer.block_total.amount, "2000");

  model.updateFooterAmount(blockId, "overhead", "300");
  model.updateFooterAmount(blockId, "insurance", "50");
  model.updateFooterAmount(blockId, "legal_welfare", "111");
  block = model.snapshot().blocks[0];
  assert.equal(block.footer.subtotal.amount, "2350");
  assert.equal(block.footer.block_total.amount, "2461");

  // Blanking a manual amount reverts to 0-in-totals / blank-on-screen.
  model.updateFooterAmount(blockId, "legal_welfare", "");
  block = model.snapshot().blocks[0];
  assert.equal(block.footer.legal_welfare.amount, null);
  assert.equal(block.footer.block_total.amount, "2350");

  // 小計・計 are system totals, never manually editable (U25).
  assert.throws(
    () => model.updateFooterAmount(blockId, "subtotal", "1"),
    /not manually editable/,
  );
  assert.throws(
    () => model.updateFooterAmount(blockId, "block_total", "1"),
    /not manually editable/,
  );
});

test("retire vs delete (P-39) and block reorder renumber 内訳№ (U14)", () => {
  const model = editableModel({
    blocks: [
      { costCategory: "施工", workTypeName: "工種A" },
      { costCategory: "保安", workTypeName: "工種B", hasActuals: true },
      { costCategory: "施工", workTypeName: "工種C" },
    ],
  });
  const [a, b, c] = model.snapshot().blocks.map((block) => block.stableBlockId);
  assert.deepEqual(
    model.snapshot().blocks.map((block) => block.blockNo),
    [1, 2, 3],
  );

  // Reorder renumbers by display order.
  model.moveBlock(c, -1);
  assert.deepEqual(
    model.snapshot().blocks.map((block) => [block.stableBlockId, block.blockNo]),
    [
      [a, 1],
      [c, 2],
      [b, 3],
    ],
  );

  // A block with actuals must be retired, never physically deleted.
  assert.throws(() => model.removeBlock(b), /retireBlock \(P-39\)/);
  model.retireBlock(b);
  let blocks = model.snapshot().blocks;
  assert.equal(blocks.find((block) => block.stableBlockId === b).status, "retired");
  assert.equal(blocks.find((block) => block.stableBlockId === b).blockNo, null);

  // A block without actuals is physically removable; № closes the gap.
  model.removeBlock(a);
  blocks = model.snapshot().blocks;
  assert.deepEqual(
    blocks.map((block) => [block.stableBlockId, block.blockNo]),
    [
      [c, 1],
      [b, null],
    ],
  );
});

test("each block keeps at least 1 detail row after deletes (U12)", () => {
  const model = editableModel();
  const blockId = model.addBlock();
  const first = model.snapshot().blocks[0].detailRows[0].rowKey;
  assert.throws(() => model.removeDetailRow(blockId, first), /at least 1 detail row/);
  const second = model.addDetailRow(blockId);
  model.removeDetailRow(blockId, second);
  assert.equal(model.snapshot().blocks[0].detailRows.length, 1);
  // Detail reorder stays inside the detail band (footer is fixed = U23).
  const third = model.addDetailRow(blockId);
  model.moveDetailRow(blockId, third, -1);
  assert.deepEqual(
    model.snapshot().blocks[0].detailRows.map((row) => row.rowKey),
    [third, first],
  );
  model.moveDetailRow(blockId, third, -1); // already first → no-op
  assert.equal(model.snapshot().blocks[0].detailRows[0].rowKey, third);
});

test("name_spec_group inherits from the closest 1st-column value above (U13/U24)", () => {
  const model = editableModel();
  const blockId = model.addBlock();
  const first = model.snapshot().blocks[0].detailRows[0].rowKey;
  model.updateDetailRow(blockId, first, { name1: "現場経費" });
  const second = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, second, { name2: "宿泊費" });
  assert.deepEqual(
    model.snapshot().blocks[0].detailRows.map((row) => row.nameSpecGroup),
    ["現場経費", "現場経費"],
  );
  // Reorder re-scans the inheritance (U24): the blank-1st row moves on top.
  model.moveDetailRow(blockId, second, -1);
  assert.deepEqual(
    model.snapshot().blocks[0].detailRows.map((row) => row.nameSpecGroup),
    [null, "現場経費"],
  );
});

test("editBudget=false freezes every 内訳 mutation while display stays readable", () => {
  for (const lockState of [LOCK_STATES.BUDGET_LOCKED, LOCK_STATES.FULL_LOCKED]) {
    const model = createDetailBlockModel({
      lockState,
      uuidFactory: sequentialUuidFactory(),
      blocks: [
        {
          costCategory: "施工",
          detailRows: [{ name1: "足場", unit: "式", quantity: "2", unitPrice: "1000" }],
        },
      ],
    });
    const blockId = model.snapshot().blocks[0].stableBlockId;
    const rowKey = model.snapshot().blocks[0].detailRows[0].rowKey;
    const locked = /budget is locked/;
    assert.throws(() => model.addBlock(), locked);
    assert.throws(() => model.removeBlock(blockId), locked);
    assert.throws(() => model.retireBlock(blockId), locked);
    assert.throws(() => model.moveBlock(blockId, 1), locked);
    assert.throws(() => model.updateBlockHeader(blockId, { vendorName: "x" }), locked);
    assert.throws(() => model.addDetailRow(blockId), locked);
    assert.throws(() => model.updateDetailRow(blockId, rowKey, { quantity: "9" }), locked);
    assert.throws(() => model.removeDetailRow(blockId, rowKey), locked);
    assert.throws(() => model.moveDetailRow(blockId, rowKey, 1), locked);
    assert.throws(() => model.updateFooterAmount(blockId, "overhead", "1"), locked);
    assert.equal(model.snapshot().blocks[0].footer.block_total.amount, "2000");
  }
});

test("projection feeds summary from active blocks only; header patches are guarded", () => {
  const model = editableModel({
    blocks: [
      {
        costCategory: "施工",
        workTypeCode: "K-1",
        workTypeName: "けた橋",
        detailRows: [{ name1: "塗装", unit: "㎡", quantity: "10", unitPrice: "80" }],
      },
      {
        costCategory: "保安",
        detailRows: [{ name1: "見張員", unit: "人", quantity: "2", unitPrice: "100" }],
      },
      {
        costCategory: "施工",
        status: "retired",
        hasActuals: true,
        detailRows: [{ name1: "旧工種", unit: "式", quantity: "1", unitPrice: "99999" }],
      },
      // 区分未入力: held back from projection, reported as a U29 warning.
      { workTypeName: "区分待ち" },
    ],
  });

  const projected = model.projectionBlocks();
  assert.deepEqual(
    projected.map((block) => [block.status, block.costCategory, block.total]),
    [
      ["active", "施工", "800"],
      ["active", "保安", "200"],
      ["retired", "施工", "99999"],
    ],
  );
  // Q8/M3: single-unit blocks pass 単位/数量/単価 through to the summary.
  assert.equal(projected[0].mixedUnits, false);
  assert.equal(projected[0].unit, "㎡");
  assert.equal(projected[0].quantity, "10");
  assert.equal(projected[0].unitPrice, "80");
  // Retired block carries no №, so the 4th block displays as No.3 (U14/P-39).
  assert.deepEqual(model.categoryWarnings(), ["No.3の区分が未入力です"]);

  const rows = regenerateSummaryCostLines(projected, { contractTotal1: "2000" });
  assert.equal(rows.length, 2); // retired excluded (P-39)
  assert.deepEqual(
    rows.map((row) => [row.summary_block_no, row.summary_amount_excl_tax]),
    [
      [1, "800"],
      [2, "200"],
    ],
  );
  assert.equal(rows[0].summary_unit, "㎡");
  assert.equal(rows[0].summary_qty, "10");
  assert.equal(rows[0].summary_unit_price, "80");
  assert.equal(rows[0].summary_work_type_code, "K-1");

  // ⑧⑨ combine active 内訳 totals with the summary model (U25 → P-33).
  const summaryModel = createContractSalaryModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory: sequentialUuidFactory(),
    contractLines: [
      { section: "施工", workName: "足場工", quantity: "2", unitPrice: "1000" },
    ],
  });
  const totals = summaryModel.totals(projected);
  assert.equal(totals.costConstruction, "800");
  assert.equal(totals.costSafety, "200");
  assert.equal(totals.total8, "1000");
  assert.equal(totals.profit9, "1000");

  assert.throws(
    () => model.updateBlockHeader(projected[0].stableBlockId, { costCategory: "給与" }),
    /施工 or 保安/,
  );
  assert.throws(
    () => model.updateBlockHeader(projected[0].stableBlockId, { blockNo: 9 }),
    /not editable/,
  );
});

test("Q8/M3: uniform-unit blocks pass through; any drift falls back to 式×1×計", () => {
  const projectedOf = (blocks) =>
    editableModel({
      blocks: blocks.map((block) => ({ costCategory: "施工", ...block })),
    }).projectionBlocks();

  // Multi-row, same unit + same unit price → qty sums, 金額整合 holds:
  // 250 + 150 = 400 = ROUND((2.5+1.5)×100).
  const [summed] = projectedOf([
    {
      detailRows: [
        { name1: "塗装A", unit: "㎡", quantity: "2.5", unitPrice: "100" },
        { name1: "塗装B", unit: "㎡", quantity: "1.5", unitPrice: "100" },
      ],
    },
  ]);
  assert.equal(summed.mixedUnits, false);
  assert.deepEqual(
    [summed.unit, summed.quantity, summed.unitPrice, summed.total],
    ["㎡", "4", "100", "400"],
  );
  const [line] = regenerateSummaryCostLines([summed]);
  assert.equal(line.summary_unit, "㎡");
  assert.equal(line.summary_qty, "4");
  assert.equal(line.summary_unit_price, "100");
  assert.equal(line.summary_amount_excl_tax, "400");

  // ％ rows keep the U19 formula through the passthrough consistency check.
  const [percent] = projectedOf([
    {
      detailRows: [
        { name1: "諸経費相当", unit: "％", quantity: "5.5", unitPrice: "10001" },
      ],
    },
  ]);
  assert.equal(percent.mixedUnits, false);
  assert.equal(percent.quantity, "5.5");
  assert.equal(percent.total, "550");

  // Every drift case falls back to Q8 mixed = 式 × 1 × 計.
  const mixedCases = {
    "different units": {
      detailRows: [
        { name1: "a", unit: "㎡", quantity: "1", unitPrice: "100" },
        { name1: "b", unit: "式", quantity: "1", unitPrice: "100" },
      ],
    },
    "same unit, different unit prices": {
      detailRows: [
        { name1: "a", unit: "㎡", quantity: "1", unitPrice: "100" },
        { name1: "b", unit: "㎡", quantity: "1", unitPrice: "200" },
      ],
    },
    "missing quantity": {
      detailRows: [{ name1: "a", unit: "㎡", unitPrice: "100" }],
    },
    "missing unit": {
      detailRows: [{ name1: "a", quantity: "1", unitPrice: "100" }],
    },
    "manual footer amount joins the total": {
      overhead: "300",
      detailRows: [{ name1: "a", unit: "㎡", quantity: "10", unitPrice: "80" }],
    },
    // Per-row ROUND drift: 30 + 30 = 60 ≠ ROUND(0.6×101) = 61 (金額整合).
    "per-row rounding drift": {
      detailRows: [
        { name1: "a", unit: "㎡", quantity: "0.3", unitPrice: "101" },
        { name1: "b", unit: "㎡", quantity: "0.3", unitPrice: "101" },
      ],
    },
  };
  for (const [label, block] of Object.entries(mixedCases)) {
    const [projected] = projectedOf([block]);
    assert.equal(projected.mixedUnits, true, label);
    assert.equal("unit" in projected, false, label);
    const [row] = regenerateSummaryCostLines([projected]);
    assert.equal(row.summary_unit, "式", label);
    assert.equal(row.summary_qty, "1", label);
    assert.equal(row.summary_unit_price, projected.total, label);
  }
});

test("App 1 detail tab renders jy2-* block editor wired to the summary refresh", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /jy2-detail-block/);
  assert.match(source, /jy2-detail-block-head/);
  assert.match(source, /jy2-detail-table/);
  assert.match(source, /jy2-block-no/);
  assert.match(source, /jy2-footer-row/);
  assert.match(source, /jy2-block-total-row/);
  assert.match(source, /jy2-warning/);
  assert.match(source, /createDetailBlockModel/);
  assert.match(source, /jy2RenderDetailPane/);
  assert.match(source, /refreshSummary\(\)/);
  assert.match(source, /工種ブロック追加/);
  assert.match(source, /明細行追加/);
  // Detail mutations refresh the summary projection + ①⑧⑨ pane.
  assert.match(source, /detailModel\.projectionBlocks\(\)/);
  assert.doesNotMatch(source, /className\s*=\s*["']jy-/);
});

test("C12 header pane wraps content in h-scroll with min-width inner", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /function jy2RenderHeaderPane\b/);
  assert.match(source, /jy2-hscroll-inner jy2-header-inner/);
  assert.match(source, /return jy2WrapHScroll\(documentRef, inner\)/);
  assert.match(source, /function jy2WrapHScroll\b/);
  assert.match(source, /\.jy2-header-inner \.jy2-header-grid\{[^}]*min-width:920px/);
});

test("C5 detail table uses max-content inside jy2-table-scroll (narrow window h-scroll)", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(
    source,
    /\.jy2-table-scroll>\.jy2-detail-table\{[^}]*width:max-content/,
  );
  assert.match(
    source,
    /\.jy2-table-scroll>\.jy2-detail-table\{[^}]*min-width:1100px/,
  );
  assert.doesNotMatch(
    source,
    /\.jy2-table-scroll>\.jy2-detail-table\{width:100%/,
  );
  assert.match(source, /function jy2WrapTable\b/);
  assert.match(source, /function jy2SyncHScroll\b/);
  assert.match(source, /function jy2ViewportHScrollCeiling\b/);
  assert.match(source, /function jy2ForceTableMinWidth\b/);
  assert.match(source, /const forceMin = isActual \? 1600 : 1100/);
});

test("U4 name1/name2 are combo (select+input); name3 is free text input", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /function jy2ComboInput\b/);
  assert.match(source, /jy2-input jy2-combo/);
  assert.match(source, /jy2-combo-select/);
  assert.match(source, /jy2AppendModeLabel/);
  assert.match(source, /jy2-hf-tag-select/);
  assert.match(source, /分類（選択）/);
  assert.match(source, /品目（選択）/);
  assert.match(source, /補助項目（入力）/);
  assert.match(
    source,
    /const anchor = jy2HasText\(row\.name1\) \|\| jy2HasText\(row\.name2\);/,
  );
  assert.doesNotMatch(
    source,
    /jy2MarkIncompleteIfAnchor\(name3, anchor, row\.name3\)/,
  );
  assert.match(source, /jy2CollectDetailSuggestions/);
  assert.match(source, /JY2_NAME1_SEEDS/);
  assert.match(source, /JY2_NAME_PROFILES/);
  assert.match(source, /jy2ResolveNameProfile/);
  assert.match(
    source,
    /jy2ComboInput\(documentRef, row\.name1, suggest\.name1/,
  );
  assert.match(
    source,
    /jy2ComboInput\(documentRef, row\.name2, suggest\.name2/,
  );
  assert.match(source, /jy2TextInput\(documentRef, row\.name3/);
  assert.match(source, /jy2ToFullWidthKana\(value\)/);
  assert.match(
    source,
    /jy2ComboInput\(\s*documentRef,\s*block\.vendorName,\s*suggest\.vendors/,
  );
});

test("U28 prepareForSave prunes empty detail rows and blank blocks", () => {
  const model = editableModel({
    blocks: [
      {
        stableBlockId: "blk-empty",
        detailRows: [{ name1: null }, { name1: null }, { name1: null }],
      },
      {
        stableBlockId: "blk-content",
        workTypeName: "足場",
        detailRows: [
          { name1: "材料", unit: "式", quantity: "1", unitPrice: "100" },
          { name1: null },
          { name1: null },
        ],
      },
      {
        stableBlockId: "blk-prune",
        detailRows: [{ name1: null }],
      },
    ],
  });
  model.prepareForSave();
  const ids = model.snapshot().blocks.map((block) => block.stableBlockId);
  assert.deepEqual(ids, ["blk-content"]);
  assert.equal(model.snapshot().blocks[0].detailRows.length, 2);
  assert.equal(model.toApp2Rows().filter((row) => row.row_kind === "detail").length, 2);
});

test("phase 4c sources never target customize/736 / App 735/736 / kintone REST", () => {
  {
    const source = read("scripts/lib/jikkou-yosan-v2/detail-block-model.mjs");
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
    read("scripts/lib/jikkou-yosan-v2/detail-block-model.mjs"),
    /kintone\.mjs/,
  );
});

test("rebuild bundles detail-block-model before the UI, 736 untouched", () => {
  const state = JSON.parse(read("scripts/data/jikkou-yosan-v2-app-ids.json"));
  for (const key of ["app1", "app2", "app3"]) {
    const appId = state.apps[key].appId;
    assert.ok(appId === null || (Number.isSafeInteger(appId) && appId > 0), key);
    assert.ok(appId !== 735 && appId !== 736, `${key}: appId must never be 735/736`);
  }
  const before736 = protected736Digest();
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "jy2-phase4c-"));
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
      "createDetailBlockModel",
      "DETAIL_UNITS",
      "DETAIL_ROW_KINDS",
      "jy2RenderDetailPane",
      "jy2DetailBlock",
    ]) {
      assert.match(bundle, new RegExp(symbol));
    }
    assert.doesNotMatch(bundle, /kintone\.mjs/);
    assert.doesNotMatch(bundle, /APP[123]_ID\s*=\s*(?:735|736)\b/);
    // Module lands before the UI shell source (build order).
    assert.ok(
      bundle.indexOf("function createDetailBlockModel") <
        bundle.indexOf("function jy2RenderShell"),
    );
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
  assert.equal(protected736Digest(), before736);
});
