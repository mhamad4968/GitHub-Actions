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
 *   7. RAG 再 ingest（任意・失敗してもブリーフィングは続ける）
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
import { execSync, spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// ── ユーティリティ ──────────────────────────────────
const today = (() => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    iso: `${yyyy}-${mm}-${dd}`,
    label: `${yyyy}-${mm}-${dd} (${days[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
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
  log(`▶ ${label}: ${cmd}`);
  const res = spawnSync('bash', ['-lc', cmd], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: opts.timeoutMs ?? 120_000,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  });
  const stdout = (res.stdout || '').trim();
  const stderr = (res.stderr || '').trim();
  const ok = res.status === 0;
  log(`  exit=${res.status} stdout=${stdout.length}B stderr=${stderr.length}B`);
  return { ok, exit: res.status, stdout, stderr };
}

function fence(lang, body) {
  const safe = (body || '(出力なし)').slice(0, 4000);
  return `\`\`\`${lang}\n${safe}\n\`\`\``;
}

function summary(label, result, { ok = '✅', ng = '❌', limit = 20 } = {}) {
  const head = `### ${result.ok ? ok : ng} ${label}`;
  const lines = (result.stdout || result.stderr || '').split('\n').slice(0, limit);
  return `${head}\n\n${fence('text', lines.join('\n'))}\n`;
}

// ── ステップ実行 ────────────────────────────────────
const sections = [];
sections.push(`# 🌅 朝のブリーフィング — ${today.label}`);
sections.push('');
sections.push(
  '> 本ファイルは `scripts/daily-morning-prep.mjs` が毎朝 06:00（WSL cron）に自動生成しています。'
);
sections.push('> AI エージェントは WORKFLOW.md §Phase 0 に従い、最初にこのファイルを読みます。');
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
sections.push('## 4. 依存パッケージの最新性（npm outdated）');
sections.push('');
const r4 = runCmd('outdated', 'npm outdated || true', { timeoutMs: 60_000 });
const outdatedText = r4.stdout || '_すべて最新_';
sections.push('```text');
sections.push(outdatedText.split('\n').slice(0, 30).join('\n'));
sections.push('```');
sections.push('');

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

// 6. プラン進捗
sections.push('## 6. 未完了プラン抽出（docs/plans/*.md）');
sections.push('');
const r6 = runCmd('scan-plans', 'node scripts/scan-plans.mjs');
sections.push(r6.stdout || '_該当なし_');
sections.push('');

// 7. RAG 再 ingest（任意）
// (#5 修正) Cursor 内蔵 Node v20 が PATH 先頭にいると npx が古い jsdom (CJS) を引き ERR_REQUIRE_ESM。
// → コマンドに export PATH=NVM_v24/bin:$PATH を強制
sections.push('## 7. RAG 知識ベース更新');
sections.push('');
const NVM_V24_BIN = '/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin';
const ragCmd = [
  `export PATH=${NVM_V24_BIN}:$PATH`,
  'cp RULES-INDEX.md kintone-apps.md AGENTS.md WORKFLOW.md .rag/extra-docs/ 2>/dev/null || true',
  `${NVM_V24_BIN}/npx --yes mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest .rag/extra-docs/ 2>&1 | tail -10 || true`,
  `${NVM_V24_BIN}/npx --yes mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/ 2>&1 | tail -10 || true`,
].join(' && ');
const r7 = runCmd('rag-ingest', ragCmd, { timeoutMs: 300_000 });
// 内側エラー検知: stdout/stderr に Error/ERR_/Exception を含む場合は ⚠ 降格 (#S1)
const ragOutput = `${r7.stdout}\n${r7.stderr}`;
const ragHasInnerError = /\b(?:Error|ERR_[A-Z_]+|Exception|Traceback)\b/.test(ragOutput);
if (ragHasInnerError) r7.ok = false;
sections.push(summary('RAG ingest', r7, { ok: '✅', ng: '⚠️', limit: 12 }));
if (ragHasInnerError) sections.push('> ⚠ 内側エラー検知: stdout/stderr に `Error/ERR_/Exception` を含むためヘルススコアを失敗扱いに降格しました。\n');

// ========================================
// §46 Phase 2-4: 健康チェック / 自動治療 / バージョンアップ
// ========================================
sections.push('---');
sections.push('');
sections.push('# 🌅 §46 朝ルーチン Phase 2-4');
sections.push('');
sections.push('> §46 により Phase 2-4 は SKYSEA 等のいかなるタスクよりも先に実行する。異常検出時はここで解消するまで他タスクへ進まない。');
sections.push('');

// Phase 2: 健康チェック
const rPhase2 = runCmd('phase2 health-check', 'node scripts/health-check.mjs', { timeoutMs: 180_000 });
sections.push(rPhase2.stdout || '## 🩺 Phase 2: 健康状況チェック\n\n_(出力なし)_');
sections.push('');

// Phase 3: 自動治療
const rPhase3 = runCmd('phase3 auto-heal', 'node scripts/auto-heal.mjs', { timeoutMs: 300_000 });
sections.push(rPhase3.stdout || '## 🔧 Phase 3: 自動治療\n\n_(出力なし)_');
sections.push('');

// Phase 4: バージョンアップ
const rPhase4 = runCmd('phase4 version-up', 'node scripts/version-up.mjs', { timeoutMs: 120_000 });
sections.push(rPhase4.stdout || '## 📦 Phase 4: バージョンアップ対応\n\n_(出力なし)_');
sections.push('');
sections.push('---');
sections.push('');

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
  ['scan-plans', r6.ok],
  ['RAG ingest', r7.ok],
  ['§46 Phase 2 health-check', rPhase2.ok],
  ['§46 Phase 3 auto-heal', rPhase3.ok],
  ['§46 Phase 4 version-up', rPhase4.ok],
];
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

process.exit(0);
