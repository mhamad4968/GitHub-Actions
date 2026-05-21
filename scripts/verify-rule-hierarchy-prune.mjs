#!/usr/bin/env node
/**
 * タスク2 — 3階層索引に未登録の「憲法系ゾンビ」文書を検出（削除は --apply で別スクリプト）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** docs/constitution/00-rule-hierarchy.md と同期する許可パス（プレフィックス or 完全一致） */
export const HIERARCHY_ALLOW_PREFIXES = [
  'AGENTS.md',
  'RULES-INDEX.md',
  'WORKFLOW.md',
  'kintone-apps.md',
  'CLAUDE.md',
  '.cursor/rules/',
  '.cursor/hooks/',
  'chat-sessions/session-starter-parts/',
  'chat-sessions/NEW-SESSION-STARTER.md',
  'chat-sessions/HANDOFF-AI-FIVE-BLOCKS.md',
  'chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md',
  'chat-sessions/SESSION-READ-LADDER.md',
  'chat-sessions/checkpoint-latest.md',
  'chat-sessions/handoff-log.md',
  'chat-sessions/desktop-ai-emergency-read-pack/',
  'docs/constitution/',
  'docs/runbooks/',
  'docs/plans/',
  'docs/archive/',
  'docs/mcp-status.md',
  'docs/mcp-design-',
  'docs/mcp-disaster-recovery.md',
  'docs/mcp-dormancy-exempt.md',
  'docs/session-report-checklist.md',
  'docs/troubleshooting.md',
  'docs/github-branch-protection.md',
  'docs/kintone-destructive-operations.md',
  'data/cio-mcp-four-ai-matrix.json',
  'scripts/lib/cio-four-ai-governance.mjs',
  'assets/images/',
];

/** 索引外だがドメイン正本として残す docs ルート（WARN のみ・--strict で NG） */
const DOCS_ROOT_DOMAIN_OK = [
  'docs/final-architecture.md',
  'docs/dev-cli-matrix.md',
  'docs/cursor-official-references.md',
  'docs/cursor-hooks-design.md',
  'docs/cursor-cli-usage.md',
  'docs/cio-permissions-guide.md',
  'docs/agent-restore-checkpoint.md',
  'docs/agent-learning-and-app-creation.md',
];

const ORPHAN_SCAN = [
  { dir: 'docs/plans', ext: '.md', skip: (r) => r.includes('/_archive/') || r.includes('/_future/') },
];

export const SUPERSEDED_PLANS = [
  {
    from: 'docs/plans/2026-05-17-constitution-restructure.md',
    to: 'docs/plans/_archive/2026-05-17-constitution-restructure.md',
    reason: 'superseded by docs/constitution/00-rule-hierarchy.md (2026-05-21)',
  },
];

function isAllowed(rel) {
  const p = rel.replace(/\\/g, '/');
  if (HIERARCHY_ALLOW_PREFIXES.some((pre) => p === pre || p.startsWith(pre))) return true;
  if (DOCS_ROOT_DOMAIN_OK.includes(p)) return true;
  return false;
}

function main() {
  const strict = process.argv.includes('--strict');
  const issues = [];

  for (const { dir, ext, skip } of ORPHAN_SCAN) {
    const absDir = path.join(root, dir);
    if (!fs.existsSync(absDir)) continue;
    const walk = (d, prefix) => {
      for (const name of fs.readdirSync(d)) {
        const abs = path.join(d, name);
        const rel = `${prefix}/${name}`.replace(/\\/g, '/');
        if (fs.statSync(abs).isDirectory()) {
          walk(abs, rel);
          continue;
        }
        if (!name.endsWith(ext.replace(/^\./, '')) && !name.endsWith(ext)) continue;
        if (skip && skip(rel)) continue;
        if (name === 'INDEX.md') continue;
        if (!isAllowed(rel)) {
          issues.push({ rel, kind: 'not_on_hierarchy_map' });
        }
      }
    };
    walk(absDir, dir);
  }

  for (const s of SUPERSEDED_PLANS) {
    const fromAbs = path.join(root, s.from);
    const toAbs = path.join(root, s.to);
    if (fs.existsSync(fromAbs) && !fs.existsSync(toAbs)) {
      issues.push({ rel: s.from, kind: 'superseded_still_active', hint: s.reason });
    }
  }

  if (fs.existsSync(path.join(root, '.cursorrules'))) {
    const t = fs.readFileSync(path.join(root, '.cursorrules'), 'utf8');
    if (/コード=Kimi|コード.*Kimi.*委譲/.test(t) && !/Composer\s*2\.5/.test(t)) {
      issues.push({ rel: '.cursorrules', kind: 'mode_b_zombie', hint: '実務コード=Composer 2.5 に更新要' });
    }
    if (!/00-rule-hierarchy\.md|mode-b-canonical/.test(t)) {
      issues.push({ rel: '.cursorrules', kind: 'legacy_root_rules', hint: '第1正本は AGENTS.md + 00-rule-hierarchy へ誘導' });
    }
  }

  const hard = issues.filter((i) => i.kind !== 'legacy_root_rules' || strict);

  if (hard.length === 0) {
    console.log('[verify-rule-hierarchy-prune] OK');
    if (issues.length) {
      console.warn('[verify-rule-hierarchy-prune] WARN (non-blocking):', issues.length);
      for (const i of issues) console.warn(`  - ${i.rel} [${i.kind}] ${i.hint || ''}`);
    }
    process.exit(0);
  }

  console.error('[verify-rule-hierarchy-prune] NG', hard.length);
  for (const i of hard) console.error(`  - ${i.rel} [${i.kind}] ${i.hint || ''}`);
  console.error('  退避: npm run cio:archive:rule-orphans');
  process.exit(1);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) main();
