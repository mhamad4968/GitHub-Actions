/**
 * 実行予算 Ver.02 — 直前版との金額増減（表示専用）。
 * ブラウザ束ね: jikkou-yosan-v2-build-desktop.mjs が ESM を剥がす。
 */
import { add, canonical, compare, subtract } from "./decimal.mjs";
import { displayInteger, detailLineAmount, decimalLineAmount } from "./calc.mjs";
import { LOCK_STATES } from "./lock.mjs";
import { createContractSalaryModel } from "./contract-salary-model.mjs";
import { createDetailBlockModel } from "./detail-block-model.mjs";
import { normalizeSummaryRowKey, regenerateSummaryCostLines } from "./projection.mjs";

function presentDelta(value) {
  return value !== undefined && value !== null && value !== "";
}

function asDec(value) {
  if (!presentDelta(value)) return null;
  const text = String(value).trim().replace(/[,，]/g, "");
  if (!text || text === "-" || text === "－") return null;
  try {
    return canonical(text);
  } catch {
    return null;
  }
}

function sameDec(left, right) {
  const a = asDec(left);
  const b = asDec(right);
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return compare(a, b) === 0;
}

function displayOrDash(value) {
  const normalized = asDec(value);
  if (normalized === null) return "－";
  const shown = displayInteger(normalized);
  if (shown === null || shown === undefined || shown === "") return "－";
  return shown;
}

export function detailDeltaKey(stableBlockId, rowKey) {
  return `${String(stableBlockId || "")}\t${String(rowKey || "")}`;
}

export function formatSignedYen(signed) {
  const rounded = displayInteger(signed);
  if (rounded === null || rounded === undefined) return "－";
  if (compare(rounded, "0") === 0) return "－";
  if (compare(rounded, "0") > 0) return `+${rounded}`;
  return String(rounded);
}

export function compareAmountDelta(current, previous, { labels = true } = {}) {
  if (!previous) {
    return Object.freeze({
      kind: "new",
      display: "－",
      signed: null,
      label: "",
      title: "前版に無い行",
    });
  }
  const curAmt = asDec(current?.amount);
  const prevAmt = asDec(previous?.amount);
  const curZ = curAmt ?? "0";
  const prevZ = prevAmt ?? "0";
  const curYen = displayInteger(curZ) ?? "0";
  const prevYen = displayInteger(prevZ) ?? "0";
  if (compare(curYen, prevYen) === 0) {
    return Object.freeze({
      kind: "same",
      display: "－",
      signed: "0",
      label: "",
      title: "変化なし",
    });
  }
  const signed = subtract(curYen, prevYen);
  const display = formatSignedYen(signed);
  if (display === "－") {
    return Object.freeze({
      kind: "same",
      display: "－",
      signed: "0",
      label: "",
      title: "変化なし",
    });
  }
  let label = "";
  if (labels) {
    const qtyChanged = !sameDec(current?.quantity, previous?.quantity);
    const priceChanged = !sameDec(current?.unitPrice, previous?.unitPrice);
    if (qtyChanged && priceChanged) label = "数量・単価";
    else if (qtyChanged) label = "数量変更";
    else if (priceChanged) label = "単価変更";
  }
  const title = [
    `金額 ${displayOrDash(previous?.amount)} → ${displayOrDash(current?.amount)}`,
    `数量 ${displayOrDash(previous?.quantity)} → ${displayOrDash(current?.quantity)}`,
    `単価 ${displayOrDash(previous?.unitPrice)} → ${displayOrDash(current?.unitPrice)}`,
    label,
  ]
    .filter(Boolean)
    .join("\n");
  return Object.freeze({
    kind: "delta",
    display,
    signed,
    label,
    title,
  });
}

function tripleFromLine(line, { percentUnit = false } = {}) {
  const quantity = presentDelta(line?.quantity) ? String(line.quantity) : null;
  const unitPrice = presentDelta(line?.unitPrice) ? String(line.unitPrice) : null;
  let amount = presentDelta(line?.amount) ? String(line.amount) : null;
  if (amount === null) {
    amount = percentUnit
      ? detailLineAmount({ quantity, unitPrice, unit: line?.unit })
      : decimalLineAmount(quantity, unitPrice);
  }
  return Object.freeze({
    quantity,
    unitPrice,
    amount: amount === null || amount === undefined ? null : String(amount),
  });
}

function previousAmountUnusable(index) {
  return Boolean(index?.unusablePrevious);
}

export function lookupAmountDelta(index, bucket, key, current, options = {}) {
  if (!index || !index.enabled) return null;
  if (previousAmountUnusable(index)) {
    return compareAmountDelta(current, null, options);
  }
  const map = index[bucket];
  const previous =
    map && typeof map.get === "function" ? map.get(String(key || "")) : undefined;
  return compareAmountDelta(current, previous, options);
}

export function lookupTotalsDelta(index, field, currentAmount) {
  if (!index || !index.enabled) return null;
  if (previousAmountUnusable(index)) {
    return compareAmountDelta({ amount: currentAmount }, null, { labels: false });
  }
  const previousAmount = index.totals ? index.totals[field] : undefined;
  return compareAmountDelta(
    { amount: currentAmount },
    previousAmount === undefined ? undefined : { amount: previousAmount },
    { labels: false },
  );
}

export function buildAmountDeltaIndex({
  contractLines = [],
  salaryLines = [],
  blocks = [],
} = {}) {
  const lockState = LOCK_STATES.FULL_LOCKED;
  const summary = createContractSalaryModel({
    lockState,
    contractLines,
    salaryLines,
  });
  const detail = createDetailBlockModel({
    lockState,
    blocks,
  });
  const summarySnap = summary.snapshot();
  const detailSnap = detail.snapshot();
  const projectionBlocks = detail.projectionBlocks();
  const totals = summary.totals(projectionBlocks);
  const projectionRows = regenerateSummaryCostLines(projectionBlocks, {
    contractTotal1: totals.total1,
    previousLines: [],
  });

  const contract = new Map();
  for (const section of Object.keys(summarySnap.contractSections || {})) {
    for (const line of summarySnap.contractSections[section] || []) {
      if (!line.rowKey) continue;
      contract.set(String(line.rowKey), tripleFromLine(line));
    }
  }
  const salary = new Map();
  for (const line of summarySnap.salaryLines || []) {
    if (!line.rowKey) continue;
    salary.set(String(line.rowKey), tripleFromLine(line));
  }
  const detailRows = new Map();
  const footer = new Map();
  for (const block of detailSnap.blocks || []) {
    const blockId = String(block.stableBlockId || "");
    for (const row of block.detailRows || []) {
      if (!row.rowKey) continue;
      detailRows.set(
        detailDeltaKey(blockId, row.rowKey),
        tripleFromLine(row, { percentUnit: true }),
      );
    }
    const footerSnap = block.footer || {};
    for (const kind of ["overhead", "insurance", "legal_welfare", "block_total"]) {
      const row = footerSnap[kind];
      if (!row) continue;
      footer.set(detailDeltaKey(blockId, kind), {
        quantity: kind === "overhead" ? String(row.ratePercent ?? "") : null,
        unitPrice: kind === "overhead" ? (row.base == null ? null : String(row.base)) : null,
        amount: row.amount == null ? null : String(row.amount),
      });
    }
  }

  const projection = new Map();
  const projectionKei = new Map();
  const keiSums = new Map();
  for (const line of projectionRows) {
    const rowKey = String(line.summary_row_key || "").trim();
    const blockId = String(line.summary_stable_block_id || "").trim();
    if (rowKey) {
      projection.set(
        rowKey,
        tripleFromLine({
          quantity: line.summary_qty,
          unitPrice: line.summary_unit_price,
          amount: line.summary_amount_excl_tax,
        }),
      );
    }
    if (!blockId) continue;
    const part = asDec(line.summary_amount_excl_tax) ?? "0";
    keiSums.set(blockId, add(keiSums.get(blockId) || "0", part));
  }
  for (const [blockId, amount] of keiSums) {
    projectionKei.set(blockId, { quantity: null, unitPrice: null, amount });
  }

  const nextTotals = Object.freeze({
    total1: totals.total1,
    construction: totals.construction,
    safety: totals.safety,
    salary: totals.salary,
    total8: totals.total8,
    profit9: totals.profit9,
    costConstruction: totals.costConstruction,
    costSafety: totals.costSafety,
  });
  return Object.freeze({
    enabled: true,
    contract,
    salary,
    detail: detailRows,
    footer,
    projection,
    projectionKei,
    totals: nextTotals,
    unusablePrevious: contractSalaryTotalsEmpty(nextTotals),
  });
}

function recordCell(record, code) {
  const field = record?.[code];
  const value = field && typeof field === "object" && "value" in field ? field.value : field;
  if (value === undefined || value === null || value === "") return null;
  return String(value).trim();
}

function isZeroYen(value) {
  const yen = displayInteger(asDec(value) ?? "0") ?? "0";
  return compare(yen, "0") === 0;
}

function contractSalaryTotalsEmpty(totals) {
  return (
    isZeroYen(totals?.construction) &&
    isZeroYen(totals?.safety) &&
    isZeroYen(totals?.total1) &&
    isZeroYen(totals?.salary)
  );
}

const STORED_TOTAL_FIELDS = Object.freeze({
  construction: "contract_construction_total",
  safety: "contract_safety_total",
  total1: "contract_total_1",
  salary: "salary_total",
  total8: "cost_total_8",
  profit9: "profit_9",
  costConstruction: "cost_construction_total",
  costSafety: "cost_safety_total",
});

export function summaryCostLinesToDeltaRows(record) {
  const field = record?.summary_cost_lines;
  const rows = Array.isArray(field?.value) ? field.value : [];
  const cell = (row, code) => {
    const value = row?.value?.[code]?.value;
    return value === undefined || value === null || value === "" ? null : String(value);
  };
  return rows.map((row) =>
    Object.freeze({
      summary_row_key: cell(row, "summary_row_key"),
      summary_stable_block_id: cell(row, "summary_stable_block_id"),
      summary_qty: cell(row, "summary_qty"),
      summary_unit_price: cell(row, "summary_unit_price"),
      summary_amount_excl_tax: cell(row, "summary_amount_excl_tax"),
      summary_cost_category: cell(row, "summary_cost_category"),
    }),
  );
}

/**
 * 版一覧 GET は SUBTABLE を落とすことがある。再計算が 0 のときだけ
 * 親の保存合計と summary_cost_lines を使う（実データ 0 は上書きしない）。
 */
export function applyAmountDeltaFallbacks(index, prevParent) {
  if (!index || !index.enabled || !prevParent) return index;
  const totals = { ...index.totals };
  for (const [key, code] of Object.entries(STORED_TOTAL_FIELDS)) {
    const stored = recordCell(prevParent, code);
    if (stored && isZeroYen(totals[key]) && !isZeroYen(stored)) {
      totals[key] = asDec(stored) ?? stored;
    }
  }

  let projection = index.projection;
  let projectionKei = index.projectionKei;
  const cached = summaryCostLinesToDeltaRows(prevParent);
  if (projection.size === 0 && cached.some((row) => row.summary_row_key || row.summary_amount_excl_tax)) {
    projection = new Map();
    projectionKei = new Map();
    const keiSums = new Map();
    let costConstruction = "0";
    let costSafety = "0";
    for (const line of cached) {
      const rowKey = normalizeSummaryRowKey(line.summary_row_key || "");
      const blockId = String(line.summary_stable_block_id || "").trim();
      if (rowKey) {
        projection.set(
          rowKey,
          tripleFromLine({
            quantity: line.summary_qty,
            unitPrice: line.summary_unit_price,
            amount: line.summary_amount_excl_tax,
          }),
        );
      }
      const part = asDec(line.summary_amount_excl_tax) ?? "0";
      if (blockId) keiSums.set(blockId, add(keiSums.get(blockId) || "0", part));
      if (line.summary_cost_category === "施工") {
        costConstruction = add(costConstruction, part);
      } else if (line.summary_cost_category === "保安") {
        costSafety = add(costSafety, part);
      }
    }
    for (const [blockId, amount] of keiSums) {
      projectionKei.set(blockId, { quantity: null, unitPrice: null, amount });
    }
    if (isZeroYen(totals.costConstruction) && !isZeroYen(costConstruction)) {
      totals.costConstruction = costConstruction;
    }
    if (isZeroYen(totals.costSafety) && !isZeroYen(costSafety)) {
      totals.costSafety = costSafety;
    }
    if (isZeroYen(totals.total8)) {
      totals.total8 = add(add(totals.costConstruction || "0", totals.costSafety || "0"), totals.salary || "0");
    }
    if (isZeroYen(totals.profit9) && !isZeroYen(totals.total1)) {
      totals.profit9 = subtract(totals.total1 || "0", totals.total8 || "0");
    }
  }

  const next = Object.freeze({
    ...index,
    projection,
    projectionKei,
    totals: Object.freeze(totals),
  });
  return Object.freeze({
    ...next,
    unusablePrevious: contractSalaryTotalsEmpty(totals),
  });
}
