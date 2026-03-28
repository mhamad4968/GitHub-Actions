import { KintoneRestAPIClient } from "@kintone/rest-api-client";

import type { AppConfig } from "./config.js";

/**
 * KINTONE_DOMAIN を REST クライアント用の origin（https://ホスト[:ポート]）にそろえる。
 * 前後の空白・既存の https:// 重複・末尾スラッシュなどで new URL が失敗しないようにする。
 */
function normalizeKintoneBaseUrl(domainOrHost: string): string {
  let s = domainOrHost.trim().replace(/\u200b/g, ""); // ゼロ幅スペースも除く
  if (!s) {
    throw new TypeError("KINTONE_DOMAIN が空です（trim 後）。");
  }
  s = s.replace(/^https?:\/\//i, "");
  s = s.replace(/\/+$/, "");
  s = s.replace(/\/k\/?$/i, "");
  const withHttps = `https://${s}`;
  let parsed: URL;
  try {
    parsed = new URL(withHttps);
  } catch {
    throw new TypeError(
      `Invalid URL: KINTONE_DOMAIN を解釈できません。値=${JSON.stringify(domainOrHost)}`,
    );
  }
  if (!parsed.hostname) {
    throw new TypeError(
      `Invalid URL: ホスト名がありません。値=${JSON.stringify(domainOrHost)}`,
    );
  }
  return parsed.origin;
}

/**
 * REST API クライアントを作る。apiToken は 1 本の文字列または複数（ニュース＋レポートの 2 アプリ運用）。
 * 複数アプリのトークンは kintone 仕様どおりヘッダに渡す（@kintone/rest-api-client は string | string[] を受け付ける）。
 */
export function createKintoneClient(
  cfg: AppConfig,
  apiToken: string | string[],
): KintoneRestAPIClient {
  const baseUrl = normalizeKintoneBaseUrl(cfg.kintoneDomain);
  return new KintoneRestAPIClient({
    baseUrl,
    auth: { apiToken },
  });
}
