#!/usr/bin/env node
/**
 * S-741-05 — 複合機管理台帳 v1 CLOSED 後処理（closures + verify）
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const closuresPath = path.join(root, 'data/cio-project-closures.json');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status ?? 1;
}

function ensureClosure() {
  const data = JSON.parse(readFileSync(closuresPath, 'utf8'));
  const id = 'mfp-ledger';
  const existing = (data.closures || []).find((c) => c.id === id);
  if (existing) {
    console.log('[mfp-ledger:close] closure already registered');
    return;
  }
  data.closures.push({
    id: 'mfp-ledger',
    laneId: 'mfp-ledger',
    label: '複合機管理台帳',
    status: 'closed-v1',
    closedAt: '2026-06-22',
    completionReport: 'docs/reports/2026-06-22-mfp-ledger-completion.md',
    kintoneAppsSection: '複合機管理台帳（Space 48 — 741–742）',
    kintoneAppsStateMarker: 'v1 完成 — CLOSED',
    forbiddenNextTaskPatterns: [
      '複合機',
      'mfp-ledger',
      'MFP',
      '741',
      '742',
      '複合機管理台帳',
    ],
    note: '36台・一覧・CRUD・印刷・xlsx。浜田目視 OK。Excel 完全削除済（2026-06-22 浜田報告）。v2: 674連携・IP重複チェック等',
  });
  writeFileSync(closuresPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('[mfp-ledger:close] registered closure mfp-ledger');
}

function main() {
  ensureClosure();
  let code = run('npm', ['run', 'verify:kintone-app-ids', '--', '--slug', 'mfp-ledger']);
  if (code !== 0) process.exit(code);
  code = run('npm', ['run', 'verify:cio-deploy-ledger-gate', '--', '--apps', '741,742']);
  if (code !== 0) process.exit(code);
  code = run('npm', ['run', 'verify:checkpoint-project-closure', '--', '--project', 'mfp-ledger']);
  process.exit(code);
}

main();
