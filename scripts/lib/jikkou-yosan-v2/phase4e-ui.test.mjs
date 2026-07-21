import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { LOCK_STATES } from "./lock.mjs";
import {
  VERSION_DUPLICATE_MESSAGES,
  VERSION_LOCK_LABELS,
  VERSION_TYPES,
  createVersionSeriesModel,
  duplicateSeriesDecision,
} from "./version-series-model.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function protected736Digest() {
  const hash = createHash("sha256");
  for (const name of ["desktop.js", "desktop.reorder.js", "desktop.ui.js"]) {
    hash.update(name);
    hash.update(read(`customize/736/${name}`));
  }
  return hash.digest("hex");
}

function sequentialUuidFactory() {
  let next = 0;
  return () => `uuid-${(next += 1)}`;
}

function version(overrides = {}) {
  return {
    project_id: "prj-1",
    version_seq: 1,
    version_type: "当初",
    status: "版確定",
    budget_version_id: "bv-1",
    ...overrides,
  };
}

// prj-1: 2 confirmed + 1 draft (draft newest). prj-2: 1 confirmed only.
function seriesModel(overrides = {}) {
  return createVersionSeriesModel({
    records: [
      version(),
      version({
        version_seq: 3,
        version_type: "価格変更",
        status: "下書き",
        budget_version_id: "bv-3",
      }),
      version({
        version_seq: 2,
        version_type: "仕様変更",
        budget_version_id: "bv-2",
      }),
      version({ project_id: "prj-2", budget_version_id: "bv-solo" }),
    ],
    uuidFactory: sequentialUuidFactory(),
    ...overrides,
  });
}

test("V2/§10.0b: version types are the 5 Ver.01 options", () => {
  assert.deepEqual(VERSION_TYPES, [
    "当初",
    "仕様変更",
    "価格変更",
    "仕様・価格変更",
    "その他",
  ]);
  assert.throws(
    () =>
      createVersionSeriesModel({
        records: [version({ version_type: "改訂" })],
      }),
    /version_type/,
  );
});

test("lock derivation across the series (V6/V9/V11/V11b)", () => {
  const model = seriesModel();
  const versions = model.listVersions("prj-1");
  assert.deepEqual(
    versions.map((entry) => [entry.versionSeq, entry.derivedLockState]),
    [
      [1, LOCK_STATES.FULL_LOCKED], // older confirmed → 閲覧のみ (V9)
      [2, LOCK_STATES.FULL_LOCKED], // confirmed but a draft exists (V11b)
      [3, LOCK_STATES.EDITABLE], // the single draft
    ],
  );
  // Latest confirmed with NO draft → budget_locked (予実のみ編集可).
  const [solo] = model.listVersions("prj-2");
  assert.equal(solo.derivedLockState, LOCK_STATES.BUDGET_LOCKED);
  assert.equal(solo.lockLabel, VERSION_LOCK_LABELS.budget_locked);
  // V11: 最新の確定版 = version_seq 最大の確定 (prj-1 → 第2版, not the draft).
  assert.equal(model.latestConfirmed("prj-1").budgetVersionId, "bv-2");
  assert.equal(model.draftVersion("prj-1").budgetVersionId, "bv-3");
  assert.equal(model.draftVersion("prj-2"), null);
  // Keys and kintone {value} wrappers.
  assert.equal(versions[0].versionRecordKey, "prj-1|1");
  const wrapped = createVersionSeriesModel({
    records: [
      {
        project_id: { value: "prj-w" },
        version_seq: { value: "4" },
        version_type: { value: "その他" },
        status: { value: "版確定" },
        budget_version_id: { value: "bv-w" },
      },
    ],
  });
  assert.equal(wrapped.listVersions("prj-w")[0].versionSeq, 4);
  assert.deepEqual(model.listVersions("prj-none"), []);
});

test("CTA gate: createNextVersion only from budget_locked; past versions get no edits", () => {
  const model = seriesModel();
  const [v1, v2, draft] = model.listVersions("prj-1");
  const [solo] = model.listVersions("prj-2");
  assert.equal(solo.allowedOperations.createNextVersion, true);
  for (const blocked of [v1, v2, draft]) {
    assert.equal(blocked.allowedOperations.createNextVersion, false);
  }
  // Past versions are full_locked: neither budget nor actuals editable.
  for (const past of [v1, v2]) {
    assert.deepEqual(past.allowedOperations, {
      editBudget: false,
      editActuals: false,
      createNextVersion: false,
    });
  }
  assert.throws(() => model.planNextVersionDraft(v2, 10), /createNextVersion/);
  assert.throws(() => model.planNextVersionDraft(draft, 10), /createNextVersion/);
  assert.throws(() => model.planNextVersionDraft("bv-missing", 10), /unknown source/);
});

test("V5/V11b series invariants reject corrupt mock data", () => {
  assert.throws(
    () =>
      createVersionSeriesModel({
        records: [
          version({ status: "下書き" }),
          version({
            version_seq: 2,
            status: "下書き",
            budget_version_id: "bv-2",
          }),
        ],
      }),
    /at most 1 下書き/,
  );
  assert.throws(
    () =>
      createVersionSeriesModel({
        records: [
          version({ status: "下書き" }),
          version({ version_seq: 2, budget_version_id: "bv-2" }),
        ],
      }),
    /newest version \(V11b\)/,
  );
  assert.throws(
    () =>
      createVersionSeriesModel({
        records: [version(), version({ budget_version_id: "bv-2" })],
      }),
    /duplicate version_seq/,
  );
  assert.throws(
    () =>
      createVersionSeriesModel({
        records: [version(), version({ version_seq: 2 })],
      }),
    /duplicate budget_version_id/,
  );
});

test("planNextVersionDraft: offline keys/meta, planVersionCopy sizing, 901 abort", () => {
  const model = seriesModel();
  const source = model.latestConfirmed("prj-2");
  const plan = model.planNextVersionDraft(source, 250);
  assert.equal(plan.operation, "next_version_draft");
  assert.equal(plan.network, false);
  assert.equal(plan.projectId, "prj-2");
  assert.equal(plan.sourceBudgetVersionId, "bv-solo");
  assert.equal(plan.versionSeq, 2);
  assert.equal(plan.versionRecordKey, "prj-2|2");
  assert.equal(plan.budgetVersionId, "bv-uuid-1");
  assert.equal(plan.seriesGuardKey, "version|bv-uuid-1");
  assert.equal(plan.status, "下書き");
  // P-34 sizing shared with planVersionCopy: 2 + 2×ceil(250/100) = 8.
  assert.equal(plan.sizing.requestCount, 8);
  assert.equal(plan.sizing.recordsPerRequest, 100);
  // 900 rows still fits the 20-request bulkRequest; 901 aborts before send.
  assert.equal(model.planNextVersionDraft(source, 900).sizing.requestCount, 20);
  assert.throws(
    () => model.planNextVersionDraft(source, 901),
    /901 rows: 22 requests exceeds the 20-request limit/,
  );
  // Accepts the raw budget_version_id string too.
  assert.equal(model.planNextVersionDraft("bv-solo", 0).sizing.requestCount, 2);
});

test("P-28/V3b: the plan never copies actuals", () => {
  const model = seriesModel();
  const plan = model.planNextVersionDraft("bv-solo", 42);
  assert.equal(plan.actualsCopied, false);
  assert.deepEqual(plan.copies, { detailRows: 42, actualRows: 0 });
  assert.throws(
    () => model.planNextVersionDraft("bv-solo", 42, { copyActuals: true }),
    /never copied to a new version \(P-28\/V3b\)/,
  );
});

test("P-29 duplicate dialog decisions (pure)", () => {
  // No existing series → no dialog, proceed with the initial version.
  assert.deepEqual(duplicateSeriesDecision({ existingVersions: [] }), {
    seriesExists: false,
    dialog: null,
    message: null,
    outcome: "create-initial",
  });

  // Existing series, no draft: 次版作成 dialog; copy source = latest confirmed.
  const confirmedOnly = [
    version(),
    version({ version_seq: 2, budget_version_id: "bv-2" }),
  ];
  const yes = duplicateSeriesDecision({
    existingVersions: confirmedOnly,
    accepted: true,
  });
  assert.equal(yes.dialog, "next-version");
  assert.equal(yes.message, VERSION_DUPLICATE_MESSAGES["next-version"]);
  assert.match(yes.message, /次の版を作成しますか/);
  assert.equal(yes.outcome, "next-version");
  assert.equal(yes.copySourceBudgetVersionId, "bv-2");
  const no = duplicateSeriesDecision({ existingVersions: confirmedOnly });
  assert.equal(no.outcome, "save-blocked");

  // Existing series with a draft: open-draft dialog, never a second draft (V5).
  const withDraft = [
    version(),
    version({
      version_seq: 2,
      status: "下書き",
      budget_version_id: "bv-draft",
    }),
  ];
  const openIt = duplicateSeriesDecision({
    existingVersions: withDraft,
    accepted: true,
  });
  assert.equal(openIt.dialog, "open-draft");
  assert.match(openIt.message, /既存の下書きを開きますか/);
  assert.equal(openIt.outcome, "open-draft");
  assert.equal(openIt.draftBudgetVersionId, "bv-draft");
  assert.equal(
    duplicateSeriesDecision({ existingVersions: withDraft, accepted: false })
      .outcome,
    "save-blocked",
  );

  // 1工事1系列: a mixed-project search result is corrupt input.
  assert.throws(
    () =>
      duplicateSeriesDecision({
        existingVersions: [
          version(),
          version({ project_id: "prj-2", budget_version_id: "bv-x" }),
        ],
      }),
    /single series/,
  );
});

test("App 1 version tab renders the jy2-* series list with lock badges and gated CTA", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /jy2RenderVersionPane/);
  assert.match(source, /jy2-version-table/);
  assert.match(source, /jy2-lock-badge/);
  assert.match(source, /jy2-version-cta/);
  assert.match(source, /createVersionSeriesModel/);
  assert.match(source, /refreshVersions\(\)/);
  // CTA is disabled unless createNextVersion (budget_locked only).
  assert.match(source, /cta\.disabled = !version\.allowedOperations\.createNextVersion/);
  // P-28/V3b note is stated on the pane.
  assert.match(source, /実績は工事帰属で版複製しない/);
  for (const label of ["版種別", "ステータス", "ロック", "次版作成"]) {
    assert.match(source, new RegExp(label));
  }
  // Other tabs keep working: their renderers stay wired in the shell.
  for (const renderer of [
    "jy2RenderSummaryPane",
    "jy2RenderDetailPane",
    "jy2RenderActualPane",
  ]) {
    assert.match(source, new RegExp(`${renderer}\\(`));
  }
  assert.doesNotMatch(source, /className\s*=\s*["']jy-/);
});

test("phase 4e sources never target customize/736 / App 735/736 / kintone REST", () => {
  {
    const source = read("scripts/lib/jikkou-yosan-v2/version-series-model.mjs");
    assert.doesNotMatch(source, /customize\/736/);
    assert.doesNotMatch(source, /\b73[56]\b/);
    assert.doesNotMatch(source, /kintone\.api|bulkRequest/);
  }
  // C-2b: the UI saves only through the executor (no raw record writes).
  const uiSource = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.doesNotMatch(uiSource, /customize\/736/);
  assert.doesNotMatch(uiSource, /\b73[56]\b/);
  assert.doesNotMatch(uiSource, /kintone\.api\((["'])\/k\/v1\/record/);
  assert.doesNotMatch(
    read("scripts/lib/jikkou-yosan-v2/version-series-model.mjs"),
    /kintone\.mjs/,
  );
});

test("rebuild bundles version-series-model before the UI, 736 untouched", () => {
  const state = JSON.parse(read("scripts/data/jikkou-yosan-v2-app-ids.json"));
  for (const key of ["app1", "app2", "app3"]) {
    const appId = state.apps[key].appId;
    assert.ok(appId === null || (Number.isSafeInteger(appId) && appId > 0), key);
    assert.ok(appId !== 735 && appId !== 736, `${key}: appId must never be 735/736`);
  }
  const before736 = protected736Digest();
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "jy2-phase4e-"));
  const tempBundle = path.join(tempDirectory, "desktop.js");
  try {
    execFileSync(
      process.execPath,
      [path.join(root, "scripts/jikkou-yosan-v2-build-desktop.mjs")],
      {
        cwd: root,
        stdio: "pipe",
        env: { ...process.env, JIKKOU_YOSAN_V2_OUTPUT: tempBundle },
      },
    );
    const bundle = readFileSync(tempBundle, "utf8");
    for (const marker of ["APP1", "APP2", "APP3"]) {
      const m = bundle.match(new RegExp(`/\\* @JY_V2_${marker} \\*/ (null|\\d+)`));
      assert.ok(m, `${marker} marker must be present`);
      assert.ok(m[1] !== "735" && m[1] !== "736", `${marker} must never be 735/736`);
    }
    for (const symbol of [
      "createVersionSeriesModel",
      "duplicateSeriesDecision",
      "planNextVersionDraft",
      "VERSION_DUPLICATE_MESSAGES",
      "jy2RenderVersionPane",
      "jy2LockBadge",
    ]) {
      assert.match(bundle, new RegExp(symbol));
    }
    assert.doesNotMatch(bundle, /kintone\.mjs/);
    assert.doesNotMatch(bundle, /APP[123]_ID\s*=\s*(?:735|736)\b/);
    // Module lands before the UI shell source (build order).
    assert.ok(
      bundle.indexOf("function createVersionSeriesModel") <
        bundle.indexOf("function jy2RenderShell"),
    );
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
  assert.equal(protected736Digest(), before736);
});
