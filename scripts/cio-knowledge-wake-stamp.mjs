#!/usr/bin/env node
/**
 * ナレッジWAKE スタンプ — 起動時にアクティブ針を additional_context / [ルール確認] へ
 *
 * MCP（Memory/RAG）は受動的なので、git ミラー要約を sessionStart で押し込む。
 *
 * @see data/cio-active-knowledge-needles.json
 * @see npm run cio:session:cold-start（Phase 5d）
 * @see .cursor/hooks/session-start-autopilot.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditActiveNeedles,
  selectActiveNeedles,
} from './lib/cio-active-knowledge-needles.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAMP_JSON = path.join(root, 'logs', 'cio-knowledge-wake-latest.json');
const STAMP_TXT = path.join(root, 'logs', 'cio-knowledge-wake-latest.txt');
const DIGEST_MD = path.join(root, 'chat-sessions', 'knowledge-wake-latest.md');

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function buildKnowledgeWakeStampLine(repoRoot = root) {
  const { active, issues } = auditActiveNeedles(repoRoot);
  if (issues.length) {
    const head = issues.slice(0, 2).join(' · ');
    return `ナレッジWAKE: NG ${issues.length}件（${head}${issues.length > 2 ? ' …' : ''}）`;
  }
  if (!active.length) {
    return 'ナレッジWAKE: 0件（registry active なし · data/cio-active-knowledge-needles.json）';
  }
  const ids = active.map((n) => n.id).join(' · ');
  return `ナレッジWAKE: ${active.length}件OK（${ids} · gitミラー優先 · Memory/RAG補助 · 免除しない）`;
}

/**
 * sessionStart additional_context 用（短文・最大5針）
 * @param {string} repoRoot
 */
export function buildKnowledgeWakeContextBlock(repoRoot = root) {
  const { active, issues } = auditActiveNeedles(repoRoot);
  const line = buildKnowledgeWakeStampLine(repoRoot);
  if (issues.length || !active.length) {
    return ` 【ナレッジWAKE・sessionStart】\`${line}\`（正本 \`data/cio-active-knowledge-needles.json\` · \`npm run cio:knowledge:wake-stamp\`）`;
  }
  const bullets = active
    .map((n) => {
      const git = (n.gitPaths && n.gitPaths[0]) || '';
      return `  - **${n.id}**: ${String(n.wakeHint).trim()}${git ? ` → Read \`${git}\`` : ''}`;
    })
    .join('\n');
  return (
    ` 【ナレッジWAKE・sessionStart】\`${line}\`\n` +
    `${bullets}\n` +
    `（digest: \`chat-sessions/knowledge-wake-latest.md\` · Memory/RAG は補助。手動: \`npm run cio:knowledge:wake-stamp\`）`
  );
}

/**
 * @param {string} repoRoot
 * @param {{ source?: string }} [opts]
 */
export function writeKnowledgeWakeStamp(repoRoot = root, opts = {}) {
  const { reg, active, issues } = auditActiveNeedles(repoRoot);
  const line = buildKnowledgeWakeStampLine(repoRoot);
  const stampedAt = new Date().toISOString();
  const payload = {
    stampedAt,
    source: opts.source || 'cli',
    registry: reg.registryRel,
    version: reg.version,
    ok: issues.length === 0,
    issues,
    active: active.map((n) => ({
      id: n.id,
      title: n.title || n.id,
      wakeHint: n.wakeHint,
      apps: n.apps || [],
      keywords: n.keywords || [],
      memoryEntity: n.memoryEntity || null,
      ragSources: n.ragSources || [],
      gitPaths: n.gitPaths || [],
    })),
    chatLine: line,
  };

  fs.mkdirSync(path.dirname(STAMP_JSON), { recursive: true });
  fs.writeFileSync(STAMP_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(STAMP_TXT, `[${stampedAt}] ${line}\n`, 'utf8');

  const mdLines = [
    '# ナレッジWAKE（最新）',
    '',
    `> 自動生成: ${stampedAt} · \`npm run cio:knowledge:wake-stamp\``,
    `> 正本 registry: \`${reg.registryRel}\``,
    '',
    `**スタンプ**: ${line}`,
    '',
  ];
  if (issues.length) {
    mdLines.push('## NG', ...issues.map((i) => `- ${i}`), '');
  }
  mdLines.push('## アクティブ針（起動時注入）', '');
  for (const n of active) {
    mdLines.push(`### ${n.id} — ${n.title || ''}`);
    mdLines.push('');
    mdLines.push(String(n.wakeHint || '').trim());
    mdLines.push('');
    mdLines.push(`- Memory: \`${n.memoryEntity || '—'}\``);
    mdLines.push(`- RAG: ${(n.ragSources || []).map((s) => `\`${s}\``).join(' · ') || '—'}`);
    mdLines.push(`- git: ${(n.gitPaths || []).map((p) => `\`${p}\``).join(' · ') || '—'}`);
    mdLines.push('');
  }
  if (!active.length) {
    mdLines.push('_（active なし）_', '');
  }
  fs.mkdirSync(path.dirname(DIGEST_MD), { recursive: true });
  const body = `${mdLines.join('\n')}\n`.replace(/\n/g, '\r\n');
  fs.writeFileSync(DIGEST_MD, body, 'utf8');

  return { line, payload, issues, active, contextBlock: buildKnowledgeWakeContextBlock(repoRoot) };
}

function fail(msg) {
  console.error(`[cio:knowledge:wake-stamp] ❌ ${msg}`);
  process.exit(2);
}

function main() {
  let result;
  try {
    result = writeKnowledgeWakeStamp(root, { source: 'npm run cio:knowledge:wake-stamp' });
  } catch (e) {
    fail(e.message || String(e));
  }
  if (result.issues.length) {
    for (const i of result.issues) console.error(`  - ${i}`);
    fail(`${result.issues.length} knowledge needle issue(s)`);
  }
  console.log(`[cio:knowledge:wake-stamp] ✅ OK active=${result.active.length}`);
  process.stdout.write(`${result.line}\n`);
  process.exit(0);
}

const selfAbs = path.resolve(fileURLToPath(import.meta.url));
const argvAbs = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (argvAbs === selfAbs) {
  main();
}

// re-export for tests
export { selectActiveNeedles };
