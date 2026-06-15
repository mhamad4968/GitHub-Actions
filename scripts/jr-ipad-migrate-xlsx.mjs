#!/usr/bin/env node
/**
 * JR iPad — Excel → DB REST 一括 POST（64 台）
 * 正本: docs/plans/2026-06-15-jr-ipad-ledger-kintone-spec.md §10
 *
 *   npm run jr-ipad:migrate:xlsx -- --dry-run
 *   npm run jr-ipad:migrate:xlsx -- --apply
 */
import { existsSync } from 'node:fs';
import XLSX from 'xlsx';
import {
  DEFAULT_XLSX,
  MGMT_DEPTS,
  PURCHASE_VENDORS,
  STATUS_VALUES,
  deptSortNo,
  fetchJson,
  formatDateYmd,
  getKintoneConfig,
  isDeviceRow,
  loadAppIds,
  normalizeModel,
  normalizePhoneDigits,
  recordCount,
  trimCell,
} from './lib/jr-ipad-kintone.mjs';

const BATCH = 100;
const DATA_START_ROW = 3;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || process.env.JR_IPAD_XLSX || DEFAULT_XLSX;
  const appArg = process.argv.find((a) => a.startsWith('--app='))?.slice(6);
  return { dryRun, apply, force, xlsx, appId: appArg ? Number(appArg) : null };
}

function normalizeStatus(raw) {
  const s = trimCell(raw) || '待機';
  if (!STATUS_VALUES.includes(s)) throw new Error(`invalid status: ${s}`);
  return s;
}

function normalizeVendor(raw) {
  const v = trimCell(raw) || 'au';
  if (!PURCHASE_VENDORS.includes(v)) throw new Error(`invalid purchase_vendor: ${v}`);
  return v;
}

function normalizePhoneDisplay(raw) {
  return String(raw == null ? '' : raw).normalize('NFKC').replace(/\s+/g, '');
}

function readExcelRows(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = wb.Sheets['JRシステム用iPad'] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const out = [];

  for (let i = DATA_START_ROW; i < rows.length; i++) {
    const row = rows[i] || [];
    const col0 = trimCell(row[0]);
    if (col0.includes('集計') || col0.includes('拠点保管')) break;

    const device = trimCell(row[2]);
    if (!isDeviceRow(device)) continue;

    const dept = trimCell(row[1]);
    const sortNo = deptSortNo(dept);
    if (sortNo == null) throw new Error(`unknown mgmt_dept row ${i + 1}: ${dept}`);

    const phone = normalizePhoneDisplay(row[3]);
    if (!phone) throw new Error(`missing phone row ${i + 1} device=${device}`);

    const purchaseDate = formatDateYmd(row[9]);
    if (!purchaseDate) throw new Error(`missing purchase_date row ${i + 1} device=${device}`);

    const model = normalizeModel(row[8]);
    if (!model) throw new Error(`missing model row ${i + 1} device=${device}`);

    out.push({
      status: normalizeStatus(row[0]),
      mgmt_dept: dept,
      sort_no: sortNo,
      device_name: device,
      phone_number: phone,
      apple_id: trimCell(row[4]),
      apple_pw: trimCell(row[5]) || 'Honten00',
      loan_company: trimCell(row[6]),
      loan_person: trimCell(row[7]),
      model,
      purchase_date: purchaseDate,
      purchase_vendor: normalizeVendor(row[10]),
      note: trimCell(row[11]),
    });
  }
  return out;
}

function rowToFields(row) {
  const rec = {
    sort_no: { value: String(row.sort_no) },
    status: { value: row.status },
    mgmt_dept: { value: row.mgmt_dept },
    device_name: { value: row.device_name },
    phone_number: { value: row.phone_number },
    apple_id: { value: row.apple_id },
    apple_pw: { value: row.apple_pw },
    model: { value: row.model },
    purchase_date: { value: row.purchase_date },
    purchase_vendor: { value: row.purchase_vendor },
  };
  if (row.loan_company) rec.loan_company = { value: row.loan_company };
  if (row.loan_person) rec.loan_person = { value: row.loan_person };
  if (row.note) rec.note = { value: row.note };
  return rec;
}

function preflight(rows) {
  const devices = new Set();
  const phones = new Set();
  rows.forEach((r) => {
    const dn = r.device_name.toLowerCase();
    if (devices.has(dn)) throw new Error(`duplicate device_name: ${r.device_name}`);
    devices.add(dn);
    const pd = normalizePhoneDigits(r.phone_number);
    if (phones.has(pd)) throw new Error(`duplicate phone_number digits: ${r.phone_number}`);
    phones.add(pd);
  });
}

function redact(rec) {
  const o = { ...rec };
  if (o.apple_pw) o.apple_pw = { value: '***' };
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

  const rows = readExcelRows(xlsx);
  preflight(rows);
  console.log(`source=${xlsx}`);
  console.log(`records=${rows.length}`);
  if (rows.length !== 64) {
    console.warn(`WARN: expected 64 rows, got ${rows.length}`);
  }

  if (dryRun) {
    console.log('sample[0]:', JSON.stringify(redact(rowToFields(rows[0])), null, 2));
    console.log('sample[last]:', JSON.stringify(redact(rowToFields(rows[rows.length - 1])), null, 2));
    return;
  }

  const state = loadAppIds();
  const appId = appArg || state.dbAppId;
  if (!appId) {
    console.error('dbAppId missing. Run jr-ipad:create-db first or pass --app=');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const existing = await recordCount(baseUrl, headers, appId);
  console.log(`existingCount=${existing}`);
  if (existing > 0 && !force) {
    console.error('既存レコードあり。--force で続行');
    process.exit(1);
  }

  const records = rows.map(rowToFields);
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
