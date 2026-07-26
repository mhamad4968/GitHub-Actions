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

def is_explicit_dash(s):
    return s == "-" or s == "－" or s == "—"

last_section = None
# key = workTypeCode or "__name__:" + workTypeName when code empty
by_code = {}
by_name = {}
all_himoku = []
types_by_himoku = {}
defs_by_type = {}
type_presence_by_himoku = {}
# セクション（項目列）→ その配下の費目名。工事系メニューの「現場経費」種別候補に使う。
section_to_himoku = {}
# Excel 行の初出順（システム工種リストのベース）
excel_work_type_name_order = []
# 依頼者訂正: Excel 誤記の工種番号を名称キーで上書きする。
CODE_OVERRIDES_BY_NAME = {
    "（塗）レンタル": "11600",  # Excel=10300 は足場工事との重複誤記
}

def ensure_work(bucket, key, *, code, name, section):
    if key not in bucket:
        bucket[key] = {
            "workTypeCode": code,
            "workTypeName": name,
            "sectionA": section,
            "himoku": [],
            "himokuDefault": "",
            "typesByHimoku": {},
            "dashTypeByHimoku": {},
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

    if wname in CODE_OVERRIDES_BY_NAME:
        code = CODE_OVERRIDES_BY_NAME[wname]

    if not code and not wname and not himoku and not type_name and not definition:
        continue

    if himoku and himoku not in all_himoku:
        all_himoku.append(himoku)

    if himoku and last_section:
        section_to_himoku.setdefault(last_section, [])
        if himoku not in section_to_himoku[last_section]:
            section_to_himoku[last_section].append(himoku)

    if himoku and not is_blank_or_dash(type_name):
        types_by_himoku.setdefault(himoku, [])
        if type_name not in types_by_himoku[himoku]:
            types_by_himoku[himoku].append(type_name)
        if definition:
            defs_by_type.setdefault(type_name, [])
            if definition not in defs_by_type[type_name]:
                defs_by_type[type_name].append(definition)
    if himoku:
        presence = type_presence_by_himoku.setdefault(
            himoku, {"hasDash": False, "hasRealType": False}
        )
        if is_explicit_dash(type_name):
            presence["hasDash"] = True
        elif type_name:
            presence["hasRealType"] = True

    targets = []
    if code or wname:
        # by_code はコード単位、by_name は名称単位。
        # （塗）レンタルは CODE_OVERRIDES で 11600 に分離済み（Excel 誤記 10300 を訂正）。
        if code:
            entry = ensure_work(by_code, code, code=code, name=wname, section=last_section or "")
            targets.append(entry)
        if wname:
            nentry = ensure_work(by_name, wname, code=code, name=wname, section=last_section or "")
            targets.append(nentry)
            if wname not in excel_work_type_name_order:
                excel_work_type_name_order.append(wname)
    # himoku-only rows (no work type): still contribute to global lists above

    for entry in targets:
        if himoku:
            if himoku not in entry["himoku"]:
                entry["himoku"].append(himoku)
            if not entry["himokuDefault"]:
                entry["himokuDefault"] = himoku
            entry["typesByHimoku"].setdefault(himoku, [])
            if not is_blank_or_dash(type_name):
                entry["dashTypeByHimoku"][himoku] = False
                if type_name not in entry["typesByHimoku"][himoku]:
                    entry["typesByHimoku"][himoku].append(type_name)
            elif is_explicit_dash(type_name) and himoku not in entry["dashTypeByHimoku"]:
                entry["dashTypeByHimoku"][himoku] = True
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

def expand_construction(entry):
    # 契約工事型の厳密判定: Excel コード表でその工種の費目が「外注費」のみ、
    # かつ 施工費 セクション（塗装工事・足場工事・修繕等工事・軌道工事・
    # 追加工事・暫定実行予算総額・調査設計費・外注試験費・交通規制費 等）。
    # 名称の「工事」文字での判定はしない（工事管理者賃金・社内工事発注・
    # 工事安全専任管理者・給与手当系の誤爆を防ぐ）。
    original = list(entry.get("himoku") or [])
    is_construction = (
        entry.get("sectionA") == "施工費" and original == ["外注費"]
    )
    entry["constructionMenu"] = is_construction
    if not is_construction:
        return entry
    merged = []
    for h in CONSTRUCTION_HIMOKU_MENU + original:
        if h and h not in merged:
            merged.append(h)
    entry["himoku"] = merged
    entry["himokuDefault"] = "外注費"
    return entry

for key, entry in list(by_code.items()):
    by_code[key] = expand_construction(entry)
for key, entry in list(by_name.items()):
    by_name[key] = expand_construction(entry)

# Excel コード表は追加工事？〜④まで。Ver.01／現場の 追加工事⑤(14500) が無いと
# 工事系費目メニューが付かないため、④と同じ契約工事型として補完する。
import copy
ADDON5_TEMPLATE = by_name.get("（塗）追加工事④")
SYNTHETIC_ADDON5 = [
    # リスト掲載は（塗）付き。Ver.01 表記は解決用エイリアスのみ。
    {"workTypeCode": "14500", "workTypeName": "（塗）追加工事⑤", "inList": True},
    {"workTypeCode": "14500", "workTypeName": "追加工事⑤", "inList": False},
]
if ADDON5_TEMPLATE:
    for syn in SYNTHETIC_ADDON5:
        name = syn["workTypeName"]
        code = syn["workTypeCode"]
        if name not in by_name:
            entry = copy.deepcopy(ADDON5_TEMPLATE)
            entry["workTypeCode"] = code
            entry["workTypeName"] = name
            by_name[name] = entry
        if code and code not in by_code:
            entry = copy.deepcopy(by_name[name])
            by_code[code] = entry
        if not syn.get("inList"):
            continue
        # リスト順: ④の直後へ
        if "（塗）追加工事④" in excel_work_type_name_order:
            idx = excel_work_type_name_order.index("（塗）追加工事④") + 1
            if name not in excel_work_type_name_order:
                excel_work_type_name_order.insert(idx, name)
        elif name not in excel_work_type_name_order:
            excel_work_type_name_order.append(name)

for h in CONSTRUCTION_HIMOKU_MENU:
    if h not in all_himoku:
        all_himoku.append(h)

# 工事系メニューの「現場経費」はコード表ではセクション名。
# 配下費目（運送費・旅費交通費など）を種別（補助）候補として紐付ける。
if "現場経費" in section_to_himoku:
    types_by_himoku.setdefault("現場経費", [])
    for h in section_to_himoku["現場経費"]:
        if h not in types_by_himoku["現場経費"]:
            types_by_himoku["現場経費"].append(h)

# 依頼者要望 (2026-07-26): 費目=労務費 の種別（補助）候補に昼夜区分を追加する。
# コード表に行はない合成候補。工種ローカルに種別がある工種（工事管理者賃金など）は
# 従来どおりローカル優先のため影響しない（グローバルフォールバック時のみ表示）。
SYNTHETIC_LABOR_TYPES = ["労務費（昼間）", "労務費（夜間）"]
types_by_himoku.setdefault("労務費", [])
for t in SYNTHETIC_LABOR_TYPES:
    if t not in types_by_himoku["労務費"]:
        types_by_himoku["労務費"].append(t)

# 予備費: コード表にシステム工種行はないが、依頼者リストでは給与手当群の直後・
# 保安費の直前に置く。費目候補は「予備費」のみ。
if "予備費" not in by_name:
    by_name["予備費"] = {
        "workTypeCode": "",
        "workTypeName": "予備費",
        "sectionA": "予備費",
        "himoku": ["予備費"],
        "himokuDefault": "予備費",
        "typesByHimoku": {},
        "dashTypeByHimoku": {"予備費": False},
        "allTypes": [],
        "allDefinitions": [],
        "constructionMenu": False,
    }

# システム工種ドロップダウン順（依頼者確認リスト）:
# Excel 初出順を基本に、末尾だけ 現場管理費→予備費→保安費 へ並べ替える。
SECURITY_NAMES = [
    "（塗）線閉責任者",
    "（塗）列車見張員",
    "（塗）交通整理員等",
    "（塗）検電接地",
    "（塗）その他保安費",
    "（塗）重機誘導員",
]
SALARY_NAMES = [
    "（塗）社員助勢費用",
    "（塗）現場代理人･監理技術者給与手当",
    "（塗）工事担当者給与手当",
    "（塗）社員工事管理者給与手当",
    "（塗）社員保安要員給与手当",
]
security_set = set(SECURITY_NAMES)
salary_set = set(SALARY_NAMES)
head = [n for n in excel_work_type_name_order if n not in security_set and n not in salary_set]
# head 末尾は「工事安全専任管理者」のまま（Excel・依頼者リスト共通）
work_type_name_order = head + [n for n in SALARY_NAMES if n in by_name] + ["予備費"] + [
    n for n in SECURITY_NAMES if n in by_name
]
# Excel にだけある残り（将来追加）を末尾へ
for n in excel_work_type_name_order:
    if n not in work_type_name_order:
        work_type_name_order.append(n)

# byWorkTypeName も同じ順で出力（Object キー順＝リスト順）
by_name_ordered = {}
for n in work_type_name_order:
    if n in by_name:
        by_name_ordered[n] = by_name[n]
for n, v in by_name.items():
    if n not in by_name_ordered:
        by_name_ordered[n] = v
by_name = by_name_ordered

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
    "constructionRule": "sectionA=施工費 かつ Excel費目=外注費のみ（契約工事型）",
    "workTypeNameOrder": work_type_name_order,
    "workTypeOrderNote": "依頼者確認リスト順（現場管理費→予備費→保安費）。Excel名（塗）追加工事？はコード表表記のまま",
    "codeOverridesByName": CODE_OVERRIDES_BY_NAME,
    "byWorkTypeCode": by_code,
    "byWorkTypeName": {
        k: {
            "workTypeCode": v["workTypeCode"],
            "workTypeName": v["workTypeName"],
            "sectionA": v["sectionA"],
            "himoku": v["himoku"],
            "himokuDefault": v["himokuDefault"],
            "typesByHimoku": v["typesByHimoku"],
            "dashTypeByHimoku": v.get("dashTypeByHimoku", {}),
            "allTypes": v["allTypes"],
            "allDefinitions": v["allDefinitions"],
            "constructionMenu": v.get("constructionMenu", False),
        }
        for k, v in by_name.items()
    },
    "allHimoku": all_himoku,
    "typesByHimoku": types_by_himoku,
    "dashOnlyHimoku": [
        h for h in all_himoku
        if type_presence_by_himoku.get(h, {}).get("hasDash")
        and not type_presence_by_himoku.get(h, {}).get("hasRealType")
    ],
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
