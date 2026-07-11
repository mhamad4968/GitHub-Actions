#!/usr/bin/env node
/**
 * §50-3-8 session audit — customize セッションの close-git 前（v3.2 B1）
 */
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { collect5038EvidenceFromLogs, read5038Stamp } from './lib/cio-four-ai-governance.mjs';
import { sessionTouchesCustomize } from './lib/cio-team-ops-git-scope.mjs';
import { shouldFailStrictWithout5038, validateSkipReason } from './lib/cio-team-ops-skip-quality.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  if (!sessionTouchesCustomize(root)) {
    console.log('[cio:guard:5038-session-audit] OK skip — customize/** 変更なし');
    process.exit(0);
  }

  const stamp = read5038Stamp(root);
  if (stamp?.mode === 'skip') {
    const v = validateSkipReason(stamp.skipReason);
    if (!v.ok) {
      console.error(`[cio:guard:5038-session-audit] NG skip 理由品質: ${v.message}`);
      process.exit(1);
    }
  }

  const evidence = collect5038EvidenceFromLogs(root);
  if (shouldFailStrictWithout5038(stamp, evidence)) {
    console.error('[cio:guard:5038-session-audit] NG customize セッションに §50-3-8 証跡なし');
    console.error('  → DeepSeek 実施 + npm run cio:guard:5038 -- --stamp');
    console.error('  → または --skip "20字以上の具体理由"');
    process.exit(1);
  }

  console.log('[cio:guard:5038-session-audit] OK §50-3-8 evidence for customize session');
  if (stamp?.stampedAt) console.log(`  stamp: ${stamp.stampedAt} mode=${stamp.mode}`);
  if (evidence.length) console.log(`  logs: ${evidence.join(', ')}`);
  process.exit(0);
}

main();
