#!/usr/bin/env node
/**
 * 評価ドロップダウン復旧 — kintone は options の label === key 必須
 */
import { deployApp, fetchJson, getKintoneConfig, loadAppIds } from './lib/business-improvement-kintone.mjs';

const STAGE_KEYS = ['stage_a', 'stage_b', 'stage_c', 'stage_d', 'stage_e'];

function buildOptions() {
  const options = {};
  STAGE_KEYS.forEach((k, i) => {
    options[k] = { label: k, index: String(i) };
  });
  return options;
}

const FIELDS = [
  { code: 'eval_effect', label: '評価（効果）' },
  { code: 'eval_ingenuity', label: '評価（工夫度）' },
  { code: 'eval_effort', label: '評価（努力度）' },
  { code: 'eval_overall', label: '評価（総合的審査）' },
];

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { proposalAppId: appId } = loadAppIds();
  const options = buildOptions();

  for (const f of FIELDS) {
    const prop = {
      type: 'DROP_DOWN',
      code: f.code,
      label: f.label,
      required: false,
      noLabel: false,
      options,
    };
    try {
      await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ app: Number(appId), properties: { [f.code]: prop } }),
      });
      console.log('[eval-restore] POST OK', f.code);
    } catch (e) {
      console.log('[eval-restore] POST fail, try PUT', f.code, e.message.split('\n')[0]);
      try {
        await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            app: Number(appId),
            revision: -1,
            properties: { [f.code]: prop },
          }),
        });
        console.log('[eval-restore] PUT OK', f.code);
      } catch (e2) {
        console.error('[eval-restore] FAIL', f.code, e2.message);
      }
    }
  }

  await deployApp(baseUrl, headers, Number(appId));

  const live = await fetchJson(
    `${baseUrl}/k/v1/app/form/fields.json?app=${appId}`,
    { method: 'GET', headers: { ...headers, 'Content-Type': undefined } },
  );
  for (const f of FIELDS) {
    const p = live.properties[f.code];
    console.log('[eval-restore] live', f.code, p ? Object.keys(p.options || {}) : 'MISSING');
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
