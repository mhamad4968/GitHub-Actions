#!/usr/bin/env node
/**
 * scan-plans.mjs — docs/plans/*.md の未完了チェックボックスを抽出
 *
 * 対象: `- [ ]` で始まる行（既存 markdown TODO 構文）
 * 出力: stdout に markdown レポート（朝ブリーフィングに埋め込まれる）
 * 出口コード: 常に 0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const PLANS_DIR = path.join(REPO_ROOT, 'docs', 'plans');

if (!fs.existsSync(PLANS_DIR)) {
  console.log('### 未完了タスク（docs/plans/）');
  console.log('');
  console.log('_docs/plans/ ディレクトリなし。_');
  process.exit(0);
}

const files = fs.readdirSync(PLANS_DIR).filter((f) => f.endsWith('.md'));

const allItems = [];
for (const f of files) {
  const full = path.join(PLANS_DIR, f);
  const text = fs.readFileSync(full, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (/^\s*-\s*\[\s\]\s+/.test(line)) {
      allItems.push({
        file: f,
        line: idx + 1,
        text: line.trim().slice(0, 200),
      });
    }
  });
}

console.log('### 未完了タスク（docs/plans/）');
console.log('');

if (allItems.length === 0) {
  console.log('_未完了タスクなし。_');
  process.exit(0);
}

const byFile = new Map();
for (const it of allItems) {
  if (!byFile.has(it.file)) byFile.set(it.file, []);
  byFile.get(it.file).push(it);
}

console.log(`> **${allItems.length} 件の未完了項目を ${byFile.size} ファイルから検出**`);
console.log('');

for (const [file, items] of byFile) {
  console.log(`#### ${file}`);
  console.log('');
  for (const it of items.slice(0, 10)) {
    console.log(`- L${it.line}: ${it.text}`);
  }
  if (items.length > 10) console.log(`- ...他 ${items.length - 10} 件`);
  console.log('');
}

process.exit(0);
