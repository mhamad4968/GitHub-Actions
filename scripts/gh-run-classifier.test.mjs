import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { classifyGhRuns } from "./lib/gh-run-classifier.mjs";

function run(databaseId, conclusion, options = {}) {
  return {
    databaseId,
    conclusion,
    createdAt: new Date(
      `2026-07-19T00:${String(databaseId).padStart(2, "0")}:00Z`,
    ).toISOString(),
    workflowDatabaseId: 100,
    workflowName: "CI",
    name: "CI run",
    headSha: `sha-${databaseId}`,
    headBranch: "main",
    url: `https://example.invalid/runs/${databaseId}`,
    ...options,
  };
}

test("newer success supersedes an ancestor cancellation", async () => {
  const result = await classifyGhRuns(
    [run(2, "success"), run(1, "cancelled")],
    {
      isAncestor: async (ancestor, descendant) =>
        ancestor === "sha-1" && descendant === "sha-2",
    },
  );

  assert.equal(result.supersededCancellationCount, 1);
  assert.equal(result.unresolvedCancellationCount, 0);
  assert.equal(result.supersededCancellations[0].latestConclusion, "success");
});

test("successes from another branch or workflow do not supersede", async () => {
  const result = await classifyGhRuns(
    [
      run(4, "success", { headBranch: "feature" }),
      run(3, "success", {
        workflowDatabaseId: 200,
        workflowName: "Deploy",
      }),
      run(2, "cancelled"),
    ],
    { isAncestor: async () => true },
  );

  assert.equal(result.supersededCancellationCount, 0);
  assert.equal(result.unresolvedCancellationCount, 1);
});

test("missing stable workflow identity remains unresolved", async () => {
  let ancestryLookups = 0;
  const result = await classifyGhRuns(
    [
      run(2, "success"),
      run(1, "cancelled", { workflowDatabaseId: undefined }),
    ],
    {
      isAncestor: async () => {
        ancestryLookups += 1;
        return true;
      },
    },
  );

  assert.equal(result.supersededCancellationCount, 0);
  assert.equal(result.unresolvedCancellationCount, 1);
  assert.equal(
    result.unresolvedCancellations[0].reason,
    "missing stable workflow identity",
  );
  assert.equal(ancestryLookups, 0);
});

test("a later failure keeps an earlier cancellation unresolved", async () => {
  const result = await classifyGhRuns(
    [run(3, "failure"), run(2, "success"), run(1, "cancelled")],
    { isAncestor: async () => true },
  );

  assert.equal(result.unresolvedCancellationCount, 1);
  assert.equal(result.unresolvedCancellations[0].latestConclusion, "failure");
});

test("a newer success at the same SHA supersedes without ancestry lookup", async () => {
  let ancestryLookups = 0;
  const result = await classifyGhRuns(
    [
      run(2, "success", { headSha: "same-sha" }),
      run(1, "cancelled", { headSha: "same-sha" }),
    ],
    {
      isAncestor: async () => {
        ancestryLookups += 1;
        return false;
      },
    },
  );

  assert.equal(result.supersededCancellationCount, 1);
  assert.equal(ancestryLookups, 0);
});

test("failure conclusions remain failures", async () => {
  const conclusions = [
    "failure",
    "timed_out",
    "action_required",
    "startup_failure",
  ];
  const result = await classifyGhRuns(
    conclusions.map((conclusion, index) => run(index + 1, conclusion)),
    { isAncestor: async () => false },
  );

  assert.equal(result.failureCount, conclusions.length);
  assert.equal(result.unresolvedFailureCount, conclusions.length);
  assert.equal(result.supersededFailureCount, 0);
  assert.deepEqual(
    new Set(result.failures.map(({ conclusion }) => conclusion)),
    new Set(conclusions),
  );
});

test("newer success heals an ancestor failure", async () => {
  const result = await classifyGhRuns(
    [run(2, "success"), run(1, "failure")],
    {
      isAncestor: async (ancestor, descendant) =>
        ancestor === "sha-1" && descendant === "sha-2",
    },
  );

  assert.equal(result.failureCount, 1);
  assert.equal(result.unresolvedFailureCount, 0);
  assert.equal(result.supersededFailureCount, 1);
  assert.match(
    result.supersededFailures[0].reason,
    /healed by successful run 2/,
  );
});

test("newer success at the same SHA heals a failure", async () => {
  const result = await classifyGhRuns(
    [
      run(2, "success", { headSha: "same-sha" }),
      run(1, "failure", { headSha: "same-sha" }),
    ],
    { isAncestor: async () => false },
  );

  assert.equal(result.unresolvedFailureCount, 0);
  assert.equal(result.supersededFailureCount, 1);
});

test("a later failure is unresolved even if an older failure was healed", async () => {
  const result = await classifyGhRuns(
    [run(3, "failure"), run(2, "success"), run(1, "failure")],
    { isAncestor: async () => true },
  );

  assert.equal(result.failureCount, 2);
  assert.equal(result.unresolvedFailureCount, 1);
  assert.equal(result.supersededFailureCount, 1);
  assert.equal(result.unresolvedFailures[0].databaseId, 3);
});

test("CLI parse failure exits nonzero without a health summary", () => {
  const classifierPath = fileURLToPath(
    new URL("./lib/gh-run-classifier.mjs", import.meta.url),
  );
  const child = spawnSync(
    process.execPath,
    [classifierPath, "--health-summary"],
    {
      input: "{invalid-json",
      encoding: "utf8",
    },
  );

  assert.notEqual(child.status, 0);
  assert.equal(child.stdout, "");
  assert.match(child.stderr, /^\[gh-run-classifier\] /);
});

test("empty query result preserves unknown health state", async () => {
  const result = await classifyGhRuns([], {
    isAncestor: async () => false,
  });

  assert.equal(result.latestConclusion, "unknown");
  assert.equal(result.failureCount, 0);
});
