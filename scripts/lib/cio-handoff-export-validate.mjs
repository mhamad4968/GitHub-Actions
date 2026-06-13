/**
 * 15ターン export-handoff 荷造り漏れクロスチェック（第11層・タスク③ / DeepSeek 職分）
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bridgeSchemaOk, loadBridge } from './cio-session-bridge.mjs';
import { readCheckpointNextTask } from './cio-checkpoint-read.mjs';
import { checkClosedProjectNextTask } from './cio-project-closure.mjs';

const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const CHECKPOINT_REL = 'chat-sessions/checkpoint-latest.md';
const SCORES_REL = 'docs/handoff/spec-task-scores.json';
const SPEC_REL = 'templates/yojitsu-budget-lite/SPEC.md';

export function normalizeTaskText(s) {
  return String(s || '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export { readCheckpointNextTask };

export function readSpecUnchecked(root) {
  const p = path.join(root, SPEC_REL);
  if (!fs.existsSync(p)) return [];
  const text = fs.readFileSync(p, 'utf8');
  const items = [];
  for (const m of text.matchAll(/^- \[ \]\s*(.+)$/gm)) items.push(m[1].trim());
  return items;
}

export function readTopScoredTask(root) {
  const p = path.join(root, SCORES_REL);
  if (!fs.existsSync(p)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const tasks = data.tasks || data.ranked || [];
    if (!tasks.length) return null;
    const sorted = [...tasks].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return sorted[0]?.text || null;
  } catch {
    return null;
  }
}

export function tokenOverlap(a, b) {
  const ta = new Set(normalizeTaskText(a).split(/[^a-z0-9\u3040-\u9fff]+/).filter((t) => t.length >= 2));
  const tb = new Set(normalizeTaskText(b).split(/[^a-z0-9\u3040-\u9fff]+/).filter((t) => t.length >= 2));
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit++;
  return hit / Math.max(ta.size, tb.size);
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

/** DeepSeek 職分 — 決定論セマンティック監査（API 可用時は強化可能） */
export function deepseekSemanticAudit(payload) {
  const { bridgeTask, checkpointTask, topScoreTask } = payload;
  const issues = [];
  const n1 = normalizeTaskText(bridgeTask);
  const n2 = normalizeTaskText(checkpointTask);
  if (checkpointTask && bridgeTask && n1 !== n2) {
    const overlap = tokenOverlap(bridgeTask, checkpointTask);
    if (overlap < 0.35 && !n1.includes(n2.slice(0, 12)) && !n2.includes(n1.slice(0, 12))) {
      issues.push({
        code: 'TASK_MISMATCH',
        message: `bridge.nextTask と checkpoint 次回1手が不一致（overlap=${overlap.toFixed(2)}）`,
        bridge: bridgeTask,
        checkpoint: checkpointTask,
      });
    }
  }
  if (topScoreTask && bridgeTask) {
    const unsettled =
      /未確定|項番\s*-0|クローズ済|v1\s*クローズ/i.test(bridgeTask) ||
      /未確定|クローズ/i.test(checkpointTask || '');
    if (!unsettled) {
      const overlap = tokenOverlap(bridgeTask, topScoreTask);
      if (overlap < 0.25) {
        issues.push({
          code: 'SCORE_RANK_MISMATCH',
          message: `spec-task-scores Rank1 と bridge.nextTask の意味乖離（overlap=${overlap.toFixed(2)}）`,
          bridge: bridgeTask,
          rank1: topScoreTask,
        });
      }
    }
  }
  return { ok: issues.length === 0, issues, auditor: 'deepseek-deterministic' };
}

export function validateExportHandoff(root, options = {}) {
  const issues = [];
  const bridge = loadBridge(root);

  if (!bridge) {
    issues.push({ code: 'NO_BRIDGE', message: 'latest-session-bridge.json 無し — export-handoff 未実行' });
    return { ok: false, issues };
  }
  if (!bridgeSchemaOk(bridge)) {
    issues.push({ code: 'SCHEMA', message: 'bridge JSON schema 不正' });
    return { ok: false, issues };
  }

  const checkpointTask = readCheckpointNextTask(root);
  const bridgeTask = bridge.nextTask;
  if (checkpointTask && bridgeTask) {
    const nb = normalizeTaskText(bridgeTask);
    const nc = normalizeTaskText(checkpointTask);
    if (nb !== nc && tokenOverlap(bridgeTask, checkpointTask) < 0.35) {
      issues.push({
        code: 'CHECKPOINT_DRIFT',
        message: 'checkpoint 次回1手 ≠ bridge.nextTask',
        bridge: bridgeTask,
        checkpoint: checkpointTask,
      });
    }
  } else if (!checkpointTask) {
    issues.push({ code: 'CHECKPOINT_MISSING', message: 'checkpoint-latest に次回1手が無い' });
  }

  const closureCheck = checkClosedProjectNextTask(root, checkpointTask || bridgeTask);
  if (!closureCheck.ok) {
    for (const c of closureCheck.issues) {
      issues.push({ code: c.code, message: c.message || `${c.label} が次の1手に残存`, ...c });
    }
  }

  const currentHead = gitHeadShort(root);
  if (currentHead && bridge.gitHead && bridge.gitHead !== 'unknown' && currentHead !== bridge.gitHead) {
    if (!options.allowHeadDrift) {
      issues.push({
        code: 'GIT_HEAD_DRIFT',
        message: `gitHead 不一致: bridge=${bridge.gitHead} current=${currentHead}`,
      });
    }
  }

  for (const rel of bridge.nextFiles || []) {
    if (!fs.existsSync(path.join(root, rel))) {
      issues.push({ code: 'MISSING_FILE', message: `nextFiles 欠落: ${rel}` });
    }
  }

  const unchecked = readSpecUnchecked(root);
  const semantic = deepseekSemanticAudit({
    bridgeTask,
    checkpointTask,
    topScoreTask: readTopScoredTask(root),
    uncheckedCount: unchecked.length,
  });
  for (const si of semantic.issues) issues.push(si);

  if (bridge.exportedAt && bridge.validatedAt) {
    const exp = Date.parse(bridge.exportedAt);
    const val = Date.parse(bridge.validatedAt);
    if (Number.isFinite(exp) && Number.isFinite(val) && Math.abs(val - exp) > 5000) {
      issues.push({ code: 'TIMESTAMP_DRIFT', message: 'export/validate タイムスタンプ差 >5s' });
    }
  }

  return { ok: issues.length === 0, issues, bridge, checkpointTask, semantic };
}

export function printHandoffIssues(issues) {
  for (const i of issues) {
    console.error(`${RED}[handoff-export-validate] ${i.message}${RESET}`);
    if (i.bridge) console.error(`  bridge: ${i.bridge}`);
    if (i.checkpoint) console.error(`  checkpoint: ${i.checkpoint}`);
  }
}

export function stampBridgeValidated(root) {
  const bridge = loadBridge(root);
  if (!bridge) return false;
  bridge.validatedAt = new Date().toISOString();
  bridge.crosscheckOk = true;
  fs.writeFileSync(
    path.join(root, 'docs/handoff/latest-session-bridge.json'),
    JSON.stringify(bridge, null, 2) + '\n',
    'utf8'
  );
  return true;
}
