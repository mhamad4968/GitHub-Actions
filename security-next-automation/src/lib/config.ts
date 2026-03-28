import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
/** `src/lib/config.ts` から見たこの npm パッケージのルート（.env を置く場所） */
const packageRoot = resolve(here, "..", "..");

const envMainPath = resolve(packageRoot, ".env");
const envLocalPath = resolve(packageRoot, ".env.local");

if (existsSync(envMainPath)) {
  loadDotenv({ path: envMainPath });
} else {
  console.warn(
    `[config] ${envMainPath} がありません。次で作成してください: cp .env.example .env`,
  );
}
if (existsSync(envLocalPath)) {
  loadDotenv({ path: envLocalPath, override: true });
}

/**
 * 環境変数を読み、起動直後に不足があれば例外にする（GitHub Actions のログにそのまま出る）
 */
export type AppConfig = {
  kintoneDomain: string;
  newsAppId: string;
  /** 空のときは collect のみ想定 */
  reportAppId: string;
  kintoneApiToken: string;
  /** analyze のとき必須。collect では未設定でもよい */
  openaiApiKey: string | undefined;
  openaiModel: string;
  rssUrl: string;
  notifyWebhookUrl: string | undefined;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (v === undefined || v.trim() === "") {
    throw new Error(
      [
        `環境変数 ${name} が未設定、または空です。`,
        `- ローカル: ${envMainPath} を開き、${name}=（実際の値） の行を埋めて保存してください。`,
        `- GitHub Actions: Repository secrets に ${name} を登録してください。`,
      ].join("\n"),
    );
  }
  return v.trim();
}

/**
 * 共通設定。OpenAI は collect では不要なため任意。
 */
export function loadConfig(): AppConfig {
  const key = process.env.OPENAI_API_KEY?.trim();
  return {
    kintoneDomain: requireEnv("KINTONE_DOMAIN").replace(/^https?:\/\//, "").replace(/\/$/, ""),
    newsAppId: requireEnv("KINTONE_APP_ID"),
    /** analyze で必須。collect のみなら空でもよい */
    reportAppId: process.env.KINTONE_REPORT_APP_ID?.trim() || "",
    kintoneApiToken: requireEnv("KINTONE_API_TOKEN"),
    openaiApiKey: key && key.length > 0 ? key : undefined,
    openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    rssUrl: process.env.SECURITY_NEXT_RSS_URL?.trim() || "https://www.security-next.com/feed",
    notifyWebhookUrl: process.env.NOTIFY_WEBHOOK_URL?.trim() || undefined,
  };
}

export function requireOpenAiKey(cfg: AppConfig): string {
  if (!cfg.openaiApiKey) {
    throw new Error("analyze には OPENAI_API_KEY が必要です。");
  }
  return cfg.openaiApiKey;
}
