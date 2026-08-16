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
  // 月次 credit:reset --now の集計 append（#S-CREDIT-WAKE-01 連動）
  'data/credit-usage-history.jsonl',
  // #S-WAKE-ORDER-01 — Part C WAKE 同期を early wake-commit に同梱
  'chat-sessions/session-starter-parts/part-C-full-paste-core.md',
  // #S-CHKPT-MINCHARS-01 — Phase 3 rollup の freeze-zone 修復 scripts が allowlist 漏れで残件化するのを防ぐ
  'scripts/cio-checkpoint-rollup.mjs',
  'scripts/lib/cio-handoff-template.mjs',
  'scripts/lib/cio-checkpoint-mandatory-read.test.mjs',
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

const LOCK_ONLY_FILES = Object.freeze(['package-lock.json', 'package.json']);
const CREDIT_ONLY_FILES = Object.freeze([
  'data/credit-usage.json',
  'data/credit-usage-history.jsonl',
]);

/**
 * HEAD の変更ファイルが allowed の部分集合か（allowlist 例外なし・厳密）
 * @param {string} root
 * @param {string} ref
 * @param {readonly string[]} allowedFiles
 */
function commitTouchesStrictSubset(root, ref, allowedFiles) {
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

/**
 * WAKE 専用: bridge.gitHead === HEAD~2 かつ、次のいずれか:
 *   (A) HEAD が lock-only / credit-only かつ HEAD~1 が WAKE handoff allowlist のみ
 *   (B) HEAD と HEAD~1 がともに WAKE handoff allowlist のみ
 *       （early-wake → checkpoint Git stamp / 二重 handoff で tip が2段進む偽陽性・2026-08-16）
 * close / strict 経路では呼ばない（--wake-context のみ）。
 * @returns {boolean}
 */
export function isWakeAdjacentGrandparentFold(root, bridgeGitHead) {
  if (!bridgeGitHead || bridgeGitHead === 'unknown') return false;
  const gp = gitAncestorHeadShort(root, 2);
  if (!gp || bridgeGitHead !== gp) return false;
  const parentIsWake = commitTouchesOnly(root, 'HEAD~1', WAKE_HANDOFF_ALLOWLIST);
  if (!parentIsWake) return false;
  const headLockOrCredit =
    commitTouchesStrictSubset(root, 'HEAD', LOCK_ONLY_FILES) ||
    commitTouchesStrictSubset(root, 'HEAD', CREDIT_ONLY_FILES);
  if (headLockOrCredit) return true;
  // (B) early-wake + checkpoint sync / 二重 wake-handoff（bootstrap 3c 偽陽性）
  return commitTouchesOnly(root, 'HEAD', WAKE_HANDOFF_ALLOWLIST);
}
