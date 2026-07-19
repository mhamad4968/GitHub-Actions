#!/usr/bin/env node
/**
 * Wi-Fi SSID — Excel → データアプリ REST 一括 POST（22 件）
 * 正本: docs/plans/2026-06-14-wifi-ssid-kintone-spec.md §6
 *
 *   npm run wifi-ssid:migrate:xlsx -- --dry-run
 *   npm run wifi-ssid:migrate:xlsx -- --apply
 */
import { existsSync } from 'node:fs';
import XLSX from './lib/xlsx-node.mjs';
import {
  DEFAULT_XLSX,
  EQUIPMENT_NONE,
  MIGRATION_REGISTERED_DATE,
  MIGRATION_RECORDS,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  recordCount,
  trimCredential,
} from './lib/wifi-ssid-kintone.mjs';

const BATCH = 100;
const DATA_START_ROW = 3;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || process.env.WIFI_SSID_XLSX || DEFAULT_XLSX;
  const appArg = process.argv.find((a) => a.startsWith('--app='))?.slice(6);
  return { dryRun, apply, force, xlsx, appId: appArg ? Number(appArg) : null };
}

/** Parse Excel blocks — passwords are never logged */
function readExcelBlocks(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });
  const blocks = new Map();
  let currentLoc = '';

  for (let i = DATA_START_ROW; i < rows.length; i++) {
    const row = rows[i] || [];
    const locCell = trimCredential(row[0]);
    if (locCell) currentLoc = locCell;
    if (!currentLoc) continue;

    const ssid = trimCredential(row[1]);
    const password = trimCredential(row[2]);
    if (!ssid && !password) continue;

    if (!blocks.has(currentLoc)) blocks.set(currentLoc, []);
    blocks.get(currentLoc).push({ ssid, password });
  }
  return blocks;
}

function blockToFields(block, plan) {
  const date = MIGRATION_REGISTERED_DATE;
  if (plan.equipmentNone || (block[0] && block[0].ssid === EQUIPMENT_NONE)) {
    return {
      sort_no: { value: String(plan.sort_no) },
      location_name: { value: plan.location_name },
      ssid_1: { value: EQUIPMENT_NONE },
      password_1: { value: EQUIPMENT_NONE },
      ssid_2: { value: EQUIPMENT_NONE },
      password_2: { value: EQUIPMENT_NONE },
      registered_date: { value: date },
      updated_date: { value: date },
    };
  }

  const s1 = block[0] || { ssid: '', password: '' };
  const s2 = block[1] || { ssid: '', password: '' };
  const rec = {
    sort_no: { value: String(plan.sort_no) },
    location_name: { value: plan.location_name },
    ssid_1: { value: s1.ssid },
    password_1: { value: s1.password },
    registered_date: { value: date },
    updated_date: { value: date },
  };
  if (s2.ssid) {
    rec.ssid_2 = { value: s2.ssid };
    rec.password_2 = { value: s2.password };
  }
  return rec;
}

function buildRecords(xlsxPath) {
  const blocks = readExcelBlocks(xlsxPath);
  const out = [];
  for (const plan of MIGRATION_RECORDS) {
    const block = blocks.get(plan.excelLoc);
    if (!block) throw new Error(`Excel block not found: ${plan.excelLoc}`);
    out.push(blockToFields(block, plan));
  }
  return out;
}

function redactRecord(rec) {
  const o = { ...rec };
  if (o.password_1) o.password_1 = { value: '***' };
  if (o.password_2) o.password_2 = { value: o.password_2?.value ? '***' : undefined };
  return o;
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

  const records = buildRecords(xlsx);
  console.log(`source=${xlsx}`);
  console.log(`records=${records.length}`);

  if (dryRun) {
    console.log('sample[0]:', JSON.stringify(redactRecord(records[0]), null, 2));
    console.log('sample[11]:', JSON.stringify(redactRecord(records[11]), null, 2));
    console.log('sample[last]:', JSON.stringify(redactRecord(records[records.length - 1]), null, 2));
    return;
  }

  const state = loadAppIds();
  const appId = appArg || state.dbAppId;
  if (!appId) {
    console.error('dbAppId missing. Run wifi-ssid:create-db first or pass --app=');
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

  const total = await recordCount(baseUrl, headers, appId);
  console.log(`done totalCount=${total}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
