import { displayInteger, ratio, taxInclusive } from "./calc.mjs";

// P-21/P-33/P-39 (schema §3.3): App2 block_total is the single source of truth.
// summary_cost_lines is a regenerable display cache in App1. Amounts must never
// be synced back from App1 into App2.
export const SUMMARY_FIELD_PREFIX = "summary_";
export const SUMMARY_DEFAULT_TAX_RATE = "0.1";
export const SUMMARY_COST_CATEGORIES = Object.freeze(["施工", "保安"]);
export const SUMMARY_MIXED_UNIT = "式";

function presentValue(value) {
  return value !== undefined && value !== null && value !== "";
}

/**
 * App1 DROP_DOWN は「0％/8％/10％」、画面・計算は「0/0.08/0.1」。
 * 移行・キャッシュどちらが来ても計算可能な小数税率へ揃える。
 */
export function normalizeSummaryTaxRate(
  rate,
  fallback = SUMMARY_DEFAULT_TAX_RATE,
) {
  const raw = String(rate ?? "")
    .trim()
    .replace(/%/g, "％");
  if (!raw) return fallback;
  if (raw === "0" || raw === "0％") return "0";
  if (raw === "0.08" || raw === "8" || raw === "8％") return "0.08";
  if (
    raw === "0.1" ||
    raw === "0.10" ||
    raw === "10" ||
    raw === "10％"
  ) {
    return "0.1";
  }
  return fallback;
}

function projectionSortValue(block, index) {
  if (presentValue(block.blockSortOrder)) return Number(block.blockSortOrder);
  if (presentValue(block.blockNo)) return Number(block.blockNo);
  return index;
}

function validateProjectionBlock(block, index) {
  const where = `blocks[${index}]`;
  if (!block || typeof block !== "object") {
    throw new TypeError(`${where}: block must be an object`);
  }
  if (block.status !== "active" && block.status !== "retired") {
    throw new RangeError(`${where}: status must be active or retired`);
  }
  if (block.status !== "active") return;
  if (typeof block.stableBlockId !== "string" || !block.stableBlockId) {
    throw new RangeError(`${where}: stableBlockId is required`);
  }
  if (!SUMMARY_COST_CATEGORIES.includes(block.costCategory)) {
    throw new RangeError(`${where}: costCategory must be 施工 or 保安`);
  }
  if (typeof block.total !== "string" || !block.total) {
    throw new RangeError(`${where}: total (block_total) is required`);
  }
}

function assertProjectionWritesSummaryOnly(row) {
  for (const key of Object.keys(row)) {
    if (!key.startsWith(SUMMARY_FIELD_PREFIX)) {
      throw new Error(
        `projection produced non-summary field "${key}" — reverse sync into App2 is forbidden (P-33)`,
      );
    }
  }
  return row;
}

// Regenerates the App1 summary_cost_lines cache from in-memory App2 blocks.
// Read-only output: rows are frozen and contain only summary_* field codes.
// - retired blocks are excluded (P-39: current budget 0)
// - 内訳№ / sort order are renumbered from display order (U14)
// - mixed-unit blocks project as 式 × 1 × block_total (Q8)
// - previousLines carries over App1 manual-only columns (種別/計算基準/備考)
export function regenerateSummaryCostLines(
  blocks,
  {
    contractTotal1 = null,
    defaultTaxRate = SUMMARY_DEFAULT_TAX_RATE,
    previousLines = [],
  } = {},
) {
  if (!Array.isArray(blocks)) {
    throw new TypeError("blocks must be an array");
  }
  blocks.forEach(validateProjectionBlock);
  const previousByBlockId = new Map(
    previousLines.map((line) => [line.summary_stable_block_id, line]),
  );
  const active = blocks
    .map((block, index) => ({ block, sortValue: projectionSortValue(block, index), index }))
    .filter((entry) => entry.block.status === "active")
    .sort((a, b) => a.sortValue - b.sortValue || a.index - b.index);

  return Object.freeze(
    active.map(({ block }, displayIndex) => {
      const previous = previousByBlockId.get(block.stableBlockId) || {};
      const uniform =
        block.mixedUnits !== true &&
        presentValue(block.unit) &&
        presentValue(block.quantity) &&
        presentValue(block.unitPrice);
      const taxRate = normalizeSummaryTaxRate(
        presentValue(previous.summary_tax_rate)
          ? previous.summary_tax_rate
          : presentValue(block.taxRate)
            ? block.taxRate
            : defaultTaxRate,
        defaultTaxRate,
      );
      // P-22/Y10: 原価行金額は円整数。移行データの半端円は Excel ROUND で揃える。
      const amountExcl = displayInteger(block.total);
      const row = Object.freeze({
        summary_stable_block_id: block.stableBlockId,
        summary_block_no: displayIndex + 1,
        summary_cost_category: block.costCategory,
        summary_work_type_code: block.workTypeCode ?? "",
        summary_work_type_name: block.workTypeName ?? "",
        summary_line_type: block.lineType ?? previous.summary_line_type ?? "",
        summary_unit: uniform ? block.unit : SUMMARY_MIXED_UNIT,
        summary_qty: uniform ? block.quantity : "1",
        summary_unit_price: uniform
          ? block.unitPrice
          : amountExcl,
        summary_amount_excl_tax: amountExcl,
        summary_tax_rate: taxRate,
        summary_amount_incl_tax: taxInclusive(amountExcl, taxRate),
        summary_rate_to_1:
          contractTotal1 === null
            ? null
            : ratio(amountExcl, contractTotal1, { zero: "zero" }),
        summary_calc_basis:
          block.calcBasis ?? previous.summary_calc_basis ?? "",
        summary_note: block.note ?? previous.summary_note ?? "",
        summary_sort_order: displayIndex + 1,
      });
      return assertProjectionWritesSummaryOnly(row);
    }),
  );
}
