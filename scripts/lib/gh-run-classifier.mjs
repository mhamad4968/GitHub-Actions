import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const FAILURE_CONCLUSIONS = new Set([
  "failure",
  "timed_out",
  "action_required",
  "startup_failure",
]);

function workflowIdentityOf(run) {
  if (
    run.workflowDatabaseId === undefined ||
    run.workflowDatabaseId === null ||
    run.workflowDatabaseId === ""
  ) {
    return null;
  }
  return String(run.workflowDatabaseId);
}

function compareNewestFirst(left, right) {
  const dateDifference =
    Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0);
  if (dateDifference !== 0) return dateDifference;
  return Number(right.databaseId || 0) - Number(left.databaseId || 0);
}

function describeTrackedRun(run, latestConclusion, reason) {
  return {
    ...run,
    latestConclusion,
    reason,
  };
}

function findLatestNewerSameWorkflow(ordered, run) {
  const workflowIdentity = workflowIdentityOf(run);
  if (!workflowIdentity || !run.headBranch) {
    return { workflowIdentity, latestNewerRun: null };
  }
  const latestNewerRun = ordered.find(
    (candidate) =>
      compareNewestFirst(candidate, run) < 0 &&
      workflowIdentityOf(candidate) === workflowIdentity &&
      candidate.headBranch === run.headBranch,
  );
  return { workflowIdentity, latestNewerRun };
}

async function isSupersededByNewerSuccess(run, latestNewerRun, isAncestor) {
  if (latestNewerRun?.conclusion !== "success") return false;
  if (!run.headSha || !latestNewerRun.headSha) return false;
  if (run.headSha === latestNewerRun.headSha) return true;
  try {
    return await isAncestor(run.headSha, latestNewerRun.headSha);
  } catch {
    return false;
  }
}

export async function classifyGhRuns(runs, { isAncestor }) {
  if (!Array.isArray(runs)) throw new TypeError("runs must be an array");
  if (typeof isAncestor !== "function") {
    throw new TypeError("isAncestor must be a function");
  }

  const ordered = [...runs].sort(compareNewestFirst);
  const failures = ordered.filter((run) =>
    FAILURE_CONCLUSIONS.has(run.conclusion),
  );
  const supersededCancellations = [];
  const unresolvedCancellations = [];
  const supersededFailures = [];
  const unresolvedFailures = [];

  for (const cancelled of ordered.filter(
    (run) => run.conclusion === "cancelled",
  )) {
    const { workflowIdentity, latestNewerRun } = findLatestNewerSameWorkflow(
      ordered,
      cancelled,
    );
    if (!workflowIdentity || !cancelled.headBranch) {
      unresolvedCancellations.push(
        describeTrackedRun(
          cancelled,
          "cancelled",
          !workflowIdentity
            ? "missing stable workflow identity"
            : "missing head branch",
        ),
      );
      continue;
    }

    const latestConclusion = latestNewerRun?.conclusion || "cancelled";

    if (latestNewerRun?.conclusion !== "success") {
      unresolvedCancellations.push(
        describeTrackedRun(
          cancelled,
          latestConclusion,
          latestNewerRun
            ? `latest newer run concluded ${latestConclusion}`
            : "no newer run for the same workflow and branch",
        ),
      );
      continue;
    }

    const ancestor = await isSupersededByNewerSuccess(
      cancelled,
      latestNewerRun,
      isAncestor,
    );
    const target = ancestor ? supersededCancellations : unresolvedCancellations;
    target.push(
      describeTrackedRun(
        cancelled,
        latestConclusion,
        ancestor
          ? `superseded by successful run ${latestNewerRun.databaseId}`
          : "cancelled SHA is not an ancestor of the latest successful run",
      ),
    );
  }

  for (const failed of failures) {
    const { workflowIdentity, latestNewerRun } = findLatestNewerSameWorkflow(
      ordered,
      failed,
    );
    if (!workflowIdentity || !failed.headBranch) {
      unresolvedFailures.push(
        describeTrackedRun(
          failed,
          failed.conclusion,
          !workflowIdentity
            ? "missing stable workflow identity"
            : "missing head branch",
        ),
      );
      continue;
    }

    const latestNewerSuccess = ordered.find(
      (candidate) =>
        compareNewestFirst(candidate, failed) < 0 &&
        workflowIdentityOf(candidate) === workflowIdentity &&
        candidate.headBranch === failed.headBranch &&
        candidate.conclusion === "success",
    );
    const latestConclusion = latestNewerRun?.conclusion || failed.conclusion;
    const healed = await isSupersededByNewerSuccess(
      failed,
      latestNewerSuccess,
      isAncestor,
    );
    if (healed) {
      supersededFailures.push(
        describeTrackedRun(
          failed,
          latestConclusion,
          `healed by successful run ${latestNewerSuccess.databaseId}`,
        ),
      );
      continue;
    }
    unresolvedFailures.push(
      describeTrackedRun(
        failed,
        latestConclusion,
        latestNewerRun
          ? `latest newer run concluded ${latestConclusion}`
          : "no newer successful run for the same workflow and branch",
      ),
    );
  }

  return {
    latestConclusion: ordered[0]?.conclusion || "unknown",
    failures,
    failureCount: failures.length,
    supersededFailures,
    supersededFailureCount: supersededFailures.length,
    unresolvedFailures,
    unresolvedFailureCount: unresolvedFailures.length,
    supersededCancellations,
    supersededCancellationCount: supersededCancellations.length,
    unresolvedCancellations,
    unresolvedCancellationCount: unresolvedCancellations.length,
  };
}

function gitIsAncestor(ancestor, descendant) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

async function runCli() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  const runs = JSON.parse(input || "[]");
  const result = await classifyGhRuns(runs, { isAncestor: gitIsAncestor });
  const recentFailures = result.failures.filter((failure) =>
    runs
      .slice(0, 5)
      .some((run) => String(run.databaseId) === String(failure.databaseId)),
  ).length;

  if (process.argv.includes("--health-summary")) {
    console.log(
      [
        result.failureCount,
        recentFailures,
        result.latestConclusion,
        result.supersededCancellationCount,
        result.unresolvedCancellationCount,
      ].join("|"),
    );
    if (process.env.CIO_HEALTH_DEBUG === "1") {
      for (const run of [
        ...result.supersededCancellations,
        ...result.unresolvedCancellations,
      ]) {
        console.error(
          `[gh-actions debug] cancelled=${run.url || run.databaseId} reason=${run.reason}`,
        );
      }
    }
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runCli().catch((error) => {
    console.error(`[gh-run-classifier] ${error.message}`);
    process.exitCode = 1;
  });
}
