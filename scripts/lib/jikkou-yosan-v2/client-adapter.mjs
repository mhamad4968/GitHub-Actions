/**
 * 実行予算 Ver.02 Phase C-2a — kintone.api 用 client アダプタ。
 *
 * - kintone グローバルを直接参照しない。呼び出し側（App1 UI）が
 *   kintone.api 相当の関数を注入する（Node テストではモック関数）。
 * - 送信は executor.executePlan からの 1 回の bulkRequest のみ。
 *   ここではリトライ・分割・加工をしない。
 * - kintone.api の reject 値は Error ではなく素のオブジェクト
 *   （{ code, id, message, results:[...] }）のことがあるため、
 *   conflict.mjs のコード走査がそのまま効く形で透過させる。
 */
import { BULK_REQUEST_API } from "./executor.mjs";

export function createKintoneApiClient(apiFn) {
  if (typeof apiFn !== "function") {
    throw new TypeError(
      "createKintoneApiClient requires kintone.api-compatible function (url, method, params) => Promise",
    );
  }
  return Object.freeze({
    async bulkRequest(requests) {
      if (!Array.isArray(requests) || requests.length === 0) {
        throw new TypeError("bulkRequest requires a non-empty requests array");
      }
      const body = {
        requests: requests.map((request) => ({
          method: request.method,
          api: request.api,
          payload: request.payload,
        })),
      };
      return apiFn(BULK_REQUEST_API, "POST", body);
    },
  });
}
