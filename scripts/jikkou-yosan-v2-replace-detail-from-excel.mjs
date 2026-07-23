/**
 * Excel 内訳 → 既存 Ver.02 予算版の App2 差し替え CLI。
 *
 * 既定 DRY-RUN（パース＋計画のみ。ネットワークは親特定時のみ）。
 * --execute には JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1 が必要。
 *
 * 既定対象: project_code=2623001 / 最新の status=下書き 版。
 * ハードリプレース（新 stable_block_id / row_key）→ 既存 App2 全 DELETE + 新規 POST。
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createDetailBlockModel } from "./lib/jikkou-yosan-v2/detail-block-model.mjs";
import { executePlan } from "./lib/jikkou-yosan-v2/executor.mjs";
import { compactUuidFactory } from "./lib/jikkou-yosan-v2/keys.mjs";
import {
  assertImplementationGo,
  fetchJson,
  getKintoneConfig,
  IMPLEMENTATION_GO_ENV,
  loadState,
  parseCliArgs,
} from "./lib/jikkou-yosan-v2/kintone.mjs";
import { LOCK_STATES } from "./lib/jikkou-yosan-v2/lock.mjs";
import {
  excelBlocksToModelBlocks,
  parseExcelUchiwake,
} from "./lib/jikkou-yosan-v2/parse-excel-uchiwake.mjs";
import { planAtomicBudgetSave } from "./lib/jikkou-yosan-v2/planner.mjs";
import {
  buildDetailSaveInputs,
  fetchExistingDetailRows,
} from "./lib/jikkou-yosan-v2/save-model.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Prefer ASCII scan copy (same workbook as 実行予算ver2 原本). Japanese path
// can fail under some Node/xlsx encodings on Windows.
const DEFAULT_XLSX = [
  "C:/tmp/jikkou-ver2-scan.xlsx",
  path.join("C:/tmp/実行予算ver2", "工事予算（実行予算）(案) (1).xlsx"),
];
const INVENTORY = path.join(
  ROOT,
  "docs/plans/2026-07-20-jikkou-yosan-ver02-block-inventory.json",
);

function resolveXlsx(cliPath) {
  if (cliPath) {
    if (!fs.existsSync(cliPath)) throw new Error(`Excel not found: ${cliPath}`);
    return cliPath;
  }
  for (const p of DEFAULT_XLSX) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Excel not found (pass --xlsx <path>)");
}

function parseArgs(argv) {
  const { mode } = parseCliArgs(argv.filter((a) => a === "--execute" || a === "--dry-run"));
  let projectCode = "2623001";
  let budgetVersionId = null;
  let xlsx = null;
  let parentRecordId = null;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--project-code") projectCode = String(argv[++i] || "").trim();
    else if (a === "--budget-version-id") budgetVersionId = String(argv[++i] || "").trim();
    else if (a === "--xlsx") xlsx = String(argv[++i] || "").trim();
    else if (a === "--parent-id") parentRecordId = String(argv[++i] || "").trim();
  }
  return { mode, projectCode, budgetVersionId, xlsx, parentRecordId };
}

function nodeApiClient(ctx) {
  return async (api, method, params) => {
    if (method === "GET") {
      const url = new URL(`${ctx.baseUrl}${api}`);
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          value.forEach((item, index) =>
            url.searchParams.set(`${key}[${index}]`, String(item)),
          );
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

async function findParent(api, { projectCode, budgetVersionId, parentRecordId }) {
  if (parentRecordId) {
    const res = await api("/k/v1/record.json", "GET", { app: 756, id: parentRecordId });
    return res.record;
  }
  if (budgetVersionId) {
    const res = await api("/k/v1/records.json", "GET", {
      app: 756,
      query: `budget_version_id = "${budgetVersionId}" limit 1`,
      fields: [
        "$id",
        "$revision",
        "project_code",
        "project_id",
        "project_business_key",
        "budget_version_id",
        "version_seq",
        "status",
        "derived_lock_state",
        "project_name",
      ],
    });
    if (!res.records?.length) throw new Error(`No App1 for budget_version_id=${budgetVersionId}`);
    return res.records[0];
  }
  const res = await api("/k/v1/records.json", "GET", {
    app: 756,
    query: `project_code = "${projectCode}" order by version_seq desc limit 20`,
    fields: [
      "$id",
      "$revision",
      "project_code",
      "project_id",
      "project_business_key",
      "budget_version_id",
      "version_seq",
      "status",
      "derived_lock_state",
      "project_name",
    ],
  });
  const records = res.records || [];
  if (!records.length) throw new Error(`No App1 for project_code=${projectCode}`);
  const draft = records.find((r) => r.status?.value === "下書き");
  if (draft) return draft;
  return records[0];
}

function buildModel(parsed) {
  const uuidFactory = compactUuidFactory(randomUUID);
  return createDetailBlockModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory,
    blocks: excelBlocksToModelBlocks(parsed.blocks),
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const xlsxPath = resolveXlsx(args.xlsx);
  const parsed = parseExcelUchiwake(xlsxPath, { inventoryPath: INVENTORY });
  const model = buildModel(parsed);
  const app2Rows = model.toApp2Rows();

  console.log("[parse]", JSON.stringify(parsed.meta, null, 2));
  console.log(`[parse] warnings=${parsed.warnings.length}`);
  for (const w of parsed.warnings.slice(0, 20)) console.log("  -", w);
  if (parsed.warnings.length > 20) console.log(`  ... +${parsed.warnings.length - 20} more`);
  console.log(`[model] blocks=${model.snapshot().blocks.length} app2Rows=${app2Rows.length}`);
  console.log(
    "[sample blocks]",
    parsed.blocks.slice(0, 3).map((b) => ({
      no: b.excelNo,
      code: b.workTypeCode,
      name: b.workTypeName,
      cat: b.costCategory,
      details: b.detailRows.length,
      overhead: b.overhead,
    })),
  );

  if (args.mode !== "execute") {
    console.log("\nDRY-RUN: 親特定のためネットワーク READ のみ（書込みなし）。");
  } else {
    assertImplementationGo();
  }

  const ctx = getKintoneConfig();
  const api = nodeApiClient(ctx);
  const state = loadState();
  const app1 = Number(state.apps.app1.appId);
  const app2 = Number(state.apps.app2.appId);

  const parent = await findParent(api, args);
  const parentId = parent.$id.value;
  const parentRev = parent.$revision.value;
  const keys = {
    projectId: parent.project_id.value,
    projectBusinessKey: parent.project_business_key.value,
    budgetVersionId: parent.budget_version_id.value,
  };
  console.log(
    "[target]",
    JSON.stringify(
      {
        parentId,
        parentRev,
        code: parent.project_code?.value,
        name: parent.project_name?.value,
        seq: parent.version_seq?.value,
        status: parent.status?.value,
        lock: parent.derived_lock_state?.value,
        bv: keys.budgetVersionId,
      },
      null,
      2,
    ),
  );

  if (parent.status?.value === "版確定") {
    throw new Error("対象版が版確定です。下書き版を指定するか、版を開いてから実行してください。");
  }

  const existing = await fetchExistingDetailRows(api, app2, keys.budgetVersionId);
  console.log(`[existing] App2 rows=${existing.length}`);

  const inputs = buildDetailSaveInputs({
    app1Id: app1,
    app2Id: app2,
    parentRecordId: parentId,
    parentRevision: parentRev,
    keys,
    rows: app2Rows,
    existingRecords: existing,
  });
  const plan = planAtomicBudgetSave(inputs);
  console.log(
    "[plan]",
    JSON.stringify(
      {
        adds: inputs.detailAdds.length,
        updates: inputs.detailUpdates.length,
        deletes: inputs.detailDeletes.length,
        requestCount: plan.requestCount,
      },
      null,
      2,
    ),
  );

  if (args.mode !== "execute") {
    console.log(
      `\n再実行（書込み）:\n  set ${IMPLEMENTATION_GO_ENV}=1\n  npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-replace-detail-from-excel.mjs --execute --budget-version-id ${keys.budgetVersionId}`,
    );
    return;
  }

  const client = {
    bulkRequest: (requests) => api("/k/v1/bulkRequest.json", "POST", { requests }),
  };
  const outcome = await executePlan(plan, client);
  const saved = await fetchExistingDetailRows(api, app2, keys.budgetVersionId);
  console.log(
    `[execute] OK operation=${outcome.operation} requests=${outcome.requestCount} savedRows=${saved.length} expected=${app2Rows.length}`,
  );
  if (saved.length !== app2Rows.length) {
    throw new Error(`row count mismatch: saved=${saved.length} expected=${app2Rows.length}`);
  }
  console.log(
    `差し替え完了: https://jbis-kintone.cybozu.com/k/${app1}/show#record=${parentId}`,
  );
}

await main();
