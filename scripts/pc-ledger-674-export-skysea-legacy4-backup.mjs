#!/usr/bin/env node
/**
 * App 674: 旧 SKYSEA 4 フィールド削除前バックアップ（JSON）
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-export-skysea-legacy4-backup.mjs
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const APP = 674;
const FIELDS = [
  '$id',
  'pc_name',
  'account_type',
  'pc_status',
  'skysea_status',
  'skysea_checked_at',
  'skysea_install_log',
  'skysea_target_flag',
  'skysea_manual_done',
  'skysea_manual_date',
  'skysea_manual_handler',
];

function requireEnv(k) {
  const v = process.env[k];
  if (!v || !String(v).trim()) throw new Error(`Missing env: ${k}`);
  return String(v).trim();
}

function buildAuthHeaders() {
  const headers = {
    'X-Cybozu-Authorization': Buffer.from(
      `${requireEnv('KINTONE_USERNAME')}:${requireEnv('KINTONE_PASSWORD')}`,
      'utf8',
    ).toString('base64'),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64')}`;
  }
  return headers;
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '').replace(/\/k$/i, '');

function cell(rec, code) {
  const x = rec[code];
  if (!x) return '';
  const val = x.value;
  if (Array.isArray(val)) return val.join('|');
  return val == null ? '' : String(val);
}

async function main() {
  const auth = buildAuthHeaders();
  const all = [];
  let offset = 0;
  while (true) {
    const u = new URL(`${baseUrl}/k/v1/records.json`);
    u.searchParams.set('app', String(APP));
    u.searchParams.set('query', `order by $id asc limit 500 offset ${offset}`);
    FIELDS.forEach((f, i) => u.searchParams.set(`fields[${i}]`, f));
    const res = await fetch(u, { headers: auth });
    const j = await res.json();
    if (!res.ok) throw new Error(`GET records: ${j.code || res.status} ${j.message || JSON.stringify(j)}`);
    const recs = j.records || [];
    all.push(...recs);
    if (recs.length < 500) break;
    offset += 500;
  }

  const rows = all.map((r) => ({
    id: cell(r, '$id'),
    pc_name: cell(r, 'pc_name'),
    account_type: cell(r, 'account_type'),
    pc_status: cell(r, 'pc_status'),
    skysea_status: cell(r, 'skysea_status'),
    skysea_checked_at: cell(r, 'skysea_checked_at'),
    skysea_install_log: cell(r, 'skysea_install_log'),
    skysea_target_flag: cell(r, 'skysea_target_flag'),
    skysea_manual_done: cell(r, 'skysea_manual_done'),
    skysea_manual_date: cell(r, 'skysea_manual_date'),
    skysea_manual_handler: cell(r, 'skysea_manual_handler'),
  }));
  const nonDefault = rows.filter(
    (r) =>
      (r.skysea_status && r.skysea_status !== '未確認') ||
      r.skysea_checked_at ||
      r.skysea_install_log ||
      r.skysea_target_flag,
  );

  mkdirSync('data/snapshots', { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join('data/snapshots', `674-skysea-legacy4-predelete-${stamp}.json`);
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        purpose: 'pre-delete backup of legacy SKYSEA meta fields',
        codes: ['skysea_status', 'skysea_checked_at', 'skysea_install_log', 'skysea_target_flag'],
        total: rows.length,
        nonDefaultCount: nonDefault.length,
        records: rows,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      { path: outPath, total: rows.length, nonDefaultCount: nonDefault.length },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
