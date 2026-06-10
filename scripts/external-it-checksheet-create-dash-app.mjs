#!/usr/bin/env node
import {
  DASH_APP_NAME,
  SPACE_ID,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  resolveDefaultThreadId,
  saveAppIds,
} from './lib/external-it-checksheet-kintone.mjs';

async function setAppSettings(baseUrl, headers, appId, name, description) {
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: String(appId), name, description, theme: 'BLUE' }),
  });
  return j.revision;
}

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const threadId = state.threadId || (await resolveDefaultThreadId(baseUrl, headers, SPACE_ID));
  if (!state.dbAppId) {
    console.error('Run external-it-checksheet:create-db first.');
    process.exit(1);
  }

  const existing = await findAppByName(baseUrl, headers, DASH_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存ダッシュ: appId=${appId}`);
    saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: state.dbAppId, dashAppId: appId });
    return;
  }

  console.log(`作成: "${DASH_APP_NAME}" dbApp=${state.dbAppId}`);
  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: DASH_APP_NAME, space: SPACE_ID, thread: threadId }),
  });
  const appId = Number(add.app);
  await deployApp(baseUrl, headers, appId);

  const settingsRev = await setAppSettings(
    baseUrl,
    headers,
    appId,
    DASH_APP_NAME,
    '外部ITサービス導入チェック（一覧 + チェック表モーダル + 印刷）。',
  );
  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log(`DASH_APP_ID=${appId} DB_APP_ID=${state.dbAppId}`);
  saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: state.dbAppId, dashAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
