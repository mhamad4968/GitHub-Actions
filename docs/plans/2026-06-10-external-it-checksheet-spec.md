# 外部 IT サービス導入チェックシート — kintone 仕様書（SPEC）

> **起票**: 2026-06-10 (水)  
> **状態**: **実装完了** — **目視 OK**（浜田 2026-06-10）  
> **Space**: [Space 48](https://jbis-kintone.cybozu.com/k/#/space/48) / thread **52**  
> **移行元 Excel**: `C:\tmp\外部ＩＴサービス導入チェックシート\外部ＩＴサービス導入チェックシート.xlsx`  
> **機械分析**: `docs/plans/tmp-external-it-checksheet-structure.json`

---

## §0. 構成

| 役割 | appId | 名称 |
|------|-------|------|
| **DB** | **708** | 外部ITサービス導入チェック用DB |
| **ダッシュ** | **709** | 外部ITサービス導入チェックシート |

| 構成 | 役割 |
|------|------|
| **708 DB** | 1 チェック = 1 レコード + サブテーブル 3 行 |
| **709 ダッシュ** | 一覧 + チェック表モーダル + **印刷** |
| **DB 標準 UI** | 保存・削除 **全面禁止**（708 型） |

---

## §1. 確定事項（浜田 2026-06-10）

| # | 項目 | 決定 |
|---|------|------|
| Q4 | 入力者 | **システム推進室のみ** |
| Q5 | 削除 | **誤登録のみ**（確認ダイアログ） |
| Q6 | 印刷 | **v1 必須** — モーダル内「印刷」→ 別ウィンドウ `window.print()` |
| Q7 | 初回データ | **0 件**（Excel 移行なし） |
| UX | 一覧 | 確認日・確認者・サービス名・ツール名・導入目的 |
| UX | 名称 | サービス名 / ツール名 **どちらか必須** |
| UX | 操作 | **「チェック表を見る」** → シート風モーダル |

---

## §2. 一覧（709）

| 列 | フィールド |
|----|------------|
| 確認日 | `check_date` |
| 確認者 | `checker` |
| サービス名 | `service_name` |
| ツール名 | `tool_name` |
| 導入の目的 | `purpose`（省略表示） |
| 操作 | チェック表を見る / 削除 |

---

## §3. チェック表モーダル

- ヘッダ 5 項目 + ●セキュリティ確認項目 ①②③
- 各項目: 大項目 / ※確認方法 / 設問 / 結果（〇・×・該当なし）/ 備考
- **印刷**: チェック表内容を印刷用 HTML で別ウィンドウ表示

---

## §4. 実装参照

- 状態: `scripts/data/external-it-checksheet-app-ids.json`
- customize: `customize/external-it-checksheet-db/desktop.js` / `external-it-checksheet-dash/desktop.js`
- deploy: `npm run deploy:708` / `npm run deploy:709`
- BUILD: 708=`2026-06-10-external-it-checksheet-db-block-ui` / 709=`2026-06-10-external-it-checksheet-dash-print-a4-v2` rev **5**
