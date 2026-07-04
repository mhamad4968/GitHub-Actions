# 実行予算書 736 — Step2-3 差分サマリー印刷（v2d）

**日付**: 2026-07-04 JST  
**浜田 GO**: 意見交換 Q1〜Q5 確定 → AI チーム合議 → 仕様追記・実装  
**親 SPEC**: [`2026-06-20-jikkou-yosan-version-management-spec.md`](2026-06-20-jikkou-yosan-version-management-spec.md) §8.6  
**前提**: v2c-print Step1/2 完了（6/24 受け入れ）

---

## 1. 確定仕様（浜田 2026-07-04）

| # | 論点 | 決定 |
|---|------|------|
| Q1 | 載せ方 | 差分付き印刷の **先頭 1 ページ**「差分サマリー」 |
| Q2 | 対象 | **総括表・詳細表の両方** |
| Q3 | 粒度 | **簡潔 / 詳細** を UI で切替（既定=簡潔） |
| Q4 | 比較 | **直前版 / 当初版** 両対応（画面と同期） |
| Q5 | 変更なし | 先頭 1 ページに **「変更はありません」** ＋ 比較対象版 → 本体続行 |

### Q3 詳細

| モード | 内容 |
|--------|------|
| **簡潔** | ①⑧⑨ ＋ ブロック合計（②③等）の増減 ＋ テーブル別 **件数**（追加/変更/削除 N 行） |
| **詳細** | 画面「差分一覧」パネル相当（行ラベル列挙あり） |

### UI

```
印刷:     ○通常  ○差分付き
サマリー: ○簡潔  ○詳細     ← 差分付き時のみ有効（name 共通で desync 防止）
```

---

## 2. 実装方針（AI チーム合議 2026-07-04）

| 項目 | 内容 |
|------|------|
| データ | `buildDiffSummary(diffResult)` を画面・印刷で共用 |
| HTML | `formatDiffSummaryBodyHtml(summary, level)` 新設 |
| 印刷 | `renderPrintDiffSummaryPage()` — メタ表なし・比較版＋差分リストのみ |
| CSS | `.jy-pr-diff-summary-page { page-break-after: always }` |
| BUILD | `2026-07-04-736-diff-print-summary-v2d` |

---

## 3. 受け入れ（版2・材料 +7,600）

1. 差分付き・**簡潔** — サマリー 1 ページ → 総括/詳細本体
2. 差分付き・**詳細** — 行ラベル列挙あり
3. **当初版**比較 — サマリー再計算
4. 変更なし — 「変更はありません」ページ → 本体
5. deploy 前 `docs/runbooks/jikkou-yosan-diff-smoke.md`

---

## 4. 関連

- 差分印刷 Step1/2: [`2026-06-24-jikkou-yosan-diff-print-session-memo.md`](2026-06-24-jikkou-yosan-diff-print-session-memo.md)
- 版管理 §8.6: v2c-print 完了 → **v2d 着手**
