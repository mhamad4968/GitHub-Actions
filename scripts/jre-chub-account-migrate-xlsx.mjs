#!/usr/bin/env node
/** JRE-C_Hub — Excel → DB REST */
import {
  DEFAULT_XLSX,
  SHEET_MASTER,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  readExcelAccountRows,
  recordCount,
} from './lib/jre-chub-account-kintone.mjs';

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

function rowToFields(row) {
  const rec = {
    user_id: { value: row.user_id },
    user_name: { value: row.user_name },
    org: { value: row.org },
    dept: { value: row.dept },
    mail: { value: row.mail },
    start_date: { value: row.start_date },
    permissions: {
      value: row.permissions.map((p) => ({
        value: { perm: { value: p } },
      })),
    },
  };
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
  const { rows, skippedPerms } = readExcelAccountRows(xlsx);
  const multi = rows.filter((r) => r.permissions.length > 1).length;
  console.log(`read ${rows.length} rows from ${SHEET_MASTER} (${multi} with 2+ permissions)`);
  if (skippedPerms.length) {
    console.warn('skipped unknown continuation perms:', skippedPerms);
  }

  if (dryRun) {
    console.log(JSON.stringify(rows.filter((r) => r.permissions.length > 1).slice(0, 5), null, 2));
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
