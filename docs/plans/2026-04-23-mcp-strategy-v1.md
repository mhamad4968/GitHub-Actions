# 🎯 MCP 強化戦略書 v1.0

**起票**: 2026-04-23 (Thu) 02:35 JST
**起票者**: AI（Cursor メインチャット / 浜田 4/22 22:00 締め後の追加依頼）
**スコープ**: 全 16 MCP（浜田 a 案承認済）
**読者**: 浜田（今日 19:00 戻り後にレビュー予定）
**判断期日**: 2026-04-23 (Thu) 19:00-21:00 = 浜田レビュー → 承認分は §44 夕反省フローで `docs/approved-changes/2026-04-24/` に振り分け → 4/24 06:00 cron で自動適用

---

## 📌 エグゼクティブサマリ（30 秒で読める要約）

### 現状診断
- **インストール 16 / 健全 13 / Win-skip 2 / disabled 1** = 接続自体は健全
- ただし **過去 30 日の実使用は kintone (38 回) + playwright (2 回) のみ** = 14/16 (87.5%) が**死蔵**
- AI（私）が「Cursor 標準ツールでとりあえず動く」を選んで MCP を使わない**構造的バイアス**が原因

### 戦略の 3 本柱
1. **死蔵 MCP の活性化**: AGENTS.md §50 新設（タスク開始時 30 秒の MCP 想起儀式）+ 朝ブリーフィングに死蔵警告
2. **kintone 一極集中の分散**: 自作 MCP 2 件（kintone-dev / kintone-space）を PC 台帳 PJ 4/23-26 で実戦投入 → 価値判定
3. **構造改善**: RAG 同日反映遅延の解消（npm run rag:ingest 追加）+ 平文認証の最低限保護（.gitignore）

### 浜田に判断頂きたいこと（5 件 proposal）
| ID | 内容 | リスク | 私の §48 推奨 |
|---|---|---|---|
| **R24** | AGENTS.md §50 新設「MCP 想起儀式」 | 中（ルール疲労ガード対象）| ⭐ 強推奨 |
| **R25** | AGENTS.md §21 強化「即時 RAG ingest 義務」 | 低 | ⭐ 強推奨 |
| **R26** | package.json `npm run rag:ingest` 追加 | 低 | ⭐ 強推奨（R25 と必須セット）|
| **D12** | `docs/mcp-status.md` 新規（16 MCP 状態管理台帳）| 低 | ⭐ 強推奨 |
| **S12** | health-check.mjs 拡張「死蔵警告」 | 中（既存スクリプト改修）| 推奨（時間あれば 4/30 までに）|

---

## 📚 第 1 部: 現状診断（段階 1 監査の要約）

### 1.1 MCP 全件カタログ

詳細は `docs/reports/2026-04-23-mcp-audit-stage1.md` 参照。要点のみ:

| 種別 | 件数 | 該当 |
|---|---|---|
| ✅ 健全（WSL から疎通可）| 13 | cyber-news, google-search, filesystem, memory, fetch, sequential-thinking, kintone, kintone-dev, kintone-space, playwright, cve-search, rag, accessibility-scanner |
| ⏭ Windows-skip | 2 | github, office-powerpoint |
| ⏸ disabled | 1 | tavily |

### 1.2 使用頻度の異常な偏り

```
38 回  kintone (公式)        ← 95%
 2 回  playwright            ←  5%
 0 回  残り 14 件             ←  0%（死蔵）
```

**原因仮説**:
1. AI（私）が存在を忘れる = 想起忘却
2. Cursor 標準ツール（Read / Grep / WebFetch / Shell）で先に解決してしまう
3. MCP 起動の認知コスト > 機能の便益

### 1.3 セキュリティ懸念

- `~/.cursor/mcp.json` の kintone / kintone-space に **平文パスワード `kent2511`**
- バックアップが git tracked になったら漏洩リスク

### 1.4 RAG 反映の同日遅延

- 朝 06:00 cron で自動 ingest（健全）
- ただし**同日中に追加した docs は翌朝まで反映されない** = 最大 24h タイムラグ
- 例: 4/22 21:22 追加の TSB-010 を同日 23:00 に rag_search しても出てこない

---

## 🔬 第 2 部: 10 次元深掘り分析（段階 2 の要約）

詳細は `docs/reports/2026-04-23-mcp-deep-analysis-stage2.md` 参照。各次元の核心 1 行のみ:

| 次元 | 核心 | 段階 3 アクション |
|---|---|---|
| 1. kintone 一極集中分散 | 自作 MCP 2 件を PC 台帳 PJ で実戦投入 | D12 + 4/23-26 実証 |
| 2. 死蔵 MCP の想起トリガー | AGENTS.md §50 新設 = タスク開始時 30 秒チェック | **R24** |
| 3. RAG 同日反映遅延 | npm run rag:ingest 追加 + §21 強化 | **R25 + R26** |
| 4. mcp.json 平文認証 | `.gitignore` に backups/mcp/ 追加（即時）+ .env 経由化（5 月以降）| 5 月以降 |
| 5. tavily disabled 宙ぶらりん | mcp-status.md で記録 + 5/16 判断 | **D12** |
| 6. PC 台帳 PJ × MCP マトリクス | Day 1-4 × 16 MCP 表 | 戦略書 §3 に記載 |
| 7. MCP 統合パターン 5 種 | A/B/C/D/E パターン提案 | 戦略書 §4 に記載 |
| 8. 新規 MCP 候補 | excel-mcp が高優先 / 5 月以降検討 | 戦略書 §5 |
| 9. コスト効率 | 月 ¥0 維持 / google-search 100 回境界注意 | 月次健康診断 |
| 10. 5/13 本番運用後の活用 | 業務 × MCP マトリクス v2 を 5/13 前後で作成 | 5/10 頃別タスク |

---

## 🚀 第 3 部: PC 台帳 PJ × MCP 活用マトリクス（4/23 木 〜 5/13 水）

| MCP | Day 1 4/23 環境設定 | Day 2 4/24 M365 マスタ | Day 3 4/25 PC 台帳 | Day 4 4/26 customize | 移行 4/30-5/2 | 試運用 5/7-12 | 本番 5/13~ |
|---|---|---|---|---|---|---|---|
| **kintone** (公式) | ✅ | ✅ | ✅ | ✅ | ✅ 一括 import | ✅ | ✅ |
| **kintone-dev** (自作) | ⭐ アプリ作成試験 | ⭐ | ⭐ | - | - | - | - |
| **kintone-space** (自作) | ⭐ スペース 21 配置試験 | ⭐ | ⭐ | - | - | - | - |
| **rag** | ⭐ §20 義務 | ⭐ | ⭐ | - | - | - | ⭐ 月次 |
| **memory** | ⭐ 設計判断記憶 | ⭐ | ⭐ | - | - | - | ⭐ 長期 |
| **sequential-thinking** | ⭐ 大型判断 | ⭐ | ⭐ | - | - | - | - |
| **playwright** | - | - | - | ⭐ E2E | - | ⭐ 試運用 | - |
| **accessibility-scanner** | - | - | - | ⭐ a11y | - | - | - |
| **cve-search** | - | - | - | △ 依存 | - | - | △ 月次 |

凡例: ⭐ 必須 / ✅ 通常 / △ 候補 / - 該当なし

### 4/23 朝の必須キーアクション
1. kintone-dev で 環境設定マスタ作成試験 → 結果記録
2. kintone-space でスペース 21 配置試験 → 結果記録
3. rag_search で「環境設定マスタ 仕様」検索 → 過去判断引用
4. memory で「PC 台帳 PJ Day 1 重要決定」を保存試験

→ 4/30 (木) 時点で 4 件の実証結果を `docs/mcp-status.md` 「次回再評価」列に反映 → 自作 MCP 価値判定

---

## 🔗 第 4 部: MCP 統合パターン 5 種

### パターン A: 大型設計判断
```
sequential-thinking → rag → memory → (浜田判断後) memory
```

### パターン B: バグ調査
```
rag (§20) → sequential-thinking (仮説 5 並列) → docs/troubleshooting.md → npm run rag:ingest (R26)
```

### パターン C: kintone アプリ作成（PC 台帳 PJ）
```
kintone-dev → kintone-space → kintone (検証) → memory (記録)
```

### パターン D: Web UI 改修
```
accessibility-scanner (前) → playwright (改修後 E2E) → accessibility-scanner (後比較)
```

### パターン E: 月次セキュリティ巡回
```
cve-search → cyber-news → docs/reports/<月>-security-review.md → rag (過去対応参照)
```

→ パターン A/B/C は AGENTS.md §50 に **「典型ワークフロー」** として組込候補（R24 では含めず / 別 proposal として 5 月以降検討）

---

## 🆕 第 5 部: 新規 MCP 候補（5 月以降）

| 候補 | 用途 | 優先度 | 判断時期 |
|---|---|---|---|
| **excel-mcp** | Excel 直接操作 | 🟢 高 | **5/13 PC 台帳本番運用後** = 浜田の Excel 業務（M365 ライセンス管理 / 経理 FAQ）と直結 |
| ~~slack-mcp~~ | ~~Slack 通知~~ | ❌ **対象外（浜田確認 2026-04-23: Slack 未使用）** | 検討終了 |
| postgres-mcp / sqlite-mcp | DB 直接操作 | 🟡 中 | logs/task-estimates.jsonl の query 用 / 改善 #5 R14 の段階 2 と連動 |
| git-history-mcp | git 履歴高度検索 | 🟡 中 | 過去 30 日 TSB 言及 commit 等の複雑検索用 |
| その他（notion / linear / chrome-bookmark）| 各種 | 🔴 低 | 既存基盤で十分 / **MCP 16 → 17+ の肥大化防止** |

→ §47-B ルール疲労ガードの精神に従い、**安易に増やさない方針**

**追加 MCP 候補の深掘り（2026-04-23 02:30 浜田追加依頼後）**: §10 で別途記載

---

## 💰 第 6 部: コスト効率

### 現状 = 月額 **¥0**
- 全 16 MCP のうち、課金リスクがあるのは google-search（月 100 回まで無料 / 超えたら $5/1000 query）のみ
- 過去 30 日 google-search 使用 = 0 回 → リスク低

### 監視項目
- google-search 月 80 回到達でアラート（5/1 開始の月次健康診断に組込候補）
- 新規 MCP 導入時はコスト確認必須

---

## 📅 第 7 部: 5/13 本番運用後の MCP 活用想定

| 業務 | MCP 組合せ |
|---|---|
| 日次 M365 5 台ライセンス監視 | kintone + memory + (slack-mcp / 導入時) |
| 旧アプリ書込検知 | kintone (rev 比較) + playwright (UI 経由) |
| SKYSEA × kintone 突合 (5/17~) | kintone + filesystem (CSV) + rag |
| 月次セキュリティレビュー | cve-search + cyber-news + rag (パターン E) |
| 経理 FAQ 改修 | playwright + accessibility-scanner (パターン D) |
| PowerPoint 月次報告 | office-powerpoint (Win) |

→ 5/10 頃に「業務 × MCP マトリクス v2」を別 plan として作成

---

## ✅ 第 8 部: 浜田レビュー用 5 件 proposal サマリ

### proposal 配置先
`docs/approved-changes/2026-04-24/`（**4/24 朝 cron で適用予定 / 19:00 浜田判断後に確定**）

### 各 proposal の概要 + 推奨度

#### R24 (string_replace AGENTS.md) ⭐ 強推奨
- AGENTS.md 末尾の付則直前に **第14章 MCP 活用 §50 MCP 想起儀式** を新設
- タスク開始時 30 秒で「該当 MCP がないか」チェックリストをスキャンする義務
- ルール疲労ガード適用済（§47-B 違反考慮: 効果範囲が広いため採用）

#### R25 (string_replace AGENTS.md) ⭐ 強推奨
- §21 学習サイクル 4 ステップに「2-A 即時 RAG ingest」追加
- docs 追記直後に必ず ingest 実行 = 同日中の rag_search で引けるように

#### R26 (string_replace package.json) ⭐ 強推奨（R25 必須セット）
- `npm run rag:ingest` + `npm run rag:ingest:rules` 追加
- NVM v24 絶対パス + `--yes` 指定で Cursor 環境シミュレーション対策込み

#### D12 (file_write docs/mcp-status.md) ⭐ 強推奨
- 16 MCP 状態管理台帳新規作成
- tavily disabled の経緯記録（4/23 時点 = 不明）+ 5/16 再評価日設定
- 平文認証問題の段階別対策計画記載
- 月次健康診断の集計項目記載

#### S12 (健康診断拡張 / **今夜は proposal 化せず別タスクへ**) 推奨
- health-check.mjs に「過去 7 日使用 0 回 MCP の死蔵警告」追加
- 既存スクリプト改修 = リスク中 → **今夜は段階 3 で proposal 化せず、別途 4/30 までに実装する別タスク化**
- 理由: 今夜のスコープは「19:00 まで戦略書 + proposal」/ S12 は実装が重く別工数

### 浜田の応答方法
- 個別: 「R24 承認 / R25 修正して: 〜 / D12 却下」
- 一括: 「全部承認」「R 系のみ」「**戦略書ベスト推奨セット = R24 + R25 + R26 + D12 の 4 件**」

---

## 🔗 第 9 部: 関連ドキュメント

- 段階 1 監査: `docs/reports/2026-04-23-mcp-audit-stage1.md` (全 9 章)
- 段階 2 深掘り: `docs/reports/2026-04-23-mcp-deep-analysis-stage2.md` (全 10 次元 + 結論)
- 段階 3 戦略書: 本ファイル
- proposal 5 件: `docs/approved-changes/2026-04-24/{R24,R25,R26,D12}*.proposal.json` (S12 は別タスク)
- AGENTS.md §17 / §20 / §21 / §22 / §23 / §24 / §50（4/24 cron 適用後）
- 既存 MCP 関連: `scripts/{backup-mcp.sh,check-mcp.sh,restore-mcp.sh}` / `scripts/health-check.mjs`
- PC 台帳仕様: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v2.1

---

## 🎯 結論

**「ツールは増やすより使い切る」が今回の戦略の核心。**

16 MCP 既にあるのに 14 件死蔵 = 新規追加より既存の活性化が優先。R24 (§50) で構造的バイアスを矯正し、R25 + R26 (RAG 即時化) で日々の鮮度を保ち、D12 (状態管理台帳) で見える化する。

PC 台帳 PJ 4/23-26 は kintone-dev / kintone-space / rag / memory / sequential-thinking の 5 件を**実戦投入する絶好の機会**。これを逃すと「死蔵のまま 5/13 本番運用」に流れ、6 月以降の判断材料が永遠に得られない。

5 月以降は新規 MCP（excel-mcp 等）を慎重に検討するが、§47-B ルール疲労ガードの精神に従い**安易な追加は避ける**。
