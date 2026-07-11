#!/usr/bin/env node
/**
 * タスクB — §50-3-8 証跡ゲート（仕様触れ編集・deploy/commit 前）
 * @see .cursor/rules/deepseek-cursor-spec-division.mdc
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  collect5038EvidenceFromLogs,
  emitInterlockFailure,
  evidence5038Path,
  has5038EvidenceInText,
  isSpecTouchPath,
  listStagedSpecPaths,
  read5038Stamp,
  write5038Stamp,
} from './lib/cio-four-ai-governance.mjs';
import { validateSkipReason } from './lib/cio-team-ops-skip-quality.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_AGE_MS = 45 * 60 * 1000;

function stampFresh(stamp) {
  if (!stamp?.stampedAt) return false;
  const t = Date.parse(stamp.stampedAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= MAX_AGE_MS;
}

function main() {
  if (process.env.SKIP_CIO_MODE_B_INTERLOCK === '1') {
    console.warn('[cio-deepseek-5038-evidence-guard] SKIP_CIO_MODE_B_INTERLOCK=1');
    process.exit(0);
  }

  const args = process.argv.slice(2);

  if (args.includes('--stamp')) {
    const textIdx = args.indexOf('--text');
    const skipIdx = args.indexOf('--skip');
    const skipReason = skipIdx >= 0 ? args[skipIdx + 1] : '';
    if (skipIdx >= 0) {
      const v = validateSkipReason(skipReason);
      if (!v.ok) {
        console.error(`[cio-deepseek-5038-evidence-guard] NG skip 理由品質: ${v.message}`);
        process.exit(1);
      }
    }
    const payload = {
      mode: skipIdx >= 0 ? 'skip' : 'deepseek',
      text: textIdx >= 0 ? args[textIdx + 1] : '',
      skipReason,
      note: 'CIO stamped via npm run cio:guard:5038 -- --stamp',
    };
    write5038Stamp(root, payload);
    console.log(`[cio-deepseek-5038-evidence-guard] stamped → ${evidence5038Path(root)}`);
    process.exit(0);
  }

  const staged = args.includes('--staged') ? listStagedSpecPaths(root) : [];
  const pathsArg = args.includes('--paths');
  let explicitPaths = [];
  if (pathsArg) {
    const i = args.indexOf('--paths');
    explicitPaths = args.slice(i + 1).filter((p) => !p.startsWith('--'));
  }

  const touchPaths = [...new Set([...staged, ...explicitPaths.filter(isSpecTouchPath)])];
  if (touchPaths.length === 0 && !args.includes('--force-check')) {
    console.log('[cio-deepseek-5038-evidence-guard] OK (no spec-touch paths in scope)');
    process.exit(0);
  }

  const logSources = collect5038EvidenceFromLogs(root);
  const stamp = read5038Stamp(root);
  const stampOk = stampFresh(stamp) && (stamp?.text || stamp?.skipReason || stamp?.mode);

  if (logSources.length > 0 || stampOk) {
    console.log('[cio-deepseek-5038-evidence-guard] OK §50-3-8 evidence present');
    if (logSources.length) console.log(`  logs: ${logSources.join(', ')}`);
    if (stampOk) console.log(`  stamp: ${stamp.stampedAt} mode=${stamp.mode}`);
    process.exit(0);
  }

  console.error('[cio-deepseek-5038-evidence-guard] NG §50-3-8 evidence missing');
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.error(
      '  GHA: 定期 REST のみなら npm run 682:graph-monthly:gha（または cio-gha-periodic-5038-stamp 後に guard）',
    );
    console.error('  正本: docs/runbooks/cio-gha-periodic-5038-stamp.md');
  }
  if (touchPaths.length) {
    console.error(`  spec-touch paths: ${touchPaths.join(', ')}`);
  }
  emitInterlockFailure(
    '§50-3-8 未実施',
    'DeepSeek へ盲点3点＋約3行突合メモ（または §50-3-8 スキップ理由: 具体）をチャットに残し、npm run cio:guard:5038 -- --stamp --text "…" または --skip "理由"',
  );
  process.exit(1);
}

main();
