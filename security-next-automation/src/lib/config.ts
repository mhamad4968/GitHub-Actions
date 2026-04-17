import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
/** `src/lib/config.ts` から見たこの npm パッケージのルート（.env を置く場所） */
const packageRoot = resolve(here, "..", "..");

const envMainPath = resolve(packageRoot, ".env");
const envLocalPath = resolve(packageRoot, ".env.local");

/** collect トラブルシュート用（どのパスの .env が読まれるかの表示に使う） */
export const DOTENV_MAIN_PATH = envMainPath;
export const DOTENV_LOCAL_PATH = envLocalPath;

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
  /**
   * collect（ニュースアプリのみ）向けの API トークン。
   * KINTONE_API_TOKEN_COLLECT を優先し、無ければ KINTONE_API_TOKEN（従来・1 本またはカンマ区切りの先頭運用は kintone 側に任せる）。
   */
  kintoneApiTokenForCollect: string;
  /** analyze のとき必須。collect では未設定でもよい */
  openaiApiKey: string | undefined;
  openaiModel: string;
  /** ログ・後方互換用の先頭フィード URL（実際の一覧は rssFeedUrls） */
  rssUrl: string;
  /** 取得する RSS の URL 一覧（SECURITY_NEXT_RSS_URL または RSS_FEED_URLS で複数指定可） */
  rssFeedUrls: string[];
  /** 1 のとき NVD API 2.0 から CVE を併用取得する */
  collectNvdEnabled: boolean;
  /** NVD API キー（任意。無ければ低速レート） */
  nvdApiKey: string | undefined;
  /** NVD の公開日遡り日数 */
  nvdLookbackDays: number;
  /** 1 実行あたり NVD から採用する最大件数（TOP_N 前の候補プール） */
  nvdMaxPerRun: number;
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

/** https:// や末尾スラッシュ・パスを除き、ホスト名だけにそろえる */
function normalizeKintoneDomain(raw: string): string {
  const s = raw.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const host = s.split("/")[0]?.trim() || "";
  return host;
}

/**
 * kintone ドメイン（ホスト名のみ）。
 * KINTONE_DOMAIN を優先し、無ければ KINTONE_BASE_URL（フル URL 可）を読む（GitHub のリポジトリ変数と名前をそろえやすくするため）。
 */
function resolveKintoneDomain(): string {
  const direct = process.env.KINTONE_DOMAIN?.trim();
  if (direct) return normalizeKintoneDomain(direct);
  const base = process.env.KINTONE_BASE_URL?.trim();
  if (base) return normalizeKintoneDomain(base);
  throw new Error(
    [
      "kintone のドメイン（ホスト名）がありません。",
      `- ローカル: ${envMainPath} に KINTONE_DOMAIN=（例: xxx.cybozu.com）を設定するか、`,
      "  KINTONE_BASE_URL=https://xxx.cybozu.com のどちらかを設定してください。",
      "- GitHub Actions: Environment kintone-collect の secrets に KINTONE_DOMAIN を設定してください。",
    ].join("\n"),
  );
}

/**
 * ニュースアプリ ID。KINTONE_APP_ID を優先し、無ければ KINTONE_APP（Actions の Secret 名と同じ）を読む。
 */
function resolveNewsAppId(): string {
  const id =
    process.env.KINTONE_APP_ID?.trim() ||
    process.env.KINTONE_APP?.trim();
  if (!id) {
    throw new Error(
      [
        "ニュースアプリ ID がありません。",
        `- ローカル: ${envMainPath} に KINTONE_APP_ID= を設定するか、GitHub と同じ名前の KINTONE_APP= を設定してください。`,
        "- GitHub Actions: Secret 名は KINTONE_APP（値はアプリ ID）。ワークフローで KINTONE_APP_ID として渡ります。",
      ].join("\n"),
    );
  }
  return id;
}

/**
 * collect 用トークン。専用 Secret があればそれを使い、無ければ従来の 1 本運用。
 */
function resolveApiTokenForCollect(): string {
  const dedicated = process.env.KINTONE_API_TOKEN_COLLECT?.trim();
  if (dedicated) return dedicated;
  const legacy = process.env.KINTONE_API_TOKEN?.trim();
  if (legacy) return legacy;
  throw new Error(
    [
      "collect 用の kintone API トークンがありません。",
      "次のいずれかを設定してください: KINTONE_API_TOKEN_COLLECT（ニュース保存アプリ・GitHub と同じ Secret 名）、",
      "または従来どおり KINTONE_API_TOKEN（1 アプリ／または公式どおりカンマ区切りで複数）。",
      `- ローカル: ${envMainPath} に上記いずれかを追記してください（値は GitHub Environment「kintone-collect」からコピー可）。`,
    ].join("\n"),
  );
}

/**
 * analyze はニュースアプリを読み、レポートアプリに書くため「複数アプリのトークン」が要る。
 * - 2 Secret 運用: KINTONE_API_TOKEN_COLLECT（631 等）+ KINTONE_API_TOKEN_ANALYZE（632 等）を配列で渡す。
 * - 従来: KINTONE_API_TOKEN にカンマ区切りで複数トークンを 1 つにまとめる。
 */
export function resolveApiTokenForAnalyze(): string | string[] {
  const collect = process.env.KINTONE_API_TOKEN_COLLECT?.trim();
  const analyze = process.env.KINTONE_API_TOKEN_ANALYZE?.trim();
  const legacy = process.env.KINTONE_API_TOKEN?.trim();
  // 同一文字列を 2 本渡すと Kintone が GAIA_DA03（重複トークン）で拒否する
  if (collect && analyze) {
    if (collect === analyze) return collect;
    return [collect, analyze];
  }
  if (collect && !analyze) return collect;
  if (!collect && analyze) return analyze;
  if (legacy) return legacy;
  throw new Error(
    [
      "analyze 用の kintone API トークンがありません。",
      "次のいずれかを設定してください:",
      "(A) KINTONE_API_TOKEN_COLLECT と KINTONE_API_TOKEN_ANALYZE の両方（ニュース用・レポート用）",
      "(B) または従来どおり KINTONE_API_TOKEN（カンマ区切りで複数アプリのトークンを 1 Secret にまとめる）",
    ].join("\n"),
  );
}

/** 改行・カンマ・セミコロン区切りで複数 RSS URL を解決する */
function resolveRssFeedUrls(): string[] {
  const primaryList = process.env.RSS_FEED_URLS?.trim();
  const legacyOrSingle =
    primaryList ||
    process.env.SECURITY_NEXT_RSS_URL?.trim() ||
    "https://www.security-next.com/feed";
  const parts = legacyOrSingle
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
  const uniq = [...new Set(parts)];
  return uniq.length > 0 ? uniq : ["https://www.security-next.com/feed"];
}

/**
 * 共通設定。collect は OpenAI 不要。analyze は resolveApiTokenForAnalyze と別途組み合わせる。
 */
export function loadConfig(): AppConfig {
  const key = process.env.OPENAI_API_KEY?.trim();
  const rssFeedUrls = resolveRssFeedUrls();
  const nvdFlag = process.env.COLLECT_NVD_ENABLE?.trim().toLowerCase();
  const collectNvdEnabled =
    nvdFlag === "1" || nvdFlag === "true" || nvdFlag === "yes";
  const nvdLookRaw = process.env.NVD_LOOKBACK_DAYS?.trim();
  const nvdMaxRaw = process.env.NVD_MAX_PER_RUN?.trim();
  return {
    kintoneDomain: resolveKintoneDomain(),
    newsAppId: resolveNewsAppId(),
    /** analyze で必須。collect のみなら空でもよい */
    reportAppId: process.env.KINTONE_REPORT_APP_ID?.trim() || "",
    kintoneApiTokenForCollect: resolveApiTokenForCollect(),
    openaiApiKey: key && key.length > 0 ? key : undefined,
    openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    rssUrl: rssFeedUrls[0] || "https://www.security-next.com/feed",
    rssFeedUrls,
    collectNvdEnabled,
    nvdApiKey: process.env.NVD_API_KEY?.trim() || undefined,
    nvdLookbackDays:
      nvdLookRaw && /^\d+$/.test(nvdLookRaw) ? Math.max(1, parseInt(nvdLookRaw, 10)) : 7,
    nvdMaxPerRun:
      nvdMaxRaw && /^\d+$/.test(nvdMaxRaw) ? Math.max(1, parseInt(nvdMaxRaw, 10)) : 50,
    notifyWebhookUrl: process.env.NOTIFY_WEBHOOK_URL?.trim() || undefined,
  };
}

export function requireOpenAiKey(cfg: AppConfig): string {
  if (!cfg.openaiApiKey) {
    throw new Error("analyze には OPENAI_API_KEY が必要です。");
  }
  return cfg.openaiApiKey;
}

/** analyze（Gemini）用。collect は体裁整形で任意利用（`GEMINI_API_KEY` 参照） */
export function requireGeminiApiKey(): string {
  const k = process.env.GEMINI_API_KEY?.trim();
  if (!k) {
    throw new Error(
      [
        "analyze（Gemini 週次要約）には GEMINI_API_KEY が必要です。",
        `- ローカル: ${envMainPath} に GEMINI_API_KEY= を追記してください。`,
        "- GitHub Actions: Environment または Repository の secrets に GEMINI_API_KEY を登録してください。",
      ].join("\n"),
    );
  }
  return k;
}
