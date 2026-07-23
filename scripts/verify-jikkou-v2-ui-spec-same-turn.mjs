#!/usr/bin/env node
/**
 * #R-SPEC-01 — App756 UI 変更と redesign SPEC の同一ターン更新
 *
 * staged / unstaged で desktop.ui.js が変わっているとき、
 * redesign SPEC も同じ作業ツリー差分に含まれていなければ fail。
 *
 * Usage:
 *   node scripts/verify-jikkou-v2-ui-spec-same-turn.mjs
 *   node scripts/verify-jikkou-v2-ui-spec-same-turn.mjs --cached-only
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UI = "customize/jikkou-yosan-v2-app1/desktop.ui.js";
const SPEC = "docs/plans/2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md";
const cachedOnly = process.argv.includes("--cached-only");

function gitLines(args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return (r.stdout || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function changedFiles() {
  const sets = [
    gitLines(["diff", "--name-only", "--cached"]),
  ];
  if (!cachedOnly) {
    sets.push(gitLines(["diff", "--name-only", "HEAD"]));
    sets.push(gitLines(["diff", "--name-only"]));
  }
  return new Set(sets.flat());
}

function main() {
  const changed = changedFiles();
  if (!changed.has(UI)) {
    console.log("[verify-jikkou-v2-ui-spec-same-turn] skip — desktop.ui.js unchanged");
    process.exit(0);
  }
  if (!changed.has(SPEC)) {
    console.error("[verify-jikkou-v2-ui-spec-same-turn] NG #R-SPEC-01");
    console.error(`  ${UI} が変更されているが ${SPEC} が同一差分に無い`);
    console.error("  → 見た目変更と同じターンで §6.2 / 該当 U・D を更新してから進む");
    process.exit(1);
  }
  console.log("[verify-jikkou-v2-ui-spec-same-turn] OK #R-SPEC-01");
  process.exit(0);
}

main();
