#!/usr/bin/env node
/**
 * Apple ID DB — 全レコード削除（移行やり直し用）
 *   npm run apple-id:wipe -- --dry-run
 *   npm run apple-id:wipe -- --apply
 */
import { fetchJson, getKintoneConfig, loadAppIds, recordCount } from './lib/apple-id-kintone.mjs';

async function fetchAllIds(baseUrl, headers, appId) {
  const ids = [];
  let offset = 0;
  while (true) {
    const q = encodeURIComponent(`order by $id asc limit 500 offset ${offset}`);
    const j = await fetchJson(`${baseUrl}/k/v1/records.json?app=${appId}&query=${q}&fields[0]=$id`, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    const chunk = (j.records || []).map((r) => r.$id.value);
    if (!chunk.length) break;
    ids.push(...chunk);
    if (chunk.length < 500) break;
    offset += 500;
  }
  return ids;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }
  const appId = loadAppIds().dbAppId;
  if (!appId) {
    console.error('dbAppId missing');
    process.exit(1);
  }
  const { baseUrl, headers } = getKintoneConfig();
  const total = await recordCount(baseUrl, headers, appId);
  console.log(`app=${appId} totalCount=${total}`);
  if (total === 0) {
    console.log('nothing to delete');
    return;
  }
  if (dryRun) return;

  const ids = await fetchAllIds(baseUrl, headers, appId);
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ app: appId, ids: chunk }),
    });
    console.log(`deleted ${Math.min(i + 100, ids.length)}/${ids.length}`);
  }
  const after = await recordCount(baseUrl, headers, appId);
  console.log(`done totalCount=${after}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
