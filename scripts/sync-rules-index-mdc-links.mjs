#!/usr/bin/env node
/**
 * RULES-INDEX.md に .cursor/rules/*.mdc 逆引き表を自動追記（Phase 2-B）
 * マーカー間のみ上書き。手編集はマーカー外に書く。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES_INDEX = path.join(root, 'RULES-INDEX.md');
const TOPIC_INDEX = path.join(root, 'data', 'cursor-rules-topic-index.json');
const RULES_DIR = path.join(root, '.cursor', 'rules');

const BEGIN = '<!-- RULES-INDEX:CURSOR-RULES-AUTO:BEGIN -->';
const END = '<!-- RULES-INDEX:CURSOR-RULES-AUTO:END -->';

/** @param {string | { name: string; discoveryOnly?: boolean }} entry */
function fileName(entry) {
  const n = typeof entry === 'string' ? entry : entry.name;
  return n.endsWith('.mdc') ? n : `${n}.mdc`;
}

function parseDescription(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return '(no frontmatter)';
  const desc = m[1].match(/description:\s*(.+)/i);
  return desc ? desc[1].trim() : '(no description)';
}

function listMdcOnDisk() {
  return fs
    .readdirSync(RULES_DIR)
    .filter((n) => n.endsWith('.mdc'))
    .sort();
}

function buildAutoBlock() {
  const index = JSON.parse(fs.readFileSync(TOPIC_INDEX, 'utf8'));
  const onDisk = new Set(listMdcOnDisk());
  const lines = [];
  lines.push(BEGIN);
  lines.push('');
  lines.push('## Cursor ルール逆引き（自動生成・編集禁止）');
  lines.push('');
  lines.push(`**更新**: \`npm run rules:sync-mdc-index\`（${new Date().toISOString().slice(0, 10)} JST）`);
  lines.push('');
  lines.push('| トピック | ファイル | description（frontmatter） |');
  lines.push('|----------|----------|---------------------------|');

  const indexed = new Set();
  for (const topic of index.topics) {
    for (const file of topic.files) {
      const name = fileName(file);
      if (!onDisk.has(name)) continue;
      indexed.add(name);
      const content = fs.readFileSync(path.join(RULES_DIR, name), 'utf8');
      const desc = parseDescription(content).replace(/\|/g, '\\|').slice(0, 120);
      lines.push(
        `| ${topic.label} | [\`${name}\`](.cursor/rules/${name}) | ${desc} |`,
      );
    }
  }

  for (const name of onDisk) {
    if (indexed.has(name)) continue;
    const content = fs.readFileSync(path.join(RULES_DIR, name), 'utf8');
    const desc = parseDescription(content).replace(/\|/g, '\\|').slice(0, 120);
    lines.push(`| （未分類） | [\`${name}\`](.cursor/rules/${name}) | ${desc} |`);
  }

  lines.push('');
  lines.push('索引: [`.cursor/rules/README.md`](.cursor/rules/README.md) / [`data/cursor-rules-topic-index.json`](data/cursor-rules-topic-index.json)');
  lines.push('');
  lines.push(END);
  return lines.join('\r\n');
}

function main() {
  const dry = process.argv.includes('--dry-run');
  let body = fs.readFileSync(RULES_INDEX, 'utf8');
  const block = buildAutoBlock();

  if (body.includes(BEGIN) && body.includes(END)) {
    const re = new RegExp(
      `${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    );
    body = body.replace(re, block);
  } else {
    const insertAt = body.indexOf('## ジャンル読本');
    if (insertAt === -1) {
      body = `${body.trimEnd()}\r\n\r\n${block}\r\n`;
    } else {
      body = `${body.slice(0, insertAt)}${block}\r\n\r\n${body.slice(insertAt)}`;
    }
  }

  if (dry) {
    console.log('[sync-rules-index-mdc-links] dry-run OK (would update RULES-INDEX.md)');
    process.exit(0);
  }

  fs.writeFileSync(RULES_INDEX, body.endsWith('\r\n') ? body : `${body}\r\n`, 'utf8');
  console.log('[sync-rules-index-mdc-links] OK RULES-INDEX.md cursor-rules section updated');
}

main();
