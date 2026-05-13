#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(
  __dirname,
  '..',
  'logs',
  'pc-ledger-674-jbis-refill-2026-05-13T14-55-44-512Z.json',
);
const APP_674 = 674;
const CHUNK = 100;

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');
const authHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};

async function fetchJson(url, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const h = { ...authHeaders, ...init.headers };
  if (method !== 'GET' && init.body != null) h['Content-Type'] = 'application/json';
  const res = await fetch(url, { ...init, headers: h });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) throw new Error(`${res.status} ${json.message || text}`);
  return json;
}

async function main() {
  const report = JSON.parse(fs.readFileSync(LOG, 'utf8'));
  const records = report.updates.map((u) => ({
    id: String(u.id),
    record: {
      pc_name: { value: u.before },
      pc_serial_no: { value: '0' },
    },
  }));
  for (let i = 0; i < records.length; i += CHUNK) {
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      body: JSON.stringify({ app: APP_674, records: records.slice(i, i + CHUNK) }),
    });
  }
  console.log(`[674-jbis-revert] restored ${records.length} records from ${LOG}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
