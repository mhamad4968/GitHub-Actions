#!/usr/bin/env node
/**
 * 週末自律修正の一発自動巻き戻し（第9層・拡張案1）
 * npm run cio:rollback:weekend-actions [-- --dry-run|--force|--skip-verify]
 */
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  executeWeekendRollback,
  findWeekendCommits,
  resolveBaselineHash,
  loadBaseline,
  runVerifyGate,
  SAFETY_REPORT,
} from './lib/cio-weekend-rollback.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function hasFlag(name) {
  return args.includes(name);
}

function main() {
  const dryRun = hasFlag('--dry-run');
  const force = hasFlag('--force');
  const skipVerify = hasFlag('--skip-verify');
  const baselineIdx = args.indexOf('--baseline');
  const baselineOverride = baselineIdx >= 0 ? args[baselineIdx + 1] : undefined;

  if (hasFlag('--list')) {
    const baseline = loadBaseline(root);
    const hash = resolveBaselineHash(root, baseline);
    const commits = findWeekendCommits(root, hash);
    console.log('[cio:rollback:weekend-actions] baseline=', hash.slice(0, 7));
    for (const c of commits) console.log(' ', c.hash.slice(0, 7), c.subject);
    process.exit(0);
  }

  const result = executeWeekendRollback(root, { dryRun, force, skipVerify, baselineOverride });

  if (result.action === 'ok') {
    console.log('[cio:rollback:weekend-actions] OK', result.message);
    process.exit(0);
  }

  if (result.action === 'locked') {
    console.log('[cio:rollback:weekend-actions] LOCKED', result.lock?.message || '(既に退避済)');
    process.exit(0);
  }

  if (result.action === 'none') {
    const gate = runVerifyGate(root);
    if (gate.allOk) {
      console.log('[cio:rollback:weekend-actions] OK 検証合格・週末コミットなし');
      process.exit(0);
    }
    console.error('[cio:rollback:weekend-actions] NG verify 失敗だが週末コミット未検出');
    for (const r of gate.results.filter((x) => !x.ok)) {
      console.error(' ', r.cmd);
    }
    process.exit(1);
  }

  if (result.action === 'dry-run') {
    console.log('[cio:rollback:weekend-actions] dry-run revert candidates:', result.weekendCommits.length);
    process.exit(0);
  }

  if (result.action === 'failed') {
    console.error('[cio:rollback:weekend-actions] NG revert failed at', result.failedAt);
    console.error(result.error);
    process.exit(1);
  }

  if (result.action === 'reverted') {
    console.log('[cio:rollback:weekend-actions]', SAFETY_REPORT);
    console.log('[cio:rollback:weekend-actions] reverted=', result.reverted.length);
    console.log('[cio:rollback:weekend-actions] verify=', result.verify.allOk ? 'OK' : 'NG');
    process.exit(result.verify.allOk ? 0 : 1);
  }

  console.error('[cio:rollback:weekend-actions] unknown result', result.action);
  process.exit(1);
}

main();
