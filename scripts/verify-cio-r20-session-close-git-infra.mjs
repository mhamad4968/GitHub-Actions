#!/usr/bin/env node
/**
 * R20 締め Git + Desktop 連鎖 — インフラ整合検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'scripts/cio-session-close-git.mjs',
  'scripts/cio-session-close-recognition-gate.mjs',
  '.cursor/rules/cio-session-close-git-gate.mdc',
  'docs/approved-changes/2026-06-13-rules-r20-session-close-git-hamada-go.md',
  'docs/runbooks/session-close-multi-session.md',
];

const SCRIPTS = ['cio:session:close-git', 'verify:cio-r20-session-close-git-infra'];

const EIGHTEEN_MARKERS = ['cio:session:close-git', 'B1/B4', '先祖返り'];

const GOV_MARKERS = ['R20', 'cio:session:close-git'];

function main() {
  const issues = [];
  for (const rel of FILES) {
    if (!fs.existsSync(path.join(root, rel))) issues.push(`missing: ${rel}`);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const s of SCRIPTS) {
    if (!pkg.scripts?.[s]) issues.push(`package.json scripts.${s}`);
  }

  const closeGit = fs.readFileSync(path.join(root, 'scripts/cio-session-close-git.mjs'), 'utf8');
  if (
    !closeGit.includes('verify-checkpoint-project-closure') &&
    !closeGit.includes('cio-session-close-recognition-gate.mjs')
  ) {
    issues.push('cio-session-close-git.mjs に R19 checkpoint 突合未連結');
  }
  if (!closeGit.includes('desktop:sync-and-verify')) {
    issues.push('cio-session-close-git.mjs に desktop:sync-and-verify 未連結');
  }
  if (!closeGit.includes('--pre-commit')) {
    issues.push('cio-session-close-git.mjs が recognition-gate --pre-commit 未使用');
  }
  if (!closeGit.includes('runNpmScriptSync') || closeGit.includes('shell: true')) {
    issues.push('cio-session-close-git.mjs が Windows hidden npm spawn 未適用');
  }
  if (!closeGit.includes('R31') && !closeGit.includes('bridge export を単独 commit')) {
    issues.push('cio-session-close-git.mjs に R31 bridge 単独 commit 未実装');
  }

  const desktop = pkg.scripts?.['desktop:sync-and-verify'] || '';
  if (!desktop.includes('desktop-sync-and-verify.mjs')) {
    issues.push('desktop:sync-and-verify が Node オーケストレータ未使用（cmd フラッシュ回避）');
  }
  const orchestrator = path.join(root, 'scripts/desktop-sync-and-verify.mjs');
  if (fs.existsSync(orchestrator)) {
    const orchText = fs.readFileSync(orchestrator, 'utf8');
    if (!orchText.includes('verify-checkpoint-project-closure')) {
      issues.push('desktop-sync-and-verify.mjs に verify-checkpoint-project-closure 未連結');
    }
  }

  const eighteen = fs.readFileSync(
    path.join(root, 'chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt'),
    'utf8',
  );
  for (const m of EIGHTEEN_MARKERS) {
    if (!eighteen.includes(m)) issues.push(`18-重要確認.txt missing: ${m}`);
  }

  const govDoc = fs.readFileSync(path.join(root, 'docs/runbooks/cio-four-ai-governance.md'), 'utf8');
  for (const m of GOV_MARKERS) {
    if (!govDoc.includes(m)) issues.push(`cio-four-ai-governance.md missing: ${m}`);
  }

  const bootstrap = fs.readFileSync(path.join(root, 'chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md'), 'utf8');
  if (bootstrap.includes('日終わり（推奨')) {
    issues.push('SESSION-BOOTSTRAP-CHECKLIST.md が日終わり「推奨」のまま');
  }

  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-cio-r20-session-close-git-infra')) {
    issues.push('verify:cio-four-ai-governance に r20-session-close-git 未連結');
  }

  if (issues.length) {
    console.error('[verify:cio-r20-session-close-git-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-r20-session-close-git-infra] OK R20 締め連鎖インフラ整合');

  const hot = spawnSync(process.execPath, ['scripts/verify-win-hidden-spawn-hotpaths.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
  process.exit(hot.status === 0 ? 0 : hot.status || 1);
}

main();
