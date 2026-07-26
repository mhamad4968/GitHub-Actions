import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createDetailBlockModel } from "./detail-block-model.mjs";
import { LOCK_STATES } from "./lock.mjs";
import {
  SUMMARY_COMPARED_FIELDS,
  SUMMARY_PROJECTION_STATUSES,
  checkSummaryProjection,
} from "./projection-consistency.mjs";
import { regenerateSummaryCostLines } from "./projection.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function sequentialUuidFactory() {
  let counter = 0;
  return () => `uuid-${++counter}`;
}

function projectedBlocks() {
  const model = createDetailBlockModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory: sequentialUuidFactory(),
    blocks: [
      {
        costCategory: "施工",
        workTypeCode: "K-1",
        workTypeName: "けた橋",
        detailRows: [{ name1: "塗装", unit: "㎡", quantity: "10", unitPrice: "80" }],
      },
      {
        costCategory: "保安",
        detailRows: [{ name1: "見張員", unit: "人", quantity: "2", unitPrice: "100" }],
      },
      {
        costCategory: "施工",
        status: "retired",
        hasActuals: true,
        detailRows: [{ name1: "旧工種", unit: "式", quantity: "1", unitPrice: "9" }],
      },
    ],
  });
  return model.projectionBlocks();
}

function freshCache(blocks, options = {}) {
  return regenerateSummaryCostLines(blocks, {
    contractTotal1: "2000",
    ...options,
  }).map((line) => ({ ...line }));
}

test("status catalog matches the App1 summary_projection_status DD (§field catalog)", () => {
  assert.deepEqual(SUMMARY_PROJECTION_STATUSES, ["synced", "dirty", "error"]);
  const fields = JSON.parse(read("scripts/data/jikkou-yosan-v2-app1-fields.json"));
  const options = fields.properties.summary_projection_status.options;
  assert.deepEqual(Object.keys(options).sort(), [...SUMMARY_PROJECTION_STATUSES].sort());
  // Compared columns are projection-owned; manual App1 columns are excluded.
  assert.deepEqual(SUMMARY_COMPARED_FIELDS, [
    "summary_cost_category",
    "summary_amount_excl_tax",
    "summary_tax_rate",
    "summary_amount_incl_tax",
  ]);
});

test("synced: an up-to-date cache matches the regenerated projection 1:1", () => {
  const blocks = projectedBlocks();
  const result = checkSummaryProjection({
    blocks,
    cachedLines: freshCache(blocks),
    contractTotal1: "2000",
  });
  assert.equal(result.status, "synced");
  assert.equal(result.reason, null);
  assert.deepEqual(result.differences, []);

  // kintone-style { value } wrappers and decimal spellings still sync.
  const wrapped = freshCache(blocks).map((line) => ({
    ...Object.fromEntries(
      Object.entries(line).map(([key, value]) => [key, { value }]),
    ),
    summary_amount_excl_tax: { value: `${line.summary_amount_excl_tax}.0` },
    summary_tax_rate: { value: "0.10" },
  }));
  assert.equal(
    checkSummaryProjection({ blocks, cachedLines: wrapped, contractTotal1: "2000" })
      .status,
    "synced",
  );

  // App1 DROP_DOWN「10％」と内部「0.1」は同一税率として synced。
  const labeled = freshCache(blocks).map((line) => ({
    ...line,
    summary_tax_rate: "10％",
  }));
  assert.equal(
    checkSummaryProjection({
      blocks,
      cachedLines: labeled,
      contractTotal1: "2000",
    }).status,
    "synced",
  );

  // Manual-only App1 columns (種別/計算基準/備考) never make the cache dirty
  // — they carry over via previousLines (P-33: no reverse sync into App2).
  const annotated = freshCache(blocks).map((line) => ({
    ...line,
    summary_line_type: "外注",
    summary_calc_basis: "実測",
    summary_note: "備考メモ",
  }));
  assert.equal(
    checkSummaryProjection({ blocks, cachedLines: annotated, contractTotal1: "2000" })
      .status,
    "synced",
  );
});

test("dirty: amount drift, missing/extra rows and reorders are all reported", () => {
  const blocks = projectedBlocks();
  const cache = freshCache(blocks);

  // Amount drift (e.g. 内訳 edited after the cache was saved).
  const drifted = cache.map((line, index) =>
    index === 0 ? { ...line, summary_amount_excl_tax: "801" } : { ...line },
  );
  let result = checkSummaryProjection({
    blocks,
    cachedLines: drifted,
    contractTotal1: "2000",
  });
  assert.equal(result.status, "dirty");
  assert.deepEqual(result.differences, [
    {
      type: "field_mismatch",
      stableBlockId: cache[0].summary_stable_block_id,
      field: "summary_amount_excl_tax",
      expected: "880", // 塗装 800 + 諸経費(自動 10%)80 (R-11)
      cached: "801",
    },
  ]);

  // A block that projects but has no cache row → missing_line.
  result = checkSummaryProjection({
    blocks,
    cachedLines: cache.slice(0, 1),
    contractTotal1: "2000",
  });
  assert.deepEqual(
    result.differences.map((difference) => difference.type),
    ["missing_line"],
  );
  assert.equal(result.status, "dirty");

  // A cache row whose block no longer projects (deleted/retired) → extra_line.
  result = checkSummaryProjection({
    blocks: blocks.slice(0, 1),
    cachedLines: cache,
    contractTotal1: "2000",
  });
  assert.deepEqual(
    result.differences.map((difference) => difference.type),
    ["extra_line"],
  );

  // Reordered cache rows → order_mismatch for both displaced rows.
  result = checkSummaryProjection({
    blocks,
    cachedLines: [cache[1], cache[0]],
    contractTotal1: "2000",
  });
  assert.equal(result.status, "dirty");
  assert.deepEqual(
    result.differences.map((difference) => difference.type),
    ["order_mismatch", "order_mismatch"],
  );

  // A non-decimal cached amount can never equal the regenerated one.
  result = checkSummaryProjection({
    blocks,
    cachedLines: cache.map((line, index) =>
      index === 0 ? { ...line, summary_amount_incl_tax: "N/A" } : line,
    ),
    contractTotal1: "2000",
  });
  assert.equal(result.status, "dirty");
});

test("error: the check refuses to guess over corrupt cache or block shapes", () => {
  const blocks = projectedBlocks();
  const cache = freshCache(blocks);

  let result = checkSummaryProjection({ blocks, cachedLines: "x" });
  assert.equal(result.status, "error");
  assert.match(result.reason, /must be an array/);
  assert.deepEqual(result.differences, []);

  result = checkSummaryProjection({ blocks, cachedLines: [null] });
  assert.equal(result.status, "error");
  assert.match(result.reason, /must be an object/);

  result = checkSummaryProjection({ blocks, cachedLines: [{ summary_qty: "1" }] });
  assert.equal(result.status, "error");
  assert.match(result.reason, /summary_stable_block_id is required/);

  result = checkSummaryProjection({ blocks, cachedLines: [cache[0], cache[0]] });
  assert.equal(result.status, "error");
  assert.match(result.reason, /duplicate summary_stable_block_id/);

  // Corrupt blocks make regeneration itself fail → error, never a guess.
  result = checkSummaryProjection({
    blocks: [{ status: "deleted" }],
    cachedLines: cache,
  });
  assert.equal(result.status, "error");
  assert.match(result.reason, /projection failed/);

  result = checkSummaryProjection({ cachedLines: cache });
  assert.equal(result.status, "error");
  assert.match(result.reason, /projection failed/);
});

test("phase 5 module is pure: no kintone I/O, no App 735/736, no customize/736", () => {
  const source = read("scripts/lib/jikkou-yosan-v2/projection-consistency.mjs");
  assert.doesNotMatch(source, /customize\/736/);
  assert.doesNotMatch(source, /\b73[56]\b/);
  assert.doesNotMatch(source, /kintone\.api|bulkRequest|\bfetch\s*\(/);
  assert.doesNotMatch(source, /kintone\.mjs/);
});
