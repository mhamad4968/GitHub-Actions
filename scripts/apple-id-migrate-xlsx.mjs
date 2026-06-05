#!/usr/bin/env node
/**
 * Apple ID — Excel icloud → データアプリ REST 一括 POST
 * 正本: docs/plans/2026-06-02-apple-id-kintone-spec.md §3・§10
 *
 *   npm run apple-id:migrate:xlsx -- --dry-run
 *   npm run apple-id:migrate:xlsx -- --apply
 *   npm run apple-id:migrate:xlsx -- --apply --force
 */
import { existsSync } from 'node:fs';
import XLSX from 'xlsx';
import {
  DEFAULT_XLSX,
  FIXED_LOCK,
  FIXED_PASSWORD,
  STATUS_ACTIVE,
  fetchJson,
  formatJbis,
  getKintoneConfig,
  JBIS_POOL_MAX,
  JBIS_START,
  loadAppIds,
  nextJbisSlot,
  normalizeDeviceType,
  normalizeUserName,
  parseJbisNumber,
  recordCount,
} from './lib/apple-id-kintone.mjs';

const SHEET = 'icloud';
const MAX_HEADER_SCAN = 8;
const BATCH = 100;

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, MAX_HEADER_SCAN); i++) {
    const headers = (rows[i] || []).map((h) => (h != null ? String(h).trim() : ''));
    if (headers.includes('No.') && headers.includes('アップルID')) return i;
  }
  return -1;
}

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const offsetArg = process.argv.find((a) => a.startsWith('--offset='))?.slice(9);
  const offset = offsetArg ? Number(offsetArg) : 0;
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) ||
    process.env.APPLE_ID_XLSX ||
    DEFAULT_XLSX;
  const appArg = process.argv.find((a) => a.startsWith('--app='))?.slice(6);
  return { dryRun, apply, force, offset, xlsx, appId: appArg ? Number(appArg) : null };
}

function colIndex(headers, name) {
  return headers.indexOf(name);
}

function parseLegacyNo(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(String(raw).replace(/,/g, '').trim());
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function parseDateCell(val) {
  if (val == null || val === '') return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  const m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (m) {
    return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  }
  const m2 = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (m2) {
    return `${m2[1]}-${String(m2[2]).padStart(2, '0')}-${String(m2[3]).padStart(2, '0')}`;
  }
  return null;
}

function readRows(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const ws = wb.Sheets[SHEET];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  const headerRowIndex = findHeaderRow(rows);
  if (headerRowIndex < 0) throw new Error('header row with No. + アップルID not found');
  const headers = (rows[headerRowIndex] || []).map((h) => (h != null ? String(h).trim() : ''));
  const idx = {
    no: colIndex(headers, 'No.'),
    reg: colIndex(headers, '登録日'),
    mdm: colIndex(headers, 'MDMアカウント名'),
    family: colIndex(headers, '姓'),
    given: colIndex(headers, '名'),
    phone: colIndex(headers, '回線番号'),
    apple: colIndex(headers, 'アップルID'),
    pw: colIndex(headers, 'パスワード'),
    lock: colIndex(headers, 'ロックパス'),
    device: colIndex(headers, '端末種別'),
  };
  if (idx.apple < 0) throw new Error('header アップルID missing');
  if (idx.no < 0) throw new Error('header No. missing');

  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  let dupSkipped = 0;
  let poolSkipped = 0;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const appleId = row[idx.apple] != null ? String(row[idx.apple]).trim() : '';
    if (!appleId) continue;
    const legacyNo = parseLegacyNo(row[idx.no]);
    if (legacyNo == null) continue;

    const reg =
      idx.reg >= 0 ? parseDateCell(row[idx.reg]) : null;
    const mdm = idx.mdm >= 0 && row[idx.mdm] != null ? String(row[idx.mdm]).trim() : '';
    const phone = idx.phone >= 0 && row[idx.phone] != null ? String(row[idx.phone]).trim() : '';
    const pwRaw = idx.pw >= 0 && row[idx.pw] != null ? String(row[idx.pw]).trim() : '';
    const lockRaw = idx.lock >= 0 && row[idx.lock] != null ? String(row[idx.lock]).trim() : '';
    const userName = normalizeUserName(
      idx.family >= 0 ? row[idx.family] : '',
      idx.given >= 0 ? row[idx.given] : '',
    );

    const jbisN = parseJbisNumber(appleId);
    if (jbisN != null && jbisN >= JBIS_START && jbisN <= JBIS_POOL_MAX && !userName) {
      poolSkipped++;
      continue;
    }

    let deviceRaw = '';
    if (idx.device >= 0 && row[idx.device] != null) deviceRaw = row[idx.device];
    else if (row.length > 10 && row[10] != null) deviceRaw = row[10];
    const deviceType = normalizeDeviceType(deviceRaw);

    const rec = {
      legacy_no: { value: String(legacyNo) },
      status: { value: STATUS_ACTIVE },
      registered_date: { value: reg || today },
      apple_id: { value: appleId },
      password: { value: pwRaw || FIXED_PASSWORD },
      lock_passcode: { value: lockRaw || FIXED_LOCK },
    };
    if (mdm) rec.mdm_name = { value: mdm };
    if (userName) rec.user_name = { value: userName };
    if (phone) rec.phone_number = { value: phone };
    if (deviceType) rec.device_type = { value: deviceType };
    out.push(rec);
  }
  out._dupSkipped = dupSkipped;
  out._poolSkipped = poolSkipped;
  return out;
}

function nextJbis039(records) {
  return nextJbisSlot(records).n;
}

async function postBatch(baseUrl, headers, appId, records) {
  return fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, records }),
  });
}

async function main() {
  const { dryRun, apply, force, offset, xlsx, appId: appArg } = parseArgs();
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
    console.error('dbAppId missing. Run apple-id-create-db-app.mjs first or pass --app=');
    process.exit(1);
  }

  let records = readRows(xlsx);
  const dupSkipped = records._dupSkipped || 0;
  const poolSkipped = records._poolSkipped || 0;
  if (offset > 0) records = records.slice(offset);
  const withName = records.filter((r) => r.user_name?.value).length;
  const allRows = readRows(xlsx);
  const nextNo = nextJbis039(allRows);

  console.log(`source=${xlsx}`);
  console.log(
    `records=${records.length} dupSkipped=${dupSkipped} poolSkipped=${poolSkipped} offset=${offset} withUserName=${withName} nextJbisSlot=${nextNo}`,
  );

  if (dryRun) {
    console.log('sample[0]:', JSON.stringify(records[0], null, 2));
    console.log('sample[last]:', JSON.stringify(records[records.length - 1], null, 2));
    return;
  }

  const { baseUrl, headers } = getKintoneConfig();
  const existing = await recordCount(baseUrl, headers, appId);
  console.log(`existingCount=${existing}`);
  if (existing > 0 && !force && offset === 0) {
    console.error('既存レコードあり。--force または --offset=N で続行');
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
