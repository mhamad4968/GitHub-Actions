#!/usr/bin/env node
/**
 * 新セッション引き継ぎ後の機械検証ワンショット。
 * @see chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md フェーズ 6
 *
 * 実体: npm run smoke:quiet（8 連検査）をリポルートで実行。
 * 終了コードは smoke-test に委譲（0=ok / 1=warn / 2=ng）。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log(`
=== session-bootstrap ===
手動チェックリスト: chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md
憲法: AGENTS.md §35-1 / §56-1a（開発=AI・確認=浜田）
以下: npm run smoke:quiet（直列 8 検査）
`);

const r = spawnSync('npm', ['run', 'smoke:quiet'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

process.exit(typeof r.status === 'number' ? r.status : 1);
