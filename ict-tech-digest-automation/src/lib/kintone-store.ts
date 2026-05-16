import type { KintoneRestAPIClient } from "@kintone/rest-api-client";

import type { IctConfig } from "./config.js";
import { ICT_FIELDS, type IctCategory } from "./field-codes.js";
import { escapeKintoneQueryString } from "./text.js";
import { todayJstYmd } from "./jst-date.js";

const PAGE = 500;

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
  const res = await client.record.addRecords({ app: cfg.storeAppId, records });
  return (res.ids ?? []).map((id) => Number(id));
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
