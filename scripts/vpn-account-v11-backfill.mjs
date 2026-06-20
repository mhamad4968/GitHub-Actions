#!/usr/bin/env node
/**
 * VPN v1.1 — 既存レコード vpn_domain バックフィル + 3ドメイン設定レコード整備
 *
 *   npm run vpn-account:v11-backfill -- --dry-run
 *   npm run vpn-account:v11-backfill -- --apply
 */
import {
  NEXT_USER_NUM_BY_DOMAIN,
  RECORD_KIND_SETTING,
  VPN_DOMAINS,
  VPN_DOMAIN_LIST,
  deployApp,
  fetchJson,
  formatDateYmd,
  getKintoneConfig,
  inferDomainFromVpnId,
  loadAppIds,
  settingsVpnId,
} from './lib/vpn-account-kintone.mjs';

const PAGE = 100;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  return { dryRun, apply };
}

async function fetchAllRecords(baseUrl, headers, appId, query, fields) {
  const all = [];
  let offset = 0;
  while (true) {
    const q = `${query} limit ${PAGE} offset ${offset}`;
    const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`;
    const j = await fetchJson(url, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    const rows = j.records || [];
    all.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

function val(rec, code) {
  return rec && rec[code] && rec[code].value != null ? String(rec[code].value) : '';
}

function settingsRecord(domain) {
  return {
    record_kind: { value: RECORD_KIND_SETTING },
    next_user_num: { value: String(NEXT_USER_NUM_BY_DOMAIN[domain] || 1) },
    vpn_domain: { value: domain },
    account_label: { value: '（システム設定）' },
    dept: { value: 'システム推進室' },
    vpn_id: { value: settingsVpnId(domain) },
    password: { value: 'N/A' },
    registered_date: { value: formatDateYmd(new Date()) },
  };
}

async function putRecords(baseUrl, headers, appId, updates) {
  const BATCH = 100;
  let done = 0;
  for (let i = 0; i < updates.length; i += BATCH) {
    const chunk = updates.slice(i, i + BATCH);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: appId, records: chunk }),
    });
    done += chunk.length;
    console.log(`PUT backfill ${done}/${updates.length}`);
  }
}

async function main() {
  const { dryRun, apply } = parseArgs();
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }

  const appId = loadAppIds().dbAppId;
  if (!appId) {
    console.error('dbAppId missing');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const accountFields = ['$id', '$revision', 'vpn_id', 'vpn_domain', 'record_kind'];
  const accounts = await fetchAllRecords(
    baseUrl,
    headers,
    appId,
    'record_kind not in ("設定", "月次集計") order by $id asc',
    accountFields,
  );

  const backfill = [];
  accounts.forEach(function (rec) {
    const vpnId = val(rec, 'vpn_id');
    const current = val(rec, 'vpn_domain');
    const inferred = inferDomainFromVpnId(vpnId);
    if (!current || current !== inferred) {
      backfill.push({
        id: val(rec, '$id'),
        revision: val(rec, '$revision'),
        record: { vpn_domain: { value: inferred } },
      });
    }
  });
  console.log(`accounts=${accounts.length} backfill=${backfill.length}`);

  const settingsRows = await fetchAllRecords(
    baseUrl,
    headers,
    appId,
    `record_kind in ("${RECORD_KIND_SETTING}") order by $id asc`,
    ['$id', '$revision', 'vpn_id', 'vpn_domain', 'next_user_num'],
  );

  const settingsByDomain = {};
  settingsRows.forEach(function (rec) {
    const domain = val(rec, 'vpn_domain') || inferDomainFromVpnId(val(rec, 'vpn_id'));
    settingsByDomain[domain] = rec;
  });

  const settingsUpdates = [];
  settingsRows.forEach(function (rec) {
    const vpnId = val(rec, 'vpn_id');
    const domain = val(rec, 'vpn_domain') || inferDomainFromVpnId(vpnId);
    if (!val(rec, 'vpn_domain')) {
      settingsUpdates.push({
        id: val(rec, '$id'),
        revision: val(rec, '$revision'),
        record: { vpn_domain: { value: domain } },
      });
    }
  });

  const settingsCreates = [];
  VPN_DOMAIN_LIST.forEach(function (domain) {
    if (!settingsByDomain[domain]) {
      settingsCreates.push(settingsRecord(domain));
    }
  });

  console.log(`settings=${settingsRows.length} update=${settingsUpdates.length} create=${settingsCreates.length}`);

  if (dryRun) {
    console.log('sample backfill:', JSON.stringify(backfill.slice(0, 2), null, 2));
    console.log('settingsCreates:', settingsCreates.map((r) => r.vpn_id.value));
    return;
  }

  if (backfill.length) await putRecords(baseUrl, headers, appId, backfill);
  if (settingsUpdates.length) await putRecords(baseUrl, headers, appId, settingsUpdates);

  for (const rec of settingsCreates) {
    const res = await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: appId, record: rec }),
    });
    console.log(`POST settings id=${res.id} domain=${rec.vpn_domain.value}`);
  }

  console.log('v11 backfill done');
}

main().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
