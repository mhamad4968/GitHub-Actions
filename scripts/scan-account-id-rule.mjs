#!/usr/bin/env node
// scan-account-id-rule.mjs
// 626 アカウント採番アプリ・667 共有アカウント採番マスタの WindowsID を
// 仕様書 §4.3.2 のルール (^jbm\d{4}$ / ^sjbm\d{4}$) で検査する。
// 違反データを抽出し、snapshot を保存。修正は別段階 (浜田承認後) で実施。

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
  'Content-Type': 'application/json',
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers['Authorization'] = 'Basic ' + Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64');
}

// 仕様書 §4.3.2 の厳格ルール
const RULE_PERSONAL = /^jbm\d{4}$/;
const RULE_SHARED = /^sjbm\d{4}$/;

// GET 時は Content-Type を外す (既存 sync-595-to-627.js のパターン準拠)
function headersForGet() {
  const h = { ...headers };
  delete h['Content-Type'];
  return h;
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
    const res = await fetch(url, { method: 'GET', headers: headersForGet() });
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

function saveSnapshot(filename, data) {
  const dir = path.resolve('data/snapshots');
  fs.mkdirSync(dir, { recursive: true });
  const fullPath = path.join(dir, filename);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`📦 snapshot 保存: ${fullPath} (${data.length} 件)`);
}

function classifyViolations(records, fieldName, rule, ruleLabel) {
  const ok = [];
  const ng = [];
  const empty = [];
  for (const r of records) {
    const v = r[fieldName]?.value ?? '';
    if (!v) {
      empty.push({ recId: r.$id?.value, value: v });
      continue;
    }
    if (rule.test(v)) {
      ok.push({ recId: r.$id?.value, value: v });
    } else {
      ng.push({ recId: r.$id?.value, value: v });
    }
  }
  console.log(`\n=== ${ruleLabel} (${fieldName}) ===`);
  console.log(`  ✅ ルール準拠: ${ok.length} 件`);
  console.log(`  ❌ ルール違反: ${ng.length} 件`);
  console.log(`  ⚪ 空値: ${empty.length} 件`);
  if (ng.length > 0) {
    console.log(`  違反内訳 (先頭 30 件):`);
    ng.slice(0, 30).forEach((x, i) => {
      console.log(`    [${i + 1}] recId=${x.recId} value="${x.value}"`);
    });
    if (ng.length > 30) console.log(`    ... 他 ${ng.length - 30} 件`);
  }
  return { ok, ng, empty };
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`🔍 採番マスタ ID ルール検査 (${today})\n`);
  console.log(`仕様書 §4.3.2 ルール:`);
  console.log(`  個人 (626 logon_name): /^jbm\\d{4}$/`);
  console.log(`  共有 (667 windows_id): /^sjbm\\d{4}$/\n`);

  console.log(`📥 626 (アカウント採番アプリ) 取得中...`);
  // 注: $id は fields 指定すると CB_IL02 になる。レスポンスに自動で含まれる。
  const recs626 = await fetchAll(626, ['logon_name', 'used_count']);
  saveSnapshot(`626-pre-cleanup-${today}.json`, recs626);
  const r626 = classifyViolations(recs626, 'logon_name', RULE_PERSONAL, '626 個人 WindowsID');

  console.log(`\n📥 667 (共有アカウント採番マスタ) 取得中...`);
  const recs667 = await fetchAll(667, ['windows_id', 'used_count']);
  saveSnapshot(`667-pre-cleanup-${today}.json`, recs667);
  const r667 = classifyViolations(recs667, 'windows_id', RULE_SHARED, '667 共有 WindowsID');

  console.log(`\n\n=== 📊 総合サマリ ===`);
  console.log(`626 個人: 全 ${recs626.length} 件 / 違反 ${r626.ng.length} / 空 ${r626.empty.length}`);
  console.log(`667 共有: 全 ${recs667.length} 件 / 違反 ${r667.ng.length} / 空 ${r667.empty.length}`);
  console.log(`\n次ステップ: 違反データの修正案 diff を浜田に提示 → 承認後にメイン AI が PUT 実行`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
