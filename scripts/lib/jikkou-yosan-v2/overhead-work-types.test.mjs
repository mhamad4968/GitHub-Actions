import assert from "node:assert/strict";
import test from "node:test";

import {
  OVERHEAD_WORK_TYPE_NAMES,
  canonicalSystemWorkTypeName,
  isOverheadBaseHimoku,
  isOverheadExcludedType,
  workTypeShowsOverheadFooter,
} from "./overhead-work-types.mjs";

test("諸経費対象は14件。画面の（塗）は見ない", () => {
  assert.equal(OVERHEAD_WORK_TYPE_NAMES.length, 14);
  assert.equal(canonicalSystemWorkTypeName("（塗）塗装工事"), "塗装工事");
  assert.equal(workTypeShowsOverheadFooter("塗装工事"), true);
  assert.equal(workTypeShowsOverheadFooter("（塗）塗装工事"), true);
  assert.equal(workTypeShowsOverheadFooter("材料費"), false);
  assert.equal(workTypeShowsOverheadFooter("（塗）レンタル"), false);
  assert.equal(workTypeShowsOverheadFooter(""), false);
});

test("外注費母数は5費目＋字面外注費。法定福利と各種保険料は除外", () => {
  assert.equal(isOverheadBaseHimoku("外注費"), true);
  assert.equal(isOverheadBaseHimoku("材料費"), true);
  assert.equal(isOverheadBaseHimoku("労務費"), true);
  assert.equal(isOverheadBaseHimoku("仮設機械経費"), true);
  assert.equal(isOverheadBaseHimoku("現場経費"), true);
  assert.equal(isOverheadBaseHimoku("その他費用"), true);
  assert.equal(isOverheadBaseHimoku("外注労務費"), false);
  assert.equal(isOverheadBaseHimoku("その他費用", "法定福利費"), false);
  assert.equal(isOverheadBaseHimoku("その他費用", "各種保険料(任意保険）"), false);
  assert.equal(isOverheadExcludedType("法定福利費"), true);
  assert.equal(isOverheadExcludedType("漁協・水利組合など"), false);
});
