#!/usr/bin/env node
import { fetchJson, getKintoneConfig } from './lib/business-improvement-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const f = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=700`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const codes = Object.keys(f.properties || {}).sort();
  for (const c of codes) console.log(c, f.properties[c].type);
}

main();
