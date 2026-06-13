#!/usr/bin/env node
/**
 * R30 — health-check 回帰 fixture（TSB-012 rag DB_PATH / spec-task-scores 整合）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { readCheckpointNextTask } from './lib/cio-checkpoint-read.mjs';
import { readTopScoredTask } from './lib/cio-handoff-export-validate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** health-check.mjs と同型 — WSL bash -lc 内 DB_PATH= を OK とみなす */
export function ragHasDbPathConfigured(server) {
  if (server?.env?.DB_PATH) return true;
  const joined = [...(server?.args || []), server?.command || ''].join(' ');
  return /(?:^|[\s;])DB_PATH=/.test(joined);
}

function main() {
  const issues = [];

  const wslRag = {
    command: 'wsl.exe',
    args: ['bash', '-lc', 'export DB_PATH=/home/user/.rag/db.sqlite && node server.js'],
    env: {},
  };
  if (!ragHasDbPathConfigured(wslRag)) {
    issues.push('ragHasDbPathConfigured: WSL bash -lc DB_PATH= が false（F6 再発）');
  }

  const bareRag = { command: 'node', args: ['server.js'], env: {} };
  if (ragHasDbPathConfigured(bareRag)) {
    issues.push('ragHasDbPathConfigured: env 無しで true になった（偽陽性）');
  }

  const scoresPath = path.join(root, 'docs/handoff/spec-task-scores.json');
  if (!fs.existsSync(scoresPath)) {
    issues.push('missing spec-task-scores.json');
  } else {
    const checkpoint = readCheckpointNextTask(root);
    const top = readTopScoredTask(root);
    if (checkpoint && top) {
      const nc = checkpoint.replace(/\*\*/g, '').slice(0, 20);
      const nt = top.replace(/\*\*/g, '').slice(0, 20);
      if (!checkpoint.includes('台帳') && !top.includes('台帳') && nc !== nt) {
        issues.push('spec-task-scores Rank1 が checkpoint と無関係に乖離（要手動確認）');
      }
    }
  }

  if (issues.length) {
    console.error('[verify:health-check-regression] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:health-check-regression] OK R30 fixtures');
  process.exit(0);
}

main();
