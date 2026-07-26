#!/usr/bin/env node
/**
 * 内訳コード表 A列 → Ver.02 区分マップを生成する。
 * 正本: C:/tmp/実行予算ver2/内訳で使うコード表.xlsx
 * 出力: scripts/data/jikkou-yosan-v2-code-table-cost-category.json
 *
 *   node scripts/jikkou-yosan-v2-sync-code-table-cost-category.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRel = "scripts/data/jikkou-yosan-v2-code-table-cost-category.json";
const outPath = path.join(root, outRel);

const SECTION_TO_CATEGORY = {
  保安費: "保安",
  施工費: "施工",
  現場経費: "施工",
  その他費用: "施工",
  現場管理費: "給与",
};

const py = `
# -*- coding: utf-8 -*-
from pathlib import Path
import json
import openpyxl

ver2 = next(p for p in Path(r"C:/tmp").iterdir() if p.is_dir() and "ver2" in p.name)
path = next(p for p in ver2.glob("*.xlsx") if not p.name.startswith("~$") and "コード" in p.name)
wb = openpyxl.load_workbook(path, data_only=True)
ws = wb[wb.sheetnames[0]]
merged_a = {}
for rng in ws.merged_cells.ranges:
    if rng.min_col <= 1 <= rng.max_col:
        val = ws.cell(rng.min_row, 1).value
        for r in range(rng.min_row, rng.max_row + 1):
            merged_a[r] = val

def a_val(r):
    return merged_a.get(r, ws.cell(r, 1).value)

last = None
by_code = {}
by_name = {}
conflicts = []
for r in range(2, ws.max_row + 1):
    v = a_val(r)
    if v is not None and str(v).strip():
        last = str(v).strip()
    if last is None or last == "項目":
        continue
    code_raw = ws.cell(r, 2).value
    name_raw = ws.cell(r, 3).value
    if code_raw is None and name_raw is None:
        continue
    code = str(code_raw).strip() if code_raw is not None else ""
    # openpyxl may give int
    if code.endswith(".0"):
        code = code[:-2]
    name = str(name_raw).strip() if name_raw is not None else ""
    # 依頼者訂正: （塗）レンタルの Excel コード 10300 は誤記。正は 11600。
    CODE_OVERRIDES_BY_NAME = {"（塗）レンタル": "11600"}
    if name in CODE_OVERRIDES_BY_NAME:
        code = CODE_OVERRIDES_BY_NAME[name]
    section = last
    SECTION_TO_CATEGORY = ${JSON.stringify(SECTION_TO_CATEGORY)}
    cat = SECTION_TO_CATEGORY.get(section)
    if cat is None:
        continue
    entry = {"sectionA": section, "costCategory": cat, "workTypeName": name}
    if code:
        prev = by_code.get(code)
        if prev and prev["costCategory"] != cat:
            conflicts.append({"code": code, "a": prev, "b": entry})
        else:
            by_code[code] = entry
    if name:
        prev = by_name.get(name)
        if prev and prev["costCategory"] != cat:
            conflicts.append({"name": name, "a": prev, "b": entry})
        else:
            by_name[name] = entry

out = {
    "source": str(path).replace("\\\\", "/"),
    "sourceFile": path.name,
    "generatedAt": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
    "rule": {
        "保安費": "保安",
        "施工費": "施工",
        "現場経費": "施工",
        "その他費用": "施工",
        "現場管理費": "給与",
    },
    "byCode": {k: {"sectionA": v["sectionA"], "costCategory": v["costCategory"]} for k, v in by_code.items()},
    "byName": {k: {"sectionA": v["sectionA"], "costCategory": v["costCategory"]} for k, v in by_name.items()},
    "conflicts": conflicts,
}
print(json.dumps(out, ensure_ascii=False, indent=2))
`;

const run = spawnSync("python", ["-X", "utf8", "-c", py], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
});
if (run.status !== 0) {
  console.error(run.stderr || run.stdout);
  process.exit(run.status || 1);
}
const data = JSON.parse(run.stdout);
if (data.conflicts?.length) {
  console.error("[sync-code-table-cost-category] NG conflicts", data.conflicts);
  process.exit(2);
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(
  `[sync-code-table-cost-category] OK → ${outRel} codes=${Object.keys(data.byCode).length} names=${Object.keys(data.byName).length}`,
);
