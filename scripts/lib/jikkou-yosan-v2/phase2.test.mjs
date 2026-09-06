import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACL_DEFERRED_NOTE,
  CUSTOMIZATION_STATUSES,
  EVERYONE_READ_ONLY_RIGHTS,
  IMPLEMENTATION_GO_ENV,
  LIVE_NOT_READY_NOTE,
  SHELL_ONLY_NOTE,
  STATE_STATUSES,
  APP1_NAME,
  APP2_NAME,
  APP3_NAME,
  APP_DEFS,
  APP_ORDER,
  FORBIDDEN_APP_IDS,
  SPACE_ID,
  THREAD_ID,
  applyAppAcl,
  applyAppSettings,
  applyFormFields,
  applyMissingFormFields,
  assertAllowedAppId,
  assertImplementationGo,
  buildAppAclPayload,
  buildDryRunPlan,
  createApp,
  deployAppAndWait,
  fieldCounts,
  findAppByName,
  getPreviewFormFields,
  loadFieldFile,
  loadState,
  pickMissingProperties,
  markCreated,
  markCustomizationDeployed,
  markCustomizationError,
  markDeployed,
  markError,
  parseCliArgs,
  reconcileExistingApp,
  saveState,
  validateAllFieldFiles,
  validateProperties,
  verifyPreviewApp,
} from "./kintone.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, "..", "..", "jikkou-yosan-v2-create-apps.mjs");
const BACKFILL_STUB_PATH = path.join(__dirname, "..", "..", "jikkou-yosan-v2-backfill.mjs");
const PACKAGE_JSON_PATH = path.join(__dirname, "..", "..", "..", "package.json");

const COMMON_UNITS = [
  "式",
  "橋",
  "回",
  "泊",
  "箇月",
  "日",
  "缶",
  "枚",
  "人",
  "着",
  "台",
  "％",
  "m2",
  "掛m2",
  "m3",
  "ｍ",
  "㎞",
  "㎏",
  "－",
];
const DETAIL_UNITS = [...COMMON_UNITS];

function optionKeysInIndexOrder(field) {
  return Object.values(field.options)
    .sort((a, b) => Number(a.index) - Number(b.index))
    .map((o) => o.label);
}

function collectCodes(properties) {
  const codes = [];
  for (const [key, field] of Object.entries(properties)) {
    codes.push(key);
    if (field.type === "SUBTABLE") codes.push(...Object.keys(field.fields));
  }
  return codes;
}

// ---------------------------------------------------------------------------
// Static field JSON legality
// ---------------------------------------------------------------------------

test("all three field files pass strict static validation", () => {
  const validated = validateAllFieldFiles();
  for (const appKey of APP_ORDER) {
    assert.ok(validated[appKey].counts.total > 0, `${appKey} has fields`);
  }
});

test("validator rejects property key !== code", () => {
  assert.throws(
    () =>
      validateProperties("t", {
        a: { type: "SINGLE_LINE_TEXT", code: "b", label: "x", defaultValue: "" },
      }),
    /property key must equal code/,
  );
});

test("validator rejects unique on unsupported types and inside subtables", () => {
  assert.throws(
    () =>
      validateProperties("t", {
        dd: {
          type: "DROP_DOWN",
          code: "dd",
          label: "x",
          unique: true,
          options: { a: { label: "a", index: "0" } },
          defaultValue: "",
        },
      }),
    /unique is not supported on type DROP_DOWN/,
  );
  assert.throws(
    () =>
      validateProperties("t", {
        tbl: {
          type: "SUBTABLE",
          code: "tbl",
          label: "x",
          fields: {
            child: {
              type: "SINGLE_LINE_TEXT",
              code: "child",
              label: "x",
              unique: true,
              defaultValue: "",
            },
          },
        },
      }),
    /unique is not supported inside a SUBTABLE/,
  );
});

test("validator requires a non-empty SUBTABLE label (live CB_VA01 regression)", () => {
  const subtableWithLabel = (label) => ({
    tbl: {
      type: "SUBTABLE",
      code: "tbl",
      ...(label === undefined ? {} : { label }),
      fields: {
        child: { type: "SINGLE_LINE_TEXT", code: "child", label: "x", defaultValue: "" },
      },
    },
  });
  assert.throws(
    () => validateProperties("t", subtableWithLabel(undefined)),
    /SUBTABLE label must be a non-empty string/,
  );
  assert.throws(
    () => validateProperties("t", subtableWithLabel("")),
    /SUBTABLE label must be a non-empty string/,
  );
  assert.throws(
    () => validateProperties("t", subtableWithLabel("   ")),
    /SUBTABLE label must be a non-empty string/,
  );
  // Non-empty label passes.
  validateProperties("t", subtableWithLabel("請負明細"));
});

test("app1: all three subtables carry catalog-aligned Japanese labels", () => {
  const p = loadFieldFile("app1");
  assert.equal(p.contract_lines.label, "請負明細");
  assert.equal(p.salary_lines.label, "給与手当");
  assert.equal(p.summary_cost_lines.label, "総括原価投影");
});

test("validator rejects non-boolean required/unique and non-string option index", () => {
  assert.throws(
    () =>
      validateProperties("t", {
        a: { type: "SINGLE_LINE_TEXT", code: "a", label: "x", required: "true", defaultValue: "" },
      }),
    /required must be a boolean/,
  );
  assert.throws(
    () =>
      validateProperties("t", {
        dd: {
          type: "DROP_DOWN",
          code: "dd",
          label: "x",
          options: { a: { label: "a", index: 0 } },
          defaultValue: "",
        },
      }),
    /index must be a string integer/,
  );
});

test("validator rejects duplicate codes including subtable children", () => {
  assert.throws(
    () =>
      validateProperties("t", {
        dup: { type: "SINGLE_LINE_TEXT", code: "dup", label: "x", defaultValue: "" },
        tbl: {
          type: "SUBTABLE",
          code: "tbl",
          label: "x",
          fields: {
            dup: { type: "SINGLE_LINE_TEXT", code: "dup", label: "x", defaultValue: "" },
          },
        },
      }),
    /duplicate field code: dup/,
  );
});

test("validator rejects defaults outside options and wrong default value shapes", () => {
  assert.throws(
    () =>
      validateProperties("t", {
        dd: {
          type: "DROP_DOWN",
          code: "dd",
          label: "x",
          options: { a: { label: "a", index: "0" } },
          defaultValue: "b",
        },
      }),
    /not in options/,
  );
  assert.throws(
    () =>
      validateProperties("t", {
        n: { type: "NUMBER", code: "n", label: "x", defaultValue: 0 },
      }),
    /NUMBER defaultValue must be a string/,
  );
  assert.throws(
    () =>
      validateProperties("t", {
        cb: {
          type: "CHECK_BOX",
          code: "cb",
          label: "x",
          options: { a: { label: "a", index: "0" } },
          defaultValue: "a",
        },
      }),
    /CHECK_BOX defaultValue must be an array/,
  );
});

// ---------------------------------------------------------------------------
// Catalog-specific requirements (§1〜§3, A1〜A5)
// ---------------------------------------------------------------------------

test("app1: system keys, uniqueness, and required flags match the catalog", () => {
  const p = loadFieldFile("app1");
  const uniqueCodes = Object.values(p)
    .filter((f) => f.unique === true)
    .map((f) => f.code)
    .sort();
  assert.deepEqual(uniqueCodes, [
    "budget_version_id",
    "series_guard_key",
    "version_record_key",
  ]);
  for (const code of [
    "project_id",
    "project_business_key",
    "budget_version_id",
    "series_guard_key",
    "version_record_key",
    "version_seq",
    "version_type",
    "status",
    "derived_lock_state",
    "actual_write_seq",
    "project_code",
    "safety_rule_88",
  ]) {
    assert.equal(p[code].required, true, `${code} must be required`);
  }
  for (const code of ["source_record_id", "is_locked", "revision_note", "project_branch"]) {
    assert.equal(p[code].required ?? false, false, `${code} must be optional`);
  }
  assert.equal(p.actual_write_seq.defaultValue, "0");
});

test("app1: version_type has exactly the five 736-compatible options", () => {
  const p = loadFieldFile("app1");
  assert.deepEqual(optionKeysInIndexOrder(p.version_type), [
    "当初",
    "仕様変更",
    "価格変更",
    "仕様・価格変更",
    "その他",
  ]);
  assert.deepEqual(optionKeysInIndexOrder(p.status), ["下書き", "版確定"]);
  assert.equal(p.status.defaultValue, "下書き");
  assert.deepEqual(optionKeysInIndexOrder(p.derived_lock_state), [
    "editable",
    "budget_locked",
    "full_locked",
  ]);
});

test("app1: safety_rule_88 is a required radio defaulting to 有", () => {
  const p = loadFieldFile("app1");
  assert.equal(p.safety_rule_88.type, "RADIO_BUTTON");
  assert.equal(p.safety_rule_88.required, true);
  assert.equal(p.safety_rule_88.defaultValue, "有");
  assert.deepEqual(optionKeysInIndexOrder(p.safety_rule_88), ["有", "無"]);
});

test("app1: subtable unit dropdowns use the common unit list (A2)", () => {
  const p = loadFieldFile("app1");
  const contractUnit = p.contract_lines.fields.contract_unit;
  const salaryUnit = p.salary_lines.fields.salary_unit;
  const summaryUnit = p.summary_cost_lines.fields.summary_unit;
  assert.deepEqual(optionKeysInIndexOrder(contractUnit), COMMON_UNITS);
  assert.deepEqual(optionKeysInIndexOrder(salaryUnit), COMMON_UNITS);
  assert.equal(salaryUnit.defaultValue, "箇月");
  assert.equal(summaryUnit.type, "DROP_DOWN");
  assert.deepEqual(optionKeysInIndexOrder(summaryUnit), COMMON_UNITS);
});

test("app1: tax rate options use fullwidth ％ and default 10％ (A5)", () => {
  const p = loadFieldFile("app1");
  const tax = p.summary_cost_lines.fields.summary_tax_rate;
  assert.deepEqual(optionKeysInIndexOrder(tax), ["0％", "8％", "10％"]);
  assert.equal(tax.defaultValue, "10％");
});

test("app1: aggregate and rate-to-1 cache fields exist with locked codes (A1)", () => {
  const p = loadFieldFile("app1");
  const numberCodes = [
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
  ];
  for (const code of numberCodes) {
    assert.equal(p[code]?.type, "NUMBER", `${code} must exist as NUMBER`);
  }
  assert.deepEqual(optionKeysInIndexOrder(p.summary_projection_status), [
    "synced",
    "dirty",
    "error",
  ]);
  assert.equal(p.summary_projection_checked_at.type, "DATETIME");
  assert.equal(p.ui_col_layout_json.type, "MULTI_LINE_TEXT");
  assert.equal(p.summary_total_notes.type, "MULTI_LINE_TEXT");
});

test("app1: subtable row keys and sort orders exist per catalog", () => {
  const p = loadFieldFile("app1");
  assert.equal(p.contract_lines.fields.contract_row_key.type, "SINGLE_LINE_TEXT");
  assert.equal(p.salary_lines.fields.salary_row_key.type, "SINGLE_LINE_TEXT");
  assert.equal(p.summary_cost_lines.fields.summary_stable_block_id.type, "SINGLE_LINE_TEXT");
  assert.deepEqual(optionKeysInIndexOrder(p.contract_lines.fields.contract_section), [
    "施工",
    "保安",
  ]);
  assert.deepEqual(
    optionKeysInIndexOrder(p.summary_cost_lines.fields.summary_cost_category),
    ["施工", "保安"],
  );
  for (const code of ["contract_sort_order", "contract_amount", "contract_rate_to_1"]) {
    assert.equal(p.contract_lines.fields[code].type, "NUMBER");
  }
});

test("app2: catalog fields, options, and A4 write_channel are exact", () => {
  const p = loadFieldFile("app2");
  assert.equal(p.detail_record_key.unique, true);
  assert.equal(p.detail_record_key.required, true);
  assert.deepEqual(optionKeysInIndexOrder(p.row_kind), [
    "block_header",
    "detail",
    "overhead",
    "insurance",
    "subtotal",
    "legal_welfare",
    "block_total",
  ]);
  assert.deepEqual(optionKeysInIndexOrder(p.block_status), ["active", "retired"]);
  assert.equal(p.block_status.defaultValue, "active");
  assert.deepEqual(optionKeysInIndexOrder(p.unit), DETAIL_UNITS);
  assert.deepEqual(optionKeysInIndexOrder(p.cost_category_key), ["施工", "保安"]);
  assert.deepEqual(optionKeysInIndexOrder(p.parent_lock_snapshot), ["editable", "locked"]);
  assert.equal(p.parent_lock_snapshot.required, true);
  assert.deepEqual(optionKeysInIndexOrder(p.write_channel), ["app1_custom_ui"]);
  assert.equal(p.write_channel.defaultValue, "app1_custom_ui");
  assert.equal(p.write_channel.required, true);
  for (const code of [
    "project_id",
    "project_business_key",
    "budget_version_id",
    "stable_block_id",
    "row_key",
    "row_kind",
    "block_no",
    "block_sort_order",
    "row_sort_order",
    "block_status",
  ]) {
    assert.equal(p[code].required, true, `${code} must be required`);
  }
  for (const code of [
    "name_1",
    "name_2",
    "name_3",
    "name_detail",
    "name_item",
    "line_vendor_name",
    "line_person_name",
    "name_spec_group",
    "vendor_name",
    "retired_at_version_id",
  ]) {
    assert.equal(p[code].required ?? false, false, `${code} must be optional`);
  }
});

test("app3: catalog fields, source_kind 手入力 initial (A4), and unique key are exact", () => {
  const p = loadFieldFile("app3");
  assert.equal(p.actual_record_key.unique, true);
  assert.equal(p.actual_record_key.required, true);
  assert.deepEqual(optionKeysInIndexOrder(p.record_kind), [
    "monthly_consumption",
    "final_budget",
  ]);
  assert.deepEqual(optionKeysInIndexOrder(p.cost_category_key), ["施工", "保安"]);
  assert.deepEqual(optionKeysInIndexOrder(p.source_kind), ["手入力"]);
  assert.equal(p.source_kind.defaultValue, "手入力");
  assert.equal(p.source_kind.required, true);
  assert.deepEqual(optionKeysInIndexOrder(p.write_channel), ["app1_custom_ui"]);
  assert.equal(p.write_channel.defaultValue, "app1_custom_ui");
  assert.equal(p.target_month.type, "DATE");
  assert.equal(p.amount.required, true);
  // 月別/最終の条件必須（registered/last_changed）は保存ロジック側のため、静的定義では任意。
  assert.equal(p.registered_version_id.required ?? false, false);
  assert.equal(p.last_changed_version_id.required ?? false, false);
});

test("no duplicate codes within any app, including subtable children", () => {
  for (const appKey of APP_ORDER) {
    const codes = collectCodes(loadFieldFile(appKey));
    assert.equal(new Set(codes).size, codes.length, `${appKey} duplicate codes`);
  }
});

// ---------------------------------------------------------------------------
// Constants, order, plan determinism
// ---------------------------------------------------------------------------

test("three exact app names, Space 56, thread 60, sequential order", () => {
  assert.equal(APP1_NAME, "実行予算書作成支援ツールver02");
  assert.equal(APP2_NAME, "実行予算ver02_内訳明細");
  assert.equal(APP3_NAME, "実行予算ver02_実績");
  assert.equal(SPACE_ID, 56);
  assert.equal(THREAD_ID, 60);
  assert.deepEqual([...APP_ORDER], ["app1", "app2", "app3"]);
  assert.deepEqual(
    APP_ORDER.map((k) => APP_DEFS[k].name),
    [APP1_NAME, APP2_NAME, APP3_NAME],
  );
});

test("dry-run plan is deterministic, sequential, and never targets 735/736", () => {
  const plan1 = buildDryRunPlan();
  const plan2 = buildDryRunPlan();
  assert.deepEqual(plan1, plan2);
  assert.equal(plan1.mode, "dry-run");
  assert.equal(plan1.network, "none");
  assert.equal(plan1.spaceId, 56);
  assert.deepEqual(
    plan1.order.map((a) => a.key),
    ["app1", "app2", "app3"],
  );
  for (const appPlan of plan1.order) {
    const text = JSON.stringify(appPlan);
    assert.ok(!text.includes("735"), `${appPlan.key} plan must not reference 735`);
    assert.ok(!text.includes("736"), `${appPlan.key} plan must not reference 736`);
    assert.ok(!text.includes("customize/736"), "no customize/736 path");
    assert.ok(appPlan.totalFieldCount > 0);
    assert.equal(
      appPlan.totalFieldCount,
      appPlan.topLevelFieldCount + appPlan.subtableChildFieldCount,
    );
  }
  assert.ok(plan1.aclNote.includes("deferred"), "ACL deferral must be stated, not claimed done");
  assert.equal(plan1.aclNote, ACL_DEFERRED_NOTE);
});

test("plan field counts match the loaded field files", () => {
  const plan = buildDryRunPlan();
  for (const appPlan of plan.order) {
    const counts = fieldCounts(loadFieldFile(appPlan.key));
    assert.equal(appPlan.totalFieldCount, counts.total);
  }
});

// ---------------------------------------------------------------------------
// CLI: default dry-run without credentials, strict --execute parsing
// ---------------------------------------------------------------------------

function spawnCliWithoutCredentials(args = [], extraEnv = {}) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toUpperCase().startsWith("KINTONE")) continue;
    if (k === IMPLEMENTATION_GO_ENV) continue;
    env[k] = v;
  }
  Object.assign(env, extraEnv);
  return spawnSync(process.execPath, [CLI_PATH, ...args], { env, encoding: "utf8" });
}

test("default invocation is dry-run: exit 0 without credentials, no network claim", () => {
  const r1 = spawnCliWithoutCredentials();
  assert.equal(r1.status, 0, r1.stderr);
  assert.match(r1.stdout, /DRY-RUN/);
  assert.match(r1.stdout, /"network": "none"/);
  assert.match(r1.stdout, /"totalFieldCount"/);
  const r2 = spawnCliWithoutCredentials();
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(r1.stdout, r2.stdout, "dry-run output must be deterministic");
});

test("explicit --dry-run behaves like default and combined flags abort", () => {
  const r = spawnCliWithoutCredentials(["--dry-run"]);
  assert.equal(r.status, 0, r.stderr);
  const bad = spawnCliWithoutCredentials(["--execute", "--dry-run"]);
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /must not be combined/);
});

test("parseCliArgs is strict: only exact --execute enables execute mode", () => {
  assert.deepEqual(parseCliArgs([]), { mode: "dry-run" });
  assert.deepEqual(parseCliArgs(["--dry-run"]), { mode: "dry-run" });
  assert.deepEqual(parseCliArgs(["--execute"]), { mode: "execute" });
  assert.throws(() => parseCliArgs(["--execute", "--dry-run"]), /must not be combined/);
  assert.throws(() => parseCliArgs(["--EXECUTE"]), /Unknown argument/);
  assert.throws(() => parseCliArgs(["-e"]), /Unknown argument/);
  assert.throws(() => parseCliArgs(["--execute=true"]), /Unknown argument/);
  assert.throws(() => parseCliArgs(["execute"]), /Unknown argument/);
});

test("--execute without implementation GO aborts before credentials/network (H2)", () => {
  const r = spawnCliWithoutCredentials(["--execute"]);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1/);
  assert.match(r.stderr, /LIVE_CREATE is not ready/);
  assert.match(r.stderr, /NOT LIVE-ready/);
  assert.doesNotMatch(r.stderr, /Missing env var/, "GO gate must fire before credential read");
});

test("--execute with GO=1 still requires credentials (aborts before any state change)", () => {
  const r = spawnCliWithoutCredentials(["--execute"], { [IMPLEMENTATION_GO_ENV]: "1" });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Missing env var: KINTONE_BASE_URL/);
});

test("assertImplementationGo accepts only the exact value 1", () => {
  assert.equal(assertImplementationGo({ [IMPLEMENTATION_GO_ENV]: "1" }), undefined);
  for (const value of [undefined, "", "0", "true", "yes", " 1", "1 ", "01"]) {
    assert.throws(
      () => assertImplementationGo({ [IMPLEMENTATION_GO_ENV]: value }),
      /JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1 \(exact\)/,
      `value ${JSON.stringify(value)} must be rejected`,
    );
  }
  assert.equal(IMPLEMENTATION_GO_ENV, "JIKKOU_YOSAN_V2_IMPLEMENTATION_GO");
  assert.match(LIVE_NOT_READY_NOTE, /deferred/);
});

test("--execute --dry-run still aborts even with GO=1", () => {
  const bad = spawnCliWithoutCredentials(["--execute", "--dry-run"], {
    [IMPLEMENTATION_GO_ENV]: "1",
  });
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /must not be combined/);
});

test("dry-run works without GO and prints the LIVE-not-ready deferral", () => {
  const r = spawnCliWithoutCredentials(["--dry-run"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /NOT LIVE-ready/);
  assert.match(r.stdout, /JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1/);
});

// ---------------------------------------------------------------------------
// H1: Ver.01 736 backfill is quarantined out of the v2-* CLI surface
// ---------------------------------------------------------------------------

test("jikkou-yosan-v2-backfill.mjs is a HARD ABORT stub that never reads env or fetches", () => {
  const source = readFileSync(BACKFILL_STUB_PATH, "utf8");
  assert.match(source, /HARD ABORT/);
  assert.match(source, /process\.exit\(1\)/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /dotenv/);
  assert.doesNotMatch(source, /KINTONE_(BASE_URL|USERNAME|PASSWORD)/);

  // Even with credentials and --apply, the stub aborts without writing.
  const r = spawnSync(
    process.execPath,
    [BACKFILL_STUB_PATH, "--apply", "736"],
    {
      env: {
        ...process.env,
        KINTONE_BASE_URL: "https://example.invalid",
        KINTONE_USERNAME: "u",
        KINTONE_PASSWORD: "p",
      },
      encoding: "utf8",
    },
  );
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /HARD ABORT/);
  assert.match(r.stderr, /jikkou-yosan:ver01-736-backfill/);
});

test("package.json: v2-backfill points at the stub; ver01 script owns App 736", () => {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8"));
  const v2Backfill = pkg.scripts["jikkou-yosan:v2-backfill"];
  assert.ok(v2Backfill, "jikkou-yosan:v2-backfill must exist and abort via the stub");
  assert.match(v2Backfill, /jikkou-yosan-v2-backfill\.mjs/);
  assert.doesNotMatch(v2Backfill, /dotenv/, "stub must run without loading credentials");
  assert.match(
    pkg.scripts["jikkou-yosan:ver01-736-backfill"],
    /jikkou-yosan-ver01-736-backfill\.mjs/,
  );
});

// ---------------------------------------------------------------------------
// Forbidden 735/736 guards
// ---------------------------------------------------------------------------

test("assertAllowedAppId rejects 735 and 736 and invalid ids", () => {
  assert.throws(() => assertAllowedAppId(735, "t"), /FORBIDDEN/);
  assert.throws(() => assertAllowedAppId(736, "t"), /FORBIDDEN/);
  assert.throws(() => assertAllowedAppId("736", "t"), /FORBIDDEN/);
  assert.throws(() => assertAllowedAppId(0, "t"), /invalid appId/);
  assert.throws(() => assertAllowedAppId(null, "t"), /invalid appId/);
  assert.equal(assertAllowedAppId(737, "t"), 737);
  assert.deepEqual([...FORBIDDEN_APP_IDS], [735, 736]);
});

test("loadState rejects a state file that references 736", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "jy-v2-state-"));
  const statePath = path.join(dir, "state.json");
  writeFileSync(
    statePath,
    JSON.stringify({
      apps: {
        app1: { name: APP1_NAME, appId: 736, status: "created" },
        app2: { name: APP2_NAME, appId: null, status: "uncreated" },
        app3: { name: APP3_NAME, appId: null, status: "uncreated" },
      },
    }),
    "utf8",
  );
  assert.throws(() => loadState({ statePath }), /FORBIDDEN/);
});

test("saveState rejects in-memory state that references 735", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "jy-v2-state-"));
  const statePath = path.join(dir, "state.json");
  const state = loadState({ statePath });
  state.apps.app2.appId = 735;
  assert.throws(() => saveState(state, { statePath }), /FORBIDDEN/);
});

test("reconcileExistingApp rejects forbidden existing ids and never guesses on mismatch", () => {
  const entry = { name: APP1_NAME, appId: null, status: "uncreated" };
  assert.throws(
    () => reconcileExistingApp(entry, { appId: 735, name: APP1_NAME }),
    /FORBIDDEN/,
  );
  assert.throws(
    () =>
      reconcileExistingApp(
        { name: APP1_NAME, appId: 800, status: "created" },
        { appId: 801, name: APP1_NAME },
      ),
    /mismatch/,
  );
  // deployed 済みなのに名前検索に出ないのは本当に異常 → abort。
  assert.throws(
    () => reconcileExistingApp({ name: APP1_NAME, appId: 800, status: "deployed" }, null),
    /no app with that exact name/,
  );
  // created/error（未deploy）の appId は preview 専用のため名前検索に出ない。
  // 消滅と断定せず verify-preview（preview settings で名前一致検証）を要求する。
  assert.deepEqual(
    reconcileExistingApp({ name: APP1_NAME, appId: 800, status: "created" }, null),
    { action: "verify-preview", appId: 800 },
  );
  assert.deepEqual(
    reconcileExistingApp({ name: APP1_NAME, appId: 800, status: "error" }, null),
    { action: "verify-preview", appId: 800 },
  );
  assert.throws(
    () => reconcileExistingApp({ name: APP1_NAME, appId: 736, status: "error" }, null),
    /FORBIDDEN/,
  );
  assert.deepEqual(reconcileExistingApp(entry, null), { action: "create", appId: null });
  assert.deepEqual(
    reconcileExistingApp(entry, { appId: 801, name: APP1_NAME }),
    { action: "configure", appId: 801 },
  );
  assert.deepEqual(
    reconcileExistingApp(
      { name: APP1_NAME, appId: 801, status: "deployed" },
      { appId: 801, name: APP1_NAME },
    ),
    { action: "skip", appId: 801 },
  );
});

test("every write/deploy helper aborts on 735/736 before any fetch", async () => {
  let fetchCalls = 0;
  const ctx = {
    baseUrl: "https://example.invalid",
    headers: {},
    fetchImpl: async () => {
      fetchCalls += 1;
      throw new Error("network must not be reached");
    },
  };
  await assert.rejects(() => applyFormFields(ctx, 736, {}), /FORBIDDEN/);
  await assert.rejects(() => applyMissingFormFields(ctx, 736, {}), /FORBIDDEN/);
  await assert.rejects(() => getPreviewFormFields(ctx, 735), /FORBIDDEN/);
  await assert.rejects(() => applyAppSettings(ctx, 736, APP_DEFS.app1), /FORBIDDEN/);
  await assert.rejects(() => applyAppAcl(ctx, 735, "everyone"), /FORBIDDEN/);
  await assert.rejects(() => deployAppAndWait(ctx, 735), /FORBIDDEN/);
  assert.equal(fetchCalls, 0, "guards must fire before any network call");
});

test("createApp and findAppByName refuse resolved 735/736 ids from the API", async () => {
  const ctxCreate = {
    baseUrl: "https://example.invalid",
    headers: {},
    fetchImpl: async () => ({
      ok: true,
      text: async () => JSON.stringify({ app: "736", revision: "1" }),
    }),
  };
  await assert.rejects(() => createApp(ctxCreate, APP_DEFS.app1), /FORBIDDEN/);

  const ctxFind = {
    baseUrl: "https://example.invalid",
    headers: {},
    fetchImpl: async () => ({
      ok: true,
      text: async () => JSON.stringify({ apps: [{ appId: "735", name: APP1_NAME }] }),
    }),
  };
  await assert.rejects(() => findAppByName(ctxFind, APP1_NAME), /FORBIDDEN/);
});

test("findAppByName aborts when multiple apps share the exact name", async () => {
  const ctx = {
    baseUrl: "https://example.invalid",
    headers: {},
    fetchImpl: async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          apps: [
            { appId: "801", name: APP1_NAME },
            { appId: "802", name: APP1_NAME },
          ],
        }),
    }),
  };
  await assert.rejects(() => findAppByName(ctx, APP1_NAME), /Multiple apps/);
});

// ---------------------------------------------------------------------------
// Resume-safe field apply (partial preview reconciliation)
// ---------------------------------------------------------------------------

test("pickMissingProperties skips existing codes (including builtins) and keeps the rest", () => {
  const desired = {
    a: { type: "SINGLE_LINE_TEXT", code: "a", label: "x", defaultValue: "" },
    b: { type: "NUMBER", code: "b", label: "y", defaultValue: "" },
  };
  const existing = {
    レコード番号: { type: "RECORD_NUMBER", code: "レコード番号" },
    a: { type: "SINGLE_LINE_TEXT", code: "a" },
  };
  const r = pickMissingProperties(desired, existing);
  assert.deepEqual(Object.keys(r.missing), ["b"]);
  assert.deepEqual(r.skippedCodes, ["a"]);
  assert.equal(r.missingCount, 1);

  const all = pickMissingProperties(desired, { a: {}, b: {} });
  assert.equal(all.missingCount, 0);
  assert.deepEqual(all.skippedCodes, ["a", "b"]);

  const none = pickMissingProperties(desired, undefined);
  assert.equal(none.missingCount, 2);
});

test("applyMissingFormFields posts only missing codes and skips the POST when nothing is missing", async () => {
  const desired = {
    a: { type: "SINGLE_LINE_TEXT", code: "a", label: "x", defaultValue: "" },
    b: { type: "NUMBER", code: "b", label: "y", defaultValue: "" },
  };
  const calls = [];
  const ctx = {
    baseUrl: "https://example.invalid",
    headers: { "Content-Type": "application/json" },
    fetchImpl: async (url, init) => {
      const method = init?.method ?? "GET";
      calls.push({ url: String(url), method, body: init?.body ? JSON.parse(init.body) : null });
      if (method === "GET") {
        return jsonResponse({
          properties: { レコード番号: { code: "レコード番号" }, a: { code: "a" } },
          revision: "5",
        });
      }
      return jsonResponse({ revision: "6" });
    },
  };
  const r = await applyMissingFormFields(ctx, 801, desired);
  assert.equal(r.appliedCount, 1);
  assert.deepEqual(r.skippedCodes, ["a"]);
  assert.equal(r.revision, "6");
  const post = calls.find((c) => c.method === "POST");
  assert.deepEqual(Object.keys(post.body.properties), ["b"], "POST must contain only missing codes");
  assert.match(calls[0].url, /preview\/app\/form\/fields\.json\?app=801/);

  // Nothing missing: no POST, existing revision returned.
  const calls2 = [];
  const ctx2 = {
    baseUrl: "https://example.invalid",
    headers: {},
    fetchImpl: async (url, init) => {
      calls2.push({ method: init?.method ?? "GET" });
      return jsonResponse({ properties: { a: {}, b: {} }, revision: "7" });
    },
  };
  const r2 = await applyMissingFormFields(ctx2, 801, desired);
  assert.equal(r2.appliedCount, 0);
  assert.equal(r2.revision, "7");
  assert.equal(calls2.filter((c) => c.method === "POST").length, 0);
});

test("create-apps CLI uses the resume-safe missing-only field apply", () => {
  const source = readFileSync(CLI_PATH, "utf8");
  assert.match(source, /applyMissingFormFields\(ctx, appId, validated\[appKey\]\.properties\)/);
  assert.doesNotMatch(source, /applyFormFields\(ctx/, "CLI must not blind-POST the full field set");
});

test("verifyPreviewApp accepts exact preview name and aborts on mismatch or fetch failure", async () => {
  const ctxOk = {
    baseUrl: "https://example.invalid",
    headers: {},
    fetchImpl: async (url, init) => {
      assert.equal(init.method, "GET");
      assert.match(String(url), /preview\/app\/settings\.json\?app=801/);
      return jsonResponse({ name: APP1_NAME, revision: "4" });
    },
  };
  assert.equal(await verifyPreviewApp(ctxOk, 801, APP1_NAME), 801);

  const ctxWrongName = {
    baseUrl: "https://example.invalid",
    headers: {},
    fetchImpl: async () => jsonResponse({ name: "別のアプリ", revision: "4" }),
  };
  await assert.rejects(
    () => verifyPreviewApp(ctxWrongName, 801, APP1_NAME),
    /does not exactly match/,
  );

  const ctxError = {
    baseUrl: "https://example.invalid",
    headers: {},
    fetchImpl: async () => ({ ok: false, status: 404, text: async () => "{}" }),
  };
  await assert.rejects(
    () => verifyPreviewApp(ctxError, 801, APP1_NAME),
    /preview settings could not be read/,
  );

  await assert.rejects(() => verifyPreviewApp(ctxOk, 736, APP1_NAME), /FORBIDDEN/);
});

// ---------------------------------------------------------------------------
// Partial state transitions
// ---------------------------------------------------------------------------

test("state transitions record created/deployed/error with timestamps", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "jy-v2-state-"));
  const statePath = path.join(dir, "state.json");
  const state = loadState({ statePath });
  for (const appKey of APP_ORDER) {
    assert.equal(state.apps[appKey].status, "uncreated");
    assert.equal(state.apps[appKey].appId, null);
  }

  markCreated(state, "app1", 801, "2026-07-21T00:00:00.000Z");
  saveState(state, { statePath });
  let reread = loadState({ statePath });
  assert.equal(reread.apps.app1.status, "created");
  assert.equal(reread.apps.app1.appId, 801);
  assert.equal(reread.apps.app1.updatedAt, "2026-07-21T00:00:00.000Z");
  assert.equal(reread.apps.app2.status, "uncreated");

  markDeployed(state, "app1", "2026-07-21T00:01:00.000Z");
  markCreated(state, "app2", 802, "2026-07-21T00:02:00.000Z");
  markError(state, "app2", "deploy failed", "2026-07-21T00:03:00.000Z");
  saveState(state, { statePath });
  reread = loadState({ statePath });
  assert.equal(reread.apps.app1.status, "deployed");
  assert.equal(reread.apps.app2.status, "error");
  assert.equal(reread.apps.app2.appId, 802, "error must not lose the created appId");
  assert.equal(reread.apps.app2.error, "deploy failed");
  assert.equal(reread.apps.app3.status, "uncreated");

  assert.throws(() => markCreated(state, "app3", 736), /FORBIDDEN/);
  assert.throws(() => markDeployed(state, "app3"), /invalid appId/);
});

test("shipped state file is safe: no forbidden ids, valid statuses, exact names", () => {
  // LIVE create has legitimately started, so appIds may be real. The safety
  // properties are: never 735/736 (loadState guards), valid status vocab,
  // exact names, and id/status consistency.
  const state = loadState();
  for (const appKey of APP_ORDER) {
    const entry = state.apps[appKey];
    assert.equal(entry.name, APP_DEFS[appKey].name);
    assert.ok(STATE_STATUSES.includes(entry.status), `${appKey}: status ${entry.status}`);
    assert.ok(
      CUSTOMIZATION_STATUSES.includes(entry.customizationStatus),
      `${appKey}: customizationStatus ${entry.customizationStatus}`,
    );
    if (entry.appId === null) {
      assert.equal(entry.status, "uncreated", `${appKey}: null id must be uncreated`);
    } else {
      assert.equal(assertAllowedAppId(entry.appId, appKey), entry.appId);
      assert.notEqual(entry.status, "uncreated", `${appKey}: real id must not be uncreated`);
    }
  }
});

// ---------------------------------------------------------------------------
// Phase6 PRE-LIVE hardening: fail-closed read-only ACL, no unsafe write window
// ---------------------------------------------------------------------------

function jsonResponse(obj) {
  return { ok: true, text: async () => JSON.stringify(obj) };
}

test("EVERYONE_READ_ONLY_RIGHTS is fail-closed: view only, all writes false", () => {
  assert.equal(EVERYONE_READ_ONLY_RIGHTS.length, 1, "exactly one everyone entry");
  const r = EVERYONE_READ_ONLY_RIGHTS[0];
  assert.deepEqual(r.entity, { type: "GROUP", code: "everyone" });
  assert.equal(r.recordViewable, true);
  assert.equal(r.appEditable, false);
  assert.equal(r.recordAddable, false);
  assert.equal(r.recordEditable, false);
  assert.equal(r.recordDeletable, false);
  assert.equal(r.recordImportable, false);
  assert.equal(r.recordExportable, false);
});

test("applyAppAcl sends the fail-closed read-only payload for every app and returns revision", async () => {
  const fakeIds = { app1: 801, app2: 802, app3: 803 };
  for (const appKey of APP_ORDER) {
    const bodies = [];
    const ctx = {
      baseUrl: "https://example.invalid",
      headers: {},
      fetchImpl: async (url, init) => {
        assert.match(String(url), /\/k\/v1\/preview\/app\/acl\.json$/);
        assert.equal(init.method, "PUT");
        bodies.push(JSON.parse(init.body));
        return jsonResponse({ revision: "9" });
      },
    };
    const revision = await applyAppAcl(ctx, fakeIds[appKey]);
    assert.equal(revision, "9", `${appKey}: applyAppAcl must return the new revision`);
    assert.equal(bodies.length, 1);
    const payload = bodies[0];
    assert.equal(payload.app, String(fakeIds[appKey]));
    assert.equal(payload.rights.length, 1, `${appKey}: exactly one rights entry (everyone)`);
    const right = payload.rights[0];
    assert.deepEqual(right.entity, { type: "GROUP", code: "everyone" });
    assert.equal(right.recordViewable, true, `${appKey}: viewable`);
    for (const flag of [
      "appEditable",
      "recordAddable",
      "recordEditable",
      "recordDeletable",
      "recordImportable",
      "recordExportable",
    ]) {
      assert.equal(right[flag], false, `${appKey}: ${flag} must be false (fail-closed)`);
    }
  }
});

test("ACL payload keeps one app manager (CB_NO04) but never grants record writes", async () => {
  // kintone rejects an ACL where no user has app management right (CB_NO04),
  // so the operating account gets appEditable only — records stay fail-closed.
  const payload = buildAppAclPayload(801, "ops-admin");
  assert.equal(payload.rights.length, 2);
  const [admin, everyone] = payload.rights;
  assert.deepEqual(admin.entity, { type: "USER", code: "ops-admin" });
  assert.equal(admin.appEditable, true);
  assert.equal(admin.recordViewable, true);
  for (const flag of [
    "recordAddable",
    "recordEditable",
    "recordDeletable",
    "recordImportable",
    "recordExportable",
  ]) {
    assert.equal(admin[flag], false, `admin ${flag} must stay false (fail-closed records)`);
  }
  assert.deepEqual(everyone.entity, { type: "GROUP", code: "everyone" });
  assert.equal(everyone.appEditable, false);

  // applyAppAcl wires ctx.username into the payload.
  const bodies = [];
  const ctx = {
    baseUrl: "https://example.invalid",
    headers: {},
    username: "ops-admin",
    fetchImpl: async (url, init) => {
      bodies.push(JSON.parse(init.body));
      return jsonResponse({ revision: "9" });
    },
  };
  await applyAppAcl(ctx, 801);
  assert.equal(bodies[0].rights.length, 2);
  assert.deepEqual(bodies[0].rights[0].entity, { type: "USER", code: "ops-admin" });
});

test("buildAppAclPayload is guarded (735/736) and cannot mutate the frozen template", () => {
  assert.throws(() => buildAppAclPayload(735), /FORBIDDEN/);
  assert.throws(() => buildAppAclPayload(736), /FORBIDDEN/);
  const payload = buildAppAclPayload(801);
  payload.rights[0].recordAddable = true;
  payload.rights[0].entity.code = "hacked";
  const again = buildAppAclPayload(801);
  assert.equal(again.rights[0].recordAddable, false, "template must stay fail-closed");
  assert.equal(again.rights[0].entity.code, "everyone");
  assert.equal(EVERYONE_READ_ONLY_RIGHTS[0].recordAddable, false);
});

test("preview sequence fields→settings→ACL happens before the single deploy, which uses the post-ACL revision", async () => {
  const calls = [];
  let revision = 3;
  const ctx = {
    baseUrl: "https://example.invalid",
    headers: {},
    fetchImpl: async (url, init) => {
      const u = String(url);
      const method = init?.method ?? "GET";
      calls.push({ url: u, method, body: init?.body ? JSON.parse(init.body) : null });
      if (u.includes("/form/fields.json")) return jsonResponse({ revision: String(++revision) });
      if (u.includes("/settings.json")) return jsonResponse({ revision: String(++revision) });
      if (u.includes("/acl.json")) return jsonResponse({ revision: String(++revision) });
      if (u.includes("/deploy.json") && method === "POST") return jsonResponse({});
      if (u.includes("/deploy.json") && method === "GET") {
        return jsonResponse({ apps: [{ status: "SUCCESS" }] });
      }
      throw new Error(`unexpected call: ${method} ${u}`);
    },
  };

  await applyFormFields(ctx, 801, {});
  const settingsRev = await applyAppSettings(ctx, 801, APP_DEFS.app1);
  const aclRev = await applyAppAcl(ctx, 801);
  assert.equal(Number(aclRev), Number(settingsRev) + 1, "ACL bumps the revision past settings");
  await deployAppAndWait(ctx, 801, aclRev ?? settingsRev);

  const idx = (pred) => calls.findIndex(pred);
  const fieldsIdx = idx((c) => c.url.includes("/form/fields.json"));
  const settingsIdx = idx((c) => c.url.includes("/settings.json"));
  const aclIdx = idx((c) => c.url.includes("/acl.json"));
  const deployPosts = calls.filter((c) => c.url.includes("/deploy.json") && c.method === "POST");
  const deployIdx = idx((c) => c.url.includes("/deploy.json") && c.method === "POST");
  assert.equal(deployPosts.length, 1, "exactly one deploy POST");
  assert.ok(fieldsIdx < settingsIdx, "fields before settings");
  assert.ok(settingsIdx < aclIdx, "settings before ACL");
  assert.ok(aclIdx < deployIdx, "ACL applied before deploy — no unsafe write window");
  assert.equal(
    deployPosts[0].body.apps[0].revision,
    aclRev,
    "deploy must use the latest (post-ACL) revision, not the stale settings revision",
  );
});

test("create-apps CLI wires the post-ACL revision into the only deploy call", () => {
  const source = readFileSync(CLI_PATH, "utf8");
  assert.match(source, /const aclRev = await applyAppAcl\(ctx, appId\)/);
  assert.match(source, /const deployRev = aclRev \?\? settingsRev/);
  assert.match(source, /deployAppAndWait\(ctx, appId, deployRev\)/);
  const deployCalls = source.match(/deployAppAndWait\(/g) || [];
  assert.equal(deployCalls.length, 1, "create-apps must contain exactly one deploy call");
  const aclPos = source.indexOf("applyAppAcl(ctx, appId)");
  const deployPos = source.indexOf("deployAppAndWait(ctx, appId, deployRev)");
  assert.ok(aclPos > 0 && deployPos > aclPos, "ACL call precedes deploy in the execute flow");
});

test("dry-run plan states fail-closed read-only shell creation with ACL before the single deploy", () => {
  const plan = buildDryRunPlan();
  assert.equal(plan.shellOnlyNote, SHELL_ONLY_NOTE);
  assert.match(plan.shellOnlyNote, /no records can be written/);
  assert.match(plan.aclNote, /fail-closed read-only/);
  assert.match(plan.aclNote, /add\/edit\/delete\/import\/export=false/);
  for (const appPlan of plan.order) {
    const aclIdx = appPlan.actions.findIndex((a) => a.startsWith("apply-acl"));
    const deployIdx = appPlan.actions.findIndex((a) => a.startsWith("deploy-"));
    const deployActions = appPlan.actions.filter((a) => a.startsWith("deploy-"));
    assert.equal(deployActions.length, 1, `${appPlan.key}: exactly one deploy action`);
    assert.ok(aclIdx >= 0 && deployIdx > aclIdx, `${appPlan.key}: ACL before deploy`);
    assert.match(appPlan.actions[aclIdx], /fail-closed read-only/);
    assert.match(appPlan.actions[deployIdx], /latest-revision/);
    const fieldsIdx = appPlan.actions.findIndex((a) => a === "apply-fields");
    const settingsIdx = appPlan.actions.findIndex((a) => a === "apply-settings");
    assert.ok(fieldsIdx >= 0 && fieldsIdx < deployIdx, `${appPlan.key}: fields before deploy`);
    assert.ok(settingsIdx >= 0 && settingsIdx < deployIdx, `${appPlan.key}: settings before deploy`);
  }
});

test("dry-run CLI output announces the fail-closed read-only shell", () => {
  const r = spawnCliWithoutCredentials(["--dry-run"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /fail-closed read-only/);
  assert.match(r.stdout, /no records can be written/);
  assert.match(r.stdout, /NOT LIVE-ready/);
});

test("LIVE_NOT_READY_NOTE states read-only shells and deferred save path", () => {
  assert.match(LIVE_NOT_READY_NOTE, /fail-closed read-only shells/);
  assert.match(LIVE_NOT_READY_NOTE, /no add\/edit\/delete/);
  assert.match(LIVE_NOT_READY_NOTE, /deferred/);
});

// ---------------------------------------------------------------------------
// Phase6: customizationStatus semantics (never claim customization deployed)
// ---------------------------------------------------------------------------

test("customizationStatus defaults to unconfigured, also for legacy state files", () => {
  assert.deepEqual([...CUSTOMIZATION_STATUSES], ["unconfigured", "deployed", "error"]);
  const dir = mkdtempSync(path.join(tmpdir(), "jy-v2-state-"));
  const statePath = path.join(dir, "state.json");
  // Legacy file without customizationStatus
  writeFileSync(
    statePath,
    JSON.stringify({
      apps: {
        app1: { name: APP1_NAME, appId: 801, status: "deployed" },
        app2: { name: APP2_NAME, appId: null, status: "uncreated" },
        app3: { name: APP3_NAME, appId: null, status: "uncreated" },
      },
    }),
    "utf8",
  );
  const state = loadState({ statePath });
  for (const appKey of APP_ORDER) {
    assert.equal(state.apps[appKey].customizationStatus, "unconfigured");
  }
  // Bogus values are normalized back to unconfigured (never invented "deployed")
  writeFileSync(
    statePath,
    JSON.stringify({
      apps: {
        app1: { name: APP1_NAME, appId: 801, status: "deployed", customizationStatus: "live" },
        app2: { name: APP2_NAME, appId: null, status: "uncreated" },
        app3: { name: APP3_NAME, appId: null, status: "uncreated" },
      },
    }),
    "utf8",
  );
  assert.equal(loadState({ statePath }).apps.app1.customizationStatus, "unconfigured");
});

test("markCustomizationDeployed requires schema deployed first; schema marks preserve it", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "jy-v2-state-"));
  const statePath = path.join(dir, "state.json");
  const state = loadState({ statePath });

  markCreated(state, "app1", 801, "2026-07-21T00:00:00.000Z");
  assert.throws(
    () => markCustomizationDeployed(state, "app1"),
    /schema status must be "deployed" first/,
    "customization must not be callable before schema deploy",
  );

  markDeployed(state, "app1", "2026-07-21T00:01:00.000Z");
  assert.equal(state.apps.app1.customizationStatus, "unconfigured", "schema deploy alone never claims customization deployed");

  markCustomizationError(state, "app1", "previous deploy failed", "2026-07-21T00:01:30.000Z");
  markCustomizationDeployed(state, "app1", "2026-07-21T00:02:00.000Z");
  assert.equal(state.apps.app1.error, null, "successful retry must clear the prior deploy error");
  saveState(state, { statePath });
  const reread = loadState({ statePath });
  assert.equal(reread.apps.app1.status, "deployed");
  assert.equal(reread.apps.app1.customizationStatus, "deployed");

  markCustomizationError(state, "app2", "upload failed", "2026-07-21T00:03:00.000Z");
  assert.equal(state.apps.app2.customizationStatus, "error");
  assert.equal(state.apps.app2.error, "upload failed");

  // markCustomizationDeployed also refuses null/forbidden ids
  assert.throws(() => markCustomizationDeployed(state, "app3"), /invalid appId/);
  state.apps.app3.appId = 736;
  state.apps.app3.status = "deployed";
  assert.throws(() => markCustomizationDeployed(state, "app3"), /FORBIDDEN/);
});
