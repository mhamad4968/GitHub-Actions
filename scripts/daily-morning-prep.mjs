#!/usr/bin/env node
/**
 * daily-morning-prep.mjs
 *
 * 毎朝 06:00（WSL cron）に実行される「朝のブリーフィング」生成スクリプト。
 *
 * 実行内容:
 *   1. 環境ヘルス: npm run kintone:test
 *   2. 静的解析: npm run lint:customize
 *   3. セキュリティ: npm audit --omit=dev
 *   4. 依存最新性: npm outdated
 *   5. ルール整合性: scripts/audit-rules.mjs
 *   6. プラン進捗: scripts/scan-plans.mjs
 *   7. RAG 再 ingest（任意・失敗してもブリーフィングは続ける・TSB-037: Windows は extra-docs のみ短時間）
 *   7b. Z-3: 月初 JST のみ scripts/archive-reports.mjs で先月 docs/reports/*.md を archive/ へ
 *   8. ブリーフィング Markdown を docs/reports/<YYYY-MM-DD>-morning-prep.md に出力
 *   9. 失敗ログを logs/morning-prep/<YYYY-MM-DD>.log に保存
 *
 * 出口コード: 常に 0（cron で「失敗で連鎖停止」しないため。失敗はレポート内で表示）
 *
 * 設計方針:
 * - すべてのコマンドは個別に try/catch で隔離。1 つ落ちても他を続行
 * - 出力は朝7時にユーザーが見る前提で日本語、要点だけ
 * - レポート末尾に「今日の推奨スタート手順」を自動生成
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { maybeArchivePreviousMonth } from './archive-reports.mjs';
import {
  IS_WIN,
  jstYmdIso,
  runRepoShellCmd,
} from './lib/repo-node-env.mjs';
import { runMorningPrepRag } from './lib/morning-prep-rag.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const FAST = process.argv.includes('--fast') || process.env.MORNING_PREP_FAST === '1';

// ── ユーティリティ ──────────────────────────────────
const today = (() => {
  const iso = jstYmdIso();
  const jstNow = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const weekday = jstNow.find((p) => p.type === 'weekday')?.value ?? '???';
  const hour = jstNow.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = jstNow.find((p) => p.type === 'minute')?.value ?? '00';
  return {
    iso,
    label: `${iso} (${weekday}) ${hour}:${minute}`,
  };
})();

const REPORT_DIR = path.join(REPO_ROOT, 'docs', 'reports');
const LOG_DIR = path.join(REPO_ROOT, 'logs', 'morning-prep');
const REPORT_PATH = path.join(REPORT_DIR, `${today.iso}-morning-prep.md`);
const LOG_PATH = path.join(LOG_DIR, `${today.iso}.log`);

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

const logChunks = [];
function log(msg) {
  logChunks.push(`[${new Date().toISOString()}] ${msg}`);
}

function runCmd(label, cmd, opts = {}) {
  const t0 = Date.now();
  log(`▶ ${label}: ${cmd}`);
  console.log(`[daily-morning-prep] ▶ ${label} …`);
  const res = runRepoShellCmd(cmd, {
    cwd: REPO_ROOT,
    timeoutMs: opts.timeoutMs ?? 120_000,
    tz: 'Asia/Tokyo',
    env: { FORCE_COLOR: '0', NO_COLOR: '1' },
  });
  const stdout = (res.stdout || '').trim();
  const stderr = (res.stderr || '').trim();
  const ok = res.status === 0;
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`  exit=${res.status} stdout=${stdout.length}B stderr=${stderr.length}B platform=${IS_WIN ? 'win32' : process.platform} elapsed=${elapsed}s`);
  console.log(
    `[daily-morning-prep]   ${ok ? '✓' : res.status == null ? '⏱' : '✗'} ${label} (${elapsed}s)`,
  );
  return { ok, exit: res.status, stdout, stderr };
}

function fence(lang, body) {
  const safe = (body || '(出力なし)').slice(0, 4000);
  return `\`\`\`${lang}\n${safe}\n\`\`\``;
}

function summary(label, result, { ok = '✅', ng = '❌', limit = 20 } = {}) {
  const head = `### ${result.ok ? ok : ng} ${label}`;
  // stdout のみ先に拾うと、先頭が [ok] だけで stderr のスタックが落ちる（誤解を招く）ため、
  // 失敗時は stdout + stderr を結合してから切り詰める。
  let combined;
  if (result.ok) {
    combined = (result.stdout || result.stderr || '').trim();
  } else {
    combined = [result.stdout, result.stderr].filter(Boolean).join('\n---\n').trim();
  }
  const cap = result.ok ? limit : Math.max(limit, 40);
  const lines = combined.split('\n').slice(0, cap);
  return `${head}\n\n${fence('text', lines.join('\n'))}\n`;
}

// Z-3: docs/reports/ 先月分 archive（cron 失敗時も月初 1 回で完走させる。失敗しても朝報は続行）
try {
  const ar = maybeArchivePreviousMonth({ logger: log });
  if (ar.skipped) log(`archive-reports: skipped (${ar.reason || 'n/a'})`);
  else if (ar.dryRun) log(`archive-reports: dry-run files=${ar.moved}`);
  else log(`archive-reports: moved ${ar.moved} → ${ar.dest}${ar.commitAbbrev ? ` (${ar.commitAbbrev})` : ''}`);
} catch (e) {
  log(`archive-reports: ERROR ${e?.message || e}`);
}

// ── ステップ実行 ────────────────────────────────────
const sections = [];
sections.push(`# 🌅 朝のブリーフィング — ${today.label}`);
sections.push('');
sections.push(
  '> 本ファイルは `scripts/daily-morning-prep.mjs` が毎朝 06:00（**WSL cron**）または **Windows 上の `npm run morning:ensure`** で自動生成しています。'
);
sections.push('> AI エージェントは WORKFLOW.md §Phase 0 に従い、最初にこのファイルを読みます。');
if (FAST) {
  sections.push(
    '> **MORNING_PREP_MODE: fast** — セッション開始用短縮版（目安 1〜3 分）。フル版は WSL/cron 06:00 または `npm run morning:ensure`（`--fast` なし）。',
  );
} else {
  sections.push('> **MORNING_PREP_MODE: full** — 毎朝 cron / 手動フル生成。');
}
sections.push('');
sections.push('---');
sections.push('');

// 0. 昨夜承認分の自動実施（最優先）
// (#3 修正) self-exec 方式: apply で自身が更新された場合、最新版で再起動して反映を保証する
const SELF_RESTARTED = process.env.MORNING_PREP_RESTARTED === '1';
const APPLY_OUTPUT_INHERITED = process.env.APPLY_OUTPUT || '';
const myMtimeBefore = fs.statSync(__filename).mtimeMs;

let r0Output;
let r0Ok;
if (SELF_RESTARTED && APPLY_OUTPUT_INHERITED) {
  log('▲ self-restart 後: 前回の apply 出力を継承（再 apply は行わない）');
  r0Output = APPLY_OUTPUT_INHERITED;
  r0Ok = true;
} else {
  const r0 = runCmd('apply-approved-changes', 'node scripts/apply-approved-changes.mjs');
  r0Output = r0.stdout;
  r0Ok = r0.ok;

  const myMtimeAfter = fs.statSync(__filename).mtimeMs;
  if (myMtimeAfter > myMtimeBefore) {
    log('▲ self-restart 検知: daily-morning-prep.mjs が apply で更新されたため最新版で再起動');
    const restart = spawnSync('node', [__filename], {
      cwd: REPO_ROOT,
      timeout: 600_000,
      env: { ...process.env, MORNING_PREP_RESTARTED: '1', APPLY_OUTPUT: r0.stdout || '' },
      stdio: 'inherit',
    });
    process.exit(restart.status || 0);
  }
}
const r0 = { ok: r0Ok, stdout: r0Output, stderr: '', exit: r0Ok ? 0 : 1 };
sections.push(r0Output || '## 📋 昨夜承認分の自動実施結果\n\n_(出力なし)_');
sections.push('');
if (SELF_RESTARTED) {
  sections.push('> ℹ️ 本ブリーフィングは self-restart で生成されました（apply で daily-morning-prep.mjs が更新されたため最新版で再生成）。\n');
}
sections.push('---');
sections.push('');

// 0a. §1-2-4 Cursor Ultra クレジット予算ダッシュボード (N-6 / 2026-04-26 制定)
sections.push('## 0a. 💳 Cursor Ultra クレジット予算（§1-2-4）');
sections.push('');
const rCredit = runCmd('credit-budget', 'node scripts/credit-budget.mjs status --json', { timeoutMs: 5_000 });
let creditAdvice = null;
let creditWarn = null;
if (rCredit.ok && rCredit.stdout) {
  try {
    const c = JSON.parse(rCredit.stdout);
    sections.push(`- 直近消費: ${c.latest_percent === null ? '⚪ 未記録' : c.warning_icon + ' ' + c.latest_percent + '%'} (${c.latest_date || 'N/A'}) — ${c.warning_label}`);
    sections.push(`- 月予算: L1 $${c.budget_usd_l1_credits} (Ultra) + L2 $${c.budget_usd_l2_on_demand_cap} (On-Demand cap) = **$${c.budget_usd_total}**`);
    if (c.reset_day) {
      sections.push(`- 課金日: 毎月 ${c.reset_day} 日 / 次回リセット **${c.next_reset_date}** (残 **${c.remaining_days}** 日)`);
    } else {
      sections.push('- 課金日: ⚠️ **未設定** — 浜田 GO 後に `npm run credit:reset -- --day=<1-28>` で設定');
    }
    if (c.predicted_exhaustion_date) {
      const earlier = c.next_reset_date && c.predicted_exhaustion_date < c.next_reset_date;
      sections.push(`- 線形回帰予測 枯渇日: **${c.predicted_exhaustion_date}** ${earlier ? '⚠️ リセット日より前' : '✅ リセット日以降'}`);
    }
    if (c.advice) {
      sections.push(`- AI 助言: ${c.advice}`);
      creditAdvice = c.advice;
    }
    sections.push(`- 履歴件数: ${c.records_count} 日分`);
    if (c.stale_record && c.stale_nudge) {
      sections.push(`- 📣 **記録催促 (§1-2-4 / CEO 2026-06-15)**: ${c.stale_nudge}`);
    }
    if (c.warning_level === 'critical' || c.warning_level === 'warn') creditWarn = c;
  } catch (e) {
    sections.push(`- ⚠️ credit-budget JSON 解析エラー: ${e.message}`);
  }
} else {
  sections.push('- ⚠️ `npm run credit:status` 取得失敗');
}
sections.push('');
sections.push('> **3 日に 1 回**が妥当: Plan & Usage の Total% 1 行 or スクショ → CIO が `npm run credit:set <pct>` で記録');
sections.push('');
if (creditWarn) {
  sections.push(`> ${creditWarn.warning_icon} **AI 自発警告 (§1-2-4)**: ${creditWarn.warning_label}`);
  sections.push('');
}
sections.push('---');
sections.push('');

// 0b. §55 セーフモード + 前日 autonomy スキャン（E1 + E2 / 2026-04-25 浜田承認バッチ）
sections.push('## 0b. §55 セーフモード・前日自律ログ');
sections.push('');
const safePath = path.join(REPO_ROOT, '.session-state', 'safe-mode.json');
if (fs.existsSync(safePath)) {
  try {
    const raw = fs.readFileSync(safePath, 'utf8');
    const sm = JSON.parse(raw);
    if (sm.active === true) {
      sections.push(
        `- 🛡 **SAFE MODE 継続中** — reason: \`${String(sm.reason || '').slice(0, 120)}\` / since: ${sm.since || '(なし)'} / entered_by: ${sm.entered_by || '(なし)'}`
      );
    } else {
      sections.push('- §55: `safe-mode.json` あり → `active` は false（通常運用）');
    }
  } catch (e) {
    sections.push(`- ⚠ \`safe-mode.json\` 解析エラー: ${e.message}`);
  }
} else {
  sections.push('- §55: `safe-mode.json` なし（未発動または初回）');
}
sections.push('');
const rScan = runCmd('scan-autonomy-log', 'node scripts/scan-autonomy-log.mjs', { timeoutMs: 15_000 });
sections.push(rScan.stdout || '_(scan-autonomy-log 出力なし)_');
sections.push('');
sections.push('---');
sections.push('');

if (FAST) {
  sections.push('## 0c. checkpoint 先頭（cold-start 用ミラー）');
  sections.push('');
  const cpPath = path.join(REPO_ROOT, 'chat-sessions', 'checkpoint-latest.md');
  if (fs.existsSync(cpPath)) {
    const cpHead = fs.readFileSync(cpPath, 'utf8').split('\n').slice(0, 28).join('\n');
    sections.push(fence('markdown', cpHead));
  } else {
    sections.push('_checkpoint-latest.md 未検出_');
  }
  sections.push('');
  sections.push('---');
  sections.push('');
}

// 1. 環境ヘルス
sections.push('## 1. 環境ヘルス（kintone API 疎通）');
sections.push('');
const r1 = runCmd('kintone:test', 'npm run kintone:test --silent');
sections.push(summary('npm run kintone:test', r1));

// 2. ESLint
sections.push('## 2. 静的解析（ESLint）');
sections.push('');
const r2 = runCmd('lint:customize', 'npm run lint:customize --silent');
sections.push(summary('npm run lint:customize', r2));

// 3. npm audit
sections.push('## 3. セキュリティ（npm audit）');
sections.push('');
const r3 = runCmd('audit', 'npm audit --omit=dev --audit-level=moderate || true');
sections.push(summary('npm audit', r3));

// 4. npm outdated
let r4 = { ok: true, stdout: '', stderr: '', exit: 0 };
if (!FAST) {
  sections.push('## 4. 依存パッケージの最新性（npm outdated）');
  sections.push('');
  r4 = runCmd('outdated', 'npm outdated || true', { timeoutMs: 60_000 });
  const outdatedText = r4.stdout || '_すべて最新_';
  sections.push('```text');
  sections.push(outdatedText.split('\n').slice(0, 30).join('\n'));
  sections.push('```');
  sections.push('');
} else {
  sections.push('## 4. 依存パッケージの最新性（npm outdated）');
  sections.push('');
  sections.push('> ⏭ **fast スキップ** — フル朝報で確認');
  sections.push('');
}

// 5. ルール整合性
sections.push('## 5. ルール整合性（AGENTS.md ↔ RULES-INDEX.md / WORKFLOW.md）');
sections.push('');
const r5 = runCmd('audit-rules', 'node scripts/audit-rules.mjs');
sections.push(r5.stdout || '(出力なし)');
sections.push('');

// 5-2. TSB confirmed フラグ整合性 (F-2 5月目標 #2 監視 / H-1 で追加 2026-04-25)
sections.push('## 5-2. TSB confirmed フラグ整合性（F-2 5月目標 #2 監視）');
sections.push('');
const r5b = runCmd('audit-tsb-confirmed', 'node scripts/audit-tsb-confirmed.mjs');
sections.push(r5b.stdout || '(出力なし)');
sections.push('');

// 5-3. post-BREAKING 削除 復活検知 (TSB-016 改善案 #20 / I-1 で追加 2026-04-25)
sections.push('## 5-3. post-BREAKING 削除 復活検知（TSB-016 #20 = ゾンビ復活ガード）');
sections.push('');
const r5c = runCmd('verify-breaking-deletions', 'node scripts/verify-breaking-deletions.mjs --since=50');
sections.push(r5c.stdout || '(出力なし)');
sections.push('');

// 5-4. AGENTS.md ↔ RULES-INDEX.md 相互参照 drift (I-11 で追加 2026-04-25)
sections.push('## 5-4. AGENTS.md ↔ RULES-INDEX.md 相互参照 drift（索引漏れ + 死参照 検知）');
sections.push('');
const r5d = runCmd('audit-cross-references', 'node scripts/audit-cross-references.mjs');
sections.push(r5d.stdout || '(出力なし)');
sections.push('');

// 5-5. 憲法ファイル リアルタイム変更ログ (K-3 / 過去 24h)
// P3 改良 (2026-04-26): 朝報生成時刻と watcher 編集タイミングのずれによる「ログなし」誤表示を改善
//   - watcher プロセス稼働状態の同時表示
//   - 朝報生成時点で過去 24h 0 件でも、watcher 自体の健在性を明示
//   - watcher 健在 + 0 件 = 静穏 / watcher 不在 + 0 件 = ⚠️ 監視欠落
//   - JSON 出力にも生成時刻 + 当日中の最新 entry 時刻を追加
sections.push('## 5-5. 憲法ファイル リアルタイム変更ログ（過去 24h / K-3 / agents-md-changes.jsonl）');
sections.push('');
(() => {
  const jsonlPath = path.join(REPO_ROOT, 'logs', 'file-watcher', 'agents-md-changes.jsonl');
  const generatedAtJst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('Z', '+09:00');
  const cutoff = Date.now() - 24 * 3600 * 1000;
  // watcher プロセス稼働確認 (rule-watcher-status.mjs を呼び出し)
  let watcherStatus = 'unknown';
  try {
    const r = runCmd('rule-watcher-status', 'node scripts/rule-watcher-status.mjs', { timeoutMs: 3_000 });
    if (r.stdout && r.stdout.includes('WATCHER_STATUS=running')) watcherStatus = 'running';
    else if (r.stdout && r.stdout.includes('WATCHER_STATUS=stopped')) watcherStatus = 'stopped';
  } catch { /* keep unknown */ }
  const watcherIcon = watcherStatus === 'running' ? '🟢 稼働中' : (watcherStatus === 'stopped' ? '🔴 停止中' : '⚪ 不明');
  sections.push(`**watcher プロセス状態**: ${watcherIcon} (\`scripts/file-watcher.mjs\`)`);
  sections.push(`**朝報生成時刻**: ${generatedAtJst} (この時刻以降の編集は翌朝報で確認)`);
  sections.push('');
  if (!fs.existsSync(jsonlPath)) {
    sections.push('_ログなし（agents-md-changes.jsonl 未生成）。`npm run watcher:start` で K-3 監視を有効化。_');
    sections.push('');
    return;
  }
  let entries = [];
  let allEntries = [];
  try {
    const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const j = JSON.parse(line);
        const t = new Date(j.time).getTime();
        if (Number.isNaN(t)) continue;
        allEntries.push({ ...j, _ts: t });
        if (t >= cutoff) entries.push(j);
      } catch { /* skip */ }
    }
  } catch {
    sections.push('_jsonl 読取失敗_');
    sections.push('');
    return;
  }
  sections.push(`**過去 24h の SHA256 変化イベント: ${entries.length} 件** (jsonl 全件: ${allEntries.length})`);
  if (allEntries.length > 0) {
    const latest = allEntries[allEntries.length - 1];
    const latestJst = new Date(latest._ts + 9 * 3600 * 1000).toISOString().replace('Z', '+09:00');
    sections.push(`**jsonl 最新 entry**: ${latestJst} \`${latest.file}\``);
  }
  sections.push('');
  if (entries.length === 0 && watcherStatus === 'running') {
    sections.push('_該当なし（静穏 / watcher 健在なので過去 24h に憲法ファイル変更が無かったことを示す）_');
  } else if (entries.length === 0 && watcherStatus !== 'running') {
    sections.push('_⚠️ 該当なし + watcher も停止 = 監視欠落の可能性。`npm run watcher:start` で再開を_');
  } else {
    const tail = entries.slice(-8);
    sections.push('| 時刻 (JST) | ファイル | grace | sha256 (先頭) |');
    sections.push('|---|---|:---:|---|');
    for (const e of tail) {
      const tJst = new Date(new Date(e.time).getTime() + 9 * 3600 * 1000).toISOString().replace('Z', '+09:00');
      const g = e.in_grace ? '起動直後' : '—';
      const sh = (e.sha256 || '').slice(0, 12);
      sections.push(`| ${tJst} | \`${e.file || ''}\` | ${g} | \`${sh}\` |`);
    }
    // 重複ファイル多発 (= 同一ファイル 5+ 件) 検知
    const fileCount = {};
    for (const e of entries) fileCount[e.file] = (fileCount[e.file] || 0) + 1;
    const heavy = Object.entries(fileCount).filter(([, n]) => n >= 5);
    if (heavy.length > 0) {
      sections.push('');
      sections.push(`**⚠️ 24h 内に 5 件以上編集されたファイル**: ${heavy.map(([f, n]) => `\`${f}\` (${n})`).join(' / ')} → 並列セッション混入の可能性チェック推奨`);
    }
  }
  sections.push('');
  if (!FAST) {
    // P4 統合 (2026-04-26): §51-4 並列セッション疑い 4 軸機械判定
    sections.push('### §51-4 並列セッション疑い判定（P4 / parallel-session-detector）');
    sections.push('');
    try {
      const r = runCmd('parallel-detector', 'node scripts/parallel-session-detector.mjs --json', { timeoutMs: 5_000 });
      if (r.stdout) {
        const j = JSON.parse(r.stdout);
        sections.push(`**総合スコア**: ${j.score_total} 点 / ${j.verdict_icon} ${j.verdict_label}`);
        sections.push('');
        sections.push('| 軸 | スコア | 内訳（要約） |');
        sections.push('|---|---:|---|');
        const ab = j.axis_breakdown;
        const summary = (e) => (Array.isArray(e) ? e.join(' / ').slice(0, 100) : '');
        sections.push(`| 軸1: watcher_pid 不一致 | ${ab.axis1_watcher_pid_mismatch.score} | ${summary(ab.axis1_watcher_pid_mismatch.evidence)} |`);
        sections.push(`| 軸2: 過密編集 | ${ab.axis2_burst_edit.score} | ${summary(ab.axis2_burst_edit.evidence) || '該当なし'} |`);
        sections.push(`| 軸3: lock 不在 | ${ab.axis3_no_lock.score} | ${summary(ab.axis3_no_lock.evidence)} |`);
        sections.push(`| 軸4: 不審バックアップ | ${ab.axis4_suspicious_backup.score} | ${summary(ab.axis4_suspicious_backup.evidence)} |`);
        if (j.snapshot_saved_to) {
          sections.push('');
          sections.push(`**🔴 スナップショット**: \`${j.snapshot_saved_to}\``);
        }
      } else {
        sections.push('_detector 実行エラー（朝報生成は継続）_');
      }
    } catch (e) {
      sections.push(`_detector 統合エラー: ${e.message}_`);
    }
    sections.push('');
  } else {
    sections.push('> ⏭ **fast**: §51-4 parallel-detector はスキップ（`npm run audit:parallel` で手動可）');
    sections.push('');
  }
})();

// 6. プラン進捗
let r6 = { ok: true, stdout: '', stderr: '', exit: 0 };
if (!FAST) {
  sections.push('## 6. 未完了プラン抽出（docs/plans/*.md）');
  sections.push('');
  r6 = runCmd('scan-plans', 'node scripts/scan-plans.mjs');
  sections.push(r6.stdout || '_該当なし_');
  sections.push('');
} else {
  sections.push('## 6. 未完了プラン抽出（docs/plans/*.md）');
  sections.push('');
  sections.push('> ⏭ **fast スキップ**');
  sections.push('');
}

// 7. RAG 再 ingest（任意）
let r7 = { ok: true, stdout: '', stderr: '', exit: 0 };
let rag = { ok: true, fullDocs: false, ragHasInnerError: false };
if (!FAST) {
  sections.push('## 7. RAG 知識ベース更新');
  sections.push('');
  rag = runMorningPrepRag(runCmd, log);
  r7 = {
    ok: rag.ok,
    stdout: [rag.rMirror.stdout, rag.rExtra.stdout, rag.rDocs.stdout].filter(Boolean).join('\n---\n'),
    stderr: [rag.rMirror.stderr, rag.rExtra.stderr, rag.rDocs.stderr].filter(Boolean).join('\n'),
    exit: rag.ok ? 0 : 1,
  };
  if (!rag.fullDocs) {
    sections.push(
      `> ℹ️ **docs/ 全件 ingest**: ${IS_WIN ? 'Windows 既定でスキップ' : 'スキップ'}（WSL cron 06:00 がフル正本。手動フルは \`MORNING_PREP_RAG_DOCS=1 npm run morning:ensure\`）\n`,
    );
  }
  if (IS_WIN && !process.env.MORNING_PREP_RAG_INGEST) {
    sections.push(
      '> ℹ️ **Windows RAG ingest**: 既定は **ミラーのみ**（数秒）。DB 反映は WSL cron 06:00。午後に ingest する場合は `MORNING_PREP_RAG_INGEST=1 npm run morning:ensure`\n',
    );
  }
  sections.push(summary('RAG ingest', r7, { ok: '✅', ng: '⚠️', limit: 12 }));
  if (rag.ragHasInnerError) {
    sections.push('> ⚠ 内側エラー検知: stdout/stderr に `Error/ERR_/Exception` を含むためヘルススコアを失敗扱いに降格しました。\n');
  }
} else {
  sections.push('## 7. RAG 知識ベース更新');
  sections.push('');
  sections.push('> ⏭ **fast スキップ** — ミラー/ingest は cron または `MORNING_PREP_RAG_INGEST=1`');
  sections.push('');
}

// §46 Phase 2-4
let rPhase2 = { ok: true, stdout: '', stderr: '', exit: 0 };
let rPhase3 = { ok: true, stdout: '', stderr: '', exit: 0 };
let rPhase4 = { ok: true, stdout: '', stderr: '', exit: 0 };
if (!FAST) {
  sections.push('---');
  sections.push('');
  sections.push('# 🌅 §46 朝ルーチン Phase 2-4');
  sections.push('');
  sections.push('> §46 により Phase 2-4 は SKYSEA 等のいかなるタスクよりも先に実行する。異常検出時はここで解消するまで他タスクへ進まない。');
  sections.push('');

  rPhase2 = runCmd('phase2 health-check', 'node scripts/health-check.mjs', { timeoutMs: 180_000 });
  sections.push(rPhase2.stdout || '## 🩺 Phase 2: 健康状況チェック\n\n_(出力なし)_');
  sections.push('');

  rPhase3 = runCmd('phase3 auto-heal', 'node scripts/auto-heal.mjs', { timeoutMs: 300_000 });
  sections.push(rPhase3.stdout || '## 🔧 Phase 3: 自動治療\n\n_(出力なし)_');
  sections.push('');

  rPhase4 = runCmd('phase4 version-up', 'node scripts/version-up.mjs', { timeoutMs: 120_000 });
  sections.push(rPhase4.stdout || '## 📦 Phase 4: バージョンアップ対応\n\n_(出力なし)_');
  sections.push('');
  sections.push('---');
  sections.push('');
} else {
  sections.push('---');
  sections.push('');
  sections.push('# 🌅 §46 朝ルーチン Phase 2-4');
  sections.push('');
  sections.push('> ⏭ **fast スキップ** — `npm run health-check` / `npm run morning:ensure`（フル）で §46 完走');
  sections.push('');
  sections.push('---');
  sections.push('');
}

// ========================================
// S1+S4 (2026-04-20): 自動防衛網ログ集約
// file-watcher / wipe-guard が記録した wipe 検知 + 復元結果を表示
// ========================================
sections.push('## 🛡 自動防衛網ログ（前日からの活動）');
sections.push('');

const fwLog = path.join(REPO_ROOT, 'logs', 'file-watcher', 'wipe-incidents.log');
const wgNotify = path.join(REPO_ROOT, 'logs', 'wipe-guard', 'notify.log');

const tailLog = (filePath, n) => {
  if (!fs.existsSync(filePath)) return null;
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length === 0) return '';
    return lines.slice(-n).join('\n');
  } catch (_) { return null; }
};

const fwTail = tailLog(fwLog, 10);
const wgTail = tailLog(wgNotify, 10);

if (!fwTail && !wgTail) {
  sections.push('✅ **前日からの wipe 検知ゼロ**（防衛網は静かに稼働中）');
} else {
  if (fwTail !== null) {
    sections.push('### file-watcher wipe-incidents.log（直近 10 行）');
    sections.push('');
    sections.push('```text');
    sections.push(fwTail || '(空・検知ゼロ)');
    sections.push('```');
    sections.push('');
  }
  if (wgTail !== null) {
    sections.push('### wipe-guard notify.log（直近 10 行）');
    sections.push('');
    sections.push('```text');
    sections.push(wgTail || '(空・検知ゼロ)');
    sections.push('```');
    sections.push('');
  }
}
sections.push('---');
sections.push('');

// 8. kintone-apps.md 直近変更
sections.push('## 8. kintone-apps.md 直近の更新履歴（末尾 5 行）');
sections.push('');
const r8 = runCmd('kintone-apps tail', "tail -n 50 kintone-apps.md | grep -E '^\\| 20' | tail -n 5");
sections.push('```text');
sections.push(r8.stdout || '(履歴未抽出)');
sections.push('```');
sections.push('');

// ── 推奨スタート手順を計画ファイルから自動推論 ──
sections.push('---');
sections.push('');
sections.push('## 🚀 今日の推奨スタート手順');
sections.push('');

// (#R3) 時刻指定タスクを最優先で抽出
const TIME_PATTERNS = [
  /明日\s*\d{1,2}[:：時]/,
  /翌日\s*\d{1,2}[:：時]/,
  /\b\d{1,2}[:：]\d{2}\s*(?:JST|から|開始|から開始)/,
  /\b\d{1,2}\s*時(?:から|開始)/,
  /開始予定[:：]/,
  /⚡\s*開始予定/,
];
const timedTasks = (() => {
  const dir = path.join(REPO_ROOT, 'docs', 'plans');
  if (!fs.existsSync(dir)) return [];
  const hits = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const full = path.join(dir, f);
    const text = fs.readFileSync(full, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (TIME_PATTERNS.some((re) => re.test(line))) {
        hits.push({ file: f, line: idx + 1, text: line.trim().slice(0, 200) });
      }
    });
  }
  return hits.slice(0, 10);
})();

if (timedTasks.length > 0) {
  sections.push('### ⚡ 時刻指定タスク（最優先）');
  sections.push('');
  for (const t of timedTasks) sections.push(`- \`${t.file}\` L${t.line}: ${t.text}`);
  sections.push('');
}

const planList = (() => {
  try {
    const dir = path.join(REPO_ROOT, 'docs', 'plans');
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({
        name: f,
        full: path.join(dir, f),
        mtime: fs.statSync(path.join(dir, f)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 3);
  } catch {
    return [];
  }
})();

if (planList.length === 0) {
  sections.push('_進行中の計画ファイルなし。新しい依頼を待機中です。_');
} else {
  sections.push('### 直近の計画ファイル（3 件）');
  sections.push('');
  for (const p of planList) {
    const rel = path.relative(REPO_ROOT, p.full);
    const dt = p.mtime.toISOString().slice(0, 16).replace('T', ' ');
    sections.push(`- \`${rel}\` （更新: ${dt}）`);
  }
  sections.push('');
  sections.push('**AI への指示例**:');
  sections.push('```');
  sections.push(`「${planList[0].name} の続きを進めて」`);
  sections.push('```');
}

sections.push('');
sections.push('---');
sections.push('');
sections.push('## 🔍 ヘルススコア');
sections.push('');
const score = [
  ['apply-approved-changes', r0.ok],
  ['kintone:test', r1.ok],
  ['lint:customize', r2.ok],
  ['npm audit', r3.exit === 0],
  ['audit-rules', r5.ok],
  ['audit-tsb-confirmed', r5b.ok],
  ['verify-breaking-deletions', r5c.ok],
  ['audit-cross-references', r5d.ok],
];
if (!FAST) {
  score.push(
    ['npm outdated', r4.ok],
    ['scan-plans', r6.ok],
    ['RAG ingest', r7.ok],
    ['§46 Phase 2 health-check', rPhase2.ok],
    ['§46 Phase 3 auto-heal', rPhase3.ok],
    ['§46 Phase 4 version-up', rPhase4.ok],
  );
} else {
  score.push(['fast-mode skips', true]);
}
const passed = score.filter(([, ok]) => ok).length;
sections.push(`**${passed} / ${score.length} 合格**`);
sections.push('');
for (const [name, ok] of score) {
  sections.push(`- ${ok ? '✅' : '❌'} ${name}`);
}
sections.push('');

// ── 書き出し ────────────────────────────────────────
fs.writeFileSync(REPORT_PATH, sections.join('\n'), 'utf8');
fs.writeFileSync(LOG_PATH, logChunks.join('\n'), 'utf8');

console.log(`✅ ブリーフィング生成完了: ${path.relative(REPO_ROOT, REPORT_PATH)}`);
console.log(`📝 ログ: ${path.relative(REPO_ROOT, LOG_PATH)}`);
console.log(`📊 ヘルススコア: ${passed}/${score.length}`);
if (FAST) {
  console.log('[daily-morning-prep] MORNING_PREP_MODE=fast');
  if (!r1.ok || !r2.ok) {
    console.error('[daily-morning-prep] fast: kintone:test または lint:customize 失敗 — exit 2');
    process.exit(2);
  }
}

process.exit(0);
