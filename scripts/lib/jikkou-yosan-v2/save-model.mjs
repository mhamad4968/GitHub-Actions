/**
 * 実行予算 Ver.02 Phase C-2b — 内訳（App2）原子保存の入力生成レイヤ。
 *
 * - detail-block-model の toApp2Rows() 出力と、LIVE の既存 App2 レコードを
 *   row_key で突合し、planAtomicBudgetSave にそのまま渡せる
 *   { parentPut, detailAppId, detailAdds, detailUpdates, detailDeletes } を作る。
 * - ここもネットワークに触れない。既存行の取得だけ fetchExistingDetailRows が
 *   注入 api（kintone.api 互換）で行う。
 * - detail_record_key = budget_version_id|row_key（P-24/P-25）。
 * - write_channel は app1_custom_ui 固定、parent_lock_snapshot は保存可能な
 *   親（editable）のスナップショットとして editable を書く。
 * - retired_at_version_id / calc_basis はこのレイヤの管理外なので record に
 *   含めない（既存値を上書きしない）。
 */
import {
  ACTUAL_SOURCE_KIND,
  ACTUAL_WRITE_CHANNEL,
  monthStartDate,
  normalizeMonth,
} from "./actuals-matrix.mjs";
import { COMMON_UNITS } from "./contract-salary-model.mjs";
import { assertAllowedAppId } from "./guard.mjs";
import {
  createBudgetVersionId,
  createProjectId,
  detailRecordKey,
  projectBusinessKey,
  seriesGuardKey,
  versionRecordKey,
} from "./keys.mjs";
import { RECORDS_PER_REQUEST } from "./planner.mjs";

const RECORD_API = "/k/v1/record.json";
const RECORDS_API_GET = "/k/v1/records.json";
const FETCH_PAGE_SIZE = 500;

const TEXT = (value) => ({ value: value === null || value === undefined ? "" : String(value) });

function requireText(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}

/** App2 カタログ行（toApp2Rows の1件）→ kintone record オブジェクト。 */
export function detailRowToRecord(row, keys) {
  const budgetVersionId = requireText(keys.budgetVersionId, "budgetVersionId");
  const rowKey = requireText(row.row_key, "row.row_key");
  const recordKey = detailRecordKey(budgetVersionId, rowKey);
  // kintone の unique SINGLE_LINE_TEXT は 64 文字上限（CB_VA01）。フル UUID の
  // 連結キーは超過するため、compactUuidFactory 系の短縮キーを要求する。
  if (recordKey.length > 64) {
    throw new RangeError(
      `detail_record_key exceeds kintone's 64-char unique limit (${recordKey.length}): use compact row/version ids`,
    );
  }
  return {
    detail_record_key: TEXT(recordKey),
    project_id: TEXT(requireText(keys.projectId, "projectId")),
    project_business_key: TEXT(requireText(keys.projectBusinessKey, "projectBusinessKey")),
    budget_version_id: TEXT(budgetVersionId),
    stable_block_id: TEXT(requireText(row.stable_block_id, "row.stable_block_id")),
    row_key: TEXT(rowKey),
    row_kind: TEXT(requireText(row.row_kind, "row.row_kind")),
    // block_no は必須 NUMBER。廃止ブロックは番号を持たない（U14/P-39）ため
    // 0 を「番号なし」の値として書く。
    block_no: TEXT(row.block_no === null || row.block_no === undefined ? "0" : row.block_no),
    block_sort_order: TEXT(row.block_sort_order),
    row_sort_order: TEXT(row.row_sort_order),
    block_status: TEXT(row.block_status),
    cost_category_key: TEXT(row.cost_category_key ?? ""),
    work_type_code: TEXT(row.work_type_code ?? ""),
    work_type_name: TEXT(row.work_type_name ?? ""),
    vendor_name: TEXT(row.vendor_name ?? ""),
    name_1: TEXT(row.name_1 ?? ""),
    name_2: TEXT(row.name_2 ?? ""),
    name_3: TEXT(row.name_3 ?? ""),
    name_detail: TEXT(row.name_detail ?? ""),
    name_item: TEXT(row.name_item ?? ""),
    line_vendor_name: TEXT(row.line_vendor_name ?? ""),
    line_person_name: TEXT(row.line_person_name ?? ""),
    name_spec_group: TEXT(row.name_spec_group ?? ""),
    unit: TEXT(row.unit ?? ""),
    quantity: TEXT(row.quantity ?? ""),
    unit_price: TEXT(row.unit_price ?? ""),
    amount: TEXT(row.amount ?? ""),
    note: TEXT(row.note ?? ""),
    parent_lock_snapshot: TEXT("editable"),
    write_channel: TEXT("app1_custom_ui"),
  };
}

function existingByRowKey(existingRecords) {
  const map = new Map();
  for (const [index, record] of existingRecords.entries()) {
    const id = record?.$id?.value;
    const revision = record?.$revision?.value;
    const rowKey = record?.row_key?.value;
    if (!id || !revision || !rowKey) {
      throw new TypeError(
        `existingRecords[${index}] must carry $id, $revision and row_key values`,
      );
    }
    if (map.has(rowKey)) {
      throw new RangeError(`existingRecords: duplicate row_key ${rowKey} — aborting`);
    }
    map.set(rowKey, { id: String(id), revision: String(revision) });
  }
  return map;
}

/**
 * planAtomicBudgetSave へ渡す入力を作る。
 *
 * @param {object} args
 * @param {number} args.app1Id App1 のアプリID
 * @param {number} args.app2Id App2 のアプリID
 * @param {string|number} args.parentRecordId App1 親レコードID
 * @param {string|number} args.parentRevision App1 親レコード revision（CAS）
 * @param {object} [args.parentRecord] 親 PUT で更新するフィールド（省略時 CAS touch のみ）
 * @param {{projectId:string, projectBusinessKey:string, budgetVersionId:string}} args.keys
 * @param {readonly object[]} args.rows detail-block-model.toApp2Rows() の出力
 * @param {readonly object[]} args.existingRecords 現行 budget_version_id の全 App2 レコード
 */
export function buildDetailSaveInputs({
  app1Id,
  app2Id,
  parentRecordId,
  parentRevision,
  parentRecord = {},
  keys,
  rows,
  existingRecords,
}) {
  const parentAppId = assertAllowedAppId(app1Id, "buildDetailSaveInputs.app1Id");
  const detailAppId = assertAllowedAppId(app2Id, "buildDetailSaveInputs.app2Id");
  if (!Array.isArray(rows)) throw new TypeError("rows must be an array");
  if (!Array.isArray(existingRecords)) {
    throw new TypeError("existingRecords must be an array");
  }
  if (parentRecordId === null || parentRecordId === undefined || parentRecordId === "") {
    throw new TypeError("parentRecordId is required");
  }
  const revision = String(parentRevision ?? "");
  if (revision === "") throw new TypeError("parentRevision is required (CAS)");

  const existing = existingByRowKey(existingRecords);
  const seenRowKeys = new Set();
  const detailAdds = [];
  const detailUpdates = [];
  for (const row of rows) {
    const record = detailRowToRecord(row, keys);
    const rowKey = record.row_key.value;
    if (seenRowKeys.has(rowKey)) {
      throw new RangeError(`rows: duplicate row_key ${rowKey} — aborting`);
    }
    seenRowKeys.add(rowKey);
    const found = existing.get(rowKey);
    if (found) {
      detailUpdates.push({ id: found.id, revision: found.revision, record });
    } else {
      detailAdds.push(record);
    }
  }
  const detailDeletes = [];
  for (const [rowKey, found] of existing) {
    if (!seenRowKeys.has(rowKey)) {
      detailDeletes.push({ id: found.id, revision: found.revision });
    }
  }

  return {
    parentPut: {
      method: "PUT",
      api: RECORD_API,
      payload: {
        app: parentAppId,
        id: String(parentRecordId),
        revision,
        record: parentRecord,
      },
    },
    detailAppId,
    detailAdds,
    detailUpdates,
    detailDeletes,
  };
}

// ---------------------------------------------------------------------------
// 総括（請負/給与）サブテーブル: モデル ⇔ App1 レコードの相互変換（残A）
// ---------------------------------------------------------------------------

/**
 * contract-salary-model の snapshot() → App1 の contract_lines / salary_lines
 * サブテーブル値。全行置換（kintone のサブテーブル PUT は value 配列で全置換）。
 * amount は snapshot の計算済み値（ROUND 済み）をそのまま書く。
 */
export function summarySnapshotToSubtables(summarySnapshot) {
  if (!summarySnapshot || typeof summarySnapshot !== "object") {
    throw new TypeError("summarySnapshot must be a contract-salary snapshot");
  }
  const contractRows = [];
  let contractSort = 0;
  for (const section of ["施工", "保安"]) {
    for (const line of summarySnapshot.contractSections?.[section] ?? []) {
      contractSort += 1;
      contractRows.push({
        value: {
          contract_row_key: TEXT(line.rowKey),
          contract_section: TEXT(line.section),
          contract_work_name: TEXT(line.workName ?? ""),
          contract_work_desc: TEXT(line.workDesc ?? ""),
          contract_unit: TEXT(line.unit ?? ""),
          contract_qty: TEXT(line.quantity ?? ""),
          contract_unit_price: TEXT(line.unitPrice ?? ""),
          contract_amount: TEXT(line.amount ?? ""),
          contract_note: TEXT(line.note ?? ""),
          contract_sort_order: TEXT(contractSort),
        },
      });
    }
  }
  const salaryRows = (summarySnapshot.salaryLines ?? []).map((line, index) => ({
    value: {
      salary_row_key: TEXT(line.rowKey),
      salary_role: TEXT(line.role ?? ""),
      salary_person_name: TEXT(line.personName ?? ""),
      salary_unit: TEXT(line.unit ?? ""),
      salary_qty: TEXT(line.quantity ?? ""),
      salary_unit_price: TEXT(line.unitPrice ?? ""),
      salary_amount: TEXT(line.amount ?? ""),
      salary_note: TEXT(line.note ?? ""),
      salary_sort_order: TEXT(index + 1),
    },
  }));
  return {
    contract_lines: { value: contractRows },
    salary_lines: { value: salaryRows },
  };
}

/**
 * App1 レコード → createContractSalaryModel 入力（contractLines/salaryLines）。
 * row_key を保持するのでラウンドトリップしても行識別が変わらない。
 */
export function app1RecordToSummaryLines(record) {
  const rows = (code) => {
    const field = record?.[code];
    return Array.isArray(field?.value) ? field.value : [];
  };
  const cell = (row, code) => {
    const value = row?.value?.[code]?.value;
    return value === undefined || value === null || value === "" ? null : String(value);
  };
  const inferSection = (raw, workName) => {
    if (raw === "施工" || raw === "保安") return raw;
    if (String(workName || "").includes("保安")) return "保安";
    return workName ? "施工" : null;
  };
  const contractLines = rows("contract_lines").map((row) => {
    const workName = cell(row, "contract_work_name");
    return {
      rowKey: cell(row, "contract_row_key"),
      section: inferSection(cell(row, "contract_section"), workName),
      workName,
      workDesc: cell(row, "contract_work_desc"),
      unit: cell(row, "contract_unit"),
      quantity: cell(row, "contract_qty"),
      unitPrice: cell(row, "contract_unit_price"),
      note: cell(row, "contract_note"),
    };
  });
  const salaryLines = rows("salary_lines").map((row) => ({
    rowKey: cell(row, "salary_row_key"),
    role: cell(row, "salary_role"),
    personName: cell(row, "salary_person_name"),
    unit: cell(row, "salary_unit"),
    quantity: cell(row, "salary_qty"),
    unitPrice: cell(row, "salary_unit_price"),
    note: cell(row, "salary_note"),
  }));
  return { contractLines, salaryLines };
}

/**
 * App1 summary_cost_lines → 投影の previousLines（手入力列の引き継ぎ用）。
 * 種別 / 計算基準 / 備考のみを stable_block_id キーで運ぶ。
 */
export function app1RecordToProjectionPreviousLines(record) {
  const field = record?.summary_cost_lines;
  const rows = Array.isArray(field?.value) ? field.value : [];
  const cell = (row, code) => {
    const value = row?.value?.[code]?.value;
    return value === undefined || value === null ? "" : String(value);
  };
  return rows.map((row) => ({
    summary_stable_block_id: cell(row, "summary_stable_block_id").trim(),
    summary_work_type_code: cell(row, "summary_work_type_code").trim(),
    summary_line_type: cell(row, "summary_line_type"),
    summary_material_name: cell(row, "summary_material_name"),
    summary_calc_basis: cell(row, "summary_calc_basis"),
    summary_note: cell(row, "summary_note"),
  }));
}

/** regenerateSummaryCostLines の行 → App1 summary_cost_lines サブテーブル */
export function projectionRowsToSubtable(projectionRows) {
  if (!Array.isArray(projectionRows)) {
    throw new TypeError("projectionRows must be an array");
  }
  const taxOption = (rate) => {
    const raw = String(rate ?? "").trim().replace(/%/g, "％");
    if (raw === "0" || raw === "0％") return "0％";
    if (raw === "0.08" || raw === "8" || raw === "8％") return "8％";
    if (
      raw === "0.1" ||
      raw === "0.10" ||
      raw === "10" ||
      raw === "10％"
    ) {
      return "10％";
    }
    return "10％";
  };
  const unitOption = (unit) => {
    const allowed = COMMON_UNITS;
    const raw = String(unit ?? "");
    if (!raw) return "－";
    const aliases = {
      "㎡": "m2",
      "掛㎡": "掛m2",
      m: "ｍ",
      km: "㎞",
      kg: "㎏",
    };
    const mapped = Object.prototype.hasOwnProperty.call(aliases, raw)
      ? aliases[raw]
      : raw;
    // マスタ外は祖父としてそのまま残す（－に潰さない）。
    return allowed.includes(mapped) || mapped ? mapped : "－";
  };
  // contract_lines / salary_lines と同じく「フィールドコード → { value: rows }」。
  // `{ value: rows }` だけ返すと parentRecord.value に載り、summary_cost_lines が PUT されない。
  return {
    summary_cost_lines: {
      value: projectionRows.map((line, index) => ({
        value: {
          summary_stable_block_id: TEXT(line.summary_stable_block_id ?? ""),
          summary_block_no: TEXT(line.summary_block_no ?? index + 1),
          summary_cost_category: TEXT(line.summary_cost_category ?? ""),
          summary_work_type_code: TEXT(line.summary_work_type_code ?? ""),
          summary_work_type_name: TEXT(line.summary_work_type_name ?? ""),
          summary_line_type: TEXT(line.summary_line_type ?? ""),
          summary_material_name: TEXT(line.summary_material_name ?? ""),
          summary_unit: TEXT(unitOption(line.summary_unit)),
          summary_qty: TEXT(line.summary_qty ?? ""),
          summary_unit_price: TEXT(line.summary_unit_price ?? ""),
          summary_amount_excl_tax: TEXT(line.summary_amount_excl_tax ?? ""),
          summary_tax_rate: TEXT(taxOption(line.summary_tax_rate)),
          summary_amount_incl_tax: TEXT(line.summary_amount_incl_tax ?? ""),
          summary_rate_to_1: TEXT(line.summary_rate_to_1 ?? ""),
          summary_calc_basis: TEXT(line.summary_calc_basis ?? ""),
          summary_note: TEXT(line.summary_note ?? ""),
          summary_sort_order: TEXT(line.summary_sort_order ?? index + 1),
        },
      })),
    },
  };
}

const FOOTER_KINDS = ["overhead", "insurance", "subtotal", "legal_welfare", "block_total"];
// R-11/R-12: overhead・legal_welfare は自動計算(読取専用)のため手入力金額を復元しない
// (rowKey は footerRowKeys で保持=round-trip安定)。insurance のみ手入力復元。
const MANUAL_FOOTER_CAMEL = { insurance: "insurance" };

function v(record, code) {
  const field = record?.[code];
  return field && typeof field === "object" && "value" in field ? field.value : field;
}

/**
 * LIVE の App2 レコード群 → createDetailBlockModel の blocks 入力。
 * stable_block_id でグループ化し、block_sort_order / row_sort_order 順に
 * 復元する。row_key を保持するので、保存時の差分は update として突合される。
 */
export function app2RecordsToBlocks(records) {
  if (!Array.isArray(records)) throw new TypeError("records must be an array");
  const groups = new Map();
  for (const record of records) {
    const stableBlockId = requireText(String(v(record, "stable_block_id") ?? ""), "stable_block_id");
    if (!groups.has(stableBlockId)) groups.set(stableBlockId, []);
    groups.get(stableBlockId).push(record);
  }
  const blocks = [];
  for (const [stableBlockId, group] of groups) {
    group.sort((a, b) => Number(v(a, "row_sort_order")) - Number(v(b, "row_sort_order")));
    const block = {
      stableBlockId,
      status: String(v(group[0], "block_status") || "active"),
      sortOrder: Number(v(group[0], "block_sort_order")) || 0,
      detailRows: [],
      footerRowKeys: {},
    };
    for (const record of group) {
      const kind = String(v(record, "row_kind") || "");
      const rowKey = String(v(record, "row_key") || "");
      if (kind === "block_header") {
        block.headerRowKey = rowKey;
        block.workTypeCode = v(record, "work_type_code") || null;
        block.workTypeName = v(record, "work_type_name") || null;
        block.costCategory = v(record, "cost_category_key") || null;
        block.vendorName = v(record, "vendor_name") || null;
      } else if (kind === "detail") {
        block.detailRows.push({
          rowKey,
          name1: v(record, "name_1") || null,
          name2: v(record, "name_2") || null,
          name3: v(record, "name_3") || null,
          nameDetail: v(record, "name_detail") || null,
          nameItem: v(record, "name_item") || null,
          lineVendorName: v(record, "line_vendor_name") || null,
          linePersonName: v(record, "line_person_name") || null,
          unit: v(record, "unit") || null,
          quantity: v(record, "quantity") || null,
          unitPrice: v(record, "unit_price") || null,
          note: v(record, "note") || null,
        });
      } else if (FOOTER_KINDS.includes(kind)) {
        block.footerRowKeys[kind] = rowKey;
        const camel = MANUAL_FOOTER_CAMEL[kind];
        if (camel) block[camel] = v(record, "amount") || null;
      }
    }
    blocks.push(block);
  }
  blocks.sort((a, b) => a.sortOrder - b.sortOrder);
  return blocks.map(({ sortOrder, ...block }) => block);
}

/**
 * 現行 budget_version_id の既存 App2 行を全件取得する（注入 api 使用・
 * offset ページング）。500件ページを最大3回 = P-27 の900行上限を覆う。
 */
export async function fetchExistingDetailRows(api, app2Id, budgetVersionId, options = {}) {
  if (typeof api !== "function") {
    throw new TypeError("api must be a kintone.api-compatible function");
  }
  const appId = assertAllowedAppId(app2Id, "fetchExistingDetailRows.app2Id");
  const versionId = requireText(budgetVersionId, "budgetVersionId");
  if (versionId.includes('"')) {
    throw new RangeError("budgetVersionId must not contain double quotes");
  }
  // fields:null で全フィールド（UI 復元用）。既定は保存差分用の最小セット。
  const fields =
    options.fields === null
      ? undefined
      : options.fields ?? ["$id", "$revision", "row_key", "budget_version_id"];
  const all = [];
  for (let offset = 0; offset <= 1000; offset += FETCH_PAGE_SIZE) {
    const response = await api(RECORDS_API_GET, "GET", {
      app: appId,
      query: `budget_version_id = "${versionId}" order by $id asc limit ${FETCH_PAGE_SIZE} offset ${offset}`,
      ...(fields ? { fields } : {}),
    });
    const records = Array.isArray(response?.records) ? response.records : [];
    all.push(...records);
    if (records.length < FETCH_PAGE_SIZE) return all;
  }
  throw new RangeError(
    "fetchExistingDetailRows: more than 1500 rows for one budget_version_id — aborting (P-27 limit exceeded)",
  );
}

// ---------------------------------------------------------------------------
// 予実（App3）保存: モデル ⇔ App3 レコード、planActualsSave 入力生成
// ---------------------------------------------------------------------------

/** toApp3Records の1件 → kintone POST/PUT record オブジェクト。 */
export function app3RowToRecord(row, keys) {
  const projectId = requireText(keys.projectId, "projectId");
  const businessKey = requireText(keys.projectBusinessKey, "projectBusinessKey");
  const recordKey = requireText(row.actual_record_key, "row.actual_record_key");
  if (recordKey.length > 64) {
    throw new RangeError(
      `actual_record_key exceeds kintone's 64-char unique limit (${recordKey.length})`,
    );
  }
  const record = {
    actual_record_key: TEXT(recordKey),
    project_id: TEXT(projectId),
    project_business_key: TEXT(businessKey),
    stable_block_id: TEXT(requireText(row.stable_block_id, "row.stable_block_id")),
    cost_category_key: TEXT(requireText(row.cost_category_key, "row.cost_category_key")),
    record_kind: TEXT(requireText(row.record_kind, "row.record_kind")),
    amount: TEXT(requireText(row.amount, "row.amount")),
    source_kind: TEXT(row.source_kind ?? ACTUAL_SOURCE_KIND),
    write_channel: TEXT(row.write_channel ?? ACTUAL_WRITE_CHANNEL),
  };
  // 2026-07-29-ver02-actual-detail-expand: 明細行変種は detail_row_key に
  // App757 rowKey（`row-…`）を保持し、actual_record_key の一意性は 8hex に
  // 圧縮した rXXXXXXXX セグメントで担保する。App758 に detail_row_key フィー
  // ルドが存在しない環境では書き込み時に無視されるだけなので、初期展開時に
  // 追加フィールドとして SINGLE_LINE_TEXT を用意しておくこと（手順は
  // docs/plans/…redesign-spec-draft.md 冒頭 changelog 参照）。
  if (row.detail_row_key !== undefined && row.detail_row_key !== null && row.detail_row_key !== "") {
    record.detail_row_key = TEXT(row.detail_row_key);
  }
  if (row.record_kind === "monthly_consumption") {
    const month = row.target_month ?? row.targetMonth;
    record.target_month = TEXT(monthStartDate(normalizeMonth(String(month), "target_month")));
    if (row.registered_version_id != null) {
      record.registered_version_id = TEXT(row.registered_version_id);
    }
  } else if (row.record_kind === "final_budget" && row.last_changed_version_id != null) {
    record.last_changed_version_id = TEXT(row.last_changed_version_id);
  }
  return record;
}

/** LIVE App3 レコード → pivotActualRows / createActualsMatrixModel 入力。 */
export function app3RecordsToActualRows(records) {
  if (!Array.isArray(records)) throw new TypeError("records must be an array");
  return records.map((record, index) => {
    const kind = v(record, "record_kind");
    const detailRowKey = v(record, "detail_row_key");
    const row = {
      stable_block_id: v(record, "stable_block_id"),
      cost_category_key: v(record, "cost_category_key"),
      record_kind: kind,
      amount: v(record, "amount"),
      detail_row_key: detailRowKey ?? "",
    };
    if (kind === "monthly_consumption") {
      row.target_month = v(record, "target_month");
    }
    if (!row.stable_block_id || !row.cost_category_key || !row.amount) {
      throw new TypeError(`records[${index}] missing required actual fields`);
    }
    return row;
  });
}

function existingActualByKey(existingRecords) {
  const map = new Map();
  for (const [index, record] of existingRecords.entries()) {
    const id = record?.$id?.value;
    const revision = record?.$revision?.value;
    const key = v(record, "actual_record_key");
    if (!id || !revision || !key) {
      throw new TypeError(
        `existingRecords[${index}] must carry $id, $revision and actual_record_key`,
      );
    }
    if (map.has(key)) {
      throw new RangeError(`existingRecords: duplicate actual_record_key ${key}`);
    }
    map.set(key, { id: String(id), revision: String(revision) });
  }
  return map;
}

function chunkRecordsRequest(method, appId, records) {
  const requests = [];
  for (let start = 0; start < records.length; start += RECORDS_PER_REQUEST) {
    const slice = records.slice(start, start + RECORDS_PER_REQUEST);
    requests.push({
      method,
      api: RECORDS_API_GET,
      payload: { app: appId, records: slice },
    });
  }
  return requests;
}

/**
 * 現行 project_id の App3 行を全件取得（offset ページング）。
 */
export async function fetchExistingActualRows(api, app3Id, projectId, options = {}) {
  if (typeof api !== "function") {
    throw new TypeError("api must be a kintone.api-compatible function");
  }
  const appId = assertAllowedAppId(app3Id, "fetchExistingActualRows.app3Id");
  const pid = requireText(projectId, "projectId");
  if (pid.includes('"')) throw new RangeError("projectId must not contain double quotes");
  const fields =
    options.fields === null
      ? undefined
      : options.fields ?? ["$id", "$revision", "actual_record_key", "project_id"];
  const all = [];
  for (let offset = 0; offset <= 1000; offset += FETCH_PAGE_SIZE) {
    const response = await api(RECORDS_API_GET, "GET", {
      app: appId,
      query: `project_id = "${pid}" order by $id asc limit ${FETCH_PAGE_SIZE} offset ${offset}`,
      ...(fields ? { fields } : {}),
    });
    const records = Array.isArray(response?.records) ? response.records : [];
    all.push(...records);
    if (records.length < FETCH_PAGE_SIZE) return all;
  }
  throw new RangeError(
    "fetchExistingActualRows: more than 1500 rows for one project_id — aborting",
  );
}

/**
 * planActualsSave へ渡す入力を作る。
 * parent の actual_write_seq を CAS インクリメントし、dirty な App3 行だけ
 * POST/PUT する（actual_record_key で突合）。
 */
export function buildActualsSaveInputs({
  app1Id,
  app3Id,
  parentRecordId,
  parentRevision,
  currentActualWriteSeq,
  keys,
  rows,
  existingRecords,
}) {
  const parentAppId = assertAllowedAppId(app1Id, "buildActualsSaveInputs.app1Id");
  const actualAppId = assertAllowedAppId(app3Id, "buildActualsSaveInputs.app3Id");
  if (!Array.isArray(rows)) throw new TypeError("rows must be an array");
  if (!Array.isArray(existingRecords)) {
    throw new TypeError("existingRecords must be an array");
  }
  if (parentRecordId === null || parentRecordId === undefined || parentRecordId === "") {
    throw new TypeError("parentRecordId is required");
  }
  const revision = String(parentRevision ?? "");
  if (revision === "") throw new TypeError("parentRevision is required (CAS)");
  const seqText = String(currentActualWriteSeq ?? "0");
  if (!/^\d+$/.test(seqText)) {
    throw new TypeError("currentActualWriteSeq must be a non-negative integer string");
  }
  const nextSeq = String(BigInt(seqText) + 1n);

  const existing = existingActualByKey(existingRecords);
  const seenKeys = new Set();
  const adds = [];
  const updates = [];
  for (const row of rows) {
    const record = app3RowToRecord(row, keys);
    const recordKey = record.actual_record_key.value;
    if (seenKeys.has(recordKey)) {
      throw new RangeError(`rows: duplicate actual_record_key ${recordKey}`);
    }
    seenKeys.add(recordKey);
    const found = existing.get(recordKey);
    if (found) {
      updates.push({ id: found.id, revision: found.revision, record });
    } else {
      adds.push(record);
    }
  }

  const actualWriteSeqPut = {
    method: "PUT",
    api: RECORD_API,
    payload: {
      app: parentAppId,
      id: String(parentRecordId),
      revision,
      record: { actual_write_seq: TEXT(nextSeq) },
    },
  };
  const actualWrites = [
    ...chunkRecordsRequest("POST", actualAppId, adds),
    ...chunkRecordsRequest("PUT", actualAppId, updates),
  ];
  return { actualWriteSeqPut, actualAppId, actualWrites, nextActualWriteSeq: nextSeq };
}

/** app.record.create.show: 初版キーを event.record に書き込む（純関数）。 */
export function seedApp1CreateRecord(record, { uuidFactory, versionType = "当初" } = {}) {
  if (!record || typeof record !== "object") {
    throw new TypeError("record must be an object");
  }
  if (typeof uuidFactory !== "function") {
    throw new TypeError("uuidFactory must be a function");
  }
  if (!["当初", "仕様変更", "価格変更", "仕様・価格変更", "その他"].includes(versionType)) {
    throw new RangeError(`unknown versionType ${JSON.stringify(versionType)}`);
  }
  // 再表示で二重 seed しない（既存キーを尊重）。
  const existingProjectId = v(record, "project_id");
  if (existingProjectId) {
    return Object.freeze({
      projectId: String(existingProjectId),
      budgetVersionId: String(v(record, "budget_version_id") || ""),
      versionType: String(v(record, "version_type") || versionType),
      alreadySeeded: true,
    });
  }
  const projectId = createProjectId(uuidFactory);
  const budgetVersionId = createBudgetVersionId(uuidFactory);
  // 必須フィールドを空にしないため仮の業務キーを置き、submit で正式値へ差し替える。
  const provisionalBusinessKey = projectBusinessKey("TMP", projectId.replace(/^prj-/, ""));
  // LIVE create.show の event.record は各フィールドに type 付き。value だけ書き換え、
  // type を落とすと「event.record['…'].type が不正」でカスタマイズが落ちる。
  const assign = (code, value) => {
    const text = value === null || value === undefined ? "" : String(value);
    const field = record[code];
    if (field && typeof field === "object") {
      field.value = text;
      return;
    }
    record[code] = { value: text };
  };
  assign("project_id", projectId);
  assign("budget_version_id", budgetVersionId);
  assign("version_seq", "1");
  assign("status", "下書き");
  assign("actual_write_seq", "0");
  assign("version_type", versionType);
  assign("derived_lock_state", "editable");
  assign("version_record_key", versionRecordKey(projectId, 1));
  assign("project_business_key", provisionalBusinessKey);
  assign(
    "series_guard_key",
    seriesGuardKey({ initial: true, projectBusinessKey: provisionalBusinessKey }),
  );
  return Object.freeze({ projectId, budgetVersionId, versionType, alreadySeeded: false });
}

/** create.submit: 入力された工事コードから business/guard キーを補完。 */
export function completeApp1CreateBusinessKeys(record) {
  const projectCode = v(record, "project_code");
  const branch = v(record, "project_branch") ?? "";
  const businessKey = projectBusinessKey(projectCode, branch);
  const assign = (code, value) => {
    const text = String(value);
    const field = record[code];
    if (field && typeof field === "object") {
      field.value = text;
      return;
    }
    record[code] = { value: text };
  };
  assign("project_business_key", businessKey);
  assign(
    "series_guard_key",
    seriesGuardKey({ initial: true, projectBusinessKey: businessKey }),
  );
  return businessKey;
}
