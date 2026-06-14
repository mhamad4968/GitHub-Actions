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
  getGovernanceGenerations,
  getCommitDetail,
} from './lib/git-history-alignment.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const handoff = process.argv.includes('--handoff');
const structural = process.argv.includes('--structural') || handoff;

function main() {
  const audit = runAlignmentAudit(root, { generations: 3, checkSpec: true });

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
    printRegressionIssues(audit.issues);
    process.exit(1);
  }

  if (handoff && audit.generations.length < 1) {
    console.error('[verify:git-history-alignment] NG --handoff 時は governance 世代が 1 件以上必要');
    process.exit(1);
  }

  console.log('[verify:git-history-alignment] OK — 過去規律との矛盾なし');
  process.exit(0);
}

main();
