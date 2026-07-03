# 情報セキュリティ勉強会 — 年度正本（masters）

**毎年更新する正式版**をここに置く。生成物の試作・コピーは `output/`（gitignore）。

| ファイル | 用途 |
|----------|------|
| `YYYY-security-training-master.pptx` | **支店訪問・投影用**（浜田承認済み完成版） |
| `YYYY-security-training-distribution.docx` | **配布・講師台本**（Word 全文） |
| `YYYY-security-training-master.meta.json` | スライド数・バイト数・同期元パス |
| `YYYY-security-training-master-outline.md` | PPTX から自動抽出した見出し（差分確認用） |

## 2026 年度（浜田 GO 2026-07-04）

- **PPTX 正本**: `2026-security-training-master.pptx`（15 スライド・メディア 25）
- **元ファイル名**: `2026年度　情報セキュリティ勉強会テキスト修正.pptx`
- **Word 配布**: `2026-security-training-distribution.docx`
- **仕様**: `../spec-2026.md`
- **年次 Runbook**: `../../runbooks/security-training-annual.md`

## 同期（C:\\tmp → リポ masters）

浜田が `C:\tmp\情報セキュリティ勉強会テキスト` で完成版を確定したあと:

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run security-training:sync-masters
npm run verify:security-training-masters
```

- ルート直下の **最新 `.pptx`** を master にコピー
- `OLD\*2026*.docx` があれば distribution にコピー
- outline / meta を再生成

## Git

- **`masters/` の正本 PPTX/DOCX はコミット対象**（毎年の再現用）
- **`output/` の複製は gitignore**（支店配布用コピー等）
