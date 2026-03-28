import { KintoneRestAPIClient } from "@kintone/rest-api-client";

import type { AppConfig } from "./config.js";

/**
 * REST API クライアントを作る。apiToken は 1 本の文字列または複数（ニュース＋レポートの 2 アプリ運用）。
 * 複数アプリのトークンは kintone 仕様どおりヘッダに渡す（@kintone/rest-api-client は string | string[] を受け付ける）。
 */
export function createKintoneClient(
  cfg: AppConfig,
  apiToken: string | string[],
): KintoneRestAPIClient {
  return new KintoneRestAPIClient({
    baseUrl: `https://${cfg.kintoneDomain}`,
    auth: { apiToken },
  });
}
