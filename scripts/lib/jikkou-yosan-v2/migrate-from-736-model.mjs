/**
 * 736 → Ver.02 (756/757/758) 移行の純関数モデル。
 * ネットワーク・env 不要。CLI の dry-run / execute プレビュー双方で使用。
 */
export const SOURCE_APP_ID = 736;

/** customize/736/desktop.js FC — 736 正本フィールドコード */
export const FC736 = Object.freeze({
  version_type: "version_type",
  site_entry_date: "site_entry_date",
  draft_date: "draft_date",
  record_created_date: "record_created_date",
  created_by: "created_by",
  created_by_name: "created_by_name",
  person_in_charge: "person_in_charge",
  person_in_charge_name: "person_in_charge_name",
  project_code: "project_code",
  project_official_name: "project_official_name",
  project_name: "project_name",
  girder_type: "girder_type",
  order_branch: "order_branch",
  department: "department",
  client_name: "client_name",
  safety_rule_88: "safety_rule_88",
  start_date: "start_date",
  end_date: "end_date",
  status: "status",
  note: "note",
  contract_total_1: "contract_total_1",
  mat_total_2: "mat_total_2",
  mat_total_3: "mat_total_3",
  sub_repair_order_amount: "sub_repair_order_amount",
  sub_scaffold_order_amount: "sub_scaffold_order_amount",
  sub_paint_order_amount: "sub_paint_order_amount",
  sub_labor_total: "sub_labor_total",
  cost_total_8: "cost_total_8",
  profit_9: "profit_9",
  profit_rate: "profit_rate",
  spec_lines: "spec_lines",
  cost_lines: "cost_lines",
  mat_lines: "mat_lines",
  subcontract_lines: "subcontract_lines",
  version_seq: "version_seq",
  source_record_id: "source_record_id",
  is_locked: "is_locked",
  revision_note: "revision_note",
  ui_col_layout_json: "ui_col_layout_json",
});

export const SUB736_TO_APP2_ROW_KIND = Object.freeze({
  vendor: "block_header",
  detail: "detail",
  overhead: "overhead",
  block_total: "block_total",
  legal_welfare: "legal_welfare",
  order_amount: "detail",
  labor_total: "subtotal",
});

/** 736 → App1 トップレベル直接対応 */
export const HEADER_736_TO_APP1 = Object.freeze([
  ["version_type", "version_type"],
  ["version_seq", "version_seq"],
  ["source_record_id", "source_record_id"],
  ["status", "status"],
  ["is_locked", "is_locked"],
  ["revision_note", "revision_note"],
  ["project_code", "project_code"],
  ["client_name", "client_name"],
  ["project_official_name", "project_official_name"],
  ["project_name", "project_name"],
  ["start_date", "start_date"],
  ["end_date", "end_date"],
  ["site_entry_date", "site_entry_date"],
  ["draft_date", "draft_date"],
  ["girder_type", "girder_type"],
  ["order_branch", "order_branch"],
  ["department", "department"],
  ["safety_rule_88", "safety_rule_88"],
  ["person_in_charge", "person_in_charge"],
  ["note", "note"],
  ["contract_total_1", "contract_total_1"],
  ["cost_total_8", "cost_total_8"],
  ["profit_9", "profit_9"],
  ["ui_col_layout_json", "ui_col_layout_json"],
]);

/** spec_lines 子 → contract_lines 子 */
export const SPEC736_TO_CONTRACT = Object.freeze([
  ["spec_row_key", "contract_row_key"],
  ["spec_name", "contract_work_name"],
  ["spec_category", "contract_section"],
  ["spec_unit", "contract_unit"],
  ["spec_qty", "contract_qty"],
  ["spec_unit_price", "contract_unit_price"],
  ["spec_amount", "contract_amount"],
  ["spec_note", "contract_note"],
]);

/** cost_lines 子 → summary_cost_lines 子（link 行は subcontract_block と detail_marker で App2 と JOIN） */
export const COST736_TO_SUMMARY = Object.freeze([
  ["cost_row_key", "summary_row_key"],
  ["cost_work_type_code", "summary_work_type_code"],
  ["cost_work_type", "summary_work_type_name"],
  ["cost_category_code", "summary_category_code"],
  ["cost_category", "summary_line_type"],
  ["cost_budget_category", "summary_cost_category"],
  ["cost_unit", "summary_unit"],
  ["cost_qty", "summary_qty"],
  ["cost_unit_price", "summary_unit_price"],
  ["cost_amount", "summary_amount_excl_tax"],
  ["cost_tax_rate", "summary_tax_rate"],
  ["cost_basis_note", "summary_calc_basis"],
  ["detail_marker", "summary_block_no"],
]);

/** subcontract_lines 子 → App2 フラット行
 * Excel U4: 細目は name_2。種別(name_1)は移行後 alignBlockDetailNameColumns で補完。
 */
export const SUB736_TO_APP2 = Object.freeze([
  ["sub_row_key", "row_key"],
  ["subcontract_block", "stable_block_id"],
  ["sub_row_kind", "row_kind"],
  ["sub_vendor", "vendor_name"],
  ["sub_line_type", "name_2"],
  ["sub_unit", "unit"],
  ["sub_qty", "quantity"],
  ["sub_unit_price", "unit_price"],
  ["sub_amount", "amount"],
  ["sub_basis", "calc_basis"],
]);

/** mat_lines 子 → App2 detail（材料ブロック②③。stable_block_id は移行時に新規発行）
 * Excel U4: mat_group→name_2（塗料等）、mat_name→name_3（製品）。
 * name_1（材料費）は align でグループ先頭に付与。容量・メーカーは name_3 に連結。
 */
export const MAT736_TO_APP2 = Object.freeze([
  ["mat_row_key", "row_key"],
  ["mat_vendor", "vendor_name"],
  ["mat_group", "name_2"],
  ["mat_name", "name_3"],
  ["mat_qty", "quantity"],
  ["mat_unit_price", "unit_price"],
  ["mat_amount", "amount"],
  ["mat_basis", "calc_basis"],
]);

export function fieldValue(record, code) {
  const cell = record?.[code];
  if (cell == null) return "";
  if (Array.isArray(cell.value)) return cell.value;
  return cell.value ?? "";
}

export function subtableRows(record, tableCode) {
  const cell = record?.[tableCode];
  if (!cell || !Array.isArray(cell.value)) return [];
  return cell.value.map((row) => row.value ?? row);
}

function mapRow(row, pairs) {
  const out = {};
  for (const [from, to] of pairs) {
    out[to] = row[from] ?? "";
  }
  return out;
}

function parseProjectBranch(projectCode) {
  const raw = String(projectCode ?? "").trim();
  const dash = raw.lastIndexOf("-");
  if (dash <= 0) return { project_code: raw, project_branch: "" };
  return {
    project_code: raw.slice(0, dash),
    project_branch: raw.slice(dash + 1),
  };
}

/**
 * 1件の 736 レコードから移行先件数見積もりとサンプル映射を返す。
 * project_id / budget_version_id / stable_block_id は execute 時に新規発行（ここでは placeholder）。
 */
export function analyze736Record(record) {
  const recordId = fieldValue(record, "$id");
  const projectCodeRaw = String(fieldValue(record, FC736.project_code) || "").trim();
  const branchParts = parseProjectBranch(projectCodeRaw);
  const specRows = subtableRows(record, FC736.spec_lines);
  const costRows = subtableRows(record, FC736.cost_lines);
  const matRows = subtableRows(record, FC736.mat_lines);
  const subRows = subtableRows(record, FC736.subcontract_lines);

  const linkCostRows = costRows.filter(
    (r) => String(r.cost_row_kind || "") === "連携" || String(r.cost_row_kind || "") === "link",
  );
  const summaryRows = costRows.filter((r) => {
    const kind = String(r.cost_row_kind || "");
    return kind !== "連携" && kind !== "link";
  });

  const app2FromSub = subRows.length;
  const app2FromMat = matRows.length;
  const app3Rows = 0;

  const headerPreview = {};
  for (const [from, to] of HEADER_736_TO_APP1) {
    headerPreview[to] = fieldValue(record, from);
  }
  headerPreview.project_branch = branchParts.project_branch;
  headerPreview.project_id = "<new:prj-…>";
  headerPreview.budget_version_id = "<new:bv-…>";
  headerPreview.source_record_id = recordId;
  headerPreview.actual_write_seq = 0;
  headerPreview.write_channel = "migration_from_736";

  const contractPreview = specRows.slice(0, 2).map((row) => mapRow(row, SPEC736_TO_CONTRACT));
  const summaryPreview = summaryRows.slice(0, 2).map((row) => mapRow(row, COST736_TO_SUMMARY));
  const detailPreview = subRows.slice(0, 3).map((row) => {
    const mapped = mapRow(row, SUB736_TO_APP2);
    const kind = String(row.sub_row_kind || "");
    mapped.row_kind = SUB736_TO_APP2_ROW_KIND[kind] ?? kind;
    mapped.detail_record_key = "<new:bv|row>";
    mapped.write_channel = "migration_from_736";
    return mapped;
  });
  const matPreview = matRows.slice(0, 2).map((row) => {
    const mapped = mapRow(row, MAT736_TO_APP2);
    mapped.row_kind = "detail";
    mapped.stable_block_id = "<new:block-mat-…>";
    mapped.detail_record_key = "<new:bv|row>";
    return mapped;
  });

  return {
    source: {
      appId: SOURCE_APP_ID,
      recordId: String(recordId || ""),
      project_code: projectCodeRaw,
      version_seq: fieldValue(record, FC736.version_seq),
      version_type: fieldValue(record, FC736.version_type),
      status: fieldValue(record, FC736.status),
    },
    counts: {
      app1_parent: 1,
      app1_contract_lines: specRows.length,
      app1_summary_cost_lines: summaryRows.length,
      app2_detail_rows: app2FromSub + app2FromMat,
      app2_from_subcontract: app2FromSub,
      app2_from_mat: app2FromMat,
      app3_actual_rows: app3Rows,
      link_cost_rows: linkCostRows.length,
    },
    sample: {
      app1_header: headerPreview,
      app1_contract_lines: contractPreview,
      app1_summary_cost_lines: summaryPreview,
      app2_detail_rows: [...detailPreview, ...matPreview],
      app3_actual_rows: [],
    },
  };
}

export function summarize736Records(records) {
  const byProject = new Map();
  let specTotal = 0;
  let costTotal = 0;
  let matTotal = 0;
  let subTotal = 0;

  for (const record of records) {
    const code = String(fieldValue(record, FC736.project_code) || "(工事コードなし)").trim();
    const entry = byProject.get(code) ?? { project_code: code, versions: 0, recordIds: [] };
    entry.versions += 1;
    entry.recordIds.push(String(fieldValue(record, "$id") || ""));
    byProject.set(code, entry);

    specTotal += subtableRows(record, FC736.spec_lines).length;
    costTotal += subtableRows(record, FC736.cost_lines).length;
    matTotal += subtableRows(record, FC736.mat_lines).length;
    subTotal += subtableRows(record, FC736.subcontract_lines).length;
  }

  return {
    sourceAppId: SOURCE_APP_ID,
    recordCount: records.length,
    projectCount: byProject.size,
    subtableRowTotals: {
      spec_lines: specTotal,
      cost_lines: costTotal,
      mat_lines: matTotal,
      subcontract_lines: subTotal,
    },
    estimatedOutputs: {
      app1_parent_records: records.length,
      app1_contract_line_rows: specTotal,
      app1_summary_cost_line_rows: costTotal,
      app2_detail_records: subTotal + matTotal,
      app3_actual_records: 0,
    },
    projects: [...byProject.values()].sort((a, b) => a.project_code.localeCompare(b.project_code, "ja")),
  };
}
