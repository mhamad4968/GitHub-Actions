#!/usr/bin/env node
/**
 * 新規セッション開始ワンコマンド
 * turn-start → session:bootstrap → handoff import
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function main() {
  const skipBootstrap = process.argv.includes('--skip-bootstrap');
  try {
    run('npm run cio:turn-start');
    if (!skipBootstrap) {
      run('npm run session:bootstrap');
    }
    run('npm run verify:session-handoff-integrity -- --import');
    console.log('\n[cio:session:start] OK — Read .cursor/skills/kintone-session-bootstrap/SKILL.md');
  } catch (e) {
    console.error('[cio:session:start] NG', e.message || e);
    process.exit(1);
  }
}

main();
