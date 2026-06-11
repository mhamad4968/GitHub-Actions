#!/usr/bin/env node
/**
 * システム推進室ポータル — アプリ作成（Space 48 / thread 52）
 */
import {
  PORTAL_APP_NAME,
  SPACE_ID,
  THREAD_ID,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  loadFieldProperties,
  saveAppIds,
} from './lib/space48-portal-kintone.mjs';

async function setAppSettings(baseUrl, headers, appId, name, description) {
  const body = {
    app: String(appId),
    name,
    description,
    theme: 'BLUE',
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
  const properties = {
    record_kind: {
      type: 'SINGLE_LINE_TEXT',
      code: 'record_kind',
      label: 'レコード種別',
      required: true,
      noLabel: false,
    },
    ...loadFieldProperties(),
  };
  const state = loadAppIds();

  const existing = await findAppByName(baseUrl, headers, PORTAL_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存ポータル: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, spaceId: SPACE_ID, threadId: THREAD_ID, portalAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ name: PORTAL_APP_NAME, space: SPACE_ID, thread: THREAD_ID }, null, 2));
    return;
  }

  console.log(`作成開始: "${PORTAL_APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID}`);

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: PORTAL_APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
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
    PORTAL_APP_NAME,
    'システム推進室メンバー向けポータル。リンクは「ポータルリンク」サブテーブルで追加（customize 再デプロイ不要）。',
  );
  console.log(`設定 revision=${settingsRev}`);

  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log('');
  console.log(`PORTAL_APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);

  saveAppIds({ ...state, spaceId: SPACE_ID, threadId: THREAD_ID, portalAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
