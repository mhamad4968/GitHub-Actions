import assert from "node:assert/strict";
import test from "node:test";

import {
  JY2_LEGAL_WELFARE_WORK_TYPE,
  jy2CollectUchiwakeSaveWarnings,
  jy2FilterSystemWorkNamesForPicker,
  jy2GaichuItemIsDashFixed,
  jy2GaichuItemUsesMaterialMaster,
  jy2HimokuFromSystemWork,
  jy2IsGaichuMaterial,
  jy2NextBlockVendorAfterLineCompanies,
  jy2SplitGaichuTypesCell,
  jy2UchiwakeClearOutOfScopeLineFields,
  jy2UchiwakeLinePersonVisible,
  jy2UchiwakeLineVendorVisible,
} from "./uchiwake-hierarchy.mjs";

test("外注×材料の品名マスタは塗料／その他材料だけ", () => {
  assert.equal(jy2IsGaichuMaterial("外注費", "材料費"), true);
  assert.equal(jy2IsGaichuMaterial("材料費", "塗料"), false);
  assert.equal(jy2GaichuItemUsesMaterialMaster("外注費", "材料費", "塗料"), true);
  assert.equal(jy2GaichuItemUsesMaterialMaster("外注費", "材料費", "鋼材"), false);
  assert.equal(jy2GaichuItemIsDashFixed("外注費", "材料費", "鋼材"), true);
  assert.equal(jy2GaichuItemIsDashFixed("外注費", "材料費", ""), false);
  assert.equal(jy2GaichuItemIsDashFixed("材料費", "塗料", "塗料"), false);
});

test("§3.1 会社・氏名の表示条件", () => {
  assert.equal(jy2UchiwakeLineVendorVisible("労務費", ""), true);
  assert.equal(jy2UchiwakeLinePersonVisible("労務費", ""), true);
  assert.equal(jy2UchiwakeLineVendorVisible("仮設機械経費", ""), true);
  assert.equal(jy2UchiwakeLinePersonVisible("仮設機械経費", ""), false);
  assert.equal(jy2UchiwakeLineVendorVisible("外注費", "労務費"), true);
  assert.equal(jy2UchiwakeLinePersonVisible("外注費", "労務費"), true);
  assert.equal(jy2UchiwakeLineVendorVisible("外注費", "仮設機械経費"), true);
  assert.equal(jy2UchiwakeLinePersonVisible("外注費", "仮設機械経費"), false);
  assert.equal(jy2UchiwakeLineVendorVisible("外注費", "材料費"), false);
  assert.equal(jy2UchiwakeLineVendorVisible("材料費", "塗料"), false);
});

test("Q3: 条件外の氏名だけクリア", () => {
  const patch = jy2UchiwakeClearOutOfScopeLineFields("外注費", "仮設機械経費", {
    lineVendorName: "レンタルA",
    linePersonName: "山田",
  });
  assert.equal(patch.lineVendorName, undefined);
  assert.equal(patch.linePersonName, null);
});

test("行会社ありならブロック取引先は－", () => {
  assert.equal(
    jy2NextBlockVendorAfterLineCompanies({
      vendorName: "元請け",
      detailRows: [{ lineVendorName: "協力A" }],
    }),
    "－",
  );
  assert.equal(
    jy2NextBlockVendorAfterLineCompanies({
      vendorName: "元請け",
      detailRows: [{ lineVendorName: null }],
    }),
    "元請け",
  );
});

test("保存警告は止めない・空行は無視", () => {
  const emptyBlock = {
    workTypeName: "塗装工事",
    vendorName: "",
    detailRows: [{ name1: null }],
  };
  assert.match(
    jy2CollectUchiwakeSaveWarnings([emptyBlock])[0],
    /ブロックの会社名/,
  );
  const mixed = {
    workTypeName: "レンタル",
    vendorName: "－",
    detailRows: [
      { name1: "外注費", name2: "仮設機械経費", lineVendorName: "A社" },
      { name1: "外注費", name2: "仮設機械経費", unit: "式" },
    ],
  };
  const warns = jy2CollectUchiwakeSaveWarnings([mixed]);
  assert.equal(
    warns.some((w) => /行2: 会社名が空/.test(w)),
    true,
  );
});

test("法定福利費はピッカーから除外。JSON 費目はコード優先", () => {
  const names = jy2FilterSystemWorkNamesForPicker(["塗装工事", JY2_LEGAL_WELFARE_WORK_TYPE, "レンタル"]);
  assert.deepEqual(names, ["塗装工事", "レンタル"]);
  assert.equal(jy2HimokuFromSystemWork("10900", "塗装工事"), "労務費");
  assert.equal(jy2HimokuFromSystemWork("", "軌道工事"), "外注費");
  assert.equal(jy2HimokuFromSystemWork("", "（塗）レンタル"), "仮設機械経費");
});

test("外注の＋混在セルを種別5件へ分解", () => {
  assert.deepEqual(
    jy2SplitGaichuTypesCell("材料費＋労務費＋仮設機械経費＋現場経費+その他費用"),
    ["材料費", "労務費", "仮設機械経費", "現場経費", "その他費用"],
  );
});
