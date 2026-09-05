import assert from "node:assert/strict";
import test from "node:test";

import {
  JY2_LEGAL_WELFARE_WORK_TYPE,
  jy2CollectUchiwakeSaveWarnings,
  jy2FilterSystemWorkNamesForPicker,
  jy2GaichuItemIsDashFixed,
  jy2GaichuItemUsesMaterialMaster,
  JY2_GAICHU_HIMOKU_CHOICES,
  jy2HimokuChoicesFromSystemWork,
  jy2HimokuCurrentIsWorkTypeName,
  jy2HimokuFromSystemWork,
  jy2TypesFromSystemWork,
  jy2IsGaichuMaterial,
  jy2NextBlockVendorAfterLineCompanies,
  jy2SplitGaichuTypesCell,
  jy2UchiwakeClearOutOfScopeLineFields,
  jy2UchiwakeDetailDashPatch,
  jy2UchiwakeDetailIsDashFixed,
  jy2UchiwakeDetailNeedsInput,
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

test("詳細はマスタがない費目で－固定。外注と材料リストは入力", () => {
  assert.equal(jy2UchiwakeDetailIsDashFixed("労務費", "その他労務者（昼間）"), true);
  assert.equal(jy2UchiwakeDetailIsDashFixed("仮設機械経費", "油脂燃料費"), true);
  assert.equal(jy2UchiwakeDetailIsDashFixed("その他費用", "各種保険料(任意保険）"), true);
  assert.equal(jy2UchiwakeDetailIsDashFixed("現場経費", "工場製品運搬費"), true);
  assert.equal(jy2UchiwakeDetailIsDashFixed("外注労務費", "外注線閉責任者（昼間）"), true);
  assert.equal(jy2UchiwakeDetailNeedsInput("外注費", "労務費"), true);
  assert.equal(jy2UchiwakeDetailIsDashFixed("外注費", ""), true);
  assert.equal(jy2UchiwakeDetailNeedsInput("材料費", "塗料"), true);
  assert.equal(jy2UchiwakeDetailNeedsInput("材料費", "鋼材"), true);
  assert.equal(jy2UchiwakeDetailIsDashFixed("材料費", ""), true);
  assert.equal(jy2UchiwakeDetailIsDashFixed("", ""), false);
  assert.deepEqual(jy2UchiwakeDetailDashPatch("労務費", "その他労務者（昼間）"), {
    name3: "－",
    nameDetail: null,
    nameItem: null,
  });
  assert.deepEqual(jy2UchiwakeDetailDashPatch("外注費", "労務費"), {});
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

test("費目▼は JSON 工種の1件に絞る（材料費に外注費を出さない）", () => {
  const master = [
    "材料費",
    "外注費",
    "労務費",
    "仮設機械経費",
    "現場経費",
    "その他費用",
    "外注労務費",
  ];
  assert.deepEqual(jy2HimokuChoicesFromSystemWork("10100", "材料費", master), ["材料費"]);
  assert.deepEqual(
    jy2HimokuChoicesFromSystemWork("10100", "（塗）材料費", master),
    ["材料費"],
  );
  assert.deepEqual(
    jy2HimokuChoicesFromSystemWork("10200", "（塗）塗装工事", master),
    [...JY2_GAICHU_HIMOKU_CHOICES],
  );
  assert.deepEqual(
    jy2HimokuChoicesFromSystemWork("", "軌道工事", master),
    [...JY2_GAICHU_HIMOKU_CHOICES],
  );
  assert.deepEqual(jy2HimokuChoicesFromSystemWork("", "", master), master);
  assert.equal(jy2HimokuCurrentIsWorkTypeName("塗装工事", "（塗）塗装工事"), true);
  assert.equal(jy2HimokuCurrentIsWorkTypeName("材料費", "材料費"), false);
  assert.equal(jy2HimokuCurrentIsWorkTypeName("外注費", "塗装工事"), false);
});

test("外注の＋混在セルを種別5件へ分解", () => {
  assert.deepEqual(
    jy2SplitGaichuTypesCell("材料費＋労務費＋仮設機械経費＋現場経費+その他費用"),
    ["材料費", "労務費", "仮設機械経費", "現場経費", "その他費用"],
  );
});

test("種別▼は工種JSONの types（労務費マスタ全体を出さない）", () => {
  const laborMaster = [
    "出向工事管理者（昼間）",
    "出向工事管理者（夜間）",
    "軌陸車オペレーター（昼間）",
    "軌陸車オペレーター（夜間）",
    "その他建設機械オペレーター（昼間）",
    "その他建設機械オペレーター（夜間）",
    "その他労務者（昼間）",
    "その他労務者（夜間）",
  ];
  const materialMaster = ["塗料", "鋼材", "二次製品", "生コンクリート･石材", "ＡＳ合材", "鋼製製品･ゴム製品等", "その他材料"];
  const siteMaster = [
    "工場製品運搬費",
    "建設機械運搬費",
    "仮設資材運搬費",
    "その他資材運搬費",
    "一般産業廃棄物",
    "特別産業廃棄物",
    "収入印紙",
    "県証紙",
  ];
  assert.deepEqual(
    jy2TypesFromSystemWork("", "建設機械オペレーター", "労務費", laborMaster),
    [
      "軌陸車オペレーター（昼間）",
      "軌陸車オペレーター（夜間）",
      "その他建設機械オペレーター（昼間）",
      "その他建設機械オペレーター（夜間）",
    ],
  );
  assert.deepEqual(
    jy2TypesFromSystemWork("10900", "工事管理者賃金", "労務費", laborMaster),
    ["出向工事管理者（昼間）", "出向工事管理者（夜間）"],
  );
  assert.deepEqual(
    jy2TypesFromSystemWork("", "その他労務者", "労務費", laborMaster),
    ["その他労務者（昼間）", "その他労務者（夜間）"],
  );
  assert.deepEqual(
    jy2TypesFromSystemWork("11700", "運送費", "現場経費", siteMaster),
    ["工場製品運搬費", "建設機械運搬費", "仮設資材運搬費", "その他資材運搬費"],
  );
  assert.deepEqual(
    jy2TypesFromSystemWork("10200", "塗装工事", "材料費", materialMaster),
    materialMaster,
  );
  assert.deepEqual(
    jy2TypesFromSystemWork("", "", "労務費", laborMaster),
    laborMaster,
  );
  const g0Seven = [
    "材料費",
    "外注費",
    "労務費",
    "仮設機械経費",
    "現場経費",
    "その他費用",
    "外注労務費",
  ];
  const kasetsuMaster = [
    "仮設材･鉄道器材レンタル",
    "仮設材レンタル",
    "建設機械類レンタル",
    "保安用機材類レンタル",
    "仮設ハウス･仮設トイレ",
    "その他機材レンタル",
    "建設機械油脂類",
    "油脂燃料費",
  ];
  const otherCostMaster = [
    "漁協・水利組合など",
    "瑕損補修費",
    "隣接物瑕損補償費",
    "その他補償費",
    "得意先接待交際費（甲）",
    "得意先接待交際費（乙）",
    "その他接待交際費",
  ];
  assert.deepEqual(jy2HimokuChoicesFromSystemWork("", "その他労務者", g0Seven), ["労務費"]);
  assert.deepEqual(
    jy2HimokuChoicesFromSystemWork("", "（塗）その他労務者賃金", g0Seven),
    ["労務費"],
  );
  assert.deepEqual(
    jy2TypesFromSystemWork("", "その他労務者賃金", "労務費", laborMaster),
    ["その他労務者（昼間）", "その他労務者（夜間）"],
  );
  assert.deepEqual(jy2HimokuChoicesFromSystemWork("", "仮設・工具費等", g0Seven), [
    "仮設機械経費",
  ]);
  assert.deepEqual(
    jy2TypesFromSystemWork("", "仮設・工具費等", "仮設機械経費", kasetsuMaster),
    ["油脂燃料費"],
  );
  assert.equal(jy2HimokuFromSystemWork("", "各種保険料（任意保険）"), "その他費用");
  assert.deepEqual(
    jy2HimokuChoicesFromSystemWork("", "各種保険料(任意保険）", g0Seven),
    ["その他費用"],
  );
  assert.deepEqual(
    jy2TypesFromSystemWork("", "各種保険料（任意保険）", "その他費用", otherCostMaster),
    ["各種保険料(任意保険）"],
  );
  assert.deepEqual(
    jy2HimokuChoicesFromSystemWork("10200", "塗装工事", g0Seven),
    ["材料費", "労務費", "仮設機械経費", "現場経費", "その他費用"],
  );
});
