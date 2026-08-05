#!/usr/bin/env node
/**
 * セッション締め Git 儀式 — 先祖返り回避 + B1/B4 + R19/R20 連鎖
 *
 * 順序（--execute 時）:
 *   0-) cio:session:close-preflight（S-CLOSE-PREFLIGHT-01 — export/score/#D-CLOSE-02）
 *   0) cio:session:close-recognition-gate --pre-commit（R19 内容突合のみ）
 *   0b) verify:spec-progress-sync（R736-SPEC-SYNC 鏡像矛盾）
 *   0c) cio:guard:5038-session-audit（v3.2 B1 — customize セッションのみ）
 *   1) cio:guard:multi-customize
 *   2) git add（--auto-stage）/ commit
 *   3) export-handoff + checkpoint Git(parent) → verify
 *   4) bridge + checkpoint を1メタcommit → git pull --rebase → git push
 *   5) R44 off-by-one（tipの親）を検証
 *   6) verify:session-close-git-warn
 *   7) desktop:sync-and-verify（--skip-desktop-sync で省略可・浜田 GO 時のみ）
 *
 * S-CLOSE-ONEPASS-01: 途中 NG 時は git-heal / 手書き Git / PS Set-Content を挟まず、
 *   原因1件を直してから本コマンドを再実行する。
 *
 * SPEC を含む場合: --reviewed-by deepseek|kimi|openrouter で commit trailer を付与。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { isSessionCloseTempPath } from './lib/cio-session-close-temp-paths.mjs';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';
import { touchesGovernance } from './lib/cio-governance-touch.mjs';
import {
  gitShortHead,
  updateCheckpointGitHead,
  // syncCheckpointGitAfterPush — P3 では push 後 tip stamp すると chase commit が増えるため未使用。
  // 締めは push 前に updateCheckpointGitHead(parent)（R44）で固定する。
} from './lib/cio-checkpoint-git-sync.mjs';
import { CHECKPOINT_REL } from './lib/cio-checkpoint-read.mjs';
import { repairCheckpointBootstrapBlock } from './lib/cio-handoff-template.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESKTOP_DIR = process.env.SESSION_STARTER_DESKTOP_DIR || 'C:\\Users\\mhamada202408224\\Desktop\\AI緊急用';

const execute = process.argv.includes('--execute');
const autoStage = process.argv.includes('--auto-stage');
const skipDesktop = process.argv.includes('--skip-desktop-sync');
const skipCheckpointGit = process.argv.includes('--skip-checkpoint-git-sync');
const skipR19 = process.argv.includes('--skip-r19');
const skipPreflight = process.argv.includes('--skip-preflight');
const msgIdx = process.argv.indexOf('--message');
const message = msgIdx >= 0 ? process.argv[msgIdx + 1] : '';
const reviewerIdx = process.argv.indexOf('--reviewed-by');
const reviewedBy = reviewerIdx >= 0 ? process.argv[reviewerIdx + 1] : '';
const allowedReviewers = new Set(['deepseek', 'kimi', 'openrouter']);

const ONEPASS =
  '[cio:session:close-git] ONEPASS (S-CLOSE-ONEPASS-01): git-heal / 手書き **Git** / PowerShell Set-Content を挟まない。原因1件を直してから close-git --execute を再実行';

function failClose(msg, code = 1) {
  console.error(`[cio:session:close-git] NG ${msg}`);
  console.error(ONEPASS);
  process.exit(code);
}

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
    failClose('--execute には --message "…" 必須');
  }
  if (reviewedBy && !allowedReviewers.has(reviewedBy)) {
    failClose('--reviewed-by は deepseek|kimi|openrouter のみ');
  }

  if (!skipPreflight) {
    if (!runNode('scripts/cio-session-close-preflight.mjs')) {
      failClose('S-CLOSE-PREFLIGHT-01（export/score/#D-CLOSE-02）');
    }
  } else {
    console.warn('[cio:session:close-git] WARN --skip-preflight（浜田 GO + 理由必須）');
  }

  if (!skipR19) {
    if (!runNode('scripts/cio-session-close-recognition-gate.mjs', ['--pre-commit'])) {
      failClose('R19 pre-commit 認識ゲート');
    }
  } else {
    console.warn('[cio:session:close-git] WARN --skip-r19（浜田 GO + 理由必須）');
  }

  if (!runNode('scripts/verify-spec-progress-sync.mjs')) {
    failClose('R736-SPEC-SYNC — 仕様進捗表の鏡像矛盾（先祖返り）');
  }

  if (!runNode('scripts/cio-guard-5038-session-audit.mjs')) {
    failClose('§50-3-8 session audit（customize セッション）');
  }

  if (!runNpm('cio:guard:multi-customize')) {
    failClose('R-17-1 multi-customize guard');
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
    failClose('未コミットあり');
  }

  if (stagedAfter) {
    const commitArgs = ['commit', '-m', message];
    if (reviewedBy) commitArgs.push('-m', `Reviewed-by: ${reviewedBy}`);
    const commit = git(commitArgs, {
      env: { ...process.env, CIO_POST_COMMIT_CHECKPOINT_SYNC: '1' },
    });
    if (!commit.ok) {
      failClose('commit 失敗（pre-commit 等）', commit.status || 1);
    }
    console.log('[cio:session:close-git] commit OK');
    if (!syncGitHistoryGenerationsIfNeeded(stagedAfter)) {
      failClose('sync:git-history-generations');
    }
  } else {
    console.log('[cio:session:close-git] 新規 commit なし（既に commit 済）');
  }

  // P3 (2026-07-25 浜田承認): bridge と checkpoint を同じ「締めメタ commit」に集約。
  // どちらも直前の内容 commit（= 最終tipの親）を記録するため、R44 off-by-one が
  // 意図どおり1世代に固定され、追いかけ同期 commit を増殖させない。
  runNpm('cio:session:export-handoff');
  if (!skipCheckpointGit) {
    const parentHash = gitShortHead(root);
    if (parentHash) {
      try {
        updateCheckpointGitHead(root, { hash: parentHash, suffix: 'push 済（R44 parent）' });
      } catch (err) {
        failClose(err instanceof Error ? err.message : String(err));
      }
    }
  }

  if (fs.existsSync(path.join(root, 'docs/handoff/latest-session-bridge.json'))) {
    if (!runNpm('verify:session-handoff-integrity', ['--validate-export'])) {
      failClose('handoff bridge 整合 — export-handoff を確認（git-heal 連鎖禁止）');
    }
  }

  if (autoStage) stageSessionChanges();
  git(['add', 'docs/handoff/latest-session-bridge.json', CHECKPOINT_REL]);
  const closeMetaStaged = git(['diff', '--cached', '--name-only']).out;
  if (closeMetaStaged) {
    const metaCommit = git(
      ['commit', '-m', 'chore(session): sync checkpoint Git + handoff bridge'],
      { env: { ...process.env, CIO_POST_COMMIT_CHECKPOINT_SYNC: '1' } },
    );
    if (!metaCommit.ok) {
      failClose('締めメタ commit 失敗', metaCommit.status || 1);
    }
    console.log('[cio:session:close-git] checkpoint + bridge を1 commitに集約（P3/R44）');
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).out || 'main';
  git(['fetch', 'origin', branch]);

  const pull = spawnSync('git', ['pull', '--rebase', 'origin', branch], {
    cwd: root,
    stdio: 'inherit',
  });
  if (pull.status !== 0) {
    failClose('pull --rebase — 競合解消後に再実行', pull.status || 1);
  }

  const push = git(['push', 'origin', 'HEAD']);
  if (!push.ok) {
    console.error('[cio:session:close-git] NG push', push.err || push.out);
    failClose('push', push.status || 1);
  }
  console.log('[cio:session:close-git] push OK');

  if (!runNode('scripts/verify-session-close-git-warn.mjs')) {
    failClose('verify:session-close-git-warn');
  }

  if (skipDesktop) {
    console.warn('[cio:session:close-git] WARN --skip-desktop-sync — 後で desktop:sync-and-verify 必須（R17）');
  } else if (!runNpm('desktop:sync-and-verify', [], { SESSION_STARTER_DESKTOP_DIR: DESKTOP_DIR })) {
    failClose('desktop:sync-and-verify');
  }

  console.log('\n[cio:session:close-git] OK — 締め Git + Desktop 連鎖完了（R20）');
  process.exit(0);
}

main();
