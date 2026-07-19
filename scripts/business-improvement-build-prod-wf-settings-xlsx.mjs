#!/usr/bin/env node
/**
 * 業務改善 697 設定マスタ — 8月本番向け Excel 生成
 * - 設定マスタ 30行 + Login ID + kintone ユーザメール（参照用）
 * - 共通設定（人事部長 jinji）
 * - WF経路・通知チェックリスト
 *
 * 出力: scripts/data/business-improvement-settings-master-production-2026-08.xlsx
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from './lib/xlsx-node.mjs';
import {
  SETTINGS_XLSX_PATH,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/business-improvement-kintone.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, 'data', 'business-improvement-settings-master-production-2026-08.xlsx');

const WF_STATUSES = [
  { order: 1, status: '未処理', action: '申請', next: '上司承認中', assignee: '部長評価者（700）' },
  { order: 2, status: '上司承認中', action: '部長承認（C）', next: '完了', assignee: '—' },
  { order: 3, status: '上司承認中', action: '部長承認（A/B or 支店長判断）', next: '支店長承認中', assignee: '支店長評価者' },
  { order: 4, status: '支店長承認中', action: '支店長承認（B）', next: '完了', assignee: '—' },
  { order: 5, status: '支店長承認中', action: '支店長承認（A）', next: '本社評価中', assignee: '人事部長評価者（jinji）' },
  { order: 6, status: '本社評価中', action: '人事部長承認', next: '完了', assignee: '—' },
  { order: '—', status: '申請者修正待ち', action: '差戻し', next: '上司承認中（再申請後）', assignee: '部長評価者' },
];

const NOTIFICATION_CHECKLIST = [
  ['項目', '本番設定', '備考'],
  ['700 プロセス管理', '有効', 'npm run business-improvement:setup-proposal-wf 済み要確認'],
  ['レコードの条件通知（各ステータス）', '要設定', '作業者=部長/支店長/人事部長評価者'],
  ['リマインド（3日ごと）', '要設定', '仕様 Q13 — 未処理・承認中'],
  ['メール送信先', 'kintoneユーザー登録メール', '本 Excel の *_メール列は参照・突合用'],
  ['697 seed', 'business-improvement:seed-settings --force', 'Excel 確定後'],
  ['テスト行削除', '【WFテスト】開発検証用 を697から削除', '本番前'],
  ['8/1 旧83/84', '閲覧のみ', 'Q-IMPL-03'],
];

async function fetchAllUsers(baseUrl, headers) {
  const map = new Map();
  let offset = 0;
  const size = 100;
  for (;;) {
    const url = `${baseUrl}/v1/users.json?size=${size}&offset=${offset}`;
    const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const users = j.users || [];
    for (const u of users) {
      if (u.code) {
        map.set(String(u.code).toLowerCase(), {
          code: u.code,
          name: u.name || '',
          email: u.email || '',
          valid: u.valid !== false,
        });
      }
    }
    if (users.length < size) break;
    offset += size;
  }
  return map;
}

function lookupUser(map, login) {
  const code = String(login || '').trim();
  if (!code) return { email: '', name: '', valid: '', note: '' };
  const u = map.get(code.toLowerCase());
  if (!u) return { email: '', name: '', valid: '未登録', note: 'kintoneユーザー要作成' };
  if (!u.email) return { email: '', name: u.name, valid: u.valid ? '有効' : '無効', note: 'メール未設定' };
  return { email: u.email, name: u.name, valid: u.valid ? '有効' : '無効', note: '' };
}

function readTemplateRows() {
  if (!existsSync(SETTINGS_XLSX_PATH)) throw new Error(`Missing template: ${SETTINGS_XLSX_PATH}`);
  const wb = XLSX.readFile(SETTINGS_XLSX_PATH);
  const ws = wb.Sheets['設定マスタ'];
  if (!ws) throw new Error('Sheet 設定マスタ not found in template');
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  if (rows.length !== 30) throw new Error(`Expected 30 rows, got ${rows.length}`);
  return { wb, rows };
}

function enrichOrgRow(row, userMap) {
  const applicant = lookupUser(userMap, row['申請者']);
  const manager = lookupUser(userMap, row['部長評価']);
  const branch = lookupUser(userMap, row['支店長評価']);
  // 申請者は拠点共有アカウント — メール未設定は仕様どおり（Q37/Q60）
  const issues = [manager, branch]
    .map((x) => x.note)
    .filter(Boolean)
    .join(' / ');
  return {
    種別: row['種別'],
    部署名: row['部署名'],
    group_name: row['group_name'],
    申請者: row['申請者'],
    申請者_表示名: applicant.name,
    申請者_メール: '（共有・不要）',
    申請者_状態: applicant.valid || (applicant.name ? '有効' : ''),
    部長評価: row['部長評価'],
    部長評価_表示名: manager.name,
    部長評価_メール: manager.email,
    部長評価_状態: manager.valid,
    支店長評価: row['支店長評価'],
    支店長評価_表示名: branch.name,
    支店長評価_メール: branch.email,
    支店長評価_状態: branch.valid,
    備考: row['備考'] || '',
    要確認: issues,
  };
}

function buildInstructionsSheet(jinjiEmail) {
  return XLSX.utils.aoa_to_sheet([
    ['業務改善提案システム — 8月本番向け 設定マスタ / WF 修正用 Excel'],
    ['作成日', new Date().toISOString().slice(0, 10)],
    [''],
    ['■ 使い方'],
    ['0', 'マスタ変更は原則「人事発令」に伴う更新 — Login ID とメール不一致は異動後の ID 再利用を想定'],
    ['1', '「設定マスタ_本番」シート — Login ID を修正（列: 申請者/部長評価/支店長評価）'],
    ['2', '「*_メール」列 — 部長・支店長・人事部長の kintone 登録メール（自動取得）。申請者は共有アカウントのためメール不要'],
    ['3', 'WF通知は kintone が Login ID のユーザメールへ送信 — Excel のメール列は突合・記録用'],
    ['4', '確定後: npm run business-improvement:seed-settings -- --force --xlsx=scripts/data/business-improvement-settings-master-production-2026-08.xlsx'],
    ['4b', '人事部長メール seed: BI_HR_DIRECTOR_EMAIL=' + (jinjiEmail || '（要設定）')],
    ['5', '700 通知・リマインドは「WF通知チェック」シートに従い kintone 管理画面で設定'],
    [''],
    ['■ 人事部長（全社共通）'],
    ['Login ID', 'jinji'],
    ['697 フィールド', 'hr_director_login / hr_director_email（共通設定レコード）'],
    [''],
    ['■ 正本'],
    ['仕様', 'docs/plans/2026-05-23-business-improvement-proposal-spec.md §3.2 §4.2'],
    ['seed スクリプト', 'scripts/business-improvement-seed-settings-master.mjs'],
    ['テンプレ正本', 'scripts/data/business-improvement-settings-master-template.xlsx'],
  ]);
}

async function fetch697OrgRows(baseUrl, headers, appId) {
  if (!appId) return null;
  try {
    const query = encodeURIComponent('record_kind in ("所属行") order by $id asc limit 500');
    const url =
      `${baseUrl}/k/v1/records.json?app=${appId}&query=${query}` +
      '&fields[0]=dept_name&fields[1]=applicant_login&fields[2]=manager_login&fields[3]=branch_manager_login';
    const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    return j.records || [];
  } catch {
    return null;
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const userMap = await fetchAllUsers(baseUrl, headers);
  const { rows: templateRows } = readTemplateRows();
  const appId = loadAppIds().settingsAppId;
  const live697 = await fetch697OrgRows(baseUrl, headers, appId);

  const prodRows = templateRows.map((row) => enrichOrgRow(row, userMap));

  const seedRows = prodRows.map((r) => ({
    種別: r['種別'],
    部署名: r['部署名'],
    group_name: r['group_name'],
    申請者: r['申請者'],
    部長評価: r['部長評価'],
    支店長評価: r['支店長評価'],
    部長メール: r['部長評価_メール'],
    支店長メール: r['支店長評価_メール'],
    備考: r['備考'],
  }));

  const jinji = lookupUser(userMap, 'jinji');
  const commonRow = {
    項目: '共通設定',
    部署名: '全社共通設定',
    人事部長_Login: 'jinji',
    人事部長_表示名: jinji.name,
    人事部長_メール: jinji.email,
    人事部長_状態: jinji.valid,
    年次暗唱番号: '（697 共通設定 — 浜田のみ）',
    備考: '評価20段階は seed 時 JSON から自動投入',
  };

  const wfRows = WF_STATUSES.map((w) => ({
    順序: w.order,
    ステータス: w.status,
    アクション: w.action,
    遷移先: w.next,
    作業者: w.assignee,
    通知: '要設定（700 プロセス通知）',
    リマインド3日: w.status.includes('承認') ? '要検討' : '—',
  }));

  const issueCount = prodRows.filter((r) => r['要確認']).length;
  const missingEmail = prodRows.filter(
    (r) => !r['部長評価_メール'] || !r['支店長評価_メール'] || r['要確認'],
  ).length;

  const summary = {
    outPath: OUT_PATH,
    orgRows: prodRows.length,
    kintoneUsers: userMap.size,
    rowsWithIssues: issueCount,
    rowsMissingEmailOrUser: missingEmail,
    jinjiEmail: jinji.email || '(empty)',
    live697Rows: live697 ? live697.length : null,
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(prodRows.slice(0, 2), null, 2));
    return;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildInstructionsSheet(jinji.email), '記入説明');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows), '設定マスタ_本番');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seedRows), '設定マスタ_seed用');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([commonRow]), '共通設定');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wfRows), 'WF経路_700');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(NOTIFICATION_CHECKLIST), 'WF通知チェック');

  if (live697 && live697.length) {
    const diff = prodRows.map((r, i) => {
      const live = live697.find((x) => x.dept_name?.value === r['部署名']) || live697[i];
      return {
        部署名: r['部署名'],
        Excel_申請者: r['申請者'],
        live697_申請者: live?.applicant_login?.value || '',
        Excel_部長: r['部長評価'],
        live697_部長: live?.manager_login?.value || '',
        Excel_支店長: r['支店長評価'],
        live697_支店長: live?.branch_manager_login?.value || '',
        一致: live?.applicant_login?.value === r['申請者'] ? 'OK' : '要確認',
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(diff), '697現状突合');
  }

  XLSX.writeFile(wb, OUT_PATH);
  console.log(JSON.stringify({ ...summary, written: true }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
