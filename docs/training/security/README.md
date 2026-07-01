# 情報セキュリティ勉強会 資料（年度別）

**正本運用（R-SEC-01・2026-07-01 浜田承認）**

| 用途 | 正本 | 生成 |
|------|------|------|
| **配布・読む用** | Word（`.docx`） | `python scripts/security-training/build-word-2026.py` |
| **支店訪問・投影用** | PowerPoint 12ページ | `python scripts/security-training/build-pptx-12slides.py` |

## 出力先

`docs/training/security/output/`（gitignore 対象のバイナリはここへ）

- `情報セキュリティ勉強会テキスト_YYYY.docx`
- `情報セキュリティ勉強会テキスト_YYYY.pptx`

## 依存

```powershell
pip install python-pptx python-docx
```

## 仕様

- `spec-2026.md` — 2026年度要件（連絡先・クイズ・動画 URL 等）
- 個人携帯番号は資料に載せない（**システム推進室へ連絡**のみ — R-DOC-01）

## 2026年度メモ

- 実施期間: 2026/7/15–12/15（各支店訪問）
- テキスト 20分 + 動画 20分
- クイズ: Microsoft Forms（スライド外）
- PPT 12p 構成: P01 表紙 … P11 初動 … P12 動画
