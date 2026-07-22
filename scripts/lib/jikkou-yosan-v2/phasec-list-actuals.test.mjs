import assert from "node:assert/strict";
import test from "node:test";

import { createActualsMatrixModel } from "./actuals-matrix.mjs";
import { LOCK_STATES } from "./lock.mjs";
import { planActualsSave } from "./planner.mjs";
import {
  buildListProjectRows,
  filterListRows,
  pickOpenVersion,
} from "./list-model.mjs";
import {
  app3RowToRecord,
  buildActualsSaveInputs,
  completeApp1CreateBusinessKeys,
  seedApp1CreateRecord,
} from "./save-model.mjs";

const APP1 = 756;
const APP3 = 758;
let uuidCounter = 0;
const uuidFactory = () => `u${String(++uuidCounter).padStart(4, "0")}`;

test("pickOpenVersion prefers draft over latest confirmed", () => {
  const rows = [
    { id: "1", version_seq: 1, status: "版確定" },
    { id: "2", version_seq: 2, status: "下書き" },
    { id: "3", version_seq: 3, status: "版確定" },
  ];
  assert.equal(pickOpenVersion(rows).id, "2");
});

test("buildListProjectRows groups by project_code and surfaces open version columns", () => {
  const grouped = buildListProjectRows([
    {
      id: "10",
      project_code: "A-1",
      project_name: "橋梁",
      version_seq: 1,
      version_type: "当初",
      status: "版確定",
      updated_at: "2026-07-01",
    },
    {
      id: "11",
      project_code: "A-1",
      project_name: "橋梁",
      version_seq: 2,
      version_type: "仕様変更",
      status: "下書き",
      updated_at: "2026-07-20",
    },
    {
      id: "20",
      project_code: "B-2",
      project_name: "隧道",
      version_seq: 1,
      version_type: "当初",
      status: "版確定",
      updated_at: "2026-06-15",
    },
  ]);
  assert.equal(grouped.length, 2);
  const a = grouped.find((row) => row.project_code === "A-1");
  assert.equal(a.open_id, "11");
  assert.equal(a.version_seq, 2);
  assert.equal(a.version_type, "仕様変更");
  assert.equal(a.status, "下書き");
});

test("filterListRows matches project name and code", () => {
  const rows = buildListProjectRows([
    {
      id: "1",
      project_code: "X",
      project_name: "テスト工事",
      version_seq: 1,
      version_type: "当初",
      status: "下書き",
      updated_at: "2026-07-01",
    },
  ]);
  assert.equal(filterListRows(rows, "テスト").length, 1);
  assert.equal(filterListRows(rows, "存在しない").length, 0);
});

test("seedApp1CreateRecord writes initial keys and completeApp1CreateBusinessKeys fills guard", () => {
  // LIVE create.show と同様、各フィールドは type 付きで渡ってくる。
  const record = {
    project_id: { type: "SINGLE_LINE_TEXT", value: "" },
    budget_version_id: { type: "SINGLE_LINE_TEXT", value: "" },
    version_seq: { type: "NUMBER", value: "" },
    version_type: { type: "DROP_DOWN", value: "当初" },
    status: { type: "DROP_DOWN", value: "下書き" },
    actual_write_seq: { type: "NUMBER", value: "0" },
    derived_lock_state: { type: "DROP_DOWN", value: "editable" },
    version_record_key: { type: "SINGLE_LINE_TEXT", value: "" },
    project_business_key: { type: "SINGLE_LINE_TEXT", value: "" },
    series_guard_key: { type: "SINGLE_LINE_TEXT", value: "" },
    project_code: { type: "SINGLE_LINE_TEXT", value: "" },
    project_branch: { type: "SINGLE_LINE_TEXT", value: "" },
  };
  const seeded = seedApp1CreateRecord(record, { uuidFactory, versionType: "当初" });
  assert.match(seeded.projectId, /^prj-/);
  assert.match(seeded.budgetVersionId, /^bv-/);
  assert.equal(record.version_seq.type, "NUMBER");
  assert.equal(record.version_type.type, "DROP_DOWN");
  assert.equal(record.status.type, "DROP_DOWN");
  assert.equal(record.version_seq.value, "1");
  assert.equal(record.status.value, "下書き");
  assert.equal(record.actual_write_seq.value, "0");
  assert.match(record.project_business_key.value, /^TMP\|/);
  assert.match(record.series_guard_key.value, /^project\|TMP\|/);
  record.project_code.value = "TEST-001";
  record.project_branch.value = "";
  const businessKey = completeApp1CreateBusinessKeys(record);
  assert.equal(businessKey, "TEST-001|");
  assert.equal(record.project_business_key.value, "TEST-001|");
  assert.equal(record.project_business_key.type, "SINGLE_LINE_TEXT");
  assert.equal(record.series_guard_key.value, "project|TEST-001|");
  // idempotent re-seed keeps the same project_id
  const again = seedApp1CreateRecord(record, { uuidFactory, versionType: "当初" });
  assert.equal(again.alreadySeeded, true);
  assert.equal(again.projectId, seeded.projectId);
});

function actualModelWithDirtyCell() {
  const model = createActualsMatrixModel({
    lockState: LOCK_STATES.BUDGET_LOCKED,
    startMonth: "2026-02",
    monthCount: 2,
  });
  model.setMonthlyAmount("blk-a", "施工", "2026-02", "5000");
  return model;
}

test("buildActualsSaveInputs CAS-increments actual_write_seq and splits add/update", () => {
  const model = actualModelWithDirtyCell();
  const keys = {
    projectId: "prj-x",
    projectBusinessKey: "X-1|",
    budgetVersionId: "bv-x",
  };
  const rows = model.toApp3Records({
    projectId: keys.projectId,
    registeredVersionId: keys.budgetVersionId,
  });
  assert.equal(rows.length, 1);
  const existingRecord = {
    ...app3RowToRecord(rows[0], keys),
    $id: { value: "99" },
    $revision: { value: "3" },
  };
  model.setMonthlyAmount("blk-a", "施工", "2026-03", "1000");
  const mixed = model.toApp3Records({
    projectId: keys.projectId,
    registeredVersionId: keys.budgetVersionId,
  });
  assert.equal(mixed.length, 2);
  const inputs = buildActualsSaveInputs({
    app1Id: APP1,
    app3Id: APP3,
    parentRecordId: "5",
    parentRevision: "7",
    currentActualWriteSeq: "4",
    keys,
    rows: mixed,
    existingRecords: [existingRecord],
  });
  assert.equal(inputs.nextActualWriteSeq, "5");
  assert.equal(inputs.actualWriteSeqPut.payload.record.actual_write_seq.value, "5");
  assert.equal(inputs.actualWrites.length, 2);
  assert.equal(inputs.actualWrites[0].method, "POST");
  assert.equal(inputs.actualWrites[1].method, "PUT");
  const plan = planActualsSave(inputs);
  assert.equal(plan.operation, "actuals_save");
  assert.equal(plan.requestCount, 3);
});

test("buildActualsSaveInputs rejects forbidden apps", () => {
  assert.throws(
    () =>
      buildActualsSaveInputs({
        app1Id: 736,
        app3Id: APP3,
        parentRecordId: "1",
        parentRevision: "1",
        currentActualWriteSeq: "0",
        keys: {
          projectId: "p",
          projectBusinessKey: "p|",
          budgetVersionId: "bv",
        },
        rows: [],
        existingRecords: [],
      }),
    /FORBIDDEN/,
  );
});
