/**
 * S-KINTONE-EMPTY-DD-01 (2026-08-06 夕反省 GO)
 * kintone の DROP_DOWN が未選択（空）のとき、`not in ("A","B")` では拾えないことがある。
 * 初期化・バックフィルはスコープ query で取得し、クライアント側で本関数を使う。
 */
export const KINTONE_EMPTY_DROPDOWN_NOTE =
  'kintone not-in does not reliably match empty DROP_DOWN; filter client-side (S-KINTONE-EMPTY-DD-01)';

/** @param {unknown} value kintone field .value */
export function isEmptyDropdownValue(value) {
  return value == null || String(value).trim() === '';
}

/** @param {{ value?: unknown } | null | undefined} field */
export function isEmptyDropdownField(field) {
  return isEmptyDropdownValue(field && field.value);
}
