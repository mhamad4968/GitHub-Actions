import assert from "node:assert/strict";
import test from "node:test";

import {
  SUMMARY_FOOTER_LEGAL_WELFARE,
  SUMMARY_FOOTER_OVERHEAD,
  SUMMARY_MIXED_UNIT,
  buildSummaryRowKey,
  regenerateSummaryCostLines,
  summaryPersonColumnVisible,
} from "./projection.mjs";

function splitBlock(overrides = {}) {
  return {
    stableBlockId: "blk-a",
    status: "active",
    costCategory: "施工",
    total: "0",
    workTypeCode: "K-1",
    workTypeName: "塗装工事",
    lines: [],
    ...overrides,
  };
}

test("split: 種別が違えば同じブロックから複数行になり № は同じ", () => {
  const rows = regenerateSummaryCostLines([
    splitBlock({
      total: "1500",
      lines: [
        {
          himoku: "材料費",
          typeName: "塗料",
          unit: "缶",
          quantity: "2",
          amount: "1000",
          materialName: "A塗料",
        },
        {
          himoku: "材料費",
          typeName: "シンナー",
          unit: "缶",
          quantity: "1",
          amount: "500",
          materialName: "B",
        },
      ],
    }),
  ]);
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => row.summary_block_no),
    [1, 1],
  );
  assert.deepEqual(
    rows.map((row) => row.summary_stable_block_id),
    ["blk-a", "blk-a"],
  );
  assert.deepEqual(
    rows.map((row) => row.summary_line_type),
    ["塗料", "シンナー"],
  );
  assert.equal(rows[0].summary_amount_excl_tax, "1000");
  assert.equal(rows[1].summary_amount_excl_tax, "500");
});

test("split: 同じキーは合算し、単位が揃えば数量合計・単価は ROUND(金額÷数量)", () => {
  const rows = regenerateSummaryCostLines([
    splitBlock({
      total: "300",
      lines: [
        {
          himoku: "労務費",
          typeName: "普通作業員",
          lineVendorName: "A社",
          linePersonName: "山田　太郎",
          unit: "人",
          quantity: "1",
          amount: "100",
        },
        {
          himoku: "労務費",
          typeName: "普通作業員",
          lineVendorName: "A社",
          linePersonName: "山田　太郎",
          unit: "人",
          quantity: "2",
          amount: "200",
        },
      ],
    }),
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].summary_qty, "3");
  assert.equal(rows[0].summary_unit, "人");
  assert.equal(rows[0].summary_unit_price, "100");
  assert.equal(rows[0].summary_amount_excl_tax, "300");
  assert.equal(rows[0].summary_vendor_name, "A社");
  assert.equal(rows[0].summary_person_name, "山田　太郎");
});

test("split: 単位混在は 式 × 1 × 金額合計", () => {
  const [row] = regenerateSummaryCostLines([
    splitBlock({
      total: "30",
      lines: [
        {
          himoku: "材料費",
          typeName: "塗料",
          unit: "缶",
          quantity: "1",
          amount: "10",
        },
        {
          himoku: "材料費",
          typeName: "塗料",
          unit: "L",
          quantity: "2",
          amount: "20",
        },
      ],
    }),
  ]);
  assert.equal(row.summary_unit, SUMMARY_MIXED_UNIT);
  assert.equal(row.summary_qty, "1");
  assert.equal(row.summary_unit_price, "30");
  assert.equal(row.summary_amount_excl_tax, "30");
});

test("split: 施工は諸経費フッタを足す。法定福利は明細だけ。費目諸経費の明細は出さない", () => {
  const rows = regenerateSummaryCostLines([
    splitBlock({
      total: "1110",
      overheadAmount: "100",
      legalWelfareAmount: "10",
      lines: [
        {
          himoku: "労務費",
          typeName: "普通作業員",
          amount: "1000",
          unit: "人",
          quantity: "1",
        },
        {
          himoku: "諸経費",
          typeName: "",
          amount: "100",
          unit: "式",
          quantity: "1",
        },
        {
          himoku: "法定福利費",
          typeName: "－",
          amount: "10",
          unit: "式",
          quantity: "1",
        },
      ],
    }),
    splitBlock({
      stableBlockId: "blk-b",
      costCategory: "保安",
      total: "50",
      overheadAmount: "999",
      legalWelfareAmount: "999",
      blockSortOrder: 2,
      lines: [
        {
          himoku: "労務費",
          typeName: "列車見張員",
          amount: "50",
          unit: "人",
          quantity: "1",
        },
      ],
    }),
  ]);
  const construction = rows.filter((row) => row.summary_stable_block_id === "blk-a");
  const security = rows.filter((row) => row.summary_stable_block_id === "blk-b");
  assert.deepEqual(
    construction.map((row) => row.summary_line_type),
    ["普通作業員", SUMMARY_FOOTER_LEGAL_WELFARE, SUMMARY_FOOTER_OVERHEAD],
  );
  assert.equal(construction[1].summary_amount_excl_tax, "10");
  assert.equal(construction[2].summary_amount_excl_tax, "100");
  assert.equal(security.length, 1);
  assert.equal(security[0].summary_line_type, "列車見張員");

  const autoOnly = regenerateSummaryCostLines([
    splitBlock({
      total: "1100",
      overheadAmount: "100",
      legalWelfareAmount: "10",
      lines: [
        {
          himoku: "労務費",
          typeName: "普通作業員",
          amount: "1000",
          unit: "人",
          quantity: "1",
        },
      ],
    }),
  ]);
  assert.deepEqual(
    autoOnly.map((row) => [row.summary_line_type, row.summary_amount_excl_tax]),
    [
      ["普通作業員", "1000"],
      [SUMMARY_FOOTER_OVERHEAD, "100"],
    ],
  );
});

test("split: 給与手当の工種は原価行に出さない", () => {
  const rows = regenerateSummaryCostLines([
    splitBlock({
      workTypeName: "（塗）現場代理人･監理技術者給与手当",
      total: "8000",
      lines: [
        { himoku: "給与手当", typeName: "社員助勢", amount: "8000" },
      ],
    }),
    splitBlock({
      stableBlockId: "blk-keep",
      total: "1",
      blockSortOrder: 2,
      lines: [{ himoku: "材料費", typeName: "塗料", amount: "1", unit: "缶", quantity: "1" }],
    }),
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].summary_stable_block_id, "blk-keep");
  assert.equal(rows[0].summary_block_no, 1);
});

test("split: 備考は summary_row_key 単位。隣の行へ流さない", () => {
  const paintKey = buildSummaryRowKey({
    blockId: "blk-a",
    himoku: "材料費",
    typeName: "塗料",
  });
  const rows = regenerateSummaryCostLines(
    [
      splitBlock({
        total: "3",
        lines: [
          { himoku: "材料費", typeName: "塗料", amount: "1", unit: "缶", quantity: "1" },
          { himoku: "材料費", typeName: "シンナー", amount: "2", unit: "缶", quantity: "1" },
        ],
      }),
    ],
    {
      previousLines: [
        {
          summary_stable_block_id: "blk-a",
          summary_row_key: paintKey,
          summary_note: "塗料メモ",
        },
      ],
    },
  );
  assert.equal(rows[0].summary_note, "塗料メモ");
  assert.equal(rows[1].summary_note, "");
});

test("split: 品名が1つなら材料に出し、複数なら空", () => {
  const [one] = regenerateSummaryCostLines([
    splitBlock({
      total: "1",
      lines: [
        {
          himoku: "材料費",
          typeName: "塗料",
          materialName: "A塗料",
          amount: "1",
          unit: "缶",
          quantity: "1",
        },
      ],
    }),
  ]);
  assert.equal(one.summary_material_name, "A塗料");
  const [many] = regenerateSummaryCostLines([
    splitBlock({
      total: "2",
      lines: [
        {
          himoku: "材料費",
          typeName: "塗料",
          materialName: "A塗料",
          amount: "1",
          unit: "缶",
          quantity: "1",
        },
        {
          himoku: "材料費",
          typeName: "塗料",
          materialName: "B塗料",
          amount: "1",
          unit: "缶",
          quantity: "1",
        },
      ],
    }),
  ]);
  assert.equal(many.summary_material_name, "");
});

test("split: 会社は行会社優先。ブロックが「－」なら行会社。氏名列は系統だけ値", () => {
  assert.equal(summaryPersonColumnVisible("仮設機械経費", "レンタル"), false);
  const [rental] = regenerateSummaryCostLines([
    splitBlock({
      vendorName: "－",
      total: "9",
      lines: [
        {
          himoku: "仮設機械経費",
          typeName: "仮設材･鉄道器材レンタル",
          lineVendorName: "鎌ヶ谷",
          linePersonName: "残っていても出さない",
          amount: "9",
          unit: "式",
          quantity: "1",
        },
      ],
    }),
  ]);
  assert.equal(rental.summary_vendor_name, "鎌ヶ谷");
  assert.equal(rental.summary_person_name, "");
  const [labor] = regenerateSummaryCostLines([
    splitBlock({
      stableBlockId: "blk-op",
      total: "5",
      lines: [
        {
          himoku: "労務費",
          typeName: "建設機械オペレーター",
          linePersonName: "佐藤　花子",
          amount: "5",
          unit: "人",
          quantity: "1",
        },
      ],
    }),
  ]);
  assert.equal(labor.summary_person_name, "佐藤　花子");
});

test("split: lines が無いブロックは現行どおり 1 行のまま", () => {
  const rows = regenerateSummaryCostLines([
    {
      stableBlockId: "blk-legacy",
      status: "active",
      costCategory: "施工",
      total: "800",
    },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].summary_amount_excl_tax, "800");
  assert.equal(rows[0].summary_row_key, "");
});
