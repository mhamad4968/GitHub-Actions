# トータルネットワーク ネットワーク管理 — 完成サマリー（2026-06-21 確定）

**判定**: Space 48 本番で **一覧表・IP マトリックス・次 IP 提案・印刷・Excel 出力** まで浜田 **OK**。**v1 完成 — クローズ**。

**仕様正本**: `docs/plans/2026-06-21-total-network-kintone-spec.md`

---

## 1. アプリ構成（737 / 738）

| ID | 名称 | 役割 | BUILD / rev（最終） |
|----|------|------|---------------------|
| 737 | トータルネットワークネットワーク管理DB | 正本（拠点 + 使用中 IP + 用途マスタ） | `2026-06-21-total-network-db-block` **rev 5** |
| 738 | トータルネットワークネットワーク管理台帳 | 日常 UI（737 へ REST） | `2026-06-21-total-network-dash-v1-auto-ip-count` **rev 8** |

**URL**: [737](https://jbis-kintone.cybozu.com/k/737/) / [738](https://jbis-kintone.cybozu.com/k/738/) — Space 48 / thread 52

---

## 2. データ・移行

| 項目 | 内容 |
|------|------|
| 拠点 | **22 件**（接続 12 / 未接続 10） |
| 使用中 IP | **26 件**（マトリックス用途ラベルあり分のみ DB 登録） |
| 用途マスタ | **5 件** seed + 設定タブで追加可 |
| 移行 | `npm run total-network:migrate:xlsx -- --apply` |
| 検証 | `npm run total-network:migrate:verify`（diff 0） |
| 正本 | **kintone のみ**（移行元 Excel は `C:\tmp\…` 参照用。削除は浜田任意） |

---

## 3. 機能（v1）

| 機能 | 内容 |
|------|------|
| 一覧表 | 接続拠点 12 件デフォルト・拠点/接続フィルタ・列 **接続方式**（IPアドレス固定） |
| IP マトリックス | `sort_no` 順（千葉→水戸）・使用中のみ DB・空きは画面計算 |
| 次 IP 提案 | 未登録の最小 IP → 割当モーダル → REST POST |
| IP 割当解除 | マトリックスから DELETE |
| IP 数 | **範囲から自動計算**（手入力なし） |
| 印刷 | 一覧 A4 横 / マトリックス拠点指定 |
| Excel 出力 | 一覧表 + IPマトリックス 2 シート |
| 設定 | 用途マスタ（部署全員） |
| DB 標準 UI | 保存・削除ブロック（台帳のみ操作） |

---

## 4. リポジトリ

| 種別 | パス |
|------|------|
| SPEC | `docs/plans/2026-06-21-total-network-kintone-spec.md` |
| DB customize | `customize/total-network-db/desktop.js` |
| Dash ソース | `customize/total-network-dash/desktop.src.js` + SheetJS bundle |
| 移行 | `scripts/total-network-migrate-xlsx.mjs` |
| IP 数同期 | `scripts/total-network-sync-ip-count-from-xlsx.mjs` |
| App IDs | `scripts/data/total-network-app-ids.json` |
| フィールド台帳 | `data/kintone-field-registry.json`（737 / 738） |

---

## 5. 再開条件

- 浜田 **GO** + checkpoint 更新 + `data/cio-project-closures.json` 解除
- v2 候補: PC 台帳 674 連携・社内ネットワーク管理台帳連携・DHCP/ルータ API 等（SPEC §1.3）
