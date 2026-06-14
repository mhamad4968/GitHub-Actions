#!/usr/bin/env node
/**
 * Git 履歴デグレード（先祖返り）永久防止監査（§50-3-11 第12層・拡張案2）
 * npm run verify:git-history-alignment [-- --handoff] [-- --structural]
 */
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runAlignmentAudit,
  printRegressionIssues,
  getCommitDetail,
  discoverGovernanceGenerationsFromGit,
  loadGuardManifest,
} from './lib/git-history-alignment.mjs';
import { isManifestGenerationsStale } from './lib/cio-governance-touch.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const handoff = process.argv.includes('--handoff');
const structural = process.argv.includes('--structural') || handoff;
const sinceIdx = process.argv.indexOf('--since');
const sinceHash = sinceIdx >= 0 ? String(process.argv[sinceIdx + 1] || '').trim() : '';

function main() {
  const audit = runAlignmentAudit(root, {
    generations: 3,
    checkSpec: !handoff,
    handoffMode: handoff,
    sinceHash: handoff ? sinceHash : undefined,
  });

  console.log(
    `[verify:git-history-alignment] generations=${audit.generations.join(',') || '(none)'} commands=${audit.constraints.commandCount}`,
  );

  if (handoff || structural) {
    for (const hash of audit.generations) {
      const d = getCommitDetail(root, hash);
      console.log(`  · ${hash} ${d.subject}`);
    }
  }

  if (!audit.ok) {
    printRegressionIssues(audit.issues, { handoffMode: handoff });
    process.exit(1);
  }

  if (handoff && audit.generations.length < 1) {
    console.error('[verify:git-history-alignment] NG --handoff 時は governance 世代が 1 件以上必要');
    process.exit(1);
  }

  if (!handoff) {
    if (isManifestGenerationsStale(root, discoverGovernanceGenerationsFromGit, loadGuardManifest)) {
      console.warn(
        '[verify:git-history-alignment] WARN manifest.generations が git 最新より古い — pre-commit/close-git が sync する（監査自体は git 最新世代をマージ済み）',
      );
      console.warn(
        '  手動: npm run sync:git-history-generations -- --apply && git add data/git-history-guard-manifest.json',
      );
    }
  }

  console.log('[verify:git-history-alignment] OK — 過去規律との矛盾なし');
  process.exit(0);
}

main();
