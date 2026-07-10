#!/usr/bin/env node
/**
 * App 736 — PH1f cost_budget_category サブテーブル列追加 + deploy
 *   npm run jikkou-yosan:add-ph1f-cost-budget-category
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appId = Number(process.argv[2] || process.env.JIKKOU_YOSAN_BUDGET_APP_ID || 736);
const PATCH_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'jikkou-yosan-ph1f-cost-budget-category-patch.json');

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
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${res.status} non-JSON: ${text.slice(0, 400)}`);
  }
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
    if (s === 'FAIL' || s === 'CANCEL') throw new Error('deploy ' + s);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('deploy timeout');
}

function mergeSubtableFields(existing, patch) {
  if (!patch || patch.type !== 'SUBTABLE') return null;
  const newFields = {};
  Object.entries(patch.fields || {}).forEach(([code, def]) => {
    if (!(existing.fields && existing.fields[code])) newFields[code] = def;
  });
  if (!Object.keys(newFields).length) return null;
  return {
    type: 'SUBTABLE',
    code: existing.code || patch.code,
    label: existing.label || patch.label,
    fields: newFields,
  };
}

async function postFields(revision, properties) {
  if (!Object.keys(properties).length) return revision;
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties, revision }),
  });
  return j.revision;
}

async function main() {
  const patch = JSON.parse(readFileSync(PATCH_PATH, 'utf8')).properties;
  let form = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    headers: { ...headers, 'Content-Type': undefined },
  });
  const current = form.properties || {};
  let revision = form.revision;
  const subUpdates = {};

  for (const [code, prop] of Object.entries(patch)) {
    if (current[code] && prop.type === 'SUBTABLE') {
      const merged = mergeSubtableFields(current[code], prop);
      if (merged) subUpdates[code] = merged;
    }
  }

  revision = await postFields(revision, subUpdates);
  console.log('fields applied:', `~${Object.keys(subUpdates).length} subtables`, 'revision', revision);

  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision }] }),
  });
  await waitDeploy(appId);
  console.log('Deployed app', appId, '— PH1f cost_budget_category OK');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
