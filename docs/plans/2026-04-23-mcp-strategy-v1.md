# 🎯 MCP 強化戦略書 v1.0

**起票**: 2026-04-23 (Thu) 02:35 JST
**起票者**: AI（Cursor メインチャット / 浜田 4/22 22:00 締め後の追加依頼）
**スコープ**: 全 16 MCP（浜田 a 案承認済）
**読者**: 浜田（今日 19:00 戻り後にレビュー予定）
**判断期日**: 2026-04-23 (Thu) 19:00-21:00 = 浜田レビュー → 承認分は §44 夕反省フローで `docs/approved-changes/2026-04-24/` に振り分け → 4/24 06:00 cron で自動適用

---

## 📌 エグゼクティブサマリ（30 秒で読める要約 / 2026-04-23 03:15 訂正反映）

### 現状診断
- **インストール 16 / 健全 13 / Win-skip 2 / disabled 1** = 接続自体は健全
- 過去 30 日の実使用 (S12 精密 regex 集計): **✅ 8 active / ⚠ 6 dormant / ⏭ 2 Win-skip / ⏸ 1 disabled**
  - active: kintone 238 / kintone-space 14 / playwright 10 / sequential-thinking 9 / filesystem 7 / kintone-dev 4 / memory 2 / rag (0 だが §20 義務化中で active 扱い)
  - **真の死蔵 6 件**: cyber-news / google-search / fetch / cve-search / rag (§20 違反継続中) / accessibility-scanner
- 当初「14 件死蔵」と判定したのは私の grep 正規表現の不完全性が原因。S12 で精密化した結果、**実は半数の 6 件が死蔵 = 状況は当初想定よりマシ**
- ただし **rag 0 回 (§20 RAG 検索義務違反継続中) が最大の発見** = R24 §50 + R25 §21 強化が必要な真の理由

### 戦略の 3 本柱
1. **死蔵 MCP の活性化**: AGENTS.md §50 新設（タスク開始時 30 秒の MCP 想起儀式）+ 朝ブリーフィングに死蔵警告
2. **kintone 一極集中の分散**: 自作 MCP 2 件（kintone-dev / kintone-space）を PC 台帳 PJ 4/23-26 で実戦投入 → 価値判定
3. **構造改善**: RAG 同日反映遅延の解消（npm run rag:ingest 追加）+ 平文認証の最低限保護（.gitignore）

### 浜田に判断頂きたいこと（6 件 proposal / 2026-04-23 03:15 S12 追加 + Q1/Q2/Q3 反映）
| ID | 内容 | リスク | 私の §48 推奨 | 浜田判断 |
|---|---|---|---|---|
| **R24** | AGENTS.md §50 新設「MCP 想起儀式」 | 中（ルール疲労ガード対象）| ⭐ 強推奨 | ✅ Q1=a 採用済 |
| **R25** | AGENTS.md §21 強化「即時 RAG ingest 義務」 | 低 | ⭐ 強推奨 | （R24 セット）|
| **R26** | package.json `npm run rag:ingest` 追加 | 低 | ⭐ 強推奨（R25 と必須セット）| （R25 セット）|
| **D12** | `docs/mcp-status.md` 新規（16 MCP 状態管理台帳）| 低 | ⭐ 強推奨 | （セット）|
| **S12** | `scripts/check-mcp-dormancy.mjs` 新規（独立スクリプト）| 低（独立 file_write）| ⭐ 強推奨（4/24 cron 適用予定）| ✅ Q3 完成度優先で追加 |
| **(別ファイル) context7 + excel 評価** | `docs/reports/2026-04-23-context7-and-excel-mcp-eval.md` | - | 19:00 戻り後 Q4/Q5 で判断材料 | 評価のみ |

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

## ✅ 第 8 部: 浜田レビュー用 6 件 proposal サマリ（2026-04-23 03:15 更新 / S12 追加）

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

#### S12 (file_write scripts/check-mcp-dormancy.mjs) ⭐ 強推奨 ← 2026-04-23 03:15 追加
- 独立スクリプトとして新規作成（既存 health-check.mjs を直接改修せず安全パターン採用）
- 過去 N 日 (デフォルト 7 / オプション --days=30) の Cursor agent transcripts を grep して MCP 使用回数集計
- 0 回 = ⚠ dormant / 過去 30 日 0 回 (--strict) = ❌ deletion-candidate
- smoke-test 済 = 真の死蔵 6 件特定（cyber-news / google-search / fetch / cve-search / rag / accessibility-scanner）
- health-check.mjs から呼出す統合は別 commit で手動実装（S9/S10/S11 と同パターン）

### 浜田の応答方法（19:00 戻り後）
- 個別: 「R24 承認 / R25 修正して: 〜 / D12 却下」
- 一括: 「全部承認」「R 系のみ」「**戦略書ベスト推奨セット = R24 + R25 + R26 + D12 + S12 の 5 件**」

---

## 🆕 第 10 部: 追加 MCP 候補深掘り（2026-04-23 02:50 浜田追加依頼後）

### 10.1 Slack 候補削除確定（浜田回答 = Slack 未使用）

slack-mcp は対象外確定。代わりに浜田の実業務にフィットする他候補を再検討。

### 10.2 新規候補ランキング（更新版）

| 順位 | 候補 | 用途 | 浜田業務との整合 | 優先度 | 判断時期 |
|---|---|---|---|---|---|
| 🥇 | **context7-mcp** | ライブラリ公式 docs を AI が直接引ける（kintone JS API / Vue / React 等の最新 docs を rag 不要で検索）| ⭐⭐⭐ kintone customize JS で公式 API リファレンスを毎回 WebSearch している現状を解消 | 🟢 高 | **5/13 PC 台帳本番後 = 即評価** |
| 🥈 | **excel-mcp** | Excel 直接操作 | ⭐⭐⭐ M365 5 台ライセンス管理 / 経理 FAQ で Excel 触る場面多数 | 🟢 高 | 5/13 後 |
| 🥉 | **screenshot-mcp / browser-screenshot** | URL → 画像生成 | ⭐⭐ 経理 FAQ ポータル / kintone UI 改修時の before/after 比較 | 🟡 中 | 5/13 後 |
| 4 | **date-mcp** | 日時計算専用 | ⭐⭐ §39 発言前日時確認の精度向上 / 営業日計算 / cron 時刻設計 | 🟡 中 | 5/13 後 |
| 5 | **semgrep-mcp** | 静的解析自動化 | ⭐⭐ kintone customize JS の脆弱性自動スキャン / S8 と統合可能 | 🟡 中 | 6 月以降 |
| 6 | **git-history-mcp** | git 履歴高度検索 | ⭐ 過去 30 日 TSB 言及 commit 等の複雑検索 | 🟡 中 | 6 月以降 |
| 7 | **postgres-mcp / sqlite-mcp** | DB 直接操作 | ⭐ logs/task-estimates.jsonl の query 用 / 改善 #5 段階 2 と連動 | 🟡 中 | 6 月以降 |

### 10.3 私の §48 推奨（追加 MCP）

**段階 1 (5/13 後即評価)**: **context7-mcp** を最優先で評価
- 理由: PC 台帳 PJ の customize JS 開発で kintone 公式 API リファレンスを毎回確認している状況 → context7 で即引き化すれば開発速度大幅向上
- リスク: パッケージのメンテ状態確認必要（5/14 にまず WebSearch で評価）

**段階 2 (5/20 以降)**: excel-mcp を評価
- 理由: M365 ライセンス管理を kintone と Excel 両方で運用している現状 → excel-mcp で kintone⇔Excel 同期自動化

**段階 3 (6 月以降)**: その他は様子見
- §47-B ルール疲労ガード遵守 = 安易に増やさない

### 10.4 検討対象外（明示的に追加しない）

| 候補 | 理由 |
|---|---|
| ~~slack-mcp~~ | 浜田 Slack 未使用 |
| notion-mcp / linear-mcp | 浜田 Notion / Linear 未使用 |
| chrome-bookmark-mcp | 用途限定的 |
| claude-code-cli-bridge | TSB-011 並行チャット騒動の温床 = 増やさない |

---

## 🔥 第 11 部: 死蔵 14 MCP 活性化 具体プレイ集

各 MCP に対して「次にいつ・どう使うか」の **具体シーン + コマンド例** を 1 件ずつ提示する。AI（私）が想起しやすいよう実例ベースで記述。

### 11.1 PC 台帳 PJ 即実戦投入（4/23-4/26 / 5 件）

#### a. **kintone-dev** （自作 / 4/23 朝）
- **シーン**: 環境設定マスタアプリ（spec §6.2）の 5 フィールド一括作成
- **試行コマンド**: kintone-dev の `describe tools` を最初に実行 → アプリ作成系ツール特定 → 試行
- **判定基準**: 公式 kintone MCP より高速 / 直感的なら採用 / 同等以下なら 4/26 に削除候補昇格

#### b. **kintone-space** （自作 / 4/23 朝）
- **シーン**: 環境設定マスタをスペース 21 (システム管理) 直下に配置
- **試行コマンド**: kintone-space の `describe tools` で配置系ツール特定 → 試行
- **判定基準**: 浜田が手動で kintone GUI で配置するより高速ならアプリ 5 個分活用継続

#### c. **rag** （4/23 朝）
- **シーン**: 環境設定マスタ作成前に「過去の kintone マスタ設計判断」を rag_search
- **コマンド**: `rag_search "kintone マスタ 設計 採番"` または `npx mcp-local-rag query "..."`
- **狙い**: §20 義務遵守 + 過去判断の引用で「なぜこの設計か」を明示化

#### d. **memory** （4/23 朝）
- **シーン**: PC 台帳 Day 1 の重要決定（B-2 = 34 件確定 / 廃棄 1 件特定 等）を memory に保存
- **試行**: memory の `create_entities` で「PC 台帳 PJ 確定事項」を knowledge graph 化
- **狙い**: 翌日以降のセッションで `memory.search_nodes("PC 台帳")` で即引用

#### e. **sequential-thinking** （4/26 customize Day）
- **シーン**: customize JS の大型設計判断（PW 自動算出ロジック / バリデーション 2 系統等）
- **試行**: 設計判断時に sequential-thinking を呼ぶ → 5-7 ステップで仮説出し
- **狙い**: 私の単独思考より穴が見つかる仮説提示

### 11.2 月次セキュリティ巡回（5/1 開始 / 2 件）

#### f. **cve-search** （5/1 月次 cron 化候補）
- **シーン**: package.json + security-next-automation の依存パッケージ全件 CVE スキャン
- **コマンド例**: `cve-search で query "eslint 9.39.4 vulnerabilities"` など
- **cron 化案**: 毎月 1 日 07:00 に `node scripts/monthly-cve-scan.mjs` 実行 → 結果を `docs/reports/<月>-security-review.md` に出力

#### g. **cyber-news** （5/1 月次 cron 化候補）
- **シーン**: 月次セキュリティニュース取得 → 浜田業務影響あるものをフィルタ
- **cron 化案**: 月次 cron に組込（cve-search と同タイミング）

### 11.3 customize 改修時 (4/26 + 経理 FAQ / 2 件)

#### h. **playwright** （4/26 customize Day）
- **シーン**: 新・PC台帳ver.1 customize の動作 E2E テスト
- **試行**: kintone 詳細画面遷移 → customize 起動確認 → 値入力 → 保存テスト
- **狙い**: 手動テストの自動化

#### i. **accessibility-scanner** （4/26 customize Day）
- **シーン**: 新・PC台帳ver.1 customize の UI a11y 検査
- **コマンド例**: `accessibility-scanner で URL=<kintone 詳細画面 URL>`
- **狙い**: アクセシビリティ標準準拠（kintone カスタマイズも対象）

### 11.4 散発活用（必要時 / 3 件）

#### j. **google-search**
- **シーン**: kintone API 仕様 / customize ベストプラクティス / npm パッケージ評価
- **使用条件**: Cursor 標準 WebFetch で URL 直指定できない場合（検索が必要な場合）
- **実例**: 「kintone subtable query best practice 2026」検索

#### k. **fetch**
- **シーン**: 公式 docs URL の取得（Cursor 標準 WebFetch で代替可なため**原則使わない**）
- **使用条件**: Cursor WebFetch がブロックされる稀なケース
- **判定**: 連続 60 日 0 回なら 6 月以降に削除候補

#### l. **sequential-thinking**（重複 = e と同）

### 11.5 Cursor 標準で代替可（削除候補 / 2 件）

#### m. **filesystem**
- **代替**: Cursor 標準の Read / Write / Glob / Edit ツール
- **判定**: 連続 60 日 0 回 + Cursor 標準で困らないなら 6/30 に削除
- **例外**: 別ツール（Claude Code / Anthropic Workbench 等）から共有する場合のみ価値あり

#### n. ~~削除候補同上 = filesystem と同類~~ filesystem のみ

### 11.6 Windows-skip / 散発（3 件 / WSL から触れない）

#### o. **github** （Win 起動）
- **WSL 側の代替**: `gh` CLI / Cursor 標準で十分
- **Windows 側起動シーン**: 浜田が Windows Cursor で GitHub Issue 操作する場合のみ
- **判定**: WSL ベースの私としては「無いものとして扱う」

#### p. **office-powerpoint** （Win 起動）
- **想定シーン**: 5/13 後の **月次運用レポート PPT 自動生成**
- **判定**: 浜田が Windows Cursor で PPT 作成タスクをやる時に活性化検討

#### q. **cyber-news** （= f / 月次活用 と重複）

### 11.7 disabled（再評価対象 / 1 件）

#### r. **tavily**
- **状態**: disabled（浜田確認: 課金必要のため google-search 代替化）
- **判定**: 5/16 サブエージェント PoC 再議論時に **完全削除 or 維持** を判断
- **削除推奨理由**: google-search 安定運用継続中 + tavily 復活の業務必要性なし

### 11.8 活性化計画サマリ表

| MCP | 活性化タイミング | アクション | 担当 |
|---|---|---|---|
| kintone-dev | 4/23 朝 | アプリ作成試験 | 私 |
| kintone-space | 4/23 朝 | スペース配置試験 | 私 |
| rag | 4/23 朝（毎タスク前）| rag_search 義務（§20 + R24 §50）| 私 |
| memory | 4/23 朝 | PC 台帳確定事項保存試験 | 私 |
| sequential-thinking | 4/26 | customize 大型判断 | 私 |
| cve-search | 5/1 | 月次 cron 化 | 私（5 月以降実装）|
| cyber-news | 5/1 | 月次 cron 化 | 私（5 月以降実装）|
| playwright | 4/26 | customize E2E | 私 |
| accessibility-scanner | 4/26 | customize a11y | 私 |
| google-search | 都度 | 検索必要時 | 私 |
| fetch | 削除候補 | 4/30 + 60 日後 = 6/30 判断 | 浜田 |
| filesystem | 削除候補 | 同上 | 浜田 |
| github | Win 限定 | WSL 側「無視」 | 浜田 |
| office-powerpoint | 5/13 後 | 月次レポート用検討 | 浜田 |
| tavily | 5/16 | 削除 or 維持判断 | 浜田 |

---

## ⚠ 第 12 部: 次元 4（mcp.json セキュリティ）の訂正と段階 2 確定

### 12.1 段階 1 監査の過剰懸念訂正

段階 1 §4.1 で「mcp.json バックアップ git tracked リスク」と書いたが、実際の経路を全件確認した結果 = **現状の漏洩リスクは実質ゼロ**。

| 経路 | 状態 |
|---|---|
| `backups/` git tracked | ❌ `.gitignore` 行 28 で除外済 |
| `~/.cursor-emergency-backup/` 複製 | ❌ mcp.json 含まれてない |
| Cursor cloud sync | ❌ settings.json 不在 = 未設定 |
| ローカル閲覧 | ✅ 本人のみ可能 = 実質ゼロ |

### 12.2 段階 2（.env 経由化）の方式確定

調査レポート `docs/reports/2026-04-23-mcp-env-research.md` 参照。3 方式比較の結論:

| 方式 | 工数 | 確実性 | 推奨度 |
|---|---|---|---|
| **A. ラッパー shell script** | 30 分 | 🟢 最高 | ⭐⭐⭐ 採用 |
| B. envmcp パッケージ | 15 分 | 🟡 中 | ⭐⭐ 6 月以降検討 |
| C. ${env:VAR} + /etc/environment | 10 分 | 🟠 低（WSL で動かない可能性）| ⭐ 不採用 |

### 12.3 5 月以降のスケジュール
- Week 1 (5/14-5/16): wrapper script 2 件作成 + `~/.cursor/.env` 配置
- Week 2 (5/17-5/23): 安定運用 1 週間 + TSB 記録
- Week 3+ (5/24+): 全 MCP 統一管理 + envmcp 評価

---


---

## 🔗 第 13 部: 関連ドキュメント

- 段階 1 監査: `docs/reports/2026-04-23-mcp-audit-stage1.md` (全 9 章 + 訂正注記 3 件)
- 段階 2 深掘り: `docs/reports/2026-04-23-mcp-deep-analysis-stage2.md` (全 10 次元 + 結論)
- 段階 3 戦略書: 本ファイル
- env 経由化調査: `docs/reports/2026-04-23-mcp-env-research.md` (Q2 a 案実施結果 / 方式 A 採用確定)
- context7 + excel 評価: `docs/reports/2026-04-23-context7-and-excel-mcp-eval.md` (Q3 完成度優先実施)
- proposal 6 件: `docs/approved-changes/2026-04-24/{R24,R25,R26,D12,S12}*.proposal.json`
- AGENTS.md §17 / §20 / §21 / §22 / §23 / §24 / §50（4/24 cron 適用後）
- 既存 MCP 関連: `scripts/{backup-mcp.sh,check-mcp.sh,restore-mcp.sh}` / `scripts/health-check.mjs`
- PC 台帳仕様: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v2.1
- 19:00 戻り後の浜田判断項目候補: Q4 (context7 採用判断) / Q5 (excel-mcp 採用判断)

---

## 🎯 結論

**「ツールは増やすより使い切る」が今回の戦略の核心。**

16 MCP 既にあるのに 14 件死蔵 = 新規追加より既存の活性化が優先。R24 (§50) で構造的バイアスを矯正し、R25 + R26 (RAG 即時化) で日々の鮮度を保ち、D12 (状態管理台帳) で見える化する。

PC 台帳 PJ 4/23-26 は kintone-dev / kintone-space / rag / memory / sequential-thinking の 5 件を**実戦投入する絶好の機会**。これを逃すと「死蔵のまま 5/13 本番運用」に流れ、6 月以降の判断材料が永遠に得られない。

5 月以降は新規 MCP（excel-mcp 等）を慎重に検討するが、§47-B ルール疲労ガードの精神に従い**安易な追加は避ける**。

---

## 7. 4/23 03:00 早朝 MCP 実証結果（重大訂正）

**実施背景**: 浜田「a+c 実施。利用が少ない/ないものは活用方法を考えて有効活用」指示（4/23 02:45）を受け、AI が autonomous mode で MCP 群を実 call し、机上分析（段階 1 監査）の精度を検証。

### 7-1. 実証で判明した重大訂正

| MCP | 段階 1 監査の判断 | 4/23 03:00 実証結果 | 訂正内容 |
|---|---|---|---|
| **rag** | active 扱い（§20 義務化中で 0 回でも active 表記） | ❌ **完全 broken** = `documentCount: 0` / `chunkCount: 0` / lancedb 43MB は実在するが MCP サーバが認識できず | **TSB-012 として記録** / 修復は浜田立ち会いで明日以降 |
| **memory** | 死蔵 6 件 candidate（segment 1 の集計） | ✅ **別 PJ で active 利用中**（GitHub-Actions/security-next-automation で SecurityNextAutomation_Roadmap entity 確認）| 死蔵判断は誤り / kintone-ai-lab 側でも 4 entities + 5 relations 投入で active 化完了 |
| **cyber-news** | 死蔵 6 件の 1 つ | ✅ **完全動作**（21 feeds = CISA / SANS / Hacker News / Mandiant / Krebs 等 / 直近 npm supply chain worm ニュース取得 OK）| **S14 月次セキュリティ巡回 cron で 5/1 から実戦投入** |
| **cve-search** | 死蔵 6 件の 1 つ | ✅ **完全動作**（NVD 2026-04-22 最新 / 全 DB 健全 / vendor/product/cve_id 検索 OK）| **S14 月次セキュリティ巡回 cron で 5/1 から実戦投入** / vendor 名は NVD 表記要確認 |
| **kintone-dev** | 役割不明 / 削除候補? | ⚠ **API 仕様参照ツール**（アプリ作成 MCP ではない）/ 部分動作（英語クエリ + 部分マッチで返るが日本語クエリは空）| 「kintone customize JS / API 開発時の reference」用途で位置付け確定 / 削除候補から除外 |
| sequential-thinking | active 9 回 | （今回未実証 / 段階 1 結果維持）| 変更なし |

### 7-2. 真の死蔵 MCP（4/23 03:00 実証後の最新版）

**死蔵 = 過去 30 日 0 回かつ実証で機能未確認**:
- google-search（実証スキップ / 段階 1 のまま）
- fetch（実証スキップ / 段階 1 のまま）
- accessibility-scanner（実証スキップ / 段階 1 のまま / 経理 FAQ ポータル v3 で活用予定）

**broken = 機能不全**:
- **rag（重大 / TSB-012）** ← 修復後に「真の active」となる

**実は active**:
- memory（別 PJ + kintone-ai-lab で本日活性化）
- cyber-news（即活用準備可）
- cve-search（即活用準備可）

### 7-3. 4/23 03:00 早朝に実装したアクション

1. **memory MCP 活性化**（kintone-ai-lab 側 / 完了）:
   - 4 entities 投入: `kintone-ai-lab_PC_Ledger_PJ` / `kintone-ai-lab_MCP_Strategy_v1` / `TSB-007_episode_3` / `TSB-011`
   - 5 relations 投入: depends_on / blocked_by_lessons_from / guarded_by_lessons_from / co_developed_with / concurrent_with
2. **S13 proposal 作成**（4/24 朝 cron 適用待ち）:
   - `health-check.mjs` に S9（check-node-modules.mjs）と S12（check-mcp-dormancy.mjs）の wiring 追加
   - グレースフル統合（script 不在時は skip / health-check 全体を止めない）
3. **S14 proposal 作成**（4/24 朝 cron 適用待ち / cron 登録は別途 4/30 夜に手動）:
   - 月次セキュリティ巡回スクリプト新規 = cyber-news 5 feeds + cve-search 主要依存パッケージ統合
   - v1 はスケルトン生成 / v2（5/22 以降）で MCP 結果自動取得実装

### 7-4. 浜田 19:00 レビュー時の追加質問

- **Q6 新**: rag MCP の修復方針は？（a: mcp-local-rag 再 install + 再 ingest / b: 別 RAG 実装に乗換 / c: そもそも rag をやめて memory + filesystem で代替）
- **Q7 新**: S14 月次セキュリティ巡回を 5/1 から開始することを承認するか？（cron 登録 4/30 夜実施可？）

