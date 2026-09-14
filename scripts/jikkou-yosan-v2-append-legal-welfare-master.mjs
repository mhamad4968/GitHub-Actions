#!/usr/bin/env node
/**
 * 運用 Excel 追記 + cost-mgmt JSON 見本同期。
 * 正本: docs/plans/2026-09-14-jikkou-yosan-v2-uchiwake-gaichu-overhead-legal-welfare-spec.md
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OVERHEAD_WORK_TYPE_NAMES } from "./lib/jikkou-yosan-v2/overhead-work-types.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(
  root,
  "docs/plans/2026-09-13-jikkou-yosan-v2-cost-mgmt-worktype-master.json",
);
const mjsPath = path.join(root, "scripts/lib/jikkou-yosan-v2/cost-mgmt-v2-master.mjs");

function legalItem(base) {
  const code = String(base.workTypeCode || "");
  const keyPrefix = code || base.systemWorkType;
  return {
    section: "施工",
    workTypeCode: code,
    systemWorkType: base.systemWorkType,
    himoku: "その他費用",
    workType: "法定福利費",
    workTypeKey: `${keyPrefix}|法定福利費`,
    dayNight: false,
  };
}

function syncJson() {
  const doc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const names = new Set(OVERHEAD_WORK_TYPE_NAMES);
  const next = [];
  for (const item of doc.items) {
    next.push(item);
    if (!names.has(item.systemWorkType) || item.himoku !== "外注費") continue;
    const code = String(item.workTypeCode || "");
    const already = doc.items.some(
      (row) =>
        row.systemWorkType === item.systemWorkType &&
        String(row.workTypeCode || "") === code &&
        row.workType === "法定福利費",
    );
    if (already) continue;
    if (next.some((row) => row.workTypeKey === legalItem(item).workTypeKey)) continue;
    next.push(legalItem(item));
  }
  doc.items = next;
  doc.decidedAt = "2026-09-14";
  fs.writeFileSync(jsonPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  const mjs = `/** Auto-generated from マスタ整理（システム工種）.xlsx. Do not edit by hand. */\nexport const CMV2_MASTER = Object.freeze(${JSON.stringify(doc)});\nexport const CMV2_MASTER_ITEMS = CMV2_MASTER.items;\n`;
  fs.writeFileSync(mjsPath, mjs, "utf8");
  console.log("[append-legal-welfare] JSON+mjs items=", doc.items.length);
}

function appendExcel() {
  const py = path.join(root, "scripts/jikkou-yosan-v2-append-legal-welfare-excel.py");
  const r = spawnSync("python", [py], { encoding: "utf8", cwd: root });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    throw new Error("excel append failed");
  }
}

syncJson();
appendExcel();
