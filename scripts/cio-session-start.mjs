#!/usr/bin/env node
/**
 * 新規セッション開始ワンコマンド
 * preflight → turn-start → session:bootstrap → handoff import
 *
 * 統合版: npm run cio:session:cold-start（朝報 + 本スクリプト相当を含む）
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { ensureMorningPrep, runSessionPreflight } from './lib/cio-session-preflight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function main() {
  const skipBootstrap = process.argv.includes('--skip-bootstrap');
  const skipPreflight = process.argv.includes('--skip-preflight');

  try {
    if (!skipPreflight) {
      const morning = ensureMorningPrep(root, { fast: true });
      if (!morning.ok) {
        console.error('[cio:session:start] ❌ morning-prep fast 失敗');
        process.exit(2);
      }
      const pf = runSessionPreflight(root);
      if (!pf.ok) {
        console.error('[cio:session:start] ❌ preflight 失敗');
        process.exit(2);
      }
    }

    run('npm run cio:turn-start');
    if (!skipBootstrap) {
      run('npm run session:bootstrap');
    }
    run('npm run verify:session-handoff-integrity -- --import');
    console.log('\n[cio:session:start] OK — Read .cursor/skills/kintone-session-bootstrap/SKILL.md');
    console.log('[cio:session:start] 推奨: 次回から npm run cio:session:cold-start を1本で');
  } catch (e) {
    console.error('[cio:session:start] NG', e.message || e);
    process.exit(1);
  }
}

main();
