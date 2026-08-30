/**
 * #S1 (2026-08-30 evening GO): マスタ整理.xlsx と候補定数の差分検出。
 * 余分・欠落があれば exit 1。Excel が無い環境では skip(0)。
 *
 * Usage: node scripts/jikkou-yosan-v2-verify-master-lists.mjs
 *        npm run jikkou-yosan:v2-verify-master-lists
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const uiPath = path.join(root, "customize/jikkou-yosan-v2-app1/desktop.ui.js");
const unitsPath = path.join(
  root,
  "scripts/lib/jikkou-yosan-v2/contract-salary-model.mjs",
);
const excelPath = "C:\\tmp\\実行予算ver2\\マスタ整理.xlsx";

function extractFrozenStringArray(src, constName) {
  const re = new RegExp(
    `(?:export\\s+)?const ${constName}\\s*=\\s*Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\)`,
  );
  const m = src.match(re);
  if (!m) return null;
  const out = [];
  for (const hit of m[1].matchAll(/"((?:\\.|[^"\\])*)"/g)) {
    out.push(JSON.parse(`"${hit[1]}"`));
  }
  return out;
}

function extractSystemWorkNames(src) {
  const re =
    /const JY2_SYSTEM_WORK_MASTER\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/;
  const m = src.match(re);
  if (!m) return null;
  const out = [];
  for (const hit of m[1].matchAll(/name:\s*"((?:\\.|[^"\\])*)"/g)) {
    out.push(JSON.parse(`"${hit[1]}"`));
  }
  return out;
}

function uniqCol(rows, colIdx) {
  const a = [];
  for (const r of rows.slice(2)) {
    const v = String(r[colIdx] || "").trim();
    if (v && !a.includes(v)) a.push(v);
  }
  return a;
}

function himokuTypes(rows, iHimoku, iUchi) {
  let cur = "";
  const by = {};
  for (const r of rows.slice(2)) {
    const h = String(r[iHimoku] || "").trim();
    if (h) cur = h;
    const u = String(r[iUchi] || "").trim();
    if (!cur || !u) continue;
    if (!by[cur]) by[cur] = [];
    if (!by[cur].includes(u)) by[cur].push(u);
  }
  return by;
}

function diff(label, excel, code) {
  // 外注費種別は G0 §9.1 の5件が正（Excelは連結1件）→ 差分対象外
  if (label === "種別:外注費") {
    return { label, missing: [], extra: [], skip: true };
  }
  const missing = excel.filter((x) => !code.includes(x));
  const extra = code.filter((x) => !excel.includes(x));
  return { label, missing, extra, skip: false };
}

if (!fs.existsSync(excelPath)) {
  console.log("[verify-master-lists] skip — Excel not found:", excelPath);
  process.exit(0);
}

const src = fs.readFileSync(uiPath, "utf8");
const unitsSrc = fs.readFileSync(unitsPath, "utf8");
const buf = fs.readFileSync(excelPath);
const wb = XLSX.read(buf, { type: "buffer" });
const rows = XLSX.utils.sheet_to_json(wb.Sheets["データマスタ"], {
  header: 1,
  defval: "",
});

const excel = {
  units: uniqCol(rows, 18),
  himoku: uniqCol(rows, 28),
  sys: uniqCol(rows, 29),
  typesBy: himokuTypes(rows, 28, 31),
};
const kyo = uniqCol(rows, 15);
const tor = uniqCol(rows, 17);
const vendors = [...kyo];
for (const b of tor) if (!vendors.includes(b)) vendors.push(b);

const code = {
  units: extractFrozenStringArray(unitsSrc, "COMMON_UNITS") || [],
  himoku: (() => {
    const m = src.match(/"constructionHimokuMenu"\s*:\s*\[([\s\S]*?)\]/);
    if (!m) return [];
    return [...m[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((h) =>
      JSON.parse(`"${h[1]}"`),
    );
  })(),
  sys: extractSystemWorkNames(src) || [],
  vendors: extractFrozenStringArray(src, "JY2_VENDOR_SEEDS") || [],
  materialTypes: extractFrozenStringArray(src, "JY2_MATERIAL_TYPE_MENU") || [],
};

// COMMON_UNITS includes － at end — Excel does not
const unitsCode = (code.units || []).filter((u) => u !== "－");

const reports = [];
reports.push(diff("単位", excel.units, unitsCode));
reports.push(diff("費目", excel.himoku, code.himoku));
reports.push(diff("システム工種", excel.sys, code.sys));
reports.push(diff("取引先(協力∪)", vendors, code.vendors));
reports.push(
  diff("種別:材料費", excel.typesBy["材料費"] || [], code.materialTypes),
);
reports.push(
  diff("種別:外注費", excel.typesBy["外注費"] || [], [
    "材料費",
    "労務費",
    "仮設機械経費",
    "現場経費",
    "その他費用",
  ]),
);

let ng = 0;
for (const r of reports) {
  if (r.skip) {
    console.log(`[verify-master-lists] skip ${r.label} (G0 exception)`);
    continue;
  }
  if (!r.missing.length && !r.extra.length) {
    console.log(
      `[verify-master-lists] OK ${r.label} (missing=0 extra=0)`,
    );
    continue;
  }
  ng += 1;
  console.error(`[verify-master-lists] NG ${r.label}`);
  if (r.missing.length) console.error("  missing:", r.missing.join(" | "));
  if (r.extra.length) console.error("  extra:", r.extra.join(" | "));
}

if (ng) {
  console.error(`[verify-master-lists] FAIL checks=${ng}`);
  process.exit(1);
}
console.log("[verify-master-lists] OK all compared lists");
