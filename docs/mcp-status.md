# 📊 MCP 状態管理台帳

**初版作成**: 2026-04-23 (Thu) / **最終更新**: 2026-04-23 20:25 (Phase B レベルアップ反映)
**更新ルール**: mcp.json 変更時 / 月次 MCP 健康診断時 / 浜田判断あった時に必ず本ファイル更新
**正本順位**: 本ファイル < `~/.cursor/mcp.json`（実際の設定が最終正本）

---

## 📋 全 16 MCP 一覧（4/23 20:00 時点）

| # | MCP | 状態 | 過去 30 日使用 | 主役割 | 次回再評価 |
|---|---|---|---|---|---|
| 1 | github | ⏭ Win-skip | 0 回 | GitHub Issue/PR 操作 (Win 起動必要) | 5/16（サブエージェント PoC 再議論時）|
| 2 | cyber-news | ✅ active | **1 回** (4/23 20:11 v0 巡回) | サイバーセキュリティニュース取得 | 5/1（月次健康診断）|
| 3 | office-powerpoint | ⏭ Win-skip | 0 回 | PPT 自動生成 (Win 起動必要) | 5/13 後（本番運用後の月次レポート用検討）|
| 4 | google-search | ✅ active | 0 回 | Google Web 検索 | 5/1（月次健康診断）|
| 5 | filesystem | ✅ active | 0 回 | ローカルファイル操作 (Cursor 標準で代替可) | **削除候補 / 4/30 判断** |
| 6 | memory | ✅ **active 化済** | **2 回** (4/23 早朝 4 entities + 20:13 5 entities + 6 relations 投入) | セッション横断記憶 (現在 10 entities + 11 relations) | PC 台帳 PJ で実戦投入後判断（5/13 頃）|
| 7 | fetch | ✅ active | 0 回 | URL fetch (Cursor 標準 WebFetch で代替可) | **削除候補 / 4/30 判断** |
| 8 | sequential-thinking | ✅ active | 0 回 | 段階的思考 | PC 台帳 PJ で実戦投入後判断 |
| 9 | **kintone (公式)** | ✅ active | **40 回+** | kintone API CRUD | 5/13 後（本番運用後）|
| 10 | **kintone-dev (自作)** | ✅ active | 0 回 | API 仕様参照 (アプリ作成 MCP ではない / 4/23 早朝訂正済) | **4/26 PC 台帳 Day 4 後判断** |
| 11 | **kintone-space (自作)** | ✅ active | 0 回 | kintone スペース操作 | **4/24 環境設定マスタ作成時に実戦投入予定** |
| 12 | tavily | ⏸ disabled | 0 回 | Tavily Web 検索 | **5/16 削除 or 再有効化判断** |
| 13 | playwright | ✅ active | 2 回 | ブラウザ自動操作 / E2E | 4/26 PC 台帳 customize テスト時 |
| 14 | cve-search | ✅ **active 化済** | **3 回** (4/23 早朝 db_status + 20:14 vul_last_cves + vul_cve_search) | CVE 脆弱性検索 | 5/1（月次セキュリティ巡回時 / S14）|
| 15 | rag | ✅ **強化済** | **大量** (本日 ingest_file 8 回 + query_documents 3 回 + status 3 回) | LanceDB ローカル RAG (現在 76 docs / 3429 chunks) | **§50 + §21 強化（R24/R25）後再評価 / 4/30 判断** |
| 16 | accessibility-scanner | ✅ active | 0 回 | アクセシビリティ検査 | 4/26 PC 台帳 customize 時 |

### 凡例
- ✅ active: 正常稼働 / 利用可能
- ⏭ Win-skip: WSL から疎通不可 / Windows 側でのみ稼働
- ⏸ disabled: mcp.json で `disabled: true`

### 🌟 本日 (4/23) のレベルアップ実績
1. **rag**: TSB-012 修復 (commit `122ea4f`) → documentCount 0 → **76** / chunkCount → **3429** / hybrid mode 安定稼働
2. **memory**: 0 → **10 entities + 11 relations** (TSB-007 ep5 / auto-heal 自爆 / 朝 cron 結果 / S14 修復 / 戦略書 v1 全部 graph 化)
3. **cyber-news**: 早朝 list_feeds 確認 → 20:11 vulnerabilities カテゴリ実戦投入 (10 件取得 / CVE-2026-33825 Defender 発見)
4. **cve-search**: 早朝 db_status 確認 → 20:14 vul_last_cves + vul_cve_search 実戦投入 (eslint 0 件 + Defender 詳細取得)
5. **§50 MCP Recall Ritual** (R24) を AGENTS.md に早期適用 → AI のタスク開始時 30 秒チェック義務化

---

## ⏸ disabled の経緯記録

### tavily（disabled / 2026-04-23 時点 / 浜田確認済 = 2026-04-23 02:30）
- 状態: `disabled: true`
- 経緯: **課金が必要だったため google-search を代替として採用し disabled 化**（浜田回答 / 2026-04-23 02:30）
- **判断**: tavily は今後も有償化リスク継続 = google-search 安定運用前提なら **削除候補昇格**
- **次回再評価**: 2026-05-16（サブエージェント PoC 再議論時に併せて判断）
- **再評価項目**: 完全削除 (mcp.json から除去) / google-search の月 100 回境界に達するまで現状維持

---

## 📋 残 dormant MCP の活性化方針 (4/23 20:25 制定)

### Tier 1: 4/26 PC 台帳作成期間で実戦投入予定
- **kintone-space** (Day 1-4): スペース 21 配置・権限管理時
- **kintone-dev** (Day 1-4): API 仕様参照時 (search_field_types / get_api_endpoint 等)
- **playwright** (Day 4): customize 動作確認 + 視覚自己検診 (§26)
- **accessibility-scanner** (Day 4): WCAG 2.1 AA 検証 (§27)

### Tier 2: 月次 cron で活性化予定
- **cyber-news + cve-search**: S14 月次セキュリティ巡回 (5/1 開始予定 / cron 登録は 4/30 夜手動)
- **rag**: 朝 cron で再 ingest + R25/R26 で ingest 儀式強化 (4/24 朝 cron 適用)

### Tier 3: 即時活性化トリガー (R24 §50 で義務化)
- **fetch**: cybozu.dev 等の公式 docs 取得時 (Cursor 標準 WebFetch で十分なら省略可)
- **google-search**: Web 検索 (tavily disabled の代替 / 「○○ 仕様」「○○ 既知バグ」検索時)
- **sequential-thinking**: 大型設計判断時 (例: 4/26 PC 台帳 customize 設計の分解)
- **memory**: 重要決定 / TSB 検出時に entities + relations 追加

### Tier 4: 削除候補
- **filesystem**: Cursor 標準で代替可 / 4/30 判断
- **fetch**: 同上 / 4/30 判断
- **tavily**: 5/16 サブエージェント PoC 再議論時に削除判断
- **github / office-powerpoint**: WSL 側では使えない / 削除可だが Win 側で使う日のため残置

---

## 🚨 平文認証問題（2026-04-23 検出 / 次元 4）

### 該当 MCP
- `kintone`: env.KINTONE_PASSWORD = `kent2511` (平文)
- `kintone-space`: env.KINTONE_PASSWORD = `kent2511` (平文)

### リスク
1. `cat ~/.cursor/mcp.json` で誰でも閲覧可能
2. mcp.json バックアップ（`backups/mcp/`）が git tracked になったら漏洩
3. cron ログ等への引きずり

### 対策段階
- **段階 1（即時 / 4/24 朝 cron 適用）**: `backups/mcp/` を `.gitignore` 追加（次元 4 改善案 C）
- **段階 2（5 月以降）**: Cursor MCP env 解決仕様調査 + `.env` 経由化（次元 4 改善案 A）

---

## 📈 月次健康診断（5/1 開始予定）

### 集計項目
1. 各 MCP の過去 30 日使用回数（agent-transcripts grep）
2. 各 MCP の接続健全性（health-check.mjs）
3. 各 MCP の応答時間（次元 5 / S12 で実装予定）
4. 死蔵警告（連続 30 日 0 回 = ⚠ 表示 / 次元 2 / S12）

### 判断材料
- 2 ヶ月連続 0 回 = 削除候補昇格
- 急に使用増加 = 「なぜ今増えたか」を §44 夕反省で記録
- 障害連続発生 = 安定性レビュー

---

## 🔗 関連

- 段階 1 監査: `docs/reports/2026-04-23-mcp-audit-stage1.md`
- 段階 2 深掘り: `docs/reports/2026-04-23-mcp-deep-analysis-stage2.md`
- 戦略書: `docs/plans/2026-04-23-mcp-strategy-v1.md`
- セキュリティ巡回 v0 (4/23 試走): `docs/reports/2026-04-23-security-rounds-v0.md`
- AGENTS.md §17 / §20 / §21 / §22 / §23 / §24 / **§50** (4/23 早期適用済)
- 健康診断: `scripts/health-check.mjs`
- バックアップ: `scripts/backup-mcp.sh`
- 災害復旧: `scripts/restore-mcp.sh` / `docs/mcp-disaster-recovery.md`
