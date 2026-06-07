#!/usr/bin/env node
/**
 * 業務改善 — 新④ 設定マスタ seed（Excel 30行 + 共通設定 jinji + 評価20段階）
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import {
  EVAL_SPEC_PATH,
  SETTINGS_XLSX_PATH,
  buildEvalRowsFromSpec,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/business-improvement-kintone.mjs';

const ORG_TYPE_MAP = {
  支店: '支店',
  営業所: '営業所',
  本社: '本社部',
  本社部: '本社部',
};

function loadLabelMapFrom83Snapshot() {
  const p = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'app-83-records-snapshot.json');
  if (!existsSync(p)) return new Map();
  const snap = JSON.parse(readFileSync(p, 'utf8'));
  const map = new Map();
  const typeMap = {
    '業務改善提案評価：評価': ['業務改善提案', '効果'],
    '業務改善提案評価：工夫度': ['業務改善提案', '工夫度'],
    '業務改善提案評価：努力度': ['業務改善提案', '努力度'],
    'アイディア提案評価：総合評価': ['アイデア提案', '総合的審査'],
  };
  for (const rec of snap.records || []) {
    const oldType = rec['評価種別'];
    const label = rec['評価'];
    if (!oldType || oldType === '最終評価' || !label) continue;
    const mapped = typeMap[oldType];
    if (!mapped) continue;
    const stage = String(label).charAt(0);
    if (!'①②③④⑤'.includes(stage)) continue;
    const key = `${mapped[0]}|${mapped[1]}|${stage}`;
    map.set(key, String(label).trim());
  }
  return map;
}

function readExcelRows() {
  const wb = XLSX.readFile(SETTINGS_XLSX_PATH);
  const ws = wb.Sheets['設定マスタ'];
  if (!ws) throw new Error('Excel: sheet 設定マスタ not found');
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  if (rows.length !== 30) throw new Error(`Excel: expected 30 rows, got ${rows.length}`);
  return rows;
}

function orgRecord(row) {
  const rawType = String(row['種別'] || '').trim();
  const orgType = ORG_TYPE_MAP[rawType] || rawType;
  return {
    record_kind: { value: '所属行' },
    org_type: orgType ? { value: orgType } : { value: '' },
    dept_name: { value: String(row['部署名'] || '').trim() },
    group_name: { value: String(row['group_name'] || '').trim() },
    applicant_login: { value: String(row['申請者'] || '').trim() },
    manager_login: { value: String(row['部長評価'] || '').trim() },
    branch_manager_login: { value: String(row['支店長評価'] || '').trim() },
    manager_email: { value: '' },
    branch_manager_email: { value: '' },
    note: { value: String(row['備考'] || '').trim() },
    hr_director_login: { value: '' },
    hr_director_email: { value: '' },
    eval_items: { value: [] },
  };
}

function commonRecord(evalRows) {
  return {
    record_kind: { value: '共通設定' },
    org_type: { value: '' },
    dept_name: { value: '全社共通設定' },
    group_name: { value: '' },
    applicant_login: { value: '' },
    manager_login: { value: '' },
    branch_manager_login: { value: '' },
    manager_email: { value: '' },
    branch_manager_email: { value: '' },
    note: { value: '人事部長・評価20段階マスタ（Q-IMPL-05）' },
    hr_director_login: { value: 'jinji' },
    hr_director_email: { value: '' },
    eval_items: {
      value: evalRows.map((r) => ({
        value: {
          eval_proposal_type: { value: r.eval_proposal_type },
          eval_axis: { value: r.eval_axis },
          eval_stage: { value: r.eval_stage },
          eval_points: { value: r.eval_points },
          eval_label: { value: r.eval_label },
        },
      })),
    },
  };
}

async function getRecords(appId, query, headers, baseUrl) {
  const params = new URLSearchParams();
  params.set('app', String(appId));
  params.set('query', query);
  params.set('fields[0]', 'record_kind');
  params.set('fields[1]', '$id');
  const url = `${baseUrl}/k/v1/records.json?${params.toString()}`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return j.records || [];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const appId = state.settingsAppId;
  if (!appId) throw new Error('settingsAppId missing — run business-improvement:create-settings-app first');

  const excelRows = readExcelRows();
  const spec = JSON.parse(readFileSync(EVAL_SPEC_PATH, 'utf8'));
  const labelMap = loadLabelMapFrom83Snapshot();
  const evalRows = buildEvalRowsFromSpec(spec, labelMap);
  if (evalRows.length !== 20) throw new Error(`eval rows expected 20, got ${evalRows.length}`);

  const records = [...excelRows.map(orgRecord), commonRecord(evalRows)];

  if (dryRun) {
    console.log(JSON.stringify({ appId, recordCount: records.length, evalRows: evalRows.length }, null, 2));
    return;
  }

  const existing = await getRecords(appId, 'order by $id asc limit 500', headers, baseUrl);
  if (existing.length > 0 && !force) {
    console.log(`[seed] skip: ${existing.length} records already exist (use --force to add anyway)`);
    return;
  }

  const CHUNK = 100;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: appId, records: chunk }),
    });
    console.log(`[seed] posted ${i + chunk.length}/${records.length}`);
  }

  console.log(`[seed] OK app=${appId} records=${records.length} (30 org + 1 common, eval_items=${evalRows.length})`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
