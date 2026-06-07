#!/usr/bin/env node
/**
 * 業務改善 — 新③ ご利用ガイドアプリ作成（Space 5 / thread 7）
 */
import {
  GUIDE_APP_NAME,
  SPACE_ID,
  THREAD_ID,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  restrictAppToDevUser,
  saveAppIds,
} from './lib/business-improvement-kintone.mjs';

async function setAppSettings(baseUrl, headers, appId, name) {
  const body = {
    app: String(appId),
    name,
    description: '業務改善 ver.02 入口ガイド（WEBサイト型）。本文・スクショは 6/9〜 追加。',
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
  const state = loadAppIds();

  const existing = await findAppByName(baseUrl, headers, GUIDE_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存 ご利用ガイド: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, guideAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ name: GUIDE_APP_NAME, space: SPACE_ID, thread: THREAD_ID }, null, 2));
    return;
  }

  console.log(`作成開始: "${GUIDE_APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID}`);

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: GUIDE_APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  console.log(`app=${appId} revision=${add.revision}`);

  await deployApp(baseUrl, headers, appId);
  const settingsRev = await setAppSettings(baseUrl, headers, appId, GUIDE_APP_NAME);
  await deployApp(baseUrl, headers, appId, settingsRev);

  if (!skipAcl) {
    await restrictAppToDevUser(baseUrl, headers, appId, username);
    console.log(`ACL: dev-only (${username})`);
  }

  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
  saveAppIds({ ...state, guideAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
