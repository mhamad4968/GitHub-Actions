#!/usr/bin/env node
/**
 * GitHub 上の constitution-gates 最新結果（gh CLI）
 * gh 無し / 未認証は SKIP（exit 0）
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

function hasGh() {
  const r = spawnSync('gh', ['--version'], { encoding: 'utf8', shell: true });
  return r.status === 0;
}

function main() {
  if (!hasGh()) {
    console.log('[verify:github-constitution-gates] SKIP（gh CLI 無し）');
    process.exit(0);
  }

  const r = spawnSync(
    'gh',
    [
      'run',
      'list',
      '--workflow',
      'constitution-gates.yml',
      '--branch',
      'main',
      '--limit',
      '1',
      '--json',
      'conclusion,status,headSha,url',
    ],
    { encoding: 'utf8', shell: true },
  );
  if (r.status !== 0) {
    console.log('[verify:github-constitution-gates] SKIP（gh run list 失敗）');
    process.exit(0);
  }

  let rows = [];
  try {
    rows = JSON.parse(r.stdout || '[]');
  } catch {
    console.log('[verify:github-constitution-gates] SKIP（JSON 解析失敗）');
    process.exit(0);
  }
  const latest = rows[0];
  if (!latest) {
    console.log('[verify:github-constitution-gates] SKIP（実行履歴なし）');
    process.exit(0);
  }

  if (latest.status !== 'completed') {
    console.log(`[verify:github-constitution-gates] WARN in_progress status=${latest.status}`);
    process.exit(0);
  }

  if (latest.conclusion === 'success') {
    console.log(`[verify:github-constitution-gates] OK head=${(latest.headSha || '').slice(0, 7)}`);
    process.exit(0);
  }

  console.error('[verify:github-constitution-gates] NG constitution-gates 最新が赤');
  console.error(`  conclusion=${latest.conclusion} head=${(latest.headSha || '').slice(0, 7)}`);
  if (latest.url) console.error(`  url=${latest.url}`);
  console.error('  fix: checkpoint 整合 → push → または gh workflow run constitution-gates.yml');
  process.exit(1);
}

main();
