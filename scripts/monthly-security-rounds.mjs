#!/usr/bin/env node
/**
 * monthly-security-rounds.mjs — 月次セキュリティ巡回 (改善案 #12 戦略 / S14 / 5/1 開始)
 *
 * 検査内容:
 *   1. cve-search MCP `vul_last_cves` + duckduckgo-search（セキュリティヘッドライン）
 *   2. cve-search MCP で主要依存パッケージの新規 CVE 検索
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
 * 正本: docs/plans/2026-07-11-mcp-tools-consolidation-spec.md SCR-6（cyber-news → cve-search + DDG）
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
**スクリプト**: scripts/monthly-security-rounds.mjs (S14 / MCP spec v3.1)
**対象期間**: 過去 30 日

---

## 1. セキュリティニュース（cve-search + duckduckgo-search）

### 1-1. 直近 CVE（cve-search）

> **手順**: AI に以下を依頼するか手動実行
> \`\`\`
> mcp_user-cve-search_vul_last_cves
> \`\`\`

_(ここに結果を貼付 / AI 要約を追記)_

### 1-2. ヘッドライン補助（duckduckgo-search）

> **手順**:
> \`\`\`
> mcp_user-duckduckgo-search_search query="CISA security advisory past 30 days"
> \`\`\`

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

_本レポートは S14 v1 スケルトンです。MCP 結果の自動取得は将来 v2 で検討。_
`;

if (ARG_DRY_RUN || true) {
  fs.writeFileSync(REPORT_PATH, REPORT_TEMPLATE, 'utf8');
  if (ARG_JSON) {
    console.log(JSON.stringify({ status: 'ok', report_path: REPORT_PATH, mode: 'v1-skeleton' }, null, 2));
  } else {
    console.log('## 🛡️ 月次セキュリティ巡回 (v1 スケルトン)');
    console.log('');
    console.log(`✅ レポート生成: ${path.relative(REPO_ROOT, REPORT_PATH)}`);
    console.log('');
    console.log('### 次のステップ');
    console.log('1. AI に cve-search / duckduckgo-search MCP 呼出を依頼してレポートに貼付');
    console.log('2. 浜田アクションチェックリストを完了');
    console.log('3. AI 統括サマリを記入');
  }
  process.exit(0);
}
