#!/usr/bin/env node
/**
 * pre-push — constitution-handoff + lint:customize（R60）
 * 緊急時: CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1 / CIO_ALLOW_PUSH_WITHOUT_LINT=1
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const ch = spawnSync(process.execPath, [path.join(ROOT, 'scripts/verify-constitution-handoff.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (ch.status !== 0) {
    if (process.env.CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL === '1') {
      console.error('[pre-push] WARN constitution-handoff NG — CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1 で push 許可');
    } else {
      console.error('\n============================================================');
      console.error('  ❌  pre-push: CONSTITUTION HANDOFF GUARD BLOCKED PUSH');
      console.error('============================================================');
      console.error((ch.stdout || '') + (ch.stderr || ''));
      console.error('  修正後に再 push。緊急のみ: CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1 git push');
      console.error('============================================================\n');
      process.exit(1);
    }
  }

  if (process.env.CIO_ALLOW_PUSH_WITHOUT_LINT === '1') {
    console.error('[pre-push] WARN lint:customize スキップ — CIO_ALLOW_PUSH_WITHOUT_LINT=1');
    process.exit(0);
  }

  const lint = runNpmScriptSync(ROOT, 'lint:customize', [], { stdio: 'inherit' });
  if (lint.status !== 0) {
    console.error('\n============================================================');
    console.error('  ❌  pre-push: lint:customize NG — push ブロック（R60）');
    console.error('============================================================');
    console.error('  npm run lint:customize で修正後に再 push');
    console.error('  緊急のみ: CIO_ALLOW_PUSH_WITHOUT_LINT=1 git push');
    console.error('============================================================\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
