#!/usr/bin/env node

/**

 * R41–R48 夕反省改善インフラ整合検証

 */

import fs from 'node:fs';

import path from 'node:path';

import process from 'node:process';

import { fileURLToPath } from 'node:url';



const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');



const FILES = [

  'docs/approved-changes/2026-06-17-rules-r41-r48-vpn-evening-improvements-hamada-go.md',

  'docs/runbooks/kintone-ledger-v1-closure-checklist.md',

  'docs/runbooks/windows-governance-ops.md',

  'docs/plans/_TEMPLATE-kintone-ledger-spec.md',

  'scripts/lib/kintone-sync-dash-db-id.mjs',

  'scripts/lib/kintone-bundle-dash-with-sync.mjs',

  'scripts/lib/kintone-post-settings-record.mjs',

  'scripts/lib/cio-checkpoint-git-sync.mjs',

  'git-hooks/pre-push',

];



const MARKERS = {

  'git-hooks/pre-push': ['git rev-parse --show-toplevel', 'git-hook-pre-push.mjs'],

  'docs/runbooks/kintone-ledger-v1-closure-checklist.md': ['verify:checkpoint-project-closure', 'R41'],

  'docs/runbooks/windows-governance-ops.md': ['$LASTEXITCODE', 'hooks:install'],

  'docs/plans/_TEMPLATE-kintone-ledger-spec.md': ['§UI', 'APP_DB', 'R43'],

  'scripts/cio-pre-implement-gate.mjs': ['R47', '--project', 'APP_DB'],

  'scripts/cio-session-close-git.mjs': [
    'updateCheckpointGitHead',
    'skip-checkpoint-git-sync',
    'R44 parent',
    'syncCheckpointGitAfterPush',
  ],

};



function main() {

  const issues = [];

  for (const rel of FILES) {

    if (!fs.existsSync(path.join(root, rel))) issues.push(`missing: ${rel}`);

  }

  for (const [rel, needles] of Object.entries(MARKERS)) {

    const abs = path.join(root, rel);

    if (!fs.existsSync(abs)) continue;

    const text = fs.readFileSync(abs, 'utf8');

    for (const n of needles) {

      if (!text.includes(n)) issues.push(`${rel} missing marker: ${n}`);

    }

  }



  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  if (!pkg.scripts?.['verify:cio-r41-r48-infra']) {

    issues.push('package.json scripts.verify:cio-r41-r48-infra');

  }



  const gov = fs.readFileSync(path.join(root, 'docs/runbooks/cio-project-closure-governance.md'), 'utf8');

  if (!gov.includes('kintone-ledger-v1-closure-checklist.md')) {

    issues.push('cio-project-closure-governance.md に R41 checklist 未リンク');

  }



  if (issues.length) {

    console.error('[verify:cio-r41-r48-infra] NG', issues.length);

    for (const i of issues) console.error('  -', i);

    process.exit(1);

  }

  console.log('[verify:cio-r41-r48-infra] OK R41–R48 インフラ整合');

  process.exit(0);

}



main();

