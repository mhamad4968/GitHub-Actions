#!/usr/bin/env node
/**
 * 業務改善 — 新① 提案申請ver.02 アプリ作成（Space 5 / thread 7）
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROPOSAL_APP_NAME,
  SPACE_ID,
  THREAD_ID,
  DATA_DIR,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  restrictAppToDevUser,
  saveAppIds,
} from './lib/business-improvement-kintone.mjs';
import {
  buildProposalFieldProperties,
  buildProposalProcessManagement,
  fetchDeptNamesFromSettings,
} from './lib/business-improvement-proposal-fields.mjs';

const FIELDS_OUT = path.join(DATA_DIR, 'business-improvement-proposal-fields.json');
const SYSTEM_FIELDS = new Set(['レコード番号', '更新者', '作成者', '更新日時', '作成日時', 'ステータス', '作業者']);

async function setAppSettings(baseUrl, headers, appId, name) {
  const body = {
    app: String(appId),
    name,
    description: '業務改善 ver.02 提案申請・評価・WF。customize で申請/評価 UI を提供。',
    theme: 'WHITE',
    useStatus: true,
    useComment: true,
  };
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return j.revision;
}

async function setProcessManagement(baseUrl, headers, appId) {
  const body = { app: String(appId), ...buildProposalProcessManagement() };
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/status.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return j.revision;
}

async function countCustomFields(baseUrl, headers, appId) {
  const fieldsCheck = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  return Object.keys(fieldsCheck.properties || {}).filter((c) => !SYSTEM_FIELDS.has(c)).length;
}

async function finishProposalApp(baseUrl, headers, appId, properties, skipAcl, username, state) {
  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  console.log(`フィールド追加 revision=${fieldsRes.revision}`);

  let rev = await setAppSettings(baseUrl, headers, appId, PROPOSAL_APP_NAME);
  console.log(`useStatus ON revision=${rev}`);

  rev = await setProcessManagement(baseUrl, headers, appId);
  console.log(`processManagement revision=${rev}`);

  await deployApp(baseUrl, headers, appId, rev);

  if (!skipAcl) {
    await restrictAppToDevUser(baseUrl, headers, appId, username);
    console.log(`ACL: dev-only (${username})`);
  }

  console.log('');
  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
  saveAppIds({ ...state, proposalAppId: appId });
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const skipAcl = process.argv.includes('--skip-acl');
  const { baseUrl, headers, username } = getKintoneConfig();
  const state = loadAppIds();
  const settingsAppId = state.settingsAppId;
  if (!settingsAppId) throw new Error('settingsAppId missing — run create-settings-app first');

  const deptNames = await fetchDeptNamesFromSettings(baseUrl, headers, settingsAppId);
  const properties = buildProposalFieldProperties(deptNames);
  writeFileSync(FIELDS_OUT, `${JSON.stringify({ comment: 'generated at create', properties }, null, 2)}\n`, 'utf8');

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          name: PROPOSAL_APP_NAME,
          space: SPACE_ID,
          thread: THREAD_ID,
          deptCount: deptNames.length,
          fieldCount: Object.keys(properties).length,
          wfStates: Object.keys(buildProposalProcessManagement().states),
        },
        null,
        2,
      ),
    );
    return;
  }

  const existing = await findAppByName(baseUrl, headers, PROPOSAL_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    const count = await countCustomFields(baseUrl, headers, appId);
    if (count >= 20) {
      console.log(`既存 提案申請: appId=${appId} fields=${count} URL=${baseUrl}/k/${appId}/`);
      saveAppIds({ ...state, proposalAppId: appId });
      return;
    }
    console.log(`既存 app=${appId} はフィールド未完了(${count}) — 続行`);
    await finishProposalApp(baseUrl, headers, appId, properties, skipAcl, username, state);
    return;
  }

  console.log(`作成開始: "${PROPOSAL_APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID} depts=${deptNames.length}`);

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: PROPOSAL_APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  console.log(`app=${appId} revision=${add.revision}`);

  await deployApp(baseUrl, headers, appId);
  await finishProposalApp(baseUrl, headers, appId, properties, skipAcl, username, state);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
