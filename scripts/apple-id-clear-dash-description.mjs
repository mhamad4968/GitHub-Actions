#!/usr/bin/env node
/**
 * Apple ID ダッシュ（694）— アプリ説明を空にする
 *   npm run apple-id:clear-dash-description
 */
import {
  DASH_APP_NAME,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
} from './lib/apple-id-kintone.mjs';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const appId = state.dashAppId || 694;

  const found = await findAppByName(baseUrl, headers, DASH_APP_NAME);
  if (!found || Number(found.appId) !== appId) {
    console.log(`target app=${appId} name="${DASH_APP_NAME}"`);
  }

  if (dryRun) {
    console.log(`dry-run: clear description app=${appId}`);
    return;
  }

  const settingsRev = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(appId),
      name: DASH_APP_NAME,
      description: '',
      theme: 'GREEN',
    }),
  });
  console.log(`settings PUT revision=${settingsRev.revision} description=""`);
  await deployApp(baseUrl, headers, appId, settingsRev.revision);
  console.log(`done app=${appId} URL=${baseUrl}/k/${appId}/`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
