#!/usr/bin/env node
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appId = Number(process.argv[2] || process.env.JIKKOU_YOSAN_BUDGET_APP_ID || 736);
const FIELDS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'jikkou-yosan-budget-fields.json');

function requireEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error('Missing ' + k);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '').replace(/\/k$/i, '');
const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${requireEnv('KINTONE_USERNAME')}:${requireEnv('KINTONE_PASSWORD')}`, 'utf8').toString('base64'),
  'Content-Type': 'application/json',
};

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const json = JSON.parse(await res.text());
  if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 800)}`);
  return json;
}

async function waitDeploy(id) {
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json?apps[0]=${id}`, {
      headers: { ...headers, 'Content-Type': undefined },
    });
    const s = st.apps?.[0]?.status;
    if (s === 'SUCCESS') return;
    if (s === 'FAIL' || s === 'CANCEL') throw new Error(s);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function main() {
  const properties = JSON.parse(readFileSync(FIELDS_PATH, 'utf8')).properties;
  const form = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    headers: { ...headers, 'Content-Type': undefined },
  });
  const hasSpec = form.properties?.spec_lines;
  const merged = { ...(form.properties || {}) };
  const toAdd = {};
  let added = 0;
  for (const [code, prop] of Object.entries(properties)) {
    if (!merged[code]) {
      toAdd[code] = prop;
      added += 1;
    }
  }
  if (hasSpec && added === 0) {
    console.log('Fields already exist on app', appId);
  } else if (added === 0) {
    console.log('No new fields to add on app', appId);
  } else {
    const j = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: appId, properties: toAdd, revision: form.revision }),
    });
    console.log('fields revision', j.revision, `(+${added} fields)`);
  }
  const latest = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    headers: { ...headers, 'Content-Type': undefined },
  });
  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision: latest.revision }] }),
  });
  await waitDeploy(appId);
  console.log('Deployed app', appId);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
