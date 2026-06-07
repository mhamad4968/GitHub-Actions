#!/usr/bin/env node
/**
 * 業務改善 — テスト用WFを設定マスタ(697)へ登録 + 提案アプリ(700)へ適用
 * Usage: npx dotenv -e .env -e .env.proxy -- node scripts/business-improvement-seed-wf-test-master.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DATA_DIR,
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  restrictAppToDevUser,
} from './lib/business-improvement-kintone.mjs';
import { fetchDeptNamesFromSettings } from './lib/business-improvement-proposal-fields.mjs';

const WF_PATH = path.join(DATA_DIR, 'business-improvement-wf-test-master.json');

function loadWfMaster() {
  return JSON.parse(readFileSync(WF_PATH, 'utf8'));
}

async function fetchAll697(baseUrl, headers, appId) {
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent('order by $id asc limit 500')}`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return j.records || [];
}

async function seedSettingsRow(baseUrl, headers, settingsAppId, master, devUser) {
  const sm = master.settingsMaster;
  const records = await fetchAll697(baseUrl, headers, settingsAppId);
  const existing = records.find((r) => r.record_kind?.value === '所属行' && r.dept_name?.value === sm.deptName);

  const record = {
    record_kind: { value: '所属行' },
    org_type: { value: sm.orgType },
    dept_name: { value: sm.deptName },
    group_name: { value: 'WFテスト' },
    applicant_login: { value: sm.applicantLogin || devUser },
    manager_login: { value: sm.managerLogin || devUser },
    branch_manager_login: { value: sm.branchManagerLogin || devUser },
    note: {
      value: [
        sm.note,
        `wf_profile=${master.profileId}`,
        `wf_label=${master.label}`,
        `states=${Object.entries(master.stateLabelsJa).map(([k, v]) => `${k}:${v}`).join(' / ')}`,
      ].join('\n'),
    },
    hr_director_login: { value: '' },
    hr_director_email: { value: '' },
    eval_items: { value: [] },
  };

  if (existing) {
    await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: String(settingsAppId), id: existing.$id.value, record }),
    });
    console.log('[wf-test-master] 697 更新:', sm.deptName, 'id=', existing.$id.value);
    return existing.$id.value;
  }

  const created = await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: String(settingsAppId), record }),
  });
  console.log('[wf-test-master] 697 新規:', sm.deptName, 'id=', created.id);
  return created.id;
}

async function patchCommonNote(baseUrl, headers, settingsAppId, master) {
  const records = await fetchAll697(baseUrl, headers, settingsAppId);
  const common = records.find((r) => r.record_kind?.value === '共通設定');
  if (!common) return;
  const prev = common.note?.value || '';
  const tag = `wf_test_profile=${master.profileId}`;
  const devUser = master.settingsMaster.applicantLogin || master.settingsMaster.managerLogin || 'admin';
  const recordPatch = {};
  if (!common.hr_director_login?.value) {
    recordPatch.hr_director_login = { value: devUser };
  }
  if (!prev.includes(tag)) {
    recordPatch.note = { value: `${prev}\n${tag} (${master.label})`.trim() };
  }
  if (!Object.keys(recordPatch).length) {
    console.log('[wf-test-master] 697 共通設定 note/hr 済');
    return;
  }
  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(settingsAppId),
      id: common.$id.value,
      record: recordPatch,
    }),
  });
  console.log('[wf-test-master] 697 共通設定 note/hr 更新', Object.keys(recordPatch).join(', '));
}

async function syncProposalDeptOptions(baseUrl, headers, settingsAppId, proposalAppId) {
  const deptNames = await fetchDeptNamesFromSettings(baseUrl, headers, settingsAppId);
  const options = {};
  deptNames.forEach((name, i) => {
    options[name] = { label: name, index: String(i) };
  });
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(proposalAppId),
      properties: {
        部署: { type: 'DROP_DOWN', code: '部署', label: '部署', options },
      },
    }),
  });
  console.log('[wf-test-master] 700 部署ドロップダウン同期', deptNames.length, '件 revision=', j.revision);
  return j.revision;
}

async function applyWfToProposal(baseUrl, headers, proposalAppId, master) {
  const body = { app: String(proposalAppId), ...master.kintoneStatus };
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/status.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  console.log('[wf-test-master] 700 preview WF 適用 revision=', j.revision);
  return j.revision;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const skipWf = process.argv.includes('--skip-wf');
  const { baseUrl, headers, username } = getKintoneConfig();
  const { settingsAppId, proposalAppId } = loadAppIds();
  const master = loadWfMaster();

  console.log('[wf-test-master] profile=', master.profileId, master.label);

  if (dryRun) {
    console.log(JSON.stringify({ settingsAppId, proposalAppId, master }, null, 2));
    return;
  }

  const rowId = await seedSettingsRow(baseUrl, headers, settingsAppId, master, username);
  await patchCommonNote(baseUrl, headers, settingsAppId, master);

  if (!skipWf) {
    const deptRev = await syncProposalDeptOptions(baseUrl, headers, settingsAppId, proposalAppId);
    await applyWfToProposal(baseUrl, headers, proposalAppId, master);
    await deployApp(baseUrl, headers, proposalAppId);
    await restrictAppToDevUser(baseUrl, headers, proposalAppId, username);
    void deptRev;
  }

  console.log(JSON.stringify({
    profileId: master.profileId,
    settingsRowId: rowId,
    testDept: master.settingsMaster.deptName,
    proposalAppId,
    wfStates: Object.keys(master.kintoneStatus.states),
    dataMaster: WF_PATH,
  }, null, 2));
}

main().catch((e) => {
  console.error('[wf-test-master] NG', e.message);
  process.exit(1);
});
