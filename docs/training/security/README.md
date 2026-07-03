# 情報セキュリティ勉強会 資料（年度別）

**正本運用（R-SEC-01・2026-07-01 浜田承認 / 2026-07-04 masters 拡張）**

## 毎年の正本（masters — Git 管理）

| 用途 | 正本 | 同期 |
|------|------|------|
| **投影 PPT（完成版）** | `masters/YYYY-security-training-master.pptx` | `npm run security-training:sync-masters` |
| **配布 Word** | `masters/YYYY-security-training-distribution.docx` | 同上 |
| **仕様** | `spec-YYYY.md` | 新年度は `spec-template.md` から複製 |

**2026 年度**: `masters/2026-security-training-master.pptx`（**15p**・浜田 GO 2026-07-04）

詳細: `masters/README.md` / `docs/runbooks/security-training-annual.md`

## 作業用・配布コピー（output — gitignore）

`docs/training/security/output/` — 支店配布用の複製・試作

## レガシー生成（骨格のみ）

| コマンド | 用途 |
|----------|------|
| `python scripts/security-training/build-word-2026.py` | Word 骨格（master 優先） |
| `python scripts/security-training/build-pptx-12slides.py` | 12p 骨格（**新規は master 改変を推奨**） |

## 依存

```powershell
pip install python-pptx python-docx
```

## 憲法

- 個人携帯番号は資料に載せない（**システム推進室へ連絡**のみ — R-DOC-01）
- PPTX 着手前: `npm run cio:pre-implement-gate`（D2 盲点）

## 2026 年度メモ

- 実施期間: 2026/7/15–12/15
- テキスト 20分 + 動画 20分
- クイズ: Microsoft Forms（スライド外）
- **PPT 15p**（S01 表紙 … S15 さいごに）— `spec-2026.md` / `masters/*-outline.md`
