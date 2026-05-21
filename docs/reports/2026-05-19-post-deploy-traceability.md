# 事後トレーサビリティ — 674 棚卸 v1 / ICT v2.2（DeepSeek #3 是正）

> **作成**: 2026-05-19（浜田承認・恒久是正 §3 承認後）  
> **背景**: 着手前 DeepSeek レビューなしで deploy 済みだったため、事後レビュー（R0）の指摘 #3 を本書で補完する。

## 1. 変更一覧

| レーン | 成果物 | 本番状態 | 正本 |
|--------|--------|----------|------|
| 674 棚卸 | `inventory_history` サブテーブル・670 期間キー・`customize/new-pc-ledger-v1/desktop.js` | deploy rev **216** BUILD `2026-05-19-inventory-period-v1` | `docs/plans/2026-05-19-pc-inventory-ops.md` |
| ICT v2.2 | `ai-exclusion.ts`・`field-codes.ts`・`gemini-curate.ts`・686 customize | 686 rev **22** BUILD `2026-05-19-686-ict-digest-no-ai-llm` | `docs/plans/2026-05-16-ict-tech-digest-spec.md` §2.4 |
| 685 データ | AI カテゴリ＋トピック一致記事の削除 | **2026-05-19 累計 6 件削除**（下記 §3） | `ict-tech-digest-automation/scripts/delete-685-ai-llm-records.mjs` |

## 2. 設計意図（要約）

### 674 棚卸

- 年次棚卸をレコード内サブテーブルに蓄積し、親の「最新棚卸日」を同期。
- 実施期間は 670 の `PC_INVENTORY_PERIOD_*` でゲート。対象ステータスは **利用中・保管** のみ。
- 個別（詳細ヘッダ）と一括（一覧・所属名）の 2 経路。PUT 前に `isInventoryTargetPcStatus674` で再検証。

### ICT AI・LLM 除外

- 収集パイプライン: RSS 候補フィルタ + Gemini 厳選後フィルタ（二重）。
- 685 カテゴリから `AI・LLM` を廃止（6 カテゴリ）。686 フィルタチップからも削除。
- 既存 685 データはスクリプトで削除（カテゴリ一致 + 任意でタイトル・概要のトピック判定）。

## 3. 685 削除ログ（2026-05-19）

| 実行 | モード | 件数 | 内訳 |
|------|--------|------|------|
| 1 回目 | `--apply`（カテゴリのみ） | 1 | $id=31 `AI・LLM` |
| 2 回目 | `--apply --include-topic` | 5 | topic のみ（$id=20,23,28,29,33） |

**2 回目後の 685 残件**: 全 13 件取得時点で対象 5 件削除 → **残 8 件**（dry-run 時点の母数）。

トピック判定: `ict-tech-digest-automation/src/lib/ai-exclusion.ts` の `isAiLlmTopicText`（正規表現群）。

## 4. テスト・検証計画

| 項目 | 担当 | 状態 |
|------|------|------|
| 674 個別棚卸 1 件 | 浜田 | **未**（#5a） |
| 674 一括棚卸 1 所属（DeepSeek #1） | 浜田 | **明日**（ステータス混入の最終確認） |
| 685 に AI・LLM カテゴリ新規 0 件 | CIO | 次回 GHA 成功後に確認 |
| 686 フィルタに AI・LLM なし | 浜田 | 任意 |
| `desktop.js` 構文 | CIO | deploy 済み・正式検収は浜田 |

## 5. 影響範囲・ロールバック

| リスク | 緩和 |
|--------|------|
| 棚卸 PUT 誤更新 | サブテーブル行は追記型。復旧は kintone 変更履歴またはバックアップ方針に従う |
| 685 記事の過剰削除（topic 判定） | 削除 ID は §3 に記録。必要ならソース RSS から再収集（GHA） |
| GHA が旧コードのまま | **lab push 後**の次回収集で v2.2 ロジック適用 |

## 6. プロセス是正（承認済み）

- **恒久是正**: `chat-sessions/2026-05-19-cio-rule-remediation-plan.md` §3 — 次セッション以降 **例外なし**
- **git push**: 明日 CIO 自律（承認 B）

## 7. 関連

- ルール違反反省: `chat-sessions/2026-05-19-cio-rule-remediation-plan.md`
- オープン: `docs/backlog/cio-open-issues-2026-05-17.md` **#5a**
