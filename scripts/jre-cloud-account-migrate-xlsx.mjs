#!/usr/bin/env node
/** JREクラウド — Excel 全社user → DB REST */
import { existsSync } from 'node:fs';
import XLSX from 'xlsx';
import {
  DEFAULT_XLSX,
  SHEET_MASTER,
  fetchJson,
  formatDateYmd,
  getKintoneConfig,
  loadAppIds,
  loadJsonArray,
  recordCount,
  trimCell,
  DEPTS_PATH,
  ORGS_PATH,
} from './lib/jre-cloud-account-kintone.mjs';

const BATCH = 100;

function parseArgs() {
  return {
    dryRun: process.argv.includes('--dry-run'),
    apply: process.argv.includes('--apply'),
    force: process.argv.includes('--force'),
    xlsx: process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || DEFAULT_XLSX,
    appId: process.argv.find((a) => a.startsWith('--app='))?.slice(6),
  };
}

function readExcelRows(xlsxPath) {
  if (!existsSync(xlsxPath)) throw new Error(`xlsx not found: ${xlsxPath}`);
  const orgs = new Set(loadJsonArray(ORGS_PATH));
  const depts = new Set(loadJsonArray(DEPTS_PATH));
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = wb.Sheets[SHEET_MASTER];
  if (!sheet) throw new Error(`sheet missing: ${SHEET_MASTER}`);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const out = [];
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] || [];
    const userId = trimCell(row[2]);
    if (!userId.includes('@')) continue;
    const org = trimCell(row[4]);
    const dept = trimCell(row[5]) || '－';
    if (!orgs.has(org)) throw new Error(`row ${i + 1} unknown org: ${org}`);
    if (!depts.has(dept)) throw new Error(`row ${i + 1} unknown dept: ${dept}`);
    const start = formatDateYmd(row[8]);
    if (!start) throw new Error(`row ${i + 1} missing start_date: ${userId}`);
    out.push({
      user_id: userId,
      user_name: trimCell(row[3]),
      org,
      dept,
      phone: trimCell(row[6]),
      mail: trimCell(row[7]) || userId,
      start_date: start,
      end_date: '',
      note: '',
    });
  }
  return out;
}

function rowToFields(row) {
  const rec = {
    user_id: { value: row.user_id },
    user_name: { value: row.user_name },
    org: { value: row.org },
    dept: { value: row.dept },
    mail: { value: row.mail },
    start_date: { value: row.start_date },
  };
  if (row.phone) rec.phone = { value: row.phone };
  if (row.note) rec.note = { value: row.note };
  if (row.end_date) rec.end_date = { value: row.end_date };
  return rec;
}

async function postBatch(baseUrl, headers, appId, records) {
  await fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, records }),
  });
}

async function main() {
  const { dryRun, apply, force, xlsx, appId: appArg } = parseArgs();
  const rows = readExcelRows(xlsx);
  console.log(`read ${rows.length} rows from ${SHEET_MASTER}`);

  if (dryRun) {
    console.log(JSON.stringify(rows.slice(0, 3), null, 2));
    console.log(`... total ${rows.length}`);
    return;
  }
  if (!apply) {
    console.error('Use --apply to POST (or --dry-run)');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const appId = appArg ? Number(appArg) : loadAppIds().dbAppId;
  if (!appId) throw new Error('dbAppId missing');

  const n = await recordCount(baseUrl, headers, appId);
  if (n > 0 && !force) {
    console.error(`app ${appId} already has ${n} records. Use --force to add anyway.`);
    process.exit(1);
  }

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH).map(rowToFields);
    await postBatch(baseUrl, headers, appId, chunk);
    console.log(`posted ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log(`done app=${appId} count=${rows.length}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
