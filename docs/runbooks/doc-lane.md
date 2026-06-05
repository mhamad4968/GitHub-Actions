# doc-lane（ドキュメント制作レーン）

> **制定**: 2026-06-05（夕反省 **R6 GO**）

## 対象

- Word / PPTX / PDF 由来の **社内資料**（kintone customize/deploy **外**）
- 正本は `C:\tmp\` または `scripts/` — リポ commit で再現可能にする

## 起動前

```powershell
npm run health-check
npm run cio:mcp:env:extended   # markdownify = SKIP 可（Windows・TSB-029）
```

## ツール選択（R6）

| 形式 | 第一選択 | フォールバック |
|------|----------|----------------|
| DOCX 生成 | `scripts/build-monthly-security-report.py` 等 **python-docx** | — |
| DOCX/PDF **読取** | **markdownify MCP**（IDE 接続時） | `python-docx` / `pypdf` |
| PPTX 編集 | `docs/runbooks/pptx-patch-windows.md` | MCP `user-office-powerpoint` |

**markdownify が SKIP / 未接続** のときは python フォールバックで続行し、チャットに 1 行記録: `[doc-lane] markdownify SKIP → python フォールバック`

## npm コマンド

| コマンド | 用途 |
|----------|------|
| `npm run doc-lane:security-report` | 月次情報セキュリティレポート |
| `npm run doc-lane:security-report:test` | 書式単体テスト（R5） |
| `npm run doc-lane:patch-v5-a3` | v5 マニュアル A-3 パッチ |
| `npm run doc-lane:verify-v5-ch3-refs` | v5 参照検証 |

## 関連 runbook

- `docs/runbooks/monthly-security-report.md`
- `docs/runbooks/docx-patch-windows.md`
- `docs/runbooks/pptx-patch-windows.md`
