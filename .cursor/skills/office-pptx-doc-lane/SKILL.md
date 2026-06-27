---
name: office-pptx-doc-lane
description: >-
  PowerPoint 資料作成（office-powerpoint MCP）。図形・コネクタ・グラフ・
  簡易フロー図。figma generate_diagram は複雑図用。kintone deploy とは分離。
---

# office-pptx doc-lane

## いつ使うか

- 依頼に **PowerPoint / PPTX / スライド / 資料 / フロー図 / 図解 / グラフ** が含まれる
- 新規資料または MCP でのオブジェクト配置

**使わない**: kintone customize/deploy、既存 pptx の python 段落差替のみ（→ `pptx-patch-windows.md`）

## 着手前（必須）

```powershell
npm run verify:doc-lane-pptx-phase1
npm run health-check
npm run cio:tool:route -- --intent "<依頼要約>" --log
```

- `verify:doc-lane-pptx-phase1` が NG → **中止**
- `office-powerpoint` が ⏭ → **Windows Cursor で再開**

## 正本

| 用途 | パス |
|------|------|
| フェーズ1 spec | `docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md` |
| MCP runbook | `docs/runbooks/doc-lane-pptx-mcp.md` |
| 既存 pptx パッチ | `docs/runbooks/pptx-patch-windows.md` |
| doc-lane 全体 | `docs/runbooks/doc-lane.md` |

## 作業ディレクトリ

```
C:\tmp\資料作成\YYYYMMDD_<件名>\
```

編集前に `*_backup.pptx`。**完成 pptx は Git commit 禁止**。

## 標準手順

1. `create_presentation`（新規）またはテンプレから作成
2. `add_slide` / `manage_text` / `add_bullet_points`
3. 図解:
   - **簡易** → `add_shape` + `add_connector`（座標は runbook §4）
   - **グラフ** → `add_chart`
   - **複雑** → figma `generate_diagram` → PNG → `manage_image`
4. `extract_slide_text` / `get_slide_info` で read-back
5. 浜田目視 OK

## MCP サーバー

| server | 主ツール |
|--------|----------|
| `user-office-powerpoint` | create_presentation, add_shape, add_connector, add_chart, manage_image |
| `user-figma` | generate_diagram（任意） |

呼び出し前に **descriptor 必読**（`mcps/user-office-powerpoint/tools/`）。

## 禁止

- doc-lane 中の **kintone deploy**
- 機密 PPTX の **リポ commit**
- バックアップなしの既存ファイル上書き
- read-back 失敗後の再保存

## 完了

```bash
npm run cio:task-complete-seal -- --lane doc-lane --scope "<件名> PPTX 浜田 OK"
```
