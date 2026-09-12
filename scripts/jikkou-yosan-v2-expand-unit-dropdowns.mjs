#!/usr/bin/env node
/**
 * 756/757 単位 DROP_DOWN を ㎡ + COMMON_UNITS に揃える。
 * 画面は泊・橋などを出せるが、App757 unit が短いと一時保存が CB_VA01 になる。
 *
 *   node scripts/jikkou-yosan-v2-expand-unit-dropdowns.mjs
 *   node scripts/jikkou-yosan-v2-expand-unit-dropdowns.mjs --apply
 */
import { loadDotenv } from "./lib/kintone-live-schema.mjs";
import {
  UNIT_FIELD_VALUES,
  unitDropdownOptions,
} from "./lib/jikkou-yosan-v2/contract-salary-model.mjs";
import {
  assertImplementationGo,
  deployAppAndWait,
  fetchJson,
  getKintoneConfig,
  getPreviewFormFields,
} from "./lib/jikkou-yosan-v2/kintone.mjs";

loadDotenv(process.cwd());

function optionLabels(options) {
  return Object.values(options || {})
    .sort((a, b) => Number(a.index) - Number(b.index))
    .map((o) => o.label);
}

function assertNoDroppedOptions(app, field, currentLabels, nextLabels) {
  const dropped = currentLabels.filter((label) => !nextLabels.includes(label));
  if (dropped.length) {
    throw new Error(`${app} ${field}: refusing to drop options ${dropped.join(", ")}`);
  }
}

/** SUBTABLE PUT は未指定の内側フィールドを消すので、既存を全部残して単位だけ差し替える。 */
function patchSubtableUnit(sub, fieldCode, options) {
  if (!sub || sub.type !== "SUBTABLE") {
    throw new Error(`missing SUBTABLE for ${fieldCode}`);
  }
  const fields = {};
  for (const [code, def] of Object.entries(sub.fields || {})) {
    const { id: _id, ...rest } = def;
    fields[code] = code === fieldCode ? { ...rest, type: "DROP_DOWN", code, options } : rest;
  }
  if (!fields[fieldCode]) throw new Error(`missing inner field ${fieldCode}`);
  return {
    type: "SUBTABLE",
    code: sub.code,
    label: sub.label,
    noLabel: sub.noLabel,
    fields,
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  if (apply) assertImplementationGo();
  const ctx = getKintoneConfig();
  const options = unitDropdownOptions();
  const nextLabels = [...UNIT_FIELD_VALUES];

  const form757 = await getPreviewFormFields(ctx, 757);
  const unit757 = optionLabels(form757.properties?.unit?.options);
  assertNoDroppedOptions(757, "unit", unit757, nextLabels);
  console.log(`[757.unit] revision=${form757.revision} current=${unit757.join("|")}`);
  console.log(`[757.unit] next=${nextLabels.join("|")}`);

  const form756 = await getPreviewFormFields(ctx, 756);
  const contractSub = form756.properties?.contract_lines;
  const salarySub = form756.properties?.salary_lines;
  const contract = optionLabels(contractSub?.fields?.contract_unit?.options);
  const salary = optionLabels(salarySub?.fields?.salary_unit?.options);
  assertNoDroppedOptions(756, "contract_unit", contract, nextLabels);
  assertNoDroppedOptions(756, "salary_unit", salary, nextLabels);
  console.log(
    `[756.contract_unit] revision=${form756.revision} fields=${Object.keys(contractSub?.fields || {}).length} current=${contract.join("|")}`,
  );
  console.log(
    `[756.salary_unit] fields=${Object.keys(salarySub?.fields || {}).length} current=${salary.join("|")}`,
  );

  if (!apply) {
    console.log("[expand-unit] dry-run — pass --apply to PUT + deploy");
    return;
  }

  const put757 = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: "PUT",
    headers: ctx.headers,
    body: JSON.stringify({
      app: 757,
      revision: form757.revision,
      properties: {
        unit: { type: "DROP_DOWN", code: "unit", options },
      },
    }),
  });
  console.log(`[757.unit] PUT ok revision=${put757.revision}`);
  await deployAppAndWait(ctx, 757, put757.revision);
  console.log("[757.unit] form deploy SUCCESS");

  const put756 = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: "PUT",
    headers: ctx.headers,
    body: JSON.stringify({
      app: 756,
      revision: form756.revision,
      properties: {
        contract_lines: patchSubtableUnit(contractSub, "contract_unit", options),
        salary_lines: patchSubtableUnit(salarySub, "salary_unit", options),
      },
    }),
  });
  console.log(`[756.units] PUT ok revision=${put756.revision}`);
  await deployAppAndWait(ctx, 756, put756.revision);
  console.log("[756.units] form deploy SUCCESS");
}

main().catch((error) => {
  console.error("[expand-unit] FAIL", error.message || error);
  process.exit(1);
});
