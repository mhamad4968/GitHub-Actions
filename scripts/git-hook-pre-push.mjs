#!/usr/bin/env node
/**
 * pre-push — cio:quality-gate --push（R60 / B v2）
 * 緊急時: CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1 / CIO_ALLOW_PUSH_WITHOUT_LINT=1
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  if (process.env.CIO_ALLOW_PUSH_WITHOUT_LINT === '1' && process.env.CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL === '1') {
    console.error('[pre-push] WARN 全スキップ — CIO_ALLOW_PUSH_WITHOUT_LINT=1 & CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1');
    process.exit(0);
  }

  const args = [path.join(ROOT, 'scripts/cio-quality-gate.mjs'), '--push'];
  const env = { ...process.env };

  if (process.env.CIO_ALLOW_PUSH_WITHOUT_LINT === '1') {
    console.error('[pre-push] WARN lint 相当スキップ — pushGate から lint 除外');
    env.CIO_QUALITY_GATE_SKIP_LINT = '1';
  }
  if (process.env.CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL === '1') {
    console.error('[pre-push] WARN constitution-handoff スキップ');
    env.CIO_QUALITY_GATE_SKIP_CONSTITUTION = '1';
  }

  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit', env });
  if (r.status !== 0) {
    console.error('\n============================================================');
    console.error('  ❌  pre-push: quality-gate NG — push ブロック（R60）');
    console.error('============================================================');
    console.error('  npm run cio:pre-push-check で修正後に再 push');
    console.error('  緊急: CIO_ALLOW_PUSH_WITHOUT_LINT=1 / CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1');
    console.error('============================================================\n');
    process.exit(1);
  }
  process.exit(0);
}

main();
