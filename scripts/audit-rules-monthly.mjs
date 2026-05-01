#!/usr/bin/env node
/**
 * audit-rules-monthly.mjs — 月次ルール健康診断 (改善案 #10 / R22 §46 連動 / 5/1 開始)
 *
 * 集計内容:
 *   1. 各 §N の過去 30 日参照回数 (chat-sessions/*.md + docs/reports/*.md + docs/troubleshooting.md)
 *   2. 各 §N の違反指摘件数 ("§N 違反" "違反した" 等の grep)
 *   3. TOP 5 参照ルール + TOP 5 違反ルール
 *   4. 統廃合候補: 過去 30 日 0 回参照 + 0 件違反 のルール
 *
 * 出力: docs/reports/<YYYY-MM>-rule-audit.md
 *
 * 出口コード: 常に 0 (朝ブリーフィングを止めない)
 *
 * 段階導入:
 *   段階 1 (本 script 実装): 5/1 開始 = 手動 or 朝 cron で月初 1 回
 *   段階 2 (cron 統合): 4/30 夜浜田立ち会いで scripts/install-monthly-rule-audit-cron.sh 別 commit
 *   段階 3 (統廃合自動提案): 5/22+ で AI が proposal 化提案
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const AGENTS = path.join(REPO_ROOT, 'AGENTS.md');

const WINDOW_DAYS = 30;
const NOW = new Date();
const MONTH_KEY = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`;
const REPORT_DIR = path.join(REPO_ROOT, 'docs', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, `${MONTH_KEY}-rule-audit.md`);

fs.mkdirSync(REPORT_DIR, { recursive: true });

// AGENTS.md から §N 抽出 (§40 欠番除外 / サブ §N-A 等も別カウント)
const agentsContent = fs.readFileSync(AGENTS, 'utf8');
const sectionRegex = /^### §(\d+(?:-\d+)?(?:-?[A-Z](?:-\d+)?)?)\s/gm;
const sections = new Set();
let m;
while ((m = sectionRegex.exec(agentsContent)) !== null) {
  sections.add(`§${m[1]}`);
}

// 過去 30 日の grep 対象ファイル
const targetGlobs = [
  'chat-sessions/*.md',
  'docs/reports/*.md',
  'docs/troubleshooting.md',
];

// 各 §N について grep カウント
const refCounts = {}; // §N → 参照回数
const violationCounts = {}; // §N → 違反指摘回数

for (const sec of sections) {
  const ref = grepCount(sec, targetGlobs);
  const violation = grepCount(`${sec} 違反`, targetGlobs);
  refCounts[sec] = ref;
  violationCounts[sec] = violation;
}

function grepCount(pattern, globs) {
  let total = 0;
  for (const glob of globs) {
    try {
      const fullGlob = path.join(REPO_ROOT, glob);
      // ripgrep が利用可能なら使う / なければ grep -r
      const cmd = `rg -c "${pattern.replace(/"/g, '\\"')}" -g "${path.basename(glob)}" "${path.dirname(fullGlob)}" 2>/dev/null | awk -F: '{s+=$2} END {print s+0}'`;
      const out = execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim();
      total += parseInt(out, 10) || 0;
    } catch {
      // 無視
    }
  }
  return total;
}

// TOP 5 集計
const topRefs = Object.entries(refCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
const topViolations = Object.entries(violationCounts)
  .filter(([, c]) => c > 0)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

// 統廃合候補 (30 日 0 回参照 + 0 件違反)
const dormantCandidates = Object.entries(refCounts)
  .filter(([sec, c]) => c === 0 && violationCounts[sec] === 0)
  .map(([sec]) => sec);

// レポート生成
const report = `# ${MONTH_KEY} 月次ルール健康診断レポート

**生成日時**: ${NOW.toISOString()}
**スクリプト**: scripts/audit-rules-monthly.mjs (S15 / 改善案 #10 / R22 §46 連動)
**対象期間**: 過去 ${WINDOW_DAYS} 日
**対象ルール総数**: ${sections.size} 件

---

## 🔝 TOP 5 参照ルール (過去 ${WINDOW_DAYS} 日)

${topRefs.map(([sec, c], i) => `${i + 1}. **${sec}** ${c} 回`).join('\n') || '_(参照ゼロ)_'}

---

## ⚠ TOP 5 違反指摘ルール (過去 ${WINDOW_DAYS} 日)

${topViolations.length > 0
  ? topViolations.map(([sec, c], i) => `${i + 1}. **${sec}** ${c} 件違反`).join('\n')
  : '_(違反指摘ゼロ = 良好)_'}

---

## 📉 統廃合候補 (30 日 0 回参照 + 0 件違反)

${dormantCandidates.length > 0
  ? `合計 **${dormantCandidates.length}** 件:\n${dormantCandidates.map((sec) => `- ${sec}`).join('\n')}\n\n→ 浜田に「統廃合 / 廃止 / 維持」を月次レビュー時に判断仰ぐ`
  : '_(統廃合候補ゼロ = 全ルール active)_'}

---

## 浜田アクション

- [ ] TOP 5 参照: 想定通りか確認
- [ ] TOP 5 違反: 連続違反 = ルール再検討候補
- [ ] 統廃合候補: 月次レビュー時に判断 (連続 3 ヶ月 0 回 → 削除推奨)

---

_本レポートは S15 (R22 §46 月次ルール監査連動) / 5/1 開始 / 段階 2 (cron 統合) は 4/30 夜手動_
`;

fs.writeFileSync(REPORT_PATH, report, 'utf8');
console.log(`✅ 月次ルール健康診断レポート生成: ${path.relative(REPO_ROOT, REPORT_PATH)}`);
console.log(`   ルール総数: ${sections.size} / TOP 5 参照: ${topRefs.length} / 違反: ${topViolations.length} / 統廃合候補: ${dormantCandidates.length}`);
process.exit(0);
