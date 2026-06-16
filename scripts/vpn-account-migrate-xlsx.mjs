#!/usr/bin/env node
/**
 * VPN アカウント — Excel → DB REST 一括 POST（66 件 + 設定 1 件）
 * 正本: docs/plans/2026-06-16-vpn-account-kintone-spec.md §9
 *
 *   npm run vpn-account:migrate:xlsx -- --dry-run
 *   npm run vpn-account:migrate:xlsx -- --apply
 */
import { existsSync } from 'node:fs';
import XLSX from 'xlsx';
import {
  DEFAULT_XLSX,
  NEXT_USER_NUM_START,
  RECORD_KIND_SETTING,
  fetchJson,
  formatDateYmd,
  getKintoneConfig,
  loadAppIds,
  loadDeptList,
  recordCount,
  trimCell,
} from './lib/vpn-account-kintone.mjs';

const BATCH = 100;
const HEADER_ROW = 3;
const DATA_START_ROW = 4;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || process.env.VPN_ACCOUNT_XLSX || DEFAULT_XLSX;
  const appArg = process.argv.find((a) => a.startsWith('--app='))?.slice(6);
  return { dryRun, apply, force, xlsx, appId: appArg ? Number(appArg) : null };
}

function readExcelAccounts(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = wb.Sheets['アカウント一覧'];
  if (!sheet) throw new Error('シート「アカウント一覧」が見つかりません');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const depts = new Set(loadDeptList());
  const out = [];

  for (let i = DATA_START_ROW; i < rows.length; i++) {
    const row = rows[i] || [];
    const seq = trimCell(row[1]);
    const label = trimCell(row[2]);
    const dept = trimCell(row[3]);
    const vpnId = trimCell(row[4]);
    const password = trimCell(row[5]);
    const regDate = formatDateYmd(row[6]);

    if (!/^\d+$/.test(seq) || !vpnId.includes('@')) continue;
    if (!label || !dept || !password) {
      throw new Error(`行 ${i + 1}: 必須列が空です`);
    }
    if (!depts.has(dept)) {
      throw new Error(`行 ${i + 1}: 所属「${dept}」はドロップダウンにありません`);
    }

    out.push({
      account_label: label,
      dept,
      vpn_id: vpnId,
      password,
      registered_date: regDate || formatDateYmd(new Date()),
    });
  }
  return out;
}

function toKintoneRecord(row) {
  return {
    account_label: { value: row.account_label },
    dept: { value: row.dept },
    vpn_id: { value: row.vpn_id },
    password: { value: row.password },
    registered_date: { value: row.registered_date },
  };
}

function settingsRecord() {
  return {
    record_kind: { value: RECORD_KIND_SETTING },
    next_user_num: { value: String(NEXT_USER_NUM_START) },
    account_label: { value: '（システム設定）' },
    dept: { value: 'システム推進室' },
    vpn_id: { value: '__vpn_settings__@kensetsutoso.fre' },
    password: { value: 'N/A' },
    registered_date: { value: formatDateYmd(new Date()) },
  };
}

function redact(rec) {
  const o = { ...rec };
  if (o.password) o.password = { value: '***' };
  return o;
}

async function postBatch(baseUrl, headers, appId, records) {
  return fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, records }),
  });
}

async function main() {
  const { dryRun, apply, force, xlsx, appId: appArg } = parseArgs();
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }
  if (!existsSync(xlsx)) {
    console.error(`xlsx not found: ${xlsx}`);
    process.exit(1);
  }

  const accounts = readExcelAccounts(xlsx);
  console.log(`source=${xlsx}`);
  console.log(`accounts=${accounts.length}`);

  if (dryRun) {
    console.log('sample[0]:', JSON.stringify(redact(toKintoneRecord(accounts[0])), null, 2));
    console.log('sample[last]:', JSON.stringify(redact(toKintoneRecord(accounts[accounts.length - 1])), null, 2));
    console.log('settings:', JSON.stringify(settingsRecord(), null, 2));
    return;
  }

  const state = loadAppIds();
  const appId = appArg || state.dbAppId;
  if (!appId) {
    console.error('dbAppId missing. Run vpn-account:create-db first or pass --app=');
    process.exit(1);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const existing = await recordCount(baseUrl, headers, appId);
  console.log(`existingCount=${existing}`);
  if (existing > 0 && !force) {
    console.error('既存レコードあり。--force で続行');
    process.exit(1);
  }

  const kintoneRows = accounts.map(toKintoneRecord);
  let posted = 0;
  for (let i = 0; i < kintoneRows.length; i += BATCH) {
    const chunk = kintoneRows.slice(i, i + BATCH);
    const res = await postBatch(baseUrl, headers, appId, chunk);
    posted += chunk.length;
    console.log(`POST accounts ${posted}/${kintoneRows.length} ids=${(res.ids || []).slice(0, 3).join(',')}…`);
  }

  const settingsRes = await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, record: settingsRecord() }),
  });
  console.log(`POST settings id=${settingsRes.id} next_user_num=${NEXT_USER_NUM_START}`);

  const total = await recordCount(baseUrl, headers, appId);
  console.log(`done totalCount=${total} (expected ${accounts.length + 1})`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
