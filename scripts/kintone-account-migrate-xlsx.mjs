#!/usr/bin/env node
/** Kintoneアカウント — Excel → DB REST */
import { existsSync } from 'node:fs';
import XLSX from 'xlsx';
import {
  DEFAULT_XLSX,
  MIGRATION_START_DATE,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  loadDeptsByOrg,
  loadOrgs,
  paySiteFromAccountType,
  recordCount,
  trimCell,
} from './lib/kintone-account-kintone.mjs';

const BATCH = 100;
const HEADER_ROW = 14;
const DATA_START = 15;

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
  const orgs = new Set(loadOrgs());
  const deptsByOrg = loadDeptsByOrg();
  const validDepts = new Set();
  Object.entries(deptsByOrg).forEach(([org, depts]) => {
    if (!orgs.has(org)) return;
    depts.forEach((d) => validDepts.add(`${org}\0${d}`));
  });

  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const out = [];

  for (let i = DATA_START - 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const loginId = trimCell(row[7]);
    if (!loginId || loginId === 'ログインID') continue;

    const paySite = trimCell(row[1]);
    const accountType = trimCell(row[2]);
    const org = trimCell(row[3]);
    const dept = trimCell(row[4]);
    const displayName = trimCell(row[5]);
    const loginName = trimCell(row[6]) || displayName;

    if (!orgs.has(org)) throw new Error(`row ${i + 1} unknown org: ${org}`);
    if (!validDepts.has(`${org}\0${dept}`)) throw new Error(`row ${i + 1} unknown dept: ${org}/${dept}`);

    out.push({
      pay_site: paySite || paySiteFromAccountType(accountType),
      account_type: accountType,
      org,
      dept,
      display_name: displayName,
      login_name: loginName,
      login_id: loginId,
      status: trimCell(row[8]) || '使用中',
      start_date: MIGRATION_START_DATE,
      end_date: '',
      note: trimCell(row[9]) || '',
    });
  }
  return out;
}

function rowToFields(row) {
  const rec = {
    pay_site: { value: row.pay_site },
    account_type: { value: row.account_type },
    org: { value: row.org },
    dept: { value: row.dept },
    display_name: { value: row.display_name },
    login_name: { value: row.login_name },
    login_id: { value: row.login_id },
    status: { value: row.status || '使用中' },
    start_date: { value: row.start_date },
    end_date: { value: '' },
  };
  if (row.note) rec.note = { value: row.note };
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
  console.log(`read ${rows.length} rows from ${xlsx}`);

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
    console.error(`app ${appId} already has ${n} records. Use --force`);
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
