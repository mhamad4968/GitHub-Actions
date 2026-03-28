import { KintoneRestAPIClient } from "@kintone/rest-api-client";

import type { AppConfig } from "./config.js";

/**
 * 同じ API トークンにニュース・レポート両アプリの権限を付ければ 1 クライアントで足りる
 */
export function createKintoneClient(cfg: AppConfig): KintoneRestAPIClient {
  return new KintoneRestAPIClient({
    baseUrl: `https://${cfg.kintoneDomain}`,
    auth: { apiToken: cfg.kintoneApiToken },
  });
}
