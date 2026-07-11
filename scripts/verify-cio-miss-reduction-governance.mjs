#!/usr/bin/env node
/**
 * R19–R33 ミス削減ガバナンス — 正本ファイル存在 + キーワード検査
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  { rel: '.cursor/rules/session-close-execute-first.mdc', needles: ['R23', 'R26', '最初の tool call'] },
  { rel: 'docs/runbooks/kintone-ledger-spec-qa-checklist.md', needles: ['R19', '一覧・印刷'] },
  { rel: 'docs/runbooks/windows-spawn-flash-triage.md', needles: ['R32', '試験'] },
  { rel: 'docs/runbooks/cio-health-check-turn.md', needles: ['R33', 'health-check'] },
  { rel: 'docs/runbooks/evening-reflection-scope.md', needles: ['R26', '混ぜ禁止'] },
  { rel: 'docs/runbooks/cio-four-ai-governance.md', needles: ['R31', 'bridge.gitHead', 'R41', 'lastFailures'] },
  { rel: 'docs/runbooks/session-clock-cursor-lifecycle.md', needles: ['R25', 'trialPaused'] },
  { rel: 'scripts/lib/win-hidden-spawn.mjs', needles: ['resolveNpmCliJs', 'npm-cli.js'] },
  { rel: 'scripts/lib/cio-handoff-export-validate.mjs', needles: ['lastCommitTouchesOnlyBridge', 'r31BridgeFold'] },
  { rel: 'scripts/lib/session-clock-process.mjs', needles: ['taskkill', 'R22'] },
  { rel: 'docs/plans/2026-07-11-ai-team-ops-optimization-spec.md', needles: ['lastFailures', 'export 原子化', '柱 A'] },
  { rel: 'docs/plans/2026-07-11-ai-team-ops-optimization-spec-v32.md', needles: ['形骸化防止原則', 'verify:team-ops-v2', 'L1', 'Phase 1'] },
  { rel: 'docs/plans/2026-07-11-ai-team-ops-optimization-spec-v33.md', needles: ['A–D', '△クリア総括', '§8 今日の実装 Batch', 'validate-contract'] },
  { rel: 'scripts/cio-session-export-handoff.mjs', needles: ['collectLastFailures', '同一 try'] },
  { rel: 'scripts/lib/cio-bridge-last-failures.mjs', needles: ['collectLastFailures', 'MAX_FAILURES'] },
  { rel: 'scripts/cio-turn-start.mjs', needles: ['printContractForTier', '--tier', 'validateTierGate'] },
];

function main() {
  const issues = [];
  for (const { rel, needles } of REQUIRED) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      issues.push(`missing ${rel}`);
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    for (const n of needles) {
      if (!text.includes(n)) issues.push(`${rel} missing: ${n}`);
    }
  }

  const spawnVerify = fs.readFileSync(path.join(root, 'scripts/verify-win-hidden-spawn-hotpaths.mjs'), 'utf8');
  if (!spawnVerify.includes('runtimeSmoke') && !spawnVerify.includes('runNpmScriptSync')) {
    issues.push('verify-win-hidden-spawn-hotpaths に R29 runtime 不足');
  }
  if (!spawnVerify.includes('warn-only')) {
    issues.push('verify-win-hidden-spawn-hotpaths に R29 smoke 用 --warn-only 未使用');
  }

  if (issues.length) {
    console.error('[verify:cio-miss-reduction-governance] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-miss-reduction-governance] OK R19–R33 正本');
  process.exit(0);
}

main();
