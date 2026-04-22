# 🔍 MCP 強化戦略 — 段階 1: 16 MCP 現状監査

> **【訂正注記 / 2026-04-23 02:55 追記】**: §4.1「mcp.json バックアップが git tracked になったら漏洩」は **過剰懸念だった**。実際は `.gitignore` 行 28 で `backups/` 全体除外済 + emergency-backup に mcp.json 含まれず + Cursor cloud sync 未設定 → **現状漏洩リスクは実質ゼロ**。詳細は `docs/plans/2026-04-23-mcp-strategy-v1.md` 第 12 部 + `docs/reports/2026-04-23-mcp-env-research.md`。
>
> **【訂正注記 2 / 2026-04-23 02:55】**: §6.1 「RAG index 9 日古い」も誤り。実際は `daily-morning-prep.mjs` が朝 06:00 cron で自動 ingest 中（`chunks.lance/_transactions/_versions/_indices/_deletions` は 4/22 06:01 更新）= 健全。残課題は「同日中追記の docs が翌朝まで未反映 = 最大 24h タイムラグ」のみ → R25 で解消。

**作成**: 2026-04-23 (Thu) 02:30 JST
**作成者**: AI（メイン Cursor チャット / 浜田 4/22 22:00 締め後の追加依頼）
**対象**: `~/.cursor/mcp.json` 配下の全 16 MCP
**目的**: 「現行 MCP を強化・活用できる方法を深く考えて出してほしい」依頼の Stage 1
**次段階**: 段階 2 = `docs/reports/2026-04-23-mcp-deep-analysis-stage2.md` / 段階 3 = `docs/plans/2026-04-23-mcp-strategy-v1.md`

---

## 🚨 サマリ（核心 3 行）

1. **インストール済 16 / 健全 13 / Windows-skip 2 / disabled 1** — 接続自体は健全
2. **過去 30 日の実使用は 2 MCP のみ**（kintone 38 回 / playwright 2 回）= **14/16 (87.5%) が死蔵状態**
3. **戦略の方向性**: 「死蔵 MCP の活性化」 + 「kintone への一極集中の分散」 + 「PC 台帳 PJ × MCP マトリクス整備」

---

## 1. MCP 全件カタログ（16 件）

| # | MCP 名 | 種別 | command 起点 | 接続状態 | 過去 30 日使用 | 主な用途（推定）|
|---|---|---|---|---|---|---|
| 1 | `github` | 外部 API | Windows PowerShell wrapper | ⏭ Win-skip | 0 回 | GitHub Issue/PR 操作 |
| 2 | `cyber-news` | 自前 / 情報収集 | node `/mnt/c/.../CyberNewsMCP/dist/index.js` | ✅ | 0 回 | サイバーセキュリティニュース |
| 3 | `office-powerpoint` | Windows 連携 | Win Python venv | ⏭ Win-skip | 0 回 | PPT 自動生成 |
| 4 | `google-search` | 外部 API | npx | ✅ | 0 回 | Google 検索 |
| 5 | `filesystem` | ローカル / コア | npx (`@modelcontextprotocol/server-filesystem`) | ✅ | 0 回（Cursor 標準ファイルツールで代替）| 案件管理 / ドキュメント保管 / kintone-src / kintone-ai-lab |
| 6 | `memory` | ローカル / コア | npx (`@modelcontextprotocol/server-memory`) | ✅ | 0 回 | セッション横断メモリ |
| 7 | `fetch` | コア | python3 `mcp_server_fetch` | ✅ | 0 回 | URL fetch（Cursor 標準 WebFetch で代替）|
| 8 | `sequential-thinking` | 思考補助 | npx | ✅ | 0 回 | 段階的思考 |
| 9 | `kintone` | 専門業務 | npx (`@kintone/mcp-server`) | ✅ | **38 回** ⭐ | kintone API 操作（公式 MCP）|
| 10 | `kintone-dev` | 専門業務 / 自前 | node `~/.cursor/kntn-dev-mcp/mcp-entry.mjs` | ✅ | 0 回 | kintone 開発支援（自作）|
| 11 | `kintone-space` | 専門業務 / 自前 | node `~/.cursor/kintone-space-mcp/index.mjs` | ✅ | 0 回 | kintone スペース操作（自作）|
| 12 | `tavily` | 外部 API / 検索 | npx | ⏸ disabled | 0 回 | Tavily Web 検索 |
| 13 | `playwright` | 自動化 | npx (`@playwright/mcp`) | ✅ | **2 回** | ブラウザ自動操作 / E2E |
| 14 | `cve-search` | セキュリティ | uv (Python) | ✅ | 0 回 | CVE 脆弱性検索 |
| 15 | `rag` | 自前 / 検索 | npx (`mcp-local-rag`) | ✅ | 0 回 | LanceDB ローカル RAG（130 MB index）|
| 16 | `accessibility-scanner` | 品質 | npx (`mcp-accessibility-scanner`) | ✅ | 0 回 | アクセシビリティ検査 |

### 凡例
- **接続状態**: ✅ 健全 / ⏭ Windows-skip（WSL から疎通不可）/ ⏸ disabled
- **過去 30 日使用**: agent-transcripts grep `"server":"user-<name>"` + `mcp_<server>_<tool>` の合算

---

## 2. 接続健全性の詳細

### 2.1 ✅ 健全（13 件）
すべて 2026-04-22 06:00 cron 実行時の `health-check.mjs` で `initialize 応答 OK` 確認済。

| MCP | 起動方法の安定性 |
|---|---|
| cyber-news / kintone-dev / kintone-space | ローカル node スクリプト直起動 = 高安定 |
| filesystem / memory / sequential-thinking / google-search / playwright / accessibility-scanner | npx -y = 初回 install 必要 / 2 回目以降キャッシュで高速 |
| fetch | python3 -m mcp_server_fetch = python3 + pip install 依存 |
| cve-search | uv run main.py = uv 必須 |
| rag | npx (PATH 強制 = NVM v24 絶対パス指定 / Cursor 環境シミュレーション対策済) |
| kintone | npx + env (URL/USERNAME/PASSWORD) = 認証情報を mcp.json に直書きしている ⚠ |

### 2.2 ⏭ Windows-skip（2 件）
**WSL 側（メイン作業環境）からは到達不可。Windows 側 Cursor で別途動作。**

| MCP | 理由 | 影響 |
|---|---|---|
| `github` | command = `/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` | WSL 側からは GitHub 操作できない / Cursor の Windows 側 / Claude Code CLI で代替 |
| `office-powerpoint` | command = `/mnt/c/Users/.../python.exe` | WSL 側から PPT 生成不可 / 必要時は Windows 側で起動 |

### 2.3 ⏸ disabled（1 件）
| MCP | 状態 | 推定理由 |
|---|---|---|
| `tavily` | `disabled: true` | 課金 / API キー無し / Google Search MCP で代替済の可能性。要確認 |

---

## 3. 過去 30 日の実使用頻度

### 3.1 集計結果
```
38 回  user-kintone（call_mcp_tool 経由）
 2 回  playwright（mcp_playwright_verify 経由）
 0 回  上記以外の 14 MCP
```

### 3.2 解釈
| 観察 | 意味 |
|---|---|
| kintone 38 回 = 1 日あたり 1.3 回 | PC 台帳 + アカウント管理 + M365 5 台超過特定 等の業務直結タスクで活用 |
| playwright 2 回 = 月 2 回 | FAQ ポータル / kintone UI の動作確認 で散発使用 |
| 残り 14 件 0 回 | **登録だけして実用していない**。原因仮説:<br>① ツールの存在を AI（私）が忘れている = 想起忘却<br>② Cursor 標準ツール（Read / Grep / WebFetch / Shell 等）で十分な場面で MCP を選ばない<br>③ MCP 起動の認知コスト > 機能の便益（特に sequential-thinking / memory）|

### 3.3 死蔵 MCP 14 件の暫定分類
| 分類 | MCP | 「使われない」理由仮説 |
|---|---|---|
| **完全死蔵** | filesystem / fetch / memory / sequential-thinking | Cursor 標準で代替可能 = 存在意義喪失 |
| **PC 台帳で使えるはず未活用** | rag / accessibility-scanner / kintone-dev / kintone-space | RAG = §20 義務化されているが私が忘れがち / 他 3 件は存在を活用してない |
| **状況依存（散発）** | google-search / tavily / cyber-news / cve-search | セキュリティ / 調査タスクで散発活用候補 / 浜田に聞かれたら使う系 |
| **Windows 起動必要** | github / office-powerpoint | WSL からは構造的に使えない（仕様）|

---

## 4. mcp.json 設定の改善余地

### 4.1 セキュリティ懸念 ⚠
| 項目 | 現状 | リスク |
|---|---|---|
| `kintone` env | `KINTONE_PASSWORD: "kent2511"` を mcp.json に直書き | **平文パスワード**が `~/.cursor/mcp.json` に保存 / `cat ~/.cursor/mcp.json` 出力で露出 / git レポにバックアップが残ったら漏洩 |
| `kintone-space` env | 同上 | 同上 |
| `kintone` URL | `https://jbis-kintone.cybozu.com` | 公開情報なので問題なし |

### 4.2 起動コマンドの改善余地
| MCP | 現状 | 改善案 |
|---|---|---|
| 起動が遅い MCP（npx -y 系）| `npx -y @xxx@latest` で毎回 npm registry 確認 | バージョン固定 + ローカル install で 5-10 倍高速化可能 |
| `rag` / `accessibility-scanner` | PATH 強制済 | OK（Cursor 環境シミュレーション対策の良例）|
| `tavily` | disabled | 廃止判断（削除）or 再有効化判断 が宙に浮いている |

### 4.3 disabled の宙ぶらりん管理
- tavily が disabled の理由・期間・再評価日が**どこにも記録されていない** = 後で「なんで止まってるんだっけ？」が必ず起きる
- → `docs/mcp-status.md` のような MCP 状態管理台帳が必要

---

## 5. AGENTS.md の MCP 関連ルール（既存）

| § | ルール | 現状の遵守度 |
|---|---|---|
| §17 | mcp.json 変更時の最小差分 + JSON-RPC ハンドシェイクテスト | 遵守（ただしテストの自動化なし）|
| §20 | RAG 検索の義務化（重要設計判断 / 不具合調査初動 / リファクタ前）| **🔴 私が忘れがち** = rag 0 回使用の原因 |
| §21 | 知見フィードバック → docs/troubleshooting.md → RAG ingest | 遵守（ingest は手動）|
| §22 | mcp.json 日次自動バックアップ | `scripts/backup-mcp.sh` 設置済 |
| §23 | MCP 消失時の復旧プロトコル | `scripts/check-mcp.sh` + `restore-mcp.sh` 設置済 |
| §24 | MCP 変更時の義務（バックアップ + ハンドシェイク + 再起動）| 遵守 |

### 5.1 ルール側の不足
- **「いつ MCP を使うべきか」の積極ガイド**が AGENTS.md にない（§20 は RAG のみ / 他 15 MCP の発動条件は無い）
- → AI（私）が「Cursor 標準ツールでとりあえず動く」を選んで MCP を使わない構造的バイアス

---

## 6. RAG (mcp-local-rag) の追加調査

### 6.1 LanceDB index 状態
- `.rag/lancedb/chunks.lance/` = 130 MB
- 最終更新: 2026-04-14 21:54（**9 日前**）⚠ 直近 9 日間の docs 変更が未 ingest
- 4/22 に追加された TSB-010 / TSB-007 ep3 / TSB-011（今夜追記予定）= **すべて RAG 未収録**

### 6.2 影響
- 私が「過去の TSB を rag_search で引け」と AGENTS.md §20 で命じられているが、引いても 4/22 以降の最新 4 件が出てこない
- → 「使わない理由」がさらに強化されるネガティブループ

### 6.3 ingest 自動化の状態
- 現状: 手動コマンド（`npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/`）
- 朝 cron: 未組込み
- → docs/ に追記しても AI（私）が思い出して手動 ingest しない限り永遠に未収録

---

## 7. 自前 MCP 3 件の活用度

### 7.1 cyber-news（自作）
- 場所: `/mnt/c/Users/.../CyberNewsMCP/dist/index.js`
- 用途: サイバーセキュリティニュース取得
- 過去 30 日使用: 0 回
- 評価: 「セキュリティニュース取得」が業務の優先タスクから外れているため死蔵

### 7.2 kintone-dev（自作）
- 場所: `~/.cursor/kntn-dev-mcp/mcp-entry.mjs`
- 用途: kintone 開発支援（推定: フィールド作成 / アプリ作成 等の DX 補助）
- 過去 30 日使用: 0 回
- 評価: 公式 `kintone` MCP に役割を奪われた可能性 / **PC 台帳 PJ で「アプリ 5 個作成」する 4/23-26 で活用候補**

### 7.3 kintone-space（自作）
- 場所: `~/.cursor/kintone-space-mcp/index.mjs`
- 用途: kintone スペース操作（推定: スレッド / アプリ配置 等）
- 過去 30 日使用: 0 回
- 評価: 4/23 から **スペース 21 に新規アプリ 5 個配置する**ので活用候補 ⭐

---

## 8. 段階 1 結論 — 段階 2 で深掘りすべき論点

### 8.1 ホットスポット（戦略書で必ず扱うべき項目）
1. **kintone 38 回 vs 他 14 件 0 回 の偏り** = 一極集中分散戦略
2. **死蔵 MCP の「想起トリガー」をどう仕掛けるか** = AGENTS.md / health-check.mjs / 朝ブリーフィング への組込
3. **RAG の 9 日遅れ ingest 問題** = 朝 cron 自動 ingest 化（即実装可）
4. **kintone-dev + kintone-space の PC 台帳 PJ 4/23-26 活用** = アプリ 5 個作成タスクで実戦投入
5. **mcp.json の平文パスワード問題** = `.env` 経由化 + `${KINTONE_PASSWORD}` 展開
6. **tavily disabled の宙ぶらりん解消** = 削除 or 再有効化の判断

### 8.2 段階 2 で 10 次元分析する項目
1. PC 台帳 PJ × 全 16 MCP マトリクス（どの局面でどの MCP が効くか）
2. MCP 統合パターン（sequential-thinking + memory + RAG の連鎖等）
3. 新規 MCP 候補（slack / notion / linear / database / git-history 等）
4. AI 行動規範（AGENTS.md §50 新設「MCP 想起儀式」など）
5. health-check.mjs 拡張（応答時間 / 機能テスト / divergence 検知）
6. コスト効率（外部 API 課金 = google-search / cve-search / 等）
7. mcp.json セキュリティ（平文認証 / .env 化）
8. 自前 MCP 3 件の役割整理（kintone-dev vs kintone-space vs 公式 kintone の棲み分け）
9. RAG 自動 ingest 化 + 月次再 index
10. 5/13 本番運用後の「監視自動化」MCP 活用案

### 8.3 制約として記憶すべきこと
- **§47-B ルール疲労ガード**（4/22 制定）= AGENTS.md にこれ以上ルール追加するなら必ず疲労リスク併記
- **TSB-006 ガード**（≤5 ファイル/commit）
- **§47-9 着手前 §47**（30 分超タスクは「そもそもやるべきか」を 5 分で先に問う）

---

## 9. 段階 2 への申し送り

段階 2 では、以下のフォーマットで全 10 次元を分析する:

```markdown
## 次元 N: <タイトル>

### 現状
### 課題
### 改善案 A / B / C
### 私の §48 推奨
### 段階 3 で proposal 化する内容
```

段階 2 完了見込み: 03:30 JST（90 分後 / 段階 1 と合わせて 110 分）
段階 3 完了見込み: 04:30 JST（さらに 60 分後）

→ 浜田が今日 19:00 に戻った時点で **戦略書 v1.0 + proposal 3-5 件** が完成している状態。
