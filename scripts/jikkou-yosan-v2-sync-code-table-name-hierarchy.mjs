#!/usr/bin/env node
/**
 * 内訳コード表 → 明細3列（費目／種別（補助）／定義及び品名）の階層マスタを生成する。
 * 正本: C:/tmp/実行予算ver2/内訳で使うコード表.xlsx
 * 出力: scripts/data/jikkou-yosan-v2-code-table-name-hierarchy.json
 *
 *   node scripts/jikkou-yosan-v2-sync-code-table-name-hierarchy.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRel = "scripts/data/jikkou-yosan-v2-code-table-name-hierarchy.json";
const outPath = path.join(root, outRel);

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

def cell(r, c):
    v = ws.cell(r, c).value
    if v is None:
        return ""
    s = str(v).strip()
    if s.endswith(".0") and s[:-2].isdigit():
        s = s[:-2]
    return s

def is_blank_or_dash(s):
    return (not s) or s == "-" or s == "－" or s == "—"

last_section = None
# key = workTypeCode or "__name__:" + workTypeName when code empty
by_code = {}
by_name = {}
all_himoku = []
types_by_himoku = {}
defs_by_type = {}

def ensure_work(bucket, key, *, code, name, section):
    if key not in bucket:
        bucket[key] = {
            "workTypeCode": code,
            "workTypeName": name,
            "sectionA": section,
            "himoku": [],
            "himokuDefault": "",
            "typesByHimoku": {},
            "allTypes": [],
            "allDefinitions": [],
        }
    return bucket[key]

for r in range(2, ws.max_row + 1):
    v = a_val(r)
    if v is not None and str(v).strip():
        last_section = str(v).strip()
    if last_section is None or last_section in ("項目", "頁"):
        # header rows
        pass
    # skip pure header row 2-3
    if r <= 3:
        continue

    code = cell(r, 2)
    wname = cell(r, 3)
    himoku_code = cell(r, 4)
    himoku = cell(r, 5)
    type_code = cell(r, 6)
    type_name = cell(r, 7)
    definition = cell(r, 8)

    if not code and not wname and not himoku and not type_name and not definition:
        continue

    if himoku and himoku not in all_himoku:
        all_himoku.append(himoku)

    if himoku and not is_blank_or_dash(type_name):
        types_by_himoku.setdefault(himoku, [])
        if type_name not in types_by_himoku[himoku]:
            types_by_himoku[himoku].append(type_name)
        if definition:
            defs_by_type.setdefault(type_name, [])
            if definition not in defs_by_type[type_name]:
                defs_by_type[type_name].append(definition)

    targets = []
    if code or wname:
        if code:
            entry = ensure_work(by_code, code, code=code, name=wname, section=last_section or "")
            targets.append(entry)
            if wname:
                by_name[wname] = entry
        elif wname:
            entry = ensure_work(by_name, wname, code="", name=wname, section=last_section or "")
            targets.append(entry)
    # himoku-only rows (no work type): still contribute to global lists above

    for entry in targets:
        if himoku:
            if himoku not in entry["himoku"]:
                entry["himoku"].append(himoku)
            if not entry["himokuDefault"]:
                entry["himokuDefault"] = himoku
            entry["typesByHimoku"].setdefault(himoku, [])
            if not is_blank_or_dash(type_name) and type_name not in entry["typesByHimoku"][himoku]:
                entry["typesByHimoku"][himoku].append(type_name)
            if not is_blank_or_dash(type_name) and type_name not in entry["allTypes"]:
                entry["allTypes"].append(type_name)
        if definition and definition not in entry["allDefinitions"]:
            entry["allDefinitions"].append(definition)
        if himoku_code:
            entry.setdefault("himokuCodes", {})[himoku] = himoku_code
        if type_code and not is_blank_or_dash(type_name):
            entry.setdefault("typeCodes", {})[type_name] = type_code

# 依頼者説明文: 塗装工事・修繕等工事・軌道工事などには、
# 材料費〜法定福利費の費目メニューを出す。予備費も一旦ここに含める。
CONSTRUCTION_HIMOKU_MENU = [
    "材料費",
    "労務費",
    "外注費",
    "工具･機械使用料",
    "現場経費",
    "諸経費",
    "法定福利費",
    "予備費",
]
import re
CONSTRUCTION_NAME_RE = re.compile(r"工事|調査設計|外注試験|交通規制")

def expand_construction(entry):
    name = entry.get("workTypeName") or ""
    if not CONSTRUCTION_NAME_RE.search(name):
        entry["constructionMenu"] = False
        return entry
    merged = []
    for h in CONSTRUCTION_HIMOKU_MENU + list(entry.get("himoku") or []):
        if h and h not in merged:
            merged.append(h)
    entry["himoku"] = merged
    entry["constructionMenu"] = True
    if not entry.get("himokuDefault"):
        entry["himokuDefault"] = "外注費" if "外注費" in merged else (merged[0] if merged else "")
    return entry

for key, entry in list(by_code.items()):
    by_code[key] = expand_construction(entry)
for key, entry in list(by_name.items()):
    by_name[key] = expand_construction(entry)

for h in CONSTRUCTION_HIMOKU_MENU:
    if h not in all_himoku:
        all_himoku.append(h)

out = {
    "source": str(path).replace("\\\\", "/"),
    "sourceFile": path.name,
    "generatedAt": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
    "labels": {
        "name1": "費目",
        "name2": "種別（補助）",
        "name3": "定義及び品名",
    },
    "constructionHimokuMenu": CONSTRUCTION_HIMOKU_MENU,
    "constructionNamePattern": "工事|調査設計|外注試験|交通規制",
    "byWorkTypeCode": by_code,
    "byWorkTypeName": {
        k: {
            "workTypeCode": v["workTypeCode"],
            "workTypeName": v["workTypeName"],
            "sectionA": v["sectionA"],
            "himoku": v["himoku"],
            "himokuDefault": v["himokuDefault"],
            "typesByHimoku": v["typesByHimoku"],
            "allTypes": v["allTypes"],
            "allDefinitions": v["allDefinitions"],
            "constructionMenu": v.get("constructionMenu", False),
        }
        for k, v in by_name.items()
    },
    "allHimoku": all_himoku,
    "typesByHimoku": types_by_himoku,
    "definitionsByType": defs_by_type,
}
print(json.dumps(out, ensure_ascii=False, indent=2))
`;

const run = spawnSync("python", ["-X", "utf8", "-c", py], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 16 * 1024 * 1024,
});
if (run.status !== 0) {
  console.error(run.stderr || run.stdout);
  process.exit(run.status || 1);
}
const data = JSON.parse(run.stdout);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

// desktop.ui.js のマーカー区間へ埋め込み（build は UI をそのまま束ねる）。
const uiPath = path.join(root, "customize/jikkou-yosan-v2-app1/desktop.ui.js");
const begin = "// @JY2_NAME_HIERARCHY_BEGIN";
const end = "// @JY2_NAME_HIERARCHY_END";
const ui = fs.readFileSync(uiPath, "utf8");
const beginAt = ui.indexOf(begin);
const endAt = ui.indexOf(end);
if (beginAt < 0 || endAt < 0 || endAt < beginAt) {
  console.error(
    "[sync-code-table-name-hierarchy] NG: markers missing in desktop.ui.js",
  );
  process.exit(3);
}
const embed = `${begin}
  const JY2_NAME_HIERARCHY = Object.freeze(${JSON.stringify(data, null, 2)});
  ${end}`;
const next = `${ui.slice(0, beginAt)}${embed}${ui.slice(endAt + end.length)}`;
fs.writeFileSync(uiPath, next, "utf8");

const codes = Object.keys(data.byWorkTypeCode).length;
const names = Object.keys(data.byWorkTypeName).length;
console.log(
  `[sync-code-table-name-hierarchy] OK → ${outRel} + desktop.ui.js codes=${codes} names=${names} himoku=${data.allHimoku.length}`,
);
