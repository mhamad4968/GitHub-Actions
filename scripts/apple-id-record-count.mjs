#!/usr/bin/env node
import { getKintoneConfig, loadAppIds, recordCount } from './lib/apple-id-kintone.mjs';

async function main() {
  const state = loadAppIds();
  const appId = process.argv.find((a) => a.startsWith('--app='))?.slice(6) || state.dbAppId;
  if (!appId) {
    console.error('dbAppId missing');
    process.exit(1);
  }
  const { baseUrl, headers } = getKintoneConfig();
  const total = await recordCount(baseUrl, headers, appId);
  console.log(`app=${appId} totalCount=${total}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
