#!/usr/bin/env node
/**
 * トータルネットワーク — 移行検証（Excel 使用中 IP と kintone DB の diff）
 */
import { existsSync } from 'node:fs';
import {
  DEFAULT_XLSX,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/total-network-kintone.mjs';
import { readExcelAssignments } from './total-network-migrate-xlsx.mjs';

async function fetchAll(baseUrl, headers, appId, query, fields) {
  const all = [];
  let offset = 0;
  const PAGE = 500;
  while (true) {
    const q = `${query} limit ${PAGE} offset ${offset}`;
    const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`;
    const fieldParams = fields.map((f, i) => `fields[${i}]=${encodeURIComponent(f)}`).join('&');
    const j = await fetchJson(`${url}&${fieldParams}`, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    const rows = j.records || [];
    all.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

async function main() {
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || process.env.TOTAL_NETWORK_XLSX || DEFAULT_XLSX;
  if (!existsSync(xlsx)) throw new Error(`Excel not found: ${xlsx}`);

  const assignments = readExcelAssignments(xlsx);
  const expectedIps = new Set(assignments.map((a) => a.ip_address));

  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId } = loadAppIds();
  if (!dbAppId) throw new Error('dbAppId missing');

  const sites = await fetchAll(baseUrl, headers, dbAppId, 'record_type in ("site") order by sort_no asc', [
    'location_name',
    'total_network_enabled',
  ]);
  const ips = await fetchAll(baseUrl, headers, dbAppId, 'record_type in ("ip") order by ip_address asc', [
    'ip_address',
    'site_location_name',
    'device_type',
  ]);

  const dbIps = new Set(ips.map((r) => r.ip_address.value));
  const missing = [...expectedIps].filter((ip) => !dbIps.has(ip));
  const extra = [...dbIps].filter((ip) => !expectedIps.has(ip));
  const dupCheck = new Set();
  let dup = false;
  for (const ip of dbIps) {
    if (dupCheck.has(ip)) dup = true;
    dupCheck.add(ip);
  }

  const connected = sites.filter((s) => (s.total_network_enabled.value || []).includes('接続')).length;

  const report = {
    ok: missing.length === 0 && extra.length === 0 && !dup && sites.length === 22 && ips.length === expectedIps.size,
    sites: sites.length,
    connected,
    ipsDb: ips.length,
    ipsExpected: expectedIps.size,
    missing,
    extra,
    duplicateIp: dup,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
