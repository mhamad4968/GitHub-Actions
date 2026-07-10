#!/usr/bin/env node
/**
 * 削除済 MCP 名が「稼働正本」に残っていないか grep 検査（MCP 統廃合 DEL 前ゲート · spec §8.3）。
 *
 * 対象: scripts/ · data/ · .cursor/rules（triggers/security）· リポ .cursor/mcp.json · AGENTS.md
 * 除外: docs/reports · docs/plans · chat-sessions · docs/approved-changes · 本スクリプト自身
 *
 * constitution.mdc S14 節のみ: mcp_user-cyber-news / CyberNewsMCP 禁止 needle
 *
 * @see docs/plans/2026-07-11-mcp-tools-consolidation-spec.md §8.2–8.3
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = fileURLToPath(import.meta.url);

/** spec §6 DEL 対象 — SCR 完走後は稼働正本からゼロであること */
const DELETED_NAMES = ['cyber-news', 'mintlify'];

/** ファイル内に残ってはならない「稼働参照」パターン（履歴語の bare 言及より厳しめ） */
const ACTIVE_PATTERNS = [
  /mcp_user-cyber-news/i,
  /CyberNewsMCP/i,
  /['"]cyber-news['"]/,
  /['"]mintlify['"]/,
  /REPO_OVERLAY_SERVER_NAMES[\s\S]*mintlify/,
];

const SCAN_FILES = [
  'AGENTS.md',
  '.cursor/mcp.json',
  '.cursor/rules/mcp-server-use-triggers.mdc',
  '.cursor/rules/security-news-response.mdc',
  'data/cio-mcp-manifest.json',
  'data/cio-mcp-four-ai-matrix.json',
  'data/cio-ai-team-tool-routing.json',
  'security-next-automation/README.md',
];

const SCAN_DIRS = ['scripts', 'data'];

const EXCLUDE_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
]);

const EXCLUDE_PATH_PARTS = [
  `${path.sep}docs${path.sep}reports${path.sep}`,
  `${path.sep}docs${path.sep}plans${path.sep}`,
  `${path.sep}chat-sessions${path.sep}`,
  `${path.sep}docs${path.sep}approved-changes${path.sep}`,
  `${path.sep}.rag${path.sep}`,
];

function shouldSkipPath(abs) {
  if (abs === SELF) return true;
  for (const part of EXCLUDE_PATH_PARTS) {
    if (abs.includes(part)) return true;
  }
  return false;
}

function collectFiles(dirRel, out) {
  const absDir = path.join(root, dirRel);
  if (!fs.existsSync(absDir)) return;
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const rel = path.join(dirRel, ent.name);
    const abs = path.join(root, rel);
    if (shouldSkipPath(abs)) continue;
    if (ent.isDirectory()) {
      if (EXCLUDE_DIR_NAMES.has(ent.name)) continue;
      collectFiles(rel, out);
      continue;
    }
    if (!/\.(mjs|js|json|mdc|md|txt)$/.test(ent.name)) continue;
    out.push(rel);
  }
}

function findActiveRefs(text, rel) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of ACTIVE_PATTERNS) {
      if (pat.test(line)) {
        hits.push({ rel, line: i + 1, snippet: line.trim().slice(0, 120) });
        break;
      }
    }
  }
  return hits;
}

function checkConstitutionS14() {
  const rel = '.cursor/rules/constitution.mdc';
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return [];
  const text = fs.readFileSync(abs, 'utf8');
  const start = text.indexOf('月次セキュリティ巡回');
  const slice = start >= 0 ? text.slice(start, start + 12000) : text.slice(103000, 113000);
  const forbidden = [/mcp_user-cyber-news/i, /CyberNewsMCP/i, /get_news_briefs.*cyber-news/i];
  const hits = [];
  for (const pat of forbidden) {
    if (pat.test(slice)) {
      hits.push({ rel: `${rel} (S14節)`, line: 0, snippet: pat.toString() });
    }
  }
  return hits;
}

function main() {
  const files = [...SCAN_FILES];
  for (const d of SCAN_DIRS) collectFiles(d, files);

  const unique = [...new Set(files)].filter((rel) => !shouldSkipPath(path.join(root, rel)));
  const allHits = [];

  for (const rel of unique) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    allHits.push(...findActiveRefs(text, rel));
  }

  allHits.push(...checkConstitutionS14());

  if (allHits.length) {
    console.error('[verify:mcp-deleted-refs] NG', allHits.length, 'active ref(s) for', DELETED_NAMES.join(', '));
    for (const h of allHits.slice(0, 30)) {
      console.error(`  - ${h.rel}:${h.line} ${h.snippet}`);
    }
    if (allHits.length > 30) console.error(`  ... +${allHits.length - 30} more`);
    process.exit(1);
  }

  console.log('[verify:mcp-deleted-refs] OK no active refs for', DELETED_NAMES.join(', '));
  console.log(`  scanned files: ${unique.length}`);
  process.exit(0);
}

main();
