#!/usr/bin/env node
/**
 * 方針1 — Composer verify 連続失敗 → DeepSeek §50-3-8 → Self-Heal(3) → CIO 報告
 * @see .cursor/rules/cio-composer-escalation-interlock.mdc
 */
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  deepSeekPromptBlock,
  loadState,
  MAX_CONSECUTIVE_FAIL,
  MAX_SELF_HEAL,
  recordFailure,
  recordSelfHealAttempt,
  recordSuccess,
  repoRoot,
} from './lib/cio-composer-escalation.mjs';
import { CHAT_WAIT_LINE, writeTicket } from './lib/cio-error-ticket.mjs';

const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const root = repoRoot(fileURLToPath(import.meta.url));

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

function fail(msg, code = 1) {
  console.error(`${RED}[cio-composer-escalation-guard] ${msg}${RESET}`);
  process.exit(code);
}

function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('--record-success')) {
    recordSuccess(root, argValue('--cmd'));
    console.log('[cio-composer-escalation-guard] OK reset');
    process.exit(0);
  }

  if (argv.includes('--record-failure')) {
    const cmd = argValue('--cmd') || 'unknown';
    const log = argValue('--log') || '';
    const state = recordFailure(root, cmd, log);
    console.log(
      `[cio-composer-escalation-guard] fail ${state.consecutiveFailures}/${MAX_CONSECUTIVE_FAIL}`,
    );
    if (state.locked && state.lockReason === 'deepseek-escalation') {
      console.error(`${RED}[LOCK] DeepSeek §50-3-8 強制 — Composer 作業一時停止${RESET}`);
      process.exit(1);
    }
    process.exit(0);
  }

  if (argv.includes('--record-self-heal')) {
    const state = recordSelfHealAttempt(root, argValue('--note') || '');
    console.log(`[cio-composer-escalation-guard] self-heal ${state.selfHealAttempts}/${MAX_SELF_HEAL}`);
    if (state.cioEscalated) {
      const ticket = writeTicket(root, { state });
      console.log('[cio-composer-escalation-guard] ticket →', ticket);
      fail(`${CHAT_WAIT_LINE}`, 1);
    }
    process.exit(0);
  }

  if (argv.includes('--prompt-deepseek')) {
    const state = loadState(root);
    if (state.consecutiveFailures < MAX_CONSECUTIVE_FAIL) {
      console.log('[cio-composer-escalation-guard] no escalation needed');
      process.exit(0);
    }
    console.log(deepSeekPromptBlock(state));
    process.exit(0);
  }

  if (argv.includes('--check')) {
    const state = loadState(root);
    if (!state.locked) {
      console.log('[cio-composer-escalation-guard] OK unlocked');
      process.exit(0);
    }
    if (state.lockReason === 'deepseek-escalation') {
      fail(
        `verify 連続 ${state.consecutiveFailures} 回失敗 — DeepSeek §50-3-8 を実行後 npm run cio:composer:escalation-guard -- --record-success`,
      );
    }
    if (state.lockReason === 'cio-escalation') {
      fail(
        `Self-Heal 上限 — CIO(Opus 4.8) が CEO へ報告するまで Composer ロック`,
      );
    }
    fail('不明ロック状態');
  }

  console.error(`Usage:
  npm run cio:composer:escalation-guard -- --record-failure --cmd "npm run …" --log "…"
  npm run cio:composer:escalation-guard -- --record-success
  npm run cio:composer:escalation-guard -- --record-self-heal
  npm run cio:composer:escalation-guard -- --prompt-deepseek
  npm run cio:composer:escalation-guard -- --check`);
  process.exit(2);
}

main();
