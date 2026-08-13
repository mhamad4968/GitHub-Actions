#!/usr/bin/env node
/**
 * EOD: GitHub Actions 直近失敗有無 + 674 live BUILD 一致
 *
 * cancelled は concurrency 置換を #S-CI-01 分類器で判定する。
 * superseded は障害に数えない。
 *
 *   npm run cio:eod:github
 */
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { classifyGhRuns } from './lib/gh-run-classifier.mjs';

const root = process.cwd();

function sh(cmd) {
  const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8' });
  return { status: r.status ?? 1, out: (r.stdout || '') + (r.stderr || '') };
}

function gitIsAncestor(ancestor, descendant) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function parseGhJson(raw) {
  try {
    return JSON.parse(raw.trim().split('\n').filter(Boolean).pop() || raw);
  } catch {
    const m = raw.match(/\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
    throw new Error('cannot parse gh JSON');
  }
}

async function main() {
  const runs = sh(
    'gh run list --limit 30 --json databaseId,conclusion,createdAt,workflowDatabaseId,workflowName,name,displayTitle,headSha,headBranch,url',
  );
  if (runs.status !== 0) {
    console.error('[cio:eod:github] gh run list failed');
    console.error(runs.out.slice(0, 400));
    process.exit(1);
  }

  let list = [];
  try {
    list = parseGhJson(runs.out);
  } catch (err) {
    console.error(`[cio:eod:github] ${err.message}`);
    process.exit(1);
  }

  const classified = await classifyGhRuns(list, { isAncestor: gitIsAncestor });
  console.log(
    `[cio:eod:github] recent runs=${list.length} failures=${classified.failureCount} cancelled superseded=${classified.supersededCancellationCount} unresolved=${classified.unresolvedCancellationCount}`,
  );
  for (const b of classified.failures) {
    console.log(
      `  FAIL ${b.conclusion} ${b.name} ${b.displayTitle || b.workflowName || ''} ${b.url || ''}`,
    );
  }
  for (const b of classified.supersededCancellations) {
    console.log(
      `  INFO cancelled superseded ${b.name} ${b.displayTitle || ''} ${b.url || ''}`,
    );
  }
  for (const b of classified.unresolvedCancellations) {
    console.log(
      `  WARN cancelled unresolved (${b.reason}) ${b.name} ${b.url || ''}`,
    );
  }

  const livePath = path.join(root, 'data', 'cio-live-builds.json');
  const live = JSON.parse(fs.readFileSync(livePath, 'utf8'));
  const entry = live.apps && live.apps['674'] ? live.apps['674'] : null;
  const liveBuild = entry?.build || '(unknown)';
  const liveRev = entry?.revision || '?';

  const status = sh('git status -sb');
  console.log('[cio:eod:github] git:', status.out.trim().split('\n')[0]);
  console.log(`[cio:eod:github] 674 live BUILD=${liveBuild} rev=${liveRev}`);

  if (classified.failureCount > 0 || classified.unresolvedCancellationCount > 0) {
    console.error('[cio:eod:github] NG — fix Actions failures');
    process.exit(1);
  }
  console.log('[cio:eod:github] OK — no recent Action failures');
}

main().catch((err) => {
  console.error(`[cio:eod:github] ${err.message}`);
  process.exit(1);
});
