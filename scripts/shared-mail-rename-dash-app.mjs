#!/usr/bin/env node
/**
 * 共有メール 696 — ダッシュアプリ表示名変更
 *   共有メールアドレス管理台帳 → メールアドレス管理台帳
 *
 *   npm run shared-mail:rename-dash -- --dry-run
 *   npm run shared-mail:rename-dash -- --apply
 */
import {
  DASH_APP_NAME,
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/shared-mail-kintone.mjs';

const OLD_DASH_NAME = 'メールアドレス管理台帳（PC台帳に登録出来ない社員含む）';

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

  const { dashAppId } = loadAppIds();
  if (!dashAppId) {
    console.error('dashAppId missing in scripts/data/shared-mail-app-ids.json');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  console.log(`oldName: "${OLD_DASH_NAME}"`);
  console.log(`newName: "${DASH_APP_NAME}"`);
  await renameApp(baseUrl, headers, dashAppId, DASH_APP_NAME, dryRun);
  if (dryRun) console.log('dry-run done');
  else console.log('rename done');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
