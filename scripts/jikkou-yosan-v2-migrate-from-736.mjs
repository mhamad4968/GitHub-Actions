/**
 * 736 → Ver.02 (756/757/758) データ移行 CLI。
 *
 * 既定 DRY-RUN: App 736 READ のみ。
 * --execute: JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1 必須 + --project-code 必須。
 *   App1 POST → App2 bulkRequest（planAtomicBudgetSave）。735/736 へは書かない。
 *
 * 正本: docs/plans/2026-07-22-jikkou-yosan-ver02-736-migration-plan.md
 */
import { randomUUID } from "node:crypto";

import { executePlan } from "./lib/jikkou-yosan-v2/executor.mjs";
import { compactUuidFactory } from "./lib/jikkou-yosan-v2/keys.mjs";
import {
  analyze736Record,
  SOURCE_APP_ID,
  summarize736Records,
} from "./lib/jikkou-yosan-v2/migrate-from-736-model.mjs";
import {
  buildMigrationPayload,
  migrationIdempotencyQuery,
} from "./lib/jikkou-yosan-v2/migrate-from-736-payload.mjs";
import {
  assertAllowedAppId,
  assertImplementationGo,
  fetchJson,
  FORBIDDEN_APP_IDS,
  getKintoneConfig,
  IMPLEMENTATION_GO_ENV,
  loadState,
  parseCliArgs,
} from "./lib/jikkou-yosan-v2/kintone.mjs";
import { planAtomicBudgetSave } from "./lib/jikkou-yosan-v2/planner.mjs";
import {
  buildDetailSaveInputs,
  fetchExistingDetailRows,
} from "./lib/jikkou-yosan-v2/save-model.mjs";

const DEFAULT_QUERY = "order by project_code asc, version_seq asc";
const DEFAULT_SAMPLE_LIMIT = 1;
const FETCH_FIELDS = [
  "$id",
  "project_code",
  "project_name",
  "project_official_name",
  "client_name",
  "version_seq",
  "version_type",
  "status",
  "source_record_id",
  "is_locked",
  "revision_note",
  "note",
  "start_date",
  "end_date",
  "site_entry_date",
  "draft_date",
  "girder_type",
  "order_branch",
  "department",
  "safety_rule_88",
  "person_in_charge",
  "spec_lines",
  "cost_lines",
  "mat_lines",
  "subcontract_lines",
  "contract_total_1",
  "cost_total_8",
  "profit_9",
  "ui_col_layout_json",
];

function parseExtendedArgs(argv) {
  const base = parseCliArgs(argv.filter((a) => a === "--execute" || a === "--dry-run"));
  let projectCode = null;
  let sampleLimit = DEFAULT_SAMPLE_LIMIT;
  let query = DEFAULT_QUERY;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--project-code" && argv[i + 1]) {
      projectCode = String(argv[++i]).trim();
    } else if (arg === "--sample-limit" && argv[i + 1]) {
      sampleLimit = Math.max(0, Number(argv[++i]) || DEFAULT_SAMPLE_LIMIT);
    } else if (arg === "--query" && argv[i + 1]) {
      query = String(argv[++i]);
    } else if (arg !== "--execute" && arg !== "--dry-run") {
      throw new Error(
        `Unknown argument: ${JSON.stringify(arg)} (allowed: --execute, --dry-run, --project-code, --sample-limit, --query)`,
      );
    }
  }

  return { ...base, projectCode, sampleLimit, query };
}

function assertTargetAppsReady(state) {
  const targets = {};
  for (const appKey of ["app1", "app2", "app3"]) {
    const entry = state.apps[appKey];
    if (entry.appId == null) {
      throw new Error(`Target ${appKey} appId is missing in state — run v2-create-apps first.`);
    }
    assertAllowedAppId(entry.appId, `migrate target ${appKey}`);
    if (entry.status !== "deployed") {
      throw new Error(
        `Target ${appKey} (appId=${entry.appId}) status=${entry.status}; expected deployed before migration.`,
      );
    }
    targets[appKey] = entry.appId;
  }
  return targets;
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

async function fetch736Records(ctx, { query, projectCode }) {
  const effectiveQuery = projectCode
    ? `project_code = "${projectCode.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}" order by version_seq asc`
    : query;

  const all = [];
  let offset = 0;
  const pageSize = 100;
  let totalCount = null;

  while (true) {
    const url = new URL(`${ctx.baseUrl}/k/v1/records.json`);
    url.searchParams.set("app", String(SOURCE_APP_ID));
    url.searchParams.set("query", `${effectiveQuery} limit ${pageSize} offset ${offset}`);
    url.searchParams.set("totalCount", "true");
    for (const [index, field] of FETCH_FIELDS.entries()) {
      url.searchParams.set(`fields[${index}]`, field);
    }

    const headers = { ...ctx.headers };
    delete headers["Content-Type"];
    const json = await fetchJson(ctx, url, { method: "GET", headers });
    if (totalCount == null && json.totalCount != null) totalCount = Number(json.totalCount);

    const batch = json.records || [];
    all.push(...batch);
    if (batch.length < pageSize) break;
    offset += batch.length;
    if (totalCount != null && offset >= totalCount) break;
  }

  return { records: all, totalCount: totalCount ?? all.length, query: effectiveQuery };
}

function buildDryRunReport({ mode, targets, fetchResult, sampleLimit }) {
  const summary = summarize736Records(fetchResult.records);
  const samples = fetchResult.records.slice(0, sampleLimit).map(analyze736Record);

  return {
    mode,
    forbiddenWriteAppIds: [...FORBIDDEN_APP_IDS],
    source: {
      appId: SOURCE_APP_ID,
      access: "read-only",
      totalCount: fetchResult.totalCount,
      fetchedCount: fetchResult.records.length,
      query: fetchResult.query,
    },
    targets,
    summary,
    samples,
  };
}

const MIGRATION_LOOKUP_FIELDS = Object.freeze([
  "$id",
  "$revision",
  "source_record_id",
  "project_code",
  "project_id",
  "project_business_key",
  "budget_version_id",
  "version_seq",
  "note",
]);

async function findExistingMigration(api, app1Id, sourceRecordId, hint = {}) {
  const byNote = await api("/k/v1/records.json", "GET", {
    app: app1Id,
    query: `${migrationIdempotencyQuery(sourceRecordId)} limit 1`,
    fields: [...MIGRATION_LOOKUP_FIELDS],
  });
  if (byNote.records?.[0]) return byNote.records[0];

  // UI 次版作成済みなど note タグ無しでも、同一工事＋版連番なら冪等スキップ。
  const businessKey = String(hint.projectBusinessKey || "").trim();
  const versionSeq = String(hint.versionSeq || "").trim();
  if (businessKey && versionSeq) {
    const escaped = businessKey.replace(/"/g, '\\"');
    const byKey = await api("/k/v1/records.json", "GET", {
      app: app1Id,
      query: `project_business_key = "${escaped}" and version_seq = "${versionSeq}" limit 1`,
      fields: [...MIGRATION_LOOKUP_FIELDS],
    });
    if (byKey.records?.[0]) return byKey.records[0];
  }

  // 736 $id が source_record_id に載っている場合（複製経路）も拾う。
  const bySource = await api("/k/v1/records.json", "GET", {
    app: app1Id,
    query: `source_record_id = "${sourceRecordId}" limit 2`,
    fields: [...MIGRATION_LOOKUP_FIELDS],
  });
  if (bySource.records?.length === 1) return bySource.records[0];
  return null;
}

async function saveApp2Rows({
  api,
  targets,
  parentRecordId,
  parentRevision,
  keys,
  app2Rows,
}) {
  if (!app2Rows.length) return 0;
  const existingRows = await fetchExistingDetailRows(
    api,
    targets.app2,
    keys.budgetVersionId,
  );
  const inputs = buildDetailSaveInputs({
    app1Id: targets.app1,
    app2Id: targets.app2,
    parentRecordId,
    parentRevision,
    keys,
    rows: app2Rows,
    existingRecords: existingRows,
  });
  const plan = planAtomicBudgetSave(inputs);
  const client = {
    bulkRequest: (requests) =>
      api("/k/v1/bulkRequest.json", "POST", { requests }),
  };
  const outcome = await executePlan(plan, client);
  return outcome.requestCount;
}

async function migrateOneVersion({
  api,
  targets,
  record,
  uuidFactory,
  projectId,
  newerVersionExists,
}) {
  const sourceId = String(record.$id?.value || "");
  // 先に payload 骨格だけ作り、冪等ヒント（businessKey / version_seq）を得る。
  // UUID は既存ヒット時に捨てるだけで副作用なし。
  const probe = buildMigrationPayload(record, {
    uuidFactory,
    projectId,
    newerVersionExists,
  });
  const existing = await findExistingMigration(api, targets.app1, sourceId, {
    projectBusinessKey: probe.projectBusinessKey,
    versionSeq: String(probe.versionSeq),
  });

  if (existing) {
    const budgetVersionId = String(existing.budget_version_id?.value || "");
    const existingRows = budgetVersionId
      ? await fetchExistingDetailRows(api, targets.app2, budgetVersionId)
      : [];
    if (existingRows.length > 0) {
      return {
        status: "skipped",
        reason: "already_migrated",
        sourceRecordId: sourceId,
        app1RecordId: existing.$id.value,
        projectId: String(existing.project_id?.value || ""),
        app2RowCount: existingRows.length,
      };
    }

    // App1 のみ作成済み（前回 App2 失敗）→ App2 だけ再開
    const payload = buildMigrationPayload(record, {
      uuidFactory,
      projectId: String(existing.project_id?.value || projectId || ""),
      newerVersionExists,
    });
    // 既存親のキーに合わせて App2 を紐付け（新規 bv は使わない）
    const keys = {
      projectId: String(existing.project_id.value),
      projectBusinessKey: String(existing.project_business_key.value),
      budgetVersionId: String(existing.budget_version_id.value),
    };
    assertAllowedAppId(targets.app1, "migrate app1");
    assertAllowedAppId(targets.app2, "migrate app2");
    const app2RequestCount = await saveApp2Rows({
      api,
      targets,
      parentRecordId: existing.$id.value,
      parentRevision: existing.$revision.value,
      keys,
      app2Rows: payload.app2Rows,
    });
    return {
      status: "resumed_app2",
      sourceRecordId: sourceId,
      app1RecordId: String(existing.$id.value),
      projectId: keys.projectId,
      budgetVersionId: keys.budgetVersionId,
      versionSeq: payload.versionSeq,
      counts: payload.counts,
      app2RequestCount,
      showUrl: `https://jbis-kintone.cybozu.com/k/${targets.app1}/show#record=${existing.$id.value}`,
    };
  }

  const payload = buildMigrationPayload(record, {
    uuidFactory,
    projectId,
    newerVersionExists,
  });

  assertAllowedAppId(targets.app1, "migrate app1");
  assertAllowedAppId(targets.app2, "migrate app2");

  const created = await api("/k/v1/record.json", "POST", {
    app: targets.app1,
    record: payload.app1Record,
  });

  const app2RequestCount = await saveApp2Rows({
    api,
    targets,
    parentRecordId: created.id,
    parentRevision: created.revision,
    keys: {
      projectId: payload.projectId,
      projectBusinessKey: payload.projectBusinessKey,
      budgetVersionId: payload.budgetVersionId,
    },
    app2Rows: payload.app2Rows,
  });

  return {
    status: "migrated",
    sourceRecordId: sourceId,
    app1RecordId: String(created.id),
    app1Revision: String(created.revision),
    projectId: payload.projectId,
    budgetVersionId: payload.budgetVersionId,
    versionSeq: payload.versionSeq,
    counts: payload.counts,
    app2RequestCount,
    showUrl: `https://jbis-kintone.cybozu.com/k/${targets.app1}/show#record=${created.id}`,
  };
}

async function runDryRun(ctx, options, state) {
  const targets = assertTargetAppsReady(state);
  const fetchResult = await fetch736Records(ctx, options);
  const report = buildDryRunReport({
    mode: "dry-run",
    targets,
    fetchResult,
    sampleLimit: options.sampleLimit,
  });

  console.log("DRY-RUN: App 736 read-only inventory + sample mapping (no writes).");
  console.log(`FORBIDDEN write app IDs: ${FORBIDDEN_APP_IDS.join(", ")}`);
  console.log(`Targets: App1=${targets.app1} App2=${targets.app2} App3=${targets.app3}`);
  console.log(JSON.stringify(report, null, 2));
}

async function runExecute(ctx, options, state) {
  assertImplementationGo();
  if (!options.projectCode) {
    throw new Error(
      "execute requires --project-code <code> (pilot one project at a time)",
    );
  }

  const targets = assertTargetAppsReady(state);
  const fetchResult = await fetch736Records(ctx, options);
  if (fetchResult.records.length === 0) {
    throw new Error(`No 736 records for project_code=${options.projectCode}`);
  }

  const api = nodeApiClient(ctx);
  const uuidFactory = compactUuidFactory(randomUUID);
  const maxSeq = Math.max(
    ...fetchResult.records.map((r) => Number(r.version_seq?.value) || 1),
  );

  console.log(`実装GO確認済み (${IMPLEMENTATION_GO_ENV}=1).`);
  console.log(
    `EXECUTE: migrate project_code=${options.projectCode} versions=${fetchResult.records.length} → App1=${targets.app1} App2=${targets.app2}`,
  );
  console.log(`FORBIDDEN: never write App ${FORBIDDEN_APP_IDS.join("/")}.`);

  const results = [];
  let sharedProjectId = null;
  for (const record of fetchResult.records) {
    const seq = Number(record.version_seq?.value) || 1;
    const newerVersionExists = seq < maxSeq;
    const result = await migrateOneVersion({
      api,
      targets,
      record,
      uuidFactory,
      projectId: sharedProjectId || undefined,
      newerVersionExists,
    });
    if (result.projectId) sharedProjectId = result.projectId;
    results.push(result);
    console.log(JSON.stringify(result));
  }

  const migrated = results.filter((r) => r.status === "migrated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  console.log(
    JSON.stringify(
      {
        mode: "execute",
        projectCode: options.projectCode,
        migrated,
        skipped,
        results,
      },
      null,
      2,
    ),
  );
}

async function main() {
  const options = parseExtendedArgs(process.argv.slice(2));
  const state = loadState();

  if (options.mode === "execute") {
    assertImplementationGo();
  }

  const ctx = getKintoneConfig();

  if (options.mode === "dry-run") {
    await runDryRun(ctx, options, state);
    return;
  }

  await runExecute(ctx, options, state);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
