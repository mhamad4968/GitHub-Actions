#!/usr/bin/env node
/**
 * タスクA — 「Switched to Composer」silent fallback 検知・exit 1 インターロック
 * @see AGENTS.md §1-2-2 / §1-2-3-4
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  MODE_B_INTERLOCK_MESSAGE,
  RE_SWITCHED_TO_COMPOSER,
  composerScanPath,
  emitInterlockFailure,
  governanceDir,
  scanLogsForComposerViolations,
  scanTextForComposerViolation,
} from './lib/cio-four-ai-governance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function appendViolationLog(hits) {
  const dir = governanceDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({ iso: new Date().toISOString(), hits }) + '\n';
  fs.appendFileSync(composerScanPath(root), line, 'utf8');
}

function main() {
  if (process.env.SKIP_CIO_MODE_B_INTERLOCK === '1') {
    console.warn('[cio-composer-silent-fallback-guard] SKIP_CIO_MODE_B_INTERLOCK=1');
    process.exit(0);
  }

  const hits = [];

  if (process.argv.includes('--stdin')) {
    const text = fs.readFileSync(0, 'utf8');
    hits.push(...scanTextForComposerViolation(text, 'stdin'));
  } else {
    hits.push(...scanLogsForComposerViolations(root));
  }

  const silent = hits.filter((h) => h.kind === 'silent_fallback');
  if (silent.length === 0) {
    console.log('[cio-composer-silent-fallback-guard] OK (no silent Composer fallback in scan window)');
    console.log(`[cio-composer-silent-fallback-guard] pattern: ${RE_SWITCHED_TO_COMPOSER}`);
    process.exit(0);
  }

  appendViolationLog(silent);
  console.error('[cio-composer-silent-fallback-guard] NG silent fallback detected:', silent.length);
  for (const h of silent.slice(0, 8)) {
    console.error(`  - ${h.source}:${h.line} ${h.excerpt}`);
  }
  emitInterlockFailure('§1-2-2 silent fallback', MODE_B_INTERLOCK_MESSAGE);
  process.exit(1);
}

main();
