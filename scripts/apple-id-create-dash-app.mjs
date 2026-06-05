#!/usr/bin/env node
/**
 * Apple ID — ダッシュアプリ作成（Space 21 / thread 23）
 * 正本: docs/plans/2026-06-02-apple-id-kintone-spec.md §4・§9
 *
 *   npm run apple-id:create-dash
 */
import {
  DASH_APP_NAME,
  SPACE_ID,
  THREAD_ID,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  saveAppIds,
} from './lib/apple-id-kintone.mjs';

async function setAppSettings(baseUrl, headers, appId, name, description) {
  const body = {
    app: String(appId),
    name,
    description,
    theme: 'GREEN',
  };
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return j.revision;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const dbAppId = state.dbAppId;
  if (!dbAppId) {
    console.error('dbAppId missing. Run apple-id:create-db first.');
    process.exit(1);
  }

  const existing = await findAppByName(baseUrl, headers, DASH_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存ダッシュ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, dashAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ name: DASH_APP_NAME, space: SPACE_ID, thread: THREAD_ID, dbAppId }, null, 2));
    return;
  }

  console.log(`作成開始: "${DASH_APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID} dbApp=${dbAppId}`);

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: DASH_APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  console.log(`app=${appId} revision=${add.revision}`);

  await deployApp(baseUrl, headers, appId);
  console.log('空アプリ deploy OK');

  const settingsRev = await setAppSettings(
    baseUrl,
    headers,
    appId,
    DASH_APP_NAME,
    '',
  );
  console.log(`設定 revision=${settingsRev}`);

  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log('');
  console.log(`DASH_APP_ID=${appId}`);
  console.log(`DB_APP_ID=${dbAppId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);

  saveAppIds({ ...state, dashAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
