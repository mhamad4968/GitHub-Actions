#!/usr/bin/env node
/**
 * Excel 集計表 vs 776 本務人数（拠点合計）突合 dry-run
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const excelPath = 'C:\\tmp\\社員名簿（正社員・準社員）\\社員一覧表更新.xlsx';
const wb = XLSX.readFile(excelPath);
const rows = XLSX.utils.sheet_to_json(wb.Sheets['集計表'], { header: 1, defval: '' });
const excelHubs = {};
let curHub = '';
for (let i = 1; i < rows.length; i++) {
  const hub = String(rows[i][0] ?? '').trim();
  const dept = String(rows[i][1] ?? '').trim();
  const cnt = Number(rows[i][2]);
  const total = Number(rows[i][3]);
  if (hub) curHub = hub;
  if (dept === '合計' || (!dept && !cnt && total)) continue;
  if (!curHub || !dept || !isFinite(cnt)) continue;
  if (!excelHubs[curHub]) excelHubs[curHub] = { depts: {}, totalFromCol: null, sum: 0 };
  excelHubs[curHub].depts[dept] = cnt;
  excelHubs[curHub].sum += cnt;
  if (isFinite(total) && total > 0) excelHubs[curHub].totalFromCol = total;
}

const GROUP_LABEL = {
  honsya: '本社',
  tohoku: '東北支店',
  'kan-etsu': '関越支店',
  tokyo: '東京支店',
  tokai: '東海支店',
  reform: 'リフォーム事業統括部',
  tekko: '鉄構支店',
  wangan: '湾岸工事所',
};

const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

const all = [];
let offset = 0;
for (;;) {
  const { records } = await client.record.getRecords({
    app: '776',
    fields: ['row_role', 'group_name', 'dept_name', 'section_name', 'source_595_id'],
    query: 'row_role in ("本務") order by $id asc limit 500 offset ' + offset,
  });
  all.push(...records);
  if (records.length < 500) break;
  offset += 500;
}

const seen = {};
const byHub = {};
for (const r of all) {
  const sid = r.source_595_id?.value;
  if (!sid || seen[sid]) continue;
  seen[sid] = true;
  const g = r.group_name?.value || '(未設定)';
  const hub = GROUP_LABEL[g] || g;
  const dept = r.dept_name?.value || '(未設定)';
  const sec = r.section_name?.value || '';
  // Excel風ラベル試案: 営業所系はそのまま、支店＋部／室は連結
  let label = dept;
  if (sec) {
    if (dept.endsWith('支店') || dept === 'リフォーム事業統括部' || dept === '鉄構支店') {
      label = dept + sec;
    } else {
      label = dept + (sec ? '／' + sec : '');
    }
  }
  if (!byHub[hub]) byHub[hub] = { sum: 0, depts: {}, labels: {} };
  byHub[hub].sum += 1;
  byHub[hub].depts[dept] = (byHub[hub].depts[dept] || 0) + 1;
  byHub[hub].labels[label] = (byHub[hub].labels[label] || 0) + 1;
}

const hubCmp = [];
for (const hub of Object.keys(excelHubs)) {
  const ex = excelHubs[hub];
  const k = byHub[hub] || { sum: 0 };
  hubCmp.push({
    hub,
    excelSum: ex.totalFromCol || ex.sum,
    kintoneSum: k.sum,
    delta: k.sum - (ex.totalFromCol || ex.sum),
  });
}

const out = {
  excelPeopleHint: Object.values(excelHubs).reduce((a, h) => a + (h.totalFromCol || h.sum), 0),
  kintonePrimaryPeople: Object.keys(seen).length,
  hubCmp,
  excelHubsSample: Object.fromEntries(
    Object.entries(excelHubs).map(([h, v]) => [h, { sum: v.totalFromCol || v.sum, deptCount: Object.keys(v.depts).length }]),
  ),
};
fs.writeFileSync('logs/employee-roster/agg-hub-compare.json', JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
