#!/usr/bin/env node
/**
 * NAS管理台帳 — Excel → DB REST 一括 POST（20 + 設備なし 3 = 23 件）
 * S-NAS-01: --dry-run / --apply 前に assertNasMigrateRecords（件数・列ずれ・プレースホルダ shape）
 */
import { existsSync } from 'node:fs';
import {
  assertNasMigrateRecords,
  DEFAULT_XLSX,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  readExcelRows,
  recordCount,
  redactRecord,
  rowToKintoneRecord,
} from './lib/nas-ledger-kintone.mjs';

const BATCH = 100;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || process.env.NAS_LEDGER_XLSX || DEFAULT_XLSX;
  const appArg = process.argv.find((a) => a.startsWith('--app='))?.slice(6);
  return { dryRun, apply, force, xlsx, appId: appArg ? Number(appArg) : null };
}

function todayJstYmd() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

async function postBatch(baseUrl, headers, appId, records) {
  return fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, records }),
  });
}

async function main() {
  const { dryRun, apply, force, xlsx, appId: appArg } = parseArgs();
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }
  if (!existsSync(xlsx)) throw new Error(`Excel not found: ${xlsx}`);

  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const appId = appArg || state.dbAppId;
  if (!appId) throw new Error('dbAppId missing');

  const rows = readExcelRows(xlsx);
  assertNasMigrateRecords(rows);

  const registeredDate = todayJstYmd();
  const records = rows.map((row) => rowToKintoneRecord(row, registeredDate));

  const count = await recordCount(baseUrl, headers, appId);
  if (count > 0 && !force) {
    throw new Error(`app ${appId} already has ${count} records (use --force to add anyway)`);
  }

  console.log(`[migrate] app=${appId} rows=${records.length} registered_date=${registeredDate}`);
  records.slice(0, 3).forEach((rec, i) => {
    console.log(` sample[${i}]`, JSON.stringify(redactRecord(rec)));
  });
  const last = records[records.length - 1];
  console.log(' sample[last]', JSON.stringify(redactRecord(last)));

  if (dryRun) {
    console.log('[dry-run] OK — no POST');
    return;
  }

  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    const res = await postBatch(baseUrl, headers, appId, chunk);
    console.log(` POST offset=${i} ids=${(res.ids || []).join(',')}`);
  }
  const finalCount = await recordCount(baseUrl, headers, appId);
  console.log(`[migrate] SUCCESS totalCount=${finalCount}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
