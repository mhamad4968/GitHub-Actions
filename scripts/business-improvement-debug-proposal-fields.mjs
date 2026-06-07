#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchJson, getKintoneConfig, loadAppIds } from './lib/business-improvement-kintone.mjs';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'business-improvement-proposal-fields.json');

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { proposalAppId: appId } = loadAppIds();
  const all = JSON.parse(readFileSync(DATA, 'utf8')).properties;
  const codes = Object.keys(all);

  for (const code of codes) {
    try {
      await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ app: appId, properties: { [code]: all[code] } }),
      });
      console.log('OK', code);
    } catch (e) {
      console.error('FAIL', code, e.message);
    }
  }
}

main();
