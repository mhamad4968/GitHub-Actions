import { compare } from "./decimal.mjs";
import { regenerateSummaryCostLines } from "./projection.mjs";

// Phase 5 M4: offline consistency check between the App1 summary_cost_lines
// display cache and the projection regenerated from the active App2 blocks
// (P-21/P-33: block_total is the single source of truth, the cache is only a
// regenerable display artifact). The result maps 1:1 onto the App1
// `summary_projection_status` dropdown (synced / dirty / error) so a future
// confirm-reject flow can decide whether the cache may be trusted. Pure —
// no kintone I/O, nothing is written anywhere.

export const SUMMARY_PROJECTION_STATUSES = Object.freeze([
  "synced",
  "dirty",
  "error",
]);

// Amount-bearing columns owned by the projection. Manual-only App1 columns
// (種別/計算基準/備考) are carried over from the cache itself and therefore
// can never make it dirty.
export const SUMMARY_COMPARED_FIELDS = Object.freeze([
  "summary_cost_category",
  "summary_amount_excl_tax",
  "summary_tax_rate",
  "summary_amount_incl_tax",
]);

const DECIMAL_FIELDS = new Set([
  "summary_amount_excl_tax",
  "summary_tax_rate",
  "summary_amount_incl_tax",
]);

function fieldValue(line, code) {
  const field = line?.[code];
  return field && typeof field === "object" && "value" in field
    ? field.value
    : field;
}

function valuesDiffer(field, expected, cached) {
  if (DECIMAL_FIELDS.has(field)) {
    try {
      return compare(String(expected), String(cached)) !== 0;
    } catch {
      // A non-decimal cached amount can never equal the regenerated one.
      return true;
    }
  }
  return String(expected ?? "") !== String(cached ?? "");
}

// Compares the regenerated projection (from projection-shaped blocks, e.g.
// detailModel.projectionBlocks()) with the cached summary_cost_lines rows.
// Returns { status, differences, reason } where status is one of
// SUMMARY_PROJECTION_STATUSES:
// - synced: cache rows match the regenerated rows 1:1 (id, order, amounts)
// - dirty:  the cache must be regenerated before it can be displayed/saved
// - error:  the check itself could not run (corrupt blocks/cache shape) —
//           differences are unknown, callers must treat the cache as unusable
export function checkSummaryProjection({
  blocks,
  cachedLines,
  contractTotal1 = null,
} = {}) {
  const errorResult = (reason) =>
    Object.freeze({ status: "error", reason, differences: Object.freeze([]) });
  if (!Array.isArray(cachedLines)) {
    return errorResult("cachedLines must be an array");
  }
  const cached = [];
  for (let index = 0; index < cachedLines.length; index += 1) {
    const line = cachedLines[index];
    if (!line || typeof line !== "object") {
      return errorResult(`cachedLines[${index}] must be an object`);
    }
    const stableBlockId = fieldValue(line, "summary_stable_block_id");
    if (typeof stableBlockId !== "string" || !stableBlockId) {
      return errorResult(
        `cachedLines[${index}]: summary_stable_block_id is required`,
      );
    }
    cached.push({ stableBlockId, line });
  }
  let expectedLines;
  try {
    // The cache itself feeds previousLines so App1 manual-only columns carry
    // over unchanged and never count as projection drift.
    expectedLines = regenerateSummaryCostLines(blocks, {
      contractTotal1,
      previousLines: cached.map(({ line }) => line),
    });
  } catch (error) {
    return errorResult(`projection failed: ${error.message}`);
  }

  const differences = [];
  const cachedByBlockId = new Map(
    cached.map((entry, index) => [entry.stableBlockId, { ...entry, index }]),
  );
  if (cachedByBlockId.size !== cached.length) {
    return errorResult("cachedLines contain duplicate summary_stable_block_id");
  }
  expectedLines.forEach((expected, index) => {
    const entry = cachedByBlockId.get(expected.summary_stable_block_id);
    if (!entry) {
      differences.push(
        Object.freeze({
          type: "missing_line",
          stableBlockId: expected.summary_stable_block_id,
        }),
      );
      return;
    }
    cachedByBlockId.delete(expected.summary_stable_block_id);
    if (entry.index !== index) {
      differences.push(
        Object.freeze({
          type: "order_mismatch",
          stableBlockId: expected.summary_stable_block_id,
          expected: index + 1,
          cached: entry.index + 1,
        }),
      );
    }
    for (const field of SUMMARY_COMPARED_FIELDS) {
      const cachedValue = fieldValue(entry.line, field);
      if (valuesDiffer(field, expected[field], cachedValue)) {
        differences.push(
          Object.freeze({
            type: "field_mismatch",
            stableBlockId: expected.summary_stable_block_id,
            field,
            expected: expected[field],
            cached: cachedValue ?? null,
          }),
        );
      }
    }
  });
  // Cache rows whose block no longer projects (deleted/retired) are stale.
  for (const [stableBlockId] of cachedByBlockId) {
    differences.push(Object.freeze({ type: "extra_line", stableBlockId }));
  }
  return Object.freeze({
    status: differences.length === 0 ? "synced" : "dirty",
    reason: null,
    differences: Object.freeze(differences),
  });
}
