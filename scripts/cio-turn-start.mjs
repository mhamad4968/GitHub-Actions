#!/usr/bin/env node
/**
 * 毎ターン開始ゲート（18 遵守・2026-05-30）
 * §1 四行テンプレ表示 + 着手前リマインド + tier quick/standard/strict/lite（v3.2 D）
 *
 * Usage:
 *   npm run cio:turn-start
 *   npm run cio:turn-start -- --lane doc-lane --strict
 *   npm run cio:turn-start -- --tier quick|standard|strict|lite
 *   npm run cio:turn-start -- --goal "現行レーンの本題"  # checkpoint 次の1手と違うとき（#O1）
 *   npm run cio:turn-start -- --complete   # セッション区切り（Desktop verify リマインド）
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { collect5038EvidenceFromLogs, read5038Stamp } from './lib/cio-four-ai-governance.mjs';
import { readCheckpointNextTask } from './lib/cio-checkpoint-read.mjs';
import { getDefaultBridgeNextFiles } from './lib/cio-handoff-template.mjs';
import { readTeamOpsFlags } from './lib/cio-team-ops-flags.mjs';
import {
  evaluateWarnEscalation,
  recordWarnEvent,
} from './lib/cio-team-ops-warn-escalation.mjs';
import {
  printContractForTier,
  recordLiteUsage,
  recordTurnStartEvent,
  resolveTier,
  resolveTurnStartGoal,
  validateTierGate,
  writeLastTier,
} from './lib/cio-turn-start-tier.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TEMPLATES = {
  default: [
    '[§1-2-3 ティア判定: L2] ガバナンス・是正',
    '【適用憲法】§1-2-3-4-A §50-3-8 §50-3-11',
    '[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=実装 | DeepSeek=§50-3-8 | Kimi=review',
    '[ルール確認] 18-重要確認.txt cio-18-zero-tolerance.mdc',
  ],
  'doc-lane': [
    '[§1-2-3 ティア判定: L2] ドキュメントレーン',
    '【適用憲法】§35-1 §50-3-11 §1-2-3-4-B',
    '[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=doc-lane | DeepSeek=§50-3-8 | Kimi=review',
    '[ルール確認] DOC_LANE_4AI.md cio-18-zero-tolerance.mdc',
  ],
  'doc-lane-lite': [
    '[§1-2-3 ティア判定: L1] doc-lane lite · 1 path · +≤20行（H8 · data/cio-doc-lane-lite-scope.json）',
    '【適用憲法】§1-2-3-2 L1 · §50-3-11',
    '[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=doc-lane | DeepSeek=未使用(lite) | Kimi=未使用',
    '[ルール確認] 27-constitution-navigation-charter.md · formalization-registry H8',
  ],
  report: [
    '[§1-2-3 ティア判定: L2] 報告・締め',
    '【適用憲法】§1-2-3 §50-3-8 CEO最低基準',
    '[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=— | DeepSeek=突合 | Kimi=review',
    '[ルール確認] docs/session-report-checklist.md §M-2',
  ],
};

function parseArgs(argv) {
  const out = { lane: 'default', strict: false, complete: false, tier: null, goal: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--lane' && argv[i + 1]) out.lane = argv[++i];
    else if (argv[i] === '--strict') out.strict = true;
    else if (argv[i] === '--complete') out.complete = true;
    else if (argv[i] === '--tier' && argv[i + 1]) out.tier = argv[++i];
    else if (argv[i] === '--goal' && argv[i + 1]) out.goal = argv[++i];
  }
  return out;
}

function inferSpecTouched(lane) {
  if (lane === 'doc-lane') return 'yes';
  if (lane === 'report') return 'no';
  return 'no';
}

function runNpm(script, extraArgs = []) {
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npm.cmd' : 'npm';
  return spawnSync(cmd, ['run', script, '--', ...extraArgs], {
    cwd: root,
    stdio: 'inherit',
    shell: isWin,
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const probeNoEvidence = process.env.CIO_TURN_START_PROBE_NO_EVIDENCE === '1';
  const flags = readTeamOpsFlags(process.env, root);
  const requestedTier = args.tier || (args.strict ? 'strict' : 'standard');
  if (String(requestedTier).toLowerCase() === 'quick') {
    const requestedGate = validateTierGate(root, 'quick', args.lane);
    if (!requestedGate.ok) {
      console.error(`[cio:turn-start] NG ${requestedGate.message}`);
      process.exit(requestedGate.exitCode || 2);
    }
  }
  const tier = resolveTier(requestedTier, root, flags);

  if ((tier === 'lite' || tier === 'micro') && !flags.liteLaneEnabled) {
    console.error('[cio:turn-start] NG Lite 無効（CIO_LITE_LANE=0）— standard/strict を使用');
    process.exit(2);
  }

  const gate = validateTierGate(root, tier, args.lane);
  if (!gate.ok) {
    console.error(`[cio:turn-start] NG ${gate.message}`);
    process.exit(gate.exitCode || 2);
  }

  const templateKey =
    tier === 'lite' && args.lane === 'doc-lane' ? 'doc-lane-lite' : args.lane;
  const lines = TEMPLATES[templateKey] || TEMPLATES.default;

  console.log('=== CIO ターン開始（18 遵守）===\n');
  console.log(`[tier: ${tier}]`);
  console.log('【§1 四行 — 応答先頭にこの順で貼付（欠落＝報告違反）】');
  for (const line of lines) console.log(line);
  console.log('');

  const resolvedGoal = resolveTurnStartGoal(readCheckpointNextTask(root), args.goal);
  const touchFiles = getDefaultBridgeNextFiles(root).slice(0, 2);
  const specTouched = inferSpecTouched(args.lane);
  printContractForTier(tier, resolvedGoal.goal, touchFiles, specTouched);
  console.log('[cio:turn-start] 注: checkpoint「次の1手」と現行レーンが違うときは --goal で Goal を上書き');
  if (resolvedGoal.overridden) {
    const from = String(resolvedGoal.checkpointGoal).slice(0, 80);
    const to = String(resolvedGoal.goal).slice(0, 80);
    console.log(`[cio:turn-start] Goal 上書き: checkpoint「${from}」→ 本題「${to}」`);
  }

  if (tier === 'lite') {
    recordLiteUsage(root, { lane: args.lane, tier: 'lite' });
    console.log('[cio:turn-start] Lite — §50-3-8 スキップ理由: L1 doc-only micro edit（customize 非接触）');
  }

  const evidence = probeNoEvidence ? [] : collect5038EvidenceFromLogs(root);
  const stamp = probeNoEvidence ? null : read5038Stamp(root);
  if (stamp?.stampedAt) {
    console.log(`[cio:turn-start] 5038 stamp: ${stamp.stampedAt}`);
  } else if (evidence.length) {
    console.log(`[cio:turn-start] 5038 evidence: ${evidence.join(', ')}`);
  } else {
    console.warn('[cio:turn-start] WARN: §50-3-8 証跡なし — 編集前に DeepSeek→突合→stamp');
    if (!probeNoEvidence) {
      recordWarnEvent(root, '5038-missing');
      const esc = evaluateWarnEscalation(root);
      if (esc.escalated) {
        console.warn('[cio:turn-start] WARN: 2セッション連続 WARN — 次回から strict 強制');
      }
    }
  }

  console.log('\n【編集・Shell 前】npm run cio:pre-implement-gate -- --strict');
  console.log('【報告・締め送信前】npm run cio:report-verify-response -- --file <下書き.md>');
  if (tier === 'quick') {
    console.log('\n【quick tier】Edit/Shell 禁止 — Read / verify / health のみ');
  }

  if (args.lane === 'doc-lane') {
    console.log('\n【doc-lane】npm run cio:doc-lane-gate -- --strict');
    const r = runNpm('cio:doc-lane-gate', args.strict ? ['--strict'] : []);
    if (args.strict && (r.status ?? 1) !== 0) process.exit(r.status ?? 2);
  }

  if (args.complete) {
    console.log('\n【セッション区切り】Desktop sync + verify');
    const s1 = runNpm('session-starter:sync-desktop');
    const s2 = runNpm('verify:desktop-ai-emergency-sync');
    if (args.strict && ((s1.status ?? 1) !== 0 || (s2.status ?? 1) !== 0)) {
      process.exit(2);
    }
  }

  const runbook = path.join(root, 'docs/runbooks/cio-18-violation-root-cause-2026-05-30.md');
  if (!fs.existsSync(runbook)) {
    console.error('[cio:turn-start] NG: root-cause runbook 欠落');
    if (args.strict) process.exit(2);
  }

  if ((args.strict || tier === 'strict') && !stamp?.stampedAt && evidence.length === 0) {
    console.error('[cio:turn-start] NG strict: 5038 証跡なし（編集前に DeepSeek 実施）');
    process.exit(2);
  }

  // #D-R63-01: Ver.02 deploy 後未 commit なら次作業を止める
  {
    const r63 = spawnSync(process.execPath, ['scripts/cio-guard-r63-v2-dirty.mjs'], {
      cwd: root,
      encoding: 'utf8',
    });
    if (r63.stdout) process.stdout.write(r63.stdout);
    if (r63.stderr) process.stderr.write(r63.stderr);
    if ((r63.status ?? 1) !== 0) {
      console.error('[cio:turn-start] NG #D-R63-01 R63 Ver.02 dirty after deploy');
      process.exit(r63.status ?? 2);
    }
  }

  if (!probeNoEvidence) {
    writeLastTier(root, { tier, lane: args.lane });
    recordTurnStartEvent(root, { tier, lane: args.lane });
  }

  console.log(`\n[cio:turn-start] OK tier=${tier} — ツール着手前に上記 §1 を応答先頭へ`);
  process.exit(0);
}

main();
