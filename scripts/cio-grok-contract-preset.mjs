#!/usr/bin/env node
/**
 * Grok C 契約プリセット（v3.2 C）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  hashContract,
  loadState,
  saveState,
  validateDoneWhen,
  validateInScope,
} from './lib/cio-grok-execution.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const app = argValue('--app') || '';
  const doneWhen = argValue('--done-when') || '';
  const inScope = argValue('--in-scope') || (app ? `customize/${app}/` : '');
  const goal = argValue('--goal') || `lint/test 緑化 app ${app || '?'}`;

  const dw = validateDoneWhen(doneWhen);
  if (!dw.ok) {
    console.error(`[cio:grok:contract-preset] NG done-when: ${dw.reason}`);
    process.exit(1);
  }
  const sc = validateInScope(inScope);
  if (!sc.ok) {
    console.error(`[cio:grok:contract-preset] NG in-scope: ${sc.reason}`);
    process.exit(1);
  }

  const contractHash = hashContract({ mode: 'C', goal, doneWhen, inScope });
  const tplPath = path.join(root, 'templates/grok-execution-contract.template.md');
  const tpl = fs.existsSync(tplPath) ? fs.readFileSync(tplPath, 'utf8') : '';

  const state = loadState(root);
  const dryRunCount = state.dryRunCount || 0;
  if (!dryRun && dryRunCount < 2) {
    console.error('[cio:grok:contract-preset] NG C1 — 最初の2回は --dry-run 必須');
    process.exit(2);
  }

  console.log('## 【Grok 実行契約 — preset】\n');
  console.log(`| **Mode** | C |`);
  console.log(`| **Goal** | ${goal} |`);
  console.log(`| **In-scope** | ${inScope} |`);
  console.log(`| **Done when** | ${doneWhen} |`);
  console.log(`| **contractHash** | ${contractHash} |`);
  console.log(`| **dry-run** | ${dryRun} |`);
  if (tpl) console.log('\n<!-- template ref: templates/grok-execution-contract.template.md -->\n');

  if (dryRun) {
    state.dryRunCount = dryRunCount + 1;
    saveState(root, state);
    console.log(`[cio:grok:contract-preset] OK dry-run ${state.dryRunCount}/2 — 実 Grok は3回目以降`);
    process.exit(0);
  }

  console.log('[cio:grok:contract-preset] OK — CIO がチャットに貼付 → guard --stamp --mode C');
  process.exit(0);
}

main();
