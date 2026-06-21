#!/usr/bin/env node
/**
 * トータルネットワーク — ラベル修正パッチ
 * - チェックボックス「接続」→「IPアドレス固定」
 * - 湾岸工事所 ip_count 空欄 → 16
 *
 *   npm run total-network:patch-labels -- --dry-run
 *   npm run total-network:patch-labels -- --apply
 */
import { deployApp, fetchJson, getKintoneConfig, loadAppIds } from './lib/total-network-kintone.mjs';

const CHECKBOX_NEW = 'IPアドレス固定';
const CHECKBOX_OLD = '接続';
const WANGAN = '湾岸工事所';
const WANGAN_IP_COUNT = 16;
const BATCH = 100;

async function getForm(baseUrl, headers, appId) {
  return fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
}

async function fetchAllSites(baseUrl, headers, appId) {
  const all = [];
  let offset = 0;
  while (true) {
    const q = `record_type in ("site") order by sort_no asc limit ${BATCH} offset ${offset}`;
    const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`;
    const fields = ['$id', '$revision', 'location_name', 'total_network_enabled', 'ip_count'];
    const fieldParams = fields.map((f, i) => `fields[${i}]=${encodeURIComponent(f)}`).join('&');
    const j = await fetchJson(`${url}&${fieldParams}`, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    const rows = j.records || [];
    all.push(...rows);
    if (rows.length < BATCH) break;
    offset += BATCH;
  }
  return all;
}

async function putFormFields(baseUrl, headers, appId, revision, properties) {
  const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: appId, revision, properties }),
  });
  await deployApp(baseUrl, headers, appId, put.revision);
  return put.revision;
}

async function addCheckboxOption(baseUrl, headers, appId) {
  const cur = await getForm(baseUrl, headers, appId);
  const field = cur.properties.total_network_enabled;
  if (!field) throw new Error('total_network_enabled missing');
  const opts = field.options || {};
  if (opts[CHECKBOX_NEW]) {
    console.log(`form: "${CHECKBOX_NEW}" already exists`);
    return;
  }
  const nextOpts = {
    ...opts,
    [CHECKBOX_NEW]: { label: CHECKBOX_NEW, index: String(Object.keys(opts).length) },
  };
  console.log(`form: add option "${CHECKBOX_NEW}"`);
  await putFormFields(baseUrl, headers, appId, cur.revision, {
    total_network_enabled: { ...field, options: nextOpts },
  });
}

async function removeCheckboxOld(baseUrl, headers, appId) {
  const cur = await getForm(baseUrl, headers, appId);
  const field = cur.properties.total_network_enabled;
  const opts = field.options || {};
  if (!opts[CHECKBOX_OLD]) {
    console.log(`form: legacy "${CHECKBOX_OLD}" already removed`);
    return;
  }
  const finalOpts = { [CHECKBOX_NEW]: { label: CHECKBOX_NEW, index: '0' } };
  console.log(`form: remove legacy "${CHECKBOX_OLD}"`);
  await putFormFields(baseUrl, headers, appId, cur.revision, {
    total_network_enabled: { ...field, options: finalOpts },
  });
}

async function patchRecords(baseUrl, headers, appId, sites, dryRun) {
  const updates = [];
  for (const rec of sites) {
    const id = rec.$id?.value;
    if (!id) {
      console.warn('skip record without $id', JSON.stringify(rec).slice(0, 120));
      continue;
    }
    const name = rec.location_name?.value || '';
    const enabled = rec.total_network_enabled?.value || [];
    const ipCount = rec.ip_count?.value;
    const patch = { id };
    let changed = false;
    if (enabled.includes(CHECKBOX_OLD) || (enabled.length && !enabled.includes(CHECKBOX_NEW))) {
      patch.total_network_enabled = { value: [CHECKBOX_NEW] };
      changed = true;
    }
    if (name === WANGAN && (ipCount === '' || ipCount == null)) {
      patch.ip_count = { value: String(WANGAN_IP_COUNT) };
      changed = true;
    }
    if (changed) updates.push(patch);
  }
  if (!updates.length) {
    console.log('records: no changes needed');
    return;
  }
  console.log(`records: ${updates.length} site(s) to update`);
  if (dryRun) {
    console.log(JSON.stringify(updates, null, 2));
    return;
  }
  for (let i = 0; i < updates.length; i += BATCH) {
    const chunk = updates.slice(i, i + BATCH);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: appId, records: chunk }),
    });
  }
  console.log('records: PUT OK');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }
  const { baseUrl, headers } = getKintoneConfig();
  const { dbAppId } = loadAppIds();
  if (!dbAppId) throw new Error('dbAppId missing');
  const sites = await fetchAllSites(baseUrl, headers, dbAppId);
  console.log(`sites fetched: ${sites.length}`);
  if (dryRun) {
    await patchRecords(baseUrl, headers, dbAppId, sites, true);
    return;
  }
  await addCheckboxOption(baseUrl, headers, dbAppId);
  await patchRecords(baseUrl, headers, dbAppId, sites, false);
  await removeCheckboxOld(baseUrl, headers, dbAppId);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
