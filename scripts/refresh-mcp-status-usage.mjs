#!/usr/bin/env node
/**
 * docs/mcp-status.md の MCP 一覧表「過去 30 日使用」列を、
 * check-mcp-dormancy.mjs（30 日・strict JSON）の集計で上書きする。
 *
 * 前提: ~/.cursor/projects/ 配下の agent-transcripts にアクセスできる環境（通常 WSL）で実行。
 *
 * 用法:
 *   node scripts/refresh-mcp-status-usage.mjs           # 書き込み
 *   node scripts/refresh-mcp-status-usage.mjs --dry-run
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DRY = process.argv.includes('--dry-run');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const STATUS_PATH = path.join(REPO_ROOT, 'docs', 'mcp-status.md');
const DORMANCY = path.join(REPO_ROOT, 'scripts', 'check-mcp-dormancy.mjs');

/** 表の行番号（# 列）→ mcp.json キー（null は列を触らない／固定文） */
const ROW_KEY = {
  1: 'github',
  2: 'cyber-news',
  3: 'office-powerpoint',
  4: 'duckduckgo-search',
  5: 'filesystem',
  6: 'memory',
  7: 'fetch',
  8: 'sequential-thinking',
  9: 'kintone',
  10: 'kintone-dev',
  11: 'kintone-space',
  12: null, // tavily 削除行・固定
  13: 'playwright',
  14: 'cve-search',
  15: 'rag',
  16: 'accessibility-scanner',
  17: 'figma',
  18: null, // 任意 MCP・台帳にキーが無い場合は据え置き
  19: 'colors-fonts',
};

function jstYmd() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

function loadUsageByName() {
  const r = spawnSync(process.execPath, [DORMANCY, '--days=30', '--strict', '--json'], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
  });
  if (r.error) throw r.error;
  // deletion-candidate ありでも JSON は出る（exit 1）
  if (r.status !== 0 && r.status !== 1) {
    throw new Error(r.stderr || `check-mcp-dormancy exit ${r.status}`);
  }
  const data = JSON.parse(r.stdout || '{}');
  const map = new Map();
  for (const r of data.results || []) {
    map.set(r.name, r);
  }
  return map;
}

function usageCell(key, byName) {
  if (key == null) return null;
  const r = byName.get(key);
  if (!r) return '—';
  if (r.status === 'exempt') return '0 回（exempt）';
  const n = typeof r.shortCount === 'number' ? r.shortCount : 0;
  if (n === 0) return '**0 回**';
  return `**${n} 回**`;
}

function replaceUsageColumn(line, usageText) {
  const segs = line.split('|');
  if (segs.length < 7) return line;
  segs[4] = ` ${usageText} `;
  return segs.join('|');
}

function main() {
  const byName = loadUsageByName();
  let text = fs.readFileSync(STATUS_PATH, 'utf8');
  const lines = text.split(/\n/);
  let changed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^\|\s*(\d+)\s*\|/.exec(line);
    if (!m) continue;
    const num = Number(m[1]);
    if (num < 1 || num > 19) continue;

    if (num === 12) {
      const next = replaceUsageColumn(line, '0 回（削除済）');
      if (next !== line) changed++;
      lines[i] = next;
      continue;
    }
    if (num === 18) continue;

    const key = ROW_KEY[num];
    if (key == null) continue;

    const cell = usageCell(key, byName);
    if (cell == null) continue;
    const next = replaceUsageColumn(line, cell);
    if (next !== line) changed++;
    lines[i] = next;
  }

  const ymd = jstYmd();
  const idx = lines.findIndex((l) => l.startsWith('**初版作成**'));
  if (idx >= 0) {
    let L = lines[idx];
    if (/\*\*未再集計\*\*/.test(L)) {
      L = L.replace(
        /表の過去30日カウント自体は\*\*未再集計\*\*/,
        `表の「過去30日」欄は **${ymd}** CIO \`npm run mcp-status:refresh-usage\` で再集計済`,
      );
    } else if (/表の「過去30日」欄は \*\*\d{4}-\d{2}-\d{2}\*\*/.test(L)) {
      L = L.replace(
        /表の「過去30日」欄は \*\*\d{4}-\d{2}-\d{2}\*\* CIO `npm run mcp-status:refresh-usage` で再集計済/,
        `表の「過去30日」欄は **${ymd}** CIO \`npm run mcp-status:refresh-usage\` で再集計済`,
      );
    }
    if (L !== lines[idx]) {
      lines[idx] = L;
      changed++;
    }
  }

  const out = lines.join('\n');
  if (DRY) {
    console.log(`[refresh-mcp-status-usage] dry-run JST=${ymd} table+header 変更行相当: ${changed} (実書き込みなし)`);
    return;
  }
  fs.writeFileSync(STATUS_PATH, out, 'utf8');
  console.log(`[refresh-mcp-status-usage] ✅ ${STATUS_PATH} 更新 JST=${ymd}（差分相当 ${changed} 箇所）`);
}

main();
