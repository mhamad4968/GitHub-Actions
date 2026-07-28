#!/usr/bin/env node
/**
 * 東海支店 iPad — DB app create (Space 32 / thread 34)
 * 正本: docs/plans/2026-07-28-tokai-ipad-ledger-kintone-spec.md
 * 境界: 720/721 は触らない。既存同名があれば ID を保存して終了。
 */
import {
  DB_APP_NAME,
  SPACE_ID,
  THREAD_ID,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  loadFieldProperties,
  saveAppIds,
} from './lib/tokai-ipad-kintone.mjs';

async function setAppSettings(baseUrl, headers, appId, name, description) {
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: String(appId), name, description, theme: 'GREEN' }),
  });
  return j.revision;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const properties = loadFieldProperties();
  const state = loadAppIds();

  if (SPACE_ID !== 32) {
    throw new Error(`Safety: expected SPACE_ID=32, got ${SPACE_ID}`);
  }

  const existing = await findAppByName(baseUrl, headers, DB_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    if (appId === 720 || appId === 721) {
      throw new Error(`Safety abort: found name on forbidden app ${appId}`);
    }
    console.log(`既存 DB アプリ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, dbAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          action: 'would-create',
          name: DB_APP_NAME,
          space: SPACE_ID,
          thread: THREAD_ID,
          fieldCount: Object.keys(properties).length,
          fieldCodes: Object.keys(properties),
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`作成開始: "${DB_APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID}`);
  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: DB_APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  if (appId === 720 || appId === 721) {
    throw new Error(`Safety abort: unexpected forbidden appId ${appId}`);
  }
  console.log(`app=${appId} revision=${add.revision}`);

  await deployApp(baseUrl, headers, appId);
  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  console.log(`フィールド追加 revision=${fieldsRes.revision}`);

  const settingsRev = await setAppSettings(
    baseUrl,
    headers,
    appId,
    DB_APP_NAME,
    '東海支店系 iPad 端末の正本。日常の書込は「東海支店iPad管理台帳」から REST のみ。標準 UI は閲覧のみ（customize で保存・削除禁止）。',
  );
  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
  saveAppIds({ ...state, dbAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
