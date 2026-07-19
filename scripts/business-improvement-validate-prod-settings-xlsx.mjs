#!/usr/bin/env node
/**
 * 本番 Excel（設定マスタ_本番）の検証
 * - マスタ変更は原則「人事発令」に伴う担当者・Login ID 更新として扱う
 * - Login ID とメールの不一致は異動後の ID 再利用では WARN のみ（ERROR にしない）
 */
import XLSX from './lib/xlsx-node.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchJson, getKintoneConfig } from './lib/business-improvement-kintone.mjs';

const XLSX_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'business-improvement-settings-master-production-2026-08.xlsx');

async function fetchAllUsers(baseUrl, headers) {
  const map = new Map();
  let offset = 0;
  for (;;) {
    const j = await fetchJson(`${baseUrl}/v1/users.json?size=100&offset=${offset}`, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    for (const u of j.users || []) {
      if (u.code) map.set(String(u.code).toLowerCase(), u);
    }
    if ((j.users || []).length < 100) break;
    offset += 100;
  }
  return map;
}

function norm(s) {
  return String(s || '').replace(/\s/g, '').trim();
}

function emailLocal(email) {
  return String(email || '').split('@')[0].toLowerCase();
}

function readRows() {
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets['設定マスタ_本番'] || wb.Sheets['設定マスタ'];
  if (!ws) throw new Error('設定マスタ_本番 not found');
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return rows;
}

async function main() {
  const rows = readRows();
  const { baseUrl, headers } = getKintoneConfig();
  const users = await fetchAllUsers(baseUrl, headers);

  const issues = [];
  const deptSet = new Set();
  const required = ['種別', '部署名', 'group_name', '申請者', '部長評価', '支店長評価'];

  if (rows.length !== 30) {
    issues.push({ level: 'ERROR', kind: '行数', detail: `30行必須、現在 ${rows.length} 行` });
  }

  for (const row of rows) {
    const dept = row['部署名'];
    if (deptSet.has(dept)) issues.push({ level: 'ERROR', kind: '部署重複', dept, detail: dept });
    deptSet.add(dept);

    for (const col of required) {
      if (!String(row[col] || '').trim()) {
        issues.push({ level: 'ERROR', kind: '必須欠落', dept, detail: col });
      }
    }

    for (const [role, loginCol, nameCol, mailCol] of [
      ['申請者', '申請者', '申請者_表示名', null],
      ['部長', '部長評価', '部長評価_表示名', '部長評価_メール'],
      ['支店長', '支店長評価', '支店長評価_表示名', '支店長評価_メール'],
    ]) {
      const login = String(row[loginCol] || '').trim();
      const u = users.get(login.toLowerCase());
      if (!u) {
        issues.push({ level: 'ERROR', kind: 'kintone未登録', dept, role, login, detail: row['要確認'] || '' });
        continue;
      }
      if (mailCol && role !== '申請者') {
        const excelMail = String(row[mailCol] || '').trim();
        if (!excelMail) {
          issues.push({ level: 'WARN', kind: 'メール空欄', dept, role, login });
        } else if (u.email && excelMail !== u.email) {
          issues.push({
            level: 'WARN',
            kind: 'メール不一致(kintone)',
            dept,
            role,
            login,
            excel: excelMail,
            kintone: u.email,
          });
        } else if (!u.email && excelMail) {
          issues.push({ level: 'INFO', kind: 'kintoneメール未設定(Excelあり)', dept, role, login, excel: excelMail });
        }
        const local = emailLocal(excelMail);
        if (local && !local.includes(login.replace(/_/g, '-').split('-')[0]) && login !== 'haruna') {
          const loginKey = login.replace(/^./, '').split('-')[0];
          if (local && login && !local.includes(login.split('-').pop()) && !local.startsWith(login.slice(0, 3))) {
            // heuristic only below
          }
        }
      }
      const excelName = norm(row[nameCol]);
      const kName = norm(u.name);
      if (excelName && kName && excelName !== kName && role !== '申請者') {
        issues.push({
          level: 'WARN',
          kind: '表示名不一致(kintone)',
          dept,
          role,
          login,
          excel: row[nameCol],
          kintone: u.name,
        });
      }
    }
  }

  // Login ID vs メールローカル部の明らかな不整合
  for (const row of rows) {
    const dept = row['部署名'];
    for (const [role, loginCol, nameCol, mailCol] of [
      ['部長', '部長評価', '部長評価_表示名', '部長評価_メール'],
      ['支店長', '支店長評価', '支店長評価_表示名', '支店長評価_メール'],
    ]) {
      const login = String(row[loginCol] || '').trim().toLowerCase();
      const mail = String(row[mailCol] || '').trim().toLowerCase();
      const local = emailLocal(mail);
      if (!login || !local) continue;
      const loginParts = login.split('-').filter(Boolean);
      const match =
        local === login ||
        local.replace(/-/g, '') === login.replace(/-/g, '') ||
        loginParts.some((p) => p.length >= 3 && local.includes(p)) ||
        local.includes(loginParts[loginParts.length - 1]);
      if (!match) {
        issues.push({
          level: 'WARN',
          kind: 'LoginIDとメール不整合',
          dept,
          role,
          login: row[loginCol],
          name: row[nameCol],
          mail: row[mailCol],
        });
      }
    }
  }

  // 同一 Login ID が複数行で異なる表示名
  const byLogin = new Map();
  for (const row of rows) {
    for (const [role, col, nameCol] of [
      ['部長', '部長評価', '部長評価_表示名'],
      ['支店長', '支店長評価', '支店長評価_表示名'],
    ]) {
      const login = String(row[col] || '').trim();
      if (!login) continue;
      const key = `${role}:${login}`;
      const name = String(row[nameCol] || '').trim();
      if (!byLogin.has(key)) byLogin.set(key, new Set());
      byLogin.get(key).add(name);
    }
  }
  for (const [key, names] of byLogin) {
    if (names.size > 1) {
      issues.push({ level: 'ERROR', kind: '同一LoginIDで表示名が複数', login: key, names: [...names] });
    }
  }

  const flagged = rows.filter((r) => String(r['要確認'] || '').trim());
  const errors = issues.filter((i) => i.level === 'ERROR');
  const warns = issues.filter((i) => i.level === 'WARN');

  console.log(JSON.stringify({
    summary: {
      rows: rows.length,
      errors: errors.length,
      warnings: warns.length,
      manualFlags: flagged.length,
      okForSeed: errors.length === 0,
    },
    manualFlags: flagged.map((r) => ({ 部署: r['部署名'], 要確認: r['要確認'] })),
    errors,
    warnings: warns,
  }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
