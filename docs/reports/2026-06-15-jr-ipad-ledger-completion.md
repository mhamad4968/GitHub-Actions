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
