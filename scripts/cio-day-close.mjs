#!/usr/bin/env node
/**
 * 毎日最終セッション締め — 自発開始。③実装は GO 後。
 *
 *   npm run cio:day-close -- --until-pause   ①②＋改善案待ち
 *   npm run cio:day-close -- --after-go      ⑤⑥⑦（GO ファイル必須）
 *   npm run cio:day-close -- --help
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATUS_REL = 'chat-sessions/day-close-status.json';

function jstDate() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function printHelp() {
  console.log(`Usage:
  npm run cio:day-close -- --until-pause
  npm run cio:day-close -- --after-go [--skip-go]
  npm run cio:day-close -- --help

--until-pause  ① GHA → ② evening:reflect。③はチャットで出して浜田 GO 待ち。close-git しない。
--after-go     ⑤⑥⑦。docs/approved-changes/YYYY-MM-DD-evening-reflection-hamada-go.md が必要（--skip-go は改善なしのとき）。
④の実装は CIO が GO 後に行う（本コマンドはコードを書かない）。`);
}

function writeStatus(obj) {
  fs.writeFileSync(path.join(root, STATUS_REL), `${JSON.stringify({ ...obj, at: new Date().toISOString() }, null, 2)}\n`);
}

function goPath(date) {
  return path.join(root, 'docs/approved-changes', `${date}-evening-reflection-hamada-go.md`);
}

function untilPause() {
  const date = jstDate();
  const gha = runNpmScriptSync(root, 'cio:eod:github');
  if (gha.status !== 0) {
    console.error('[cio:day-close] ① NG — GHA 是正してから --until-pause を再実行');
    process.exit(2);
  }
  const ref = runNpmScriptSync(root, 'evening:reflect');
  if (ref.status !== 0) {
    console.log('[cio:day-close] ② evening:reflect 非0（記入済みなら続行）');
  }
  writeStatus({ phase: 'pause-go', date });
  console.log(`[cio:day-close] PAUSE ③ 改善案をチャットへ。GO 後: ④実装 → npm run cio:day-close -- --after-go`);
  console.log(`[cio:day-close] 夕反省: docs/reports/${date}-evening-reflection.md`);
  process.exit(0);
}

function afterGo() {
  const date = jstDate();
  const skipGo = process.argv.includes('--skip-go');
  if (!skipGo && !fs.existsSync(goPath(date))) {
    console.error(`[cio:day-close] NG GO ファイルなし: ${goPath(date)}`);
    process.exit(2);
  }
  console.log('[cio:day-close] ④ は CIO が先に実施済みであること。ここから ⑤⑥⑦');
  const chain = [
    ['cio:session:export-handoff', []],
    ['verify:session-handoff-integrity', ['--validate-export']],
    ['session-starter:sync-desktop', []],
    ['verify:desktop-ai-emergency-sync', []],
    ['verify:constitution-evening', []],
    ['session:clock:clear', []],
    ['cio:session:close-git', ['--execute', '--auto-stage']],
    ['verify:session-close-git-warn', []],
  ];
  for (const [script, args] of chain) {
    const r = runNpmScriptSync(root, script, args);
    if (r.status !== 0) {
      console.error(`[cio:day-close] NG ${script} exit ${r.status}`);
      process.exit(r.status || 1);
    }
  }
  writeStatus({ phase: 'done', date });
  console.log('[cio:day-close] OK ⑦ 完了');
}

function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  if (process.argv.includes('--until-pause')) return untilPause();
  if (process.argv.includes('--after-go')) return afterGo();
  printHelp();
  process.exit(2);
}

main();
