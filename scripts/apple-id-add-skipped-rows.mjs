#!/usr/bin/env node
/**
 * Apple ID — 移行時スキップ分の追加投入 + apple_id unique 解除
 * 正本: 浜田指示 2026-06-03（kent.nagoya8 / nagano1 / 0344）
 *
 *   npm run apple-id:add-skipped -- --dry-run
 *   npm run apple-id:add-skipped -- --apply
 */
import {
  FIXED_LOCK,
  FIXED_PASSWORD,
  STATUS_ACTIVE,
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  recordCount,
} from './lib/apple-id-kintone.mjs';

const APP = () => loadAppIds().dbAppId;

/** legacy_no で正本。Excel icloud シートのスキップ行。 */
const SUPPLEMENT = [
  {
    legacy_no: 203,
    registered_date: '2025-05-25',
    mdm_name: 'nagano',
    user_name: '羽場\u3000剛',
    phone_number: '080-6598-4130',
    apple_id: 'kent.nagano1@icloud.com',
    device_type: 'iPad',
    note: '移行スキップ分（同一Apple ID・iPad端末）',
  },
  {
    legacy_no: 229,
    registered_date: '2025-12-01',
    mdm_name: 'oonuki-y',
    user_name: '大貫\u3000義昭',
    phone_number: '080-6734-9617',
    apple_id: 'kent.0344@icloud.com',
    device_type: 'iPad',
    note: '移行スキップ分（同一Apple ID・iPad端末・080-6734-9617）',
  },
  {
    legacy_no: 234,
    registered_date: '2026-02-11',
    mdm_name: 'h-mizuguchi',
    user_name: '水口\u3000広美',
    phone_number: '080-5961-4558',
    apple_id: 'kent.nagoya8@icloud.com',
    device_type: 'iPhone',
    note: '移行スキップ分（同一Apple ID・早坂翔と重複・確認後修正予定）',
  },
];

function toRecord(row) {
  const rec = {
    legacy_no: { value: String(row.legacy_no) },
    status: { value: STATUS_ACTIVE },
    registered_date: { value: row.registered_date },
    apple_id: { value: row.apple_id },
    password: { value: FIXED_PASSWORD },
    lock_passcode: { value: FIXED_LOCK },
  };
  if (row.mdm_name) rec.mdm_name = { value: row.mdm_name };
  if (row.user_name) rec.user_name = { value: row.user_name };
  if (row.phone_number) rec.phone_number = { value: row.phone_number };
  if (row.device_type) rec.device_type = { value: row.device_type };
  if (row.note) rec.note = { value: row.note };
  return rec;
}

async function ensureAppleIdNotUnique(baseUrl, headers, appId, dryRun) {
  const form = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const def = form.properties?.apple_id;
  if (!def) throw new Error('apple_id field missing');
  if (!def.unique) {
    console.log('apple_id.unique は既に false');
    return;
  }
  if (dryRun) {
    console.log(`dry-run: apple_id.unique true → false (revision=${form.revision})`);
    return;
  }
  const properties = {
    ...form.properties,
    apple_id: { ...def, unique: false },
  };
  const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: appId, revision: form.revision, properties }),
  });
  console.log(`apple_id.unique=false PUT revision=${put.revision}`);
  await deployApp(baseUrl, headers, appId, put.revision);
  console.log('apple_id unique 解除 deploy OK');
}

async function existingLegacyNos(baseUrl, headers, appId, nos) {
  const found = new Set();
  for (const n of nos) {
    const q = `legacy_no = ${n}`;
    const j = await fetchJson(
      `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`,
      { method: 'GET', headers: { ...headers, 'Content-Type': undefined } },
    );
    if ((j.records || []).length > 0) found.add(n);
  }
  return found;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }
  const appId = APP();
  if (!appId) {
    console.error('dbAppId missing');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const legacyNos = SUPPLEMENT.map((r) => r.legacy_no);
  const existing = await existingLegacyNos(baseUrl, headers, appId, legacyNos);
  const toAdd = SUPPLEMENT.filter((r) => !existing.has(r.legacy_no));

  console.log(`app=${appId} supplement=${SUPPLEMENT.length} existing=${existing.size} toAdd=${toAdd.length}`);
  for (const r of toAdd) {
    console.log(`  add legacy=${r.legacy_no} ${r.user_name} ${r.apple_id} ${r.device_type} ${r.phone_number}`);
  }
  for (const n of existing) {
    console.log(`  skip legacy=${n} (already exists)`);
  }

  if (dryRun) {
    await ensureAppleIdNotUnique(baseUrl, headers, appId, true);
    return;
  }

  if (toAdd.length === 0) {
    console.log('追加対象なし');
    return;
  }

  await ensureAppleIdNotUnique(baseUrl, headers, appId, false);

  const records = toAdd.map(toRecord);
  const res = await fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, records }),
  });
  console.log(`POST OK ids=${(res.ids || []).join(',')}`);

  const total = await recordCount(baseUrl, headers, appId);
  console.log(`totalCount=${total}`);

  for (const id of ['kent.nagoya8@icloud.com', 'kent.nagano1@icloud.com', 'kent.0344@icloud.com']) {
    const q = `apple_id = "${id}" order by legacy_no asc`;
    const j = await fetchJson(
      `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`,
      { method: 'GET', headers: { ...headers, 'Content-Type': undefined } },
    );
    console.log(`--- ${id} count=${(j.records || []).length}`);
    for (const r of j.records || []) {
      console.log(
        `  legacy=${r.legacy_no?.value} name=${r.user_name?.value} phone=${r.phone_number?.value} device=${r.device_type?.value}`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
