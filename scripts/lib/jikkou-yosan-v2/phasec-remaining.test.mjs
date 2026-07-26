import assert from "node:assert/strict";
import test from "node:test";

import { createContractSalaryModel } from "./contract-salary-model.mjs";
import { createDetailBlockModel } from "./detail-block-model.mjs";
import { LOCK_STATES } from "./lock.mjs";
import { planVersionCopy } from "./planner.mjs";
import {
  app1RecordToSummaryLines,
  app1RecordToProjectionPreviousLines,
  buildDetailSaveInputs,
  detailRowToRecord,
  projectionRowsToSubtable,
  summarySnapshotToSubtables,
} from "./save-model.mjs";
import { regenerateSummaryCostLines } from "./projection.mjs";
import { buildVersionCopyInputs } from "./version-copy-model.mjs";
import { createVersionSeriesModel } from "./version-series-model.mjs";

const APP1 = 756;
const APP2 = 757;
let uuidCounter = 0;
const uuidFactory = () => `u${String(++uuidCounter).padStart(4, "0")}`;

// ---------------------------------------------------------------------------
// 残A: 総括サブテーブル
// ---------------------------------------------------------------------------

function summaryModel() {
  const model = createContractSalaryModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory,
  });
  const constructionKey = model.snapshot().contractSections["施工"][0].rowKey;
  model.updateContractLine(constructionKey, {
    workName: "橋梁架設",
    unit: "式",
    quantity: "1",
    unitPrice: "5000000",
  });
  const salaryKey = model.snapshot().salaryLines[0].rowKey;
  model.updateSalaryLine(salaryKey, {
    role: "現場代理人",
    personName: "山田太郎",
    quantity: "2",
    unitPrice: "650000",
  });
  return model;
}

test("残A: summary snapshot converts to App1 subtable values with amounts", () => {
  const subtables = summarySnapshotToSubtables(summaryModel().snapshot());
  const contractRows = subtables.contract_lines.value;
  // 施工1行 + 保安1行（空行は維持される D-16）
  assert.equal(contractRows.length, 2);
  const first = contractRows[0].value;
  assert.equal(first.contract_work_name.value, "橋梁架設");
  assert.equal(first.contract_amount.value, "5000000");
  assert.equal(first.contract_sort_order.value, "1");
  const salaryRows = subtables.salary_lines.value;
  assert.equal(salaryRows.length, 1);
  assert.equal(salaryRows[0].value.salary_amount.value, "1300000");
  assert.equal(salaryRows[0].value.salary_person_name.value, "山田太郎");
});

test("残A: App1 record round-trips back into the summary model", () => {
  const original = summaryModel();
  const subtables = summarySnapshotToSubtables(original.snapshot());
  const lines = app1RecordToSummaryLines(subtables);
  const reloaded = createContractSalaryModel({
    lockState: LOCK_STATES.EDITABLE,
    contractLines: lines.contractLines.filter((line) => line.section),
    salaryLines: lines.salaryLines,
    uuidFactory,
  });
  const a = original.snapshot();
  const b = reloaded.snapshot();
  assert.deepEqual(b.totals, a.totals);
  assert.equal(
    b.contractSections["施工"][0].rowKey,
    a.contractSections["施工"][0].rowKey,
  );
  assert.equal(b.salaryLines[0].rowKey, a.salaryLines[0].rowKey);
  assert.equal(b.salaryLines[0].personName, "山田太郎");
});

test("残A: projectionRowsToSubtable writes summary_cost_lines (種別手入力を含む)", () => {
  const detail = createDetailBlockModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory,
    blocks: [
      {
        costCategory: "施工",
        workTypeCode: "K-1",
        workTypeName: "けた橋",
        detailRows: [{ name1: "塗装", unit: "㎡", quantity: "10", unitPrice: "80" }],
      },
    ],
  });
  const blocks = detail.projectionBlocks();
  const rows = regenerateSummaryCostLines(blocks, {
    contractTotal1: "1000",
    previousLines: [
      {
        summary_stable_block_id: blocks[0].stableBlockId,
        summary_line_type: "外注",
        summary_calc_basis: "実測",
        summary_note: "メモ",
      },
    ],
  });
  const field = projectionRowsToSubtable(rows);
  assert.ok(field.summary_cost_lines, "must key by summary_cost_lines, not bare value");
  assert.equal(field.value, undefined);
  const cell = field.summary_cost_lines.value[0].value;
  assert.equal(cell.summary_line_type.value, "外注");
  assert.equal(cell.summary_calc_basis.value, "実測");
  assert.equal(cell.summary_note.value, "メモ");
  const previous = app1RecordToProjectionPreviousLines(field);
  assert.equal(previous[0].summary_line_type, "外注");
});

test("残A: subtables ride the parentPut of an atomic detail save", () => {
  const parentRecord = summarySnapshotToSubtables(summaryModel().snapshot());
  const inputs = buildDetailSaveInputs({
    app1Id: APP1,
    app2Id: APP2,
    parentRecordId: "2",
    parentRevision: "5",
    parentRecord,
    keys: {
      projectId: "prj-x",
      projectBusinessKey: "X-1|",
      budgetVersionId: "bv-x",
    },
    rows: [],
    existingRecords: [],
  });
  assert.equal(
    inputs.parentPut.payload.record.contract_lines.value.length,
    2,
  );
});

// ---------------------------------------------------------------------------
// 残B: 版複製入力生成
// ---------------------------------------------------------------------------

function liveApp2Records(budgetVersionId, count) {
  return Array.from({ length: count }, (_, index) => ({
    $id: { value: String(300 + index) },
    $revision: { value: "2" },
    detail_record_key: { value: `${budgetVersionId}|row-${index}` },
    budget_version_id: { value: budgetVersionId },
    project_id: { value: "prj-x" },
    project_business_key: { value: "X-1|" },
    stable_block_id: { value: "blk-1" },
    row_key: { value: `row-${index}` },
    row_kind: { value: index === 0 ? "block_header" : "detail" },
    block_no: { value: "1" },
    block_sort_order: { value: "1" },
    row_sort_order: { value: String(index) },
    block_status: { value: "active" },
    parent_lock_snapshot: { value: "editable" },
    write_channel: { value: "app1_custom_ui" },
    amount: { value: index === 0 ? "" : "1000" },
  }));
}

function confirmedSeries() {
  return createVersionSeriesModel({
    records: [
      {
        project_id: { value: "prj-x" },
        version_seq: { value: "1" },
        version_type: { value: "当初" },
        status: { value: "版確定" },
        budget_version_id: { value: "bv-old" },
      },
    ],
    uuidFactory,
  });
}

function oldParent() {
  return {
    id: "2",
    revision: "6",
    record: {
      project_id: { value: "prj-x" },
      project_business_key: { value: "X-1|" },
      project_code: { value: "X-1" },
      project_name: { value: "テスト工事" },
      safety_rule_88: { value: "無" },
      budget_version_id: { value: "bv-old" },
      version_seq: { value: "1" },
      status: { value: "版確定" },
      contract_lines: {
        value: [
          {
            id: "9",
            value: { contract_row_key: { value: "cr-1" }, contract_section: { value: "施工" } },
          },
        ],
      },
    },
  };
}

test("残B: buildVersionCopyInputs produces a valid planVersionCopy input", () => {
  const versions = confirmedSeries();
  const version = versions.listVersions("prj-x")[0];
  const oldRows = liveApp2Records("bv-old", 3);
  const plan = versions.planNextVersionDraft(version, oldRows.length);
  const inputs = buildVersionCopyInputs({
    app1Id: APP1,
    app2Id: APP2,
    plan,
    oldParent: oldParent(),
    oldDetailRecords: oldRows,
  });
  const bulkPlan = planVersionCopy(inputs);
  assert.equal(bulkPlan.operation, "version_copy");
  assert.equal(bulkPlan.rowCount, 3);
  // 2 + copy1チャンク + lock1チャンク
  assert.equal(bulkPlan.requests.length, 4);

  const newParent = inputs.newParentCreate.payload.record;
  assert.equal(newParent.version_seq.value, "2");
  assert.equal(newParent.status.value, "下書き");
  assert.equal(newParent.version_type.value, "仕様変更");
  assert.equal(newParent.source_record_id.value, "2");
  assert.equal(newParent.budget_version_id.value, plan.budgetVersionId);
  // サブテーブル複写は行 id を落とす
  assert.equal(newParent.contract_lines.value[0].id, undefined);
  assert.equal(
    newParent.contract_lines.value[0].value.contract_row_key.value,
    "cr-1",
  );

  const copied = inputs.newDetailRecords[1];
  assert.equal(copied.budget_version_id.value, plan.budgetVersionId);
  assert.equal(copied.row_key.value, "row-1");
  assert.equal(copied.detail_record_key.value, `${plan.budgetVersionId}|row-1`);
  assert.equal(copied.parent_lock_snapshot.value, "editable");
  assert.equal(inputs.oldDetailLockUpdates[1].id, "301");
  assert.equal(
    inputs.oldDetailLockUpdates[1].record.parent_lock_snapshot.value,
    "locked",
  );
});

test("残B: 実績複製は計画不能（P-28）・行数不一致は abort", () => {
  const versions = confirmedSeries();
  const version = versions.listVersions("prj-x")[0];
  assert.throws(
    () => versions.planNextVersionDraft(version, 3, { copyActuals: true }),
    /P-28/,
  );
  const plan = versions.planNextVersionDraft(version, 3);
  assert.throws(
    () =>
      buildVersionCopyInputs({
        app1Id: APP1,
        app2Id: APP2,
        plan,
        oldParent: oldParent(),
        oldDetailRecords: liveApp2Records("bv-old", 2),
      }),
    /detailRowCount/,
  );
});

test("残B: forbidden apps and unknown version types abort", () => {
  const versions = confirmedSeries();
  const version = versions.listVersions("prj-x")[0];
  const plan = versions.planNextVersionDraft(version, 1);
  const args = {
    app1Id: APP1,
    app2Id: APP2,
    plan,
    oldParent: oldParent(),
    oldDetailRecords: liveApp2Records("bv-old", 1),
  };
  assert.throws(() => buildVersionCopyInputs({ ...args, app1Id: 735 }), /FORBIDDEN/);
  assert.throws(
    () => buildVersionCopyInputs({ ...args, versionType: "謎の種別" }),
    /versionType/,
  );
});

// detailRowToRecord は残Aの親レコード変更に影響されないことの回帰
test("残: detailRowToRecord still rejects 65+ char keys", () => {
  const model = createDetailBlockModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory,
  });
  model.addBlock();
  const rows = model.toApp2Rows();
  assert.throws(
    () =>
      detailRowToRecord(rows[0], {
        projectId: "p",
        projectBusinessKey: "p|",
        budgetVersionId: "x".repeat(70),
      }),
    /64-char/,
  );
});
