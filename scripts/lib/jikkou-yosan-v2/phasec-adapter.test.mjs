import assert from "node:assert/strict";
import test from "node:test";

import { createKintoneApiClient } from "./client-adapter.mjs";
import { ConflictAbortError } from "./conflict.mjs";
import { BULK_REQUEST_API, executePlan } from "./executor.mjs";
import { planAtomicBudgetSave } from "./planner.mjs";

const APP1 = 756;
const APP2 = 757;

function samplePlan() {
  return planAtomicBudgetSave({
    parentPut: {
      method: "PUT",
      api: "/k/v1/record.json",
      payload: { app: APP1, id: "1", revision: "7", record: {} },
    },
    detailAppId: APP2,
    detailAdds: [{ project_id: { value: "P-1" } }],
  });
}

test("adapter requires a kintone.api-compatible function", () => {
  assert.throws(() => createKintoneApiClient(null), /kintone\.api-compatible/);
  assert.throws(() => createKintoneApiClient({}), /kintone\.api-compatible/);
});

test("adapter posts one bulkRequest body to /k/v1/bulkRequest.json", async () => {
  const calls = [];
  const client = createKintoneApiClient(async (url, method, body) => {
    calls.push({ url, method, body });
    return { results: body.requests.map(() => ({})) };
  });
  const plan = samplePlan();
  const outcome = await executePlan(plan, client);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, BULK_REQUEST_API);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].body.requests.length, plan.requests.length);
  assert.deepEqual(
    calls[0].body.requests.map((r) => r.method),
    plan.requests.map((r) => r.method),
  );
  assert.equal(outcome.requestCount, plan.requests.length);
});

test("adapter rejects empty request arrays before touching the network", async () => {
  let called = 0;
  const client = createKintoneApiClient(async () => {
    called += 1;
    return { results: [] };
  });
  await assert.rejects(() => client.bulkRequest([]), /non-empty/);
  assert.equal(called, 0);
});

test("kintone.api plain-object rejection (GAIA_CO02) still maps to abort_reload", async () => {
  const client = createKintoneApiClient(async () => {
    // kintone.api rejects with a plain object, not an Error instance.
    throw {
      code: "GAIA_BR01",
      message: "bulk failed",
      results: [{}, { code: "GAIA_CO02", message: "revision conflict" }],
    };
  });
  await assert.rejects(
    () => executePlan(samplePlan(), client),
    (error) => {
      assert.ok(error instanceof ConflictAbortError);
      assert.equal(error.reason, "revision_mismatch");
      assert.equal(error.action, "abort_reload");
      return true;
    },
  );
});
