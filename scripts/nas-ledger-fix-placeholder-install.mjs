#!/usr/bin/env node
/** 設備なし3行の install_place を「-」に修正（748 正本） */
import {
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  PLACEHOLDER_ROWS,
} from './lib/nas-ledger-kintone.mjs';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId: appId } = loadAppIds();
  if (!appId) throw new Error('dbAppId missing');

  const orgNames = PLACEHOLDER_ROWS.map((r) => r.org_name);
  const query = 'order by sort_no asc limit 100';
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(query)}`;
  const res = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const records = res.records || [];

  const targets = records.filter((rec) => {
    const org = rec.org_name?.value || '';
    const note = rec.note?.value || '';
    return orgNames.includes(org) && note === '設備なし';
  });

  if (targets.length === 0) {
    console.log('[fix] no placeholder rows found — nothing to do');
    return;
  }

  const updates = targets.map((rec) => {
    const org = rec.org_name?.value || '';
    const current = rec.install_place?.value || '';
    console.log(`[fix] $id=${rec.$id.value} org=${org} install_place=${JSON.stringify(current)} → "-"`);
    return {
      id: rec.$id.value,
      record: { install_place: { value: '-' } },
    };
  });

  if (dryRun) {
    console.log(`[dry-run] would PUT ${updates.length} record(s)`);
    return;
  }

  await fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: appId, records: updates }),
  });
  console.log(`[fix] SUCCESS updated ${updates.length} record(s)`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
