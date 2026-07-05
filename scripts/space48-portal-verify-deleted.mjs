#!/usr/bin/env node
import { getKintoneConfig, fetchJson } from './lib/space48-portal-kintone.mjs';

const app = Number(process.argv[2] || 712);
const { baseUrl, headers } = getKintoneConfig();
const h = { ...headers, 'Content-Type': undefined };

async function probe(label, url, init = { method: 'GET', headers: h }) {
  try {
    const data = await fetchJson(url, init);
    console.log(`${label}: EXISTS`, JSON.stringify(data).slice(0, 200));
    return true;
  } catch (e) {
    console.log(`${label}: GONE (${e.message})`);
    return false;
  }
}

const appUrl = `${baseUrl}/k/v1/app.json?id=${app}`;
const recUrl = `${baseUrl}/k/v1/records.json?${new URLSearchParams({ app: String(app) })}`;
const a = await probe('app.json', appUrl);
const r = await probe('records.json', recUrl);
process.exit(a || r ? 1 : 0);
