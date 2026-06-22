#!/usr/bin/env node
/**
 * 複合機管理台帳 — DB app create (Space 48 / thread 52)
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
  const properties = loadFieldProperties();
  const state = loadAppIds();

  const existing = await findAppByName(baseUrl, headers, DB_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存 DB アプリ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    if (!dryRun) {
      await deployApp(baseUrl, headers, appId);
      console.log('既存 DB deploy OK');
    }
    saveAppIds({ ...state, dbAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        { name: DB_APP_NAME, space: SPACE_ID, thread: THREAD_ID, fieldCount: Object.keys(properties).length },
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
  console.log(`app=${appId} revision=${add.revision}`);

  await deployApp(baseUrl, headers, appId);
  console.log('空アプリ deploy OK');

  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  console.log(`フィールド追加 revision=${fieldsRes.revision}`);

  let deployRev = fieldsRes.revision;
  const settingsRev = await setAppSettings(
    baseUrl,
    headers,
    appId,
    DB_APP_NAME,
    '複合機（MFP）情報の正本。日常の書込は「複合機管理台帳」から REST のみ。標準 UI は閲覧のみ。',
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
  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);

  saveAppIds({ ...state, dbAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
