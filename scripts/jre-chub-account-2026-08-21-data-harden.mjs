#!/usr/bin/env node
/**
 * JRE-C_Hub 746 — SPEC §19 data + dept DROP_DOWN hardening
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jre-chub-account-2026-08-21-data-harden.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jre-chub-account-2026-08-21-data-harden.mjs --apply
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from "./lib/jre-chub-account-kintone.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEPTS_PATH = path.join(__dirname, "data", "jre-chub-account-depts.json");

const DEPT_RENAMES = {
  東京リペア部: "東京支店橋りょうリペア部",
  東京施工部: "東京支店施工部",
  関越施行部: "関越支店施工部",
};

const SENTINEL_END = "2999-12-31";

function buildDeptOptions(labels) {
  const options = {};
  labels.forEach((label, i) => {
    options[label] = { label, index: String(i) };
  });
  return options;
}

async function getRecords(baseUrl, headers, appId) {
  const all = [];
  let offset = 0;
  for (;;) {
    const q = `order by $id asc limit 100 offset ${offset}`;
    const j = await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: "POST",
      headers: { ...headers, "X-HTTP-Method-Override": "GET" },
      body: JSON.stringify({
        app: String(appId),
        query: q,
        fields: ["$id", "$revision", "user_id", "user_name", "dept", "end_date"],
      }),
    });
    const rows = j.records || [];
    all.push(...rows);
    if (rows.length < 100) break;
    offset += 100;
  }
  return all;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dryRun = !apply;
  const { baseUrl, headers } = getKintoneConfig();
  const ids = loadAppIds();
  const appId = Number(ids.dbAppId || 746);
  const newDepts = JSON.parse(fs.readFileSync(DEPTS_PATH, "utf8"));
  const transitionLabels = Array.from(
    new Set([...newDepts, ...Object.keys(DEPT_RENAMES)])
  );

  console.log(`[jre-chub-data-harden] app=${appId} mode=${dryRun ? "dry-run" : "apply"}`);

  const fieldsGet = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json`, {
    method: "POST",
    headers: { ...headers, "X-HTTP-Method-Override": "GET" },
    body: JSON.stringify({ app: String(appId) }),
  });
  const deptField = fieldsGet.properties && fieldsGet.properties.dept;
  if (!deptField || deptField.type !== "DROP_DOWN") {
    throw new Error("dept DROP_DOWN not found on live form");
  }

  const records = await getRecords(baseUrl, headers, appId);
  const endFixes = [];
  const deptFixes = [];
  const patches = [];

  for (const r of records) {
    const id = r.$id.value;
    const rev = r.$revision.value;
    const end = r.end_date && r.end_date.value ? String(r.end_date.value) : "";
    const dept = r.dept && r.dept.value ? String(r.dept.value) : "";
    const record = {};
    if (end === SENTINEL_END) {
      record.end_date = { value: "" };
      endFixes.push({ id, user: r.user_name.value, user_id: r.user_id.value });
    }
    if (DEPT_RENAMES[dept]) {
      record.dept = { value: DEPT_RENAMES[dept] };
      deptFixes.push({
        id,
        user: r.user_name.value,
        from: dept,
        to: DEPT_RENAMES[dept],
      });
    }
    if (Object.keys(record).length) {
      patches.push({ id, revision: rev, record });
    }
  }

  console.log(`[plan] end_date clear: ${endFixes.length}`);
  endFixes.forEach((x) => console.log(`  - #${x.id} ${x.user} (${x.user_id})`));
  console.log(`[plan] dept rename: ${deptFixes.length}`);
  deptFixes.forEach((x) => console.log(`  - #${x.id} ${x.user}: ${x.from} → ${x.to}`));
  console.log(`[plan] record patches: ${patches.length}`);

  if (dryRun) {
    console.log("[dry-run] stop before form/record writes");
    return;
  }

  const transitionOptions = buildDeptOptions(transitionLabels);
  await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      app: appId,
      properties: {
        dept: {
          type: "DROP_DOWN",
          code: "dept",
          label: deptField.label || "部門",
          required: true,
          options: transitionOptions,
        },
      },
    }),
  });
  console.log("[form] transition options PUT OK");
  await deployApp(baseUrl, headers, appId);
  console.log("[form] deploy after transition OK");

  for (let i = 0; i < patches.length; i += 100) {
    const chunk = patches.slice(i, i + 100);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ app: appId, records: chunk }),
    });
    console.log(`[records] PUT ${chunk.length} (offset ${i})`);
  }

  const finalOptions = buildDeptOptions(newDepts);
  await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      app: appId,
      properties: {
        dept: {
          type: "DROP_DOWN",
          code: "dept",
          label: deptField.label || "部門",
          required: true,
          options: finalOptions,
        },
      },
    }),
  });
  console.log("[form] final options PUT OK");
  await deployApp(baseUrl, headers, appId);
  console.log("[form] deploy after final OK");
  console.log("[jre-chub-data-harden] DONE");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
