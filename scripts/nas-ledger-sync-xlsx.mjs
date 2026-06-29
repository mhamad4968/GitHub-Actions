#!/usr/bin/env node
/**
 * NAS管理台帳 — Excel → DB (748) 既存レコードを sort_no で突合し PUT 更新。
 *
 *   npm run nas-ledger:sync-xlsx:dry-run
 *   npm run nas-ledger:sync-xlsx
 */
import {
  assertNasMigrateRecords,
  DEFAULT_STRUCTURE_JSON,
  DEFAULT_XLSX,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  nasRecordMatchKey,
  readNasSourceRows,
  redactRecord,
  rowToKintoneRecord,
} from './lib/nas-ledger-kintone.mjs';

const BATCH = 100;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || process.env.NAS_LEDGER_XLSX || DEFAULT_XLSX;
  const json =
    process.argv.find((a) => a.startsWith('--json='))?.slice(7) ||
    process.env.NAS_LEDGER_STRUCTURE_JSON ||
    DEFAULT_STRUCTURE_JSON;
  return { dryRun, apply, xlsx, json };
}

function todayJstYmd() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

async function fetchAllRecords(baseUrl, headers, appId) {
  const all = [];
  let offset = 0;
  while (true) {
    const q = `order by sort_no asc limit 500 offset ${offset}`;
    const j = await fetchJson(
      `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`,
      { headers: { ...headers, 'Content-Type': undefined } },
    );
    all.push(...(j.records || []));
    if (!j.records || j.records.length < 500) break;
    offset += 500;
  }
  return all;
}

async function putBatch(baseUrl, headers, appId, records) {
  return fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: appId, records }),
  });
}

async function main() {
  const { dryRun, apply, xlsx, json } = parseArgs();
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId: appId } = loadAppIds();
  if (!appId) throw new Error('dbAppId missing');

  const { rows, source } = readNasSourceRows({ xlsxPath: xlsx, jsonPath: json });
  assertNasMigrateRecords(rows);

  const existing = await fetchAllRecords(baseUrl, headers, appId);
  const byMatch = new Map();
  for (const rec of existing) {
    const flat = {
      ip_address: rec.ip_address?.value ?? '',
      status: rec.status?.value ?? '',
      org_name: rec.org_name?.value ?? '',
      branch_name: rec.branch_name?.value ?? '',
      hostname: rec.hostname?.value ?? '',
    };
    byMatch.set(nasRecordMatchKey(flat), rec);
  }

  const updatedDate = todayJstYmd();
  const updates = [];
  const missing = [];

  for (const row of rows) {
    const matchKey = nasRecordMatchKey(row);
    const rec = byMatch.get(matchKey);
    if (!rec) {
      missing.push(`${matchKey} (${row.org_name}/${row.branch_name}/${row.ip_address || row.hostname})`);
      continue;
    }
    const regDate = row.registered_date || rec.registered_date?.value || updatedDate;
    const body = rowToKintoneRecord(row, regDate);
    body.updated_date = { value: row.updated_date || updatedDate };
    updates.push({
      id: rec.$id.value,
      record: body,
    });
  }

  if (missing.length) {
    throw new Error(`kintone records missing for match key: ${missing.join('; ')}`);
  }

  console.log(`[nas-ledger-sync] app=${appId} updates=${updates.length} source=${source}`);
  const osCount = rows.filter((r) => r.os_type).length;
  console.log(`[nas-ledger-sync] os_type populated=${osCount}/${rows.length}`);
  updates.slice(0, 2).forEach((u, i) => {
    console.log(` sample[${i}] id=${u.id}`, JSON.stringify(redactRecord(u.record)));
  });

  if (dryRun) {
    console.log('[dry-run] OK — no PUT');
    return;
  }

  for (let i = 0; i < updates.length; i += BATCH) {
    const chunk = updates.slice(i, i + BATCH);
    await putBatch(baseUrl, headers, appId, chunk);
    console.log(` PUT offset=${i} count=${chunk.length}`);
  }
  console.log('[nas-ledger-sync] SUCCESS');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
