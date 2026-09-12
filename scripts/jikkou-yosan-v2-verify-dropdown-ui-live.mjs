#!/usr/bin/env node
/**
 * UI が選べる値のうち、LIVE DROP_DOWN/RADIO に無いものを洗う（泊 CB_VA01 の holizontal scan）。
 * 空文字は任意フィールドでは許可。required の空は別問題。
 */
import { loadDotenv } from "./lib/kintone-live-schema.mjs";
import { COMMON_UNITS, CONTRACT_SECTIONS } from "./lib/jikkou-yosan-v2/contract-salary-model.mjs";
import { DETAIL_ROW_KINDS } from "./lib/jikkou-yosan-v2/detail-block-model.mjs";
import { getKintoneConfig, getPreviewFormFields } from "./lib/jikkou-yosan-v2/kintone.mjs";

loadDotenv(process.cwd());

function labels(options) {
  return Object.values(options || {})
    .sort((a, b) => Number(a.index) - Number(b.index))
    .map((o) => o.label);
}

function missing(ui, live) {
  const set = new Set(live);
  return ui.filter((v) => v !== "" && !set.has(v));
}

function walk(props, prefix = "") {
  const out = [];
  for (const [code, field] of Object.entries(props || {})) {
    const path = prefix ? `${prefix}.${code}` : code;
    if (field.type === "DROP_DOWN" || field.type === "RADIO_BUTTON") {
      out.push({ path, type: field.type, labels: labels(field.options) });
    }
    if (field.type === "SUBTABLE") out.push(...walk(field.fields, path));
  }
  return out;
}

async function main() {
  const ctx = getKintoneConfig();
  const form756 = await getPreviewFormFields(ctx, 756);
  const form757 = await getPreviewFormFields(ctx, 757);
  const form758 = await getPreviewFormFields(ctx, 758);
  const byPath = new Map();
  for (const row of walk(form756.properties)) byPath.set(`756.${row.path}`, row.labels);
  for (const row of walk(form757.properties)) byPath.set(`757.${row.path}`, row.labels);
  for (const row of walk(form758.properties)) byPath.set(`758.${row.path}`, row.labels);

  const header = {
    work_kind: ["土木一式", "とび・土工・コンクリート", "塗装", "塗装（防水）", "調査", "工事外"],
    order_form: ["単独", "JV"],
    jv_type: ["特定JV甲型", "特定JV乙型", "経常JV甲型", "経常JV乙型", "その他"],
    order_role: ["元請", "下請", "その他"],
    order_method: [
      "特命",
      "指名競争入札",
      "工事希望型競争入札",
      "公募プロポーザル方式",
      "見積入札",
      "一般競争入札",
      "随意契約",
      "その他",
    ],
    main_misc: ["本工事", "雑工事"],
    public_private_1: ["官庁", "民間"],
    public_private_2: ["中央官庁", "公社・公団", "都道府県", "市町村", "準官庁"],
    civil_arch: ["土木(ＪＲ)", "土木(その他鉄道会社)", "建築(民間)", "その他(ﾘﾌｫｰﾑ)"],
    work_class: [
      "A：ＪＲ鉄桁塗替塗装",
      "B：ＪＲ受託",
      "C：ＪＲ橋りょう修繕工事",
      "D：ＪＲその他工事",
      "E：その他鉄道会社塗替塗装",
      "F：その他鉄道会社受託",
      "G：一般工事",
      "Q：ＪＲ保安（工管・線閉）",
    ],
    office_name: [
      "東京土木設備技術センター",
      "横浜土木設備技術センター",
      "水戸土木設備技術センター",
      "千葉土木設備技術センター",
      "大宮土木設備技術センター",
      "八王子土木設備技術センター",
      "高崎土木設備技術センター",
      "長野土木設備技術センター",
    ],
    version_type: ["当初", "仕様変更", "価格変更", "仕様・価格変更", "その他"],
    status: ["下書き", "版確定"],
  };

  const checks = [
    ["756.unit-contract", COMMON_UNITS, byPath.get("756.contract_lines.contract_unit")],
    ["756.unit-salary", COMMON_UNITS, byPath.get("756.salary_lines.salary_unit")],
    ["756.unit-summary", ["㎡", ...COMMON_UNITS], byPath.get("756.summary_cost_lines.summary_unit")],
    ["757.unit", COMMON_UNITS, byPath.get("757.unit")],
    ["756.tax", ["0％", "8％", "10％"], byPath.get("756.summary_cost_lines.summary_tax_rate")],
    ["756.holiday_kind", ["1日", "期間"], byPath.get("756.holiday_lines.holiday_kind")],
    ["756.safety_rule_88", ["有", "無"], byPath.get("756.safety_rule_88")],
    ["756.contract_section", CONTRACT_SECTIONS, byPath.get("756.contract_lines.contract_section")],
    ["756.summary_cost_category", CONTRACT_SECTIONS, byPath.get("756.summary_cost_lines.summary_cost_category")],
    ["757.cost_category_key", CONTRACT_SECTIONS, byPath.get("757.cost_category_key")],
    ["757.row_kind", DETAIL_ROW_KINDS, byPath.get("757.row_kind")],
    ["757.block_status", ["active", "retired"], byPath.get("757.block_status")],
    ["757.write_channel", ["app1_custom_ui"], byPath.get("757.write_channel")],
    ["757.parent_lock_snapshot", ["editable", "locked"], byPath.get("757.parent_lock_snapshot")],
    ["758.cost_category_key", CONTRACT_SECTIONS, byPath.get("758.cost_category_key")],
    ["758.source_kind", ["手入力"], byPath.get("758.source_kind")],
    ["758.write_channel", ["app1_custom_ui"], byPath.get("758.write_channel")],
    ["758.record_kind", ["monthly_consumption", "final_budget"], byPath.get("758.record_kind")],
  ];
  for (const [code, ui] of Object.entries(header)) {
    checks.push([`756.${code}`, ui, byPath.get(`756.${code}`)]);
  }

  let holes = 0;
  for (const [name, ui, live] of checks) {
    if (!live) {
      console.log(`[DROP] ${name}: LIVE field missing`);
      holes += 1;
      continue;
    }
    const miss = missing(ui, live);
    if (miss.length) {
      holes += 1;
      console.log(`[HOLE] ${name}: UI has ${miss.join("|")} but LIVE=${live.join("|")}`);
    } else {
      console.log(`[OK] ${name} live=${live.length} ui=${ui.length}`);
    }
  }
  console.log(`[dropdown-ui-live] revision 756=${form756.revision} 757=${form757.revision} 758=${form758.revision}`);
  if (holes) {
    console.error(`[dropdown-ui-live] FAIL holes=${holes}`);
    process.exit(1);
  }
  console.log("[dropdown-ui-live] OK no UI-not-in-LIVE holes");
}

main().catch((error) => {
  console.error("[dropdown-ui-live] FAIL", error.message || error);
  process.exit(1);
});
