# JRシステム用 iPad 管理台帳 — 完成サマリー（2026-06-15 確定）

**判定**: Space 34 本番で **一覧・2 系統採番・集計・A4 印刷・絞込** まで浜田目視 OK。**v1 完成 — CLOSED**。

**仕様正本**: `docs/plans/2026-06-15-jr-ipad-ledger-kintone-spec.md`

---

## 1. アプリ構成（720 / 721）

| ID | 名称 | 役割 | BUILD / rev（最終） |
|----|------|------|---------------------|
| 720 | JRシステム用iPad台帳DB | 正本（1 端末 = 1 レコード） | `2026-06-15-jr-ipad-db-block-ui-mutations` **rev 5** |
| 721 | JRシステム用iPad管理台帳 ver.1 | 日常 UI（720 へ REST） | `2026-06-15-jr-ipad-dash-search-clear` **rev 8** |

**URL**: [720](https://jbis-kintone.cybozu.com/k/720/) / [721](https://jbis-kintone.cybozu.com/k/721/) — Space 34 / thread 38

---

## 2. データ・移行

| 項目 | 内容 |
|------|------|
| レコード数 | **64 台**（Excel 一括移行） |
| 移行 | `npm run jr-ipad:migrate:xlsx -- --apply` |
| Excel 廃止 | **運用終了**（2026-06-15 クローズ時点で kintone のみ正本） |

---

## 3. 機能（v1）

| 機能 | 内容 |
|------|------|
| 一覧 | 694 型・全 12 列・部署→端末名ソート |
| 採番 | **2 系統**（`JBIS###` + `jb###m@icloud.com`）・新規は待機 |
| 絞込 | テキスト検索 + ステータス + 管理部署 + **クリアボタン** |
| 集計 | 管理部署 × ステータス（**アコーディオン・初期閉じ**） |
| 編集 | **kintone システム管理者のみ**（721 → REST → 720） |
| 印刷 | 端末 1 台 = A4「JRシステム用 iPad アカウント情報」 |
| モデル | コンボボックス + NFKC 正規化 |

---

## 4. 目視 OK 後の UX 調整（721）

| 順 | 内容 | BUILD |
|----|------|-------|
| 1 | 集計表をアコーディオン（初期閉じ） | `2026-06-15-jr-ipad-dash-summary-accordion` rev 5 |
| 2 | 全体文字サイズ拡大 | `2026-06-15-jr-ipad-dash-larger-type` rev 7 |
| 3 | 検索・絞込クリアボタン | `2026-06-15-jr-ipad-dash-search-clear` rev 8 |

---

## 5. リポジトリ

| 種別 | パス |
|------|------|
| SPEC | `docs/plans/2026-06-15-jr-ipad-ledger-kintone-spec.md` |
| DB customize | `customize/jr-ipad-db/desktop.js` |
| Dash ソース | `customize/jr-ipad-dash/desktop.src.js` → bundle |
| 移行 | `scripts/jr-ipad-migrate-xlsx.mjs` |
| App IDs | `scripts/data/jr-ipad-app-ids.json` |
| フィールド定義 | `scripts/data/jr-ipad-db-fields.json` |

---

## 6. 再開条件

- 浜田 **GO** + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除
- v2 候補（スコープ外）: Apple ID 694 連携・PC 台帳 674 連携・集計セルクリック絞込 等

---

## R61 addendum — 2026-08-23 P0/P1 UX（目視待ち）

| 項目 | 内容 |
|------|------|
| SPEC | `docs/plans/2026-08-23-jr-ipad-721-p0-p1-ux-spec.md` |
| レーン | `jr-ipad-ledger` → **reopened**（P0/P1 のみ。720 schema / 採番 / 連携 / P2 は非目的） |
| live 721 | BUILD=`2026-08-23-jr-ipad-dash-p0-p1-ux` **rev 16** / fileKey `c5ecc74d-cdbd-4fdc-8313-85990fc2dbbf` |
| 変更要約 | いまの条件＋該当件数／一覧印刷「該当 N 台」／ステータスチップ／一覧 Excel（画面同集合・Apple PW 含む・SheetJS bundle） |
| 次 | **浜田目視** → OK なら reclosed ＋ P2 等は別検討 |
| 目視結果 | **2026-08-23 浜田 OK** → `jr-ipad-ledger` **reclosed**。P2 は個別採否待ち |

---

## R61 addendum — 2026-08-23 P2-1 + A/B + V1–7（目視 OK・reclosed）

| 項目 | 内容 |
|------|------|
| SPEC | `docs/plans/2026-08-23-jr-ipad-721-p2-vux-spec.md` |
| live 721 | BUILD=`2026-08-23-jr-ipad-dash-p2-vux` **rev 17** / fileKey `35a408cf-880d-4886-9cda-fe5de4efacb5` |
| 変更要約 | 集計セル絞込・集計解除・端末名/Apple ID コピー・ステータス色・部署区切り・絞込2段・メタ「登録N台」・注意行・列幅 |
| 見送り | P2-2、追加機能 C〜I |
| 次 | **浜田目視** → OK なら reclosed |
| 目視結果 | **2026-08-23 浜田 OK** → `jr-ipad-ledger` **reclosed**。追加改善は不要判定（明示GOまで再開しない） |
