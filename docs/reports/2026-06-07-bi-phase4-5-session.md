# 業務改善 ver.02 — Phase 4b–5 実装セッション報告

**日付**: 2026-06-07（JST）  
**スペース**: 5（本番）  
**浜田確認**: 業務改善提案・アイデア提案・支店長判断 — **すべて OK**

---

## 1. デプロイ BUILD（live）

| App | 名称 | BUILD | revision |
|-----|------|-------|----------|
| 697 | 設定マスタ | （フィールドのみ） | — |
| 698 | 社員マスタ | （595 同期） | — |
| 699 | ご利用ガイド | `2026-06-07-bi-guide-v5g` | 16 |
| 700 | 提案申請 ver.02 | `2026-06-07-bi-proposal-apply-v33` | 118 |

台帳: `data/cio-live-builds.json`

---

## 2. 申請UI（Phase 4b）

### 2.1 機能

- カスタム申請フォーム（5ブロック + 上段3項目 + 提案者一覧 + 添付）
- WF 経路チップ表示（設定マスタ 697 から評価者解決）
- **REST API 申請** — 保存成功後 `sessionStorage bi-apply-done` → ガイド(699)へ遷移
- 一時保存 — 明示的 `pushApplyDraftToForm()` のみ kintone 標準レコードへ反映

### 2.2 applyDraft（v33）

**問題**: 入力のたび `setRec()` → kintone 標準フォームが dirty → 申請後の `beforeunload` 警告。

**対策**:

- `ui.applyDraftRec` — 入力は draft clone のみ更新
- `patchRec()` / 社員検索 / 添付 — `setRec` 禁止
- `startApplySave()` — バリデーション通過後 `armNavigateAway()` → REST 保存 → WF → 遷移

**確認**: 業務改善提案・アイデア提案とも申請→ガイド遷移で警告なし（浜田）。

---

## 3. 評価UI（Phase 5）

### 3.1 evalDraft（v30）

評価入力は `evUi.evalDraft` に保持。kintone 標準フォームを dirty にしない。

### 3.2 表彰ランクと WF 経路（test_v3）

| 種別 | 合計点 | A | B | C |
|------|--------|---|---|---|
| 業務改善 | 20点 | 部長→支店長→**人事**→完了 | 部長→支店長→完了 | 部長→完了 |
| アイデア | 10点（総合審査のみ） | 同上 | 同上 | 同上 |

- 完了遷移時のみ **表彰ランク（最終）** 必須（v28）
- A評価が人事をスキップする問題 → test_v3 WF + `resolveEvalForwardAction()` で解消（v26–v27）

### 3.3 支店長へ判断を委ねる（branch_delegate）

- 部長評価フェーズのみ表示（Q-FLD-02）
- live kintone で DROP_DOWN 誤変換あり → v32 で型検出 + 空配列送信禁止
- **浜田確認: 想定通り OK**

---

## 4. ご利用ガイド（699）現状

- 申請編 / 評価編 / FAQ ナビ骨格
- 申請した一覧・未評価一覧（評価者のみ）
- 申請完了バナー（`bi-apply-done`）
- **本文・スクショ・背景デザイン — 未着手（今夜〜）**

---

## 5. 次スケジュール（浜田合意）

| 日程 | 内容 |
|------|------|
| **6/7 夜** | 申請編ガイド本文 + 699/700 背景デザイン |
| **6/8** | 評価者編 |
| **6/9** | よくあるFAQ（Q-GUIDE-06/08） |

---

## 6. 関連ファイル

- `customize/business-improvement-proposal/desktop.js`
- `customize/business-improvement-guide/desktop.js`
- `scripts/data/business-improvement-wf-test-master.json`
- `scripts/data/business-improvement-proposal-fields.json`
- `docs/plans/2026-05-23-business-improvement-proposal-spec.md` §11
