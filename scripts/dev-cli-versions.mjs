#!/usr/bin/env node
/**
 * 開発用 CLI / ランタイムの版を一覧する（存在しないコマンドは not found）。
 * @see docs/dev-cli-matrix.md
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function line(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', shell: true }).trim().split('\n')[0];
  } catch {
    return '(not found)';
  }
}

function localCliKintoneVersion() {
  const cliPath = path.join(root, 'node_modules', '@kintone', 'cli', 'cli.js');
  if (!existsSync(cliPath)) {
    return '(install @kintone/cli: npm install)';
  }
  try {
    return execSync(`node "${cliPath}" --version`, { encoding: 'utf8' }).trim();
  } catch {
    return '(error)';
  }
}

console.log('--- dev CLI / runtime (kintone-ai-lab) ---');
console.log(`node: ${line('node -v')}`);
console.log(`npm: ${line('npm -v')}`);
console.log(`git: ${line('git --version')}`);
console.log(`cli-kintone (@kintone/cli): ${localCliKintoneVersion()}`);

console.log('--- optional ---');
for (const [name, cmd] of [
  ['gh', 'gh --version'],
  ['rg', 'rg --version'],
  ['jq', 'jq --version'],
  ['curl', 'curl --version 2>&1 | head -1'],
  ['python3', 'python3 --version'],
  ['uv', 'uv --version'],
  ['cursor-agent', 'cursor-agent --version'],
]) {
  console.log(`${name}: ${line(cmd)}`);
}
