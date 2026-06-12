#!/usr/bin/env node
/**
 * 設定マスタ697 — 年次暗唱番号フィールド追加＋共通設定へ初回値設定
 */
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  loadSettingsFieldProperties,
} from './lib/business-improvement-kintone.mjs';

const FIELD = {
  年次暗唱番号: loadSettingsFieldProperties()['年次暗唱番号'],
};

const DEFAULT_PASS = process.env.BI_ANNUAL_PASSPHRASE || 'bi-annual-2025';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const ids = loadAppIds();
  let appId = ids.settingsAppId || 697;

  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  if (!cur.properties?.年次暗唱番号) {
    if (dryRun) {
      console.log(JSON.stringify({ app: appId, add: '年次暗唱番号' }, null, 2));
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
    console.log('field 年次暗唱番号: already exists');
  }

  const recs = await fetchJson(
    `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent('record_kind in ("共通設定") order by $id asc limit 1')}&fields[0]=$id&fields[1]=年次暗唱番号`,
    { method: 'GET', headers: { ...headers, 'Content-Type': undefined } },
  );
  const common = (recs.records || [])[0];
  if (!common) throw new Error('共通設定レコードがありません');
  const current = common.年次暗唱番号?.value || '';
  if (current) {
    console.log('年次暗唱番号: 既に設定済み（上書きしません）');
    return;
  }
  if (dryRun) {
    console.log(JSON.stringify({ recordId: common.$id.value, set: DEFAULT_PASS }, null, 2));
    return;
  }
  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: appId,
      id: common.$id.value,
      record: { 年次暗唱番号: { value: DEFAULT_PASS } },
    }),
  });
  console.log(`共通設定 record=${common.$id.value} 年次暗唱番号 を設定しました（初回のみ）`);
  console.log('※ 本番運用では kintone 設定マスタで暗唱番号を変更してください。');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
