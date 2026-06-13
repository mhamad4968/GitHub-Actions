#!/usr/bin/env node
/**
 * R-17-1: customize/ を 2 アプリ以上変更したら portfolio BUILD 監査を強制。
 *
 * Usage:
 *   node scripts/cio-after-customize-change.mjs
 *   node scripts/cio-after-customize-change.mjs --staged
 *   node scripts/cio-after-customize-change.mjs --base=origin/main
 */
import { spawnSync } from "node:child_process";
import { runNpmScriptSync } from "./lib/win-hidden-spawn.mjs";

const staged = process.argv.includes("--staged");
const baseArg = process.argv.find((a) => a.startsWith("--base="));
const base = baseArg ? baseArg.slice("--base=".length) : "HEAD";

const diffArgs = staged
  ? ["diff", "--name-only", "--cached"]
  : ["diff", "--name-only", base];
const names = spawnSync("git", diffArgs, { encoding: "utf8", cwd: process.cwd() });
if (names.status !== 0) {
  console.error(`[cio-after-customize] diff failed: ${names.stderr || names.stdout}`);
  process.exit(names.status || 2);
}

const apps = new Set();
for (const line of (names.stdout || "").split(/\r?\n/)) {
  const t = line.trim();
  if (!t.startsWith("customize/")) continue;
  const mNum = /^customize\/(\d{3})\//.exec(t);
  if (mNum) {
    apps.add(mNum[1]);
    continue;
  }
  if (/^customize\/ops-guide\//.test(t)) apps.add("668");
}

const list = [...apps].sort();
console.log(`[cio-after-customize] customize apps in diff: ${list.length ? list.join(", ") : "(none)"}`);

if (list.length < 2) {
  console.log("[cio-after-customize] OK (<2 apps, audit not required by R-17-1)");
  process.exit(0);
}

console.log("[cio-after-customize] R-17-1: 2+ apps changed → running cio:audit:portfolio:strict");
const audit = runNpmScriptSync(process.cwd(), "cio:audit:portfolio:strict", [], {
  stdio: "inherit",
  env: process.env,
});
if (audit.status !== 0) {
  console.error("[cio-after-customize] NG: portfolio audit failed — fix before commit/push/handoff");
  process.exit(audit.status || 2);
}
console.log("[cio-after-customize] OK portfolio audit 8/8");
process.exit(0);
