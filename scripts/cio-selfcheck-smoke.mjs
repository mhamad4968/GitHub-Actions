#!/usr/bin/env node
/**
 * cio-selfcheck-smoke.mjs — cio-chat-report-selfcheck の回帰検査（シェルにパイプ不要）
 *
 * 背景: PowerShell で `"…" | node scripts/… --stdin` とすると **先頭が `"` になり**
 * `permissions.json` の `terminalAllowlist`（`node` プレフィックス等）に合致せず **Run 承認 UI** が出る。
 * 本スクリプトは **spawn の input で stdin を渡す**ため、エージェントは **`npm run cio:selfcheck:test` 1 回**で検証できる。
 *
 * Exit: 0 = 全 OK / 1 = 失敗
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const selfcheck = path.join(root, 'scripts', 'cio-chat-report-selfcheck.mjs');

function runSelfcheck(label, stdinBody, extraArgs = []) {
  const r = spawnSync(process.execPath, [selfcheck, '--stdin', ...extraArgs], {
    cwd: root,
    input: stdinBody,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const code = r.status === null ? 99 : r.status;
  return { label, code, stderr: r.stderr || '', stdout: r.stdout || '' };
}

let failed = 0;

const t1 = runSelfcheck('ban-off (clean body)', 'CHECK ok body without forbidden words\n');
if (t1.code !== 0) {
  console.error('[cio-selfcheck-smoke] FAIL expected exit 0, got', t1.code, t1.stderr);
  failed++;
} else {
  console.log('[cio-selfcheck-smoke] OK', t1.label);
}

const t2 = runSelfcheck('ban-on (心身の健康)', '本文に心身の健康が含まれるとNG\n');
if (t2.code !== 1) {
  console.error('[cio-selfcheck-smoke] FAIL expected exit 1, got', t2.code, t2.stdout, t2.stderr);
  failed++;
} else {
  console.log('[cio-selfcheck-smoke] OK', t2.label);
}

const t3 = runSelfcheck('syntax', '', ['--help']);
if (t3.code !== 0) {
  console.error('[cio-selfcheck-smoke] FAIL --help exit', t3.code);
  failed++;
} else {
  console.log('[cio-selfcheck-smoke] OK', t3.label);
}

if (failed > 0) {
  console.error(`[cio-selfcheck-smoke] 失敗 ${failed} 件`);
  process.exit(1);
}
console.log('[cio-selfcheck-smoke] 全件 OK');
process.exit(0);
