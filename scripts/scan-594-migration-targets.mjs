#!/usr/bin/env node
// scan-594-migration-targets.mjs
// 既存 594 PC台帳の移行対象を特定するため、type/abolished_flag/status/ステータス の
// 値分布を取得し、「廃棄」相当の値とその件数を可視化する。
// snapshot も同時に保存。

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
    const key = (Array.isArray(v) ? v.join('+') : v) ?? '(空)';
    m.set(key, (m.get(key) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function printDistribution(label, dist) {
  console.log(`\n=== ${label} ===`);
  for (const [val, cnt] of dist) {
    console.log(`  "${val}": ${cnt} 件`);
  }
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`🔍 594 PC台帳 移行対象スキャン (${today})\n`);

  const fields = [
    'PC_name', 'type', 'abolished_flag', 'status', 'ステータス',
    'user_name', 'ledger_record_id', 'shared_terminal_name'
  ];
  console.log(`📥 594 取得中...`);
  const recs = await fetchAll(594, fields);

  const dir = path.resolve('data/snapshots');
  fs.mkdirSync(dir, { recursive: true });
  const snapPath = path.join(dir, `594-pre-migration-scan-${today}.json`);
  fs.writeFileSync(snapPath, JSON.stringify(recs, null, 2), 'utf-8');
  console.log(`📦 snapshot: ${snapPath} (${recs.length} 件)`);

  printDistribution('type (種別)', distribution(recs, 'type'));
  printDistribution('abolished_flag (廃止フラグ)', distribution(recs, 'abolished_flag'));
  printDistribution('status (状態ステータス)', distribution(recs, 'status'));
  printDistribution('ステータス (kintone標準)', distribution(recs, 'ステータス'));

  // 個人 PC の件数（仮: type=個人）
  const personalAll = recs.filter(r => r.type?.value === '個人');
  console.log(`\n=== 種別=個人 全 ${personalAll.length} 件 ===`);
  printDistribution('  └ うち abolished_flag', distribution(personalAll, 'abolished_flag'));
  printDistribution('  └ うち status', distribution(personalAll, 'status'));
  printDistribution('  └ うち ステータス', distribution(personalAll, 'ステータス'));

  console.log(`\n\n=== 📊 総合 ===`);
  console.log(`594 全件: ${recs.length} 件`);
  console.log(`種別=個人: ${personalAll.length} 件`);
  console.log(`\n→ 「廃棄」相当の値がどのフィールド・どの値かを浜田と確認後、移行対象件数を確定する`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
