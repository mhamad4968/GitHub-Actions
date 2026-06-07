#!/usr/bin/env node
import { deployApp, fetchJson, getKintoneConfig, restrictAppToDevUser, loadAppIds } from './lib/business-improvement-kintone.mjs';

async function main() {
  const { baseUrl, headers, username } = getKintoneConfig();
  const appId = loadAppIds().proposalAppId || 700;

  await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: String(appId), useStatus: true, useComment: true }),
  });

  await deployApp(baseUrl, headers, Number(appId));
  await restrictAppToDevUser(baseUrl, headers, Number(appId), username);
  console.log('deployed WF preview -> live app', appId);
}

main();
