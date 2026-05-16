#!/usr/bin/env node
/**
 * ポートフォリオ customize を順に preflight → deploy（6b3d370 系の取りこぼし復旧用）。
 * Usage: node scripts/cio-sync-portfolio-deploy.mjs [--apps=677,679,682,683]
 */
import { spawnSync } from "node:child_process";
import { PORTFOLIO_CUSTOMIZE } from "./cio-portfolio-apps.mjs";

const DEFAULT_APPS = ["627", "668", "686"];
const argApps = process.argv.find((a) => a.startsWith("--apps="));
const apps = argApps
  ? argApps
      .slice("--apps=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : DEFAULT_APPS;

const note = process.argv.find((a) => a.startsWith("--note="))?.slice("--note=".length) || "portfolio-sync-after-6b3d370";

function deployScriptFor(app) {
  const row = PORTFOLIO_CUSTOMIZE.find((p) => p.id === app);
  return row?.deploy || `deploy:${app}`;
}

for (const app of apps) {
  const deployScript = deployScriptFor(app);
  console.log(`\n=== app ${app} preflight ===`);
  let r = spawnSync("npm", ["run", `cio:preflight:${app}`, "--", "--note", note], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });
  if (r.status !== 0) process.exit(r.status || 2);

  console.log(`\n=== app ${app} deploy (${deployScript}) ===`);
  r = spawnSync("npm", ["run", deployScript], { stdio: "inherit", shell: true, cwd: process.cwd() });
  if (r.status !== 0) process.exit(r.status || 2);
}
console.log("\n[cio-sync-portfolio-deploy] all SUCCESS");
