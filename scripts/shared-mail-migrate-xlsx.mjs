#!/usr/bin/env node
/**
 * 共有メール — Excel → データアプリ REST 一括 POST
 * 正本: docs/plans/2026-06-06-shared-mail-kintone-spec.md
 *
 *   npm run shared-mail:migrate:xlsx -- --dry-run
 *   npm run shared-mail:migrate:xlsx -- --apply
 */
import { existsSync } from 'node:fs';
import XLSX from './lib/xlsx-node.mjs';
import {
  DEFAULT_XLSX,
  STATUS_ACTIVE,
  USAGE_TYPE_DEFAULT,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  mailAccountFromAddress,
  recordCount,
} from './lib/shared-mail-kintone.mjs';

const BATCH = 100;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) ||
    process.env.SHARED_MAIL_XLSX ||
    DEFAULT_XLSX;
  const appArg = process.argv.find((a) => a.startsWith('--app='))?.slice(6);
  return { dryRun, apply, force, xlsx, appId: appArg ? Number(appArg) : null };
}

function readRows(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  let legacyNo = 0;

  for (const row of rows) {
    const mail = String(row['メールアドレス'] || '').trim();
    if (!mail) continue;
    legacyNo += 1;
    const usage = String(row['利用種別'] || USAGE_TYPE_DEFAULT).trim() || USAGE_TYPE_DEFAULT;
    const dept = String(row['利用部署'] || '').trim();
    const displayName = String(row['共有メールアドレス名'] || '').trim();
    const acctRaw = String(row['メールアカウント'] || '').trim();
    const pw = String(row['パスワード'] || '').trim();
    const acct = acctRaw || mailAccountFromAddress(mail);

    const rec = {
      legacy_no: { value: String(legacyNo) },
      usage_type: { value: usage },
      department: { value: dept },
      mailbox_display_name: { value: displayName },
      mail_address: { value: mail },
      mail_account: { value: acct },
      password: { value: pw },
      status: { value: STATUS_ACTIVE },
      registered_date: { value: today },
    };
    out.push(rec);
  }
  return out;
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

  const state = loadAppIds();
  const appId = appArg || state.dbAppId;
  if (!appId) {
    console.error('dbAppId missing. Run shared-mail:create-db first or pass --app=');
    process.exit(1);
  }

  const records = readRows(xlsx);
  console.log(`source=${xlsx}`);
  console.log(`records=${records.length}`);

  if (dryRun) {
    console.log('sample[0]:', JSON.stringify(records[0], null, 2));
    console.log('sample[last]:', JSON.stringify(records[records.length - 1], null, 2));
    return;
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

  const total = await recordCount(baseUrl, headers, appId);
  console.log(`done totalCount=${total}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
