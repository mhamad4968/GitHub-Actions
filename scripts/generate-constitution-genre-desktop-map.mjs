#!/usr/bin/env node
/**
 * Desktop「AI緊急用」28-CONSTITUTION-GENRE-MAP.txt を生成する。
 * 正本: data/constitution-genre-catalog.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDesktopGenres, getDesktopManual } from './lib/constitution-genre-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(
  root,
  'chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt',
);

const TASK_ROUTE = [
  ['kintone customize/deploy', '02 + 17 + 19 + 24', 'DeepSeek→Composer'],
  ['新規 DB+Dash 台帳', '24 + db-dash-v1-launch', 'CIO→Composer'],
  ['報告・締め・GO仰ぎ', '09 + 19', 'report-verify-response'],
  ['セッション切替', '10 + 25-checkpoint', 'session:bootstrap'],
  ['MCP 選定', '12 + docs/mcp-status.md', 'cio:mcp:env'],
  ['並列可否', '13', '5点チェック'],
  ['Tier B / GO', '15', '浜田 GO 後 AI 実行'],
  ['長文 SPEC/資料', '08', 'Kimi レビュー'],
  ['FE 実装', '07', 'playwright/chrome-devtools'],
];

function pad(s, n) {
  const t = String(s);
  return t.length >= n ? t : t + ' '.repeat(n - t.length);
}

function main() {
  const lines = [];
  const ymd = new Date().toISOString().slice(0, 10);
  const GENRES = getDesktopGenres();
  const MANUAL = getDesktopManual();

  lines.push('【28-CONSTITUTION-GENRE-MAP】憲法・ルール — ジャンル早見（4AI・Desktop 控え）');
  lines.push(`生成: ${ymd} JST — npm run constitution:sync-genre-desktop-map`);
  lines.push('正本: data/constitution-genre-catalog.json／リポ AGENTS.md（§ 番号の正）');
  lines.push('');
  lines.push('■■ 読み方（見落とし防止 · L0→L2）');
  lines.push('  0) 27-navigation-charter（3入口・mandatory_reads）');
  lines.push('  1) 本ファイル（28）でタスク→ジャンルを特定');
  lines.push('  2) リポ docs/constitution/<ファイル>.md を Read（1〜2本だけ）');
  lines.push('  3) 必要時のみ AGENTS.md 該当 § を正本確認');
  lines.push('');
  lines.push('■■ 3階層（どれを読むか迷ったら）');
  lines.push('  第1 憲法 … AGENTS.md / docs/constitution / mode-b-canonical.mdc');
  lines.push('  第2 機械 … verify:* / cio:guard:* / smoke:quiet');
  lines.push('  第3 runbook … docs/runbooks/*.md');
  lines.push('');
  lines.push('■■ ジャンル早見（AGENTS 抽出 17 + 手動 Phase2）');
  lines.push(`${pad('ID', 22)} ${pad('概要', 28)} ${pad('いつ', 16)} 主担当`);
  lines.push('-'.repeat(88));
  for (const [id, summary, when, owner] of GENRES) {
    lines.push(`${pad(id, 22)} ${pad(summary, 28)} ${pad(when, 16)} ${owner}`);
  }
  lines.push('');
  lines.push('■■ Phase2 手動 + META チャーター（00/17/18/19-27）');
  lines.push(`${pad('ID', 22)} ${pad('概要', 28)} ${pad('いつ', 16)} 主担当`);
  lines.push('-'.repeat(88));
  for (const [id, summary, when, owner] of MANUAL) {
    lines.push(`${pad(id, 22)} ${pad(summary, 28)} ${pad(when, 16)} ${owner}`);
  }
  lines.push('');
  lines.push('■■ タスク → 読本（1〜2本）');
  lines.push(`${pad('タスク', 28)} ${pad('読本', 20)} 主担当`);
  lines.push('-'.repeat(72));
  for (const [task, reads, owner] of TASK_ROUTE) {
    lines.push(`${pad(task, 28)} ${pad(reads, 20)} ${owner}`);
  }
  lines.push('');
  lines.push('■■ 4AI — 誰が何を読む');
  lines.push('  CIO … mode-b-canonical + RULES-INDEX + 19-governance-four-ai-kernel');
  lines.push('  Composer … customize SPEC + constitutional-focus-kintone-customize');
  lines.push('  Kimi … 08-deliverables + 依頼 SPEC');
  lines.push('  DeepSeek … deepseek-cursor-spec-division + 突合3行');
  lines.push('');
  lines.push('検証: npm run verify:constitution-genre-kernels / verify:cio-four-ai-governance');

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${lines.join('\r\n')}\r\n`, 'utf8');
  console.log('[constitution:sync-genre-desktop-map] OK →', outPath);
}

main();
