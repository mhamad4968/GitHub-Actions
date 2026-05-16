#!/usr/bin/env node
/**
 * verify-ci-rule-integrity.mjs — PR/CI 用: .cursor/rules の frontmatter と薄型憲法ポリシー
 *
 * - 各 *.mdc に description: があること
 * - constitution.mdc の第 1 frontmatter が alwaysApply: false であること（網羅版は常時オフ）
 * - cio-constitution.mdc が存在し alwaysApply: true であること（CIO 統合核・2026-05-09）
 * - alwaysApply: true のファイル数が上限を超えないこと（運用上限・調整は本スクリプト）
 *
 * @see .cursor/rules/cio-constitution.mdc
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDir = path.join(root, '.cursor/rules');

/** @param {string} rel */
function firstYamlFrontmatter(rel) {
  const abs = path.join(root, rel);
  const raw = fs.readFileSync(abs, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : null;
}

function fail(msg) {
  console.error(`[verify-ci-rule-integrity] ❌ ${msg}`);
  process.exit(2);
}

if (!fs.existsSync(rulesDir)) fail(`missing ${rulesDir}`);

const mdcFiles = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.mdc'));
const alwaysTrue = [];

for (const f of mdcFiles) {
  const rel = path.join('.cursor/rules', f);
  const fm = firstYamlFrontmatter(rel);
  if (!fm) fail(`${rel}: missing YAML frontmatter`);
  if (!/description:\s*.+/.test(fm)) fail(`${rel}: missing description:`);
  if (/alwaysApply:\s*true/.test(fm)) alwaysTrue.push(f);
}

// 2026-05-09 CIO: **`alwaysApply: true` は `cio-constitution.mdc` のみ**（他は `false` + `globs` 等）。上限 10 は将来の余白。
// 2026-05-07 夕: 複数ルールを glob 化し常時枠を圧縮（後に CIO 核へ集約）。
const MAX_ALWAYS = 10;
if (alwaysTrue.length > MAX_ALWAYS) {
  fail(
    `alwaysApply:true が ${alwaysTrue.length} 件（上限 ${MAX_ALWAYS}）。新規 .mdc は既定 false + globs。一覧: ${alwaysTrue.join(', ')}`,
  );
}
if (alwaysTrue.length === MAX_ALWAYS) {
  console.warn(
    `[verify-ci-rule-integrity] ⚠ alwaysApply:true が上限 ${MAX_ALWAYS} 件ぴったり。追加する前に既存を glob 化または統合してください。`,
  );
}

const cio = firstYamlFrontmatter('.cursor/rules/cio-constitution.mdc');
if (!cio) fail('cio-constitution.mdc: missing');
if (!/alwaysApply:\s*true/.test(cio)) fail('cio-constitution.mdc: must be alwaysApply: true (CIO unified kernel)');

const conFm = firstYamlFrontmatter('.cursor/rules/constitution.mdc');
if (!conFm) fail('constitution.mdc: missing frontmatter');
if (/alwaysApply:\s*true/.test(conFm)) {
  fail('constitution.mdc: 第1 frontmatter が alwaysApply:true のまま（薄型カード方針違反）');
}
if (!/alwaysApply:\s*false/.test(conFm)) {
  fail('constitution.mdc: 第1 frontmatter に alwaysApply: false がありません');
}

console.log(`[verify-ci-rule-integrity] ✅ OK（alwaysApply:true ${alwaysTrue.length} 件 / 上限 ${MAX_ALWAYS}）`);
console.log(`  alwaysApply:true: ${alwaysTrue.sort().join(', ')}`);
process.exit(0);
