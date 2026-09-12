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

const OVERHEAD_NAME_SET = new Set(OVERHEAD_WORK_TYPE_NAMES);

export function canonicalSystemWorkTypeName(name) {
  return String(name ?? "")
    .trim()
    .replace(/^（塗）/, "");
}

export function workTypeShowsOverheadFooter(workTypeName) {
  return OVERHEAD_NAME_SET.has(canonicalSystemWorkTypeName(workTypeName));
}

export function isOverheadBaseHimoku(himoku) {
  return String(himoku ?? "").trim() === "外注費";
}
