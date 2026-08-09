#!/usr/bin/env node
/**
 * O-1: push 前ローカル parity（2026-07-30 浜田 GO）
 * smoke 全量ではない — integrity + selfcheck + evening-0726 + test:wake。
 * SKIP_CIO_LOCAL_PARITY=1 でスキップ（浜田承認下のみ）。
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { runNpmScriptSync } from "./lib/win-hidden-spawn.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (process.env.SKIP_CIO_LOCAL_PARITY === "1") {
  console.warn(
    "[cio:pre-push-local-parity] SKIP_CIO_LOCAL_PARITY=1 — skipped (浜田承認下のみ)",
  );
  process.exit(0);
}

const steps = [
  { type: "npm", script: "verify:ci-rule-integrity" },
  { type: "npm", script: "cio:selfcheck:test" },
  { type: "npm", script: "test:evening-improvements-2026-07-26" },
  { type: "npm", script: "test:wake" },
];

for (const step of steps) {
  console.log(`[cio:pre-push-local-parity] ▶ ${step.script}`);
  const r = runNpmScriptSync(root, step.script, [], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`[cio:pre-push-local-parity] ❌ NG step=${step.script}`);
    process.exit(r.status || 1);
  }
}

console.log("[cio:pre-push-local-parity] ✅ OK");
process.exit(0);
