# サブテーブル内ドロップダウン / チェックボックス — REST 選択肢キー（R13）

> **承認**: 浜田 GO 2026-06-11（夕反省 R13）  
> **起因**: Space 48 ポータル 712 seed で ASCII 短 code（`bi` / `app`）→ **CB_VA01**

---

## ルール

1. **kintone REST** でサブテーブル行を PUT/POST するとき、ドロップダウン・チェックボックスの `value` は **画面上の選択肢キー（日本語ラベル）** を使う。
2. seed JSON や内部コードでは **短い ASCII code** を使ってよいが、**REST 直前**に必ずマップする（**R14** 参照）。
3. 新規アプリ・新フィールドでは **事前プローブ**（preview API で `options` を GET）してキーを確認してから seed する。

---

## 手順チェックリスト

| # | 作業 |
|---|------|
| 1 | `fields.json` / preview で DD/CB の `options` を確認 |
| 2 | seed データは短 code 可 → **マップ関数 1 箇所**で日本語キーへ |
| 3 | サブテーブル PUT は **行内の全サブフィールド**を埋める |
| 4 | CB_VA01 が出たら → キーが ASCII の可能性を最初に疑う |

---

## 参照実装

| 案件 | マップの場所 |
|------|----------------|
| ポータル 712 | `scripts/lib/space48-portal-kintone.mjs` — `PORTAL_TAB_KINTONE` / `PORTAL_LINK_TYPE_KINTONE` |
| 在庫履歴 674 等 | 各案件の fields.json + seed スクリプト（日本語キー） |

---

## サブテーブル列の追加・変更（R16 連携）

既存サブテーブルへの **列の段階追加**は API で拒否されることが多い。

1. 先に **DELETE サブテーブルフィールド**（またはアプリ再設計）
2. **全列を含む** `properties` を **revision 付き**で一括 POST
3. `space48-portal-add-fields.mjs` ヘッダも参照

---

## 関連

- `docs/approved-changes/2026-06-11-rules-r13-r18-hamada-go.md`
- `docs/reports/2026-06-11-evening-reflection.md` F1
