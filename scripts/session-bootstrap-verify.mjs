#!/usr/bin/env node
/**
 * 新セッション引き継ぎ後の機械検証ワンショット。
 * @see chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md フェーズ 6
 *
 * 実体:
 *   1) verify-constitution-handoff.mjs（光速・TSB-024 物理ガード / Read より前に失敗させる）
 *   2) npm run smoke:quiet（9 連検査）
 * 終了コード: (1) が非 0 なら即終了 / さもなければ smoke に委譲（0=ok / 1=warn / 2=ng）。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log(`
=== session-bootstrap ===
手動チェックリスト: chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md
憲法: AGENTS.md §35-1 / §56-1a（開発=AI・確認=浜田）
(1) node scripts/verify-constitution-handoff.mjs  ← 先頭（数十 ms〜2 秒）
(2) npm run smoke:quiet（直列 9 検査）
`);

const fast = spawnSync(process.execPath, ['scripts/verify-constitution-handoff.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (fast.status !== 0) {
  process.exit(typeof fast.status === 'number' && fast.status !== 0 ? fast.status : 2);
}

const r = spawnSync('npm', ['run', 'smoke:quiet'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

process.exit(typeof r.status === 'number' ? r.status : 1);
