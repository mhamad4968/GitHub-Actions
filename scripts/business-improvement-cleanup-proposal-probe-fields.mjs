#!/usr/bin/env node
/**
 * app 700 — デバッグ用 probe フィールド削除
 */
import { deployApp, fetchJson, getKintoneConfig, loadAppIds } from './lib/business-improvement-kintone.mjs';

const EXPLICIT = new Set([
  'foo_bar',
  'eval_points_effect',
  'eval_probe_a',
  'eval_probe_b',
  'cb_probe',
  'eval_foo',
  'eval_test_pt',
  'eval_test_s',
  'eval_test_num',
  'eval_test_stage',
]);

function isProbeCode(code) {
  if (EXPLICIT.has(code)) return true;
  if (/^probe_/.test(code)) return true;
  if (/^eval_test_/.test(code)) return true;
  if (/^eval_probe_/.test(code)) return true;
  return false;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const { proposalAppId: appId } = loadAppIds();
  if (!appId) throw new Error('proposalAppId missing');

  const fields = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  const codes = Object.keys(fields.properties || {}).filter(isProbeCode);
  console.log('probe fields to delete:', codes);

  if (!codes.length) {
    console.log('[cleanup] nothing to delete');
    return;
  }

  if (dryRun) return;

  const del = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ app: String(appId), fields: codes }),
  });
  console.log('deleted revision=', del.revision);

  await deployApp(baseUrl, headers, appId, del.revision);
  console.log('[cleanup] OK deployed app', appId);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
