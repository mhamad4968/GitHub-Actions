#!/usr/bin/env node
/**
 * App 756 — summary_unit の DROP_DOWN に ㎡ + COMMON_UNITS を載せる。
 * 分割投影が m2/缶 などを書くと CB_VA01 になるため。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-expand-summary-unit.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-expand-summary-unit.mjs --apply
 */
import "dotenv/config";
import { COMMON_UNITS } from "./lib/jikkou-yosan-v2/contract-salary-model.mjs";

const APP_ID = 756;
const VALUES = ["㎡", ...COMMON_UNITS.filter((unit) => unit !== "㎡")];

function requireEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error("Missing " + k);
  return String(v).trim();
}

let baseUrl = requireEnv("KINTONE_BASE_URL").replace(/\/+$/, "").replace(/\/k$/i, "");
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
    if (status === "FAIL" || status === "CANCEL") throw new Error(`form deploy ${status}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("form deploy timed out");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const form = await fetchJson(
    `${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP_ID}`,
    { headers: { ...headers, "Content-Type": undefined } },
  );
  const current =
    form.properties?.summary_cost_lines?.fields?.summary_unit?.options || {};
  const currentKeys = Object.keys(current);
  const options = {};
  VALUES.forEach((label, index) => {
    options[label] = { label, index: String(index) };
  });
  console.log(`[summary-unit] revision=${form.revision}`);
  console.log(`[summary-unit] current: ${currentKeys.join(", ")}`);
  console.log(`[summary-unit] next: ${VALUES.join(", ")}`);
  if (!apply) {
    console.log("[summary-unit] dry-run — pass --apply to PUT + deploy");
    return;
  }
  const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      app: APP_ID,
      revision: form.revision,
      properties: {
        summary_cost_lines: {
          type: "SUBTABLE",
          fields: {
            summary_unit: {
              type: "DROP_DOWN",
              code: "summary_unit",
              options,
            },
          },
        },
      },
    }),
  });
  console.log(`[summary-unit] PUT ok revision=${put.revision}`);
  await deployForm(put.revision);
  console.log("[summary-unit] form deploy SUCCESS");
}

main().catch((e) => {
  console.error("[summary-unit] FAIL", e.message);
  process.exit(1);
});
