#!/usr/bin/env node
/** One-off export before app 712 deletion */
import { writeFileSync } from 'node:fs';
import { getKintoneConfig, fetchJson } from './lib/space48-portal-kintone.mjs';

const app = Number(process.argv[2] || 712);
const query = process.argv[3] || '';
const { baseUrl, headers } = getKintoneConfig();
const params = new URLSearchParams({ app: String(app) });
if (query) params.set('query', query);
const url = `${baseUrl}/k/v1/records.json?${params.toString()}`;
const data = await fetchJson(url, {
  method: 'GET',
  headers: { ...headers, 'Content-Type': undefined },
});
const stamp = new Date().toISOString().slice(0, 10);
const outPath = `data/snapshots/${app}-space48-portal-pre-delete-${stamp}.json`;
const out = { exportedAt: new Date().toISOString(), appId: app, ...data };
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote ${outPath} (${data.records?.length ?? 0} records)`);
