#!/usr/bin/env node
/**
 * Apple ID — jbis.039〜933 未使用プール行を削除（管理者混乱防止）
 * 氏名あり行は残す（安全弁）
 *
 *   npm run apple-id:wipe-jbis-pool -- --dry-run
 *   npm run apple-id:wipe-jbis-pool -- --apply
 */
import { fetchJson, getKintoneConfig, loadAppIds, parseJbisNumber, recordCount } from './lib/apple-id-kintone.mjs';

const JBIS_POOL_MIN = 39;
const JBIS_POOL_MAX = 933;
const BATCH = 100;

function parseArgs() {
  return {
    dryRun: process.argv.includes('--dry-run'),
    apply: process.argv.includes('--apply'),
    min: Number(process.argv.find((a) => a.startsWith('--min='))?.slice(6) || JBIS_POOL_MIN),
    max: Number(process.argv.find((a) => a.startsWith('--max='))?.slice(6) || JBIS_POOL_MAX),
  };
}

async function fetchPoolCandidates(baseUrl, headers, appId, min, max) {
  const out = [];
  let offset = 0;
  while (true) {
    const q = `order by legacy_no asc limit 500 offset ${offset}`;
    const params = new URLSearchParams();
    params.set('app', String(appId));
    params.set('query', q);
    ['$id', 'apple_id', 'user_name', 'legacy_no'].forEach((f, i) => params.set(`fields[${i}]`, f));
    const j = await fetchJson(`${baseUrl}/k/v1/records.json?${params}`, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    for (const r of j.records || []) {
      const n = parseJbisNumber(r.apple_id?.value);
      if (n == null || n < min || n > max) continue;
      const userName = String(r.user_name?.value || '').trim();
      out.push({
        id: Number(r.$id?.value),
        legacy_no: r.legacy_no?.value,
        apple_id: r.apple_id?.value,
        user_name: userName,
        skip: Boolean(userName),
      });
    }
    if ((j.records || []).length < 500) break;
    offset += 500;
  }
  return out;
}

async function deleteIds(baseUrl, headers, appId, ids) {
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ app: appId, ids: chunk }),
    });
    console.log(`DELETE ${Math.min(i + chunk.length, ids.length)}/${ids.length}`);
  }
}

async function main() {
  const { dryRun, apply, min, max } = parseArgs();
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
  const before = await recordCount(baseUrl, headers, appId);
  const rows = await fetchPoolCandidates(baseUrl, headers, appId, min, max);
  const toDelete = rows.filter((r) => !r.skip);
  const kept = rows.filter((r) => r.skip);

  console.log(`app=${appId} range=jbis.${String(min).padStart(3, '0')}..${String(max).padStart(3, '0')}`);
  console.log(`before=${before} poolRows=${rows.length} delete=${toDelete.length} keepNamed=${kept.length}`);

  if (kept.length) {
    console.warn('WARN: 氏名ありのため削除スキップ:');
    kept.forEach((r) => console.warn(`  legacy=${r.legacy_no} ${r.apple_id} ${r.user_name}`));
  }

  if (dryRun) {
    console.log('sample delete:', toDelete.slice(0, 3).map((r) => r.apple_id).join(', '));
    console.log('sample delete last:', toDelete.slice(-3).map((r) => r.apple_id).join(', '));
    return;
  }

  if (!toDelete.length) {
    console.log('削除対象なし');
    return;
  }

  await deleteIds(
    baseUrl,
    headers,
    appId,
    toDelete.map((r) => r.id),
  );
  const after = await recordCount(baseUrl, headers, appId);
  console.log(`after=${after} removed=${before - after}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
