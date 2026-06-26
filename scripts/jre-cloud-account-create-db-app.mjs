#!/usr/bin/env node
/** JREクラウド — DB app create (Space 34) */
import {
  DB_APP_NAME,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  loadFieldProperties,
  resolveThreadId,
  saveAppIds,
} from './lib/jre-cloud-account-kintone.mjs';

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

  const existing = await findAppByName(baseUrl, headers, DB_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存 DB アプリ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, dbAppId: appId });
    return;
  }

  const threadId = await resolveThreadId(baseUrl, headers);
  if (dryRun) {
    console.log(JSON.stringify({ name: DB_APP_NAME, space: 34, thread: threadId, fieldCount: Object.keys(properties).length }, null, 2));
    return;
  }

  console.log(`作成開始: "${DB_APP_NAME}" thread=${threadId}`);
  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: DB_APP_NAME, space: 34, thread: threadId }),
  });
  const appId = Number(add.app);
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
    'JREクラウドアカウントの正本。日常の書込は「JREクラウドアカウント台帳」から REST のみ。標準 UI は閲覧のみ（IT管理者）。',
  );
  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log(`APP_ID=${appId}`);
  saveAppIds({ ...state, dbAppId: appId, threadId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
