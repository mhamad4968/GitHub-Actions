#!/usr/bin/env node
/** Update eval dropdown options (stage_a keys) */
import { fetchJson, getKintoneConfig, loadAppIds } from './lib/business-improvement-kintone.mjs';
import { buildProposalFieldProperties, fetchDeptNamesFromSettings } from './lib/business-improvement-proposal-fields.mjs';

const TARGETS = ['eval_effect', 'eval_ingenuity', 'eval_effort', 'eval_overall', 'branch_delegate'];

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { proposalAppId: appId, settingsAppId } = loadAppIds();
  const deptNames = await fetchDeptNamesFromSettings(baseUrl, headers, settingsAppId);
  const all = buildProposalFieldProperties(deptNames);

  for (const code of TARGETS) {
    const src = all[code];
    try {
      await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          app: appId,
          properties: {
            [code]: {
              type: src.type,
              code,
              label: src.label,
              required: false,
              noLabel: false,
              options: src.options,
            },
          },
          revision: -1,
        }),
      });
      console.log('OK', code);
    } catch (e) {
      console.error('FAIL', code, e.message);
    }
  }
}

main();
