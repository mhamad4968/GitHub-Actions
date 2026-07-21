import { allowedOperations } from "./lock.mjs";

export const UI_TABS = Object.freeze([
  Object.freeze({ id: "summary", label: "サマリー" }),
  Object.freeze({ id: "detail", label: "内訳" }),
  Object.freeze({ id: "actual", label: "実績" }),
  Object.freeze({ id: "version", label: "版管理" }),
]);

export function tabEditability(lockState) {
  const operations = allowedOperations(lockState);
  return Object.freeze({
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
