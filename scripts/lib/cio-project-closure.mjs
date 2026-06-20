/**
 * プロジェクト v1 クローズ登録 — 朝 ready / レーン / checkpoint 検証
 */
import fs from 'node:fs';
import path from 'node:path';

export const CLOSURES_REL = 'data/cio-project-closures.json';

export function loadProjectClosures(root) {
  const p = path.join(root, CLOSURES_REL);
  if (!fs.existsSync(p)) return { version: '', holds: [], closures: [] };
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { ...data, holds: data.holds || [], closures: data.closures || [] };
  } catch {
    return { version: '', holds: [], closures: [] };
  }
}

export function loadHolds(root) {
  return loadProjectClosures(root).holds || [];
}

/** @param {string} rel POSIX-style repo-relative path */
export function matchHoldLaneFile(hold, rel) {
  const norm = String(rel || '').replace(/\\/g, '/');
  if (!norm || !hold) return false;

  const spec = hold.spec ? String(hold.spec).replace(/\\/g, '/') : '';
  if (spec && (norm === spec || norm.startsWith(`${spec}/`))) return true;

  if (hold.id === 'yojitsu-budget' && norm.startsWith('templates/yojitsu-budget-lite/')) {
    return true;
  }

  for (const p of hold.forbiddenNextTaskPatterns || []) {
    if (/^\d{3}$/.test(p) && norm.includes(`customize/${p}/`)) return true;
    if (/^deploy:\d{3}$/.test(p)) continue;
    if ((p === 'yojitsu' || p === '予実' || p === '部署予実') && norm.startsWith('templates/yojitsu-budget-lite/')) {
      return true;
    }
    if (/skysea/i.test(p) && (/skysea/i.test(norm) || norm.startsWith('data/skysea/'))) return true;
    if ((p === '688' || p === '施工主報告' || p === '稼働日数ダッシュ') &&
      (norm.includes('customize/688/') || /construction-workdays|688/.test(norm))) {
      return true;
    }
  }
  return false;
}

/** @param {string} root @param {string[]} relativePaths */
export function checkHoldLaneDirtyFiles(root, relativePaths) {
  const holds = loadHolds(root);
  const issues = [];
  for (const rel of relativePaths) {
    for (const hold of holds) {
      if (hold.status !== 'on-hold') continue;
      if (matchHoldLaneFile(hold, rel)) {
        issues.push({
          code: 'HOLD_LANE_DIRTY',
          holdId: hold.id,
          label: hold.label,
          path: rel,
          fix: `保留レーン — git restore "${rel}" または意図的なら CIO_ALLOW_HOLD_LANE_DIRTY=1`,
        });
      }
    }
  }
  return { ok: issues.length === 0, issues };
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
