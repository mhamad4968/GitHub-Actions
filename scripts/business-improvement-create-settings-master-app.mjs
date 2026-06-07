#!/usr/bin/env node
/**
 * 業務改善 — 新④ 設定マスタアプリ作成（Space 5 / thread 7）
 */
import {
  SETTINGS_APP_NAME,
  SPACE_ID,
  THREAD_ID,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  loadSettingsFieldProperties,
  restrictAppToDevUser,
  saveAppIds,
} from './lib/business-improvement-kintone.mjs';

async function setAppSettings(baseUrl, headers, appId, name) {
  const body = {
    app: String(appId),
    name,
    description:
      '業務改善 ver.02 設定マスタ。所属30行＋共通設定（jinji・評価20段階）。リリース後メンテ＝浜田（Q-IMPL-02）。',
    theme: 'WHITE',
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
  const skipAcl = process.argv.includes('--skip-acl');
  const { baseUrl, headers, username } = getKintoneConfig();
  const properties = loadSettingsFieldProperties();
  const state = loadAppIds();

  const existing = await findAppByName(baseUrl, headers, SETTINGS_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存 設定マスタ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, spaceId: SPACE_ID, threadId: THREAD_ID, settingsAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          name: SETTINGS_APP_NAME,
          space: SPACE_ID,
          thread: THREAD_ID,
          fieldCount: Object.keys(properties).length,
          acl: skipAcl ? 'skip' : `dev-only (${username})`,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`作成開始: "${SETTINGS_APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID}`);

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: SETTINGS_APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  console.log(`app=${appId} revision=${add.revision}`);

  await deployApp(baseUrl, headers, appId);
  console.log('空アプリ deploy OK');

  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  console.log(`フィールド追加 revision=${fieldsRes.revision}`);

  const settingsRev = await setAppSettings(baseUrl, headers, appId, SETTINGS_APP_NAME);
  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log('設定 deploy OK');

  if (!skipAcl) {
    await restrictAppToDevUser(baseUrl, headers, appId, username);
    console.log(`ACL: dev-only (${username})`);
  }

  console.log('');
  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);

  saveAppIds({ ...state, spaceId: SPACE_ID, threadId: THREAD_ID, settingsAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
