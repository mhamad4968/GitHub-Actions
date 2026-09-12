import assert from "node:assert/strict";
import test from "node:test";

import {
  OVERHEAD_WORK_TYPE_NAMES,
  canonicalSystemWorkTypeName,
  isOverheadBaseHimoku,
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
  assert.equal(isOverheadBaseHimoku("外注費"), true);
  assert.equal(isOverheadBaseHimoku("材料費"), false);
});
