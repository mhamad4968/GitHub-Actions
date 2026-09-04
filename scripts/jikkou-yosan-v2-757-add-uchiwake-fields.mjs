#!/usr/bin/env node
/**
 * App 757 — 内訳階層 4 フィールド ADD + deploy（削除なし）。
 * 正本: docs/plans/2026-09-04-jikkou-yosan-v2-uchiwake-hierarchy-spec.md §2.3
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-757-add-uchiwake-fields.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-757-add-uchiwake-fields.mjs --apply
 */
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
} from "./lib/software-ledger-kintone.mjs";

const APP = 757;
const NEW_FIELDS = {
  name_detail: {
    type: "SINGLE_LINE_TEXT",
    code: "name_detail",
    label: "詳細（外注細目）",
    required: false,
    defaultValue: "",
  },
  name_item: {
    type: "SINGLE_LINE_TEXT",
    code: "name_item",
    label: "品名（外注×材料）",
    required: false,
    defaultValue: "",
  },
  line_vendor_name: {
    type: "SINGLE_LINE_TEXT",
    code: "line_vendor_name",
    label: "行の会社名",
    required: false,
    defaultValue: "",
  },
  line_person_name: {
    type: "SINGLE_LINE_TEXT",
    code: "line_person_name",
    label: "行の氏名",
    required: false,
    defaultValue: "",
  },
};

async function main() {
  const apply = process.argv.includes("--apply");
  const { baseUrl, headers } = getKintoneConfig();
  const form = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`, {
    method: "GET",
    headers: { ...headers, "Content-Type": undefined },
  });
  const current = form.properties || {};
  const toAdd = {};
  const skipped = [];
  for (const [code, prop] of Object.entries(NEW_FIELDS)) {
    if (current[code]) skipped.push(code);
    else toAdd[code] = prop;
  }
  console.log(`[757-uchiwake] app=${APP} mode=${apply ? "apply" : "dry-run"}`);
  console.log(`[757-uchiwake] revision=${form.revision}`);
  console.log(`[757-uchiwake] add: ${Object.keys(toAdd).join(", ") || "(none)"}`);
  if (skipped.length) console.log(`[757-uchiwake] skip exists: ${skipped.join(", ")}`);
  if (!apply) {
    console.log("[757-uchiwake] dry-run — preview unchanged");
    return;
  }
  let revision = form.revision;
  if (Object.keys(toAdd).length) {
    const posted = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: "POST",
      headers,
      body: JSON.stringify({ app: APP, properties: toAdd, revision }),
    });
    revision = posted.revision;
    console.log(`[757-uchiwake] POST ok revision=${revision}`);
  }
  await deployApp(baseUrl, headers, APP, revision);
  const live = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json?app=${APP}`, {
    method: "GET",
    headers: { ...headers, "Content-Type": undefined },
  });
  for (const code of Object.keys(NEW_FIELDS)) {
    if (!live.properties || !live.properties[code]) {
      throw new Error(`[757-uchiwake] LIVE missing ${code}`);
    }
    if (live.properties[code].required) {
      throw new Error(`[757-uchiwake] ${code} must stay optional`);
    }
  }
  console.log(`[757-uchiwake] LIVE ok codes=${Object.keys(NEW_FIELDS).join(",")}`);
}

main().catch((error) => {
  console.error("[757-uchiwake] FAIL", error.message);
  process.exit(1);
});
