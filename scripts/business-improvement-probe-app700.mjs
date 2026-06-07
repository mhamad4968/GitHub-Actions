#!/usr/bin/env node
import { fetchJson, getKintoneConfig } from './lib/business-improvement-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/status.json?app=700`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  console.log(JSON.stringify(j, null, 2));
}

main();
