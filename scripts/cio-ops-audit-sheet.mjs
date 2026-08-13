#!/usr/bin/env node
/**
 * 監査1枚 — 既存情報の要約。ゲート追加なし。常に exit 0。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readCheckpointHead } from './lib/cio-checkpoint-read.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args, timeout = 20000) {
  return spawnSync(cmd, args, { cwd: root, encoding: 'utf8', timeout, shell: false });
}

function healthLine() {
  const dir = path.join(root, 'logs/health');
  try {
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('-health.json')).sort()
      : [];
    if (files.length) {
      const j = JSON.parse(fs.readFileSync(path.join(dir, files.at(-1)), 'utf8'));
      const s = j.summary || {};
      return `health ${s.ok ?? '?'} OK / ${s.ng ?? '?'} NG / ${s.warn ?? 0} warn（ログ ${files.at(-1)}）`;
    }
  } catch {
    /* fall through */
  }
  return 'health ログなし（WAKE の health-check を正とする）';
}

function ghaLine() {
  const r = run('gh', ['run', 'list', '--limit', '5', '--json', 'conclusion,name,status']);
  if (r.status !== 0) return 'GHA 取得スキップ（gh 未疎通）';
  try {
    const rows = JSON.parse(r.stdout || '[]');
    const bad = rows.filter((x) => x.conclusion && x.conclusion !== 'success');
    return bad.length ? `GHA 直近に非success ${bad.length}` : `GHA 直近${rows.length}件 success/進行`;
  } catch {
    return 'GHA 解析スキップ';
  }
}

function creditLine() {
  const r = run('node', ['scripts/credit-budget.mjs', 'status', '--json']);
  try {
    const j = JSON.parse(r.stdout || '{}');
    return `credit ${j.latest_percent ?? '未記録'}% ${j.warning_label || ''}`.trim();
  } catch {
    return 'credit 未取得';
  }
}

function goWaitLine() {
  const m = readCheckpointHead(root, 2500).match(/\*\*GO待ち\*\*:\s*([^\n]+)/);
  return m ? m[1].trim() : 'GO待ち 行なし';
}

function closuresLine() {
  const p = path.join(root, 'data/cio-project-closures.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const n = (j.closures || []).filter((c) => c.status === 'closed-v1').length;
  return `closures closed-v1=${n}`;
}

function main() {
  const lines = [
    '# 監査1枚（見る用・止まらない）',
    '',
    `- ${healthLine()}`,
    `- ${ghaLine()}`,
    `- ${creditLine()}`,
    `- GO待ち: ${goWaitLine()}`,
    `- ${closuresLine()}`,
    '',
    '赤でもセッションは止めない。ゲートは増やさない。',
    '',
  ];
  const text = lines.join('\n');
  console.log(text);
  fs.writeFileSync(path.join(root, 'chat-sessions/ops-audit-latest.md'), text, 'utf8');
  process.exit(0);
}

main();
