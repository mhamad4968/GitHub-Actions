#!/usr/bin/env node
/** 状態「-」→全角「－」: 748 ドロップダウン更新 + 設備なし3行 PATCH */
import {
  STATUS_NONE,
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  loadFieldProperties,
  PLACEHOLDER_ROWS,
} from './lib/nas-ledger-kintone.mjs';

const dryRun = process.argv.includes('--dry-run');

async function getFormFields(baseUrl, headers, appId) {
  return fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
}

async function putStatusOptions(baseUrl, headers, appId, revision, statusField) {
  if (dryRun) return revision;
  const res = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: appId,
      revision,
      properties: { status: statusField },
    }),
  });
  return res.revision;
}

async function patchRecords(baseUrl, headers, appId) {
  const orgNames = PLACEHOLDER_ROWS.map((r) => r.org_name);
  const query = 'order by sort_no asc limit 100';
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(query)}`;
  const res = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const updates = (res.records || [])
    .filter((rec) => {
      const org = rec.org_name?.value || '';
      const note = rec.note?.value || '';
      return orgNames.includes(org) && note === '設備なし' && rec.status?.value === '-';
    })
    .map((rec) => {
      console.log(`[fix-status] $id=${rec.$id.value} status="-" → "${STATUS_NONE}"`);
      return { id: rec.$id.value, record: { status: { value: STATUS_NONE } } };
    });

  if (updates.length === 0) {
    console.log('[fix-status] no records with status "-"');
    return;
  }
  if (dryRun) {
    console.log(`[dry-run] would PUT ${updates.length} record(s)`);
    return;
  }
  await fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: appId, records: updates }),
  });
  console.log(`[fix-status] SUCCESS updated ${updates.length} record(s)`);
}

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId: appId } = loadAppIds();
  if (!appId) throw new Error('dbAppId missing');

  const props = loadFieldProperties();
  let cur = await getFormFields(baseUrl, headers, appId);
  const statusCur = cur.properties.status;
  const hasHalf = Boolean(statusCur.options?.['-']);
  const hasFull = Boolean(statusCur.options?.[STATUS_NONE]);

  if (hasHalf && !hasFull) {
    const merged = {
      ...statusCur,
      options: {
        ...statusCur.options,
        [STATUS_NONE]: { label: STATUS_NONE, index: '4' },
      },
    };
    console.log('[fix-status] step1: add dropdown option －');
    if (!dryRun) {
      const rev = await putStatusOptions(baseUrl, headers, appId, cur.revision, merged);
      await deployApp(baseUrl, headers, appId, rev);
      console.log('[fix-status] step1 deploy OK (live has － option)');
    }
  }

  await patchRecords(baseUrl, headers, appId);

  cur = await getFormFields(baseUrl, headers, appId);
  if (cur.properties.status.options?.['-']) {
    const finalStatus = { ...cur.properties.status, options: props.status.options };
    console.log('[fix-status] step2: remove half-width - from dropdown');
    if (!dryRun) {
      const rev = await putStatusOptions(baseUrl, headers, appId, cur.revision, finalStatus);
      await deployApp(baseUrl, headers, appId, rev);
      console.log('[fix-status] step2 deploy OK');
    }
  }

  if (dryRun) {
    console.log('[dry-run] OK');
    return;
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
