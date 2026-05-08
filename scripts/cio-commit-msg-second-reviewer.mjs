#!/usr/bin/env node
/**
 * commit-msg 用 — 論点11: SPEC 触手相当のコミットでは message に
 * `Reviewed-by: deepseek|kimi|openrouter` trailer を必須化する。
 *
 * トリガー（いずれか）:
 *   1) コミット本文に `SPEC_TOUCHED: yes` 行がある（チェックシート V2 からのコピー想定）
 *   2) ステージに正本 SPEC 系パスが含まれる（下記リスト）
 *
 * スキップ: Merge commit（先頭行が Merge branch / Merge pull request）
 *
 * バイパス: git commit --no-verify（浜田承認下のみ）
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const msgPath = process.argv[2];

const SPEC_TOUCHED_LINE = /^\s*SPEC_TOUCHED:\s*yes\s*$/im;
const REVIEWED_BY = /Reviewed-by:\s*(deepseek|kimi|openrouter)\b/i;

/** ステージに載ったら第2者 trailer を要する正本 SPEC（必要に応じて拡張） */
const SPEC_CANONICAL_PATHS = new Set([
  'templates/yojitsu-budget-lite/SPEC.md',
  'docs/plans/2026-04-21-new-pc-ledger-spec.md',
]);

function gitStagedPaths() {
  try {
    const out = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function stagedTouchesSpec(paths) {
  for (const p of paths) {
    const n = p.replace(/\\/g, '/');
    if (SPEC_CANONICAL_PATHS.has(n)) return true;
  }
  return false;
}

function main() {
  if (!msgPath || !fs.existsSync(msgPath)) {
    process.exit(0);
  }
  const text = fs.readFileSync(msgPath, 'utf8');
  const firstLine = text.split(/\r?\n/)[0] ?? '';
  if (/^Merge branch /.test(firstLine) || /^Merge pull request /.test(firstLine)) {
    process.exit(0);
  }

  const specLine = SPEC_TOUCHED_LINE.test(text);
  const staged = gitStagedPaths();
  const specStaged = stagedTouchesSpec(staged);

  if (!specLine && !specStaged) {
    process.exit(0);
  }

  if (REVIEWED_BY.test(text)) {
    process.exit(0);
  }

  console.error('');
  console.error('[commit-msg] 論点11: 第2者 trailer 必須');
  console.error('  理由: SPEC_TOUCHED: yes 行がある、または次の正本 SPEC がステージに含まれる:');
  console.error(`    ${[...SPEC_CANONICAL_PATHS].join(', ')}`);
  console.error('  コミットメッセージの末尾に次のいずれか 1 行を追加してください:');
  console.error('    Reviewed-by: deepseek');
  console.error('    Reviewed-by: kimi');
  console.error('    Reviewed-by: openrouter');
  console.error('  バイパス: git commit --no-verify（浜田承認下のみ）');
  console.error('');
  process.exit(1);
}

main();
