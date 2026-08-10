#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectedMedalLine, readLastTier } from './lib/cio-turn-start-tier.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewerChoices = new Set(['deepseek', 'kimi', 'openrouter']);

function usage() {
  console.log(`Usage: node scripts/cio-report-draft.mjs --out <path> [options]

Options:
  --goal <text>                 Goal line (default: 要記入)
  --touch <text>                Touch line (default: 要記入)
  --spec-touched <yes|no>       Default: no
  --second-reviewer <name>      deepseek, kimi, or openrouter (default: deepseek)
  --force                       Permit overwriting --out
  --help                        Show this help`);
}

function parseArgs(argv) {
  const opts = {
    out: null,
    goal: '要記入',
    touch: '要記入',
    specTouched: 'no',
    secondReviewer: 'deepseek',
    force: false,
  };
  const valued = {
    '--out': 'out',
    '--goal': 'goal',
    '--touch': 'touch',
    '--spec-touched': 'specTouched',
    '--second-reviewer': 'secondReviewer',
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') return { help: true };
    if (argv[i] === '--force') {
      opts.force = true;
      continue;
    }
    const key = valued[argv[i]];
    if (!key || !argv[i + 1]) throw new Error(`unknown or incomplete argument: ${argv[i]}`);
    opts[key] = argv[++i];
  }
  if (!opts.out) throw new Error('--out <path> is required');
  if (!['yes', 'no'].includes(opts.specTouched)) {
    throw new Error('--spec-touched must be yes or no');
  }
  if (!reviewerChoices.has(opts.secondReviewer)) {
    throw new Error('--second-reviewer must be deepseek, kimi, or openrouter');
  }
  return opts;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[cio:report:draft] NG: ${error.message}`);
    usage();
    process.exit(1);
  }
  if (opts.help) {
    usage();
    return;
  }

  const outPath = path.isAbsolute(opts.out) ? opts.out : path.join(root, opts.out);
  if (fs.existsSync(outPath) && !opts.force) {
    console.error(`[cio:report:draft] NG: output exists; use --force to overwrite: ${outPath}`);
    process.exit(1);
  }
  const parent = path.dirname(outPath);
  if (!fs.existsSync(parent)) {
    console.error(`[cio:report:draft] NG: parent directory does not exist: ${parent}`);
    process.exit(1);
  }

  const baseline = fs
    .readFileSync(path.join(root, 'chat-sessions', 'CEO-MINIMUM-ABSOLUTE-BASELINE.txt'), 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const lane = readLastTier(root)?.lane || 'default';
  const medal = expectedMedalLine(lane);
  const reviewerLabel = {
    deepseek: 'DeepSeek',
    kimi: 'Kimi',
    openrouter: 'OpenRouter',
  }[opts.secondReviewer];

  const lines = [
    '[§1-2-3 ティア判定: L2]（根拠: 報告下書き）',
    '【適用憲法】AGENTS.md §1・§1c・§M-2（要記入: 実際の適用条項へ更新）',
    medal,
    '[ルール確認] docs/session-report-checklist.md / chat-sessions/CEO-MINIMUM-ABSOLUTE-BASELINE.txt Read 済み',
    '',
    `Goal: ${opts.goal}`,
    `Touch: ${opts.touch}`,
    `SPEC_TOUCHED: ${opts.specTouched}`,
    '',
    ...baseline,
    '',
    '> 下書きです。「要記入」と各レビュー行を実際の事実・証跡へ置換してから最終報告してください。',
    '',
    '□ A1 ダブルチェック（誰と・結果）誰=要記入／結果=要記入',
    `- 着手前ダブルチェック: ${reviewerLabel} — 要記入（依頼と回答の要旨）`,
    '- 検証締めダブルチェック: 要記入（実行コマンド・exit・突合結果）',
    `ダブルチェック要約: ${reviewerLabel} に確認予定・要記入`,
    '',
    '<!-- R4(2026-08-10) □A1 許容語彙サンプル（要約行に1語以上必須）: DeepSeek | Kimi | OpenRouter | 両名 | 第2者 | 非該当 | スキップ理由 | §50-3-8 | 着手前ダブルチェック | 検証締めダブルチェック -->',
    '<!-- 例: ダブルチェック要約: 第2者非該当（運用確認のみ）。／ダブルチェック要約: DeepSeek 短問→抜けなし -->',
    '',
    '【見直し1】事実・証跡: 要記入',
    '【見直し2】形式・ゲート: 要記入',
    '【見直し3】CEO 検収・再発: 要記入',
    '',
    '【セッション報告チェックシート】',
    'CHECKSHEET_VERSION: 2',
    'CHECKSHEET_OK: yes',
    `SECOND_REVIEWER: ${opts.secondReviewer}`,
    `SPEC_TOUCHED: ${opts.specTouched}`,
    'DESTRUCTIVE_OPS: none',
    'DRY_RUN_TO_APPLY_GAP: n/a',
    '',
  ];
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`[cio:report:draft] created ${outPath}`);
}

main();
