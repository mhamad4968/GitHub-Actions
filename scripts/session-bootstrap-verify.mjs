#!/usr/bin/env node
/**
 * 新セッション引き継ぎ後の機械検証ワンショット。
 * @see chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md フェーズ 6
 *
 * 実体:
 *   1) verify-constitution-handoff.mjs（光速・TSB-024 物理ガード / Read より前に失敗させる）
 *   1b) mandatory-read-gate.mjs（checkpoint / handoff / HUMAN / bootstrap 正本 / AGENTS の構造検査）
 *   1c) session-clock-health.mjs --strict（§51-6-2 壁時計 hooks / crontab node 整合）
 *   2) npm run session-starter:sync-desktop（浜田 Desktop AI緊急用へ儀式 .txt をコピー）
 *   3) verify-desktop-ai-emergency-sync.mjs（コピー後のバイト一致＝メンテ確認）
 *   3b) verify-cursor-mcp-windows.mjs（Windows mcp.json 機械検査・TSB-028）
 *   4) npm run smoke:quiet（10 連検査＝従来 9 ＋ mandatory-read-gate）
 * 終了コード: (1)(1b)(1c)(3)(3b) が非 0 なら即終了 / さもなければ smoke に委譲（0=ok / 1=warn / 2=ng）。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log(`
=== session-bootstrap ===
手動チェックリスト: chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md
憲法: AGENTS.md §35-1 / §56-1a（開発=AI・確認=浜田）／§35-7＋674 deploy は **cio:preflight:674** → **deploy:674**（`.cursor/rules/cio-discipline-always.mdc`）
(1) node scripts/verify-constitution-handoff.mjs  ← 先頭（数十 ms〜2 秒）
(1b) node scripts/mandatory-read-gate.mjs  ← 必読ファイル構造（議論抜け対策）
(1c) node scripts/session-clock-health.mjs --strict  ← 壁時計 hooks / crontab node 整合
(2) npm run session-starter:sync-desktop  ← Desktop AI緊急用
(3) node scripts/verify-desktop-ai-emergency-sync.mjs  ← バイト一致確認
(3b) node scripts/verify-cursor-mcp-windows.mjs  ← Windows Cursor mcp.json（TSB-028）
(4) npm run smoke:quiet（直列 10 検査）
`);

const fast = spawnSync(process.execPath, ['scripts/verify-constitution-handoff.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (fast.status !== 0) {
  process.exit(typeof fast.status === 'number' && fast.status !== 0 ? fast.status : 2);
}

const mandatory = spawnSync(process.execPath, ['scripts/mandatory-read-gate.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (mandatory.status !== 0) {
  process.exit(typeof mandatory.status === 'number' && mandatory.status !== 0 ? mandatory.status : 2);
}

const clockHealth = spawnSync(process.execPath, ['scripts/session-clock-health.mjs', '--strict'], {
  cwd: root,
  stdio: 'inherit',
});
if (clockHealth.status !== 0) {
  process.exit(typeof clockHealth.status === 'number' && clockHealth.status !== 0 ? clockHealth.status : 2);
}

const syncDesk = spawnSync('npm', ['run', 'session-starter:sync-desktop'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});
if (syncDesk.status !== 0) {
  process.exit(typeof syncDesk.status === 'number' && syncDesk.status !== 0 ? syncDesk.status : 2);
}

const desk = spawnSync(process.execPath, ['scripts/verify-desktop-ai-emergency-sync.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (desk.status !== 0) {
  process.exit(typeof desk.status === 'number' && desk.status !== 0 ? desk.status : 2);
}

const mcpWin = spawnSync(process.execPath, ['scripts/verify-cursor-mcp-windows.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (mcpWin.status !== 0) {
  console.error('→ Windows Cursor mcp.json が不正です。WSL 正本を直してから: npm run mcp:sync-cursor-windows');
  process.exit(typeof mcpWin.status === 'number' && mcpWin.status !== 0 ? mcpWin.status : 2);
}

const r = spawnSync('npm', ['run', 'smoke:quiet'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

process.exit(typeof r.status === 'number' ? r.status : 1);
