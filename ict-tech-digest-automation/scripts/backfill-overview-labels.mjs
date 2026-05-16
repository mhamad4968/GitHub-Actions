/**
 * 685 既存レコードの overview を【事象】【影響】【推奨】形式に補正（ドライラン既定）
 * 用法: npm run backfill:overview -- --apply
 */
import { loadConfig } from "../src/lib/config.ts";
import { createKintoneClient } from "../src/lib/kintone-client.ts";
import { ICT_FIELDS } from "../src/lib/field-codes.ts";
import { normalizeOverview } from "../src/lib/overview-format.ts";

const apply = process.argv.includes("--apply");

async function main() {
  const cfg = loadConfig();
  const client = createKintoneClient(cfg);
  const resp = await client.record.getRecords({
    app: cfg.storeAppId,
    query: `order by ${ICT_FIELDS.published_at} desc limit 100`,
    fields: [ICT_FIELDS.overview, ICT_FIELDS.title, "$id"],
  });

  const updates = [];
  for (const rec of resp.records) {
    const id = rec.$id?.value;
    const raw = rec[ICT_FIELDS.overview]?.value ?? "";
    if (!raw || raw.includes("【事象】")) continue;
    const next = normalizeOverview(String(raw));
    updates.push({
      id,
      record: { [ICT_FIELDS.overview]: { value: next } },
    });
    console.log(`[backfill] #${id}`, rec[ICT_FIELDS.title]?.value?.slice(0, 40));
  }

  if (updates.length === 0) {
    console.log("[backfill] 補正対象なし");
    return;
  }

  if (!apply) {
    console.log(`[backfill] ドライラン: ${updates.length} 件（--apply で反映）`);
    return;
  }

  await client.record.updateRecords({
    app: cfg.storeAppId,
    records: updates,
  });
  console.log(`[backfill] 反映完了: ${updates.length} 件`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
