#!/usr/bin/env node
/**
 * 東海支店 iPad — Excel → DB REST 一括 POST（25 台）
 * 正本: docs/plans/2026-07-28-tokai-ipad-ledger-kintone-spec.md §8
 *
 *   npm run tokai-ipad:migrate:xlsx -- --dry-run
 *   npm run tokai-ipad:migrate:xlsx -- --apply
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import XLSX from './lib/xlsx-node.mjs';
import {
  DEFAULT_XLSX,
  LOCATIONS,
  fetchJson,
  formatDateYmd,
  getKintoneConfig,
  loadAppIds,
  parseTokaiSeq,
  recordCount,
  trimCell,
} from './lib/tokai-ipad-kintone.mjs';

const BATCH = 100;
const DATA_START_ROW = 3;
const EXPECTED_COUNT = 25;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const xlsxArg = process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7);
  const xlsx = xlsxArg || process.env.TOKAI_IPAD_XLSX || DEFAULT_XLSX;
  const appArg = process.argv.find((a) => a.startsWith('--app='))?.slice(6);
  return { dryRun, apply, force, xlsx, appId: appArg ? Number(appArg) : null };
}

function cellToString(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'number' && Number.isFinite(v)) {
    // 共有パスコード等: 251100 → "251100"（科学表記にしない）
    return Number.isInteger(v) ? String(v) : String(v);
  }
  return trimCell(v);
}

function readExcelRows(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = wb.Sheets['Sheet1'] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const out = [];

  for (let i = DATA_START_ROW; i < rows.length; i++) {
    const row = rows[i] || [];
    const device = trimCell(row[2]);
    if (!device) continue;
    if (parseTokaiSeq(device) == null) {
      throw new Error(`row ${i + 1}: invalid device_name "${device}" (expect tokaiNN)`);
    }

    const location = trimCell(row[0]);
    if (!LOCATIONS.includes(location)) {
      throw new Error(`row ${i + 1}: unknown location "${location}"`);
    }

    const userName = trimCell(row[1]);
    if (!userName) throw new Error(`row ${i + 1}: missing user_name device=${device}`);

    const rentalStart = formatDateYmd(row[3]);
    if (!rentalStart) throw new Error(`row ${i + 1}: missing/invalid rental_start_date device=${device}`);

    out.push({
      location,
      user_name: userName,
      device_name: device.toLowerCase().startsWith('tokai') ? `tokai${device.slice(5)}` : device,
      rental_start_date: rentalStart,
      model: cellToString(row[4]),
      phone_number: cellToString(row[5]),
      imei: cellToString(row[6]),
      iccid: cellToString(row[7]),
      apple_serial: cellToString(row[8]),
      shared_passcode: cellToString(row[9]),
      m365_id: cellToString(row[10]),
      m365_pw: cellToString(row[11]),
      vpn_id: cellToString(row[12]),
      vpn_pw: cellToString(row[13]),
      status: '有効',
    });
  }
  return out;
}

function rowToFields(row) {
  const rec = {
    location: { value: row.location },
    user_name: { value: row.user_name },
    device_name: { value: row.device_name },
    rental_start_date: { value: row.rental_start_date },
    status: { value: row.status },
  };
  for (const key of [
    'model',
    'phone_number',
    'imei',
    'iccid',
    'apple_serial',
    'shared_passcode',
    'm365_id',
    'm365_pw',
    'vpn_id',
    'vpn_pw',
  ]) {
    if (row[key]) rec[key] = { value: row[key] };
  }
  return rec;
}

function normalizeDeviceKey(name) {
  return trimCell(name).toLowerCase();
}

function preflight(rows) {
  const devices = new Set();
  rows.forEach((r) => {
    const dn = normalizeDeviceKey(r.device_name);
    if (devices.has(dn)) throw new Error(`duplicate device_name: ${r.device_name}`);
    devices.add(dn);
  });
}

function redact(rec) {
  const o = { ...rec };
  for (const k of ['m365_pw', 'vpn_pw', 'shared_passcode']) {
    if (o[k]) o[k] = { value: '***' };
  }
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
  if (rows.length !== EXPECTED_COUNT) {
    throw new Error(`expected ${EXPECTED_COUNT} rows, got ${rows.length}`);
  }

  // device_name 正規化: tokai01 形式を維持（Excel が tokai01 ならそのまま）
  for (const r of rows) {
    const seq = parseTokaiSeq(r.device_name);
    if (seq == null) throw new Error(`bad device after parse: ${r.device_name}`);
    r.device_name = `tokai${String(seq).padStart(2, '0')}`;
  }

  if (dryRun) {
    console.log('sample[0]:', JSON.stringify(redact(rowToFields(rows[0])), null, 2));
    console.log('sample[last]:', JSON.stringify(redact(rowToFields(rows[rows.length - 1])), null, 2));
    console.log(
      'dates:',
      rows.slice(0, 3).map((r) => ({ device: r.device_name, date: r.rental_start_date })),
    );
    return;
  }

  const state = loadAppIds();
  const appId = appArg || state.dbAppId;
  if (!appId) {
    console.error('dbAppId missing. Run tokai-ipad:create-db first or pass --app=');
    process.exit(1);
  }
  if (appId === 720 || appId === 721) {
    throw new Error(`Safety abort: refuse migrate to forbidden app ${appId}`);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const existing = await recordCount(baseUrl, headers, appId);
  console.log(`app=${appId} existingCount=${existing}`);
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
    console.log(`POST ${posted}/${records.length} ids=${(res.ids || []).slice(0, 5).join(',')}…`);
  }

  const total = await recordCount(baseUrl, headers, appId);
  if (total !== EXPECTED_COUNT && !force) {
    console.warn(`WARN: expected total ${EXPECTED_COUNT}, got ${total}`);
  }
  console.log(`done totalCount=${total}`);
  console.log(`xlsxBasename=${path.basename(xlsx)}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
