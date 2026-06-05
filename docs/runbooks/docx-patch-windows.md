# Word DOCX 編集 runbook（Windows）

> **制定**: 2026-06-05（夕反省 **R2/R5 GO**）  
> **関連**: `docs/runbooks/pptx-patch-windows.md`（PPTX）、`docs/runbooks/monthly-security-report.md`

## 適用

- 経営会議資料・社内レポート等の **DOCX** を python-docx で生成・更新するとき
- テンプレ: **ＭＳ ゴシック / ＭＳ 明朝**（4月情報セキュリティレポート準拠）

## 禁止

| 禁止 | 理由 |
|------|------|
| `paragraph.text = "..."` | run 書式（フォント・サイズ・太字）が **すべて消失** |
| prefix 判定前の `text.strip()` | 先頭 `　 ・` が消え **太字判定ミス**（R5） |

## 必須

1. **`scripts/lib/docx_template_format.py`** の `set_paragraph_text` / `apply_document_formats` を使う
2. 表セルは `set_cell_text`（ヘッダ 10pt ゴシック、対処表本文 10pt 明朝）
3. 生成後 **`python scripts/test_docx_template_format.py`**（R5 単体テスト）

## 書式早見（4月テンプレ）

| 要素 | フォント | サイズ | 備考 |
|------|----------|--------|------|
| タイトル | ゴシック | 16pt | 中央・太字 |
| 日付・部署 | ゴシック | 10.5pt | 右揃え |
| １.周知 / ２.検知 | ゴシック | 16pt | 太字 |
| ●見出し | ゴシック | 10.5pt | 太字 |
| 本文・出典 | ゴシック | 10.5pt | — |
| §2 監視・行 | ゴシック | 10.5pt | 太字 |
| 以上 | ゴシック | 10.5pt | 右揃え |

## 失敗例

| 失敗 | 対策 |
|------|------|
| 4月テンプレと字体不一致 | `.text` 禁止 → lib 経由 |
| ウイルス行だけ太字にならない | `raw.startswith("　 ・")`（strip 前） |
