#!/usr/bin/env node
/**
 * クローズ済みプロジェクトが checkpoint / kintone-apps に「未完了」として残っていないか
 *
 * Usage:
 *   npm run verify:checkpoint-project-closure
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readCheckpointLastUpdatedDate, readCheckpointNextTask } from './lib/cio-checkpoint-read.mjs';
import { readCheckpointGitHead } from './lib/cio-checkpoint-git-sync.mjs';
import { checkClosedProjectNextTask, loadProjectClosures } from './lib/cio-project-closure.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const issues = [];
  const { closures } = loadProjectClosures(root);
  if (!closures.length) {
    console.log('[verify:checkpoint-project-closure] OK（登録クローズ 0 件）');
    process.exit(0);
  }

  const nextTask = readCheckpointNextTask(root);
  const nextCheck = checkClosedProjectNextTask(root, nextTask);
  if (!nextCheck.ok) issues.push(...nextCheck.issues);

  const cpGit = readCheckpointGitHead(root);
  if (cpGit) {
    const cat = spawnSync('git', ['cat-file', '-t', cpGit], { cwd: root, encoding: 'utf8' });
    if (cat.status !== 0) {
      issues.push({
        code: 'CHECKPOINT_GIT_UNKNOWN',
        message: `checkpoint Git hash ${cpGit} が git に存在しない`,
        fix: 'chat-sessions/checkpoint-latest.md の **Git** 行を実在 commit に更新',
      });
    }
  }

  const lastUpdated = readCheckpointLastUpdatedDate(root);
  for (const c of closures) {
    if (!c.completionReport) continue;
    const reportPath = path.join(root, c.completionReport);
    if (!fs.existsSync(reportPath)) {
      issues.push({
        code: 'COMPLETION_REPORT_MISSING',
        project: c.id,
        message: `completionReport 無し: ${c.completionReport}`,
      });
      continue;
    }
    if (lastUpdated && c.closedAt && lastUpdated < c.closedAt) {
      issues.push({
        code: 'CHECKPOINT_STALE_VS_CLOSURE',
        project: c.id,
        message: `checkpoint 最終更新(${lastUpdated}) < クローズ日(${c.closedAt})`,
        fix: 'chat-sessions/checkpoint-latest.md 先頭を更新 + handoff-log 追記 + npm run cio:session:export-handoff',
      });
    }
    if (c.kintoneAppsStateMarker) {
      const appsPath = path.join(root, 'kintone-apps.md');
      if (fs.existsSync(appsPath)) {
        const apps = fs.readFileSync(appsPath, 'utf8');
        if (!apps.includes(c.kintoneAppsStateMarker)) {
          issues.push({
            code: 'KINTONE_APPS_STATE_MISSING',
            project: c.id,
            message: `kintone-apps.md に "${c.kintoneAppsStateMarker}" 無し`,
          });
        }
      }
    }
  }

  if (issues.length) {
    console.error(`[verify:checkpoint-project-closure] NG ${issues.length} 件`);
    for (const i of issues) {
      console.error(`  [${i.code}] ${i.project || ''} ${i.message || i.nextTask || ''}`);
      if (i.fix) console.error(`    fix: ${i.fix}`);
      if (i.completionReport) console.error(`    正本: ${i.completionReport}`);
    }
    process.exit(1);
  }

  console.log('[verify:checkpoint-project-closure] OK', `closures=${closures.length}`, nextTask ? `next="${nextTask.slice(0, 60)}…"` : 'next=(未設定)');
  process.exit(0);
}

main();
