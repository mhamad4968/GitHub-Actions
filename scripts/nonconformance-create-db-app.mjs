#!/usr/bin/env node
/**
 * 不適合管理台帳 — データアプリ作成（Space 48）
 * 正本: docs/plans/2026-06-10-nonconformance-ledger-spec.md
 */
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
} from './lib/nonconformance-kintone.mjs';

async function setAppSettings(baseUrl, headers, appId, name, description) {
  const body = {
    app: String(appId),
    name,
    description,
    theme: 'YELLOW',
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
  const threadId = await resolveDefaultThreadId(baseUrl, headers, SPACE_ID);

  const existing = await findAppByName(baseUrl, headers, DB_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存 DB アプリ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ name: DB_APP_NAME, space: SPACE_ID, thread: threadId, fieldCount: Object.keys(properties).length }, null, 2));
    return;
  }

  console.log(`作成開始: "${DB_APP_NAME}" space=${SPACE_ID} thread=${threadId}`);

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: DB_APP_NAME, space: SPACE_ID, thread: threadId }),
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
    '不適合管理正本。日常の書込は「不適合管理台帳」ダッシュから REST のみ。標準 UI は閲覧のみ。',
  );
  console.log(`設定 revision=${settingsRev}`);

  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log('');
  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);

  saveAppIds({ ...state, spaceId: SPACE_ID, threadId, dbAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
