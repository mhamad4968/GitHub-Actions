/**
 * 736 1 レコード → App1 親レコード + App2 行配列（execute 用・純関数）。
 * write_channel は App2 の DD 制約により app1_custom_ui 固定。
 * App1 に write_channel フィールドは無い（LIVE schema）。
 */
import {
  createBudgetVersionId,
  createProjectId,
  createRowKey,
  createStableBlockId,
  projectBusinessKey,
  seriesGuardKey,
  versionRecordKey,
} from "./keys.mjs";
import { deriveLockState } from "./lock.mjs";
import {
  COST736_TO_SUMMARY,
  FC736,
  MAT736_TO_APP2,
  SPEC736_TO_CONTRACT,
  SUB736_TO_APP2,
  SUB736_TO_APP2_ROW_KIND,
  fieldValue,
  subtableRows,
} from "./migrate-from-736-model.mjs";
import { alignBlockDetailNameColumns } from "./name-columns-excel-align.mjs";

const TEXT = (value) => ({
  value: value === null || value === undefined ? "" : String(value),
});

function parseProjectBranch(projectCode) {
  const raw = String(projectCode ?? "").trim();
  const dash = raw.lastIndexOf("-");
  if (dash <= 0) return { project_code: raw, project_branch: "" };
  return {
    project_code: raw.slice(0, dash),
    project_branch: raw.slice(dash + 1),
  };
}

function cellValue(row, code) {
  const cell = row?.[code];
  if (cell == null) return "";
  if (typeof cell === "object" && "value" in cell) return cell.value ?? "";
  return cell;
}

function mapTaxRate(raw) {
  const n = String(raw ?? "").trim();
  if (n === "0" || n === "0%" || n === "0％") return "0％";
  if (n === "0.08" || n === "8" || n === "8%" || n === "8％") return "8％";
  if (n === "0.1" || n === "0.10" || n === "10" || n === "10%" || n === "10％") {
    return "10％";
  }
  return n.includes("％") || n.includes("%") ? n.replace("%", "％") : "10％";
}

function mapIsLocked(raw) {
  if (Array.isArray(raw)) {
    return { value: raw.includes("ロック") ? ["ロック"] : [] };
  }
  if (raw === true || raw === "ロック" || raw === "1" || raw === "true") {
    return { value: ["ロック"] };
  }
  return { value: [] };
}

function ensureRowKey(raw, uuidFactory) {
  const text = String(raw ?? "").trim();
  if (text && !text.includes("|") && text.length <= 40) return text;
  return createRowKey(uuidFactory);
}

function ensureBlockId(raw, uuidFactory, cache, cacheKey) {
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const text = String(raw ?? "").trim();
  const id =
    text && !text.includes("|") && text.length <= 40
      ? text
      : createStableBlockId(uuidFactory);
  cache.set(cacheKey, id);
  return id;
}

function subtableValue(rows) {
  return {
    value: rows.map((fields) => ({ value: fields })),
  };
}

function mapApp2Unit(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  if (text === "%" || text === "％") return "％";
  if (text === "月" || text === "ヶ月" || text === "カ月" || text === "ヵ月") {
    return "箇月";
  }
  const allowed = new Set(["㎡", "式", "回", "人", "日", "箇月", "－", "缶", "枚", "％"]);
  return allowed.has(text) ? text : "－";
}

function mapContractSection(raw, workName = "") {
  const text = String(raw ?? "").trim();
  if (text === "施工" || text === "保安") return text;
  const name = String(workName ?? "");
  if (name.includes("保安")) return "保安";
  // 736 の spec_category は空のことが多い → 名称推定、それでも無ければ施工
  return "施工";
}

/** 736 詳細表ブロック id → 総括連携 detail_marker（customize/736 BLOCK_MARKERS） */
const BLOCK_TO_MARKER = Object.freeze({
  repair: "④",
  scaffold: "⑤",
  paint: "⑥",
  labor: "⑦",
});

function findLinkCostRow(costRows, marker) {
  return costRows.find((row) => {
    const kind = String(cellValue(row, "cost_row_kind") || "");
    const dm = String(cellValue(row, "detail_marker") || "");
    return (kind === "連携" || kind === "link") && dm === marker;
  });
}

/**
 * @param {object} record 736 kintone record
 * @param {{
 *   uuidFactory: () => string,
 *   projectId?: string,
 *   newerVersionExists?: boolean,
 * }} options
 */
export function buildMigrationPayload(record, options = {}) {
  const { uuidFactory, newerVersionExists = false } = options;
  if (typeof uuidFactory !== "function") {
    throw new TypeError("uuidFactory must be a function");
  }

  const sourceRecordId = String(fieldValue(record, "$id") || "").trim();
  if (!sourceRecordId) throw new RangeError("736 record missing $id");

  const projectCodeRaw = String(fieldValue(record, FC736.project_code) || "").trim();
  if (!projectCodeRaw) throw new RangeError("736 record missing project_code");
  const branchParts = parseProjectBranch(projectCodeRaw);
  const businessKey = projectBusinessKey(
    branchParts.project_code,
    branchParts.project_branch,
  );

  const projectId = options.projectId || createProjectId(uuidFactory);
  const budgetVersionId = createBudgetVersionId(uuidFactory);
  const versionSeqRaw = fieldValue(record, FC736.version_seq);
  const versionSeq = Math.max(1, Number(versionSeqRaw) || 1);
  const statusRaw = String(fieldValue(record, FC736.status) || "下書き").trim();
  const status = statusRaw === "版確定" ? "版確定" : "下書き";
  const derivedLock = deriveLockState({ status, newerVersionExists });
  const initialSeries = versionSeq === 1;

  const safety = String(fieldValue(record, FC736.safety_rule_88) || "").trim();
  const safetyRule = safety === "有" || safety === "無" ? safety : "無";

  const noteRaw = String(fieldValue(record, FC736.note) || "");
  const migTag = `[mig736:#${sourceRecordId}]`;
  const note = noteRaw.includes(migTag) ? noteRaw : `${migTag}\n${noteRaw}`.trim();

  const app1Record = {
    project_id: TEXT(projectId),
    project_business_key: TEXT(businessKey),
    budget_version_id: TEXT(budgetVersionId),
    series_guard_key: TEXT(
      seriesGuardKey({
        initial: initialSeries,
        projectBusinessKey: businessKey,
        budgetVersionId,
      }),
    ),
    version_record_key: TEXT(versionRecordKey(projectId, versionSeq)),
    version_seq: TEXT(String(versionSeq)),
    version_type: TEXT(fieldValue(record, FC736.version_type) || "当初"),
    status: TEXT(status),
    derived_lock_state: TEXT(derivedLock),
    actual_write_seq: TEXT("0"),
    source_record_id: TEXT(sourceRecordId),
    project_code: TEXT(branchParts.project_code),
    project_branch: TEXT(branchParts.project_branch),
    project_name: TEXT(fieldValue(record, FC736.project_name)),
    project_official_name: TEXT(fieldValue(record, FC736.project_official_name)),
    client_name: TEXT(fieldValue(record, FC736.client_name)),
    start_date: TEXT(fieldValue(record, FC736.start_date)),
    end_date: TEXT(fieldValue(record, FC736.end_date)),
    site_entry_date: TEXT(fieldValue(record, FC736.site_entry_date)),
    draft_date: TEXT(fieldValue(record, FC736.draft_date)),
    girder_type: TEXT(fieldValue(record, FC736.girder_type)),
    order_branch: TEXT(fieldValue(record, FC736.order_branch)),
    department: TEXT(fieldValue(record, FC736.department)),
    safety_rule_88: TEXT(safetyRule),
    revision_note: TEXT(fieldValue(record, FC736.revision_note)),
    note: TEXT(note),
    is_locked: mapIsLocked(fieldValue(record, FC736.is_locked)),
    contract_total_1: TEXT(fieldValue(record, FC736.contract_total_1)),
    cost_total_8: TEXT(fieldValue(record, FC736.cost_total_8)),
    profit_9: TEXT(fieldValue(record, FC736.profit_9)),
    ui_col_layout_json: TEXT(fieldValue(record, FC736.ui_col_layout_json)),
    summary_projection_status: TEXT("synced"),
  };

  // 請負
  const contractRows = subtableRows(record, FC736.spec_lines).map((row, index) => {
    const mapped = {};
    for (const [from, to] of SPEC736_TO_CONTRACT) {
      let value = cellValue(row, from);
      if (to === "contract_section") {
        value = mapContractSection(value, cellValue(row, "spec_name"));
      }
      mapped[to] = TEXT(value);
    }
    mapped.contract_sort_order = TEXT(String(index + 1));
    if (!mapped.contract_row_key?.value) {
      mapped.contract_row_key = TEXT(createRowKey(uuidFactory));
    }
    return mapped;
  });
  app1Record.contract_lines = subtableValue(contractRows);

  // 給与: cost_lines の給与手当
  const costRows = subtableRows(record, FC736.cost_lines);
  const salarySource = costRows.filter(
    (row) => String(cellValue(row, "cost_budget_category") || "") === "給与手当",
  );
  const salaryRows = salarySource.map((row, index) => {
    const unitRaw = String(cellValue(row, "cost_unit") || "").trim();
    const unitOk = ["㎡", "式", "回", "人", "日", "箇月", "－"].includes(unitRaw);
    return {
      salary_row_key: TEXT(
        ensureRowKey(cellValue(row, "cost_row_key"), uuidFactory),
      ),
      salary_role: TEXT(
        cellValue(row, "cost_work_type") || cellValue(row, "cost_category"),
      ),
      salary_unit: TEXT(unitOk ? unitRaw : "－"),
      salary_qty: TEXT(cellValue(row, "cost_qty")),
      salary_unit_price: TEXT(cellValue(row, "cost_unit_price")),
      salary_amount: TEXT(cellValue(row, "cost_amount")),
      salary_note: TEXT(cellValue(row, "cost_basis_note")),
      salary_sort_order: TEXT(String(index + 1)),
    };
  });
  app1Record.salary_lines = subtableValue(salaryRows);

  // 総括原価（link 以外・給与以外）
  const summarySource = costRows.filter((row) => {
    const kind = String(cellValue(row, "cost_row_kind") || "");
    const budget = String(cellValue(row, "cost_budget_category") || "");
    if (kind === "連携" || kind === "link") return false;
    if (budget === "給与手当") return false;
    return true;
  });
  const summaryRows = summarySource.map((row, index) => {
    const fields = {};
    for (const [from, to] of COST736_TO_SUMMARY) {
      let value = cellValue(row, from);
      if (to === "summary_tax_rate") value = mapTaxRate(value);
      if (to === "summary_cost_category") {
        value = value === "施工" || value === "保安" ? value : "";
      }
      if (to === "summary_unit") {
        const ok = ["㎡", "式", "回", "人", "日", "箇月", "－", "缶", "枚", "％"].includes(
          String(value),
        );
        value = ok ? value : "－";
      }
      fields[to] = TEXT(value);
    }
    fields.summary_sort_order = TEXT(String(index + 1));
    if (!fields.summary_row_key?.value) {
      fields.summary_row_key = TEXT(createRowKey(uuidFactory));
    }
    return fields;
  });
  app1Record.summary_cost_lines = subtableValue(summaryRows);

  // App2: subcontract
  const blockIdCache = new Map();
  const blockOrder = new Map();
  let nextBlockSort = 1;
  const app2Rows = [];
  const headerMetaByBlock = new Map();

  const subRows = subtableRows(record, FC736.subcontract_lines);
  for (const [index, row] of subRows.entries()) {
    const blockRaw = cellValue(row, "subcontract_block");
    const cacheKey = `sub:${blockRaw || `orphan-${index}`}`;
    const stableBlockId = ensureBlockId(blockRaw, uuidFactory, blockIdCache, cacheKey);
    if (!blockOrder.has(stableBlockId)) {
      blockOrder.set(stableBlockId, nextBlockSort++);
    }
    if (!headerMetaByBlock.has(stableBlockId)) {
      const marker = BLOCK_TO_MARKER[String(blockRaw)] || "";
      const link = marker ? findLinkCostRow(costRows, marker) : null;
      const budget = link ? String(cellValue(link, "cost_budget_category") || "") : "";
      headerMetaByBlock.set(stableBlockId, {
        work_type_code: link ? String(cellValue(link, "cost_work_type_code") || "") : "",
        work_type_name: link ? String(cellValue(link, "cost_work_type") || "") : "",
        cost_category_key: budget === "施工" || budget === "保安" ? budget : "",
      });
    }
    const meta = headerMetaByBlock.get(stableBlockId);
    const kindRaw = String(cellValue(row, "sub_row_kind") || "");
    const rowKind = SUB736_TO_APP2_ROW_KIND[kindRaw] ?? (kindRaw || "detail");
    const mapped = {};
    for (const [from, to] of SUB736_TO_APP2) {
      if (to === "row_kind" || to === "stable_block_id") continue;
      mapped[to] = cellValue(row, from);
    }
    app2Rows.push({
      row_key: ensureRowKey(mapped.row_key, uuidFactory),
      stable_block_id: stableBlockId,
      row_kind: rowKind,
      block_no: blockOrder.get(stableBlockId),
      block_sort_order: blockOrder.get(stableBlockId),
      row_sort_order: index + 1,
      block_status: "active",
      cost_category_key: meta.cost_category_key,
      work_type_code: rowKind === "block_header" ? meta.work_type_code : "",
      work_type_name: rowKind === "block_header" ? meta.work_type_name : "",
      vendor_name: mapped.vendor_name ?? "",
      name_1: mapped.name_1 ?? "",
      name_2: mapped.name_2 ?? "",
      name_3: mapped.name_3 ?? "",
      name_spec_group: "",
      unit: mapApp2Unit(mapped.unit),
      quantity: mapped.quantity ?? "",
      unit_price: mapped.unit_price ?? "",
      amount: mapped.amount ?? "",
      note: "",
      calc_basis: mapped.calc_basis ?? "",
    });
  }

  // App2: mat_lines（材料ブロック）— 連携②③から工種を補完
  const matMarkers = ["②", "③"];
  let matMarkerIndex = 0;
  const matRows = subtableRows(record, FC736.mat_lines);
  for (const [index, row] of matRows.entries()) {
    const group = String(cellValue(row, "mat_group") || "材料");
    const cacheKey = `mat:${group}`;
    const isNewBlock = !blockIdCache.has(cacheKey);
    const stableBlockId = ensureBlockId("", uuidFactory, blockIdCache, cacheKey);
    if (!blockOrder.has(stableBlockId)) {
      blockOrder.set(stableBlockId, nextBlockSort++);
    }
    if (isNewBlock && !headerMetaByBlock.has(stableBlockId)) {
      const marker = matMarkers[matMarkerIndex++] || "";
      const link = marker ? findLinkCostRow(costRows, marker) : null;
      headerMetaByBlock.set(stableBlockId, {
        work_type_code: link ? String(cellValue(link, "cost_work_type_code") || "") : "",
        work_type_name: link ? String(cellValue(link, "cost_work_type") || "") : group,
        cost_category_key: "施工",
      });
    }
    const meta = headerMetaByBlock.get(stableBlockId) || {
      work_type_code: "",
      work_type_name: group,
      cost_category_key: "施工",
    };
    const mapped = {};
    for (const [from, to] of MAT736_TO_APP2) {
      mapped[to] = cellValue(row, from);
    }
    const capacity = String(cellValue(row, "mat_capacity") || "").trim();
    const maker = String(cellValue(row, "mat_maker") || "").trim();
    const product = String(mapped.name_3 || "").trim();
    const name3Parts = [product, capacity, maker].filter(Boolean);
    // 材料は明細のみ。ブロック見出し行を初回グループで1本足す。
    if (isNewBlock) {
      app2Rows.push({
        row_key: createRowKey(uuidFactory),
        stable_block_id: stableBlockId,
        row_kind: "block_header",
        block_no: blockOrder.get(stableBlockId),
        block_sort_order: blockOrder.get(stableBlockId),
        row_sort_order: 0,
        block_status: "active",
        cost_category_key: meta.cost_category_key,
        work_type_code: meta.work_type_code,
        work_type_name: meta.work_type_name,
        vendor_name: "",
        name_1: "",
        name_2: "",
        name_3: "",
        name_spec_group: group,
        unit: "",
        quantity: "",
        unit_price: "",
        amount: "",
        note: "",
        calc_basis: "",
      });
    }
    app2Rows.push({
      row_key: ensureRowKey(mapped.row_key, uuidFactory),
      stable_block_id: stableBlockId,
      row_kind: "detail",
      block_no: blockOrder.get(stableBlockId),
      block_sort_order: blockOrder.get(stableBlockId),
      row_sort_order: index + 1,
      block_status: "active",
      cost_category_key: "施工",
      work_type_code: "",
      work_type_name: "",
      vendor_name: mapped.vendor_name ?? "",
      name_1: "",
      name_2: mapped.name_2 || group,
      name_3: name3Parts.join(" "),
      name_spec_group: group,
      unit: mapApp2Unit(""),
      quantity: mapped.quantity ?? "",
      unit_price: mapped.unit_price ?? "",
      amount: mapped.amount ?? "",
      note: "",
      calc_basis: mapped.calc_basis ?? "",
    });
  }

  // Excel U4/U10: 種別はグループ先頭の name_1、細目は name_2
  const byBlock = new Map();
  for (const row of app2Rows) {
    const list = byBlock.get(row.stable_block_id) || [];
    list.push(row);
    byBlock.set(row.stable_block_id, list);
  }
  const alignedApp2 = [];
  for (const list of byBlock.values()) {
    const alignedDetails = alignBlockDetailNameColumns(
      list.filter((r) => r.row_kind === "detail"),
    ).map(({ changed, ...rest }) => rest);
    let detailIdx = 0;
    for (const row of list) {
      if (row.row_kind === "detail") {
        alignedApp2.push(alignedDetails[detailIdx++]);
      } else {
        alignedApp2.push(row);
      }
    }
  }

  return Object.freeze({
    sourceRecordId,
    projectId,
    budgetVersionId,
    projectBusinessKey: businessKey,
    versionSeq,
    status,
    derivedLockState: derivedLock,
    app1Record,
    app2Rows: Object.freeze(alignedApp2),
    counts: Object.freeze({
      contract_lines: contractRows.length,
      salary_lines: salaryRows.length,
      summary_cost_lines: summaryRows.length,
      app2_rows: alignedApp2.length,
    }),
  });
}

export function migrationIdempotencyQuery(sourceRecordId) {
  const id = String(sourceRecordId || "").trim();
  if (!id) throw new RangeError("sourceRecordId required");
  if (!/^\d+$/.test(id)) {
    throw new RangeError(`sourceRecordId must be numeric, got ${JSON.stringify(id)}`);
  }
  // App1 source_record_id は版複製元にも使うため、移行専用タグで判定する。
  return `note like "[mig736:#${id}]"`;
}
