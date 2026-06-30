#!/usr/bin/env node
/**
 * メーリングリスト — Excel → DB (750) 既存レコードを list_address で突合し PUT / 新規 POST / 欠落は論理削除。
 *
 *   npm run mailing-list:sync:xlsx:dry-run
 *   npm run mailing-list:sync:xlsx -- --apply
 */
import { existsSync } from 'node:fs';
import {
  DEFAULT_XLSX,
  STATUS_ACTIVE,
  STATUS_DELETED,
  buildChangeMemo,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  readExcelRows,
  rowToKintoneRecord,
  todayJstYmd,
} from './lib/mailing-list-kintone.mjs';

const BATCH = 100;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const xlsx = process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || DEFAULT_XLSX;
  return { dryRun, apply, xlsx };
}

function matchKey(addr) {
  return String(addr || '').trim().toLowerCase();
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

async function postBatch(baseUrl, headers, appId, records) {
  return fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, records }),
  });
}

function buildUpdateBody(row, existing, today) {
  const beforeMembers = existing.members_raw?.value || '';
  const memo = buildChangeMemo(beforeMembers, row.members_raw);
  const regDate = existing.registered_date?.value || today;
  return {
    sort_no: { value: String(row.sort_no) },
    legacy_no: { value: row.legacy_no != null ? String(row.legacy_no) : '' },
    department: { value: row.department },
    list_address: { value: row.list_address },
    purpose: { value: row.purpose || '' },
    members_raw: { value: row.members_raw || '' },
    status: { value: STATUS_ACTIVE },
    last_change_memo: { value: memo || existing.last_change_memo?.value || '' },
    note: { value: existing.note?.value || '' },
    registered_date: { value: regDate },
    updated_date: { value: today },
  };
}

function maxLegacyNo(records) {
  let max = 0;
  for (const rec of records) {
    const n = Number(rec.legacy_no?.value);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

async function main() {
  const { dryRun, apply, xlsx } = parseArgs();
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }
  if (!existsSync(xlsx)) {
    console.error(`xlsx not found: ${xlsx}`);
    process.exit(1);
  }

  const rows = readExcelRows(xlsx);
  const dupCheck = new Set();
  for (const row of rows) {
    const k = matchKey(row.list_address);
    if (dupCheck.has(k)) {
      throw new Error(`duplicate list_address in Excel: ${row.list_address}`);
    }
    dupCheck.add(k);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId: appId } = loadAppIds();
  if (!appId) throw new Error('dbAppId missing');

  const existing = await fetchAllRecords(baseUrl, headers, appId);
  const byAddr = new Map();
  for (const rec of existing) {
    const k = matchKey(rec.list_address?.value);
    if (k && byAddr.has(k)) {
      throw new Error(`duplicate list_address in kintone: ${rec.list_address?.value}`);
    }
    if (k) byAddr.set(k, rec);
  }

  const today = todayJstYmd();
  const updates = [];
  const inserts = [];
  let nextLegacy = maxLegacyNo(existing) + 1;

  for (const row of rows) {
    const k = matchKey(row.list_address);
    const rec = byAddr.get(k);
    if (rec) {
      updates.push({ id: rec.$id.value, record: buildUpdateBody(row, rec, today) });
      byAddr.delete(k);
    } else {
      const insertRow = { ...row, legacy_no: nextLegacy };
      nextLegacy += 1;
      inserts.push(rowToKintoneRecord(insertRow, today, today));
    }
  }

  const deletes = [];
  for (const [, rec] of byAddr) {
    if (rec.status?.value === STATUS_DELETED) continue;
    deletes.push({
      id: rec.$id.value,
      record: {
        status: { value: STATUS_DELETED },
        updated_date: { value: today },
        last_change_memo: {
          value: `${today.replace(/-/g, '.')}：Excel同期により論理削除`,
        },
      },
    });
  }

  console.log(`[mailing-list-sync] app=${appId} source=${xlsx}`);
  console.log(`[mailing-list-sync] excel=${rows.length} kintone=${existing.length}`);
  console.log(`[mailing-list-sync] updates=${updates.length} inserts=${inserts.length} deletes=${deletes.length}`);

  if (updates[0]) {
    console.log(' sample update:', updates[0].id, updates[0].record.list_address?.value);
  }
  if (inserts[0]) {
    console.log(' sample insert:', inserts[0].list_address?.value);
  }
  if (deletes[0]) {
    const delRec = existing.find((r) => r.$id.value === deletes[0].id);
    console.log(' sample delete:', deletes[0].id, delRec?.list_address?.value);
  }

  if (dryRun) {
    console.log('[dry-run] OK — no REST write');
    return;
  }

  for (let i = 0; i < updates.length; i += BATCH) {
    const chunk = updates.slice(i, i + BATCH);
    await putBatch(baseUrl, headers, appId, chunk);
    console.log(` PUT ${Math.min(i + BATCH, updates.length)}/${updates.length}`);
  }
  for (let i = 0; i < inserts.length; i += BATCH) {
    const chunk = inserts.slice(i, i + BATCH);
    await postBatch(baseUrl, headers, appId, chunk);
    console.log(` POST ${Math.min(i + BATCH, inserts.length)}/${inserts.length}`);
  }
  for (let i = 0; i < deletes.length; i += BATCH) {
    const chunk = deletes.slice(i, i + BATCH);
    await putBatch(baseUrl, headers, appId, chunk);
    console.log(` DELETE(status) ${Math.min(i + BATCH, deletes.length)}/${deletes.length}`);
  }
  console.log('[mailing-list-sync] SUCCESS');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
