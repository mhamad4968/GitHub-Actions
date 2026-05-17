import type { KintoneRestAPIClient } from "@kintone/rest-api-client";

import type { IctConfig } from "./config.js";
import { ICT_FIELDS, type IctCategory } from "./field-codes.js";
import { addDaysJstYmd, todayJstYmd } from "./jst-date.js";
import { escapeKintoneQueryString } from "./text.js";

const PAGE = 500;

/** 類似除外用: 過去12ヶ月のタイトル（最新150件） */
export const DEDUP_TITLE_LOOKBACK_DAYS = 365;
export const DEDUP_TITLE_MAX = 150;

/** 当日（JST）の登録件数 */
export async function countTodayRecords(
  client: KintoneRestAPIClient,
  cfg: IctConfig,
  todayYmd: string,
): Promise<number> {
  const q = `${ICT_FIELDS.published_at} = "${todayYmd}"`;
  const res = await client.record.getRecords({
    app: cfg.storeAppId,
    query: q,
    fields: ["$id"],
    totalCount: true,
  });
  const total = res.totalCount;
  if (typeof total === "string") return parseInt(total, 10) || 0;
  return typeof total === "number" ? total : (res.records?.length ?? 0);
}

/** 過去12ヶ月以内の登録済みタイトル（新しい順・最大150件） */
export async function fetchRecentTitlesForDedup(
  client: KintoneRestAPIClient,
  cfg: IctConfig,
  todayYmd: string = todayJstYmd(),
): Promise<string[]> {
  const since = addDaysJstYmd(todayYmd, -DEDUP_TITLE_LOOKBACK_DAYS);
  const q = `${ICT_FIELDS.published_at} >= "${since}" order by ${ICT_FIELDS.published_at} desc, $id desc limit ${DEDUP_TITLE_MAX}`;
  const res = await client.record.getRecords({
    app: cfg.storeAppId,
    query: q,
    fields: [ICT_FIELDS.title],
  });
  const titles: string[] = [];
  for (const rec of res.records ?? []) {
    const v = rec[ICT_FIELDS.title]?.value;
    if (typeof v === "string" && v.trim()) titles.push(v.trim());
  }
  return titles;
}

/** 登録済み URL 一覧（全期間・ページング） */
export async function fetchExistingUrls(
  client: KintoneRestAPIClient,
  cfg: IctConfig,
): Promise<Set<string>> {
  const urls = new Set<string>();
  let offset = 0;
  for (;;) {
    const res = await client.record.getRecords({
      app: cfg.storeAppId,
      query: `order by ${ICT_FIELDS.published_at} desc limit ${PAGE} offset ${offset}`,
      fields: [ICT_FIELDS.url],
    });
    for (const rec of res.records) {
      const v = rec[ICT_FIELDS.url]?.value;
      if (typeof v === "string" && v.trim()) urls.add(v.trim());
    }
    if (!res.records.length || res.records.length < PAGE) break;
    offset += PAGE;
  }
  return urls;
}

export type CuratedArticle = {
  title: string;
  url: string;
  overview: string;
  category: IctCategory;
  /** RSS 公開日（YYYY-MM-DD）。無い場合は収集日 */
  publishedAt: string;
};

/** kintone LINK: unique 有効時は最大 64 文字。正本は unique オフ＋アプリ側で重複排除。 */
export const KINTONE_URL_MAX_LEN = 512;

export function assertUrlFitsKintone(url: string): void {
  if (url.length > KINTONE_URL_MAX_LEN) {
    throw new Error(
      `URL が長すぎます（${url.length} 文字 > ${KINTONE_URL_MAX_LEN}）: ${url.slice(0, 80)}…`,
    );
  }
}

function formatKintoneError(e: unknown): string {
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const code = o.code ?? (Array.isArray(o.errors) ? (o.errors[0] as Record<string, unknown>)?.code : undefined);
    const message =
      o.message ?? (Array.isArray(o.errors) ? (o.errors[0] as Record<string, unknown>)?.message : undefined);
    return [code, message].filter(Boolean).join(" ") || JSON.stringify(o);
  }
  return String(e);
}

function logCuratedRecordContext(item: CuratedArticle, index: number): void {
  console.error(
    `[ICT収集] レコード context index=${index} urlLen=${item.url.length} category=${JSON.stringify(item.category)} title=${item.title.slice(0, 80)} url=${item.url.slice(0, 200)}`,
  );
}

/** 一括 addRecords 失敗時のみ 1 件ずつ切り分け（最大 5 件・CB_VA01 診断用。通常は一括のまま） */
export async function addCuratedRecords(
  client: KintoneRestAPIClient,
  cfg: IctConfig,
  fallbackYmd: string,
  items: CuratedArticle[],
): Promise<number[]> {
  if (items.length === 0) return [];
  for (const item of items) assertUrlFitsKintone(item.url);
  const records = items.map((item) => ({
    [ICT_FIELDS.title]: { value: item.title },
    [ICT_FIELDS.url]: { value: item.url },
    [ICT_FIELDS.published_at]: { value: item.publishedAt || fallbackYmd },
    [ICT_FIELDS.overview]: { value: item.overview },
    [ICT_FIELDS.category]: { value: item.category },
  }));
  try {
    const res = await client.record.addRecords({ app: cfg.storeAppId, records });
    return (res.ids ?? []).map((id) => Number(id));
  } catch (e) {
    const detail = formatKintoneError(e);
    const isCbVa01 = detail.includes("CB_VA01");
    if (!isCbVa01 || records.length <= 1) {
      logCuratedRecordContext(items[0]!, 0);
      throw new Error(`[ICT収集] kintone addRecords 失敗: ${detail}`);
    }
    console.warn(
      `[ICT収集] 一括登録が CB_VA01 で拒否されました。${records.length} 件を 1 件ずつ切り分けます。`,
    );
    const ids: number[] = [];
    for (let i = 0; i < records.length; i++) {
      try {
        const res = await client.record.addRecords({
          app: cfg.storeAppId,
          records: [records[i]!],
        });
        ids.push(Number(res.ids?.[0]));
      } catch (inner) {
        logCuratedRecordContext(items[i]!, i);
        throw new Error(
          `[ICT収集] kintone addRecords 失敗 index=${i}: ${formatKintoneError(inner)}`,
        );
      }
    }
    return ids;
  }
}

/** 単一 URL が存在するか（保険） */
export async function urlExists(
  client: KintoneRestAPIClient,
  cfg: IctConfig,
  url: string,
): Promise<boolean> {
  const q = `${ICT_FIELDS.url} = "${escapeKintoneQueryString(url)}"`;
  const res = await client.record.getRecords({
    app: cfg.storeAppId,
    query: `${q} limit 1`,
    fields: ["$id"],
  });
  return res.records.length > 0;
}
