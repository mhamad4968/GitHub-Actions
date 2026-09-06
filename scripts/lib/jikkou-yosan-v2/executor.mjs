/**
 * 実行予算 Ver.02 Phase C-1 — bulkRequest エグゼキュータ（純モジュール）。
 *
 * 安全設計:
 * - このモジュール自体はネットワークに触れない。実送信は注入された client の
 *   bulkRequest(requests) に完全委譲する（Node/ブラウザ両対応・環境非依存）。
 * - planner の凍結済みプラン（planAtomicBudgetSave / planVersionCopy /
 *   planActualsSave の戻り値）だけを受け付け、送信直前に App 735/736 ガードと
 *   20リクエスト上限を再検証する（defense in depth）。
 * - 送信は必ず 1 回の bulkRequest（分割コミット禁止）。失敗時の自動リトライは
 *   一切しない。revision 競合・ユニークキー衝突は ConflictAbortError
 *   （action=abort_reload）へ正規化して呼び出し側に再読込を強制する。
 */
import { ConflictAbortError, classifyUniqueKeyCollision, isRevisionMismatch } from "./conflict.mjs";
import { assertBulkRequestAllowedApps } from "./guard.mjs";
import { MAX_BULK_REQUESTS } from "./planner.mjs";

export const BULK_REQUEST_API = "/k/v1/bulkRequest.json";

const KNOWN_OPERATIONS = new Set([
  "atomic_budget_save",
  "version_copy",
  "actuals_save",
]);

/** 一意キー衝突の分類に使う既定フィールドコード群（存在するものだけ照合される）。 */
export const DEFAULT_UNIQUE_KEY_CODES = Object.freeze([
  "budget_version_id",
  "stable_block_id",
  "row_key",
  "detail_row_id",
  "actual_cell_id",
]);

/**
 * planner の戻り値であることを構造で検証する。プラン以外の生配列や
 * 手組みリクエストは拒否する（プラン経由以外の送信経路を作らない）。
 */
export function assertExecutablePlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    throw new TypeError("plan must be a planner result object");
  }
  if (!KNOWN_OPERATIONS.has(plan.operation)) {
    throw new TypeError(`plan.operation is unknown: ${JSON.stringify(plan.operation)}`);
  }
  if (!Object.isFrozen(plan) || !Object.isFrozen(plan.requests)) {
    throw new TypeError("plan and plan.requests must be frozen planner output");
  }
  if (!Array.isArray(plan.requests) || plan.requests.length === 0) {
    throw new TypeError("plan.requests must be a non-empty array");
  }
  if (plan.requests.length > MAX_BULK_REQUESTS) {
    throw new RangeError(
      `plan has ${plan.requests.length} requests, exceeding the ${MAX_BULK_REQUESTS}-request limit`,
    );
  }
  for (const [index, request] of plan.requests.entries()) {
    if (
      !request ||
      typeof request.method !== "string" ||
      typeof request.api !== "string" ||
      !request.payload ||
      typeof request.payload !== "object"
    ) {
      throw new TypeError(`plan.requests[${index}] is not a bulkRequest entry`);
    }
  }
  assertBulkRequestAllowedApps(plan.requests, `execute(${plan.operation})`);
  return plan;
}

function assertClient(client) {
  if (!client || typeof client.bulkRequest !== "function") {
    throw new TypeError(
      "client must expose bulkRequest(requests) — inject a kintone REST client adapter",
    );
  }
  return client;
}

function normalizeFailure(plan, error, uniqueKeyCodes) {
  if (error instanceof ConflictAbortError) return error;
  if (isRevisionMismatch(error)) {
    return new ConflictAbortError(
      "Revision mismatch during bulkRequest: the whole save was rejected atomically. Reload and re-plan; automatic retry is forbidden.",
      "revision_mismatch",
      { operation: plan.operation, cause: error },
    );
  }
  const collision = classifyUniqueKeyCollision(error, uniqueKeyCodes);
  if (collision) {
    return new ConflictAbortError(
      "Unique key collision during bulkRequest: the whole save was rejected atomically. Reload and re-plan; automatic retry is forbidden.",
      collision.reason,
      { operation: plan.operation, collidedKeys: collision.collidedKeys, cause: error },
    );
  }
  const wrapped = new Error(
    `bulkRequest failed for ${plan.operation}: ${formatBulkRequestFailure(error)}`,
  );
  wrapped.name = "BulkRequestExecutionError";
  wrapped.operation = plan.operation;
  wrapped.autoRetry = false;
  wrapped.cause = error;
  return wrapped;
}

const BULK_ERROR_TEXT_MAX = 900;

function compactJson(value) {
  try {
    const text = JSON.stringify(value);
    if (!text || text === "{}" || text === "[]") return "";
    return text.length > BULK_ERROR_TEXT_MAX
      ? `${text.slice(0, BULK_ERROR_TEXT_MAX)}…`
      : text;
  } catch {
    return "";
  }
}

/** kintone.api は Error ではなく { code, errors, results } で reject することがある。 */
export function formatBulkRequestFailure(error) {
  if (error == null) return "unknown error";
  if (typeof error === "string") return error;
  const bits = [];
  if (typeof error.message === "string" && error.message.trim()) {
    bits.push(error.message.trim());
  }
  if (typeof error.code === "string" && error.code) bits.push(error.code);
  if (error.errors) {
    const extra = compactJson(error.errors);
    if (extra) bits.push(extra);
  }
  if (Array.isArray(error.results)) {
    error.results.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      if (!item.code && !item.message && !item.errors) return;
      const piece = [
        `results[${index}]`,
        item.code || "",
        typeof item.message === "string" ? item.message : "",
        item.errors ? compactJson(item.errors) : "",
      ]
        .filter(Boolean)
        .join(" ");
      if (piece) bits.push(piece);
    });
  }
  const joined = bits.filter(Boolean).join(" | ");
  if (joined) return joined;
  const json = compactJson(error);
  if (json) return json;
  return Object.prototype.toString.call(error);
}

/**
 * プランを 1 回の bulkRequest として実行する。
 *
 * @param {object} plan planner の戻り値（凍結済み）
 * @param {{ bulkRequest: (requests: readonly object[]) => Promise<any> }} client
 * @param {{ uniqueKeyCodes?: string[] }} [options]
 * @returns {Promise<{ operation: string, requestCount: number, results: any }>}
 */
export async function executePlan(plan, client, options = {}) {
  assertExecutablePlan(plan);
  assertClient(client);
  const uniqueKeyCodes = options.uniqueKeyCodes ?? DEFAULT_UNIQUE_KEY_CODES;
  let response;
  try {
    response = await client.bulkRequest(plan.requests);
  } catch (error) {
    throw normalizeFailure(plan, error, uniqueKeyCodes);
  }
  const results = Array.isArray(response?.results) ? response.results : response;
  if (!Array.isArray(results) || results.length !== plan.requests.length) {
    const error = new Error(
      `bulkRequest for ${plan.operation} returned ${Array.isArray(results) ? results.length : "no"} results for ${plan.requests.length} requests — treat the save as unverified and reload`,
    );
    error.name = "BulkRequestResultMismatchError";
    error.operation = plan.operation;
    error.autoRetry = false;
    throw error;
  }
  return Object.freeze({
    operation: plan.operation,
    requestCount: plan.requests.length,
    results: Object.freeze([...results]),
  });
}

/**
 * kintone REST API 用の bulkRequest ボディ（{ requests: [...] }）を作る補助。
 * client アダプタ実装側で使う。ここでも送信はしない。
 */
export function buildBulkRequestBody(plan) {
  assertExecutablePlan(plan);
  return Object.freeze({
    requests: plan.requests.map((request) =>
      Object.freeze({ method: request.method, api: request.api, payload: request.payload }),
    ),
  });
}
