#!/usr/bin/env node
/**
 * 改善案3 — 3択提案付き自律エラーチケット発行
 */
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadState, repoRoot } from './lib/cio-composer-escalation.mjs';
import { CHAT_WAIT_LINE, writeTicket } from './lib/cio-error-ticket.mjs';

const root = repoRoot(fileURLToPath(import.meta.url));

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

function main() {
  const fromEscalation = process.argv.includes('--from-escalation');
  const state = loadState(root);

  if (fromEscalation && !state.cioEscalated && !process.argv.includes('--force')) {
    console.error('[cio:error:generate-ticket] NG — escalation 未到達（--force で上書き可）');
    process.exit(1);
  }

  const out = writeTicket(root, {
    state,
    log: argValue('--log'),
    deepSeekHypothesis: argValue('--hypothesis'),
  });

  console.log('[cio:error:generate-ticket] OK', out);
  console.log(CHAT_WAIT_LINE);
  process.exit(0);
}

main();
