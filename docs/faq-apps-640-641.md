# 640（社内FAQDB）と 641（FAQ カテゴリマスタ）— 混同禁止・連携の正本

## 役割の違い（最重要）

| アプリ ID | 論理名 | 用途 |
|-----------|--------|------|
| **640** | **社内FAQDB** | **FAQ ポータル**（`faq-portal-full.html`）＋ **`faq-kintone-proxy`** が読み書きする **FAQ 本文・meta・公開フラグ** の置き場。`.env` の **`KINTONE_FAQ_APP_ID=640`**。 |
| **641** | **FAQ カテゴリマスタ**（経理 FAQ の階層用） | **カテゴリの親／子／孫**を行として管理。**640 のルックアップ `category_lookup` が参照するのは 641**（関連キーは 641 のレコード番号）。**ポータルは 641 を直接叩かない**。 |

**631 / 632 / 637（セキュリティニュース等）とは別物。** **640 を 641 と取り違えないこと。**

**640（社内FAQDB）**: deploy 未接続・月次 portfolio 外。**live-schema NG（641 の `category_name`）は許容**。deploy 接続時は `relatedAppFieldsFrom: ["641"]` を registry に追加すること。

## 640 での連携フィールド

- **`category_lookup`**（数値・ルックアップ）… 参照先アプリ **641**、関連キー **レコード番号**。`fieldMappings` が空でもよいが、その場合 **画面・REST で `category`（1行テキスト）が自動では埋まらない**。
- **`customize/640/desktop.js`** … ルックアップ変更時・編集／新規表示時に、641 の **`category_name`** を取得して **`category`** にコピーする（ポータルの `cat` と揃える）。

## 641 のカスタマイズ

- **`customize/641/desktop.js`** … `level_type`（親／子／孫）に応じた必須チェックと、保存時の **`category_name`** 自動組み立て（`親` / `親 > 子` / `親 > 子 > 孫`）。

## デプロイ

```bash
npm run deploy:640
npm run deploy:641
```

GitHub Actions の **`kintone-customize-deploy`** に **640 / 641** を含める場合、Secrets に **`KINTONE_API_TOKEN_640`** / **`KINTONE_API_TOKEN_641`** を入れるか、**`KINTONE_API_TOKEN`** フォールバックで両アプリに権限があるトークンを使う。

## フィールド正本

**`kintone-apps.md`** の「社内FAQDB」「641（FAQ カテゴリマスタ）」節と、`npm run app:fields -- 640` / `641` の出力。

---

*640・641 のフィールド一覧は 2026-04-05 時点の本番フォームに基づく。*
