# VPN アカウント管理 — 完成サマリー（2026-06-17 確定）

**判定**: Space 48 本番で **一覧・新規・編集・削除・利用者印刷・ライセンス集計** まで浜田目視 OK。**v1 完成 — クローズ**。

**仕様正本**: `docs/plans/2026-06-16-vpn-account-kintone-spec.md`

---

## 1. アプリ構成（733 / 734）

| ID | 名称 | 役割 | BUILD / rev（最終） |
|----|------|------|---------------------|
| 733 | VPNアカウント管理台帳用DB（@kensetsutoso.fre） | 正本（1 アカウント = 1 レコード + 設定 1 件） | `2026-06-16-vpn-account-db-block-ui-mutations` **rev 5** |
| 734 | VPNアカウント管理台帳（@kensetsutoso.fre） | 日常 UI（733 へ REST） | `2026-06-16-vpn-account-dash-license-all-depts` **rev 12** |

**URL**: [733](https://jbis-kintone.cybozu.com/k/733/) / [734](https://jbis-kintone.cybozu.com/k/734/) — Space 48 / thread 52

---

## 2. データ・移行

| 項目 | 内容 |
|------|------|
| アカウント | **66 件**（user 番号型 63 + 手動 ID 3） |
| 設定レコード | **1 件**（`next_user_num = 80`） |
| 移行 | `npm run vpn-account:migrate:xlsx -- --apply` |
| 次の VPN ID | **`user080@kensetsutoso.fre`** |
| Excel | §9.4 — 浜田 PC で **削除可**（kintone が正本） |

---

## 3. 機能（v1）

| 機能 | 内容 |
|------|------|
| 一覧 | 694 型・登録日降順・15px 基準の大きめ文字 |
| 検索 | アカウント名 / VPN ID / 所属 / 備考 — **クリア**ボタン付き |
| 新規 | 自動採番 `user080〜`・手動 ID チェックボックス・`jbis`+5桁 PW |
| 編集 | VPN ID 読取専用・PW 手動変更可 |
| 削除 | 確認ダイアログ・ID 再利用不可 |
| 印刷 | A4 利用者渡し用・注意書き付き |
| 集計 | 550 円/口・**アコーディオン**（初期閉）・所属 **34 件すべて表示（0 口含む）** |

---

## 4. リポジトリ

| 種別 | パス |
|------|------|
| SPEC | `docs/plans/2026-06-16-vpn-account-kintone-spec.md` |
| DB customize | `customize/vpn-account-db/desktop.js` |
| Dash ソース | `customize/vpn-account-dash/desktop.src.js` → bundle |
| 移行 | `scripts/vpn-account-migrate-xlsx.mjs` |
| 所属マスタ | `scripts/data/vpn-account-depts.json` |
| App IDs | `scripts/data/vpn-account-app-ids.json` |

---

## 5. 再開条件

- 浜田 **GO** + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除
- v2 候補（スコープ外）: PC 台帳連携・廃止履歴保持 等
