/**
 * 756 工事原価管理 v2 — 計算と JSON 契約（G0 §7 / G1）。
 * ブラウザ束ね: jikkou-yosan-v2-build-desktop.mjs が ESM を剥がす。
 * 758 の amount / stable_block_id はセンチネル。計算は読まない。
 */

export const CMV2_MONTHS = Object.freeze([
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "1",
  "2",
  "3",
]);

export const CMV2_SENTINEL_BLOCK = "__cmv2__";
export const CMV2_KEY_PREFIX = "cmv2|";

export function cmv2EmptyMonths() {
  return CMV2_MONTHS.map(() => null);
}

export function cmv2ActualRecordKey(projectId) {
  return `${CMV2_KEY_PREFIX}${String(projectId || "").trim()}`;
}

export function cmv2Sentinel758Fields(keys) {
  const projectId = String(keys?.projectId || "").trim();
  return Object.freeze({
    actual_record_key: cmv2ActualRecordKey(projectId),
    project_id: projectId,
    project_business_key: String(keys?.projectBusinessKey || "").trim(),
    record_kind: "monthly_consumption",
    amount: "0",
    stable_block_id: CMV2_SENTINEL_BLOCK,
    source_kind: "手入力",
    write_channel: "app1_custom_ui",
    cost_category_key: "施工",
  });
}

export function cmv2ParseYen(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim().replace(/[,，]/g, "");
  if (!text) return null;
  if (!/^-?\d+$/.test(text)) return null;
  return Number(text);
}

function emptyWorkTypeBudget() {
  return {
    initial: null,
    current: null,
    forecast: cmv2EmptyMonths(),
    countPlan: null,
    countForecast: cmv2EmptyMonths(),
  };
}

export function cmv2ParseBudget(raw) {
  let parsed = raw;
  if (typeof raw === "string") {
    const text = raw.trim();
    parsed = text ? JSON.parse(text) : {};
  }
  const src = parsed && typeof parsed === "object" ? parsed : {};
  const workTypes = {};
  const incoming = src.workTypes && typeof src.workTypes === "object" ? src.workTypes : {};
  for (const [key, row] of Object.entries(incoming)) {
    workTypes[key] = {
      initial: cmv2ParseYen(row?.initial),
      current: cmv2ParseYen(row?.current),
      forecast: cmv2PadMonths(row?.forecast),
      countPlan: cmv2ParseYen(row?.countPlan),
      countForecast: cmv2PadMonths(row?.countForecast),
    };
  }
  return {
    v: 1,
    initialCopied: src.initialCopied === true,
    workTypes,
    includedWorkTypeKeys: cmv2NormalizeIncludedKeys(src.includedWorkTypeKeys),
  };
}

function cmv2NormalizeIncludedKeys(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((key) => String(key || "").trim()).filter(Boolean))];
}

export function cmv2ParseActuals(raw) {
  let parsed = raw;
  if (typeof raw === "string") {
    const text = raw.trim();
    parsed = text ? JSON.parse(text) : {};
  }
  const src = parsed && typeof parsed === "object" ? parsed : {};
  const companies = Array.isArray(src.companies)
    ? src.companies.map((row) => ({
        workTypeKey: String(row?.workTypeKey || ""),
        company: String(row?.company || ""),
        months: cmv2PadMonths(row?.months),
      }))
    : [];
  const countActual = {};
  const incoming = src.countActual && typeof src.countActual === "object" ? src.countActual : {};
  for (const [key, months] of Object.entries(incoming)) {
    countActual[key] = cmv2PadMonths(months);
  }
  return { v: 1, companies, countActual };
}

function cmv2PadMonths(value) {
  const out = cmv2EmptyMonths();
  if (!Array.isArray(value)) return out;
  for (let i = 0; i < 12; i += 1) {
    out[i] = cmv2ParseYen(value[i]);
  }
  return out;
}

export function cmv2MergeMasterWorkTypes(budget, masterItems) {
  const next = cmv2ParseBudget(budget);
  for (const item of masterItems || []) {
    const key = item.workTypeKey;
    if (!key || next.workTypes[key]) continue;
    next.workTypes[key] = emptyWorkTypeBudget();
  }
  return next;
}

export function cmv2MonthActual(companies, workTypeKey, monthIndex) {
  let has = false;
  let sum = 0;
  for (const row of companies || []) {
    if (row.workTypeKey !== workTypeKey) continue;
    const yen = cmv2ParseYen(row.months?.[monthIndex]);
    if (yen === null) continue;
    has = true;
    sum += yen;
  }
  return has ? { has: true, value: sum } : { has: false, value: null };
}

export function cmv2AdoptedMonth(actualHas, actualValue, forecast) {
  if (actualHas) return actualValue;
  const expected = cmv2ParseYen(forecast);
  return expected === null ? 0 : expected;
}

export function cmv2ForecastMonthEditable(actualHas) {
  return !actualHas;
}

export function cmv2ForecastMonthFilled(forecast) {
  return cmv2ParseYen(forecast) !== null;
}

export function cmv2WorkTypeRow(masterItem, budget, actuals) {
  const key = masterItem.workTypeKey;
  const wt = budget.workTypes[key] || emptyWorkTypeBudget();
  const adopted = [];
  const actualsByMonth = [];
  for (let i = 0; i < 12; i += 1) {
    const monthActual = cmv2MonthActual(actuals.companies, key, i);
    actualsByMonth.push(monthActual);
    adopted.push(cmv2AdoptedMonth(monthActual.has, monthActual.value, wt.forecast[i]));
  }
  const adoptedSum = adopted.reduce((acc, value) => acc + value, 0);
  const current = wt.current;
  const remaining = current === null ? null : current - adoptedSum;
  const rate =
    current === null || current === 0 ? null : adoptedSum / current;
  const countActualMonths = cmv2PadMonths(actuals.countActual?.[key]);
  const countAdopted = [];
  for (let i = 0; i < 12; i += 1) {
    const actualCount = countActualMonths[i];
    countAdopted.push(actualCount !== null ? actualCount : 0);
  }
  const countAdoptedSum = countAdopted.reduce((acc, value) => acc + value, 0);
  const countRemaining =
    wt.countPlan === null ? null : wt.countPlan - countAdoptedSum;
  return {
    ...masterItem,
    initial: wt.initial,
    current,
    forecast: wt.forecast,
    actualsByMonth,
    adopted,
    adoptedSum,
    remaining,
    rate,
    countPlan: wt.countPlan,
    countForecast: wt.countForecast,
    countActual: countActualMonths,
    countAdopted,
    countRemaining,
  };
}

export function cmv2ApplyFirstConfirmLock(budget) {
  const next = cmv2ParseBudget(budget);
  if (next.initialCopied) return next;
  for (const row of Object.values(next.workTypes)) {
    if (row.initial === null && row.current !== null) {
      row.initial = row.current;
    }
  }
  next.initialCopied = true;
  return next;
}

export function cmv2SerializeBudget(budget) {
  return JSON.stringify(cmv2ParseBudget(budget));
}

export function cmv2SerializeActuals(actuals) {
  return JSON.stringify(cmv2ParseActuals(actuals));
}

export function cmv2SystemHasActual(masterItems, actuals, systemWorkType, section) {
  for (const item of masterItems || []) {
    if (item.systemWorkType !== systemWorkType) continue;
    if (section && item.section !== section) continue;
    for (let i = 0; i < 12; i += 1) {
      if (cmv2MonthActual(actuals.companies, item.workTypeKey, i).has) return true;
    }
  }
  return false;
}

export function cmv2BudgetRowHasUserInput(row) {
  if (!row) return false;
  if (row.current !== null && row.current !== undefined) return true;
  if (row.countPlan !== null && row.countPlan !== undefined) return true;
  return (row.forecast || []).some((value) => value !== null && value !== undefined);
}

export function cmv2WorkTypeHasYenActual(actuals, workTypeKey) {
  for (let i = 0; i < 12; i += 1) {
    if (cmv2MonthActual(actuals?.companies, workTypeKey, i).has) return true;
  }
  return false;
}

export function cmv2WorkTypeHasCountActual(actuals, workTypeKey) {
  const months = actuals?.countActual?.[workTypeKey];
  if (!Array.isArray(months)) return false;
  return months.some((value) => cmv2ParseYen(value) !== null);
}

export function cmv2SeedIncludedWorkTypes(budget) {
  const next = cmv2ParseBudget(budget);
  const set = new Set(next.includedWorkTypeKeys);
  for (const [key, row] of Object.entries(next.workTypes)) {
    if (cmv2BudgetRowHasUserInput(row)) set.add(key);
  }
  next.includedWorkTypeKeys = [...set];
  return next;
}

export function cmv2WorkTypeIsListed(workTypeKey, budget, actuals) {
  const key = String(workTypeKey || "");
  if (!key) return false;
  if ((budget?.includedWorkTypeKeys || []).includes(key)) return true;
  if (cmv2WorkTypeHasYenActual(actuals, key)) return true;
  if (cmv2WorkTypeHasCountActual(actuals, key)) return true;
  return false;
}

export function cmv2IncludeWorkType(budget, workTypeKey) {
  const next = cmv2ParseBudget(budget);
  const key = String(workTypeKey || "").trim();
  if (!key) return next;
  if (!next.workTypes[key]) {
    next.workTypes[key] = emptyWorkTypeBudget();
  }
  if (!next.includedWorkTypeKeys.includes(key)) {
    next.includedWorkTypeKeys.push(key);
  }
  return next;
}

/** 印刷（金額）: 実績がある月の合計。未入力月は足さない（0円の実績月は足す）。 */
export function cmv2PrintActualSum(row) {
  let sum = 0;
  let has = false;
  for (const month of row?.actualsByMonth || []) {
    if (month && month.has) {
      has = true;
      sum += Number(month.value) || 0;
    }
  }
  return { sum, has };
}

export function cmv2PrintYenKeep(row) {
  if (row?.initial !== null && row?.initial !== undefined) return true;
  if (row?.current !== null && row?.current !== undefined) return true;
  return cmv2PrintActualSum(row).has;
}

export function cmv2PrintCountKeep(row) {
  if (!row?.dayNight) return false;
  if (row.countPlan !== null && row.countPlan !== undefined) return true;
  return (row.countActual || []).some((value) => value !== null && value !== undefined);
}

export function cmv2PrintYenRemaining(current, actualSum) {
  if (current === null || current === undefined) return null;
  return current - actualSum;
}

export function cmv2PrintYenRate(current, actualSum) {
  if (current === null || current === undefined || current === 0) return null;
  return actualSum / current;
}
