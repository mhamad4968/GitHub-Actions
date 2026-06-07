#!/usr/bin/env node
/** Phase 4a 検証 — 新① 提案申請ver.02（フィールド＋WF） */
import { fetchJson, getKintoneConfig, loadAppIds, PROPOSAL_APP_NAME } from './lib/business-improvement-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { proposalAppId, settingsAppId, guideAppId } = loadAppIds();
  if (!proposalAppId) throw new Error('proposalAppId missing');

  const app = await fetchJson(`${baseUrl}/k/v1/app.json?id=${proposalAppId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  const fields = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json?app=${proposalAppId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  const pm = await fetchJson(`${baseUrl}/k/v1/app/status.json?app=${proposalAppId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  const codes = Object.keys(fields.properties || {});
  const required = ['部署', '提案種別', '提案件名', '提案者一覧', '部長評価者', 'eval_effect', '提案操作履歴'];
  const missing = required.filter((c) => !codes.includes(c));

  console.log(
    JSON.stringify(
      {
        proposalAppId,
        settingsAppId,
        guideAppId,
        name: app.name,
        fieldCount: codes.length,
        missingRequired: missing,
        wfEnabled: pm.enable,
        wfStates: Object.keys(pm.states || {}),
        url: `${baseUrl}/k/${proposalAppId}/`,
      },
      null,
      2,
    ),
  );

  if (app.name !== PROPOSAL_APP_NAME) throw new Error(`name mismatch: ${app.name}`);
  if (missing.length) throw new Error(`missing fields: ${missing.join(', ')}`);
  if (!pm.enable) throw new Error('process management not enabled');
  console.log('[verify] Phase4a proposal app OK');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
