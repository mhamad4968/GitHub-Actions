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
  normalizeContinuedFieldsToDitto,
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
  // R-11: 諸経費(overhead)は自動計算(読取専用)になったので手入力から除外。
  assert.deepEqual(MANUAL_FOOTER_KINDS, ["insurance"]);
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

test("U25/R-11/R-12 totals: 諸経費=明細×10%(自動), 法定福利費=労務費明細合計(自動), 小計=明細+諸経費+保険料, 計=小計+法定福利費", () => {
  const model = editableModel();
  const blockId = model.addBlock();
  const rowKey = model.snapshot().blocks[0].detailRows[0].rowKey;
  model.updateDetailRow(blockId, rowKey, {
    name1: "足場",
    unit: "式",
    quantity: "2",
    unitPrice: "1000",
  });

  // R-11: 諸経費は自動 = ROUND(明細合計2000 × 10%, 0) = 200。案B: base/rate も公開。
  let block = model.snapshot().blocks[0];
  assert.equal(block.footer.overhead.amount, "200");
  assert.equal(block.footer.overhead.base, "2000");
  assert.equal(block.footer.overhead.rate, "0.1");
  assert.equal(block.footer.overhead.ratePercent, "10");
  // 手入力の保険料が空・労務費明細が無ければ法定福利費は空欄。
  assert.equal(block.footer.insurance.amount, null);
  assert.equal(block.footer.legal_welfare.amount, null);
  assert.equal(block.footer.subtotal.amount, "2200"); // 2000 + 200
  assert.equal(block.footer.block_total.amount, "2200");

  model.updateFooterAmount(blockId, "insurance", "50");
  block = model.snapshot().blocks[0];
  assert.equal(block.footer.subtotal.amount, "2250"); // 2000 + 200 + 50
  assert.equal(block.footer.block_total.amount, "2250");

  // R-12: 費目「労務費」の明細金額合計が法定福利費（外注労務費は除外）。
  const laborKey = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, laborKey, {
    name1: "労務費",
    name2: "労務費（昼間）",
    unit: "式",
    quantity: "1",
    unitPrice: "111",
  });
  const outsourceKey = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, outsourceKey, {
    name1: "外注労務費",
    unit: "式",
    quantity: "1",
    unitPrice: "999",
  });
  block = model.snapshot().blocks[0];
  assert.equal(block.footer.legal_welfare.amount, "111");
  // 明細 2000+111+999=3110, 諸経費=311, 保険=50 → 小計=3471, 計=3471+111=3582
  assert.equal(block.footer.overhead.amount, "311");
  assert.equal(block.footer.subtotal.amount, "3471");
  assert.equal(block.footer.block_total.amount, "3582");

  // R-11/R-12: 諸経費・法定福利費は自動なので手入力不可。小計・計もシステム集計(U25)。
  assert.throws(
    () => model.updateFooterAmount(blockId, "overhead", "1"),
    /not manually editable/,
  );
  assert.throws(
    () => model.updateFooterAmount(blockId, "legal_welfare", "1"),
    /not manually editable/,
  );
  assert.throws(
    () => model.updateFooterAmount(blockId, "subtotal", "1"),
    /not manually editable/,
  );
  assert.throws(
    () => model.updateFooterAmount(blockId, "block_total", "1"),
    /not manually editable/,
  );
});

test("R-11: 諸経費は明細金額が無いブロックでは空欄(0でなくblank)", () => {
  const model = editableModel();
  const blockId = model.addBlock();
  // 明細未入力のブロック → 諸経費は空欄、計は 0。
  let block = model.snapshot().blocks[0];
  assert.equal(block.footer.overhead.amount, null);
  assert.equal(block.footer.overhead.base, null);
  assert.equal(block.footer.block_total.amount, "0");

  // 明細合計が小さく 10% が四捨五入で 0 になる場合も blank ではなく "0"。
  const rowKey = block.detailRows[0].rowKey;
  model.updateDetailRow(blockId, rowKey, {
    name1: "端数", unit: "式", quantity: "1", unitPrice: "2",
  });
  block = model.snapshot().blocks[0];
  assert.equal(block.footer.overhead.base, "2");
  assert.equal(block.footer.overhead.amount, "0"); // ROUND(0.2) = 0
  assert.equal(block.footer.block_total.amount, "2");
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

test("moveBlockAfter places a block immediately after the anchor", () => {
  const model = editableModel({
    blocks: [
      { costCategory: "施工", workTypeName: "アンカー" },
      { costCategory: "施工", workTypeName: "末尾A" },
      { costCategory: "施工", workTypeName: "末尾B" },
    ],
  });
  const [anchor, a, b] = model.snapshot().blocks.map((block) => block.stableBlockId);
  model.moveBlockAfter(b, anchor);
  model.moveBlockAfter(a, b);
  assert.deepEqual(
    model.snapshot().blocks.map((block) => block.stableBlockId),
    [anchor, b, a],
  );
  model.moveBlockAfter(a, b); // already after b → no-op
  assert.deepEqual(
    model.snapshot().blocks.map((block) => block.stableBlockId),
    [anchor, b, a],
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

test("U27: prepareForSave normalizes continued name1/2/3 to 〃; legal welfare resolves 〃", () => {
  const model = editableModel();
  const blockId = model.addBlock();
  const r0 = model.snapshot().blocks[0].detailRows[0].rowKey;
  model.updateDetailRow(blockId, r0, {
    name1: "労務費",
    name2: "出向工事管理者賃金（昼）",
    name3: "A",
    unit: "式",
    quantity: "1",
    unitPrice: "100",
  });
  const r1 = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, r1, {
    name1: "労務費",
    name2: "出向工事管理者賃金（昼）",
    name3: "A",
    unit: "式",
    quantity: "1",
    unitPrice: "50",
  });
  const r2 = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, r2, {
    name1: "",
    name2: "",
    name3: "B",
    unit: "式",
    quantity: "1",
    unitPrice: "25",
  });

  // Before save: empty continuation already resolves to 労務費 for legal welfare.
  assert.equal(model.snapshot().blocks[0].footer.legal_welfare.amount, "175");

  model.prepareForSave();
  const rows = model.snapshot().blocks[0].detailRows;
  assert.equal(rows[0].name1, "労務費");
  assert.equal(rows[0].name2, "出向工事管理者賃金（昼）");
  assert.equal(rows[0].name3, "A");
  assert.equal(rows[1].name1, "〃");
  assert.equal(rows[1].name2, "〃");
  assert.equal(rows[1].name3, "〃");
  assert.equal(rows[2].name1, "〃");
  assert.equal(rows[2].name2, "〃");
  // name3 が異なれば〃にしない
  assert.equal(rows[2].name3, "B");
  assert.equal(model.snapshot().blocks[0].footer.legal_welfare.amount, "175");
  assert.deepEqual(
    rows.map((row) => row.nameSpecGroup),
    ["労務費", "労務費", "労務費"],
  );
});

test("U27b: skipEmptyName2Ditto leaves empty name2 on TYPELESS-like rows", () => {
  const rows = [
    { name1: "建退共証紙購入費", name2: "建退共証紙購入費", name3: "A" },
    { name1: "〃", name2: "", name3: "B" },
  ];
  normalizeContinuedFieldsToDitto(rows, undefined, {
    skipEmptyName2Ditto: (row) =>
      String(row.name1 || "").includes("建退共") ||
      String(row.name1 || "").trim() === "〃",
  });
  assert.equal(rows[0].name2, "建退共証紙購入費");
  assert.equal(rows[1].name1, "〃");
  assert.equal(rows[1].name2, "");
});

test("U27c: prepareForSave skipEmptyName2Ditto keeps empty name2 in model", () => {
  const model = editableModel();
  const blockId = model.addBlock();
  model.updateBlockHeader(blockId, {
    workTypeCode: "12700",
    workTypeName: "（塗）建退共証紙購入費",
  });
  const r0 = model.snapshot().blocks[0].detailRows[0].rowKey;
  model.updateDetailRow(blockId, r0, {
    name1: "建退共証紙購入費",
    name2: "建退共証紙購入費",
    name3: "明細A",
    unit: "式",
    quantity: "1",
    unitPrice: "100",
  });
  const r1 = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, r1, {
    name1: "建退共証紙購入費",
    name2: "",
    name3: "明細B",
    unit: "式",
    quantity: "1",
    unitPrice: "50",
  });
  model.prepareForSave({
    skipEmptyName2Ditto: () => true,
  });
  const rows = model.snapshot().blocks[0].detailRows;
  assert.equal(rows[1].name2, null);
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
    assert.throws(() => model.updateFooterAmount(blockId, "insurance", "1"), locked);
    // 足場 2×1000=2000 + 諸経費(自動 10%)200 = 2200。
    assert.equal(model.snapshot().blocks[0].footer.block_total.amount, "2200");
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
      ["active", "施工", "880"], // 800 + 諸経費80 (R-11)
      ["active", "保安", "220"], // 200 + 諸経費20
      ["retired", "施工", "109999"], // 99999 + 諸経費10000
    ],
  );
  // R-11/Q8: 諸経費が計に乗るため 数量×単価 ≠ 計。全ブロックが 式×1×計 に投影される
  // (金額整合ルール = 表示 数量×単価 が 計 を再現できないときは 式×1×計 に落ちる)。
  assert.equal(projected[0].mixedUnits, true);
  assert.equal("unit" in projected[0], false);
  // Retired block carries no №, so the 4th block displays as No.3 (U14/P-39).
  assert.deepEqual(model.categoryWarnings(), ["No.3の区分が未入力です"]);

  const rows = regenerateSummaryCostLines(projected, { contractTotal1: "2000" });
  assert.equal(rows.length, 2); // retired excluded (P-39)
  assert.deepEqual(
    rows.map((row) => [row.summary_block_no, row.summary_amount_excl_tax]),
    [
      [1, "880"],
      [2, "220"],
    ],
  );
  assert.equal(rows[0].summary_unit, "式");
  assert.equal(rows[0].summary_qty, "1");
  assert.equal(rows[0].summary_unit_price, "880");
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
  assert.equal(totals.costConstruction, "880"); // 諸経費込み (R-11)
  assert.equal(totals.costSafety, "220");
  assert.equal(totals.total8, "1100"); // 880 + 220
  assert.equal(totals.profit9, "900"); // total1 2000 - total8 1100

  assert.throws(
    () => model.updateBlockHeader(projected[0].stableBlockId, { costCategory: "給与" }),
    /施工 or 保安/,
  );
  assert.throws(
    () => model.updateBlockHeader(projected[0].stableBlockId, { blockNo: 9 }),
    /not editable/,
  );
});

test("R-11/Q8/M3: 諸経費が計に乗るため実データは式×1×計; 諸経費0の微小額のみ数量×単価パススルー", () => {
  const projectedOf = (blocks) =>
    editableModel({
      blocks: blocks.map((block) => ({ costCategory: "施工", ...block })),
    }).projectionBlocks();

  // R-11 supersedes Q8 for real data: 単位・単価が揃うブロックでも、諸経費
  // (明細×10%)が計に乗るため 数量×単価 ≠ 計 となり、金額整合ルールで
  // 式×1×計 に落ちる。明細 250 + 150 = 400、諸経費 40 → 計 440。
  const [summed] = projectedOf([
    {
      detailRows: [
        { name1: "塗装A", unit: "㎡", quantity: "2.5", unitPrice: "100" },
        { name1: "塗装B", unit: "㎡", quantity: "1.5", unitPrice: "100" },
      ],
    },
  ]);
  assert.equal(summed.mixedUnits, true);
  assert.equal("unit" in summed, false);
  assert.equal(summed.total, "440");
  const [line] = regenerateSummaryCostLines([summed]);
  assert.equal(line.summary_unit, "式");
  assert.equal(line.summary_qty, "1");
  assert.equal(line.summary_unit_price, "440");
  assert.equal(line.summary_amount_excl_tax, "440");

  // ％行のブロックも同様に諸経費が乗る: 明細 550、諸経費 55 → 計 605 → 式×1×計。
  const [percent] = projectedOf([
    {
      detailRows: [
        { name1: "諸経費相当", unit: "％", quantity: "5.5", unitPrice: "10001" },
      ],
    },
  ]);
  assert.equal(percent.mixedUnits, true);
  assert.equal(percent.total, "605");

  // 金額整合パススルー(Q8)が残る唯一のケース: 諸経費が四捨五入で 0 になる微小額。
  // 明細 1×2 = 2、諸経費 ROUND(0.2)=0 → 計 2 = 数量×単価 なので 単位×数量×単価 表示。
  const [tiny] = projectedOf([
    { detailRows: [{ name1: "端数", unit: "式", quantity: "1", unitPrice: "2" }] },
  ]);
  assert.equal(tiny.mixedUnits, false);
  assert.deepEqual(
    [tiny.unit, tiny.quantity, tiny.unitPrice, tiny.total],
    ["式", "1", "2", "2"],
  );

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
      insurance: "300",
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
  // R-11(案B): 諸経費行に根拠(明細金額合計 ×率%)＋単価注意書きを行内表示。
  assert.match(source, /jy2-footer-basis/);
  assert.match(
    source,
    /明細金額合計 ×\$\{footerRow\.ratePercent\}%（単価は明細金額の合計）/,
  );
  assert.match(source, /諸経費の単価は明細金額の合計です/);
  assert.match(source, /jy2-warning/);
  assert.match(source, /createDetailBlockModel/);
  assert.match(source, /jy2RenderDetailPane/);
  // 内訳セル編集は総括を dirty 遅延（タブ表示/保存時に refreshSummary(true)）。
  assert.match(source, /refreshSummary\(false\)/);
  assert.match(source, /refreshSummary\(true\)/);
  assert.match(source, /onlyBlockId/);
  assert.match(source, /工種ブロック追加/);
  assert.match(source, /明細行追加/);
  // Detail mutations feed the summary projection + ①⑧⑨ pane (deferred).
  assert.match(source, /detailModel\.projectionBlocks\(\)/);
  assert.doesNotMatch(source, /className\s*=\s*["']jy-/);
});

test("C12 header pane is fluid full-width; span-2 is full row", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /function jy2RenderHeaderPane\b/);
  assert.match(source, /wrap\.className = "jy2-header-pane"/);
  assert.doesNotMatch(source, /jy2-header-inner/);
  assert.doesNotMatch(
    source,
    /jy2RenderHeaderPane[\s\S]*?return jy2WrapHScroll/,
  );
  assert.match(
    source,
    /\.jy2-header-grid \.jy2-span-2\{grid-column:1\/-1\}/,
  );
});

test("C13/C14 person names are hand input; temp-save and confirm buttons", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  const fields = JSON.parse(read("scripts/data/jikkou-yosan-v2-app1-fields.json"));
  assert.equal(fields.properties.created_by_name?.type, "SINGLE_LINE_TEXT");
  assert.equal(fields.properties.person_in_charge_name?.type, "SINGLE_LINE_TEXT");
  assert.match(source, /function jy2EnsurePersonNameFields\b/);
  assert.match(source, /addText\("input", "作成者", "created_by_name"/);
  assert.match(source, /addText\("input", "担当者", "person_in_charge_name"/);
  assert.doesNotMatch(source, /addText\("auto", "作成者", "Created_by"\)/);
  assert.doesNotMatch(source, /addText\("auto", "担当者", "person_in_charge"\)/);
  assert.match(source, /一時保存/);
  assert.match(source, /版を確定/);
  assert.match(source, /jy2-confirm-button/);
  assert.match(source, /confirmingVersion: true/);
});

test("C15 project days display appends 日 while saving numeric value", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /function jy2FormatProjectDaysDisplay\b/);
  assert.match(source, /function jy2NormalizeProjectDaysValue\b/);
  assert.match(source, /daysInput\.value = jy2FormatProjectDaysDisplay\(days\)/);
  assert.match(source, /jy2ApplyHeaderField\(record, "project_days", days\)/);
});

test("U35 start>end: draft save allowed with red warn; version confirm blocked", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /function jy2IsStartDateAfterEndDate\b/);
  assert.match(
    source,
    /着手日が竣工日より後になっています（一時保存は可・版の確定は不可）/,
  );
  assert.match(
    source,
    /着手日が竣工日より後のため、版を確定できません/,
  );
  assert.match(source, /confirmingVersion && dateOrderInverted/);
  assert.doesNotMatch(
    source,
    /着手日が竣工日より後になっています。このまま保存しますか？/,
  );
});

test("C5 fixed bottom h-rail and viewport-only wrap width", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /function jy2MountPaneHScroll\b/);
  assert.match(source, /function jy2MeasureNaturalTableWidth\b/);
  assert.match(source, /function jy2SyncFixedHRail\b/);
  assert.match(source, /jy2-fixed-hrail/);
  assert.match(source, /contain:inline-size/);
  assert.match(
    source,
    /return jy2ViewportHScrollCeiling\(doc, win, host\)/,
  );
  assert.match(source, /const forceMin = isActual \? 1600 : 1400/);
});

test("U32 内訳№ jumps between summary projection and detail block", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /function jy2GotoDetailBlock\b/);
  assert.match(source, /function jy2GotoSummaryProjection\b/);
  assert.match(source, /function jy2FlashNavTarget\b/);
  assert.match(source, /jy2-nav-block-no/);
  assert.match(source, /shell\._jy2ActivateTab = activate/);
  assert.match(source, /内訳タブの該当ブロックへ移動/);
  assert.match(source, /総括タブの該当内訳№へ移動/);
  // 工種ブロック追加後は新規ブロックへスクロール（旧位置復元を抑止）。
  assert.match(source, /focusBlockId/);
  assert.match(source, /const id = detailModel\.addBlock\(\)/);
  assert.match(source, /rerender\(\{\s*focusBlockId:\s*id,\s*full:\s*true\s*\}\)/);
});

test("U4 name1/name2 are combo (select+input); name3 is free text input", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /function jy2ComboInput\b/);
  assert.match(source, /jy2-input jy2-combo/);
  assert.match(source, /jy2-combo-select/);
  assert.match(source, /jy2AppendModeLabel/);
  assert.match(source, /jy2-hf-tag-select/);
  assert.match(source, /費目（選択）/);
  assert.match(source, /種別（補助）（選択）/);
  assert.match(source, /定義及び品名（入力）/);
  assert.match(
    source,
    /const anchor =\s*[\s\S]*?jy2HasText\(row\.name1\)[\s\S]*?jy2HasText\(row\.name2\)/,
  );
  assert.doesNotMatch(
    source,
    /jy2MarkIncompleteIfAnchor\(name3, anchor, row\.name3\)/,
  );
  assert.match(source, /jy2CollectDetailSuggestions/);
  assert.match(source, /JY2_NAME_HIERARCHY/);
  assert.match(source, /jy2ResolveNameHierarchy/);
  assert.match(source, /jy2ApplyHimokuDefaultToDetails/);
  assert.match(source, /jy2HimokuChoicesForEntry/);
  assert.match(source, /jy2TypesForHimoku/);
  assert.match(source, /constructionHimokuMenu/);
  assert.match(source, /予備費/);
  // 費目変更で紐づかない種別をクリアするカスケード。
  assert.match(source, /patch\.name2 = null/);
  // 種別候補が1件だけの費目は自動選択。
  assert.match(source, /jy2SoleTypeForHimoku/);
  assert.match(source, /jy2NormalizeSoleTypeDetails/);
  assert.match(
    source,
    /jy2ComboInput\(\s*documentRef,\s*row\.name1,\s*rowSuggest\.name1/,
  );
  assert.match(
    source,
    /jy2ComboInput\(\s*documentRef,\s*row\.name2,\s*rowSuggest\.name2/,
  );
  assert.match(source, /rowSuggest\.name3/);
  assert.match(source, /jy2ToFullWidthKana\(value\)/);
  assert.match(
    source,
    /jy2ComboInput\(\s*documentRef,\s*block\.vendorName,\s*suggest\.vendors/,
  );
});

test("U36 取引先もリストのみ（候補は打鍵で絞り込み・リスト外は赤字で拒否）", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(
    source,
    /jy2ComboInput\(\s*documentRef,\s*block\.vendorName,\s*suggest\.vendors,\s*commitHeader\("vendorName"\),\s*\{ listOnly: true \}/,
  );
  assert.match(source, /jy2-combo-miss/);
  assert.match(source, /リストにありません/);
});

test("U37 定義及び品名は列幅拡大＋fullTitleホバー全文", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(
    source,
    /\.jy2-detail-table th:nth-child\(3\),\s*\.jy2-detail-table td:nth-child\(3\)\{min-width:16rem\}/,
  );
  assert.match(source, /opts\.fullTitle/);
  assert.match(
    source,
    /jy2ComboInput\(\s*documentRef,\s*row\.name3,\s*rowSuggest\.name3,[\s\S]*?fullTitle:\s*true/,
  );
});

test("U38 タブ別ペイン色面（総括青・内訳緑・原価橙・版紫）", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(
    source,
    /data-tab-id='summary'\]\[data-active='true'\]\{[^}]*background:#e8f4fd/,
  );
  assert.match(
    source,
    /data-tab-id='detail'\]\[data-active='true'\]\{[^}]*background:#e8f5e9/,
  );
  assert.match(
    source,
    /data-tab-id='actual'\]\[data-active='true'\]\{[^}]*background:#fff3e0/,
  );
  assert.match(
    source,
    /data-tab-id='version'\]\[data-active='true'\]\{[^}]*background:#f3e8ff/,
  );
});

test("U39 視覚磨き（focus-visible・備考幅・節見出し連動）", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /:focus-visible/);
  assert.match(
    source,
    /\.jy2-detail-table th:nth-child\(8\),\s*\.jy2-detail-table td:nth-child\(8\)\{min-width:12rem\}/,
  );
  assert.match(
    source,
    /jy2TextInput\(documentRef, row\.note, commit\("note"\), \{\s*fullTitle: true/,
  );
  assert.match(
    source,
    /data-tab-id='detail'\] \.jy2-section-title\{[^}]*border-left-color:#059669/,
  );
});

test("U5 jy2ToFullWidthKana normalizes halfwidth kana with NFKC (not code offset)", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(
    source,
    /function jy2ToFullWidthKana\b[\s\S]*?normalize\(["']NFKC["']\)/,
  );
  assert.doesNotMatch(
    source,
    /function jy2ToFullWidthKana\b[\s\S]*?0xff71\s*\+\s*0x30a2/,
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
