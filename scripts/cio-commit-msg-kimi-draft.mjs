#!/usr/bin/env node
/**
 * Kimi 職分 — コミットメッセージ 4要素ガバナンスブロック生成（第11層・タスク②）
 * prepare-commit-msg / npm run cio:commit-msg:kimi-draft
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const GOVERNANCE_PATHS = [
  /^AGENTS\.md$/i,
  /^RULES-INDEX\.md$/i,
  /^docs\/constitution\//i,
  /^\.cursor\/rules\//i,
  /^templates\/yojitsu-budget-lite\/SPEC\.md$/i,
  /^docs\/plans\/.*spec\.md$/i,
  /^chat-sessions\/CEO-MINIMUM-ABSOLUTE-BASELINE\.txt$/i,
];

const BLOCK_BEGIN = '--- CIO-GOVERNANCE-BLOCK (kimi-auto) ---';
const BLOCK_END = '--- end CIO-GOVERNANCE-BLOCK ---';

function gitStagedPaths() {
  try {
    const out = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return out
      .split(/\r?\n/)
      .map((s) => s.trim().replace(/\\/g, '/'))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function gitStagedDiff(maxChars = 12000) {
  try {
    const out = execFileSync('git', ['diff', '--cached', '--no-color'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return out.slice(0, maxChars);
  } catch {
    return '';
  }
}

export function isWeekendJst() {
  if (process.env.CIO_WEEKEND_COMMIT_BYPASS === '1') return true;
  const now = new Date();
  const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const day = jst.getDay();
  return day === 0 || day === 6;
}

export function touchesGovernance(paths) {
  return paths.filter((p) => GOVERNANCE_PATHS.some((re) => re.test(p)));
}

export function extractConstitutionRefs(diff, paths) {
  const refs = new Set();
  for (const m of diff.matchAll(/§[0-9]+(?:-[0-9]+(?:-[0-9]+)?(?:-[a-z])?)?/gi)) refs.add(m[0]);
  for (const p of paths) {
    if (/AGENTS\.md/i.test(p)) refs.add('AGENTS.md');
    if (/mode-b-canonical/i.test(p)) refs.add('mode-b-canonical.mdc');
    if (/constitution/i.test(p)) refs.add('docs/constitution');
  }
  return [...refs].slice(0, 12);
}

export function buildFourElementBlock({ paths, diff, weekend }) {
  const refs = extractConstitutionRefs(diff, paths);
  const pathsLine = paths.slice(0, 8).join(', ') + (paths.length > 8 ? '…' : '');
  const refsLine = refs.length ? refs.join(', ') : '（憲法条文参照なし — メタ整備）';

  const premise = `ステージ: ${pathsLine}`;
  const procedure = `verify: npm run verify:cio-four-ai-governance / 触れた条文: ${refsLine}`;
  const forbid = '§35-1 / §56-1a / §41 / §51 / §1-2-2 / §52 非置換（§50-3-11 上書き拡張のみ）';
  const exitRule = 'npm run verify:cio-mcp-registry && verify:cio-weekend-layer11-infra exit 0';

  let block = [
    BLOCK_BEGIN,
    `前提: ${premise}`,
    `手順: ${procedure}`,
    `禁止: ${forbid}`,
    `exit: ${exitRule}`,
    'Reviewed-by: kimi',
  ];
  if (weekend) block.push('[weekend-bypass]');
  block.push(BLOCK_END);
  return block.join('\n');
}

export function validateBlock(block) {
  const required = ['前提:', '手順:', '禁止:', 'exit:', 'Reviewed-by: kimi'];
  const missing = required.filter((r) => !block.includes(r));
  return { ok: missing.length === 0, missing };
}

export function stripExistingBlock(text) {
  const re = new RegExp(
    `\\n?${BLOCK_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`,
    'g'
  );
  return text.replace(re, '\n').trimEnd();
}

export function applyToCommitMessage(msgPath, options = {}) {
  const staged = gitStagedPaths();
  const govPaths = touchesGovernance(staged);
  if (!govPaths.length) return { skipped: true, reason: 'governance paths なし' };

  const weekend = isWeekendJst();
  if (weekend && !options.forceGovernance) {
    return { skipped: true, reason: 'weekend bypass', weekend: true };
  }

  const diff = gitStagedDiff();
  const block = buildFourElementBlock({ paths: govPaths, diff, weekend: false });
  const valid = validateBlock(block);
  if (!valid.ok) {
    return { ok: false, error: `4要素欠落: ${valid.missing.join(', ')}` };
  }

  let text = fs.existsSync(msgPath) ? fs.readFileSync(msgPath, 'utf8') : '';
  text = stripExistingBlock(text);
  if (text.includes('Reviewed-by: kimi') && text.includes(BLOCK_BEGIN)) {
    return { ok: true, reason: 'already has block' };
  }
  const updated = `${text.trimEnd()}\n\n${block}\n`;
  fs.writeFileSync(msgPath, updated, 'utf8');
  return { ok: true, paths: govPaths, blockLines: block.split('\n').length };
}

function main() {
  const msgPath = process.argv[2];
  const checkOnly = process.argv.includes('--check');
  const force = process.argv.includes('--force');

  if (!msgPath) {
    console.error('[cio-commit-msg-kimi-draft] usage: node scripts/cio-commit-msg-kimi-draft.mjs <commit-msg-file>');
    process.exit(1);
  }

  const result = applyToCommitMessage(msgPath, { forceGovernance: force });
  if (result.skipped) {
    console.log('[cio-commit-msg-kimi-draft] skip:', result.reason);
    process.exit(0);
  }
  if (!result.ok) {
    console.error('[cio-commit-msg-kimi-draft] NG', result.error);
    process.exit(1);
  }
  if (checkOnly) {
    console.log('[cio-commit-msg-kimi-draft] OK check-only');
    process.exit(0);
  }
  console.log('[cio-commit-msg-kimi-draft] OK appended', result.paths?.length, 'paths');
  process.exit(0);
}

if (process.argv[1] && process.argv[1].includes('cio-commit-msg-kimi-draft')) {
  main();
}
