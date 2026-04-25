#!/usr/bin/env node
/**
 * audit-tsb-confirmed.mjs — TSB 目次表の root_cause_confirmed フラグ整合性チェック
 *
 * 検出する異常:
 * 1. 目次に列挙されているが root_cause_confirmed フラグが空 / 不正な行
 * 2. ## TSB-XXX セクションが本文にあるが目次に列挙されていない (drift)
 * 3. 目次に列挙されているが本文にセクションがない (orphan in 目次)
 * 4. 5 月目標 #2 (root_cause_confirmed カバレッジ 100%) の現状達成率を報告
 *
 * 連動: F-2 セルフ批判 (docs/reports/2026-04-self-critique-monthly.md) の目標 #2
 *      → 朝 cron で監視 → カバレッジ低下時は早期警告
 *
 * 出力: stdout に整合性レポート (markdown)
 * 出口コード: 常に 0（朝ブリーフィングを止めない / 警告のみ）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const TSB_FILE = path.join(REPO_ROOT, 'docs', 'troubleshooting.md');

const ARG_JSON = process.argv.includes('--json');

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

const text = readFile(TSB_FILE);
if (!text) {
  console.log('### TSB confirmed flag audit');
  console.log('');
  console.log('❌ docs/troubleshooting.md not found');
  process.exit(0);
}

/** ## TSB-XXX セクションのヘッダから ID 群を抽出 */
function extractSectionIds(t) {
  const ids = new Set();
  const re = /^## TSB-([A-Za-z0-9-]+(?:\s+(?:episode\s+\d+|続編|ep\d+|\(旧記録\)))?)/gmi;
  let m;
  while ((m = re.exec(t)) !== null) {
    const raw = `TSB-${m[1]}`.replace(/\s+/g, ' ').trim();
    if (raw === 'TSB-NNN') continue;
    ids.add(raw);
  }
  return ids;
}

/**
 * 目次表から各行を抽出して { id, confirmed, status } を返す
 * 期待フォーマット: | TSB-XXX | <date> | <theme> | <root cause> | <status> | <confirmed> | <impact> |
 */
function extractTocRows(t) {
  const rows = [];
  const lines = t.split(/\r?\n/);
  let inToc = false;
  for (const line of lines) {
    if (/^##\s*目次/.test(line)) {
      inToc = true;
      continue;
    }
    if (inToc && /^---\s*$/.test(line)) {
      inToc = false;
      continue;
    }
    if (!inToc) continue;
    if (!/^\|\s*TSB-/i.test(line)) continue;

    const cells = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length < 6) continue;

    const id = cells[0];
    const date = cells[1] || '';
    const confirmedRaw = cells[5] || '';
    let confirmed = null;
    if (/\btrue\b/i.test(confirmedRaw)) confirmed = true;
    else if (/\bfalse\b/i.test(confirmedRaw)) confirmed = false;

    const status = cells[4] || '';
    const isHistoryReference = /履歴参照/.test(date);
    rows.push({ id, date, confirmed, confirmedRaw, status, isHistoryReference });
  }
  return rows;
}

const sectionIds = extractSectionIds(text);
const tocRows = extractTocRows(text);

const tocIds = new Set(tocRows.map((r) => r.id));
const sectionIdsArr = [...sectionIds];

const issues = [];

const noFlagRows = tocRows.filter((r) => r.confirmed === null);
if (noFlagRows.length > 0) {
  issues.push({
    severity: 'warn',
    type: 'no-flag',
    message: `目次の ${noFlagRows.length} 行に root_cause_confirmed フラグが見つからない`,
    items: noFlagRows.map((r) => `${r.id} (cell="${r.confirmedRaw}")`),
  });
}

const sectionMissingFromToc = sectionIdsArr.filter((id) => {
  const base = id.replace(/\s.*$/, '');
  for (const tocId of tocIds) {
    if (tocId === id) return false;
    if (tocId === base) return false;
    if (tocId.startsWith(base + ' ')) return false;
    if (id.startsWith(tocId + ' ')) return false;
  }
  return true;
});

if (sectionMissingFromToc.length > 0) {
  issues.push({
    severity: 'warn',
    type: 'section-not-in-toc',
    message: `本文に ## ${sectionMissingFromToc.length} 件の TSB セクションがあるが目次にない (drift)`,
    items: sectionMissingFromToc,
  });
}

const historyRefIds = new Set(tocRows.filter((r) => r.isHistoryReference).map((r) => r.id));

const tocOrphanRaw = [...tocIds].filter((id) => {
  const base = id.replace(/\s.*$/, '');
  for (const sid of sectionIdsArr) {
    if (sid === id) return false;
    if (sid === base) return false;
    if (sid.startsWith(base + ' ')) return false;
    if (id.startsWith(sid + ' ')) return false;
  }
  return true;
});

const tocOrphanUnexpected = tocOrphanRaw.filter((id) => !historyRefIds.has(id));
const tocOrphanExpected = tocOrphanRaw.filter((id) => historyRefIds.has(id));

if (tocOrphanUnexpected.length > 0) {
  issues.push({
    severity: 'warn',
    type: 'toc-orphan-unexpected',
    message: `目次に ${tocOrphanUnexpected.length} 件あるが本文に該当セクションなし (date 列が「履歴参照」ではない = 想定外)`,
    items: tocOrphanUnexpected,
  });
}

if (tocOrphanExpected.length > 0) {
  issues.push({
    severity: 'info',
    type: 'toc-orphan-history-ref',
    message: `履歴参照 marker (date="履歴参照") として本文セクションなしは想定通り (${tocOrphanExpected.length} 件)`,
    items: tocOrphanExpected,
  });
}

const total = tocRows.length;
const confirmedTrue = tocRows.filter((r) => r.confirmed === true).length;
const confirmedFalse = tocRows.filter((r) => r.confirmed === false).length;
const noFlag = tocRows.filter((r) => r.confirmed === null).length;
const coverage = total > 0 ? Math.round((confirmedTrue / total) * 100) : 0;

if (ARG_JSON) {
  console.log(JSON.stringify({
    file: path.relative(REPO_ROOT, TSB_FILE),
    total_in_toc: total,
    section_count: sectionIds.size,
    confirmed_true: confirmedTrue,
    confirmed_false: confirmedFalse,
    no_flag: noFlag,
    coverage_percent: coverage,
    issues,
    target_5month: { goal_percent: 100, current_percent: coverage, achieved: coverage >= 94 },
  }, null, 2));
  process.exit(0);
}

console.log('### TSB confirmed flag audit (F-2 5月目標 #2 監視)');
console.log('');
console.log(`- ファイル: \`${path.relative(REPO_ROOT, TSB_FILE)}\``);
console.log(`- 目次行数: ${total}`);
console.log(`- 本文セクション数 (## TSB-): ${sectionIds.size}`);
console.log(`- root_cause_confirmed = true: ${confirmedTrue} 件 (**${coverage}%**)`);
console.log(`- root_cause_confirmed = false: ${confirmedFalse} 件`);
if (noFlag > 0) console.log(`- フラグ不明: ${noFlag} 件`);
console.log('');

if (coverage >= 94) {
  console.log(`✅ 5 月目標 #2 (カバレッジ 100% / 実質 = 孤児を除く 100%) を達成中 (${coverage}%)`);
} else if (coverage >= 80) {
  console.log(`⚠️ 5 月目標 #2 まで残り ${100 - coverage}% (現状 ${coverage}%) — 真因 1 文掘削を継続`);
} else {
  console.log(`❌ 5 月目標 #2 未達 (現状 ${coverage}% / 目標 100%) — 真因 1 文掘削を緊急実施`);
}

if (confirmedFalse > 0) {
  const falseList = tocRows.filter((r) => r.confirmed === false).map((r) => r.id);
  console.log(`- false 件名: ${falseList.join(' / ')}`);
}

console.log('');

if (issues.length === 0) {
  console.log('✅ drift なし (目次 ↔ 本文セクション 完全一致)');
} else {
  for (const issue of issues) {
    const icon = issue.severity === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${issue.message}`);
    for (const item of issue.items.slice(0, 10)) {
      console.log(`  - ${item}`);
    }
    if (issue.items.length > 10) {
      console.log(`  - ... (他 ${issue.items.length - 10} 件)`);
    }
  }
}

process.exit(0);
