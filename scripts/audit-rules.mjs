#!/usr/bin/env node
/**
 * audit-rules.mjs — AGENTS.md ↔ RULES-INDEX.md / WORKFLOW.md の整合性チェック
 *
 * 検出する異常:
 * 1. 破断リンク: RULES-INDEX.md / WORKFLOW.md が参照する §N が AGENTS.md に存在しない
 * 2. 未参照ルール: AGENTS.md に定義されているが他から参照されていない §N
 *
 * 防御フィルタ（誤検出を避ける）:
 * - 「§40 (欠番)」「§N (参考)」など括弧付き注釈は無視
 * - 「※ §N」「注: §N」のコメント記法は無視
 * - コメント行（<!-- ... -->）内の §N 参照は無視
 *
 * 出力: stdout に整合性レポート (markdown)
 * 出口コード: 常に 0（朝ブリーフィングを止めない）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');

const AGENTS = path.join(REPO_ROOT, 'AGENTS.md');
const RULES_INDEX = path.join(REPO_ROOT, 'RULES-INDEX.md');
const WORKFLOW = path.join(REPO_ROOT, 'WORKFLOW.md');

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

/** 「### §N タイトル」「## §N」等から定義番号を抽出 */
function extractDefined(text) {
  const re = /^#{2,4}\s*§(\d+)\b/gm;
  const set = new Set();
  let m;
  while ((m = re.exec(text)) !== null) set.add(Number(m[1]));
  return set;
}

/**
 * 参照されている §N を抽出（防御フィルタ付き）
 * - 「§40 (欠番)」「(欠番)」「※」「注:」「<!--」を含む行は除外
 */
function extractReferences(text) {
  const set = new Set();
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (/欠番|参考|<!--|^\s*※|^\s*注[:：]/u.test(line)) continue;
    const matches = line.matchAll(/§(\d+)\b/g);
    for (const m of matches) set.add(Number(m[1]));
  }
  return set;
}

const agentsText = readFile(AGENTS);
const indexText = readFile(RULES_INDEX);
const workflowText = readFile(WORKFLOW);

const defined = extractDefined(agentsText);
const refIndex = extractReferences(indexText);
const refWorkflow = extractReferences(workflowText);

const allRefs = new Set([...refIndex, ...refWorkflow]);
const broken = [...allRefs].filter((n) => !defined.has(n)).sort((a, b) => a - b);
const unreferenced = [...defined].filter((n) => !allRefs.has(n)).sort((a, b) => a - b);

const definedList = [...defined].sort((a, b) => a - b).map((n) => `§${n}`).join(' / ');

console.log('### ルール整合性チェック');
console.log('');
console.log(`- AGENTS.md 定義: ${definedList || '(なし)'}`);
console.log(`- RULES-INDEX.md: ${refIndex.size} 個の §N 参照`);
console.log(`- WORKFLOW.md: ${refWorkflow.size} 個の §N 参照`);
console.log('');

if (broken.length === 0) {
  console.log('✅ 破断リンクなし（参照されている §N はすべて AGENTS.md に存在）');
} else {
  console.log(`❌ 破断リンク ${broken.length} 件: ${broken.map((n) => `§${n}`).join(' / ')}`);
}

if (unreferenced.length > 0) {
  console.log(`⚠️ 未参照ルール: ${unreferenced.map((n) => `§${n}`).join(' / ')} （定義のみで参照なし）`);
}

process.exit(0);
