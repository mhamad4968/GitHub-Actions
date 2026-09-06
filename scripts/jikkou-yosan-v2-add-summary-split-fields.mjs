#!/usr/bin/env node
/**
 * App 756 — summary_cost_lines に会社名・氏名・row_key を追加。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-add-summary-split-fields.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-add-summary-split-fields.mjs --apply-preview
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-add-summary-split-fields.mjs --apply-preview --deploy-form
 *
 * 既定は dry-run。--deploy-form は preview 反映後に form deploy（customize JS ではない）。
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ID = 756;
const WANTED = ["summary_vendor_name", "summary_person_name", "summary_row_key"];
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

function mergeSubtableFields(existing, patch) {
  if (!patch || patch.type !== "SUBTABLE") return null;
  const newFields = {};
  Object.entries(patch.fields || {}).forEach(([code, def]) => {
    if (!(existing.fields && existing.fields[code])) newFields[code] = def;
  });
  if (!Object.keys(newFields).length) return null;
  return {
    type: "SUBTABLE",
    code: existing.code || patch.code,
    label: existing.label || patch.label,
    fields: newFields,
  };
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
  const sub = catalog.properties.summary_cost_lines;
  const fields = {};
  for (const code of WANTED) {
    if (!sub?.fields?.[code]) throw new Error(`catalog missing ${code}`);
    fields[code] = sub.fields[code];
  }
  const patch = {
    summary_cost_lines: {
      type: "SUBTABLE",
      code: "summary_cost_lines",
      fields,
    },
  };

  const form = await fetchJson(
    `${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP_ID}`,
    { headers: { ...headers, "Content-Type": undefined } },
  );
  const current = form.properties || {};
  const existing = current.summary_cost_lines;
  const merged = existing ? mergeSubtableFields(existing, patch.summary_cost_lines) : null;
  const addCodes = merged ? Object.keys(merged.fields) : existing ? [] : WANTED;
  const skipped = WANTED.filter((code) => existing?.fields?.[code]);

  console.log(`[split-fields] app=${APP_ID} revision=${form.revision}`);
  console.log(`[split-fields] add: ${addCodes.length ? addCodes.join(", ") : "(none)"}`);
  if (skipped.length) {
    console.log(`[split-fields] skip (exists): ${skipped.join(", ")}`);
  }

  if (!applyPreview) {
    console.log("[split-fields] dry-run — preview unchanged. Re-run with --apply-preview.");
    return;
  }

  let revision = form.revision;
  if (merged) {
    revision = await postFields(revision, { summary_cost_lines: merged });
    console.log(`[split-fields] preview POST ok revision=${revision}`);
  } else {
    console.log("[split-fields] nothing to POST");
  }

  if (deploy) {
    await deployForm(revision);
    console.log("[split-fields] form deploy SUCCESS");
  } else {
    console.log("[split-fields] deploy NOT called (pass --deploy-form to publish fields)");
  }
}

main().catch((e) => {
  console.error("[split-fields] FAIL", e.message);
  process.exit(1);
});
