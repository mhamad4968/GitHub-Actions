# 2026-06-21 — AI 失敗とルール更新案（承認待ち）

> **スコープ**: `docs/runbooks/evening-reflection-scope.md`（AI 失敗 + **ミス削減**アップデート案のみ）

---

## AI の失敗

| # | 失敗 | 同日対応 |
|---|------|----------|
| F1 | **696 共有メール改善**（個人種別・部署 datalist・検索パネル）を **deploy 後すぐ commit せず**、セッション跨ぎで「未反映？」の確認が発生 | 本夕締めで一括 commit / push |
| F2 | `cio:preflight:696` が **`--note` 必須**で初回 deploy 失敗（exit 2） | 手動 `--note` 付与で再実行。package.json へのヒント未整備 |
| F3 | Windows **`verify:kintone-live-schema` 後 UV_HANDLE_CLOSING** → deploy は **`SKIP_CIO_LIVE_SCHEMA_GUARD=1` 依存**（R53 継続） | 本日 696 deploy も同回避 |
| F4 | 作業ツリーに **RULES-INDEX / 予実 SPEC / handoff** の無関係 diff が混在し、commit 範囲が不明瞭 | 夕締めで復元・本件のみステージ |
| F5 | **`feature/calculate-tax`** が 3 月 CLOSED PR のまま **3 ヶ月放置**（main と大乖離） | アーカイブ tag 後に remote branch 削除 |

---

## ルール更新案 — **承認待ち（浜田）**

| ID | 概要 | 提案内容 |
|----|------|----------|
| **R63** | **kintone customize deploy → 即 commit** | `deploy:*` SUCCESS 後、**同一セッション内**に `customize/` + `kintone-apps.md` + 関連 spec を commit（夕締め一括禁止）。checklist: `20-SESSION-REPORT` / `session-close` |
| **R64** | **preflight npm スクリプトに note プレースホルダ** | `cio:preflight:<app>` 実行時、`--note` 未指定なら usage 例を stderr 表示（または `npm run cio:preflight:696 -- --note "…"` を AGENTS §35-7 に明記） |
| **R65** | **stale branch 断捨離 runbook** | CLOSED PR + main から **90日未更新** → `archive/<branch>-<date>` tag を push 後に branch 削除。FAQ/税計算は `archive/feature-calculate-tax-20260329` に保全済 |
| **R66** | **696 検索パターンの横展開テンプレ** | 小規模 dash（全件クライアント読込）向けに、674 から **チップ + datalist + URL 復元**の最小セットを `docs/knowledge/` に 1 ページ化（コピペ実装のばらつき防止） |
| **R67** | **RULES-INDEX 自動生成の dirty 検知** | `rules:sync-section-mdc` 実行前後で日付・§50-3-11 行が **意図せず巻き戻る**場合、session-close で warn（F4 再発防止） |

**意図的に書かないもの**: 明日の第1手・736 スケジュール（→ 項番 -0）

---

## GitHub 断捨離（本日実施）

| 対象 | 処置 |
|------|------|
| `feature/calculate-tax`（remote/local） | tag **`archive/feature-calculate-tax-20260329`** で保全後 **branch 削除** |
| CLOSED PR #1（消費税 8%） | 参照のみ。branch 削除でクローズ状態を整理 |
| main 以外の branch | 削除後 **main のみ** |
