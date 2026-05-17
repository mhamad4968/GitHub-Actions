/**
 * 685 正本アプリ: category ドロップダウンを新7種に差し替え → preview deploy。
 *
 *   npx dotenv -e ../../.env -e ../../.env.proxy -- node scripts/update-685-category-dropdown.mjs --dry-run
 *   npx dotenv -e ../../.env -e ../../.env.proxy -- node scripts/update-685-category-dropdown.mjs
 */
import "dotenv/config";

const APP = Number(process.env.ICT_DIGEST_STORE_APP_ID || "685");
const FIELD = "category";

const NEW_OPTIONS = [
  "AI・LLM",
  "インフラ・通信・端末",
  "開発トレンド",
  "Box・SaaS・文書管理",
  "DX人材・IT資格・組織",
  "セキュリティ製品・技術",
  "その他",
];

function requireEnv(k) {
  const v = process.env[k];
  if (!v || !String(v).trim()) throw new Error(`環境変数 ${k} が未設定です。`);
  return String(v).trim();
}

function buildAuthHeaders() {
  const user = requireEnv("KINTONE_USERNAME");
  const pass = requireEnv("KINTONE_PASSWORD");
  const headers = {
    "X-Cybozu-Authorization": Buffer.from(`${user}:${pass}`, "utf8").toString("base64"),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      "utf8",
    ).toString("base64")}`;
  }
  return headers;
}

function jsonHeaders() {
  return { ...buildAuthHeaders(), "Content-Type": "application/json" };
}

let baseUrl = requireEnv("KINTONE_BASE_URL").trim().replace(/\/+$/, "");
baseUrl = baseUrl.replace(/\/k$/i, "");

function buildDropdownOptions(labels) {
  const options = {};
  labels.forEach((label, i) => {
    options[label] = { label, index: String(i) };
  });
  return options;
}

function optionsMatch(def, expectedLabels) {
  if (!def?.options) return false;
  const keys = Object.keys(def.options).sort();
  const exp = [...expectedLabels].sort();
  if (keys.length !== exp.length) return false;
  return keys.every((k, i) => k === exp[i] && def.options[k]?.label === k);
}

async function waitDeploy(getHeaders) {
  for (let i = 0; i < 90; i++) {
    const u = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    u.searchParams.set("apps[0]", String(APP));
    const res = await fetch(u, { headers: getHeaders });
    const j = await res.json();
    const st = res.ok && j.apps?.[0] ? j.apps[0].status : null;
    if (st === "SUCCESS") return;
    if (st === "FAIL" || st === "CANCEL") throw new Error(`deploy status ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("deploy 待機がタイムアウトしました。");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const getHeaders = buildAuthHeaders();
  const nextOptions = buildDropdownOptions(NEW_OPTIONS);

  const getRes = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`, {
    headers: getHeaders,
  });
  const getJson = await getRes.json();
  if (!getRes.ok) {
    throw new Error(`フィールド取得失敗: ${getJson.code} ${getJson.message}`);
  }

  const revision = getJson.revision;
  const properties = { ...getJson.properties };
  const def = properties[FIELD];
  if (!def || def.type !== "DROP_DOWN") {
    throw new Error(`アプリ ${APP}: フィールド ${FIELD} が DROP_DOWN ではありません。`);
  }

  if (optionsMatch(def, NEW_OPTIONS)) {
    console.log(`[685] ${FIELD} は既に新7種です。PUT スキップ。`);
    return;
  }

  console.log(`[685] 旧選択肢: ${Object.keys(def.options || {}).join(" / ")}`);
  console.log(`[685] 新選択肢: ${NEW_OPTIONS.join(" / ")}`);

  if (dryRun) {
    console.log(JSON.stringify({ app: APP, revision, field: FIELD, options: nextOptions }, null, 2));
    console.log("[685] dry-run: PUT / deploy は行いません。");
    return;
  }

  properties[FIELD] = {
    ...def,
    options: nextOptions,
  };

  const putRes = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify({ app: APP, revision, properties }),
  });
  const putJson = await putRes.json();
  if (!putRes.ok) {
    throw new Error(`フィールド更新失敗: ${putJson.code} ${putJson.message}`);
  }
  const newRev = putJson.revision;
  console.log(`[685] preview 更新完了 revision=${newRev}`);

  const depRes = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ apps: [{ app: APP, revision: newRev }] }),
  });
  const depJson = await depRes.json();
  if (!depRes.ok) {
    throw new Error(`deploy 開始失敗: ${depJson.code} ${depJson.message}`);
  }

  await waitDeploy(getHeaders);
  console.log("[685] deploy SUCCESS — category ドロップダウンを新7種に反映しました。");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
