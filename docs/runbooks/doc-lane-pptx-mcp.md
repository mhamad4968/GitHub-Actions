# doc-lane — PowerPoint MCP 資料作成 runbook

> **制定**: 2026-06-27（フェーズ1）  
> **仕様正本**: `docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md`  
> **Skill**: `.cursor/skills/office-pptx-doc-lane/SKILL.md`  
> **既存 PPTX パッチ**: `docs/runbooks/pptx-patch-windows.md`（python-pptx）

### MCP 名称（R-DOC-12）

| 見える場所 | 名称 |
|------------|------|
| **Cursor 設定 / mcp.json** | `office-powerpoint` |
| **AI エージェント呼び出し** | `user-office-powerpoint` |
| **descriptor** | `mcps/user-office-powerpoint/tools/*.json` |

Word も同型（`office-word` / `user-office-word`）— `doc-lane-docx-mcp.md` 参照。

---

## 1. いつ使うか

- **新規** PowerPoint 資料（説明スライド・図解・グラフ・簡易フロー）
- MCP **`office-powerpoint`** でオブジェクト配置（内部は `user-office-powerpoint`）

**使わない**:

- 既存 PPTX の段落差替のみ → `pptx-patch-windows.md`（python-pptx）
- Word マニュアル → `docx-patch-windows.md`

---

## 2. 着手前チェック（必須）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run verify:doc-lane-pptx-phase1
npm run health-check
npm run cio:tool:route -- --intent "PowerPoint フロー図 資料作成" --log
```

| 結果 | 対応 |
|------|------|
| verify NG | インフラ不足 — **作業中止**、チャットに NG 理由 |
| health-check で office-powerpoint ⏭ | **Windows Cursor で再開** |
| route が doc-lane 以外 | 意図文を修正 or 浜田に確認 |

**作業フォルダ**:

```
C:\tmp\資料作成\
  YYYYMMDD_<件名>\
    <件名>.pptx
    <件名>_backup.pptx   ← 編集前
    exports\             ← Figma PNG 等
```

存在しない場合は mkdir（`data/c-tmp-workspace-registry.json` `ensureBeforeUse`）。

---

## 3. MCP ツール選択

| やりたいこと | ツール | 備考 |
|--------------|--------|------|
| 新規ファイル | `create_presentation` | 新規 ID。上書きしない |
| テンプレから | `create_presentation_from_templates` | `C:\tmp\資料作成\templates\` |
| スライド追加 | `add_slide` | layout 指定可 |
| タイトル・本文 | `manage_text` / `populate_placeholder` | |
| 箇条書き | `add_bullet_points` | |
| 図形（ボックス） | `add_shape` | `shape_type` + インチ座標 |
| 矢印・フロー線 | `add_connector` | straight / elbow / curved |
| グラフ | `add_chart` | categories + series_values |
| 表 | `add_table` | |
| 画像貼付 | `manage_image` | Figma  export PNG 等 |
| 検証 | `get_slide_info` / `extract_slide_text` | read-back |
| 複雑フロー | **figma** `generate_diagram` | → PNG → manage_image |

**descriptor 必読**: 各 MCP 呼び出し前に `mcps/user-office-powerpoint/tools/*.json` を確認。

---

## 4. 簡易フロー図の座標目安（16:9）

3 ボックス縦フロー（インチ）:

| 要素 | left | top | width | height |
|------|------|-----|-------|--------|
| ボックス1 | 4.5 | 1.2 | 4.0 | 0.9 |
| ボックス2 | 4.5 | 3.0 | 4.0 | 0.9 |
| ボックス3 | 4.5 | 4.8 | 4.0 | 0.9 |
| 矢印1→2 | — | connector start (6.5, 2.1) → end (6.5, 3.0) | | |
| 矢印2→3 | — | connector start (6.5, 3.9) → end (6.5, 4.8) | | |

`shape_type` は MCP サーバーが受け付ける MSO 名（例: `RECTANGLE`, `ROUNDED_RECTANGLE`）— 初回は `get_server_info` で確認。

---

## 5. 棒グラフ例（Title Only レイアウト）

**重要**: `create_presentation` 既定は **幅 10 in × 高 7.5 in**（`get_slide_info` で確認）。16:9 想定の 13.333 in 座標は**はみ出す**。

```
add_chart(
  slide_index=2,
  chart_type="column",
  left=0.5, top=1.75, width=9.0, height=5.2,
  ...
)
```

**はみ出し防止**: 保存前に `Presentation.slide_width` を確認。既定 10 in なら `left + width ≤ 9.5`、`top + height ≤ 7.0`。Title Only では `top ≥ 1.7`。

---

## 6. Figma 経由（複雑図）

1. `generate_diagram`（Mermaid flowchart）
2. FigJam から PNG エクスポート → `C:\tmp\資料作成\...\exports\`
3. `manage_image` でスライドに配置

**注意**: Figma は OAuth / planKey が必要な場合あり — 失敗時は §4 の簡易図形にフォールバック。

---

## 7. 完了前検証

1. `extract_slide_text` — タイトル・本文が期待通りか
2. `get_slide_info` — 図形数・配置
3. PowerPoint で目視（浜田 OK）
4. チャット報告末尾:

```
【浜田確認】C:\tmp\資料作成\<path> を PowerPoint で開き、レイアウト・文言・図解を目視してください。OK なら 1 行で返信。
```

---

## 8. 失敗例

| 症状 | 原因 | 対策 |
|------|------|------|
| MCP 無応答 | Win 未起動 / venv 死 | health-check、Cursor 再起動 |
| 図形が見えない | 座標 off-slide | §4 目安、get_slide_info |
| 文字化け | フォント未指定 | manage_fonts / 社内標準フォント |
| 上書き | 同一ファイル再 create | 新規 ID + backup |

---

## 9. 関連

| ファイル | 用途 |
|----------|------|
| `docs/runbooks/doc-lane.md` | doc-lane 全体 |
| `templates/doc-lane/README.md` | テンプレ配置 |
| `docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md` | フェーズ1 spec |
