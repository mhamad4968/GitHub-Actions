#!/usr/bin/env node
/**
 * App 756 — G0 S1 フィールド追加（preview のみ、deploy 禁止）
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-g0-s1-add-fields.mjs [--dry-run] [--apply-preview]
 *
 * Default = dry-run（追加予定を表示のみ）。
 * --apply-preview = POST 新規フィールド / POST サブテーブル列マージ（preview のみ）。
 * deploy.json は呼ばない。
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ID = 756;
const CATALOG_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'data',
  'jikkou-yosan-v2-g0-s1-fields.json',
);

function requireEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error('Missing ' + k);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '').replace(/\/k$/i, '');
const headers = {
  'X-Cybozu-Authorization': Buffer.from(
    `${requireEnv('KINTONE_USERNAME')}:${requireEnv('KINTONE_PASSWORD')}`,
    'utf8',
  ).toString('base64'),
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

function planAdds(patch, current) {
  const newTop = {};
  const subUpdates = {};
  const skippedTop = [];
  const skippedSubFields = [];

  for (const [code, prop] of Object.entries(patch)) {
    if (prop.type === 'SUBTABLE') {
      const existing = current[code];
      if (!existing) {
        newTop[code] = prop;
        continue;
      }
      const merged = mergeSubtableFields(existing, prop);
      if (merged) subUpdates[code] = merged;
      else {
        Object.keys(prop.fields || {}).forEach((f) => {
          if (existing.fields?.[f]) skippedSubFields.push(`${code}.${f}`);
        });
      }
      continue;
    }

    if (!current[code]) newTop[code] = prop;
    else skippedTop.push(code);
  }

  return { newTop, subUpdates, skippedTop, skippedSubFields };
}

async function postFields(revision, properties) {
  if (!Object.keys(properties).length) return revision;
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: APP_ID, properties, revision }),
  });
  return j.revision;
}

function subFieldCodes(merged) {
  return Object.keys(merged.fields || {});
}

async function main() {
  const applyPreview = process.argv.includes('--apply-preview');
  const dryRun = !applyPreview;

  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const patch = catalog.properties || {};

  const form = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP_ID}`, {
    headers: { ...headers, 'Content-Type': undefined },
  });
  const current = form.properties || {};
  const revisionBefore = form.revision;

  const { newTop, subUpdates, skippedTop, skippedSubFields } = planAdds(patch, current);

  const addCodes = [
    ...Object.keys(newTop),
    ...Object.entries(subUpdates).flatMap(([st, merged]) =>
      subFieldCodes(merged).map((f) => `${st}.${f}`),
    ),
  ];

  console.log(`[g0-s1] app=${APP_ID} mode=${dryRun ? 'dry-run' : 'apply-preview'}`);
  console.log(`[g0-s1] revision before: ${revisionBefore}`);

  if (Object.keys(newTop).length) {
    console.log(`[g0-s1] POST new top-level (${Object.keys(newTop).length}):`);
    for (const [code, prop] of Object.entries(newTop)) {
      console.log(`  + ${code} (${prop.type})`);
    }
  } else {
    console.log('[g0-s1] POST new top-level: (none)');
  }

  if (Object.keys(subUpdates).length) {
    console.log(`[g0-s1] POST subtable merges (${Object.keys(subUpdates).length}):`);
    for (const [code, merged] of Object.entries(subUpdates)) {
      console.log(`  ~ ${code}: +${subFieldCodes(merged).join(', ')}`);
    }
  } else {
    console.log('[g0-s1] POST subtable merges: (none)');
  }

  if (skippedTop.length) {
    console.log(`[g0-s1] skip top-level (exists): ${skippedTop.join(', ')}`);
  }
  if (skippedSubFields.length) {
    console.log(`[g0-s1] skip subtable fields (exists): ${skippedSubFields.join(', ')}`);
  }

  console.log(`[g0-s1] field codes to add: ${addCodes.length ? addCodes.join(', ') : '(none)'}`);

  if (dryRun) {
    console.log('[g0-s1] dry-run — preview unchanged. Re-run with --apply-preview to write preview only.');
    return;
  }

  let revision = revisionBefore;
  revision = await postFields(revision, newTop);
  revision = await postFields(revision, subUpdates);

  console.log(`[g0-s1] revision after: ${revision}`);
  console.log(
    `[g0-s1] preview applied: +${Object.keys(newTop).length} top-level, ~${Object.keys(subUpdates).length} subtables`,
  );
  console.log('[g0-s1] deploy NOT called (S1 preview-only)');
}

main().catch((e) => {
  console.error('[g0-s1] FAIL', e.message);
  process.exit(1);
});
