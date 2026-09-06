import { displayInteger, ratio, taxInclusive } from "./calc.mjs";
import { add, divideAndRound, sum } from "./decimal.mjs";

// P-21/P-33/P-39 (schema §3.3): App2 block_total is the single source of truth.
// summary_cost_lines is a regenerable display cache in App1. Amounts must never
// be synced back from App1 into App2.
export const SUMMARY_FIELD_PREFIX = "summary_";
export const SUMMARY_DEFAULT_TAX_RATE = "0.1";
export const SUMMARY_COST_CATEGORIES = Object.freeze(["施工", "保安"]);
export const SUMMARY_MIXED_UNIT = "式";
export const SUMMARY_FOOTER_OVERHEAD = "諸経費";
export const SUMMARY_FOOTER_LEGAL_WELFARE = "法定福利費";
export const SUMMARY_DASH_VENDOR = "－";

function summaryLineTypeFromDetail(himoku, typeName) {
  if (
    himoku === SUMMARY_FOOTER_OVERHEAD ||
    himoku === SUMMARY_FOOTER_LEGAL_WELFARE
  ) {
    if (!typeName || typeName === "－") return himoku;
  }
  return typeName;
}

function textOrEmpty(value) {
  return presentValue(value) ? String(value).trim() : "";
}

/** 2026-09-05 統括 §2.8 — 備考引き継ぎ用。ジャンプ用 ID とは別。 */
export const SUMMARY_ROW_KEY_PARTS = 6;

export function buildSummaryRowKey({
  blockId,
  himoku = "",
  typeName = "",
  vendorName = "",
  personName = "",
  footerKind = "",
}) {
  return [
    textOrEmpty(blockId),
    textOrEmpty(himoku),
    textOrEmpty(typeName),
    textOrEmpty(vendorName),
    textOrEmpty(personName),
    textOrEmpty(footerKind),
  ].join("\t");
}

/** kintone SINGLE_LINE_TEXT が末尾タブを落とすので、読取時に6欄へ戻す。 */
export function normalizeSummaryRowKey(key) {
  const parts = String(key ?? "").split("\t");
  while (parts.length < SUMMARY_ROW_KEY_PARTS) parts.push("");
  return parts.slice(0, SUMMARY_ROW_KEY_PARTS).join("\t");
}

function isSalaryHimoku(himoku) {
  return textOrEmpty(himoku) === "給与手当";
}

function isSalaryWorkTypeName(name) {
  return textOrEmpty(name).includes("給与手当");
}

/** 総括の氏名列に出す系統（分割キーは保存値。表示はこれ）。 */
export function summaryPersonColumnVisible(himoku, typeName) {
  const h = textOrEmpty(himoku);
  const t = textOrEmpty(typeName);
  if (h === "労務費" || h === "外注労務費") return true;
  if (h === "外注費" && t === "労務費") return true;
  if (t.includes("建設機械オペレーター") || t.includes("その他労務者")) return true;
  return false;
}

function resolveSummaryVendor(line, block) {
  const lineVendor = textOrEmpty(line.lineVendorName);
  if (lineVendor) return lineVendor;
  const blockVendor = textOrEmpty(block.vendorName);
  if (!blockVendor || blockVendor === SUMMARY_DASH_VENDOR || blockVendor === "-") {
    return "";
  }
  return blockVendor;
}

function uniqueMaterialName(materials) {
  const names = [
    ...new Set(materials.map((name) => textOrEmpty(name)).filter(Boolean)),
  ];
  return names.length === 1 ? names[0] : "";
}

function numericQuantity(value) {
  if (!presentValue(value)) return null;
  const text = String(value).trim().replace(/[,，]/g, "");
  if (!/^[+-]?\d+(?:\.\d*)?$/.test(text)) return null;
  return text;
}

function aggregateQtyUnitPrice(unitSamples, qtySamples, amountExcl) {
  const units = unitSamples.map((unit) => textOrEmpty(unit));
  const firstUnit = units[0] || "";
  const allUnitsSame = firstUnit !== "" && units.every((unit) => unit === firstUnit);
  const qtys = qtySamples.map((qty) => numericQuantity(qty));
  const allQtyNumeric = qtys.every((qty) => qty !== null);
  if (!allUnitsSame || !allQtyNumeric) {
    return { unit: SUMMARY_MIXED_UNIT, qty: "1", unitPrice: amountExcl };
  }
  const qtyTotal = sum(qtys);
  if (!presentValue(qtyTotal) || qtyTotal === "0") {
    return { unit: SUMMARY_MIXED_UNIT, qty: "1", unitPrice: amountExcl };
  }
  return {
    unit: firstUnit,
    qty: qtyTotal,
    unitPrice: divideAndRound(amountExcl, qtyTotal, 0),
  };
}

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

function finishSummaryRow(
  partial,
  {
    block,
    previous,
    contractTotal1,
    defaultTaxRate,
    blockNo,
  },
) {
  const taxRate = normalizeSummaryTaxRate(
    presentValue(previous.summary_tax_rate)
      ? previous.summary_tax_rate
      : presentValue(block.taxRate)
        ? block.taxRate
        : defaultTaxRate,
    defaultTaxRate,
  );
  const amountExcl = partial.summary_amount_excl_tax;
  return {
    summary_stable_block_id: block.stableBlockId,
    summary_block_no: blockNo,
    summary_cost_category: block.costCategory,
    summary_work_type_code: block.workTypeCode ?? "",
    summary_work_type_name: block.workTypeName ?? "",
    summary_vendor_name: partial.summary_vendor_name ?? "",
    summary_person_name: partial.summary_person_name ?? "",
    summary_row_key: partial.summary_row_key ?? "",
    summary_line_type: partial.summary_line_type ?? "",
    summary_material_name: partial.summary_material_name ?? "",
    summary_unit: partial.summary_unit,
    summary_qty: partial.summary_qty,
    summary_unit_price: partial.summary_unit_price,
    summary_amount_excl_tax: amountExcl,
    summary_tax_rate: taxRate,
    summary_amount_incl_tax: taxInclusive(amountExcl, taxRate),
    summary_rate_to_1:
      contractTotal1 === null
        ? null
        : ratio(amountExcl, contractTotal1, { zero: "zero" }),
    summary_calc_basis: partial.summary_calc_basis ?? "",
    summary_note: partial.summary_note ?? "",
    summary_sort_order: 0,
  };
}

function projectLegacyOneRow(block, blockNo, options) {
  const { previousByBlockId, contractTotal1, defaultTaxRate } = options;
  const previous = previousByBlockId.get(block.stableBlockId) || {};
  const uniform =
    block.mixedUnits !== true &&
    presentValue(block.unit) &&
    presentValue(block.quantity) &&
    presentValue(block.unitPrice);
  const amountExcl = displayInteger(block.total);
  return finishSummaryRow(
    {
      summary_line_type: block.lineType ?? previous.summary_line_type ?? "",
      summary_material_name: previous.summary_material_name ?? "",
      summary_unit: uniform ? block.unit : SUMMARY_MIXED_UNIT,
      summary_qty: uniform ? block.quantity : "1",
      summary_unit_price: uniform ? block.unitPrice : amountExcl,
      summary_amount_excl_tax: amountExcl,
      summary_calc_basis: block.calcBasis ?? previous.summary_calc_basis ?? "",
      summary_note: block.note ?? previous.summary_note ?? "",
    },
    { block, previous, contractTotal1, defaultTaxRate, blockNo },
  );
}

function projectSplitBlock(block, blockNo, options) {
  const { previousByRowKey, contractTotal1, defaultTaxRate } = options;
  if (isSalaryWorkTypeName(block.workTypeName)) return [];

  const groups = [];
  const indexByKey = new Map();
  for (const line of block.lines) {
    if (!line || typeof line !== "object") continue;
    const himoku = textOrEmpty(line.himoku ?? line.name1);
    if (isSalaryHimoku(himoku)) continue;
    if (himoku === SUMMARY_FOOTER_OVERHEAD) continue;
    const typeName = textOrEmpty(line.typeName ?? line.name2);
    const vendorName = resolveSummaryVendor(line, block);
    const storedPerson = textOrEmpty(line.linePersonName ?? line.personName);
    const amount = displayInteger(line.amount ?? line.total);
    if (
      !himoku &&
      !typeName &&
      !vendorName &&
      !storedPerson &&
      amount === null
    ) {
      continue;
    }
    const key = buildSummaryRowKey({
      blockId: block.stableBlockId,
      himoku,
      typeName,
      vendorName,
      personName: storedPerson,
      footerKind: "",
    });
    let group = indexByKey.get(key);
    if (!group) {
      group = {
        himoku,
        typeName,
        vendorName,
        storedPerson,
        materials: [],
        units: [],
        qtys: [],
        amounts: [],
      };
      indexByKey.set(key, group);
      groups.push(group);
    }
    group.materials.push(line.materialName ?? line.nameItem ?? "");
    group.units.push(line.unit ?? "");
    group.qtys.push(line.quantity ?? "");
    if (amount !== null) group.amounts.push(amount);
  }

  const rows = groups.map((group) => {
    const amountExcl =
      group.amounts.length === 0 ? "0" : sum(group.amounts.map(String));
    const qtyUnit = aggregateQtyUnitPrice(group.units, group.qtys, amountExcl);
    const rowKey = buildSummaryRowKey({
      blockId: block.stableBlockId,
      himoku: group.himoku,
      typeName: group.typeName,
      vendorName: group.vendorName,
      personName: group.storedPerson,
      footerKind: "",
    });
    const previous = previousByRowKey.get(normalizeSummaryRowKey(rowKey)) || {};
    return finishSummaryRow(
      {
        summary_row_key: rowKey,
        summary_vendor_name: group.vendorName,
        summary_person_name: summaryPersonColumnVisible(
          group.himoku,
          group.typeName,
        )
          ? group.storedPerson
          : "",
        summary_line_type: summaryLineTypeFromDetail(
          group.himoku,
          group.typeName,
        ),
        summary_material_name: uniqueMaterialName(group.materials),
        summary_unit: qtyUnit.unit,
        summary_qty: qtyUnit.qty,
        summary_unit_price: qtyUnit.unitPrice,
        summary_amount_excl_tax: amountExcl,
        summary_note: previous.summary_note ?? "",
      },
      { block, previous, contractTotal1, defaultTaxRate, blockNo },
    );
  });

  if (block.costCategory === "施工") {
    const amount = displayInteger(block.overheadAmount);
    if (amount !== null && amount !== "0") {
      const rowKey = buildSummaryRowKey({
        blockId: block.stableBlockId,
        himoku: "",
        typeName: SUMMARY_FOOTER_OVERHEAD,
        vendorName: "",
        personName: "",
        footerKind: "overhead",
      });
      const previous = previousByRowKey.get(normalizeSummaryRowKey(rowKey)) || {};
      rows.push(
        finishSummaryRow(
          {
            summary_row_key: rowKey,
            summary_vendor_name: "",
            summary_person_name: "",
            summary_line_type: SUMMARY_FOOTER_OVERHEAD,
            summary_material_name: "",
            summary_unit: SUMMARY_MIXED_UNIT,
            summary_qty: "1",
            summary_unit_price: amount,
            summary_amount_excl_tax: amount,
            summary_note: previous.summary_note ?? "",
          },
          { block, previous, contractTotal1, defaultTaxRate, blockNo },
        ),
      );
    }
  }

  return rows;
}

// Regenerates the App1 summary_cost_lines cache from in-memory App2 blocks.
// Read-only output: rows are frozen and contain only summary_* field codes.
// - retired blocks are excluded (P-39: current budget 0)
// - 内訳№ / sort order are renumbered from display order (U14)
// - mixed-unit blocks project as 式 × 1 × block_total (Q8)
// - previousLines carries 備考（split は summary_row_key、legacy は block id）
// - `block.lines` があるときだけ 2026-09-05 複合キー分割（段階1）。無いときは現行1行。
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
  const previousByRowKey = new Map(
    previousLines
      .filter((line) => presentValue(line.summary_row_key))
      .map((line) => [normalizeSummaryRowKey(line.summary_row_key), line]),
  );
  const active = blocks
    .map((block, index) => ({ block, sortValue: projectionSortValue(block, index), index }))
    .filter((entry) => entry.block.status === "active")
    .sort((a, b) => a.sortValue - b.sortValue || a.index - b.index);

  const collected = [];
  let blockNo = 0;
  const shared = {
    previousByBlockId,
    previousByRowKey,
    contractTotal1,
    defaultTaxRate,
  };
  for (const { block } of active) {
    const split = Array.isArray(block.lines);
    const rows = split
      ? projectSplitBlock(block, blockNo + 1, shared)
      : [projectLegacyOneRow(block, blockNo + 1, shared)];
    if (rows.length === 0) continue;
    blockNo += 1;
    collected.push(
      ...rows.map((row) => ({
        ...row,
        summary_block_no: blockNo,
      })),
    );
  }

  return Object.freeze(
    collected.map((row, displayIndex) => {
      const next = {
        ...row,
        summary_sort_order: displayIndex + 1,
      };
      return Object.freeze(assertProjectionWritesSummaryOnly(next));
    }),
  );
}
