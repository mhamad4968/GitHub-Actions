#!/usr/bin/env node
/**
 * 697 設定マスタ — 595 台帳一括反映ログ用フィールド追加
 */
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/business-improvement-kintone.mjs';

const FIELD = {
  bulk_downstream_595_log: {
    type: 'SINGLE_LINE_TEXT',
    code: 'bulk_downstream_595_log',
    label: '595台帳一括反映ログ（自動更新）',
    noLabel: false,
  },
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
  if (!cur.properties?.bulk_downstream_595_log) {
    if (dryRun) {
      console.log(JSON.stringify({ app: appId, add: 'bulk_downstream_595_log' }, null, 2));
      return;
    }
    const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: appId, properties: FIELD }),
    });
    console.log(`[697 bulk log field] added revision=${put.revision}`);
    await deployApp(baseUrl, headers, appId, put.revision);
  } else {
    console.log('[697 bulk log field] already exists');
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
