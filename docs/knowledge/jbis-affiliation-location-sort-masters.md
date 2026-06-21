# JBIS 所属・拠点並び — 正本一覧（R68）

**制定**: 2026-06-21（浜田 GO）  
**運用**: AI チームは本ページの JSON を正とする。**毎回の確認は不要**（JSON 改定時のみ浜田承認）。

---

## 拠点並び（22 拠点）

| 項目 | 内容 |
|------|------|
| **正本** | `scripts/data/jbis-location-sort-master.json` |
| **キー** | `sort_no` + `location_name` |
| **利用例** | トータルネットワーク 737/738、Wi-Fi 台帳、680 所属候補順の参考 |

```bash
# 参照のみ（編集は浜田 GO 後）
cat scripts/data/jbis-location-sort-master.json
```

---

## 所属並び — ブロック（本社9 + 支店営業所20）

| 項目 | 内容 |
|------|------|
| **正本** | `scripts/data/business-improvement-annual-department-order.json` |
| **ブロック** | `headOffice`（9）→ `branchesAndOffices`（20）→ 未登録は末尾 |
| **利用例** | 業務改善年次 xlsx、所属列ソート |

---

## 所属並び — フラット34（UI ドロップダウン・集計）

| 項目 | 内容 |
|------|------|
| **正本** | `scripts/data/vpn-account-depts.json` |
| **件数** | 34 所属（役員室〜湾岸工事所 + BNP 等） |
| **利用例** | VPN 台帳 734、メール台帳 696 の部署プルダウン／datalist 並び |

**複合名**（例: `東京支店-千葉営業所`）は親拠点（`東京支店`）の直後に並べる（`scripts/lib/jbis-display-sort.mjs`）。

---

## 実装ヘルパ

| 環境 | パス |
|------|------|
| Node スクリプト | `scripts/lib/jbis-display-sort.mjs` |
| ブラウザ customize | 正本 JSON を `BUILD` 更新時に埋め込み、または同一ソート関数をコピー |

---

## 改定手順

1. 浜田が JSON を更新 or 更新 GO  
2. 参照アプリの SPEC § + `kintone-apps.md` BUILD を同期  
3. 本ページの `version` / 変更履歴 1 行
