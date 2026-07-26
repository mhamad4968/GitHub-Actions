#!/usr/bin/env node
/**
 * データマスタの「明細」(I) と「取引先」(J) を会社名リスト1本に統合する。
 * 依頼者確認（2026-07-26）: どちらも会社名っぽいのでまとめてよい。
 *
 * 正本 Excel: C:/tmp/実行予算ver2/工事予算（実行予算）(案) (1).xlsx → データマスタ
 * 出力:
 *   - scripts/data/jikkou-yosan-v2-excel-name-lists.json の vendors / vendorsSource
 *   - customize/jikkou-yosan-v2-app1/desktop.ui.js の JY2_VENDOR_SEEDS
 *
 *   node scripts/jikkou-yosan-v2-sync-vendor-list.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(
  root,
  "scripts/data/jikkou-yosan-v2-excel-name-lists.json",
);
const uiPath = path.join(root, "customize/jikkou-yosan-v2-app1/desktop.ui.js");

const py = `
# -*- coding: utf-8 -*-
from pathlib import Path
import json
import openpyxl

ver2 = next(p for p in Path(r"C:/tmp").iterdir() if p.is_dir() and "ver2" in p.name)
path = next(
    p
    for p in ver2.glob("*.xlsx")
    if not p.name.startswith("~$") and "工事予算" in p.name
)
wb = openpyxl.load_workbook(path, data_only=True)
ws = wb["データマスタ"]

def col_values(col_idx, skip_headers):
    out = []
    seen = set()
    for r in range(1, ws.max_row + 1):
        raw = ws.cell(r, col_idx).value
        if raw is None:
            continue
        s = str(raw).strip()
        if not s or s in skip_headers:
            continue
        if s in seen:
            continue
        seen.add(s)
        out.append(s)
    return out

# 出現順: 取引先(J) を先に、明細(I) の未収録だけ後段へ。
j_list = col_values(10, {"取引先"})
i_list = col_values(9, {"明細"})
merged = list(j_list)
seen = set(j_list)
for name in i_list:
    if name not in seen:
        merged.append(name)
        seen.add(name)

print(json.dumps({
    "source": str(path).replace("\\\\", "/"),
    "sourceFile": path.name,
    "vendors": merged,
    "vendorsSource": "データマスタ!I∪J（会社名リスト1本・J出現順→I追加）",
    "counts": {"I": len(i_list), "J": len(j_list), "union": len(merged)},
}, ensure_ascii=False))
`;

const run = spawnSync("python", ["-X", "utf8", "-c", py], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 4 * 1024 * 1024,
});
if (run.status !== 0) {
  console.error(run.stderr || run.stdout);
  process.exit(run.status || 1);
}
const extracted = JSON.parse(run.stdout);
const vendors = extracted.vendors;
if (!Array.isArray(vendors) || vendors.length < 10) {
  console.error("[sync-vendor-list] NG: vendors too short", extracted);
  process.exit(2);
}

const canon = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
canon.vendors = vendors;
canon.vendorsSource = extracted.vendorsSource;
canon.vendorsNote =
  "依頼者確認 2026-07-26: 明細(I)と取引先(J)は会社名リストとして1本化。";
fs.writeFileSync(jsonPath, `${JSON.stringify(canon, null, 2)}\n`, "utf8");

const ui = fs.readFileSync(uiPath, "utf8");
const re =
  /const JY2_VENDOR_SEEDS = Object\.freeze\(\[[\s\S]*?\]\);/;
if (!re.test(ui)) {
  console.error("[sync-vendor-list] NG: JY2_VENDOR_SEEDS not found");
  process.exit(3);
}
const body = vendors.map((v) => `    ${JSON.stringify(v)},`).join("\n");
const next = ui.replace(
  re,
  `const JY2_VENDOR_SEEDS = Object.freeze([\n${body}\n  ]);`,
);
fs.writeFileSync(uiPath, next, "utf8");

console.log(
  `[sync-vendor-list] OK → vendors=${vendors.length} (I=${extracted.counts.I} J=${extracted.counts.J}) source=${extracted.sourceFile}`,
);
