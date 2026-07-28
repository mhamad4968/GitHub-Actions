#!/usr/bin/env node
/**
 * 東海支店 iPad 管理台帳 DB (769) の各レコードについて、
 * user_name をキーに PC 台帳 674 を検索し、M365/VPN の ID/PW および
 * pc_ledger_record_id を PUT で埋め戻す一括同期スクリプト。
 *
 * - JR 台帳 720 / 721 には一切触らない（安全ガード）。
 * - デフォルトは --dry-run 相当（差分のプレビューのみ）。実適用は --apply。
 * - ヒットなし / 複数ヒットは "スキップ" として集計（保存は行わない）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/tokai-ipad-sync-all-credentials.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/tokai-ipad-sync-all-credentials.mjs --apply
 */
import 'dotenv/config';
import process from 'node:process';
import { getKintoneConfig, fetchJson, loadAppIds } from './lib/tokai-ipad-kintone.mjs';

const PROTECTED_APPS = new Set(['720', '721']);
const APP_PC_LEDGER = String(process.env.TOKAI_IPAD_PC_APP || '674');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { apply: false, dryRun: false, limit: 0 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--apply') out.apply = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--limit') out.limit = Number(args[++i] || '0') || 0;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: tokai-ipad-sync-all-credentials.mjs [--dry-run|--apply] [--limit N]');
      process.exit(0);
    }
  }
  if (!out.apply) out.dryRun = true;
  return out;
}

function escapeQueryValue(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

async function fetchAllDbRecords(baseUrl, headers, appId) {
  const all = [];
  let offset = 0;
  const size = 100;
  while (true) {
    const query = encodeURIComponent(`order by $id asc limit ${size} offset ${offset}`);
    const fields = [
      '$id',
      '$revision',
      'user_name',
      'device_name',
      'status',
      'm365_id',
      'm365_pw',
      'vpn_id',
      'vpn_pw',
      'pc_ledger_record_id',
    ]
      .map(function (f, i) { return `&fields[${i}]=${encodeURIComponent(f)}`; })
      .join('');
    const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${query}${fields}`;
    const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const rows = j.records || [];
    all.push(...rows);
    if (rows.length < size) break;
    offset += size;
  }
  return all;
}

async function lookup674(baseUrl, headers, userName) {
  const q = encodeURIComponent(`user_name = "${escapeQueryValue(userName)}" order by $id asc limit 5`);
  const fields = ['$id', 'user_name', 'm365_id', 'm365_pw', 'vpn_id', 'vpn_pw']
    .map(function (f, i) { return `&fields[${i}]=${encodeURIComponent(f)}`; })
    .join('');
  const url = `${baseUrl}/k/v1/records.json?app=${APP_PC_LEDGER}&query=${q}${fields}`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return j.records || [];
}

function val(rec, code) {
  return rec && rec[code] && rec[code].value != null ? String(rec[code].value) : '';
}

async function putRecord(baseUrl, headers, appId, id, revision, record) {
  const body = { app: appId, id: Number(id), revision: Number(revision), record };
  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
}

async function main() {
  const args = parseArgs();
  const { dbAppId } = loadAppIds();
  if (!dbAppId) {
    console.error('dbAppId missing in scripts/data/tokai-ipad-app-ids.json — run tokai-ipad:create-db first');
    process.exit(1);
  }
  if (PROTECTED_APPS.has(String(dbAppId))) {
    console.error(`refusing to sync credentials against protected app ${dbAppId} (JR ledger)`);
    process.exit(1);
  }
  const { baseUrl, headers } = getKintoneConfig();

  console.log(`[tokai-ipad:sync-credentials] mode=${args.apply ? 'APPLY' : 'DRY-RUN'} app=${dbAppId} pcLedger=${APP_PC_LEDGER}`);
  const records = await fetchAllDbRecords(baseUrl, headers, dbAppId);
  console.log(`fetched ${records.length} records from 769`);

  let checked = 0;
  const summary = { updated: 0, noChange: 0, noHit: 0, multiHit: 0, missingName: 0, errors: 0 };

  for (const rec of records) {
    if (args.limit && checked >= args.limit) break;
    checked += 1;
    const id = val(rec, '$id');
    const rev = val(rec, '$revision');
    const name = val(rec, 'user_name').trim();
    const device = val(rec, 'device_name');
    if (!name) {
      summary.missingName += 1;
      console.log(` [${id}] ${device}: user_name 未設定 — スキップ`);
      continue;
    }
    let hits;
    try {
      hits = await lookup674(baseUrl, headers, name);
    } catch (e) {
      summary.errors += 1;
      console.error(` [${id}] ${device}: 674 lookup error: ${e.message}`);
      continue;
    }
    if (!hits.length) {
      summary.noHit += 1;
      console.log(` [${id}] ${device} / ${name}: 674 ヒットなし`);
      continue;
    }
    if (hits.length > 1) {
      summary.multiHit += 1;
      console.log(` [${id}] ${device} / ${name}: 674 複数ヒット (${hits.length}) — 浜田相談`);
      continue;
    }
    const src = hits[0];
    const cur = {
      m365_id: val(rec, 'm365_id'),
      m365_pw: val(rec, 'm365_pw'),
      vpn_id: val(rec, 'vpn_id'),
      vpn_pw: val(rec, 'vpn_pw'),
      pc_ledger_record_id: val(rec, 'pc_ledger_record_id'),
    };
    const next = {
      m365_id: val(src, 'm365_id'),
      m365_pw: val(src, 'm365_pw'),
      vpn_id: val(src, 'vpn_id'),
      vpn_pw: val(src, 'vpn_pw'),
      pc_ledger_record_id: val(src, '$id'),
    };
    const changed = Object.keys(next).some(function (k) { return next[k] !== cur[k]; });
    if (!changed) {
      summary.noChange += 1;
      continue;
    }
    console.log(` [${id}] ${device} / ${name}: 更新 (674 rec=${next.pc_ledger_record_id})`);
    if (args.apply) {
      try {
        await putRecord(baseUrl, headers, dbAppId, id, rev, {
          m365_id: { value: next.m365_id },
          m365_pw: { value: next.m365_pw },
          vpn_id: { value: next.vpn_id },
          vpn_pw: { value: next.vpn_pw },
          pc_ledger_record_id: { value: next.pc_ledger_record_id },
        });
        summary.updated += 1;
      } catch (e) {
        summary.errors += 1;
        console.error(`  PUT 失敗: ${e.message}`);
      }
    } else {
      summary.updated += 1;
    }
  }

  console.log('---');
  console.log(`checked=${checked}`);
  console.log(`updated=${summary.updated}${args.apply ? '' : ' (dry-run)'}`);
  console.log(`noChange=${summary.noChange} noHit=${summary.noHit} multiHit=${summary.multiHit} missingName=${summary.missingName} errors=${summary.errors}`);
  if (!args.apply) {
    console.log('[tokai-ipad:sync-credentials] DRY-RUN — 実適用するには --apply を指定してください');
  }
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
