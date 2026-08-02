#!/usr/bin/env node
/**
 * scan-plans.mjs — docs/plans/*.md の未完了チェックボックスを抽出
 *
 * 対象: `- [ ]` で始まる行（既存 markdown TODO 構文）
 * 日付ゲート: 行末または直前行の `<!-- scan-plans:after=YYYY-MM-DD -->`
 *   → 当日 JST がその日付未満なら朝ブリーフィングに出さない（#JULY-OPS-06）
 * 出力: stdout に markdown レポート（朝ブリーフィングに埋め込まれる）
 * 出口コード: 常に 0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jstYmdIso } from './lib/repo-node-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const PLANS_DIR = path.join(REPO_ROOT, 'docs', 'plans');

const AFTER_RE = /<!--\s*scan-plans:after=(\d{4}-\d{2}-\d{2})\s*-->/i;

/** @param {string} todayIso @param {string|null} afterIso */
export function isScanPlansVisible(todayIso, afterIso) {
  if (!afterIso) return true;
  return todayIso >= afterIso;
}

/** @param {string[]} lines @param {number} idx 0-based */
export function extractScanPlansAfter(lines, idx) {
  const line = lines[idx] || '';
  const onLine = line.match(AFTER_RE);
  if (onLine) return onLine[1];
  if (idx > 0) {
    const prev = (lines[idx - 1] || '').match(AFTER_RE);
    if (prev) return prev[1];
  }
  return null;
}

function main() {
  if (!fs.existsSync(PLANS_DIR)) {
    console.log('### 未完了タスク（docs/plans/）');
    console.log('');
    console.log('_docs/plans/ ディレクトリなし。_');
    process.exit(0);
  }

  const todayIso = jstYmdIso();
  const files = fs.readdirSync(PLANS_DIR).filter((f) => f.endsWith('.md'));

  const allItems = [];
  let gated = 0;
  for (const f of files) {
    const full = path.join(PLANS_DIR, f);
    const text = fs.readFileSync(full, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!/^\s*-\s*\[\s\]\s+/.test(line)) return;
      const after = extractScanPlansAfter(lines, idx);
      if (!isScanPlansVisible(todayIso, after)) {
        gated += 1;
        return;
      }
      allItems.push({
        file: f,
        line: idx + 1,
        text: line.replace(AFTER_RE, '').trim().slice(0, 200),
        after,
      });
    });
  }

  console.log('### 未完了タスク（docs/plans/）');
  console.log('');

  if (allItems.length === 0) {
    console.log('_未完了タスクなし。_');
    if (gated > 0) {
      console.log('');
      console.log(`> _日付ゲートで ${gated} 件を非表示（JST ${todayIso} 未満の scan-plans:after）_`);
    }
    process.exit(0);
  }

  const byFile = new Map();
  for (const it of allItems) {
    if (!byFile.has(it.file)) byFile.set(it.file, []);
    byFile.get(it.file).push(it);
  }

  console.log(`> **${allItems.length} 件の未完了項目を ${byFile.size} ファイルから検出**`);
  if (gated > 0) {
    console.log(`> _日付ゲートで ${gated} 件を非表示（JST ${todayIso}）_`);
  }
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
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) main();
