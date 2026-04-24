#!/usr/bin/env node
/**
 * task-log.mjs — §35-5 タスク予算化 + 実績計測（段階 2 / 2026-04-25 制定）
 *
 * 目的:
 *   30 分超のタスクの予測時間と実績時間を jsonl に蓄積し、
 *   個人別の見積バイアス（議論系 × 1.8 等）を見える化する。
 *
 * Usage:
 *   node scripts/task-log.mjs start --name "<title>" --budget <分> [--breakdown "design=15,impl=20,test=5"] [--note "<text>"]
 *     → logs/task-estimates.jsonl に開始レコード追記 / stdout に id 出力
 *
 *   node scripts/task-log.mjs end --id <id> [--actual <分>] [--lesson "<text>"]
 *     → 終了レコード追記 / 偏差を自動計算 / stdout にレポート
 *     --actual 省略時は started_at から now までの経過分を採用
 *
 *   node scripts/task-log.mjs summary [--last N]
 *     → 完了済タスク 直近 N 件 (default 10) の予測 vs 実績 + 平均偏差表示
 *
 *   node scripts/task-log.mjs list
 *     → start のみで end 未済の進行中タスク一覧
 *
 *   node scripts/task-log.mjs --help
 *
 * jsonl 形式 (append-only):
 *   {"type":"start","id":"...","name":"...","budget_min":40,"breakdown":{"design":15,...},"started_at":"ISO","note":"..."}
 *   {"type":"end","id":"...","actual_min":35,"diff_min":-5,"diff_pct":-12.5,"ended_at":"ISO","lesson":"..."}
 *
 * 違反検知:
 *   30 分超のタスクで start/end ログがない場合 §35 違反として §44 夕反省で記録 (本 script 範囲外)。
 *
 * 関連:
 *   AGENTS.md §35-5 (4/22 制定 / 段階 1 = 文言追記済 / 段階 2 = 本 script / 段階 3 = 朝 cron トレンド)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const LOG_DIR = path.join(REPO_ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'task-estimates.jsonl');

function ensureLogFile() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '', 'utf8');
}

function appendJsonl(obj) {
  ensureLogFile();
  fs.appendFileSync(LOG_FILE, JSON.stringify(obj) + '\n', 'utf8');
}

function readAll() {
  if (!fs.existsSync(LOG_FILE)) return [];
  const text = fs.readFileSync(LOG_FILE, 'utf8');
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function parseBreakdown(str) {
  if (!str) return null;
  const out = {};
  for (const part of str.split(',')) {
    const [k, v] = part.split('=').map((s) => s.trim());
    if (k && v && !Number.isNaN(Number(v))) out[k] = Number(v);
  }
  return Object.keys(out).length ? out : null;
}

function shortId() {
  return crypto.randomUUID().split('-')[0];
}

function isoNow() {
  return new Date().toISOString();
}

function diffMinutes(startIso, endIso) {
  return Math.round((new Date(endIso) - new Date(startIso)) / 60000);
}

function findStart(id) {
  return readAll().find((r) => r.type === 'start' && r.id === id);
}

function isEnded(id) {
  return readAll().some((r) => r.type === 'end' && r.id === id);
}

function printHelp() {
  console.log(`task-log.mjs — §35-5 タスク予算化 (段階 2)

Subcommands:
  start --name "<title>" --budget <min> [--breakdown "k=v,..."] [--note "<text>"]
  end   --id <id> [--actual <min>] [--lesson "<text>"]
  summary [--last <N>]
  list

Examples:
  node scripts/task-log.mjs start --name "B-1 task-log 段階2" --budget 40
  node scripts/task-log.mjs end --id ab12cd34 --lesson "設計より実装が早かった"
  node scripts/task-log.mjs summary --last 5
  node scripts/task-log.mjs list

Log file: logs/task-estimates.jsonl
`);
}

function cmdStart(opts) {
  const { name, budget, breakdown, note } = opts;
  if (!name || budget == null) {
    console.error('Error: start requires --name and --budget');
    process.exit(2);
  }
  const budgetNum = Number(budget);
  if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
    console.error(`Error: --budget must be positive number (got: ${budget})`);
    process.exit(2);
  }
  const id = shortId();
  const startedAt = isoNow();
  const rec = {
    type: 'start',
    id,
    name,
    budget_min: budgetNum,
    breakdown: parseBreakdown(breakdown),
    started_at: startedAt,
    note: note || null,
  };
  appendJsonl(rec);
  console.log(`✅ Task started: ${id}`);
  console.log(`   name        : ${name}`);
  console.log(`   budget      : ${budgetNum} min`);
  if (rec.breakdown) console.log(`   breakdown   : ${JSON.stringify(rec.breakdown)}`);
  console.log(`   started_at  : ${startedAt}`);
  console.log('');
  console.log(`To end:  node scripts/task-log.mjs end --id ${id} [--actual <min>] [--lesson "..."]`);
}

function cmdEnd(opts) {
  const { id, actual, lesson } = opts;
  if (!id) {
    console.error('Error: end requires --id');
    process.exit(2);
  }
  const start = findStart(id);
  if (!start) {
    console.error(`Error: no start record for id=${id}`);
    process.exit(2);
  }
  if (isEnded(id)) {
    console.error(`Error: id=${id} already ended`);
    process.exit(2);
  }
  const endedAt = isoNow();
  const actualMin = actual != null ? Number(actual) : diffMinutes(start.started_at, endedAt);
  if (!Number.isFinite(actualMin) || actualMin < 0) {
    console.error(`Error: --actual must be non-negative number (got: ${actual})`);
    process.exit(2);
  }
  const diffMin = actualMin - start.budget_min;
  const diffPct = start.budget_min > 0 ? Math.round((diffMin / start.budget_min) * 1000) / 10 : 0;
  const rec = {
    type: 'end',
    id,
    actual_min: actualMin,
    diff_min: diffMin,
    diff_pct: diffPct,
    ended_at: endedAt,
    lesson: lesson || null,
  };
  appendJsonl(rec);
  const sign = diffMin >= 0 ? '+' : '';
  console.log(`✅ Task ended: ${id}`);
  console.log(`   name        : ${start.name}`);
  console.log(`   budget      : ${start.budget_min} min`);
  console.log(`   actual      : ${actualMin} min`);
  console.log(`   diff        : ${sign}${diffMin} min (${sign}${diffPct}%)`);
  console.log(`   ended_at    : ${endedAt}`);
  if (lesson) console.log(`   lesson      : ${lesson}`);
}

function cmdSummary(opts) {
  const last = Number(opts.last || 10);
  const all = readAll();
  const ends = all.filter((r) => r.type === 'end');
  if (ends.length === 0) {
    console.log('完了済タスクなし。`start` → `end` で記録するとここに出ます。');
    return;
  }
  const recent = ends.slice(-last);
  console.log(`## タスク予測精度サマリ (直近 ${recent.length} / 全 ${ends.length} 件)`);
  console.log('');
  console.log('| id | name | 予測 | 実績 | 偏差 | % |');
  console.log('|---|---|---|---|---|---|');
  for (const e of recent) {
    const s = all.find((r) => r.type === 'start' && r.id === e.id);
    const name = s ? s.name : '(start 不明)';
    const budget = s ? s.budget_min : '-';
    const sign = e.diff_min >= 0 ? '+' : '';
    console.log(`| ${e.id} | ${name} | ${budget}m | ${e.actual_min}m | ${sign}${e.diff_min}m | ${sign}${e.diff_pct}% |`);
  }
  console.log('');
  const sum = recent.reduce((a, b) => a + b.diff_pct, 0);
  const avg = Math.round((sum / recent.length) * 10) / 10;
  const sign = avg >= 0 ? '+' : '';
  console.log(`**平均偏差**: ${sign}${avg}%`);
  if (avg > 25) console.log('→ 慢性的な過小評価。次回から budget を 1.3-1.5 倍にする検討を。');
  else if (avg < -25) console.log('→ 慢性的な過大評価。次回から budget を絞れる余地あり。');
  else console.log('→ 予測精度はおおむね健全（±25% 以内）。');
}

function cmdList() {
  const all = readAll();
  const ended = new Set(all.filter((r) => r.type === 'end').map((r) => r.id));
  const ongoing = all.filter((r) => r.type === 'start' && !ended.has(r.id));
  if (ongoing.length === 0) {
    console.log('進行中タスクなし。');
    return;
  }
  console.log(`## 進行中タスク (${ongoing.length} 件)`);
  console.log('');
  console.log('| id | name | budget | started_at | 経過 |');
  console.log('|---|---|---|---|---|');
  for (const s of ongoing) {
    const elapsed = diffMinutes(s.started_at, isoNow());
    const overBy = elapsed - s.budget_min;
    const status = overBy > 0 ? `**+${overBy}m 超過**` : `${elapsed}m`;
    console.log(`| ${s.id} | ${s.name} | ${s.budget_min}m | ${s.started_at} | ${status} |`);
  }
}

const args = process.argv.slice(2);
const sub = args[0];

if (!sub || sub === '--help' || sub === '-h') {
  printHelp();
  process.exit(0);
}

const optConfig = {
  name: { type: 'string' },
  budget: { type: 'string' },
  breakdown: { type: 'string' },
  note: { type: 'string' },
  id: { type: 'string' },
  actual: { type: 'string' },
  lesson: { type: 'string' },
  last: { type: 'string' },
};

let parsed;
try {
  parsed = parseArgs({ args: args.slice(1), options: optConfig, strict: false });
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(2);
}
const opts = parsed.values;

switch (sub) {
  case 'start':
    cmdStart(opts);
    break;
  case 'end':
    cmdEnd(opts);
    break;
  case 'summary':
    cmdSummary(opts);
    break;
  case 'list':
    cmdList();
    break;
  default:
    console.error(`Unknown subcommand: ${sub}`);
    printHelp();
    process.exit(2);
}
