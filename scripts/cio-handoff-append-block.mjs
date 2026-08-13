#!/usr/bin/env node
/**
 * handoff-log 標準ブロック追記 — partial/full CLOSE 用
 *
 *   npm run cio:handoff:append-block -- --title "..." --summary "..." --git abc1234 --git-msg "..."
 *   npm run cio:handoff:append-block -- --dry-run --title "..."
 *
 * @see chat-sessions/templates/handoff-log-block.template.md
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendHandoffBlock,
  formatHandoffBlock,
  isDiscussedValueOk,
} from './lib/cio-handoff-template.mjs';
import { readCheckpointNextTask } from './lib/cio-checkpoint-read.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function printUsage() {
  console.log(`Usage:
  npm run cio:handoff:append-block -- --title "..." --summary "..." [options]
  npm run cio:handoff:append-block -- --dry-run --title "..."

Options:
  --title <text>          Block title
  --summary <text>        Block summary
  --discussed <text>      What was talked (required — empty/なし NG)
  --next <text>           Next task (defaults to checkpoint)
  --git <hash>            Git hash (defaults to HEAD)
  --git-msg <text>        Git status/message
  --build <text>          Optional BUILD line
  --go-wait <text>        GO-wait status
  --do-not-touch <text>   Frozen lanes
  --dry-run               Print without appending
  --help, -h              Show this help without appending`);
}

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : '';
}

function gitHead() {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? String(r.stdout).trim() : 'unknown';
}

function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const dryRun = process.argv.includes('--dry-run');
  const title = arg('title') || 'セッション区切り';
  const summary = arg('summary') || '(要約未指定)';
  const discussed = arg('discussed') || arg('talked') || '';
  if (!isDiscussedValueOk(discussed)) {
    console.error(
      '[cio:handoff:append-block] NG --discussed が必要です（セッションで話した合意・候補・やらないこと。空・「なし」禁止）',
    );
    process.exit(2);
  }
  const gitHash = arg('git') || gitHead();
  const gitMsg = arg('git-msg') || arg('message') || '';
  const nextTask = arg('next') || readCheckpointNextTask(root) || '(checkpoint 要更新)';
  const build = arg('build') || '';
  const goWait = arg('go-wait') || 'なし';
  const doNotTouch = arg('do-not-touch') || '688 / 677–679 / SKYSEA — 触らない';

  const block = formatHandoffBlock({
    title,
    summary,
    discussed,
    nextTask,
    gitHash,
    gitMsg,
    build: build || undefined,
    goWait,
    doNotTouch,
  });

  if (dryRun) {
    console.log(block);
    process.exit(0);
  }

  appendHandoffBlock(root, block);
  console.log('[cio:handoff:append-block] OK appended to chat-sessions/handoff-log.md');
  console.log('[cio:handoff:append-block] 続けて: npm run cio:session:export-handoff');
}

main();
