/**
 * 実行予算 Ver.02 Phase 2 — 3アプリ作成用の隔離ヘルパ。
 * 正本: docs/plans/2026-07-21-jikkou-yosan-ver02-3app-schema-design.md §8
 *       docs/plans/2026-07-21-jikkou-yosan-ver02-3app-field-catalog.md
 *
 * 安全設計:
 * - App 735/736 への書込みは、状態ロード時・既存名解決時・全書込/デプロイ関数の
 *   冒頭で即 abort する（FORBIDDEN_APP_IDS）。
 * - 認証情報の読込（getKintoneConfig）は execute モードだけが呼ぶ。dry-run は
 *   env 不要・fetch ゼロ。
 * - 3アプリは必ず app1→app2→app3 の順に直列処理し、作成直後と deploy 成功後に
 *   状態を保存する。自動削除・自動ロールバックはしない。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertAllowedAppId, FORBIDDEN_APP_IDS } from "./guard.mjs";

export { assertAllowedAppId, FORBIDDEN_APP_IDS } from "./guard.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");

export const SPACE_ID = 56;
export const THREAD_ID = 60;

export const APP1_NAME = "実行予算書作成支援ツールver02";
export const APP2_NAME = "実行予算ver02_内訳明細";
export const APP3_NAME = "実行予算ver02_実績";

export const APP_ORDER = Object.freeze(["app1", "app2", "app3"]);

export const APP_DEFS = Object.freeze({
  app1: Object.freeze({
    key: "app1",
    name: APP1_NAME,
    fieldsFile: "jikkou-yosan-v2-app1-fields.json",
    theme: "BLUE",
    description:
      "実行予算書 Ver.02 メイン（工事基本情報・版メタ・請負明細・給与手当・総括原価投影）。金額の正は内訳明細アプリ（P-33）。",
  }),
  app2: Object.freeze({
    key: "app2",
    name: APP2_NAME,
    fieldsFile: "jikkou-yosan-v2-app2-fields.json",
    theme: "BLUE",
    description:
      "実行予算 Ver.02 内訳明細（1行=1レコード）。正規の書込みは①のカスタムUI経由のみ。直接編集は後続フェーズの保存ガード対象。",
  }),
  app3: Object.freeze({
    key: "app3",
    name: APP3_NAME,
    fieldsFile: "jikkou-yosan-v2-app3-fields.json",
    theme: "BLUE",
    description:
      "実行予算 Ver.02 実績（月別消化・最終予算額の縦持ち）。実績は工事帰属で版複製時にコピーしない（P-28/P-30）。",
  }),
});

export const STATE_PATH = path.join(DATA_DIR, "jikkou-yosan-v2-app-ids.json");
export const STATE_STATUSES = Object.freeze([
  "uncreated",
  "created",
  "deployed",
  "error",
]);

/**
 * status=deployed は「スキーマ＋アプリ設定＋fail-closed ACL を deploy 済み」の
 * 意味のみ。カスタマイズJSの deploy 状態は customizationStatus が別管理し、
 * 実際に deploy していないものを deployed と呼ばない。
 */
export const CUSTOMIZATION_STATUSES = Object.freeze([
  "unconfigured",
  "deployed",
  "error",
]);

/**
 * Phase6 PRE-LIVE hardening: 初期スキーマ作成の app-level ACL は FAIL-CLOSED
 * READ-ONLY。everyone は閲覧のみで、add/edit/delete/import/export をすべて false、
 * appEditable=false とする。3アプリとも「読み取り専用の器（shell）」として deploy し、
 * レコード条件ACL（parent_lock_snapshot）と App1 カスタムUI保存 executor が実装・
 * 個別承認されるまで、誰もレコードを書けない状態を維持する（unsafe直書きウィンドウなし）。
 * 「実行予算管理者」グループのコードは未確認のため発明せず、グループ別ACLは後続フェーズ。
 */
export const EVERYONE_READ_ONLY_RIGHTS = Object.freeze([
  Object.freeze({
    entity: Object.freeze({ type: "GROUP", code: "everyone" }),
    appEditable: false,
    recordViewable: true,
    recordAddable: false,
    recordEditable: false,
    recordDeletable: false,
    recordImportable: false,
    recordExportable: false,
  }),
]);

export const ACL_DEFERRED_NOTE =
  "fail-closed read-only shell ACL (everyone: view only; add/edit/delete/import/export=false, appEditable=false; operating admin user keeps appEditable only — record writes stay false, required because kintone rejects an ACL where no user has app management right: CB_NO04); 実行予算管理者 group ACL and record-level parent_lock_snapshot ACL are deferred (group code unconfirmed)";

export const SHELL_ONLY_NOTE =
  "shell-only schema deploy: fail-closed read-only ACL means no records can be written by anyone until record-level ACL and the App1 save executor are implemented and separately approved";

/**
 * Phase5 hardening (H2): --execute だけでは LIVE 作成に入れない。
 * 明示的な実装GO（env JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1、完全一致）が必要。
 * レコード条件ACL・直UI保存ガードが未実装のため、LIVE_CREATE はまだ ready ではない。
 */
export const IMPLEMENTATION_GO_ENV = "JIKKOU_YOSAN_V2_IMPLEMENTATION_GO";

export const LIVE_NOT_READY_NOTE =
  "creation is limited to fail-closed read-only shells (everyone: view only, no add/edit/delete); record-level ACL (parent_lock_snapshot) and the App1-custom-UI save path are deferred — Ver.02 is NOT LIVE-ready for record writes";

export function assertImplementationGo(env = process.env) {
  if (env[IMPLEMENTATION_GO_ENV] === "1") return;
  throw new Error(
    [
      `--execute requires ${IMPLEMENTATION_GO_ENV}=1 (exact). Aborting before any credential read or network access.`,
      "LIVE_CREATE is not ready: Phase5 hardening gate is active.",
      LIVE_NOT_READY_NOTE + ".",
      `Set ${IMPLEMENTATION_GO_ENV}=1 only after an explicit implementation GO decision.`,
    ].join("\n"),
  );
}

// ---------------------------------------------------------------------------
// Field loading and strict static validation
// ---------------------------------------------------------------------------

const FIELD_TYPES = new Set([
  "SINGLE_LINE_TEXT",
  "MULTI_LINE_TEXT",
  "NUMBER",
  "DATE",
  "DATETIME",
  "DROP_DOWN",
  "RADIO_BUTTON",
  "CHECK_BOX",
  "USER_SELECT",
  "SUBTABLE",
]);

const UNIQUE_SUPPORTED_TYPES = new Set([
  "SINGLE_LINE_TEXT",
  "NUMBER",
  "DATE",
  "DATETIME",
  "LINK",
]);

const OPTION_TYPES = new Set(["DROP_DOWN", "RADIO_BUTTON", "CHECK_BOX"]);

function validateOptions(field, where, errors) {
  const options = field.options;
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    errors.push(`${where}: options must be an object`);
    return [];
  }
  const keys = Object.keys(options);
  if (keys.length === 0) errors.push(`${where}: options must not be empty`);
  const indexes = new Set();
  for (const key of keys) {
    const opt = options[key];
    if (typeof opt !== "object" || opt === null) {
      errors.push(`${where}: option ${key} must be an object`);
      continue;
    }
    if (opt.label !== key) {
      errors.push(`${where}: option key ${key} must equal its label (${opt.label})`);
    }
    if (typeof opt.index !== "string" || !/^\d+$/.test(opt.index)) {
      errors.push(`${where}: option ${key} index must be a string integer`);
      continue;
    }
    if (indexes.has(opt.index)) {
      errors.push(`${where}: option index ${opt.index} duplicated`);
    }
    indexes.add(opt.index);
  }
  for (let i = 0; i < keys.length; i++) {
    if (!indexes.has(String(i))) {
      errors.push(`${where}: option indexes must cover 0..${keys.length - 1}`);
      break;
    }
  }
  return keys;
}

function validateDefaultValue(field, where, optionKeys, errors) {
  const dv = field.defaultValue;
  switch (field.type) {
    case "DROP_DOWN":
      if (typeof dv !== "string") {
        errors.push(`${where}: DROP_DOWN defaultValue must be a string`);
      } else if (dv !== "" && !optionKeys.includes(dv)) {
        errors.push(`${where}: DROP_DOWN defaultValue "${dv}" not in options`);
      }
      break;
    case "RADIO_BUTTON":
      if (typeof dv !== "string" || dv === "") {
        errors.push(`${where}: RADIO_BUTTON defaultValue must be a non-empty string`);
      } else if (!optionKeys.includes(dv)) {
        errors.push(`${where}: RADIO_BUTTON defaultValue "${dv}" not in options`);
      }
      break;
    case "CHECK_BOX":
      if (!Array.isArray(dv)) {
        errors.push(`${where}: CHECK_BOX defaultValue must be an array`);
      } else {
        for (const v of dv) {
          if (!optionKeys.includes(v)) {
            errors.push(`${where}: CHECK_BOX defaultValue "${v}" not in options`);
          }
        }
      }
      break;
    case "USER_SELECT":
      if (dv !== undefined && !Array.isArray(dv)) {
        errors.push(`${where}: USER_SELECT defaultValue must be an array`);
      }
      break;
    case "NUMBER":
      if (dv !== undefined && typeof dv !== "string") {
        errors.push(`${where}: NUMBER defaultValue must be a string`);
      }
      break;
    default:
      if (dv !== undefined && typeof dv !== "string") {
        errors.push(`${where}: defaultValue must be a string`);
      }
  }
}

function validateSingleField(key, field, { insideSubtable }, errors, allCodes) {
  const where = insideSubtable ? `subtable child ${key}` : `field ${key}`;
  if (typeof field !== "object" || field === null) {
    errors.push(`${where}: must be an object`);
    return;
  }
  if (field.code !== key) {
    errors.push(`${where}: property key must equal code (code=${field.code})`);
  }
  if (typeof field.code !== "string" || field.code.trim() === "") {
    errors.push(`${where}: code must be a non-empty string`);
  }
  if (!FIELD_TYPES.has(field.type)) {
    errors.push(`${where}: unsupported type ${field.type}`);
    return;
  }
  if (allCodes.has(key)) {
    errors.push(`duplicate field code: ${key}`);
  }
  allCodes.add(key);

  if (field.type === "SUBTABLE") {
    if (insideSubtable) {
      errors.push(`${where}: nested SUBTABLE is not allowed`);
      return;
    }
    // 実機検証済み: SUBTABLE も label 必須。欠落は live で HTTP 400 CB_VA01 になる。
    if (typeof field.label !== "string" || field.label.trim() === "") {
      errors.push(`${where}: SUBTABLE label must be a non-empty string`);
    }
    if (field.required !== undefined || field.unique !== undefined) {
      errors.push(`${where}: SUBTABLE must not declare required/unique`);
    }
    if (typeof field.fields !== "object" || field.fields === null) {
      errors.push(`${where}: SUBTABLE must have a fields object`);
      return;
    }
    for (const [childKey, child] of Object.entries(field.fields)) {
      validateSingleField(childKey, child, { insideSubtable: true }, errors, allCodes);
    }
    return;
  }

  if (typeof field.label !== "string" || field.label.trim() === "") {
    errors.push(`${where}: label must be a non-empty string`);
  }
  if (field.required !== undefined && typeof field.required !== "boolean") {
    errors.push(`${where}: required must be a boolean`);
  }
  if (field.unique !== undefined) {
    if (typeof field.unique !== "boolean") {
      errors.push(`${where}: unique must be a boolean`);
    } else if (field.unique === true) {
      if (!UNIQUE_SUPPORTED_TYPES.has(field.type)) {
        errors.push(`${where}: unique is not supported on type ${field.type}`);
      }
      if (insideSubtable) {
        errors.push(`${where}: unique is not supported inside a SUBTABLE`);
      }
    }
  }
  if (field.displayScale !== undefined && typeof field.displayScale !== "string") {
    errors.push(`${where}: NUMBER displayScale must be a string`);
  }

  let optionKeys = [];
  if (OPTION_TYPES.has(field.type)) {
    optionKeys = validateOptions(field, where, errors);
  } else if (field.options !== undefined) {
    errors.push(`${where}: options not allowed on type ${field.type}`);
  }
  validateDefaultValue(field, where, optionKeys, errors);
}

export function validateProperties(appKey, properties) {
  const errors = [];
  if (typeof properties !== "object" || properties === null || Array.isArray(properties)) {
    throw new Error(`${appKey}: properties must be an object`);
  }
  if (Object.keys(properties).length === 0) {
    errors.push(`${appKey}: properties must not be empty`);
  }
  const allCodes = new Set();
  for (const [key, field] of Object.entries(properties)) {
    validateSingleField(key, field, { insideSubtable: false }, errors, allCodes);
  }
  if (errors.length > 0) {
    const error = new Error(
      `${appKey}: field validation failed (${errors.length}):\n- ${errors.join("\n- ")}`,
    );
    error.validationErrors = errors;
    throw error;
  }
  return { codes: allCodes };
}

export function fieldCounts(properties) {
  let topLevel = 0;
  let subtableChildren = 0;
  for (const field of Object.values(properties)) {
    topLevel += 1;
    if (field.type === "SUBTABLE" && field.fields) {
      subtableChildren += Object.keys(field.fields).length;
    }
  }
  return { topLevel, subtableChildren, total: topLevel + subtableChildren };
}

export function loadFieldFile(appKey, { dataDir = DATA_DIR } = {}) {
  const def = APP_DEFS[appKey];
  if (!def) throw new RangeError(`Unknown app key: ${appKey}`);
  const filePath = path.join(dataDir, def.fieldsFile);
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  if (typeof raw.properties !== "object" || raw.properties === null) {
    throw new Error(`${def.fieldsFile}: missing properties`);
  }
  return raw.properties;
}

/** 全アプリのフィールドJSONを読み込み、書込み前に必ず静的検証する。 */
export function validateAllFieldFiles({ dataDir = DATA_DIR } = {}) {
  const result = {};
  for (const appKey of APP_ORDER) {
    const properties = loadFieldFile(appKey, { dataDir });
    validateProperties(appKey, properties);
    result[appKey] = { properties, counts: fieldCounts(properties) };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Dry-run planning (no env, no fetch)
// ---------------------------------------------------------------------------

export function buildDryRunPlan({ dataDir = DATA_DIR } = {}) {
  const validated = validateAllFieldFiles({ dataDir });
  return {
    mode: "dry-run",
    network: "none",
    spaceId: SPACE_ID,
    threadId: THREAD_ID,
    forbiddenAppIds: [...FORBIDDEN_APP_IDS],
    aclNote: ACL_DEFERRED_NOTE,
    shellOnlyNote: SHELL_ONLY_NOTE,
    order: APP_ORDER.map((appKey) => {
      const def = APP_DEFS[appKey];
      const { counts } = validated[appKey];
      return {
        key: appKey,
        name: def.name,
        fieldsFile: def.fieldsFile,
        topLevelFieldCount: counts.topLevel,
        subtableChildFieldCount: counts.subtableChildren,
        totalFieldCount: counts.total,
        actions: [
          "reconcile-existing-by-exact-name",
          "create-app",
          "save-state(created)",
          "apply-fields",
          "apply-settings",
          "apply-acl(fail-closed read-only: everyone view-only, add/edit/delete/import/export=false)",
          "deploy-with-latest-revision-and-wait-SUCCESS",
          "save-state(deployed: read-only shell)",
        ],
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// State load/save with forbidden guard
// ---------------------------------------------------------------------------

function emptyState() {
  const apps = {};
  for (const appKey of APP_ORDER) {
    apps[appKey] = {
      name: APP_DEFS[appKey].name,
      appId: null,
      status: "uncreated",
      customizationStatus: "unconfigured",
      updatedAt: null,
      error: null,
    };
  }
  return { apps };
}

export function loadState({ statePath = STATE_PATH } = {}) {
  if (!existsSync(statePath)) return emptyState();
  const raw = JSON.parse(readFileSync(statePath, "utf8"));
  const state = { _meta: raw._meta, apps: {} };
  for (const appKey of APP_ORDER) {
    const entry = raw.apps?.[appKey] ?? {};
    const appId = entry.appId ?? null;
    if (appId !== null) {
      assertAllowedAppId(appId, `loadState(${appKey})`);
    }
    const status = STATE_STATUSES.includes(entry.status) ? entry.status : "uncreated";
    const customizationStatus = CUSTOMIZATION_STATUSES.includes(entry.customizationStatus)
      ? entry.customizationStatus
      : "unconfigured";
    state.apps[appKey] = {
      name: APP_DEFS[appKey].name,
      appId: appId === null ? null : Number(appId),
      status,
      customizationStatus,
      updatedAt: entry.updatedAt ?? null,
      error: entry.error ?? null,
    };
  }
  return state;
}

export function saveState(state, { statePath = STATE_PATH } = {}) {
  for (const appKey of APP_ORDER) {
    const entry = state.apps[appKey];
    if (entry.appId !== null) assertAllowedAppId(entry.appId, `saveState(${appKey})`);
  }
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function markCreated(state, appKey, appId, now = new Date().toISOString()) {
  const id = assertAllowedAppId(appId, `markCreated(${appKey})`);
  state.apps[appKey] = {
    ...state.apps[appKey],
    appId: id,
    status: "created",
    updatedAt: now,
    error: null,
  };
  return state;
}

export function markDeployed(state, appKey, now = new Date().toISOString()) {
  const entry = state.apps[appKey];
  assertAllowedAppId(entry.appId, `markDeployed(${appKey})`);
  state.apps[appKey] = { ...entry, status: "deployed", updatedAt: now, error: null };
  return state;
}

export function markError(state, appKey, message, now = new Date().toISOString()) {
  state.apps[appKey] = {
    ...state.apps[appKey],
    status: "error",
    updatedAt: now,
    error: String(message),
  };
  return state;
}

/**
 * customizationStatus=deployed は「カスタマイズJSの deploy が実際に SUCCESS した」
 * 場合にのみ設定する。スキーマ deploy（status=deployed）とは独立で、勝手に
 * deployed を名乗らない。
 */
export function markCustomizationDeployed(state, appKey, now = new Date().toISOString()) {
  const entry = state.apps[appKey];
  assertAllowedAppId(entry.appId, `markCustomizationDeployed(${appKey})`);
  if (entry.status !== "deployed") {
    throw new Error(
      `markCustomizationDeployed(${appKey}): schema status must be "deployed" first (got "${entry.status}")`,
    );
  }
  state.apps[appKey] = {
    ...entry,
    customizationStatus: "deployed",
    updatedAt: now,
    error: null,
  };
  return state;
}

export function markCustomizationError(state, appKey, message, now = new Date().toISOString()) {
  state.apps[appKey] = {
    ...state.apps[appKey],
    customizationStatus: "error",
    updatedAt: now,
    error: String(message),
  };
  return state;
}

/**
 * 再実行時の照合。stateのIDと同名既存アプリの正確な突合のみ許し、
 * 不一致は必ず abort（推測して続行しない）。
 *
 * 例外: status=created/error で appId があるのに名前検索でヒットしない場合は
 * 「preview 専用アプリ」（作成後 deploy 前に失敗）の正常ケース。
 * /k/v1/apps.json は deploy 済みアプリしか返さないため、名前検索の不在だけでは
 * 消滅と断定できない。この場合は verify-preview を返し、呼び出し側が preview
 * settings API で名前の正確一致を検証してから再開する（不一致なら abort）。
 */
export function reconcileExistingApp(stateEntry, existing) {
  if (existing) {
    const existingId = assertAllowedAppId(existing.appId, "reconcileExistingApp(existing)");
    if (stateEntry.appId !== null && Number(stateEntry.appId) !== existingId) {
      throw new Error(
        `State/name mismatch for "${stateEntry.name}": state appId=${stateEntry.appId} but existing app with the same name has appId=${existingId}. Aborting — resolve manually.`,
      );
    }
    if (stateEntry.status === "deployed" && stateEntry.appId !== null) {
      return { action: "skip", appId: existingId };
    }
    return { action: "configure", appId: existingId };
  }
  if (stateEntry.appId !== null) {
    if (stateEntry.status === "created" || stateEntry.status === "error") {
      const appId = assertAllowedAppId(stateEntry.appId, "reconcileExistingApp(preview)");
      return { action: "verify-preview", appId };
    }
    throw new Error(
      `State claims "${stateEntry.name}" exists (appId=${stateEntry.appId}, status=${stateEntry.status}) but no app with that exact name was found. Aborting — resolve manually (app may have been renamed or deleted).`,
    );
  }
  return { action: "create", appId: null };
}

/** preview のアプリ設定を取得する（preview 専用アプリの検証用）。 */
export async function getPreviewAppSettings(ctx, appId) {
  const id = assertAllowedAppId(appId, "getPreviewAppSettings");
  const url = new URL(`${ctx.baseUrl}/k/v1/preview/app/settings.json`);
  url.searchParams.set("app", String(id));
  const headers = { ...ctx.headers };
  delete headers["Content-Type"];
  return fetchJson(ctx, url, { method: "GET", headers });
}

/**
 * verify-preview: state の appId が本当に対象アプリ（正確な名前一致）かを
 * preview settings で検証する。不一致・取得失敗は abort（推測しない）。
 */
export async function verifyPreviewApp(ctx, appId, expectedName) {
  const id = assertAllowedAppId(appId, "verifyPreviewApp");
  let settings;
  try {
    settings = await getPreviewAppSettings(ctx, id);
  } catch (e) {
    throw new Error(
      `verify-preview failed for appId=${id}: preview settings could not be read (${e.message || e}). Aborting — resolve manually.`,
    );
  }
  if (settings.name !== expectedName) {
    throw new Error(
      `verify-preview failed for appId=${id}: preview name "${settings.name}" does not exactly match expected "${expectedName}". Aborting — resolve manually.`,
    );
  }
  return id;
}

// ---------------------------------------------------------------------------
// Credentials (execute mode only) and REST helpers
// ---------------------------------------------------------------------------

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === "") throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

/** execute モードのみ呼ぶこと。dry-run はこの関数に到達してはならない。 */
export function getKintoneConfig() {
  let baseUrl = requireEnv("KINTONE_BASE_URL").replace(/\/+$/, "").replace(/\/k$/i, "");
  const user = requireEnv("KINTONE_USERNAME");
  const pass = requireEnv("KINTONE_PASSWORD");
  const headers = {
    "X-Cybozu-Authorization": Buffer.from(`${user}:${pass}`, "utf8").toString("base64"),
    "Content-Type": "application/json",
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
    const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
    headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, "utf8").toString("base64")}`;
  }
  return { baseUrl, headers, username: user, fetchImpl: globalThis.fetch };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson(ctx, url, init) {
  const fetchImpl = ctx.fetchImpl ?? globalThis.fetch;
  const res = await fetchImpl(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message
      ? `${json.code || ""} ${json.message || ""}`.trim()
      : text.slice(0, 1200);
    throw new Error(`HTTP ${res.status} ${msg}`.trim());
  }
  return json;
}

export async function findAppByName(ctx, name) {
  const found = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/apps.json`, {
    method: "POST",
    headers: { ...ctx.headers, "X-HTTP-Method-Override": "GET" },
    body: JSON.stringify({ name }),
  });
  const exact = (found.apps || []).filter((a) => a.name === name);
  if (exact.length > 1) {
    throw new Error(`Multiple apps share the exact name "${name}". Aborting.`);
  }
  if (exact.length === 0) return null;
  const appId = assertAllowedAppId(exact[0].appId, `findAppByName("${name}")`);
  return { appId, name: exact[0].name };
}

export async function createApp(ctx, def) {
  const add = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/app.json`, {
    method: "POST",
    headers: ctx.headers,
    body: JSON.stringify({ name: def.name, space: SPACE_ID, thread: THREAD_ID }),
  });
  return assertAllowedAppId(add.app, `createApp("${def.name}")`);
}

export async function applyFormFields(ctx, appId, properties) {
  const id = assertAllowedAppId(appId, "applyFormFields");
  const res = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: "POST",
    headers: ctx.headers,
    body: JSON.stringify({ app: id, properties }),
  });
  return res.revision;
}

/** preview のフォームフィールドを取得する（resume 照合用）。 */
export async function getPreviewFormFields(ctx, appId) {
  const id = assertAllowedAppId(appId, "getPreviewFormFields");
  const url = new URL(`${ctx.baseUrl}/k/v1/preview/app/form/fields.json`);
  url.searchParams.set("app", String(id));
  const headers = { ...ctx.headers };
  delete headers["Content-Type"];
  return fetchJson(ctx, url, { method: "GET", headers });
}

/**
 * resume 用の純関数: 既に preview に存在するトップレベルコード（ビルトイン
 * フィールド含む）を除外し、未適用の properties だけを返す。
 */
export function pickMissingProperties(desired, existingProperties) {
  const existingCodes = new Set(Object.keys(existingProperties ?? {}));
  const missing = {};
  const skippedCodes = [];
  for (const [code, field] of Object.entries(desired)) {
    if (existingCodes.has(code)) skippedCodes.push(code);
    else missing[code] = field;
  }
  return { missing, skippedCodes, missingCount: Object.keys(missing).length };
}

/**
 * resume-safe なフィールド適用: preview の既存フィールドを取得し、欠落して
 * いるコードだけを POST する。部分適用済みアプリ（例: 途中失敗した appId）を
 * 再開しても GAIA field-exists で落ちない。全コード適用済みなら POST せず、
 * 既存 revision を返す。
 */
export async function applyMissingFormFields(ctx, appId, properties) {
  const id = assertAllowedAppId(appId, "applyMissingFormFields");
  const existing = await getPreviewFormFields(ctx, id);
  const { missing, skippedCodes, missingCount } = pickMissingProperties(
    properties,
    existing.properties,
  );
  if (missingCount === 0) {
    return { revision: existing.revision, appliedCount: 0, skippedCodes };
  }
  const revision = await applyFormFields(ctx, id, missing);
  return { revision, appliedCount: missingCount, skippedCodes };
}

export async function applyAppSettings(ctx, appId, def) {
  const id = assertAllowedAppId(appId, "applyAppSettings");
  const res = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/app/settings.json`, {
    method: "PUT",
    headers: ctx.headers,
    body: JSON.stringify({
      app: String(id),
      name: def.name,
      description: def.description,
      theme: def.theme,
    }),
  });
  return res.revision;
}

/**
 * FAIL-CLOSED READ-ONLY の app-level ACL（everyone: 閲覧のみ）。
 * add/edit/delete/import/export すべて false・appEditable=false。
 * shell-only schema deploy: レコード条件ACL（parent_lock_snapshot）と App1
 * カスタムUI保存 executor が実装・個別承認されるまで誰もレコードを書けない。
 * 「実行予算管理者」グループコードは未確認のため設定しない（後続フェーズ）。
 *
 * kintone の preview 変更は revision を進めるため、deploy が stale revision に
 * ならないよう、この関数は ACL 適用後の最新 revision を返す。呼び出し側は
 * 「最後の preview 変更が返した revision」で deploy すること。
 */
export function buildAppAclPayload(appId, adminUsername) {
  const id = assertAllowedAppId(appId, "buildAppAclPayload");
  const rights = [];
  if (adminUsername) {
    // kintone は「アプリ管理権限を持つユーザーが1人もいない」ACL を拒否する
    // （HTTP 400 CB_NO04）。運用アカウントに appEditable のみ付与し、レコードの
    // add/edit/delete/import/export は false のまま（fail-closed を維持）。
    rights.push({
      entity: { type: "USER", code: String(adminUsername) },
      appEditable: true,
      recordViewable: true,
      recordAddable: false,
      recordEditable: false,
      recordDeletable: false,
      recordImportable: false,
      recordExportable: false,
    });
  }
  for (const r of EVERYONE_READ_ONLY_RIGHTS) {
    rights.push({ ...r, entity: { ...r.entity } });
  }
  return { app: String(id), rights };
}

export async function applyAppAcl(ctx, appId) {
  const payload = buildAppAclPayload(appId, ctx.username);
  const res = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/app/acl.json`, {
    method: "PUT",
    headers: ctx.headers,
    body: JSON.stringify(payload),
  });
  return res.revision;
}

export async function waitDeploy(ctx, appId) {
  const id = assertAllowedAppId(appId, "waitDeploy");
  const stUrl = new URL(`${ctx.baseUrl}/k/v1/preview/app/deploy.json`);
  stUrl.searchParams.set("apps[0]", String(id));
  const headers = { ...ctx.headers };
  delete headers["Content-Type"];
  for (let i = 0; i < 120; i++) {
    const st = await fetchJson(ctx, stUrl, { method: "GET", headers });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === "SUCCESS") return;
    if (status === "FAIL" || status === "CANCEL") {
      throw new Error(`Deploy status: ${status} (app ${id})`);
    }
    await sleep(1000);
  }
  throw new Error(`Deploy timed out (app ${id}).`);
}

/** 1アプリずつ deploy し、SUCCESS を待ってから次へ進む（並行 deploy 禁止）。 */
export async function deployAppAndWait(ctx, appId, revision) {
  const id = assertAllowedAppId(appId, "deployAppAndWait");
  const body =
    revision != null ? { apps: [{ app: id, revision }] } : { apps: [{ app: id }] };
  await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/app/deploy.json`, {
    method: "POST",
    headers: ctx.headers,
    body: JSON.stringify(body),
  });
  await waitDeploy(ctx, id);
}

// ---------------------------------------------------------------------------
// CLI argument parsing (strict)
// ---------------------------------------------------------------------------

export function parseCliArgs(argv) {
  let execute = false;
  let dryRun = false;
  for (const arg of argv) {
    if (arg === "--execute") execute = true;
    else if (arg === "--dry-run") dryRun = true;
    else throw new Error(`Unknown argument: ${JSON.stringify(arg)} (allowed: --execute, --dry-run)`);
  }
  if (execute && dryRun) {
    throw new Error("Refusing to run: --execute and --dry-run must not be combined.");
  }
  return { mode: execute ? "execute" : "dry-run" };
}
