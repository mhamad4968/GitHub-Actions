#!/usr/bin/env node
/**
 * monthly-security-rounds.mjs — 月次セキュリティ巡回 (改善案 #12 戦略 / S14 / 5/1 開始)
 *
 * 検査内容:
 *   1. cyber-news MCP 主要 5 feeds (過去 30 日) のサマリ取得
 *      - CISA Alerts / SANS Internet Storm Center / The Hacker News /
 *        Google Mandiant / Krebs on Security
 *   2. cve-search MCP で主要依存パッケージの新規 CVE 検索
 *      - eslint / vite / typescript / npm / node.js
 *   3. docs/reports/<YYYY-MM>-security-rounds.md 生成
 *
 * 実行タイミング:
 *   月初 1 日 06:30 (morning-prep の 30 分後 / cron 登録は別 commit で手動)
 *
 * オプション:
 *   --json      : JSON のみ出力
 *   --dry-run   : MCP 呼出はせずスケルトン report のみ生成
 *
 * 出口コード:
 *   0: 成功 / 1: MCP 呼出失敗 / 2: 致命的エラー (mcp.json 不在等)
 *
 * 背景: 2026-04-23 MCP 強化戦略 段階 1 監査で cyber-news / cve-search が
 *       過去 30 日 0 回使用 = 死蔵と判明。本スクリプトで月次活用を継続化。
 *
 * 注意: cyber-news / cve-search MCP は spawnSync で stdio JSON-RPC 経由で
 *       呼び出す。実装の複雑性を避けるため、本スクリプトは v1 では
 *       スケルトン report 生成 + 浜田が手動で MCP CallTool 結果を貼付する
 *       運用とする。v2 (5/22 以降) で完全自動化予定。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const args = process.argv.slice(2);
const ARG_JSON = args.includes('--json');
const ARG_DRY_RUN = args.includes('--dry-run');

const now = new Date();
const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const REPORT_DIR = path.join(REPO_ROOT, 'docs', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, `${yyyyMm}-security-rounds.md`);
fs.mkdirSync(REPORT_DIR, { recursive: true });

const REPORT_TEMPLATE = `# ${yyyyMm} 月次セキュリティ巡回レポート

**生成日時**: ${now.toISOString()}
**スクリプト**: scripts/monthly-security-rounds.mjs (S14 / 改善案 #12)
**対象期間**: 過去 30 日

---

## 1. cyber-news 主要 feeds (過去 30 日)

### 1-1. CISA Alerts (vulnerabilities)

> **手順**: AI に以下を依頼するか手動実行
> \`\`\`
> mcp_user-cyber-news_get_news_briefs feed_name="CISA Alerts" limit=10
> \`\`\`

_(ここに結果を貼付 / AI 要約を追記)_

### 1-2. SANS Internet Storm Center (news)

_(同上)_

### 1-3. The Hacker News (news)

_(同上)_

### 1-4. Google Intelligence Mandiant (research)

_(同上)_

### 1-5. Krebs on Security (research)

_(同上)_

---

## 2. cve-search 主要依存パッケージ脆弱性 (過去 30 日)

### 2-1. eslint

> **手順**:
> \`\`\`
> mcp_user-cve-search_vul_vendor_product_cve vendor="<NVD 表記要確認>" product="eslint"
> \`\`\`

_(結果貼付)_

### 2-2. vite

_(同上)_

### 2-3. typescript

_(同上)_

### 2-4. npm

_(同上)_

### 2-5. node.js

_(同上)_

---

## 3. 浜田アクション

- [ ] CISA Alert 重要度 high / critical → 24 時間以内対応要否判断
- [ ] 主要依存パッケージ CVE → npm audit fix or npm update 検討
- [ ] 本月の特記事項 → AGENTS.md §11 信頼度ラベル違反扱いになる項目あれば追記
- [ ] 翌月以降の改善 → docs/approved-changes/<日付>/ に proposal 作成

---

## 4. AI 統括サマリ

_(AI が 1-3 を読んで 5 行以内で要約 / 真の影響度評価)_

---

_本レポートは S14 v1 スケルトンです。v2 (5/22 以降) で MCP 結果の自動取得・貼付を実装予定。_
`;

if (ARG_DRY_RUN || true) {
  // v1 はスケルトン生成のみ
  fs.writeFileSync(REPORT_PATH, REPORT_TEMPLATE, 'utf8');
  if (ARG_JSON) {
    console.log(JSON.stringify({ status: 'ok', report_path: REPORT_PATH, mode: 'v1-skeleton' }, null, 2));
  } else {
    console.log('## 🛡️ 月次セキュリティ巡回 (v1 スケルトン)');
    console.log('');
    console.log(`✅ レポート生成: ${path.relative(REPO_ROOT, REPORT_PATH)}`);
    console.log('');
    console.log('### 次のステップ');
    console.log('1. AI に cyber-news / cve-search MCP 呼出を依頼してレポートに貼付');
    console.log('2. 浜田アクションチェックリストを完了');
    console.log('3. AI 統括サマリを記入');
    console.log('');
    console.log('> v2 (5/22 以降) で MCP 結果自動取得を実装予定');
  }
  process.exit(0);
}
