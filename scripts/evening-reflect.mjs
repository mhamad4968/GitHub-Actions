#!/usr/bin/env node
/**
 * evening-reflect.mjs
 *
 * 「本日のまとめ・反省」レポートのスキャフォールド（雛形）を生成する。
 *
 * 自動収集する情報:
 *   1. 今日の git 差分（git があれば）
 *   2. kintone-apps.md の本日追記行
 *   3. 直近の朝ブリーフィングの警告セクション（audit-rules / scan-plans 由来）
 *   4. logs/morning-prep/<日付>.log の失敗痕跡
 *   5. agent-transcripts/ の本日 .jsonl のサイズ（参考値）
 *   6. 既存の保留改善提案（docs/approved-changes/pending/*.json）
 *   7. chat-sessions/evening-reflect-queue.md（昼→夕の固定引き継ぎ正本）
 *   8. 雛形 §1-N（毎夜必須議題・憲法運用レビュー・§44 で浜田と必ず議論）
 *
 * 出力:
 *   - docs/reports/<日付>-evening-reflection.md（雛形）
 *
 * AI（私）はこの雛形を読み、人間の判断が要る部分（要因分析・改善提案 #R1, #S1...）を
 *   追記してユーザーに提示する。ユーザーが「A1 承認」と返したら
 *   私が docs/approved-changes/<日付>/<id>.proposal.json を作成する。
 *
 * 単独実行可、conversational に AI から呼ばれる想定。
 */
import fs from 'node:fs';
import path from 'node:path';
import { pickLatestStarterDesktopPathForDate } from './lib/session-starter-desktop.mjs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

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
const REPORT_PATH = path.join(REPORT_DIR, `${today.iso}-evening-reflection.md`);
fs.mkdirSync(REPORT_DIR, { recursive: true });

function run(cmd) {
  const res = spawnSync('bash', ['-lc', cmd], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 30_000,
  });
  return {
    ok: res.status === 0,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
  };
}

// ── 1. git 差分（git レポでない場合はスキップ） ─────
let gitSection = '_(git レポジトリではありません)_';
const gitCheck = run('git rev-parse --is-inside-work-tree 2>/dev/null');
if (gitCheck.ok && gitCheck.stdout === 'true') {
  const status = run('git status --short');
  // 2026-04-20 制定 (#D5): midnight 起点だと深夜跨ぎ・早朝実行で空になるため直近 12 時間で抽出
  const today_log = run(`git log --since='12 hours ago' --pretty=format:'%h %s' | head -20`);
  gitSection = [
    '**`git status`（未コミット）**:',
    '```text',
    status.stdout || '(なし)',
    '```',
    '',
    '**今日のコミット**:',
    '```text',
    today_log.stdout || '(なし)',
    '```',
  ].join('\n');
}

// ── 2. kintone-apps.md の本日追記 ──────────────────
const kintoneApps = path.join(REPO_ROOT, 'kintone-apps.md');
let kintoneAppsSection = '_(kintone-apps.md が読めませんでした)_';
if (fs.existsSync(kintoneApps)) {
  const text = fs.readFileSync(kintoneApps, 'utf8');
  const lines = text.split(/\r?\n/);
  const todayPrefix = `| ${today.iso} `;
  const todayLines = lines.filter((l) => l.startsWith(todayPrefix));
  if (todayLines.length === 0) {
    kintoneAppsSection = '_(本日の追記なし)_';
  } else {
    kintoneAppsSection = todayLines.map((l) => `- ${l.replace(/^\|\s*/, '').replace(/\s*\|\s*/g, ' / ')}`).join('\n');
  }
}

// ── 3. 朝ブリーフィングの警告 ─────────────────────
const briefing = path.join(REPORT_DIR, `${today.iso}-morning-prep.md`);
let briefingSection = '_(本日の朝ブリーフィングなし)_';
if (fs.existsSync(briefing)) {
  const text = fs.readFileSync(briefing, 'utf8');
  const warnLines = text.split(/\r?\n/).filter((l) => /[⚠❌]/.test(l));
  briefingSection = warnLines.length > 0 ? warnLines.map((l) => `- ${l.trim()}`).join('\n') : '_(警告なし)_';
}

// ── 4. ログの失敗痕跡 ─────────────────────────────
const logPath = path.join(REPO_ROOT, 'logs', 'morning-prep', `${today.iso}.log`);
let logSection = '_(本日の cron ログなし)_';
if (fs.existsSync(logPath)) {
  const text = fs.readFileSync(logPath, 'utf8');
  const errLines = text.split(/\r?\n/).filter((l) => /exit=[1-9]/.test(l));
  logSection = errLines.length > 0 ? errLines.map((l) => `- ${l}`).join('\n') : '_(失敗なし)_';
}

// ── 5. agent-transcripts のボリューム（参考値） ──────
const tsBase = '/home/mhamada202408224/.cursor/projects';
let tsSection = '_(transcripts 未取得)_';
const tsCmd = run(`find ${tsBase} -name '*.jsonl' -newermt '${today.iso} 00:00' 2>/dev/null | head -5`);
if (tsCmd.ok && tsCmd.stdout) {
  tsSection = '本日更新された transcripts（参考）:\n```\n' + tsCmd.stdout + '\n```';
}

// ── 6. 保留中の改善提案 ────────────────────────────
const pendingDir = path.join(REPO_ROOT, 'docs', 'approved-changes', 'pending');
let pendingSection = '_(保留中の提案なし)_';
if (fs.existsSync(pendingDir)) {
  const files = fs.readdirSync(pendingDir).filter((f) => f.endsWith('.proposal.json'));
  if (files.length > 0) {
    pendingSection = files
      .map((f) => {
        try {
          const j = JSON.parse(fs.readFileSync(path.join(pendingDir, f), 'utf8'));
          return `- \`${f}\` [${j.category || '?'}] ${j.title || '(no title)'} — status=${j.status || 'pending'}`;
        } catch {
          return `- \`${f}\` (parse error)`;
        }
      })
      .join('\n');
  }
}

// ── 1-H. S2 (2026-04-20): git status 汚れ度合い警告 ──
let gitDirtyWarning = '';
if (gitCheck.ok && gitCheck.stdout === 'true') {
  const stCount = run('git status --short | wc -l');
  const cnt = parseInt(stCount.stdout || '0', 10);
  if (cnt > 50) {
    gitDirtyWarning = `\n### ⚠ 1-H. git 未コミット件数警告\n\n**未コミット ${cnt} 件**（50 件超え）→ 区切り良いところで commit 推奨。状況把握が困難になる前に整理する。`;
  } else if (cnt > 30) {
    gitDirtyWarning = `\n### ℹ 1-H. git 未コミット件数\n\n${cnt} 件（注意レベル）。`;
  }
}

// ── 1-I. S2 (2026-04-20): 直近 TSB 引用 ──
let tsbSection = '_(troubleshooting.md なし)_';
const tsbPath = path.join(REPO_ROOT, 'docs', 'troubleshooting.md');
if (fs.existsSync(tsbPath)) {
  const text = fs.readFileSync(tsbPath, 'utf8');
  const tsbHeadings = text.split(/\r?\n/).filter((l) => /^## TSB-\d+/.test(l)).slice(-3);
  if (tsbHeadings.length > 0) {
    tsbSection = '直近の TSB（参考・学習リソース）:\n' + tsbHeadings.map((h) => `- ${h.replace(/^##\s*/, '')}`).join('\n');
  }
}

// ── 1-J. S2 (2026-04-20): checkpoint-latest.md 鮮度チェック ──
let checkpointFreshness = '';
const cpPath = path.join(REPO_ROOT, 'chat-sessions', 'checkpoint-latest.md');
if (fs.existsSync(cpPath)) {
  const mtime = fs.statSync(cpPath).mtimeMs;
  const daysOld = Math.floor((Date.now() - mtime) / 86400_000);
  if (daysOld >= 7) {
    checkpointFreshness = `\n### 🚨 1-J. checkpoint-latest.md 鮮度警告\n\n**${daysOld} 日間更新されていません**（7 日以上）→ TSB-005 再発リスク。本日中に更新を強く推奨。`;
  } else if (daysOld >= 3) {
    checkpointFreshness = `\n### ⚠ 1-J. checkpoint-latest.md 鮮度\n\n最終更新から ${daysOld} 日経過。区切り良いタイミングで更新検討。`;
  }
}

// ── D3 (2026-04-20): NEW-SESSION-STARTER「今やってる主タスク」自動更新 ──
// 直近の plan ファイル + git log + checkpoint から「今やってる主タスク」のサマリを生成し、
// NEW-SESSION-STARTER.md と Windows 版 .txt の該当ブロックを上書き更新する。
function updateNewSessionStarter() {
  const summary = [];
  // 直近の plan
  const plansDir = path.join(REPO_ROOT, 'docs', 'plans');
  if (fs.existsSync(plansDir)) {
    const plans = fs.readdirSync(plansDir).filter((f) => f.endsWith('.md'))
      .map((f) => ({ name: f, mtime: fs.statSync(path.join(plansDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime).slice(0, 1);
    if (plans.length > 0) {
      summary.push(`- 進行中 plan: docs/plans/${plans[0].name}`);
    }
  }
  // 当日 commit のうち主要なもの
  const todayCommits = run(`git log --since='12 hours ago' --pretty=format:'%s' | head -3`);
  if (todayCommits.ok && todayCommits.stdout) {
    summary.push('- 当日コミット (上位 3):');
    todayCommits.stdout.split('\n').forEach((s) => summary.push(`  - ${s.slice(0, 80)}`));
  }
  if (summary.length === 0) summary.push('- _(進行中タスクなし)_');

  const newBlock = `【今やってる主タスク（${today.iso} 自動更新）】\n${summary.join('\n')}`;

  // NEW-SESSION-STARTER.md (リポ正本)
  const nss1 = path.join(REPO_ROOT, 'chat-sessions', 'NEW-SESSION-STARTER.md');
  if (fs.existsSync(nss1)) {
    let txt = fs.readFileSync(nss1, 'utf8');
    txt = txt.replace(/【今やってる主タスク[^】]*】[\s\S]*?(?=\n\n【|\n\n##|\n```|$)/, newBlock);
    fs.writeFileSync(nss1, txt, 'utf8');
  }
  // Windows メモ帳版（浜田 Desktop AI緊急用・メンテ日ファイル名）
  const aiDesk = '/mnt/c/Users/mhamada202408224/Desktop/AI緊急用';
  const nssDesk = pickLatestStarterDesktopPathForDate(aiDesk);
  try {
    if (nssDesk && fs.existsSync(nssDesk)) {
      let txt = fs.readFileSync(nssDesk, 'utf8');
      txt = txt.replace(/【今やってる主タスク[^】]*】[\s\S]*?(?=\n\n【|\n\n━|$)/, newBlock);
      fs.writeFileSync(nssDesk, txt, 'utf8');
    }
  } catch (_) { /* mnt 不可 */ }
  const nssLegacy = '/mnt/c/Claudeとの会話メモ/NEW-SESSION-STARTER.txt';
  try {
    if (fs.existsSync(nssLegacy)) {
      let txt = fs.readFileSync(nssLegacy, 'utf8');
      txt = txt.replace(/【今やってる主タスク[^】]*】[\s\S]*?(?=\n\n【|\n\n━|$)/, newBlock);
      fs.writeFileSync(nssLegacy, txt, 'utf8');
    }
  } catch (_) { /* mnt 不可 */ }
}
try { updateNewSessionStarter(); } catch (e) { console.warn('[D3] NEW-SESSION-STARTER 更新失敗:', e.message); }

// ── 1-M. 夕反省キュー（昼→夜の固定引き継ぎ正本）────────────────
const eveningQueuePath = path.join(REPO_ROOT, 'chat-sessions', 'evening-reflect-queue.md');
let eveningQueueSection = '_(ファイルなし)_';
if (fs.existsSync(eveningQueuePath)) {
  const qRaw = fs.readFileSync(eveningQueuePath, 'utf8').trim();
  eveningQueueSection = qRaw.length > 0 ? qRaw : '_(空)_';
}

// ── 1-G. 未参照ルール統廃合候補 (#S4) ───────────────
let unrefSection = '_(audit-rules 出力取得失敗)_';
const auditRes = run('node scripts/audit-rules.mjs 2>&1');
if (auditRes.ok) {
  const m = auditRes.stdout.match(/未参照ルール:\s*(§[\d\s\/§]+)/);
  if (m) {
    const ids = m[1].split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      unrefSection = '_(未参照ルールなし)_';
    } else {
      const seed = Number(today.iso.replace(/-/g, ''));
      const picks = [...new Set([(seed) % ids.length, (seed * 7 + 3) % ids.length])]
        .map((i) => ids[i])
        .filter(Boolean);
      unrefSection = `本日の検討対象（${ids.length} 個中 ${picks.length} 件を日付シードで抽出）:\n` +
        picks.map((id) => `- ${id}: WORKFLOW.md / RULES-INDEX.md から参照されていない。**統合 / 廃止 / 維持** いずれかを判断`).join('\n') +
        `\n\n全リスト: ${ids.join(' / ')}`;
    }
  } else {
    unrefSection = '_(出力から未参照ルール行を抽出できず)_';
  }
}

// ── 出力 ────────────────────────────────────────────
const out = `# 🌙 本日のまとめ・反省 — ${today.label}

> 本ファイルは \`scripts/evening-reflect.mjs\` が生成した雛形です。
> AI（私）はこの内容を読み、要因分析と改善提案（#R1/#S1/#D1...）を追記してユーザーへ提示します。
> ユーザーが「#R1 承認」「#S1 却下」等で返答 → AI が \`docs/approved-changes/<明日>/\` に承認済み JSON を作成 → 翌朝 06:00 cron が自動実施。

---

## 📊 1. 自動収集ファクト

### 1-A. git の状態
${gitSection}

### 1-B. kintone-apps.md 本日の追記
${kintoneAppsSection}

### 1-C. 朝ブリーフィングの警告
${briefingSection}

### 1-D. cron ログの失敗痕跡
${logSection}

### 1-E. 会話履歴の量
${tsSection}

### 1-F. 保留中の改善提案
${pendingSection}

### 1-M. 夕反省キュー（引き継ぎ正本・chat-sessions/evening-reflect-queue.md）

> AI は **§2 以降で本節のチェック項目を処理**し、完了したら **正本キュー**で \`- [x]\` にするか行を削除すること。

${eveningQueueSection}

### 1-N. 毎夜必須議題（憲法運用レビュー・浜田と必ず議論）

> **2026-05-06 明文化（CEO 指示）**: 夜の反省会（**§44**）で **毎回** 次を **口頭または同一チャットで扱う**（飛ばさない）。議論したら **§2 または §4 に「今日の結論」1 行以上** 残す（形骸化防止）。

- [ ] **CIO 二人体制**: その日 **第2者（DeepSeek/Kimi）** を実際に挟んだか／**§50-3-8 スキップ理由**は妥当か／**本体だけで締めていないか**
- [ ] **§1c（仕様・検証）**: **`[仕様状態:]`** / **`[検証2者:]`** を出すべき場面で出しているか／**未決・仮決を確定と言い換えていないか**
- [ ] **MCP**: **`mcp-server-use-triggers.mdc`** を Read してから止まっているか／**`MCPスキップ:`** は理由付きか／**`npm run mcp:chat-stamp`** を使う場面で使ったか
- [ ] **「直った」検証不足**: 再発の芽がないか（具体例 0〜1 件でよい）
- [ ] **ルールと実態のズレ**: **`constitution-brief-card.mdc`** / **`every-turn-rules-confirm.mdc`** について、今日 **ほつれた点があれば 1 点** だけメモしたか

### 1-G. 直近 TSB（参考）
${tsbSection}

### 1-K. 未参照ルール統廃合候補
${unrefSection}
${gitDirtyWarning}
${checkpointFreshness}

### 1-L. §55・憲法改訂フォロー（D3 / 週次でも可）

<!-- 浜田チェック不要・自己申告用。AI が埋める。 -->

- [ ] **§55-4/§55-5 整合**: 本日 AGENTS.md / RULES-INDEX を [BREAKING] 更新した場合、セーフモード・解除条件と矛盾がないかを 1 行で確認した
- 該当なし → \`_（該当なし）_\`

---

## 📝 2. 今日やったこと（AI が記入）

<!-- AI が agent-transcripts と git 差分から要約 -->

---

## ✅ 3. うまくいったこと（AI が記入）

<!-- AI が記入 -->

---

## ⚠️ 4. 詰まった・失敗したこと（AI が記入）

<!-- AI が記入。失敗の根本原因 + 学び -->

---

## 🚀 5. 改善提案（AI が記入。ユーザー承認待ち）

| ID | カテゴリ | 提案 | 想定リスク | 翌朝自動実施可? |
|---|---|---|---|---|
| #R1 | R | _(AI が記入)_ | _(低/中/高)_ | _(○/×/手動)_ |

> カテゴリ: **R**=ルール改善 / **S**=スクリプト改善 / **D**=ドキュメント / **C**=customize 改修(deploy 除く) / **K**=kintone API 操作

### ユーザー応答方法
- 個別: 「#R1 承認」「#S1 却下」「#D1 修正して: <修正内容>」
- 一括: 「全部承認」「Rカテゴリだけ承認」

---

## 🌅 明日へ（AI が記入）

<!-- 明日朝の最初に取り組むべきこと（next action）を 1-3 個 -->
`;

fs.writeFileSync(REPORT_PATH, out, 'utf8');
console.log(`✅ 反省レポート雛形を生成: ${path.relative(REPO_ROOT, REPORT_PATH)}`);
console.log(`   AI は §1-N（毎夜必須議題）を浜田と議論し、§2-§5 を埋めてユーザーへ提示してください。`);
