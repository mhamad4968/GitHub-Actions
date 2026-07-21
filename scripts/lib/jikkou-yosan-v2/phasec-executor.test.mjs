import assert from "node:assert/strict";
import test from "node:test";

import { ConflictAbortError } from "./conflict.mjs";
import {
  BULK_REQUEST_API,
  DEFAULT_UNIQUE_KEY_CODES,
  assertExecutablePlan,
  buildBulkRequestBody,
  executePlan,
} from "./executor.mjs";
import { planActualsSave, planAtomicBudgetSave } from "./planner.mjs";

const APP1 = 756;
const APP2 = 757;
const APP3 = 758;

function parentPut(app = APP1, revision = "7") {
  return {
    method: "PUT",
    api: "/k/v1/record.json",
    payload: { app, id: "1", revision, record: {} },
  };
}

function samplePlan() {
  return planAtomicBudgetSave({
    parentPut: parentPut(),
    detailAppId: APP2,
    detailAdds: [{ project_id: { value: "P-1" } }],
    detailUpdates: [{ id: "10", revision: "3", record: {} }],
    detailDeletes: [{ id: "11", revision: "4" }],
  });
}

function mockClient(handler) {
  const calls = [];
  return {
    calls,
    bulkRequest(requests) {
      calls.push(requests);
      return handler(requests);
    },
  };
}

test("executePlan sends the plan once and returns per-request results", async () => {
  const plan = samplePlan();
  const client = mockClient(async (requests) => ({
    results: requests.map((_, index) => ({ index })),
  }));
  const outcome = await executePlan(plan, client);
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0], plan.requests);
  assert.equal(outcome.operation, "atomic_budget_save");
  assert.equal(outcome.requestCount, plan.requests.length);
  assert.equal(outcome.results.length, plan.requests.length);
  assert.ok(Object.isFrozen(outcome));
});

test("executePlan rejects non-planner input (hand-built arrays)", async () => {
  const client = mockClient(async () => ({ results: [] }));
  await assert.rejects(
    () => executePlan([parentPut()], client),
    /planner result object/,
  );
  await assert.rejects(
    () =>
      executePlan(
        { operation: "atomic_budget_save", requests: [parentPut()] },
        client,
      ),
    /frozen planner output/,
  );
  assert.equal(client.calls.length, 0);
});

test("executePlan re-checks forbidden apps 735/736 before sending", async () => {
  const forged = Object.freeze({
    operation: "atomic_budget_save",
    requestCount: 1,
    requests: Object.freeze([
      Object.freeze({
        method: "PUT",
        api: "/k/v1/record.json",
        payload: Object.freeze({ app: 736, id: "1", revision: "1", record: {} }),
      }),
    ]),
  });
  const client = mockClient(async () => ({ results: [{}] }));
  await assert.rejects(() => executePlan(forged, client), /FORBIDDEN/);
  assert.equal(client.calls.length, 0);
});

test("executePlan requires an injected client with bulkRequest", async () => {
  await assert.rejects(() => executePlan(samplePlan(), {}), /bulkRequest\(requests\)/);
  await assert.rejects(() => executePlan(samplePlan(), null), /bulkRequest\(requests\)/);
});

test("revision mismatch (GAIA_CO02) becomes ConflictAbortError without retry", async () => {
  const plan = samplePlan();
  const client = mockClient(async () => {
    const error = new Error("HTTP 409");
    error.results = [{}, { code: "GAIA_CO02", message: "revision conflict" }];
    throw error;
  });
  await assert.rejects(
    () => executePlan(plan, client),
    (error) => {
      assert.ok(error instanceof ConflictAbortError);
      assert.equal(error.reason, "revision_mismatch");
      assert.equal(error.action, "abort_reload");
      assert.equal(error.autoRetry, false);
      return true;
    },
  );
  assert.equal(client.calls.length, 1);
});

test("unique key collision (GAIA_DA02) becomes ConflictAbortError with collidedKeys", async () => {
  const plan = samplePlan();
  const client = mockClient(async () => {
    const error = new Error("HTTP 400");
    error.results = [
      { code: "GAIA_DA02", message: "value duplicated", errors: { budget_version_id: {} } },
    ];
    throw error;
  });
  await assert.rejects(
    () => executePlan(plan, client),
    (error) => {
      assert.ok(error instanceof ConflictAbortError);
      assert.equal(error.reason, "unique_key_collision");
      assert.deepEqual([...error.collidedKeys], ["budget_version_id"]);
      assert.equal(error.autoRetry, false);
      return true;
    },
  );
});

test("other failures are wrapped, marked non-retryable, and keep the cause", async () => {
  const plan = samplePlan();
  const cause = new Error("HTTP 520 something odd");
  const client = mockClient(async () => {
    throw cause;
  });
  await assert.rejects(
    () => executePlan(plan, client),
    (error) => {
      assert.equal(error.name, "BulkRequestExecutionError");
      assert.equal(error.autoRetry, false);
      assert.equal(error.cause, cause);
      return true;
    },
  );
});

test("result-count mismatch is surfaced as unverified save", async () => {
  const plan = samplePlan();
  const client = mockClient(async () => ({ results: [{}] }));
  await assert.rejects(
    () => executePlan(plan, client),
    (error) => {
      assert.equal(error.name, "BulkRequestResultMismatchError");
      assert.equal(error.autoRetry, false);
      return true;
    },
  );
});

test("actuals_save plan executes through the same path", async () => {
  const seqPut = parentPut();
  seqPut.payload.record.actual_write_seq = { value: "9" };
  const plan = planActualsSave({
    actualWriteSeqPut: seqPut,
    actualAppId: APP3,
    actualWrites: [
      {
        method: "PUT",
        api: "/k/v1/record.json",
        payload: { app: APP3, id: "5", revision: "2", record: {} },
      },
    ],
  });
  const client = mockClient(async (requests) => ({
    results: requests.map(() => ({})),
  }));
  const outcome = await executePlan(plan, client);
  assert.equal(outcome.operation, "actuals_save");
  assert.equal(outcome.requestCount, 2);
});

test("buildBulkRequestBody produces a frozen kintone bulkRequest body", () => {
  const plan = samplePlan();
  const body = buildBulkRequestBody(plan);
  assert.ok(Object.isFrozen(body));
  assert.equal(body.requests.length, plan.requests.length);
  for (const [index, request] of body.requests.entries()) {
    assert.equal(request.method, plan.requests[index].method);
    assert.equal(request.api, plan.requests[index].api);
    assert.equal(request.payload, plan.requests[index].payload);
  }
  assert.equal(typeof BULK_REQUEST_API, "string");
});

test("assertExecutablePlan validates operations and default unique keys exist", () => {
  assert.throws(
    () => assertExecutablePlan(Object.freeze({ operation: "drop_tables", requests: Object.freeze([]) })),
    /unknown/,
  );
  assert.ok(DEFAULT_UNIQUE_KEY_CODES.includes("budget_version_id"));
  assert.ok(assertExecutablePlan(samplePlan()));
});
