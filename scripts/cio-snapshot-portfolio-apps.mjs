#!/usr/bin/env node
/**
 * ポートフォリオアプリのフォーム定義スナップショット（revision:snapshot ラッパー）。
 * Usage: npx dotenv -e .env -e .env.proxy -- node scripts/cio-snapshot-portfolio-apps.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

import { PORTFOLIO_SNAPSHOT_IDS as APPS } from "./cio-portfolio-apps.mjs";
const label = `portfolio-${new Date().toISOString().slice(0, 10)}`;

for (const app of APPS) {
  const r = spawnSync(
    process.execPath,
    [path.join("scripts", "revision-snapshot.mjs"), `--app=${app}`, `--label=${label}`],
    { stdio: "inherit", cwd: process.cwd(), env: process.env },
  );
  if (r.status !== 0) {
    console.error(`[cio-snapshot-portfolio] failed app=${app}`);
    process.exit(r.status || 2);
  }
}
console.log("[cio-snapshot-portfolio] done");
