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
  openaiApiKey: string;
  openaiModel: string;
  rssFeedUrls: string[];
  dailyMaxRecords: number;
  notifyWebhookUrl: string | undefined;
};

const DEFAULT_RSS = [
  "https://qiita.com/popular-items/feed",
  "https://zenn.dev/feed",
  "https://b.hatena.ne.jp/hotentry/technology.rss",
  "https://rss.itmedia.co.jp/rss/2.0/ait.xml",
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
    process.env.KINTONE_API_TOKEN_COLLECT?.trim() ||
    process.env.KINTONE_API_TOKEN?.trim();
  if (!token) {
    throw new Error("KINTONE_API_TOKEN_COLLECT または KINTONE_API_TOKEN が必要です。");
  }

  return {
    kintoneDomain: normalizeDomain(domain),
    storeAppId,
    boardAppId: process.env.ICT_DIGEST_BOARD_APP_ID?.trim() || undefined,
    kintoneApiToken: token,
    openaiApiKey: requireEnv("OPENAI_API_KEY"),
    openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    rssFeedUrls: resolveRssUrls(),
    dailyMaxRecords: 5,
    notifyWebhookUrl: process.env.NOTIFY_WEBHOOK_URL?.trim() || undefined,
  };
}
