/**
 * #D-R63-01 — 756/757/758 deploy 後、Ver.02 customize が dirty なら次作業を止める。
 *
 * Usage:
 *   node scripts/cio-guard-r63-v2-dirty.mjs              # pending+dirty → exit 1
 *   node scripts/cio-guard-r63-v2-dirty.mjs --mark-pending 756
 *   node scripts/cio-guard-r63-v2-dirty.mjs --clear       # 強制クリア
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stampPath = path.join(root, "data/cio-r63-v2-pending.json");
const V2_PREFIXES = [
  "customize/jikkou-yosan-v2-app1/",
  "customize/jikkou-yosan-v2-app2/",
  "customize/jikkou-yosan-v2-app3/",
];

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function listDirtyV2() {
  const status = git(["status", "--porcelain"]);
  if (!status) return [];
  const hits = [];
  for (const line of status.split("\n")) {
    const file = line.slice(3).replace(/ -> .*/, "").trim().replace(/\\/g, "/");
    if (V2_PREFIXES.some((p) => file.startsWith(p) || file.includes(`/${p}`))) {
      hits.push(file);
    }
    // also catch unquoted rename paths
    if (file.includes("jikkou-yosan-v2-app")) hits.push(file);
  }
  return [...new Set(hits)];
}

const args = process.argv.slice(2);
if (args[0] === "--mark-pending") {
  const appId = String(args[1] || "").trim();
  if (!["756", "757", "758"].includes(appId)) {
    console.error("[cio-guard-r63-v2-dirty] --mark-pending requires 756|757|758");
    process.exit(2);
  }
  let stamp = { apps: [], markedAt: new Date().toISOString() };
  if (fs.existsSync(stampPath)) {
    try {
      stamp = { ...stamp, ...JSON.parse(fs.readFileSync(stampPath, "utf8")) };
    } catch {
      /* replace */
    }
  }
  const apps = new Set([...(stamp.apps || []), appId]);
  stamp = {
    apps: [...apps].sort(),
    markedAt: new Date().toISOString(),
    note: "#D-R63-01 deploy 後は同一セッションで customize を commit。dirty のまま次作業禁止。",
  };
  fs.mkdirSync(path.dirname(stampPath), { recursive: true });
  fs.writeFileSync(stampPath, `${JSON.stringify(stamp, null, 2)}\n`, "utf8");
  console.log(`[cio-guard-r63-v2-dirty] marked pending apps=${stamp.apps.join(",")}`);
  process.exit(0);
}

if (args[0] === "--clear") {
  if (fs.existsSync(stampPath)) fs.unlinkSync(stampPath);
  console.log("[cio-guard-r63-v2-dirty] cleared pending stamp");
  process.exit(0);
}

const dirty = listDirtyV2();
const hasStamp = fs.existsSync(stampPath);

if (!hasStamp) {
  console.log("[cio-guard-r63-v2-dirty] OK — no pending R63 stamp");
  process.exit(0);
}

if (dirty.length === 0) {
  fs.unlinkSync(stampPath);
  console.log("[cio-guard-r63-v2-dirty] OK — Ver.02 clean; cleared pending stamp");
  process.exit(0);
}

console.error(
  "[cio-guard-r63-v2-dirty] NG — #D-R63-01: Ver.02 deploy 後に customize が dirty。commit してから次作業:",
);
for (const h of dirty) console.error(`  ${h}`);
try {
  const stamp = JSON.parse(fs.readFileSync(stampPath, "utf8"));
  console.error(`  pending apps: ${(stamp.apps || []).join(",")}`);
} catch {
  /* ignore */
}
process.exit(1);
