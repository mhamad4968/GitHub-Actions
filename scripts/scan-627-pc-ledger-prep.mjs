#!/usr/bin/env node
// scan-627-pc-ledger-prep.mjs
// 4/23 朝 新・PC台帳ver.1 着手の B-1 移行設計準備スクリプト。
// 627 アカウント管理台帳を全件 fetch し、以下を可視化:
//
//   1. account_type 値分布 (個人 / 共有 / JR端末 / etc)
//   2. status / employment_status / account_state 値分布
//   3. PC_name (CSV) / pc_link_count_n / pc_594_record_id の紐付き状況
//   4. 個人カテゴリで「PC 紐付き 0 件」「PC 紐付き 2 件以上」の異常検出
//   5. snapshot を data/snapshots/627-pre-migration-<日付>.json に保存
//
// 使い方:
//   npx dotenv -e .env -e .env.proxy -- node scripts/scan-627-pc-ledger-prep.mjs
//
// 関連:
//   - 仕様書 §7.4.5 「4/23 朝の B-1 着手フェーズ (v2.1 残作業)」
//   - 仕様書 §8 既存データ移行手順
//   - 4/22 夜 軽プレップ Step ③ (改善案 #14 の D11 設計と整合)

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers['Authorization'] = 'Basic ' + Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64');
}

const APP_627 = 627;
const FIELDS_627 = [
  '$id',
  'レコード番号',
  'account_type',
  'user_name',
  'dept_name',
  'group_name',
  'logon_name',
  'mail',
  'mail_acct',
  'm365_id',
  'PC_name',
  'pc_link_count_n',
  'pc_594_record_id',
  'employment_status',
  'account_state',
  'windows_name',
];

async function fetchAll(app, fields) {
  const records = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const params = new URLSearchParams();
    params.set('app', String(app));
    params.set('query', `order by レコード番号 asc limit ${limit} offset ${offset}`);
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const url = `${baseUrl}/k/v1/records.json?${params.toString()}`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GET app=${app} offset=${offset} failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    const batch = data.records || [];
    records.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return records;
}

function distribution(records, fieldName) {
  const m = new Map();
  for (const r of records) {
    const v = r[fieldName]?.value;
    const key = (Array.isArray(v) ? (v.length ? v.join('+') : '(空)') : v) || '(空)';
    m.set(key, (m.get(key) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function pcNamesCount(rec) {
  const v = rec['PC_name']?.value || '';
  if (!v) return 0;
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean).length;
}

(async () => {
  console.log('## 🔍 627 アカウント管理台帳 — B-1 移行設計準備スキャン');
  console.log('');
  console.log(`生成: ${new Date().toISOString()}`);
  console.log('');

  const records = await fetchAll(APP_627, FIELDS_627);
  console.log(`**全件**: ${records.length}`);
  console.log('');

  // ───── snapshot 保存 ─────
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
  const snapPath = path.join('data', 'snapshots', `627-pre-migration-${today}.json`);
  fs.mkdirSync(path.dirname(snapPath), { recursive: true });
  fs.writeFileSync(snapPath, JSON.stringify({ records }, null, 2), 'utf8');
  console.log(`snapshot: \`${snapPath}\``);
  console.log('');

  // ───── 1. account_type 分布 ─────
  console.log('### 1. account_type 分布');
  console.log('');
  console.log('| account_type | 件数 |');
  console.log('|---|---|');
  for (const [k, c] of distribution(records, 'account_type')) console.log(`| ${k} | ${c} |`);
  console.log('');

  // ───── 2. employment_status / account_state 分布 ─────
  console.log('### 2. employment_status 分布');
  console.log('');
  console.log('| employment_status | 件数 |');
  console.log('|---|---|');
  for (const [k, c] of distribution(records, 'employment_status')) console.log(`| ${k} | ${c} |`);
  console.log('');

  console.log('### 3. account_state 分布');
  console.log('');
  console.log('| account_state | 件数 |');
  console.log('|---|---|');
  for (const [k, c] of distribution(records, 'account_state')) console.log(`| ${k} | ${c} |`);
  console.log('');

  // ───── 4. pc_link_count_n 分布 ─────
  console.log('### 4. pc_link_count_n 分布 (PC 紐付き台数)');
  console.log('');
  const pcLinkDist = new Map();
  for (const r of records) {
    const n = Number(r['pc_link_count_n']?.value || 0);
    pcLinkDist.set(n, (pcLinkDist.get(n) || 0) + 1);
  }
  console.log('| pc_link_count_n | 件数 |');
  console.log('|---|---|');
  for (const [k, c] of [...pcLinkDist.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`| ${k} 台 | ${c} |`);
  }
  console.log('');

  // ───── 5. 異常検出 ─────
  console.log('### 5. 異常検出');
  console.log('');

  const personal = records.filter((r) => r['account_type']?.value === '個人');
  const personalNoLink = personal.filter((r) => Number(r['pc_link_count_n']?.value || 0) === 0);
  const personalMultiLink = personal.filter((r) => Number(r['pc_link_count_n']?.value || 0) >= 2);
  console.log(`- 個人カテゴリ全件: **${personal.length}** (仕様 §7.4.1 想定 = 259)`);
  console.log(`- 個人で PC 紐付き 0 件: **${personalNoLink.length}** ⚠ (CSV 移行時に PC 行が空白になる)`);
  console.log(`- 個人で PC 紐付き 2 件以上: **${personalMultiLink.length}** ⚠ (1 PC=1 アカウント原則違反 / B-1 移行時に分割要)`);
  console.log('');

  if (personalNoLink.length > 0) {
    console.log('#### 個人 PC 紐付き 0 件 一覧 (先頭 10)');
    console.log('');
    console.log('| レコード番号 | user_name | logon_name | dept_name |');
    console.log('|---|---|---|---|');
    for (const r of personalNoLink.slice(0, 10)) {
      console.log(`| ${r['レコード番号']?.value} | ${r['user_name']?.value} | ${r['logon_name']?.value} | ${r['dept_name']?.value} |`);
    }
    if (personalNoLink.length > 10) console.log(`| ... (残り ${personalNoLink.length - 10} 件) | | | |`);
    console.log('');
  }

  if (personalMultiLink.length > 0) {
    console.log('#### 個人 PC 紐付き 2 件以上 一覧');
    console.log('');
    console.log('| レコード番号 | user_name | logon_name | pc_link_count_n | PC_name |');
    console.log('|---|---|---|---|---|');
    for (const r of personalMultiLink) {
      console.log(`| ${r['レコード番号']?.value} | ${r['user_name']?.value} | ${r['logon_name']?.value} | ${r['pc_link_count_n']?.value} | ${(r['PC_name']?.value || '').slice(0, 60)} |`);
    }
    console.log('');
  }

  // ───── 6. logon_name バリデーション 2 系統チェック ─────
  console.log('### 6. logon_name 形式分布 (新規発番=厳格 4 桁 / 既存移行=緩い 4-6 桁)');
  console.log('');
  let strict4 = 0;
  let loose5 = 0;
  let loose6 = 0;
  let nonPattern = 0;
  let empty = 0;
  for (const r of records) {
    const ln = r['logon_name']?.value || '';
    if (!ln) { empty++; continue; }
    if (/^(jbm|sjbm)\d{4}$/.test(ln)) strict4++;
    else if (/^(jbm|sjbm)\d{5}$/.test(ln)) loose5++;
    else if (/^(jbm|sjbm)\d{6}$/.test(ln)) loose6++;
    else nonPattern++;
  }
  console.log('| パターン | 件数 |');
  console.log('|---|---|');
  console.log(`| 厳格 4 桁 (^(jbm\\|sjbm)\\d{4}$) | ${strict4} |`);
  console.log(`| 緩い 5 桁 | ${loose5} |`);
  console.log(`| 緩い 6 桁 | ${loose6} |`);
  console.log(`| 非パターン (要手動確認) | ${nonPattern} ⚠ |`);
  console.log(`| 空 | ${empty} |`);
  console.log('');

  console.log('---');
  console.log('');
  console.log('完了。次は CSV マッピング表ドラフト作成へ進む。');
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
