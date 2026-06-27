---
name: kintone-doc-lane
description: >-
  ドキュメント制作レーン（DOCX/PPTX/PDF）。月次セキュリティレポート・v5 マニュアル・
  資格 PPTX 等。kintone customize/deploy とは分離。
---

# doc-lane（ドキュメント制作レーン）

## いつ使うか

- Word / PPTX / PDF の **社内資料**作成・更新
- 月次情報セキュリティレポート
- v5 マニュアルパッチ
- 資格取得ロードマップ PPTX

**kintone customize / deploy とは別レーン** — 混同しない。

## 起動前

```powershell
npm run health-check
npm run cio:doc-lane-gate
npm run cio:mcp:env:extended
```

markdownify が SKIP のときは python フォールバックで続行し、チャットに 1 行記録:

`[doc-lane] markdownify SKIP → python フォールバック`

## ツール選択

| 形式 | 第一選択 | フォールバック |
|------|----------|----------------|
| DOCX 生成 | `scripts/build-monthly-security-report.py` 等 | — |
| DOCX/PDF 読取 | **markdownify MCP** | `python-docx` / `pypdf` |
| PPTX 編集 | `docs/runbooks/pptx-patch-windows.md` | MCP `user-office-powerpoint` |

**PPTX 新規・図解・グラフ** → `.cursor/skills/office-pptx-doc-lane/SKILL.md`（フェーズ1）

## npm コマンド

| コマンド | 用途 |
|----------|------|
| `npm run doc-lane:security-report` | 月次情報セキュリティレポート |
| `npm run doc-lane:security-report:test` | 書式単体テスト |
| `npm run doc-lane:patch-v5-a3` | v5 マニュアル A-3 パッチ |
| `npm run verify:doc-lane-pptx-phase1` | PPTX フェーズ1 インフラ検証 |

## 正本 runbook

| 用途 | パス |
|------|------|
| doc-lane 概要 | `docs/runbooks/doc-lane.md` |
| 月次セキュリティ | `docs/runbooks/monthly-security-report.md` |
| DOCX パッチ | `docs/runbooks/docx-patch-windows.md` |
| PPTX パッチ | `docs/runbooks/pptx-patch-windows.md` |
| 資格 PPTX | `docs/runbooks/qualification-roadmap-pptx.md` |
| C:\tmp 作業領域 | `docs/runbooks/c-tmp-workspace-lifecycle.md` |

## 完了記録

浜田目視 OK 後:

```bash
npm run cio:task-complete-seal -- --lane doc-lane --scope "月次セキュリティレポート 2026-05 OK"
```

## 禁止

- doc-lane 作業中に **kintone deploy** を混在（レーン分離）
- `C:\tmp\` 正本をリポにコミットしない（再現スクリプトを `scripts/` に置く）
- markdownify 未接続を理由に **読取をスキップ**（python フォールバック必須）
