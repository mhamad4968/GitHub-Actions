#!/usr/bin/env node
/**
 * Fetch all records from a kintone app (read-only GET, paginated).
 *
 * Usage:
 *   npm run app:records -- 83
 *   npm run app:records -- 83 --out scripts/data/app-83-records-snapshot.json
 *   npm run app:records -- 83 --query "order by レコード番号 asc"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { flattenRecord, getKintoneReadConfig, kintoneGetJson } from './lib/kintone-read-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const positional = [];
  let out = null;
  let query = 'order by レコード番号 asc';
  let pageSize = 500;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' && argv[i + 1]) {
      out = argv[++i];
    } else if (a === '--query' && argv[i + 1]) {
      query = argv[++i];
    } else if (a === '--limit' && argv[i + 1]) {
      pageSize = Math.min(500, Math.max(1, Number(argv[++i]) || 500));
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }

  return { appId: positional[0], out, query, pageSize };
}

const { appId, out, query, pageSize } = parseArgs(process.argv.slice(2));

if (!appId || !/^\d+$/.test(appId)) {
  console.error('Usage: npm run app:records -- <APP_ID> [--out path.json] [--query "order by ..."]');
  console.error('Example: npm run app:records -- 83 --out scripts/data/app-83-records-snapshot.json');
  process.exit(2);
}

const { baseUrl } = getKintoneReadConfig();
const allRecords = [];
let offset = 0;
let totalCount = null;

while (true) {
  const params = new URLSearchParams();
  params.set('app', appId);
  params.set('query', `${query} limit ${pageSize} offset ${offset}`);
  params.set('totalCount', 'true');

  const json = await kintoneGetJson(`${baseUrl}/k/v1/records.json?${params.toString()}`);
  if (totalCount == null && json.totalCount != null) {
    totalCount = Number(json.totalCount);
  }

  const batch = json.records || [];
  for (const r of batch) {
    allRecords.push(flattenRecord(r));
  }

  if (batch.length < pageSize) break;
  offset += batch.length;
  if (totalCount != null && offset >= totalCount) break;
}

const snapshot = {
  meta: {
    appId: Number(appId),
    fetchedAt: new Date().toISOString(),
    totalCount: totalCount ?? allRecords.length,
    recordCount: allRecords.length,
    query,
    baseUrl,
  },
  records: allRecords,
};

console.log(`App ${appId} records: ${allRecords.length}${totalCount != null ? ` (totalCount=${totalCount})` : ''}`);

for (const r of allRecords) {
  const keys = Object.keys(r).filter((k) => !['id', 'revision'].includes(k));
  const preview = keys
    .slice(0, 4)
    .map((k) => `${k}=${JSON.stringify(r[k])}`)
    .join('\t');
  console.log(`  #${r.id}\t${preview}`);
}

const outPath = out
  ? path.isAbsolute(out)
    ? out
    : path.join(REPO_ROOT, out)
  : path.join(REPO_ROOT, 'scripts', 'data', `app-${appId}-records-snapshot.json`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(`[app-records] snapshot -> ${outPath}`);
