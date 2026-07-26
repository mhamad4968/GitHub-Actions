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
const isExplicitDash = (s) => s === "-" || s === "－" || s === "—";
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
  // 費目・種別の順序も Excel 行順と一致させる（集合一致だけでは不十分）。
  const excelHimoku = e.himoku;
  const jsonHimokuExcelOnly = (entry.himoku || []).filter((h) =>
    excelHimoku.includes(h),
  );
  if (JSON.stringify(jsonHimokuExcelOnly) !== JSON.stringify(excelHimoku)) {
    problems.push(
      `[順序] ${name}: 費目順が不一致 Excel=[${excelHimoku.join("/")}] JSON(Excel由来)=[${jsonHimokuExcelOnly.join("/")}]`,
    );
  }
  for (const h of e.himoku) {
    if (!(entry.himoku || []).includes(h)) {
      problems.push(`[漏れ] ${name}: 費目「${h}」が himoku にない`);
    }
    const excelTypes = e.types.get(h) || [];
    const local = (entry.typesByHimoku || {})[h] || [];
    if (JSON.stringify(local) !== JSON.stringify(excelTypes)) {
      // 漏れ／混入は別検証でも拾うが、順序ズレも明示する
      if (
        excelTypes.every((t) => local.includes(t)) &&
        local.every((t) => excelTypes.includes(t))
      ) {
        problems.push(
          `[順序] ${name}: 費目「${h}」の種別順が不一致 Excel=[${excelTypes.join("/")}] JSON=[${local.join("/")}]`,
        );
      }
    }
    for (const t of excelTypes) {
      if (!local.includes(t)) {
        problems.push(`[漏れ] ${name}: 費目「${h}」の種別「${t}」が typesByHimoku にない`);
      }
    }
  }
}

// ---- 検証2: JSON → Excel 由来でない値の混入なし ----
const menu = data.constructionHimokuMenu || [];
// 予備費=依頼者リスト追加。追加工事⑤=Excel欠落の Ver.01 補完（④と同メニュー）。
const ALLOWED_EXTRA_WORK_TYPES = new Set([
  "予備費",
  "（塗）追加工事⑤",
  "追加工事⑤",
]);
for (const [name, entry] of Object.entries(data.byWorkTypeName || {})) {
  const e = excelByName.get(name);
  if (!e) {
    if (!ALLOWED_EXTRA_WORK_TYPES.has(name)) {
      problems.push(`[混入] byWorkTypeName に Excel にない工種「${name}」`);
    } else if (
      (name === "（塗）追加工事⑤" || name === "追加工事⑤") &&
      !entry.constructionMenu
    ) {
      problems.push(`[メニュー] 補完工種「${name}」に工事メニューが付いていない`);
    }
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
  if (
    !expectedMenuNames.includes(n) &&
    !ALLOWED_EXTRA_WORK_TYPES.has(n)
  ) {
    problems.push(`[メニュー] 「${n}」に工事メニューが誤って付いている`);
  }
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
const typePresence = new Map();
for (const r of excel.rows) {
  if (r.himoku) {
    if (!typePresence.has(r.himoku)) {
      typePresence.set(r.himoku, { hasDash: false, hasRealType: false });
    }
    const presence = typePresence.get(r.himoku);
    if (isExplicitDash(r.typeName)) presence.hasDash = true;
    else if (r.typeName) presence.hasRealType = true;
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
const expectedDashOnly = [...typePresence]
  .filter(([, p]) => p.hasDash && !p.hasRealType)
  .map(([h]) => h);
if (
  JSON.stringify(data.dashOnlyHimoku || []) !== JSON.stringify(expectedDashOnly)
) {
  problems.push(
    `[種別－] dashOnlyHimoku不一致 Excel=[${expectedDashOnly.join("/")}] JSON=[${(data.dashOnlyHimoku || []).join("/")}])`,
  );
}
// 現場経費はコード表ではセクション名 → 配下費目を種別候補とする合成仕様
const expectedGenba = sectionHimoku.get("現場経費") || [];
// 労務費: 依頼者要望（2026-07-26）の昼夜区分をコード表由来の末尾へ合成する仕様
const SYNTHETIC_TYPES_BY_HIMOKU = {
  労務費: ["労務費（昼間）", "労務費（夜間）"],
};
for (const h of menu) {
  const actual = (data.typesByHimoku || {})[h] || [];
  const expected =
    h === "現場経費"
      ? [...expectedGenba]
      : [...(globalTypesFromExcel.get(h) || [])];
  for (const t of SYNTHETIC_TYPES_BY_HIMOKU[h] || []) {
    if (!expected.includes(t)) expected.push(t);
  }
  const missing = expected.filter((t) => !actual.includes(t));
  const extra = actual.filter((t) => !expected.includes(t));
  if (missing.length) problems.push(`[紐付け] 費目「${h}」: 種別が不足 → ${missing.join("/")}`);
  if (extra.length) problems.push(`[紐付け] 費目「${h}」: Excel にない種別 → ${extra.join("/")}`);
  if (
    !missing.length &&
    !extra.length &&
    JSON.stringify(actual) !== JSON.stringify(expected)
  ) {
    problems.push(
      `[順序] 費目「${h}」の種別順が不一致 Excel=[${expected.join("/")}] JSON=[${actual.join("/")}]`,
    );
  }
  notes.push(`費目「${h}」 → 種別（補助）: ${actual.length ? actual.join(" / ") : "（なし＝手入力）"}`);
}

// 工事メニュー費目の並び＝依頼者説明文順（材料費→…→予備費）
const menuExpected = [
  "材料費",
  "労務費",
  "外注費",
  "工具･機械使用料",
  "現場経費",
  "諸経費",
  "法定福利費",
  "予備費",
];
if (JSON.stringify(menu) !== JSON.stringify(menuExpected)) {
  problems.push(
    `[順序] constructionHimokuMenu が説明文順でない → [${(menu || []).join("/")}]`,
  );
}
for (const n of actualMenuNames) {
  const entry = data.byWorkTypeName[n];
  const head = (entry.himoku || []).slice(0, menuExpected.length);
  if (JSON.stringify(head) !== JSON.stringify(menuExpected)) {
    problems.push(
      `[順序] 「${n}」の費目先頭がメニュー順でない → [${(entry.himoku || []).join("/")}]`,
    );
  }
}

// ---- 検証5: システム工種リスト順（依頼者確認: 現場管理費→予備費→保安費） ----
const deferredTail = new Set([
  "（塗）線閉責任者",
  "（塗）列車見張員",
  "（塗）交通整理員等",
  "（塗）検電接地",
  "（塗）その他保安費",
  "（塗）重機誘導員",
  "（塗）社員助勢費用",
  "（塗）現場代理人･監理技術者給与手当",
  "（塗）工事担当者給与手当",
  "（塗）社員工事管理者給与手当",
  "（塗）社員保安要員給与手当",
]);
const expectedOrder = [];
for (const [name] of excelByName) {
  if (!deferredTail.has(name)) expectedOrder.push(name);
}
expectedOrder.push(
  "（塗）社員助勢費用",
  "（塗）現場代理人･監理技術者給与手当",
  "（塗）工事担当者給与手当",
  "（塗）社員工事管理者給与手当",
  "（塗）社員保安要員給与手当",
  "予備費",
  "（塗）線閉責任者",
  "（塗）列車見張員",
  "（塗）交通整理員等",
  "（塗）検電接地",
  "（塗）その他保安費",
  "（塗）重機誘導員",
);
// Excel 欠落の追加工事⑤を④の直後へ（同期スクリプトと同趣旨）。
const addon4Idx = expectedOrder.indexOf("（塗）追加工事④");
if (addon4Idx >= 0 && !expectedOrder.includes("（塗）追加工事⑤")) {
  expectedOrder.splice(addon4Idx + 1, 0, "（塗）追加工事⑤");
}
const addon5 = (data.byWorkTypeName || {})["（塗）追加工事⑤"];
const addon5Alias = (data.byWorkTypeName || {})["追加工事⑤"];
if (!addon5 || !addon5.constructionMenu || addon5.workTypeCode !== "14500") {
  problems.push("[補完] （塗）追加工事⑤ が 14500／工事メニュー付きでない");
}
if (!addon5Alias || !addon5Alias.constructionMenu) {
  problems.push("[補完] Ver.01表記「追加工事⑤」の階層エイリアスがない");
}
// 依頼者訂正: （塗）レンタルは Excel=10300 誤記 → 11600
const rental = (data.byWorkTypeName || {})["（塗）レンタル"];
if (!rental || rental.workTypeCode !== "11600") {
  problems.push("[訂正] （塗）レンタルの workTypeCode が 11600 でない");
}
if ((data.byWorkTypeCode || {})["11600"]?.workTypeName !== "（塗）レンタル") {
  problems.push("[訂正] byWorkTypeCode[11600] が（塗）レンタルでない");
}
if ((data.byWorkTypeCode || {})["10300"]?.workTypeName === "（塗）レンタル") {
  problems.push("[訂正] byWorkTypeCode[10300] にレンタルが残っている");
}
if ((data.codeOverridesByName || {})["（塗）レンタル"] !== "11600") {
  problems.push("[訂正] codeOverridesByName にレンタル→11600 がない");
}

const actualOrder = data.workTypeNameOrder || [];
if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
  problems.push("[順序] workTypeNameOrder が依頼者確認リストと不一致");
  const max = Math.max(actualOrder.length, expectedOrder.length);
  for (let i = 0; i < max; i++) {
    if (actualOrder[i] !== expectedOrder[i]) {
      problems.push(
        `  @${i + 1}: expected=${expectedOrder[i] || "(なし)"} actual=${actualOrder[i] || "(なし)"}`,
      );
    }
  }
}

// ---- 監査出力 ----
console.log(`[verify-code-table-hierarchy] source=${excel.source} 工種=${excelByName.size}`);
console.log("--- 工事メニュー対象（施工費×外注費） ---");
for (const n of expectedMenuNames) console.log(`  MENU: ${n}`);
console.log("--- メニュー費目 → 種別（補助） ---");
for (const n of notes) console.log(`  ${n}`);
console.log("--- システム工種リスト順 ---");
actualOrder.forEach((n, i) => console.log(`  ${String(i + 1).padStart(2)} ${n}`));
if (problems.length) {
  console.error(`--- NG ${problems.length}件 ---`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("[verify-code-table-hierarchy] OK: Excel コード表と生成マスタは一致（漏れ・混入なし）");
