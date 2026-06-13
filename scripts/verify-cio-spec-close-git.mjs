#!/usr/bin/env node
/**
 * R24 — docs/plans/*-spec.md 変更は working tree または commit 済みであること
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRIAL = '.cio/session-clock-mode.json';

function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function main() {
  const issues = [];
  const porcelain = git(['status', '--porcelain', '--', 'docs/plans', TRIAL]);
  if (porcelain) {
    const lines = porcelain.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const rel = line.slice(3).trim().replace(/^"(.*)"$/, '$1');
      if (line.startsWith('??') || line.startsWith(' M') || line.startsWith('M ') || line.startsWith('A ')) {
        issues.push(`R24 未 commit: ${rel} — SPEC/試験フラグは同日 commit 必須`);
      }
    }
  }

  const rule = path.join(root, '.cursor/rules/session-close-execute-first.mdc');
  if (!fs.existsSync(rule)) {
    issues.push('missing session-close-execute-first.mdc (R23)');
  }

  if (issues.length) {
    console.error('[verify:cio-spec-close-git] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-spec-close-git] OK R24 plans/spec 未 commit なし');
  process.exit(0);
}

main();
