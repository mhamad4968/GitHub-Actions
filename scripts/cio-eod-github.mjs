#!/usr/bin/env node
/**
 * EOD: GitHub Actions 直近失敗有無 + 674 live BUILD 一致
 *
 *   npm run cio:eod:github
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failed = 0;

function sh(cmd) {
  const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8' });
  return { status: r.status ?? 1, out: (r.stdout || '') + (r.stderr || '') };
}

const runs = sh(
  'gh run list --limit 30 --json conclusion,name,displayTitle,url,createdAt',
);
if (runs.status !== 0) {
  console.error('[cio:eod:github] gh run list failed');
  console.error(runs.out.slice(0, 400));
  process.exit(1);
}

let list = [];
try {
  list = JSON.parse(runs.out.trim().split('\n').filter(Boolean).pop() || runs.out);
} catch {
  // gh may mix warnings; try find JSON array
  const m = runs.out.match(/\[[\s\S]*\]/);
  if (m) list = JSON.parse(m[0]);
  else {
    console.error('[cio:eod:github] cannot parse gh JSON');
    process.exit(1);
  }
}

const bad = list.filter(
  (x) => x.conclusion && x.conclusion !== 'success' && x.conclusion !== 'skipped',
);
console.log(`[cio:eod:github] recent runs=${list.length} failures=${bad.length}`);
for (const b of bad) {
  console.log(`  FAIL ${b.conclusion} ${b.name} ${b.displayTitle} ${b.url || ''}`);
  failed++;
}

const livePath = path.join(root, 'data', 'cio-live-builds.json');
const live = JSON.parse(fs.readFileSync(livePath, 'utf8'));
const entry = live.apps && live.apps['674'] ? live.apps['674'] : null;
const liveBuild = entry?.build || '(unknown)';
const liveRev = entry?.revision || '?';

const status = sh('git status -sb');
console.log('[cio:eod:github] git:', status.out.trim().split('\n')[0]);
console.log(`[cio:eod:github] 674 live BUILD=${liveBuild} rev=${liveRev}`);

if (failed) {
  console.error('[cio:eod:github] NG — fix Actions failures');
  process.exit(1);
}
console.log('[cio:eod:github] OK — no recent Action failures');
