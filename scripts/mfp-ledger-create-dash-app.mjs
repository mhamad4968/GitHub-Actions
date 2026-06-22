#!/usr/bin/env node
/**
 * 複合機管理台帳 — Dash app create (Space 48 / thread 52)
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
  setEveryoneAcl,
} from './lib/mfp-ledger-kintone.mjs';

async function setAppSettings(baseUrl, headers, appId, name, description) {
  const body = { app: String(appId), name, description, theme: 'GREEN' };
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
    console.error('dbAppId missing. Run mfp-ledger:create-db first.');
    process.exit(1);
  }

  const existing = await findAppByName(baseUrl, headers, DASH_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存ダッシュ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    if (!dryRun) {
      await deployApp(baseUrl, headers, appId);
      console.log('既存 Dash deploy OK');
    }
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

  let deployRev = add.revision;
  const settingsRev = await setAppSettings(
    baseUrl,
    headers,
    appId,
    DASH_APP_NAME,
    '複合機管理台帳 — 一覧・編集・印刷・xlsx 出力の唯一の入り口。',
  );
  console.log(`設定 revision=${settingsRev}`);
  deployRev = settingsRev;

  const aclRev = await setEveryoneAcl(baseUrl, headers, appId).catch(function (e) {
    console.warn(`[warn] ACL skipped: ${e.message || e} — kintone 管理画面で Space48 メンバー権限を付与してください`);
    return deployRev;
  });
  if (aclRev !== deployRev) {
    console.log(`ACL Everyone revision=${aclRev}`);
    deployRev = aclRev;
  }

  await deployApp(baseUrl, headers, appId, deployRev);
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
