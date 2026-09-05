import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function readUi() {
  return readFileSync(
    path.join(root, "customize/jikkou-yosan-v2-app1/desktop.ui.js"),
    "utf8",
  );
}

test("内訳階層: UI が純関数と新フィールドを接続する", () => {
  const source = readUi();
  assert.match(source, /@JY_V2_BUILD 2026-09-05-ver02-locked-fuka-badge/);
  assert.match(source, /jy2LockedValueControl/);
  assert.match(source, /入力不可（固定）/);
  assert.match(source, /jy2-locked-badge/);
  assert.match(source, /@media print\{\.jy2-locked-badge/);
  assert.match(source, /jy2HimokuChoicesFromSystemWork/);
  assert.match(source, /jy2HimokuCurrentIsWorkTypeName/);
  assert.match(source, /jy2TypesFromSystemWork/);
  assert.match(source, /jy2WorkTypeIsEmpty/);
  assert.match(source, /himokuChoiceLocked/);
  assert.match(source, /typeChoiceLocked/);
  assert.match(source, /（空）/);
  assert.match(source, /__JY2_CLEAR__/);
  assert.match(source, /jy2FilterSystemWorkNamesForPicker/);
  assert.match(source, /jy2HimokuFromSystemWork/);
  assert.match(source, /jy2IsGaichuHimoku/);
  assert.match(source, /jy2GaichuItemUsesMaterialMaster/);
  assert.match(source, /jy2GaichuItemIsDashFixed/);
  assert.match(source, /jy2UchiwakeDetailIsDashFixed/);
  assert.match(source, /jy2UchiwakeLineVendorVisible/);
  assert.match(source, /jy2UchiwakeLinePersonVisible/);
  assert.match(source, /jy2UchiwakeClearOutOfScopeLineFields/);
  assert.match(source, /jy2NextBlockVendorAfterLineCompanies/);
  assert.match(source, /jy2CollectUchiwakeSaveWarnings/);
  assert.match(source, /nameDetail/);
  assert.match(source, /nameItem/);
  assert.match(source, /lineVendorName/);
  assert.match(source, /linePersonName/);
  assert.match(source, /dataset\.jy2Field = "nameDetail"/);
  assert.match(source, /dataset\.jy2Field = "nameItem"/);
  assert.doesNotMatch(source, /customize\/736/);
});
