#!/usr/bin/env node
/**
 * #D-CLOSE-02 — 締め時: checkpoint 最終更新が当日(JST) かつ bridge.gitHead ∈ {HEAD, parent}
 *
 * Usage: node scripts/verify-session-close-handoff-freshness.mjs [--warn-only] [--wake-context]
 *
 * --wake-context … bootstrap/WAKE 専用。closeStatus が前日締め（closed-day 等）のとき
 *   「最終更新≠当日」は NG にしない（翌日 WAKE の偽陽性根絶）。bridge.gitHead は常に検査。
 *   締め（close-preflight / close-git）では付けない — 当日 stamp 必須を維持。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { bridgePath } from "./lib/cio-session-bridge.mjs";
import { CHECKPOINT_REL } from "./lib/cio-checkpoint-read.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const warnOnly = process.argv.includes("--warn-only");
const wakeContext = process.argv.includes("--wake-context");

function git(args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return (r.stdout || "").trim();
}

function jstTodayYmd() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function main() {
  const issues = [];
  const cpPath = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(cpPath)) {
    issues.push(`checkpoint missing: ${CHECKPOINT_REL}`);
  } else {
    const text = fs.readFileSync(cpPath, "utf8");
    const m = text.match(/\*\*最終更新\*\*\s*:\s*(\d{4}-\d{2}-\d{2})/);
    const today = jstTodayYmd();
    const closeStatusM = text.match(/\*\*closeStatus\*\*\s*:\s*(\S+)/i);
    const closeStatus = closeStatusM ? closeStatusM[1].trim().toLowerCase() : "";
    const priorClose =
      /^(closed-day|closed|full|closed-full)$/.test(closeStatus) ||
      closeStatus.includes("closed");
    if (!m) {
      issues.push('checkpoint に「**最終更新**: YYYY-MM-DD」が無い');
    } else if (m[1] !== today) {
      if (wakeContext && priorClose && m[1] < today) {
        console.log(
          `[verify-session-close-handoff-freshness] WAKE: 最終更新 ${m[1]}（closeStatus=${closeStatus || "?"}）— 前日締めとして日付検査スキップ`,
        );
      } else {
        issues.push(
          `checkpoint 最終更新 ${m[1]} ≠ 当日 JST ${today}（#D-CLOSE-02 — 締め前に本文を当日へ更新）`,
        );
      }
    }
  }

  const bridgeFile = bridgePath(root);
  if (!fs.existsSync(bridgeFile)) {
    issues.push("latest-session-bridge.json missing");
  } else {
    let bridge;
    try {
      bridge = JSON.parse(fs.readFileSync(bridgeFile, "utf8"));
    } catch (err) {
      issues.push(`bridge JSON parse: ${err.message}`);
      bridge = null;
    }
    if (bridge) {
      const head = git(["rev-parse", "--short", "HEAD"]);
      const parent = git(["rev-parse", "--short", "HEAD^"]);
      const gh = String(bridge.gitHead || "").trim();
      if (!gh || gh === "unknown") {
        issues.push("bridge.gitHead が空/unknown");
      } else if (gh !== head && gh !== parent) {
        issues.push(
          `bridge.gitHead=${gh} ∉ {HEAD=${head}, parent=${parent}}（#D-CLOSE-02 — grandparent 許容なし）`,
        );
      }
    }
  }

  if (issues.length) {
    if (warnOnly) {
      console.warn(
        `[verify-session-close-handoff-freshness] WARN #D-CLOSE-02 (${issues.length})`,
      );
      for (const issue of issues) console.warn(`  - ${issue}`);
      process.exit(0);
    }
    console.error(
      `[verify-session-close-handoff-freshness] NG #D-CLOSE-02 (${issues.length})`,
    );
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  console.log("[verify-session-close-handoff-freshness] OK #D-CLOSE-02");
  process.exit(0);
}

main();
