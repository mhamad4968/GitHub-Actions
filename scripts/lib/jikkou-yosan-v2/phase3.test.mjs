import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ConflictAbortError,
  assertActualsCurrentVersion,
  assertNoRevisionMismatch,
  classifyUniqueKeyCollision,
  revisionMismatchDecision,
} from "./conflict.mjs";
import {
  assertAllowedAppId,
  assertBulkRequestAllowedApps,
} from "./guard.mjs";
import {
  LOCK_STATES,
  parentLockSnapshot,
} from "./lock.mjs";
import {
  planActualsSave,
  planAtomicBudgetSave,
  planVersionCopy,
} from "./planner.mjs";

const APP1 = 801;
const APP2 = 802;
const APP3 = 803;

function parentPut(app = APP1, revision = "7") {
  return {
    method: "PUT",
    api: "/k/v1/record.json",
    payload: { app, id: "1", revision, record: {} },
  };
}

function parentPost(app = APP1) {
  return {
    method: "POST",
    api: "/k/v1/record.json",
    payload: { app, record: {} },
  };
}

function actualSeqPut() {
  const request = parentPut();
  request.payload.record.actual_write_seq = { value: "8" };
  return request;
}

function recordsPost(app = APP3) {
  return {
    method: "POST",
    api: "/k/v1/records.json",
    payload: { app, records: [] },
  };
}

test("three-state lock maps to the binary App 2 ACL snapshot", () => {
  assert.equal(parentLockSnapshot(LOCK_STATES.EDITABLE), "editable");
  assert.equal(parentLockSnapshot(LOCK_STATES.BUDGET_LOCKED), "locked");
  assert.equal(parentLockSnapshot(LOCK_STATES.FULL_LOCKED), "locked");
  assert.throws(() => parentLockSnapshot("unknown"), /Unknown lock state/);
});

test("version copy plans 900 rows as 20 ordered requests with 100-row boundaries", () => {
  const copies = Array.from({ length: 900 }, (_, index) => ({ index }));
  const locks = Array.from({ length: 900 }, (_, index) => ({
    id: String(index + 1),
    revision: "1",
    record: { parent_lock_snapshot: { value: "locked" } },
  }));
  const plan = planVersionCopy({
    oldParentLock: parentPut(),
    newParentCreate: parentPost(),
    detailAppId: APP2,
    newDetailRecords: copies,
    oldDetailLockUpdates: locks,
  });
  assert.equal(plan.requestCount, 20);
  assert.equal(plan.requests.length, 20);
  assert.deepEqual(plan.requests.slice(0, 2).map(({ method }) => method), ["PUT", "POST"]);
  assert.equal(plan.requests.slice(2, 11).every(({ method }) => method === "POST"), true);
  assert.equal(plan.requests.slice(11).every(({ method }) => method === "PUT"), true);
  assert.equal(plan.chunks.copy.length, 9);
  assert.deepEqual(plan.chunks.copy[0], { index: 0, start: 0, end: 100, count: 100 });
  assert.deepEqual(plan.chunks.copy[8], { index: 8, start: 800, end: 900, count: 100 });
  assert.strictEqual(plan.chunks.copy, plan.chunks.parentLockSnapshot);
});

test("version copy rejects 901 rows before returning any plan", () => {
  const copies = Array.from({ length: 901 }, () => ({}));
  const locks = Array.from({ length: 901 }, (_, index) => ({
    id: String(index + 1),
    revision: "1",
    record: {},
  }));
  assert.throws(
    () =>
      planVersionCopy({
        oldParentLock: parentPut(),
        newParentCreate: parentPost(),
        detailAppId: APP2,
        newDetailRecords: copies,
        oldDetailLockUpdates: locks,
      }),
    (error) => error instanceof RangeError && error.rowCount === 901 && error.requestCount === 22,
  );
});

test("atomic budget save orders parent, adds, updates, deletes, then projection", () => {
  const plan = planAtomicBudgetSave({
    parentPut: parentPut(),
    detailAppId: APP2,
    detailAdds: Array.from({ length: 101 }, (_, index) => ({ index })),
    detailUpdates: [{ id: "1", revision: "2", record: {} }],
    detailDeletes: [{ id: "2", revision: "3" }],
    projectionPut: parentPut(APP1, "8"),
  });
  assert.equal(plan.requestCount, 6);
  assert.deepEqual(plan.requests.map(({ method }) => method), [
    "PUT",
    "POST",
    "POST",
    "PUT",
    "DELETE",
    "PUT",
  ]);
  assert.equal(plan.requests[1].payload.records.length, 100);
  assert.equal(plan.requests[2].payload.records.length, 1);
});

test("atomic budget save aborts above 20 requests", () => {
  assert.throws(
    () =>
      planAtomicBudgetSave({
        parentPut: parentPut(),
        detailAppId: APP2,
        detailAdds: Array.from({ length: 1901 }, () => ({})),
      }),
    (error) => error instanceof RangeError && error.requestCount === 21,
  );
});

test("existing detail writes require revisions", () => {
  assert.throws(
    () =>
      planAtomicBudgetSave({
        parentPut: parentPut(),
        detailAppId: APP2,
        detailUpdates: [{ id: "1", record: {} }],
      }),
    /requires revision/,
  );
  assert.throws(
    () =>
      planAtomicBudgetSave({
        parentPut: parentPut(),
        detailAppId: APP2,
        detailDeletes: [{ id: "1" }],
      }),
    /requires id and revision/,
  );
});

test("actuals save puts parent actual_write_seq CAS first and caps at 20 requests", () => {
  const twenty = planActualsSave({
    actualWriteSeqPut: actualSeqPut(),
    actualAppId: APP3,
    actualWrites: Array.from({ length: 19 }, () => recordsPost()),
  });
  assert.equal(twenty.requestCount, 20);
  assert.strictEqual(twenty.requests[0].payload.revision, "7");
  assert.throws(
    () =>
      planActualsSave({
        actualWriteSeqPut: actualSeqPut(),
        actualAppId: APP3,
        actualWrites: Array.from({ length: 20 }, () => recordsPost()),
      }),
    (error) => error instanceof RangeError && error.requestCount === 21,
  );
  assert.throws(
    () =>
      planActualsSave({
        actualWriteSeqPut: parentPut(),
        actualAppId: APP3,
        actualWrites: [],
      }),
    /must update actual_write_seq/,
  );
  assert.throws(
    () =>
      planActualsSave({
        actualWriteSeqPut: actualSeqPut(),
        actualAppId: APP3,
        actualWrites: [recordsPost(APP2)],
      }),
    /must target actualAppId/,
  );
});

test("revision mismatch always means abort/reload with no automatic retry", () => {
  const error = { results: [{ code: "GAIA_CO02", message: "revision mismatch" }] };
  assert.deepEqual(revisionMismatchDecision(error), {
    reason: "revision_mismatch",
    action: "abort_reload",
    autoRetry: false,
  });
  assert.throws(
    () => assertNoRevisionMismatch(error),
    (thrown) =>
      thrown instanceof ConflictAbortError &&
      thrown.reason === "revision_mismatch" &&
      thrown.autoRetry === false,
  );
  assert.equal(revisionMismatchDecision({ code: "OTHER" }), null);
});

test("unique-key collisions are classified without guessing unrelated errors", () => {
  assert.deepEqual(
    classifyUniqueKeyCollision(
      { code: "GAIA_DA02", message: "actual_record_key already exists" },
      ["actual_record_key", "version_record_key"],
    ),
    {
      reason: "unique_key_collision",
      action: "abort_reload",
      autoRetry: false,
      collidedKeys: ["actual_record_key"],
    },
  );
  assert.equal(classifyUniqueKeyCollision({ code: "GAIA_CO02" }, ["actual_record_key"]), null);
});

test("actuals reject a stale screen version", () => {
  assert.equal(
    assertActualsCurrentVersion({
      screenVersionId: "bv-current",
      currentVersionId: "bv-current",
    }),
    "bv-current",
  );
  assert.throws(
    () =>
      assertActualsCurrentVersion({
        screenVersionId: "bv-old",
        currentVersionId: "bv-current",
      }),
    (error) =>
      error instanceof ConflictAbortError &&
      error.reason === "screen_version_not_current" &&
      error.action === "abort_reload",
  );
});

test("central forbidden-app guard protects individual and bulk future writers", () => {
  assert.throws(() => assertAllowedAppId(735), /FORBIDDEN/);
  assert.throws(() => assertAllowedAppId("736"), /FORBIDDEN/);
  assert.throws(
    () => assertBulkRequestAllowedApps([parentPut(736)]),
    /FORBIDDEN/,
  );
  assert.strictEqual(assertBulkRequestAllowedApps([parentPut(APP1)]).length, 1);
});

test("Phase 3 production modules have no fetch or network-client imports", () => {
  for (const name of ["planner.mjs", "lock.mjs", "conflict.mjs", "guard.mjs"]) {
    const source = readFileSync(
      fileURLToPath(new URL(name, import.meta.url)),
      "utf8",
    );
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${name} must not call fetch`);
    assert.doesNotMatch(
      source,
      /(?:axios|rest-api-client|KintoneRestAPIClient|\.\/kintone\.mjs)/i,
      `${name} must not import a network client`,
    );
  }
});
