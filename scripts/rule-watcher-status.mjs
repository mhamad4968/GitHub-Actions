#!/usr/bin/env node
/**
 * rule-watcher-status.mjs — file-watcher.mjs (K-3) 稼働確認 (S16 / smoke-test 用)
 *
 * 出口:
 *   0 = scripts/file-watcher.mjs が 1 プロセス以上稼働
 *   2 = 未稼働 (smoke-test は warn 扱い)
 *   1 = 検査エラー
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const res = spawnSync(
  'bash',
  ['-lc', "ps aux | grep -v grep | grep -F 'scripts/file-watcher.mjs' || true"],
  { cwd: REPO_ROOT, encoding: 'utf8', timeout: 5_000 },
);

if (res.error) {
  console.error(`[rule-watcher-status] ❌ ${res.error.message}`);
  process.exit(1);
}

const running = !!(res.stdout || '').trim();
if (running) {
  console.log('WATCHER_STATUS=running');
  console.log('[rule-watcher-status] ✅ file-watcher.mjs 稼働中 (§51-3 K-3 / 憲法 5 ファイル SHA256 監視)');
  process.exit(0);
}

console.log('WATCHER_STATUS=stopped');
console.log('[rule-watcher-status] ⚠️ file-watcher.mjs 未稼働 — `npm run watcher:start` 推奨 (commit 前並列編集検知)');
process.exit(2);
