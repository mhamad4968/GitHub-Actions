#!/usr/bin/env node
/**
 * 実行予算 Ver.02 Phase C-2b — テストレコード投入 + executor LIVE 検証。
 *
 * 1. App1 に「C-2b保存経路テスト」親レコードを 1 件作成（キー一式付き）。
 * 2. detail-block-model で 1 ブロック（明細2行）を組み、save-model → planner
 *    → executor の同一スタックで App2 行を原子保存（1回の bulkRequest）。
 * 3. 保存結果を読み戻して行数・block_total を検証する。
 *
 * 735/736 は guard で拒否。既定 DRY-RUN。--execute には
 * JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1 が必要。
 */
import { randomUUID } from "node:crypto";

import { createDetailBlockModel } from "./lib/jikkou-yosan-v2/detail-block-model.mjs";
import { executePlan } from "./lib/jikkou-yosan-v2/executor.mjs";
import {
  compactUuidFactory,
  createBudgetVersionId,
  createProjectId,
  projectBusinessKey,
  seriesGuardKey,
  versionRecordKey,
} from "./lib/jikkou-yosan-v2/keys.mjs";
import {
  assertImplementationGo,
  fetchJson,
  getKintoneConfig,
  loadState,
  parseCliArgs,
} from "./lib/jikkou-yosan-v2/kintone.mjs";
import { LOCK_STATES } from "./lib/jikkou-yosan-v2/lock.mjs";
import { planAtomicBudgetSave } from "./lib/jikkou-yosan-v2/planner.mjs";
import {
  buildDetailSaveInputs,
  fetchExistingDetailRows,
} from "./lib/jikkou-yosan-v2/save-model.mjs";

const TEXT = (value) => ({ value: String(value) });

function nodeApiClient(ctx) {
  // kintone.api 互換 (url, method, params) — executor/save-model 用の Node 実装。
  return async (api, method, params) => {
    if (method === "GET") {
      const url = new URL(`${ctx.baseUrl}${api}`);
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => url.searchParams.set(`${key}[${index}]`, String(item)));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
      const headers = { ...ctx.headers };
      delete headers["Content-Type"];
      return fetchJson(ctx, url, { method: "GET", headers });
    }
    return fetchJson(ctx, `${ctx.baseUrl}${api}`, {
      method,
      headers: ctx.headers,
      body: JSON.stringify(params),
    });
  };
}

// detail_record_key（bv|row 連結）の64文字上限に収める圧縮 UUID 発行器。
const compactRandomUuid = compactUuidFactory(randomUUID);

function buildKeys() {
  const projectCode = `TEST-C2B-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
  const projectId = createProjectId(compactRandomUuid);
  const budgetVersionId = createBudgetVersionId(compactRandomUuid);
  const businessKey = projectBusinessKey(projectCode, "");
  return {
    projectCode,
    projectId,
    budgetVersionId,
    projectBusinessKey: businessKey,
    seriesGuardKey: seriesGuardKey({ initial: true, projectBusinessKey: businessKey }),
    versionRecordKey: versionRecordKey(projectId, 1),
  };
}

function sampleDetailModel() {
  const model = createDetailBlockModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory: compactRandomUuid,
  });
  const blockId = model.addBlock();
  model.updateBlockHeader(blockId, {
    workTypeCode: "T01",
    workTypeName: "テスト工種",
    costCategory: "施工",
    vendorName: "C-2bテスト業者",
  });
  const firstRowKey = model.snapshot().blocks[0].detailRows[0].rowKey;
  model.updateDetailRow(blockId, firstRowKey, {
    name1: "テスト明細A",
    unit: "式",
    quantity: "1",
    unitPrice: "120000",
  });
  const secondRowKey = model.addDetailRow(blockId);
  model.updateDetailRow(blockId, secondRowKey, {
    name1: "テスト明細B",
    unit: "回",
    quantity: "3",
    unitPrice: "4500",
  });
  model.updateFooterAmount(blockId, "overhead", "10000");
  return model;
}

async function execute() {
  assertImplementationGo();
  const state = loadState();
  const app1 = state.apps.app1.appId;
  const app2 = state.apps.app2.appId;
  if (!app1 || !app2) throw new Error("App1/App2 IDs missing in state");
  const ctx = getKintoneConfig();
  const api = nodeApiClient(ctx);
  const keys = buildKeys();

  console.log(`[1/3] App1(${app1}) 親レコード作成: ${keys.projectCode}`);
  const created = await api("/k/v1/record.json", "POST", {
    app: app1,
    record: {
      project_id: TEXT(keys.projectId),
      project_business_key: TEXT(keys.projectBusinessKey),
      budget_version_id: TEXT(keys.budgetVersionId),
      series_guard_key: TEXT(keys.seriesGuardKey),
      version_record_key: TEXT(keys.versionRecordKey),
      version_seq: TEXT("1"),
      version_type: TEXT("当初"),
      status: TEXT("下書き"),
      derived_lock_state: TEXT("editable"),
      actual_write_seq: TEXT("0"),
      project_code: TEXT(keys.projectCode),
      project_name: TEXT("C-2b保存経路テスト工事"),
      client_name: TEXT("テスト発注者"),
      safety_rule_88: TEXT("無"),
    },
  });
  console.log(`  record id=${created.id} revision=${created.revision}`);

  console.log("[2/3] executor 経由の原子保存（App2 明細ブロック）");
  const model = sampleDetailModel();
  const existing = await fetchExistingDetailRows(api, app2, keys.budgetVersionId);
  const inputs = buildDetailSaveInputs({
    app1Id: app1,
    app2Id: app2,
    parentRecordId: created.id,
    parentRevision: created.revision,
    keys: {
      projectId: keys.projectId,
      projectBusinessKey: keys.projectBusinessKey,
      budgetVersionId: keys.budgetVersionId,
    },
    rows: model.toApp2Rows(),
    existingRecords: existing,
  });
  const plan = planAtomicBudgetSave(inputs);
  const client = { bulkRequest: (requests) => api("/k/v1/bulkRequest.json", "POST", { requests }) };
  const outcome = await executePlan(plan, client);
  console.log(`  bulkRequest OK: operation=${outcome.operation} requests=${outcome.requestCount}`);

  console.log("[3/3] 読み戻し検証");
  const saved = await fetchExistingDetailRows(api, app2, keys.budgetVersionId, { fields: null });
  const expectedRows = model.toApp2Rows().length;
  if (saved.length !== expectedRows) {
    throw new Error(`row count mismatch: saved=${saved.length} expected=${expectedRows}`);
  }
  const blockTotal = saved.find((record) => record.row_kind.value === "block_total");
  // 明細A 120000 + 明細B 13500 + 諸経費 10000 = 143500
  if (blockTotal.amount.value !== "143500") {
    throw new Error(`block_total mismatch: ${blockTotal.amount.value} (expected 143500)`);
  }
  const parent = await api("/k/v1/record.json", "GET", { app: app1, id: created.id });
  console.log(`  App2 rows=${saved.length} / block_total=143500 一致 / App1 revision=${parent.record.$revision.value}`);
  console.log(`検証成功: https://jbis-kintone.cybozu.com/k/${app1}/show#record=${created.id}`);
}

const { mode } = parseCliArgs(process.argv.slice(2));
if (mode === "execute") {
  await execute();
} else {
  const state = loadState();
  console.log("DRY-RUN: ネットワークアクセスなし。実行内容:");
  console.log(`- App1(${state.apps.app1.appId}) にテスト親レコード1件を作成`);
  console.log(`- App2(${state.apps.app2.appId}) に 1ブロック（header+明細2+footer5 = 8行）を executor 経由で原子保存`);
  console.log("- 読み戻して行数と block_total(143500) を検証");
}
