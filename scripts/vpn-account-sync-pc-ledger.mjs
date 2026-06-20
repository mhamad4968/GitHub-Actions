#!/usr/bin/env node
/**
 * VPN 733 → PC台帳 674 一括反映（既存 VPN アカウントの vpn_id / vpn_pw バックフィル）
 *
 *   npm run vpn-account:sync-pc-ledger -- --dry-run
 *   npm run vpn-account:sync-pc-ledger -- --apply
 */
import {
  RECORD_KIND_LICENSE_SNAPSHOT,
  RECORD_KIND_SETTING,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/vpn-account-kintone.mjs';

const PC_APP_ID = Number(process.env.PC_LEDGER_APP_ID || process.env.APP_674 || 674);
const PAGE = 100;
const PC_TYPE_PERSONAL = '個人';
const PC_STATUS_STORAGE = '保管';
const PC_STATUS_DISPOSED = '廃棄';

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  return { dryRun, apply };
}

function val(rec, code) {
  return rec && rec[code] && rec[code].value != null ? String(rec[code].value) : '';
}

function escapeQueryValue(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
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

async function fetch674PcsByUserName(baseUrl, headers, userName) {
  const raw = String(userName || '').trim();
  if (!raw) return [];
  const q =
    `user_name = "${escapeQueryValue(raw)}"` +
    ` and account_type in ("${PC_TYPE_PERSONAL}")` +
    ` and pc_status not in ("${PC_STATUS_STORAGE}", "${PC_STATUS_DISPOSED}")` +
    ' order by $id asc';
  return fetchAllRecords(baseUrl, headers, PC_APP_ID, q);
}

async function putBatch(baseUrl, headers, records) {
  if (!records.length) return;
  const BATCH = 100;
  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: PC_APP_ID, records: chunk }),
    });
  }
}

function needsUpdate(pcRec, vpnId, vpnPw) {
  const curId = val(pcRec, 'vpn_id');
  const curPw = val(pcRec, 'vpn_pw');
  return curId !== vpnId || curPw !== vpnPw;
}

async function main() {
  const { dryRun, apply } = parseArgs();
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }

  const vpnAppId = loadAppIds().dbAppId;
  if (!vpnAppId) {
    console.error('dbAppId missing');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const vpnQuery = `record_kind not in ("${RECORD_KIND_SETTING}", "${RECORD_KIND_LICENSE_SNAPSHOT}") order by account_label asc`;
  const vpnAccounts = await fetchAllRecords(baseUrl, headers, vpnAppId, vpnQuery);

  console.log(`vpnAccounts=${vpnAccounts.length} pcApp=${PC_APP_ID}`);

  const updates = [];
  const summary = {
    vpnTotal: vpnAccounts.length,
    vpnWithPc: 0,
    pcRecords: 0,
    pcUpdated: 0,
    pcAlreadyOk: 0,
    vpnNoPc: 0,
    skippedEmpty: 0,
  };
  const noPcLabels = [];
  const samples = [];

  for (const vpn of vpnAccounts) {
    const label = val(vpn, 'account_label').trim();
    const vpnId = val(vpn, 'vpn_id').trim();
    const vpnPw = val(vpn, 'password').trim();
    if (!label || !vpnId) {
      summary.skippedEmpty++;
      continue;
    }

    const pcs = await fetch674PcsByUserName(baseUrl, headers, label);
    if (!pcs.length) {
      summary.vpnNoPc++;
      if (noPcLabels.length < 15) noPcLabels.push(label);
      continue;
    }

    summary.vpnWithPc++;
    summary.pcRecords += pcs.length;

    for (const pc of pcs) {
      if (!needsUpdate(pc, vpnId, vpnPw)) {
        summary.pcAlreadyOk++;
        continue;
      }
      summary.pcUpdated++;
      updates.push({
        id: val(pc, '$id'),
        revision: val(pc, '$revision'),
        record: {
          vpn_id: { value: vpnId },
          vpn_pw: { value: vpnPw },
        },
        _meta: { label, pcName: val(pc, 'pc_name'), vpnId },
      });
      if (samples.length < 8) {
        samples.push({
          pcId: val(pc, '$id'),
          pcName: val(pc, 'pc_name'),
          userName: label,
          vpnId,
          prevVpnId: val(pc, 'vpn_id'),
        });
      }
    }
  }

  console.log(JSON.stringify(summary, null, 2));
  if (noPcLabels.length) {
    console.log('noPcSample:', noPcLabels.join(' | '));
  }
  if (samples.length) {
    console.log('updateSample:', JSON.stringify(samples, null, 2));
  }

  if (dryRun) {
    console.log(`dry-run: would PUT ${updates.length} pc record(s)`);
    return;
  }

  const putRows = updates.map(({ _meta, ...rest }) => rest);
  await putBatch(baseUrl, headers, putRows);
  console.log(`done: PUT ${putRows.length} pc record(s)`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
