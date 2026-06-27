---
name: office-docx-doc-lane
description: >-
  Word 資料作成（office-word MCP）。見出し・表・画像挿入。月次セキュリティレポートは
  builder 先行 + MCP 追加図解。figma generate_diagram は複雑図用。kintone deploy 分離。
---

# office-docx doc-lane

## いつ使うか

- 依頼に **Word / DOCX / セキュリティレポート / 経営会議 / 図解 / グラフ** が含まれる
- 新規 Word または MCP での画像・表追加

**使わない**:

- 月次レポート **定型**（本文・matplotlib グラフ 5 枚）のみ → 先に `doc-lane:security-report`
- kintone customize/deploy
- v5 精密パッチのみ → `docx-patch-windows.md`

## 着手前（必須）

```powershell
npm run verify:doc-lane-governance
npm run verify:doc-lane-word-phase2
npm run health-check
npm run cio:tool:route -- --intent "<依頼要約>" --log
```

- verify NG → **中止**
- `office-word` が ⏭ → **Windows Cursor で再開**
- **セキュリティ公式資料** → **DeepSeek 必須**（R-DOC-08）

## 正本

| 用途 | パス |
|------|------|
| **R-DOC 自律運用** | `docs/runbooks/doc-lane-autonomous-governance.md` |
| **経営会議セキュリティ** | `docs/runbooks/keiei-kaigi-security-report.md`（R-DOC-11 / R7） |
| フェーズ2 spec | `docs/plans/2026-06-27-doc-lane-phase2-word-spec.md` |
| MCP runbook | `docs/runbooks/doc-lane-docx-mcp.md` |
| 月次 builder | `docs/runbooks/monthly-security-report.md` |
| 既存 docx パッチ | `docs/runbooks/docx-patch-windows.md` |

## 作業ディレクトリ

```
C:\tmp\資料作成\YYYYMMDD_<件名>\
```

編集前に `*_backup.docx`。**完成 DOCX は Git commit 禁止**。

## セキュリティレポート標準手順

1. `[doc-lane] レーン開始 — DOCX / 月次セキュリティ`
2. **浜田が §1 の話題を提示**（必須）
3. verify → 前月 DOCX copy + backup
4. AI が **§1 本文・図解**を起稿（話題中心）
5. AI が **§2 枠 + 事例表枠**のみ追加（数値・事例はプレースホルダ）
6. （任意）figma / `add_picture` で §1 用図解
7. read-back → 浜田が **§2 数値・事例を入力** → 目視 OK

## 汎用 Word 手順

1. `create_document`（新規）またはテンプレ copy + backup
2. `add_heading` / `add_paragraph` / `add_table`
3. 図解:
   - **PNG グラフ** → `add_picture`（width 5.5 目安）
   - **複雑フロー** → figma `generate_diagram` → PNG → `add_picture`
4. read-back
5. 浜田目視 OK

## MCP サーバー

| server | UI 名 | 主ツール |
|--------|-------|----------|
| `user-office-word` | **`office-word`** | create_document, add_heading, add_paragraph, add_table, add_picture, get_document_text |
| `user-figma` | generate_diagram（任意） |

descriptor 必読（`mcps/user-office-word/tools/`）。

## 禁止

- doc-lane 中の **kintone deploy**
- 機密 DOCX の **リポ commit**
- 段落 `.text` 直接代入
- バックアップなし上書き

## 完了

```bash
npm run cio:task-complete-seal -- --lane doc-lane --scope "<件名> DOCX 浜田 OK"
```
