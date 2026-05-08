#!/usr/bin/env node
/**
 * cio-report-format-check.mjs — §1 先頭4行（ティア→【適用憲法】→🎖️→ルール確認）の機械検証（論点9・CEO B スコープ）
 *
 * 対象:
 *   - `--staged`: `git diff --cached` のうち `chat-sessions/**` の .md/.txt で、**先頭が §1 ティア行で始まる**
 *     コンテンツのみ厳格検査（handoff / SESSION-CLOSE 等は先頭が違うためスキップ）。
 *   - `--file <path>` / `--stdin`: PR 説明やチャット貼付の一時ファイル用。先頭がティア行なら同じ検査。
 *
 * 任意1行: `[§1-2-3 ティア判定]` の直後に `every-turn-rules-confirm.mdc` に準じた `[実行経路: MCP …]` を許容。
 *
 * 終了コード: 0 = OK（検査0件も含む）/ 1 = 違反
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TIER = /\[§1-2-3\s*ティア判定/;
const CONSTITUTION = /【\s*適用憲法\s*】/;
const MEDAL = /\[🎖️\s*本セッション割当\]|🎖️.*本セッション割当/;
const RULES = /\[\s*ルール確認\s*\]/;
const MCP_EXEC = /\[実行経路[：:]\s*MCP/;

const EXCLUDE_PREFIXES = [
  'chat-sessions/desktop-ai-emergency-read-pack/',
  'chat-sessions/session-starter-parts/',
];

function usage() {
  console.error(`Usage:
  node scripts/cio-report-format-check.mjs --staged
  node scripts/cio-report-format-check.mjs --file path/to/body.md
  node scripts/cio-report-format-check.mjs --stdin   < body.md
`);
}

function stripYamlFrontMatter(text) {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) return text;
  const rest = text.slice(4);
  const end = rest.search(/\n---\s*\n/);
  if (end === -1) return text;
  return rest.slice(end + '\n---\n'.length);
}

/** @returns {string[]} */
function nonBlankLines(text) {
  const body = stripYamlFrontMatter(text.replace(/^\uFEFF/, ''));
  const out = [];
  for (const line of body.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    out.push(line);
  }
  return out;
}

function startsWithTierReport(text) {
  const nb = nonBlankLines(text);
  if (nb.length === 0) return false;
  return TIER.test(nb[0]);
}

/**
 * @param {string[]} nb non-blank lines
 * @returns {{ ok: boolean, detail: string }}
 */
function validateFourBlock(nb) {
  if (nb.length === 0) return { ok: true, detail: 'empty' };
  if (!TIER.test(nb[0])) return { ok: true, detail: 'skip-not-tier-first' };

  let i = 1;
  if (nb[i] && MCP_EXEC.test(nb[i])) i++;

  if (!nb[i] || !CONSTITUTION.test(nb[i])) {
    return {
      ok: false,
      detail: `line2: need 【適用憲法】 after tier (optional MCP line). Got: ${JSON.stringify(nb[i] ?? '(eof)')}`,
    };
  }
  i++;
  if (!nb[i] || !MEDAL.test(nb[i])) {
    return {
      ok: false,
      detail: `line3: need [🎖️ 本セッション割当] (🎖️ + 本セッション割当). Got: ${JSON.stringify(nb[i] ?? '(eof)')}`,
    };
  }
  i++;
  if (!nb[i] || !RULES.test(nb[i])) {
    return {
      ok: false,
      detail: `line4: need [ルール確認]. Got: ${JSON.stringify(nb[i] ?? '(eof)')}`,
    };
  }
  return { ok: true, detail: 'ok' };
}

function checkText(text, label) {
  const nb = nonBlankLines(text);
  if (!startsWithTierReport(text)) return { ok: true, skipped: true, label };
  const v = validateFourBlock(nb);
  if (!v.ok) return { ok: false, skipped: false, label, detail: v.detail };
  return { ok: true, skipped: false, label };
}

function gitStagedPaths() {
  const out = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function gitShowStaged(rel) {
  return execFileSync('git', ['show', `:${rel}`], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function inChatSessionsScope(rel) {
  const norm = rel.replace(/\\/g, '/');
  if (!norm.startsWith('chat-sessions/')) return false;
  if (!/\.(md|txt)$/i.test(norm)) return false;
  return !EXCLUDE_PREFIXES.some((p) => norm.startsWith(p));
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.length === 0) {
    usage();
    process.exit(argv.includes('--help') ? 0 : 1);
  }

  const results = [];

  if (argv.includes('--stdin')) {
    const text = fs.readFileSync(0, 'utf8');
    results.push(checkText(text, '(stdin)'));
  }

  const fi = argv.indexOf('--file');
  if (fi !== -1 && argv[fi + 1]) {
    const abs = path.isAbsolute(argv[fi + 1]) ? argv[fi + 1] : path.join(root, argv[fi + 1]);
    const text = fs.readFileSync(abs, 'utf8');
    results.push(checkText(text, path.relative(root, abs)));
  }

  if (argv.includes('--staged')) {
    let staged;
    try {
      staged = gitStagedPaths();
    } catch (e) {
      console.error('[cio-report-format-check] git diff --cached failed:', e.message);
      process.exit(1);
    }
    for (const rel of staged) {
      if (!inChatSessionsScope(rel)) continue;
      let text;
      try {
        text = gitShowStaged(rel);
      } catch {
        console.error(`[cio-report-format-check] skip (not in index?): ${rel}`);
        continue;
      }
      results.push(checkText(text, rel));
    }
  }

  if (results.length === 0) {
    if (argv.includes('--staged')) {
      console.log('[cio-report-format-check] staged: no chat-sessions .md/.txt in index (or none in scope)');
      process.exit(0);
    }
    console.error('[cio-report-format-check] no inputs (--staged / --file / --stdin)');
    usage();
    process.exit(1);
  }

  const failed = results.filter((r) => !r.ok);
  const checked = results.filter((r) => !r.skipped);
  for (const r of results) {
    if (r.skipped) {
      if (argv.includes('--verbose')) console.log(`[cio-report-format-check] SKIP ${r.label}`);
    } else if (r.ok) {
      console.log(`[cio-report-format-check] OK ${r.label}`);
    }
  }
  for (const r of failed) {
    console.error(`[cio-report-format-check] NG ${r.label}: ${r.detail}`);
  }

  if (failed.length) process.exit(1);
  if (checked.length === 0 && !argv.includes('--stdin') && argv.includes('--staged')) {
    console.log('[cio-report-format-check] no tier-first files in staged chat-sessions scope (0 checks)');
  }
  process.exit(0);
}

main();
