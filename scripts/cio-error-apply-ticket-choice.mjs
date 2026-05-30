#!/usr/bin/env node
/**
 * 拡張案1 — CEO 3択承認 → 自動実装再開
 */
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runChoicePlan } from './lib/cio-error-ticket-apply.mjs';
import { repoRoot } from './lib/cio-composer-escalation.mjs';

const root = repoRoot(fileURLToPath(import.meta.url));

function parseChoice() {
  const i = process.argv.indexOf('--choice');
  if (i >= 0 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  const m = process.argv.find((a) => /^[123]$/.test(a));
  return m ? Number(m) : NaN;
}

function main() {
  const choice = parseChoice();
  if (![1, 2, 3].includes(choice)) {
    console.error('Usage: npm run cio:error:apply-ticket-choice -- --choice <1|2|3>');
    process.exit(2);
  }
  try {
    const cmds = runChoicePlan(root, choice);
    console.log(`[cio:error:apply-ticket-choice] OK choice=${choice}`, cmds.length, 'steps');
    process.exit(0);
  } catch (e) {
    console.error('[cio:error:apply-ticket-choice] NG', e.message);
    process.exit(1);
  }
}

main();
