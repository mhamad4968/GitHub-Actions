#!/usr/bin/env node
/**
 * 再生成: .cursor/rules/constitution.mdc（網羅結合版）
 * Windows / macOS / Linux 共通（bash 不要）。bash 版と同一内容を目指す。
 *
 *   npm run rules:regenerate-constitution
 *
 * @see scripts/regenerate-constitution-rule.sh（WSL 用レガシー）
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STAMP_PATH = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  'data',
  'constitution-mdc-freshness-stamp.json',
);

function normalizeForHash(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/^> \*\*CONSTITUTION_MDC_GENERATED_AT\*\*:.*\n/gm, '');
}

function writeFreshnessStamp(body) {
  const norm = normalizeForHash(body);
  const sha256 = crypto.createHash('sha256').update(norm, 'utf8').digest('hex');
  const stamp = {
    sha256,
    bytes: Buffer.byteLength(body, 'utf8'),
    generatedAt: new Date().toISOString(),
    note: 'gitignore された constitution.mdc の正規化ハッシュ（Phase 2-C）',
  };
  fs.mkdirSync(path.dirname(STAMP_PATH), { recursive: true });
  fs.writeFileSync(STAMP_PATH, `${JSON.stringify(stamp, null, 2)}\r\n`, 'utf8');
  return stamp;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, '.cursor', 'rules', 'constitution.mdc');

function readUtf8(rel) {
  const abs = path.join(root, ...rel.split('/'));
  return fs.readFileSync(abs, 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(root, ...rel.split('/')));
}

function push(lines, s) {
  lines.push(s);
}

/** PART Y15: docs 配下の .md（plans ツリー・特定ファイル除外） */
function collectDocsMdForY15() {
  const base = path.join(root, 'docs');
  const out = [];
  if (!fs.existsSync(base)) return out;
  const stack = [base];
  while (stack.length) {
    const d = stack.pop();
    let ents;
    try {
      ents = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of ents) {
      const p = path.join(d, ent.name);
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (ent.isDirectory()) {
        if (rel === 'docs/plans' || rel.startsWith('docs/plans/')) continue;
        stack.push(p);
      } else if (ent.isFile() && ent.name.endsWith('.md')) {
        if (rel === 'docs/troubleshooting.md') continue;
        if (rel === 'docs/runbooks/dry-run-apply-checklist.md') continue;
        out.push(p);
      }
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function walkMdFiles(dirRel, { excludePathPrefixes = [] } = {}) {
  const base = path.join(root, ...dirRel.split('/'));
  const out = [];
  if (!fs.existsSync(base)) return out;
  const stack = [base];
  while (stack.length) {
    const d = stack.pop();
    let ents;
    try {
      ents = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of ents) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile() && ent.name.endsWith('.md')) {
        const rel = path.relative(root, p).split(path.sep).join('/');
        if (excludePathPrefixes.some((pre) => rel === pre || rel.startsWith(pre + '/'))) continue;
        out.push(p);
      }
    }
  }
  out.sort((a, b) => a.localeCompare(b, 'en'));
  return out;
}

function globTopMd(dirRel, patternYear) {
  const base = path.join(root, ...dirRel.split('/'));
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && (!patternYear || e.name.startsWith(patternYear)))
    .map((e) => path.join(base, e.name))
    .sort((a, b) => a.localeCompare(b));
}

export function buildConstitutionLines() {
  const lines = [];

  const header = `${'---'}
description: 網羅統合版 — 憲法・索引・WORKFLOW・全mdc・予実・plans・chat・handoff・docs全（plans除く重複）・security-next・yojitsu README等（再生成=本スクリプト）。Cursor 常時枠の正は cio-constitution.mdc、本ファイルは必要時 Read
alwaysApply: false
---

# kintone-ai-lab — Constitution（網羅統合版）

> **読み方**: 本ファイルはリポ内の正本を**物理的に結合**したもの。編集の正本は各元ファイル。**差分・条文番号の最終解釈は \`AGENTS.md\`**。Cursor の制約で分割が必要な場合は \`AGENTS.md\` を直接 Read する。

> **Cursor 常時想起の正（2026-05-09 CIO 統合）**: **\`.cursor/rules/cio-constitution.mdc\`**（**\`alwaysApply: true\` 唯一核**）。補助想起は **\`constitution-brief-card.mdc\` / \`auto-read-by-topic.mdc\` 等（\`globs\` 注入）**。本網羅ファイルは **\`alwaysApply: false\`** — **必要時のみ Read**。結合内の旧「alwaysApply: true」表記はミラー遅延の可能性あり—**実行時は分割 \`.mdc\` と \`cio-constitution.mdc\` を正とする**。

> **再生成**: \`npm run rules:regenerate-constitution\`（本スクリプト・Windows 可）／従来: \`bash scripts/regenerate-constitution-rule.sh\`（WSL）

> **結合に含めない（意図）**: \`.rag/extra-docs/**\`（正本のミラー）・\`logs/**\` の自動生成ログ・\`node_modules\`・ビルド生成物。必要なら都度 Read。

> **⚠️ 手編集禁止（Phase 2-C）**: 本 \`constitution.mdc\` への **直接編集は禁止**。変更は **各元ファイル** を直し \`npm run rules:regenerate-constitution\` → \`npm run verify:constitution-mdc-freshness\`。

> **CONSTITUTION_MDC_GENERATED_AT**: ${new Date().toISOString()}

`;
  lines.push(header);

  const blocks = [
    ['## PART A — RULES-INDEX.md（全文）', 'RULES-INDEX.md'],
    ['## PART B — .cursorrules（全文）', '.cursorrules'],
    ['## PART C — WORKFLOW.md（全文）', 'WORKFLOW.md'],
  ];
  for (const [title, rel] of blocks) {
    push(lines, `---\n${title}\n---\n\n`);
    push(lines, readUtf8(rel));
    push(lines, '\n');
  }

  push(lines, '---\n## PART C0 — cio-constitution.mdc（CIO 統合憲法・全文）\n---\n\n');
  push(lines, readUtf8('.cursor/rules/cio-constitution.mdc'));
  push(lines, '\n');

  const ruleFiles = [
    'autonomous-with-mandatory-asks.mdc',
    'constitution-handoff-gate.mdc',
    'creation-timing-ask.mdc',
    'file-copy-exact-path.mdc',
    'kintone-javascript.mdc',
    'kintone-schema-trust.mdc',
    'kintone.mdc',
    'mcp-tool-discipline.mdc',
    'modern-web-official-docs.mdc',
    'next-session-jbis-followups.mdc',
    'security-news-response.mdc',
    'session-handoff.mdc',
    'snyk-security.mdc',
  ];
  for (const name of ruleFiles) {
    const rel = `.cursor/rules/${name}`;
    push(lines, `---\n## PART — ${name}（全文）\n---\n\n`);
    push(lines, readUtf8(rel));
    push(lines, '\n');
  }

  push(lines, '---\n## PART Z — AGENTS.md（開発憲法・全文）\n---\n\n');
  push(lines, readUtf8('AGENTS.md'));
  push(lines, '\n');

  const yStatic = [
    ['Y1', 'chat-sessions/checkpoint-latest.md'],
    ['Y2', 'chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md'],
    ['Y3', 'chat-sessions/NEW-SESSION-STARTER.md'],
    ['Y4', 'docs/troubleshooting.md'],
    ['Y5', 'templates/yojitsu-budget-lite/SPEC.md'],
    ['Y6', 'kintone-apps.md'],
    ['Y7', 'CLAUDE.md'],
    ['Y8', 'chat-sessions/SESSION-SPLIT-REMINDER.md'],
    ['Y9', 'chat-sessions/SESSION-CLOCK.md'],
  ];
  for (const [tag, rel] of yStatic) {
    push(lines, `---\n## PART ${tag} — ${path.basename(rel)}（全文）\n---\n\n`);
    push(lines, readUtf8(rel));
    push(lines, '\n');
  }

  push(lines, '---\n## PART Y10 — templates/yojitsu-budget-lite/docs/*.md（全文・全件）\n---\n\n');
  const y10dir = path.join(root, 'templates', 'yojitsu-budget-lite', 'docs');
  if (fs.existsSync(y10dir)) {
    for (const p of fs.readdirSync(y10dir).filter((n) => n.endsWith('.md')).sort()) {
      const abs = path.join(y10dir, p);
      push(lines, `### FILE: templates/yojitsu-budget-lite/docs/${p}\n\n`);
      push(lines, fs.readFileSync(abs, 'utf8'));
      push(lines, '\n');
    }
  }

  push(lines, '---\n## PART Y11 — docs/plans/**/*.md（全文・全件）\n---\n\n');
  for (const abs of walkMdFiles('docs/plans')) {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    push(lines, `### FILE: ${rel}\n\n`);
    push(lines, fs.readFileSync(abs, 'utf8'));
    push(lines, '\n');
  }

  push(lines, '---\n## PART Y12 — chat-sessions/日次ログ 2026-*.md と checkpoints（全文）\n---\n\n');
  for (const abs of globTopMd('chat-sessions', '2026')) {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    push(lines, `### FILE: ${rel}\n\n`);
    push(lines, fs.readFileSync(abs, 'utf8'));
    push(lines, '\n');
  }
  const ck = path.join(root, 'chat-sessions', 'checkpoints');
  if (fs.existsSync(ck)) {
    for (const ent of fs.readdirSync(ck, { withFileTypes: true })) {
      if (!ent.isFile() || !ent.name.endsWith('.md')) continue;
      const abs = path.join(ck, ent.name);
      const rel = path.relative(root, abs).split(path.sep).join('/');
      push(lines, `### FILE: ${rel}\n\n`);
      push(lines, fs.readFileSync(abs, 'utf8'));
      push(lines, '\n');
    }
  }

  if (exists('docs/runbooks/dry-run-apply-checklist.md')) {
    push(lines, '---\n## PART Y13 — docs/runbooks/dry-run-apply-checklist.md（全文）\n---\n\n');
    push(lines, readUtf8('docs/runbooks/dry-run-apply-checklist.md'));
    push(lines, '\n');
  }

  push(lines, '---\n## PART Y14 — chat-sessions 運用補助（handoff・TICKER・トラブルメモ・README 等・全文）\n---\n\n');
  for (const rel of [
    'chat-sessions/handoff-log.md',
    'chat-sessions/SESSION-CLOCK-TICKER.md',
    'chat-sessions/CURSOR-トラブル対応メモ.md',
    'chat-sessions/evening-reflect-queue.md',
    'chat-sessions/README.md',
    'chat-sessions/TEMPLATE.md',
  ]) {
    if (!exists(rel)) continue;
    push(lines, `### FILE: ${rel}\n\n`);
    push(lines, readUtf8(rel));
    push(lines, '\n');
  }
  if (exists('chat-sessions/HANDOFF-HUMAN.txt')) {
    push(lines, '---\n## PART Y14b — chat-sessions/HANDOFF-HUMAN.txt（全文）\n---\n\n');
    push(lines, readUtf8('chat-sessions/HANDOFF-HUMAN.txt'));
    push(lines, '\n');
  }

  push(lines, '---\n## PART Y15 — docs/**/*.md（plans・troubleshooting・dry-run checklist 除く・全文）\n---\n\n');
  for (const abs of collectDocsMdForY15()) {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    push(lines, `### FILE: ${rel}\n\n`);
    push(lines, fs.readFileSync(abs, 'utf8'));
    push(lines, '\n');
  }

  push(lines, '---\n## PART Y16 — templates/yojitsu-budget-lite/README・SPEC.template 等（SPEC.md は Y5 と重複するため除外・全文）\n---\n\n');
  const y16base = path.join(root, 'templates', 'yojitsu-budget-lite');
  if (fs.existsSync(y16base)) {
    for (const ent of fs.readdirSync(y16base, { withFileTypes: true })) {
      if (!ent.isFile() || !ent.name.endsWith('.md') || ent.name === 'SPEC.md') continue;
      const abs = path.join(y16base, ent.name);
      const rel = path.relative(root, abs).split(path.sep).join('/');
      push(lines, `### FILE: ${rel}\n\n`);
      push(lines, fs.readFileSync(abs, 'utf8'));
      push(lines, '\n');
    }
  }

  const sec = path.join(root, 'security-next-automation');
  if (fs.existsSync(sec)) {
    push(lines, '---\n## PART Y17 — security-next-automation/**/*.md（全文）\n---\n\n');
    for (const abs of walkMdFiles('security-next-automation')) {
      const rel = path.relative(root, abs).split(path.sep).join('/');
      push(lines, `### FILE: ${rel}\n\n`);
      push(lines, fs.readFileSync(abs, 'utf8'));
      push(lines, '\n');
    }
  }

  return lines;
}

function main() {
  const CHECK = process.argv.includes('--check');
  const lines = buildConstitutionLines();
  const body = lines.join('');

  if (CHECK) {
    if (!fs.existsSync(outPath)) {
      console.error('[regenerate-constitution-rule] NG missing', outPath);
      console.error('  → npm run rules:regenerate-constitution');
      process.exit(2);
    }
    const actual = fs.readFileSync(outPath, 'utf8');
    if (normalizeForHash(body) !== normalizeForHash(actual)) {
      console.error('[regenerate-constitution-rule] NG constitution.mdc is stale or hand-edited');
      console.error('  → npm run rules:regenerate-constitution');
      console.error('  → npm run verify:constitution-mdc-freshness');
      process.exit(1);
    }
    if (!/手編集禁止（Phase 2-C）/.test(actual)) {
      console.error('[regenerate-constitution-rule] NG missing Phase 2-C hand-edit banner — regenerate');
      process.exit(1);
    }
    console.log('[regenerate-constitution-rule] OK (--check fresh)', actual.length, 'bytes');
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, body, 'utf8');
  const stamp = writeFreshnessStamp(body);
  const st = fs.statSync(outPath);
  // eslint-disable-next-line no-console
  console.log('[regenerate-constitution-rule]', st.size, 'bytes', outPath);
  // eslint-disable-next-line no-console
  console.log('[regenerate-constitution-rule] stamp', stamp.sha256.slice(0, 12) + '…', STAMP_PATH);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) main();
