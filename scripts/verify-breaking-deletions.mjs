#!/usr/bin/env node
/**
 * verify-breaking-deletions.mjs — TSB-016 改善案 #20 / I-1 (2026-04-25)
 *
 * 目的:
 *   [BREAKING] commit で削除されたファイル/章が、その後の別 commit で
 *   無自覚に再追加（=実質 undone）されていないかを自動検知する。
 *
 * 背景 (TSB-016):
 *   2026-04-25 5:41 commit `5f928dd` [BREAKING] で AGENTS.md Ch.17 (§53 第二意見系)
 *   を 451 行削除したが、1.5 時間後 7:24 commit `6bac959` (主目的 = §35-5 task-log)
 *   が AGENTS.md に +298 行追加 = 削除した Ch.17 全体が末尾に意図せず再復活していた。
 *   誰も気付かず 1.7h 放置 → H-2 タスクで発見。
 *
 * アルゴリズム:
 *   1. 直近 N (default 30) commit を走査
 *   2. メッセージに [BREAKING] を含む commit を抽出
 *   3. 各 [BREAKING] commit の削除行 (- で始まる diff line / 章ヘッダ含む) を抽出
 *   4. その後 (=より新しい) の各 commit について、追加行 (+) に削除済み章ヘッダが
 *      含まれていれば「⚠️ undone 候補」として警告
 *   5. 警告ゼロなら ✅ pass
 *
 * 出力: stdout markdown レポート / 出口コード 0 (朝ブリーフィングを止めない)
 *
 * オプション:
 *   --since=N       直近 N commit を走査 (default 30)
 *   --json          JSON 出力モード
 *   --target=PATH   検証対象ファイル (単一指定 / default = 主要ルール 5 ファイル一括)
 *   --targets=A,B,C カンマ区切り複数指定 (--target より優先)
 *   --verbose       詳細 diff を表示
 *
 * 既定の検証対象 (TSB-016 教訓拡張 / I-3 2026-04-25 10:30):
 *   AGENTS.md / RULES-INDEX.md / WORKFLOW.md / CLAUDE.md / kintone-apps.md
 *   = 「合意済ルール・憲法・正本」を持つファイル全部にゾンビガードを敷く
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');

const argv = process.argv.slice(2);
const ARG = (key, def) => {
  const found = argv.find((a) => a.startsWith(`--${key}=`));
  if (found) return found.slice(`--${key}=`.length);
  if (argv.includes(`--${key}`)) return true;
  return def;
};
const SINCE = Number(ARG('since', '30'));
const JSON_MODE = !!ARG('json', false);
const VERBOSE = !!ARG('verbose', false);

const DEFAULT_TARGETS = [
  'AGENTS.md',
  'RULES-INDEX.md',
  'WORKFLOW.md',
  'CLAUDE.md',
  'kintone-apps.md',
];

let TARGETS;
const targetsArg = ARG('targets', null);
const targetArg = ARG('target', null);
if (typeof targetsArg === 'string' && targetsArg.length > 0) {
  TARGETS = targetsArg.split(',').map((t) => t.trim()).filter(Boolean);
} else if (typeof targetArg === 'string' && targetArg.length > 0) {
  TARGETS = [targetArg];
} else {
  TARGETS = DEFAULT_TARGETS;
}

function git(cmd) {
  try {
    return execSync(`git -C "${REPO_ROOT}" ${cmd}`, { encoding: 'utf8', maxBuffer: 50_000_000 });
  } catch (e) {
    return '';
  }
}

/**
 * isHeaderStillPresent — 復活が疑われたヘッダが「現在の HEAD にも存在するか」を確認
 *
 * 履歴上の復活であっても、その後 H-2 のような修復 commit で再削除済なら問題なし。
 * 「現在も残っているゾンビ」だけを警告対象にすることで誤検知を最小化する。
 */
function isHeaderStillPresent(targetPath, normalizedKey) {
  const fullPath = path.join(REPO_ROOT, targetPath);
  let text;
  try { text = fs.readFileSync(fullPath, 'utf8'); } catch { return false; }
  for (const line of text.split('\n')) {
    const m = line.match(/^(#{2,4})\s+(.+)$/);
    if (!m) continue;
    if (normalizeHeaderKey(m[2]) === normalizedKey) return true;
  }
  return false;
}

const log = git(`log -n ${SINCE} --pretty=format:%H%x09%s`);
const commits = log.split('\n').filter(Boolean).map((line) => {
  const [hash, ...rest] = line.split('\t');
  return { hash, subject: rest.join('\t') };
});

const breakingCommits = commits.filter((c) => /\[BREAKING\]/.test(c.subject));

const issues = [];
const summary = {
  scanned_commits: commits.length,
  breaking_commits: breakingCommits.length,
  targets: TARGETS,
  warnings: 0,
  passed: true,
  per_target: {},
};

/**
 * normalizeHeaderKey — 章/節を「完全に同じ単位」で識別するキーに正規化
 *
 * 設計方針 (2026-04-25 v2 / TSB-016 検証スクリプトの false positive 是正):
 * - 「§54」と「§54-3」と「§54-5」は別物として扱う (sub-section 識別子を全部含める)
 * - 「[廃止 / DEPRECATED]」「(改訂)」「(2026-04-24 制定)」等の修飾語は無視 (= 純粋な ID 部分のみ抽出)
 * - 純粋な ID 抽出: §N or §N-M or §N-M-K or 第N章
 * - ID が無いヘッダ (例: "## サマリ") は正規化後の本文全文をキー化
 */
function normalizeHeaderKey(headerText) {
  const text = headerText.trim();
  const sectionFull = text.match(/§\d+(?:-\d+)*(?:-[A-Z])?/);
  if (sectionFull) return sectionFull[0];
  const chapter = text.match(/第\d+章/);
  if (chapter) return chapter[0];
  return text.replace(/\s+/g, ' ').slice(0, 80);
}

function extractHeaders(diff, sign) {
  const headers = new Set();
  for (const line of diff.split('\n')) {
    if (!line.startsWith(sign)) continue;
    if (line.startsWith(sign + sign + sign)) continue;
    const body = line.slice(1).trim();
    const m = body.match(/^(#{2,4})\s+(.+)$/);
    if (!m) continue;
    headers.add(normalizeHeaderKey(m[2]));
  }
  return [...headers];
}

function extractDeletedHeaders(diff) { return extractHeaders(diff, '-'); }
function extractAddedHeaders(diff) { return extractHeaders(diff, '+'); }

for (const TARGET of TARGETS) {
  summary.per_target[TARGET] = { breaking_with_deletions: 0, warnings: 0, resolved: 0 };

  for (const breaking of breakingCommits) {
    const breakingDiff = git(`show ${breaking.hash} -- "${TARGET}"`);
    if (!breakingDiff) continue;

    const deletedHeaders = extractDeletedHeaders(breakingDiff);
    if (deletedHeaders.length === 0) continue;
    summary.per_target[TARGET].breaking_with_deletions++;

    const breakingIdx = commits.findIndex((c) => c.hash === breaking.hash);
    if (breakingIdx <= 0) continue;

    const subsequent = commits.slice(0, breakingIdx);

    for (const sub of subsequent) {
      const subDiff = git(`show ${sub.hash} -- "${TARGET}"`);
      if (!subDiff) continue;

      const addedHeaders = extractAddedHeaders(subDiff);
      const undoneHeaders = deletedHeaders.filter((h) => addedHeaders.includes(h));

      if (undoneHeaders.length > 0) {
        const stillPresent = undoneHeaders.filter((h) => isHeaderStillPresent(TARGET, h));
        const alreadyResolved = undoneHeaders.filter((h) => !isHeaderStillPresent(TARGET, h));

        if (stillPresent.length > 0) {
          issues.push({
            severity: 'warn',
            breaking_commit: breaking.hash.slice(0, 7),
            breaking_subject: breaking.subject,
            suspicious_commit: sub.hash.slice(0, 7),
            suspicious_subject: sub.subject,
            undone_headers: stillPresent,
            status: 'active-zombie',
            target_file: TARGET,
          });
          summary.warnings++;
          summary.per_target[TARGET].warnings++;
        }
        if (alreadyResolved.length > 0) {
          summary.per_target[TARGET].resolved++;
          if (VERBOSE) {
            issues.push({
              severity: 'info',
              breaking_commit: breaking.hash.slice(0, 7),
              breaking_subject: breaking.subject,
              suspicious_commit: sub.hash.slice(0, 7),
              suspicious_subject: sub.subject,
              undone_headers: alreadyResolved,
              status: 'already-resolved',
              target_file: TARGET,
            });
          }
        }
      }
    }
  }
}

summary.passed = summary.warnings === 0;

if (JSON_MODE) {
  console.log(JSON.stringify({ summary, issues }, null, 2));
  process.exit(0);
}

console.log('### post-BREAKING 削除 復活検知 (TSB-016 #20 / I-1+I-3)');
console.log('');
console.log(`- 対象ファイル (${TARGETS.length} 件): ${TARGETS.map((t) => `\`${t}\``).join(' / ')}`);
console.log(`- 走査範囲: 直近 ${SINCE} commit (実走査 ${commits.length} 件)`);
console.log(`- [BREAKING] commit 検出: ${summary.breaking_commits} 件`);
console.log('');

console.log('| ファイル | BREAKING削除実施数 | 残存ゾンビ | 履歴上復活→修復済 |');
console.log('|---|---:|---:|---:|');
for (const t of TARGETS) {
  const s = summary.per_target[t] || { breaking_with_deletions: 0, warnings: 0, resolved: 0 };
  const mark = s.warnings === 0 ? '✅ 0' : `❌ ${s.warnings}`;
  console.log(`| \`${t}\` | ${s.breaking_with_deletions} | ${mark} | ${s.resolved} |`);
}
console.log('');

if (summary.passed) {
  console.log('✅ pass: 全対象ファイルに「ゾンビ復活した削除済章/節」は存在せず');
  if (VERBOSE) {
    const resolved = issues.filter((i) => i.severity === 'info');
    if (resolved.length > 0) {
      console.log('');
      console.log('（参考: 履歴上では復活したが、その後の修復 commit で再削除済の事例 ↓）');
      for (const issue of resolved) {
        console.log(`- [${issue.target_file}] \`${issue.breaking_commit}\` 削除 → \`${issue.suspicious_commit}\` で復活 → 既に修復済: ${issue.undone_headers.join(' / ')}`);
      }
    }
  }
} else {
  console.log(`❌ ⚠️ ${summary.warnings} 件の active-zombie を検出 (= 現在の HEAD に削除済のはずの章/節が残存)`);
  console.log('');
  for (const issue of issues) {
    if (issue.severity !== 'warn') continue;
    console.log(`#### [${issue.target_file}] ${issue.breaking_commit} の削除を ${issue.suspicious_commit} で復活 (現在も残存)`);
    console.log(`- BREAKING commit: \`${issue.breaking_commit}\` ${issue.breaking_subject}`);
    console.log(`- 復活させた commit: \`${issue.suspicious_commit}\` ${issue.suspicious_subject}`);
    console.log(`- 現在も残存している章/節:`);
    for (const h of issue.undone_headers) console.log(`  - ${h}`);
    console.log('');
  }
  console.log('');
  console.log('**対応**:');
  console.log('1. 残存している章/節を該当ファイルから削除する新 commit を作成');
  console.log('2. TSB として記録 (TSB-016 が前例)');
  console.log('3. 本スクリプトを再実行して ✅ pass を確認');
}

process.exit(0);
