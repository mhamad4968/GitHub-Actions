#!/usr/bin/env node
/**
 * トータルネットワーク — Excel 初回移行（用途 seed + 拠点22 + 使用中IPのみ）
 *
 *   npm run total-network:migrate:xlsx -- --dry-run
 *   npm run total-network:migrate:xlsx -- --apply
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import {
  DEFAULT_XLSX,
  DEVICE_TYPE_SEED,
  IP_STATUS_IN_USE,
  RECORD_TYPE_DEVICE_TYPE,
  RECORD_TYPE_IP,
  RECORD_TYPE_SITE,
  enumerateIpRange,
  fetchJson,
  getKintoneConfig,
  ipToLong,
  loadAppIds,
  loadLocations,
  parseIpRange,
  stripLocationPrefix,
  trimCell,
} from './lib/total-network-kintone.mjs';

const CHECKBOX_CONNECTED = 'IPアドレス固定';
const CHECKBOX_CONNECTED_LEGACY = '接続';
const WANGAN_IP_COUNT_DEFAULT = '16';

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || process.env.TOTAL_NETWORK_XLSX || DEFAULT_XLSX;
  const appArg = process.argv.find((a) => a.startsWith('--app='))?.slice(6);
  return { dryRun, apply, force, xlsx, appId: appArg ? Number(appArg) : null };
}

export function readExcelSites(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = wb.Sheets['一覧表'];
  if (!sheet) throw new Error('シート「一覧表」が見つかりません');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const map = new Map();
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] || [];
    const rawName = trimCell(row[0]);
    if (!rawName) continue;
    const location_name = stripLocationPrefix(rawName);
    const range = parseIpRange(row[7]);
    const ipCountRaw = row[6];
    let ip_count = ipCountRaw === '' || ipCountRaw == null ? '' : String(ipCountRaw);
    if (ip_count === '' && location_name === '湾岸工事所') ip_count = WANGAN_IP_COUNT_DEFAULT;
    map.set(location_name, {
      location_name,
      network_address: trimCell(row[1]),
      subnet_mask: trimCell(row[2]),
      gateway: trimCell(row[3]),
      dns_primary: trimCell(row[4]),
      dns_secondary: trimCell(row[5]),
      ip_count,
      ip_range_start: range.start,
      ip_range_end: range.end,
      address: trimCell(row[8]),
      note: trimCell(row[9]),
    });
  }
  return map;
}

export function readExcelAssignments(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = wb.Sheets['IPアドレスレンジマトリックス'];
  if (!sheet) throw new Error('シート「IPアドレスレンジマトリックス」が見つかりません');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const siteRow = rows[3] || [];
  const sites = [];
  for (let c = 1; c < siteRow.length; c += 2) {
    const name = trimCell(siteRow[c]);
    if (name) sites.push({ col: c, name });
  }
  const out = [];
  for (let r = 4; r < rows.length; r++) {
    for (const s of sites) {
      const ip = trimCell(rows[r][s.col]);
      const use = trimCell(rows[r][s.col + 1]);
      if (/^\d+\.\d+\.\d+\.\d+$/.test(ip) && use) {
        out.push({ site_location_name: s.name, ip_address: ip, device_type: use });
      }
    }
  }
  return out;
}

function buildSiteRecords(excelSites) {
  const locations = loadLocations();
  return locations.map((loc) => {
    const ex = excelSites.get(loc.location_name);
    const enabled = Boolean(ex);
    const rec = {
      record_type: { value: RECORD_TYPE_SITE },
      sort_no: { value: String(loc.sort_no) },
      location_name: { value: loc.location_name },
      total_network_enabled: { value: enabled ? [CHECKBOX_CONNECTED] : [] },
    };
    if (ex) {
      rec.network_address = { value: ex.network_address };
      rec.subnet_mask = { value: ex.subnet_mask };
      rec.gateway = { value: ex.gateway };
      rec.dns_primary = { value: ex.dns_primary };
      rec.dns_secondary = { value: ex.dns_secondary };
      if (ex.ip_count !== '') rec.ip_count = { value: ex.ip_count };
      rec.ip_range_start = { value: ex.ip_range_start };
      rec.ip_range_end = { value: ex.ip_range_end };
      rec.address = { value: ex.address };
      rec.note = { value: ex.note };
    }
    return rec;
  });
}

function buildDeviceTypeRecords() {
  return DEVICE_TYPE_SEED.map((d) => ({
    record_type: { value: RECORD_TYPE_DEVICE_TYPE },
    sort_no: { value: String(d.sort_no) },
    device_type_code: { value: d.device_type_code },
    device_type_label: { value: d.device_type_label },
    is_active: { value: ['有効'] },
  }));
}

function buildIpRecords(assignments, siteByName) {
  const ips = new Set();
  const out = [];
  for (const a of assignments) {
    if (ips.has(a.ip_address)) {
      throw new Error(`Excel 内 IP 重複: ${a.ip_address}`);
    }
    ips.add(a.ip_address);
    const site = siteByName.get(a.site_location_name);
    if (!site) throw new Error(`未知の拠点: ${a.site_location_name}`);
    const range = enumerateIpRange(site.ip_range_start, site.ip_range_end);
    const idx = range.indexOf(a.ip_address);
    if (idx < 0) {
      throw new Error(`IP ${a.ip_address} が拠点 ${a.site_location_name} の範囲外`);
    }
    const rec = {
      record_type: { value: RECORD_TYPE_IP },
      site_location_name: { value: a.site_location_name },
      ip_address: { value: a.ip_address },
      status: { value: IP_STATUS_IN_USE },
      device_type: { value: a.device_type },
      sort_index: { value: String(idx + 1) },
    };
    out.push(rec);
  }
  out.sort((x, y) => {
    const sx = siteByName.get(x.site_location_name.value);
    const sy = siteByName.get(y.site_location_name.value);
    const sn = (sx?.sort_no || 0) - (sy?.sort_no || 0);
    if (sn !== 0) return sn;
    return ipToLong(x.ip_address.value) - ipToLong(y.ip_address.value);
  });
  return out;
}

async function fetchCount(baseUrl, headers, appId, query) {
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(query)}&totalCount=true&limit=1`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return Number(j.totalCount || 0);
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

  const excelSites = readExcelSites(xlsx);
  const assignments = readExcelAssignments(xlsx);
  const siteRecords = buildSiteRecords(excelSites);
  const deviceTypeRecords = buildDeviceTypeRecords();

  const siteByName = new Map();
  siteRecords.forEach((r) => {
    siteByName.set(r.location_name.value, {
      sort_no: Number(r.sort_no.value),
      ip_range_start: r.ip_range_start?.value || '',
      ip_range_end: r.ip_range_end?.value || '',
    });
  });
  const ipRecords = buildIpRecords(assignments, siteByName);

  const existing = await fetchCount(baseUrl, headers, appId, 'record_type in ("site")');
  if (existing > 0 && !force) {
    throw new Error(`既に site レコード ${existing} 件あり。--force で上書き投入（手動削除後推奨）`);
  }

  const summary = {
    appId,
    xlsx,
    sites: siteRecords.length,
    connected: siteRecords.filter((r) => r.total_network_enabled.value.length).length,
    deviceTypes: deviceTypeRecords.length,
    ips: ipRecords.length,
    assignments: assignments.map((a) => `${a.site_location_name}\t${a.ip_address}\t${a.device_type}`),
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log('投入開始…');
  for (let i = 0; i < deviceTypeRecords.length; i += BATCH) {
    await postBatch(baseUrl, headers, appId, deviceTypeRecords.slice(i, i + BATCH));
  }
  console.log(`用途マスタ ${deviceTypeRecords.length} 件`);

  for (let i = 0; i < siteRecords.length; i += BATCH) {
    await postBatch(baseUrl, headers, appId, siteRecords.slice(i, i + BATCH));
  }
  console.log(`拠点 ${siteRecords.length} 件`);

  for (let i = 0; i < ipRecords.length; i += BATCH) {
    await postBatch(baseUrl, headers, appId, ipRecords.slice(i, i + BATCH));
  }
  console.log(`使用中 IP ${ipRecords.length} 件`);
  console.log('移行完了');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
