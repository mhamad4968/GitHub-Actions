# 📊 MCP 状態管理台帳

**初版作成**: 2026-04-23 (Thu) / **最終更新**: 2026-05-06（浜田回答反映: **Tavily 削除**・**金曜夜＝表「過去30日」見直しタイミング**・**WSL は `gh`**・**課金スナップショット**／`npm run health-check` 突合・**§Cursor 可用性** 更新。表の「過去30日」欄は **2026-05-06** CIO `npm run mcp-status:refresh-usage` で再集計済）
**更新ルール**: mcp.json 変更時 / 月次 MCP 健康診断時 / 浜田判断あった時に必ず本ファイル更新
**正本順位**: 本ファイル < **`~/.cursor/mcp.json` とワークスペース `.cursor/mcp.json` がマージ**（Cursor 仕様）。`kintone-ai-lab` ルートで開いたとき **Figma + colors-fonts** はリポ側 JSON にも記載（2026-05-04）。

### §Cursor 可用性メモ（2026-05-06 JST / WSL `kintone-ai-lab`）

- **`npm run health-check`（MCP initialize 系）**: `github`・`office-powerpoint` は **WSL から ⏭（Windows 側想定）**、`figma` は **url-only（stdio 対象外）**、それ以外は **✅ initialize OK**（`markdownify`・`deepseek`・`kimi`・`openrouter`・`kintone` 系・`playwright`・`rag` 等）。**`tavily` は 2026-05-06 に mcp.json から除去済**。
- **Cursor チャットからの `call_mcp_tool`**: ワークスペース配下の **descriptor**（`~/.cursor/projects/<id>/mcps/<server>/tools/*.json`）に従う。**本番 kintone 書込・長文生成・CVE/ニュース・RAG** はここ経由で起用可。**PR/Issue 操作の `user-github`** は WSL セッションでは使えない設計のため、同種は **`gh` CLI**（認証済）を **第一選択**（浜田合意 2026-05-06）。Windows 上の Cursor は補助。
- **S12 死蔵警告**: 下表の「過去 30 日使用」列は **`npm run mcp-status:refresh-usage`**（`check-mcp-dormancy.mjs` 30 日 JSON）で更新する。**毎週金曜夜・週次反省の直後**の Cursor セッションで **CIO（AI）が定例実行**し、差分があれば **`docs/mcp-status.md` を commit + push** まで行う（浜田合意 2026-05-06／運用確定）。**月次健康診断**・**MCP 追加・削除時**も CIO が表を見直す。

### 浜田回答メモ（依頼事項 2026-05-06）

| # | 内容 | 決定 |
|---|------|------|
| 2 | WSL での GitHub 操作 | **`gh` CLI** に任せる（`user-github` MCP は WSL では使わない前提を上記に固定） |
| 3 | 「過去30日」欄・鮮度 | **毎週金曜夜の反省の後**に **毎週** 見直しで合意 |
| 4 | Cursor 課金ダッシュボード（スクリーンショット） | **Total 76%**／Auto+Composer **56%**／API **100%**（同梱枠枯渇）／On-demand **$388.51 / $1000**（上限 Fixed **$1000 USD**）— `npm run credit:set 76` で日次記録に反映可（§1-2-4） |
| 5 | Tavily | **削除で OK** → 同日 **`~/.cursor/mcp.json`** および **`C:\Users\…\.cursor\mcp.json`** から除去。`scripts/sync-cursor-mcp-windows-from-wsl.mjs` から **tavily コピー行を削除** |

> **CIO 定例（運用確定）**: 上記 (3) の「過去30日」欄の **再集計・表への反映**は **CIO が金曜・週次反省の直後に必ず実施**。コマンド **`npm run mcp-status:refresh-usage`**（`--dry-run` で差分確認のみも可）。浜田さん側はカレンダーで **タイミング**のみ管理でよい。

---

## 2026-04-28 — 自律エージェント向けルール

- リポに **`.cursor/rules/mcp-tool-discipline.mdc`**（フロントマタは **`alwaysApply: false`**。必要時にルール ON）を追加。`call_mcp_tool` 前の **descriptor（`mcps/<server>/tools/*.json`）必読**・`mcp_auth` を先に単独実行・同一目的では **MCP を curl より優先**する、を **リポ内でも固定**（再宣言として有効）。
- **2026-05-02 追補**: **`.cursor/rules/mcp-server-use-triggers.mdc`（`alwaysApply: true`）** … **どの MCP サーバを選ぶか**の 1 行トリガー（CIO×DeepSeek/Kimi/OpenRouter 相談反映）。descriptor 必読は引き続き **mcp-tool-discipline**。
- **2026-05-04 追補**: **デザイン系（Figma）** — 公式リモート MCP または `figma-developer-mcp` の導入手順・使い分けは **`docs/mcp-design-figma.md`**。`~/.cursor/mcp.json` へ追加後、下表に行を足す。
- **2026-05-04 午前追補（CIO 依頼・Kimi/DeepSeek 相談）**: **配色・パレット**用に **`@colorsandfonts/mcp`**（サーバ名 `colors-fonts`）をグローバル＋リポ `.cursor/mcp.json` に追加。**kintone 表のトークン・コントラスト**手順は **`docs/mcp-design-kintone-tables.md`**。
- **2026-05-06 施行**: **`.cursor/rules/ai-agent-tools-constitution.mdc`**（**`alwaysApply: true`**）— Exa/Brave/Firecrawl・Linear 相当の課題管理・Puppeteer・Mintlify/Harness・秘密禁止・有料大量取得前の確認。**§7** — PR/deploy 前など区切りで **`[憲法適合]`** 1 行の自己宣言。**`mcp-server-use-triggers.mdc`** に調査系 1 行トリガーを追補。
- **2026-05-06 追補（多AI）**: 同憲法 **§0.5** — **CIO 体制の中**で第1者が第2視点を補強するため、他AI（DeepSeek/Kimi/OpenRouter 等）との**協議を積極推奨**（第2者・GO の憲法定義は不変）。**`constitution-brief-card.mdc`** の CIO 2 者の直後にポインタを追加。
- **2026-05-02 §57-10 連動**: RAG 正本 4 ファイルの `.rag/extra-docs` ミラー＝`npm run rag:mirror:canonical-docs` / `verify:rag-mirror-canonical`（`verify:agent-env` 連鎖）。憲法・索引の実体はルート正本（§2）。

### 表の鮮度（2026-04-28）

- **「過去 30 日使用」列**: **毎週金曜・反省直後**に CIO が **`npm run mcp-status:refresh-usage`** で transcript ベース再集計（冒頭 **最終更新** 行の脚注も更新）。**追加・削除・再有効化**や **月次健康診断**のタイミングでも随時実行可。
- **「次回再評価」列**: 手動メモ。**自動再集計はしない**。MCP の **追加・削除・再有効化**をしたとき、または **月次健康診断**のタイミングで、行ごとに見直す。

---

## 📋 MCP 一覧（基準 16 本 + 追記枠／上記「表の鮮度」参照）

| # | MCP | 状態 | 過去 30 日使用 | 主役割 | 次回再評価 |
|---|---|---|---|---|---|
| 1 | github | ⏭ Win-skip | 0 回（exempt） | GitHub Issue/PR 操作 (Win 起動必要) | 5/16（サブエージェント PoC 再議論時）|
| 2 | cyber-news | ✅ active | **6 回** | サイバーセキュリティニュース取得 | 5/1（月次健康診断）|
| 3 | office-powerpoint | ⏭ Win-skip | 0 回（exempt） | PPT 自動生成 (Win 起動必要) | 5/13 後（本番運用後の月次レポート用検討）|
| 4 | ~~google-search~~ → **duckduckgo-search** | ✅ active (4/23 21:35 入替 / TSB-015 解消) | **2 回** | DuckDuckGo Web 検索 (uvx duckduckgo-mcp-server / Bing ベース / DDG_REGION=jp-ja / API key 不要 / bot 検知緩) | 5/1 月次巡回 + 必要時随時 |
| 5 | filesystem | ✅ active | **9 回** | ローカルファイル操作 (Cursor 標準で代替可) | **削除候補 / 4/30 判断** |
| 6 | memory | ✅ **active 化済** | **32 回** | セッション横断記憶 (現在 10 entities + 11 relations) | PC 台帳 PJ で実戦投入後判断（5/13 頃）|
| 7 | fetch | ✅ active | **2 回** | URL fetch (Cursor 標準 WebFetch で代替可) | **削除候補 / 4/30 判断** |
| 8 | sequential-thinking | ✅ active | **13 回** | 段階的思考 | PC 台帳 PJ で実戦投入後判断 |
| 9 | **kintone (公式)** | ✅ active | **286 回** | kintone API CRUD | 5/13 後（本番運用後）|
| 10 | **kintone-dev (自作)** | ✅ active | **13 回** | API 仕様参照 (アプリ作成 MCP ではない / 4/23 早朝訂正済) | **4/26 PC 台帳 Day 4 後判断** |
| 11 | **kintone-space (自作)** | ✅ active | **16 回** | kintone スペース操作 | **4/24 環境設定マスタ作成時に実戦投入予定** |
| 12 | ~~tavily~~ | 🗑 **削除済 2026-05-06** | 0 回（削除済） | （除去）Web 検索は **duckduckgo-search** | — |
| 13 | playwright | ✅ active (4/23 21:30 Chrome 147.0.7727.116 install + 実 call 動作確認済) | **14 回** | ブラウザ自動操作 / E2E | 4/26 PC 台帳 customize テスト時 |
| 14 | cve-search | ✅ **active 化済** | **11 回** | CVE 脆弱性検索 | 5/1（月次セキュリティ巡回時 / S14）|
| 15 | rag | ✅ **強化済** | **46 回** | LanceDB ローカル RAG (現在 76 docs / 3429 chunks) | **§50 + §21 強化（R24/R25）後再評価 / 4/30 判断** |
| 16 | accessibility-scanner | ✅ active (4/23 21:30 同 Chrome で実 call 動作確認済) | **4 回** | アクセシビリティ検査 | 4/26 PC 台帳 customize 時 |
| 17 | **figma（公式 remote MCP）** | ✅ **global + リポ**に `url` 追記済（2026-05-04）／初回 OAuth | **1 回** | 表・ダッシュの **配色・タイポ・間隔・レイアウト**を Figma から取得し実装に反映 | **`docs/mcp-design-figma.md`**／Figma プランの rate limit に注意 |
| 18 | **figma-developer-mcp**（任意） | **📋 PAT 要・stdio** | — | 上記の代替（npm `figma-developer-mcp`） | 同上／§17-3 で **npx 絶対 path** |
| 19 | **colors-fonts**（`@colorsandfonts/mcp`） | ✅ **global + リポ**（Node v24 `npx` 絶対 path／pin `1.1.0`） | **1 回** | **パレット生成**・**WCAG/APCA コントラスト**・CSS/Tailwind/**Figma トークン JSON** 出力（Figma 無しでも表配色のたたき台） | **`docs/mcp-design-kintone-tables.md`**／`call_mcp_tool` 前は descriptor 必読 |

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

### tavily（**削除済 2026-05-06** / 浜田合意）
- **最終状態**: `mcp.json` から **エントリ除去**（WSL グローバル + Windows 同期先の両方）。`sync-cursor-mcp-windows-from-wsl.mjs` は **tavily を出力しない**。
- **経緯要約**: 2026-04-23 時点で `disabled: true`（課金回避・duckduckgo-search 代替）→ 2026-05-06 **完全削除**で確定。

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
- **duckduckgo-search**: Web 検索（「○○ 仕様」「○○ 既知バグ」検索時）
- **sequential-thinking**: 大型設計判断時 (例: 4/26 PC 台帳 customize 設計の分解)
- **memory**: 重要決定 / TSB 検出時に entities + relations 追加

### Tier 4: 削除候補
- **filesystem**: Cursor 標準で代替可 / 4/30 判断
- **fetch**: 同上 / 4/30 判断
- ~~**tavily**~~: **2026-05-06 削除済**（上記）
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
