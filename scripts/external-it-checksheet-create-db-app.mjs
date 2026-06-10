#!/usr/bin/env node
import {
  DB_APP_NAME,
  SPACE_ID,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  loadFieldProperties,
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
  const properties = loadFieldProperties();
  const state = loadAppIds();
  const threadId = await resolveDefaultThreadId(baseUrl, headers, SPACE_ID);

  const existing = await findAppByName(baseUrl, headers, DB_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存 DB: appId=${appId}`);
    saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: appId });
    return;
  }

  console.log(`作成: "${DB_APP_NAME}" space=${SPACE_ID} thread=${threadId}`);
  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: DB_APP_NAME, space: SPACE_ID, thread: threadId }),
  });
  const appId = Number(add.app);
  await deployApp(baseUrl, headers, appId);

  await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });

  const settingsRev = await setAppSettings(
    baseUrl,
    headers,
    appId,
    DB_APP_NAME,
    '外部IT導入チェック正本。日常操作は「外部ITサービス導入チェックシート」ダッシュから。',
  );
  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log(`APP_ID=${appId}`);
  saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
