#!/usr/bin/env node
/**
 * 夕反省（26 / docs/reports/*-evening-reflection.md）のスコープ検証（S1 / 2026-05-30）
 *
 * 禁止: 明日のレーン・第1手・タスク計画・クローズ済み再計画
 * 正本: docs/runbooks/evening-reflection-scope.md
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE_DOC = path.join(root, 'docs/runbooks/evening-reflection-scope.md');

const FORBIDDEN = [
  { re: /明日の第1手/u, label: '明日の第1手（→ 当日 -0）' },
  { re: /明日は/u, label: '「明日は…」（→ 当日に聞く）' },
  { re: /次回\s*1\s*手/u, label: '次回 1 手（→ checkpoint / -0）' },
  { re: /案[ABCD][（(]/u, label: '案A/B/C/D タスク計画' },
  { re: /業務改善.*(明日|翌日|次回)/u, label: '業務改善の前日決定' },
  { re: /§41.*(明日|翌日|推奨)/u, label: '§41 の前日決定' },
  { re: /##\s*🌅\s*明日へ/u, label: '「明日へ」セクション（使用禁止）' },
  { re: /レーン.*(明日|翌日)/u, label: '明日レーンの前日決定' },
];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseArgs(argv) {
  const out = { file: null, todayIfExists: false, strict: true };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--file' && argv[i + 1]) {
      out.file = path.resolve(argv[++i]);
    } else if (argv[i] === '--today-if-exists') {
      out.todayIfExists = true;
    } else if (argv[i] === '--warn-only') {
      out.strict = false;
    }
  }
  return out;
}

function resolveTarget(args) {
  if (args.file) return args.file;
  if (args.todayIfExists) {
    const p = path.join(root, 'docs/reports', `${todayIso()}-evening-reflection.md`);
    if (!fs.existsSync(p)) return null;
    return p;
  }
  const p = path.join(root, 'docs/reports', `${todayIso()}-evening-reflection.md`);
  return fs.existsSync(p) ? p : null;
}

function checkScopeDocExists() {
  if (!fs.existsSync(SCOPE_DOC)) {
    return [`missing scope doc: ${path.relative(root, SCOPE_DOC)}`];
  }
  return [];
}

function scanFile(targetPath) {
  const text = fs.readFileSync(targetPath, 'utf8');
  const issues = [];
  const lines = text.split(/\r?\n/);
  let inForbiddenListSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+.*書かない/u.test(line)) inForbiddenListSection = true;
    if (/^##\s+/u.test(line) && !/書かない/u.test(line)) inForbiddenListSection = false;

    if (line.trimStart().startsWith('<!--')) continue;
    if (inForbiddenListSection) continue;
    if (/使用禁止|書かない|禁止|前日決定禁止|→/u.test(line)) continue;

    for (const { re, label } of FORBIDDEN) {
      if (re.test(line)) {
        issues.push(`L${i + 1}: ${label} — ${line.trim().slice(0, 80)}`);
        break;
      }
    }
  }

  if (!/evening-reflection-scope\.md/u.test(text) && !/ミス削減/u.test(text)) {
    issues.push('scope 参照なし（evening-reflection-scope.md または「ミス削減」の明記が必要）');
  }

  return issues;
}

function main() {
  const args = parseArgs(process.argv);
  const scopeIssues = checkScopeDocExists();
  if (scopeIssues.length) {
    console.error('[verify:evening-reflection-scope] NG');
    for (const i of scopeIssues) console.error(`  - ${i}`);
    process.exit(1);
  }

  const target = resolveTarget(args);
  if (!target) {
    console.log('[verify:evening-reflection-scope] SKIP（当日夕反省ファイルなし）');
    process.exit(0);
  }

  const issues = scanFile(target);
  if (issues.length) {
    console.error(`[verify:evening-reflection-scope] NG ${path.relative(root, target)}`);
    for (const i of issues) console.error(`  - ${i}`);
    console.error('  正本: docs/runbooks/evening-reflection-scope.md');
    process.exit(args.strict ? 1 : 0);
  }

  console.log(`[verify:evening-reflection-scope] OK ${path.relative(root, target)}`);
  process.exit(0);
}

main();
