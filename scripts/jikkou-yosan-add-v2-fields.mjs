#!/usr/bin/env node
/**
 * App 736 — 版管理 v2a フィールド追加・選択肢更新・deploy
 *   npm run jikkou-yosan:add-v2-fields
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appId = Number(process.argv[2] || process.env.JIKKOU_YOSAN_BUDGET_APP_ID || 736);
const PATCH_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'jikkou-yosan-v2-fields-patch.json');

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

function ddOptions(list) {
  const opts = {};
  list.forEach((o, i) => {
    opts[o] = { label: o, index: String(i) };
  });
  return opts;
}

function buildPatch() {
  const patch = JSON.parse(readFileSync(PATCH_PATH, 'utf8')).properties;
  patch.version_type = {
    type: 'DROP_DOWN',
    code: 'version_type',
    label: '版種別',
    required: true,
    options: ddOptions(['当初', '仕様変更', '価格変更', '仕様・価格変更', 'その他']),
  };
  patch.status = {
    type: 'DROP_DOWN',
    code: 'status',
    label: 'ステータス',
    required: false,
    options: ddOptions(['下書き', '版確定', '初版確定']),
  };
  return patch;
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

async function putFields(properties) {
  if (!Object.keys(properties).length) return null;
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  return j.revision;
}

async function main() {
  const patch = buildPatch();
  let form = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    headers: { ...headers, 'Content-Type': undefined },
  });
  const current = form.properties || {};
  let revision = form.revision;

  const newTop = {};
  const dropdownUpdates = {};
  const subUpdates = {};

  for (const [code, prop] of Object.entries(patch)) {
    if (!current[code]) {
      newTop[code] = prop;
      continue;
    }
    if (prop.type === 'SUBTABLE') {
      const merged = mergeSubtableFields(current[code], prop);
      if (merged) subUpdates[code] = merged;
      continue;
    }
    if (prop.type === 'DROP_DOWN') {
      const curOpts = Object.keys(current[code].options || {}).sort().join('|');
      const newOpts = Object.keys(prop.options || {}).sort().join('|');
      if (curOpts !== newOpts) {
        dropdownUpdates[code] = { ...current[code], options: prop.options };
      }
    }
  }

  revision = await postFields(revision, newTop);
  revision = await postFields(revision, subUpdates);
  const putRev = await putFields(dropdownUpdates);
  if (putRev) revision = putRev;

  console.log(
    'fields applied:',
    `+${Object.keys(newTop).length} new`,
    `~${Object.keys(subUpdates).length} subtables`,
    `~${Object.keys(dropdownUpdates).length} dropdowns`,
    'revision',
    revision,
  );

  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision }] }),
  });
  await waitDeploy(appId);
  console.log('Deployed app', appId, '— v2a fields OK');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
