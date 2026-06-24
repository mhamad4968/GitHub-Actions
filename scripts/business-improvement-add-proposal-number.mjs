#!/usr/bin/env node
/**
 * 新① app700 に 提案番号 フィールドを追加（Q-NUM-01）
 */
import {
  PROPOSAL_APP_NAME,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
} from './lib/business-improvement-kintone.mjs';

const FIELD = {
  提案番号: {
    type: 'SINGLE_LINE_TEXT',
    code: '提案番号',
    label: '提案番号',
    required: false,
    noLabel: false,
    unique: true,
  },
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const ids = loadAppIds();
  let appId = ids.proposalAppId;
  if (!appId) {
    const found = await findAppByName(baseUrl, headers, PROPOSAL_APP_NAME);
    if (!found) throw new Error('proposal app not found');
    appId = Number(found.appId);
  }
  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  if (fieldsRes.properties?.提案番号) {
    console.log(`app=${appId} 提案番号: already exists`);
    return;
  }
  if (dryRun) {
    console.log(JSON.stringify({ app: appId, add: Object.keys(FIELD) }, null, 2));
    return;
  }
  const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties: FIELD }),
  });
  console.log(`app=${appId} 提案番号 added revision=${put.revision}`);
  await deployApp(baseUrl, headers, appId, put.revision);
  console.log('deploy OK');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
