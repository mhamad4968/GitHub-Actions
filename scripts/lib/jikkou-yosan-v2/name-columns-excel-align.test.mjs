import assert from "node:assert/strict";
import test from "node:test";
import {
  alignBlockDetailNameColumns,
  alignDetailNameColumns,
} from "./name-columns-excel-align.mjs";

test("subcontract-style: Excel col2 values in name_1 shift to name_2 with kinds", () => {
  const rows = alignBlockDetailNameColumns([
    { row_kind: "detail", name_1: "塗装工事一式", name_2: "", name_3: "" },
    { row_kind: "detail", name_1: "労務費（昼）", name_2: "", name_3: "" },
    { row_kind: "detail", name_1: "労務費（夜）", name_2: "", name_3: "" },
    { row_kind: "detail", name_1: "事前打合せ費等", name_2: "", name_3: "" },
    { row_kind: "detail", name_1: "仮設・工具費等", name_2: "", name_3: "" },
    { row_kind: "detail", name_1: "運送費", name_2: "", name_3: "" },
    { row_kind: "overhead", name_1: "諸経費", name_2: "", name_3: "" },
  ]);
  assert.equal(rows[0].name_1, "材料費");
  assert.equal(rows[0].name_2, "塗装工事一式");
  assert.equal(rows[1].name_1, "労務費");
  assert.equal(rows[1].name_2, "労務費（昼）");
  assert.equal(rows[2].name_1, "");
  assert.equal(rows[2].name_2, "労務費（夜）");
  assert.equal(rows[3].name_1, "工具･機械使用料");
  assert.equal(rows[3].name_2, "事前打合せ費等");
  assert.equal(rows[4].name_1, "");
  assert.equal(rows[4].name_2, "仮設・工具費等");
  assert.equal(rows[5].name_2, "運送費");
  assert.equal(rows[6].name_1, "諸経費");
  assert.equal(rows[6].changed, false);
});

test("mat-style: product|capacity|maker → 材料費 / 塗料 / product…", () => {
  const one = alignDetailNameColumns({
    row_kind: "detail",
    name_1: "厚膜型変性エポキシ樹脂系塗料　下塗",
    name_2: "20",
    name_3: "日本ペイント",
    name_spec_group: "塗料",
  });
  assert.equal(one.name_2, "塗料");
  assert.match(one.name_3, /厚膜型/);
  assert.match(one.name_3, /20/);
  const block = alignBlockDetailNameColumns([
    {
      row_kind: "detail",
      name_1: "厚膜型変性エポキシ樹脂系塗料　下塗",
      name_2: "20",
      name_3: "日本ペイント",
      name_spec_group: "塗料",
    },
    {
      row_kind: "detail",
      name_1: "シンナー",
      name_2: "16",
      name_3: "日本ペイント",
      name_spec_group: "塗料",
    },
  ]);
  assert.equal(block[0].name_1, "材料費");
  assert.equal(block[0].name_2, "塗料");
  assert.equal(block[1].name_1, "");
  assert.equal(block[1].name_2, "塗料");
});
