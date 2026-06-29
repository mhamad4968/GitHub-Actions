#!/usr/bin/env node
/**
 * メーリングリスト — Excel → DB REST 一括 POST
 *   npm run mailing-list:migrate:xlsx -- --dry-run
 *   npm run mailing-list:migrate:xlsx -- --apply
 */
import { existsSync } from 'node:fs';
import {
  DEFAULT_XLSX,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  readExcelRows,
  recordCount,
  rowToKintoneRecord,
  todayJstYmd,
} from './lib/mailing-list-kintone.mjs';

const BATCH = 100;

function parseArgs() {
  return {
    dryRun: process.argv.includes('--dry-run'),
    apply: process.argv.includes('--apply'),
    force: process.argv.includes('--force'),
    xlsx: process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || DEFAULT_XLSX,
    appId: process.argv.find((a) => a.startsWith('--app='))?.slice(6)
      ? Number(process.argv.find((a) => a.startsWith('--app=')).slice(6))
      : null,
  };
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
  if (!existsSync(xlsx)) {
    console.error(`xlsx not found: ${xlsx}`);
    process.exit(1);
  }

  const rows = readExcelRows(xlsx);
  const today = todayJstYmd();
  const records = rows.map((row) => rowToKintoneRecord(row, today, today));
  console.log(`source=${xlsx}`);
  console.log(`records=${records.length}`);

  if (dryRun) {
    console.log('sample[0]:', JSON.stringify(records[0], null, 2));
    console.log('sample[last]:', JSON.stringify(records[records.length - 1], null, 2));
    return;
  }

  const state = loadAppIds();
  const appId = appArg || state.dbAppId;
  if (!appId) {
    console.error('dbAppId missing');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const existing = await recordCount(baseUrl, headers, appId);
  console.log(`existingCount=${existing}`);
  if (existing > 0 && !force) {
    console.error('既存レコードあり。--force で続行');
    process.exit(1);
  }

  let posted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    const res = await postBatch(baseUrl, headers, appId, chunk);
    posted += chunk.length;
    console.log(`POST ${posted}/${records.length} ids=${(res.ids || []).slice(0, 3).join(',')}…`);
  }
  console.log(`done totalCount=${await recordCount(baseUrl, headers, appId)}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
