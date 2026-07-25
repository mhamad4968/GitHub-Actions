/**
 * 実行予算 Ver.02 残B — 版複製（planVersionCopy）の入力生成レイヤ。
 *
 * versionModel.planNextVersionDraft(...)（純関数・送信なし）の計画と、
 * LIVE から読んだ旧親レコード・旧 App2 行から、planVersionCopy に渡す
 * { oldParentLock, newParentCreate, detailAppId, newDetailRecords,
 *   oldDetailLockUpdates } を作る。ネットワークには触れない。
 *
 * - 旧親 PUT は record:{} の CAS のみ（ロックは P-38 のとおり「新しい版の
 *   存在」から導出されるため、旧親のフィールドは変更しない）。
 * - 新親 POST はホワイトリスト複写 + 新キー（P-24）+ 下書き/editable。
 * - 新内訳行は row_key を保持したまま budget_version_id / detail_record_key
 *   だけ差し替え、parent_lock_snapshot=editable で複製。
 * - 旧内訳行は parent_lock_snapshot=locked の PUT（revision CAS 付き）。
 * - 実績（App3）はいっさい複製しない（P-28/V3b）。
 */
import { assertAllowedAppId } from "./guard.mjs";
import { detailRecordKey } from "./keys.mjs";
import { VERSION_STATUS_DRAFT, VERSION_TYPES } from "./version-series-model.mjs";

const VC_RECORD_API = "/k/v1/record.json";

const vcText = (value) => ({ value: value === null || value === undefined ? "" : String(value) });

/** 新親へ複写する App1 フィールド（キー・状態系は除外し新値で上書き）。 */
export const APP1_COPY_FIELDS = Object.freeze([
  "project_id",
  "project_business_key",
  "project_code",
  "project_branch",
  "client_name",
  "project_official_name",
  "project_name",
  "start_date",
  "end_date",
  "project_days",
  "site_entry_date",
  "draft_date",
  "girder_type",
  "order_branch",
  "department",
  "safety_rule_88",
  "person_in_charge",
  "created_by_name",
  "person_in_charge_name",
  "note",
  "contract_lines",
  "salary_lines",
  "summary_cost_lines",
  "contract_construction_total",
  "contract_safety_total",
  "contract_total_1",
  "cost_construction_total",
  "cost_safety_total",
  "salary_total",
  "cost_total_8",
  "profit_9",
  "contract_construction_rate_to_1",
  "contract_safety_rate_to_1",
  "cost_construction_rate_to_1",
  "cost_safety_rate_to_1",
  "salary_total_rate_to_1",
  "cost_total_8_rate_to_1",
  "profit_9_rate_to_1",
  "summary_projection_status",
  "summary_projection_checked_at",
  "ui_col_layout_json",
]);

/** App2 の複製時にそのまま写す行フィールド（キー3種と状態系は個別処理）。 */
const APP2_COPY_FIELDS = Object.freeze([
  "project_id",
  "project_business_key",
  "stable_block_id",
  "row_key",
  "row_kind",
  "block_no",
  "block_sort_order",
  "row_sort_order",
  "block_status",
  "retired_at_version_id",
  "cost_category_key",
  "work_type_code",
  "work_type_name",
  "vendor_name",
  "name_1",
  "name_2",
  "name_3",
  "name_spec_group",
  "unit",
  "quantity",
  "unit_price",
  "amount",
  "note",
  "calc_basis",
]);

function vcFieldValue(record, code) {
  const field = record?.[code];
  return field && typeof field === "object" && "value" in field ? field.value : field;
}

function copySubtableValue(field) {
  // 新レコード POST では行 id を含めない（含めると既存行参照になり失敗する）。
  return { value: (field?.value ?? []).map((row) => ({ value: row.value })) };
}

export function buildVersionCopyInputs({
  app1Id,
  app2Id,
  plan,
  versionType = "仕様変更",
  oldParent,
  oldDetailRecords,
}) {
  const parentAppId = assertAllowedAppId(app1Id, "buildVersionCopyInputs.app1Id");
  const detailAppId = assertAllowedAppId(app2Id, "buildVersionCopyInputs.app2Id");
  if (!plan || plan.operation !== "next_version_draft") {
    throw new TypeError("plan must be versionModel.planNextVersionDraft(...) output");
  }
  if (!VERSION_TYPES.includes(versionType)) {
    throw new RangeError(`unknown versionType ${JSON.stringify(versionType)}`);
  }
  if (!oldParent || !oldParent.id || !oldParent.revision || !oldParent.record) {
    throw new TypeError("oldParent requires id, revision and record");
  }
  if (!Array.isArray(oldDetailRecords)) {
    throw new TypeError("oldDetailRecords must be an array");
  }
  if (oldDetailRecords.length !== plan.detailRowCount) {
    throw new RangeError(
      `oldDetailRecords length ${oldDetailRecords.length} != plan.detailRowCount ${plan.detailRowCount}`,
    );
  }

  const newParentRecord = {};
  for (const code of APP1_COPY_FIELDS) {
    const field = oldParent.record[code];
    if (!field || !("value" in field)) continue;
    newParentRecord[code] =
      code === "contract_lines" || code === "salary_lines" || code === "summary_cost_lines"
        ? copySubtableValue(field)
        : { value: field.value };
  }
  newParentRecord.budget_version_id = vcText(plan.budgetVersionId);
  newParentRecord.series_guard_key = vcText(plan.seriesGuardKey);
  newParentRecord.version_record_key = vcText(plan.versionRecordKey);
  newParentRecord.version_seq = vcText(plan.versionSeq);
  newParentRecord.version_type = vcText(versionType);
  newParentRecord.status = vcText(VERSION_STATUS_DRAFT);
  newParentRecord.derived_lock_state = vcText("editable");
  newParentRecord.actual_write_seq = vcText("0");
  newParentRecord.source_record_id = vcText(oldParent.id);

  const newDetailRecords = [];
  const oldDetailLockUpdates = [];
  for (const [index, record] of oldDetailRecords.entries()) {
    const id = vcFieldValue(record, "$id");
    const revision = vcFieldValue(record, "$revision");
    const rowKey = vcFieldValue(record, "row_key");
    if (!id || !revision || !rowKey) {
      throw new TypeError(`oldDetailRecords[${index}] must carry $id, $revision and row_key`);
    }
    const recordKey = detailRecordKey(plan.budgetVersionId, String(rowKey));
    if (recordKey.length > 64) {
      throw new RangeError(
        `detail_record_key exceeds 64 chars for row ${rowKey} — use compact ids`,
      );
    }
    const copied = {
      detail_record_key: vcText(recordKey),
      budget_version_id: vcText(plan.budgetVersionId),
      parent_lock_snapshot: vcText("editable"),
      write_channel: vcText("app1_custom_ui"),
    };
    for (const code of APP2_COPY_FIELDS) {
      const field = record[code];
      if (field && typeof field === "object" && "value" in field) {
        copied[code] = { value: field.value };
      }
    }
    newDetailRecords.push(copied);
    oldDetailLockUpdates.push({
      id: String(id),
      revision: String(revision),
      record: { parent_lock_snapshot: { value: "locked" } },
    });
  }

  return {
    oldParentLock: {
      method: "PUT",
      api: VC_RECORD_API,
      payload: {
        app: parentAppId,
        id: String(oldParent.id),
        revision: String(oldParent.revision),
        record: {},
      },
    },
    newParentCreate: {
      method: "POST",
      api: VC_RECORD_API,
      payload: { app: parentAppId, record: newParentRecord },
    },
    detailAppId,
    newDetailRecords,
    oldDetailLockUpdates,
  };
}
