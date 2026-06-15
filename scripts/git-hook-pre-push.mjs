#!/usr/bin/env node
/**
 * pre-push — constitution-handoff が NG なら push ブロック
 * 緊急時のみ: CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const ch = spawnSync(process.execPath, [path.join(ROOT, 'scripts/verify-constitution-handoff.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (ch.status === 0) {
    process.exit(0);
  }

  if (process.env.CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL === '1') {
    console.error('[pre-push] WARN constitution-handoff NG — CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1 で push 許可');
    process.exit(0);
  }

  console.error('\n============================================================');
  console.error('  ❌  pre-push: CONSTITUTION HANDOFF GUARD BLOCKED PUSH');
  console.error('============================================================');
  console.error((ch.stdout || '') + (ch.stderr || ''));
  console.error('  修正後に再 push。緊急のみ: CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1 git push');
  console.error('============================================================\n');
  process.exit(1);
}

main();
