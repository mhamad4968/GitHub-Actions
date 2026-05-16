import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveFeedUrl } from "./rss-fetch.js";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..", "..");
const monorepoRoot = resolve(packageRoot, "..");

const envMainPath = resolve(packageRoot, ".env");
const envLocalPath = resolve(packageRoot, ".env.local");
const monorepoEnvPath = resolve(monorepoRoot, ".env");
const monorepoProxyPath = resolve(monorepoRoot, ".env.proxy");

export const DOTENV_MAIN_PATH = envMainPath;

/** リポルート .env → package .env の順（後勝ち） */
function loadEnvFiles(): void {
  const chain = [monorepoEnvPath, monorepoProxyPath, envMainPath, envLocalPath];
  let any = false;
  for (const p of chain) {
    if (existsSync(p)) {
      loadDotenv({ path: p, override: any });
      any = true;
    }
  }
  if (!existsSync(envMainPath) && !existsSync(monorepoEnvPath)) {
    console.warn(
      `[設定] ${envMainPath} および ${monorepoEnvPath} がありません。.env.example を参照してください。`,
    );
  }
}

loadEnvFiles();

export type IctConfig = {
  kintoneDomain: string;
  storeAppId: string;
  boardAppId: string | undefined;
  kintoneApiToken: string;
  geminiApiKey: string;
  geminiModel: string | undefined;
  rssFeedUrls: string[];
  dailyMaxRecords: number;
  notifyWebhookUrl: string | undefined;
};

/** 情シス向け: 開発トレンド + Microsoft/PC + セキュリティ公式（631 Security NEXT とは別系統） */
const DEFAULT_RSS = [
  "https://qiita.com/popular-items/feed",
  "https://zenn.dev/feed",
  "https://b.hatena.ne.jp/hotentry/it.rss",
  "https://rss.itmedia.co.jp/rss/2.0/ait.xml",
  "https://rss.itmedia.co.jp/rss/2.0/ait_coding.xml",
  "https://codezine.jp/rss/new/index.xml",
  "https://feeds.japan.cnet.com/rss/cnet/all.rdf",
  "https://msrc.microsoft.com/feed/",
  "https://api.msrc.microsoft.com/update-guide/rss",
  "https://blogs.windows.com/feed/",
  "https://www.microsoft.com/en-us/security/blog/feed/",
  "https://www.ipa.go.jp/security/rss/alert.rdf",
  "https://www.ipa.go.jp/about/newsonly-rss.rdf",
  "https://www.jpcert.or.jp/rss/jpcert.rdf",
  "https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf",
  "https://internet.watch.impress.co.jp/data/rss/1.0/iw/feed.rdf",
  "https://forest.watch.impress.co.jp/data/rss/1.0/wf/feed.rdf",
  "https://ascii.jp/tech/rss.xml",
  "https://feeds.japan.zdnet.com/rss/zdnet/all.rdf",
  "https://rss.itmedia.co.jp/rss/2.0/pcuser.xml",
  "https://rss.itmedia.co.jp/rss/2.0/ait_network.xml",
  "https://rss.itmedia.co.jp/rss/2.0/ait_server.xml",
  "https://rss.itmedia.co.jp/rss/2.0/news_nettopics.xml",
  "https://xtech.nikkei.com/rss/xtech-it.rdf",
  "https://xtech.nikkei.com/rss/index.rdf",
  "https://rss.itmedia.co.jp/rss/2.0/enterprise.xml",
  "https://rss.itmedia.co.jp/rss/2.0/ep_casestudy.xml",
  "https://rss.itmedia.co.jp/rss/2.0/ep_snews.xml",
];

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(
      `環境変数 ${name} が未設定です。ローカルは ${monorepoEnvPath} または ${envMainPath}、GHA は Secrets を確認してください。`,
    );
  }
  return v;
}

function normalizeDomain(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "").split("/")[0] ?? "";
}

/**
 * 環境変数の RSS 一覧を正規化（旧 URL エイリアス・重複除去）
 */
export function resolveRssUrls(): string[] {
  const raw =
    process.env.ICT_RSS_FEED_URLS?.trim() || process.env.RSS_FEED_URLS?.trim();
  if (!raw) return [...DEFAULT_RSS];
  const parts = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .map(resolveFeedUrl);
  const unique = [...new Set(parts)];
  return unique.length > 0 ? unique : [...DEFAULT_RSS];
}

/** 631 用 KINTONE_API_TOKEN_COLLECT の誤流用を防ぐ */
function resolveStoreApiToken(storeAppId: string): string {
  const ict = process.env.KINTONE_API_TOKEN_ICT_COLLECT?.trim();
  if (ict) return ict;

  const collect = process.env.KINTONE_API_TOKEN_COLLECT?.trim();
  if (collect && storeAppId === "685") {
    throw new Error(
      "KINTONE_API_TOKEN_COLLECT は他アプリ(631等)用の可能性があります。685 用の KINTONE_API_TOKEN_ICT_COLLECT を monorepo .env または GHA Secrets に設定してください。",
    );
  }

  const generic = process.env.KINTONE_API_TOKEN?.trim();
  if (generic) {
    console.warn(
      "[設定] KINTONE_API_TOKEN_ICT_COLLECT 未設定のため KINTONE_API_TOKEN を使用します（685 用であることを確認）。",
    );
    return generic;
  }

  throw new Error(
    "KINTONE_API_TOKEN_ICT_COLLECT（推奨）または 685 専用の KINTONE_API_TOKEN が必要です。",
  );
}

export function loadConfig(): IctConfig {
  const domain =
    process.env.KINTONE_DOMAIN?.trim() ||
    (process.env.KINTONE_BASE_URL?.trim()
      ? normalizeDomain(process.env.KINTONE_BASE_URL)
      : "");
  if (!domain) {
    throw new Error("KINTONE_DOMAIN または KINTONE_BASE_URL が必要です。");
  }

  const storeAppId =
    process.env.ICT_DIGEST_STORE_APP_ID?.trim() ||
    process.env.KINTONE_APP_ID?.trim() ||
    process.env.KINTONE_APP?.trim();
  if (!storeAppId) {
    throw new Error("KINTONE_APP_ID / ICT_DIGEST_STORE_APP_ID（正本 685）が必要です。");
  }

  return {
    kintoneDomain: normalizeDomain(domain),
    storeAppId,
    boardAppId: process.env.ICT_DIGEST_BOARD_APP_ID?.trim() || "686",
    kintoneApiToken: resolveStoreApiToken(storeAppId),
    geminiApiKey: requireEnv("GEMINI_API_KEY"),
    geminiModel: process.env.GEMINI_MODEL?.trim() || undefined,
    rssFeedUrls: resolveRssUrls(),
    dailyMaxRecords: 5,
    notifyWebhookUrl: process.env.NOTIFY_WEBHOOK_URL?.trim() || undefined,
  };
}
