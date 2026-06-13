#!/usr/bin/env node
/**
 * Software ledger — DB app create (Space 21 / thread 23)
 * 正本: docs/plans/2026-06-13-software-ledger-kintone-spec.md §4.1 / §7
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
} from './lib/software-ledger-kintone.mjs';

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
  const properties = loadFieldProperties();
  const state = loadAppIds();

  const existing = await findAppByName(baseUrl, headers, DB_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存 DB アプリ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
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

  const settingsRev = await setAppSettings(
    baseUrl,
    headers,
    appId,
    DB_APP_NAME,
    'ソフトウェアライセンス割当の正本。日常の書込は「ソフトウエア管理台帳ver.1」から REST のみ。標準 UI は閲覧のみ。',
  );
  console.log(`設定 revision=${settingsRev}`);

  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log('');
  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);

  saveAppIds({ ...state, dbAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
