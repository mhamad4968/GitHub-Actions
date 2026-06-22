# 複合機管理台帳 — 完成サマリー（2026-06-22 確定）

**判定**: Space 48 本番で **一覧・モーダル CRUD・検索・一覧印刷・拠点指定印刷・xlsx 出力** まで浜田目視 OK。**v1 完成 — CLOSED**。

**仕様正本**: `docs/plans/2026-06-22-mfp-ledger-kintone-spec.md`

---

## 1. アプリ構成（741 / 742）

| ID | 名称 | 役割 | BUILD / rev（最終） |
|----|------|------|---------------------|
| 741 | 複合機管理台帳DB | 正本（1 複合機 = 1 レコード） | `2026-06-22-mfp-ledger-db-block-ui` **rev 5** |
| 742 | 複合機管理台帳 | 日常 UI（741 へ REST） | `2026-06-22-mfp-ledger-dash-v1` **rev 4** |

**URL**: [741](https://jbis-kintone.cybozu.com/k/741/) / [742](https://jbis-kintone.cybozu.com/k/742/) — Space 48 / thread 52

---

## 2. データ・移行

| 項目 | 内容 |
|------|------|
| レコード数 | **36 台** |
| 移行 | `npm run mfp-ledger:migrate:xlsx -- --apply` |
| 拠点マスタ | 680 に「子会社（株）ブリッジニアプラス」追加 |
| Excel 廃止 | Q14 — kintone **741/742 が正本**（共有 Excel は削除可） |

---

## 3. 機能（v1）

| 機能 | 内容 |
|------|------|
| 一覧 | 719/734 型・R68 拠点順（ブリッジニアプラス最下部） |
| CRUD | 742 モーダル → REST → 741 |
| 検索 | キーワード + 拠点絞込 |
| 一覧印刷 | 全項目（**PW 除外**） |
| 拠点指定印刷 | 業者向け・**全項目（PW 含む）** |
| xlsx | SheetJS bundle・734 型 |
| DB 741 | save/delete 全面ブロック（718 型） |

---

## 4. deploy コマンド

```bash
npm run cio:preflight:741 -- --note "…"
npm run deploy:741
npm run cio:preflight:742 -- --note "…"
npm run deploy:742   # 内部で mfp-ledger:bundle-dash
```

---

## 5. 浜田確認（2026-06-22）

- 742 台帳 UI・36 件データ・CRUD・検索・印刷・xlsx — **OK**
