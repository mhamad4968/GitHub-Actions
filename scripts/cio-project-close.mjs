#!/usr/bin/env node
/**
 * プロジェクト v1 クローズ登録（checkpoint / handoff は別途更新または --sync-checkpoint）
 *
 * Usage:
 *   npm run cio:project:close -- --project business-improvement --show
 *   npm run cio:project:close -- --project business-improvement --completion-report docs/reports/....md
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { CLOSURES_REL, findClosure, loadProjectClosures } from './lib/cio-project-closure.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs() {
  const out = { project: '', show: false, completionReport: '', note: '' };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project') out.project = args[++i] || '';
    else if (args[i] === '--show') out.show = true;
    else if (args[i] === '--completion-report') out.completionReport = args[++i] || '';
    else if (args[i] === '--note') out.note = args[++i] || '';
  }
  return out;
}

function main() {
  const args = parseArgs();
  if (args.show || !args.project) {
    const c = findClosure(root, args.project || 'business-improvement');
    if (!c) {
      console.log('[cio:project:close] 未登録:', args.project || '(default business-improvement)');
      process.exit(0);
    }
    console.log(JSON.stringify(c, null, 2));
    process.exit(0);
  }

  console.error('[cio:project:close] 手動登録は data/cio-project-closures.json を正本として編集してください');
  console.error('  登録後: checkpoint/handoff 更新 → npm run verify:checkpoint-project-closure');
  process.exit(1);
}

main();
