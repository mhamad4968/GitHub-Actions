#!/usr/bin/env node
/**
 * R22 — 実行予算書 736 担当説明前ゲート
 * = calc-gate + verify-sample + 仕様 §9 存在 + 手動 UI 確認リマインド
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specPath = path.join(root, 'docs/plans/2026-06-18-jikkou-yosan-spec.md');

function runNpm(script) {
  const r = spawnSync('npm', ['run', script, '--silent'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  return r.status === 0;
}

function main() {
  console.log('=== jikkou-yosan:pre-demo-gate（R22）===\n');

  if (!existsSync(specPath)) {
    console.error('[pre-demo-gate] NG 仕様正本不在:', specPath);
    process.exit(1);
  }
  const spec = readFileSync(specPath, 'utf8');
  if (!/##\s*9\.\s*v1\s*実装正本/.test(spec)) {
    console.error('[pre-demo-gate] NG 仕様 §9 実装正本 セクションなし');
    process.exit(1);
  }
  console.log('[pre-demo-gate] OK 仕様 §9');

  if (!runNpm('jikkou-yosan:calc-gate')) {
    console.error('[pre-demo-gate] NG calc-gate');
    process.exit(1);
  }
  if (!runNpm('jikkou-yosan:verify-sample')) {
    console.error('[pre-demo-gate] NG verify-sample');
    process.exit(1);
  }

  console.log('\n[pre-demo-gate] 手動（ゲート外・必須）:');
  console.log('  1. k/736/show#record=1 を Ctrl+Shift+R 超リロード');
  console.log('  2. 総括表↔詳細表ジャンプ・行追加・工種CD双方向を目視');
  console.log('  3. 2623001-001 合計 ①/⑧/⑨ が gate 出力と一致');
  console.log('\n[pre-demo-gate] OK — 数字・仕様は機械 OK');
}

main();
