/**
 * 756/757 内訳階層 — 純関数（仕様 2026-09-04 / 実装 2026-09-05）。
 * ブラウザ束ね: jikkou-yosan-v2-build-desktop.mjs が ESM を剥がす。
 *
 * 正本: docs/plans/2026-09-04-jikkou-yosan-v2-uchiwake-hierarchy-spec.md
 */

export const JY2_LEGAL_WELFARE_WORK_TYPE = "法定福利費";

export const JY2_UCHIWAKE_APP2_FIELDS = Object.freeze({
  nameDetail: "name_detail",
  nameItem: "name_item",
  lineVendorName: "line_vendor_name",
  linePersonName: "line_person_name",
});

/** システム工種コード → 費目（JSON 正本。未採番は名称キー）。 */
export const JY2_SYSTEM_WORK_HIMOKU_BY_CODE = Object.freeze({
  "10100": "材料費",
  "10200": "外注費",
  "10300": "外注費",
  "10400": "外注費",
  "10600": "外注費",
  "10700": "外注費",
  "14100": "外注費",
  "14200": "外注費",
  "14300": "外注費",
  "14400": "外注費",
  "14500": "外注費",
  "10900": "労務費",
  "10800": "仮設機械経費",
  "11600": "仮設機械経費",
  "11700": "現場経費",
  "11800": "現場経費",
  "11900": "現場経費",
  "12000": "現場経費",
  "12100": "現場経費",
  "12200": "現場経費",
  "12300": "現場経費",
  "12400": "現場経費",
  "12600": "現場経費",
  "12700": "現場経費",
  "12900": "現場経費",
  "13100": "現場経費",
  "13620": "現場経費",
  "12800": "その他費用",
  "13600": "その他費用",
  "11000": "外注労務費",
  "11100": "外注労務費",
  "11200": "外注労務費",
  "11300": "外注労務費",
  "11400": "外注労務費",
  "11500": "外注労務費",
  "13500": "外注労務費",
});

export const JY2_SYSTEM_WORK_HIMOKU_BY_NAME = Object.freeze({
  材料費: "材料費",
  塗装工事: "外注費",
  足場工事: "外注費",
  塗装及び足場工事: "外注費",
  修繕等工事: "外注費",
  塗装付帯工事: "外注費",
  軌道工事: "外注費",
  調査設計費: "外注費",
  外注試験費: "外注費",
  交通規制費: "外注費",
  "追加工事①": "外注費",
  "追加工事②": "外注費",
  "追加工事③": "外注費",
  "追加工事④": "外注費",
  "追加工事⑤": "外注費",
  工事管理者賃金: "労務費",
  建設機械オペレーター: "労務費",
  その他労務者: "労務費",
  鎌ヶ谷資材使用料: "仮設機械経費",
  レンタル: "仮設機械経費",
  "仮設・工具費等": "仮設機械経費",
  運送費: "現場経費",
  産業廃棄物処理費: "現場経費",
  租税公課: "現場経費",
  借地料等: "現場経費",
  消耗品費: "現場経費",
  事務費: "現場経費",
  通信費: "現場経費",
  旅費交通費: "現場経費",
  履行保証保険料: "現場経費",
  建退共証紙購入費: "現場経費",
  諸雑費: "現場経費",
  諸会費: "現場経費",
  会議費: "現場経費",
  補償費: "その他費用",
  交際費: "その他費用",
  "各種保険料(任意保険）": "その他費用",
  法定福利費: "その他費用",
  工事安全専任管理者: "外注労務費",
  線閉責任者: "外注労務費",
  列車見張員: "外注労務費",
  交通整理員: "外注労務費",
  検電接地: "外注労務費",
  その他保安費: "外注労務費",
  重機誘導員: "外注労務費",
});

export function jy2HasUchiwakeText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function jy2IsGaichuHimoku(himoku) {
  return String(himoku || "").trim() === "外注費";
}

export function jy2IsGaichuMaterial(himoku, typeName) {
  return jy2IsGaichuHimoku(himoku) && String(typeName || "").trim() === "材料費";
}

/** 外注×材料かつ細目が塗料／その他材料 → 品名マスタ（name_item）。 */
export function jy2GaichuItemUsesMaterialMaster(himoku, typeName, detail) {
  if (!jy2IsGaichuMaterial(himoku, typeName)) return false;
  const d = String(detail || "").trim();
  return d === "塗料" || d === "その他材料";
}

/** 外注×材料で細目が選ばれ、品名マスタ対象外 → 右セル「－」固定。細目空はまだ固定しない。 */
export function jy2GaichuItemIsDashFixed(himoku, typeName, detail) {
  if (!jy2IsGaichuMaterial(himoku, typeName)) return false;
  if (!jy2HasUchiwakeText(detail)) return false;
  return !jy2GaichuItemUsesMaterialMaster(himoku, typeName, detail);
}

/** 仕様 §3.1 行の会社列。 */
export function jy2UchiwakeLineVendorVisible(himoku, typeName) {
  const h = String(himoku || "").trim();
  const t = String(typeName || "").trim();
  if (h === "労務費" || h === "外注労務費") return true;
  if (h === "仮設機械経費") return true;
  if (h === "外注費" && (t === "労務費" || t === "仮設機械経費")) return true;
  return false;
}

/** 仕様 §3.1 行の氏名列（会社の右隣）。仮設は会社のみ。 */
export function jy2UchiwakeLinePersonVisible(himoku, typeName) {
  const h = String(himoku || "").trim();
  const t = String(typeName || "").trim();
  if (h === "労務費" || h === "外注労務費") return true;
  if (h === "外注費" && t === "労務費") return true;
  return false;
}

/** Q3: 条件外になった会社・氏名だけクリア。 */
export function jy2UchiwakeClearOutOfScopeLineFields(himoku, typeName, row) {
  const patch = {};
  if (
    !jy2UchiwakeLineVendorVisible(himoku, typeName) &&
    jy2HasUchiwakeText(row && row.lineVendorName)
  ) {
    patch.lineVendorName = null;
  }
  if (
    !jy2UchiwakeLinePersonVisible(himoku, typeName) &&
    jy2HasUchiwakeText(row && row.linePersonName)
  ) {
    patch.linePersonName = null;
  }
  return patch;
}

export function jy2UchiwakeRowHasLineVendor(row) {
  return jy2HasUchiwakeText(row && row.lineVendorName);
}

/** 行に会社名がある → ブロック取引先は「－」。 */
export function jy2NextBlockVendorAfterLineCompanies(block) {
  const rows = block && Array.isArray(block.detailRows) ? block.detailRows : [];
  if (rows.some(jy2UchiwakeRowHasLineVendor)) return "－";
  return block && block.vendorName != null ? block.vendorName : null;
}

function jy2UchiwakeRowLooksUsed(row) {
  if (!row) return false;
  const keys = [
    "name1",
    "name2",
    "name3",
    "nameDetail",
    "nameItem",
    "unit",
    "quantity",
    "unitPrice",
    "note",
    "lineVendorName",
    "linePersonName",
  ];
  return keys.some((key) => jy2HasUchiwakeText(row[key]));
}

/**
 * Q4: 保存時のみ。保存は止めない。
 * 1. 行会社ありなのにブロックが「－」以外 → 自動側の取りこぼし警告
 * 2. 行会社なし かつ ブロック空または「－」 → ブロック会社を入れてください
 * 3. ブロックが「－」で、会社列対象の使用中行が空 → 行の会社が空
 */
export function jy2CollectUchiwakeSaveWarnings(blocks) {
  const warnings = [];
  (blocks || []).forEach((block, blockIndex) => {
    if (!block || block.status === "retired") return;
    const rows = Array.isArray(block.detailRows) ? block.detailRows : [];
    const label =
      String(block.workTypeName || "").trim() ||
      String(block.workTypeCode || "").trim() ||
      `工種${blockIndex + 1}`;
    const anyLineVendor = rows.some(jy2UchiwakeRowHasLineVendor);
    const vendor = String(block.vendorName || "").trim();
    if (anyLineVendor && vendor && vendor !== "－") {
      warnings.push(`${label}: 行に会社名があるためブロックの取引先を「－」にしてください`);
    }
    if (!anyLineVendor && (!vendor || vendor === "－")) {
      warnings.push(`${label}: ブロックの会社名を入れてください`);
    }
    if (vendor === "－") {
      rows.forEach((row, rowIndex) => {
        if (!jy2UchiwakeRowLooksUsed(row)) return;
        const himoku = String(row.name1 || "").trim();
        const typeName = String(row.name2 || "").trim();
        if (!jy2UchiwakeLineVendorVisible(himoku, typeName)) return;
        if (!jy2UchiwakeRowHasLineVendor(row)) {
          warnings.push(`${label} 行${rowIndex + 1}: 会社名が空です`);
        }
      });
    }
  });
  return warnings;
}

/** ピッカーから法定福利費を除く。現行値がそれなら呼び出し側の listOnly 祖父に任せる。 */
export function jy2FilterSystemWorkNamesForPicker(masterNames) {
  return (masterNames || []).filter((name) => name !== JY2_LEGAL_WELFARE_WORK_TYPE);
}

export function jy2HimokuFromSystemWork(code, name) {
  const c = String(code || "").trim();
  if (c && Object.prototype.hasOwnProperty.call(JY2_SYSTEM_WORK_HIMOKU_BY_CODE, c)) {
    return JY2_SYSTEM_WORK_HIMOKU_BY_CODE[c];
  }
  const n = String(name || "")
    .trim()
    .replace(/^（塗）/u, "");
  if (n && Object.prototype.hasOwnProperty.call(JY2_SYSTEM_WORK_HIMOKU_BY_NAME, n)) {
    return JY2_SYSTEM_WORK_HIMOKU_BY_NAME[n];
  }
  return null;
}

/** Excel「材料費＋労務費＋…」を種別5件へ。半角 + 混在可。 */
export function jy2SplitGaichuTypesCell(cell) {
  const s = String(cell || "").trim();
  if (!s) return [];
  if (!/[＋+]/.test(s)) return [s];
  return s
    .split(/[＋+]/)
    .map((part) => part.trim())
    .filter(Boolean);
}
