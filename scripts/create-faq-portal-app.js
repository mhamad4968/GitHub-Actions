/**
 * 社内 FAQ ポータル（faq-portal-full.html + faq-kintone-proxy）用の kintone アプリを 1 つ作成する。
 * フィールドコードは faq-kintone-proxy の .env.example / server.mjs の既定と一致させる。
 *
 * 前提: API トークンではアプリ新規作成できないため、管理者の KINTONE_USERNAME / KINTONE_PASSWORD が必要。
 *
 * 実行例:
 *   cd kintone-ai-lab && npx dotenv -e .env -e .env.proxy -- node scripts/create-faq-portal-app.js
 *
 * 環境変数（任意）:
 *   KINTONE_FAQ_SPACE_ID … 未設定時は KINTONE_SECURITY_NEXT_SPACE_ID または 48
 *   KINTONE_FAQ_APP_NAME … 既定「社内FAQDB」
 *
 * リカバリ（アプリだけ作成済みでフォーム追加が失敗した場合・**対象は社内FAQDB アプリIDのみ**）:
 *   本番反映済みアプリ … KINTONE_FAQ_APP_ID=… --deploy-fields
 *   まだデプロイされていないアプリ（preview のみ）… 同じく ID を指定し **--deploy-fields-preview**
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
    const head = json?.code || json?.message ? `${json.code || ""} ${json.message || ""}`.trim() : "";
    const errList =
      Array.isArray(json?.errors) && json.errors.length > 0
        ? ` details=${JSON.stringify(json.errors)}`
        : "";
    const tail = text.slice(0, 1200);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${head || tail}${errList}`.trim());
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitDeploy(appNum, mode) {
  const path = mode === "live" ? "/k/v1/app/deploy.json" : "/k/v1/preview/app/deploy.json";
  const stUrl = new URL(`${baseUrl}${path}`);
  stUrl.searchParams.set("apps[0]", String(appNum));
  const headersNoCt = { ...headers, "Content-Type": undefined };
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(stUrl, { method: "GET", headers: headersNoCt });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === "SUCCESS") return;
    if (status === "FAIL" || status === "CANCEL") throw new Error(`デプロイ状態: ${status}`);
    await sleep(1000);
  }
  throw new Error("デプロイがタイムアウトしました（PROCESSING のまま）。");
}

async function resolveDefaultThreadId(spaceId) {
  const override = process.env.KINTONE_SPACE_DEFAULT_THREAD;
  if (override && /^\d+$/.test(override)) return Number(override);
  const u = new URL(`${baseUrl}/k/v1/space.json`);
  u.searchParams.set("id", String(spaceId));
  const sp = await fetchJson(u, { method: "GET", headers: { ...headers, "Content-Type": undefined } });
  const dt = sp?.defaultThread;
  if (!dt || String(dt).trim() === "") {
    throw new Error(`スペース ${spaceId} に defaultThread がありません（マルチスレッドを確認）`);
  }
  return Number(dt);
}

/** faq-kintone-proxy の FIELD_*・RECORD_TYPE_*・CHECKBOX_YES と一致 */
const FAQ_FIELD_DEFS = {
  record_type: {
    type: "DROP_DOWN",
    code: "record_type",
    label: "レコード種別",
    noLabel: false,
    /** preview API で required:true が CB_VA01 になるテナントがあるため false（既定値で運用） */
    required: false,
    defaultValue: "faq",
    /** REST API では options の label はキーと同一文字列である必要がある（CB_VA01） */
    options: {
      faq: { label: "faq", index: "0" },
      meta: { label: "meta", index: "1" },
    },
  },
  question: {
    type: "SINGLE_LINE_TEXT",
    code: "question",
    label: "質問",
    noLabel: false,
    required: false,
    minLength: "",
    maxLength: "",
    expression: "",
    hideExpression: false,
    unique: false,
    defaultValue: "",
  },
  answer: {
    type: "MULTI_LINE_TEXT",
    code: "answer",
    label: "回答",
    noLabel: false,
    required: false,
    defaultValue: "",
  },
  category: {
    type: "SINGLE_LINE_TEXT",
    code: "category",
    label: "カテゴリ（子）",
    noLabel: false,
    required: false,
    minLength: "",
    maxLength: "",
    expression: "",
    hideExpression: false,
    unique: false,
    defaultValue: "",
  },
  important: {
    type: "CHECK_BOX",
    code: "important",
    label: "重要",
    noLabel: false,
    required: false,
    options: {
      yes: { label: "yes", index: "0" },
    },
  },
  published: {
    type: "CHECK_BOX",
    code: "published",
    label: "公開",
    noLabel: false,
    required: false,
    options: {
      yes: { label: "yes", index: "0" },
    },
  },
};

/**
 * アプリに FAQ フォームフィールドを追加してデプロイする
 * @param {number} appId
 * @param {"preview"|"live"} mode 新規作成直後は preview。既に本番化されたアプリは live（/k/v1/app/form/fields.json）
 */
async function deployFaqFields(appId, mode) {
  if (!Number.isFinite(appId) || appId <= 0) throw new Error(`不正な appId: ${appId}`);
  const fieldsPath = mode === "live" ? "/k/v1/app/form/fields.json" : "/k/v1/preview/app/form/fields.json";
  const deployPath = mode === "live" ? "/k/v1/app/deploy.json" : "/k/v1/preview/app/deploy.json";

  console.log(`[faq-portal-app] フォーム追加 mode=${mode} appId=${appId}`);

  const postFieldsUrl = new URL(`${baseUrl}${fieldsPath}`);
  const fieldsRes = await fetchJson(postFieldsUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ app: appId, properties: FAQ_FIELD_DEFS }),
  });
  const revision = fieldsRes.revision;
  console.log(`[faq-portal-app] フィールド追加済み revision=${revision}`);

  const depUrl = new URL(`${baseUrl}${deployPath}`);
  await fetchJson(depUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision }] }),
  });
  await waitDeploy(appId, mode === "live" ? "live" : "preview");
  console.log(`[faq-portal-app] デプロイ成功 appId=${appId}`);
  return appId;
}

async function main() {
  const deployPreview = process.argv.includes("--deploy-fields-preview");
  const deployOnly = process.argv.includes("--deploy-fields") || deployPreview;
  if (deployOnly) {
    const raw = process.env.KINTONE_FAQ_APP_ID?.trim();
    if (!raw) throw new Error("--deploy-fields 系には KINTONE_FAQ_APP_ID（対象アプリ）が必要です");
    const appId = Number(raw);
    /** 未デプロイの途中アプリは preview API。既に本番のアプリは live API（405 のときは --deploy-fields-preview を試す） */
    await deployFaqFields(appId, deployPreview ? "preview" : "live");
    printNextSteps(appId);
    return;
  }

  const spaceId = Number(
    process.env.KINTONE_FAQ_SPACE_ID?.trim() || process.env.KINTONE_SECURITY_NEXT_SPACE_ID?.trim() || "48",
  );
  const appName = process.env.KINTONE_FAQ_APP_NAME?.trim() || "社内FAQDB";
  const threadId = await resolveDefaultThreadId(spaceId);

  console.log(`[faq-portal-app] スペース ${spaceId} defaultThread=${threadId} に「${appName}」を作成します…`);
  console.log("");
  console.log("※ 同じ名前で再実行するとアプリが重複します。");
  console.log("");

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

  console.log(`[faq-portal-app] アプリ作成 appId=${appId} revision=${addAppRes.revision}`);

  try {
    await deployFaqFields(appId, "preview");
  } catch (ePrev) {
    const msg = ePrev instanceof Error ? ePrev.message : String(ePrev);
    console.warn(`[faq-portal-app] preview フォーム追加に失敗 → live API で再試行します: ${msg}`);
    await deployFaqFields(appId, "live");
  }
  printNextSteps(appId);
}

function printNextSteps(appId) {
  const recordUrl = `${baseUrl}/k/${appId}/`;
  console.log("");
  console.log("=== 次の作業 ===");
  console.log("");
  console.log("1. kintone でこのアプリの API トークンを発行（レコードの閲覧・追加・編集・削除。プロキシが使います）");
  console.log("");
  console.log("2. scripts/faq-kintone-proxy/.env に設定:");
  console.log(`   KINTONE_DOMAIN=（ホスト名のみ。例: xxxx.cybozu.com）`);
  console.log(`   KINTONE_FAQ_APP_ID=${appId}`);
  console.log(`   KINTONE_API_TOKEN=（発行したトークン）`);
  console.log("");
  console.log("3. kintone-apps.md のアプリ一覧にアプリIDとフィールドを追記（npm run app:fields " + appId + "）");
  console.log("");
  console.log("レコード URL:", recordUrl);
}

console.log(`[faq-portal-app] Base URL: ${baseUrl}`);
await main();
