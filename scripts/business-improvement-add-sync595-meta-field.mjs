#!/usr/bin/env node
/**
 * 設定マスタ697 — sync595_meta フィールド追加（595→698 同期ステータス用 JSON）
 */
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  loadSettingsFieldProperties,
} from './lib/business-improvement-kintone.mjs';

const FIELD = {
  sync595_meta: loadSettingsFieldProperties().sync595_meta,
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const ids = loadAppIds();
  const appId = ids.settingsAppId || 697;

  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  if (!cur.properties?.sync595_meta) {
    if (dryRun) {
      console.log(JSON.stringify({ app: appId, add: 'sync595_meta' }, null, 2));
      return;
    }
    const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: appId, properties: FIELD }),
    });
    console.log(`field added revision=${put.revision}`);
    await deployApp(baseUrl, headers, appId, put.revision);
  } else {
    console.log('field sync595_meta: already exists');
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
