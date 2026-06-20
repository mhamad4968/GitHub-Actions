#!/usr/bin/env node
/**
 * R58–R62 ミス削減 — インフラ整合検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'docs/approved-changes/2026-06-20-rules-r58-r62-hamada-go.md',
  'docs/runbooks/kintone-v1-extension-addendum.md',
  'scripts/lib/cio-project-closure.mjs',
  'scripts/verify-session-close-git-warn.mjs',
  'scripts/git-hook-pre-push.mjs',
];

const NEEDLES = [
  { rel: 'scripts/lib/cio-project-closure.mjs', needles: ['checkHoldLaneDirtyFiles', 'matchHoldLaneFile'] },
  { rel: 'scripts/verify-session-close-git-warn.mjs', needles: ['checkHoldLaneDirty', 'R58'] },
  { rel: 'scripts/git-hook-pre-push.mjs', needles: ['lint:customize', 'R60'] },
  { rel: 'chat-sessions/desktop-ai-emergency-read-pack/20-SESSION-REPORT-CHECKLIST.txt', needles: ['R59', 'R61', 'R62'] },
  { rel: 'docs/runbooks/windows-governance-ops.md', needles: ['R60', 'CIO_ALLOW_PUSH_WITHOUT_LINT'] },
  { rel: 'docs/runbooks/kintone-ledger-v1-closure-checklist.md', needles: ['kintone-v1-extension-addendum'] },
];

function main() {
  const issues = [];
  for (const rel of FILES) {
    if (!fs.existsSync(path.join(root, rel))) issues.push(`missing: ${rel}`);
  }
  for (const { rel, needles } of NEEDLES) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      issues.push(`missing: ${rel}`);
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    for (const n of needles) {
      if (!text.includes(n)) issues.push(`${rel} missing: ${n}`);
    }
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!pkg.scripts?.['verify:cio-r58-r62-infra']) {
    issues.push('package.json scripts.verify:cio-r58-r62-infra');
  }

  if (issues.length) {
    console.error('[verify:cio-r58-r62-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-r58-r62-infra] OK R58–R62 インフラ整合');
  process.exit(0);
}

main();
