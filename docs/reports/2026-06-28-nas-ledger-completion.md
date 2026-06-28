# NAS管理台帳 kintone 化 — 完成報告

> **日付**: 2026-06-28 (日) JST  
> **案件**: Space 48 NAS管理台帳（748/749）  
> **正本仕様**: `docs/plans/2026-06-28-nas-ledger-kintone-spec.md`

---

## 1. 成果サマリー

| 項目 | 内容 |
|------|------|
| **NAS管理台帳DB** | App **748** — 23 フィールド・23 件移行済 |
| **NAS管理台帳** | App **749** — BUILD **`2026-06-28-nas-ledger-dash-v1`** rev **14** |
| **配置** | Space 48 / **thread 52**（API 都合。仕様「スレッドなし」意図は Space 直下運用） |
| **移行** | Excel 20 件 + 設備なし 3 件 = **23 件** |
| **浜田確認** | **目視 OK**（2026-06-28 セッション内） |

### URL

- DB: https://jbis-kintone.cybozu.com/k/748/
- 台帳: https://jbis-kintone.cybozu.com/k/749/

---

## 2. GO 後の追加・修正（仕様追記分）

| 日時 | 内容 |
|------|------|
| 初回 deploy | 742/734 型一覧・CRUD・印刷・xlsx・組織ブロック並び |
| UI 調整 | 組織名/拠点名列幅（BNP 長名称対応） |
| 設備なし 3 行 | 状態 **「－」**（全角）・設置先 **「-」**（半角 DB 値・一覧は **「－」** 表示） |
| 空欄表示 | 一覧の空欄・半角 `-` を **「－」** に統一 |
| 購入項目 | **購入日** / **購入先**（大塚商会・富士フィルム・KDDI・その他＋フリー入力） |
| BUILD | 中間 BUILD 名を廃止し **`2026-06-28-nas-ledger-dash-v1`** に統一 |

---

## 3. 残タスク（スコープ外・浜田手動）

| # | 内容 |
|---|------|
| 1 | Excel `C:\tmp\NAS管理台帳\NAS一覧.xlsx` 削除（`docs/runbooks/excel-abandon-two-stage.md`） |
| 2 | Space 48 ポータル 712 へのリンク追加 |

---

## 4. 運用コマンド

```bash
npm run deploy:748          # DB customize
npm run deploy:749          # 台帳（bundle 同梱）
npm run nas-ledger:migrate:xlsx -- --dry-run   # 移行 dry-run
npm run cio:preflight:748 / cio:preflight:749  # deploy 前
```

---

## 5. 主要ファイル

| 種別 | パス |
|------|------|
| 仕様 | `docs/plans/2026-06-28-nas-ledger-kintone-spec.md` |
| App ID | `scripts/data/nas-ledger-app-ids.json` |
| フィールド | `scripts/data/nas-ledger-db-fields.json` |
| 組織並び | `scripts/data/nas-org-sort-master.json` |
| ライブラリ | `scripts/lib/nas-ledger-kintone.mjs` |
| 台帳 UI | `customize/nas-ledger-dash/desktop.src.js` |
| DB UI | `customize/nas-ledger-db/desktop.js` |
