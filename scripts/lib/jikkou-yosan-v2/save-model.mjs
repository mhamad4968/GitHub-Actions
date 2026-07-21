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
import { assertAllowedAppId } from "./guard.mjs";
import { detailRecordKey } from "./keys.mjs";

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
  const contractLines = rows("contract_lines").map((row) => ({
    rowKey: cell(row, "contract_row_key"),
    section: cell(row, "contract_section"),
    workName: cell(row, "contract_work_name"),
    unit: cell(row, "contract_unit"),
    quantity: cell(row, "contract_qty"),
    unitPrice: cell(row, "contract_unit_price"),
    note: cell(row, "contract_note"),
  }));
  const salaryLines = rows("salary_lines").map((row) => ({
    rowKey: cell(row, "salary_row_key"),
    role: cell(row, "salary_role"),
    unit: cell(row, "salary_unit"),
    quantity: cell(row, "salary_qty"),
    unitPrice: cell(row, "salary_unit_price"),
    note: cell(row, "salary_note"),
  }));
  return { contractLines, salaryLines };
}

const FOOTER_KINDS = ["overhead", "insurance", "subtotal", "legal_welfare", "block_total"];
const MANUAL_FOOTER_CAMEL = { overhead: "overhead", insurance: "insurance", legal_welfare: "legalWelfare" };

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
