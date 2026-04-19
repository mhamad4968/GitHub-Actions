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
  const today_log = run(`git log --since=midnight --pretty=format:'%h %s' | head -20`);
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
console.log(`   AI はこの内容を読み、§2-§5 を埋めてユーザーへ提示してください。`);
