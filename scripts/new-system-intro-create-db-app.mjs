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
} from './lib/new-system-intro-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const properties = loadFieldProperties();
  const state = loadAppIds();
  const threadId = await resolveDefaultThreadId(baseUrl, headers, SPACE_ID);

  const existing = await findAppByName(baseUrl, headers, DB_APP_NAME);
  if (existing) {
    console.log(`既存 DB: appId=${existing.appId}`);
    saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: Number(existing.appId) });
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
  const settingsRev = (
    await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: String(appId),
        name: DB_APP_NAME,
        description: '新規システム導入ヒアリング正本。操作はダッシュから。',
        theme: 'GREEN',
      }),
    })
  ).revision;
  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log(`APP_ID=${appId}`);
  saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
