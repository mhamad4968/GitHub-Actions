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
} from './lib/new-system-intro-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const threadId = state.threadId || (await resolveDefaultThreadId(baseUrl, headers, SPACE_ID));
  if (!state.dbAppId) {
    console.error('Run new-system-intro:create-db first.');
    process.exit(1);
  }

  const existing = await findAppByName(baseUrl, headers, DASH_APP_NAME);
  if (existing) {
    console.log(`既存ダッシュ: appId=${existing.appId}`);
    saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: state.dbAppId, dashAppId: Number(existing.appId) });
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
  const settingsRev = (
    await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: String(appId),
        name: DASH_APP_NAME,
        description: 'ヒアリング記録一覧・稟議添付用印刷（A4 2枚）。',
        theme: 'GREEN',
      }),
    })
  ).revision;
  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log(`DASH_APP_ID=${appId} DB_APP_ID=${state.dbAppId}`);
  saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: state.dbAppId, dashAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
