#!/usr/bin/env node
/**
 * mandatory-read-gate.mjs — セッション必読ファイルの「構造・鮮度」機械検査
 *
 * 背景:
 *   議論・ルール整備だけでは「新チャットで Read を飛ばす」抜けが残る。
 *   verify:constitution-handoff（needle 生存）に加え、正本ファイルが
 *   壊滅・空化・履歴欠落していないかを exit 2 で止める。
 *
 * 実行位置:
 *   verify:constitution-handoff の直後（Desktop sync より前）。
 *   npm run session:bootstrap / smoke に組み込み。
 *
 * 終了コード: 0 = OK / 2 = NG
 *
 * @see chat-sessions/checkpoint-latest.md 項番 0（0a の直後）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string} msg */
function fail(msg) {
  console.error(`[mandatory-read-gate] ❌ ${msg}`);
  process.exit(2);
}

/** @param {string} rel */
function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) fail(`missing: ${rel}`);
  return fs.readFileSync(abs, 'utf8');
}

/** @param {string} rel */
function mtimeIso(rel) {
  const abs = path.join(root, rel);
  return fs.statSync(abs).mtime.toISOString();
}

// --- checkpoint-latest.md ---
const checkpointRel = 'chat-sessions/checkpoint-latest.md';
const checkpoint = read(checkpointRel);
if (checkpoint.length < 4000) {
  fail(`${checkpointRel}: unexpectedly short (${checkpoint.length} chars)`);
}
if (!checkpoint.includes('## セッション切替後の自律復元')) {
  fail(`${checkpointRel}: missing "## セッション切替後の自律復元"`);
}
if (!checkpoint.includes('mandatory-read-gate.mjs')) {
  fail(`${checkpointRel}: missing "mandatory-read-gate.mjs" (bootstrap 手順の記載を確認)`);
}

const mFinal = checkpoint.match(/^\*\*最終更新\*\*:\s*(.+)$/m);
if (!mFinal) fail(`${checkpointRel}: missing **最終更新**: line`);
const finalLineFull = mFinal[0].trim();
if (!/20\d\d-\d\d-\d\d/.test(finalLineFull)) {
  fail(`${checkpointRel}: **最終更新** has no YYYY-MM-DD`);
}

// --- handoff-log.md ---
const handoffRel = 'chat-sessions/handoff-log.md';
const handoff = read(handoffRel);
const headingMatches = [...handoff.matchAll(/^###\s+(\d{4}-\d{2}-\d{2}.+)$/gm)];
if (headingMatches.length === 0) {
  fail(`${handoffRel}: no "### YYYY-MM-DD …" handoff entries`);
}
const lastHeading = headingMatches[headingMatches.length - 1][0].trim();

// --- HANDOFF-HUMAN.txt ---
const humanRel = 'chat-sessions/HANDOFF-HUMAN.txt';
const human = read(humanRel);
for (const n of ['次にやる1つ', 'HANDOFF-HUMAN', '推奨フロー']) {
  if (!human.includes(n)) fail(`${humanRel}: missing "${n}"`);
}

// --- SESSION-BOOTSTRAP-CHECKLIST.md（冒頭〜フェーズ6付近）---
const bootRel = 'chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md';
const boot = read(bootRel);
const bootHead = boot.slice(0, 14_000);
for (const n of ['フェーズ 6', 'session:bootstrap', 'mandatory-read-gate.mjs']) {
  if (!bootHead.includes(n)) fail(`${bootRel} (head): missing "${n}"`);
}

// --- AGENTS.md（誤削除の早期検知）---
const agentsRel = 'AGENTS.md';
const agents = read(agentsRel);
if (agents.length < 30_000) {
  fail(`${agentsRel}: unexpectedly short (${agents.length} chars)`);
}

console.log(`
=== mandatory-read-gate（必読ファイル構造検査）===
憲法 needle 検査の次・Desktop sync の前。NG 時は exit 2 で本題に入れない。

- checkpoint **最終更新**（先頭の 1 行）:
  ${finalLineFull.length > 240 ? `${finalLineFull.slice(0, 240)}…` : finalLineFull}
- handoff エントリ数: ${headingMatches.length}（末尾見出し: ${lastHeading.slice(0, 100)}${lastHeading.length > 100 ? '…' : ''}）
- HANDOFF-HUMAN / SESSION-BOOTSTRAP（冒頭）/ AGENTS: 構造 OK
- mtime: checkpoint=${mtimeIso(checkpointRel)} | handoff=${mtimeIso(handoffRel)}
`);

console.log('[mandatory-read-gate] ✅ OK');
process.exit(0);
