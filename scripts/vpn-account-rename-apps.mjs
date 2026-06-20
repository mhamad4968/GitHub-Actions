#!/usr/bin/env node
/**
 * VPN 733/734 — アプリ表示名変更
 *   DB:  VPNアカウント管理台帳用DB
 *   Dash: VPNアカウント台帳
 *
 *   npm run vpn-account:rename-apps -- --dry-run
 *   npm run vpn-account:rename-apps -- --apply
 */
import {
  DB_APP_NAME,
  DASH_APP_NAME,
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/vpn-account-kintone.mjs';

const OLD_DB_NAME = 'VPNアカウント管理台帳用DB（@kensetsutoso.fre）';
const OLD_DASH_NAME = 'VPNアカウント管理台帳（@kensetsutoso.fre）';

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  return { dryRun, apply };
}

async function getSettings(baseUrl, headers, appId) {
  const url = `${baseUrl}/k/v1/preview/app/settings.json?app=${appId}`;
  return fetchJson(url, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
}

async function renameApp(baseUrl, headers, appId, newName, dryRun) {
  const cur = await getSettings(baseUrl, headers, appId);
  const oldName = cur.name || '';
  console.log(`app=${appId} "${oldName}" -> "${newName}"`);
  if (oldName === newName) {
    console.log(`  skip (already "${newName}")`);
    return;
  }
  if (dryRun) return;
  const res = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(appId),
      name: newName,
      description: cur.description || '',
      theme: cur.theme || 'GREEN',
    }),
  });
  await deployApp(baseUrl, headers, appId, res.revision);
  console.log(`  deploy OK revision=${res.revision}`);
}

async function main() {
  const { dryRun, apply } = parseArgs();
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }

  const { dbAppId, dashAppId } = loadAppIds();
  if (!dbAppId || !dashAppId) {
    console.error('app ids missing in scripts/data/vpn-account-app-ids.json');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  console.log(`oldNames: DB="${OLD_DB_NAME}" DASH="${OLD_DASH_NAME}"`);
  console.log(`newNames: DB="${DB_APP_NAME}" DASH="${DASH_APP_NAME}"`);

  await renameApp(baseUrl, headers, dbAppId, DB_APP_NAME, dryRun);
  await renameApp(baseUrl, headers, dashAppId, DASH_APP_NAME, dryRun);

  if (dryRun) console.log('dry-run done');
  else console.log('rename done');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
