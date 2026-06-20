#!/usr/bin/env node
/**
 * R19 プロジェクト完了・認識同期ガバナンス — インフラ整合検証
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'docs/runbooks/cio-project-closure-governance.md',
  'docs/constitution/23-project-closure-recognition-kernel.md',
  '.cursor/rules/cio-project-closure-gate.mdc',
  'data/cio-project-closures.json',
  'scripts/lib/cio-checkpoint-read.mjs',
  'scripts/lib/cio-project-closure.mjs',
  'scripts/verify-checkpoint-project-closure.mjs',
  'scripts/cio-briefing-recognition-gate.mjs',
  'scripts/cio-session-close-recognition-gate.mjs',
  'docs/approved-changes/2026-06-13-rules-r19-project-closure-governance-hamada-go.md',
  'docs/runbooks/kintone-ledger-v1-closure-checklist.md',
  'docs/approved-changes/2026-06-17-rules-r41-r48-vpn-evening-improvements-hamada-go.md',
  'docs/approved-changes/2026-06-20-rules-r58-r62-hamada-go.md',
  'docs/runbooks/kintone-v1-extension-addendum.md',
];

const SCRIPTS = [
  'verify:checkpoint-project-closure',
  'verify:cio-project-closure-governance',
  'cio:briefing:recognition-gate',
  'cio:session:close-recognition-gate',
];

const EIGHTEEN_MARKERS = [
  'R19',
  '認識ズレ防止',
  'verify:checkpoint-project-closure',
  'cio-project-closure-governance',
];

const GOV_MARKERS = ['R19', 'cio-project-closure-governance', 'verify:checkpoint-project-closure'];

function main() {
  const issues = [];
  for (const rel of FILES) {
    if (!fs.existsSync(path.join(root, rel))) issues.push(`missing: ${rel}`);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const s of SCRIPTS) {
    if (!pkg.scripts?.[s]) issues.push(`package.json scripts.${s}`);
  }

  const desktopScript = fs.readFileSync(path.join(root, 'scripts/desktop-sync-and-verify.mjs'), 'utf8');
  const desktopPkg = pkg.scripts?.['desktop:sync-and-verify'] || '';
  if (
    !desktopScript.includes('verify-checkpoint-project-closure') &&
    !desktopPkg.includes('verify-checkpoint-project-closure')
  ) {
    issues.push('desktop:sync-and-verify に verify-checkpoint-project-closure 未連結');
  }

  const bootstrap = fs.readFileSync(path.join(root, 'scripts/session-bootstrap-verify.mjs'), 'utf8');
  if (!bootstrap.includes('verify-checkpoint-project-closure')) {
    issues.push('session-bootstrap-verify.mjs に verify-checkpoint-project-closure 未連結');
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

  const tsb = fs.readFileSync(path.join(root, 'docs/troubleshooting.md'), 'utf8');
  if (!tsb.includes('TSB-038')) issues.push('troubleshooting.md missing TSB-038');

  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-cio-project-closure-governance')) {
    issues.push('verify:cio-four-ai-governance に project-closure-governance 未連結');
  }

  const checkpoint = spawnSync(process.execPath, ['scripts/verify-checkpoint-project-closure.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (checkpoint.status !== 0) {
    issues.push('verify-checkpoint-project-closure 実行 NG（内容整合）');
  }

  if (issues.length) {
    console.error('[verify:cio-project-closure-governance] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-project-closure-governance] OK R19 認識同期インフラ整合');
  process.exit(0);
}

main();
