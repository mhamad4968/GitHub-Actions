# 📚 docs/plans/ ディレクトリ・インデックス

**最終更新**: 2026-04-25 (Sat) 10:50 JST / J-シリーズで Tier C 4 件 (C-9〜C-12) 追記

このディレクトリは **計画書（plan）** を集約。仕様書・proposal・アクションプランなど、作業の前段に立てる "設計文書" を置く。完了したものは `_archive/` へ。未来の予約タスクは `_future/` へ。

---

## 1. ディレクトリ構造

```
docs/plans/
├── INDEX.md                                ← 本ファイル（ナビゲーション）
├── 2026-MM-DD-<topic>.md                   ← 現役プラン（実行中 or 直近の参照）
├── _future/                                ← 未来予約（実行日未到来）
│   └── YYYY-MM-DD-<topic>.md               ← 実行予定日でファイル名
├── _archive/                               ← 完了済プラン（参考保存 / git 履歴の補助）
│   └── YYYY-MM-DD-<topic>.md
```

---

## 2. 現役プラン（active / 直近の参照あり）

| ファイル | 概要 | 状態 |
|----------|------|------|
| [`2026-04-18-skysea-installer.md`](2026-04-18-skysea-installer.md) | SkySea PC 監視ツール導入計画（社内端末配布） | 進行中（4/22 まで更新） |
| [`2026-04-21-new-pc-ledger-spec.md`](2026-04-21-new-pc-ledger-spec.md) | **新・PC 台帳 ver.1 仕様書 v2.1（770 行 / 正本）** | 実装中（Day 3/n 完了） |
| [`2026-04-23-cli-evolution-v1.md`](2026-04-23-cli-evolution-v1.md) | Cursor Agent CLI 進化ロードマップ v1 | 設計フェーズ |
| [`2026-04-23-mcp-strategy-v1.md`](2026-04-23-mcp-strategy-v1.md) | MCP 強化戦略 v1（cyber-news/cve-search の死蔵対策含む） | 段階 1 監査 〜 S14 月次巡回まで実装済 |
| [`2026-04-25-pc-ledger-day3-action.md`](2026-04-25-pc-ledger-day3-action.md) | PC 台帳 Day 3: 採番マスタ 2 アプリ作成（**完了**） | ✅ 完了 / Day 4 着手後 archive 予定 |
| [`2026-04-25-raci-transparency.md`](2026-04-25-raci-transparency.md) | §56 RACI 透明性確保プラン | 実装済（ハッシュ生成・週次照合） |

---

## 3. 未来予約（_future/）

実行日が未到来のタスク。日付ファイル名 = 実行予定日。**実行日に `git mv ../<file>.md` で現役へ移動**。

| ファイル | 実行予定 | 概要 |
|----------|----------|------|
| [`_future/2026-04-22-poc-subagent-review.md`](_future/2026-04-22-poc-subagent-review.md) | 4/22 *過去* | PoC subagent レビュー（実装スキップ判断 / 残置） |
| [`_future/2026-04-26-agents-md-realtime-watch.md`](_future/2026-04-26-agents-md-realtime-watch.md) | 4/26 (Sun) | **K-3** AGENTS.md リアルタイム編集監視 hook (TSB-017 防御 / §51-3 段階 3) |
| [`_future/2026-05-10-session-lock-stage2-force-kill.md`](_future/2026-05-10-session-lock-stage2-force-kill.md) | 5/10 (Sun) | **L-6** session-lock --force-kill モード (§51-3 段階 2 / 浜田 GO 必須 / 誤殺リスク評価) |
| [`_future/2026-04-27-customize-auto-verify.md`](_future/2026-04-27-customize-auto-verify.md) | 4/27 (Mon) | customize 自動検証 |
| [`_future/2026-04-27-morning-ritual-hook-v2.md`](_future/2026-04-27-morning-ritual-hook-v2.md) | 4/27 (Mon) | 朝 ritual hook v2 |
| [`_future/2026-04-27-r10-r11-automation.md`](_future/2026-04-27-r10-r11-automation.md) | 4/27 (Mon) | R10/R11 自動化 |
| [`_future/2026-04-30-s14-cron-install.md`](_future/2026-04-30-s14-cron-install.md) | 4/30 (Thu) | S14 月次セキュリティ巡回 cron 導入 |
| [`_future/2026-05-01-s12-v2-windows-exempt.md`](_future/2026-05-01-s12-v2-windows-exempt.md) | 5/1 | S12 v2: Windows パス除外 |
| [`_future/2026-05-01-s13-v2-summary-markdown.md`](_future/2026-05-01-s13-v2-summary-markdown.md) | 5/1 | S13 v2: 週次サマリ markdown 化 |
| [`_future/2026-05-15-morning-cron-load.md`](_future/2026-05-15-morning-cron-load.md) | 5/15 | 朝 cron 負荷分析 |
| [`_future/2026-05-22-cron-path-unification.md`](_future/2026-05-22-cron-path-unification.md) | 5/22 | cron PATH 統一 |
| [`_future/2026-05-22-monthly-security-rounds-v2.md`](_future/2026-05-22-monthly-security-rounds-v2.md) | 5/22 | **C-11** monthly-security-rounds v2 (MCP 自動呼出 / H-3 設計) / 5 月初に前倒し可否再検討 |
| [`_future/2026-05-22-major-update-review.md`](_future/2026-05-22-major-update-review.md) | 5/22 | メジャーアップデート定期レビュー |
| [`_future/2026-05-22-scripts-lib-extraction.md`](_future/2026-05-22-scripts-lib-extraction.md) | 5/22 | **C-9** scripts/lib/ 共通関数抽出 (markdown-headers / git-utils 等) |
| [`_future/2026-05-25-weekly-summary-cron.md`](_future/2026-05-25-weekly-summary-cron.md) | 5/25 (Sun) | **C-12** 週次サマリ cron 新設 (毎週日曜 21:00 / chat-sessions 集約) |
| [`_future/2026-06-typescript-migration.md`](_future/2026-06-typescript-migration.md) | 6 月 | scripts/ TypeScript 移行検討 |
| [`_future/2026-06-github-mcp-revival.md`](_future/2026-06-github-mcp-revival.md) | 6 月 | **C-10** github MCP 復活検討 (Windows-side 設定見直し / 現状 skip) |

---

## 4. 完了済（_archive/）

| ファイル | 完了日 | 概要 |
|----------|--------|------|
| [`_archive/2026-04-24-pc-ledger-day1-day2-action.md`](_archive/2026-04-24-pc-ledger-day1-day2-action.md) | 2026-04-24 | PC 台帳 Day 1+2: 環境設定マスタ (670 / 12 件) + M365管理マスタ (671 / 10 件) 作成 |

---

## 5. 運用ルール

### 5.1 命名規則

- ファイル名 = `YYYY-MM-DD-<kebab-case-topic>.md`
- 日付 = **計画作成日**（_future/ では実行予定日に変更可）
- `<topic>` は短く端的に。例: `pc-ledger-day3-action`, `mcp-strategy-v1`

### 5.2 アーカイブ判断基準

以下を **すべて** 満たしたら `_archive/` へ移動:

1. プランに書かれた完了条件がすべて満たされた
2. 関連する commit が origin/main に push 済
3. 後続のプラン（Day N+1 等）が完了 or 着手済（直前のプランを参照する必要がない）
4. または最終更新から **2 週間以上経過**（古さで判断）

### 5.3 _future/ → 現役 への昇格

実行日 7 日前 to 実行日当日に:
```bash
git mv docs/plans/_future/<file>.md docs/plans/<file>.md
```

その際、最終確認 + 必要に応じて内容更新（仕様変動への追従）。

### 5.4 .backup.\*Z ファイル（散在 backup）

- `apply-approved-changes.mjs` が編集前 backup を `<file>.backup.<ISOTime>Z` 名で生成
- `.gitignore` 対象（git に上らない / ローカル限定）
- `restore-wiped.mjs` が緊急復旧で参照する **ので残す価値あり**
- 数が増えすぎた場合（>30 個）は古い順に手動削除推奨。**直近 5 個程度残せば十分**
- 2026-04-25 時点: docs/plans/ の 4 個を E-3 タスクで削除（古いため）

---

## 6. 関連ドキュメント

- [`AGENTS.md` §52 / §51](../../AGENTS.md) — 自律 Tier / 並列禁止
- [`docs/approved-changes/`](../approved-changes/) — proposal/apply 履歴
- [`docs/cursor-cli-usage.md`](../cursor-cli-usage.md) — CLI 利用ガイド（E-1 で作成）
- [`docs/reports/`](../reports/) — 月次セキュリティ巡回・週次サマリ等

---

## 7. 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-04-25 (Sat) 08:20 | E-3 タスクで初版作成。Day 1+2 plan を _archive/ 移動。docs/plans/ 直下の 4 個 .backup.\*Z 削除。ナビゲーション + 運用ルール明文化。 |
| 2026-04-25 (Sat) 10:50 | J-シリーズで Tier C 4 件追加 (C-9 lib 抽出 / C-10 github MCP / C-11 sec-rounds 前倒し / C-12 週次サマリ cron)。stub plan 3 ファイル新規作成。 |
