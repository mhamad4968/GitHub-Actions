#!/usr/bin/env node
/**
 * rag-ingest-sessions.mjs — chat-sessions/ から最新 N 日分を .rag/extra-docs/sessions/ にコピー
 *
 * I-12 (2026-04-25) — RAG ingest 範囲拡張
 *
 * 使い方:
 *   node scripts/rag-ingest-sessions.mjs --days=7
 *
 * 動作:
 *   - chat-sessions/checkpoint-latest.md を必ずコピー
 *   - chat-sessions/YYYY-MM-DD.md のうち最新 N 日分をコピー (default: 7)
 *   - chat-sessions/NEW-SESSION-STARTER.md / CURSOR-トラブル対応メモ.md もコピー (常駐 doc)
 *   - .rag/extra-docs/sessions/ ディレクトリを ensure
 *   - 古いコピーは削除 (sync-style)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const SESSIONS_SRC = path.join(REPO_ROOT, 'chat-sessions');
const SESSIONS_DST = path.join(REPO_ROOT, '.rag', 'extra-docs', 'sessions');

const argv = process.argv.slice(2);
const ARG = (key, def) => {
  const found = argv.find((a) => a.startsWith(`--${key}=`));
  if (found) return found.slice(`--${key}=`.length);
  return def;
};
const DAYS = Number(ARG('days', '7'));

if (!fs.existsSync(SESSIONS_SRC)) {
  console.error(`❌ chat-sessions/ ディレクトリが見つからない: ${SESSIONS_SRC}`);
  process.exit(1);
}
fs.mkdirSync(SESSIONS_DST, { recursive: true });

// 既存 .md を全削除して sync-style 同期
for (const f of fs.readdirSync(SESSIONS_DST)) {
  if (f.endsWith('.md')) fs.unlinkSync(path.join(SESSIONS_DST, f));
}

const allFiles = fs.readdirSync(SESSIONS_SRC).filter((f) => f.endsWith('.md'));
const dateFiles = allFiles
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
  .sort()
  .reverse()
  .slice(0, DAYS);

const persistFiles = ['checkpoint-latest.md', 'NEW-SESSION-STARTER.md', 'CURSOR-トラブル対応メモ.md'];
const filesToCopy = [
  ...persistFiles.filter((f) => allFiles.includes(f)),
  ...dateFiles,
];

let copied = 0;
for (const f of filesToCopy) {
  const src = path.join(SESSIONS_SRC, f);
  const dst = path.join(SESSIONS_DST, f);
  fs.copyFileSync(src, dst);
  copied++;
}

console.log(`✅ ${copied} files copied to .rag/extra-docs/sessions/ (latest ${DAYS} dated + ${persistFiles.length} persistent)`);
console.log(`   files: ${filesToCopy.join(', ')}`);
