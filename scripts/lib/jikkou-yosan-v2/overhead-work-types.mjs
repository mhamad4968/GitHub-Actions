/** 諸経費フッタを出すシステム工種（保存名。画面の（塗）は見ない）。 */

export const OVERHEAD_WORK_TYPE_NAMES = Object.freeze([
  "塗装工事",
  "足場工事",
  "塗装及び足場工事",
  "修繕等工事",
  "塗装付帯工事",
  "軌道工事",
  "調査設計費",
  "外注試験費",
  "交通規制費",
  "追加工事①",
  "追加工事②",
  "追加工事③",
  "追加工事④",
  "追加工事⑤",
]);

/** 外注費の中身（費目▼5件）。字面「外注費」も既存保存のために残す。 */
export const GAICHU_OVERHEAD_HIMOKU_NAMES = Object.freeze([
  "外注費",
  "材料費",
  "労務費",
  "仮設機械経費",
  "現場経費",
  "その他費用",
]);

const OVERHEAD_NAME_SET = new Set(OVERHEAD_WORK_TYPE_NAMES);
const GAICHU_HIMOKU_SET = new Set(GAICHU_OVERHEAD_HIMOKU_NAMES);

const LEGAL_WELFARE_TYPE = "法定福利費";
const INSURANCE_TYPE = "各種保険料(任意保険）";

export function canonicalSystemWorkTypeName(name) {
  return String(name ?? "")
    .trim()
    .replace(/^（塗）/, "");
}

export function workTypeShowsOverheadFooter(workTypeName) {
  return OVERHEAD_NAME_SET.has(canonicalSystemWorkTypeName(workTypeName));
}

export function isOverheadExcludedType(typeName) {
  const t = String(typeName ?? "").trim();
  if (!t) return false;
  if (t === LEGAL_WELFARE_TYPE) return true;
  if (t === INSURANCE_TYPE || t.startsWith("各種保険料")) return true;
  return false;
}

export function isOverheadBaseHimoku(himoku, typeName) {
  const h = String(himoku ?? "").trim();
  if (!GAICHU_HIMOKU_SET.has(h)) return false;
  if (isOverheadExcludedType(typeName)) return false;
  return true;
}
