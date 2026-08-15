# Cursor Plan & Usage 監視（D3 / 2026-05-31 承認）

**制定**: 2026-05-31（浜田 GO）

## 目的

Plan & Usage スクリーンショットを浜田が共有したとき、CIO が **過剰利用を早期に指摘**し、ルール見直しを提案する。

## 閾値（アラート）

| 指標 | 閾値 | アクション |
|------|------|------------|
| **Auto + Composer** 使用率 | **> 70%** | モデル割当・15ターン規律・Subagent 利用を **ルールレビュー案**として提示 |
| **API** 使用率 | **> 50%** | On-Demand / モデル選択の見直しを提案 |
| **On-Demand** 課金 | **> $0** | 原因ターンの特定と **コスト防衛**（`20-cost-token-defense-kernel.md`）参照 |

## 閾値未満

**記録のみ** — 追加アクション不要（2026-05-31 時点: Auto+Composer 26% / API 1% / $0 = OK）。

## AI 手順

1. 浜田が Usage 画像を送ったターンで **上表と照合**
2. 閾値超過時: **1 段落**で状況＋**ルール修正案 1〜3 行**（承認待ち ID 付き可）
3. 閾値内: 「OK — 対応不要」と 1 行
4. **夕反省 26 には書かない**（運用監視のみ。ミス削減案が出た場合のみ 26 へ）

## 記録催促（2026-06-15 CEO 合意 / 2026-07-02 頻度確定）

**報告頻度**: **3 日に 1 回**が妥当（毎日必須ではない）。

浜田から Plan & Usage の報告がないとき、**CIO（AI チーム）が催促してよい**（**報告がないときは必ず 1 行で教える**）。

| 条件 | アクション |
|------|------------|
| **毎セッション開始**（bootstrap 後） | **`npm run credit:session-start`** — AI は **依頼を聞く前**に 1 行（stale なら催促を先） |
| 最終 `credit:set` から **3 日以上**（`STALE_RECORD_DAYS`） | 上記第1文で **必ず催促**（同一セッション 1 回まで） |
| 未記録（`latest_percent === null`） | 同上 |
| 催促の内容 | 「Plan & Usage スクショまたは Total% を送付ください（**3 日に 1 回**）」— **`npm run credit:set` は CIO が実行**（§35-1） |
| 頻度 | **同一セッションで 1 回**まで（うるさくしない）。翌日以降また 3 日超なら再催促 |

機械ゲート: `npm run credit:session-start`（bootstrap 内）· `credit:status --json` · `verify:session-close-git-warn` 末尾 CREDIT 行（D-CREDIT-01）。

## 月次リセット vs UI 内訳（2026-08-15 教訓）

課金日は **毎月 15 日 (JST)**。スクショの **Cursor Models 1% / Other Models 0%** を「旧期間の内訳」と読まない。

| 見え方 | 正 |
|--------|----|
| 課金日に Total が急落（例 33%→1%）+ Resets ~31 日 | **新期間開始**。`credit:reset -- --now` → `credit:set` |
| Cursor Models / Other Models のバー | 内訳。記録対象は **当期間の Total%** |
| 課金日でも % が前日並み | まだ旧期間。`credit:set` 可（スクリプトが warn） |

`credit:set` は期間未ロール＋急落を **exit 1** で拒否する。

## 関連

- `docs/constitution/20-cost-token-defense-kernel.md`
- 18 追記（2026-05-31）
