#!/usr/bin/env node
/**
 * rag-ingest-constitution-aide-trial.mjs
 * AI チーム向け RAG 補助試行（1〜2 週間）— 狭い安定パックを .rag/extra-docs/constitution-aide-trial へ集約して ingest。
 * 正本はリポ側。RAG は検索 aide のみ（docs/runbooks/rag-constitution-aide-trial.md）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, '.rag', 'extra-docs', 'constitution-aide-trial');
const DAYS = 14;

const FIXED = [
  'docs/constitution/00-rule-hierarchy.md',
  'docs/constitution/05-knowledge-rag.md',
  'docs/constitution/17-four-ai-mode-b.md',
  'docs/constitution/18-ai-team-read-map.md',
  'docs/runbooks/evening-reflection-scope.md',
  'docs/runbooks/requester-doc-review-one-at-a-time.md',
  'docs/runbooks/session-lifecycle-v2.md',
  'docs/runbooks/push-deploy-quality-gates-v2.md',
  'docs/runbooks/checkpoint-handoff-template-v2.md',
  'docs/runbooks/ai-team-tool-routing-v2.md',
  'docs/runbooks/rag-constitution-aide-trial.md',
  // 直近の案内規律（完了済≠GO待ち 等）— 夕反省に載るまで穴を埋める
  'chat-sessions/checkpoint-latest.md',
];

function copyFile(rel) {
  const src = path.join(ROOT, rel);
  if (!fs.existsSync(src)) {
    console.warn(`[constitution-aide-trial] skip missing: ${rel}`);
    return false;
  }
  const base = path.basename(rel);
  const dest = path.join(DEST, base);
  fs.mkdirSync(DEST, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`[constitution-aide-trial] mirror ${rel} → ${path.relative(ROOT, dest)}`);
  return true;
}

function recentEveningReflections() {
  const dir = path.join(ROOT, 'docs', 'reports');
  if (!fs.existsSync(dir)) return [];
  const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  return fs
    .readdirSync(dir)
    .filter((n) => /^\d{4}-\d{2}-\d{2}-evening-reflection\.md$/.test(n))
    .filter((n) => {
      const d = n.slice(0, 10);
      const t = Date.parse(`${d}T12:00:00+09:00`);
      return Number.isFinite(t) && t >= cutoff;
    })
    .map((n) => path.join('docs', 'reports', n));
}

function main() {
  fs.mkdirSync(DEST, { recursive: true });
  for (const f of fs.readdirSync(DEST)) {
    fs.unlinkSync(path.join(DEST, f));
  }

  let n = 0;
  for (const rel of FIXED) {
    if (copyFile(rel)) n += 1;
  }
  for (const rel of recentEveningReflections()) {
    if (copyFile(rel)) n += 1;
  }

  console.log(`[constitution-aide-trial] ${n} files → ${path.relative(ROOT, DEST)}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, 'rag-ingest-path.mjs'), DEST], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  process.exit(r.status === null ? 1 : r.status);
}

main();
