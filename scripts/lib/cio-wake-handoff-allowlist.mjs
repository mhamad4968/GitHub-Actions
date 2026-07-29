/**
 * WAKE handoff commit の allowlist 正本（cio:wake:handoff-commit と verify で共有）
 *
 * tip が進んでも bridge.gitHead は parent のまま（再 export→再 commit の無限追従を避ける）。
 * verify は「HEAD が本 allowlist のみ」かつ「bridge.gitHead === parent」なら GIT_HEAD_DRIFT を許容する。
 */
import { execFileSync } from 'node:child_process';

/** @type {readonly string[]} */
export const WAKE_HANDOFF_ALLOWLIST = Object.freeze([
  'docs/handoff/latest-session-bridge.json',
  'docs/handoff/spec-task-scores.json',
  'docs/knowledge/debug-tips.md',
  'chat-sessions/checkpoint-latest.md',
  'chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt',
  'chat-sessions/desktop-ai-emergency-read-pack/31-META-26-formalization-lifecycle-charter.txt',
  'chat-sessions/desktop-ai-emergency-read-pack/32-META-27-constitution-navigation-charter.txt',
  'chat-sessions/desktop-ai-emergency-read-pack/33-META-28-ceo-go-phases-charter.txt',
]);

export function gitHeadShort(root) {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

export function gitAncestorHeadShort(root, generations = 1) {
  try {
    return execFileSync('git', ['rev-parse', '--short', `HEAD~${generations}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

export function commitTouchesOnly(root, ref, allowedFiles) {
  try {
    const names = execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', ref], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    if (!names.length) return false;
    const allowed = new Set(allowedFiles);
    return names.every((n) => allowed.has(n));
  } catch {
    return false;
  }
}

/** HEAD が WAKE handoff allowlist のみか */
export function lastCommitTouchesOnlyWakeHandoff(root) {
  return commitTouchesOnly(root, 'HEAD', WAKE_HANDOFF_ALLOWLIST);
}

/**
 * bridge.gitHead === parent かつ HEAD が WAKE allowlist のみ → drift 許容
 * @returns {boolean}
 */
export function isWakeHandoffParentGitHeadFold(root, bridgeGitHead) {
  if (!bridgeGitHead || bridgeGitHead === 'unknown') return false;
  const parentHead = gitAncestorHeadShort(root, 1);
  if (!parentHead || bridgeGitHead !== parentHead) return false;
  return lastCommitTouchesOnlyWakeHandoff(root);
}
