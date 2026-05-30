#!/usr/bin/env node
/**
 * Desktop「AI緊急用」28-CONSTITUTION-GENRE-MAP.txt を生成する。
 * 正本: docs/constitution/README.md + 18-ai-team-read-map.md
 * @see chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(
  root,
  'chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt',
);

const GENRES = [
  ['00-preamble', '前文・体系図・レーン', '初回・迷ったとき', 'CIO'],
  ['01-fundamentals', '§0〜§3・モデル・正本', '毎タスク開始', 'CIO'],
  ['02-kintone-development', '§4〜§8 kintone', '実装・deploy', 'CIO→Composer'],
  ['03-quality-engineering', '§9〜§15 品質', '監査・戦略', 'CIO'],
  ['04-environment-security', '§16〜§18 環境・秘密', 'mcp.json・WSL', 'CIO'],
  ['05-knowledge-rag', '§19〜§21 RAG', 'ドキュ・検索', 'CIO/Kimi'],
  ['06-mcp-disaster-recovery', '§22〜§25 MCP障害', 'MCP 不通', 'CIO'],
  ['07-frontend-web-quality', '§26〜§30 UI/a11y', 'FE・Playwright', 'Composer'],
  ['08-deliverables-architecture', '§31〜§33 納品', '長文・資料', 'Kimi'],
  ['09-human-autonomy-reporting', '§34〜§41 報告', '報告・§41一問', 'CIO'],
  ['10-session-operations', '§42〜§46 セッション', '切替・朝', 'CIO'],
  ['11-professional-judgment', '§47〜§49 批判', '複数案・却下', 'CIO'],
  ['12-mcp-usage', '§50 系 MCP', 'MCP 選択', 'CIO'],
  ['13-parallel-session', '§51 系 並列', '並列可否', 'CIO'],
  ['14-self-governance-safemode', '§55 セーフ', 'safe-mode', 'CIO'],
  ['15-raci-responsibility', '§52・Tier', 'Tier A/B', 'CIO'],
  ['16-amendment-process', '§57 改定', '憲法改定', 'CIO'],
];

const MANUAL = [
  ['00-rule-hierarchy', '3階層索引', '迷ったら最初', '全員'],
  ['17-four-ai-mode-b', '§1-2-3-4・§50-3-11', '4AI・開発', 'CIO'],
  ['18-ai-team-read-map', '役割別ナビ', '誰が何を読む', '全員'],
  ['19-governance-four-ai-kernel', '統制・2名チェック', '毎ターン・着手前', 'CIO'],
  ['20-cost-token-defense-kernel', '15ターン・荷造り', '長セッション', 'CIO'],
  ['21-autonomous-patrol-kernel', '週末監査', '土日', 'CIO'],
  ['22-error-handling-kernel', 'エスカレ・3択', 'verify失敗', 'CIO'],
];

const TASK_ROUTE = [
  ['kintone customize/deploy', '02 + 17 + 19', 'DeepSeek→Composer'],
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

  lines.push('【28-CONSTITUTION-GENRE-MAP】憲法・ルール — ジャンル早見（4AI・Desktop 控え）');
  lines.push(`生成: ${ymd} JST — npm run constitution:sync-genre-desktop-map`);
  lines.push('正本: docs/constitution/README.md（全文）／リポ AGENTS.md（§ 番号の正）');
  lines.push('');
  lines.push('■■ 読み方（見落とし防止・3ステップ）');
  lines.push('  1) 本ファイル（28）でタスク→ジャンルを特定');
  lines.push('  2) リポ docs/constitution/<ファイル>.md を Read（1〜2本だけ）');
  lines.push('  3) 必要時のみ AGENTS.md 該当 § を正本確認');
  lines.push('');
  lines.push('■■ 3階層（どれを読むか迷ったら）');
  lines.push('  第1 憲法 … AGENTS.md / docs/constitution / mode-b-canonical.mdc');
  lines.push('  第2 機械 … verify:* / cio:guard:* / smoke:quiet');
  lines.push('  第3 runbook … docs/runbooks/*.md');
  lines.push('');
  lines.push('■■ 4AI — 誰が何を読む（抜け防止）');
  lines.push('  ① CIO … 00-rule-hierarchy → RULES-INDEX → ジャンル1〜2本 → 19（毎ターン）');
  lines.push('  ② Composer … 02 + customize SPEC + constitutional-focus-kintone-customize.mdc');
  lines.push('  ③ Kimi … 08 + CIO 指定 SPEC 抜粋（長文・レビューのみ）');
  lines.push('  ④ DeepSeek … deepseek-cursor-spec-division + SPEC 抜粋（§50-3-8 のみ）');
  lines.push('');
  lines.push('■■ ジャンル一覧（AGENTS 抽出 00〜16）');
  lines.push(`${pad('ファイル', 28)} ${pad('内容', 22)} ${pad('いつ', 16)} 主担当`);
  lines.push('-'.repeat(78));
  for (const [f, desc, when, who] of GENRES) {
    lines.push(`${pad(f + '.md', 28)} ${pad(desc, 22)} ${pad(when, 16)} ${who}`);
  }
  lines.push('');
  lines.push('■■ 手動・カーネル（Phase2 / AI-KERNEL 4要素）');
  lines.push(`${pad('ファイル', 28)} ${pad('内容', 22)} ${pad('いつ', 16)} 主担当`);
  lines.push('-'.repeat(78));
  for (const [f, desc, when, who] of MANUAL) {
    lines.push(`${pad(f + '.md', 28)} ${pad(desc, 22)} ${pad(when, 16)} ${who}`);
  }
  lines.push('');
  lines.push('■■ タスク種別 → 読本（最短ルート）');
  for (const [task, genres, note] of TASK_ROUTE) {
    lines.push(`  · ${task} → ${genres}（${note}）`);
  }
  lines.push('');
  lines.push('■■ Desktop 読取順（憲法まわり）');
  lines.push('  14-READ-06（分業チェック）→ **28（本ファイル）** → 18-重要確認 → 25-checkpoint');
  lines.push('  詳細条文はリポ Read。Desktop だけでは完結しない（意図的）。');
  lines.push('');
  lines.push('■■ 機械検証（変更後は CIO が実行）');
  lines.push('  npm run verify:constitution-genre-kernels');
  lines.push('  npm run constitution:verify-coverage');
  lines.push('  npm run verify:cio-four-ai-governance');
  lines.push('  npm run session-starter:sync-desktop && npm run verify:desktop-ai-emergency-sync');
  lines.push('');

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`[constitution:sync-genre-desktop-map] OK → ${outPath}`);
}

main();
