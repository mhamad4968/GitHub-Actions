# 2026-06-21 — AI 失敗とルール更新案（浜田 GO 済）

> **スコープ**: `docs/runbooks/evening-reflection-scope.md`（AI 失敗 + **ミス削減**アップデート案のみ）

---

## AI の失敗

| # | 失敗 | 同日対応 |
|---|------|----------|
| F1 | **696 共有メール改善**（個人種別・部署 datalist・検索パネル）を **deploy 後すぐ commit せず**、セッション跨ぎで「未反映？」の確認が発生 | 本夕締めで一括 commit / push |
| F2 | `cio:preflight:696` が **`--note` 必須**で初回 deploy 失敗（exit 2） | 手動 `--note` 付与で再実行 → **R64** |
| F3 | Windows **`verify:kintone-live-schema` 後 UV_HANDLE_CLOSING** → deploy は **`SKIP_CIO_LIVE_SCHEMA_GUARD=1` 依存**（R53 継続） | 本日 696 deploy も同回避 |
| F4 | 作業ツリーに **RULES-INDEX / 予実 SPEC / handoff** の無関係 diff が混在し、commit 範囲が不明瞭 | 夕締めで復元・本件のみステージ → **R67** |
| F5 | **`feature/calculate-tax`** が 3 月 CLOSED PR のまま **3 ヶ月放置**（main と大乖離） | アーカイブ tag 後に remote branch 削除 → **R65** |

---

## ルール更新案 — **浜田 GO 済（2026-06-21）**

| ID | 概要 | 実装 |
|----|------|------|
| **R63** | deploy SUCCESS → 同一セッション内 commit | `20-SESSION-REPORT-CHECKLIST.txt` |
| **R64** | preflight `--note` usage 明示 | `cio-preflight-stamp.mjs` |
| **R65** | stale branch 断捨離 runbook | `docs/runbooks/github-stale-branch-cleanup.md` |
| **R66** | 小規模 dash 検索パネルテンプレ | `docs/knowledge/small-dash-search-panel-pattern.md` |
| **R67** | RULES-INDEX dirty warn | `verify-session-close-git-warn.mjs` |
| **R68** | 所属・拠点並び正本（**再確認不要**） | `docs/knowledge/jbis-affiliation-location-sort-masters.md` |

正本: `docs/approved-changes/2026-06-21-rules-r63-r68-hamada-go.md`

**意図的に書かないもの**: 明日の第1手・736 スケジュール（→ 項番 -0）

---

## GitHub 断捨離（本日実施）

| 対象 | 処置 |
|------|------|
| `feature/calculate-tax`（remote/local） | tag **`archive/feature-calculate-tax-20260329`** で保全後 **branch 削除** |
| CLOSED PR #1（消費税 8%） | 参照のみ。branch 削除でクローズ状態を整理 |
| main 以外の branch | 削除後 **main のみ** |
