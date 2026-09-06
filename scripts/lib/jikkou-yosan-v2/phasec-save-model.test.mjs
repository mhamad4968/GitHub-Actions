import assert from "node:assert/strict";
import test from "node:test";

import { createDetailBlockModel } from "./detail-block-model.mjs";
import { LOCK_STATES } from "./lock.mjs";
import { planAtomicBudgetSave } from "./planner.mjs";
import {
  app2RecordsToBlocks,
  buildDetailSaveInputs,
  detailRowToRecord,
  fetchExistingDetailRows,
} from "./save-model.mjs";

const APP1 = 756;
const APP2 = 757;
const KEYS = Object.freeze({
  projectId: "prj-test",
  projectBusinessKey: "T-001|",
  budgetVersionId: "bv-test",
});

let uuidCounter = 0;
const uuidFactory = () => `uuid-${++uuidCounter}`;

function sampleModel() {
  const model = createDetailBlockModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory,
  });
  const blockId = model.addBlock();
  model.updateBlockHeader(blockId, {
    workTypeCode: "D01",
    workTypeName: "土工",
    costCategory: "施工",
    vendorName: "テスト建設",
  });
  const rowKey = model.snapshot().blocks[0].detailRows[0].rowKey;
  model.updateDetailRow(blockId, rowKey, {
    name1: "掘削",
    unit: "㎡",
    quantity: "10",
    unitPrice: "1500",
  });
  return model;
}

function existingRecord(id, revision, rowKey) {
  return {
    $id: { value: String(id) },
    $revision: { value: String(revision) },
    row_key: { value: rowKey },
    budget_version_id: { value: KEYS.budgetVersionId },
  };
}

test("detailRowToRecord fills keys, channel and lock snapshot", () => {
  const rows = sampleModel().toApp2Rows();
  const header = rows.find((row) => row.row_kind === "block_header");
  const record = detailRowToRecord(header, KEYS);
  assert.equal(record.detail_record_key.value, `bv-test|${header.row_key}`);
  assert.equal(record.project_id.value, "prj-test");
  assert.equal(record.budget_version_id.value, "bv-test");
  assert.equal(record.write_channel.value, "app1_custom_ui");
  assert.equal(record.parent_lock_snapshot.value, "editable");
  assert.equal(record.block_no.value, "1");
  assert.ok(!("retired_at_version_id" in record));
  assert.ok(!("calc_basis" in record));
});

test("detail_record_key over kintone's 64-char unique limit aborts", () => {
  const rows = sampleModel().toApp2Rows();
  const longKeys = {
    ...KEYS,
    budgetVersionId: `bv-${"x".repeat(70)}`,
  };
  assert.throws(() => detailRowToRecord(rows[0], longKeys), /64-char/);
});

test("detail rows carry the ROUND(qty×price) amount", () => {
  const rows = sampleModel().toApp2Rows();
  const detail = rows.find((row) => row.row_kind === "detail");
  const record = detailRowToRecord(detail, KEYS);
  assert.equal(record.amount.value, "15000");
  const blockTotal = rows.find((row) => row.row_kind === "block_total");
  assert.equal(detailRowToRecord(blockTotal, KEYS).amount.value, "16500");
  const overhead = rows.find((row) => row.row_kind === "overhead");
  assert.equal(detailRowToRecord(overhead, KEYS).amount.value, "1500");
});

test("all-new rows become adds; nothing is updated or deleted", () => {
  const rows = sampleModel().toApp2Rows();
  const inputs = buildDetailSaveInputs({
    app1Id: APP1,
    app2Id: APP2,
    parentRecordId: "9",
    parentRevision: "4",
    keys: KEYS,
    rows,
    existingRecords: [],
  });
  assert.equal(inputs.detailAdds.length, rows.length);
  assert.equal(inputs.detailUpdates.length, 0);
  assert.equal(inputs.detailDeletes.length, 0);
  assert.equal(inputs.parentPut.payload.app, APP1);
  assert.equal(inputs.parentPut.payload.revision, "4");
  const plan = planAtomicBudgetSave(inputs);
  assert.equal(plan.operation, "atomic_budget_save");
});

test("row_key matching splits updates and deletes with revisions", () => {
  const rows = sampleModel().toApp2Rows();
  const keptKey = rows[0].row_key;
  const inputs = buildDetailSaveInputs({
    app1Id: APP1,
    app2Id: APP2,
    parentRecordId: "9",
    parentRevision: "4",
    keys: KEYS,
    rows,
    existingRecords: [
      existingRecord(101, 7, keptKey),
      existingRecord(102, 3, "row-gone"),
    ],
  });
  assert.equal(inputs.detailUpdates.length, 1);
  assert.deepEqual(
    { id: inputs.detailUpdates[0].id, revision: inputs.detailUpdates[0].revision },
    { id: "101", revision: "7" },
  );
  assert.equal(inputs.detailAdds.length, rows.length - 1);
  assert.deepEqual(inputs.detailDeletes, [{ id: "102", revision: "3" }]);
  const plan = planAtomicBudgetSave(inputs);
  assert.ok(plan.requestCount >= 4);
});

test("duplicate row_key in existing records aborts", () => {
  const rows = sampleModel().toApp2Rows();
  assert.throws(
    () =>
      buildDetailSaveInputs({
        app1Id: APP1,
        app2Id: APP2,
        parentRecordId: "9",
        parentRevision: "4",
        keys: KEYS,
        rows,
        existingRecords: [existingRecord(1, 1, "dup"), existingRecord(2, 1, "dup")],
      }),
    /duplicate row_key/,
  );
});

test("missing parent revision (CAS) aborts", () => {
  assert.throws(
    () =>
      buildDetailSaveInputs({
        app1Id: APP1,
        app2Id: APP2,
        parentRecordId: "9",
        parentRevision: "",
        keys: KEYS,
        rows: [],
        existingRecords: [],
      }),
    /parentRevision/,
  );
});

test("forbidden app ids are rejected", () => {
  assert.throws(
    () =>
      buildDetailSaveInputs({
        app1Id: 736,
        app2Id: APP2,
        parentRecordId: "9",
        parentRevision: "1",
        keys: KEYS,
        rows: [],
        existingRecords: [],
      }),
    /FORBIDDEN/,
  );
});

test("uchiwake fields round-trip on detail rows", () => {
  const model = sampleModel();
  const block = model.snapshot().blocks[0];
  model.updateDetailRow(block.stableBlockId, block.detailRows[0].rowKey, {
    name1: "外注費",
    name2: "材料費",
    nameDetail: "塗料",
    nameItem: "塗料用シンナー",
    lineVendorName: "協力A",
    linePersonName: "",
  });
  const detail = model.toApp2Rows().find((row) => row.row_kind === "detail");
  assert.equal(detail.name_detail, "塗料");
  assert.equal(detail.name_item, "塗料用シンナー");
  assert.equal(detail.line_vendor_name, "協力A");
  const rec = detailRowToRecord(detail, KEYS);
  assert.equal(rec.name_detail.value, "塗料");
  assert.equal(rec.line_vendor_name.value, "協力A");
  const blocks = app2RecordsToBlocks([
    {
      ...rec,
      $id: { value: "1" },
      $revision: { value: "1" },
    },
  ]);
  assert.equal(blocks[0].detailRows[0].nameDetail, "塗料");
  assert.equal(blocks[0].detailRows[0].nameItem, "塗料用シンナー");
  assert.equal(blocks[0].detailRows[0].lineVendorName, "協力A");
});

test("LIVE records round-trip: reload then save diffs as pure updates", () => {
  const rows = sampleModel().toApp2Rows();
  const liveRecords = rows.map((row, index) => ({
    ...detailRowToRecord(row, KEYS),
    $id: { value: String(200 + index) },
    $revision: { value: "1" },
  }));
  const blocks = app2RecordsToBlocks(liveRecords);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].workTypeName, "土工");
  const reloaded = createDetailBlockModel({
    lockState: LOCK_STATES.EDITABLE,
    blocks,
    uuidFactory,
  });
  const inputs = buildDetailSaveInputs({
    app1Id: APP1,
    app2Id: APP2,
    parentRecordId: "9",
    parentRevision: "4",
    keys: KEYS,
    rows: reloaded.toApp2Rows(),
    existingRecords: liveRecords,
  });
  assert.equal(inputs.detailAdds.length, 0);
  assert.equal(inputs.detailDeletes.length, 0);
  assert.equal(inputs.detailUpdates.length, rows.length);
});

test("fetchExistingDetailRows pages by 500 until a short page", async () => {
  const calls = [];
  const page = (count, startId) =>
    Array.from({ length: count }, (_, i) => existingRecord(startId + i, 1, `row-${startId + i}`));
  const api = async (url, method, params) => {
    calls.push(params);
    return { records: calls.length === 1 ? page(500, 1) : page(2, 501) };
  };
  const records = await fetchExistingDetailRows(api, APP2, "bv-test");
  assert.equal(records.length, 502);
  assert.equal(calls.length, 2);
  assert.match(calls[0].query, /offset 0/);
  assert.match(calls[1].query, /offset 500/);
  assert.match(calls[0].query, /budget_version_id = "bv-test"/);
});

test("fetchExistingDetailRows rejects quoted version ids and forbidden apps", async () => {
  const api = async () => ({ records: [] });
  await assert.rejects(
    () => fetchExistingDetailRows(api, APP2, 'bv"x'),
    /double quotes/,
  );
  await assert.rejects(() => fetchExistingDetailRows(api, 735, "bv-test"), /FORBIDDEN/);
});
