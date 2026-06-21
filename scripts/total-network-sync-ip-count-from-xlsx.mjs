#!/usr/bin/env node
/**
 * Excel 一覧表の IP数 を kintone 拠点レコードに同期
 *
 *   npm run total-network:sync-ip-count -- --dry-run
 *   npm run total-network:sync-ip-count -- --apply
 */
import { fetchJson, getKintoneConfig, loadAppIds } from './lib/total-network-kintone.mjs';
import { readExcelSites } from './total-network-migrate-xlsx.mjs';

const BATCH = 100;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) ||
    process.env.TOTAL_NETWORK_XLSX ||
    'C:\\tmp\\トータルネットワークのネットワーク情報管理台帳\\トータルネットワークのネットワーク情報管理台帳.xlsx';
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }
  return { dryRun, xlsx };
}

async function fetchSites(baseUrl, headers, appId) {
  const all = [];
  let offset = 0;
  while (true) {
    const q = `record_type in ("site") order by sort_no asc limit ${BATCH} offset ${offset}`;
    const fields = ['$id', 'location_name', 'ip_count'];
    const fieldParams = fields.map((f, i) => `fields[${i}]=${encodeURIComponent(f)}`).join('&');
    const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}&${fieldParams}`;
    const j = await fetchJson(url, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    const rows = j.records || [];
    all.push(...rows);
    if (rows.length < BATCH) break;
    offset += BATCH;
  }
  return all;
}

async function main() {
  const { dryRun, xlsx } = parseArgs();
  const excelSites = readExcelSites(xlsx);
  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId } = loadAppIds();
  if (!dbAppId) throw new Error('dbAppId missing');

  const sites = await fetchSites(baseUrl, headers, dbAppId);
  const updates = [];
  const report = [];

  for (const rec of sites) {
    const name = rec.location_name?.value;
    const ex = excelSites.get(name);
    if (!ex || ex.ip_count === '') continue;
    const expected = String(ex.ip_count);
    const current = rec.ip_count?.value == null || rec.ip_count?.value === '' ? '' : String(rec.ip_count.value);
    report.push({ location_name: name, current, expected, match: current === expected });
    if (current !== expected) {
      updates.push({
        id: rec.$id.value,
        record: {
          ip_count: { value: Number(expected) },
        },
      });
    }
  }

  console.log(JSON.stringify({ xlsx, connectedInExcel: excelSites.size, updates: updates.length, report }, null, 2));

  if (!updates.length) {
    console.log('no changes needed');
    return;
  }
  if (dryRun) return;

  for (let i = 0; i < updates.length; i += BATCH) {
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: dbAppId, records: updates.slice(i, i + BATCH) }),
    });
  }
  console.log(`PUT OK ${updates.length} record(s)`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
