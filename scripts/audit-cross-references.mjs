#!/usr/bin/env node
/**
 * audit-cross-references.mjs — AGENTS.md ↔ RULES-INDEX.md drift 検知 (I-11 / 2026-04-25)
 *
 * 目的:
 *   開発憲法 (AGENTS.md) と索引 (RULES-INDEX.md) の §N 列挙が同期しているか自動検証する。
 *
 * 背景:
 *   AGENTS.md に新ルール §N-M を追加したが RULES-INDEX.md 更新を忘れる事例が散見。
 *   逆に AGENTS.md から §N を削除したが RULES-INDEX.md に死参照が残るケースも (TSB-016 系列)。
 *
 * 検出する drift:
 *   1. AGENTS.md で **定義** (#### §N or ##### §N) されているが RULES-INDEX.md に言及なし → 索引漏れ
 *   2. RULES-INDEX.md で言及されているが AGENTS.md に定義なし → 死参照
 *   3. AGENTS.md 定義総数 と RULES-INDEX.md 言及総数の比較 (参考値)
 *
 * 出力: stdout markdown / 出口コード 0 (朝ブリーフィングを止めない / 警告のみ)
 *
 * オプション:
 *   --json        JSON 出力モード
 *   --verbose     drift の詳細リスト表示
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const AGENTS = path.join(REPO_ROOT, 'AGENTS.md');
const INDEX = path.join(REPO_ROOT, 'RULES-INDEX.md');

const ARG_JSON = process.argv.includes('--json');
const ARG_VERBOSE = process.argv.includes('--verbose');

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

const agentsText = readFile(AGENTS);
const indexText = readFile(INDEX);

if (!agentsText || !indexText) {
  console.log('### Cross-reference audit');
  console.log('');
  if (!agentsText) console.log('❌ AGENTS.md not found');
  if (!indexText) console.log('❌ RULES-INDEX.md not found');
  process.exit(0);
}

/**
 * 定義済み §N を抽出 = 「#### §N or ##### §N or ###### §N」見出し行のみ
 *
 * 「定義」と「言及」を区別するため、ヘッダ行のみ走査する。
 * ヘッダ以外のテキスト中の §N (例: 本文の「§47 適用」等) は「言及」扱いで除外。
 */
function extractDefinedSections(text) {
  const defined = new Set();
  const re = /^#{2,6}\s+(§\d+(?:-\d+)*(?:-[A-Z])?)\b/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    defined.add(m[1]);
  }
  return defined;
}

/** 全 §N (本文中の言及 + ヘッダ含む) を抽出 */
function extractAllReferences(text) {
  const refs = new Set();
  const re = /§\d+(?:-\d+)*(?:-[A-Z])?/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    refs.add(m[0]);
  }
  return refs;
}

const agentsDefined = extractDefinedSections(agentsText);
const agentsAllRefs = extractAllReferences(agentsText);
const indexAllRefs = extractAllReferences(indexText);

/**
 * 階層的チェック — 親 §N が index にあれば子 §N-M, §N-M-K は OK 扱い (info 化)
 *
 * 理由: sub-section (§42-2-1 〜 §42-2-6) を全て index に列挙するのは冗長。
 *       親 (§42-2) が index にあれば、子は親経由でアクセスできるとみなす。
 */
function getParents(section) {
  const parts = section.replace(/§/, '').split('-');
  const parents = [];
  for (let i = parts.length - 1; i > 0; i--) {
    parents.push('§' + parts.slice(0, i).join('-'));
  }
  return parents;
}

// drift 1a: AGENTS で定義済みだが RULES-INDEX にない (親もなし) → 真の索引漏れ (warn)
// drift 1b: AGENTS で定義済みだが RULES-INDEX にない (親はあり) → sub-section 個別未列挙 (info)
const missingInIndexRaw = [...agentsDefined].filter((s) => !indexAllRefs.has(s));
const missingInIndex = missingInIndexRaw.filter((s) => {
  const parents = getParents(s);
  return !parents.some((p) => indexAllRefs.has(p));
}).sort(naturalSort);
const missingButParentExists = missingInIndexRaw.filter((s) => {
  const parents = getParents(s);
  return parents.some((p) => indexAllRefs.has(p));
}).sort(naturalSort);

/**
 * 「欠番宣言」抽出 — RULES-INDEX.md 内で「§N は欠番」「§N は撤去」等の文脈で言及される §N
 *
 * 意図的に AGENTS.md から削除した §N を「欠番」と書いて履歴記録するパターン。
 * これは死参照ではなく **正規の説明** なので drift から除外する。
 */
function extractRetiredDeclarations(text) {
  const retired = new Set();
  const re = /§(\d+(?:-\d+)*(?:-[A-Z])?)[^\n]*?(欠番|撤去|削除|deprecated|廃止|absorbed|統合|移管)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    retired.add('§' + m[1]);
  }
  return retired;
}
const indexRetired = extractRetiredDeclarations(indexText);

// drift 2: RULES-INDEX にあるが AGENTS で定義なし (= 死参照)
//   ただし AGENTS 本文中の言及 (agentsAllRefs) にあるなら sub-section の参照等で正常
//   さらに RULES-INDEX 内で「欠番」「撤去」等と宣言されているなら正規説明として除外
const deadReferences = [...indexAllRefs]
  .filter((s) => !agentsAllRefs.has(s))
  .filter((s) => !indexRetired.has(s))
  .sort(naturalSort);
const indexRetiredArr = [...indexRetired].sort(naturalSort);

function naturalSort(a, b) {
  const ka = a.replace(/§/, '').split('-').map((p) => p.match(/^\d+$/) ? Number(p) : p);
  const kb = b.replace(/§/, '').split('-').map((p) => p.match(/^\d+$/) ? Number(p) : p);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const xa = ka[i] === undefined ? -Infinity : ka[i];
    const xb = kb[i] === undefined ? -Infinity : kb[i];
    if (xa < xb) return -1;
    if (xa > xb) return 1;
  }
  return 0;
}

const issues = [];
if (missingInIndex.length > 0) {
  issues.push({
    severity: 'warn',
    type: 'missing-in-index',
    message: `AGENTS.md で定義されているが RULES-INDEX.md に親含めて言及なし: ${missingInIndex.length} 件 (真の索引漏れ)`,
    items: missingInIndex,
  });
}
if (missingButParentExists.length > 0) {
  issues.push({
    severity: 'info',
    type: 'sub-section-not-listed',
    message: `sub-section が RULES-INDEX.md に個別未列挙だが親 §N が登録済 (許容): ${missingButParentExists.length} 件`,
    items: missingButParentExists,
  });
}
if (deadReferences.length > 0) {
  issues.push({
    severity: 'warn',
    type: 'dead-reference',
    message: `RULES-INDEX.md で言及されているが AGENTS.md に存在なし (死参照): ${deadReferences.length} 件`,
    items: deadReferences,
  });
}
if (indexRetiredArr.length > 0) {
  issues.push({
    severity: 'info',
    type: 'retired-declaration',
    message: `RULES-INDEX.md 内で欠番/撤去/廃止等と宣言されている §N (正規説明): ${indexRetiredArr.length} 件`,
    items: indexRetiredArr,
  });
}

const warnCount = issues.filter((i) => i.severity === 'warn').length;
const summary = {
  agents_defined: agentsDefined.size,
  agents_all_refs: agentsAllRefs.size,
  index_all_refs: indexAllRefs.size,
  missing_in_index: missingInIndex.length,
  missing_but_parent_exists: missingButParentExists.length,
  dead_references: deadReferences.length,
  retired_declarations: indexRetiredArr.length,
  warn_count: warnCount,
  passed: warnCount === 0,
};

if (ARG_JSON) {
  console.log(JSON.stringify({ summary, issues }, null, 2));
  process.exit(0);
}

console.log('### Cross-reference audit (AGENTS.md ↔ RULES-INDEX.md / I-11)');
console.log('');
console.log(`- AGENTS.md 定義済 §N: **${summary.agents_defined}** 件`);
console.log(`- AGENTS.md 全言及 §N: ${summary.agents_all_refs} 件`);
console.log(`- RULES-INDEX.md 言及 §N: **${summary.index_all_refs}** 件`);
console.log('');

if (summary.passed) {
  console.log(`✅ pass: AGENTS.md と RULES-INDEX.md の §N drift (warn) なし`);
  if (summary.missing_but_parent_exists > 0) {
    console.log(`  (info: sub-section 個別未列挙 ${summary.missing_but_parent_exists} 件は親登録あり = 許容)`);
  }
} else {
  console.log(`⚠️ ${warnCount} 種類の warn-level drift を検出`);
  console.log('');
  for (const issue of issues) {
    const icon = issue.severity === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${issue.message}`);
    if (ARG_VERBOSE || issue.items.length <= 8) {
      for (const item of issue.items) console.log(`  - ${item}`);
    } else {
      for (const item of issue.items.slice(0, 8)) console.log(`  - ${item}`);
      console.log(`  - ... (他 ${issue.items.length - 8} 件 / --verbose で全表示)`);
    }
    console.log('');
  }
  console.log('**対応**:');
  console.log('- 索引漏れ (missing-in-index) → RULES-INDEX.md に新ルールを追記');
  console.log('- 死参照 (dead-reference) → RULES-INDEX.md から削除済ルール記述を削除');
}

process.exit(0);
