import { actualMetrics, ratio } from "./calc.mjs";
import { sum } from "./decimal.mjs";
import { actualRecordKey } from "./keys.mjs";
import { allowedOperations } from "./lock.mjs";

// Phase 4d: offline 予実 (actuals) matrix for the App1 実績 tab. Pure helpers
// only — no kintone I/O. Vertical App3-shaped rows (schema §5: 1 cost row ×
// 1 month = 1 monthly_consumption record, 1 cost row = 1 final_budget record)
// are pivoted into wide month columns keyed by YYYY-MM. Current budget,
// actual total, remaining, future-required and consumption ratio are never
// stored (field catalog §3.2) — they are recomputed here via calc.actualMetrics.

// Y4: actuals rows are 施工/保安 only. 給与手当 never appears in the matrix.
export const ACTUAL_COST_CATEGORY_KEYS = Object.freeze(["施工", "保安"]);
export const ACTUAL_RECORD_KINDS = Object.freeze([
  "monthly_consumption",
  "final_budget",
]);
// Field catalog §3: initial prototype writes are manual via the App1 UI.
export const ACTUAL_SOURCE_KIND = "手入力";
export const ACTUAL_WRITE_CHANNEL = "app1_custom_ui";
export const DEFAULT_MONTH_COUNT = 12;

// Y10 editing boundary: only the 予実入力列 accept input on the actual tab.
export const ACTUAL_EDITABLE_KINDS = Object.freeze(["monthly", "finalBudget"]);
// Budget attributes + computed metrics are 表示のみ (Y10 / Imp-01: the edit
// authority for budget attributes stays on the 内訳/総括 tabs).
export const ACTUAL_READ_ONLY_FIELDS = Object.freeze([
  "blockNo",
  "costCategory",
  "workTypeCode",
  "workTypeName",
  "currentBudget",
  "actual",
  "remainingBudget",
  "futureRequired",
  "consumptionRatio",
  "bcRate",
  "ecRate",
]);

const KEY_DELIMITER = "|";
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])(?:-01)?$/;

function hasText(value) {
  return value !== undefined && value !== null && value !== "";
}

function fieldValue(record, code) {
  const field = record?.[code];
  return field && typeof field === "object" && "value" in field
    ? field.value
    : field;
}

// P-30/P-37: App3 stores 月初日; the matrix keys columns by YYYY-MM.
export function normalizeMonth(value, context = "month") {
  if (typeof value !== "string") {
    throw new TypeError(`${context}: month must be a string`);
  }
  const match = MONTH_PATTERN.exec(value.trim());
  if (!match) {
    throw new RangeError(`${context}: month must be YYYY-MM or YYYY-MM-01`);
  }
  return `${match[1]}-${match[2]}`;
}

export function monthStartDate(month) {
  return `${normalizeMonth(month)}-01`;
}

// Y5/Y6: month headers start at 着手月 (Y6b 着手連動 — startMonth arrives as an
// explicit parameter; R-17 requester confirmation stays open) and advance by
// +1 month. monthCount is Excel-observed 12 by default (fixed-vs-variable OPEN).
export function monthRange(startMonth, monthCount = DEFAULT_MONTH_COUNT) {
  const start = normalizeMonth(startMonth, "startMonth");
  if (!Number.isSafeInteger(monthCount) || monthCount < 1) {
    throw new RangeError("monthCount must be a positive safe integer");
  }
  const [year, month] = start.split("-").map(Number);
  const months = [];
  for (let index = 0; index < monthCount; index += 1) {
    const total = year * 12 + (month - 1) + index;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    months.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return Object.freeze(months);
}

function rowStateKey(stableBlockId, costCategoryKey) {
  return `${stableBlockId}${KEY_DELIMITER}${costCategoryKey}`;
}

// 整数円 (§15.3): actual amounts are integer-yen strings (tax exclusive).
function normalizedAmount(value, context) {
  if (!hasText(value)) return null;
  const text = String(value).trim();
  if (!/^[+-]?\d+$/.test(text)) {
    throw new RangeError(`${context}: amount must be an integer yen string`);
  }
  // Canonicalize -0 / leading zeros through BigInt.
  return BigInt(text).toString();
}

function assertCostCategoryKey(value, context) {
  if (!ACTUAL_COST_CATEGORY_KEYS.includes(value)) {
    throw new RangeError(`${context}: costCategoryKey must be 施工 or 保安`);
  }
  return value;
}

// Pivots vertical App3-shaped rows into { "blockId|category": { monthly:
// { "YYYY-MM": amount }, finalBudget } }. Rows whose cost_category_key is not
// 施工/保安 (e.g. 給与) are rejected — Y4 keeps salary out of actuals, so such
// rows can only be corrupt data. Duplicate keys violate the App3 unique
// actual_record_key constraint and abort the pivot.
export function pivotActualRows(rows) {
  if (!Array.isArray(rows)) throw new TypeError("rows must be an array");
  const pivot = new Map();
  const seen = new Set();
  rows.forEach((record, index) => {
    const where = `rows[${index}]`;
    const recordKind = fieldValue(record, "record_kind");
    if (!ACTUAL_RECORD_KINDS.includes(recordKind)) {
      throw new RangeError(
        `${where}: record_kind must be monthly_consumption or final_budget`,
      );
    }
    const stableBlockId = fieldValue(record, "stable_block_id");
    if (!hasText(stableBlockId)) {
      throw new RangeError(`${where}: stable_block_id is required`);
    }
    const costCategoryKey = assertCostCategoryKey(
      fieldValue(record, "cost_category_key"),
      where,
    );
    const amount = normalizedAmount(fieldValue(record, "amount"), where);
    if (amount === null) throw new RangeError(`${where}: amount is required`);
    const key = rowStateKey(stableBlockId, costCategoryKey);
    if (!pivot.has(key)) {
      pivot.set(key, {
        stableBlockId,
        costCategoryKey,
        monthly: new Map(),
        finalBudget: null,
      });
    }
    const entry = pivot.get(key);
    if (recordKind === "monthly_consumption") {
      const month = normalizeMonth(fieldValue(record, "target_month"), where);
      const cellKey = `${key}${KEY_DELIMITER}${month}`;
      if (seen.has(cellKey)) {
        throw new RangeError(`${where}: duplicate monthly cell for ${month}`);
      }
      seen.add(cellKey);
      entry.monthly.set(month, amount);
    } else {
      const cellKey = `${key}${KEY_DELIMITER}final`;
      if (seen.has(cellKey)) {
        throw new RangeError(`${where}: duplicate final_budget row`);
      }
      seen.add(cellKey);
      entry.finalBudget = amount;
    }
  });
  return pivot;
}

// Offline in-memory 予実 matrix model. Budget data (currentBudget per row)
// is NOT stored here — matrixRows(blocks) reads it live from projection-shaped
// App2 blocks, so 内訳 edits flow through without a rebuild. Actual cells
// (monthly + final) are the only mutable state, gated by editActuals.
export function createActualsMatrixModel({
  lockState,
  startMonth = null,
  monthCount = DEFAULT_MONTH_COUNT,
  actualRows = [],
} = {}) {
  const operations = allowedOperations(lockState);
  const state = pivotActualRows(actualRows);
  // Dirty tracking: only cells mutated through this model become App3 writes.
  const dirty = new Set();

  const baseMonths = startMonth === null ? [] : monthRange(startMonth, monthCount);

  function months() {
    // Data months outside the configured range stay visible (no silent loss).
    const set = new Set(baseMonths);
    for (const entry of state.values()) {
      for (const month of entry.monthly.keys()) set.add(month);
    }
    return Object.freeze([...set].sort());
  }

  function assertEditable(action) {
    if (!operations.editActuals) {
      throw new Error(`${action}: actuals are locked (${lockState})`);
    }
  }

  function entryFor(stableBlockId, costCategoryKey, context) {
    if (!hasText(stableBlockId)) {
      throw new RangeError(`${context}: stableBlockId is required`);
    }
    assertCostCategoryKey(costCategoryKey, context);
    const key = rowStateKey(stableBlockId, costCategoryKey);
    if (!state.has(key)) {
      state.set(key, {
        stableBlockId,
        costCategoryKey,
        monthly: new Map(),
        finalBudget: null,
      });
    }
    return { key, entry: state.get(key) };
  }

  function setMonthlyAmount(stableBlockId, costCategoryKey, month, amount) {
    assertEditable("setMonthlyAmount");
    const normalizedMonth = normalizeMonth(month, "setMonthlyAmount");
    const { key, entry } = entryFor(
      stableBlockId,
      costCategoryKey,
      "setMonthlyAmount",
    );
    const value = normalizedAmount(amount, "setMonthlyAmount");
    const dirtyKey = `${key}${KEY_DELIMITER}monthly${KEY_DELIMITER}${normalizedMonth}`;
    if (value === null) {
      // Clearing a cell reverts it locally; planning App3 deletes is a later
      // save-layer concern, so the cell simply stops being written.
      entry.monthly.delete(normalizedMonth);
      dirty.delete(dirtyKey);
      return null;
    }
    entry.monthly.set(normalizedMonth, value);
    dirty.add(dirtyKey);
    return value;
  }

  // Y3 案B: 最終予算額 is manual, default = 現行予算. Clearing it reverts to
  // the default (no App3 write remains pending for the row).
  function setFinalBudget(stableBlockId, costCategoryKey, amount) {
    assertEditable("setFinalBudget");
    const { key, entry } = entryFor(
      stableBlockId,
      costCategoryKey,
      "setFinalBudget",
    );
    const value = normalizedAmount(amount, "setFinalBudget");
    const dirtyKey = `${key}${KEY_DELIMITER}final`;
    entry.finalBudget = value;
    if (value === null) dirty.delete(dirtyKey);
    else dirty.add(dirtyKey);
    return value;
  }

  // Patch-style mutation used by the UI. Keys are YYYY-MM month columns or
  // "finalBudget". Every budget attribute / computed metric is rejected —
  // Y10: 予算属性は表示のみ, the actual tab never writes budget data back.
  function updateActualRow(stableBlockId, costCategoryKey, patch) {
    if (!patch || typeof patch !== "object") {
      throw new TypeError("updateActualRow: patch must be an object");
    }
    for (const key of Object.keys(patch)) {
      if (key !== "finalBudget" && !MONTH_PATTERN.test(key)) {
        throw new RangeError(
          `updateActualRow: field "${key}" is read-only on the 予実 tab (Y10)`,
        );
      }
    }
    for (const [key, value] of Object.entries(patch)) {
      if (key === "finalBudget") {
        setFinalBudget(stableBlockId, costCategoryKey, value);
      } else {
        setMonthlyAmount(stableBlockId, costCategoryKey, key, value);
      }
    }
    return rowStateKey(stableBlockId, costCategoryKey);
  }

  // Y9 (M2): BC率 = 現行予算÷①, EC率 = 最終予算額÷①. Q12/D-47: ①=0 → 0.
  // Without contract context (① unknown offline) the rates stay null → 「－」.
  function rateTo1(amount, contractTotal1) {
    if (contractTotal1 === null || contractTotal1 === undefined) return null;
    return ratio(amount, contractTotal1, { zero: "zero" });
  }

  function rowFromBlock(block, monthList, contractTotal1) {
    const key = rowStateKey(block.stableBlockId, block.costCategory);
    const entry = state.get(key);
    const retired = block.status === "retired";
    // P-39/R-11: retired blocks keep their actuals anchor but no longer carry
    // budget — the current budget contribution is 0.
    const currentBudget = retired ? "0" : block.total;
    const monthly = {};
    for (const month of monthList) {
      monthly[month] = entry?.monthly.get(month) ?? null;
    }
    const monthlyAmounts = entry ? [...entry.monthly.values()] : [];
    const finalBudgetInput = entry?.finalBudget ?? null;
    // Y3 案B: default final = current budget until manually raised.
    const finalBudget = finalBudgetInput ?? currentBudget;
    const metrics = actualMetrics({ monthlyAmounts, currentBudget, finalBudget });
    return Object.freeze({
      stableBlockId: block.stableBlockId,
      status: block.status,
      blockNo: block.blockNo ?? null,
      costCategory: block.costCategory,
      workTypeCode: block.workTypeCode ?? "",
      workTypeName: block.workTypeName ?? "",
      currentBudget,
      bcRate: rateTo1(currentBudget, contractTotal1),
      monthly: Object.freeze(monthly),
      actual: metrics.actual,
      finalBudget,
      finalBudgetManual: finalBudgetInput !== null,
      ecRate: rateTo1(finalBudget, contractTotal1),
      remainingBudget: metrics.remainingBudget,
      futureRequired: metrics.futureRequired,
      consumptionRatio: metrics.consumptionRatio,
    });
  }

  // blocks: projection-shaped App2 blocks (detailModel.projectionBlocks()).
  // Y4: only 施工/保安 rows appear — blocks without a 区分 are held back the
  // same way the summary projection holds them, and salary never enters here
  // because salary lives on App1 salary_lines, not in 内訳 blocks.
  // contractTotal1 (①, from the 総括 contract lines) feeds the Y9 BC/EC rates.
  function matrixRows(blocks, { contractTotal1 = null } = {}) {
    if (!Array.isArray(blocks)) throw new TypeError("blocks must be an array");
    const monthList = months();
    return Object.freeze(
      blocks
        .filter((block) => ACTUAL_COST_CATEGORY_KEYS.includes(block.costCategory))
        .map((block) => rowFromBlock(block, monthList, contractTotal1)),
    );
  }

  // Y7 (partial 4d scope): 施工計/保安計 column sums. 工事原価/粗利 rows are
  // deferred with the version tab (they need ⑧/給与 context on this pane).
  function sectionTotals(blocks, { contractTotal1 = null } = {}) {
    const rows = matrixRows(blocks, { contractTotal1 });
    const monthList = months();
    const totals = {};
    for (const category of ACTUAL_COST_CATEGORY_KEYS) {
      const section = rows.filter((row) => row.costCategory === category);
      const column = (pick) => sum(section.map(pick));
      const monthly = {};
      for (const month of monthList) {
        monthly[month] = column((row) => row.monthly[month] ?? "0");
      }
      const currentBudget = column((row) => row.currentBudget);
      const actual = column((row) => row.actual);
      const finalBudget = column((row) => row.finalBudget);
      totals[category] = Object.freeze({
        costCategory: category,
        currentBudget,
        bcRate: rateTo1(currentBudget, contractTotal1),
        monthly: Object.freeze(monthly),
        actual,
        finalBudget,
        ecRate: rateTo1(finalBudget, contractTotal1),
        remainingBudget: column((row) => row.remainingBudget),
        futureRequired: column((row) => row.futureRequired),
        consumptionRatio: ratio(actual, currentBudget, { zero: "not_applicable" }),
      });
    }
    return Object.freeze(totals);
  }

  // App3 write-shaped records for the cells mutated through this model
  // (schema §5 / field catalog §3). Computed values are never emitted
  // (§3.2). Version ids are audit-only (P-27) and resolved by the save
  // layer at save time — offline they default to null.
  function toApp3Records({ projectId, registeredVersionId = null } = {}) {
    const records = [];
    for (const entry of state.values()) {
      const base = {
        project_id: projectId,
        stable_block_id: entry.stableBlockId,
        cost_category_key: entry.costCategoryKey,
        source_kind: ACTUAL_SOURCE_KIND,
        write_channel: ACTUAL_WRITE_CHANNEL,
      };
      const key = rowStateKey(entry.stableBlockId, entry.costCategoryKey);
      for (const [month, amount] of [...entry.monthly.entries()].sort()) {
        if (!dirty.has(`${key}${KEY_DELIMITER}monthly${KEY_DELIMITER}${month}`)) {
          continue;
        }
        records.push(
          Object.freeze({
            ...base,
            actual_record_key: actualRecordKey({
              projectId,
              stableBlockId: entry.stableBlockId,
              costCategoryKey: entry.costCategoryKey,
              recordKind: "monthly_consumption",
              targetMonth: month,
            }),
            record_kind: "monthly_consumption",
            target_month: monthStartDate(month),
            amount,
            registered_version_id: registeredVersionId,
          }),
        );
      }
      if (entry.finalBudget !== null && dirty.has(`${key}${KEY_DELIMITER}final`)) {
        records.push(
          Object.freeze({
            ...base,
            actual_record_key: actualRecordKey({
              projectId,
              stableBlockId: entry.stableBlockId,
              costCategoryKey: entry.costCategoryKey,
              recordKind: "final_budget",
            }),
            record_kind: "final_budget",
            amount: entry.finalBudget,
            last_changed_version_id: registeredVersionId,
          }),
        );
      }
    }
    return Object.freeze(records);
  }

  return Object.freeze({
    lockState,
    allowedOperations: operations,
    months,
    setMonthlyAmount,
    setFinalBudget,
    updateActualRow,
    matrixRows,
    sectionTotals,
    toApp3Records,
  });
}
