#!/usr/bin/env node
/**
 * 2026-07-26 夕反省 GO 実装テスト（#S-R63-01 / #S-REPORT-01 / runbooks / #CON）
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  expectedMedalLine,
  lastTierPath,
} from "./lib/cio-turn-start-tier.mjs";
import { coalesceReportRel } from "./lib/resolve-archived-report.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

function run(rel, args = []) {
  return spawnSync(node, [path.join(root, rel), ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

for (const rel of [
  "docs/approved-changes/2026-07-26-evening-reflection-hamada-go.md",
  "docs/runbooks/requester-doc-review-one-at-a-time.md",
  "docs/runbooks/docx-review-screen-check.md",
  "docs/runbooks/evening-reflection-scope.md",
  "docs/reports/2026-07-26-evening-reflection.md",
]) {
  assert.ok(fs.existsSync(path.join(root, coalesceReportRel(root, rel))), `missing ${rel}`);
}

// #CON-01 wording
{
  const scope = fs.readFileSync(
    path.join(root, "docs/runbooks/evening-reflection-scope.md"),
    "utf8",
  );
  assert.match(scope, /#CON-01/);
  assert.match(scope, /画面・Excel・計算の断定|画面挙動の断定/);
  assert.match(scope, /commit／判定関数|式セル/);
  assert.match(scope, /Excel/);
}

// #CON-02 wording
{
  const et = fs.readFileSync(
    path.join(root, ".cursor/rules/every-turn-rules-confirm.mdc"),
    "utf8",
  );
  assert.match(et, /#CON-02/);
  assert.match(et, /外部提出物/);
  assert.match(et, /§50-3-8 スキップ理由/);
}

// #S-R63-01: dirty customize → --clear exit 1; --force clears
{
  const tmp = path.join(
    root,
    "customize/jikkou-yosan-v2-app1/.r63-s01-test-tmp.txt",
  );
  const stamp = path.join(root, "data/cio-r63-v2-pending.json");
  const hadStamp = fs.existsSync(stamp);
  const stampBackup = hadStamp ? fs.readFileSync(stamp) : null;
  fs.writeFileSync(tmp, "r63-test\n", "utf8");
  try {
    const mark = run("scripts/cio-guard-r63-v2-dirty.mjs", [
      "--mark-pending",
      "756",
    ]);
    assert.equal(mark.status, 0, mark.stderr || mark.stdout);
    const blocked = run("scripts/cio-guard-r63-v2-dirty.mjs", ["--clear"]);
    assert.equal(blocked.status, 1, "dirty --clear must exit 1");
    assert.match(blocked.stderr || "", /#S-R63-01/);
    const forced = run("scripts/cio-guard-r63-v2-dirty.mjs", [
      "--clear",
      "--force",
    ]);
    assert.equal(forced.status, 0, forced.stderr || forced.stdout);
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    if (hadStamp) fs.writeFileSync(stamp, stampBackup);
    else if (fs.existsSync(stamp)) fs.unlinkSync(stamp);
  }
}

// #S-REPORT-01: --check-medal-line mismatch → exit 1
// last-tier.json は logs/ 配下でローカル作業中に strict になり得るため、
// 検査中は standard/default に固定して CI／開発機の差を無くす（環境依存 NG の再発防止）。
{
  const wrong = path.join(os.tmpdir(), `jy2-report-medal-wrong-${Date.now()}.txt`);
  const okPath = path.join(os.tmpdir(), `jy2-report-medal-ok-${Date.now()}.txt`);
  const medal = expectedMedalLine("default");
  const bodyWrong = `[§1-2-3 ティア判定: L2] test
【適用憲法】§1e
[🎖️ 本セッション割当] CIO=WRONG | Composer=x | DeepSeek=y | Kimi=z
[ルール確認] test
Goal: evening-improvements medal-line fixture
Touch: scripts/cio-chat-report-selfcheck.mjs

□ A: §1四行あり
□ A1: ダブルチェック（誰と・結果）DeepSeek=ok
ダブルチェック要約: DeepSeekが短問を実施し本体が突合した

【セッション報告チェックシート】
CHECKSHEET_VERSION: 2
CHECKSHEET_OK: yes
SECOND_REVIEWER: deepseek
SPEC_TOUCHED: no
DESTRUCTIVE_OPS: none
DRY_RUN_TO_APPLY_GAP: n/a
`;
  const bodyOk = bodyWrong.replace(
    /\[🎖️ 本セッション割当\][^\n]*/u,
    medal,
  );
  fs.writeFileSync(wrong, bodyWrong, "utf8");
  fs.writeFileSync(okPath, bodyOk, "utf8");
  const tierFile = lastTierPath(root);
  const hadTier = fs.existsSync(tierFile);
  const tierBackup = hadTier ? fs.readFileSync(tierFile) : null;
  try {
    fs.mkdirSync(path.dirname(tierFile), { recursive: true });
    fs.writeFileSync(
      tierFile,
      `${JSON.stringify(
        { tier: "standard", lane: "default", at: "2026-07-30T00:00:00.000Z" },
        null,
        2,
      )}\n`,
      "utf8",
    );
    const bad = run("scripts/cio-chat-report-selfcheck.mjs", [
      "--strict-head",
      "--require-v2",
      "--require-a1",
      "--check-medal-line",
      "--file",
      wrong,
    ]);
    assert.equal(bad.status, 1, "mismatch must exit 1 on report path");
    assert.match(bad.stderr || "", /medal-line mismatch/);

    const good = run("scripts/cio-chat-report-selfcheck.mjs", [
      "--strict-head",
      "--require-v2",
      "--require-a1",
      "--check-medal-line",
      "--file",
      okPath,
    ]);
    assert.equal(good.status, 0, good.stderr || good.stdout);
  } finally {
    if (hadTier) fs.writeFileSync(tierFile, tierBackup);
    else if (fs.existsSync(tierFile)) fs.unlinkSync(tierFile);
    if (fs.existsSync(wrong)) fs.unlinkSync(wrong);
    if (fs.existsSync(okPath)) fs.unlinkSync(okPath);
  }
}

// scope verify
{
  const r = run("scripts/verify-evening-reflection-scope.mjs");
  assert.equal(r.status, 0, r.stderr || r.stdout);
}

console.log("[test:evening-improvements-2026-07-26] OK");
