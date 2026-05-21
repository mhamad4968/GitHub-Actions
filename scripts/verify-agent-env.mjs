#!/usr/bin/env node
/**
 * verify-agent-env.mjs — 自律エージェント向け Tier A 環境ワンショット
 *
 * Desktop 同期・session-clock strict は含まない（`session:bootstrap` の代替ではない）。
 * 連鎖: 憲法 → mandatory-read-gate → CEO 最低基準 → verify:all → verify:rag-mirror-canonical → smoke:quiet
 *       → verify:cio-mcp-registry → verify:mcp-four-ai-alignment
 *
 * 終了コード: 憲法 / gate / verify:all が非 0 ならそのまま終了。
 * smoke は smoke-test.mjs に委譲（0=全 ok / 1=warn / 2=ng）。
 *
 * @see .cursor/rules/mcp-tool-discipline.mdc（アイドル時間）
 * @see chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md フェーズ 6
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNode(rel, args = []) {
  const r = spawnSync(process.execPath, [path.join(root, rel), ...args], {
    cwd: root,
    stdio: 'inherit',
  });
  return typeof r.status === 'number' ? r.status : 2;
}

function runNpm(script) {
  const r = spawnSync('npm', ['run', script], { cwd: root, stdio: 'inherit', shell: true });
  return typeof r.status === 'number' ? r.status : 2;
}

console.log('=== verify:agent-env（自律 Tier A・Desktop 同期なし）===\n');

let st = runNode('scripts/verify-constitution-handoff.mjs');
if (st !== 0) process.exit(st);

st = runNode('scripts/mandatory-read-gate.mjs');
if (st !== 0) process.exit(st);

st = runNode('scripts/verify-ceo-minimum-baseline.mjs');
if (st !== 0) process.exit(st);

st = runNpm('verify:all');
if (st !== 0) process.exit(st);

st = runNpm('verify:rag-mirror-canonical');
if (st !== 0) process.exit(st);

st = runNpm('smoke:quiet');
if (st !== 0) process.exit(st);

st = runNpm('verify:cio-mcp-registry');
if (st !== 0) process.exit(st);

st = runNpm('verify:mcp-four-ai-alignment');
process.exit(st);
