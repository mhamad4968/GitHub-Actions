#!/usr/bin/env node
/**
 * 業務改善 — 新⑤ 年次処理アプリ作成（Space 5 / thread 7）
 */
import {
  ANNUAL_APP_NAME,
  SPACE_ID,
  THREAD_ID,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAnnualFieldProperties,
  loadAppIds,
  restrictAppToDevUser,
  saveAppIds,
} from './lib/business-improvement-kintone.mjs';

async function setAppSettings(baseUrl, headers, appId, name) {
  const body = {
    app: String(appId),
    name,
    description: '業務改善 ver.02 年次ポイント集計（表1/2/明細・xlsx/PDF/CSV）。集計実行=浜田（Q-ANN-03）。',
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
  const properties = loadAnnualFieldProperties();
  const state = loadAppIds();

  const existing = await findAppByName(baseUrl, headers, ANNUAL_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存 年次処理: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, annualAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({
      name: ANNUAL_APP_NAME,
      space: SPACE_ID,
      thread: THREAD_ID,
      fieldCount: Object.keys(properties).length,
    }, null, 2));
    return;
  }

  console.log(`作成開始: "${ANNUAL_APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID}`);

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: ANNUAL_APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  console.log(`app=${appId} revision=${add.revision}`);

  await deployApp(baseUrl, headers, appId);

  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  console.log(`フィールド追加 revision=${fieldsRes.revision}`);

  const settingsRev = await setAppSettings(baseUrl, headers, appId, ANNUAL_APP_NAME);
  await deployApp(baseUrl, headers, appId, settingsRev);

  if (!skipAcl) {
    await restrictAppToDevUser(baseUrl, headers, appId, username);
    console.log(`ACL: dev-only (${username})`);
  }

  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
  saveAppIds({ ...state, annualAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
