#!/usr/bin/env node
/**
 * check-mcp-dormancy.mjs — MCP 死蔵検知 (改善案 #12 戦略 / 次元 2 補強)
 *
 * 検査内容:
 *   1. ~/.cursor/mcp.json から MCP 全件を読込
 *   2. 過去 N 日 (デフォルト 7) の Cursor agent transcripts を grep
 *      使用パターン:
 *        - "server":"user-<name>"  (call_mcp_tool 経由)
 *        - mcp_<name>_<tool>       (Cursor の直接呼出形式)
 *        - mcp__<name>__<tool>     (Claude Code 形式)
 *   3. 各 MCP の使用回数集計
 *   4. 過去 N 日 0 回 = 死蔵警告 ⚠ 表示
 *
 * オプション:
 *   --days=7        : 検査期間日数 (デフォルト 7)
 *   --json          : JSON のみ出力
 *   --strict        : 過去 30 日 0 回を deletion candidate として ❌ 表示
 *
 * 出口コード:
 *   0: 全 MCP 1 回以上使用 / 警告なし
 *   1: 死蔵 MCP あり (1 件以上)
 *
 * 背景: 2026-04-23 MCP 強化戦略 段階 1 監査で過去 30 日使用は kintone (38 回) +
 *       playwright (2 回) のみ = 14/16 (87.5%) が死蔵と判明。
 *       本スクリプトで継続監視可能化。月次健康診断 (R22 / 5/1 開始) と統合予定。
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const ARG_JSON = args.includes('--json');
const ARG_STRICT = args.includes('--strict');
const daysArg = args.find((a) => a.startsWith('--days='));
const DAYS = daysArg ? Number(daysArg.slice('--days='.length)) : 7;
const STRICT_DAYS = 30;

function out(msg) { if (!ARG_JSON) console.log(msg); }

// ───── 1. mcp.json 読込 ─────
const mcpJsonPath = path.join(os.homedir(), '.cursor', 'mcp.json');
if (!fs.existsSync(mcpJsonPath)) {
  if (ARG_JSON) console.log(JSON.stringify({ status: 'fatal', error: 'mcp.json not found' }));
  else out('## 📦 MCP 死蔵検知\n\n❌ FATAL: mcp.json not found');
  process.exit(2);
}

let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
} catch (e) {
  if (ARG_JSON) console.log(JSON.stringify({ status: 'fatal', error: `parse error: ${e.message}` }));
  else out(`## 📦 MCP 死蔵検知\n\n❌ FATAL: parse error: ${e.message}`);
  process.exit(2);
}

const mcpServers = cfg.mcpServers || {};
const mcpNames = Object.keys(mcpServers);

/** 憲法 CIO 体制（本体=Cursor / Kimi・DeepSeek・OpenRouter=補助）で、transcript ベースの 7 日窓に出ない運用が正となるサーバー */
const CIO_STACK_DORMANCY_EXEMPT = new Set(['kimi', 'deepseek', 'openrouter']);

/** health-check JSON に出る TSB-029 系: transcript に載らない低頻度でも留置きが設計上妥当な MCP */
const DORMANCY_POLICY_EXEMPT_REASON = new Map([
  ['markdownify', 'TSB-029: markdownify は低頻度・initialize 確認中心 (7d transcript=0 は許容)'],
]);

// ───── 2. agent transcripts grep ─────
const projectsDir = path.join(os.homedir(), '.cursor', 'projects');
const now = Date.now();
const sinceShort = now - DAYS * 24 * 3600 * 1000;
const sinceStrict = now - STRICT_DAYS * 24 * 3600 * 1000;

function collectTranscripts(since) {
  const list = [];
  if (!fs.existsSync(projectsDir)) return list;
  for (const proj of fs.readdirSync(projectsDir)) {
    const transcriptsDir = path.join(projectsDir, proj, 'agent-transcripts');
    if (!fs.existsSync(transcriptsDir)) continue;
    for (const uuid of fs.readdirSync(transcriptsDir)) {
      const file = path.join(transcriptsDir, uuid, `${uuid}.jsonl`);
      if (!fs.existsSync(file)) continue;
      const stat = fs.statSync(file);
      if (stat.mtimeMs >= since) list.push(file);
    }
  }
  return list;
}

function countUsage(files, mcpName) {
  let total = 0;
  // 3 つのパターンを集計
  const patterns = [
    new RegExp(`"server"\\s*:\\s*"(user-)?${mcpName}"`, 'g'),
    new RegExp(`"mcp_${mcpName}_[a-z][a-z0-9_-]+"`, 'g'),
    new RegExp(`mcp__${mcpName}__[a-z][a-z0-9_-]+`, 'g'),
  ];
  for (const file of files) {
    let content;
    try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
    for (const re of patterns) {
      const matches = content.match(re);
      if (matches) total += matches.length;
    }
  }
  return total;
}

const shortFiles = collectTranscripts(sinceShort);
const strictFiles = ARG_STRICT ? collectTranscripts(sinceStrict) : null;

// ───── 3. 集計 ─────
// ⚠ 2026-04-24 (S12 v2 / Phase Z 第 2 ループで発覚した false positive 対策):
//    Windows-side MCP (github / office-powerpoint) は WSL からの usage log に
//    現れず常に dormant 誤判定されていた。mcp.json の _meta.dormancy_exempt: true
//    フラグを読み取り、exempt status として分類 (dormant にも deletion にもカウントせず)。
//    詳細: docs/plans/_future/2026-05-01-s12-v2-windows-exempt.md
const results = mcpNames.map((name) => {
  const shortCount = countUsage(shortFiles, name);
  const strictCount = ARG_STRICT ? countUsage(strictFiles, name) : null;
  const disabled = !!mcpServers[name].disabled;
  const meta = mcpServers[name]._meta || {};
  const cioExempt = CIO_STACK_DORMANCY_EXEMPT.has(name);
  const metaExempt = !!meta.dormancy_exempt;
  const policyReason = DORMANCY_POLICY_EXEMPT_REASON.get(name);
  const policyExempt = !!policyReason;
  const exemptReason =
    meta.exempt_reason
    || (cioExempt && shortCount === 0 ? 'CIO alternate LLM (transcript 7d 未出現は設計上可)' : null)
    || (policyExempt && shortCount === 0 ? policyReason : null);
  let status;
  if (metaExempt) status = 'exempt';
  else if (cioExempt && shortCount === 0) status = 'exempt';
  else if (policyExempt && shortCount === 0) status = 'exempt';
  else if (disabled) status = 'disabled';
  else if (shortCount === 0 && ARG_STRICT && strictCount === 0) status = 'deletion-candidate';
  else if (shortCount === 0) status = 'dormant';
  else status = 'active';
  const exempt = status === 'exempt';
  return { name, shortCount, strictCount, disabled, exempt, exemptReason, status };
});

const dormantCount = results.filter((r) => r.status === 'dormant').length;
const deletionCandidateCount = results.filter((r) => r.status === 'deletion-candidate').length;
const activeCount = results.filter((r) => r.status === 'active').length;
const disabledCount = results.filter((r) => r.status === 'disabled').length;
const exemptCount = results.filter((r) => r.status === 'exempt').length;

const summary = {
  generated_at: new Date().toISOString(),
  window_short_days: DAYS,
  window_strict_days: ARG_STRICT ? STRICT_DAYS : null,
  total: mcpNames.length,
  active: activeCount,
  dormant: dormantCount,
  deletion_candidate: deletionCandidateCount,
  disabled: disabledCount,
  exempt: exemptCount,
  status: dormantCount === 0 && deletionCandidateCount === 0 ? 'ok' : 'ng',
  results,
};

if (ARG_JSON) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.status === 'ok' ? 0 : 1);
}

// markdown 出力
out('## 📦 MCP 死蔵検知');
out('');
out(`**${mcpNames.length} MCP 検査** (過去 ${DAYS} 日${ARG_STRICT ? ` + strict ${STRICT_DAYS} 日` : ''}): ✅ ${activeCount} 稼働 / ⚠ ${dormantCount} 死蔵 / ❌ ${deletionCandidateCount} 削除候補 / ⏸ ${disabledCount} disabled / ⚪ ${exemptCount} exempt`);
out('');
out('| MCP | 過去 ' + DAYS + ' 日 | ' + (ARG_STRICT ? '過去 ' + STRICT_DAYS + ' 日 | ' : '') + '状態 | 備考 |');
out('|---|---|' + (ARG_STRICT ? '---|' : '') + '---|---|');
for (const r of results) {
  const icon = { active: '✅', dormant: '⚠', 'deletion-candidate': '❌', disabled: '⏸', exempt: '⚪' }[r.status];
  const strictCol = ARG_STRICT ? `${r.strictCount} | ` : '';
  const note = r.status === 'exempt' ? (r.exemptReason || 'dormancy_exempt') : '';
  out(`| ${r.name} | ${r.shortCount} | ${strictCol}${icon} ${r.status} | ${note} |`);
}
out('');

if (dormantCount > 0 || deletionCandidateCount > 0) {
  out('### 推奨アクション');
  out('');
  if (deletionCandidateCount > 0) {
    out(`- ❌ **削除候補 ${deletionCandidateCount} 件**: 過去 ${STRICT_DAYS} 日 0 回 = mcp.json から除去検討`);
  }
  if (dormantCount > 0) {
    out(`- ⚠ **死蔵 ${dormantCount} 件**: 過去 ${DAYS} 日 0 回 = AGENTS.md §50 想起儀式の対象 / 実戦投入機会を設けるか検討`);
  }
  out('');
  out('> 月次健康診断 (5/1 開始 / R22 改善案 #15) と統合予定');
  out('');
}

process.exit(summary.status === 'ok' ? 0 : 1);
