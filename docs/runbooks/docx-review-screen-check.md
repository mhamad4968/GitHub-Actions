# DOCX／Office 資料レビュー — 画面突合（#D-DOCX-01）

**制定**: 2026-07-26（夕反省 GO）

## 必須

- 粗 XML／zip 抽出だけで「数字付き会社名」「制御文字」「隠し段落」を指摘しない。
- 指摘前に **Word 画面**または **段落単位の可視テキスト抽出**と突合する。
- 抽出結果と画面が食い違うときは **画面を正**とし、抽出側の誤検知として撤回する。

## 関連

- `docs/runbooks/requester-doc-review-one-at-a-time.md`
- `docs/runbooks/docx-patch-windows.md`（編集手順。本ファイルはレビュー品質）
