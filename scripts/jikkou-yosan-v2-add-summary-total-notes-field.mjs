#!/usr/bin/env node
/**
 * App 756 — 合計行備考 summary_total_notes（MULTI_LINE_TEXT）を追加。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-add-summary-total-notes-field.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-add-summary-total-notes-field.mjs --apply-preview --deploy-form
 */
import "dotenv/config";

const APP_ID = 756;
const CODE = "summary_total_notes";
const PROPERTY = {
  type: "MULTI_LINE_TEXT",
  code: CODE,
  label: "合計行備考",
  required: false,
  defaultValue: "",
};

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
  const form = await fetchJson(
    `${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP_ID}`,
    { headers: { ...headers, "Content-Type": undefined } },
  );
  const current = form.properties || {};
  console.log(`[total-notes-field] app=${APP_ID} revision=${form.revision}`);
  if (current[CODE]) {
    console.log(`[total-notes-field] skip (exists): ${CODE}`);
    return;
  }
  console.log(`[total-notes-field] add: ${CODE}`);
  if (!applyPreview) {
    console.log("[total-notes-field] dry-run — preview unchanged. Re-run with --apply-preview --deploy-form.");
    return;
  }
  const posted = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      app: APP_ID,
      properties: { [CODE]: PROPERTY },
      revision: form.revision,
    }),
  });
  console.log(`[total-notes-field] preview POST ok revision=${posted.revision}`);
  if (deploy) {
    await deployForm(posted.revision);
    console.log("[total-notes-field] form deploy SUCCESS");
  } else {
    console.log("[total-notes-field] deploy NOT called (pass --deploy-form to publish fields)");
  }
}

main().catch((e) => {
  console.error("[total-notes-field] FAIL", e.message);
  process.exit(1);
});
