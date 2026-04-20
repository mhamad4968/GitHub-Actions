/**
 * 複数アプリで使い回す kintone REST ユーティリティ（Node のスクリプト想定）。
 *
 * - **環境変数**: 既存 `scripts/` と同様に `KINTONE_BASE_URL`（末尾 `/k` は可）、
 *   `KINTONE_USERNAME` / `KINTONE_PASSWORD`、任意で `KINTONE_BASIC_AUTH_*`。
 *   API トークンのみ運用する場合は `KINTONE_API_TOKEN` をセットし、ユーザー名・パスワードは不要。
 * - **dotenv**: 本モジュールは自動で `.env` を読まない。スクリプト先頭で `import "dotenv/config"` するか、
 *   `npm run` で `dotenv -e .env` を付けた既存パターンに合わせる。
 * - **ゲストスペース**: 必要なら `KINTONE_GUEST_SPACE_ID`（数値または文字列）をセット。
 */
/// <reference path="../types/kintone-js-api-reference.d.ts" />

import { KintoneRestAPIClient } from "@kintone/rest-api-client";

/** scripts/*.js と同じく baseUrl を正規化する（トリム・末尾スラッシュ・末尾 `/k` 除去）。 */
export function normalizeLabBaseUrl(raw: string): string {
  let baseUrl = raw.trim().replace(/\/+$/, "");
  baseUrl = baseUrl.replace(/\/k$/, "");
  return baseUrl;
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v || String(v).trim() === "") {
    throw new Error(`Missing env var: ${key}`);
  }
  return String(v);
}

/** コンストラクタ用オプション（Node では baseUrl / auth が実質必須）。 */
export type LabRestClientOptions = NonNullable<
  ConstructorParameters<typeof KintoneRestAPIClient>[0]
>;

/** `KintoneRestAPIClient` コンストラクタに渡す形で、ラボ標準の .env からオプションを組み立てる。 */
export function buildLabRestClientOptions(): LabRestClientOptions {
  const baseUrl = normalizeLabBaseUrl(requireEnv("KINTONE_BASE_URL"));

  const token = process.env.KINTONE_API_TOKEN;
  let auth: { username: string; password: string } | { apiToken: string };
  if (token != null && String(token).trim() !== "") {
    auth = { apiToken: String(token).trim() };
  } else {
    auth = {
      username: requireEnv("KINTONE_USERNAME"),
      password: requireEnv("KINTONE_PASSWORD"),
    };
  }

  const guestRaw = process.env.KINTONE_GUEST_SPACE_ID;
  const guestSpaceId =
    guestRaw != null && String(guestRaw).trim() !== ""
      ? /^\d+$/.test(String(guestRaw).trim())
        ? Number(String(guestRaw).trim())
        : String(guestRaw).trim()
      : undefined;

  const bu = process.env.KINTONE_BASIC_AUTH_USERNAME;
  const bp = process.env.KINTONE_BASIC_AUTH_PASSWORD;
  const basicAuth =
    bu && bp
      ? { username: String(bu), password: String(bp) }
      : undefined;

  return {
    baseUrl,
    auth,
    ...(guestSpaceId !== undefined ? { guestSpaceId } : {}),
    ...(basicAuth ? { basicAuth } : {}),
  };
}

/**
 * ラボ標準 `.env` から `KintoneRestAPIClient` を生成する。
 * 空の `new KintoneRestAPIClient()` に頼らず、認証・baseUrl・Basic・ゲストをここで揃える。
 */
export function createKintoneClientFromLabEnv(
  overrides?: Partial<LabRestClientOptions>,
): KintoneRestAPIClient {
  const base = buildLabRestClientOptions();
  return new KintoneRestAPIClient({
    ...base,
    ...overrides,
    auth: overrides?.auth ?? base.auth,
    basicAuth: overrides?.basicAuth ?? base.basicAuth,
  });
}

/** 500 件超も `getAllRecords` で取り切る（公式クライアントの再帰／カーソル処理に委ねる）。 */
export async function getAllRecords(
  client: KintoneRestAPIClient,
  appId: string | number,
  options?: { condition?: string; fields?: string[]; orderBy?: string },
) {
  return client.record.getAllRecords({
    app: appId,
    condition: options?.condition ?? "",
    ...(options?.fields ? { fields: options.fields } : {}),
    ...(options?.orderBy ? { orderBy: options.orderBy } : {}),
  });
}

/** キーフィールド値で 1 件更新（`updateKey`）。 */
export async function updateRecordByKey(
  client: KintoneRestAPIClient,
  appId: string | number,
  updateKeyField: string,
  keyValue: string,
  record: Record<string, { value: unknown }>,
): Promise<{ revision: string }> {
  return client.record.updateRecord({
    app: appId,
    updateKey: { field: updateKeyField, value: keyValue },
    record,
  });
}

/**
 * レコード画面カスタマイズ用。スペースフィールドの **elementId** にメッセージを出す。無ければ `alert`。
 *
 * - **設計とセット**: `error-display` などのスペースがフォームに無いと **常に alert** になる。
 * - Node では `kintone` 未定義のため `console.error` のみ。
 */
export function showErrorInSpaceOrAlert(
  message: string,
  spaceElementId = "error-display",
): void {
  if (typeof kintone === "undefined") {
    console.error(`[showErrorInSpaceOrAlert] ${message}`);
    return;
  }
  const el = kintone.app.record.getSpaceElement(spaceElementId);
  if (el) {
    el.textContent = message;
    el.style.color = "red";
  } else {
    globalThis.alert(message);
  }
}

/** プロンプト例向け: まとめて export（個別関数のラッパー）。 */
export const KintoneCommon = {
  normalizeLabBaseUrl,
  buildLabRestClientOptions,
  createKintoneClientFromLabEnv,
  getAllRecords,
  updateRecordByKey,
  showErrorInSpaceOrAlert,
};
