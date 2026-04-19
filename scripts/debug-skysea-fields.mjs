#!/usr/bin/env node
/**
 * debug-skysea-fields.mjs — SKYSEA CSV のフィールド名と件数を確認するデバッグ用スクリプト
 *
 * 実行: node scripts/debug-skysea-fields.mjs <csv_path>
 * デフォルト: data/skysea/installed-pcs-<今日>.csv
 *
 * 出力:
 *   - 列名（ヘッダー）一覧
 *   - 行数
 *   - 端末機タイプ別のヒストグラム
 *   - 命名 prefix のヒストグラム
 *
 * 用途: skysea-recon.mjs を走らせる前に CSV エクスポートが正しい形式か確認
 */
import fs from 'node:fs';
import iconv from 'iconv-lite';

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
const csvPath = process.argv[2] || `data/skysea/installed-pcs-${today}.csv`;

if (!fs.existsSync(csvPath)) {
  console.error(`SKYSEA CSV not found: ${csvPath}`);
  process.exit(1);
}

const buf = fs.readFileSync(csvPath);
const text = iconv.decode(buf, 'cp932');

const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
const header = lines[0].split(',');
const rows = lines.slice(1).map((l) => {
  const cols = l.split(',');
  const o = {};
  header.forEach((h, i) => { o[h] = cols[i] ?? ''; });
  return o;
});

console.log(`# SKYSEA CSV デバッグ: ${csvPath}`);
console.log('');
console.log(`## 列名 (${header.length} 列)`);
header.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));
console.log('');
console.log(`## 行数: ${rows.length}`);
console.log('');

const typeHist = {};
for (const r of rows) {
  const t = r['端末機タイプ'] || '(空)';
  typeHist[t] = (typeHist[t] || 0) + 1;
}
console.log('## 端末機タイプ別ヒストグラム');
for (const [k, v] of Object.entries(typeHist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${v.toString().padStart(4)} : ${k}`);
}
console.log('');

const prefHist = {};
for (const r of rows) {
  const name = (r['コンピューター名'] || '').toUpperCase();
  const m = name.match(/^[A-Z]+/);
  const pref = m ? m[0] : '(その他)';
  prefHist[pref] = (prefHist[pref] || 0) + 1;
}
console.log('## prefix ヒストグラム');
for (const [k, v] of Object.entries(prefHist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${v.toString().padStart(4)} : ${k}`);
}
