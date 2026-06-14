# 社内 Wi-Fi SSID 管理 — 完成サマリー（2026-06-14 確定）

**判定**: Space 21 本番で **一覧・編集・A4 印刷（QR 付き）** まで浜田目視 OK。**v1 完成 — クローズ**。

**仕様正本**: `docs/plans/2026-06-14-wifi-ssid-kintone-spec.md`

---

## 1. アプリ構成（718 / 719）

| ID | 名称 | 役割 | BUILD / rev（最終） |
|----|------|------|---------------------|
| 718 | 社内Wi-Fi管理DB | 正本（1 拠点 = 1 レコード） | `2026-06-14-wifi-ssid-db-block-ui-mutations` **rev 5** |
| 719 | 社内Wi-Fi管理台帳 ver.1 | 日常 UI（718 へ REST） | `2026-06-14-wifi-ssid-dash-company-jbis` **rev 7** |

**URL**: [718](https://jbis-kintone.cybozu.com/k/718/) / [719](https://jbis-kintone.cybozu.com/k/719/) — Space 21 / thread 23

---

## 2. データ・移行

| 項目 | 内容 |
|------|------|
| レコード数 | **22 拠点**（Excel 21 ブロック → 東北/仙台分割） |
| 移行 | `npm run wifi-ssid:migrate:xlsx -- --apply` |
| 登録日 | **`2026-02-05`**（Excel 表記日固定） |
| Excel 廃止 | **完全削除済**（2026-06-14 浜田報告）— kintone のみ正本 |

---

## 3. 機能（v1）

| 機能 | 内容 |
|------|------|
| 一覧 | 694 型・`sort_no` 昇順・拠点名検索・PW クリックコピー |
| 編集 | **kintone システム管理者のみ**（719 → REST → 718） |
| 印刷 | 拠点 1 件 = A4・**Wi-Fi QR 同梱生成**（qrcode ライブラリ bundle） |
| 印刷ヘッダ | **(株）J-BISメンテナンス** → **拠点名** → **Wi-Fi 接続情報** |
| 設備なし | 水戸・鎌ヶ谷 — 一覧のみ・印刷ボタンなし |

---

## 4. リポジトリ

| 種別 | パス |
|------|------|
| SPEC | `docs/plans/2026-06-14-wifi-ssid-kintone-spec.md` |
| DB customize | `customize/wifi-ssid-db/desktop.js` |
| Dash ソース | `customize/wifi-ssid-dash/desktop.src.js` + `qrcode-vendor.js` → bundle |
| 移行 | `scripts/wifi-ssid-migrate-xlsx.mjs` |
| App IDs | `scripts/data/wifi-ssid-app-ids.json` |
| フィールド台帳 | `data/kintone-field-registry.json`（718 / 719） |

---

## 5. 再開条件

- 浜田 **GO** + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除
- v2 候補（スコープ外）: PC 台帳連携・来訪者ゲスト Wi-Fi 自動発行 等
