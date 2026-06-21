#!/usr/bin/env node
/**
 * 共有メール DB 695 — usage_type に「個人メールアドレス」を追加
 *
 *   npm run shared-mail:add-usage-type -- --dry-run
 *   npm run shared-mail:add-usage-type -- --apply
 */
import {
  USAGE_TYPES,
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  loadFieldProperties,
} from './lib/shared-mail-kintone.mjs';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }

  const { dbAppId } = loadAppIds();
  if (!dbAppId) throw new Error('dbAppId missing');

  const { baseUrl, headers } = getKintoneConfig();
  const properties = loadFieldProperties();
  const field = properties.usage_type;
  if (!field) throw new Error('usage_type missing in fields json');

  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${dbAppId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const live = cur.properties.usage_type;
  if (!live) throw new Error('usage_type missing on app');

  const nextOpts = { ...live.options };
  let added = false;
  USAGE_TYPES.forEach((label, index) => {
    if (!nextOpts[label]) {
      nextOpts[label] = { label, index: String(index) };
      added = true;
    }
  });

  if (!added) {
    console.log('usage_type options already include all USAGE_TYPES');
    return;
  }

  console.log('add options:', USAGE_TYPES.filter((u) => !live.options[u]));
  if (dryRun) return;

  const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: dbAppId,
      revision: cur.revision,
      properties: {
        usage_type: { ...live, options: nextOpts },
      },
    }),
  });
  await deployApp(baseUrl, headers, dbAppId, put.revision);
  console.log(`deploy OK app=${dbAppId} revision=${put.revision}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
