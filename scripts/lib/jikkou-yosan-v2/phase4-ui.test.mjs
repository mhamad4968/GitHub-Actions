import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { LOCK_STATES, allowedOperations } from "./lock.mjs";
import { UI_TABS, createUiModel, tabEditability } from "./ui-model.mjs";

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

test("App 1 exposes SPEC §6.1 four tabs (summary embeds header / 予実 / バージョン)", () => {
  assert.deepEqual(UI_TABS, [
    { id: "summary", label: "総括表" },
    { id: "detail", label: "内訳" },
    { id: "actual", label: "予実管理" },
    { id: "version", label: "バージョン管理" },
  ]);
});

test("tab readOnly flags come from the three-state allowed operations", () => {
  for (const state of Object.values(LOCK_STATES)) {
    const operations = allowedOperations(state);
    const model = createUiModel(state);
    assert.deepEqual(model.allowedOperations, operations);
    assert.deepEqual(tabEditability(state), {
      summary: !operations.editBudget,
      detail: !operations.editBudget,
      actual: !operations.editActuals,
      version: !operations.createNextVersion,
    });
    assert.deepEqual(
      Object.fromEntries(model.tabs.map(({ id, readOnly }) => [id, readOnly])),
      model.readOnly,
    );
  }
});

test("App 1 source is a jy2-prefixed empty shell without full editors", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /jy2-header-stub/);
  assert.match(source, /jy2-pane/);
  assert.doesNotMatch(source, /className\s*=\s*["']jy-/);
  assert.doesNotMatch(source, /請負編集|内訳編集|管理者グループ/);
});

test("App 2 and App 3 block direct save, delete, and process events", () => {
  for (const app of ["app2", "app3"]) {
    const source = read(`customize/jikkou-yosan-v2-${app}/desktop.js`);
    assert.match(
      source,
      /正規接点は「実行予算書作成支援ツールver02」のカスタムUIのみ/,
    );
    assert.match(source, /直接保存・削除不可/);
    assert.match(source, /app\.record\.create\.submit/);
    assert.match(source, /app\.record\.edit\.submit/);
    assert.match(source, /app\.record\.detail\.delete\.submit/);
    assert.match(source, /app\.record\.detail\.process\.proceed/);
  }
});

test("app ID sync and build stay network-free and never inject 735/736", () => {
  // LIVE create has legitimately started, so state appIds may be real.
  // The invariant is: null or a positive id that is never 735/736.
  const state = JSON.parse(
    read("scripts/data/jikkou-yosan-v2-app-ids.json"),
  );
  for (const key of ["app1", "app2", "app3"]) {
    const appId = state.apps[key].appId;
    assert.ok(
      appId === null || (Number.isSafeInteger(appId) && appId > 0),
      `${key}: appId must be null or a positive integer`,
    );
    assert.ok(appId !== 735 && appId !== 736, `${key}: appId must never be 735/736`);
  }
  const before736 = protected736Digest();
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "jy2-phase4a-"));
  try {
    // Sync against a temp copy so the committed customize files stay untouched.
    for (const name of ["desktop.ui.js", "desktop.js"]) {
      copyFileSync(
        path.join(root, "customize/jikkou-yosan-v2-app1", name),
        path.join(tempDirectory, name),
      );
    }
    execFileSync(
      process.execPath,
      [path.join(root, "scripts/jikkou-yosan-v2-sync-app-ids.mjs")],
      {
        cwd: root,
        stdio: "pipe",
        env: { ...process.env, JIKKOU_YOSAN_V2_SYNC_DIR: tempDirectory },
      },
    );
    const synced = readFileSync(path.join(tempDirectory, "desktop.ui.js"), "utf8");
    for (const [marker, key] of [
      ["APP1", "app1"],
      ["APP2", "app2"],
      ["APP3", "app3"],
    ]) {
      const expected = state.apps[key].appId === null ? "null" : String(state.apps[key].appId);
      assert.match(synced, new RegExp(`/\\* @JY_V2_${marker} \\*/ ${expected}\\b`));
    }
    const tempBundle = path.join(tempDirectory, "bundle.js");
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
    assert.doesNotMatch(bundle, /APP[123]_ID\s*=\s*(?:735|736)\b/);
    assert.doesNotMatch(bundle, /kintone\.mjs/);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
  assert.equal(protected736Digest(), before736);
});
