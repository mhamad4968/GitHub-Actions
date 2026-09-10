#!/usr/bin/env node
/**
 * App 756 — vendor_contract_lines 追加。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-add-vendor-contract-fields.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-add-vendor-contract-fields.mjs --apply-preview
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-add-vendor-contract-fields.mjs --apply-preview --deploy-form
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ID = 756;
const CODE = "vendor_contract_lines";
const CATALOG_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "data",
  "jikkou-yosan-v2-app1-fields.json",
);

function requireEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error("Missing " + k);
  return String(v).trim();
}

const baseUrl = requireEnv("KINTONE_BASE_URL").replace(/\/+$/, "").replace(/\/k$/i, "");
const headers = {
  "X-Cybozu-Authorization": Buffer.from(
    `${requireEnv("KINTONE_USERNAME")}:${requireEnv("KINTONE_PASSWORD")}`,
    "utf8",
  ).toString("base64"),
  "Content-Type": "application/json",
};

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${res.status} non-JSON: ${text.slice(0, 400)}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 800)}`);
  return json;
}

async function postFields(revision, properties) {
  if (!Object.keys(properties).length) return revision;
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ app: APP_ID, properties, revision }),
  });
  return j.revision;
}

async function deployForm(revision) {
  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ apps: [{ app: APP_ID, revision }] }),
  });
  for (let i = 0; i < 90; i += 1) {
    const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    stUrl.searchParams.set("apps[0]", String(APP_ID));
    const st = await fetchJson(stUrl, {
      headers: { ...headers, "Content-Type": undefined },
    });
    const status = st.apps?.[0]?.status;
    if (status === "SUCCESS") return;
    if (status === "FAIL" || status === "CANCEL") {
      throw new Error(`form deploy status ${status}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("form deploy timed out");
}

async function main() {
  const applyPreview = process.argv.includes("--apply-preview");
  const deploy = process.argv.includes("--deploy-form");
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const prop = catalog.properties?.[CODE];
  if (!prop || prop.type !== "SUBTABLE") {
    throw new Error(`catalog missing SUBTABLE ${CODE}`);
  }

  const form = await fetchJson(
    `${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP_ID}`,
    { headers: { ...headers, "Content-Type": undefined } },
  );
  const exists = Boolean(form.properties?.[CODE]);
  console.log(`[vendor-contract-fields] app=${APP_ID} revision=${form.revision}`);
  console.log(`[vendor-contract-fields] add: ${exists ? "(none, exists)" : CODE}`);

  if (!applyPreview) {
    console.log("[vendor-contract-fields] dry-run — preview unchanged. Re-run with --apply-preview.");
    return;
  }
  if (exists) {
    console.log("[vendor-contract-fields] nothing to POST");
    return;
  }

  const revision = await postFields(form.revision, { [CODE]: prop });
  console.log(`[vendor-contract-fields] preview POST ok revision=${revision}`);

  if (deploy) {
    await deployForm(revision);
    console.log("[vendor-contract-fields] form deploy SUCCESS");
  } else {
    console.log("[vendor-contract-fields] deploy NOT called (pass --deploy-form to publish fields)");
  }
}

main().catch((e) => {
  console.error("[vendor-contract-fields] FAIL", e.message);
  process.exit(1);
});
