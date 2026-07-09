#!/usr/bin/env node
/**
 * Grok L2b — 実行契約スタンプ・C-ready チェック・失敗記録
 * @see docs/runbooks/cio-grok-execution-loop.md
 */
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  formatCReadyReport,
  loadState,
  MAX_C_PER_SESSION,
  recordFail,
  recordStamp,
  recordSuccess,
  repoRoot,
  saveState,
  scanDiffForForbidden,
  validateDoneWhen,
  validateInScope,
} from './lib/cio-grok-execution.mjs';

const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const root = repoRoot(import.meta.url);

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

function fail(msg, code = 1) {
  console.error(`${RED}[cio:grok:execution-guard] ${msg}${RESET}`);
  process.exit(code);
}

function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('--validate-diff')) {
    const { ok, hits } = scanDiffForForbidden(root);
    if (!ok) {
      for (const h of hits) console.error(`  - ${h.label}: ${h.line}`);
      fail('禁止パターンを working diff に検知 — Grok C 停止');
    }
    console.log('[cio:grok:execution-guard] OK diff scan (no deploy/push/PUT patterns)');
    process.exit(0);
  }

  if (argv.includes('--check-c-ready')) {
    const state = loadState(root);
    console.log(formatCReadyReport(state));
    const items = [
      state.section5038Done,
      state.composerFirstDiffDone,
      state.sessionCRuns < MAX_C_PER_SESSION,
    ];
    process.exit(items.every(Boolean) ? 0 : 2);
  }

  if (argv.includes('--mark-composer-diff')) {
    const state = loadState(root);
    state.composerFirstDiffDone = true;
    saveState(root, state);
    console.log('[cio:grok:execution-guard] OK composerFirstDiffDone=true');
    process.exit(0);
  }

  if (argv.includes('--mark-5038')) {
    const state = loadState(root);
    state.section5038Done = true;
    saveState(root, state);
    console.log('[cio:grok:execution-guard] OK section5038Done=true');
    process.exit(0);
  }

  if (argv.includes('--stamp')) {
    const mode = (argValue('--mode') || 'B').toUpperCase();
    const goal = argValue('--goal') || '';
    const doneWhen = argValue('--done-when') || '';
    const inScope = argValue('--in-scope') || '';

    if (mode === 'C') {
      const state = loadState(root);
      if (state.sessionCRuns >= MAX_C_PER_SESSION) {
        fail(`Grok C セッション上限 ${MAX_C_PER_SESSION} — Fable/§41 を検討`);
      }
      if (!state.composerFirstDiffDone) {
        fail('C 発動不可: Composer 初回 Diff 未 — npm run cio:grok:execution-guard -- --mark-composer-diff');
      }
      if (!state.section5038Done) {
        fail('C 発動不可: §50-3-8 未 — npm run cio:grok:execution-guard -- --mark-5038');
      }
      const dw = validateDoneWhen(doneWhen);
      if (!dw.ok) fail(`C 発動不可: ${dw.reason}`);
      const sc = validateInScope(inScope);
      if (!sc.ok) fail(`C 発動不可: ${sc.reason}`);
      const diffScan = scanDiffForForbidden(root);
      if (!diffScan.ok) {
        for (const h of diffScan.hits) console.error(`  - ${h.label}: ${h.line}`);
        fail('C 発動不可: working diff に deploy/push/PUT 疑い');
      }
    }
    const { stamp } = recordStamp(root, {
      mode,
      goal,
      doneWhen,
      inScope,
      note: argValue('--note') || '',
    });
    console.log(`[cio:grok:execution-guard] OK stamp id=${stamp.id} mode=${stamp.mode}`);
    console.log(`[cio:grok:execution-guard] contractHash=${stamp.contractHash}`);
    process.exit(0);
  }

  if (argv.includes('--record-success')) {
    recordSuccess(root);
    console.log('[cio:grok:execution-guard] OK reset');
    process.exit(0);
  }

  if (argv.includes('--record-fail')) {
    const state = recordFail(root, argValue('--reason') || 'unknown');
    console.log(`[cio:grok:execution-guard] fail recorded sessionCRuns=${state.sessionCRuns}`);
    process.exit(0);
  }

  console.error(`Usage:
  npm run cio:grok:execution-guard -- --check-c-ready
  npm run cio:grok:execution-guard -- --mark-composer-diff
  npm run cio:grok:execution-guard -- --mark-5038
  npm run cio:grok:execution-guard -- --validate-diff
  npm run cio:grok:execution-guard -- --stamp --mode C --goal "…" --done-when "npm run …" --in-scope "path"
  npm run cio:grok:execution-guard -- --record-success
  npm run cio:grok:execution-guard -- --record-fail --reason "…"`);
  process.exit(2);
}

main();
