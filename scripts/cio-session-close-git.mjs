#!/usr/bin/env node
/**
 * セッション締め Git 儀式 — 先祖返り回避 + B1/B4 + R19/R20 連鎖
 *
 * 順序（--execute 時）:
 *   0) cio:session:close-recognition-gate --pre-commit（R19 内容突合のみ）
 *   1) cio:guard:multi-customize
 *   2) git add（--auto-stage）/ commit
 *   3) cio:session:export-handoff → verify:session-handoff-integrity --validate-export（amend 前）
 *   4) bridge を amend fold → git pull --rebase → git push
 *   5) verify:session-close-git-warn
 *   6) desktop:sync-and-verify（--skip-desktop-sync で省略可・浜田 GO 時のみ）
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { isSessionCloseTempPath } from './lib/cio-session-close-temp-paths.mjs';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';
import { touchesGovernance } from './lib/cio-governance-touch.mjs';
import { syncCheckpointGitAfterPush } from './lib/cio-checkpoint-git-sync.mjs';
import { CHECKPOINT_REL } from './lib/cio-checkpoint-read.mjs';
import { repairCheckpointBootstrapBlock } from './lib/cio-handoff-template.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESKTOP_DIR = process.env.SESSION_STARTER_DESKTOP_DIR || 'C:\\Users\\mhamada202408224\\Desktop\\AI緊急用';

const execute = process.argv.includes('--execute');
const autoStage = process.argv.includes('--auto-stage');
const skipDesktop = process.argv.includes('--skip-desktop-sync');
const skipCheckpointGit = process.argv.includes('--skip-checkpoint-git-sync');
const skipR19 = process.argv.includes('--skip-r19');
const msgIdx = process.argv.indexOf('--message');
const message = msgIdx >= 0 ? process.argv[msgIdx + 1] : '';

function git(args, opts = {}) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', ...opts });
  return {
    ok: r.status === 0,
    status: r.status ?? 1,
    out: (r.stdout || '').trim(),
    err: (r.stderr || '').trim(),
  };
}

function runNode(rel, args = []) {
  const r = spawnSync(process.execPath, [path.join(root, rel), ...args], {
    cwd: root,
    stdio: 'inherit',
  });
  return r.status === 0;
}

function runNpm(script, args = [], extraEnv = {}) {
  const r = runNpmScriptSync(root, script, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  return r.status === 0;
}

function syncGitHistoryGenerationsIfNeeded(pathsText) {
  if (!touchesGovernance(pathsText)) return true;
  console.log('[cio:session:close-git] governance touch — sync:git-history-generations --apply');
  return runNode('scripts/sync-git-history-generations.mjs', ['--apply']);
}

function stageSessionChanges() {
  git(['add', '-u']);
  const st = git(['status', '--porcelain']);
  if (!st.ok) {
    console.error('[cio:session:close-git] git status 失敗');
    process.exit(2);
  }
  for (const line of st.out.split(/\r?\n/).filter(Boolean)) {
    if (line.length < 4) continue;
    const x = line[0];
    const y = line[1];
    if (x !== '?' || y !== '?') continue;
    const rel = line.slice(3).trim().replace(/^"(.*)"$/, '$1');
    if (isSessionCloseTempPath(rel)) {
      console.log(`[cio:session:close-git] skip temp: ${rel}`);
      continue;
    }
    git(['add', '--', rel]);
  }
  const count = git(['diff', '--cached', '--name-only']).out.split(/\r?\n/).filter(Boolean).length;
  console.log(`[cio:session:close-git] auto-stage: ${count} path(s) staged`);
}

function checkOnly() {
  console.log('[cio:session:close-git] 検査モード — 締め前に --execute --message で B1/B4 実行');
  return runNode('scripts/verify-session-close-git-warn.mjs');
}

function main() {
  console.log('=== cio:session:close-git（先祖返り回避 + B1/B4 + R20）===');
  console.log('正本: 18-重要確認 B1/B4 / session-close-multi-session.md\n');

  if (!execute) {
    process.exit(checkOnly() ? 0 : 1);
  }

  if (!message) {
    console.error('[cio:session:close-git] NG --execute には --message "…" 必須');
    process.exit(1);
  }

  if (!skipR19) {
    if (!runNode('scripts/cio-session-close-recognition-gate.mjs', ['--pre-commit'])) {
      console.error('[cio:session:close-git] NG R19 pre-commit 認識ゲート');
      process.exit(1);
    }
  } else {
    console.warn('[cio:session:close-git] WARN --skip-r19（浜田 GO + 理由必須）');
  }

  if (!runNpm('cio:guard:multi-customize')) {
    console.error('[cio:session:close-git] NG R-17-1 multi-customize guard');
    process.exit(1);
  }

  const bootRep = repairCheckpointBootstrapBlock(root);
  if (bootRep.repaired) {
    console.log(
      `[cio:session:close-git] checkpoint bootstrap auto-repair: ${bootRep.filled.join(', ')}`,
    );
  }

  const porcelain = git(['status', '--porcelain']).out;
  const hasUncommitted = Boolean(porcelain);
  const staged = git(['diff', '--cached', '--name-only']).out;

  if (hasUncommitted && !staged && autoStage) {
    stageSessionChanges();
  }

  const porcelainAfter = git(['status', '--porcelain']).out;
  const stagedAfter = git(['diff', '--cached', '--name-only']).out;
  if (porcelainAfter && !stagedAfter) {
    console.error('[cio:session:close-git] NG 未コミットあり — git add または --auto-stage');
    git(['status', '--short']);
    process.exit(1);
  }

  if (stagedAfter) {
    const commit = git(['commit', '-m', message]);
    if (!commit.ok) {
      console.error('[cio:session:close-git] NG commit 失敗（pre-commit 等）');
      process.exit(commit.status || 1);
    }
    console.log('[cio:session:close-git] commit OK');
    if (!syncGitHistoryGenerationsIfNeeded(stagedAfter)) {
      console.error('[cio:session:close-git] NG sync:git-history-generations');
      process.exit(1);
    }
  } else {
    console.log('[cio:session:close-git] 新規 commit なし（既に commit 済）');
  }

  runNpm('cio:session:export-handoff');

  if (fs.existsSync(path.join(root, 'docs/handoff/latest-session-bridge.json'))) {
    if (!runNpm('verify:session-handoff-integrity', ['--validate-export'])) {
      console.error('[cio:session:close-git] NG handoff bridge 整合 — export-handoff を確認');
      process.exit(1);
    }
  }

  if (autoStage) stageSessionChanges();
  const bridgeStaged = git(['diff', '--cached', '--name-only']).out;
  if (bridgeStaged) {
    // R31: amend fold 後 gitHead === HEAD~1 を許容 — bridge は単独 commit（amend 禁止）
    const bridgeCommit = git(['commit', '-m', 'chore(handoff): session bridge export']);
    if (!bridgeCommit.ok) {
      console.error('[cio:session:close-git] NG bridge export commit 失敗');
      process.exit(bridgeCommit.status || 1);
    }
    console.log('[cio:session:close-git] bridge export を単独 commit（R31）');
    runNpm('cio:session:export-handoff');
    if (autoStage) stageSessionChanges();
    const bridgeRefresh = git(['diff', '--cached', '--name-only']).out;
    if (bridgeRefresh) {
      const refreshCommit = git(['commit', '-m', 'chore(handoff): align bridge gitHead']);
      if (!refreshCommit.ok) {
        console.error('[cio:session:close-git] NG bridge gitHead refresh 失敗');
        process.exit(refreshCommit.status || 1);
      }
      console.log('[cio:session:close-git] bridge gitHead refresh commit（R31）');
    }
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).out || 'main';
  git(['fetch', 'origin', branch]);

  const pull = spawnSync('git', ['pull', '--rebase', 'origin', branch], {
    cwd: root,
    stdio: 'inherit',
  });
  if (pull.status !== 0) {
    console.error('[cio:session:close-git] NG pull --rebase — 競合解消後に再実行');
    process.exit(pull.status || 1);
  }

  const push = git(['push', 'origin', 'HEAD']);
  if (!push.ok) {
    console.error('[cio:session:close-git] NG push', push.err || push.out);
    process.exit(push.status || 1);
  }
  console.log('[cio:session:close-git] push OK');

  if (!skipCheckpointGit) {
    const { changed, hash } = syncCheckpointGitAfterPush(root);
    if (changed && hash) {
      git(['add', CHECKPOINT_REL]);
      const cpCommit = git(['commit', '-m', 'chore(checkpoint): sync Git line after close']);
      if (cpCommit.ok) {
        const push2 = git(['push', 'origin', 'HEAD']);
        if (!push2.ok) {
          console.error('[cio:session:close-git] NG checkpoint Git sync push', push2.err || push2.out);
          process.exit(push2.status || 1);
        }
        console.log(`[cio:session:close-git] checkpoint Git synced → ${hash}`);
      }
    }
  }

  if (!runNode('scripts/verify-session-close-git-warn.mjs')) {
    process.exit(1);
  }

  if (skipDesktop) {
    console.warn('[cio:session:close-git] WARN --skip-desktop-sync — 後で desktop:sync-and-verify 必須（R17）');
  } else if (!runNpm('desktop:sync-and-verify', [], { SESSION_STARTER_DESKTOP_DIR: DESKTOP_DIR })) {
    console.error('[cio:session:close-git] NG desktop:sync-and-verify');
    process.exit(1);
  }

  console.log('\n[cio:session:close-git] OK — 締め Git + Desktop 連鎖完了（R20）');
  process.exit(0);
}

main();
