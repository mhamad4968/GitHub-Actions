/**
 * スペース 48（URL の #/space/48）に Security NEXT 連携用アプリを 2 つ作る。
 * 週次レポートだけ足す場合は create-security-next-report-app.js（npm run setup:security-next-report-app）。
 * 認証は出張精算アプリ作成スクリプトと同じ（KINTONE_BASE_URL + ユーザー名パスワード）。
 * API トークンではアプリ新規作成ができないため、管理者アカウントが必要。
 *
 * 実行例:
 *   cd /path/to/kintone-ai-lab && npx dotenv -e .env -e .env.proxy -- node scripts/create-security-next-apps.js
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

/** Security NEXT ニュース用フィールド（フィールドコードは security-next-automation と一致） */
const NEWS_FIELD_DEFS = {
  title: {
    type: "SINGLE_LINE_TEXT",
    code: "title",
    label: "タイトル",
    noLabel: false,
    required: false,
    minLength: "",
    maxLength: "",
    expression: "",
    hideExpression: false,
    unique: false,
    defaultValue: "",
  },
  article_url: {
    type: "SINGLE_LINE_TEXT",
    code: "article_url",
    label: "URL（重複チェック用）",
    noLabel: false,
    required: false,
    minLength: "",
    maxLength: "",
    expression: "",
    hideExpression: false,
    unique: true,
    defaultValue: "",
  },
  published_date: {
    type: "DATE",
    code: "published_date",
    label: "公開日",
    noLabel: false,
    required: false,
    unique: false,
    defaultValue: "",
    defaultNowValue: false,
  },
  summary: {
    type: "MULTI_LINE_TEXT",
    code: "summary",
    label: "概要",
    noLabel: false,
    required: false,
    defaultValue: "",
  },
  digest: {
    type: "MULTI_LINE_TEXT",
    code: "digest",
    label: "要約",
    noLabel: false,
    required: false,
    defaultValue: "",
  },
};

/** 週次レポートアプリ */
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
};

/**
 * @param {string} appName
 * @param {Record<string, object>} properties
 */
async function createAppDeployFields(appName, properties) {
  const spaceId = Number(process.env.KINTONE_SECURITY_NEXT_SPACE_ID || "48");
  const threadId = await resolveDefaultThreadId(spaceId);

  console.log(`[create] スペース ${spaceId} defaultThread=${threadId} に「${appName}」を作成します…`);

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

  console.log(`[create] アプリ作成 appId=${appId} revision=${addAppRes.revision}`);

  const postFieldsUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
  const fieldsRes = await fetchJson(postFieldsUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  const revision = fieldsRes.revision;
  console.log(`[create] フィールド追加済み revision=${revision}`);

  const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  await fetchJson(depUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision }] }),
  });
  await waitDeploy(appId);
  console.log(`[create] デプロイ成功 appId=${appId}`);

  return { appId, recordUrl: `${baseUrl}/k/${appId}/` };
}

console.log(`[create] Base URL: ${baseUrl}`);

const newsName = process.env.KINTONE_SECURITY_NEXT_NEWS_APP_NAME || "Security NEXT ニュース";
const reportName = process.env.KINTONE_SECURITY_NEXT_REPORT_APP_NAME || "ニュース週次要約";

console.log("");
console.log("※ 同じ名前で再実行するとアプリが重複します。既にある場合は kintone 上で削除するか、別名に変えてください。");
console.log("");

const news = await createAppDeployFields(newsName, NEWS_FIELD_DEFS);
const report = await createAppDeployFields(reportName, REPORT_FIELD_DEFS);

console.log("");
console.log("=== 次を .env / GitHub Secrets に設定してください ===");
console.log(`KINTONE_APP_ID=${news.appId}`);
console.log(`KINTONE_REPORT_APP_ID=${report.appId}`);
console.log("");
console.log("ニュースアプリ URL:", news.recordUrl);
console.log("レポートアプリ URL:", report.recordUrl);
console.log("");
console.log("kintone-apps.md の表と API トークン対象アプリも更新してください。");
