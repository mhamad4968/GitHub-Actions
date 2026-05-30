/**
 * 改善案2 — 死に文・未索引ドキュメント洗い出しと安全退避（Kimi 精査職分）
 */
import fs from 'node:fs';
import path from 'node:path';

export const ARCHIVE_REL = 'docs/archive/dead-lines';
export const PROTECTED_PREFIXES = [
  'docs/constitution/',
  'docs/runbooks/',
  'docs/handoff/',
  'docs/issues/',
  'docs/archive/dead-lines/',
  'docs/plans/2026-05-',
  'docs/ops-guide/',
  'docs/kintone-destructive-operations.md',
];

const DEAD_NAME_PATTERNS = [
  /SUPERSEDED/i,
  /-draft-/i,
  /-tmp-/i,
  /\.bak\./i,
  /OLD-/i,
  /deprecated/i,
  /zombie/i,
];

export function loadIndexCorpus(root) {
  const parts = [];
  const files = [
    'RULES-INDEX.md',
    'AGENTS.md',
    'data/rules-index-section-mdc-map.json',
    'data/cursor-rules-topic-index.json',
    'docs/constitution/00-rule-hierarchy.md',
  ];
  for (const rel of files) {
    const p = path.join(root, rel);
    if (fs.existsSync(p)) parts.push(fs.readFileSync(p, 'utf8'));
  }
  return parts.join('\n');
}

export function isProtected(relPosix) {
  return PROTECTED_PREFIXES.some((p) => relPosix.startsWith(p));
}

export function isIndexed(relPosix, corpus) {
  const norm = relPosix.replace(/\\/g, '/');
  if (corpus.includes(norm)) return true;
  const base = path.basename(norm);
  if (corpus.includes(base)) return true;
  return false;
}

export function listDocCandidates(root) {
  const docsDir = path.join(root, 'docs');
  const out = [];
  if (!fs.existsSync(docsDir)) return out;

  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const rel = path.relative(root, p).replace(/\\/g, '/');
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        if (rel.startsWith('docs/archive/dead-lines')) continue;
        walk(p);
      } else if (/\.(md|txt)$/i.test(name)) {
        out.push(rel);
      }
    }
  }
  walk(docsDir);
  return out;
}

export function scoreDeadLine(rel, corpus) {
  if (isProtected(rel)) return null;
  if (isIndexed(rel, corpus)) return null;
  const name = path.basename(rel);
  const matched = DEAD_NAME_PATTERNS.some((re) => re.test(name) || re.test(rel));
  if (!matched && !rel.includes('/reports/archive/')) return null;
  return { rel, reason: matched ? 'dead-name-pattern' : 'unindexed-archive' };
}

export function scanDeadLines(root) {
  const corpus = loadIndexCorpus(root);
  const candidates = listDocCandidates(root);
  return candidates.map((rel) => scoreDeadLine(rel, corpus)).filter(Boolean);
}

export function purgeDeadLines(root, { apply = false } = {}) {
  const hits = scanDeadLines(root);
  const moved = [];
  const archiveRoot = path.join(root, ARCHIVE_REL);
  if (apply) fs.mkdirSync(archiveRoot, { recursive: true });

  for (const hit of hits) {
    const src = path.join(root, hit.rel);
    const destRel = path.join(ARCHIVE_REL, hit.rel.replace(/^docs\//, '')).replace(/\\/g, '/');
    const dest = path.join(root, destRel);
    if (apply) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.renameSync(src, dest);
      moved.push({ from: hit.rel, to: destRel, reason: hit.reason });
    } else {
      moved.push({ from: hit.rel, to: destRel, reason: hit.reason, dryRun: true });
    }
  }
  return moved;
}
