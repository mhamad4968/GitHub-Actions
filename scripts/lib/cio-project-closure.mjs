/**
 * プロジェクト v1 クローズ登録 — 朝 ready / レーン / checkpoint 検証
 */
import fs from 'node:fs';
import path from 'node:path';

export const CLOSURES_REL = 'data/cio-project-closures.json';

export function loadProjectClosures(root) {
  const p = path.join(root, CLOSURES_REL);
  if (!fs.existsSync(p)) return { version: '', closures: [] };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { version: '', closures: [] };
  }
}

export function findClosure(root, laneOrProjectId) {
  const key = String(laneOrProjectId || '').trim();
  if (!key) return null;
  const { closures } = loadProjectClosures(root);
  return closures.find((c) => c.id === key || c.laneId === key) || null;
}

export function isProjectClosed(root, laneOrProjectId) {
  return Boolean(findClosure(root, laneOrProjectId));
}

/** クローズ済みプロジェクトを「次の1手」に載せていないか */
export function checkClosedProjectNextTask(root, nextTaskText) {
  const text = String(nextTaskText || '');
  if (!text) return { ok: true, issues: [] };
  const issues = [];
  const { closures } = loadProjectClosures(root);
  for (const c of closures) {
    const patterns = c.forbiddenNextTaskPatterns || [];
    const hit = patterns.some((p) => p && text.includes(p));
    const mentionsClose =
      /クローズ|完成|v1\s*完成|closed/i.test(text) ||
      (c.completionReport && text.includes(path.basename(c.completionReport, '.md')));
    if (hit && !mentionsClose) {
      issues.push({
        code: 'CLOSED_PROJECT_ACTIVE_NEXT_TASK',
        project: c.id,
        label: c.label,
        closedAt: c.closedAt,
        nextTask: text.slice(0, 120),
        completionReport: c.completionReport,
        fix: `checkpoint 次の1手を更新し ${c.completionReport} を参照。npm run cio:project:close -- --show`,
      });
    }
  }
  return { ok: issues.length === 0, issues };
}

export function formatClosureBanner(root, laneOrProjectId) {
  const c = findClosure(root, laneOrProjectId);
  if (!c) return null;
  return [
    `[cio:project-closure] ${c.label} — ${c.status} (${c.closedAt})`,
    `  正本: ${c.completionReport}`,
    `  ${c.note || ''}`.trim(),
  ].join('\n');
}
