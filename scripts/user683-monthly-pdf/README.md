# 683 ユーザサポート — 月次 PDF（2 ページ＝両面1枚想定）

**正本レイアウト**: `docs/plans/2026-05-15-user683-monthly-pdf-layout-spec.md`

提出用 PDF は **編集デザイン**（ヒーロー帯・図表カード・テキストカード）で出力します。**表面**は **大きめの棒グラフ2つ（縦積み）→月次要約→週次（第1〜4週）**、**裏面**は **日別の対応案件一覧（サマリー）のみ**。**印刷は両面1枚（A4）**を前提とします。**業務システム画面の再現や製品名の本文掲出はしません**。

## セットアップ

```bash
cd scripts/user683-monthly-pdf
python -m venv .venv
# Windows
.venv\Scripts\pip install -r requirements.txt
# macOS/Linux
# .venv/bin/pip install -r requirements.txt
```

## 実行

リポルートから（`.env` に kintone 認証があること）:

```bash
python scripts/user683-monthly-pdf/generate_monthly_pdf.py --year 2026 --month 5 --out C:\tmp\user-support-2026-05.pdf
```

レイアウトのみ確認（kintone 不要）:

```bash
python scripts/user683-monthly-pdf/generate_monthly_pdf.py --demo --out C:\tmp\user-support-demo.pdf
```

## npm ラッパ

```bash
npm run user683:monthly-pdf -- --year 2026 --month 5 --out C:\tmp\user-support-2026-05.pdf
npm run user683:monthly-pdf:demo
```

`user683:monthly-pdf:demo` の出力先は **`C:\tmp\user683-monthly-demo.pdf`**（`C:\tmp` が無い場合は事前に作成）。

## 683 一覧からの取得（廃止）

**2026-05-17 CEO**: **`npm run user683:monthly-pdf:serve`**（HTTP ローカル配信）は **廃止**。683 の月次印刷は **`window.print()`**（Runbook: **`docs/runbooks/user683-weekly-summary-and-print.md`**）。`scripts/user683-monthly-pdf-serve.mjs` は履歴参照用に残置。

**`npm run user683:local-servers`**: **Claude 中継のみ**（PDF 配信ウィンドウは起動しない）。
