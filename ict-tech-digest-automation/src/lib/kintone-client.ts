import { KintoneRestAPIClient } from "@kintone/rest-api-client";

import type { IctConfig } from "./config.js";

export function createKintoneClient(cfg: IctConfig): KintoneRestAPIClient {
  return new KintoneRestAPIClient({
    baseUrl: `https://${cfg.kintoneDomain}`,
    auth: { apiToken: cfg.kintoneApiToken },
  });
}
