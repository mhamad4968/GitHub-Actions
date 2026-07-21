import { blockTotals, detailLineAmount } from "./calc.mjs";
import { add } from "./decimal.mjs";
import { COMMON_UNITS } from "./contract-salary-model.mjs";
import { createRowKey, createStableBlockId } from "./keys.mjs";
import { allowedOperations } from "./lock.mjs";

// Phase 4c: offline in-memory 内訳 (App2) block editor. No kintone I/O here;
// rows only mirror the App2 catalog shape (§2) so a later save layer can map
// them 1:1. The block_total stays the single source of truth (P-21/P-33).

// row_kind catalog — exact App2 DD options (field catalog §2).
export const DETAIL_ROW_KINDS = Object.freeze([
  "block_header",
  "detail",
  "overhead",
  "insurance",
  "subtotal",
  "legal_welfare",
  "block_total",
]);

// U16: 総括共通 units + 缶/枚/％ for 内訳.
export const DETAIL_UNITS = Object.freeze([...COMMON_UNITS, "缶", "枚", "％"]);

export const BLOCK_STATUSES = Object.freeze(["active", "retired"]);

// U20 footer labels in fixed order (manual → auto totals).
export const BLOCK_FOOTER_KINDS = Object.freeze([
  "overhead",
  "insurance",
  "subtotal",
  "legal_welfare",
  "block_total",
]);
export const BLOCK_FOOTER_LABELS = Object.freeze({
  overhead: "諸経費",
  insurance: "各種保険料（任意保険）",
  subtotal: "小計",
  legal_welfare: "法定福利費",
  block_total: "計",
});
// C-U15/C-U16: only these footer amounts are manual until R-11/R-12/R-13.
export const MANUAL_FOOTER_KINDS = Object.freeze([
  "overhead",
  "insurance",
  "legal_welfare",
]);

const HEADER_EDITABLE_FIELDS = Object.freeze([
  "workTypeCode",
  "workTypeName",
  "costCategory",
  "vendorName",
]);
const DETAIL_EDITABLE_FIELDS = Object.freeze([
  "name1",
  "name2",
  "name3",
  "unit",
  "quantity",
  "unitPrice",
  "note",
]);
const COST_CATEGORIES = Object.freeze(["施工", "保安"]);

function detailHasText(value) {
  return value !== undefined && value !== null && value !== "";
}

function detailNormalizedOptional(value) {
  return detailHasText(value) ? String(value) : null;
}

function detailDefaultUuidFactory() {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  throw new Error("crypto.randomUUID unavailable — pass uuidFactory");
}

function detailAssertPatchKeys(patch, editableFields, context) {
  if (!patch || typeof patch !== "object") {
    throw new TypeError(`${context}: patch must be an object`);
  }
  for (const key of Object.keys(patch)) {
    if (!editableFields.includes(key)) {
      throw new RangeError(`${context}: field "${key}" is not editable`);
    }
  }
}

function normalizedCostCategory(value, context) {
  if (!detailHasText(value)) return null;
  const category = String(value);
  if (!COST_CATEGORIES.includes(category)) {
    throw new RangeError(`${context}: costCategory must be 施工 or 保安`);
  }
  return category;
}

function normalizedUnit(value, context) {
  if (!detailHasText(value)) return null;
  const unit = String(value);
  if (!DETAIL_UNITS.includes(unit)) {
    throw new RangeError(`${context}: unknown unit ${JSON.stringify(unit)} (U16)`);
  }
  return unit;
}

// U18/U19 (P-22): 明細金額 = ROUND(数量×単価, 0); ％行 = ROUND(単価×数量÷100, 0).
// Both quantity and unit price must be present (U7/U11), otherwise blank.
export function detailRowAmount(row) {
  return detailLineAmount({
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    unit: row.unit,
  });
}

export function createDetailBlockModel({
  lockState,
  blocks = [],
  uuidFactory = detailDefaultUuidFactory,
} = {}) {
  const operations = allowedOperations(lockState);

  function blankDetailRow() {
    return {
      rowKey: createRowKey(uuidFactory),
      name1: null,
      name2: null,
      name3: null,
      unit: null,
      quantity: null,
      unitPrice: null,
      note: null,
    };
  }

  function blankFooter() {
    // U20: full footer always exists; unused manual amounts stay blank.
    return {
      overhead: { rowKey: createRowKey(uuidFactory), amount: null },
      insurance: { rowKey: createRowKey(uuidFactory), amount: null },
      subtotal: { rowKey: createRowKey(uuidFactory) },
      legal_welfare: { rowKey: createRowKey(uuidFactory), amount: null },
      block_total: { rowKey: createRowKey(uuidFactory) },
    };
  }

  function blankBlock() {
    return {
      stableBlockId: createStableBlockId(uuidFactory),
      status: "active",
      hasActuals: false,
      headerRowKey: createRowKey(uuidFactory),
      workTypeCode: null,
      workTypeName: null,
      costCategory: null,
      vendorName: null,
      detailRows: [blankDetailRow()],
      footer: blankFooter(),
    };
  }

  const list = blocks.map((input, index) => {
    const where = `blocks[${index}]`;
    if (!input || typeof input !== "object") {
      throw new TypeError(`${where}: block must be an object`);
    }
    const status = detailHasText(input.status) ? String(input.status) : "active";
    if (!BLOCK_STATUSES.includes(status)) {
      throw new RangeError(`${where}: block_status must be active or retired`);
    }
    const block = blankBlock();
    block.stableBlockId = detailHasText(input.stableBlockId)
      ? String(input.stableBlockId)
      : block.stableBlockId;
    // Round-trip stability (P-24): rows loaded from App2 keep their original
    // header/footer row_key so a later save diffs as updates, not delete+add.
    block.headerRowKey = detailHasText(input.headerRowKey)
      ? String(input.headerRowKey)
      : block.headerRowKey;
    if (input.footerRowKeys && typeof input.footerRowKeys === "object") {
      for (const kind of BLOCK_FOOTER_KINDS) {
        if (detailHasText(input.footerRowKeys[kind])) {
          block.footer[kind].rowKey = String(input.footerRowKeys[kind]);
        }
      }
    }
    block.status = status;
    block.hasActuals = input.hasActuals === true;
    block.workTypeCode = detailNormalizedOptional(input.workTypeCode);
    block.workTypeName = detailNormalizedOptional(input.workTypeName);
    block.costCategory = normalizedCostCategory(input.costCategory, where);
    block.vendorName = detailNormalizedOptional(input.vendorName);
    const detailRows = Array.isArray(input.detailRows) ? input.detailRows : [];
    block.detailRows = detailRows.map((row) => ({
      rowKey: detailHasText(row.rowKey) ? String(row.rowKey) : createRowKey(uuidFactory),
      name1: detailNormalizedOptional(row.name1),
      name2: detailNormalizedOptional(row.name2),
      name3: detailNormalizedOptional(row.name3),
      unit: normalizedUnit(row.unit, where),
      quantity: detailNormalizedOptional(row.quantity),
      unitPrice: detailNormalizedOptional(row.unitPrice),
      note: detailNormalizedOptional(row.note),
    }));
    // U8/U12: a block always has at least one detail row.
    if (block.detailRows.length === 0) block.detailRows.push(blankDetailRow());
    for (const kind of MANUAL_FOOTER_KINDS) {
      const camel = kind === "legal_welfare" ? "legalWelfare" : kind;
      block.footer[kind].amount = detailNormalizedOptional(input[camel]);
    }
    return block;
  });

  function assertEditable(action) {
    if (!operations.editBudget) {
      throw new Error(`${action}: budget is locked (${lockState})`);
    }
  }

  function findBlock(stableBlockId, context) {
    const index = list.findIndex((block) => block.stableBlockId === stableBlockId);
    if (index < 0) {
      throw new RangeError(`${context}: unknown stableBlockId ${stableBlockId}`);
    }
    return { index, block: list[index] };
  }

  function findDetail(block, rowKey, context) {
    const index = block.detailRows.findIndex((row) => row.rowKey === rowKey);
    if (index < 0) throw new RangeError(`${context}: unknown detail rowKey ${rowKey}`);
    return { index, row: block.detailRows[index] };
  }

  // U14: 内訳№ is display-order 1..n over active blocks (retired blocks are
  // listed apart per P-39 and carry no №).
  function blockNoByStableId() {
    const numbers = new Map();
    let no = 0;
    for (const block of list) {
      numbers.set(block.stableBlockId, block.status === "active" ? ++no : null);
    }
    return numbers;
  }

  // U25: 小計 = 明細金額計 + 諸経費 + 各種保険料; 計 = 小計 + 法定福利費.
  // Blank manual amounts count as 0 but stay blank on screen.
  function computedTotals(block) {
    const detailAmounts = block.detailRows
      .map((row) => detailRowAmount(row))
      .filter((amount) => amount !== null);
    return blockTotals({
      detailAmounts,
      overhead: block.footer.overhead.amount,
      insurance: block.footer.insurance.amount,
      legalWelfare: block.footer.legal_welfare.amount,
    });
  }

  // U13/U24: rows with a blank 1st column inherit the group of the closest
  // row above that has one. Recomputed on every snapshot, so reorders and
  // deletes re-attach groups automatically. U27: display column stays blank.
  function nameSpecGroups(block) {
    let group = null;
    return block.detailRows.map((row) => {
      if (detailHasText(row.name1)) group = row.name1;
      return group;
    });
  }

  function snapshotBlock(block, blockNo) {
    const totals = computedTotals(block);
    const groups = nameSpecGroups(block);
    return Object.freeze({
      stableBlockId: block.stableBlockId,
      status: block.status,
      hasActuals: block.hasActuals,
      blockNo,
      headerRowKey: block.headerRowKey,
      workTypeCode: block.workTypeCode,
      workTypeName: block.workTypeName,
      costCategory: block.costCategory,
      vendorName: block.vendorName,
      detailRows: Object.freeze(
        block.detailRows.map((row, rowIndex) =>
          Object.freeze({
            ...row,
            nameSpecGroup: groups[rowIndex],
            amount: detailRowAmount(row),
          }),
        ),
      ),
      footer: Object.freeze({
        overhead: Object.freeze({ ...block.footer.overhead }),
        insurance: Object.freeze({ ...block.footer.insurance }),
        subtotal: Object.freeze({
          rowKey: block.footer.subtotal.rowKey,
          amount: totals.subtotal,
        }),
        legal_welfare: Object.freeze({ ...block.footer.legal_welfare }),
        block_total: Object.freeze({
          rowKey: block.footer.block_total.rowKey,
          amount: totals.total,
        }),
      }),
    });
  }

  function snapshot() {
    const numbers = blockNoByStableId();
    return Object.freeze({
      lockState,
      allowedOperations: operations,
      blocks: Object.freeze(
        list.map((block) => snapshotBlock(block, numbers.get(block.stableBlockId))),
      ),
    });
  }

  // Q8 uniform passthrough (M3): when every detail row shares one unit and
  // one unit price, the block can project as 単位×数量計×単価 instead of
  // 式×1×計 — but only when 数量×単価 reproduces the block_total exactly
  // (金額整合 is the Q8 body: manual footer amounts or per-row rounding
  // drift force the 式×1×計 fallback so displayed 数量×単価 never lies).
  function uniformUnitProjection(block, totals) {
    const rows = block.detailRows;
    if (rows.length === 0) return null;
    const { unit, unitPrice } = rows[0];
    if (!detailHasText(unit) || !detailHasText(unitPrice)) return null;
    for (const row of rows) {
      if (row.unit !== unit || row.unitPrice !== unitPrice) return null;
      if (!detailHasText(row.quantity)) return null;
    }
    for (const kind of MANUAL_FOOTER_KINDS) {
      if (block.footer[kind].amount !== null) return null;
    }
    const quantity = rows
      .map((row) => row.quantity)
      .reduce((total, value) => add(total, value));
    const passthroughAmount = detailLineAmount({ quantity, unitPrice, unit });
    if (passthroughAmount !== totals.total) return null;
    return { unit, quantity, unitPrice };
  }

  // Projection input for regenerateSummaryCostLines / summaryTotals (P-21/Q8).
  // Uniform-unit blocks pass 単位/数量/単価 through to the summary; every
  // other block projects as 式 × 1 × block_total (mixedUnits). Active blocks
  // without a 区分 cannot land in a 施工/保安 summary row yet, so they are
  // held back and reported through categoryWarnings (U29 keeps the save
  // non-blocking).
  function projectionBlocks() {
    const numbers = blockNoByStableId();
    return Object.freeze(
      list
        .filter((block) => block.status === "retired" || block.costCategory !== null)
        .map((block) => {
          const totals = computedTotals(block);
          const uniform = uniformUnitProjection(block, totals);
          return Object.freeze({
            stableBlockId: block.stableBlockId,
            status: block.status,
            costCategory: block.costCategory,
            workTypeCode: block.workTypeCode ?? "",
            workTypeName: block.workTypeName ?? "",
            blockNo: numbers.get(block.stableBlockId),
            mixedUnits: uniform === null,
            ...(uniform ?? {}),
            total: totals.total,
          });
        }),
    );
  }

  // U29: `No.nの区分が未入力です` red-text warnings (never blocks saving).
  function categoryWarnings() {
    const numbers = blockNoByStableId();
    return Object.freeze(
      list
        .filter((block) => block.status === "active" && block.costCategory === null)
        .map(
          (block) => `No.${numbers.get(block.stableBlockId)}の区分が未入力です`,
        ),
    );
  }

  // Flat App2-catalog-shaped rows (§2). budget_version_id stays null offline;
  // the save layer fills it and derives detail_record_key (P-24/P-25).
  function toApp2Rows() {
    const numbers = blockNoByStableId();
    const rows = [];
    list.forEach((block, blockIndex) => {
      const totals = computedTotals(block);
      const groups = nameSpecGroups(block);
      const base = {
        budget_version_id: null,
        stable_block_id: block.stableBlockId,
        block_no: numbers.get(block.stableBlockId),
        block_sort_order: blockIndex + 1,
        block_status: block.status,
        cost_category_key: block.costCategory ?? "",
      };
      let sort = 0;
      const push = (row) => rows.push(Object.freeze({ ...base, row_sort_order: sort++, ...row }));
      push({
        row_kind: "block_header",
        row_key: block.headerRowKey,
        work_type_code: block.workTypeCode ?? "",
        work_type_name: block.workTypeName ?? "",
        vendor_name: block.vendorName ?? "",
      });
      block.detailRows.forEach((row, rowIndex) => {
        push({
          row_kind: "detail",
          row_key: row.rowKey,
          name_1: row.name1 ?? "",
          name_2: row.name2 ?? "",
          name_3: row.name3 ?? "",
          name_spec_group: groups[rowIndex] ?? "",
          unit: row.unit ?? "",
          quantity: row.quantity ?? "",
          unit_price: row.unitPrice ?? "",
          amount: detailRowAmount(row) ?? "",
          note: row.note ?? "",
        });
      });
      push({
        row_kind: "overhead",
        row_key: block.footer.overhead.rowKey,
        amount: block.footer.overhead.amount ?? "",
      });
      push({
        row_kind: "insurance",
        row_key: block.footer.insurance.rowKey,
        amount: block.footer.insurance.amount ?? "",
      });
      push({
        row_kind: "subtotal",
        row_key: block.footer.subtotal.rowKey,
        amount: totals.subtotal,
      });
      push({
        row_kind: "legal_welfare",
        row_key: block.footer.legal_welfare.rowKey,
        amount: block.footer.legal_welfare.amount ?? "",
      });
      push({
        row_kind: "block_total",
        row_key: block.footer.block_total.rowKey,
        amount: totals.total,
      });
    });
    return Object.freeze(rows);
  }

  return Object.freeze({
    lockState,
    allowedOperations: operations,
    detailUnits: DETAIL_UNITS,

    addBlock() {
      assertEditable("addBlock");
      const block = blankBlock();
      list.push(block);
      return block.stableBlockId;
    },
    // P-39: physical delete only while the block has no actuals; otherwise
    // the block must be retired so past actuals keep their anchor.
    removeBlock(stableBlockId) {
      assertEditable("removeBlock");
      const { index, block } = findBlock(stableBlockId, "removeBlock");
      if (block.hasActuals) {
        throw new RangeError(
          "removeBlock: block has actuals — use retireBlock (P-39)",
        );
      }
      list.splice(index, 1);
    },
    retireBlock(stableBlockId) {
      assertEditable("retireBlock");
      const { block } = findBlock(stableBlockId, "retireBlock");
      block.status = "retired";
    },
    // U14: reorder renumbers 内訳№ by display order (snapshot recomputes).
    moveBlock(stableBlockId, offset) {
      assertEditable("moveBlock");
      if (offset !== 1 && offset !== -1) {
        throw new RangeError("moveBlock: offset must be +1 or -1");
      }
      const { index } = findBlock(stableBlockId, "moveBlock");
      const target = index + offset;
      if (target < 0 || target >= list.length) return;
      [list[index], list[target]] = [list[target], list[index]];
    },
    updateBlockHeader(stableBlockId, patch) {
      assertEditable("updateBlockHeader");
      detailAssertPatchKeys(patch, HEADER_EDITABLE_FIELDS, "updateBlockHeader");
      const { block } = findBlock(stableBlockId, "updateBlockHeader");
      for (const [key, value] of Object.entries(patch)) {
        block[key] =
          key === "costCategory"
            ? normalizedCostCategory(value, "updateBlockHeader")
            : detailNormalizedOptional(value);
      }
      return stableBlockId;
    },

    addDetailRow(stableBlockId) {
      assertEditable("addDetailRow");
      const { block } = findBlock(stableBlockId, "addDetailRow");
      const row = blankDetailRow();
      block.detailRows.push(row);
      return row.rowKey;
    },
    updateDetailRow(stableBlockId, rowKey, patch) {
      assertEditable("updateDetailRow");
      detailAssertPatchKeys(patch, DETAIL_EDITABLE_FIELDS, "updateDetailRow");
      const { block } = findBlock(stableBlockId, "updateDetailRow");
      const { row } = findDetail(block, rowKey, "updateDetailRow");
      for (const [key, value] of Object.entries(patch)) {
        row[key] =
          key === "unit"
            ? normalizedUnit(value, "updateDetailRow")
            : detailNormalizedOptional(value);
      }
      return rowKey;
    },
    removeDetailRow(stableBlockId, rowKey) {
      assertEditable("removeDetailRow");
      const { block } = findBlock(stableBlockId, "removeDetailRow");
      const { index } = findDetail(block, rowKey, "removeDetailRow");
      if (block.detailRows.length <= 1) {
        throw new RangeError(
          "removeDetailRow: each block keeps at least 1 detail row (U12)",
        );
      }
      block.detailRows.splice(index, 1);
    },
    // U23: reorder stays inside the detail band; the footer is fixed.
    moveDetailRow(stableBlockId, rowKey, offset) {
      assertEditable("moveDetailRow");
      if (offset !== 1 && offset !== -1) {
        throw new RangeError("moveDetailRow: offset must be +1 or -1");
      }
      const { block } = findBlock(stableBlockId, "moveDetailRow");
      const { index } = findDetail(block, rowKey, "moveDetailRow");
      const target = index + offset;
      if (target < 0 || target >= block.detailRows.length) return;
      const rows = block.detailRows;
      [rows[index], rows[target]] = [rows[target], rows[index]];
    },

    // U20/U25: 小計・計 are system totals — only the manual footer amounts
    // (諸経費・各種保険料・法定福利費) accept input.
    updateFooterAmount(stableBlockId, kind, amount) {
      assertEditable("updateFooterAmount");
      if (!MANUAL_FOOTER_KINDS.includes(kind)) {
        throw new RangeError(
          `updateFooterAmount: ${kind} is not manually editable (U25)`,
        );
      }
      const { block } = findBlock(stableBlockId, "updateFooterAmount");
      block.footer[kind].amount = detailNormalizedOptional(amount);
      return stableBlockId;
    },

    snapshot,
    projectionBlocks,
    categoryWarnings,
    toApp2Rows,
  });
}
