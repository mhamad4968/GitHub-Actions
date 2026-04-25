#!/usr/bin/env node
/**
 * credit-budget.mjs — Cursor Ultra プランのクレジット予算管理
 *
 * §1-2-4 (2026-04-26 制定 / N-6) の実装スクリプト。
 * Cursor は公開課金 API を提供しないため、浜田が 1 日 1 回 % を貼付し
 * AI が予測・記録・警告するハイブリッド運用。
 *
 * サブコマンド:
 *   set <pct>          — 今日の消費 % を記録 (例: npm run credit:set 65)
 *   status             — 現在の状態を表示 (残日数 / 想定枯渇日 / 警告レベル)
 *   status --json      — JSON 出力 (daily-morning-prep.mjs で使用)
 *   reset --day=14     — 月次リセット日を設定 (浜田 Cursor 課金日)
 *   reset --now        — 今日を新月度開始日として履歴を append
 *
 * データ:
 *   data/credit-usage.json          — 当月の日次 % 履歴 + 設定
 *   data/credit-usage-history.jsonl — 月次集計の永続化
 *
 * 警告閾値 (§1-2-4):
 *   70% / 85% / 95% / 100%
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const DATA_DIR = path.join(REPO_ROOT, 'data');
const USAGE_FILE = path.join(DATA_DIR, 'credit-usage.json');
const HISTORY_FILE = path.join(DATA_DIR, 'credit-usage-history.jsonl');

const DEFAULT_STATE = {
  schema_version: 1,
  budget_usd_total: 530, // L1 $400 (Ultra 内) + L2 $130 (On-Demand cap)
  budget_usd_l1_credits: 400,
  budget_usd_l2_on_demand_cap: 130,
  reset_day: null, // 浜田が npm run credit:reset --day=14 で設定
  current_period_start: null, // ISO date
  daily_records: [], // [{date: 'YYYY-MM-DD', percent: number, recorded_at: ISO}]
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadState() {
  ensureDataDir();
  if (!fs.existsSync(USAGE_FILE)) return { ...DEFAULT_STATE };
  try {
    const raw = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    return { ...DEFAULT_STATE, ...raw };
  } catch (e) {
    console.error(`[credit-budget] WARN: ${USAGE_FILE} 読み込み失敗: ${e.message} / 初期化します`);
    return { ...DEFAULT_STATE };
  }
}

function saveState(state) {
  ensureDataDir();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * 次回課金日を計算 (reset_day = 14 → 今月 14 日 or 来月 14 日)
 */
function computeNextResetDate(resetDay, today = new Date()) {
  if (!resetDay) return null;
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  const thisMonth = new Date(d.getFullYear(), d.getMonth(), resetDay);
  if (d.getDate() < resetDay) {
    return thisMonth;
  }
  return new Date(d.getFullYear(), d.getMonth() + 1, resetDay);
}

/**
 * 現在の period 開始日を計算 (前回 reset_day から今日までの間)
 */
function computeCurrentPeriodStart(resetDay, today = new Date()) {
  if (!resetDay) return null;
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  if (d.getDate() >= resetDay) {
    return new Date(d.getFullYear(), d.getMonth(), resetDay);
  }
  return new Date(d.getFullYear(), d.getMonth() - 1, resetDay);
}

function daysBetween(a, b) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * 警告レベル (§1-2-4 閾値)
 */
function warningLevel(pct) {
  if (pct >= 100) return { level: 'critical', icon: '🔴', label: '100% 超過' };
  if (pct >= 95) return { level: 'critical', icon: '🟠', label: '95% 到達 / 重い作業要 GO' };
  if (pct >= 85) return { level: 'warn', icon: '🟡', label: '85% 到達 / On-Demand 移行検討' };
  if (pct >= 70) return { level: 'warn', icon: '🟡', label: '70% 到達 / Max Thinking タスクは要選択' };
  return { level: 'ok', icon: '🟢', label: 'OK / 通常運用継続' };
}

/**
 * 想定枯渇日を線形回帰で予測
 * 過去 7 日の (date_idx, percent) から傾き a を求め、100 % 到達日を逆算
 */
function predictExhaustionDate(records, currentPeriodStart) {
  if (!records || records.length < 2) return null;
  const start = currentPeriodStart ? new Date(currentPeriodStart) : new Date(records[0].date);
  const recent = records.slice(-7);
  const points = recent.map((r) => ({
    x: daysBetween(start, new Date(r.date)),
    y: r.percent,
  }));
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const a = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / n;
  if (a <= 0) return null;
  const xAt100 = (100 - b) / a;
  if (xAt100 < 0 || !Number.isFinite(xAt100)) return null;
  const predicted = new Date(start);
  predicted.setDate(predicted.getDate() + Math.round(xAt100));
  return predicted;
}

function cmdSet(pct) {
  if (Number.isNaN(pct) || pct < 0 || pct > 200) {
    console.error('[credit-budget] ❌ pct は 0-200 の範囲で指定してください');
    process.exit(1);
  }
  const state = loadState();
  if (state.reset_day && !state.current_period_start) {
    const start = computeCurrentPeriodStart(state.reset_day);
    if (start) state.current_period_start = start.toISOString().slice(0, 10);
  }
  const today = todayIso();
  const idx = state.daily_records.findIndex((r) => r.date === today);
  const rec = { date: today, percent: pct, recorded_at: nowIso() };
  if (idx >= 0) state.daily_records[idx] = rec;
  else state.daily_records.push(rec);
  state.daily_records.sort((a, b) => a.date.localeCompare(b.date));
  saveState(state);
  const w = warningLevel(pct);
  console.log(`[credit-budget] ✅ ${today} の消費を ${pct}% で記録 ${w.icon} ${w.label}`);
  if (w.level !== 'ok') {
    console.log('  → 詳細状態は: npm run credit:status');
  }
}

function cmdStatus(asJson = false) {
  const state = loadState();
  const records = state.daily_records || [];
  const latest = records[records.length - 1] || null;
  const pct = latest ? latest.percent : null;
  const w = pct !== null ? warningLevel(pct) : { level: 'unknown', icon: '⚪', label: '未記録 (npm run credit:set <pct> で初回記録を)' };
  const nextReset = state.reset_day ? computeNextResetDate(state.reset_day) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const remainingDays = nextReset ? daysBetween(today, nextReset) : null;
  const periodStart = state.current_period_start ? new Date(state.current_period_start) : (state.reset_day ? computeCurrentPeriodStart(state.reset_day) : null);
  const exhaustion = predictExhaustionDate(records, periodStart);
  const result = {
    latest_percent: pct,
    latest_date: latest ? latest.date : null,
    warning_level: w.level,
    warning_icon: w.icon,
    warning_label: w.label,
    budget_usd_total: state.budget_usd_total,
    budget_usd_l1_credits: state.budget_usd_l1_credits,
    budget_usd_l2_on_demand_cap: state.budget_usd_l2_on_demand_cap,
    reset_day: state.reset_day,
    next_reset_date: nextReset ? nextReset.toISOString().slice(0, 10) : null,
    remaining_days: remainingDays,
    current_period_start: periodStart ? (typeof periodStart === 'string' ? periodStart : periodStart.toISOString().slice(0, 10)) : null,
    predicted_exhaustion_date: exhaustion ? exhaustion.toISOString().slice(0, 10) : null,
    records_count: records.length,
    advice: deriveAdvice(w.level, pct, nextReset, exhaustion, today),
  };
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log('### Cursor Ultra クレジット予算 (§1-2-4)');
  console.log('');
  console.log(`- 直近消費: ${pct === null ? '未記録' : pct + '%'} (${latest ? latest.date : 'N/A'}) ${w.icon} ${w.label}`);
  console.log(`- 月予算: L1 $${state.budget_usd_l1_credits} (Ultra 内) + L2 $${state.budget_usd_l2_on_demand_cap} (On-Demand cap) = $${state.budget_usd_total}`);
  console.log(`- 課金日: ${state.reset_day ? `毎月 ${state.reset_day} 日` : '⚠️ 未設定 (npm run credit:reset --day=14 で設定)'}`);
  if (nextReset) console.log(`- 次回リセット: ${nextReset.toISOString().slice(0, 10)} (残 ${remainingDays} 日)`);
  if (exhaustion) console.log(`- 線形回帰予測 枯渇日: ${exhaustion.toISOString().slice(0, 10)} ${exhaustion < nextReset ? '⚠️ リセット日より前' : 'OK'}`);
  if (result.advice) console.log(`- AI 助言: ${result.advice}`);
  console.log(`- 履歴件数: ${records.length} 日分`);
}

function deriveAdvice(level, pct, nextReset, exhaustion, today) {
  if (pct === null) return '今日の消費 % を npm run credit:set <pct> で記録してください (1 日 1 回 / 30 秒)';
  if (level === 'critical' && pct >= 100) return '§1-2-2 4 択提示準備: A) On-Demand 継続 / B) 停止 / C) BYOK / D) その他';
  if (level === 'critical') return '95% 超過: 重い設計タスク・PC 台帳本番は要 GO。軽微作業のみ続行可';
  if (level === 'warn' && pct >= 85) return '本日中に On-Demand 移行 or タスク絞り込みを検討';
  if (level === 'warn') return 'Max Thinking タスクは §1-2-3 適用で Extra High に代替できないか検討';
  if (exhaustion && nextReset && exhaustion < nextReset) {
    const gap = daysBetween(exhaustion, nextReset);
    return `予測上 ${gap} 日早く枯渇する可能性 → §1-2-3 Extra High 既定運用を強化`;
  }
  return '通常運用継続 OK';
}

function cmdReset(args) {
  const state = loadState();
  const dayArg = args.find((a) => a.startsWith('--day='));
  const nowFlag = args.includes('--now');
  if (dayArg) {
    const day = parseInt(dayArg.split('=')[1], 10);
    if (Number.isNaN(day) || day < 1 || day > 28) {
      console.error('[credit-budget] ❌ --day= は 1-28 の範囲で指定してください (月末日依存を避けるため)');
      process.exit(1);
    }
    state.reset_day = day;
    const start = computeCurrentPeriodStart(day);
    state.current_period_start = start ? start.toISOString().slice(0, 10) : null;
    saveState(state);
    console.log(`[credit-budget] ✅ 課金日を毎月 ${day} 日に設定 / 当 period 開始: ${state.current_period_start}`);
    return;
  }
  if (nowFlag) {
    if (state.daily_records.length > 0) {
      const summary = {
        period_start: state.current_period_start,
        period_end: todayIso(),
        records: state.daily_records,
        peak_percent: Math.max(...state.daily_records.map((r) => r.percent)),
        final_percent: state.daily_records[state.daily_records.length - 1].percent,
        archived_at: nowIso(),
      };
      ensureDataDir();
      fs.appendFileSync(HISTORY_FILE, JSON.stringify(summary) + '\n', 'utf8');
      console.log(`[credit-budget] ✅ 月次集計を ${HISTORY_FILE} に append (${state.daily_records.length} 日分 / peak ${summary.peak_percent}%)`);
    }
    state.daily_records = [];
    state.current_period_start = todayIso();
    saveState(state);
    console.log(`[credit-budget] ✅ 当 period をリセット / 新 period 開始: ${state.current_period_start}`);
    return;
  }
  console.error('[credit-budget] ❌ --day=<1-28> または --now のいずれかを指定してください');
  process.exit(1);
}

function usage() {
  console.log(`credit-budget.mjs — Cursor Ultra クレジット予算管理 (§1-2-4)

使い方:
  npm run credit:set <pct>           今日の消費 % を記録 (0-200)
  npm run credit:status              現在の状態を表示
  npm run credit:status -- --json    JSON 出力 (朝報統合用)
  npm run credit:reset -- --day=14   課金日を毎月 14 日に設定
  npm run credit:reset -- --now      当 period をリセット (月次集計を history.jsonl に append)

データ:
  data/credit-usage.json          当月の日次履歴 + 設定
  data/credit-usage-history.jsonl 月次集計の永続化

警告閾値 (§1-2-4):
  70% / 85% / 95% / 100%
`);
}

const [, , cmd, ...rest] = process.argv;
switch (cmd) {
  case 'set':
    cmdSet(parseFloat(rest[0]));
    break;
  case 'status':
    cmdStatus(rest.includes('--json'));
    break;
  case 'reset':
    cmdReset(rest);
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    usage();
    break;
  default:
    console.error(`[credit-budget] ❌ unknown command: ${cmd}`);
    usage();
    process.exit(1);
}
