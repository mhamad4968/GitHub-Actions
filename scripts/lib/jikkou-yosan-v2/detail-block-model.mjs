import {
  blockTotals,
  detailLineAmount,
  legalWelfareFromLaborAmounts,
  overheadFromDetails,
} from "./calc.mjs";
import { add, sum } from "./decimal.mjs";
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
// C-U16: 手入力のフッタ金額。諸経費(overhead)は R-11、法定福利費(legal_welfare)は
// R-12 で自動確定したため手入力から除外(読取専用)。各種保険料(insurance)のみ手入力
// （R-13 CONFIRMED 2026-07-29: 計算式なし・手入力のみ）。
export const MANUAL_FOOTER_KINDS = Object.freeze(["insurance"]);

// R-12: 法定福利費の対象費目（name1 厳密一致。外注労務費は含めない）。
export const LEGAL_WELFARE_NAME1 = "労務費";

// U27 (2026-07-29): 直前と同値の継続は空欄ではなく「〃」を表示・保存する。
export const DITTO_MARK = "〃";
export const DITTO_NAME_FIELDS = Object.freeze(["name1", "name2", "name3"]);

export function isDittoMark(value) {
  return detailHasText(value) && String(value).trim() === DITTO_MARK;
}

/** 行 index の field を、〃／空を遡って実値に解決する（ブロック内のみ）。 */
export function resolveContinuedField(rows, index, field) {
  if (!Array.isArray(rows) || index < 0) return null;
  for (let i = index; i >= 0; i -= 1) {
    const raw = rows[i]?.[field];
    if (!detailHasText(raw)) continue;
    if (isDittoMark(raw)) continue;
    return String(raw).trim();
  }
  return null;
}

/**
 * 直前と同値の継続行を「〃」に正規化する。
 * - name1/name2: 同値、または空で継承できる継続 → 〃（真の未設定＝上に実値が無い空は空のまま）
 * - name3: 同値のときだけ 〃。空は空のまま（定義なしと継承を混同しない）
 */
export function normalizeContinuedFieldsToDitto(
  rows,
  fields = DITTO_NAME_FIELDS,
) {
  if (!Array.isArray(rows)) return rows;
  for (const field of fields) {
    const emptyBecomesDitto = field === "name1" || field === "name2";
    let prevResolved = null;
    for (const row of rows) {
      const raw = row[field];
      if (isDittoMark(raw)) {
        if (!prevResolved) row[field] = null;
        continue;
      }
      if (!detailHasText(raw)) {
        if (emptyBecomesDitto && prevResolved) row[field] = DITTO_MARK;
        continue;
      }
      const text = String(raw).trim();
      if (prevResolved && text === prevResolved) {
        row[field] = DITTO_MARK;
      } else {
        prevResolved = text;
      }
    }
  }
  return rows;
}

// R-11: 諸経費率 = 10%（依頼者確定 2026-07-26）。表示用の百分率も併記。
export const OVERHEAD_RATE = "0.1";
export const OVERHEAD_RATE_PERCENT = "10";

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
  // R-11: 諸経費は自動 = ROUND(明細金額合計 × 10%, 0)。明細金額が無ければ空欄。
  // R-12: 法定福利費は自動 = 費目「労務費」の明細金額合計。対象が無ければ空欄。
  // 手入力の各種保険料が空なら 0 扱い(表示は空白のまま)。
  function computedTotals(block) {
    const detailAmounts = block.detailRows
      .map((row) => detailRowAmount(row))
      .filter((amount) => amount !== null);
    const overheadBase = detailAmounts.length ? sum(detailAmounts) : null;
    const overhead = overheadFromDetails(detailAmounts, OVERHEAD_RATE);
    const laborAmounts = block.detailRows
      .map((row, rowIndex) => ({
        name1: resolveContinuedField(block.detailRows, rowIndex, "name1"),
        amount: detailRowAmount(row),
      }))
      .filter(
        (row) => row.name1 === LEGAL_WELFARE_NAME1 && row.amount !== null,
      )
      .map((row) => row.amount);
    const legalWelfare = legalWelfareFromLaborAmounts(laborAmounts);
    return {
      ...blockTotals({
        detailAmounts,
        overhead,
        insurance: block.footer.insurance.amount,
        legalWelfare,
      }),
      overhead,
      overheadBase,
      legalWelfare,
    };
  }

  // U13/U24: rows with a blank/〃 1st column inherit the group of the closest
  // row above that has a real value. Recomputed on every snapshot.
  // U27: 継続は保存・表示とも「〃」（空欄表示は廃止）。
  function nameSpecGroups(block) {
    let group = null;
    return block.detailRows.map((row) => {
      if (detailHasText(row.name1) && !isDittoMark(row.name1)) {
        group = String(row.name1).trim();
      }
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
        // R-11: 諸経費は自動(読取専用)。case B: 根拠(base=明細合計, rate=10%)も公開。
        overhead: Object.freeze({
          rowKey: block.footer.overhead.rowKey,
          amount: totals.overhead,
          base: totals.overheadBase,
          rate: OVERHEAD_RATE,
          ratePercent: OVERHEAD_RATE_PERCENT,
        }),
        insurance: Object.freeze({ ...block.footer.insurance }),
        subtotal: Object.freeze({
          rowKey: block.footer.subtotal.rowKey,
          amount: totals.subtotal,
        }),
        // R-12: 法定福利費は自動(読取専用)。保存値は再計算で上書き。
        legal_welfare: Object.freeze({
          rowKey: block.footer.legal_welfare.rowKey,
          amount: totals.legalWelfare,
        }),
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

  function isDetailRowFullyEmpty(row) {
    return (
      !detailHasText(row.name1) &&
      !detailHasText(row.name2) &&
      !detailHasText(row.name3) &&
      !detailHasText(row.unit) &&
      !detailHasText(row.quantity) &&
      !detailHasText(row.unitPrice) &&
      !detailHasText(row.note)
    );
  }

  function blockHasMeaningfulContent(block) {
    if (
      detailHasText(block.workTypeCode) ||
      detailHasText(block.workTypeName) ||
      detailHasText(block.costCategory) ||
      detailHasText(block.vendorName)
    ) {
      return true;
    }
    for (const row of block.detailRows) {
      if (!isDetailRowFullyEmpty(row)) return true;
    }
    for (const kind of MANUAL_FOOTER_KINDS) {
      if (detailHasText(block.footer[kind].amount)) return true;
    }
    return false;
  }

  // U28: prune empty detail rows / blank blocks before save; renumber display order.
  // U27: 同値連続の費目/種別/定義は「〃」に正規化してから保存する。
  function prepareForSave() {
    for (let blockIndex = list.length - 1; blockIndex >= 0; blockIndex -= 1) {
      const block = list[blockIndex];
      const emptyRows = block.detailRows.filter(isDetailRowFullyEmpty);
      const nonEmptyRows = block.detailRows.filter((row) => !isDetailRowFullyEmpty(row));
      if (nonEmptyRows.length === 0) {
        block.detailRows = emptyRows.slice(0, 1);
        if (block.detailRows.length === 0) block.detailRows.push(blankDetailRow());
      } else {
        block.detailRows = [...nonEmptyRows, ...emptyRows.slice(0, 1)];
      }
      normalizeContinuedFieldsToDitto(block.detailRows);
      if (!blockHasMeaningfulContent(block)) {
        list.splice(blockIndex, 1);
      }
    }
    if (list.length === 0) {
      list.push(blankBlock());
    }
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
        amount: totals.overhead ?? "",
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
        amount: totals.legalWelfare ?? "",
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
    // Excel枠の位置合わせ用: 指定ブロックの直後へ移動（同一なら何もしない）。
    // afterStableBlockId が null/空なら先頭へ。
    moveBlockAfter(stableBlockId, afterStableBlockId) {
      assertEditable("moveBlockAfter");
      const { index } = findBlock(stableBlockId, "moveBlockAfter");
      const afterId =
        afterStableBlockId == null || afterStableBlockId === ""
          ? null
          : String(afterStableBlockId);
      if (afterId && afterId === String(stableBlockId)) {
        throw new RangeError(
          "moveBlockAfter: afterStableBlockId must differ from stableBlockId",
        );
      }
      let insertAt = 0;
      if (afterId) {
        const afterIndex = list.findIndex(
          (block) => block.stableBlockId === afterId,
        );
        if (afterIndex < 0) {
          throw new RangeError(
            `moveBlockAfter: unknown afterStableBlockId ${afterId}`,
          );
        }
        insertAt = afterIndex + 1;
      }
      if (index === insertAt || index + 1 === insertAt) return;
      const [block] = list.splice(index, 1);
      if (index < insertAt) insertAt -= 1;
      list.splice(insertAt, 0, block);
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
    prepareForSave,
    toApp2Rows,
  });
}
