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
  // #S-KNOW-WAKE-01 — Phase 5d knowledge-wake stamp の digest を WAKE commit に同梱（偽陽性残件防止）
  'chat-sessions/knowledge-wake-latest.md',
  'chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt',
  'chat-sessions/desktop-ai-emergency-read-pack/31-META-26-formalization-lifecycle-charter.txt',
  'chat-sessions/desktop-ai-emergency-read-pack/32-META-27-constitution-navigation-charter.txt',
  'chat-sessions/desktop-ai-emergency-read-pack/33-META-28-ceo-go-phases-charter.txt',
  // #S-RAG-WAKE-03 — quick-health Self-Heal 後の正本ミラーを WAKE commit に同梱
  'kintone-apps.md',
  '.rag/extra-docs/kintone-apps.md',
  'RULES-INDEX.md',
  '.rag/extra-docs/RULES-INDEX.md',
  'AGENTS.md',
  '.rag/extra-docs/AGENTS.md',
  'WORKFLOW.md',
  '.rag/extra-docs/WORKFLOW.md',
  // #S-CREDIT-WAKE-01 — Plan & Usage 記録（credit:set）を WAKE/残件 commit に同梱可
  'data/credit-usage.json',
  // #S-WAKE-ORDER-01 — Part C WAKE 同期を early wake-commit に同梱
  'chat-sessions/session-starter-parts/part-C-full-paste-core.md',
]);

/**
 * allowlist 厳密一致以外で WAKE commit に載せる相対パス（dated archive 等）
 * #S-CHKPT-ROLLUP-01 — Phase 3 rollup の archive が allowlist 漏れで残件化するのを防ぐ
 * @param {string} rel posix 相対パス
 */
export function isWakeHandoffPathAllowed(rel) {
  if (WAKE_HANDOFF_ALLOWLIST.includes(rel)) return true;
  if (/^chat-sessions\/checkpoints\/checkpoint-archive-\d{4}-\d{2}-\d{2}\.md$/.test(rel)) {
    return true;
  }
  return false;
}

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
    return names.every((n) => allowed.has(n) || isWakeHandoffPathAllowed(n));
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
