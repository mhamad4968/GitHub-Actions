import { compare } from "./decimal.mjs";
import {
  normalizeSummaryRowKey,
  normalizeSummaryTaxRate,
  regenerateSummaryCostLines,
} from "./projection.mjs";

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

function projectionLineKey(line, index) {
  const raw = String(
    projectionLineFieldValue(line, "summary_row_key") ?? "",
  ).trim();
  // kintone SINGLE_LINE_TEXT は末尾タブを落とす。6欄へ戻してから突合する。
  if (raw) return `row:${normalizeSummaryRowKey(raw)}`;
  const stableBlockId = String(
    projectionLineFieldValue(line, "summary_stable_block_id") ?? "",
  ).trim();
  if (stableBlockId) return `block:${stableBlockId}`;
  return `index:${index}`;
}

function projectionLineFieldValue(line, code) {
  const field = line?.[code];
  return field && typeof field === "object" && "value" in field
    ? field.value
    : field;
}

function valuesDiffer(field, expected, cached) {
  if (field === "summary_tax_rate") {
    return (
      normalizeSummaryTaxRate(expected) !== normalizeSummaryTaxRate(cached)
    );
  }
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
    const stableBlockId = projectionLineFieldValue(line, "summary_stable_block_id");
    if (typeof stableBlockId !== "string" || !stableBlockId) {
      return errorResult(
        `cachedLines[${index}]: summary_stable_block_id is required`,
      );
    }
    cached.push({ key: projectionLineKey(line, index), stableBlockId, line });
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
  const cachedByKey = new Map(
    cached.map((entry, index) => [entry.key, { ...entry, index }]),
  );
  if (cachedByKey.size !== cached.length) {
    return errorResult("cachedLines contain duplicate summary row keys");
  }
  expectedLines.forEach((expected, index) => {
    const expectedKey = projectionLineKey(expected, index);
    const entry = cachedByKey.get(expectedKey);
    if (!entry) {
      differences.push(
        Object.freeze({
          type: "missing_line",
          stableBlockId: expected.summary_stable_block_id,
          rowKey: expected.summary_row_key ?? "",
        }),
      );
      return;
    }
    cachedByKey.delete(expectedKey);
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
      const cachedValue = projectionLineFieldValue(entry.line, field);
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
  for (const [, leftover] of cachedByKey) {
    differences.push(
      Object.freeze({
        type: "extra_line",
        stableBlockId: leftover.stableBlockId,
      }),
    );
  }
  return Object.freeze({
    status: differences.length === 0 ? "synced" : "dirty",
    reason: null,
    differences: Object.freeze(differences),
  });
}
