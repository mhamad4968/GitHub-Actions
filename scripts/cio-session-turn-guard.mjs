#!/usr/bin/env node
/**
 * 15ターン / Diffループ / ゾンビリトライ — 物理インターロック
 * @see .cursor/rules/cio-context-dissolution-interlock.mdc
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  MAX_DIFF_LOOP,
  MAX_TURNS,
  MAX_ZOMBIE_RETRY,
  loadState,
  saveState,
} from './lib/cio-session-bridge.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function fail(msg, code = 1) {
  console.error(`${RED}[cio-session-turn-guard] LOCK ${msg}${RESET}`);
  process.exit(code);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let recordTurn = false;
  let check = false;
  let recordDiff = '';
  let recordRetry = '';
  let strict = false;
  let tokenEstimate = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--record-turn') recordTurn = true;
    else if (args[i] === '--check') check = true;
    else if (args[i] === '--strict') strict = true;
    else if (args[i] === '--record-diff' && args[i + 1]) recordDiff = args[++i];
    else if (args[i] === '--record-retry' && args[i + 1]) recordRetry = args[++i];
    else if (args[i] === '--token-estimate' && args[i + 1]) tokenEstimate = Number(args[++i]) || 0;
  }
  return { recordTurn, check, recordDiff, recordRetry, strict, tokenEstimate };
}

function main() {
  const { recordTurn, check, recordDiff, recordRetry, strict, tokenEstimate } = parseArgs();
  const state = loadState(root);

  if (recordTurn) {
    state.turnCount = (state.turnCount || 0) + 1;
    saveState(root, state);
    console.log(`[cio-session-turn-guard] turn=${state.turnCount}/${MAX_TURNS}`);
    process.exit(0);
  }

  if (recordDiff) {
    const key = recordDiff.replace(/\\/g, '/');
    state.diffLoops[key] = (state.diffLoops[key] || 0) + 1;
    saveState(root, state);
    if (state.diffLoops[key] >= MAX_DIFF_LOOP) {
      fail(
        `同一ファイル ${key} への Diff が ${MAX_DIFF_LOOP} 回 — SPEC.md の根本破綻を見直せ。npm run cio:session:export-handoff`,
      );
    }
    console.log(`[cio-session-turn-guard] diff-loop ${key}=${state.diffLoops[key]}/${MAX_DIFF_LOOP}`);
    process.exit(0);
  }

  if (recordRetry) {
    const key = recordRetry;
    state.retryCounts[key] = (state.retryCounts[key] || 0) + 1;
    saveState(root, state);
    if (state.retryCounts[key] > MAX_ZOMBIE_RETRY) {
      fail(`リトライ上限 ${MAX_ZOMBIE_RETRY} 超過 (${key}) — ゾンブループ停止`);
    }
    console.log(`[cio-session-turn-guard] retry ${key}=${state.retryCounts[key]}/${MAX_ZOMBIE_RETRY}`);
    process.exit(0);
  }

  if (check || strict) {
    if (state.turnCount > MAX_TURNS && !state.exported) {
      fail(
        `15ターン超過（${state.turnCount}）かつ handoff 未 export — npm run cio:session:export-handoff を先に実行`,
      );
    }
    if (tokenEstimate > 40_000 && !state.exported) {
      fail('コンテキスト 40k 超過見込み — New Chat 強制。npm run cio:session:export-handoff');
    }
    if (strict && state.turnCount >= MAX_TURNS - 1 && !state.exported) {
      console.warn(
        `${RED}[cio-session-turn-guard] WARN 残りターン ${MAX_TURNS - state.turnCount} — export-handoff 推奨${RESET}`,
      );
    }
    console.log(
      `[cio-session-turn-guard] OK turns=${state.turnCount}/${MAX_TURNS} exported=${!!state.exported}`,
    );
    process.exit(0);
  }

  console.log(`Usage: --record-turn | --check [--strict] | --record-diff <path> | --record-retry <label>`);
  process.exit(2);
}

main();
