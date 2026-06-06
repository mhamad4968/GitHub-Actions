/**
 * bridge と checkpoint の鮮度チェック
 */
import fs from 'node:fs';
import path from 'node:path';

const CHECKPOINT_REL = 'chat-sessions/checkpoint-latest.md';

export function readCheckpointNextTask(root) {
  const p = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(p)) return null;
  const head = fs.readFileSync(p, 'utf8').slice(0, 2500);
  const m =
    head.match(/\*\*次回 1 手\*\*\s*[:：]\s*([^\n]+)/i) ||
    head.match(/\*\*次回 1 手\*\*\s*\|\s*([^|\n]+)/i) ||
    head.match(/次回\s*1\s*手[^:\n]*[:：]\s*([^\n]+)/i);
  return m ? (m[1] || m[0]).trim().slice(0, 200) : null;
}

/** checkpoint 先頭セクションの最新日付（## YYYY-MM-DD） */
export function readCheckpointLatestSectionDate(root) {
  const p = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(p)) return null;
  const head = fs.readFileSync(p, 'utf8').slice(0, 4000);
  const m = head.match(/^## (\d{4}-\d{2}-\d{2})/m);
  if (!m) return null;
  return m[1];
}

export function bridgeAgeMs(bridge) {
  if (!bridge?.exportedAt) return Infinity;
  const t = Date.parse(bridge.exportedAt);
  return Number.isNaN(t) ? Infinity : Date.now() - t;
}

/**
 * @param {object} opts
 * @param {number} [opts.maxAgeHours=48] bridge の最大許容年齢
 * @param {number} [opts.maxSectionLagDays=2] checkpoint セクション日付との許容差（日）
 */
export function checkBridgeStaleness(root, bridge, opts = {}) {
  const maxAgeHours = opts.maxAgeHours ?? 48;
  const maxSectionLagDays = opts.maxSectionLagDays ?? 2;
  const issues = [];

  const ageMs = bridgeAgeMs(bridge);
  if (ageMs > maxAgeHours * 3600 * 1000) {
    issues.push({
      code: 'BRIDGE_TOO_OLD',
      message: `bridge.exportedAt が ${maxAgeHours}h 超（${Math.round(ageMs / 3600000)}h）`,
      fix: 'npm run cio:session:export-handoff',
    });
  }

  const sectionDate = readCheckpointLatestSectionDate(root);
  if (sectionDate && bridge.exportedAt) {
    const exportedDay = bridge.exportedAt.slice(0, 10);
    const sectionMs = Date.parse(`${sectionDate}T12:00:00Z`);
    const exportedMs = Date.parse(`${exportedDay}T12:00:00Z`);
    if (!Number.isNaN(sectionMs) && !Number.isNaN(exportedMs)) {
      const lagDays = (sectionMs - exportedMs) / 86400000;
      if (lagDays > maxSectionLagDays) {
        issues.push({
          code: 'BRIDGE_BEHIND_CHECKPOINT',
          message: `checkpoint 最新セクション(${sectionDate})が bridge(${exportedDay})より ${Math.round(lagDays)}日新しい`,
          fix: 'npm run cio:session:export-handoff',
        });
      }
    }
  }

  const cpTask = readCheckpointNextTask(root);
  if (cpTask && bridge.nextTask && cpTask !== bridge.nextTask) {
    const norm = (s) =>
      String(s)
        .replace(/\*\*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (norm(cpTask) !== norm(bridge.nextTask)) {
      issues.push({
        code: 'TASK_DRIFT',
        message: 'bridge.nextTask と checkpoint 次回1手が不一致',
        bridge: bridge.nextTask,
        checkpoint: cpTask,
        fix: 'npm run cio:session:export-handoff',
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
