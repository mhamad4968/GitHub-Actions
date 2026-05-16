/**
 * kintone カスタマイズ JS をデプロイする（ファイルアップロード + プレビュー反映 + 本番反映）。
 *
 * - **file.json（アップロード）**: `X-Cybozu-API-Token` 可（[Upload File](https://kintone.dev/en/docs/kintone/rest-api/files/upload-file/)）。
 * - **preview/app/customize.json（プレビューへの JS 割当）**: 公式に **API トークン不可**
 *   （[Update Customization](https://kintone.dev/en/docs/kintone/rest-api/apps/update-customization/) の Authentication）。
 *   そのため **`KINTONE_USERNAME` + `KINTONE_PASSWORD`**（`X-Cybozu-Authorization`）を渡すと、
 *   アップロードは API トークン・**プレビュー更新以降はパスワード**のハイブリッドで実行する。
 *
 * 使い方:
 *   KINTONE_BASE_URL=... KINTONE_API_TOKEN=... KINTONE_USERNAME=... KINTONE_PASSWORD=... \\
 *     node scripts/deploy-customize-api-token.js <APP_ID> <JS_PATH>
 */
import { readFile } from "node:fs/promises";
import { extractBuildFromSource, recordLiveBuild } from "./cio-live-build-registry.mjs";

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === "") {
    throw new Error(`Missing env var: ${key}`);
  }
  return String(v);
}

const appId = process.argv[2];
const jsPath = process.argv[3];

if (!appId || !/^\d+$/.test(appId) || !jsPath) {
  console.error("Usage: node scripts/deploy-customize-api-token.js <APP_id> <JS_PATH>");
  console.error("Example: node scripts/deploy-customize-api-token.js 594 customize/594/desktop.js");
  console.error("Required env: KINTONE_BASE_URL, KINTONE_API_TOKEN, KINTONE_USERNAME, KINTONE_PASSWORD");
  console.error("(API token cannot call PUT preview/app/customize.json — see kintone Update Customization API docs.)");
  process.exit(2);
}

let baseUrl = requireEnv("KINTONE_BASE_URL").trim().replace(/\/+$/, "");
baseUrl = baseUrl.replace(/\/k$/, "");
const apiToken = requireEnv("KINTONE_API_TOKEN").trim();

function addBasicAuth(headers) {
  const out = { ...headers };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
    const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
    out.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, "utf8").toString("base64")}`;
  }
  return out;
}

const uploadHeaders = addBasicAuth({
  "X-Cybozu-API-Token": apiToken,
});

const user = (process.env.KINTONE_USERNAME || "").trim();
const pass = (process.env.KINTONE_PASSWORD || "").trim();
const hasPasswordAuth = Boolean(user && pass);
const previewHeaders = addBasicAuth(
  hasPasswordAuth
    ? { "X-Cybozu-Authorization": Buffer.from(`${user}:${pass}`, "utf8").toString("base64") }
    : { "X-Cybozu-API-Token": apiToken },
);

if (!hasPasswordAuth) {
  throw new Error(
    "KINTONE_USERNAME and KINTONE_PASSWORD are required: PUT /k/v1/preview/app/customize.json does not accept API token authentication (kintone official docs).",
  );
}

async function uploadFile(path) {
  const buf = await readFile(path);
  const form = new FormData();
  form.set("file", new Blob([buf], { type: "text/javascript" }), path.split("/").pop() || "desktop.js");

  const url = new URL(`${baseUrl}/k/v1/file.json`);
  const res = await fetch(url, { method: "POST", headers: uploadHeaders, body: form });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) {
    throw new Error(
      `Upload failed: HTTP ${res.status} ${res.statusText} ${json?.code || ""} ${json?.message || ""}`.trim(),
    );
  }
  return json.fileKey;
}

async function updatePreviewCustomization(app, fileKey) {
  const url = new URL(`${baseUrl}/k/v1/preview/app/customize.json`);
  const body = {
    app,
    scope: "ALL",
    desktop: { js: [{ type: "FILE", file: { fileKey } }], css: [] },
    mobile: { js: [], css: [] },
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...previewHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) {
    throw new Error(
      `Update customize failed: HTTP ${res.status} ${res.statusText} ${json?.code || ""} ${json?.message || ""}`.trim(),
    );
  }
  return json.revision;
}

async function deployAppSettings(app, revision) {
  const url = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  const body = { apps: [{ app, revision }] };
  const res = await fetch(url, {
    method: "POST",
    headers: { ...previewHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
    throw new Error(
      `Deploy failed: HTTP ${res.status} ${res.statusText} ${json?.code || ""} ${json?.message || ""}`.trim(),
    );
  }
}

async function getDeployStatus(app) {
  const url = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  url.searchParams.set("apps[0]", String(app));
  const res = await fetch(url, { method: "GET", headers: previewHeaders });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) {
    throw new Error(
      `Get deploy status failed: HTTP ${res.status} ${res.statusText} ${json?.code || ""} ${json?.message || ""}`.trim(),
    );
  }
  return Array.isArray(json.apps) && json.apps[0] ? json.apps[0].status : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const appNum = Number(appId);
const jsContent = await readFile(jsPath, "utf8");
const buildTag = extractBuildFromSource(jsContent);
console.log(`[api-token deploy] Uploading JS: ${jsPath}${buildTag ? ` (BUILD=${buildTag})` : ""}`);
const fileKey = await uploadFile(jsPath);
console.log(`[api-token deploy] Uploaded. fileKey=${fileKey}`);

console.log(`[api-token deploy] Updating preview customization for app ${appNum}`);
const revision = await updatePreviewCustomization(appNum, fileKey);
console.log(`[api-token deploy] Updated. revision=${revision}`);

console.log("[api-token deploy] Deploying app settings to live...");
await deployAppSettings(appNum, revision);

for (let i = 0; i < 60; i++) {
  const st = await getDeployStatus(appNum);
  if (st === "SUCCESS") {
    recordLiveBuild({
      appId: appNum,
      build: buildTag,
      fileKey,
      revision,
      relPath: jsPath,
    });
    console.log("[api-token deploy] Deploy SUCCESS");
    if (buildTag) console.log(`[live-build-registry] recorded BUILD=${buildTag} app=${appNum}`);
    process.exit(0);
  }
  if (st === "FAIL" || st === "CANCEL") {
    throw new Error(`Deploy status: ${st}`);
  }
  await sleep(1000);
}

throw new Error("Deploy status timed out (still PROCESSING).");
