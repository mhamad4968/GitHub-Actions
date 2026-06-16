# <プロジェクト名> — kintone 仕様書（SPEC）

> **起票**: YYYY-MM-DD  
> **状態**: **ドラフト — Q&A 中** / **SPEC GO 済** / **v1 完成 — CLOSED**  
> **Q&A 関門**: [`docs/runbooks/kintone-ledger-spec-qa-checklist.md`](../runbooks/kintone-ledger-spec-qa-checklist.md)（R19 — GO 前完走）  
> **テンプレ正本**: 本ファイル（R46 — 新規 SPEC はコピーして使用）  
> **App ID**: DB **___** / Dash **___**  
> **配置**: Space ___ / thread ___

---

## §0. 進め方

1. 浜田 Q&A で項目・運用を確定 → §付録「Q&A 確定表」
2. AI チームレビュー（§50-3-8）→ §15
3. 浜田 **SPEC GO** → 実装 GO（`creation-timing-ask.mdc`）
4. 実装 → 移行 → 目視 OK → CLOSED（[`kintone-ledger-v1-closure-checklist.md`](../runbooks/kintone-ledger-v1-closure-checklist.md)）

**技術方針**（DB + 台帳型）:

| 構成 | 役割 |
|------|------|
| **データアプリ（DB）** | 1 件 = 1 レコードの正本 |
| **ダッシュアプリ（台帳）** | Excel 風一覧・CRUD・印刷 |
| **DB 標準 UI** | 保存・削除 **全面禁止**（customize） |
| **操作入り口** | **台帳のみ** |

---

## §UI. UI 受入基準（実装 GO 前に確定 — R46）

| 項目 | 確定値 |
|------|--------|
| 基準フォント | 例: **15px**（721 型） |
| アコーディオン初期 | **open** / **closed** |
| 所属・カテゴリ表示順 | `scripts/data/<lane>-depts.json` 正本（0 件も表示するか） |
| 画面 BUILD 表示 | **あり** / **なし** |
| 検索 UI | クリアボタン **あり** / **なし** |
| 印刷 | フォントサイズ・パスワード注意書き |

---

## §1. 背景・目的

（記述）

### 1.3 スコープ外（v1）

- （v2 候補を列挙）

---

## §2. 用語

| 用語 | 定義 |
|------|------|

---

## §3. データモデル（DB）

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|

---

## §4. 台帳 UI（Dash）

### 4.1 一覧

### 4.2 CRUD

### 4.3 集計

### 4.4 印刷

---

## §5. 採番・設定レコード

- `record_kind=setting` 設定レコード
- 投入: `npm run <lane>:post-settings`（`scripts/lib/kintone-post-settings-record.mjs`）

---

## §11. 実装フェーズ

| Phase | 内容 |
|-------|------|
| 0 | `npm run cio:pre-implement-gate` + §50-3-8 |
| 1 | DB/Dash 作成 + フィールド deploy |
| 2 | customize + bundle |
| 3 | 移行 + 目視 OK |

---

## §14. 実装時チェック（AI 向け）

| # | 項目 |
|---|------|
| 1 | §50-3-8 |
| 2 | `npm run cio:pre-implement-gate` |
| 3 | deploy 前 `verify:kintone-live-schema` |
| 4 | DB customize: save/delete ブロック |
| 5 | **`APP_DB` は 0 禁止** — bundle 前 sync（R43） |
| 6 | 所属順 JSON と `DEPT_ORDER` 同期 |
| 7 | 完了時 R41 クローズ checklist |

**npm スクリプト**:

| コマンド | 用途 |
|----------|------|
| `npm run <lane>:setup` | DB + Dash + registry |
| `npm run <lane>:bundle-dash` | sync → bundle → lint |
| `npm run <lane>:post-settings` | 設定レコード投入 |
| `npm run deploy:<dbId>` / `deploy:<dashId>` | customize deploy |

---

## §15. AI チーム SPEC レビュー

**結論**: （ドラフト / GO / CLOSED）

---

## 変更履歴

| 日付 | 内容 |
|------|------|
