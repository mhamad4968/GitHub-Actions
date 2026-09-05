#!/usr/bin/env node
/**
 * 15ターン制限時の全自動荷造り + テンポラリ purge
 * §5.3 — repair → bridge 書込 → tips stock を同一 try（失敗時 bridge 不更新）
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  BRIDGE_REL,
  bridgePath,
  loadState,
  saveState,
  writeJson,
} from './lib/cio-session-bridge.mjs';
import { collectLastFailures } from './lib/cio-bridge-last-failures.mjs';
import { stockDebugTips, TIPS_REL } from './lib/cio-debug-tips-stock.mjs';
import { readCheckpointNextTask } from './lib/cio-checkpoint-read.mjs';
import { getDefaultBridgeNextFiles, repairHandoffLatestBlock } from './lib/cio-handoff-template.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** #S-HANDOFF-01 — --help / 未知フラグでは本体副作用禁止 */
function guardCliArgs(argv) {
  const known = new Set(['--help', '-h']);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`Usage: node scripts/cio-session-export-handoff.mjs
  (no args)  repair handoff + write bridge + stock tips
  --help     print this help and exit 0 (no writes)`);
    process.exit(0);
  }
  const unknown = argv.filter((a) => a.startsWith('-') && !known.has(a));
  if (unknown.length) {
    console.error('[cio:session:export-handoff] NG unknown args:', unknown.join(' '));
    console.error('  → --help のみ許可。未知フラグでは bridge を書かない（#S-HANDOFF-01）');
    process.exit(2);
  }
}

function sh(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function purgeTemporaries() {
  let n = 0;
  const dir = path.join(root, 'logs');
  if (!fs.existsSync(dir)) return n;
  for (const name of fs.readdirSync(dir)) {
    if (/^tmp-/i.test(name) || /^_cio-draft-/i.test(name)) {
      fs.unlinkSync(path.join(dir, name));
      n++;
    }
  }
  return n;
}

function main() {
  guardCliArgs(process.argv.slice(2));

  let gitHead = 'unknown';
  let gitStatus = '';
  try {
    gitHead = sh('git rev-parse --short HEAD');
    gitStatus = sh('git status -sb').split('\n')[0];
  } catch {
    /* noop */
  }

  const exportedAt = new Date().toISOString();
  let bridge;
  let tipsResult;
  let rep;

  try {
    rep = repairHandoffLatestBlock(root);
    if (rep.repaired) {
      console.log(`[cio:session:export-handoff] auto-repair handoff: ${rep.filled.join(', ')}`);
    }

    const nextTask = readCheckpointNextTask(root) || '(要 Read checkpoint-latest.md)';
    const nextFiles = getDefaultBridgeNextFiles(root);
    if (!nextFiles.includes(TIPS_REL)) nextFiles.push(TIPS_REL);

    const lastFailures = collectLastFailures(root, { exportedAt });

    bridge = {
      version: '2026-05-30',
      exportedAt,
      gitHead,
      gitStatus,
      nextTask,
      nextFiles,
      lastFailures,
      promptBlock:
        `【SESSION-BRIDGE】git=${gitHead} | 次=${nextTask} | Read: ${nextFiles.slice(0, 3).join(', ')}` +
        (lastFailures.length ? ` | lastFailures=${lastFailures.length}` : ''),
      note: 'New Chat 第1ターン: npm run verify:session-handoff-integrity -- --import',
    };

    writeJson(bridgePath(root), bridge);
    tipsResult = stockDebugTips(root, { exportedAt: bridge.exportedAt });

    const state = loadState(root);
    state.exported = true;
    state.exportedAt = bridge.exportedAt;
    saveState(root, state);
  } catch (err) {
    console.error('[cio:session:export-handoff] NG atomic export — bridge 未更新');
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const purged = purgeTemporaries();

  console.log('[cio:session:export-handoff] OK', BRIDGE_REL);
  console.log('[cio:session:export-handoff] gitHead=', gitHead);
  console.log('[cio:session:export-handoff] lastFailures=', bridge.lastFailures?.length ?? 0);
  console.log('[cio:session:export-handoff] purged=', purged, 'temp files');
  console.log('[cio:session:export-handoff] debug-tips=', tipsResult.merged ? 'merged' : tipsResult.reason);
  console.log('[cio:session:export-handoff] 次タスク:', bridge.nextTask);
  console.log('[cio:session:export-handoff] 続けて: npm run verify:session-handoff-integrity -- --validate-export');
  process.exit(0);
}

main();
