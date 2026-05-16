import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..", "..");

const envMainPath = resolve(packageRoot, ".env");
const envLocalPath = resolve(packageRoot, ".env.local");

export const DOTENV_MAIN_PATH = envMainPath;

if (existsSync(envMainPath)) {
  loadDotenv({ path: envMainPath });
} else {
  console.warn(`[設定] ${envMainPath} がありません。.env.example をコピーして .env を作成してください。`);
}
if (existsSync(envLocalPath)) {
  loadDotenv({ path: envLocalPath, override: true });
}

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
  // @IT Coding Edge（モダン開発・内製化）
  "https://rss.itmedia.co.jp/rss/2.0/ait_coding.xml",
  // CodeZine（プログラム・開発手法）
  "https://codezine.jp/rss/new/index.xml",
  // CNET Japan（企業・ITベンダー動向）
  "https://feeds.japan.cnet.com/rss/cnet/all.rdf",
  "https://msrc.microsoft.com/blog/rss/",
  // MSRC Update Guide（月例パッチ・CVE 公式フィード）
  "https://api.msrc.microsoft.com/update-guide/rss",
  "https://blogs.windows.com/feed/",
  "https://www.microsoft.com/en-us/security/blog/feed/",
  "https://www.ipa.go.jp/security/rss/alert.rdf",
  // IPA 新着（DX・人材・調査等・セキュリティ以外の公式告知）
  "https://www.ipa.go.jp/about/newsonly-rss.rdf",
  "https://www.jpcert.or.jp/rss/jpcert.rdf",
  "https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf",
  "https://internet.watch.impress.co.jp/data/rss/1.0/iw/feed.rdf",
  "https://forest.watch.impress.co.jp/data/rss/1.0/wf/feed.rdf",
  // ASCII.jp TECH（エンタープライズ IT・製品動向）
  "https://ascii.jp/tech/rss.xml",
  // ZDNet Japan（サーバー・ストレージ・仮想化・DC）
  "https://feeds.japan.zdnet.com/rss/zdnet/all.rdf",
  // ITmedia PC USER（法人向け PC・Windows）
  "https://rss.itmedia.co.jp/rss/2.0/pcuser.xml",
  // @IT Master of IP Network（ルーター・VPN・Wi-Fi 等）
  "https://rss.itmedia.co.jp/rss/2.0/ait_network.xml",
  // @IT Server & Storage（ブレード・仮想化基盤の補完）
  "https://rss.itmedia.co.jp/rss/2.0/ait_server.xml",
  // ITmedia NETWORK
  "https://rss.itmedia.co.jp/rss/2.0/nw.xml",
  // 日経クロステック IT（通信回線・5G・キャリア等）
  "https://xtech.nikkei.com/rss/xtech-it.rdf",
  // 日経クロステック 全記事（スキル・資格・IT経営・DX人材は IT 分野と併用）
  "https://xtech.nikkei.com/rss/index.rdf",
  // ITmedia エンタープライズ（情シス・資格・IT部門）
  "https://rss.itmedia.co.jp/rss/2.0/enterprise.xml",
  "https://rss.itmedia.co.jp/rss/2.0/ep_casestudy.xml",
  "https://rss.itmedia.co.jp/rss/2.0/ep_snews.xml",
];

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(
      `環境変数 ${name} が未設定です。ローカルは ${envMainPath}、GitHub Actions は Secrets を確認してください。`,
    );
  }
  return v;
}

function normalizeDomain(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "").split("/")[0] ?? "";
}

function resolveRssUrls(): string[] {
  const raw = process.env.RSS_FEED_URLS?.trim();
  if (!raw) return [...DEFAULT_RSS];
  const parts = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
  return parts.length > 0 ? [...new Set(parts)] : [...DEFAULT_RSS];
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
    process.env.KINTONE_APP_ID?.trim() || process.env.KINTONE_APP?.trim();
  if (!storeAppId) {
    throw new Error("KINTONE_APP_ID（正本アプリ ID）が必要です。");
  }

  const token =
    process.env.KINTONE_API_TOKEN_ICT_COLLECT?.trim() ||
    process.env.KINTONE_API_TOKEN_COLLECT?.trim() ||
    process.env.KINTONE_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "KINTONE_API_TOKEN_ICT_COLLECT / KINTONE_API_TOKEN_COLLECT / KINTONE_API_TOKEN のいずれかが必要です。",
    );
  }

  return {
    kintoneDomain: normalizeDomain(domain),
    storeAppId,
    boardAppId: process.env.ICT_DIGEST_BOARD_APP_ID?.trim() || undefined,
    kintoneApiToken: token,
    geminiApiKey: requireEnv("GEMINI_API_KEY"),
    geminiModel: process.env.GEMINI_MODEL?.trim() || undefined,
    rssFeedUrls: resolveRssUrls(),
    dailyMaxRecords: 5,
    notifyWebhookUrl: process.env.NOTIFY_WEBHOOK_URL?.trim() || undefined,
  };
}
