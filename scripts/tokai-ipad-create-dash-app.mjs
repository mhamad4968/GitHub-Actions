#!/usr/bin/env node
/**
 * 東海支店 iPad — Dash app create (Space 32 / thread 34)
 * 正本: docs/plans/2026-07-28-tokai-ipad-ledger-kintone-spec.md
 * 境界: 720/721 は触らない。DB 作成後に実行。
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
  const state = loadAppIds();
  const dbAppId = state.dbAppId;

  if (SPACE_ID !== 32) {
    throw new Error(`Safety: expected SPACE_ID=32, got ${SPACE_ID}`);
  }

  if (!dbAppId) {
    console.error('dbAppId missing. Run tokai-ipad:create-db first.');
    process.exit(1);
  }
  if (dbAppId === 720 || dbAppId === 721) {
    throw new Error(`Safety abort: dbAppId is forbidden ${dbAppId}`);
  }

  const existing = await findAppByName(baseUrl, headers, DASH_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    if (appId === 720 || appId === 721) {
      throw new Error(`Safety abort: found name on forbidden app ${appId}`);
    }
    console.log(`既存ダッシュ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, dashAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          action: 'would-create',
          name: DASH_APP_NAME,
          space: SPACE_ID,
          thread: THREAD_ID,
          dbAppId,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`作成開始: "${DASH_APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID} dbApp=${dbAppId}`);
  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: DASH_APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  if (appId === 720 || appId === 721) {
    throw new Error(`Safety abort: unexpected forbidden appId ${appId}`);
  }
  await deployApp(baseUrl, headers, appId);
  const settingsRev = await setAppSettings(
    baseUrl,
    headers,
    appId,
    DASH_APP_NAME,
    '東海支店系 iPad 管理台帳 — 一覧・採番・廃棄・印刷の唯一の入り口。595/674 は裏側同期のみ（Lookup なし）。',
  );
  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log(`DASH_APP_ID=${appId}`);
  console.log(`DB_APP_ID=${dbAppId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
  saveAppIds({ ...state, dashAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
