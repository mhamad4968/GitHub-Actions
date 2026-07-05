#!/usr/bin/env node
/**
 * App 700 — 本社評価中を追加（Hrは残す）、差戻し/再申請、BranchToHr先を本社評価中へ
 */
import { deployApp, fetchJson, getKintoneConfig } from './lib/business-improvement-kintone.mjs';

const APP = '700';
const HR_KEY = '本社評価中';

function hasAction(actions, name, from) {
  return actions.some((a) => a.name === name && a.from === from);
}

async function migrateHrRecords(baseUrl, headers) {
  const hGet = { ...headers, 'Content-Type': undefined };
  const q = encodeURIComponent('Status in ("Hr") order by $id asc limit 100');
  const res = await fetchJson(`${baseUrl}/k/v1/records.json?app=${APP}&query=${q}`, { method: 'GET', headers: hGet });
  const recs = res.records || [];
  if (!recs.length) {
    console.log('[patch-700-wf] Hr records to migrate: 0');
    return;
  }
  console.log('[patch-700-wf] migrating Hr records:', recs.map((r) => r.$id.value).join(', '));
  for (const rec of recs) {
    await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: APP,
        id: rec.$id.value,
        record: { Status: { value: HR_KEY } },
      }),
    });
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const skipMigrate = process.argv.includes('--skip-migrate');
  const { baseUrl, headers } = getKintoneConfig();
  const hGet = { ...headers, 'Content-Type': undefined };

  const live = await fetchJson(`${baseUrl}/k/v1/app/status.json?app=${APP}`, { method: 'GET', headers: hGet });
  const states = { ...(live.states || {}) };

  if (!states[HR_KEY]) {
    states[HR_KEY] = {
      name: HR_KEY,
      index: '6',
      assignee: states.Hr?.assignee || { type: 'ONE', entities: [] },
    };
  }

  if (!states.applicant_fix) {
    states.applicant_fix = {
      name: 'applicant_fix',
      index: '5',
      assignee: { type: 'ONE', entities: [] },
    };
  }

  let actions = [...(live.actions || [])].map((a) => {
    if (a.name === 'BranchToHr' && a.to === 'Hr') return { ...a, to: HR_KEY };
    return { ...a };
  });

  if (!hasAction(actions, 'HrApprove', HR_KEY)) {
    const src = actions.find((a) => a.name === 'HrApprove' && a.from === 'Hr');
    let nextIndex = actions.reduce((m, a) => Math.max(m, Number(a.index) || 0), -1) + 1;
    actions.push({
      name: 'HrApprove',
      from: HR_KEY,
      to: 'Done',
      index: String(nextIndex++),
      filterCond: '',
      type: 'PRIMARY',
    });
    void src;
  }

  let nextIndex = actions.reduce((m, a) => Math.max(m, Number(a.index) || 0), -1) + 1;
  const push = (row) => {
    actions.push({
      name: row.name,
      from: row.from,
      to: row.to,
      index: String(nextIndex++),
      filterCond: '',
      type: 'PRIMARY',
    });
  };

  if (!hasAction(actions, '差戻し', 'Mgr')) push({ name: '差戻し', from: 'Mgr', to: 'applicant_fix' });
  if (!hasAction(actions, '差戻し_支店長', 'Branch')) {
    push({ name: '差戻し_支店長', from: 'Branch', to: 'applicant_fix' });
  }
  if (!hasAction(actions, '差戻し_人事', 'Hr')) push({ name: '差戻し_人事', from: 'Hr', to: 'applicant_fix' });
  if (!hasAction(actions, '差戻し_人事', HR_KEY)) {
    push({ name: '差戻し_人事', from: HR_KEY, to: 'applicant_fix' });
  }
  if (!hasAction(actions, '再申請', 'applicant_fix')) {
    push({ name: '再申請', from: 'applicant_fix', to: 'Mgr' });
  }

  const body = { app: APP, enable: true, states, actions };
  console.log('[patch-700-wf] states:', Object.keys(states).join(', '));

  if (dryRun) {
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const preview = await fetchJson(`${baseUrl}/k/v1/preview/app/status.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  console.log('[patch-700-wf] preview revision=', preview.revision);
  await deployApp(baseUrl, headers, APP);
  console.log('[patch-700-wf] deploy SUCCESS');

  if (!skipMigrate) {
    await migrateHrRecords(baseUrl, headers);
  }
}

main().catch((e) => {
  console.error('[patch-700-wf] NG', e.message);
  process.exit(1);
});
