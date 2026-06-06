#!/usr/bin/env node
/**
 * §50-3-8 第二レビュー（DeepSeek 等）の構造化記録
 *
 * Usage:
 *   npm run cio:second-reviewer:capture -- --reviewer deepseek --verdict 条件付きGO --summary "..." --blind-spots "a;b;c"
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_REL = 'docs/handoff/second-reviewer-latest.json';

function parseArgs() {
  const out = { reviewer: 'deepseek', verdict: '', summary: '', blindSpots: [], project: '' };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--reviewer') out.reviewer = args[++i] || 'deepseek';
    else if (args[i] === '--verdict') out.verdict = args[++i] || '';
    else if (args[i] === '--summary') out.summary = args[++i] || '';
    else if (args[i] === '--project') out.project = args[++i] || '';
    else if (args[i] === '--blind-spots') {
      const raw = args[++i] || '';
      out.blindSpots = raw.split(/[;；]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return out;
}

function main() {
  const args = parseArgs();
  if (!args.verdict || !args.summary) {
    console.error('Required: --verdict --summary [--blind-spots "a;b;c"]');
    process.exit(1);
  }

  const outPath = path.join(root, OUT_REL);
  let doc = { version: '2026-06-06', entries: [] };
  if (fs.existsSync(outPath)) {
    try {
      doc = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      if (!Array.isArray(doc.entries)) doc.entries = [];
    } catch {
      doc.entries = [];
    }
  }

  const entry = {
    at: new Date().toISOString(),
    reviewer: args.reviewer,
    project: args.project || '(general)',
    verdict: args.verdict,
    summary: args.summary,
    blindSpots: args.blindSpots,
    section: '§50-3-8',
  };

  doc.entries.unshift(entry);
  doc.entries = doc.entries.slice(0, 20);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log('[cio:second-reviewer:capture] OK →', OUT_REL);
  console.log(`  ${entry.reviewer} / ${entry.verdict} / blind=${entry.blindSpots.length}`);
}

main();
