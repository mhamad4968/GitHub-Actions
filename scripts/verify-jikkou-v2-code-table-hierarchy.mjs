#!/usr/bin/env node
/**
 * R-07 厳密検証: 内訳で使うコード表.xlsx と生成階層マスタ
 * (scripts/data/jikkou-yosan-v2-code-table-name-hierarchy.json) を行単位で突合する。
 *
 * 検証内容:
 *   1) Excel の全行（工種→費目→種別→定義）が JSON に漏れなく入っている
 *   2) JSON 側に Excel 由来でない費目・種別が紛れ込んでいない
 *      （例外＝契約工事型の費目メニュー: 材料費〜法定福利費＋予備費）
 *   3) 工事メニュー付与対象が「施工費セクション かつ Excel費目=外注費のみ」と一致
 *   4) メニュー費目→種別（補助）のグローバル紐付けが Excel 由来と一致
 *
 *   node scripts/verify-jikkou-v2-code-table-hierarchy.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(
  root,
  "scripts/data/jikkou-yosan-v2-code-table-name-hierarchy.json",
);

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

rows = []
last_section = None
for r in range(4, ws.max_row + 1):
    v = a_val(r)
    if v is not None and str(v).strip():
        last_section = str(v).strip()
    row = {
        "row": r,
        "section": last_section or "",
        "code": cell(r, 2),
        "workType": cell(r, 3),
        "himoku": cell(r, 5),
        "typeName": cell(r, 7),
        "definition": cell(r, 8),
    }
    if row["code"] or row["workType"] or row["himoku"] or row["typeName"] or row["definition"]:
        rows.append(row)
print(json.dumps({"source": path.name, "rows": rows}, ensure_ascii=False))
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
const excel = JSON.parse(run.stdout);
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const isDash = (s) => !s || s === "-" || s === "－" || s === "—";
const problems = [];
const notes = [];

// ---- Excel 行の正規化（工種行のみ） ----
const excelByName = new Map();
for (const r of excel.rows) {
  if (!r.workType) continue;
  if (!excelByName.has(r.workType)) {
    excelByName.set(r.workType, { section: r.section, himoku: [], types: new Map() });
  }
  const e = excelByName.get(r.workType);
  if (r.himoku) {
    if (!e.himoku.includes(r.himoku)) e.himoku.push(r.himoku);
    if (!e.types.has(r.himoku)) e.types.set(r.himoku, []);
    if (!isDash(r.typeName) && !e.types.get(r.himoku).includes(r.typeName)) {
      e.types.get(r.himoku).push(r.typeName);
    }
  }
}

// ---- 検証1: Excel → JSON 漏れなし ----
for (const [name, e] of excelByName) {
  const entry = (data.byWorkTypeName || {})[name];
  if (!entry) {
    problems.push(`[漏れ] 工種「${name}」が byWorkTypeName にない`);
    continue;
  }
  for (const h of e.himoku) {
    if (!(entry.himoku || []).includes(h)) {
      problems.push(`[漏れ] ${name}: 費目「${h}」が himoku にない`);
    }
    for (const t of e.types.get(h) || []) {
      const local = (entry.typesByHimoku || {})[h] || [];
      if (!local.includes(t)) {
        problems.push(`[漏れ] ${name}: 費目「${h}」の種別「${t}」が typesByHimoku にない`);
      }
    }
  }
}

// ---- 検証2: JSON → Excel 由来でない値の混入なし ----
const menu = data.constructionHimokuMenu || [];
for (const [name, entry] of Object.entries(data.byWorkTypeName || {})) {
  const e = excelByName.get(name);
  if (!e) {
    problems.push(`[混入] byWorkTypeName に Excel にない工種「${name}」`);
    continue;
  }
  for (const h of entry.himoku || []) {
    const fromExcel = e.himoku.includes(h);
    const fromMenu = entry.constructionMenu && menu.includes(h);
    if (!fromExcel && !fromMenu) {
      problems.push(`[混入] ${name}: 費目「${h}」は Excel にもメニューにもない`);
    }
  }
  for (const [h, types] of Object.entries(entry.typesByHimoku || {})) {
    const excelTypes = e.types.get(h) || [];
    for (const t of types) {
      if (!excelTypes.includes(t)) {
        problems.push(`[混入] ${name}: 費目「${h}」の種別「${t}」は Excel のこの工種行にない`);
      }
    }
  }
}

// ---- 検証3: 工事メニュー付与対象＝施工費×外注費のみ ----
const expectedMenuNames = [];
for (const [name, e] of excelByName) {
  if (e.section === "施工費" && e.himoku.length === 1 && e.himoku[0] === "外注費") {
    expectedMenuNames.push(name);
  }
}
const actualMenuNames = Object.entries(data.byWorkTypeName || {})
  .filter(([, v]) => v.constructionMenu)
  .map(([k]) => k);
for (const n of expectedMenuNames) {
  if (!actualMenuNames.includes(n)) problems.push(`[メニュー] 「${n}」に工事メニューが付いていない`);
}
for (const n of actualMenuNames) {
  if (!expectedMenuNames.includes(n)) problems.push(`[メニュー] 「${n}」に工事メニューが誤って付いている`);
}
for (const n of actualMenuNames) {
  const entry = data.byWorkTypeName[n];
  for (const h of menu) {
    if (!(entry.himoku || []).includes(h)) {
      problems.push(`[メニュー] 「${n}」の費目にメニュー項目「${h}」がない`);
    }
  }
  if (entry.himokuDefault !== "外注費") {
    problems.push(`[メニュー] 「${n}」の既定費目が外注費でない (${entry.himokuDefault})`);
  }
}
if (!menu.includes("予備費")) problems.push("[メニュー] 予備費がメニューにない");

// ---- 検証4: メニュー費目→種別のグローバル紐付けが Excel 由来と一致 ----
const globalTypesFromExcel = new Map();
const sectionHimoku = new Map();
for (const r of excel.rows) {
  if (r.himoku) {
    if (!globalTypesFromExcel.has(r.himoku)) globalTypesFromExcel.set(r.himoku, []);
    if (!isDash(r.typeName) && !globalTypesFromExcel.get(r.himoku).includes(r.typeName)) {
      globalTypesFromExcel.get(r.himoku).push(r.typeName);
    }
    if (!sectionHimoku.has(r.section)) sectionHimoku.set(r.section, []);
    if (!sectionHimoku.get(r.section).includes(r.himoku)) {
      sectionHimoku.get(r.section).push(r.himoku);
    }
  }
}
// 現場経費はコード表ではセクション名 → 配下費目を種別候補とする合成仕様
const expectedGenba = sectionHimoku.get("現場経費") || [];
for (const h of menu) {
  const actual = (data.typesByHimoku || {})[h] || [];
  const expected =
    h === "現場経費" ? expectedGenba : globalTypesFromExcel.get(h) || [];
  const missing = expected.filter((t) => !actual.includes(t));
  const extra = actual.filter((t) => !expected.includes(t));
  if (missing.length) problems.push(`[紐付け] 費目「${h}」: 種別が不足 → ${missing.join("/")}`);
  if (extra.length) problems.push(`[紐付け] 費目「${h}」: Excel にない種別 → ${extra.join("/")}`);
  notes.push(`費目「${h}」 → 種別（補助）: ${actual.length ? actual.join(" / ") : "（なし＝手入力）"}`);
}

// ---- 監査出力 ----
console.log(`[verify-code-table-hierarchy] source=${excel.source} 工種=${excelByName.size}`);
console.log("--- 工事メニュー対象（施工費×外注費） ---");
for (const n of expectedMenuNames) console.log(`  MENU: ${n}`);
console.log("--- メニュー費目 → 種別（補助） ---");
for (const n of notes) console.log(`  ${n}`);
if (problems.length) {
  console.error(`--- NG ${problems.length}件 ---`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("[verify-code-table-hierarchy] OK: Excel コード表と生成マスタは一致（漏れ・混入なし）");
