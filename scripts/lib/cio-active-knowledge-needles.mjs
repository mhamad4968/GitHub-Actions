/**
 * アクティブ・ナレッジ針（sessionStart / cold-start 注入）
 * @see data/cio-active-knowledge-needles.json
 */
import fs from 'node:fs';
import path from 'node:path';

const REG_REL = 'data/cio-active-knowledge-needles.json';

/**
 * @param {string} repoRoot
 * @returns {{ version: number, maxWakeInject: number, needles: object[] }}
 */
export function loadActiveKnowledgeNeedles(repoRoot) {
  const abs = path.join(repoRoot, REG_REL);
  if (!fs.existsSync(abs)) {
    throw new Error(`${REG_REL} missing`);
  }
  const j = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (!j || !Array.isArray(j.needles)) {
    throw new Error(`${REG_REL} invalid: needles[] required`);
  }
  return {
    version: Number(j.version) || 1,
    maxWakeInject: Math.min(10, Math.max(1, Number(j.maxWakeInject) || 5)),
    needles: j.needles,
    registryRel: REG_REL,
  };
}

/**
 * @param {object[]} needles
 * @param {number} maxN
 */
export function selectActiveNeedles(needles, maxN = 5) {
  return needles
    .filter((n) => n && n.active !== false && n.id)
    .slice()
    .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0))
    .slice(0, maxN);
}

/**
 * @param {string} repoRoot
 * @param {string[]} relPaths
 */
export function auditGitPaths(repoRoot, relPaths) {
  const out = [];
  for (const rel of relPaths || []) {
    const abs = path.join(repoRoot, rel);
    out.push({ rel, exists: fs.existsSync(abs) });
  }
  return out;
}

/**
 * @param {string} repoRoot
 */
export function auditActiveNeedles(repoRoot) {
  const reg = loadActiveKnowledgeNeedles(repoRoot);
  const active = selectActiveNeedles(reg.needles, reg.maxWakeInject);
  const issues = [];
  for (const n of active) {
    if (!n.wakeHint || !String(n.wakeHint).trim()) {
      issues.push(`${n.id}: wakeHint empty`);
    }
    if (!Array.isArray(n.gitPaths) || !n.gitPaths.length) {
      issues.push(`${n.id}: gitPaths required (MCP単独禁止)`);
    }
    for (const { rel, exists } of auditGitPaths(repoRoot, n.gitPaths || [])) {
      if (!exists) issues.push(`${n.id}: missing gitPath ${rel}`);
    }
  }
  return { reg, active, issues };
}
