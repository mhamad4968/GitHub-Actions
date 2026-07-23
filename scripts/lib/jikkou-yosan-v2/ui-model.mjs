import { allowedOperations } from "./lock.mjs";

/** §6.1 5タブ — 工事基本情報は総括表と別（2026-07-22 UI／07-23 書面） */
export const UI_TABS = Object.freeze([
  Object.freeze({ id: "header", label: "工事基本情報" }),
  Object.freeze({ id: "summary", label: "総括表" }),
  Object.freeze({ id: "detail", label: "内訳" }),
  Object.freeze({ id: "actual", label: "予実管理" }),
  Object.freeze({ id: "version", label: "バージョン管理" }),
]);

export function tabEditability(lockState) {
  const operations = allowedOperations(lockState);
  return Object.freeze({
    header: !operations.editBudget,
    summary: !operations.editBudget,
    detail: !operations.editBudget,
    actual: !operations.editActuals,
    version: !operations.createNextVersion,
  });
}

export function createUiModel(lockState) {
  const readOnly = tabEditability(lockState);
  return Object.freeze({
    lockState,
    allowedOperations: allowedOperations(lockState),
    tabs: Object.freeze(
      UI_TABS.map((tab) =>
        Object.freeze({ ...tab, readOnly: readOnly[tab.id] }),
      ),
    ),
    readOnly,
  });
}
