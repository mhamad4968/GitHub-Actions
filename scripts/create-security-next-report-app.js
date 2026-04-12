/**
 * Security NEXT 週次要約用アプリだけをスペース 48 に作る（ニュース用 630/631 は触らない）。
 * analyze.ts が期待するフィールド: target_week, weekly_trend, summary_one_line, internal_*（件数・$id 範囲・実行日時・run_id）。詳細は field-codes.ts / security-next-weekly-report-app-design.csv。
 *
 * 実行例:
 *   cd /path/to/kintone-ai-lab && npm run setup:security-next-report-app
 *
 * 完了後、表示された KINTONE_REPORT_APP_ID を security-next-automation/.env と GitHub Secrets に設定し、
 * 既存の API トークンに「このアプリ」の権限を追加する。
 */
import "dotenv/config";

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === "") throw new Error(`環境変数がありません: ${key}`);
  return String(v);
}

let baseUrl = requireEnv("KINTONE_BASE_URL").trim().replace(/\/+$/, "");
baseUrl = baseUrl.replace(/\/k$/, "");
const user = requireEnv("KINTONE_USERNAME");
const pass = requireEnv("KINTONE_PASSWORD");

const headers = {
  "X-Cybozu-Authorization": Buffer.from(`${user}:${pass}`, "utf8").toString("base64"),
  "Content-Type": "application/json",
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, "utf8").toString("base64")}`;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ""} ${json.message || ""}`.trim() : text.slice(0, 1200);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitDeploy(appNum) {
  const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  stUrl.searchParams.set("apps[0]", String(appNum));
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(stUrl, { method: "GET", headers: { ...headers, "Content-Type": undefined } });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === "SUCCESS") return;
    if (status === "FAIL" || status === "CANCEL") throw new Error(`デプロイ状態: ${status}`);
    await sleep(1000);
  }
  throw new Error("デプロイがタイムアウトしました（PROCESSING のまま）。");
}

/** @param {number} spaceId */
async function resolveDefaultThreadId(spaceId) {
  const override = process.env.KINTONE_SPACE_DEFAULT_THREAD;
  if (override && /^\d+$/.test(override)) return Number(override);
  const u = new URL(`${baseUrl}/k/v1/space.json`);
  u.searchParams.set("id", String(spaceId));
  const sp = await fetchJson(u, { method: "GET", headers: { ...headers, "Content-Type": undefined } });
  const dt = sp?.defaultThread;
  if (!dt || String(dt).trim() === "") {
    throw new Error(`スペース ${spaceId} に defaultThread がありません（マルチスレッド設定を確認）`);
  }
  return Number(dt);
}

/** field-codes.ts の REPORT_FIELDS と一致（新規アプリ作成時のみ一括投入） */
const REPORT_FIELD_DEFS = {
  target_week: {
    type: "DATE",
    code: "target_week",
    label: "対象週",
    noLabel: false,
    required: false,
    unique: false,
    defaultValue: "",
    defaultNowValue: false,
  },
  weekly_trend: {
    type: "RICH_TEXT",
    code: "weekly_trend",
    label: "今週の傾向と対策",
    noLabel: false,
    required: false,
    defaultValue: "",
  },
  summary_one_line: {
    type: "SINGLE_LINE_TEXT",
    code: "summary_one_line",
    label: "週次サマリー1行",
    noLabel: false,
    required: false,
    minLength: "",
    maxLength: "",
    expression: "",
    hideExpression: false,
    unique: false,
    defaultValue: "",
  },
  internal_ref_news_count: {
    type: "NUMBER",
    code: "internal_ref_news_count",
    label: "参照631件数（内部）",
    noLabel: false,
    required: false,
    minValue: "",
    maxValue: "",
    digit: false,
    unique: false,
    defaultValue: "",
    displayScale: "",
    unit: "",
    unitPosition: "BEFORE",
  },
  internal_ref_record_id_min: {
    type: "NUMBER",
    code: "internal_ref_record_id_min",
    label: "参照631レコード番号最小（内部）",
    noLabel: false,
    required: false,
    minValue: "",
    maxValue: "",
    digit: false,
    unique: false,
    defaultValue: "",
    displayScale: "",
    unit: "",
    unitPosition: "BEFORE",
  },
  internal_ref_record_id_max: {
    type: "NUMBER",
    code: "internal_ref_record_id_max",
    label: "参照631レコード番号最大（内部）",
    noLabel: false,
    required: false,
    minValue: "",
    maxValue: "",
    digit: false,
    unique: false,
    defaultValue: "",
    displayScale: "",
    unit: "",
    unitPosition: "BEFORE",
  },
  internal_analysis_run_at: {
    type: "DATETIME",
    code: "internal_analysis_run_at",
    label: "分析実行日時（内部）",
    noLabel: false,
    required: false,
    unique: false,
    defaultValue: "",
    defaultNowValue: false,
  },
  internal_github_run_id: {
    type: "SINGLE_LINE_TEXT",
    code: "internal_github_run_id",
    label: "GitHub run_id（内部）",
    noLabel: false,
    required: false,
    minLength: "",
    maxLength: "",
    expression: "",
    hideExpression: false,
    unique: false,
    defaultValue: "",
  },
};

async function createAppDeployFields(appName, properties) {
  const spaceId = Number(process.env.KINTONE_SECURITY_NEXT_SPACE_ID || "48");
  const threadId = await resolveDefaultThreadId(spaceId);

  console.log(`[report-app] スペース ${spaceId} defaultThread=${threadId} に「${appName}」を作成します…`);

  const addAppUrl = new URL(`${baseUrl}/k/v1/preview/app.json`);
  const addAppRes = await fetchJson(addAppUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: appName, space: spaceId, thread: threadId }),
  });

  const appId = Number(addAppRes.app);
  if (!Number.isFinite(appId) || appId <= 0) {
    throw new Error(`アプリ作成の応答が不正: ${JSON.stringify(addAppRes)}`);
  }

  console.log(`[report-app] アプリ作成 appId=${appId} revision=${addAppRes.revision}`);

  const postFieldsUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
  const fieldsRes = await fetchJson(postFieldsUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  const revision = fieldsRes.revision;
  console.log(`[report-app] フィールド追加済み revision=${revision}`);

  const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  await fetchJson(depUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision }] }),
  });
  await waitDeploy(appId);
  console.log(`[report-app] デプロイ成功 appId=${appId}`);

  return { appId, recordUrl: `${baseUrl}/k/${appId}/` };
}

console.log(`[report-app] Base URL: ${baseUrl}`);
const reportName = process.env.KINTONE_SECURITY_NEXT_REPORT_APP_NAME || "ニュース週次要約";
console.log("");
console.log("※ 同じ名前で再実行するとアプリが重複します。");
console.log("");

const report = await createAppDeployFields(reportName, REPORT_FIELD_DEFS);

console.log("");
console.log("=== .env / GitHub Secrets に追記 ===");
console.log(`KINTONE_REPORT_APP_ID=${report.appId}`);
console.log("");
console.log("レポートアプリ URL:", report.recordUrl);
console.log("");
console.log("次: kintone の API トークンに「このアプリ」のレコード追加・閲覧権限を付与する。");
console.log("    ニュース用（例: 631）と同じトークンに複数アプリを載せる運用でよい。");
