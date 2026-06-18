#!/usr/bin/env node
/** Add fields to existing master app (e.g. after CB_VA01 fix) */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appId = Number(process.argv[2] || process.env.JIKKOU_YOSAN_MASTER_APP_ID || 735);
const FIELDS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'jikkou-yosan-master-fields.json');

function requireEnv(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '').replace(/\/k$/i, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');
const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  'Content-Type': 'application/json',
};

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 800)}`);
  return json;
}

async function main() {
  const properties = JSON.parse(readFileSync(FIELDS_PATH, 'utf8')).properties;
  const form = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties, revision: form.revision }),
  });
  console.log('fields added revision', j.revision);
  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision: j.revision }] }),
  });
  console.log('deploy started for app', appId);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
