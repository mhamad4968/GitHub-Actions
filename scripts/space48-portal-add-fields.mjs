#!/usr/bin/env node
/**
 * システム推進室ポータル — フィールド追加（作成途中失敗時の修復用）
 */
import {
  PORTAL_APP_NAME,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  loadFieldProperties,
  saveAppIds,
} from './lib/space48-portal-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  let appId = state.portalAppId;
  if (!appId) {
    const existing = await findAppByName(baseUrl, headers, PORTAL_APP_NAME);
    if (!existing) throw new Error('Portal app not found');
    appId = Number(existing.appId);
  }
  const properties = loadFieldProperties();
  const preview = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: String(appId), revision: preview.revision, properties }),
  });
  console.log(`フィールド追加 revision=${fieldsRes.revision}`);

  const settingsRev = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(appId),
      name: PORTAL_APP_NAME,
      description: 'システム推進室メンバー向けポータル。リンクは「ポータルリンク」サブテーブルで追加（customize 再デプロイ不要）。',
      theme: 'BLUE',
    }),
  }).then((j) => j.revision);
  console.log(`設定 revision=${settingsRev}`);

  await deployApp(baseUrl, headers, appId, settingsRev);
  console.log(`PORTAL_APP_ID=${appId}`);
  saveAppIds({ ...state, portalAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
