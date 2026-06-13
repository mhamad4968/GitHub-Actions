#!/usr/bin/env node
/**
 * R19 — 台帳 SPEC が Q&A チェックリスト runbook を参照しているか
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNBOOK = 'docs/runbooks/kintone-ledger-spec-qa-checklist.md';
const SPECS = [
  'docs/plans/2026-06-13-software-ledger-kintone-spec.md',
  'docs/plans/2026-06-13-storage-media-ledger-kintone-spec.md',
];

function main() {
  const issues = [];
  if (!fs.existsSync(path.join(root, RUNBOOK))) {
    issues.push(`missing ${RUNBOOK}`);
  }
  for (const rel of SPECS) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      issues.push(`missing ${rel}`);
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    if (!text.includes('kintone-ledger-spec-qa-checklist.md')) {
      issues.push(`${rel} に R19 runbook 参照なし`);
    }
    if (!text.includes('一覧') && !text.includes('印刷')) {
      issues.push(`${rel} に一覧/印刷の記述なし（F2 再発リスク）`);
    }
  }
  if (issues.length) {
    console.error('[verify:kintone-ledger-spec-qa] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:kintone-ledger-spec-qa] OK R19 SPEC 参照');
  process.exit(0);
}

main();
